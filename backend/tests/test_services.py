import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from unittest.mock import Mock, patch

from services.access_control_service import AccessControlService
from services.guest_safety_service import GuestSafetyService
from services.iot_environmental_service import IoTEnvironmentalService
from services.cybersecurity_service import CybersecurityService
from services.smart_parking_service import SmartParkingService
from services.smart_lockers_service import SmartLockersService
from services.banned_individuals_service import BannedIndividualsService
from services.digital_handover_service import DigitalHandoverService
from services.advanced_reports_service import AdvancedReportsService
from services.event_log_service import EventLogService
from services.visitors_service import VisitorsService
from services.packages_service import PackagesService
from services.lost_found_service import LostFoundService
from services.patrol_service import PatrolService
from services.notification_service import NotificationService
from services.ai_ml_service import AIMLService

class TestAccessControlService:
    """Test Access Control Service functionality."""
    
    def test_grant_access(self, db_session):
        """Test granting access to a user."""
        service = AccessControlService(db_session)
        
        access_data = {
            "user_id": 1,
            "door_id": "main_entrance",
            "access_type": "card",
            "permissions": ["entry", "exit"]
        }
        
        result = service.grant_access(**access_data)
        assert result["status"] == "granted"
        assert result["user_id"] == access_data["user_id"]
    
    def test_deny_access(self, db_session):
        """Test denying access to a user."""
        service = AccessControlService(db_session)
        
        result = service.deny_access(
            user_id=1,
            door_id="restricted_area",
            reason="unauthorized_access"
        )
        assert result["status"] == "denied"
        assert result["reason"] == "unauthorized_access"
    
    def test_get_access_logs(self, db_session):
        """Test retrieving access logs."""
        service = AccessControlService(db_session)
        
        logs = service.get_access_logs(
            user_id=1,
            start_date=datetime.now() - timedelta(days=7),
            end_date=datetime.now()
        )
        assert isinstance(logs, list)
    
    @patch('services.access_control_service.biometric_verify')
    def test_biometric_authentication(self, mock_biometric, db_session):
        """Test biometric authentication."""
        mock_biometric.return_value = True
        service = AccessControlService(db_session)
        
        result = service.authenticate_biometric(
            user_id=1,
            biometric_data="fingerprint_data"
        )
        assert result["authenticated"] is True

class TestGuestSafetyService:
    """Test Guest Safety Service functionality."""
    
    def test_create_emergency_alert(self, db_session):
        """Test creating an emergency alert."""
        service = GuestSafetyService(db_session)
        
        alert_data = {
            "alert_type": "panic_button",
            "location": "room_101",
            "severity": "high",
            "description": "Guest pressed panic button"
        }
        
        result = service.create_emergency_alert(**alert_data)
        assert result["alert_type"] == alert_data["alert_type"]
        assert result["status"] == "active"
    
    def test_respond_to_emergency(self, db_session):
        """Test responding to an emergency."""
        service = GuestSafetyService(db_session)
        
        response_data = {
            "alert_id": 1,
            "responder_id": 2,
            "response_type": "immediate",
            "notes": "Security team dispatched"
        }
        
        result = service.respond_to_emergency(**response_data)
        assert result["status"] == "responding"
    
    @patch('services.guest_safety_service.send_notification')
    def test_send_emergency_notification(self, mock_notify, db_session):
        """Test sending emergency notifications."""
        mock_notify.return_value = True
        service = GuestSafetyService(db_session)
        
        result = service.send_emergency_notification(
            alert_id=1,
            recipients=["security@hotel.com", "manager@hotel.com"]
        )
        assert result["sent"] is True

class TestIoTEnvironmentalService:
    """Test IoT Environmental Service functionality."""
    
    def test_record_sensor_data(self, db_session):
        """Test recording sensor data."""
        service = IoTEnvironmentalService(db_session)
        
        sensor_data = {
            "sensor_id": "temp_001",
            "sensor_type": "temperature",
            "value": 22.5,
            "unit": "celsius",
            "location": "lobby"
        }
        
        result = service.record_sensor_data(**sensor_data)
        assert result["sensor_id"] == sensor_data["sensor_id"]
        assert result["value"] == sensor_data["value"]
    
    def test_detect_anomalies(self, db_session):
        """Test anomaly detection."""
        service = IoTEnvironmentalService(db_session)
        
        anomalies = service.detect_anomalies(
            sensor_type="temperature",
            threshold=30.0
        )
        assert isinstance(anomalies, list)
    
    def test_get_environmental_report(self, db_session):
        """Test generating environmental reports."""
        service = IoTEnvironmentalService(db_session)
        
        report = service.get_environmental_report(
            start_date=datetime.now() - timedelta(days=1),
            end_date=datetime.now(),
            location="lobby"
        )
        assert "temperature" in report
        assert "humidity" in report
        assert "air_quality" in report

