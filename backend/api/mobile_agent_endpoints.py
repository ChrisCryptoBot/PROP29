"""
Mobile Agent Integration Endpoints
Handles data submission from mobile agent applications.
All data is persisted to the database.
"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Body
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import json
import logging

from sqlalchemy.orm import Session

from database import get_db
from api.auth_dependencies import get_current_user
from models import User
from services.evidence_file_service import evidence_file_service
from services.analytics_engine_service import analytics_engine
from services.mobile_agent_service import MobileAgentService
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/mobile-agents", tags=["Mobile Agent Integration"])


@router.post("/patrol-data")
async def submit_patrol_data(
    agent_id: str = Form(...),
    patrol_id: str = Form(...),
    location_data: str = Form(...),
    observations: str = Form(...),
    photos: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Submit patrol data from mobile agent."""
    try:
        location = json.loads(location_data)
        obs_data = json.loads(observations)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON data: {e}")

    photo_files: List[Dict[str, Any]] = []
    if photos:
        for i, photo in enumerate(photos):
            try:
                evidence_id = f"patrol-{patrol_id}-photo-{i}"
                photo_data = await photo.read()
                file_record = await evidence_file_service.upload_evidence_file(
                    file_data=photo_data,
                    filename=photo.filename or f"patrol_photo_{i}.jpg",
                    evidence_id=evidence_id,
                    uploaded_by=agent_id,
                    case_id=patrol_id,
                )
                photo_files.append({
                    "evidence_id": evidence_id,
                    "file_id": file_record["file_id"],
                    "filename": photo.filename,
                    "file_url": evidence_file_service.get_file_url(file_record["file_id"]),
                    "thumbnail_url": evidence_file_service.get_thumbnail_url(file_record["file_id"]),
                })
            except Exception as e:
                logger.error("Failed to process photo %s: %s", i, e)

    loc_for_db = {
        "latitude": location.get("latitude"),
        "longitude": location.get("longitude"),
        "accuracy": location.get("accuracy"),
        "address": location.get("address"),
    }
    response = MobileAgentService.create_patrol_submission(
        db=db,
        agent_id=agent_id,
        patrol_id=patrol_id,
        location_data=loc_for_db,
        observations=obs_data,
        photo_files=photo_files,
        user_id=str(current_user.user_id),
    )

    if location.get("latitude") is not None and location.get("longitude") is not None:
        MobileAgentService.update_agent_location(
            db=db,
            agent_id=agent_id,
            latitude=float(location["latitude"]),
            longitude=float(location["longitude"]),
            accuracy=location.get("accuracy"),
            altitude=location.get("altitude"),
            speed=location.get("speed"),
            heading=location.get("heading"),
        )

    try:
        await process_patrol_observations(obs_data, location, agent_id)
    except Exception as e:
        logger.error("Failed to process patrol observations: %s", e)

    return {
        "submission_id": response.submission_id,
        "status": response.status,
        "photo_count": response.photo_count,
        "timestamp": response.timestamp.isoformat(),
    }


