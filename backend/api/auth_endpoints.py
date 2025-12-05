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
    import logging
    logger = logging.getLogger(__name__)
    
    # Debug logging - log everything
    logger.info("=" * 50)
    logger.info("🔐 LOGIN ATTEMPT RECEIVED")
    logger.info(f"   Raw request.username: {repr(request.username)}")
    logger.info(f"   Raw request.email: {repr(request.email)}")
    logger.info(f"   Raw request.password: {repr(request.password)}")
    logger.info(f"   Password length: {len(request.password) if request.password else 0}")
    
    # Accept either username or email
    identifier = request.username or request.email
    logger.info(f"   Extracted identifier: {repr(identifier)}")
    
    # Accept multiple email variations for development
    valid_emails = ["admin@proper29.com", "admin@proper.com", "admin"]
    valid_password = "admin123"
    
    # Check if identifier exists
    if not identifier:
        logger.error("❌ No identifier provided (neither username nor email)")
        raise HTTPException(status_code=401, detail="Invalid credentials. Use: admin@proper.com / admin123")
    
    # Normalize identifier
    identifier_lower = identifier.lower().strip()
    logger.info(f"   Normalized identifier: {repr(identifier_lower)}")
    
    # Check password
    password_match = request.password == valid_password
    logger.info(f"   Password match: {password_match}")
    logger.info(f"   Expected password: {repr(valid_password)}")
    logger.info(f"   Received password: {repr(request.password)}")
    
    # Check email
    email_match = identifier_lower in [e.lower() for e in valid_emails]
    logger.info(f"   Email match: {email_match}")
    logger.info(f"   Valid emails: {valid_emails}")
    
    # Final check
    if email_match and password_match:
        logger.info("✅ LOGIN SUCCESSFUL!")
        logger.info("=" * 50)
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
        logger.error("❌ LOGIN FAILED")
        logger.error(f"   Email match: {email_match}, Password match: {password_match}")
        logger.info("=" * 50)
        raise HTTPException(status_code=401, detail="Invalid credentials. Use: admin@proper.com / admin123")

@router.get("/me")
async def get_current_user():
    return {
        "user_id": 1,
        "username": "admin",
        "role": "admin"
    }