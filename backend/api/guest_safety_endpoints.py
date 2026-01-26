from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional, Dict, Any
from schemas import (
    GuestSafetyIncidentCreate,
    GuestSafetyIncidentUpdate,
    GuestSafetyIncidentResponse,
    GuestSafetyTeamResponse,
    GuestSafetySettingsUpdate,
    GuestSafetySettingsResponse,
    GuestMessageCreate,
    GuestMessageResponse,
    GuestMessageUpdate,
)
from typing import Dict, Any
from api.auth_dependencies import get_current_user_optional
from models import User
from services.guest_safety_service import GuestSafetyService
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/guest-safety", tags=["Guest Safety"])


# ============================================
# EVACUATION ENDPOINTS (Simplified Headcount)
# ============================================

@router.get("/evacuation/headcount")
def get_evacuation_headcount(current_user: User | None = Depends(get_current_user_optional)):
    """Get evacuation headcount status"""
    try:
        # Get active evacuation incident
        incidents = GuestSafetyService.get_incidents(user_id=str(current_user.user_id) if current_user else None)
        evacuation_incident = next((inc for inc in incidents if inc.get('type') == 'evacuation' and inc.get('status') != 'resolved'), None)
        
        if not evacuation_incident:
            return {
                "totalGuests": 0,
                "safe": 0,
                "unaccounted": 0,
                "inProgress": 0,
                "lastUpdated": datetime.utcnow().isoformat()
            }
        
        # Get check-ins for this evacuation
        check_ins = GuestSafetyService.get_evacuation_check_ins(evacuation_incident.get('id'))
        safe_count = len([c for c in check_ins if c.get('status') == 'safe'])
        in_progress_count = len([c for c in check_ins if c.get('status') == 'in_progress'])
        
        # This would normally come from a guest count service
        total_guests = 100  # Placeholder - should come from actual guest count
        unaccounted = max(0, total_guests - safe_count - in_progress_count)
        
        return {
            "totalGuests": total_guests,
            "safe": safe_count,
            "unaccounted": unaccounted,
            "inProgress": in_progress_count,
            "lastUpdated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get evacuation headcount: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get evacuation headcount")


@router.get("/evacuation/check-ins")
def get_evacuation_check_ins(current_user: User | None = Depends(get_current_user_optional)):
    """Get all evacuation check-ins"""
    try:
        incidents = GuestSafetyService.get_incidents(user_id=str(current_user.user_id) if current_user else None)
        evacuation_incident = next((inc for inc in incidents if inc.get('type') == 'evacuation' and inc.get('status') != 'resolved'), None)
        
        if not evacuation_incident:
            return []
        
        return GuestSafetyService.get_evacuation_check_ins(evacuation_incident.get('id'))
    except Exception as e:
        logger.error(f"Failed to get evacuation check-ins: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get evacuation check-ins")


@router.post("/evacuation/check-in")
def submit_evacuation_check_in(
    data: Dict[str, Any] = Body(...),
    current_user: User | None = Depends(get_current_user_optional)
):
    """Guest check-in during evacuation (called from guest app)"""
    try:
        guest_id = data.get('guestId')
        status = data.get('status', 'safe')
        location = data.get('location')
        notes = data.get('notes')
        
        if not guest_id:
            raise HTTPException(status_code=400, detail="guestId is required")
        
        # Get active evacuation incident
        incidents = GuestSafetyService.get_incidents(user_id=None)  # Public endpoint
        evacuation_incident = next((inc for inc in incidents if inc.get('type') == 'evacuation' and inc.get('status') != 'resolved'), None)
        
        if not evacuation_incident:
            raise HTTPException(status_code=400, detail="No active evacuation")
        
        check_in = GuestSafetyService.submit_evacuation_check_in(
            incident_id=evacuation_incident.get('id'),
            guest_id=guest_id,
            status=status,
            location=location,
            notes=notes
        )
        
        return check_in
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit evacuation check-in: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to submit check-in")


@router.get("/incidents", response_model=List[GuestSafetyIncidentResponse])
def get_incidents(current_user: User | None = Depends(get_current_user_optional)):
    """Get guest safety incidents"""
    user_id = str(current_user.user_id) if current_user else None
    return GuestSafetyService.get_incidents(user_id=user_id)


