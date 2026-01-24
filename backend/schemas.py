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
    PENDING_REVIEW = "pending_review"

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
    SECURITY_OFFICER = "security_officer"
    GUARD = "guard"
    FRONT_DESK = "front_desk"
    MANAGER = "manager"
    VIEWER = "viewer"

# Additional enums for new models
class GuestSafetyEventType(str, enum.Enum):
    PANIC_BUTTON = "panic_button"
    MEDICAL_EMERGENCY = "medical_emergency"
    FALL_DETECTION = "fall_detection"
    DISTRESS_SIGNAL = "distress_signal"
    SAFETY_CHECK = "safety_check"

class GuestSafetySeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

class ResolutionStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    ESCALATED = "escalated"

class ShiftType(str, enum.Enum):
    DAY_SHIFT = "day_shift"
    EVENING_SHIFT = "evening_shift"
    NIGHT_SHIFT = "night_shift"
    CUSTOM = "custom"

class HandoverStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ACKNOWLEDGED = "acknowledged"

class SensorType(str, enum.Enum):
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    SMOKE = "smoke"
    WATER = "water"
    GAS = "gas"
    AIR_QUALITY = "air_quality"
    PRESSURE = "pressure"
    VIBRATION = "vibration"
    LIGHT = "light"
    NOISE = "noise"

class ThreatSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class LockerStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"
    OUT_OF_SERVICE = "out_of_service"

class ParkingStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    MAINTENANCE = "maintenance"

class PackageStatus(str, enum.Enum):
    PENDING = "pending"
    RECEIVED = "received"
    NOTIFIED = "notified"
    DELIVERED = "delivered"
    EXPIRED = "expired"

class LostFoundStatus(str, enum.Enum):
    LOST = "lost"
    FOUND = "found"
    CLAIMED = "claimed"
    DONATED = "donated"

class VisitorStatus(str, enum.Enum):
    EXPECTED = "expected"
    ARRIVED = "arrived"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    DENIED = "denied"

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
    property_id: str
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
    source: Optional[str] = None
    source_agent_id: Optional[str] = None
    source_device_id: Optional[str] = None
    source_metadata: Optional[Dict[str, Any]] = None

class IncidentCreate(IncidentBase):
    property_id: UUID
    assigned_to: Optional[UUID] = None
    evidence: Optional[Dict[str, Any]] = None
    witnesses: Optional[Dict[str, Any]] = None
    idempotency_key: Optional[str] = None

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
    source: Optional[str] = None
    source_agent_id: Optional[str] = None
    source_device_id: Optional[str] = None
    source_metadata: Optional[Dict[str, Any]] = None

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
    idempotency_key: Optional[str] = None

# Patrol schemas
class PatrolBase(BaseModel):
    patrol_type: PatrolType = PatrolType.SCHEDULED
    route: Dict[str, Any]
    checkpoints: List[Dict[str, Any]] = []

class PatrolCreate(PatrolBase):
    property_id: Optional[str] = None
    guard_id: Optional[UUID] = None
    template_id: Optional[UUID] = None

class PatrolUpdate(BaseModel):
    guard_id: Optional[UUID] = None
    patrol_type: Optional[PatrolType] = None
    route: Optional[Dict[str, Any]] = None
    status: Optional[PatrolStatus] = None
    checkpoints: Optional[List[Dict[str, Any]]] = None
    observations: Optional[str] = None
    incidents_found: Optional[List[UUID]] = None
    efficiency_score: Optional[float] = None
    template_id: Optional[UUID] = None
    version: Optional[int] = None

class PatrolCheckpointCheckIn(BaseModel):
    method: Optional[str] = None
    device_id: Optional[str] = None
    request_id: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    completed_by: Optional[str] = None

class PatrolEmergencyAlert(BaseModel):
    patrol_id: Optional[UUID] = None
    property_id: Optional[str] = None
    severity: Optional[str] = "critical"
    message: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    device_id: Optional[str] = None

class PatrolResponse(PatrolBase):
    patrol_id: UUID
    property_id: str
    guard_id: Optional[UUID] = None
    template_id: Optional[UUID] = None
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
    version: Optional[int] = None

# Patrol Route Schemas
class PatrolRouteCreate(BaseModel):
    property_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    description: Optional[str] = None
    checkpoints: List[Dict[str, Any]] = []
    estimated_duration: Optional[str] = None
    difficulty: Optional[str] = "medium"
    frequency: Optional[str] = "daily"

class PatrolRouteUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    checkpoints: Optional[List[Dict[str, Any]]] = None
    estimated_duration: Optional[str] = None
    difficulty: Optional[str] = None
    frequency: Optional[str] = None
    is_active: Optional[bool] = None

class PatrolRouteResponse(PatrolRouteCreate):
    route_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None

