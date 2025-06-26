from typing import Optional
from database import SessionLocal
from models import User
from schemas import UserUpdate, UserResponse
import logging

logger = logging.getLogger(__name__)

class UserService:
    @staticmethod
    async def get_user_by_id(user_id: str) -> UserResponse:
        """Get user by ID"""
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.user_id == user_id).first()
            if not user:
                raise ValueError("User not found")
            
            return UserResponse(
                user_id=user.user_id,
                email=user.email,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                preferred_language=user.preferred_language,
                timezone=user.timezone,
                status=user.status,
                profile_image_url=user.profile_image_url,
                created_at=user.created_at,
                updated_at=user.updated_at,
                last_login=user.last_login,
                roles=[]
            )
        finally:
            db.close()
    
    @staticmethod
    async def update_user(user_id: str, user_update: UserUpdate) -> UserResponse:
        """Update user information"""
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.user_id == user_id).first()
            if not user:
                raise ValueError("User not found")
            
            # Update fields
            update_data = user_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(user, field, value)
            
            db.commit()
            db.refresh(user)
            
            return UserResponse(
                user_id=user.user_id,
                email=user.email,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                preferred_language=user.preferred_language,
                timezone=user.timezone,
                status=user.status,
                profile_image_url=user.profile_image_url,
                created_at=user.created_at,
                updated_at=user.updated_at,
                last_login=user.last_login,
                roles=[]
            )
        finally:
            db.close() 