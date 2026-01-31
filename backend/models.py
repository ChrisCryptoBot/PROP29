from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid
from datetime import datetime
import enum

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

class CameraStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"

class EvacuationStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

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

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    profile_image_url = Column(String(500), nullable=True)
    preferred_language = Column(String(5), default="en")
    timezone = Column(String(50), default="UTC")
    
    # Relationships
    user_roles = relationship("UserRole", foreign_keys="UserRole.user_id", back_populates="user", cascade="all, delete-orphan")
    incidents_reported = relationship("Incident", foreign_keys="Incident.reported_by", back_populates="reporter")
    incidents_assigned = relationship("Incident", foreign_keys="Incident.assigned_to", back_populates="assignee")
    patrols = relationship("Patrol", foreign_keys="Patrol.guard_id", back_populates="guard")
    activities = relationship("UserActivity", foreign_keys="UserActivity.user_id", back_populates="user")

class Property(Base):
    __tablename__ = "properties"
    
    property_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_name = Column(String(200), nullable=False)
    property_type = Column(Enum(PropertyType), default=PropertyType.HOTEL)
    address = Column(JSON, nullable=False)
    contact_info = Column(JSON, nullable=False)
    room_count = Column(Integer, nullable=False)
    capacity = Column(Integer, nullable=False)
    timezone = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    settings = Column(JSON, nullable=False, default={})
    subscription_tier = Column(String(50), default="starter")
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user_roles = relationship("UserRole", foreign_keys="UserRole.property_id", back_populates="property", cascade="all, delete-orphan")
    incidents = relationship("Incident", foreign_keys="Incident.property_id", back_populates="property", cascade="all, delete-orphan")
    patrols = relationship("Patrol", foreign_keys="Patrol.property_id", back_populates="property", cascade="all, delete-orphan")
    access_events = relationship("AccessControlEvent", foreign_keys="AccessControlEvent.property_id", back_populates="property", cascade="all, delete-orphan")
    activities = relationship("UserActivity", foreign_keys="UserActivity.property_id", back_populates="property", cascade="all, delete-orphan")

class UserRole(Base):
    __tablename__ = "user_roles"
    
    role_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    role_name = Column(Enum(UserRoleEnum), nullable=False)
    permissions = Column(JSON, nullable=False, default={})
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    assigned_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="user_roles")
    property = relationship("Property", foreign_keys=[property_id], back_populates="user_roles")
    assigned_by_user = relationship("User", foreign_keys=[assigned_by])

class Incident(Base):
    __tablename__ = "incidents"
    
    incident_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    incident_type = Column(Enum(IncidentType), nullable=False)
    severity = Column(Enum(IncidentSeverity), default=IncidentSeverity.MEDIUM)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.OPEN)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(JSON, nullable=False)
    reported_by = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    assigned_to = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    evidence = Column(JSON, nullable=True)
    witnesses = Column(JSON, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    follow_up_required = Column(Boolean, default=False)
    insurance_claim = Column(Boolean, default=False)
    idempotency_key = Column(String(100), nullable=True, index=True)
    source = Column(String(50), nullable=True)
    source_agent_id = Column(String(100), nullable=True)
    source_device_id = Column(String(100), nullable=True)
    source_metadata = Column(JSON, nullable=True)
    
    # Relationships
    property = relationship("Property", foreign_keys=[property_id], back_populates="incidents")
    reporter = relationship("User", foreign_keys=[reported_by], back_populates="incidents_reported")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="incidents_assigned")

class Patrol(Base):
    __tablename__ = "patrols"
    
    patrol_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    guard_id = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    template_id = Column(String(36), ForeignKey("patrol_templates.template_id"), nullable=True)
    patrol_type = Column(Enum(PatrolType), default=PatrolType.SCHEDULED)
    route = Column(JSON, nullable=False)
    status = Column(Enum(PatrolStatus), default=PatrolStatus.PLANNED)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ai_priority_score = Column(Float, nullable=True)
    checkpoints = Column(JSON, nullable=False, default=[])
    observations = Column(Text, nullable=True)
    incidents_found = Column(JSON, nullable=True)
    efficiency_score = Column(Float, nullable=True)
    version = Column(Integer, default=0, nullable=False)
    
    property = relationship("Property", foreign_keys=[property_id], back_populates="patrols")
    guard = relationship("User", foreign_keys=[guard_id], back_populates="patrols")

