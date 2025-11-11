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