import pytest
from fastapi import status
from datetime import datetime, timedelta

class TestAccessControlEndpoints:
    """Test Access Control API endpoints."""
    
    def test_grant_access(self, client, auth_headers):
        """Test granting access endpoint."""
        access_data = {
            "user_id": 1,
            "door_id": "main_entrance",
            "access_type": "card",
            "permissions": ["entry", "exit"]
        }
        
        response = client.post("/access-control/grant", json=access_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "granted"
    
    def test_deny_access(self, client, auth_headers):
        """Test denying access endpoint."""
        deny_data = {
            "user_id": 1,
            "door_id": "restricted_area",
            "reason": "unauthorized_access"
        }
        
        response = client.post("/access-control/deny", json=deny_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "denied"
    
    def test_get_access_logs(self, client, auth_headers):
        """Test getting access logs endpoint."""
        response = client.get("/access-control/logs", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_biometric_authentication(self, client, auth_headers):
        """Test biometric authentication endpoint."""
        biometric_data = {
            "user_id": 1,
            "biometric_data": "fingerprint_data"
        }
        
        response = client.post("/access-control/biometric", json=biometric_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK

class TestGuestSafetyEndpoints:
    """Test Guest Safety API endpoints."""
    
    def test_create_emergency_alert(self, client, auth_headers):
        """Test creating emergency alert endpoint."""
        alert_data = {
            "alert_type": "panic_button",
            "location": "room_101",
            "severity": "high",
            "description": "Guest pressed panic button"
        }
        
        response = client.post("/guest-safety/alerts", json=alert_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["alert_type"] == alert_data["alert_type"]
    
    def test_get_active_alerts(self, client, auth_headers):
        """Test getting active alerts endpoint."""
        response = client.get("/guest-safety/alerts/active", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_respond_to_emergency(self, client, auth_headers):
        """Test responding to emergency endpoint."""
        response_data = {
            "alert_id": 1,
            "response_type": "immediate",
            "notes": "Security team dispatched"
        }
        
        response = client.post("/guest-safety/respond", json=response_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK

class TestIoTEnvironmentalEndpoints:
    """Test IoT Environmental API endpoints."""
    
    def test_record_sensor_data(self, client, auth_headers):
        """Test recording sensor data endpoint."""
        sensor_data = {
            "sensor_id": "temp_001",
            "sensor_type": "temperature",
            "value": 22.5,
            "unit": "celsius",
            "location": "lobby"
        }
        
        response = client.post("/api/iot/sensors/data", json=sensor_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["sensor_id"] == sensor_data["sensor_id"]
    
    def test_get_sensor_readings(self, client, auth_headers):
        """Test getting sensor readings endpoint."""
        response = client.get("/api/iot/sensors/readings", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_environmental_report(self, client, auth_headers):
        """Test getting environmental report endpoint."""
        params = {
            "start_date": (datetime.now() - timedelta(days=1)).isoformat(),
            "end_date": datetime.now().isoformat(),
            "location": "lobby"
        }
        
        response = client.get("/api/iot/reports/environmental", params=params, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "temperature" in data

class TestSmartParkingEndpoints:
    """Test Smart Parking API endpoints."""
    
    def test_register_vehicle(self, client, auth_headers):
        """Test vehicle registration endpoint."""
        vehicle_data = {
            "license_plate": "ABC123",
            "vehicle_type": "car",
            "owner_name": "John Doe",
            "contact_number": "+1234567890"
        }
        
        response = client.post("/parking/vehicles", json=vehicle_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["license_plate"] == vehicle_data["license_plate"]
    
    def test_park_vehicle(self, client, auth_headers):
        """Test vehicle parking endpoint."""
        park_data = {
            "license_plate": "ABC123",
            "spot_id": "A1"
        }
        
        response = client.post("/parking/park", json=park_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "parked"
    
    def test_get_parking_status(self, client, auth_headers):
        """Test getting parking status endpoint."""
        response = client.get("/parking/status", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_spots" in data
        assert "occupied_spots" in data

class TestSmartLockersEndpoints:
    """Test Smart Lockers API endpoints."""
    
    def test_assign_locker(self, client, auth_headers):
        """Test locker assignment endpoint."""
        assign_data = {
            "user_id": 1,
            "locker_id": "L001",
            "duration_hours": 24
        }
        
        response = client.post("/lockers/assign", json=assign_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["assigned"] is True
    
    def test_access_locker(self, client, auth_headers):
        """Test locker access endpoint."""
        access_data = {
            "user_id": 1,
            "locker_id": "L001",
            "access_type": "open"
        }
        
        response = client.post("/lockers/access", json=access_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["access_granted"] is True
    
    def test_get_locker_status(self, client, auth_headers):
        """Test getting locker status endpoint."""
        response = client.get("/lockers/status", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

class TestBannedIndividualsEndpoints:
    """Test Banned Individuals API endpoints."""
    
    def test_add_banned_individual(self, client, auth_headers):
        """Test adding banned individual endpoint."""
        banned_data = {
            "name": "John Smith",
            "reason": "theft",
            "photo_url": "photo.jpg"
        }
        
        response = client.post("/banned-individuals", json=banned_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == banned_data["name"]
    
    def test_check_individual(self, client, auth_headers):
        """Test checking individual endpoint."""
        check_data = {
            "name": "John Smith",
            "photo_data": "photo_data"
        }
        
        response = client.post("/banned-individuals/check", json=check_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_banned_list(self, client, auth_headers):
        """Test getting banned list endpoint."""
        response = client.get("/banned-individuals", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

class TestDigitalHandoverEndpoints:
    """Test Digital Handover API endpoints."""
    
    def test_create_handover(self, client, auth_headers):
        """Test creating handover endpoint."""
        handover_data = {
            "to_user_id": 2,
            "shift_type": "night",
            "notes": "All systems operational"
        }
        
        response = client.post("/handover", json=handover_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["to_user_id"] == handover_data["to_user_id"]
    
    def test_complete_handover(self, client, auth_headers):
        """Test completing handover endpoint."""
        complete_data = {
            "handover_id": 1,
            "checklist_completed": True,
            "notes": "Handover completed successfully"
        }
        
        response = client.post("/handover/complete", json=complete_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "completed"
    
    def test_get_handover_history(self, client, auth_headers):
        """Test getting handover history endpoint."""
        response = client.get("/handover/history", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

class TestEventLogEndpoints:
    """Test Event Log API endpoints."""
    
    def test_log_event(self, client, auth_headers):
        """Test logging event endpoint."""
        event_data = {
            "event_type": "access_denied",
            "description": "Access denied to restricted area",
            "severity": "medium"
        }
        
        response = client.post("/events/log", json=event_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["event_type"] == event_data["event_type"]
    
    def test_search_events(self, client, auth_headers):
        """Test searching events endpoint."""
        params = {
            "query": "access denied",
            "severity": "medium"
        }
        
        response = client.get("/events/search", params=params, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_event_statistics(self, client, auth_headers):
        """Test getting event statistics endpoint."""
        response = client.get("/events/statistics", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_events" in data

class TestVisitorsEndpoints:
    """Test Visitors API endpoints."""
    
    def test_register_visitor(self, client, auth_headers):
        """Test visitor registration endpoint."""
        visitor_data = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "phone": "+1234567890",
            "purpose": "Meeting",
            "host_id": 1
        }
        
        response = client.post("/visitors", json=visitor_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == visitor_data["name"]
    
    def test_check_in_visitor(self, client, auth_headers):
        """Test visitor check-in endpoint."""
        checkin_data = {"visitor_id": 1}
        
        response = client.post("/visitors/check-in", json=checkin_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "checked_in"
    
    def test_get_visitors(self, client, auth_headers):
        """Test getting visitors endpoint."""
        response = client.get("/visitors", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

class TestPackagesEndpoints:
    """Test Packages API endpoints."""
    
    def test_register_package(self, client, auth_headers):
        """Test package registration endpoint."""
        package_data = {
            "tracking_number": "PKG123456789",
            "recipient_name": "John Doe",
            "recipient_room": "101",
            "carrier": "FedEx",
            "description": "Small package"
        }
        
        response = client.post("/packages", json=package_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["tracking_number"] == package_data["tracking_number"]
    
    def test_deliver_package(self, client, auth_headers):
        """Test package delivery endpoint."""
        delivery_data = {"package_id": 1}
        
        response = client.post("/packages/deliver", json=delivery_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "delivered"
    
    def test_get_packages(self, client, auth_headers):
        """Test getting packages endpoint."""
        response = client.get("/packages", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

class TestLostFoundEndpoints:
    """Test Lost & Found API endpoints."""
    
    def test_register_lost_item(self, client, auth_headers):
        """Test registering lost item endpoint."""
        item_data = {
            "item_type": "phone",
            "description": "iPhone 13, black case",
            "location_found": "lobby"
        }
        
        response = client.post("/lost-found/items", json=item_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["item_type"] == item_data["item_type"]
    
    def test_register_claim(self, client, auth_headers):
        """Test registering claim endpoint."""
        claim_data = {
            "item_id": 1,
            "claimer_name": "John Doe",
            "claimer_contact": "+1234567890",
            "description": "Lost my iPhone 13"
        }
        
        response = client.post("/lost-found/claims", json=claim_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["claimer_name"] == claim_data["claimer_name"]
    
    def test_get_lost_items(self, client, auth_headers):
        """Test getting lost items endpoint."""
        response = client.get("/lost-found/items", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

class TestPatrolEndpoints:
    """Test Patrol API endpoints."""
    
    def test_create_patrol_route(self, client, auth_headers):
        """Test creating patrol route endpoint."""
        route_data = {
            "name": "Night Patrol",
            "checkpoints": ["lobby", "parking", "back_entrance"],
            "estimated_duration": 30
        }
        
        response = client.post("/patrol/routes", json=route_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == route_data["name"]
    
    def test_start_patrol(self, client, auth_headers):
        """Test starting patrol endpoint."""
        start_data = {"route_id": 1}
        
        response = client.post("/patrol/start", json=start_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "in_progress"
    
    def test_record_checkpoint(self, client, auth_headers):
        """Test recording checkpoint endpoint."""
        checkpoint_data = {
            "patrol_id": 1,
            "checkpoint_name": "lobby",
            "notes": "All clear"
        }
        
        response = client.post("/patrol/checkpoint", json=checkpoint_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["checkpoint_name"] == "lobby"

class TestNotificationEndpoints:
    """Test Notification API endpoints."""
    
    def test_send_notification(self, client, auth_headers):
        """Test sending notification endpoint."""
        notification_data = {
            "recipient": "user@example.com",
            "subject": "Test Notification",
            "message": "This is a test notification",
            "type": "email"
        }
        
        response = client.post("/notifications/send", json=notification_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["sent"] is True
    
    def test_get_notification_history(self, client, auth_headers):
        """Test getting notification history endpoint."""
        response = client.get("/notifications/history", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_notification_template(self, client, auth_headers):
        """Test creating notification template endpoint."""
        template_data = {
            "name": "emergency_alert",
            "type": "email",
            "subject": "Emergency Alert",
            "content": "Emergency alert: {alert_type} at {location}"
        }
        
        response = client.post("/notifications/templates", json=template_data, headers=auth_headers)
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == template_data["name"]

class TestAIMLEndpoints:
    """Test AI/ML API endpoints."""
    
    def test_predict_incident_probability(self, client, auth_headers):
        """Test incident probability prediction endpoint."""
        prediction_data = {
            "location": "lobby",
            "time_of_day": "night",
            "day_of_week": "friday"
        }
        
        response = client.post("/ai/predict-incident", json=prediction_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "probability" in data
    
    def test_analyze_access_patterns(self, client, auth_headers):
        """Test access pattern analysis endpoint."""
        params = {"user_id": 1, "days": 30}
        
        response = client.get("/ai/access-patterns", params=params, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "usual_times" in data
    
    def test_detect_anomaly(self, client, auth_headers):
        """Test anomaly detection endpoint."""
        anomaly_data = {
            "data_point": {
                "access_time": "02:30",
                "location": "server_room"
            }
        }
        
        response = client.post("/ai/detect-anomaly", json=anomaly_data, headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "anomaly" in data

class TestWebSocketEndpoints:
    """Test WebSocket endpoints."""
    
    def test_websocket_connection(self, client):
        """Test WebSocket connection."""
        with client.websocket_connect("/ws") as websocket:
            # Send a test message
            websocket.send_json({"type": "ping", "data": "test"})
            
            # Receive response
            response = websocket.receive_json()
            assert response["type"] == "pong"
    
    def test_real_time_updates(self, client, auth_headers):
        """Test real-time updates via WebSocket."""
        with client.websocket_connect("/ws") as websocket:
            # Subscribe to updates
            websocket.send_json({
                "type": "subscribe",
                "channel": "access_logs"
            })
            
            # Create an access log entry
            access_data = {
                "user_id": 1,
                "door_id": "main_entrance",
                "access_type": "card",
                "status": "granted"
            }
            
            # This would trigger a real-time update
            # In a real test, you'd need to mock the background task
            response = websocket.receive_json()
            assert "type" in response 