class PatrolRoute(Base):
    __tablename__ = "patrol_routes"
    
    route_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    checkpoints = Column(JSON, nullable=False, default=[])
    estimated_duration = Column(String(50), nullable=True)
    difficulty = Column(String(20), default="medium") # easy, medium, hard
    frequency = Column(String(50), default="daily") # hourly, daily, weekly
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    
    property = relationship("Property")
    creator = relationship("User", foreign_keys=[created_by])
    templates = relationship("PatrolTemplate", back_populates="route", cascade="all, delete-orphan")

class PatrolTemplate(Base):
    __tablename__ = "patrol_templates"
    
    template_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    route_id = Column(String(36), ForeignKey("patrol_routes.route_id", ondelete="CASCADE"), nullable=False)
    assigned_officers = Column(JSON, nullable=True, default=[]) # List of user_ids
    schedule = Column(JSON, nullable=True) # {startTime, endTime, days}
    priority = Column(String(20), default="medium")
    is_recurring = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    
    property = relationship("Property")
    route = relationship("PatrolRoute", back_populates="templates")
    creator = relationship("User", foreign_keys=[created_by])

class PatrolSettings(Base):
    __tablename__ = "patrol_settings"
    
    settings_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # JSON column for flexibility given the large number of boolean flags
    # We will map the Pydantic schema to this JSON column or specific columns
    # Given the 20+ booleans, a JSON column 'config' is cleaner than 20 separate columns
    # But for consistency with other settings tables (which have specific columns), 
    # let's see. GuestSafetySettings has explicit cols. 
    # Let's use a mix: Primary ones explicit, others in JSON if needed.
    # Actually, mapping all 20 booleans as columns is safer for querying if needed.
    
    real_time_sync = Column(Boolean, default=True)
    offline_mode = Column(Boolean, default=True)
    auto_schedule_updates = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    location_tracking = Column(Boolean, default=True)
    emergency_alerts = Column(Boolean, default=True)
    checkpoint_missed_alert = Column(Boolean, default=True)
    patrol_completion_notification = Column(Boolean, default=False)
    shift_change_alerts = Column(Boolean, default=False)
    route_deviation_alert = Column(Boolean, default=False)
    system_status_alerts = Column(Boolean, default=False)
    gps_tracking = Column(Boolean, default=True)
    biometric_verification = Column(Boolean, default=False)
    auto_report_generation = Column(Boolean, default=False)
    audit_logging = Column(Boolean, default=True)
    two_factor_auth = Column(Boolean, default=False)
    session_timeout = Column(Boolean, default=True)
    ip_whitelist = Column(Boolean, default=False)
    mobile_app_sync = Column(Boolean, default=True)
    api_integration = Column(Boolean, default=True)
    database_sync = Column(Boolean, default=True)
    webhook_support = Column(Boolean, default=False)
    cloud_backup = Column(Boolean, default=True)
    role_based_access = Column(Boolean, default=True)
    data_encryption = Column(Boolean, default=True)

    # Operational defaults (minutes/time)
    default_patrol_duration_minutes = Column(Integer, default=45)
    patrol_frequency = Column(String(20), default="hourly")
    shift_handover_time = Column(String(10), default="06:00")
    emergency_response_minutes = Column(Integer, default=2)
    patrol_buffer_minutes = Column(Integer, default=5)
    max_concurrent_patrols = Column(Integer, default=5)
    heartbeat_offline_threshold_minutes = Column(Integer, default=15)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)

    property = relationship("Property")

class Guest(Base):
    __tablename__ = "guests"
    
    guest_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    room_number = Column(String(20), nullable=True)
    check_in_date = Column(DateTime(timezone=True), nullable=True)
    check_out_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    preferences = Column(JSON, nullable=True, default={})
    safety_concerns = Column(JSON, nullable=True, default=[])
    
    # Relationships
    access_events = relationship("AccessControlEvent", foreign_keys="AccessControlEvent.guest_id", back_populates="guest")

