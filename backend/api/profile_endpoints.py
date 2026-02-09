"""
Profile API — current user profile, change password, 2FA, sessions, certifications.
Uses get_current_user; profile extensions (certifications, work schedule, etc.) in-memory per user_id.
"""
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
import base64
from api.auth_dependencies import get_current_user
from models import User, UserRole
from database import SessionLocal
from services.auth_service import AuthService
import logging
import uuid
import time

router = APIRouter(prefix="/profile", tags=["Profile"])

logger = logging.getLogger(__name__)

# --- In-memory storage (keyed by user_id) ---
_profile_extensions: Dict[str, dict] = {}
_two_fa_status: Dict[str, bool] = {}
_sessions: Dict[str, list] = {}

def _default_extensions(user: User) -> dict:
    name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username or "User"
    return {
        "department": "Security Operations",
        "employeeId": "SEC-001",
        "hireDate": "2023-01-15",
        "companyEmail": user.email or "",
        "emergencyContact": {"name": "", "phone": "", "relationship": ""},
        "preferences": {
            "language": user.preferred_language or "en",
            "timezone": user.timezone or "America/New_York",
            "dateFormat": "MM/DD/YYYY",
            "theme": "dark",
        },
        "certifications": [],
        "workSchedule": {
            "shift": "morning",
            "daysOff": ["Saturday", "Sunday"],
            "overtimeEligible": True,
        },
    }

def _role_from_user(user: User) -> str:
    db = SessionLocal()
    try:
        r = db.query(UserRole).filter(UserRole.user_id == user.user_id, UserRole.is_active == True).first()
        if r:
            return r.role_name.value if hasattr(r.role_name, "value") else str(r.role_name)
    finally:
        db.close()
    return "viewer"

def _build_profile(user: User) -> dict:
    ext = _profile_extensions.get(user.user_id) or _default_extensions(user)
    role = _role_from_user(user)
    name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username or "User"
    avatar = ext.get("avatarBase64")
    avatar_url = f"data:image/jpeg;base64,{avatar}" if avatar else user.profile_image_url
    return {
        "id": user.user_id,
        "name": name,
        "email": user.email,
        "role": role,
        "department": ext.get("department", ""),
        "phone": user.phone or "",
        "employeeId": ext.get("employeeId", ""),
        "hireDate": ext.get("hireDate", ""),
        "companyEmail": ext.get("companyEmail", ""),
        "avatar": avatar_url,
        "emergencyContact": ext.get("emergencyContact", {"name": "", "phone": "", "relationship": ""}),
        "preferences": ext.get("preferences", {"language": "en", "timezone": "UTC", "dateFormat": "MM/DD/YYYY", "theme": "dark"}),
        "certifications": ext.get("certifications", []),
        "workSchedule": ext.get("workSchedule", {"shift": "morning", "daysOff": [], "overtimeEligible": False}),
    }

# --- Schemas ---
class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    employeeId: Optional[str] = None
    hireDate: Optional[str] = None
    companyEmail: Optional[str] = None
    emergencyContact: Optional[Dict[str, str]] = None
    preferences: Optional[Dict[str, Any]] = None
    certifications: Optional[List[Dict[str, Any]]] = None
    workSchedule: Optional[Dict[str, Any]] = None

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)

class AddCertificationRequest(BaseModel):
    name: str = Field(..., min_length=1)
    issuer: str = Field(..., min_length=1)
    issueDate: str = Field(..., min_length=1)
    expiryDate: str = Field(..., min_length=1)

