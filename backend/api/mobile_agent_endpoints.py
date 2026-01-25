from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Body
from fastapi.responses import Response
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import uuid
import json

from api.auth_dependencies import get_current_user
from services.evidence_file_service import evidence_file_service
from services.analytics_engine_service import analytics_engine
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mobile-agents", tags=["Mobile Agent Integration"])

# In-memory storage for mobile agent data (in production, use database)
_patrol_submissions: List[Dict[str, Any]] = []
_incident_reports: List[Dict[str, Any]] = []
_location_updates: Dict[str, List[Dict[str, Any]]] = {}  # agent_id -> location_history
_agent_status: Dict[str, Dict[str, Any]] = {}  # agent_id -> status_info

@router.post("/patrol-data")
async def submit_patrol_data(
    agent_id: str = Form(...),
    patrol_id: str = Form(...),
    location_data: str = Form(...),  # JSON string
    observations: str = Form(...),   # JSON string
    photos: Optional[List[UploadFile]] = File(None),
    current_user=Depends(get_current_user)
) -> Dict[str, Any]:
    """Submit patrol data from mobile agent."""
    try:
        # Parse JSON data
        location = json.loads(location_data)
        obs_data = json.loads(observations)
        
        submission_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)
        
        # Create patrol submission record
        submission = {
            "submission_id": submission_id,
            "agent_id": agent_id,
            "patrol_id": patrol_id,
            "timestamp": timestamp.isoformat(),
            "location": location,
            "observations": obs_data,
            "photo_count": len(photos) if photos else 0,
            "photo_files": [],
            "status": "received",
            "processed_at": None
        }
        
        # Process uploaded photos
        if photos:
            for i, photo in enumerate(photos):
                try:
                    # Create evidence ID for this photo
                    evidence_id = f"patrol-{patrol_id}-photo-{i}"
                    
                    # Upload photo as evidence
                    photo_data = await photo.read()
                    file_record = await evidence_file_service.upload_evidence_file(
                        file_data=photo_data,
                        filename=photo.filename or f"patrol_photo_{i}.jpg",
                        evidence_id=evidence_id,
                        uploaded_by=agent_id,
                        case_id=patrol_id
                    )
                    
                    submission["photo_files"].append({
                        "evidence_id": evidence_id,
                        "file_id": file_record["file_id"],
                        "filename": photo.filename,
                        "file_url": evidence_file_service.get_file_url(file_record["file_id"]),
                        "thumbnail_url": evidence_file_service.get_thumbnail_url(file_record["file_id"])
                    })
                    
                except Exception as e:
                    logger.error(f"Failed to process photo {i}: {e}")
                    # Continue processing other photos
        
        # Store submission
        _patrol_submissions.append(submission)
        
        # Update agent location if provided
        if location.get("latitude") and location.get("longitude"):
            await update_agent_location(agent_id, location)
        
        # Process observations for analytics
        await process_patrol_observations(obs_data, location, agent_id)
        
        logger.info(f"Patrol data submitted: {submission_id} from agent {agent_id}")
        
        return {
            "submission_id": submission_id,
            "status": "received",
            "photo_count": len(submission["photo_files"]),
            "timestamp": timestamp.isoformat()
        }
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON data: {e}")
    except Exception as e:
        logger.error(f"Patrol data submission failed: {e}")
        raise HTTPException(status_code=500, detail="Submission failed")


@router.post("/incident-report")
async def submit_incident_report(
    agent_id: str = Form(...),
    incident_type: str = Form(...),
    severity: str = Form(...),
    description: str = Form(...),
    location_data: str = Form(...),  # JSON string
    evidence_photos: Optional[List[UploadFile]] = File(None),
    evidence_videos: Optional[List[UploadFile]] = File(None),
    current_user=Depends(get_current_user)
) -> Dict[str, Any]:
    """Submit incident report from mobile agent."""
    try:
        # Parse location data
        location = json.loads(location_data)
        
        incident_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)
        
        # Create incident report
        incident = {
            "incident_id": incident_id,
            "agent_id": agent_id,
            "incident_type": incident_type,
            "severity": severity,
            "description": description,
            "location": location,
            "timestamp": timestamp.isoformat(),
            "status": "open",
            "evidence_files": [],
            "follow_up_required": severity in ["high", "critical"]
        }
        
        # Process evidence files
        evidence_files = []
        if evidence_photos:
            evidence_files.extend([(f, "photo") for f in evidence_photos])
        if evidence_videos:
            evidence_files.extend([(f, "video") for f in evidence_videos])
        
        for i, (evidence_file, file_type) in enumerate(evidence_files):
            try:
                evidence_id = f"incident-{incident_id}-{file_type}-{i}"
                
                file_data = await evidence_file.read()
                file_record = await evidence_file_service.upload_evidence_file(
                    file_data=file_data,
                    filename=evidence_file.filename or f"incident_{file_type}_{i}",
                    evidence_id=evidence_id,
                    uploaded_by=agent_id,
                    case_id=incident_id
                )
                
                # Create chain of custody entry
                custody_entry = evidence_file_service.create_chain_of_custody_entry(
                    evidence_id=evidence_id,
                    action="Incident Evidence Collected",
                    handler=f"Agent {agent_id}",
                    details={
                        "incident_type": incident_type,
                        "severity": severity,
                        "collection_method": "mobile_agent"
                    }
                )
                
                incident["evidence_files"].append({
                    "evidence_id": evidence_id,
                    "file_id": file_record["file_id"],
                    "file_type": file_type,
                    "filename": evidence_file.filename,
                    "file_url": evidence_file_service.get_file_url(file_record["file_id"]),
                    "thumbnail_url": evidence_file_service.get_thumbnail_url(file_record["file_id"])
                })
                
            except Exception as e:
                logger.error(f"Failed to process evidence file {i}: {e}")
        
        # Store incident report
        _incident_reports.append(incident)
        
        # Trigger alert if high severity
        if severity in ["high", "critical"]:
            await trigger_incident_alert(incident)
        
        logger.info(f"Incident report submitted: {incident_id} by agent {agent_id}")
        
        return {
            "incident_id": incident_id,
            "status": "received",
            "evidence_count": len(incident["evidence_files"]),
            "follow_up_required": incident["follow_up_required"],
            "timestamp": timestamp.isoformat()
        }
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON data: {e}")
    except Exception as e:
        logger.error(f"Incident report submission failed: {e}")
        raise HTTPException(status_code=500, detail="Submission failed")


