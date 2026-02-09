from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import SessionLocal
from models import Property, UserRole, User
from api.auth_dependencies import get_current_user
from schemas import PropertyResponse

router = APIRouter(prefix="/users", tags=["Users"])


class UserMeResponse(BaseModel):
    user_id: str
    email: str
    username: str
    first_name: str
    last_name: str
    roles: List[str]
    profile_image_url: Optional[str] = None
    preferred_language: str = "en"
    timezone: str = "UTC"
    status: str

    class Config:
        from_attributes = True


class UserMeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    preferred_language: Optional[str] = None
    timezone: Optional[str] = None


@router.get("/me", response_model=UserMeResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile (used by frontend AuthContext)."""
    db = SessionLocal()
    try:
        roles = db.query(UserRole).filter(
            UserRole.user_id == current_user.user_id,
            UserRole.is_active == True
        ).all()
        role_names = [r.role_name.value if hasattr(r.role_name, "value") else str(r.role_name) for r in roles]
        return UserMeResponse(
            user_id=str(current_user.user_id),
            email=current_user.email or "",
            username=current_user.username or "",
            first_name=current_user.first_name or "",
            last_name=current_user.last_name or "",
            roles=role_names,
            profile_image_url=getattr(current_user, "profile_image_url", None),
            preferred_language=getattr(current_user, "preferred_language", None) or "en",
            timezone=getattr(current_user, "timezone", None) or "UTC",
            status=current_user.status.value,
        )
    finally:
        db.close()


@router.put("/me", response_model=UserMeResponse)
async def update_current_user_profile(
    payload: UserMeUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update current user profile (partial update)."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.user_id == current_user.user_id).first()
        if not user:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="User not found")
        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            if hasattr(user, field):
                setattr(user, field, value)
        db.commit()
        db.refresh(user)
        roles = db.query(UserRole).filter(
            UserRole.user_id == user.user_id,
            UserRole.is_active == True
        ).all()
        role_names = [r.role_name.value if hasattr(r.role_name, "value") else str(r.role_name) for r in roles]
        return UserMeResponse(
            user_id=str(user.user_id),
            email=user.email or "",
            username=user.username or "",
            first_name=user.first_name or "",
            last_name=user.last_name or "",
            roles=role_names,
            profile_image_url=getattr(user, "profile_image_url", None),
            preferred_language=getattr(user, "preferred_language", None) or "en",
            timezone=getattr(user, "timezone", None) or "UTC",
            status=user.status.value,
        )
    finally:
        db.close()


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