from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from database import get_db
from api.auth_dependencies import get_current_user
from models import User
from schemas import (
    UserCreate, UserUpdate, UserResponse,
    RoleCreate, RoleUpdate, RoleResponse,
    PropertyCreate, PropertyUpdate, PropertyResponse,
    SystemLogResponse, AccessControlAuditLogResponse,
    IntegrationCreate, IntegrationResponse,
    SystemSettingCreate, SystemSettingResponse
)
from services.system_admin_service import SystemAdminService

router = APIRouter(prefix="/system-admin", tags=["System Administration"])

def get_service(db: Session = Depends(get_db)):
    return SystemAdminService(db)

# --- User Management ---

@router.get("/users", response_model=List[UserResponse])
async def get_admin_users(
    skip: int = 0, 
    limit: int = 100, 
    property_id: Optional[str] = None,
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """List admin-managed users."""
    return service.get_users(skip, limit, property_id)

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_admin_user(
    user_id: str,
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Get a specific user."""
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_user(
    user: UserCreate, 
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Create a new user."""
    try:
        return service.create_user(user, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_admin_user(
    user_id: str, 
    user: UserUpdate, 
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Update a user."""
    try:
        return service.update_user(user_id, user, current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/users/{user_id}")
async def delete_admin_user(
    user_id: str, 
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Delete (deactivate) a user."""
    success = service.delete_user(user_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"deleted": True, "id": user_id}

# --- Role Management ---

@router.post("/roles/assign", response_model=dict)
async def assign_role(
    role: RoleCreate,
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Assign a role to a user."""
    new_role = service.assign_role(role, current_user.user_id)
    return {"status": "assigned", "role_id": new_role.role_id}

@router.delete("/roles/{role_id}")
async def revoke_role(
    role_id: str,
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Revoke a role."""
    success = service.revoke_role(role_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"revoked": True}

# --- Property Management ---

@router.get("/properties", response_model=List[PropertyResponse])
async def get_admin_properties(
    skip: int = 0,
    limit: int = 100,
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """List properties."""
    return service.get_properties(skip, limit)

@router.post("/properties", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_property(
    property: PropertyCreate,
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Create a new property."""
    return service.create_property(property, current_user.user_id)

# --- Logs ---

@router.get("/logs/system", response_model=List[SystemLogResponse])
async def get_system_logs(
    limit: int = 100,
    service_name: Optional[str] = None,
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Get system logs."""
    return service.get_system_logs(limit, service_name)

@router.get("/logs/access", response_model=List[AccessControlAuditLogResponse])
async def get_access_logs(
    limit: int = 100,
    property_id: Optional[str] = None,
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Get access control audit logs."""
    return service.get_access_logs(limit, property_id)

# --- Integration Management ---

@router.get("/integrations", response_model=List[IntegrationResponse])
async def get_integrations(
    property_id: str,
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """List integrations for a property."""
    return service.get_integrations(property_id)

@router.post("/integrations", response_model=IntegrationResponse, status_code=status.HTTP_201_CREATED)
async def create_integration(
    integration: IntegrationCreate,
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Create a new integration."""
    return service.create_integration(integration)

@router.delete("/integrations/{integration_id}")
async def delete_integration(
    integration_id: str,
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Delete an integration."""
    success = service.delete_integration(integration_id)
    if not success:
        raise HTTPException(status_code=404, detail="Integration not found")
    return {"deleted": True, "id": integration_id}

# --- System Settings ---

@router.get("/settings", response_model=List[SystemSettingResponse])
async def get_system_settings(
    keys: Optional[List[str]] = Query(None),
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Get system-wide settings."""
    return service.get_settings(keys)

@router.put("/settings", response_model=List[SystemSettingResponse])
async def update_settings(
    settings: List[SystemSettingCreate],
    service: SystemAdminService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Update system settings (bulk upsert)."""
    updated_settings = []
    for s in settings:
        updated_settings.append(service.upsert_setting(s, current_user.user_id))
    return updated_settings
