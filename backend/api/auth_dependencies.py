"""
Authentication Dependencies for FastAPI
Provides get_current_user dependency for JWT token validation
"""
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, UserRole
from typing import List
import os
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    FastAPI dependency that validates JWT token and returns current User
    
    Usage:
        @router.get("/protected")
        async def protected_route(current_user: User = Depends(get_current_user)):
            ...
    """
    token = credentials.credentials

    # No mock tokens - all tokens must be validated via JWT
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Verify JWT token
    try:
        from services.auth_service import AuthService
        payload = AuthService.verify_token(token)
        user_id = payload.get("user_id")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Get user from database
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.user_id == user_id).first()
            if not user:
                logger.warning(f"Token valid but user not found: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
            
            # Check if user is active
            if user.status.value != "active":
                logger.warning(f"Login attempt for inactive user: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Account is not active"
                )
            
            return user
        finally:
            db.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


def get_user_properties(user: User) -> List[str]:
    """
    Get list of property IDs that a user has access to
    
    Args:
        user: User object
        
    Returns:
        List of property_id strings
    """
    db = SessionLocal()
    try:
        user_roles = db.query(UserRole).filter(
            UserRole.user_id == user.user_id,
            UserRole.is_active == True
        ).all()
        
        property_ids = [role.property_id for role in user_roles]
        return property_ids
    finally:
        db.close()


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security_optional)
) -> User | None:
    """
    Optional auth dependency for development and non-sensitive endpoints.
    Returns None when no credentials are provided.
    """
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        # Treat invalid/expired token as anonymous for optional auth
        return None


def check_user_has_property_access(user: User, property_id: str) -> bool:
    """
    Check if user has access to a specific property
    
    Args:
        user: User object
        property_id: Property ID to check
        
    Returns:
        True if user has access, False otherwise
    """
    user_properties = get_user_properties(user)
    return property_id in user_properties


def require_admin_role(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to check if user has admin role
    Raises HTTPException if user is not admin
    
    Usage:
        @router.delete("/resource/{id}")
        async def delete_resource(
            current_user: User = Depends(require_admin_role)
        ):
            ...
    
    Returns:
        User object if admin
        
    Raises:
        HTTPException 403 if not admin
    """
    db = SessionLocal()
    try:
        admin_roles = db.query(UserRole).filter(
            UserRole.user_id == current_user.user_id,
            UserRole.role_name == "admin",
            UserRole.is_active == True
        ).first()
        
        if not admin_roles:
            logger.warning(f"Non-admin user attempted admin operation: {current_user.user_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required"
            )
        
        return current_user
    finally:
        db.close()


def require_security_manager_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to check if user has admin or security_manager role.
    """
    db = SessionLocal()
    try:
        role = db.query(UserRole).filter(
            UserRole.user_id == current_user.user_id,
            UserRole.role_name.in_(["admin", "security_manager", "security_officer"]),
            UserRole.is_active == True
        ).first()

        if not role:
            logger.warning(f"User {current_user.user_id} attempted security manager operation")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin, security manager, or security officer privileges required"
            )

        return current_user
    finally:
        db.close()


def require_role(user: User, required_role: str) -> User:
    """
    Check if user has a specific role on any property
    
    Args:
        user: Current user
        required_role: Role name to check (e.g., "admin", "security_manager")
        
    Returns:
        User object if has role
        
    Raises:
        HTTPException 403 if doesn't have role
    """
    db = SessionLocal()
    try:
        roles = db.query(UserRole).filter(
            UserRole.user_id == user.user_id,
            UserRole.role_name == required_role,
            UserRole.is_active == True
        ).first()
        
        if not roles:
            logger.warning(f"User {user.user_id} attempted operation requiring role {required_role}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{required_role} role required"
            )
        
        return user
    finally:
        db.close()


async def verify_hardware_ingest_key(
    x_api_key: str | None = Header(default=None, alias="x-api-key")
) -> bool:
    """
    Validate hardware ingest requests via shared API key.
    Falls back to allow if HARDWARE_INGEST_KEY is not set.
    """
    expected = os.getenv("HARDWARE_INGEST_KEY")
    if not expected:
        logger.warning("HARDWARE_INGEST_KEY not set; allowing ingest without key.")
        return True

    if not x_api_key or x_api_key != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid hardware ingest key"
        )

    return True
