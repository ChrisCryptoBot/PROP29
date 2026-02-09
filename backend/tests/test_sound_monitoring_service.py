
import pytest
from services.sound_monitoring_service import SoundMonitoringService
from schemas import SoundSensorCreate, MonitoringZoneCreate, SoundAlertCreate
from models import SoundAlertType
import uuid

class TestSoundMonitoringService:
    @pytest.fixture
    def service(self, db_session):
        return SoundMonitoringService(db_session)

    @pytest.fixture
    def setup_data(self, db_session):
        from services.system_admin_service import SystemAdminService
        from schemas import PropertyCreate, PropertyType, UserCreate
        
        sa = SystemAdminService(db_session)
        prop = sa.create_property(
            PropertyCreate(
                property_name="Sound Prop", property_type=PropertyType.HOTEL,
                address={}, contact_info={}, room_count=1, capacity=1, timezone="UTC"
            ),
            creator_id="system"
        )
        
        user = sa.create_user(
            UserCreate(
                email="sound@example.com", username="sounduser",
                first_name="Sound", last_name="User", password="password"
            ),
            creator_id="system"
        )
        return {"property": prop, "user": user}

    def test_create_sensor(self, service, setup_data):
        prop_id = setup_data["property"].property_id
        sensor = service.create_sensor(
            SoundSensorCreate(
                property_id=prop_id,
                name="Lobby Sensor",
                sensitivity=80
            )
        )
        assert sensor.sensor_id is not None
        assert sensor.name == "Lobby Sensor"
        
        sensors = service.get_sensors(prop_id)
        assert len(sensors) == 1
        assert sensors[0].name == "Lobby Sensor"

    def test_create_zone(self, service, setup_data):
        prop_id = setup_data["property"].property_id
        zone = service.create_zone(
            MonitoringZoneCreate(
                property_id=prop_id,
                name="Lobby Zone"
            )
        )
        assert zone.zone_id is not None
        assert zone.name == "Lobby Zone"
        
        zones = service.get_zones(prop_id)
        assert len(zones) == 1

    def test_alert_lifecycle(self, service, setup_data):
        prop_id = setup_data["property"].property_id
        user_id = setup_data["user"].user_id
        
        # Create alert
        alert = service.create_alert(
            SoundAlertCreate(
                property_id=prop_id,
                alert_type="glass_break",
                confidence=0.95,
                audio_clip_url="http://example.com/audio.wav"
            )
        )
        assert alert.alert_id is not None
        assert alert.alert_type == SoundAlertType.GLASS_BREAK
        assert alert.is_verified is False
        
        # List alerts
        alerts = service.get_alerts(prop_id, verified=False)
        assert len(alerts) >= 1
        
        # Verify alert
        updated = service.verify_alert(alert.alert_id, user_id, is_verified=True)
        assert updated.is_verified is True
        assert updated.verified_by == user_id
        
        # Check list filter
        verified_alerts = service.get_alerts(prop_id, verified=True)
        assert len(verified_alerts) >= 1
        assert verified_alerts[0].alert_id == alert.alert_id
