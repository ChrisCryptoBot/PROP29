from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from schemas import (
    GuestSafetyIncidentCreate,
    GuestSafetyIncidentUpdate,
    GuestSafetyIncidentResponse,
    GuestSafetyTeamResponse,
    GuestSafetySettingsUpdate,
    GuestSafetySettingsResponse,
)
from api.auth_dependencies import get_current_user_optional
from models import User
from services.guest_safety_service import GuestSafetyService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/guest-safety", tags=["Guest Safety"])


@router.get("/incidents", response_model=List[GuestSafetyIncidentResponse])
def get_incidents(current_user: User | None = Depends(get_current_user_optional)):
    """Get guest safety incidents"""
    user_id = str(current_user.user_id) if current_user else None
    return GuestSafetyService.get_incidents(user_id=user_id)


@router.post("/incidents", response_model=GuestSafetyIncidentResponse, status_code=201)
def create_incident(incident: GuestSafetyIncidentCreate, current_user: User | None = Depends(get_current_user_optional)):
    """Create guest safety incident"""
    user_id = str(current_user.user_id) if current_user else None
    return GuestSafetyService.create_incident(incident, user_id=user_id)


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
