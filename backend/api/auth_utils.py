"""
Shared authorization utilities for checking user access to properties and resources.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from models import User, UserRole

def check_property_access(db: Session, user: User, property_id: str) -> bool:
    """
    Check if a user has access to a specific property.
    Returns True if user has a role assigned to the property.
    Raises HTTPException if access is denied.
    """
    # System admins have access to all properties
    if user.is_admin:
        return True
    
    # Check if user has any role for this property
    user_role = db.query(UserRole).filter(
        UserRole.user_id == user.user_id,
        UserRole.property_id == property_id
    ).first()
    
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: You do not have access to property {property_id}"
        )
    
    return True
