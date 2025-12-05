from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from schemas import IncidentCreate, IncidentUpdate, IncidentResponse, EmergencyAlertCreate, EmergencyAlertResponse
from services.incident_service import IncidentService
from api.auth_endpoints import get_current_user
from models import User
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/incidents", tags=["Incidents"])


class AIClassificationRequest(BaseModel):
    """Request body for AI classification suggestion"""
    title: str
    description: str
    location: Optional[Dict[str, Any]] = None


class AIClassificationResponse(BaseModel):
    """Response for AI classification suggestion"""
    incident_type: str
    severity: str
    confidence: float
    reasoning: str
    fallback_used: bool


@router.get("/", response_model=List[IncidentResponse])
async def get_incidents(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    current_user: User = Depends(get_current_user)
):
    """Get all incidents with optional filtering"""
    try:
        incidents = await IncidentService.get_incidents(
            user_id=str(current_user.user_id),
            property_id=property_id,
            status=status,
            severity=severity
        )
        return incidents
    except Exception as e:
        logger.error(f"Failed to get incidents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve incidents: {str(e)}")


@router.post("/", response_model=IncidentResponse, status_code=201)
async def create_incident(
    incident: IncidentCreate,
    use_ai: bool = Query(False, description="Use AI to assist with classification"),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new incident

    - **use_ai**: If True, AI will analyze the incident and provide classification assistance
    - The AI confidence score will be stored with the incident
    """
    try:
        new_incident = await IncidentService.create_incident(
            incident=incident,
            user_id=str(current_user.user_id),
            use_ai_classification=use_ai
        )
        return new_incident
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create incident: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create incident: {str(e)}")


@router.post("/ai-classify", response_model=AIClassificationResponse)
async def get_ai_classification(
    request: AIClassificationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Get AI classification suggestion without creating an incident

    This endpoint allows the frontend to show AI suggestions to the user
    before they finalize the incident creation.

    Returns:
    - incident_type: Suggested incident type
    - severity: Suggested severity level
    - confidence: AI confidence score (0-1)
    - reasoning: Explanation of why the AI made this classification
    - fallback_used: Whether simple keyword matching was used instead of AI
    """
    try:
        result = await IncidentService.get_ai_classification_suggestion(
            title=request.title,
            description=request.description,
            location=request.location
        )
        return AIClassificationResponse(**result)
    except Exception as e:
        logger.error(f"Failed to get AI classification: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get AI classification: {str(e)}"
        )


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific incident by ID"""
    try:
        incident = await IncidentService.get_incident(
            incident_id=incident_id,
            user_id=str(current_user.user_id)
        )
        return incident
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get incident: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve incident: {str(e)}")


@router.put("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    incident_update: IncidentUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an existing incident"""
    try:
        updated_incident = await IncidentService.update_incident(
            incident_id=incident_id,
            incident_update=incident_update,
            user_id=str(current_user.user_id)
        )
        return updated_incident
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update incident: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update incident: {str(e)}")


@router.delete("/{incident_id}")
async def delete_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an incident"""
    try:
        result = await IncidentService.delete_incident(
            incident_id=incident_id,
            user_id=str(current_user.user_id)
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to delete incident: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete incident: {str(e)}")


@router.post("/emergency-alert", response_model=EmergencyAlertResponse, status_code=201)
async def create_emergency_alert(
    alert: EmergencyAlertCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create an emergency alert

    This creates a high-priority incident and triggers emergency protocols
    """
    try:
        new_alert = await IncidentService.create_emergency_alert(
            alert=alert,
            user_id=str(current_user.user_id)
        )
        return new_alert
    except Exception as e:
        logger.error(f"Failed to create emergency alert: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create emergency alert: {str(e)}")