class AccessControlEvent(Base):
    __tablename__ = "access_control_events"
    
    event_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    guest_id = Column(String(36), ForeignKey("guests.guest_id"), nullable=True)
    access_point = Column(String(100), nullable=False)
    access_method = Column(String(50), nullable=False)
    event_type = Column(String(50), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    location = Column(JSON, nullable=False)
    device_info = Column(JSON, nullable=True)
    is_authorized = Column(Boolean, nullable=False)
    alert_triggered = Column(Boolean, default=False)
    photo_capture = Column(String(500), nullable=True)
    # Agent/Mobile Device Support
    source = Column(String(50), nullable=True, default="manager")  # 'manager', 'agent', 'device', 'sensor'
    source_agent_id = Column(String(36), nullable=True)  # ID of agent who submitted
    source_device_id = Column(String(100), nullable=True)  # Mobile device ID
    source_metadata = Column(JSON, nullable=True, default={})  # Additional agent/device metadata
    idempotency_key = Column(String(100), nullable=True, unique=True)  # For duplicate detection
    review_status = Column(String(20), nullable=True, default="approved")  # 'pending', 'approved', 'rejected'
    rejection_reason = Column(String(500), nullable=True)  # Reason if rejected
    reviewed_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)  # Manager who reviewed
    reviewed_at = Column(DateTime(timezone=True), nullable=True)  # When reviewed
    
    # Relationships
    property = relationship("Property", foreign_keys=[property_id], back_populates="access_events")
    user = relationship("User", foreign_keys=[user_id])
    guest = relationship("Guest", foreign_keys=[guest_id], back_populates="access_events")

class AccessPoint(Base):
    __tablename__ = "access_points"

    access_point_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    location = Column(String(150), nullable=False)
    type = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="active")
    access_method = Column(String(20), nullable=False, default="card")
    access_count = Column(Integer, default=0)
    security_level = Column(String(20), default="medium")
    permissions = Column(JSON, nullable=True, default=[])
    is_online = Column(Boolean, default=True)
    sensor_status = Column(String(20), nullable=True)
    power_source = Column(String(20), nullable=True)
    battery_level = Column(Integer, nullable=True)
    last_access = Column(DateTime(timezone=True), nullable=True)
    last_status_change = Column(DateTime(timezone=True), nullable=True)
    cached_events = Column(JSON, nullable=True, default=[])
    details = Column("metadata", JSON, nullable=True, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    property = relationship("Property")

class AccessControlUser(Base):
    __tablename__ = "access_control_users"

    access_user_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="employee")
    department = Column(String(100), nullable=False, default="Operations")
    status = Column(String(20), nullable=False, default="active")
    access_level = Column(String(20), nullable=False, default="standard")
    access_count = Column(Integer, default=0)
    avatar = Column(String(255), nullable=False, default="")
    permissions = Column(JSON, nullable=True, default=[])
    phone = Column(String(30), nullable=True)
    employee_id = Column(String(50), nullable=True)
    access_schedule = Column(JSON, nullable=True)
    temporary_accesses = Column(JSON, nullable=True, default=[])
    auto_revoke_at_checkout = Column(Boolean, default=False)
    last_access = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    property = relationship("Property")

class AccessControlEmergencyState(Base):
    __tablename__ = "access_control_emergency_state"

    emergency_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False, unique=True)
    mode = Column(String(20), nullable=False, default="normal")
    initiated_by = Column(String(150), nullable=True)
    reason = Column(String(255), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    timeout_minutes = Column(Integer, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    previous_statuses = Column(JSON, nullable=True, default=[])

    property = relationship("Property")

class AccessControlAuditLog(Base):
    __tablename__ = "access_control_audit_logs"

    audit_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=True)
    actor = Column(String(150), nullable=False)
    action = Column(String(200), nullable=False)
    status = Column(String(20), nullable=False, default="info")
    target = Column(String(200), nullable=True)
    reason = Column(Text, nullable=True)
    source = Column(String(50), nullable=True)  # 'web_admin' | 'mobile_agent' | 'system'
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    property = relationship("Property")

class UserActivity(Base):
    __tablename__ = "user_activities"
    
    activity_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    action_type = Column(String(50), nullable=False)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String(36), nullable=True)
    activity_metadata = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(Text, nullable=False)
    session_id = Column(String(36), nullable=True)
    duration = Column(Integer, nullable=True)  # Duration in seconds
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="activities")
    property = relationship("Property", foreign_keys=[property_id], back_populates="activities")

class SystemLog(Base):
    __tablename__ = "system_logs"
    
    log_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    log_level = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    service = Column(String(100), nullable=False)
    log_metadata = Column(JSON, nullable=True)
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    property_id = Column(String(36), ForeignKey("properties.property_id"), nullable=True)

# New models for advanced modules

