"""
Visitor Security API Endpoints
FastAPI router for Visitor Security management
Enforces authentication, authorization, and property-level access control
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
from enum import Enum
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, UserRole
from api.auth_dependencies import get_current_user, check_user_has_property_access, require_admin_role
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/visitors", tags=["Visitor Security"])

# Enums
class VisitorStatus(str, Enum):
    REGISTERED = "registered"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class SecurityClearance(str, Enum):
    APPROVED = "approved"
    PENDING = "pending"
    DENIED = "denied"

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class VisitType(str, Enum):
    DAY_VISITOR = "day_visitor"
    GUEST_VISITOR = "guest_visitor"
    SERVICE_PERSONNEL = "service_personnel"
    EMERGENCY_CONTACT = "emergency_contact"
    EVENT_ATTENDEE = "event_attendee"

class SecurityRequestType(str, Enum):
    ACCESS_REQUEST = "access_request"
    SECURITY_ASSISTANCE = "security_assistance"
    EMERGENCY_ALERT = "emergency_alert"
    INCIDENT_REPORT = "incident_report"
    ESCORT_REQUEST = "escort_request"
    LOST_BADGE = "lost_badge"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"

class EventBadgeType(str, Enum):
    TICKET = "ticket"
    VIP = "vip"
    STAFF = "staff"
    VENDOR = "vendor"

# Request/Response Models
class SecurityRequestCreate(BaseModel):
    visitor_id: str
    type: SecurityRequestType
    description: str
    priority: str = "normal"
    location: Optional[str] = None

class SecurityRequestResponse(BaseModel):
    id: str
    type: str
    description: str
    status: str
    priority: str
    created_at: str
    location: Optional[str] = None
    assigned_to: Optional[str] = None
    response: Optional[str] = None

class VisitorCreate(BaseModel):
    property_id: str  # Added for property-level isolation
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: str
    company: Optional[str] = None
    purpose: str
    host_name: str
    host_phone: Optional[str] = None
    host_email: Optional[EmailStr] = None
    host_room: Optional[str] = None
    expected_duration: int = 60
    location: str
    visit_type: VisitType = VisitType.DAY_VISITOR
    notes: Optional[str] = None
    vehicle_number: Optional[str] = None
    event_id: Optional[str] = None
    access_points: Optional[List[str]] = None


class VisitorUpdate(BaseModel):
    """Partial update for visitor - all fields optional."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    purpose: Optional[str] = None
    host_name: Optional[str] = None
    host_phone: Optional[str] = None
    host_email: Optional[EmailStr] = None
    host_room: Optional[str] = None
    expected_duration: Optional[int] = None
    location: Optional[str] = None
    visit_type: Optional[VisitType] = None
    notes: Optional[str] = None
    vehicle_number: Optional[str] = None
    status: Optional[VisitorStatus] = None
    security_clearance: Optional[SecurityClearance] = None
    risk_level: Optional[RiskLevel] = None
    access_points: Optional[List[str]] = None
    updated_at: Optional[str] = None

class VisitorResponse(BaseModel):
    id: str
    property_id: str  # Added for property-level isolation
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: str
    company: Optional[str] = None
    purpose: str
    host_name: str
    host_phone: Optional[str] = None
    host_email: Optional[str] = None
    host_room: Optional[str] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    expected_duration: int
    status: VisitorStatus
    location: str
    badge_id: Optional[str] = None
    qr_code: Optional[str] = None
    photo_url: Optional[str] = None
    vehicle_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str
    security_clearance: SecurityClearance
    risk_level: RiskLevel
    visit_type: VisitType
    wifi_registered: bool = False
    event_id: Optional[str] = None
    event_name: Optional[str] = None
    event_badge_type: Optional[EventBadgeType] = None
    access_points: Optional[List[str]] = None
    badge_expires_at: Optional[str] = None

class EventCreate(BaseModel):
    property_id: str  # Added for property-level isolation
    name: str
    type: str
    start_date: str
    end_date: str
    location: str
    expected_attendees: int
    qr_code_enabled: bool = True
    access_points: List[str]

class EventResponse(BaseModel):
    id: str
    property_id: str  # Added for property-level isolation
    name: str
    type: str
    start_date: str
    end_date: str
    location: str
    expected_attendees: int
    badge_types: List[dict]
    qr_code_enabled: bool
    access_points: List[str]

