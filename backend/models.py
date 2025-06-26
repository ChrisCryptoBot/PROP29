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