class GuestSafetyEvent(Base):
    __tablename__ = "guest_safety_events"
    
    event_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    guest_id = Column(String(36), ForeignKey("guests.guest_id"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    event_type = Column(Enum(GuestSafetyEventType), nullable=False)
    severity_level = Column(Enum(GuestSafetySeverity), default=GuestSafetySeverity.MEDIUM)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    location = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)
    coordinates = Column(JSON, nullable=True)
    device_info = Column(JSON, nullable=True)
    emergency_contacts_notified = Column(Boolean, default=False)
    response_time_minutes = Column(Float, nullable=True)
    resolution_status = Column(Enum(ResolutionStatus), default=ResolutionStatus.PENDING)
    resolved_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    property = relationship("Property")
    guest = relationship("Guest")
    user = relationship("User", foreign_keys=[user_id])
    resolver = relationship("User", foreign_keys=[resolved_by])


class GuestSafetyIncident(Base):
    __tablename__ = "guest_safety_incidents"
    
    incident_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    severity = Column(Enum(GuestSafetySeverity), default=GuestSafetySeverity.MEDIUM)
    status = Column(String(50), default="reported")
    reported_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    guest_involved = Column(String(255), nullable=True)
    room_number = Column(String(50), nullable=True)
    contact_info = Column(String(255), nullable=True)
    assigned_team = Column(String(255), nullable=True)
    source = Column(String(50), default="MANAGER")  # MANAGER, MOBILE_AGENT, HARDWARE_DEVICE, GUEST_PANIC_BUTTON, AUTO_CREATED
    source_metadata = Column(JSON, nullable=True)  # Additional source-specific data
    
    # Relationships
    property = relationship("Property")
    reporter = relationship("User", foreign_keys=[reported_by])
    resolver = relationship("User", foreign_keys=[resolved_by])


class GuestSafetyTeam(Base):
    __tablename__ = "guest_safety_teams"
    
    team_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(120), nullable=False)
    role = Column(String(120), nullable=False)
    status = Column(String(30), default="available")
    avatar = Column(String(10), default="GS")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    property = relationship("Property")


class GuestSafetySettings(Base):
    __tablename__ = "guest_safety_settings"
    
    settings_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False, unique=True)
    alert_threshold = Column(Integer, default=5)
    auto_escalation = Column(Boolean, default=True)
    notification_channels = Column(JSON, default={"inApp": True, "sms": True, "email": True})
    response_team_assignment = Column(String(30), default="automatic")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    property = relationship("Property")


class GuestMessage(Base):
    __tablename__ = "guest_messages"
    
    message_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    incident_id = Column(String(36), ForeignKey("guest_safety_incidents.incident_id", ondelete="CASCADE"), nullable=True)
    guest_id = Column(String(255), nullable=True)  # Guest identifier from guest app
    guest_name = Column(String(255), nullable=True)
    room_number = Column(String(50), nullable=True)
    message_text = Column(Text, nullable=False)
    message_type = Column(String(50), default="request")  # request, update, question, emergency
    direction = Column(String(20), default="guest_to_staff")  # guest_to_staff, staff_to_guest
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    read_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    source = Column(String(50), default="GUEST_APP")  # GUEST_APP, MANAGER, MOBILE_AGENT
    source_metadata = Column(JSON, nullable=True)
    
    # Relationships
    property = relationship("Property")
    incident = relationship("GuestSafetyIncident", foreign_keys=[incident_id])
    reader = relationship("User", foreign_keys=[read_by])

class IoTEnvironmentalData(Base):
    __tablename__ = "iot_environmental_data"
    
    data_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    sensor_id = Column(String(100), nullable=False)
    sensor_type = Column(Enum(SensorType), nullable=False)
    camera_id = Column(String(36), ForeignKey("cameras.camera_id", ondelete="SET NULL"), nullable=True)
    location = Column(JSON, nullable=False)
    value = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    light_level = Column(Float, nullable=True)
    noise_level = Column(Float, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    air_quality = Column(Float, nullable=True)
    smoke_level = Column(Float, nullable=True)
    water_level = Column(Float, nullable=True)
    gas_level = Column(Float, nullable=True)
    pressure = Column(Float, nullable=True)
    vibration = Column(Float, nullable=True)
    battery_level = Column(Float, nullable=True)
    signal_strength = Column(Float, nullable=True)
    threshold_min = Column(Float, nullable=True)
    threshold_max = Column(Float, nullable=True)
    alerts_triggered = Column(JSON, nullable=True)
    status = Column(String(20), default="active")
    
    # Relationships
    property = relationship("Property")
    camera = relationship("Camera")


class IoTEnvironmentalAlert(Base):
    __tablename__ = "iot_environmental_alerts"
    
    alert_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    sensor_id = Column(String(100), nullable=False)
    camera_id = Column(String(36), ForeignKey("cameras.camera_id", ondelete="SET NULL"), nullable=True)
    alert_type = Column(String(50), nullable=False)
    severity = Column(Enum(ThreatSeverity), default=ThreatSeverity.MEDIUM)
    message = Column(Text, nullable=False)
    location = Column(JSON, nullable=False)
    light_level = Column(Float, nullable=True)
    noise_level = Column(Float, nullable=True)
    status = Column(String(20), default="active")
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    property = relationship("Property")
    camera = relationship("Camera")


class IoTEnvironmentalSettings(Base):
    __tablename__ = "iot_environmental_settings"
    
    settings_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False, unique=True)
    temperature_unit = Column(String(20), default="celsius")
    refresh_interval = Column(String(10), default="30")
    enable_notifications = Column(Boolean, default=True)
    critical_alerts_only = Column(Boolean, default=False)
    auto_acknowledge = Column(Boolean, default=False)
    data_retention = Column(String(10), default="90")
    alert_sound_enabled = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    property = relationship("Property")

class HandoverPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class HandoverVerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    DISPUTED = "disputed"

class ChecklistItemStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    SKIPPED = "skipped"

class ChecklistItemCategory(str, enum.Enum):
    SECURITY = "security"
    MAINTENANCE = "maintenance"
    INCIDENTS = "incidents"
    EQUIPMENT = "equipment"
    GENERAL = "general"
# Digital Handover Models
class Handover(Base):
    __tablename__ = "handovers"
    
    handover_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    shiftType = Column(String(50), nullable=False)
    handoverFrom = Column(String(255), nullable=False)
    handoverTo = Column(String(255), nullable=False)
    handoverDate = Column(DateTime, nullable=False)
    startTime = Column(String(10), nullable=False)
    endTime = Column(String(10), nullable=False)
    status = Column(String(50), default="pending")
    priority = Column(String(50), default="medium")
    handoverNotes = Column(Text, nullable=True)
    incidentsSummary = Column(Text, nullable=True)
    specialInstructions = Column(Text, nullable=True)
    equipmentStatus = Column(String(255), default="operational")
    verificationStatus = Column(String(50), default="pending")
    handoverRating = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    completedAt = Column(DateTime, nullable=True)
    completedBy = Column(String(255), nullable=True)
    verifiedAt = Column(DateTime, nullable=True)
    verifiedBy = Column(String(255), nullable=True)
    signatureFrom = Column(Text, nullable=True)
    signatureTo = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    property = relationship("Property")
    checklist_items = relationship("HandoverChecklistItem", back_populates="handover", cascade="all, delete-orphan")