class TestCybersecurityService:
    """Test Cybersecurity Service functionality."""
    
    def test_detect_threat(self, db_session):
        """Test threat detection."""
        service = CybersecurityService(db_session)
        
        threat_data = {
            "threat_type": "brute_force",
            "source_ip": "192.168.1.100",
            "severity": "high",
            "description": "Multiple failed login attempts"
        }
        
        result = service.detect_threat(**threat_data)
        assert result["threat_type"] == threat_data["threat_type"]
        assert result["status"] == "detected"
    
    def test_block_ip(self, db_session):
        """Test IP blocking functionality."""
        service = CybersecurityService(db_session)
        
        result = service.block_ip(
            ip_address="192.168.1.100",
            reason="suspicious_activity",
            duration_hours=24
        )
        assert result["blocked"] is True
    
    def test_get_security_report(self, db_session):
        """Test security report generation."""
        service = CybersecurityService(db_session)
        
        report = service.get_security_report(
            start_date=datetime.now() - timedelta(days=7),
            end_date=datetime.now()
        )
        assert "threats" in report
        assert "blocked_ips" in report
        assert "security_score" in report

class TestSmartParkingService:
    """Test Smart Parking Service functionality."""
    
    def test_register_vehicle(self, db_session):
        """Test vehicle registration."""
        service = SmartParkingService(db_session)
        
        vehicle_data = {
            "license_plate": "ABC123",
            "vehicle_type": "car",
            "owner_name": "John Doe",
            "contact_number": "+1234567890"
        }
        
        result = service.register_vehicle(**vehicle_data)
        assert result["license_plate"] == vehicle_data["license_plate"]
    
    def test_park_vehicle(self, db_session):
        """Test vehicle parking."""
        service = SmartParkingService(db_session)
        
        result = service.park_vehicle(
            license_plate="ABC123",
            spot_id="A1",
            entry_time=datetime.now()
        )
        assert result["status"] == "parked"
    
    def test_calculate_parking_fee(self, db_session):
        """Test parking fee calculation."""
        service = SmartParkingService(db_session)
        
        fee = service.calculate_parking_fee(
            entry_time=datetime.now() - timedelta(hours=2),
            exit_time=datetime.now(),
            rate_per_hour=5.0
        )
        assert fee > 0

class TestSmartLockersService:
    """Test Smart Lockers Service functionality."""
    
    def test_assign_locker(self, db_session):
        """Test locker assignment."""
        service = SmartLockersService(db_session)
        
        result = service.assign_locker(
            user_id=1,
            locker_id="L001",
            duration_hours=24
        )
        assert result["assigned"] is True
        assert result["locker_id"] == "L001"
    
    def test_access_locker(self, db_session):
        """Test locker access."""
        service = SmartLockersService(db_session)
        
        result = service.access_locker(
            user_id=1,
            locker_id="L001",
            access_type="open"
        )
        assert result["access_granted"] is True
    
    def test_get_locker_status(self, db_session):
        """Test getting locker status."""
        service = SmartLockersService(db_session)
        
        status = service.get_locker_status(locker_id="L001")
        assert "available" in status
        assert "assigned_to" in status

class TestBannedIndividualsService:
    """Test Banned Individuals Service functionality."""
    
    def test_add_banned_individual(self, db_session):
        """Test adding a banned individual."""
        service = BannedIndividualsService(db_session)
        
        banned_data = {
            "name": "John Smith",
            "reason": "theft",
            "photo_url": "photo.jpg",
            "banned_by": 1
        }
        
        result = service.add_banned_individual(**banned_data)
        assert result["name"] == banned_data["name"]
        assert result["status"] == "active"
    
    def test_check_individual(self, db_session):
        """Test checking if an individual is banned."""
        service = BannedIndividualsService(db_session)
        
        result = service.check_individual(
            name="John Smith",
            photo_data="photo_data"
        )
        assert isinstance(result, dict)
    
    @patch('services.banned_individuals_service.facial_recognition')
    def test_facial_recognition_check(self, mock_recognition, db_session):
        """Test facial recognition for banned individuals."""
        mock_recognition.return_value = {"match": True, "confidence": 0.95}
        service = BannedIndividualsService(db_session)
        
        result = service.facial_recognition_check("photo_data")
        assert result["match"] is True

