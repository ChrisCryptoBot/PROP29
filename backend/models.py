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
    
    # Relationships
    property = relationship("Property", foreign_keys=[property_id], back_populates="incidents")
    reporter = relationship("User", foreign_keys=[reported_by], back_populates="incidents_reported")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="incidents_assigned")

class Patrol(Base):
    __tablename__ = "patrols"
    
    patrol_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    guard_id = Column(String(36), ForeignKey("users.user_id"), nullable=False)
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
    
    # Relationships
    property = relationship("Property", foreign_keys=[property_id], back_populates="patrols")
    guard = relationship("User", foreign_keys=[guard_id], back_populates="patrols")

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
    
    # Relationships
    property = relationship("Property", foreign_keys=[property_id], back_populates="access_events")
    user = relationship("User", foreign_keys=[user_id])
    guest = relationship("Guest", foreign_keys=[guest_id], back_populates="access_events")

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

class IoTEnvironmentalData(Base):
    __tablename__ = "iot_environmental_data"
    
    data_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    sensor_id = Column(String(100), nullable=False)
    sensor_type = Column(Enum(SensorType), nullable=False)
    location = Column(JSON, nullable=False)
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
    alerts_triggered = Column(JSON, nullable=True)
    status = Column(String(20), default="active")
    
    # Relationships
    property = relationship("Property")

class DigitalHandover(Base):
    __tablename__ = "digital_handovers"
    
    handover_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    from_user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    to_user_id = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    shift_type = Column(Enum(ShiftType), nullable=False)
    handover_time = Column(DateTime(timezone=True), server_default=func.now())
    ai_briefing = Column(Text, nullable=True)
    priority_alerts = Column(JSON, nullable=True)
    pending_incidents = Column(JSON, nullable=True)
    active_patrols = Column(JSON, nullable=True)
    system_status = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(Enum(HandoverStatus), default=HandoverStatus.PENDING)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    created_by = Column(String(36), ForeignKey("users.user_id"), nullable=False)
    
    # Relationships
    property = relationship("Property")
    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])
    acknowledged_by_user = relationship("User", foreign_keys=[acknowledged_by])
    creator = relationship("User", foreign_keys=[created_by])

class CybersecurityEvent(Base):
    __tablename__ = "cybersecurity_events"
    
    event_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    threat_type = Column(Enum(CybersecurityThreatType), nullable=False)
    severity = Column(Enum(ThreatSeverity), default=ThreatSeverity.MEDIUM)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    source_ip = Column(String(45), nullable=True)
    target_system = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    threat_indicators = Column(JSON, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    blocked = Column(Boolean, default=False)
    response_time_seconds = Column(Float, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String(36), ForeignKey("users.user_id"), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    property = relationship("Property")
    resolver = relationship("User", foreign_keys=[resolved_by])

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

class SmartParking(Base):
    __tablename__ = "smart_parking"
    
    parking_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String(36), ForeignKey("properties.property_id", ondelete="CASCADE"), nullable=False)
    spot_number = Column(String(20), nullable=False)
    location = Column(JSON, nullable=False)
    status = Column(Enum(ParkingStatus), default=ParkingStatus.AVAILABLE)
    spot_type = Column(String(20), nullable=False)  # regular, handicap, vip, electric
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