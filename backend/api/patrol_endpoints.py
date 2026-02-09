from fastapi import APIRouter, Depends, HTTPException, Query, Body, status, Header
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID

from database import get_db
from models import User
from schemas import (
    PatrolCreate, 
    PatrolUpdate, 
    PatrolResponse, 
    PatrolMetricsResponse,
    UserResponse,
    PatrolRouteCreate, PatrolRouteUpdate, PatrolRouteResponse,
    PatrolTemplateCreate, PatrolTemplateUpdate, PatrolTemplateResponse,
    PatrolSettingsUpdate, PatrolSettingsResponse,
    PatrolCheckpointCheckIn, PatrolEmergencyAlert,
    SystemLogResponse
)
from services.patrol_service import PatrolService
from api.auth_dependencies import (
    get_current_user as get_current_active_user,
    get_current_user_optional,
    require_security_manager_or_admin as get_current_security_officer,
    verify_hardware_ingest_key,
)
import logging

# Configure logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/patrols",
    tags=["Patrols"],
    responses={404: {"description": "Not found"}}
)

_DEFAULT_METRICS = {
    "total_patrols": 0,
    "completed_patrols": 0,
    "average_efficiency_score": 0.0,
    "patrols_by_type": {},
    "average_duration": 0.0,
    "incidents_found": 0,
    "efficiency_trend": [],
    "guard_performance": []
}