# Patrol Template Schemas
class PatrolTemplateCreate(BaseModel):
    property_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    description: Optional[str] = None
    route_id: UUID
    assigned_officers: List[UUID] = []
    schedule: Dict[str, Any] = {}
    priority: Optional[str] = "medium"
    is_recurring: bool = False

class PatrolTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    route_id: Optional[UUID] = None
    assigned_officers: Optional[List[UUID]] = None
    schedule: Optional[Dict[str, Any]] = None
    priority: Optional[str] = None
    is_recurring: Optional[bool] = None

class PatrolTemplateResponse(PatrolTemplateCreate):
    template_id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None

    class Config:
        from_attributes = True

# Patrol Settings Schemas
class PatrolSettingsSchema(BaseModel):
    default_patrol_duration_minutes: int = 45
    patrol_frequency: str = "hourly"
    shift_handover_time: str = "06:00"
    emergency_response_minutes: int = 2
    patrol_buffer_minutes: int = 5
    max_concurrent_patrols: int = 5
    real_time_sync: bool = True
    offline_mode: bool = True
    auto_schedule_updates: bool = True
    push_notifications: bool = True
    location_tracking: bool = True
    emergency_alerts: bool = True
    checkpoint_missed_alert: bool = True
    patrol_completion_notification: bool = False
    shift_change_alerts: bool = False
    route_deviation_alert: bool = False
    system_status_alerts: bool = False
    gps_tracking: bool = True
    biometric_verification: bool = False
    auto_report_generation: bool = False
    audit_logging: bool = True
    two_factor_auth: bool = False
    session_timeout: bool = True
    ip_whitelist: bool = False
    mobile_app_sync: bool = True
    api_integration: bool = True
    database_sync: bool = True
    webhook_support: bool = False
    cloud_backup: bool = True
    role_based_access: bool = True
    data_encryption: bool = True
    heartbeat_offline_threshold_minutes: int = 15

class PatrolSettingsUpdate(PatrolSettingsSchema):
    pass

class PatrolSettingsResponse(PatrolSettingsSchema):
    settings_id: UUID
    property_id: str
    updated_at: datetime

    class Config:
        from_attributes = True

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

# Incident Settings schemas
class IncidentSettings(BaseModel):
    """Settings for incident management"""
    data_retention_days: Optional[int] = 365
    auto_escalation_enabled: Optional[bool] = False
    auto_assign_enabled: Optional[bool] = False
    notification_preferences: Optional[Dict[str, Any]] = {}
    reporting: Optional[Dict[str, Any]] = {}
    ai_classification: Optional[Dict[str, Any]] = {}
    session_timeout: Optional[int] = 30
    encrypt_data: Optional[bool] = True
    audit_log_access: Optional[bool] = True

class IncidentSettingsResponse(BaseModel):
    """Response for incident settings"""
    settings: IncidentSettings
    property_id: UUID
    updated_at: datetime
    updated_by: UUID

# Pattern Recognition schemas
class PatternRecognitionRequest(BaseModel):
    """Request for pattern recognition analysis"""
    time_range: Optional[str] = "30d"  # e.g., "7d", "30d", "90d"
    property_id: Optional[UUID] = None
    analysis_types: Optional[List[str]] = ["location_patterns", "temporal_patterns", "severity_trends"]

class Pattern(BaseModel):
    """A detected pattern"""
    type: str  # "location_pattern", "temporal_pattern", "severity_trend"
    confidence: float  # 0-1
    insight: str
    recommendations: List[str]
    affected_incidents: List[UUID]

class PatternRecognitionResponse(BaseModel):
    """Response for pattern recognition"""
    patterns: List[Pattern]
    generated_at: datetime
    time_range: str

# Report Export schemas
class ReportExportRequest(BaseModel):
    """Request for report export"""
    format: str  # "pdf" or "csv"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    filters: Optional[Dict[str, Any]] = None

# Access Control schemas
class AccessControlEventCreate(BaseModel):
    property_id: str
    user_id: Optional[str] = None
    guest_id: Optional[str] = None
    access_point: str
    access_method: str
    event_type: str
    location: Dict[str, Any]
    device_info: Optional[Dict[str, Any]] = None
    is_authorized: bool
    alert_triggered: bool = False
    photo_capture: Optional[str] = None

class AccessControlEventResponse(BaseModel):
    event_id: str
    property_id: str
    user_id: Optional[str] = None
    guest_id: Optional[str] = None
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
    # Agent/Mobile Device Support
    source: Optional[str] = "manager"
    source_agent_id: Optional[str] = None
    source_device_id: Optional[str] = None
    source_metadata: Optional[Dict[str, Any]] = None
    idempotency_key: Optional[str] = None
    review_status: Optional[str] = "approved"
    rejection_reason: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None

