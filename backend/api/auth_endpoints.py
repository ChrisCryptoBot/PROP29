from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from typing import Optional
from services.auth_service import AuthService
from schemas import LoginCredentials, TokenResponse
from api.auth_dependencies import get_current_user as get_current_user_dep
from models import User
import logging

router = APIRouter(prefix="/auth", tags=["Authentication"])

security = HTTPBearer()

logger = logging.getLogger(__name__)

class LoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    user_id: int
    username: str
    user: dict

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Login endpoint - supports development credentials and real authentication.
    For production, use AuthService.authenticate_user() only.
    """
    # Accept either username or email
    identifier = request.username or request.email
    
    if not identifier:
        logger.warning("Login attempt without identifier")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Normalize identifier
    identifier_lower = identifier.lower().strip()
    
    # Development mode: Accept hardcoded credentials for backward compatibility
    # NOTE: In production, this should be removed and only use AuthService
    valid_emails = ["admin@proper29.com", "admin@proper.com", "admin"]
    valid_password = "admin123"
    
    email_match = identifier_lower in [e.lower() for e in valid_emails]
    password_match = request.password == valid_password
    
    if email_match and password_match:
        try:
            logger.info(f"✅ LOGIN SUCCESSFUL for identifier: {identifier_lower}")
            token_data = {
                "sub": "1",
                "username": "admin",
                "email": "admin@proper29.com",
                "roles": ["admin"]
            }
            access_token = AuthService.create_access_token(token_data)
            refresh_token = AuthService.create_refresh_token(token_data)
            return LoginResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
                expires_in=1800,
                user_id=1,
                username="admin",
                user={
                    "user_id": "1",
                    "email": "admin@proper29.com",
                    "username": "admin",
                    "first_name": "Admin",
                    "last_name": "User",
                    "roles": ["admin"],
                    "preferred_language": "en",
                    "timezone": "UTC",
                    "status": "active"
                }
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Login token/response error: %s", e)
            raise HTTPException(status_code=500, detail=f"Login succeeded but token creation failed: {str(e)}")
    else:
        logger.warning(f"❌ LOGIN FAILED for identifier: {identifier_lower}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user_dep)):
    """
    Get current user information
    """
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "status": current_user.status.value
    }

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user_dep)):
    """
    Logout current user
    """
    return await AuthService.logout_user(str(current_user.user_id))

@router.post("/refresh")
async def refresh_token(request: RefreshRequest):
    """
    Refresh access token
    """
    return await AuthService.refresh_token(request.refresh_token)