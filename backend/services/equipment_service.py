"""
Equipment Service
Business logic for equipment tracking and maintenance request management.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Equipment, MaintenanceRequest, User, UserRole
from schemas import (
    EquipmentCreate,
    EquipmentResponse,
    MaintenanceRequestCreate,
    MaintenanceRequestResponse
)
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class EquipmentService:
    @staticmethod
    async def get_equipment(user_id: str, property_id: str, category: Optional[str] = None) -> List[EquipmentResponse]:
        """Get equipment for a property"""
        db = SessionLocal()
        try:
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if property_id not in user_property_ids:
                raise ValueError("Access denied to this property")

            query = db.query(Equipment).filter(Equipment.property_id == property_id)
            if category:
                query = query.filter(Equipment.category == category)
            
            items = query.all()
            return [EquipmentResponse.from_orm(i) for i in items]
        finally:
            db.close()

    @staticmethod
    async def create_equipment(user_id: str, data: EquipmentCreate) -> EquipmentResponse:
        """Create new equipment"""
        db = SessionLocal()
        try:
            # Check property access (admin/manager preferred)
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if str(data.property_id) not in user_property_ids:
                raise ValueError("Access denied to this property")

            db_item = Equipment(**data.dict())
            db.add(db_item)
            db.commit()
            db.refresh(db_item)
            return EquipmentResponse.from_orm(db_item)
        finally:
            db.close()

    @staticmethod
    async def get_maintenance_requests(user_id: str, property_id: str, status: Optional[str] = None) -> List[MaintenanceRequestResponse]:
        """Get maintenance requests for a property"""
        db = SessionLocal()
        try:
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if property_id not in user_property_ids:
                raise ValueError("Access denied to this property")

            query = db.query(MaintenanceRequest).filter(MaintenanceRequest.property_id == property_id)
            if status:
                query = query.filter(MaintenanceRequest.status == status)
            
            requests = query.all()
            return [MaintenanceRequestResponse.from_orm(r) for r in requests]
        finally:
            db.close()

    @staticmethod
    async def create_maintenance_request(user_id: str, data: MaintenanceRequestCreate) -> MaintenanceRequestResponse:
        """Create new maintenance request"""
        db = SessionLocal()
        try:
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if str(data.property_id) not in user_property_ids:
                raise ValueError("Access denied to this property")

            # Get user info
            user = db.query(User).filter(User.user_id == user_id).first()
            user_name = f"{user.first_name} {user.last_name}" if user else "System"

            db_request = MaintenanceRequest(
                **data.dict(),
                reported_by=user_name
            )
            db.add(db_request)
            db.commit()
            db.refresh(db_request)
            return MaintenanceRequestResponse.from_orm(db_request)
        finally:
            db.close()
