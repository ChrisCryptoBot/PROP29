from fastapi import APIRouter, Depends
from typing import List, Optional
from datetime import datetime
import logging

from api.auth_dependencies import get_current_user, require_security_manager_or_admin
from services.iot_environmental_service import IoTEnvironmentalService
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

router = APIRouter(prefix="/iot", tags=["IoT & Environmental Monitoring"])

@router.post("/sensors/data", response_model=IoTEnvironmentalDataResponse, status_code=201)
async def record_sensor_data(payload: IoTEnvironmentalDataCreate, current_user=Depends(get_current_user)):
    service = IoTEnvironmentalService()
    try:
        result = service.record_sensor_data(payload, str(current_user.user_id))
        # Broadcast via WebSocket
        try:
            from main import manager
            if manager and manager.active_connections:
                sensor_dict = {
                    "id": result.data_id,
                    "sensor_id": result.sensor_id,
                    "sensor_type": result.sensor_type,
                    "location": result.location,
                    "value": result.value,
                    "unit": result.unit,
                    "status": result.status,
                    "timestamp": result.timestamp.isoformat() if hasattr(result.timestamp, 'isoformat') else str(result.timestamp),
                    "threshold_min": result.threshold_min,
                    "threshold_max": result.threshold_max,
                    "camera_id": result.camera_id,
                    "camera_name": result.camera_name,
                }
                message = {
                    "type": "environmental_data",
                    "sensor_data": sensor_dict
                }
                # Broadcast to all connected users
                for user_id, connections in manager.active_connections.items():
                    for ws in connections:
                        try:
                            await ws.send_json(message)
                        except Exception as e:
                            logger.warning(f"Failed to send WebSocket message to {user_id}: {e}")
        except Exception as e:
            logger.warning(f"Failed to broadcast sensor data via WebSocket: {e}")
        return result
    finally:
        service.close()

@router.get("/sensors/readings", response_model=List[IoTEnvironmentalDataResponse])
def get_sensor_readings(current_user=Depends(get_current_user)):
    service = IoTEnvironmentalService()
    try:
        return service.list_sensor_readings(str(current_user.user_id))
    finally:
        service.close()

@router.get("/reports/environmental")
def get_environmental_report(
    start_date: datetime,
    end_date: datetime,
    location: Optional[str] = None,
    current_user=Depends(get_current_user),
):
    service = IoTEnvironmentalService()
    try:
        return service.get_environmental_report(start_date, end_date, location, str(current_user.user_id))
    finally:
        service.close()

@router.get("/environmental", response_model=List[IoTEnvironmentalDataResponse])
def list_environmental_data(current_user=Depends(get_current_user)):
    service = IoTEnvironmentalService()
    try:
        return service.list_sensor_readings(str(current_user.user_id))
    finally:
        service.close()

@router.post("/environmental/sensors", response_model=IoTEnvironmentalDataResponse, status_code=201)
def create_sensor(payload: IoTEnvironmentalDataCreate, current_user=Depends(require_security_manager_or_admin)):
    service = IoTEnvironmentalService()
    try:
        return service.create_sensor(payload, str(current_user.user_id))
    finally:
        service.close()

@router.put("/environmental/sensors/{sensor_id}", response_model=IoTEnvironmentalDataResponse)
def update_sensor(sensor_id: str, payload: IoTEnvironmentalDataCreate, current_user=Depends(require_security_manager_or_admin)):
    service = IoTEnvironmentalService()
    try:
        return service.update_sensor(sensor_id, payload, str(current_user.user_id))
    finally:
        service.close()

@router.delete("/environmental/sensors/{sensor_id}")
def delete_sensor(sensor_id: str, current_user=Depends(require_security_manager_or_admin)):
    service = IoTEnvironmentalService()
    try:
        service.delete_sensor(sensor_id, str(current_user.user_id))
        return {"deleted": True}
    finally:
        service.close()

@router.get("/environmental/alerts", response_model=List[SensorAlertResponse])
def list_environmental_alerts(current_user=Depends(get_current_user)):
    service = IoTEnvironmentalService()
    try:
        return service.list_alerts(str(current_user.user_id))
    finally:
        service.close()

