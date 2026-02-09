
import pytest
from services.system_admin_service import SystemAdminService
from schemas import IntegrationCreate, SystemSettingCreate
from services.system_admin_service import SystemAdminService
from schemas import PropertyCreate, PropertyType, UserCreate

class TestSystemAdminIntegrations:
    @pytest.fixture
    def service(self, db_session):
        return SystemAdminService(db_session)

    @pytest.fixture
    def setup_data(self, db_session):
        sa = SystemAdminService(db_session)
        prop = sa.create_property(
            PropertyCreate(
                property_name="Integration Prop", property_type=PropertyType.HOTEL,
                address={}, contact_info={}, room_count=1, capacity=1, timezone="UTC"
            ),
            creator_id="system"
        )
        user = sa.create_user(
            UserCreate(
                email="admin@example.com", username="admin",
                first_name="Admin", last_name="User", password="password"
            ),
            creator_id="system"
        )
        return {"property": prop, "user": user}

    def test_integration_crud(self, service, setup_data):
        prop_id = setup_data["property"].property_id
        
        # Create
        integration = service.create_integration(
            IntegrationCreate(
                property_id=prop_id,
                name="Opera PMS",
                provider="opera",
                configuration={"url": "http://opera.example.com"},
                status="active"
            )
        )
        assert integration.integration_id is not None
        assert integration.name == "Opera PMS"
        
        # List
        integrations = service.get_integrations(prop_id)
        assert len(integrations) == 1
        assert integrations[0].provider == "opera"
        
        # Delete
        success = service.delete_integration(integration.integration_id)
        assert success is True
        
        integrations = service.get_integrations(prop_id)
        assert len(integrations) == 0

    def test_system_settings_upsert(self, service, setup_data):
        user_id = setup_data["user"].user_id
        
        # Create new setting
        setting = service.upsert_setting(
            SystemSettingCreate(
                key="maintenance_mode",
                value=True,
                description="Global maintenance mode"
            ),
            user_id=user_id
        )
        assert setting.key == "maintenance_mode"
        assert setting.value is True
        
        # Update existing setting
        updated = service.upsert_setting(
            SystemSettingCreate(
                key="maintenance_mode",
                value=False
            ),
            user_id=user_id
        )
        assert updated.setting_id == setting.setting_id
        assert updated.value is False
        
        # Get specific value
        val = service.get_setting_value("maintenance_mode")
        assert val is False
        
        # Get defaults
        val = service.get_setting_value("non_existent", default="default")
        assert val == "default"
