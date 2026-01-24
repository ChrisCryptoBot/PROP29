"""
IoT Environmental Service
"""
from typing import Any, Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import logging

from database import SessionLocal
from models import IoTEnvironmentalData, IoTEnvironmentalAlert, IoTEnvironmentalSettings, Property, SensorType, ThreatSeverity, UserRole, Camera
from services.push_notification_service import PushNotificationService
from schemas import (
    IoTEnvironmentalDataCreate,
    IoTEnvironmentalDataResponse,
    SensorAlertCreate,
    SensorAlertUpdate,
    SensorAlertResponse,
    IoTEnvironmentalSettingsUpdate,
    IoTEnvironmentalSettingsResponse,
)

logger = logging.getLogger(__name__)

class IoTEnvironmentalService:
    def __init__(self, db: Optional[Session] = None):
        self.db = db or SessionLocal()

    def close(self) -> None:
        if self.db:
            self.db.close()

    @staticmethod
    def _get_default_property_id(db: Session, user_id: Optional[str]) -> Optional[str]:
        if user_id:
            role = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).first()
            if role:
                return role.property_id

        prop = db.query(Property).filter(Property.is_active == True).first()
        if prop:
            return prop.property_id
        return None

    @staticmethod
    def _normalize_location(location: Any) -> Any:
        if isinstance(location, dict):
            return location
        if isinstance(location, str):
            return {"label": location}
        return {"label": "Unknown"}

    @staticmethod
    def _map_value_to_columns(sensor_type: SensorType, value: Optional[float]) -> Dict[str, Optional[float]]:
        mapping = {
            SensorType.TEMPERATURE: "temperature",
            SensorType.HUMIDITY: "humidity",
            SensorType.AIR_QUALITY: "air_quality",
            SensorType.SMOKE: "smoke_level",
            SensorType.WATER: "water_level",
            SensorType.GAS: "gas_level",
            SensorType.PRESSURE: "pressure",
            SensorType.VIBRATION: "vibration",
            SensorType.LIGHT: "light_level",
            SensorType.NOISE: "noise_level",
        }
        column = mapping.get(sensor_type)
        if not column:
            return {}
        return {column: value}

    @staticmethod
    def _resolve_status(value: Optional[float], threshold_min: Optional[float], threshold_max: Optional[float]) -> str:
        if value is None:
            return "normal"
        if threshold_min is not None and value < threshold_min:
            return "critical"
        if threshold_max is not None and value > threshold_max:
            return "critical"
        return "normal"

    def _serialize_data(self, data: IoTEnvironmentalData) -> IoTEnvironmentalDataResponse:
        camera_name = None
        if data.camera_id:
            camera = self.db.query(Camera).filter(Camera.camera_id == data.camera_id).first()
            camera_name = camera.name if camera else None
        return IoTEnvironmentalDataResponse(
            data_id=data.data_id,
            property_id=data.property_id,
            sensor_id=data.sensor_id,
            sensor_type=data.sensor_type,
            location=data.location,
            camera_id=data.camera_id,
            camera_name=camera_name,
            value=data.value,
            unit=data.unit,
            light_level=data.light_level,
            noise_level=data.noise_level,
            timestamp=data.timestamp,
            temperature=data.temperature,
            humidity=data.humidity,
            air_quality=data.air_quality,
            smoke_level=data.smoke_level,
            water_level=data.water_level,
            gas_level=data.gas_level,
            pressure=data.pressure,
            vibration=data.vibration,
            battery_level=data.battery_level,
            signal_strength=data.signal_strength,
            threshold_min=data.threshold_min,
            threshold_max=data.threshold_max,
            alerts_triggered=data.alerts_triggered,
            status=data.status,
        )

    def _serialize_alert(self, alert: IoTEnvironmentalAlert) -> SensorAlertResponse:
        camera_name = None
        if alert.camera_id:
            camera = self.db.query(Camera).filter(Camera.camera_id == alert.camera_id).first()
            camera_name = camera.name if camera else None
        return SensorAlertResponse(
            alert_id=alert.alert_id,
            property_id=alert.property_id,
            sensor_id=alert.sensor_id,
            camera_id=alert.camera_id,
            camera_name=camera_name,
            alert_type=alert.alert_type,
            severity=alert.severity,
            message=alert.message,
            location=alert.location,
            light_level=alert.light_level,
            noise_level=alert.noise_level,
            status=alert.status,
            resolved=alert.resolved,
            created_at=alert.created_at,
            resolved_at=alert.resolved_at,
        )

    def record_sensor_data(self, payload: IoTEnvironmentalDataCreate, user_id: Optional[str]) -> IoTEnvironmentalDataResponse:
        property_id = self._get_default_property_id(self.db, user_id)
        if not property_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No property assigned")

        location = self._normalize_location(payload.location)
        sensor = self.db.query(IoTEnvironmentalData).filter(
            IoTEnvironmentalData.property_id == property_id,
            IoTEnvironmentalData.sensor_id == payload.sensor_id
        ).first()

        status_value = self._resolve_status(payload.value, payload.threshold_min, payload.threshold_max)

        if sensor:
            sensor.sensor_type = payload.sensor_type
            sensor.location = location
            sensor.value = payload.value
            sensor.unit = payload.unit
            if payload.camera_id:
                sensor.camera_id = str(payload.camera_id)
            sensor.threshold_min = payload.threshold_min
            sensor.threshold_max = payload.threshold_max
            sensor.status = status_value
            for key, value in self._map_value_to_columns(payload.sensor_type, payload.value).items():
                setattr(sensor, key, value)
        else:
            sensor = IoTEnvironmentalData(
                property_id=property_id,
                sensor_id=payload.sensor_id,
                sensor_type=payload.sensor_type,
                location=location,
                camera_id=str(payload.camera_id) if payload.camera_id else None,
                value=payload.value,
                unit=payload.unit,
                threshold_min=payload.threshold_min,
                threshold_max=payload.threshold_max,
                status=status_value,
                **self._map_value_to_columns(payload.sensor_type, payload.value)
            )
            self.db.add(sensor)

        self.db.commit()
        self.db.refresh(sensor)
        return self._serialize_data(sensor)

    def list_sensor_readings(self, user_id: Optional[str]) -> List[IoTEnvironmentalDataResponse]:
        property_id = self._get_default_property_id(self.db, user_id)
        if not property_id:
            return []
        sensors = self.db.query(IoTEnvironmentalData).filter(
            IoTEnvironmentalData.property_id == property_id
        ).order_by(IoTEnvironmentalData.timestamp.desc()).all()
        return [self._serialize_data(sensor) for sensor in sensors]

    def create_sensor(self, payload: IoTEnvironmentalDataCreate, user_id: Optional[str]) -> IoTEnvironmentalDataResponse:
        return self.record_sensor_data(payload, user_id)

    def update_sensor(self, sensor_id: str, payload: IoTEnvironmentalDataCreate, user_id: Optional[str]) -> IoTEnvironmentalDataResponse:
        property_id = self._get_default_property_id(self.db, user_id)
        if not property_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No property assigned")

        sensor = self.db.query(IoTEnvironmentalData).filter(
            IoTEnvironmentalData.property_id == property_id,
            IoTEnvironmentalData.sensor_id == sensor_id
        ).first()
        if not sensor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor not found")

        sensor.sensor_type = payload.sensor_type
        sensor.location = self._normalize_location(payload.location)
        sensor.threshold_min = payload.threshold_min
        sensor.threshold_max = payload.threshold_max
        sensor.value = payload.value
        sensor.unit = payload.unit
        if payload.camera_id is not None:
            sensor.camera_id = str(payload.camera_id)
        sensor.status = self._resolve_status(payload.value, payload.threshold_min, payload.threshold_max)

        self.db.commit()
        self.db.refresh(sensor)
        return self._serialize_data(sensor)

    def delete_sensor(self, sensor_id: str, user_id: Optional[str]) -> None:
        property_id = self._get_default_property_id(self.db, user_id)
        if not property_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No property assigned")

        sensor = self.db.query(IoTEnvironmentalData).filter(
            IoTEnvironmentalData.property_id == property_id,
            IoTEnvironmentalData.sensor_id == sensor_id
        ).first()
        if not sensor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor not found")

        self.db.delete(sensor)
        self.db.commit()

    def create_alert(self, payload: SensorAlertCreate, user_id: Optional[str]) -> SensorAlertResponse:
        property_id = self._get_default_property_id(self.db, user_id)
        if not property_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No property assigned")

        resolved_camera_id = str(payload.camera_id) if payload.camera_id else None
        light_level = None
        noise_level = None
        if not resolved_camera_id:
            latest = self.db.query(IoTEnvironmentalData).filter(
                IoTEnvironmentalData.property_id == property_id,
                IoTEnvironmentalData.sensor_id == payload.sensor_id
            ).order_by(IoTEnvironmentalData.timestamp.desc()).first()
            if latest and latest.camera_id:
                resolved_camera_id = latest.camera_id
            if latest:
                light_level = latest.light_level
                noise_level = latest.noise_level

        alert = IoTEnvironmentalAlert(
            property_id=property_id,
            sensor_id=payload.sensor_id,
            camera_id=resolved_camera_id,
            alert_type=payload.alert_type,
            severity=payload.severity or ThreatSeverity.MEDIUM,
            message=payload.description,
            location=self._normalize_location(payload.location),
            light_level=light_level,
            noise_level=noise_level,
            status="active",
            resolved=False,
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        if alert.severity == ThreatSeverity.CRITICAL:
            try:
                PushNotificationService().send_environmental_alert(
                    alert_id=str(alert.alert_id),
                    severity=alert.severity.value if hasattr(alert.severity, "value") else str(alert.severity),
                    message=alert.message,
                    camera_id=alert.camera_id,
                )
            except Exception as exc:
                logger.warning("Failed to dispatch push notification", exc_info=exc)

        return self._serialize_alert(alert)

    def list_alerts(self, user_id: Optional[str]) -> List[SensorAlertResponse]:
        property_id = self._get_default_property_id(self.db, user_id)
        if not property_id:
            return []
        alerts = self.db.query(IoTEnvironmentalAlert).filter(
            IoTEnvironmentalAlert.property_id == property_id
        ).order_by(IoTEnvironmentalAlert.created_at.desc()).all()
        return [self._serialize_alert(alert) for alert in alerts]

    def update_alert(self, alert_id: str, payload: SensorAlertUpdate, user_id: Optional[str]) -> SensorAlertResponse:
        property_id = self._get_default_property_id(self.db, user_id)
        if not property_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No property assigned")

        alert = self.db.query(IoTEnvironmentalAlert).filter(
            IoTEnvironmentalAlert.property_id == property_id,
            IoTEnvironmentalAlert.alert_id == alert_id
        ).first()
        if not alert:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

        if payload.status:
            alert.status = payload.status
        if payload.resolved is not None:
            alert.resolved = payload.resolved
            if payload.resolved:
                alert.resolved_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(alert)
        return self._serialize_alert(alert)

    def get_environmental_report(self, start_date: datetime, end_date: datetime, location: Optional[str], user_id: Optional[str]) -> Dict[str, float]:
        property_id = self._get_default_property_id(self.db, user_id)
        if not property_id:
            return {"temperature": 0.0, "humidity": 0.0, "air_quality": 0.0}

        query = self.db.query(IoTEnvironmentalData).filter(
            IoTEnvironmentalData.property_id == property_id,
            IoTEnvironmentalData.timestamp >= start_date,
            IoTEnvironmentalData.timestamp <= end_date
        )
        if location:
            query = query.filter(IoTEnvironmentalData.location['label'].astext == location)

        rows = query.all()
        temps = [row.value for row in rows if row.sensor_type == SensorType.TEMPERATURE and row.value is not None]
        hums = [row.value for row in rows if row.sensor_type == SensorType.HUMIDITY and row.value is not None]
        airq = [row.value for row in rows if row.sensor_type == SensorType.AIR_QUALITY and row.value is not None]

        def avg(values: List[float]) -> float:
            return sum(values) / len(values) if values else 0.0

        return {
            "temperature": avg(temps),
            "humidity": avg(hums),
            "air_quality": avg(airq),
        }

    def get_environmental_analytics(self, user_id: Optional[str]) -> Dict[str, Any]:
        property_id = self._get_default_property_id(self.db, user_id)
        if not property_id:
            return {}

        data = self.db.query(IoTEnvironmentalData).filter(
            IoTEnvironmentalData.property_id == property_id
        ).all()
        alerts = self.db.query(IoTEnvironmentalAlert).filter(
            IoTEnvironmentalAlert.property_id == property_id
        ).all()

        sensors_by_type: Dict[str, int] = {}
        sensors_by_status: Dict[str, int] = {}

        for item in data:
            sensors_by_type[item.sensor_type.value] = sensors_by_type.get(item.sensor_type.value, 0) + 1
            sensors_by_status[item.status] = sensors_by_status.get(item.status, 0) + 1

        def avg(values: List[float]) -> float:
            return sum(values) / len(values) if values else 0.0

        temps = [item.value for item in data if item.sensor_type == SensorType.TEMPERATURE and item.value is not None]
        hums = [item.value for item in data if item.sensor_type == SensorType.HUMIDITY and item.value is not None]
        airq = [item.value for item in data if item.sensor_type == SensorType.AIR_QUALITY and item.value is not None]

        return {
            "total_sensors": len({item.sensor_id for item in data}),
            "active_sensors": len(data),
            "alerts_count": len(alerts),
            "critical_alerts": len([alert for alert in alerts if alert.severity == ThreatSeverity.CRITICAL and not alert.resolved]),
            "average_temperature": avg(temps),
            "average_humidity": avg(hums),
            "average_air_quality": avg(airq),
            "sensorsByType": sensors_by_type,
            "sensorsByStatus": sensors_by_status,
            "normalSensors": sensors_by_status.get("normal", 0),
            "warningSensors": sensors_by_status.get("warning", 0),
            "criticalSensors": sensors_by_status.get("critical", 0),
        }

    def get_settings(self, user_id: Optional[str]) -> IoTEnvironmentalSettingsResponse:
        property_id = self._get_default_property_id(self.db, user_id)
        if not property_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No property assigned")

        settings = self.db.query(IoTEnvironmentalSettings).filter(
            IoTEnvironmentalSettings.property_id == property_id
        ).first()
        if not settings:
            settings = IoTEnvironmentalSettings(property_id=property_id)
            self.db.add(settings)
            self.db.commit()
            self.db.refresh(settings)

        return IoTEnvironmentalSettingsResponse(
            temperatureUnit=settings.temperature_unit,
            refreshInterval=settings.refresh_interval,
            enableNotifications=settings.enable_notifications,
            criticalAlertsOnly=settings.critical_alerts_only,
            autoAcknowledge=settings.auto_acknowledge,
            dataRetention=settings.data_retention,
            alertSoundEnabled=settings.alert_sound_enabled,
            emailNotifications=settings.email_notifications,
        )

    def update_settings(self, payload: IoTEnvironmentalSettingsUpdate, user_id: Optional[str]) -> IoTEnvironmentalSettingsResponse:
        property_id = self._get_default_property_id(self.db, user_id)
        if not property_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No property assigned")

        settings = self.db.query(IoTEnvironmentalSettings).filter(
            IoTEnvironmentalSettings.property_id == property_id
        ).first()
        if not settings:
            settings = IoTEnvironmentalSettings(property_id=property_id)
            self.db.add(settings)

        if payload.temperatureUnit is not None:
            settings.temperature_unit = payload.temperatureUnit
        if payload.refreshInterval is not None:
            settings.refresh_interval = payload.refreshInterval
        if payload.enableNotifications is not None:
            settings.enable_notifications = payload.enableNotifications
        if payload.criticalAlertsOnly is not None:
            settings.critical_alerts_only = payload.criticalAlertsOnly
        if payload.autoAcknowledge is not None:
            settings.auto_acknowledge = payload.autoAcknowledge
        if payload.dataRetention is not None:
            settings.data_retention = payload.dataRetention
        if payload.alertSoundEnabled is not None:
            settings.alert_sound_enabled = payload.alertSoundEnabled
        if payload.emailNotifications is not None:
            settings.email_notifications = payload.emailNotifications

        self.db.commit()
        self.db.refresh(settings)

        return IoTEnvironmentalSettingsResponse(
            temperatureUnit=settings.temperature_unit,
            refreshInterval=settings.refresh_interval,
            enableNotifications=settings.enable_notifications,
            criticalAlertsOnly=settings.critical_alerts_only,
            autoAcknowledge=settings.auto_acknowledge,
            dataRetention=settings.data_retention,
            alertSoundEnabled=settings.alert_sound_enabled,
            emailNotifications=settings.email_notifications,
        )
