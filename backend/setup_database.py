#!/usr/bin/env python3
"""
Database setup script for PROPER 2.9
Creates tables and populates with sample data
"""

import sys
import os
from datetime import datetime, timedelta
from uuid import uuid4

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, init_db
from models import User, Property, UserRole, Incident, Patrol
from services.auth_service import AuthService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_sample_data():
    """Create sample data for the PROPER 2.9 platform"""
    db = SessionLocal()
    
    try:
        logger.info("Creating sample data...")
        
        # Create sample properties
        properties = [
            Property(
                property_id=str(uuid4()),
                property_name="Grand Plaza Hotel",
                property_type="hotel",
                address={
                    "street": "123 Main Street",
                    "city": "New York",
                    "state": "NY",
                    "country": "USA",
                    "postal_code": "10001"
                },
                contact_info={
                    "phone": "+1-555-123-4567",
                    "email": "info@grandplaza.com",
                    "emergency_contact": "+1-555-999-8888"
                },
                room_count=250,
                capacity=500,
                timezone="America/New_York",
                settings={
                    "ai_enabled": True,
                    "alert_thresholds": {"theft": 0.7, "disturbance": 0.5},
                    "patrol_frequency": "hourly"
                },
                subscription_tier="enterprise",
                is_active=True
            ),
            Property(
                property_id=str(uuid4()),
                property_name="Sunset Resort & Spa",
                property_type="resort",
                address={
                    "street": "456 Beach Boulevard",
                    "city": "Miami",
                    "state": "FL",
                    "country": "USA",
                    "postal_code": "33139"
                },
                contact_info={
                    "phone": "+1-555-987-6543",
                    "email": "info@sunsetresort.com",
                    "emergency_contact": "+1-555-777-6666"
                },
                room_count=180,
                capacity=400,
                timezone="America/New_York",
                settings={
                    "ai_enabled": True,
                    "alert_thresholds": {"theft": 0.6, "disturbance": 0.4},
                    "patrol_frequency": "every_2_hours"
                },
                subscription_tier="professional",
                is_active=True
            )
        ]
        
        for prop in properties:
            db.add(prop)
        db.commit()
        
        # Create sample users
        users = [
            User(
                user_id=str(uuid4()),
                email="admin@proper29.com",
                username="admin",
                password_hash=AuthService.get_password_hash("admin123"),
                first_name="System",
                last_name="Administrator",
                phone="+1-555-000-0001",
                status="active",
                preferred_language="en",
                timezone="UTC"
            ),
            User(
                user_id=str(uuid4()),
                email="security@grandplaza.com",
                username="security_manager",
                password_hash=AuthService.get_password_hash("security123"),
                first_name="John",
                last_name="Smith",
                phone="+1-555-000-0002",
                status="active",
                preferred_language="en",
                timezone="America/New_York"
            ),
            User(
                user_id=str(uuid4()),
                email="guard1@grandplaza.com",
                username="guard1",
                password_hash=AuthService.get_password_hash("guard123"),
                first_name="Mike",
                last_name="Johnson",
                phone="+1-555-000-0003",
                status="active",
                preferred_language="en",
                timezone="America/New_York"
            ),
            User(
                user_id=str(uuid4()),
                email="manager@sunsetresort.com",
                username="resort_manager",
                password_hash=AuthService.get_password_hash("manager123"),
                first_name="Sarah",
                last_name="Wilson",
                phone="+1-555-000-0004",
                status="active",
                preferred_language="en",
                timezone="America/New_York"
            )
        ]
        
        for user in users:
            db.add(user)
        db.commit()
        
        # Create user roles
        user_roles = [
            # Admin role for all properties
            UserRole(
                user_id=users[0].user_id,  # admin
                property_id=properties[0].property_id,
                role_name="admin",
                permissions={
                    "incidents": ["read", "write", "delete"],
                    "patrols": ["read", "write", "delete"],
                    "users": ["read", "write", "delete"],
                    "properties": ["read", "write", "delete"],
                    "reports": ["read", "write"],
                    "settings": ["read", "write"]
                },
                assigned_by=users[0].user_id,
                is_active=True
            ),
            UserRole(
                user_id=users[0].user_id,  # admin
                property_id=properties[1].property_id,
                role_name="admin",
                permissions={
                    "incidents": ["read", "write", "delete"],
                    "patrols": ["read", "write", "delete"],
                    "users": ["read", "write", "delete"],
                    "properties": ["read", "write", "delete"],
                    "reports": ["read", "write"],
                    "settings": ["read", "write"]
                },
                assigned_by=users[0].user_id,
                is_active=True
            ),
            # Security manager for Grand Plaza
            UserRole(
                user_id=users[1].user_id,  # security_manager
                property_id=properties[0].property_id,
                role_name="security_manager",
                permissions={
                    "incidents": ["read", "write"],
                    "patrols": ["read", "write"],
                    "users": ["read"],
                    "properties": ["read"],
                    "reports": ["read", "write"],
                    "settings": ["read"]
                },
                assigned_by=users[0].user_id,
                is_active=True
            ),
            # Guard for Grand Plaza
            UserRole(
                user_id=users[2].user_id,  # guard1
                property_id=properties[0].property_id,
                role_name="guard",
                permissions={
                    "incidents": ["read", "write"],
                    "patrols": ["read", "write"],
                    "users": ["read"],
                    "properties": ["read"],
                    "reports": ["read"],
                    "settings": ["read"]
                },
                assigned_by=users[1].user_id,
                is_active=True
            ),
            # Manager for Sunset Resort
            UserRole(
                user_id=users[3].user_id,  # resort_manager
                property_id=properties[1].property_id,
                role_name="manager",
                permissions={
                    "incidents": ["read", "write"],
                    "patrols": ["read", "write"],
                    "users": ["read"],
                    "properties": ["read"],
                    "reports": ["read", "write"],
                    "settings": ["read"]
                },
                assigned_by=users[0].user_id,
                is_active=True
            )
        ]
        
        for role in user_roles:
            db.add(role)
        db.commit()
        
        # Create sample incidents
        incidents = [
            Incident(
                incident_id=str(uuid4()),
                property_id=properties[0].property_id,
                incident_type="theft",
                severity="medium",
                status="investigating",
                title="Suspicious activity in parking lot",
                description="Guest reported seeing someone checking car doors in parking lot A",
                location={"building": "Main Building", "floor": "Ground", "area": "Parking Lot A"},
                reported_by=users[1].user_id,
                assigned_to=users[2].user_id,
                created_at=datetime.utcnow() - timedelta(hours=2),
                evidence={"photos": ["photo1.jpg", "photo2.jpg"]},
                witnesses={"guest_name": "Jane Doe", "room": "205"}
            ),
            Incident(
                incident_id=str(uuid4()),
                property_id=properties[0].property_id,
                incident_type="disturbance",
                severity="low",
                status="resolved",
                title="Noise complaint from room 312",
                description="Excessive noise reported from room 312, resolved after security intervention",
                location={"building": "Main Building", "floor": "3", "room": "312"},
                reported_by=users[1].user_id,
                assigned_to=users[2].user_id,
                created_at=datetime.utcnow() - timedelta(hours=6),
                resolved_at=datetime.utcnow() - timedelta(hours=5)
            ),
            Incident(
                incident_id=str(uuid4()),
                property_id=properties[1].property_id,
                incident_type="medical",
                severity="high",
                status="resolved",
                title="Guest medical emergency",
                description="Guest collapsed in lobby, medical assistance provided",
                location={"building": "Main Building", "floor": "Ground", "area": "Lobby"},
                reported_by=users[3].user_id,
                created_at=datetime.utcnow() - timedelta(hours=12),
                resolved_at=datetime.utcnow() - timedelta(hours=11)
            )
        ]
        
        for incident in incidents:
            db.add(incident)
        db.commit()
        
        # Create sample patrols
        patrols = [
            Patrol(
                patrol_id=str(uuid4()),
                property_id=properties[0].property_id,
                guard_id=users[2].user_id,
                patrol_type="scheduled",
                route={
                    "waypoints": ["Main Entrance", "Parking Lot A", "Pool Area", "Back Entrance"],
                    "estimated_duration": 45,
                    "checkpoints": 4
                },
                status="completed",
                started_at=datetime.utcnow() - timedelta(hours=3),
                completed_at=datetime.utcnow() - timedelta(hours=2, minutes=15),
                created_at=datetime.utcnow() - timedelta(hours=4),
                checkpoints=[
                    {"location": "Main Entrance", "completed": True, "time": "10:00"},
                    {"location": "Parking Lot A", "completed": True, "time": "10:15"},
                    {"location": "Pool Area", "completed": True, "time": "10:30"},
                    {"location": "Back Entrance", "completed": True, "time": "10:45"}
                ],
                observations="All areas secure, no issues found",
                efficiency_score=95.0
            ),
            Patrol(
                patrol_id=str(uuid4()),
                property_id=properties[0].property_id,
                guard_id=users[2].user_id,
                patrol_type="ai_optimized",
                route={
                    "waypoints": ["Main Entrance", "Guest Rooms Floor 2", "Restaurant", "Lobby"],
                    "estimated_duration": 30,
                    "checkpoints": 4
                },
                status="active",
                started_at=datetime.utcnow() - timedelta(minutes=15),
                created_at=datetime.utcnow() - timedelta(minutes=20),
                ai_priority_score=85.5,
                checkpoints=[
                    {"location": "Main Entrance", "completed": True, "time": "14:00"},
                    {"location": "Guest Rooms Floor 2", "completed": False, "time": None},
                    {"location": "Restaurant", "completed": False, "time": None},
                    {"location": "Lobby", "completed": False, "time": None}
                ]
            )
        ]
        
        for patrol in patrols:
            db.add(patrol)
        db.commit()
        
        logger.info("Sample data created successfully!")
        logger.info(f"Created {len(properties)} properties")
        logger.info(f"Created {len(users)} users")
        logger.info(f"Created {len(user_roles)} user roles")
        logger.info(f"Created {len(incidents)} incidents")
        logger.info(f"Created {len(patrols)} patrols")
        
        # Print login credentials
        logger.info("\n=== LOGIN CREDENTIALS ===")
        logger.info("Admin: admin@proper29.com / admin123")
        logger.info("Security Manager: security@grandplaza.com / security123")
        logger.info("Guard: guard1@grandplaza.com / guard123")
        logger.info("Resort Manager: manager@sunsetresort.com / manager123")
        
    except Exception as e:
        logger.error(f"Error creating sample data: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def main():
    """Main setup function"""
    try:
        logger.info("Setting up PROPER 2.9 database...")
        
        # Initialize database tables
        init_db()
        logger.info("Database tables created successfully")
        
        # Create sample data
        create_sample_data()
        
        logger.info("Database setup completed successfully!")
        
    except Exception as e:
        logger.error(f"Database setup failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 