class AccessPointSchema(BaseModel):
    id: str
    name: str
    location: str
    type: str
    status: str
    accessMethod: str
    lastAccess: Optional[str] = None
    accessCount: int = 0
    permissions: List[str] = []
    securityLevel: str = "medium"
    isOnline: Optional[bool] = None
    sensorStatus: Optional[str] = None
    powerSource: Optional[str] = None
    batteryLevel: Optional[int] = None
    lastStatusChange: Optional[str] = None
    groupId: Optional[str] = None
    zoneId: Optional[str] = None
    cachedEvents: Optional[List[Dict[str, Any]]] = None
    permanentAccess: Optional[bool] = None
    hardwareVendor: Optional[str] = None
    ipAddress: Optional[str] = None

class AccessPointCreate(BaseModel):
    name: str
    location: str
    type: str
    status: str = "active"
    accessMethod: str = "card"
    accessCount: int = 0
    permissions: List[str] = []
    securityLevel: str = "medium"
    isOnline: Optional[bool] = True
    sensorStatus: Optional[str] = None
    powerSource: Optional[str] = None
    batteryLevel: Optional[int] = None
    groupId: Optional[str] = None
    zoneId: Optional[str] = None
    cachedEvents: Optional[List[Dict[str, Any]]] = None
    permanentAccess: Optional[bool] = None
    hardwareVendor: Optional[str] = None
    ipAddress: Optional[str] = None

class AccessPointUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    accessMethod: Optional[str] = None
    accessCount: Optional[int] = None
    permissions: Optional[List[str]] = None
    securityLevel: Optional[str] = None
    isOnline: Optional[bool] = None
    sensorStatus: Optional[str] = None
    powerSource: Optional[str] = None
    batteryLevel: Optional[int] = None
    groupId: Optional[str] = None
    zoneId: Optional[str] = None
    cachedEvents: Optional[List[Dict[str, Any]]] = None
    permanentAccess: Optional[bool] = None
    hardwareVendor: Optional[str] = None
    ipAddress: Optional[str] = None