class UpdateCertificationRequest(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    issueDate: Optional[str] = None
    expiryDate: Optional[str] = None

# --- Endpoints ---
@router.get("")
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile (User + extensions)."""
    return _build_profile(current_user)

@router.put("")
async def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
):
    """Update current user profile. Updates User table where applicable and in-memory extensions."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.user_id == current_user.user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if body.name is not None:
            parts = (body.name or "").strip().split(None, 1)
            user.first_name = parts[0] if parts else ""
            user.last_name = parts[1] if len(parts) > 1 else ""
        if body.email is not None:
            user.email = body.email
        if body.phone is not None:
            user.phone = body.phone
        if body.preferences is not None:
            if "language" in body.preferences:
                user.preferred_language = body.preferences["language"]
            if "timezone" in body.preferences:
                user.timezone = body.preferences["timezone"]
        db.commit()
        db.refresh(user)
        current_user = user
    finally:
        db.close()

    ext = _profile_extensions.get(current_user.user_id) or _default_extensions(current_user)
    if body.department is not None:
        ext["department"] = body.department
    if body.employeeId is not None:
        ext["employeeId"] = body.employeeId
    if body.companyEmail is not None:
        ext["companyEmail"] = body.companyEmail
    if body.hireDate is not None:
        ext["hireDate"] = body.hireDate
    if body.emergencyContact is not None:
        ext["emergencyContact"] = body.emergencyContact
    if body.preferences is not None:
        ext["preferences"] = {**ext.get("preferences", {}), **body.preferences}
    if body.certifications is not None:
        ext["certifications"] = body.certifications
    if body.workSchedule is not None:
        ext["workSchedule"] = {**ext.get("workSchedule", {}), **body.workSchedule}
    _profile_extensions[current_user.user_id] = ext

    return _build_profile(current_user)

@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
):
    """Change current user password. Verifies current password then updates hash."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.user_id == current_user.user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if not AuthService.verify_password(body.current_password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
        try:
            new_hash = AuthService.get_password_hash(body.new_password)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        user.password_hash = new_hash
        db.commit()
    finally:
        db.close()
    return {"message": "Password updated successfully"}


@router.post("/avatar")
async def upload_avatar(
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...),
):
    """Upload profile picture. Accepts image (JPEG/PNG), max 2MB. Stored as base64 in profile extensions."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image (JPEG or PNG)")
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image must be 2MB or smaller")
    b64 = base64.b64encode(content).decode("ascii")
    ext = _profile_extensions.get(current_user.user_id) or _default_extensions(current_user)
    ext["avatarBase64"] = b64
    _profile_extensions[current_user.user_id] = ext
    logger.info("Avatar updated for user %s", current_user.user_id)
    return _build_profile(current_user)

@router.get("/2fa")
async def get_2fa_status(current_user: User = Depends(get_current_user)):
    """Return whether 2FA is enabled for the current user."""
    enabled = _two_fa_status.get(current_user.user_id, False)
    return {"enabled": enabled}

@router.post("/2fa/enable")
async def enable_2fa(current_user: User = Depends(get_current_user)):
    """Enable 2FA for current user (in-memory; real TOTP would go here)."""
    _two_fa_status[current_user.user_id] = True
    return {"enabled": True, "message": "2FA enabled"}

@router.post("/2fa/disable")
async def disable_2fa(current_user: User = Depends(get_current_user)):
    """Disable 2FA for current user."""
    _two_fa_status[current_user.user_id] = False
    return {"enabled": False, "message": "2FA disabled"}

def _ensure_sessions(user_id: str) -> list:
    if user_id not in _sessions:
        _sessions[user_id] = [
            {"id": "current", "device": "Current session", "location": "Current", "current": True, "lastActive": time.time()},
            {"id": "other-1", "device": "Chrome on Windows", "location": "New York, NY", "current": False, "lastActive": time.time() - 7200},
        ]
    return _sessions[user_id]

@router.get("/sessions")
async def get_sessions(current_user: User = Depends(get_current_user)):
    """List active sessions for current user."""
    return _ensure_sessions(current_user.user_id)

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
):
    """Revoke a session by id (cannot revoke 'current')."""
    if session_id == "current":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot revoke current session")
    sessions = _ensure_sessions(current_user.user_id)
    _sessions[current_user.user_id] = [s for s in sessions if s.get("id") != session_id]
    return {"revoked": session_id}

# --- Certifications (nested in profile; optional dedicated endpoints for add/update/remove) ---
@router.post("/certifications")
async def add_certification(
    body: AddCertificationRequest,
    current_user: User = Depends(get_current_user),
):
    """Add a certification to current user profile."""
    ext = _profile_extensions.get(current_user.user_id) or _default_extensions(current_user)
    certs = list(ext.get("certifications", []))
    new_cert = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "issuer": body.issuer,
        "issueDate": body.issueDate,
        "expiryDate": body.expiryDate,
        "status": "active",
    }
    certs.append(new_cert)
    ext["certifications"] = certs
    _profile_extensions[current_user.user_id] = ext
    return _build_profile(current_user)

@router.put("/certifications/{cert_id}")
async def update_certification(
    cert_id: str,
    body: UpdateCertificationRequest,
    current_user: User = Depends(get_current_user),
):
    """Update a certification by id."""
    ext = _profile_extensions.get(current_user.user_id) or _default_extensions(current_user)
    certs = list(ext.get("certifications", []))
    for i, c in enumerate(certs):
        if c.get("id") == cert_id:
            certs[i] = {**c, **body.model_dump(exclude_unset=True)}
            ext["certifications"] = certs
            _profile_extensions[current_user.user_id] = ext
            return _build_profile(current_user)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certification not found")

@router.delete("/certifications/{cert_id}")
async def remove_certification(
    cert_id: str,
    current_user: User = Depends(get_current_user),
):
    """Remove a certification by id."""
    ext = _profile_extensions.get(current_user.user_id) or _default_extensions(current_user)
    certs = [c for c in ext.get("certifications", []) if c.get("id") != cert_id]
    ext["certifications"] = certs
    _profile_extensions[current_user.user_id] = ext
    return _build_profile(current_user)