class TestDigitalHandoverService:
    """Test Digital Handover Service functionality."""
    
    def test_create_handover(self, db_session):
        """Test creating a shift handover."""
        service = DigitalHandoverService(db_session)
        
        handover_data = {
            "from_user_id": 1,
            "to_user_id": 2,
            "shift_type": "night",
            "notes": "All systems operational"
        }
        
        result = service.create_handover(**handover_data)
        assert result["from_user_id"] == handover_data["from_user_id"]
        assert result["status"] == "pending"
    
    def test_complete_handover(self, db_session):
        """Test completing a handover."""
        service = DigitalHandoverService(db_session)
        
        result = service.complete_handover(
            handover_id=1,
            checklist_completed=True,
            notes="Handover completed successfully"
        )
        assert result["status"] == "completed"
    
    def test_get_handover_history(self, db_session):
        """Test getting handover history."""
        service = DigitalHandoverService(db_session)
        
        history = service.get_handover_history(
            user_id=1,
            start_date=datetime.now() - timedelta(days=7),
            end_date=datetime.now()
        )
        assert isinstance(history, list)

class TestAdvancedReportsService:
    """Test Advanced Reports Service functionality."""
    
    def test_generate_custom_report(self, db_session):
        """Test generating custom reports."""
        service = AdvancedReportsService(db_session)
        
        report_config = {
            "report_type": "security_summary",
            "date_range": "last_7_days",
            "filters": {"location": "lobby"},
            "format": "pdf"
        }
        
        result = service.generate_custom_report(**report_config)
        assert result["status"] == "generated"
        assert "report_url" in result
    
    def test_get_analytics_dashboard(self, db_session):
        """Test getting analytics dashboard data."""
        service = AdvancedReportsService(db_session)
        
        dashboard = service.get_analytics_dashboard(
            date_range="last_30_days"
        )
        assert "incidents" in dashboard
        assert "access_logs" in dashboard
        assert "visitors" in dashboard
    
    def test_export_data(self, db_session):
        """Test data export functionality."""
        service = AdvancedReportsService(db_session)
        
        export_config = {
            "data_type": "access_logs",
            "format": "csv",
            "date_range": "last_7_days"
        }
        
        result = service.export_data(**export_config)
        assert result["status"] == "exported"
        assert "download_url" in result

class TestEventLogService:
    """Test Event Log Service functionality."""
    
    def test_log_event(self, db_session):
        """Test logging an event."""
        service = EventLogService(db_session)
        
        event_data = {
            "event_type": "access_denied",
            "user_id": 1,
            "description": "Access denied to restricted area",
            "severity": "medium"
        }
        
        result = service.log_event(**event_data)
        assert result["event_type"] == event_data["event_type"]
    
    def test_search_events(self, db_session):
        """Test searching events."""
        service = EventLogService(db_session)
        
        events = service.search_events(
            query="access denied",
            start_date=datetime.now() - timedelta(days=1),
            end_date=datetime.now(),
            severity="medium"
        )
        assert isinstance(events, list)
    
    def test_get_event_statistics(self, db_session):
        """Test getting event statistics."""
        service = EventLogService(db_session)
        
        stats = service.get_event_statistics(
            start_date=datetime.now() - timedelta(days=7),
            end_date=datetime.now()
        )
        assert "total_events" in stats
        assert "events_by_type" in stats
        assert "events_by_severity" in stats

class TestVisitorsService:
    """Test Visitors Service functionality."""
    
    def test_register_visitor(self, db_session):
        """Test visitor registration."""
        service = VisitorsService(db_session)
        
        visitor_data = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "phone": "+1234567890",
            "purpose": "Meeting",
            "host_id": 1
        }
        
        result = service.register_visitor(**visitor_data)
        assert result["name"] == visitor_data["name"]
        assert result["status"] == "registered"
    
    def test_check_in_visitor(self, db_session):
        """Test visitor check-in."""
        service = VisitorsService(db_session)
        
        result = service.check_in_visitor(
            visitor_id=1,
            check_in_time=datetime.now()
        )
        assert result["status"] == "checked_in"
    
    def test_check_out_visitor(self, db_session):
        """Test visitor check-out."""
        service = VisitorsService(db_session)
        
        result = service.check_out_visitor(
            visitor_id=1,
            check_out_time=datetime.now()
        )
        assert result["status"] == "checked_out"

class TestPackagesService:
    """Test Packages Service functionality."""
    
    def test_register_package(self, db_session):
        """Test package registration."""
        service = PackagesService(db_session)
        
        package_data = {
            "tracking_number": "PKG123456789",
            "recipient_name": "John Doe",
            "recipient_room": "101",
            "carrier": "FedEx",
            "description": "Small package"
        }
        
        result = service.register_package(**package_data)
        assert result["tracking_number"] == package_data["tracking_number"]
        assert result["status"] == "received"
    
    def test_deliver_package(self, db_session):
        """Test package delivery."""
        service = PackagesService(db_session)
        
        result = service.deliver_package(
            package_id=1,
            delivered_by=2,
            delivery_time=datetime.now()
        )
        assert result["status"] == "delivered"
    
    def test_notify_recipient(self, db_session):
        """Test recipient notification."""
        service = PackagesService(db_session)
        
        result = service.notify_recipient(
            package_id=1,
            notification_type="delivery"
        )
        assert result["notified"] is True

