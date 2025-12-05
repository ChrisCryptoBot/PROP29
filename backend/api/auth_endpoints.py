from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Authentication"])

security = HTTPBearer()

class LoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str
    user: dict

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    # Simple mock authentication for development
    # Accept either username or email
    identifier = request.username or request.email
    
    # Debug logging
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"🔐 Login attempt received:")
    logger.info(f"   username: {request.username}")
    logger.info(f"   email: {request.email}")
    logger.info(f"   identifier: {identifier}")
    logger.info(f"   password provided: {bool(request.password)}")
    
    # Accept multiple email variations for development
    valid_emails = ["admin@proper29.com", "admin@proper.com", "admin"]
    valid_password = "admin123"
    
    # Check if identifier exists and matches, and password matches
    if not identifier:
        logger.warning("❌ No identifier provided (neither username nor email)")
        raise HTTPException(status_code=401, detail="Invalid credentials. Use: admin@proper.com / admin123")
    
    identifier_lower = identifier.lower().strip()
    password_match = request.password == valid_password
    email_match = identifier_lower in [e.lower() for e in valid_emails]
    
    logger.info(f"   identifier_lower: {identifier_lower}")
    logger.info(f"   password_match: {password_match}")
    logger.info(f"   email_match: {email_match}")
    
    if email_match and password_match:
        logger.info("✅ Login successful!")
        return LoginResponse(
            access_token="mock-token-12345",
            token_type="bearer",
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
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials. Use: admin@proper.com / admin123")

@router.get("/me")
async def get_current_user():
    return {
        "user_id": 1,
        "username": "admin",
        "role": "admin"
    }