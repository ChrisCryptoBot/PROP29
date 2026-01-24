from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Property, UserRole, User
from api.auth_dependencies import get_current_user
from schemas import PropertyResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/")
async def get_users():
    return {"users": []}

@router.get("/properties", response_model=list[PropertyResponse])
async def get_user_properties(current_user: User = Depends(get_current_user)):
    db: Session = SessionLocal()
    try:
        roles = db.query(UserRole).filter(
            UserRole.user_id == current_user.user_id,
            UserRole.is_active == True
        ).all()
        property_ids = [role.property_id for role in roles]
        if not property_ids:
            return []
        properties = db.query(Property).filter(Property.property_id.in_(property_ids)).all()
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