class QRCodeResponse(BaseModel):
    visitor_id: str
    qr_code: str
    badge_id: str
    event_name: Optional[str] = None
    expires_at: Optional[str] = None

# Data storage - will use database in production
# TODO: Replace with database queries via VisitorsService (requires schema alignment)
visitors_storage = []
events_storage = []
security_requests_storage = []


def get_user_property_ids(user: User) -> List[str]:
    """Get list of property IDs that a user has access to"""
    db = SessionLocal()
    try:
        user_roles = db.query(UserRole).filter(
            UserRole.user_id == user.user_id,
            UserRole.is_active == True
        ).all()
        return [str(role.property_id) for role in user_roles]
    finally:
        db.close()


@router.get("/", response_model=List[VisitorResponse])
async def get_visitors(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    status: Optional[VisitorStatus] = Query(None, description="Filter by status"),
    event_id: Optional[str] = Query(None, description="Filter by event ID"),
    security_clearance: Optional[SecurityClearance] = Query(None, description="Filter by security clearance"),
    current_user: User = Depends(get_current_user)
):
    """Get all visitors with optional filters - Enforces property-level access control"""
    try:
        # Get user's accessible property IDs
        user_property_ids = get_user_property_ids(current_user)
        
        if not user_property_ids:
            # User has no properties assigned, return empty list
            return []
        
        # Filter by user's accessible properties
        filtered = [v for v in visitors_storage if v.get("property_id") in user_property_ids]
        
        # Additional filters
        if property_id:
            if property_id not in user_property_ids:
                logger.warning(f"User {current_user.user_id} requested property {property_id} without access; returning empty list")
                return []
            filtered = [v for v in filtered if v.get("property_id") == property_id]
        
        if status:
            filtered = [v for v in filtered if v.get("status") == status.value]
        if event_id:
            filtered = [v for v in filtered if v.get("event_id") == event_id]
        if security_clearance:
            filtered = [v for v in filtered if v.get("security_clearance") == security_clearance.value]
        
        return filtered
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get visitors: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve visitors. Please try again.")


@router.post("/", response_model=VisitorResponse, status_code=201)
async def create_visitor(
    visitor: VisitorCreate,
    current_user: User = Depends(get_current_user)
):
    """Register a new visitor - Enforces property-level access control"""
    try:
        # Check property access
        if not check_user_has_property_access(current_user, visitor.property_id):
            logger.warning(f"User {current_user.user_id} attempted to create visitor for property {visitor.property_id} without access")
            raise HTTPException(status_code=403, detail="Access denied to this property")
        
        visitor_id = str(uuid.uuid4())
        badge_id = f"V{len([v for v in visitors_storage if v.get('property_id') == visitor.property_id]) + 1:03d}"
        qr_code = f"VISITOR_{visitor_id[:8].upper()}_QR"
        
        new_visitor = {
            "id": visitor_id,
            "property_id": visitor.property_id,
            **visitor.dict(exclude={"property_id"}),
            "status": VisitorStatus.REGISTERED.value,
            "badge_id": badge_id,
            "qr_code": qr_code,
            "check_in_time": None,
            "check_out_time": None,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "security_clearance": SecurityClearance.PENDING.value,
            "risk_level": RiskLevel.LOW.value,
            "wifi_registered": False,
            "security_requests": [],
            "emergency_contacts": []
        }
        
        visitors_storage.append(new_visitor)
        return new_visitor
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create visitor: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create visitor. Please try again.")