class AccessControlUserSchema(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: str
    status: str
    accessLevel: str
    lastAccess: Optional[str] = None
    accessCount: int = 0
    avatar: str = ""
    permissions: List[str] = []
    phone: Optional[str] = None
    employeeId: Optional[str] = None
    accessSchedule: Optional[Dict[str, Any]] = None
    temporaryAccesses: Optional[List[Dict[str, Any]]] = None
    autoRevokeAtCheckout: Optional[bool] = False

class AccessControlUserCreate(BaseModel):
    name: str
    email: str
    role: str
    department: str
    status: str = "active"
    accessLevel: str = "standard"
    accessCount: int = 0
    avatar: Optional[str] = ""
    permissions: List[str] = []
    phone: Optional[str] = None
    employeeId: Optional[str] = None
    accessSchedule: Optional[Dict[str, Any]] = None
    temporaryAccesses: Optional[List[Dict[str, Any]]] = None
    autoRevokeAtCheckout: Optional[bool] = False

class AccessControlUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    accessLevel: Optional[str] = None
    accessCount: Optional[int] = None
    avatar: Optional[str] = None
    permissions: Optional[List[str]] = None
    phone: Optional[str] = None
    employeeId: Optional[str] = None
    accessSchedule: Optional[Dict[str, Any]] = None
    temporaryAccesses: Optional[List[Dict[str, Any]]] = None
    autoRevokeAtCheckout: Optional[bool] = None

class AccessEventSchema(BaseModel):
    id: str
    userId: str
    userName: str
    accessPointId: str
    accessPointName: str
    action: str
    timestamp: str
    reason: Optional[str] = None
    location: str
    accessMethod: str

class AccessMetricsResponse(BaseModel):
    totalAccessPoints: int
    activeAccessPoints: int
    totalUsers: int
    activeUsers: int
    todayAccessEvents: int
    deniedAccessEvents: int
    averageResponseTime: str
    systemUptime: str
    topAccessPoints: List[Dict[str, Any]]
    recentAlerts: int
    securityScore: int
    lastSecurityScan: str

class AccessControlEmergencyRequest(BaseModel):
    property_id: Optional[str] = None
    reason: Optional[str] = None
    timeout_minutes: Optional[int] = None

class AccessControlEmergencyResponse(BaseModel):
    mode: str
    initiated_by: Optional[str] = None
    reason: Optional[str] = None
    timestamp: str
    timeout_minutes: Optional[int] = None
    expires_at: Optional[str] = None

class AccessControlSyncEventsRequest(BaseModel):
    access_point_id: str
    events: List[Dict[str, Any]]

class AgentEventCreate(BaseModel):
    """Schema for agent mobile device event submissions"""
    property_id: UUID
    user_id: Optional[UUID] = None
    guest_id: Optional[UUID] = None
    access_point: str
    access_method: str
    event_type: str
    timestamp: datetime
    location: Dict[str, Any]
    is_authorized: bool
    photo_capture: Optional[str] = None
    source_agent_id: UUID  # Required for agent events
    source_device_id: str  # Mobile device identifier
    source_metadata: Optional[Dict[str, Any]] = None
    idempotency_key: str  # Required for duplicate detection
    description: Optional[str] = None  # Agent's description of the event

class AccessControlAuditCreate(BaseModel):
    property_id: Optional[str] = None
    actor: Optional[str] = None
    action: str
    status: str = "info"
    target: Optional[str] = None
    reason: Optional[str] = None
    source: Optional[str] = None  # 'web_admin' | 'mobile_agent' | 'system'; default web_admin

class AccessControlAuditResponse(BaseModel):
    audit_id: str
    timestamp: datetime
    actor: str
    action: str
    status: str
    target: Optional[str] = None
    reason: Optional[str] = None

class DigitalKeyCreate(BaseModel):
    user_id: Optional[UUID] = None
    guest_id: Optional[UUID] = None
    property_id: UUID
    access_points: List[str]
    validity_hours: int = 24

class DigitalKeyResponse(BaseModel):
    key_id: str
    key_token: str
    user_id: Optional[UUID] = None
    guest_id: Optional[UUID] = None
    property_id: UUID
    access_points: List[str]
    created_at: datetime
    expires_at: datetime
    is_active: bool

# Guest Safety schemas
class GuestSafetyEventCreate(BaseModel):
    property_id: UUID
    guest_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    event_type: GuestSafetyEventType
    severity_level: GuestSafetySeverity = GuestSafetySeverity.MEDIUM
    location: Dict[str, Any]
    description: Optional[str] = None
    coordinates: Optional[Dict[str, Any]] = None
    device_info: Optional[Dict[str, Any]] = None
    emergency_contacts_notified: bool = False
    response_time_minutes: Optional[float] = None
    resolution_status: ResolutionStatus = ResolutionStatus.PENDING

class GuestSafetyEventResponse(BaseModel):
    event_id: UUID
    property_id: UUID
    guest_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    event_type: GuestSafetyEventType
    severity_level: GuestSafetySeverity
    timestamp: datetime
    location: Dict[str, Any]
    description: Optional[str] = None
    coordinates: Optional[Dict[str, Any]] = None
    device_info: Optional[Dict[str, Any]] = None
    emergency_contacts_notified: bool
    response_time_minutes: Optional[float] = None
    resolution_status: ResolutionStatus


# Guest Safety Incident schemas (frontend/admin interface)
class GuestSafetyIncidentCreate(BaseModel):
    title: str
    description: str
    location: str
    severity: GuestSafetySeverity = GuestSafetySeverity.MEDIUM
    status: str = "reported"
    reported_by: Optional[str] = None
    guest_involved: Optional[str] = None
    room_number: Optional[str] = None
    contact_info: Optional[str] = None
    assigned_team: Optional[str] = None


class GuestSafetyIncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    severity: Optional[GuestSafetySeverity] = None
    status: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    guest_involved: Optional[str] = None
    room_number: Optional[str] = None
    contact_info: Optional[str] = None
    assigned_team: Optional[str] = None


class GuestSafetyIncidentResponse(BaseModel):
    id: str
    title: str
    description: str
    location: str
    severity: GuestSafetySeverity
    status: str
    reported_by: Optional[str] = None
    reported_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    guest_involved: Optional[str] = None
    room_number: Optional[str] = None
    contact_info: Optional[str] = None
    assigned_team: Optional[str] = None


class GuestSafetyTeamResponse(BaseModel):
    id: str
    name: str
    role: str
    status: str
    avatar: str


class GuestSafetySettingsUpdate(BaseModel):
    alertThreshold: Optional[int] = None
    autoEscalation: Optional[bool] = None
    notificationChannels: Optional[Dict[str, bool]] = None
    responseTeamAssignment: Optional[str] = None


class GuestSafetySettingsResponse(BaseModel):
    alertThreshold: int
    autoEscalation: bool
    notificationChannels: Dict[str, bool]
    responseTeamAssignment: str

class EmergencyContactCreate(BaseModel):
    guest_id: UUID
    name: str
    relationship: str
    phone: str
    email: Optional[str] = None
    is_primary: bool = False

# IoT Environmental schemas
class IoTEnvironmentalDataCreate(BaseModel):
    sensor_id: str
    sensor_type: SensorType
    location: Any
    camera_id: Optional[UUID] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    air_quality: Optional[float] = None
    smoke_level: Optional[float] = None
    water_level: Optional[float] = None
    gas_level: Optional[float] = None
    pressure: Optional[float] = None
    vibration: Optional[float] = None
    battery_level: Optional[float] = None
    signal_strength: Optional[float] = None
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None

class IoTEnvironmentalDataResponse(BaseModel):
    data_id: UUID
    property_id: UUID
    sensor_id: str
    sensor_type: SensorType
    location: Any
    camera_id: Optional[UUID] = None
    camera_name: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    light_level: Optional[float] = None
    noise_level: Optional[float] = None
    timestamp: datetime
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    air_quality: Optional[float] = None
    smoke_level: Optional[float] = None
    water_level: Optional[float] = None
    gas_level: Optional[float] = None
    pressure: Optional[float] = None
    vibration: Optional[float] = None
    battery_level: Optional[float] = None
    signal_strength: Optional[float] = None
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None
    alerts_triggered: Optional[List[str]] = None
    status: str

class SensorAlertCreate(BaseModel):
    sensor_id: str
    alert_type: str
    severity: ThreatSeverity = ThreatSeverity.MEDIUM
    description: str
    location: Any
    camera_id: Optional[UUID] = None


class SensorAlertUpdate(BaseModel):
    status: Optional[str] = None
    resolved: Optional[bool] = None


class SensorAlertResponse(BaseModel):
    alert_id: UUID
    property_id: UUID
    sensor_id: str
    camera_id: Optional[UUID] = None
    camera_name: Optional[str] = None
    alert_type: str
    severity: ThreatSeverity
    message: str
    location: Any
    light_level: Optional[float] = None
    noise_level: Optional[float] = None
    status: str
    resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None


class IoTEnvironmentalSettingsUpdate(BaseModel):
    temperatureUnit: Optional[str] = None
    refreshInterval: Optional[str] = None
    enableNotifications: Optional[bool] = None
    criticalAlertsOnly: Optional[bool] = None
    autoAcknowledge: Optional[bool] = None
    dataRetention: Optional[str] = None
    alertSoundEnabled: Optional[bool] = None
    emailNotifications: Optional[bool] = None


class IoTEnvironmentalSettingsResponse(BaseModel):
    temperatureUnit: str
    refreshInterval: str
    enableNotifications: bool
    criticalAlertsOnly: bool
    autoAcknowledge: bool
    dataRetention: str
    alertSoundEnabled: bool
    emailNotifications: bool

# Digital Handover schemas
# Digital Handover Schemas
class HandoverChecklistItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    priority: str = "medium"
    assignedTo: Optional[str] = None
    dueDate: Optional[datetime] = None

class HandoverChecklistItemCreate(HandoverChecklistItemBase):
    pass

class HandoverChecklistItemResponse(HandoverChecklistItemBase):
    id: str = Field(..., alias="item_id")
    handover_id: str
    status: str
    completedAt: Optional[datetime] = None
    completedBy: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class HandoverBase(BaseModel):
    shiftType: str
    handoverFrom: str
    handoverTo: str
    handoverDate: datetime
    startTime: str
    endTime: str
    priority: str = "medium"
    handoverNotes: Optional[str] = None
    incidentsSummary: Optional[str] = None
    specialInstructions: Optional[str] = None
    equipmentStatus: str = "operational"

class HandoverCreate(HandoverBase):
    property_id: UUID
    checklist_items: List[HandoverChecklistItemCreate] = []

class HandoverUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    handoverNotes: Optional[str] = None
    verificationStatus: Optional[str] = None
    handoverRating: Optional[float] = None
    feedback: Optional[str] = None
    incidentsSummary: Optional[str] = None
    specialInstructions: Optional[str] = None
    equipmentStatus: Optional[str] = None

class HandoverResponse(HandoverBase):
    id: str = Field(..., alias="handover_id")
    property_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
    completedAt: Optional[datetime] = None
    completedBy: Optional[str] = None
    verifiedAt: Optional[datetime] = None
    verifiedBy: Optional[str] = None
    signatureFrom: Optional[str] = None
    signatureTo: Optional[str] = None
    verificationStatus: str
    handoverRating: Optional[float] = None
    feedback: Optional[str] = None
    checklist_items: List[HandoverChecklistItemResponse] = []

    class Config:
        from_attributes = True
        populate_by_name = True

class HandoverSettingsUpdate(BaseModel):
    shiftConfigurations: Optional[Dict[str, Any]] = None
    notificationSettings: Optional[Dict[str, Any]] = None
    templateSettings: Optional[Dict[str, Any]] = None

class HandoverSettingsResponse(BaseModel):
    settings_id: str
    property_id: UUID
    shiftConfigurations: Dict[str, Any]
    notificationSettings: Dict[str, Any]
    templateSettings: Dict[str, Any]
    updated_at: datetime

    class Config:
        from_attributes = True

class HandoverMetricsResponse(BaseModel):
    totalHandovers: int
    completedHandovers: int
    pendingHandovers: int
    overdueHandovers: int
    averageCompletionTime: str
    completionRate: float
    handoversByShift: Dict[str, int]
    handoversByStatus: Dict[str, int]
    monthlyHandovers: List[Dict[str, Any]]
    checklistCompletionRate: float
    averageRating: float

class HandoverTemplateItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    priority: str = "medium"
    assignedTo: Optional[str] = None

class HandoverTemplateItemCreate(HandoverTemplateItemBase):
    pass

class HandoverTemplateItemResponse(HandoverTemplateItemBase):
    id: str = Field(..., alias="item_id")
    template_id: str

    class Config:
        from_attributes = True
        populate_by_name = True

class HandoverTemplateBase(BaseModel):
    name: str
    category: str
    operationalPost: Optional[str] = None
    isDefault: bool = False

class HandoverTemplateCreate(HandoverTemplateBase):
    property_id: UUID
    items: List[HandoverTemplateItemCreate] = []

class HandoverTemplateResponse(HandoverTemplateBase):
    id: str = Field(..., alias="template_id")
    property_id: UUID
    items: List[HandoverTemplateItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

# Equipment Schemas
class EquipmentBase(BaseModel):
    name: str
    category: str
    status: str = "operational"
    location: Optional[str] = None

class EquipmentCreate(EquipmentBase):
    property_id: UUID

class EquipmentResponse(EquipmentBase):
    id: str
    property_id: UUID
    last_check_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Maintenance Request Schemas
class MaintenanceRequestBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    status: str = "pending"
    location: Optional[str] = None
    equipment_id: Optional[str] = None

class MaintenanceRequestCreate(MaintenanceRequestBase):
    property_id: UUID

class MaintenanceRequestResponse(MaintenanceRequestBase):
    id: str
    property_id: UUID
    reported_by: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Smart Locker schemas
class SmartLockerCreate(BaseModel):
    property_id: UUID
    locker_number: str
    location: Dict[str, Any]
    size: str
    current_guest_id: Optional[UUID] = None

class SmartLockerResponse(BaseModel):
    locker_id: UUID
    property_id: UUID
    locker_number: str
    location: Dict[str, Any]
    status: LockerStatus
    size: str
    current_guest_id: Optional[UUID] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    iot_sensor_data: Optional[Dict[str, Any]] = None
    last_maintenance: Optional[datetime] = None
    next_maintenance: Optional[datetime] = None
    battery_level: Optional[float] = None
    signal_strength: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class LockerReleaseRequest(BaseModel):
    reason: Optional[str] = None


class LockerReleaseResponse(BaseModel):
    locker_id: UUID
    locker_number: str
    released: bool
    bridge_status: Optional[str] = None
    message: Optional[str] = None

# Smart Parking schemas
class SmartParkingCreate(BaseModel):
    property_id: UUID
    spot_number: str
    location: Dict[str, Any]
    spot_type: str
    current_guest_id: Optional[UUID] = None

class SmartParkingResponse(BaseModel):
    parking_id: UUID
    property_id: UUID
    spot_number: str
    location: Dict[str, Any]
    status: ParkingStatus
    spot_type: str
    current_guest_id: Optional[UUID] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    iot_sensor_data: Optional[Dict[str, Any]] = None
    last_maintenance: Optional[datetime] = None
    next_maintenance: Optional[datetime] = None
    battery_level: Optional[float] = None
    signal_strength: Optional[float] = None
    created_at: datetime
    updated_at: datetime

# Banned Individual schemas
class BannedIndividualCreate(BaseModel):
    property_id: UUID
    first_name: str
    last_name: str
    date_of_birth: Optional[datetime] = None
    photo_url: Optional[str] = None
    facial_recognition_data: Optional[Dict[str, Any]] = None
    reason_for_ban: str
    ban_end_date: Optional[datetime] = None
    is_permanent: bool = False
    notes: Optional[str] = None

class BannedIndividualResponse(BaseModel):
    banned_id: UUID
    property_id: UUID
    first_name: str
    last_name: str
    date_of_birth: Optional[datetime] = None
    photo_url: Optional[str] = None
    facial_recognition_data: Optional[Dict[str, Any]] = None
    reason_for_ban: str
    ban_start_date: datetime
    ban_end_date: Optional[datetime] = None
    is_permanent: bool
    added_by: UUID
    detection_count: int
    last_detection: Optional[datetime] = None
    notes: Optional[str] = None
    is_active: bool

# Package schemas
class PackageCreate(BaseModel):
    property_id: UUID
    guest_id: Optional[UUID] = None
    tracking_number: Optional[str] = None
    sender_name: Optional[str] = None
    sender_contact: Optional[str] = None
    description: Optional[str] = None
    size: Optional[str] = None
    weight: Optional[float] = None
    location: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None

class PackageUpdate(BaseModel):
    guest_id: Optional[UUID] = None
    tracking_number: Optional[str] = None
    sender_name: Optional[str] = None
    sender_contact: Optional[str] = None
    description: Optional[str] = None
    size: Optional[str] = None
    weight: Optional[float] = None
    status: Optional[PackageStatus] = None
    location: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    delivered_to: Optional[str] = None

class PackageResponse(BaseModel):
    package_id: UUID
    property_id: UUID
    guest_id: Optional[UUID] = None
    tracking_number: Optional[str] = None
    sender_name: Optional[str] = None
    sender_contact: Optional[str] = None
    description: Optional[str] = None
    size: Optional[str] = None
    weight: Optional[float] = None
    status: PackageStatus
    received_at: datetime
    notified_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    delivered_to: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    received_by: Optional[UUID] = None

# Lost & Found schemas
class LostFoundMetrics(BaseModel):
    total: int
    found: int
    claimed: int
    expired: int
    donated: int
    notifications_sent: int = 0
    recovery_rate: float
    avg_days_to_claim: float = 0.0
    total_value_recovered: float = 0.0
    items_by_category: Dict[str, int] = {}
    items_by_status: Dict[str, int] = {}
    recovery_trend: List[Dict[str, Any]] = []

class LostFoundSettings(BaseModel):
    default_retention_period: int = 90
    expiration_warning_days: int = 7
    qr_code_prefix: str = "LF"
    auto_archive_after_days: int = 30
    auto_notification_enabled: bool = True
    ai_matching_enabled: bool = True
    require_photo_documentation: bool = True
    chain_of_custody_tracking: bool = True
    high_value_threshold: float = 500.0
    default_disposal_method: str = "Donation"
    notification_templates: Dict[str, str] = {}

class LostFoundSettingsResponse(BaseModel):
    settings: LostFoundSettings
    property_id: Optional[UUID] = None
    updated_at: Optional[datetime] = None

class LostFoundMatch(BaseModel):
    item_id: UUID
    confidence: float
    matched_guest_id: Optional[UUID] = None
    matched_guest_name: Optional[str] = None
    reason: str

class LostFoundMatchRequest(BaseModel):
    item_type: str
    description: str

class LostFoundItemCreate(BaseModel):
    property_id: UUID
    item_type: str
    description: str
    location_found: Optional[Dict[str, Any]] = None
    location_lost: Optional[Dict[str, Any]] = None
    lost_date: Optional[datetime] = None
    photo_url: Optional[str] = None
    notes: Optional[str] = None
    value_estimate: Optional[float] = None

class LostFoundItemUpdate(BaseModel):
    item_type: Optional[str] = None
    description: Optional[str] = None
    location_found: Optional[Dict[str, Any]] = None
    location_lost: Optional[Dict[str, Any]] = None
    lost_date: Optional[datetime] = None
    status: Optional[LostFoundStatus] = None
    photo_url: Optional[str] = None
    ai_matched_guest_id: Optional[UUID] = None
    notes: Optional[str] = None
    value_estimate: Optional[float] = None

class LostFoundItemResponse(BaseModel):
    item_id: UUID
    property_id: UUID
    item_type: str
    description: str
    location_found: Optional[Dict[str, Any]] = None
    location_lost: Optional[Dict[str, Any]] = None
    found_date: datetime
    lost_date: Optional[datetime] = None
    status: LostFoundStatus
    photo_url: Optional[str] = None
    ai_matched_guest_id: Optional[UUID] = None
    claimed_by_guest_id: Optional[UUID] = None
    claimed_at: Optional[datetime] = None
    found_by: Optional[UUID] = None
    notes: Optional[str] = None
    value_estimate: Optional[float] = None
    property_name: Optional[str] = None
    finder_name: Optional[str] = None
    ai_matched_guest_name: Optional[str] = None
    claimed_by_guest_name: Optional[str] = None

# Visitor schemas
class VisitorCreate(BaseModel):
    property_id: UUID
    guest_id: Optional[UUID] = None
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    purpose: Optional[str] = None
    expected_arrival: Optional[datetime] = None
    photo_url: Optional[str] = None
    facial_recognition_data: Optional[Dict[str, Any]] = None
    access_level: Optional[str] = None
    escorted_by: Optional[UUID] = None
    notes: Optional[str] = None

class VisitorResponse(BaseModel):
    visitor_id: UUID
    property_id: UUID
    guest_id: Optional[UUID] = None
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    purpose: Optional[str] = None
    expected_arrival: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: VisitorStatus
    photo_url: Optional[str] = None
    facial_recognition_data: Optional[Dict[str, Any]] = None
    access_level: Optional[str] = None
    escorted_by: Optional[UUID] = None
    notes: Optional[str] = None
    created_by: UUID

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

# Security Operations Center schemas
class CameraStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"

class CameraCreate(BaseModel):
    name: str
    location: Dict[str, Any] | str
    ip_address: str
    stream_url: str
    credentials: Optional[Dict[str, Any]] = None
    status: Optional[CameraStatus] = None
    is_recording: Optional[bool] = False
    motion_detection_enabled: Optional[bool] = True

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[Dict[str, Any] | str] = None
    ip_address: Optional[str] = None
    stream_url: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None
    status: Optional[CameraStatus] = None
    is_recording: Optional[bool] = None
    motion_detection_enabled: Optional[bool] = None
    hardware_status: Optional[Dict[str, Any]] = None
    last_known_image_url: Optional[str] = None

class CameraResponse(BaseModel):
    camera_id: UUID
    name: str
    location: Dict[str, Any] | str
    ip_address: str
    stream_url: str
    status: CameraStatus
    hardware_status: Optional[Dict[str, Any]] = None
    is_recording: bool
    motion_detection_enabled: bool
    last_known_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class CameraHealthResponse(BaseModel):
    camera_id: UUID
    last_ping_at: Optional[datetime] = None
    last_metrics_at: Optional[datetime] = None
    last_known_image_url: Optional[str] = None
    status: CameraStatus
    metrics: Optional[Dict[str, Any]] = None
    latency_ms: Optional[float] = None

class CameraMetricsResponse(BaseModel):
    total: int
    online: int
    offline: int
    maintenance: int
    recording: int
    avg_uptime: str

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

class VisitorLogCreate(BaseModel):
    visitor_id: str
    property_id: str
    event_type: str
    timestamp: Optional[datetime] = None
    location: Optional[str] = None
    processed_by: Optional[str] = None
    notes: Optional[str] = None 

# Evacuation schemas
class EvacuationStartRequest(BaseModel):
    notes: Optional[str] = None

class EvacuationEndRequest(BaseModel):
    notes: Optional[str] = None

class EvacuationAnnouncementRequest(BaseModel):
    message: str

class EvacuationAssignAssistanceRequest(BaseModel):
    session_id: Optional[str] = None
    guest_name: str
    room: str
    need: str
    priority: str
    assigned_staff: Optional[str] = None
    notes: Optional[str] = None

class EvacuationCompleteAssistanceRequest(BaseModel):
    assistance_id: str

class EvacuationSessionResponse(BaseModel):
    session_id: str
    property_id: Optional[str] = None
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    initiated_by: Optional[str] = None
    completed_by: Optional[str] = None
    notes: Optional[str] = None

class EvacuationActionResponse(BaseModel):
    action_id: str
    session_id: Optional[str] = None
    action_type: str
    payload: dict
    created_at: datetime
    created_by: Optional[str] = None

# Smart Parking schemas
class ParkingSpaceBase(BaseModel):
    label: str
    zone: Optional[str] = None
    type: str = "regular"

class ParkingSpaceCreate(ParkingSpaceBase):
    property_id: str

class ParkingSpaceUpdate(BaseModel):
    label: Optional[str] = None
    zone: Optional[str] = None
    type: Optional[str] = None
    status: Optional[ParkingStatus] = None

class ParkingSpaceResponse(BaseSchema, ParkingSpaceBase):
    space_id: UUID
    property_id: UUID
    status: ParkingStatus
    current_guest_id: Optional[str] = None
    last_seen: datetime
    iot_sensor_data: Optional[Dict[str, Any]] = None

class LPRIngestion(BaseModel):
    plate: str = Field(..., description="License plate number")
    confidence: float = Field(..., ge=0.0, le=1.0)
    cameraId: str
    timestamp: datetime

class SensorTelemetry(BaseModel):
    spaceId: str
    occupied: bool
    sensorId: str
    timestamp: datetime

class GuestParkingBase(BaseModel):
    guest_name: str
    plate: str
    vehicle_info: Optional[Dict[str, Any]] = None
    space_id: Optional[str] = None
    notes: Optional[str] = None

class GuestParkingCreate(GuestParkingBase):
    property_id: str
    guest_id: Optional[str] = None

class GuestParkingResponse(BaseSchema, GuestParkingBase):
    registration_id: UUID
    property_id: UUID
    guest_id: Optional[UUID] = None
    checkin_at: datetime
    checkout_at: Optional[datetime] = None
    status: str
    valet_status: str

class ParkingBillingResponse(BaseSchema):
    billing_id: UUID
    registration_id: UUID
    amount_cents: int
    currency: str = "USD"
    status: str
    created_at: datetime

class ParkingSettingsBase(BaseModel):
    guest_hourly_rate: int = 500
    guest_daily_rate: int = 4000
    valet_fee: int = 1500
    ev_charging_fee: int = 250
    max_stay_hours: int = 24
    grace_period_minutes: int = 30
    late_fee_rate: float = 1.5
    auto_checkout_enabled: bool = True
    low_occupancy_alert: bool = True
    maintenance_reminders: bool = True
    billing_sync_enabled: bool = True

class ParkingSettingsUpdate(BaseModel):
    guest_hourly_rate: Optional[int] = None
    guest_daily_rate: Optional[int] = None
    valet_fee: Optional[int] = None
    ev_charging_fee: Optional[int] = None
    max_stay_hours: Optional[int] = None
    grace_period_minutes: Optional[int] = None
    late_fee_rate: Optional[float] = None
    auto_checkout_enabled: Optional[bool] = None
    low_occupancy_alert: Optional[bool] = None
    maintenance_reminders: Optional[bool] = None
    billing_sync_enabled: Optional[bool] = None

class ParkingSettingsResponse(BaseSchema, ParkingSettingsBase):
    settings_id: UUID
    property_id: UUID
    updated_at: datetime