@router.post("/incident-report")
async def submit_incident_report(
    agent_id: str = Form(...),
    incident_type: str = Form(...),
    severity: str = Form(...),
    description: str = Form(...),
    location_data: str = Form(...),
    evidence_photos: Optional[List[UploadFile]] = File(None),
    evidence_videos: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Submit incident report from mobile agent."""
    try:
        location = json.loads(location_data)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON data: {e}")

    evidence_files: List[Dict[str, Any]] = []
    evidence_inputs: List[tuple] = []
    if evidence_photos:
        evidence_inputs.extend([(f, "photo") for f in evidence_photos])
    if evidence_videos:
        evidence_inputs.extend([(f, "video") for f in evidence_videos])

    incident_id = str(uuid.uuid4())
    for i, (evidence_file, file_type) in enumerate(evidence_inputs):
        try:
            evidence_id = f"incident-{incident_id}-{file_type}-{i}"
            file_data = await evidence_file.read()
            file_record = await evidence_file_service.upload_evidence_file(
                file_data=file_data,
                filename=evidence_file.filename or f"incident_{file_type}_{i}",
                evidence_id=evidence_id,
                uploaded_by=agent_id,
                case_id=incident_id,
            )
            evidence_file_service.create_chain_of_custody_entry(
                evidence_id=evidence_id,
                action="Incident Evidence Collected",
                handler=f"Agent {agent_id}",
                details={"incident_type": incident_type, "severity": severity, "collection_method": "mobile_agent"},
            )
            evidence_files.append({
                "evidence_id": evidence_id,
                "file_id": file_record["file_id"],
                "file_type": file_type,
                "filename": evidence_file.filename,
                "file_url": evidence_file_service.get_file_url(file_record["file_id"]),
                "thumbnail_url": evidence_file_service.get_thumbnail_url(file_record["file_id"]),
            })
        except Exception as e:
            logger.error("Failed to process evidence file %s: %s", i, e)

    loc_for_db = {
        "latitude": location.get("latitude"),
        "longitude": location.get("longitude"),
        "address": location.get("address") or location.get("location"),
        "room": location.get("room"),
    }
    report_response = MobileAgentService.create_incident_report(
        db=db,
        agent_id=agent_id,
        incident_type=incident_type,
        severity=severity,
        description=description,
        location_data=loc_for_db,
        evidence_files=evidence_files,
        user_id=str(current_user.user_id),
    )

    guest_safety_incident_id = None
    try:
        from services.guest_safety_service import GuestSafetyService
        from schemas import GuestSafetyIncidentCreate
        from models import GuestSafetySeverity

        severity_map = {
            "low": GuestSafetySeverity.LOW,
            "medium": GuestSafetySeverity.MEDIUM,
            "high": GuestSafetySeverity.HIGH,
            "critical": GuestSafetySeverity.CRITICAL,
        }
        location_str = location.get("address") or location.get("room") or location.get("location") or "Unknown"
        guest_safety_incident = GuestSafetyIncidentCreate(
            title=incident_type or "Mobile Agent Report",
            description=description,
            location=location_str,
            severity=severity_map.get(severity.lower(), GuestSafetySeverity.MEDIUM),
            status="reported",
            room_number=location.get("room"),
            source="MOBILE_AGENT",
            source_metadata={
                "agent_id": agent_id,
                "agent_name": current_user.username,
                "submission_timestamp": report_response.timestamp.isoformat(),
                "evidence_files": evidence_files,
            },
        )
        guest_safety_response = GuestSafetyService.create_incident(
            guest_safety_incident, user_id=str(current_user.user_id)
        )
        guest_safety_incident_id = str(guest_safety_response.id) if hasattr(guest_safety_response, "id") else None
        logger.info("Mobile agent incident %s linked to guest safety incident", guest_safety_incident_id)

        try:
            from main import manager
            if manager and getattr(manager, "active_connections", None):
                message = {
                    "type": "guest_safety_incident",
                    "incident": {
                        "id": getattr(guest_safety_response, "id", None),
                        "title": getattr(guest_safety_response, "title", None),
                        "description": getattr(guest_safety_response, "description", None),
                        "location": getattr(guest_safety_response, "location", None),
                        "severity": getattr(guest_safety_response.severity, "value", str(guest_safety_response.severity)) if hasattr(guest_safety_response, "severity") else None,
                        "status": getattr(guest_safety_response, "status", None),
                        "reported_at": getattr(guest_safety_response.reported_at, "isoformat", lambda: str(guest_safety_response.reported_at))() if hasattr(guest_safety_response, "reported_at") else None,
                        "source": getattr(guest_safety_response, "source", "MOBILE_AGENT"),
                        "source_metadata": getattr(guest_safety_response, "source_metadata", None),
                    },
                }
                for user_id, connections in manager.active_connections.items():
                    for ws in connections:
                        try:
                            await ws.send_json(message)
                        except Exception as ws_err:
                            logger.warning("Failed to send WebSocket message: %s", ws_err)
        except Exception as ws_error:
            logger.warning("WebSocket broadcast failed: %s", ws_error)
    except Exception as e:
        logger.error("Failed to create guest safety incident from mobile agent report: %s", e)

    if severity in ["high", "critical"]:
        await trigger_incident_alert({"incident_id": incident_id, "incident_type": incident_type, "severity": severity})

    return {
        "incident_id": report_response.incident_id,
        "status": report_response.status,
        "evidence_count": len(evidence_files),
        "follow_up_required": report_response.follow_up_required,
        "timestamp": report_response.timestamp.isoformat(),
    }


@router.post("/location-update")
def update_agent_location(
    agent_id: str,
    location: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, str]:
    """Update agent location for tracking."""
    try:
        lat = location.get("latitude")
        lng = location.get("longitude")
        if lat is None or lng is None:
            raise HTTPException(status_code=400, detail="latitude and longitude required")
        MobileAgentService.update_agent_location(
            db=db,
            agent_id=agent_id,
            latitude=float(lat),
            longitude=float(lng),
            accuracy=location.get("accuracy"),
            altitude=location.get("altitude"),
            speed=location.get("speed"),
            heading=location.get("heading"),
        )
        return {"status": "updated", "agent_id": agent_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Location update failed: %s", e)
        raise HTTPException(status_code=500, detail="Location update failed")


@router.get("/patrol-submissions")
def list_patrol_submissions(
    agent_id: Optional[str] = None,
    patrol_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """List patrol data submissions with optional filtering."""
    items = MobileAgentService.get_patrol_submissions(
        db=db, agent_id=agent_id, patrol_id=patrol_id, limit=limit, offset=offset
    )
    return {"data": [r.model_dump() for r in items]}


@router.get("/incident-reports")
def list_incident_reports(
    agent_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """List incident reports with optional filtering."""
    items = MobileAgentService.get_incident_reports(
        db=db, agent_id=agent_id, severity=severity, status=status, limit=limit, offset=offset
    )
    return {"data": [r.model_dump() for r in items]}


@router.get("/agent-status")
def get_agent_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get status of all mobile agents."""
    items = MobileAgentService.get_all_agent_status(db=db)
    return {"data": [s.model_dump() for s in items]}


@router.get("/agent-locations/{agent_id}")
def get_agent_location_history(
    agent_id: str,
    hours: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get location history for a specific agent."""
    items = MobileAgentService.get_agent_location_history(db=db, agent_id=agent_id, hours=hours)
    return {"data": [loc.model_dump() for loc in items]}


async def process_patrol_observations(
    observations: Dict[str, Any],
    location: Dict[str, Any],
    agent_id: str,
) -> None:
    """Process patrol observations for analytics."""
    try:
        if observations.get("suspicious_activity"):
            motion_event = {
                "id": f"patrol-{uuid.uuid4()}",
                "camera_id": f"mobile-agent-{agent_id}",
                "camera_name": f"Agent {agent_id}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "confidence": 0.9,
                "detection_zone": "Patrol Area",
                "source": "mobile_agent",
                "location": location,
            }
            await analytics_engine.process_motion_event(motion_event)
    except Exception as e:
        logger.error("Failed to process patrol observations: %s", e)


async def trigger_incident_alert(incident: Dict[str, Any]) -> None:
    """Trigger alert for high-severity incidents."""
    try:
        logger.warning(
            "High severity incident reported: %s - %s",
            incident.get("incident_id"),
            incident.get("incident_type"),
        )
    except Exception as e:
        logger.error("Failed to trigger incident alert: %s", e)
