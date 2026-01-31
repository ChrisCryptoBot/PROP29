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
    EquipmentUpdate,
    EquipmentResponse,
    MaintenanceRequestCreate,
    MaintenanceRequestUpdate,
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
            return [EquipmentResponse.model_validate(i) for i in items]
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

            db_item = Equipment(**data.model_dump())
            db.add(db_item)
            db.commit()
            db.refresh(db_item)
            return EquipmentResponse.model_validate(db_item)
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
            return [MaintenanceRequestResponse.model_validate(r) for r in requests]
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
                **data.model_dump(),
                reported_by=user_name
            )
            db.add(db_request)
            db.commit()
            db.refresh(db_request)
            return MaintenanceRequestResponse.model_validate(db_request)
        finally:
            db.close()

    @staticmethod
    async def get_equipment_by_id(user_id: str, equipment_id: str) -> EquipmentResponse:
        """Get a single equipment item by ID"""
        db = SessionLocal()
        try:
            equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
            if not equipment:
                raise ValueError("Equipment not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if str(equipment.property_id) not in user_property_ids:
                raise ValueError("Access denied to this equipment")

            return EquipmentResponse.from_orm(equipment)
        finally:
            db.close()

    @staticmethod
    async def update_equipment(user_id: str, equipment_id: str, data: EquipmentUpdate) -> EquipmentResponse:
        """Update equipment"""
        db = SessionLocal()
        try:
            equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
            if not equipment:
                raise ValueError("Equipment not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if str(equipment.property_id) not in user_property_ids:
                raise ValueError("Access denied to this equipment")

            # Update fields
            update_data = data.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(equipment, key, value)
            
            equipment.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(equipment)
            return EquipmentResponse.model_validate(equipment)
        finally:
            db.close()

    @staticmethod
    async def delete_equipment(user_id: str, equipment_id: str) -> None:
        """Delete equipment"""
        db = SessionLocal()
        try:
            equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
            if not equipment:
                raise ValueError("Equipment not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if str(equipment.property_id) not in user_property_ids:
                raise ValueError("Access denied to this equipment")

            db.delete(equipment)
            db.commit()
        finally:
            db.close()

    @staticmethod
    async def get_maintenance_request_by_id(user_id: str, request_id: str) -> MaintenanceRequestResponse:
        """Get a single maintenance request by ID"""
        db = SessionLocal()
        try:
            request = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request_id).first()
            if not request:
                raise ValueError("Maintenance request not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if str(request.property_id) not in user_property_ids:
                raise ValueError("Access denied to this maintenance request")

            return MaintenanceRequestResponse.model_validate(request)
        finally:
            db.close()

    @staticmethod
    async def update_maintenance_request(user_id: str, request_id: str, data: MaintenanceRequestUpdate) -> MaintenanceRequestResponse:
        """Update maintenance request"""
        db = SessionLocal()
        try:
            request = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == request_id).first()
            if not request:
                raise ValueError("Maintenance request not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if str(request.property_id) not in user_property_ids:
                raise ValueError("Access denied to this maintenance request")

            # Update fields
            update_data = data.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(request, key, value)
            
            # Set completed_at if status is being updated to completed/resolved
            if update_data.get("status") in ["completed", "resolved"] and not request.completed_at:
                request.completed_at = datetime.utcnow()
            
            request.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(request)
            return MaintenanceRequestResponse.model_validate(request)
        finally:
            db.close()