@router.post("/incidents", response_model=GuestSafetyIncidentResponse, status_code=201)
async def create_incident(incident: GuestSafetyIncidentCreate, current_user: User | None = Depends(get_current_user_optional)):
    """Create guest safety incident"""
    user_id = str(current_user.user_id) if current_user else None
    incident_response = GuestSafetyService.create_incident(incident, user_id=user_id)
    
    # Broadcast via WebSocket
    try:
        from main import manager
        if manager and manager.active_connections:
            message = {
                "type": "guest_safety_incident",
                "incident": {
                    "id": incident_response.id,
                    "title": incident_response.title,
                    "description": incident_response.description,
                    "location": incident_response.location,
                    "severity": incident_response.severity.value if hasattr(incident_response.severity, 'value') else str(incident_response.severity),
                    "status": incident_response.status,
                    "reported_at": incident_response.reported_at.isoformat() if hasattr(incident_response.reported_at, 'isoformat') else str(incident_response.reported_at),
                    "guest_involved": incident_response.guest_involved,
                    "room_number": incident_response.room_number,
                    "assigned_team": incident_response.assigned_team,
                    "source": getattr(incident_response, 'source', 'MANAGER'),
                    "source_metadata": getattr(incident_response, 'source_metadata', None),
                }
            }
            # Broadcast to all connected users
            for user_id, connections in manager.active_connections.items():
                for ws in connections:
                    try:
                        await ws.send_json(message)
                    except Exception as e:
                        logger.warning(f"Failed to send WebSocket message to {user_id}: {e}")
    except Exception as e:
        logger.warning(f"Failed to broadcast incident via WebSocket: {e}")
    
    return incident_response


@router.put("/incidents/{incident_id}", response_model=GuestSafetyIncidentResponse)
def update_incident(incident_id: str, updates: GuestSafetyIncidentUpdate, current_user: User | None = Depends(get_current_user_optional)):
    """Update guest safety incident"""
    return GuestSafetyService.update_incident(incident_id, updates)


@router.delete("/incidents/{incident_id}")
def delete_incident(incident_id: str, current_user: User | None = Depends(get_current_user_optional)):
    """Delete guest safety incident"""
    GuestSafetyService.delete_incident(incident_id)
    return {"success": True}


@router.put("/incidents/{incident_id}/resolve", response_model=GuestSafetyIncidentResponse)
def resolve_incident(incident_id: str, current_user: User | None = Depends(get_current_user_optional)):
    """Resolve guest safety incident"""
    resolver_id = str(current_user.user_id) if current_user else None
    return GuestSafetyService.resolve_incident(incident_id, resolver_id=resolver_id)


@router.get("/teams", response_model=List[GuestSafetyTeamResponse])
def get_teams(current_user: User | None = Depends(get_current_user_optional)):
    user_id = str(current_user.user_id) if current_user else None
    return GuestSafetyService.get_teams(user_id=user_id)


@router.get("/settings", response_model=GuestSafetySettingsResponse)
def get_settings(current_user: User | None = Depends(get_current_user_optional)):
    user_id = str(current_user.user_id) if current_user else None
    return GuestSafetyService.get_settings(user_id=user_id)


@router.put("/settings", response_model=GuestSafetySettingsResponse)
def update_settings(updates: GuestSafetySettingsUpdate, current_user: User | None = Depends(get_current_user_optional)):
    user_id = str(current_user.user_id) if current_user else None
    return GuestSafetyService.update_settings(updates, user_id=user_id)


# Alerts endpoints (minimal implementation for now)
@router.post("/alerts", status_code=201)
def create_alert(alert: dict, current_user: User | None = Depends(get_current_user_optional)):
    return {"id": "alert-1", **alert}


@router.get("/alerts", response_model=List[dict])
def get_alerts(current_user: User | None = Depends(get_current_user_optional)):
    return []


@router.get("/alerts/active", response_model=List[dict])
def get_active_alerts(current_user: User | None = Depends(get_current_user_optional)):
    return []


@router.post("/respond")
def respond_to_emergency(payload: dict, current_user: User | None = Depends(get_current_user_optional)):
    return {"success": True, **payload}


@router.post("/incidents/{incident_id}/message")
def send_incident_message(incident_id: str, payload: dict, current_user: User | None = Depends(get_current_user_optional)):
    return {"success": True, "incident_id": incident_id, **payload}


@router.post("/notifications")
def send_mass_notification(payload: dict, current_user: User | None = Depends(get_current_user_optional)):
    return {"success": True, **payload}


# ============================================
# EXTERNAL INGESTION ENDPOINTS
# ============================================