@router.post("/location-update")
async def update_agent_location(
    agent_id: str,
    location: Dict[str, Any] = Body(...),
    current_user=Depends(get_current_user)
) -> Dict[str, str]:
    """Update agent location for tracking."""
    try:
        timestamp = datetime.now(timezone.utc)
        
        location_update = {
            "agent_id": agent_id,
            "latitude": location.get("latitude"),
            "longitude": location.get("longitude"),
            "accuracy": location.get("accuracy", 0),
            "altitude": location.get("altitude"),
            "speed": location.get("speed"),
            "heading": location.get("heading"),
            "timestamp": timestamp.isoformat()
        }
        
        # Store location update
        if agent_id not in _location_updates:
            _location_updates[agent_id] = []
        
        _location_updates[agent_id].append(location_update)
        
        # Keep only recent locations (last 24 hours)
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        _location_updates[agent_id] = [
            loc for loc in _location_updates[agent_id]
            if datetime.fromisoformat(loc["timestamp"].replace('Z', '+00:00')) > cutoff
        ]
        
        # Update agent status
        _agent_status[agent_id] = {
            "last_seen": timestamp.isoformat(),
            "current_location": location_update,
            "status": "active"
        }
        
        return {"status": "updated", "agent_id": agent_id}
        
    except Exception as e:
        logger.error(f"Location update failed: {e}")
        raise HTTPException(status_code=500, detail="Location update failed")


@router.get("/patrol-submissions")
def list_patrol_submissions(
    agent_id: Optional[str] = None,
    patrol_id: Optional[str] = None,
    limit: int = 50,
    current_user=Depends(get_current_user)
) -> Dict[str, List[Dict[str, Any]]]:
    """List patrol data submissions with optional filtering."""
    submissions = _patrol_submissions.copy()
    
    # Apply filters
    if agent_id:
        submissions = [s for s in submissions if s["agent_id"] == agent_id]
    
    if patrol_id:
        submissions = [s for s in submissions if s["patrol_id"] == patrol_id]
    
    # Sort by timestamp (newest first) and limit
    submissions.sort(key=lambda x: x["timestamp"], reverse=True)
    submissions = submissions[:limit]
    
    return {"data": submissions}


@router.get("/incident-reports")
def list_incident_reports(
    agent_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    current_user=Depends(get_current_user)
) -> Dict[str, List[Dict[str, Any]]]:
    """List incident reports with optional filtering."""
    incidents = _incident_reports.copy()
    
    # Apply filters
    if agent_id:
        incidents = [i for i in incidents if i["agent_id"] == agent_id]
    
    if severity:
        incidents = [i for i in incidents if i["severity"] == severity]
    
    if status:
        incidents = [i for i in incidents if i["status"] == status]
    
    # Sort by timestamp (newest first) and limit
    incidents.sort(key=lambda x: x["timestamp"], reverse=True)
    incidents = incidents[:limit]
    
    return {"data": incidents}


@router.get("/agent-status")
def get_agent_status(
    current_user=Depends(get_current_user)
) -> Dict[str, Dict[str, Any]]:
    """Get status of all mobile agents."""
    return {"data": _agent_status}


@router.get("/agent-locations/{agent_id}")
def get_agent_location_history(
    agent_id: str,
    hours: int = 24,
    current_user=Depends(get_current_user)
) -> Dict[str, List[Dict[str, Any]]]:
    """Get location history for a specific agent."""
    if agent_id not in _location_updates:
        return {"data": []}
    
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    recent_locations = [
        loc for loc in _location_updates[agent_id]
        if datetime.fromisoformat(loc["timestamp"].replace('Z', '+00:00')) > cutoff
    ]
    
    return {"data": recent_locations}


async def process_patrol_observations(
    observations: Dict[str, Any],
    location: Dict[str, Any],
    agent_id: str
) -> None:
    """Process patrol observations for analytics."""
    try:
        # Extract relevant data for analytics
        if observations.get("suspicious_activity"):
            # Create motion event for analytics
            motion_event = {
                "id": f"patrol-{uuid.uuid4()}",
                "camera_id": f"mobile-agent-{agent_id}",
                "camera_name": f"Agent {agent_id}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "confidence": 0.9,
                "detection_zone": "Patrol Area",
                "source": "mobile_agent",
                "location": location
            }
            await analytics_engine.process_motion_event(motion_event)
        
    except Exception as e:
        logger.error(f"Failed to process patrol observations: {e}")


async def trigger_incident_alert(incident: Dict[str, Any]) -> None:
    """Trigger alert for high-severity incidents."""
    try:
        # In production, this would send notifications, alerts, etc.
        logger.warning(f"High severity incident reported: {incident['incident_id']} - {incident['incident_type']}")
        
        # Could integrate with notification systems, dispatch protocols, etc.
        
    except Exception as e:
        logger.error(f"Failed to trigger incident alert: {e}")