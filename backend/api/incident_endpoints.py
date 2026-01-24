from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from schemas import (
    IncidentCreate, IncidentUpdate, IncidentResponse,
    EmergencyAlertCreate, EmergencyAlertResponse,
    IncidentSettings, IncidentSettingsResponse,
    PatternRecognitionRequest, PatternRecognitionResponse,
    ReportExportRequest, UserActivityResponse
)
from services.incident_service import IncidentService
from api.auth_dependencies import get_current_user, require_admin_role, check_user_has_property_access
from models import User
from pydantic import BaseModel
from datetime import datetime
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
    except ValueError as e:
        # Re-raise ValueError as-is (e.g., "Incident not found")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get incidents: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve incidents. Please try again.")


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
        # Check property access
        if not check_user_has_property_access(current_user, str(incident.property_id)):
            logger.warning(f"User {current_user.user_id} attempted to create incident for property {incident.property_id} without access")
            raise HTTPException(status_code=403, detail="Access denied to this property")
        
        new_incident = await IncidentService.create_incident(
            incident=incident,
            user_id=str(current_user.user_id),
            use_ai_classification=use_ai
        )
        return new_incident
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create incident: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create incident. Please try again.")


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
        logger.error(f"Failed to get AI classification: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to get AI classification. Please try again."
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
        
        # Check property access
        if not check_user_has_property_access(current_user, str(incident.property_id)):
            logger.warning(f"User {current_user.user_id} attempted to access incident {incident_id} from property {incident.property_id} without access")
            raise HTTPException(status_code=403, detail="Access denied to this incident")
        
        return incident
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get incident: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve incident. Please try again.")


@router.get("/{incident_id}/activity", response_model=List[UserActivityResponse])
async def get_incident_activity(
    incident_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get incident activity timeline"""
    try:
        activity = await IncidentService.get_incident_activity(
            incident_id=incident_id,
            user_id=str(current_user.user_id)
        )
        return activity
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get incident activity: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve activity. Please try again.")


@router.put("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    incident_update: IncidentUpdate,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Update an existing incident"""
    try:
        # First check if incident exists and user has access
        existing_incident = await IncidentService.get_incident(
            incident_id=incident_id,
            user_id=str(current_user.user_id)
        )
        
        # Check property access
        if not check_user_has_property_access(current_user, str(existing_incident.property_id)):
            logger.warning(f"User {current_user.user_id} attempted to update incident {incident_id} from property {existing_incident.property_id} without access")
            raise HTTPException(status_code=403, detail="Access denied to this incident")
        
        request_info = {
            "ip_address": request.client.host if request.client else "0.0.0.0",
            "user_agent": request.headers.get("user-agent", "unknown"),
            "session_id": request.headers.get("x-session-id")
        }
        updated_incident = await IncidentService.update_incident(
            incident_id=incident_id,
            incident_update=incident_update,
            user_id=str(current_user.user_id),
            request_info=request_info
        )
        return updated_incident
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update incident: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update incident. Please try again.")


@router.delete("/{incident_id}")
async def delete_incident(
    incident_id: str,
    current_user: User = Depends(require_admin_role)
):
    """Delete an incident - requires admin role"""
    try:
        # Check if incident exists and user has access
        existing_incident = await IncidentService.get_incident(
            incident_id=incident_id,
            user_id=str(current_user.user_id)
        )
        
        # Check property access
        if not check_user_has_property_access(current_user, str(existing_incident.property_id)):
            logger.warning(f"User {current_user.user_id} attempted to delete incident {incident_id} from property {existing_incident.property_id} without access")
            raise HTTPException(status_code=403, detail="Access denied to this incident")
        
        result = await IncidentService.delete_incident(
            incident_id=incident_id,
            user_id=str(current_user.user_id)
        )
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to delete incident: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete incident. Please try again.")


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
        # Check property access
        if not check_user_has_property_access(current_user, str(alert.property_id)):
            logger.warning(f"User {current_user.user_id} attempted to create emergency alert for property {alert.property_id} without access")
            raise HTTPException(status_code=403, detail="Access denied to this property")
        
        new_alert = await IncidentService.create_emergency_alert(
            alert=alert,
            user_id=str(current_user.user_id)
        )
        return new_alert
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create emergency alert: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create emergency alert. Please try again.")


@router.get("/settings", response_model=IncidentSettingsResponse)
async def get_settings(
    property_id: Optional[str] = Query(None, description="Property ID (optional)"),
    current_user: User = Depends(get_current_user)
):
    """Get incident settings for a property"""
    try:
        settings = await IncidentService.get_settings(
            user_id=str(current_user.user_id),
            property_id=property_id
        )
        return settings
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve settings. Please try again.")


@router.put("/settings", response_model=IncidentSettingsResponse)
async def update_settings(
    settings: IncidentSettings,
    property_id: Optional[str] = Query(None, description="Property ID (optional)"),
    current_user: User = Depends(get_current_user)
):
    """Update incident settings for a property"""
    try:
        updated_settings = await IncidentService.update_settings(
            user_id=str(current_user.user_id),
            settings=settings,
            property_id=property_id
        )
        return updated_settings
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update settings. Please try again.")


@router.post("/analytics/pattern-recognition", response_model=PatternRecognitionResponse)
async def get_pattern_recognition(
    request: PatternRecognitionRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze incidents for patterns (location, temporal, severity trends)"""
    try:
        patterns = await IncidentService.get_pattern_recognition(
            user_id=str(current_user.user_id),
            request=request
        )
        return patterns
    except Exception as e:
        logger.error(f"Failed to analyze patterns: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to analyze patterns. Please try again.")


@router.get("/reports/export")
async def export_report(
    format: str = Query(..., description="Export format: pdf or csv"),
    start_date: Optional[datetime] = Query(None, description="Start date"),
    end_date: Optional[datetime] = Query(None, description="End date"),
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    current_user: User = Depends(get_current_user)
):
    """Export incidents report as PDF or CSV"""
    try:
        filters = {}
        if property_id:
            filters['property_id'] = property_id
        if status:
            filters['status'] = status
        if severity:
            filters['severity'] = severity
        
        request = ReportExportRequest(
            format=format,
            start_date=start_date,
            end_date=end_date,
            filters=filters
        )
        
        file_content = await IncidentService.export_report(
            user_id=str(current_user.user_id),
            request=request
        )
        
        # Set content type and filename
        if format.lower() == 'csv':
            media_type = 'text/csv'
            filename = f"incident-report-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.csv"
        else:
            media_type = 'application/pdf'
            filename = f"incident-report-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.pdf"
        
        return StreamingResponse(
            iter([file_content]),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to export report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to export report. Please try again.")