@router.post("/incidents/ingest/mobile-agent", response_model=GuestSafetyIncidentResponse, status_code=201)
def ingest_mobile_agent_incident(
    payload: Dict[str, Any] = Body(...),
    current_user: User | None = Depends(get_current_user_optional)
):
    """
    Ingest incident from mobile agent app
    Expected payload:
    {
        "agent_id": "agent-123",
        "agent_name": "John Doe",
        "title": "Incident title",
        "description": "Incident description",
        "location": "Room 101",
        "severity": "high",
        "guest_involved": "Guest Name",
        "room_number": "101",
        "contact_info": "phone/email",
        "evidence_files": []
    }
    """
    try:
        incident_data = GuestSafetyIncidentCreate(
            title=payload.get("title", "Mobile Agent Report"),
            description=payload.get("description", ""),
            location=payload.get("location", "Unknown"),
            severity=payload.get("severity", "medium"),
            status="reported",
            guest_involved=payload.get("guest_involved"),
            room_number=payload.get("room_number"),
            contact_info=payload.get("contact_info"),
            source="MOBILE_AGENT",
            source_metadata={
                "agent_id": payload.get("agent_id"),
                "agent_name": payload.get("agent_name"),
                "agent_trust_score": payload.get("agent_trust_score"),
                "submission_timestamp": datetime.utcnow().isoformat(),
                "evidence_files": payload.get("evidence_files", [])
            }
        )
        user_id = str(current_user.user_id) if current_user else None
        incident = GuestSafetyService.create_incident(incident_data, user_id=user_id)
        logger.info(f"Mobile agent incident ingested: {incident.id} from agent {payload.get('agent_id')}")
        return incident
    except Exception as e:
        logger.error(f"Failed to ingest mobile agent incident: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/incidents/ingest/hardware-device", response_model=GuestSafetyIncidentResponse, status_code=201)
def ingest_hardware_device_incident(
    payload: Dict[str, Any] = Body(...),
    current_user: User | None = Depends(get_current_user_optional)
):
    """
    Ingest incident from hardware device (panic button, sensor, camera, etc.)
    Expected payload:
    {
        "device_id": "device-123",
        "device_name": "Panic Button - Room 101",
        "device_type": "panic_button",
        "title": "Panic button activated",
        "description": "Guest activated panic button",
        "location": "Room 101",
        "severity": "critical",
        "room_number": "101",
        "detection_data": {}
    }
    """
    try:
        device_type = payload.get("device_type", "other")
        title = payload.get("title") or f"{device_type.replace('_', ' ').title()} Alert"
        
        incident_data = GuestSafetyIncidentCreate(
            title=title,
            description=payload.get("description", f"Alert from {payload.get('device_name', 'hardware device')}"),
            location=payload.get("location", "Unknown"),
            severity=payload.get("severity", "high"),
            status="reported",
            room_number=payload.get("room_number"),
            source="HARDWARE_DEVICE",
            source_metadata={
                "device_id": payload.get("device_id"),
                "device_name": payload.get("device_name"),
                "device_type": device_type,
                "detection_timestamp": payload.get("timestamp", datetime.utcnow().isoformat()),
                "detection_data": payload.get("detection_data", {})
            }
        )
        user_id = str(current_user.user_id) if current_user else None
        incident = GuestSafetyService.create_incident(incident_data, user_id=user_id)
        logger.info(f"Hardware device incident ingested: {incident.id} from device {payload.get('device_id')}")
        return incident
    except Exception as e:
        logger.error(f"Failed to ingest hardware device incident: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/incidents/ingest/guest-panic", response_model=GuestSafetyIncidentResponse, status_code=201)