class HandoverChecklistItem(Base):
    __tablename__ = "handover_checklist_items"
    
    item_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    handover_id = Column(String(36), ForeignKey("handovers.handover_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)
    status = Column(String(50), default="pending")
    priority = Column(String(50), default="medium")
    assignedTo = Column(String(255), nullable=True)
    dueDate = Column(DateTime, nullable=True)
    completedAt = Column(DateTime, nullable=True)
    completedBy = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    handover = relationship("Handover", back_populates="checklist_items")

class Equipment(Base):
    __tablename__ = "equipment"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    status = Column(String(50), default="operational")
    location = Column(String(255), nullable=True)
    last_check_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    property = relationship("Property")

class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    equipment_id = Column(String(36), ForeignKey("equipment.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(50), default="medium")
    status = Column(String(50), default="pending")
    location = Column(String(255), nullable=True)
    reported_by = Column(String(255), nullable=True)
    assigned_to = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    property = relationship("Property")
    equipment = relationship("Equipment")

class HandoverSettings(Base):
    __tablename__ = "handover_settings"
    
    settings_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Shift configurations (stored as JSON)
    shiftConfigurations = Column(JSON, default=lambda: {
        "morning": {"start": "06:00", "end": "14:00"},
        "afternoon": {"start": "14:00", "end": "22:00"},
        "night": {"start": "22:00", "end": "06:00"}
    })
    
    # Notification settings (stored as JSON)
    notificationSettings = Column(JSON, default=lambda: {
        "emailNotifications": True,
        "smsNotifications": False,
        "pushNotifications": True,
        "reminderTime": "30",
        "escalationTime": "2"
    })
    
    # Template settings (stored as JSON)
    templateSettings = Column(JSON, default=lambda: {
        "defaultPriority": "medium",
        "defaultCategory": "general",
        "autoAssignTasks": True,
        "requireApproval": False
    })
    
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    updated_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    
    # Relationships
    property = relationship("Property")

class HandoverTemplate(Base):
    __tablename__ = "handover_templates"
    
    template_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    operationalPost = Column(String(100), nullable=True)
    isDefault = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    items = relationship("HandoverTemplateItem", back_populates="template", cascade="all, delete-orphan")

class HandoverTemplateItem(Base):
    __tablename__ = "handover_template_items"
    
    item_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(String(36), ForeignKey("handover_templates.template_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)
    priority = Column(String(50), default="medium")
    assignedTo = Column(String(255), nullable=True)
    
    # Relationships
    template = relationship("HandoverTemplate", back_populates="items")

class SmartLocker(Base):
    __tablename__ = "smart_lockers"
    
    locker_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    locker_number = Column(String(20), nullable=False)
    location = Column(JSON, nullable=False)
    status = Column(Enum(LockerStatus), default=LockerStatus.AVAILABLE)
    size = Column(String(20), nullable=False)  # small, medium, large
    current_guest_id = Column(String(36), ForeignKey("guests.guest_id"), nullable=True)
    check_in_time = Column(DateTime(timezone=True), nullable=True)
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    iot_sensor_data = Column(JSON, nullable=True)
    last_maintenance = Column(DateTime(timezone=True), nullable=True)
    next_maintenance = Column(DateTime(timezone=True), nullable=True)
    battery_level = Column(Float, nullable=True)
    signal_strength = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    property = relationship("Property")
    guest = relationship("Guest")

class ParkingSpace(Base):
    __tablename__ = "parking_spaces"
    
    space_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    label = Column(String(50), nullable=False)
    zone = Column(String(50), nullable=True)
    type = Column(String(50), default="regular")  # regular, accessible, ev, staff, valet
    status = Column(Enum(ParkingStatus), default=ParkingStatus.AVAILABLE)
    current_guest_id = Column(String(36), nullable=True)
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    iot_sensor_data = Column(JSON, nullable=True)
    
    # Relationships
    property = relationship("Property")

class ParkingOccupancyEvent(Base):
    __tablename__ = "parking_occupancy_events"
    
    event_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    space_id = Column(String(36), ForeignKey("parking_spaces.space_id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    source = Column(String(50), nullable=False)  # sensor|lpr|manual
    value = Column(Boolean, nullable=False)  # True for occupied, False for available
    
    # Relationships
    space = relationship("ParkingSpace")

class GuestParking(Base):
    __tablename__ = "guest_parkings"
    
    registration_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    guest_id = Column(String(36), ForeignKey("guests.guest_id", ondelete="SET NULL"), nullable=True)
    guest_name = Column(String(200), nullable=False)
    plate = Column(String(20), nullable=False, index=True)
    vehicle_info = Column(JSON, nullable=True)  # {make, model, color}
    space_id = Column(String(36), ForeignKey("parking_spaces.space_id", ondelete="SET NULL"), nullable=True)
    checkin_at = Column(DateTime(timezone=True), server_default=func.now())
    checkout_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="active")  # active, completed, overdue
    valet_status = Column(String(20), default="idle") # idle, requested, retrieving, ready, delivered
    notes = Column(Text, nullable=True)
    
    # Relationships

    # Relationships
    property = relationship("Property")
    space = relationship("ParkingSpace")
    guest = relationship("Guest")
    billing = relationship("ParkingBillingRecord", back_populates="registration", cascade="all, delete-orphan")

class ParkingBillingRecord(Base):
    """Financial record for a parking stay"""
    __tablename__ = "parking_billing_records"
    
    billing_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id = Column(String(36), ForeignKey("guest_parkings.registration_id", ondelete="CASCADE"), nullable=False)
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(String(20), default="pending")  # pending, paid, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    registration = relationship("GuestParking", back_populates="billing")

class ParkingSettings(Base):
    """Global and per-property settings for the parking module"""
    __tablename__ = "parking_settings"

    settings_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Pricing (stored as cents)
    guest_hourly_rate = Column(Integer, default=500)
    guest_daily_rate = Column(Integer, default=4000)
    valet_fee = Column(Integer, default=1500)
    ev_charging_fee = Column(Integer, default=250)
    
    # Policies
    max_stay_hours = Column(Integer, default=24)
    grace_period_minutes = Column(Integer, default=30)
    late_fee_rate = Column(Float, default=1.5)
    auto_checkout_enabled = Column(Boolean, default=True)
    
    # Notifications/Integrations
    low_occupancy_alert = Column(Boolean, default=True)
    maintenance_reminders = Column(Boolean, default=True)
    billing_sync_enabled = Column(Boolean, default=True)
    
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    property = relationship("Property")

class BannedIndividual(Base):
    __tablename__ = "banned_individuals"
    
    banned_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(DateTime(timezone=True), nullable=True)
    photo_url = Column(String(500), nullable=True)
    facial_recognition_data = Column(JSON, nullable=True)
    reason_for_ban = Column(Text, nullable=False)
    ban_start_date = Column(DateTime(timezone=True), server_default=func.now())
    ban_end_date = Column(DateTime(timezone=True), nullable=True)
    is_permanent = Column(Boolean, default=False)
    added_by = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    detection_count = Column(Integer, default=0)
    last_detection = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    property = relationship("Property")
    added_by_user = relationship("User", foreign_keys=[added_by])

class Package(Base):
    __tablename__ = "packages"
    
    package_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    guest_id = Column(String(36), ForeignKey("guests.guest_id"), nullable=True)
    tracking_number = Column(String(100), nullable=True)
    sender_name = Column(String(200), nullable=True)
    sender_contact = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    size = Column(String(20), nullable=True)  # small, medium, large
    weight = Column(Float, nullable=True)
    status = Column(Enum(PackageStatus), default=PackageStatus.PENDING)
    received_at = Column(DateTime(timezone=True), server_default=func.now())
    notified_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    delivered_to = Column(String(100), nullable=True)
    location = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    received_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    
    # Relationships
    property = relationship("Property")
    guest = relationship("Guest")
    receiver = relationship("User", foreign_keys=[received_by])

class LostFoundItem(Base):
    __tablename__ = "lost_found_items"
    
    item_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    item_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    location_found = Column(JSON, nullable=True)
    location_lost = Column(JSON, nullable=True)
    found_date = Column(DateTime(timezone=True), server_default=func.now())
    lost_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(LostFoundStatus), default=LostFoundStatus.FOUND)
    photo_url = Column(String(500), nullable=True)
    ai_matched_guest_id = Column(String(36), ForeignKey("guests.guest_id"), nullable=True)
    claimed_by_guest_id = Column(String(36), ForeignKey("guests.guest_id"), nullable=True)
    claimed_at = Column(DateTime(timezone=True), nullable=True)
    found_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    notes = Column(Text, nullable=True)
    value_estimate = Column(Float, nullable=True)
    
    # Relationships
    property = relationship("Property")
    ai_matched_guest = relationship("Guest", foreign_keys=[ai_matched_guest_id])
    claimed_by_guest = relationship("Guest", foreign_keys=[claimed_by_guest_id])
    finder = relationship("User", foreign_keys=[found_by])

class Visitor(Base):
    __tablename__ = "visitors"
    
    visitor_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    guest_id = Column(String(36), ForeignKey("guests.guest_id"), nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    company = Column(String(200), nullable=True)
    purpose = Column(Text, nullable=True)
    expected_arrival = Column(DateTime(timezone=True), nullable=True)
    actual_arrival = Column(DateTime(timezone=True), nullable=True)
    check_out = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(VisitorStatus), default=VisitorStatus.EXPECTED)
    photo_url = Column(String(500), nullable=True)
    facial_recognition_data = Column(JSON, nullable=True)
    access_level = Column(String(50), nullable=True)  # lobby, room, restricted
    escorted_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    
    # Relationships
    property = relationship("Property")
    guest = relationship("Guest")
    escort = relationship("User", foreign_keys=[escorted_by])
    creator = relationship("User", foreign_keys=[created_by])
    # New relationships
    logs = relationship("VisitorLog", back_populates="visitor", cascade="all, delete-orphan")
    badges = relationship("VisitorBadge", back_populates="visitor", cascade="all, delete-orphan")

class VisitorLog(Base):
    __tablename__ = "visitor_logs"
    log_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = Column(String(36), ForeignKey("visitors.visitor_id", ondelete="CASCADE"), nullable=False)
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)  # e.g., check_in, check_out
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    location = Column(String(200), nullable=True)
    processed_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    notes = Column(Text, nullable=True)
    # Relationships
    visitor = relationship("Visitor", back_populates="logs")
    property = relationship("Property")
    processor = relationship("User", foreign_keys=[processed_by])

class VisitorBadge(Base):
    __tablename__ = "visitor_badges"
    badge_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = Column(String(36), ForeignKey("visitors.visitor_id", ondelete="CASCADE"), nullable=False)
    badge_number = Column(String(50), unique=True, nullable=False)
    issued_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default="active")  # active, returned, lost
    returned_at = Column(DateTime(timezone=True), nullable=True)
    returned_to = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    # Relationships
    visitor = relationship("Visitor", back_populates="badges")
    issuer = relationship("User", foreign_keys=[issued_by])
    returner = relationship("User", foreign_keys=[returned_to]) 

class Camera(Base):
    __tablename__ = "cameras"

    camera_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="SET NULL"), nullable=True)
    name = Column(String(200), nullable=False)
    location = Column(JSON, nullable=False)
    ip_address = Column(String(64), nullable=False)
    stream_url = Column(Text, nullable=False)  # Browser-compatible/proxied URL only
    source_stream_url = Column(Text, nullable=True)  # Raw hardware stream (RTSP), keep internal
    credentials = Column(JSON, nullable=True)  # Sensitive, do not expose in responses
    status = Column(Enum(CameraStatus), default=CameraStatus.OFFLINE)
    hardware_status = Column(JSON, nullable=True)
    is_recording = Column(Boolean, default=False)
    motion_detection_enabled = Column(Boolean, default=True)
    last_known_image_url = Column(String(500), nullable=True)
    last_heartbeat = Column(DateTime(timezone=True), nullable=True)
    last_status_change = Column(DateTime(timezone=True), nullable=True)
    version = Column(Integer, default=1)  # Optimistic locking for concurrent updates
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    property = relationship("Property")
    health = relationship("CameraHealth", back_populates="camera", uselist=False, cascade="all, delete-orphan")

class CameraHealth(Base):
    __tablename__ = "camera_health"

    health_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    camera_id = Column(String(36), ForeignKey("cameras.camera_id", ondelete="CASCADE"), nullable=False, unique=True)
    last_ping_at = Column(DateTime(timezone=True), nullable=True)
    last_metrics_at = Column(DateTime(timezone=True), nullable=True)
    last_known_image_url = Column(String(500), nullable=True)
    status = Column(Enum(CameraStatus), default=CameraStatus.OFFLINE)
    metrics = Column(JSON, nullable=True)
    latency_ms = Column(Float, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    camera = relationship("Camera", back_populates="health")

class SecurityOperationsAuditLog(Base):
    __tablename__ = "security_operations_audit_logs"

    audit_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="SET NULL"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # 'create', 'update', 'delete', 'export', etc.
    entity = Column(String(50), nullable=False)  # 'camera', 'recording', 'evidence', 'settings'
    entity_id = Column(String(100), nullable=False)
    changes = Column(JSON, nullable=True)  # {field: {from: value, to: value}}
    extra_metadata = Column("metadata", JSON, nullable=True)  # Additional context (avoid reserved 'metadata')
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(500), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    hash = Column(String(64), nullable=True)  # Integrity hash for tamper detection

    property = relationship("Property")
    user = relationship("User", foreign_keys=[user_id])

class EvacuationSession(Base):
    __tablename__ = "evacuation_sessions"

    session_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(EvacuationStatus), default=EvacuationStatus.ACTIVE)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    initiated_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    completed_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    notes = Column(Text, nullable=True)
    session_metadata = Column("metadata", JSON, nullable=True)

    property = relationship("Property")
    initiator = relationship("User", foreign_keys=[initiated_by])
    completer = relationship("User", foreign_keys=[completed_by])
    actions = relationship("EvacuationAction", back_populates="session", cascade="all, delete-orphan")

class EvacuationAction(Base):
    __tablename__ = "evacuation_actions"

    action_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("evacuation_sessions.session_id", ondelete="SET NULL"), nullable=True)
    action_type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)

    session = relationship("EvacuationSession", back_populates="actions")
    creator = relationship("User", foreign_keys=[created_by])

class EvacuationAssistance(Base):
    __tablename__ = "evacuation_assistance"

    assistance_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("evacuation_sessions.session_id", ondelete="SET NULL"), nullable=True)
    guest_name = Column(String(200), nullable=False)
    room = Column(String(50), nullable=False)
    need = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False)
    status = Column(String(20), default="pending")
    assigned_staff = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("EvacuationSession")