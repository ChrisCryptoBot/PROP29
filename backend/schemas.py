from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
import enum

# Enums
class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class IncidentType(str, enum.Enum):
    THEFT = "theft"
    DISTURBANCE = "disturbance"
    MEDICAL = "medical"
    FIRE = "fire"
    FLOOD = "flood"
    CYBER = "cyber"
    GUEST_COMPLAINT = "guest_complaint"
    OTHER = "other"

class IncidentSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    CLOSED = "closed"

class PatrolType(str, enum.Enum):
    SCHEDULED = "scheduled"
    AI_OPTIMIZED = "ai_optimized"
    EMERGENCY = "emergency"
    CUSTOM = "custom"

class PatrolStatus(str, enum.Enum):
    PLANNED = "planned"
    ACTIVE = "active"
    COMPLETED = "completed"
    INTERRUPTED = "interrupted"

class PropertyType(str, enum.Enum):
    HOTEL = "hotel"
    RESORT = "resort"
    CASINO = "casino"
    CRUISE = "cruise"
    VENUE = "venue"

class UserRoleEnum(str, enum.Enum):
    ADMIN = "admin"
    SECURITY_MANAGER = "security_manager"
    GUARD = "guard"
    FRONT_DESK = "front_desk"
    MANAGER = "manager"
    VIEWER = "viewer"

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }

# Authentication schemas
class LoginCredentials(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: UUID
    username: str
    roles: List[str]

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    preferred_language: str = "en"
    timezone: str = "UTC"

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None
    timezone: Optional[str] = None
    profile_image_url: Optional[str] = None

class UserResponse(UserBase):
    user_id: UUID
    status: UserStatus
    profile_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    roles: List[Dict[str, Any]] = []

# Property schemas
class PropertyBase(BaseModel):
    property_name: str
    property_type: PropertyType
    address: Dict[str, Any]
    contact_info: Dict[str, Any]
    room_count: int
    capacity: int
    timezone: str

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    property_name: Optional[str] = None
    property_type: Optional[PropertyType] = None
    address: Optional[Dict[str, Any]] = None
    contact_info: Optional[Dict[str, Any]] = None
    room_count: Optional[int] = None
    capacity: Optional[int] = None
    timezone: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    subscription_tier: Optional[str] = None

class PropertyResponse(PropertyBase):
    property_id: UUID
    settings: Dict[str, Any]
    subscription_tier: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

# Incident schemas
class IncidentBase(BaseModel):
    incident_type: IncidentType
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    title: str
    description: str
    location: Dict[str, Any]

class IncidentCreate(IncidentBase):
    property_id: UUID
    assigned_to: Optional[UUID] = None
    evidence: Optional[Dict[str, Any]] = None
    witnesses: Optional[Dict[str, Any]] = None

class IncidentUpdate(BaseModel):
    incident_type: Optional[IncidentType] = None
    severity: Optional[IncidentSeverity] = None
    status: Optional[IncidentStatus] = None
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    assigned_to: Optional[UUID] = None
    evidence: Optional[Dict[str, Any]] = None
    witnesses: Optional[Dict[str, Any]] = None
    follow_up_required: Optional[bool] = None
    insurance_claim: Optional[bool] = None

class IncidentResponse(IncidentBase):
    incident_id: UUID
    property_id: UUID
    status: IncidentStatus
    reported_by: UUID
    assigned_to: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    evidence: Optional[Dict[str, Any]] = None
    witnesses: Optional[Dict[str, Any]] = None
    ai_confidence: Optional[float] = None
    follow_up_required: bool
    insurance_claim: bool
    reporter_name: Optional[str] = None
    assignee_name: Optional[str] = None
    property_name: Optional[str] = None

# Patrol schemas
class PatrolBase(BaseModel):
    patrol_type: PatrolType = PatrolType.SCHEDULED
    route: Dict[str, Any]
    checkpoints: List[Dict[str, Any]] = []

class PatrolCreate(PatrolBase):
    property_id: UUID
    guard_id: UUID
    observations: Optional[str] = None

class PatrolUpdate(BaseModel):
    patrol_type: Optional[PatrolType] = None
    route: Optional[Dict[str, Any]] = None
    status: Optional[PatrolStatus] = None
    checkpoints: Optional[List[Dict[str, Any]]] = None
    observations: Optional[str] = None
    incidents_found: Optional[List[UUID]] = None
    efficiency_score: Optional[float] = None

class PatrolResponse(PatrolBase):
    patrol_id: UUID
    property_id: UUID
    guard_id: UUID
    status: PatrolStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    ai_priority_score: Optional[float] = None
    observations: Optional[str] = None
    incidents_found: Optional[List[UUID]] = None
    efficiency_score: Optional[float] = None
    guard_name: Optional[str] = None
    property_name: Optional[str] = None

# AI and Analytics schemas
class PredictionResponse(BaseModel):
    date: datetime
    prediction_type: str
    predicted_value: float
    confidence: float
    factors: List[Dict[str, Any]]
    recommendations: List[str]

class IncidentAnalysisResponse(BaseModel):
    incident_id: UUID
    risk_factors: List[Dict[str, Any]]
    similar_incidents: List[Dict[str, Any]]
    prevention_recommendations: List[str]
    ai_insights: Dict[str, Any]
    confidence_score: float

class PatrolOptimizationResponse(BaseModel):
    route_id: UUID
    optimized_route: List[Dict[str, Any]]
    efficiency_improvement: float
    time_saved: int  # minutes
    risk_reduction: float
    recommendations: List[str]

# Metrics schemas
class DashboardMetricsResponse(BaseModel):
    active_incidents: int
    guards_on_duty: int
    ai_optimized_patrols: int
    security_alerts: int
    patrol_efficiency_score: float
    cyber_threats_blocked: int
    guest_safety_score: float
    biometric_access_events: int
    iot_sensor_status: Dict[str, Any]
    response_time_averages: Dict[str, float]
    recent_incidents: List[Dict[str, Any]]
    upcoming_patrols: List[Dict[str, Any]]
    system_status: Dict[str, Any]

class IncidentMetricsResponse(BaseModel):
    total_incidents: int
    incidents_by_type: Dict[str, int]
    incidents_by_severity: Dict[str, int]
    incidents_by_status: Dict[str, int]
    average_resolution_time: float
    incidents_trend: List[Dict[str, Any]]
    top_locations: List[Dict[str, Any]]
    monthly_comparison: Dict[str, Any]

class PatrolMetricsResponse(BaseModel):
    total_patrols: int
    completed_patrols: int
    average_efficiency_score: float
    patrols_by_type: Dict[str, int]
    average_duration: float
    incidents_found: int
    efficiency_trend: List[Dict[str, Any]]
    guard_performance: List[Dict[str, Any]]

# Emergency schemas
class EmergencyAlertCreate(BaseModel):
    property_id: UUID
    alert_type: str
    location: Dict[str, Any]
    description: str
    severity: IncidentSeverity = IncidentSeverity.CRITICAL
    contact_emergency_services: bool = True

class EmergencyAlertResponse(BaseModel):
    alert_id: UUID
    property_id: UUID
    alert_type: str
    location: Dict[str, Any]
    description: str
    severity: IncidentSeverity
    status: str
    created_at: datetime
    emergency_services_contacted: bool
    response_time: Optional[float] = None

# Access Control schemas
class AccessControlEventResponse(BaseModel):
    event_id: UUID
    property_id: UUID
    user_id: Optional[UUID] = None
    guest_id: Optional[UUID] = None
    access_point: str
    access_method: str
    event_type: str
    timestamp: datetime
    location: Dict[str, Any]
    device_info: Optional[Dict[str, Any]] = None
    is_authorized: bool
    alert_triggered: bool
    photo_capture: Optional[str] = None
    user_name: Optional[str] = None
    guest_name: Optional[str] = None

# Guest schemas
class GuestBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    room_number: Optional[str] = None

class GuestCreate(GuestBase):
    property_id: UUID
    check_in_date: Optional[datetime] = None
    check_out_date: Optional[datetime] = None
    preferences: Optional[Dict[str, Any]] = None

class GuestUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    room_number: Optional[str] = None
    check_in_date: Optional[datetime] = None
    check_out_date: Optional[datetime] = None
    preferences: Optional[Dict[str, Any]] = None
    safety_concerns: Optional[List[str]] = None

class GuestResponse(GuestBase):
    guest_id: UUID
    property_id: UUID
    check_in_date: Optional[datetime] = None
    check_out_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    preferences: Optional[Dict[str, Any]] = None
    safety_concerns: Optional[List[str]] = None

# System schemas
class SystemLogResponse(BaseModel):
    log_id: UUID
    log_level: str
    message: str
    timestamp: datetime
    service: str
    log_metadata: Optional[Dict[str, Any]] = None
    user_id: Optional[UUID] = None
    property_id: Optional[UUID] = None

class UserActivityResponse(BaseModel):
    activity_id: UUID
    user_id: Optional[UUID] = None
    property_id: UUID
    action_type: str
    resource_type: Optional[str] = None
    resource_id: Optional[UUID] = None
    activity_metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime
    ip_address: str
    user_agent: str
    session_id: Optional[UUID] = None
    duration: Optional[int] = None
    user_name: Optional[str] = None
    property_name: Optional[str] = None 