def ingest_guest_panic_incident(
    payload: Dict[str, Any] = Body(...),
    current_user: User | None = Depends(get_current_user_optional)
):
    """
    Ingest panic button incident from guest app or physical panic button
    Expected payload:
    {
        "guest_id": "guest-123",
        "guest_name": "John Doe",
        "room_number": "101",
        "location": "Room 101",
        "panic_type": "medical" | "security" | "emergency",
        "description": "Guest needs immediate assistance",
        "contact_info": "phone/email"
    }
    """
    try:
        panic_type = payload.get("panic_type", "emergency")
        severity = "critical" if panic_type == "emergency" else "high"
        
        incident_data = GuestSafetyIncidentCreate(
            title=f"Guest Panic Alert - {panic_type.title()}",
            description=payload.get("description", f"Guest panic button activated: {panic_type}"),
            location=payload.get("location", payload.get("room_number", "Unknown")),
            severity=severity,
            status="reported",
            guest_involved=payload.get("guest_name"),
            room_number=payload.get("room_number"),
            contact_info=payload.get("contact_info"),
            source="GUEST_PANIC_BUTTON",
            source_metadata={
                "guest_id": payload.get("guest_id"),
                "panic_type": panic_type,
                "activation_timestamp": payload.get("timestamp", datetime.utcnow().isoformat()),
                "device_id": payload.get("device_id")
            }
        )
        user_id = str(current_user.user_id) if current_user else None
        incident = GuestSafetyService.create_incident(incident_data, user_id=user_id)
        logger.info(f"Guest panic incident ingested: {incident.id} from guest {payload.get('guest_id')}")
        return incident
    except Exception as e:
        logger.error(f"Failed to ingest guest panic incident: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/hardware/devices", response_model=List[Dict[str, Any]])
def get_hardware_devices(current_user: User | None = Depends(get_current_user_optional)):
    """Get hardware device status and health"""
    # TODO: Implement actual hardware device tracking
    # For now, return mock data structure
    return [
        {
            "deviceId": "panic-btn-101",
            "deviceName": "Panic Button - Room 101",
            "deviceType": "panic_button",
            "status": "online",
            "lastSeen": datetime.utcnow().isoformat(),
            "signalStrength": 95,
            "batteryLevel": 87,
            "location": "Room 101"
        }
    ]


@router.get("/mobile-agents/metrics", response_model=Dict[str, Any])
def get_mobile_agent_metrics(current_user: User | None = Depends(get_current_user_optional)):
    """Get mobile agent performance metrics"""
    # TODO: Implement actual agent metrics tracking
    # For now, return mock data structure
    return {
        "totalAgents": 5,
        "activeAgents": 3,
        "submissionsToday": 12,
        "averageResponseTime": 4.2,
        "trustScoreAverage": 85.5
    }


# ============================================
# GUEST MESSAGES ENDPOINTS
# ============================================

@router.post("/messages", response_model=GuestMessageResponse, status_code=201)
async def create_guest_message(
    message: GuestMessageCreate,
    current_user: User | None = Depends(get_current_user_optional)
):
    """Receive a message from a guest app"""
    user_id = str(current_user.user_id) if current_user else None
    message_response = GuestSafetyService.create_message(message, user_id=user_id)
    
    # Broadcast via WebSocket
    try:
        from main import manager
        if manager and manager.active_connections:
            ws_message = {
                "type": "guest_message",
                "message": {
                    "id": message_response.id,
                    "incident_id": message_response.incident_id,
                    "guest_name": message_response.guest_name,
                    "room_number": message_response.room_number,
                    "message_text": message_response.message_text,
                    "message_type": message_response.message_type,
                    "is_read": message_response.is_read,
                    "created_at": message_response.created_at.isoformat() if hasattr(message_response.created_at, 'isoformat') else str(message_response.created_at),
                    "source": message_response.source,
                }
            }
            for user_id, connections in manager.active_connections.items():
                for ws in connections:
                    try:
                        await ws.send_json(ws_message)
                    except Exception as e:
                        logger.warning(f"Failed to send WebSocket message: {e}")
    except Exception as e:
        logger.warning(f"WebSocket broadcast failed: {e}")
    
    return message_response


@router.get("/messages", response_model=List[GuestMessageResponse])
def get_guest_messages(
    incident_id: Optional[str] = None,
    unread_only: bool = False,
    limit: int = 100,
    current_user: User | None = Depends(get_current_user_optional)
):
    """Get guest messages"""
    user_id = str(current_user.user_id) if current_user else None
    return GuestSafetyService.get_messages(
        user_id=user_id,
        incident_id=incident_id,
        unread_only=unread_only,
        limit=limit
    )


@router.put("/messages/{message_id}/read", response_model=GuestMessageResponse)
def mark_message_read(
    message_id: str,
    current_user: User | None = Depends(get_current_user_optional)
):
    """Mark a message as read"""
    user_id = str(current_user.user_id) if current_user else None
    return GuestSafetyService.mark_message_read(message_id, user_id=user_id)


@router.put("/messages/{message_id}", response_model=GuestMessageResponse)
def update_message(
    message_id: str,
    updates: GuestMessageUpdate,
    current_user: User | None = Depends(get_current_user_optional)
):
    """Update a message"""
    return GuestSafetyService.update_message(message_id, updates)
