
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from database import get_db
from api.auth_dependencies import get_current_user
from models import User
from schemas import (
    SoundSensorCreate, SoundSensorResponse,
    MonitoringZoneCreate, MonitoringZoneResponse,
    SoundAlertCreate, SoundAlertResponse
)
from services.sound_monitoring_service import SoundMonitoringService

router = APIRouter(prefix="/sound-monitoring", tags=["Sound Monitoring"])

def get_service(db: Session = Depends(get_db)):
    return SoundMonitoringService(db)

# Sensors
@router.post("/sensors", response_model=SoundSensorResponse, status_code=status.HTTP_201_CREATED)
async def create_sensor(
    sensor_data: SoundSensorCreate,
    service: SoundMonitoringService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Register a new sound sensor device."""
    return service.create_sensor(sensor_data)

@router.get("/sensors", response_model=List[SoundSensorResponse])
async def get_sensors(
    property_id: str,
    service: SoundMonitoringService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """List all sound sensors for a property."""
    return service.get_sensors(property_id)

# Zones
@router.post("/zones", response_model=MonitoringZoneResponse, status_code=status.HTTP_201_CREATED)
async def create_zone(
    zone_data: MonitoringZoneCreate,
    service: SoundMonitoringService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Create a monitoring zone."""
    return service.create_zone(zone_data)

@router.get("/zones", response_model=List[MonitoringZoneResponse])
async def get_zones(
    property_id: str,
    service: SoundMonitoringService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """List monitoring zones for a property."""
    return service.get_zones(property_id)

# Alerts
@router.post("/alerts", response_model=SoundAlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_data: SoundAlertCreate,
    service: SoundMonitoringService = Depends(get_service),
    current_user: User = Depends(get_current_user) 
):
    """Report a sound alert (usually from device/ingestion service)."""
    return service.create_alert(alert_data)

@router.get("/alerts", response_model=List[SoundAlertResponse])
async def get_alerts(
    property_id: str,
    verified: Optional[bool] = None,
    service: SoundMonitoringService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """List sound alerts w/ optional filtering."""
    return service.get_alerts(property_id, verified)

@router.post("/alerts/{alert_id}/verify", response_model=SoundAlertResponse)
async def verify_alert(
    alert_id: str,
    is_verified: bool = True,
    service: SoundMonitoringService = Depends(get_service),
    current_user: User = Depends(get_current_user)
):
    """Verify or dismiss an alert."""
    alert = service.verify_alert(alert_id, current_user.user_id, is_verified)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert
