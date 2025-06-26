from typing import List
from database import SessionLocal
from models import Property, UserRole
from schemas import PropertyResponse
import logging

logger = logging.getLogger(__name__)

class PropertyService:
    @staticmethod
    async def get_user_properties(user_id: str) -> List[PropertyResponse]:
        """Get properties accessible to a user"""
        db = SessionLocal()
        try:
            # Get user's roles to find accessible properties
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            
            property_ids = [role.property_id for role in user_roles]
            
            properties = db.query(Property).filter(
                Property.property_id.in_(property_ids),
                Property.is_active == True
            ).all()
            
            return [
                PropertyResponse(
                    property_id=prop.property_id,
                    property_name=prop.property_name,
                    property_type=prop.property_type,
                    address=prop.address,
                    contact_info=prop.contact_info,
                    room_count=prop.room_count,
                    capacity=prop.capacity,
                    timezone=prop.timezone,
                    settings=prop.settings,
                    subscription_tier=prop.subscription_tier,
                    is_active=prop.is_active,
                    created_at=prop.created_at,
                    updated_at=prop.updated_at
                )
                for prop in properties
            ]
        finally:
            db.close()
    
    @staticmethod
    async def get_property(property_id: str, user_id: str) -> PropertyResponse:
        """Get a specific property"""
        db = SessionLocal()
        try:
            # Check if user has access to this property
            user_role = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.property_id == property_id,
                UserRole.is_active == True
            ).first()
            
            if not user_role:
                raise ValueError("Access denied to this property")
            
            property_obj = db.query(Property).filter(
                Property.property_id == property_id,
                Property.is_active == True
            ).first()
            
            if not property_obj:
                raise ValueError("Property not found")
            
            return PropertyResponse(
                property_id=property_obj.property_id,
                property_name=property_obj.property_name,
                property_type=property_obj.property_type,
                address=property_obj.address,
                contact_info=property_obj.contact_info,
                room_count=property_obj.room_count,
                capacity=property_obj.capacity,
                timezone=property_obj.timezone,
                settings=property_obj.settings,
                subscription_tier=property_obj.subscription_tier,
                is_active=property_obj.is_active,
                created_at=property_obj.created_at,
                updated_at=property_obj.updated_at
            )
        finally:
            db.close()
    
    @staticmethod
    async def trigger_lockdown(property_id: str, user_id: str) -> dict:
        """Trigger lockdown procedures for a property"""
        # In a real implementation, this would:
        # 1. Lock all access points
        # 2. Send emergency notifications
        # 3. Activate security protocols
        # 4. Contact emergency services
        
        logger.info(f"Lockdown triggered for property {property_id} by user {user_id}")
        
        return {
            "message": "Lockdown procedures activated",
            "property_id": property_id,
            "status": "active",
            "timestamp": "2024-01-01T12:00:00Z"
        } 