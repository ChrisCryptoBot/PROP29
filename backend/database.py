from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import os
from typing import Generator
import logging

logger = logging.getLogger(__name__)

# Database configuration with environment-based settings
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./proper29.db")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Production database configuration
if ENVIRONMENT == "production":
    # PostgreSQL configuration for production
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=int(os.getenv("DB_POOL_SIZE", "20")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "30")),
        pool_pre_ping=True,
        pool_recycle=3600,  # Recycle connections every hour
        echo=False  # Disable SQL logging in production
    )
elif DATABASE_URL.startswith("sqlite"):
    # SQLite configuration for development
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        echo=True if ENVIRONMENT == "development" else False
    )
else:
    # Default configuration for other databases
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "20")),
        pool_pre_ping=True,
        echo=True if ENVIRONMENT == "development" else False
    )

# Create session factory with proper configuration
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine,
    expire_on_commit=False  # Prevent expired object access issues
)

# Create base class for models
Base = declarative_base()

# Metadata for migrations
metadata = MetaData()

def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session with proper error handling"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def init_db():
    """Initialize database with tables and basic data"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")

        # Lightweight migrations for SQLite
        if engine.dialect.name == "sqlite":
            with engine.connect() as connection:
                columns = connection.execute(text("PRAGMA table_info(patrols)")).fetchall()
                column_names = {row[1] for row in columns}
                if "template_id" not in column_names:
                    connection.execute(text("ALTER TABLE patrols ADD COLUMN template_id VARCHAR(36)"))
                    logger.info("Added template_id column to patrols table")
                if "version" not in column_names:
                    connection.execute(text("ALTER TABLE patrols ADD COLUMN version INTEGER NOT NULL DEFAULT 0"))
                    connection.commit()
                    logger.info("Added version column to patrols table")

                patrol_settings_columns = connection.execute(text("PRAGMA table_info(patrol_settings)")).fetchall()
                patrol_settings_names = {row[1] for row in patrol_settings_columns}
                patrol_settings_defaults = {
                    "real_time_sync": "BOOLEAN DEFAULT 1",
                    "offline_mode": "BOOLEAN DEFAULT 1",
                    "auto_schedule_updates": "BOOLEAN DEFAULT 1",
                    "push_notifications": "BOOLEAN DEFAULT 1",
                    "location_tracking": "BOOLEAN DEFAULT 1",
                    "emergency_alerts": "BOOLEAN DEFAULT 1",
                    "checkpoint_missed_alert": "BOOLEAN DEFAULT 1",
                    "patrol_completion_notification": "BOOLEAN DEFAULT 0",
                    "shift_change_alerts": "BOOLEAN DEFAULT 0",
                    "route_deviation_alert": "BOOLEAN DEFAULT 0",
                    "system_status_alerts": "BOOLEAN DEFAULT 0",
                    "gps_tracking": "BOOLEAN DEFAULT 1",
                    "biometric_verification": "BOOLEAN DEFAULT 0",
                    "auto_report_generation": "BOOLEAN DEFAULT 0",
                    "audit_logging": "BOOLEAN DEFAULT 1",
                    "two_factor_auth": "BOOLEAN DEFAULT 0",
                    "session_timeout": "BOOLEAN DEFAULT 1",
                    "ip_whitelist": "BOOLEAN DEFAULT 0",
                    "mobile_app_sync": "BOOLEAN DEFAULT 1",
                    "api_integration": "BOOLEAN DEFAULT 1",
                    "database_sync": "BOOLEAN DEFAULT 1",
                    "webhook_support": "BOOLEAN DEFAULT 0",
                    "cloud_backup": "BOOLEAN DEFAULT 1",
                    "role_based_access": "BOOLEAN DEFAULT 1",
                    "data_encryption": "BOOLEAN DEFAULT 1",
                    "default_patrol_duration_minutes": "INTEGER DEFAULT 45",
                    "patrol_frequency": "VARCHAR(20) DEFAULT 'hourly'",
                    "shift_handover_time": "VARCHAR(10) DEFAULT '06:00'",
                    "emergency_response_minutes": "INTEGER DEFAULT 2",
                    "patrol_buffer_minutes": "INTEGER DEFAULT 5",
                    "max_concurrent_patrols": "INTEGER DEFAULT 5",
                    "heartbeat_offline_threshold_minutes": "INTEGER DEFAULT 15",
                }

                for column_name, column_type in patrol_settings_defaults.items():
                    if column_name not in patrol_settings_names:
                        connection.execute(
                            text(f"ALTER TABLE patrol_settings ADD COLUMN {column_name} {column_type}")
                        )
                        logger.info("Added %s column to patrol_settings table", column_name)
                
                # Add source tracking to guest_safety_incidents
                try:
                    guest_safety_columns = connection.execute(text("PRAGMA table_info(guest_safety_incidents)")).fetchall()
                    guest_safety_names = {row[1] for row in guest_safety_columns}
                    if "source" not in guest_safety_names:
                        connection.execute(text("ALTER TABLE guest_safety_incidents ADD COLUMN source VARCHAR(50) DEFAULT 'MANAGER'"))
                        logger.info("Added source column to guest_safety_incidents table")
                    if "source_metadata" not in guest_safety_names:
                        connection.execute(text("ALTER TABLE guest_safety_incidents ADD COLUMN source_metadata TEXT"))
                        logger.info("Added source_metadata column to guest_safety_incidents table")
                    connection.commit()
                except Exception as e:
                    logger.warning(f"Could not add source columns to guest_safety_incidents: {e}")
                
                # Create guest_messages table if it doesn't exist
                try:
                    tables = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='guest_messages'")).fetchall()
                    if not tables:
                        connection.execute(text("""
                            CREATE TABLE guest_messages (
                                message_id VARCHAR(36) PRIMARY KEY,
                                property_id VARCHAR(36) NOT NULL,
                                incident_id VARCHAR(36),
                                guest_id VARCHAR(255),
                                guest_name VARCHAR(255),
                                room_number VARCHAR(50),
                                message_text TEXT NOT NULL,
                                message_type VARCHAR(50) DEFAULT 'request',
                                direction VARCHAR(20) DEFAULT 'guest_to_staff',
                                is_read BOOLEAN DEFAULT 0,
                                read_at DATETIME,
                                read_by VARCHAR(36),
                                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                source VARCHAR(50) DEFAULT 'GUEST_APP',
                                source_metadata TEXT,
                                FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
                                FOREIGN KEY (incident_id) REFERENCES guest_safety_incidents(incident_id) ON DELETE CASCADE,
                                FOREIGN KEY (read_by) REFERENCES users(user_id)
                            )
                        """))
                        connection.commit()
                        logger.info("Created guest_messages table")
                except Exception as e:
                    logger.warning(f"Could not create guest_messages table: {e}")
        
        # Seed basic admin user for development
        db = SessionLocal()
        try:
            from models import User, Property, UserRole, UserRoleEnum, UserStatus, PropertyType
            from services.auth_service import AuthService
            import uuid
            
            # Check if admin user already exists
            admin_user = db.query(User).filter(User.username == "admin").first()
            if not admin_user:
                logger.info("Seeding admin user...")
                admin_user = User(
                    user_id="1", # Use fixed ID for mock token compatibility if needed, or str(uuid.uuid4())
                    email="admin@proper29.com",
                    username="admin",
                    password_hash=AuthService.get_password_hash("admin123"),
                    first_name="Admin",
                    last_name="User",
                    status=UserStatus.ACTIVE
                )
                db.add(admin_user)
                db.commit()
                db.refresh(admin_user)
                logger.info(f"Admin user seeded with ID: {admin_user.user_id}")
            
            # Check if default property exists
            default_property = db.query(Property).filter(Property.property_name == "Default Hotel").first()
            if not default_property:
                logger.info("Seeding default property...")
                default_property = Property(
                    property_id="default-prop",
                    property_name="Default Hotel",
                    property_type=PropertyType.HOTEL,
                    address={"street": "123 Security Blvd", "city": "Safe City", "state": "TX", "zip": "75001"},
                    contact_info={"phone": "555-0100", "email": "frontdesk@hotel.com"},
                    room_count=100,
                    capacity=200,
                    timezone="UTC",
                    settings={}
                )
                db.add(default_property)
                db.commit()
                db.refresh(default_property)
                logger.info(f"Default property seeded with ID: {default_property.property_id}")
                
            # Ensure admin user has admin role on default property
            admin_role = db.query(UserRole).filter(
                UserRole.user_id == admin_user.user_id,
                UserRole.property_id == default_property.property_id,
                UserRole.role_name == UserRoleEnum.ADMIN
            ).first()
            
            if not admin_role:
                logger.info("Seeding admin role...")
                admin_role = UserRole(
                    role_id=str(uuid.uuid4()),
                    user_id=admin_user.user_id,
                    property_id=default_property.property_id,
                    role_name=UserRoleEnum.ADMIN,
                    is_active=True,
                    permissions={"all": True}
                )
                db.add(admin_role)
                db.commit()
                logger.info("Admin role seeded.")
                
        except Exception as seed_error:
            logger.error(f"Seeding failed: {str(seed_error)}")
            db.rollback()
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise

def close_db():
    """Close database connections properly"""
    try:
        engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database connections: {str(e)}")

# Health check function
def check_db_health() -> bool:
    """Check if database is accessible"""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return False 