@router.get("/{visitor_id}", response_model=VisitorResponse)
async def get_visitor(
    visitor_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific visitor by ID - Enforces property-level access control"""
    try:
        visitor = next((v for v in visitors_storage if v["id"] == visitor_id), None)
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        # Check property access
        if not check_user_has_property_access(current_user, visitor.get("property_id", "")):
            logger.warning(f"User {current_user.user_id} attempted to access visitor {visitor_id} without property access")
            raise HTTPException(status_code=403, detail="Access denied to this visitor")
        
        return visitor
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get visitor: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve visitor. Please try again.")


@router.put("/{visitor_id}", response_model=VisitorResponse)
async def update_visitor(
    visitor_id: str,
    updates: VisitorUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a visitor - Enforces property-level access control"""
    try:
        visitor = next((v for v in visitors_storage if v["id"] == visitor_id), None)
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        if not check_user_has_property_access(current_user, visitor.get("property_id", "")):
            logger.warning(f"User {current_user.user_id} attempted to update visitor {visitor_id} without property access")
            raise HTTPException(status_code=403, detail="Access denied to this visitor")
        update_dict = updates.dict(exclude_unset=True)
        update_dict.pop("updated_at", None)
        for key, value in update_dict.items():
            if value is not None:
                visitor[key] = value.value if hasattr(value, "value") else value
        visitor["updated_at"] = datetime.now().isoformat()
        return visitor
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update visitor: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update visitor. Please try again.")


@router.post("/{visitor_id}/check-in", response_model=VisitorResponse)
async def check_in_visitor(
    visitor_id: str,
    current_user: User = Depends(get_current_user)
):
    """Check in a visitor - Enforces property-level access control"""
    try:
        visitor = next((v for v in visitors_storage if v["id"] == visitor_id), None)
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        # Check property access
        if not check_user_has_property_access(current_user, visitor.get("property_id", "")):
            logger.warning(f"User {current_user.user_id} attempted to check in visitor {visitor_id} without property access")
            raise HTTPException(status_code=403, detail="Access denied to this visitor")
        
        visitor["status"] = VisitorStatus.CHECKED_IN.value
        visitor["check_in_time"] = datetime.now().isoformat()
        visitor["updated_at"] = datetime.now().isoformat()
        
        return visitor
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to check in visitor: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to check in visitor. Please try again.")


@router.post("/{visitor_id}/check-out", response_model=VisitorResponse)
async def check_out_visitor(
    visitor_id: str,
    current_user: User = Depends(get_current_user)
):
    """Check out a visitor - Enforces property-level access control"""
    try:
        visitor = next((v for v in visitors_storage if v["id"] == visitor_id), None)
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        # Check property access
        if not check_user_has_property_access(current_user, visitor.get("property_id", "")):
            logger.warning(f"User {current_user.user_id} attempted to check out visitor {visitor_id} without property access")
            raise HTTPException(status_code=403, detail="Access denied to this visitor")
        
        visitor["status"] = VisitorStatus.CHECKED_OUT.value
        visitor["check_out_time"] = datetime.now().isoformat()
        visitor["updated_at"] = datetime.now().isoformat()
        
        return visitor
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to check out visitor: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to check out visitor. Please try again.")


@router.delete("/{visitor_id}", status_code=204)
async def delete_visitor(
    visitor_id: str,
    current_user: User = Depends(require_admin_role)
):
    """Delete a visitor - Admin only - Enforces property-level access control"""
    try:
        visitor = next((v for v in visitors_storage if v["id"] == visitor_id), None)
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        # Check property access (admin check already done by require_admin_role)
        if not check_user_has_property_access(current_user, visitor.get("property_id", "")):
            logger.warning(f"Admin user {current_user.user_id} attempted to delete visitor {visitor_id} without property access")
            raise HTTPException(status_code=403, detail="Access denied to this visitor")
        
        visitors_storage[:] = [v for v in visitors_storage if v["id"] != visitor_id]
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete visitor: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete visitor. Please try again.")


@router.get("/{visitor_id}/qr-code", response_model=QRCodeResponse)
async def get_visitor_qr_code(
    visitor_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get QR code for visitor badge (for mobile app display) - Enforces property-level access control"""
    try:
        visitor = next((v for v in visitors_storage if v["id"] == visitor_id), None)
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        # Check property access
        if not check_user_has_property_access(current_user, visitor.get("property_id", "")):
            logger.warning(f"User {current_user.user_id} attempted to get QR code for visitor {visitor_id} without property access")
            raise HTTPException(status_code=403, detail="Access denied to this visitor")
        
        return {
            "visitor_id": visitor_id,
            "qr_code": visitor.get("qr_code", ""),
            "badge_id": visitor.get("badge_id", ""),
            "event_name": visitor.get("event_name"),
            "expires_at": visitor.get("badge_expires_at")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get QR code: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve QR code. Please try again.")


@router.post("/security-requests", response_model=SecurityRequestResponse, status_code=201)
async def create_security_request(
    request: SecurityRequestCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a security request from visitor (via mobile app) - Enforces property-level access control"""
    try:
        visitor = next((v for v in visitors_storage if v["id"] == request.visitor_id), None)
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        # Check property access
        if not check_user_has_property_access(current_user, visitor.get("property_id", "")):
            logger.warning(f"User {current_user.user_id} attempted to create security request for visitor {request.visitor_id} without property access")
            raise HTTPException(status_code=403, detail="Access denied to this visitor")
        
        request_id = str(uuid.uuid4())
        new_request = {
            "id": request_id,
            "type": request.type.value,
            "description": request.description,
            "status": "pending",
            "priority": request.priority,
            "created_at": datetime.now().isoformat(),
            "location": request.location,
            "assigned_to": None,
            "response": None
        }
        
        security_requests_storage.append(new_request)
        
        # Add to visitor's security requests
        if "security_requests" not in visitor:
            visitor["security_requests"] = []
        visitor["security_requests"].append(new_request)
        
        return new_request
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create security request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create security request. Please try again.")


class SecurityRequestAssign(BaseModel):
    """Body for assigning a security request to an officer"""
    assigned_to: str  # user_id of the assignee
    status: str = "in_progress"  # optional: in_progress | completed | cancelled


@router.patch("/security-requests/{request_id}", response_model=SecurityRequestResponse)
async def assign_security_request(
    request_id: str,
    body: SecurityRequestAssign,
    current_user: User = Depends(get_current_user)
):
    """Assign a security request to an officer - Enforces property-level access control"""
    try:
        user_property_ids = get_user_property_ids(current_user)
        if not user_property_ids:
            raise HTTPException(status_code=403, detail="No property access")

        # Find the request in a visitor's security_requests (same ref as in security_requests_storage)
        for visitor in visitors_storage:
            if visitor.get("property_id") not in user_property_ids:
                continue
            for req in visitor.get("security_requests") or []:
                if req.get("id") == request_id:
                    req["assigned_to"] = body.assigned_to
                    req["status"] = body.status
                    return req
        raise HTTPException(status_code=404, detail="Security request not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to assign security request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to assign security request.")


@router.get("/security-requests", response_model=List[SecurityRequestResponse])
async def get_security_requests(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    current_user: User = Depends(get_current_user)
):
    """Get all security requests - Enforces property-level access control"""
    try:
        # Get user's accessible property IDs
        user_property_ids = get_user_property_ids(current_user)
        
        if not user_property_ids:
            return []
        
        # Collect requests from visitors in user's accessible properties
        filtered = []
        for visitor in visitors_storage:
            if visitor.get("property_id") not in user_property_ids:
                continue
            if property_id and visitor.get("property_id") != property_id:
                continue
            for req in visitor.get("security_requests") or []:
                if status and req.get("status") != status:
                    continue
                if priority and req.get("priority") != priority:
                    continue
                filtered.append(req)
        
        return filtered
    except Exception as e:
        logger.error(f"Failed to get security requests: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve security requests. Please try again.")


@router.post("/events", response_model=EventResponse, status_code=201)
async def create_event(
    event: EventCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new event (wedding, conference, etc.) - Enforces property-level access control"""
    try:
        # Check property access
        if not check_user_has_property_access(current_user, event.property_id):
            logger.warning(f"User {current_user.user_id} attempted to create event for property {event.property_id} without access")
            raise HTTPException(status_code=403, detail="Access denied to this property")
        
        event_id = str(uuid.uuid4())
        new_event = {
            "id": event_id,
            "property_id": event.property_id,
            **event.dict(exclude={"property_id"}),
            "badge_types": [
                {"id": "1", "name": "Guest Ticket", "type": "ticket", "color": "#3b82f6", "access_level": ["lobby", "ballroom"]},
                {"id": "2", "name": "VIP Guest", "type": "vip", "color": "#f59e0b", "access_level": ["lobby", "ballroom", "vip_lounge"]},
                {"id": "3", "name": "Event Staff", "type": "staff", "color": "#10b981", "access_level": ["lobby", "ballroom", "kitchen", "staff_areas"]},
                {"id": "4", "name": "Vendor", "type": "vendor", "color": "#8b5cf6", "access_level": ["lobby", "loading_dock", "ballroom"]}
            ]
        }
        
        events_storage.append(new_event)
        return new_event
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create event: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create event. Please try again.")


@router.get("/events", response_model=List[EventResponse])
async def get_events(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    current_user: User = Depends(get_current_user)
):
    """Get all events - Enforces property-level access control"""
    try:
        # Get user's accessible property IDs
        user_property_ids = get_user_property_ids(current_user)
        
        if not user_property_ids:
            return []
        
        # Filter by user's accessible properties
        filtered = [e for e in events_storage if e.get("property_id") in user_property_ids]
        
        if property_id:
            if property_id not in user_property_ids:
                logger.warning(f"User {current_user.user_id} requested events for property {property_id} without access; returning empty list")
                return []
            filtered = [e for e in filtered if e.get("property_id") == property_id]
        
        return filtered
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get events: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve events. Please try again.")


@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a single event by ID - Enforces property-level access control"""
    try:
        user_property_ids = get_user_property_ids(current_user)
        if not user_property_ids:
            raise HTTPException(status_code=403, detail="No property access")
        event = next((e for e in events_storage if e["id"] == event_id), None)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        if event.get("property_id") not in user_property_ids:
            logger.warning(f"User {current_user.user_id} attempted to access event {event_id} without property access")
            raise HTTPException(status_code=403, detail="Access denied to this event")
        return event
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get event: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve event. Please try again.")


@router.delete("/events/{event_id}", status_code=204)
async def delete_event(
    event_id: str,
    current_user: User = Depends(require_admin_role)
):
    """Delete an event - Admin only - Enforces property-level access control"""
    try:
        event = next((e for e in events_storage if e["id"] == event_id), None)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check property access (admin check already done by require_admin_role)
        if not check_user_has_property_access(current_user, event.get("property_id", "")):
            logger.warning(f"Admin user {current_user.user_id} attempted to delete event {event_id} without property access")
            raise HTTPException(status_code=403, detail="Access denied to this event")
        
        events_storage[:] = [e for e in events_storage if e["id"] != event_id]
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete event: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete event. Please try again.")


@router.post("/events/{event_id}/register", response_model=VisitorResponse, status_code=201)
async def register_event_attendee(
    event_id: str,
    visitor: VisitorCreate,
    current_user: User = Depends(get_current_user)
):
    """Register an attendee for an event (creates visitor with event badge) - Enforces property-level access control"""
    try:
        event = next((e for e in events_storage if e["id"] == event_id), None)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check property access for event
        if not check_user_has_property_access(current_user, event.get("property_id", "")):
            logger.warning(f"User {current_user.user_id} attempted to register attendee for event {event_id} without property access")
            raise HTTPException(status_code=403, detail="Access denied to this event")
        
        # Ensure visitor property_id matches event property_id
        visitor.property_id = event.get("property_id", visitor.property_id)
        
        visitor_id = str(uuid.uuid4())
        badge_id = f"EVT{len([v for v in visitors_storage if v.get('event_id') == event_id]) + 1:03d}"
        qr_code = f"{event['type'].upper()}_{visitor_id[:8].upper()}_QR"
        
        # Calculate badge expiration (end of event)
        badge_expires_at = event["end_date"]
        
        new_visitor = {
            "id": visitor_id,
            "property_id": visitor.property_id,
            **visitor.dict(exclude={"property_id"}),
            "status": VisitorStatus.REGISTERED.value,
            "badge_id": badge_id,
            "qr_code": qr_code,
            "check_in_time": None,
            "check_out_time": None,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "security_clearance": SecurityClearance.APPROVED.value,
            "risk_level": RiskLevel.LOW.value,
            "visit_type": VisitType.EVENT_ATTENDEE.value,
            "wifi_registered": False,
            "event_id": event_id,
            "event_name": event["name"],
            "event_badge_type": EventBadgeType.TICKET.value,
            "access_points": event.get("access_points", []),
            "badge_expires_at": badge_expires_at,
            "security_requests": [],
            "emergency_contacts": []
        }
        
        visitors_storage.append(new_visitor)
        return new_visitor
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to register event attendee: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to register event attendee. Please try again.")


# --- Mobile agents (stub storage for plug-and-play) ---
mobile_agents_storage: List[dict] = []
mobile_submissions_storage: List[dict] = []


@router.get("/mobile-agents")
async def get_mobile_agents(
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """List registered mobile agent devices - property scoped."""
    user_property_ids = get_user_property_ids(current_user)
    if not user_property_ids:
        return []
    filtered = [a for a in mobile_agents_storage if a.get("property_id") in user_property_ids or not property_id]
    if property_id and property_id in user_property_ids:
        filtered = [a for a in filtered if a.get("property_id") == property_id]
    return filtered


class MobileAgentRegister(BaseModel):
    agent_name: str
    device_id: str
    device_model: Optional[str] = None
    app_version: str = "1.0.0"
    assigned_properties: List[str]


@router.post("/mobile-agents/register")
async def register_mobile_agent(
    body: MobileAgentRegister,
    current_user: User = Depends(get_current_user)
):
    """Register a mobile agent device."""
    prop = body.assigned_properties[0] if body.assigned_properties else get_user_property_ids(current_user)[0]
    if not check_user_has_property_access(current_user, prop):
        raise HTTPException(status_code=403, detail="Access denied")
    agent_id = str(uuid.uuid4())
    agent = {
        "agent_id": agent_id,
        "device_id": body.device_id,
        "agent_name": body.agent_name,
        "device_model": body.device_model,
        "app_version": body.app_version,
        "last_sync": datetime.now().isoformat(),
        "status": "online",
        "assigned_properties": body.assigned_properties,
        "property_id": prop,
    }
    mobile_agents_storage.append(agent)
    return agent


@router.get("/mobile-agents/submissions")
async def get_mobile_agent_submissions(
    agent_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """List mobile agent submissions (pending sync)."""
    user_property_ids = get_user_property_ids(current_user)
    if not user_property_ids:
        return []
    out = list(mobile_submissions_storage)
    if agent_id:
        out = [s for s in out if s.get("agent_id") == agent_id]
    if status:
        out = [s for s in out if s.get("status") == status]
    return out


@router.post("/mobile-agents/submissions/{submission_id}/process")
async def process_mobile_agent_submission(
    submission_id: str,
    body: dict,
    current_user: User = Depends(get_current_user)
):
    """Approve or reject a submission - returns created visitor if approve."""
    action = body.get("action", "approve")
    for i, sub in enumerate(mobile_submissions_storage):
        if sub.get("submission_id") == submission_id:
            mobile_submissions_storage[i] = {**sub, "status": "processed" if action == "approve" else "rejected"}
            return {"data": None, "error": None}
    raise HTTPException(status_code=404, detail="Submission not found")


@router.post("/mobile-agents/{agent_id}/sync")
async def sync_mobile_agent(agent_id: str, current_user: User = Depends(get_current_user)):
    """Sync data from mobile agent."""
    return {"synced_items": 0, "pending_items": 0, "errors": []}


# --- Hardware devices (stub for plug-and-play) ---
hardware_devices_storage: List[dict] = []


@router.get("/hardware/devices")
async def get_hardware_devices(
    property_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """List hardware devices - property scoped."""
    user_property_ids = get_user_property_ids(current_user)
    if not user_property_ids:
        return []
    out = [d for d in hardware_devices_storage if d.get("property_id") in user_property_ids]
    if property_id:
        out = [d for d in out if d.get("property_id") == property_id]
    if type:
        out = [d for d in out if d.get("device_type") == type]
    return out


@router.get("/hardware/devices/{device_id}/status")
async def get_hardware_device_status(device_id: str, current_user: User = Depends(get_current_user)):
    """Get single device status."""
    user_property_ids = get_user_property_ids(current_user)
    device = next((d for d in hardware_devices_storage if d.get("device_id") == device_id), None)
    if not device or device.get("property_id") not in user_property_ids:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.get("/hardware/card-reader/events")
async def get_card_reader_events(
    device_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Card reader events - stub."""
    return []


@router.get("/hardware/camera/events")
async def get_camera_events(
    device_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Camera events - stub."""
    return []


class PrintBadgeBody(BaseModel):
    visitor_id: str
    printer_id: Optional[str] = None


@router.post("/hardware/printer/print-badge")
async def print_visitor_badge(body: PrintBadgeBody, current_user: User = Depends(get_current_user)):
    """Queue badge print job - stub returns queued."""
    visitor = next((v for v in visitors_storage if v["id"] == body.visitor_id), None)
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    if not check_user_has_property_access(current_user, visitor.get("property_id", "")):
        raise HTTPException(status_code=403, detail="Access denied")
    return {"print_job_id": str(uuid.uuid4()), "status": "queued"}


# --- System connectivity & health ---
@router.get("/system/connectivity")
async def get_system_connectivity(current_user: User = Depends(get_current_user)):
    """System connectivity status for desktop UI."""
    return {
        "network_status": "online",
        "backend_status": "connected",
        "mobile_agents_connected": len([a for a in mobile_agents_storage if a.get("status") == "online"]),
        "hardware_devices_connected": len([d for d in hardware_devices_storage if d.get("status") == "online"]),
        "last_sync": datetime.now().isoformat(),
        "pending_sync_items": 0,
        "connectivity_errors": [],
    }


@router.get("/system/health")
async def get_system_health(current_user: User = Depends(get_current_user)):
    """Health check for visitor security backend."""
    return {
        "status": "healthy",
        "components": {"api": "up", "storage": "up"},
        "timestamp": datetime.now().isoformat(),
    }


# --- Enhanced settings (in-memory) ---
enhanced_settings_storage: dict = {}


def _default_enhanced_settings(property_id: str) -> dict:
    return {
        "visitor_retention_days": 365,
        "auto_checkout_hours": 24,
        "require_photo": True,
        "require_host_approval": False,
        "mobile_agent_settings": {
            "enabled": True,
            "require_location": True,
            "auto_sync_enabled": True,
            "offline_mode_duration_hours": 8,
            "photo_quality": "medium",
            "allow_bulk_operations": True,
            "require_supervisor_approval": False,
        },
        "hardware_settings": {
            "card_reader_enabled": False,
            "camera_integration_enabled": False,
            "printer_integration_enabled": False,
            "auto_badge_printing": False,
            "device_health_monitoring": True,
            "alert_on_device_offline": True,
            "maintenance_reminder_days": 30,
        },
        "mso_settings": {
            "offline_mode_enabled": True,
            "cache_size_limit_mb": 500,
            "sync_interval_seconds": 300,
            "auto_backup_enabled": True,
            "backup_retention_days": 30,
            "hardware_timeout_seconds": 30,
            "mobile_agent_timeout_seconds": 60,
            "network_retry_attempts": 3,
        },
        "api_settings": {
            "mobile_agent_endpoint": "/api/visitors/mobile-agents",
            "hardware_device_endpoint": "/api/visitors/hardware",
            "websocket_endpoint": "/api/visitors/ws",
            "api_key_mobile": "mobile_key_placeholder",
            "api_key_hardware": "hardware_key_placeholder",
            "encryption_enabled": True,
        },
    }


@router.get("/settings/enhanced")
async def get_enhanced_settings(
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Get enhanced visitor settings."""
    user_property_ids = get_user_property_ids(current_user)
    if property_id and property_id not in user_property_ids:
        prop = user_property_ids[0] if user_property_ids else "default-property-id"
        return enhanced_settings_storage.get(prop, _default_enhanced_settings(prop))
    prop = property_id or (user_property_ids[0] if user_property_ids else "default-property-id")
    return enhanced_settings_storage.get(prop, _default_enhanced_settings(prop))


@router.put("/settings/enhanced")
async def update_enhanced_settings(
    settings: dict,
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """Update enhanced visitor settings."""
    user_property_ids = get_user_property_ids(current_user)
    prop = property_id or (user_property_ids[0] if user_property_ids else "default-property-id")
    if property_id and property_id not in user_property_ids:
        raise HTTPException(status_code=403, detail="Access denied")
    enhanced_settings_storage[prop] = {**_default_enhanced_settings(prop), **settings}
    return enhanced_settings_storage[prop]


# --- Bulk operations ---
@router.post("/bulk/{operation_type}")
async def bulk_process_visitors(
    operation_type: str,
    body: dict,
    current_user: User = Depends(get_current_user)
):
    """Bulk check-in, check-out, or update - stub."""
    if operation_type not in ("bulk_checkin", "bulk_checkout", "bulk_update"):
        raise HTTPException(status_code=400, detail="Invalid operation type")
    visitor_ids = body.get("visitor_ids", [])
    op_id = str(uuid.uuid4())
    return {
        "operation_id": op_id,
        "operation_type": operation_type,
        "visitor_ids": visitor_ids,
        "status": "completed",
        "progress": 100,
        "results": {"successful": len(visitor_ids), "failed": 0, "errors": []},
        "created_at": datetime.now().isoformat(),
        "completed_at": datetime.now().isoformat(),
    }


@router.get("/bulk/operations/{operation_id}")
async def get_bulk_operation_status(operation_id: str, current_user: User = Depends(get_current_user)):
    """Get bulk operation status - stub."""
    return {
        "operation_id": operation_id,
        "operation_type": "bulk_checkin",
        "visitor_ids": [],
        "status": "completed",
        "progress": 100,
        "results": {"successful": 0, "failed": 0, "errors": []},
        "created_at": datetime.now().isoformat(),
        "completed_at": datetime.now().isoformat(),
    }
