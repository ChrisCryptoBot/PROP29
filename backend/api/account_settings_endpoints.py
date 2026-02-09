"""
Account Settings API — team members, team settings, integrations, role permissions.
Property-scoped where applicable. In-memory storage; ready for DB persistence.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from api.auth_dependencies import get_current_user
from models import User

router = APIRouter(prefix="/account-settings", tags=["Account Settings"])

# --- In-memory storage (per property_id for team/settings/integrations) ---
_team_members: Dict[str, list] = {}
_team_settings: Dict[str, dict] = {}
_integrations: Dict[str, list] = {}
_role_permissions: Dict[str, Dict[str, list]] = {}

def _default_team_members() -> list:
    return [
        {"id": "1", "name": "John Smith", "email": "john.smith@hotel.com", "role": "manager", "department": "Security Operations", "status": "active", "lastActive": "2024-01-15T10:30:00Z", "permissions": ["view_reports", "manage_incidents", "assign_tasks"], "shift": "morning", "phone": "+1 (555) 123-4567"},
        {"id": "2", "name": "Sarah Johnson", "email": "sarah.johnson@hotel.com", "role": "patrol_agent", "department": "Security Operations", "status": "active", "lastActive": "2024-01-15T09:45:00Z", "permissions": ["view_incidents", "create_reports"], "shift": "afternoon", "phone": "+1 (555) 234-5678"},
        {"id": "3", "name": "Mike Davis", "email": "mike.davis@hotel.com", "role": "valet", "department": "Guest Services", "status": "active", "lastActive": "2024-01-15T08:15:00Z", "permissions": ["manage_parking", "guest_services"], "shift": "morning", "phone": "+1 (555) 345-6789"},
        {"id": "4", "name": "Lisa Wilson", "email": "lisa.wilson@hotel.com", "role": "front_desk", "department": "Front Desk", "status": "pending", "lastActive": "2024-01-14T16:20:00Z", "permissions": ["guest_checkin", "visitor_management"], "shift": "afternoon", "phone": "+1 (555) 456-7890"},
    ]

def _default_team_settings() -> dict:
    return {
        "teamName": "Grand Hotel Security Team",
        "hotelName": "Grand Hotel & Resort",
        "timezone": "America/New_York",
        "workingHours": {"start": "06:00", "end": "22:00"},
        "breakPolicy": {"duration": 15, "frequency": 4},
        "overtimePolicy": {"enabled": True, "maxHours": 12, "approvalRequired": True},
        "notificationSettings": {"emailNotifications": True, "smsNotifications": True, "pushNotifications": True, "emergencyAlerts": True},
    }

def _default_integrations() -> list:
    return [
        {"id": "1", "name": "Security Cameras", "type": "camera", "status": "connected", "lastSync": "2024-01-15T10:30:00Z", "endpoint": "192.168.1.100"},
        {"id": "2", "name": "Access Control System", "type": "access_control", "status": "connected", "lastSync": "2024-01-15T10:25:00Z", "endpoint": "192.168.1.101"},
        {"id": "3", "name": "Fire Alarm System", "type": "alarm", "status": "error", "lastSync": "2024-01-14T15:45:00Z", "endpoint": "192.168.1.102"},
        {"id": "4", "name": "Mobile App Integration", "type": "mobile", "status": "connected", "lastSync": "2024-01-15T10:30:00Z", "endpoint": "api.proper29.com"},
    ]

def _get_property_id(current_user: User, property_id: Optional[str] = Query(None)) -> str:
    pid = property_id or getattr(current_user, "property_id", None) or (getattr(current_user, "assigned_property_ids", None) or [None])[0] or (getattr(current_user, "roles", None) or [None])[0]
    return pid or "default-property-id"


# --- Schemas ---
class TeamMemberCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    role: str = "patrol_agent"
    department: str = ""
    phone: str = ""
    shift: str = "morning"
    permissions: List[str] = []

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    phone: Optional[str] = None
    shift: Optional[str] = None
    permissions: Optional[List[str]] = None

class TeamSettingsUpdate(BaseModel):
    teamName: Optional[str] = None
    hotelName: Optional[str] = None
    timezone: Optional[str] = None
    workingHours: Optional[Dict[str, str]] = None
    breakPolicy: Optional[Dict[str, int]] = None
    overtimePolicy: Optional[Dict[str, Any]] = None
    notificationSettings: Optional[Dict[str, bool]] = None

class IntegrationCreate(BaseModel):
    name: str = Field(..., min_length=1)
    type: str = Field(..., pattern="^(camera|access_control|alarm|mobile|reporting)$")
    endpoint: str = Field(..., min_length=1)


# --- Team members ---
@router.get("/team-members")
async def get_team_members(
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    pid = _get_property_id(current_user, property_id)
    if pid not in _team_members:
        _team_members[pid] = _default_team_members()
    return _team_members[pid]

@router.post("/team-members")
async def create_team_member(
    body: TeamMemberCreate,
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    pid = _get_property_id(current_user, property_id)
    if pid not in _team_members:
        _team_members[pid] = _default_team_members()
    import time
    new_id = str(int(time.time() * 1000))
    member = {
        "id": new_id,
        "name": body.name,
        "email": body.email,
        "role": body.role,
        "department": body.department,
        "status": "pending",
        "lastActive": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "permissions": body.permissions or [],
        "shift": body.shift,
        "phone": body.phone or "",
    }
    _team_members[pid].append(member)
    return member

@router.put("/team-members/{member_id}")
async def update_team_member(
    member_id: str,
    body: TeamMemberUpdate,
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    pid = _get_property_id(current_user, property_id)
    if pid not in _team_members:
        _team_members[pid] = _default_team_members()
    for i, m in enumerate(_team_members[pid]):
        if m["id"] == member_id:
            upd = {k: v for k, v in body.dict().items() if v is not None}
            _team_members[pid][i] = {**m, **upd}
            return _team_members[pid][i]
    raise HTTPException(status_code=404, detail="Team member not found")

@router.delete("/team-members/{member_id}")
async def delete_team_member(
    member_id: str,
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    pid = _get_property_id(current_user, property_id)
    if pid not in _team_members:
        _team_members[pid] = _default_team_members()
    for i, m in enumerate(_team_members[pid]):
        if m["id"] == member_id:
            _team_members[pid].pop(i)
            return {"deleted": True, "id": member_id}
    raise HTTPException(status_code=404, detail="Team member not found")


# --- Team settings ---
@router.get("/team-settings")
async def get_team_settings(
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    pid = _get_property_id(current_user, property_id)
    if pid not in _team_settings:
        _team_settings[pid] = _default_team_settings()
    return _team_settings[pid]

@router.put("/team-settings")
async def update_team_settings(
    body: TeamSettingsUpdate,
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    pid = _get_property_id(current_user, property_id)
    if pid not in _team_settings:
        _team_settings[pid] = _default_team_settings()
    upd = {k: v for k, v in body.dict().items() if v is not None}
    for k, v in upd.items():
        if isinstance(v, dict) and k in _team_settings[pid] and isinstance(_team_settings[pid].get(k), dict):
            _team_settings[pid][k] = {**_team_settings[pid][k], **v}
        else:
            _team_settings[pid][k] = v
    return _team_settings[pid]


# --- Integrations ---
@router.get("/integrations")
async def get_integrations(
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    pid = _get_property_id(current_user, property_id)
    if pid not in _integrations:
        _integrations[pid] = _default_integrations()
    return _integrations[pid]

@router.post("/integrations")
async def create_integration(
    body: IntegrationCreate,
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    pid = _get_property_id(current_user, property_id)
    if pid not in _integrations:
        _integrations[pid] = _default_integrations()
    import time
    new_id = str(int(time.time() * 1000))
    item = {
        "id": new_id,
        "name": body.name,
        "type": body.type,
        "status": "connected",
        "lastSync": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "endpoint": body.endpoint,
    }
    _integrations[pid].append(item)
    return item

@router.get("/integrations/{integration_id}/test")
async def test_integration(
    integration_id: str,
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    pid = _get_property_id(current_user, property_id)
    if pid not in _integrations:
        _integrations[pid] = _default_integrations()
    for i in _integrations[pid]:
        if i["id"] == integration_id:
            return {"id": integration_id, "ok": True, "message": "Connection test successful (stub)"}
    raise HTTPException(status_code=404, detail="Integration not found")


# --- Role permissions (stub) ---
@router.get("/role-permissions")
async def get_role_permissions(
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    pid = _get_property_id(current_user, property_id)
    if pid not in _role_permissions:
        _role_permissions[pid] = {}
    return _role_permissions[pid]

@router.put("/role-permissions")
async def update_role_permissions(
    body: Dict[str, List[str]],
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    pid = _get_property_id(current_user, property_id)
    _role_permissions[pid] = body
    return body
