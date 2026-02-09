
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import SoundSensor, MonitoringZone, SoundAlert, SoundAlertType
from schemas import SoundSensorCreate, MonitoringZoneCreate, SoundAlertCreate
import uuid
import datetime
import logging

logger = logging.getLogger(__name__)

class SoundMonitoringService:
    def __init__(self, db: Session):
        self.db = db

    # Sensor Management
    def create_sensor(self, sensor_data: SoundSensorCreate) -> SoundSensor:
        sensor = SoundSensor(
            sensor_id=str(uuid.uuid4()),
            property_id=sensor_data.property_id,
            name=sensor_data.name,
            location=sensor_data.location,
            sensitivity=sensor_data.sensitivity
        )
        self.db.add(sensor)
        self.db.commit()
        self.db.refresh(sensor)
        return sensor

    def get_sensors(self, property_id: str) -> List[SoundSensor]:
        return self.db.query(SoundSensor).filter(SoundSensor.property_id == property_id).all()

    def update_sensor_heartbeat(self, sensor_id: str):
        sensor = self.db.query(SoundSensor).filter(SoundSensor.sensor_id == sensor_id).first()
        if sensor:
            sensor.last_heartbeat = datetime.datetime.utcnow()
            sensor.status = "active"
            self.db.commit()

    # Zone Management
    def create_zone(self, zone_data: MonitoringZoneCreate) -> MonitoringZone:
        zone = MonitoringZone(
            zone_id=str(uuid.uuid4()),
            property_id=zone_data.property_id,
            name=zone_data.name,
            description=zone_data.description,
            boundary_points=zone_data.boundary_points,
            alert_threshold=zone_data.alert_threshold
        )
        self.db.add(zone)
        self.db.commit()
        self.db.refresh(zone)
        return zone

    def get_zones(self, property_id: str) -> List[MonitoringZone]:
        return self.db.query(MonitoringZone).filter(MonitoringZone.property_id == property_id).all()

    # Alert Management
    def create_alert(self, alert_data: SoundAlertCreate) -> SoundAlert:
        alert = SoundAlert(
            alert_id=str(uuid.uuid4()),
            property_id=alert_data.property_id,
            sensor_id=alert_data.sensor_id,
            zone_id=alert_data.zone_id,
            alert_type=alert_data.alert_type,
            confidence=alert_data.confidence,
            audio_clip_url=alert_data.audio_clip_url
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        
        # Trigger notifications for high-confidence alerts
        if alert_data.confidence >= 0.75:  # High confidence threshold
            try:
                from services.notification_service import NotificationService
                from schemas import NotificationCreate
                from models import UserRole, User
                
                # Find property managers/security staff to notify
                managers = self.db.query(User).join(UserRole).filter(
                    UserRole.property_id == alert_data.property_id,
                    UserRole.role_name.in_(["property_manager", "security_staff"])
                ).all()
                
                notification_service = NotificationService(self.db)
                
                for manager in managers:
                    # Send notification via preferred channel
                    notification_data = NotificationCreate(
                        property_id=alert_data.property_id,
                        user_id=manager.user_id,
                        channel="sms",  # SMS for urgent alerts
                        priority="high",
                        title=f"Sound Alert: {alert_data.alert_type}",
                        content=f"High-confidence sound alert detected. Type: {alert_data.alert_type}, Confidence: {alert_data.confidence:.0%}"
                    )
                    notification_service.send_notification(notification_data)
                    
            except Exception as e:
                logger.error(f"Failed to send alert notification: {e}", exc_info=True)
        
        return alert

    def get_alerts(self, property_id: str, verified: Optional[bool] = None) -> List[SoundAlert]:
        query = self.db.query(SoundAlert).filter(SoundAlert.property_id == property_id)
        if verified is not None:
            query = query.filter(SoundAlert.is_verified == verified)
        return query.order_by(desc(SoundAlert.timestamp)).all()

    def verify_alert(self, alert_id: str, user_id: str, is_verified: bool = True) -> Optional[SoundAlert]:
        alert = self.db.query(SoundAlert).filter(SoundAlert.alert_id == alert_id).first()
        if alert:
            alert.is_verified = is_verified
            alert.verified_by = user_id
            self.db.commit()
            self.db.refresh(alert)
        return alert