class TestLostFoundService:
    """Test Lost & Found Service functionality."""
    
    def test_register_lost_item(self, db_session):
        """Test registering a lost item."""
        service = LostFoundService(db_session)
        
        item_data = {
            "item_type": "phone",
            "description": "iPhone 13, black case",
            "location_found": "lobby",
            "found_by": 1
        }
        
        result = service.register_lost_item(**item_data)
        assert result["item_type"] == item_data["item_type"]
        assert result["status"] == "found"
    
    def test_register_claim(self, db_session):
        """Test registering a claim."""
        service = LostFoundService(db_session)
        
        claim_data = {
            "item_id": 1,
            "claimer_name": "John Doe",
            "claimer_contact": "+1234567890",
            "description": "Lost my iPhone 13"
        }
        
        result = service.register_claim(**claim_data)
        assert result["claimer_name"] == claim_data["claimer_name"]
    
    def test_match_items(self, db_session):
        """Test item matching algorithm."""
        service = LostFoundService(db_session)
        
        matches = service.match_items(
            item_type="phone",
            description="iPhone"
        )
        assert isinstance(matches, list)

class TestPatrolService:
    """Test Patrol Service functionality."""
    
    def test_create_patrol_route(self, db_session):
        """Test creating a patrol route."""
        service = PatrolService(db_session)
        
        route_data = {
            "name": "Night Patrol",
            "checkpoints": ["lobby", "parking", "back_entrance"],
            "estimated_duration": 30,
            "assigned_to": 1
        }
        
        result = service.create_patrol_route(**route_data)
        assert result["name"] == route_data["name"]
        assert result["status"] == "active"
    
    def test_start_patrol(self, db_session):
        """Test starting a patrol."""
        service = PatrolService(db_session)
        
        result = service.start_patrol(
            route_id=1,
            started_by=1,
            start_time=datetime.now()
        )
        assert result["status"] == "in_progress"
    
    def test_record_checkpoint(self, db_session):
        """Test recording a checkpoint visit."""
        service = PatrolService(db_session)
        
        result = service.record_checkpoint(
            patrol_id=1,
            checkpoint_name="lobby",
            visit_time=datetime.now(),
            notes="All clear"
        )
        assert result["checkpoint_name"] == "lobby"

class TestNotificationService:
    """Test Notification Service functionality."""
    
    @patch('services.notification_service.send_email')
    def test_send_email_notification(self, mock_email, db_session):
        """Test sending email notifications."""
        mock_email.return_value = True
        service = NotificationService(db_session)
        
        result = service.send_email_notification(
            recipient="user@example.com",
            subject="Test Notification",
            message="This is a test notification"
        )
        assert result["sent"] is True
    
    @patch('services.notification_service.send_sms')
    def test_send_sms_notification(self, mock_sms, db_session):
        """Test sending SMS notifications."""
        mock_sms.return_value = True
        service = NotificationService(db_session)
        
        result = service.send_sms_notification(
            phone_number="+1234567890",
            message="Test SMS notification"
        )
        assert result["sent"] is True
    
    def test_create_notification_template(self, db_session):
        """Test creating notification templates."""
        service = NotificationService(db_session)
        
        template_data = {
            "name": "emergency_alert",
            "type": "email",
            "subject": "Emergency Alert",
            "content": "Emergency alert: {alert_type} at {location}"
        }
        
        result = service.create_notification_template(**template_data)
        assert result["name"] == template_data["name"]

class TestAIMLService:
    """Test AI/ML Service functionality."""
    
    def test_predict_incident_probability(self, db_session):
        """Test incident probability prediction."""
        service = AIMLService(db_session)
        
        prediction = service.predict_incident_probability(
            location="lobby",
            time_of_day="night",
            day_of_week="friday"
        )
        assert "probability" in prediction
        assert 0 <= prediction["probability"] <= 1
    
    def test_analyze_access_patterns(self, db_session):
        """Test access pattern analysis."""
        service = AIMLService(db_session)
        
        patterns = service.analyze_access_patterns(
            user_id=1,
            days=30
        )
        assert "usual_times" in patterns
        assert "unusual_activity" in patterns
    
    @patch('services.ai_ml_service.ml_model.predict')
    def test_anomaly_detection(self, mock_predict, db_session):
        """Test anomaly detection."""
        mock_predict.return_value = {"anomaly": True, "confidence": 0.85}
        service = AIMLService(db_session)
        
        result = service.detect_anomaly(
            data_point={"access_time": "02:30", "location": "server_room"}
        )
        assert result["anomaly"] is True 