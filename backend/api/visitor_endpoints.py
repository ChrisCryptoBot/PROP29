from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
from enum import Enum
import uuid

router = APIRouter(prefix="/visitors", tags=["Visitors"])

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

class VisitorResponse(BaseModel):
    id: str
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
# TODO: Replace with database queries
visitors_storage = []
events_storage = []
security_requests_storage = []

@router.get("/", response_model=List[VisitorResponse])
async def get_visitors(
    status: Optional[VisitorStatus] = Query(None, description="Filter by status"),
    event_id: Optional[str] = Query(None, description="Filter by event ID"),
    security_clearance: Optional[SecurityClearance] = Query(None, description="Filter by security clearance")
):
    """Get all visitors with optional filters"""
    filtered = visitors_storage
    if status:
        filtered = [v for v in filtered if v.get("status") == status.value]
    if event_id:
        filtered = [v for v in filtered if v.get("event_id") == event_id]
    if security_clearance:
        filtered = [v for v in filtered if v.get("security_clearance") == security_clearance.value]
    return filtered

@router.post("/", response_model=VisitorResponse)
async def create_visitor(visitor: VisitorCreate):
    """Register a new visitor"""
    visitor_id = str(uuid.uuid4())
    badge_id = f"V{len(visitors_storage) + 1:03d}"
    qr_code = f"VISITOR_{visitor_id[:8].upper()}_QR"
    
    new_visitor = {
        "id": visitor_id,
        **visitor.dict(),
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

@router.get("/{visitor_id}", response_model=VisitorResponse)
async def get_visitor(visitor_id: str):
    """Get a specific visitor by ID"""
    visitor = next((v for v in visitors_storage if v["id"] == visitor_id), None)
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    return visitor

@router.post("/{visitor_id}/check-in", response_model=VisitorResponse)
async def check_in_visitor(visitor_id: str):
    """Check in a visitor"""
    visitor = next((v for v in visitors_storage if v["id"] == visitor_id), None)
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    visitor["status"] = VisitorStatus.CHECKED_IN.value
    visitor["check_in_time"] = datetime.now().isoformat()
    visitor["updated_at"] = datetime.now().isoformat()
    
    return visitor

@router.post("/{visitor_id}/check-out", response_model=VisitorResponse)
async def check_out_visitor(visitor_id: str):
    """Check out a visitor"""
    visitor = next((v for v in visitors_storage if v["id"] == visitor_id), None)
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    visitor["status"] = VisitorStatus.CHECKED_OUT.value
    visitor["check_out_time"] = datetime.now().isoformat()
    visitor["updated_at"] = datetime.now().isoformat()
    
    return visitor

@router.get("/{visitor_id}/qr-code", response_model=QRCodeResponse)
async def get_visitor_qr_code(visitor_id: str):
    """Get QR code for visitor badge (for mobile app display)"""
    visitor = next((v for v in visitors_storage if v["id"] == visitor_id), None)
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    return {
        "visitor_id": visitor_id,
        "qr_code": visitor.get("qr_code", ""),
        "badge_id": visitor.get("badge_id", ""),
        "event_name": visitor.get("event_name"),
        "expires_at": visitor.get("badge_expires_at")
    }

@router.post("/security-requests", response_model=SecurityRequestResponse)
async def create_security_request(request: SecurityRequestCreate):
    """Create a security request from visitor (via mobile app)"""
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
    visitor = next((v for v in visitors_storage if v["id"] == request.visitor_id), None)
    if visitor:
        if "security_requests" not in visitor:
            visitor["security_requests"] = []
        visitor["security_requests"].append(new_request)
    
    return new_request

@router.get("/security-requests", response_model=List[SecurityRequestResponse])
async def get_security_requests(
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority")
):
    """Get all security requests"""
    filtered = security_requests_storage
    if status:
        filtered = [r for r in filtered if r.get("status") == status]
    if priority:
        filtered = [r for r in filtered if r.get("priority") == priority]
    return filtered

@router.post("/events", response_model=EventResponse)
async def create_event(event: EventCreate):
    """Create a new event (wedding, conference, etc.)"""
    event_id = str(uuid.uuid4())
    new_event = {
        "id": event_id,
        **event.dict(),
        "badge_types": [
            {"id": "1", "name": "Guest Ticket", "type": "ticket", "color": "#3b82f6", "access_level": ["lobby", "ballroom"]},
            {"id": "2", "name": "VIP Guest", "type": "vip", "color": "#f59e0b", "access_level": ["lobby", "ballroom", "vip_lounge"]},
            {"id": "3", "name": "Event Staff", "type": "staff", "color": "#10b981", "access_level": ["lobby", "ballroom", "kitchen", "staff_areas"]},
            {"id": "4", "name": "Vendor", "type": "vendor", "color": "#8b5cf6", "access_level": ["lobby", "loading_dock", "ballroom"]}
        ]
    }
    
    events_storage.append(new_event)
    return new_event

@router.get("/events", response_model=List[EventResponse])
async def get_events():
    """Get all events"""
    return events_storage

@router.post("/events/{event_id}/register", response_model=VisitorResponse)
async def register_event_attendee(
    event_id: str,
    visitor: VisitorCreate
):
    """Register an attendee for an event (creates visitor with event badge)"""
    event = next((e for e in events_storage if e["id"] == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    visitor_id = str(uuid.uuid4())
    badge_id = f"EVT{len([v for v in visitors_storage if v.get('event_id') == event_id]) + 1:03d}"
    qr_code = f"{event['type'].upper()}_{visitor_id[:8].upper()}_QR"
    
    # Calculate badge expiration (end of event)
    badge_expires_at = event["end_date"]
    
    new_visitor = {
        "id": visitor_id,
        **visitor.dict(),
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
