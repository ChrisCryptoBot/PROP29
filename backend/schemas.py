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

class CybersecurityThreatType(str, enum.Enum):
    PHISHING = "phishing"
    MALWARE = "malware"
    DDOS = "ddos"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    DATA_BREACH = "data_breach"
    RANSOMWARE = "ransomware"

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
class AccessControlEventCreate(BaseModel):
    property_id: UUID
    user_id: Optional[UUID] = None
    guest_id: Optional[UUID] = None
    access_point: str
    access_method: str
    event_type: str
    location: Dict[str, Any]
    device_info: Optional[Dict[str, Any]] = None
    is_authorized: bool
    alert_triggered: bool = False
    photo_capture: Optional[str] = None

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

class EmergencyContactCreate(BaseModel):
    guest_id: UUID
    name: str
    relationship: str
    phone: str
    email: Optional[str] = None
    is_primary: bool = False

# IoT Environmental schemas
class IoTEnvironmentalDataCreate(BaseModel):
    property_id: UUID
    sensor_id: str
    sensor_type: SensorType
    location: Dict[str, Any]
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

class IoTEnvironmentalDataResponse(BaseModel):
    data_id: UUID
    property_id: UUID
    sensor_id: str
    sensor_type: SensorType
    location: Dict[str, Any]
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
    alerts_triggered: Optional[List[str]] = None
    status: str

class SensorAlertCreate(BaseModel):
    property_id: UUID
    sensor_id: str
    alert_type: str
    severity: ThreatSeverity = ThreatSeverity.MEDIUM
    description: str
    location: Dict[str, Any]

# Digital Handover schemas
class DigitalHandoverCreate(BaseModel):
    property_id: UUID
    from_user_id: UUID
    to_user_id: UUID
    shift_type: ShiftType
    priority_alerts: Optional[List[str]] = None
    pending_incidents: Optional[List[str]] = None
    active_patrols: Optional[List[str]] = None
    system_status: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class DigitalHandoverResponse(BaseModel):
    handover_id: UUID
    property_id: UUID
    from_user_id: UUID
    to_user_id: UUID
    shift_type: ShiftType
    handover_time: datetime
    ai_briefing: Optional[str] = None
    priority_alerts: Optional[List[str]] = None
    pending_incidents: Optional[List[str]] = None
    active_patrols: Optional[List[str]] = None
    system_status: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    status: HandoverStatus

class ShiftBriefingResponse(BaseModel):
    briefing_id: str
    property_id: UUID
    shift_type: ShiftType
    generated_at: datetime
    summary: str
    priority_items: List[str]
    active_incidents: List[Dict[str, Any]]
    pending_patrols: List[Dict[str, Any]]
    system_alerts: List[Dict[str, Any]]
    recommendations: List[str]

# Cybersecurity schemas
class CybersecurityEventCreate(BaseModel):
    property_id: UUID
    threat_type: CybersecurityThreatType
    severity: ThreatSeverity = ThreatSeverity.MEDIUM
    source_ip: Optional[str] = None
    target_system: Optional[str] = None
    description: str
    threat_indicators: Optional[Dict[str, Any]] = None
    ai_confidence: Optional[float] = None

class CybersecurityEventResponse(BaseModel):
    event_id: UUID
    property_id: UUID
    threat_type: CybersecurityThreatType
    severity: ThreatSeverity
    timestamp: datetime
    source_ip: Optional[str] = None
    target_system: Optional[str] = None
    description: str
    threat_indicators: Optional[Dict[str, Any]] = None
    ai_confidence: Optional[float] = None
    blocked: bool
    response_time_seconds: Optional[float] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[UUID] = None
    notes: Optional[str] = None

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