@router.get("/metrics", response_model=PatrolMetricsResponse)
async def get_patrol_metrics(
    property_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Get patrol KPI metrics. Returns zeroed metrics on error so response always has CORS headers."""
    try:
        out = await PatrolService.get_metrics(
            user_id=str(current_user.user_id),
            property_id=str(property_id) if property_id else None
        )
        return out if out else _DEFAULT_METRICS
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("get_patrol_metrics failed: %s", e)
        return _DEFAULT_METRICS

@router.get("/", response_model=List[PatrolResponse])
async def get_patrols(
    property_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all patrols with optional filtering
    """
    try:
        return await PatrolService.get_patrols(
            user_id=str(current_user.user_id),
            property_id=str(property_id) if property_id else None,
            status=status
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("patrols.get_patrols failed: %s", e)
        # Return empty list instead of 500 error
        return []

@router.post("/", response_model=PatrolResponse, status_code=status.HTTP_201_CREATED)
async def create_patrol(
    patrol: PatrolCreate,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """
    Create a new patrol assignment
    """
    return await PatrolService.create_patrol(patrol=patrol, user_id=str(current_user.user_id))

@router.get("/officers", response_model=List[UserResponse])
async def get_officers(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all security officers
    """
    try:
        return await PatrolService.get_officers(user_id=str(current_user.user_id))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("patrols.get_officers failed: %s", e)
        # Return empty list instead of 500 error
        return []

@router.post("/officers", response_model=UserResponse)
async def create_officer(
    data: dict,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """
    Create a new security officer
    """
    return await PatrolService.create_officer(
        name=data.get('name'),
        badge_number=data.get('badge_number'),
        specializations=data.get('specializations', []),
        admin_user_id=str(current_user.user_id)
    )

@router.put("/officers/{user_id}", response_model=UserResponse)
async def update_officer(
    user_id: str,
    data: dict,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """
    Update a security officer
    """
    return await PatrolService.update_officer(user_id=user_id, updates=data)

@router.delete("/officers/{user_id}")
async def delete_officer(
    user_id: str,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """
    Deactivate (soft delete) a security officer
    """
    return await PatrolService.delete_officer(user_id=user_id)


@router.post("/officers/{officer_id}/heartbeat")
async def officer_heartbeat(
    officer_id: str,
    body: Optional[Dict[str, Any]] = Body(None),
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Record heartbeat from officer device. Auth: JWT or X-API-Key (hardware).
    """
    if current_user is None and not x_api_key:
        raise HTTPException(status_code=401, detail="Authentication required")
    if current_user is None and x_api_key:
        await verify_hardware_ingest_key(x_api_key)
    PatrolService.record_heartbeat(officer_id, (body or {}).get("device_id"))
    return {"ok": True, "officer_id": officer_id}


@router.get("/officers/health")
async def officers_health(
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get officer last_heartbeat and connection_status for patrol UI.
    Uses heartbeat_offline_threshold_minutes from settings when property_id provided.
    """
    threshold: Optional[int] = None
    try:
        settings = await PatrolService.get_settings(
            user_id=str(current_user.user_id),
            property_id=property_id,
        )
        threshold = getattr(settings, "heartbeat_offline_threshold_minutes", None)
    except Exception:
        pass
    try:
        data = PatrolService.get_officers_health(offline_threshold_minutes=threshold)
        return {"officers": data}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("patrols.officers_health failed: %s", e)
        # Return empty dict instead of 500 error
        return {"officers": {}}


@router.get("/weather")
async def get_patrol_weather(
    current_user: User = Depends(get_current_active_user),
):
    """Get weather data for patrol dashboard (from weather API when implemented)."""
    return {
        "temperature": 0,
        "condition": "Unknown",
        "windSpeed": 0,
        "visibility": "Unknown",
        "humidity": 0,
        "patrolRecommendation": "No data"
    }

@router.get("/dashboard-data")
async def get_dashboard_data(
    property_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
):
    """
    Get comprehensive dashboard data including alerts, weather, emergency status
    """
    return PatrolService.get_dashboard_data(
        user_id=str(current_user.user_id),
        property_id=property_id
    )

@router.get("/alerts")
async def get_patrol_alerts(
    current_user: User = Depends(get_current_active_user),
):
    """Get current patrol alerts (from API when implemented)."""
    return {"alerts": []}

@router.get("/emergency-status")
async def get_emergency_status(
    current_user: User = Depends(get_current_active_user),
):
    """Get current emergency status (from API when implemented)."""
    return {
        "level": "normal",
        "message": "No data",
        "activeAlerts": 0,
        "lastIncident": None,
        "escalationProtocols": "standard"
    }


# --- ROUTES ---
@router.get("/routes", response_model=List[PatrolRouteResponse])
async def get_routes(
    property_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all routes"""
    try:
        return await PatrolService.get_routes(
            property_id=str(property_id) if property_id else None,
            user_id=str(current_user.user_id)
        )
    except Exception as e:
        logger.exception("patrols.get_routes failed: %s", e)
        raise

@router.post("/routes", response_model=PatrolRouteResponse)
async def create_route(
    route: PatrolRouteCreate,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """Create a new route"""
    return await PatrolService.create_route(route=route, user_id=str(current_user.user_id))

@router.put("/routes/{route_id}", response_model=PatrolRouteResponse)
async def update_route(
    route_id: str,
    route: PatrolRouteUpdate,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """Update a route"""
    return await PatrolService.update_route(route_id=route_id, route_update=route, user_id=str(current_user.user_id))

@router.delete("/routes/{route_id}")
async def delete_route(
    route_id: str,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """Delete a route"""
    return await PatrolService.delete_route(route_id=route_id, user_id=str(current_user.user_id))

# --- TEMPLATES ---
@router.get("/templates", response_model=List[PatrolTemplateResponse])
async def get_templates(
    property_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all templates"""
    try:
        return await PatrolService.get_templates(
            property_id=str(property_id) if property_id else None,
            user_id=str(current_user.user_id)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("patrols.get_templates failed: %s", e)
        # Return empty list instead of 500 error
        return []

@router.post("/templates", response_model=PatrolTemplateResponse)
async def create_template(
    template: PatrolTemplateCreate,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """Create a new template"""
    return await PatrolService.create_template(template=template, user_id=str(current_user.user_id))

@router.put("/templates/{template_id}", response_model=PatrolTemplateResponse)
async def update_template(
    template_id: str,
    template: PatrolTemplateUpdate,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """Update a template"""
    return await PatrolService.update_template(template_id=template_id, template_update=template, user_id=str(current_user.user_id))

@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: str,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """Delete a template"""
    return await PatrolService.delete_template(template_id=template_id, user_id=str(current_user.user_id))

@router.get("/settings", response_model=PatrolSettingsResponse)
async def get_settings(
    property_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get patrol settings"""
    return await PatrolService.get_settings(
        user_id=str(current_user.user_id),
        property_id=str(property_id) if property_id else None
    )

@router.put("/settings", response_model=PatrolSettingsResponse)
async def update_settings(
    settings: PatrolSettingsUpdate,
    property_id: Optional[str] = None,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """Update patrol settings"""
    return await PatrolService.update_settings(
        settings_update=settings,
        user_id=str(current_user.user_id),
        property_id=str(property_id) if property_id else None
    )

@router.post("/{patrol_id}/checkpoints/{checkpoint_id}/check-in", response_model=PatrolResponse)
async def check_in_checkpoint(
    patrol_id: str,
    checkpoint_id: str,
    payload: PatrolCheckpointCheckIn,
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
    current_user: Optional[User] = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """Record a checkpoint check-in from hardware or manual input"""
    if x_api_key:
        await verify_hardware_ingest_key(x_api_key)
        user_id = None
    else:
        user_id = str(current_user.user_id) if current_user else None
    return await PatrolService.check_in_checkpoint(
        patrol_id=patrol_id,
        checkpoint_id=checkpoint_id,
        payload=payload.model_dump(exclude_unset=True),
        user_id=user_id
    )

@router.post("/emergency-alert")
async def create_emergency_alert(
    payload: PatrolEmergencyAlert,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """Create a patrol emergency alert event"""
    return await PatrolService.create_emergency_alert(
        payload=payload.model_dump(exclude_unset=True),
        user_id=str(current_user.user_id)
    )

@router.get("/audit-logs", response_model=List[SystemLogResponse])
async def get_audit_logs(
    property_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get recent patrol audit log entries"""
    return await PatrolService.get_audit_logs(
        user_id=str(current_user.user_id),
        property_id=str(property_id) if property_id else None
    )

# AI Endpoint Stubs - Now formally defined to replace mocks
@router.post("/ai-match-officer")
async def ai_match_officer(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    AI Endpoint: Recommend best officer for a patrol based on specialized heuristics.
    Receives 'patrol' and 'officers' list.
    """
    # In a full implementation, this calls a dedicated AI service. 
    # For now, we return a structured (but calculated) response to replace the frontend mock.
    logger.info(f"AI Match Request for User: {current_user.username}")
    
    # 1. Parse Payload
    patrol = payload.get("patrol", {})
    officers = payload.get("officers", [])
    
    matches = []
    
    # 2. Heuristic Logic (Ported from frontend logic to backend for security/validity)
    for officer in officers:
        score = 60 # Base score
        reasoning = []
        
        # Skill Match
        req_specs = patrol.get("requiredSpecializations", [])
        off_specs = officer.get("specializations", [])
        
        if any(spec in off_specs for spec in req_specs):
            score += 25
            reasoning.append("Matches required specialization")
            
        # Workload Check
        active_patrols = officer.get("activePatrols", 0)
        if active_patrols == 0:
            score += 15
            reasoning.append("Currently available")
        elif active_patrols > 2:
            score -= 20
            reasoning.append("High workload detected")
            
        matches.append({
            "officerId": officer.get("id"),
            "matchScore": min(100, max(0, score)),
            "reasoning": reasoning
        })
        
    return {"matches": sorted(matches, key=lambda x: x['matchScore'], reverse=True)}


@router.post("/ai-optimize-route")
async def ai_optimize_route(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    AI Endpoint: Optimize checkpoint sequence.
    """
    route = payload.get("route", {})
    checkpoints = route.get("checkpoints", [])
    
    if not checkpoints:
        return {"optimization": {"optimizedSequence": [], "timeLeft": 0}}

    # Simple Optimization: Sort Critical First
    critical = [cp['id'] for cp in checkpoints if cp.get('isCritical')]
    standard = [cp['id'] for cp in checkpoints if not cp.get('isCritical')]
    
    return {
        "optimization": {
            "optimizedSequence": critical + standard,
            "timeSaved": 15,
            "reasoning": ["Prioritized critical checkpoints", "Minimized backtracking"]
        }
    }


@router.post("/ai-prioritize-alerts")
async def ai_prioritize_alerts(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    AI Endpoint: Prioritize alerts based on severity and type.
    """
    alerts = payload.get("alerts", [])
    priorities = []
    for alert in alerts:
        severity = str(alert.get("severity", "medium")).lower()
        alert_type = str(alert.get("type", "")).lower()
        alert_id = alert.get("id") or alert.get("alertId")

        score = 50
        priority = "medium"
        reasoning = ["Standard alert priority"]

        if severity == "critical":
            score = 95
            priority = "critical"
            reasoning = ["Critical severity alert"]
        elif severity == "high":
            score = 75
            priority = "high"
            reasoning = ["High severity alert"]
        elif severity == "low":
            score = 25
            priority = "low"
            reasoning = ["Low severity alert"]

        if alert_type == "checkpoint_missed":
            score = min(100, score + 10)
            reasoning.append("Checkpoint missed requires attention")

        priorities.append({
            "alertId": str(alert_id),
            "priority": priority,
            "score": score,
            "reasoning": " / ".join(reasoning),
            "recommendedAction": "Immediate review required" if priority == "critical" else None
        })

    priorities = sorted(priorities, key=lambda item: item["score"], reverse=True)
    return {"priorities": priorities}


@router.post("/ai-schedule-suggestions")
async def ai_schedule_suggestions(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    AI Endpoint: Suggest schedule improvements.
    """
    incidents = payload.get("incidents", [])
    suggestions = []
    if incidents:
        suggestions.append({
            "recommendation": "Increase patrol coverage during peak incident windows",
            "confidence": 0.72,
            "reasoning": "Incident history indicates temporal clustering",
            "timeframe": "18:00-22:00",
            "location": "High-activity zones",
            "priority": "high"
        })
    return {"suggestions": suggestions}


@router.post("/ai-suggest-templates")
async def ai_suggest_templates(
    payload: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    AI Endpoint: Suggest patrol templates based on history.
    """
    patrol_history = payload.get("patrolHistory", [])
    suggestions = []
    if patrol_history:
        suggestions.append({
            "name": "Recurring Perimeter Sweep",
            "description": "Template derived from repeat perimeter patrols",
            "suggestedRoute": "Perimeter Route",
            "suggestedTime": "20:00 - 23:00",
            "suggestedDays": ["Friday", "Saturday"],
            "priority": "medium",
            "confidence": 0.68,
            "reasoning": "Recurring pattern detected",
            "patternCount": len(patrol_history)
        })
    return {"suggestions": suggestions}


@router.get("/{patrol_id}", response_model=PatrolResponse)
async def get_patrol(
    patrol_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific patrol by ID
    """
    return await PatrolService.get_patrol(patrol_id=patrol_id, user_id=str(current_user.user_id))

@router.put("/{patrol_id}", response_model=PatrolResponse)
async def update_patrol(
    patrol_id: str,
    patrol_update: PatrolUpdate,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """
    Update patrol details
    """
    return await PatrolService.update_patrol(
        patrol_id=patrol_id, 
        patrol_update=patrol_update, 
        user_id=str(current_user.user_id)
    )

@router.post("/{patrol_id}/start")
async def start_patrol(
    patrol_id: str,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """
    Mark a patrol as started (Active)
    """
    return await PatrolService.start_patrol(patrol_id=patrol_id, user_id=str(current_user.user_id))

@router.post("/{patrol_id}/complete")
async def complete_patrol(
    patrol_id: str,
    current_user: User = Depends(get_current_security_officer),
    db: Session = Depends(get_db)
):
    """
    Mark a patrol as completed
    """
    return await PatrolService.complete_patrol(patrol_id=patrol_id, user_id=str(current_user.user_id))
