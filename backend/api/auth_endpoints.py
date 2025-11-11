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
    
    if identifier == "admin@proper29.com" and request.password == "admin123":
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
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/me")
async def get_current_user():
    return {
        "user_id": 1,
        "username": "admin",
        "role": "admin"
    }