@router.post("/environmental/alerts", response_model=SensorAlertResponse, status_code=201)
async def create_environmental_alert(payload: SensorAlertCreate, current_user=Depends(require_security_manager_or_admin)):
    service = IoTEnvironmentalService()
    try:
        result = service.create_alert(payload, str(current_user.user_id))
        # Broadcast via WebSocket
        try:
            from main import manager
            if manager and manager.active_connections:
                alert_dict = {
                    "id": result.alert_id,
                    "sensor_id": result.sensor_id,
                    "alert_type": result.alert_type,
                    "severity": result.severity.value if hasattr(result.severity, 'value') else str(result.severity),
                    "message": result.message,
                    "location": result.location,
                    "status": result.status,
                    "resolved": result.resolved,
                    "timestamp": result.created_at.isoformat() if hasattr(result.created_at, 'isoformat') else str(result.created_at),
                    "resolved_at": result.resolved_at.isoformat() if result.resolved_at and hasattr(result.resolved_at, 'isoformat') else (str(result.resolved_at) if result.resolved_at else None),
                    "camera_id": result.camera_id,
                    "camera_name": result.camera_name,
                }
                message = {
                    "type": "environmental_alert",
                    "alert": alert_dict
                }
                # Broadcast to all connected users
                for user_id, connections in manager.active_connections.items():
                    for ws in connections:
                        try:
                            await ws.send_json(message)
                        except Exception as e:
                            logger.warning(f"Failed to send WebSocket message to {user_id}: {e}")
        except Exception as e:
            logger.warning(f"Failed to broadcast environmental alert via WebSocket: {e}")
        return result
    finally:
        service.close()

@router.put("/environmental/alerts/{alert_id}", response_model=SensorAlertResponse)
async def update_environmental_alert(alert_id: str, payload: SensorAlertUpdate, current_user=Depends(require_security_manager_or_admin)):
    service = IoTEnvironmentalService()
    try:
        result = service.update_alert(alert_id, payload, str(current_user.user_id))
        # Broadcast via WebSocket if alert status changed
        try:
            from main import manager
            if manager and manager.active_connections:
                alert_dict = {
                    "id": result.alert_id,
                    "sensor_id": result.sensor_id,
                    "alert_type": result.alert_type,
                    "severity": result.severity.value if hasattr(result.severity, 'value') else str(result.severity),
                    "message": result.message,
                    "location": result.location,
                    "status": result.status,
                    "resolved": result.resolved,
                    "timestamp": result.created_at.isoformat() if hasattr(result.created_at, 'isoformat') else str(result.created_at),
                    "resolved_at": result.resolved_at.isoformat() if result.resolved_at and hasattr(result.resolved_at, 'isoformat') else (str(result.resolved_at) if result.resolved_at else None),
                    "camera_id": result.camera_id,
                    "camera_name": result.camera_name,
                }
                message = {
                    "type": "environmental_alert",
                    "alert": alert_dict
                }
                # Broadcast to all connected users
                for user_id, connections in manager.active_connections.items():
                    for ws in connections:
                        try:
                            await ws.send_json(message)
                        except Exception as e:
                            logger.warning(f"Failed to send WebSocket message to {user_id}: {e}")
        except Exception as e:
            logger.warning(f"Failed to broadcast environmental alert update via WebSocket: {e}")
        return result
    finally:
        service.close()

@router.get("/environmental/analytics")
def get_environmental_analytics(current_user=Depends(get_current_user)):
    service = IoTEnvironmentalService()
    try:
        return service.get_environmental_analytics(str(current_user.user_id))
    finally:
        service.close()

@router.get("/environmental/settings", response_model=IoTEnvironmentalSettingsResponse)
def get_environmental_settings(current_user=Depends(get_current_user)):
    service = IoTEnvironmentalService()
    try:
        return service.get_settings(str(current_user.user_id))
    finally:
        service.close()

@router.put("/environmental/settings", response_model=IoTEnvironmentalSettingsResponse)
def update_environmental_settings(payload: IoTEnvironmentalSettingsUpdate, current_user=Depends(require_security_manager_or_admin)):
    service = IoTEnvironmentalService()
    try:
        return service.update_settings(payload, str(current_user.user_id))
    finally:
        service.close()
