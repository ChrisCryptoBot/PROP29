from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from models import (
    User, UserRole, Property, AccessControlAuditLog, SystemLog, 
    UserStatus, UserRoleEnum, APIKey, Integration, SystemSetting
)
from schemas import (
    UserCreate, UserUpdate, PropertyCreate, PropertyUpdate,
    RoleCreate, RoleUpdate, SystemLogResponse, AccessControlAuditLogResponse,
    APIKeyCreate, IntegrationCreate, SystemSettingCreate
)
from services.auth_service import AuthService
from services.event_log_service import EventLogService
import logging
import uuid
import secrets

logger = logging.getLogger(__name__)

class SystemAdminService:
    def __init__(self, db: Session):
        self.db = db
        self.event_log = EventLogService()

    # User Management
    def get_users(self, skip: int = 0, limit: int = 100, property_id: Optional[str] = None) -> List[User]:
        query = self.db.query(User)
        if property_id:
            query = query.join(UserRole).filter(UserRole.property_id == property_id)
        return query.offset(skip).limit(limit).all()

    def get_user(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.user_id == user_id).first()

    def create_user(self, user_data: UserCreate, creator_id: str) -> User:
        # Check if email or username exists
        if self.db.query(User).filter((User.email == user_data.email) | (User.username == user_data.username)).first():
            raise ValueError("Email or Username already exists")

        new_user = User(
            user_id=str(uuid.uuid4()),
            email=user_data.email,
            username=user_data.username,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            preferred_language=user_data.preferred_language,
            timezone=user_data.timezone,
            password_hash=AuthService.get_password_hash(user_data.password),
            status=UserStatus.ACTIVE
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        
        self.event_log.log_event(
            event_type="USER_CREATED", 
            user_id=creator_id, 
            description=f"Created user {new_user.username}",
            metadata={"new_user_id": new_user.user_id}
        )
        return new_user

    def update_user(self, user_id: str, user_update: UserUpdate, updater_id: str) -> User:
        user = self.get_user(user_id)
        if not user:
            raise ValueError("User not found")
        
        update_data = user_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(user, key, value)
            
        self.db.commit()
        self.db.refresh(user)
        
        self.event_log.log_event(
            event_type="USER_UPDATED", 
            user_id=updater_id, 
            description=f"Updated user {user.username}",
            metadata={"updated_fields": list(update_data.keys())}
        )
        return user
        
    def delete_user(self, user_id: str, deleter_id: str) -> bool:
        user = self.get_user(user_id)
        if not user:
            return False
            
        # Soft delete by setting status to inactive/suspended or actually delete?
        # For system admin, maybe hard delete is allowed, but soft delete is safer.
        # Let's do soft delete for now.
        user.status = UserStatus.INACTIVE
        self.db.commit()
        
        self.event_log.log_event(
            event_type="USER_DELETED", 
            user_id=deleter_id, 
            description=f"Deactivated user {user.username}",
            metadata={"deleted_user_id": user_id}
        )
        return True

    # Role Management
    def assign_role(self, role_data: RoleCreate, assigner_id: str) -> UserRole:
        user_role = UserRole(
            role_id=str(uuid.uuid4()),
            user_id=role_data.user_id,
            property_id=role_data.property_id,
            role_name=role_data.role_name,
            permissions=role_data.permissions,
            assigned_by=assigner_id,
            expires_at=role_data.expires_at
        )
        self.db.add(user_role)
        self.db.commit()
        self.db.refresh(user_role)
        return user_role

    def revoke_role(self, role_id: str, revoker_id: str) -> bool:
        role = self.db.query(UserRole).filter(UserRole.role_id == role_id).first()
        if not role:
            return False
        
        self.db.delete(role)
        self.db.commit()
        return True

    # Property Management
    def get_properties(self, skip: int = 0, limit: int = 100) -> List[Property]:
        return self.db.query(Property).offset(skip).limit(limit).all()

    def create_property(self, property_data: PropertyCreate, creator_id: str) -> Property:
        new_property = Property(
            property_id=str(uuid.uuid4()),
            property_name=property_data.property_name,
            property_type=property_data.property_type,
            address=property_data.address,
            contact_info=property_data.contact_info,
            room_count=property_data.room_count,
            capacity=property_data.capacity,
            timezone=property_data.timezone
        )
        self.db.add(new_property)
        self.db.commit()
        self.db.refresh(new_property)
        return new_property

    # System Logs
    def get_system_logs(self, limit: int = 100, service: Optional[str] = None) -> List[SystemLog]:
        query = self.db.query(SystemLog).order_by(desc(SystemLog.timestamp))
        if service:
            query = query.filter(SystemLog.service == service)
        return query.limit(limit).all()
        
    def get_access_logs(self, limit: int = 100, property_id: Optional[str] = None) -> List[AccessControlAuditLog]:
        query = self.db.query(AccessControlAuditLog).order_by(desc(AccessControlAuditLog.timestamp))
        if property_id:
            query = query.filter(AccessControlAuditLog.property_id == property_id)
        return query.limit(limit).all()

    # API Key Management
    def create_api_key(self, key_data: APIKeyCreate, creator_id: str) -> Dict[str, Any]:
        """Creates a new API key. Returns the raw key only once."""
        raw_key = secrets.token_urlsafe(32)
        key_prefix = raw_key[:8]
        key_hash = AuthService.get_password_hash(raw_key) # Use same hashing as passwords for simplicity
        
        new_key = APIKey(
            key_id=str(uuid.uuid4()),
            property_id=str(key_data.property_id),
            name=key_data.name,
            key_hash=key_hash,
            prefix=key_prefix,
            created_by=creator_id,
            scopes=key_data.scopes
            # expires_at could be calculated from days
        )
        
        self.db.add(new_key)
        self.db.commit()
        self.db.refresh(new_key)
        
        return {
            "api_key_object": new_key,
            "raw_key": raw_key 
        }

    def list_api_keys(self, property_id: str) -> List[APIKey]:
        return self.db.query(APIKey).filter(APIKey.property_id == property_id).all()

    def revoke_api_key(self, key_id: str) -> bool:
        key = self.db.query(APIKey).filter(APIKey.key_id == key_id).first()
        if key:
            self.db.delete(key)
            self.db.commit()
            return True
        return False

    # Integration Management
    def create_integration(self, integration_data: IntegrationCreate) -> Integration:
        integration = Integration(
            integration_id=str(uuid.uuid4()),
            property_id=integration_data.property_id,
            name=integration_data.name,
            provider=integration_data.provider,
            configuration=integration_data.configuration,
            status=integration_data.status
        )
        self.db.add(integration)
        self.db.commit()
        self.db.refresh(integration)
        return integration

    def get_integrations(self, property_id: str) -> List[Integration]:
        return self.db.query(Integration).filter(Integration.property_id == property_id).all()

    def delete_integration(self, integration_id: str) -> bool:
        integration = self.db.query(Integration).filter(Integration.integration_id == integration_id).first()
        if integration:
            self.db.delete(integration)
            self.db.commit()
            return True
        return False

    # System Settings
    def upsert_setting(self, setting_data: SystemSettingCreate, user_id: str) -> SystemSetting:
        setting = self.db.query(SystemSetting).filter(SystemSetting.key == setting_data.key).first()
        if setting:
            setting.value = setting_data.value
            setting.description = setting_data.description
            setting.is_encrypted = setting_data.is_encrypted
            setting.updated_by = user_id
        else:
            setting = SystemSetting(
                setting_id=str(uuid.uuid4()),
                key=setting_data.key,
                value=setting_data.value,
                description=setting_data.description,
                is_encrypted=setting_data.is_encrypted,
                updated_by=user_id
            )
            self.db.add(setting)
        
        self.db.commit()
        self.db.refresh(setting)
        return setting

    def get_settings(self, keys: Optional[List[str]] = None) -> List[SystemSetting]:
        query = self.db.query(SystemSetting)
        if keys:
            query = query.filter(SystemSetting.key.in_(keys))
        return query.all()
    
    def get_setting_value(self, key: str, default: Any = None) -> Any:
        setting = self.db.query(SystemSetting).filter(SystemSetting.key == key).first()
        return setting.value if setting else default
