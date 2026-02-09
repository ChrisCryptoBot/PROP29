
import pytest
from services.system_admin_service import SystemAdminService
from schemas import (
    UserCreate, UserUpdate, RoleCreate, RoleUpdate,
    PropertyCreate, PropertyUpdate, APIKeyCreate
)
from models import UserRoleEnum, PropertyType, UserStatus
from datetime import datetime
import uuid

class TestSystemAdminService:
    @pytest.fixture
    def service(self, db_session):
        return SystemAdminService(db_session)

    @pytest.fixture
    def admin_user(self, service):
        return service.create_user(
            UserCreate(
                email="admin_test@example.com",
                username="admin_test",
                first_name="Admin",
                last_name="Test",
                password="password123",
                phone="555-0000"
            ),
            creator_id="system"
        )

    def test_create_user(self, service):
        user_data = UserCreate(
            email="new_user@example.com",
            username="new_user",
            first_name="New",
            last_name="User",
            password="password123",
            phone="555-1234"
        )
        user = service.create_user(user_data, creator_id="admin")
        assert user.email == "new_user@example.com"
        assert user.status == UserStatus.ACTIVE
        assert user.user_id is not None

    def test_get_user(self, service, admin_user):
        fetched_user = service.get_user(admin_user.user_id)
        assert fetched_user is not None
        assert fetched_user.username == "admin_test"

    def test_update_user(self, service, admin_user):
        update_data = UserUpdate(first_name="Updated")
        updated_user = service.update_user(admin_user.user_id, update_data, updater_id="admin")
        assert updated_user.first_name == "Updated"
        assert updated_user.last_name == "Test"  # Unchanged

    def test_delete_user(self, service, admin_user):
        success = service.delete_user(admin_user.user_id, deleter_id="admin")
        assert success is True
        
        # Verify status is inactive (soft delete)
        deleted_user = service.get_user(admin_user.user_id)
        assert deleted_user.status == UserStatus.INACTIVE

    def test_property_management(self, service):
        prop_data = PropertyCreate(
            property_name="Test Hotel",
            property_type=PropertyType.HOTEL,
            address={"city": "Austin"},
            contact_info={"email": "hotel@test.com"},
            room_count=100,
            capacity=200,
            timezone="UTC"
        )
        new_prop = service.create_property(prop_data, creator_id="admin")
        assert new_prop.property_name == "Test Hotel"
        assert new_prop.property_id is not None
        
        props = service.get_properties()
        assert len(props) >= 1
        assert any(p.property_id == new_prop.property_id for p in props)
        
        return new_prop

    def test_role_assignment(self, service, admin_user):
        # Create a property first (helper)
        prop_data = PropertyCreate(
            property_name="Role Test Property",
            property_type=PropertyType.HOTEL,
            address={},
            contact_info={},
            room_count=10,
            capacity=10,
            timezone="UTC"
        )
        prop = service.create_property(prop_data, creator_id="admin")
        
        role_data = RoleCreate(
            user_id=admin_user.user_id,
            property_id=prop.property_id,
            role_name=UserRoleEnum.MANAGER,
            permissions={"read": True},
            expires_at=None
        )
        
        role = service.assign_role(role_data, assigner_id="admin")
        assert role.role_name == UserRoleEnum.MANAGER
        assert role.user_id == admin_user.user_id
        
        # Test revoke
        success = service.revoke_role(role.role_id, revoker_id="admin")
        assert success is True

    def test_api_keys(self, service):
        # Create property
        prop = service.create_property(
            PropertyCreate(
                property_name="API Key Prop",
                property_type=PropertyType.HOTEL,
                address={}, contact_info={}, room_count=1, capacity=1, timezone="UTC"
            ),
            creator_id="admin"
        )
        
        key_data = APIKeyCreate(
            name="Test Device Key",
            property_id=prop.property_id,
            scopes=["hardware:read"],
            expires_days=30
        )
        
        result = service.create_api_key(key_data, creator_id="admin")
        assert "api_key_object" in result
        assert "raw_key" in result
        assert len(result["raw_key"]) > 20
        
        key_obj = result["api_key_object"]
        assert key_obj.property_id == prop.property_id
        assert key_obj.name == "Test Device Key"
        
        # List keys
        keys = service.list_api_keys(prop.property_id)
        assert len(keys) == 1
        assert keys[0].key_id == key_obj.key_id
        
        # Revoke
        success = service.revoke_api_key(key_obj.key_id)
        assert success is True
        
        # Verify revoked (deleted)
        keys_after = service.list_api_keys(prop.property_id)
        assert len(keys_after) == 0
