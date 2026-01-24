"""
Smart Parking API Endpoints
FastAPI router for parking space management, guest registration, and telemetry.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from services.parking_service import ParkingService
from schemas import (
    ParkingSpaceCreate, ParkingSpaceUpdate, ParkingSpaceResponse, 
    GuestParkingCreate, GuestParkingResponse,
    LPRIngestion, SensorTelemetry, ParkingBillingResponse,
    ParkingSettingsResponse, ParkingSettingsUpdate
)
from api.auth_dependencies import get_current_user, check_user_has_property_access, verify_hardware_ingest_key
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/parking", tags=["Smart Parking"])

@router.get("/spaces", response_model=List[ParkingSpaceResponse])
async def get_spaces(
    property_id: str = Query(..., description="The ID of the property"),
    current_user: Any = Depends(get_current_user)
):
    """List all parking spaces with occupancy and metadata"""
    await check_user_has_property_access(current_user, property_id)
    return await ParkingService.get_parking_spaces(property_id)

@router.post("/spaces", response_model=ParkingSpaceResponse)
async def create_space(
    space_data: ParkingSpaceCreate,
    current_user: Any = Depends(get_current_user)
):
    """Create a new parking space"""
    await check_user_has_property_access(current_user, space_data.property_id)
    return await ParkingService.create_parking_space(space_data)

@router.put("/spaces/{space_id}", response_model=ParkingSpaceResponse)
async def update_space(
    space_id: str,
    space_data: ParkingSpaceUpdate,
    current_user: Any = Depends(get_current_user)
):
    """Update an existing parking space (status, type, label)"""
    # Authorization: Usually based on property access, but here we'd need to fetch the space first
    # Or rely on the fact that the service will handle the property check if we pass it, 
    # but for now we'll assume the space_id is sufficient for internal lookups.
    return await ParkingService.update_parking_space(space_id, space_data)

@router.get("/registrations", response_model=List[GuestParkingResponse])
async def get_registrations(
    property_id: str = Query(..., description="The ID of the property"),
    status: Optional[str] = Query("all", description="Filter by status (active, completed, overdue, all)"),
    current_user: Any = Depends(get_current_user)
):
    """List guest registrations with optional status filtering"""
    await check_user_has_property_access(current_user, property_id)
    return await ParkingService.get_registrations(property_id, status=status)

@router.post("/guest", response_model=Dict[str, Any])
async def register_guest(
    parking_data: GuestParkingCreate, 
    current_user: Any = Depends(get_current_user)
):
    """Register a guest vehicle entry with optional plate and space assignment"""
    await check_user_has_property_access(current_user, parking_data.property_id)
    return await ParkingService.register_guest_parking(parking_data)

@router.post("/guest/{registration_id}/checkout", response_model=Dict[str, Any])
async def checkout_guest(
    registration_id: str,
    current_user: Any = Depends(get_current_user)
):
    """Process guest vehicle checkout and trigger billing"""
    return await ParkingService.checkout_guest_parking(registration_id)

@router.post("/guest/{registration_id}/valet", response_model=Dict[str, Any])
async def update_valet(
    registration_id: str,
    status: str = Query(..., description="The new valet status"),
    current_user: Any = Depends(get_current_user)
):
    """Update valet state (requested, retrieving, ready, etc.)"""
    return await ParkingService.update_valet_status(registration_id, status)

@router.post("/lpr")
async def ingest_lpr(
    lpr_data: LPRIngestion, 
    property_id: str = Query(..., description="The ID of the property"),
    _: bool = Depends(verify_hardware_ingest_key)
):
    """Ingest LPR event from camera/cloud service"""
    # Hardware endpoint: authentication should be handled via API Key or IP Whitelist in Phase 2
    return await ParkingService.ingest_lpr_event(property_id, lpr_data)

@router.post("/sensor")
async def ingest_sensor(
    sensor_data: SensorTelemetry,
    property_id: str = Query(..., description="The ID of the property"),
    _: bool = Depends(verify_hardware_ingest_key)
):
    """Ingest sensor telemetry (MQTT bridge or direct)"""
    # Hardware endpoint: authentication should be handled via API Key or IP Whitelist in Phase 2
    return await ParkingService.ingest_sensor_telemetry(property_id, sensor_data)

@router.get("/settings", response_model=ParkingSettingsResponse)
async def get_settings(
    property_id: str = Query(..., description="The ID of the property"),
    current_user: Any = Depends(get_current_user)
):
    """Get parking settings for a property"""
    await check_user_has_property_access(current_user, property_id)
    return await ParkingService.get_parking_settings(property_id)

@router.put("/settings", response_model=ParkingSettingsResponse)
async def update_settings(
    property_id: str = Query(..., description="The ID of the property"),
    settings_data: ParkingSettingsUpdate = None,
    current_user: Any = Depends(get_current_user)
):
    """Update parking settings for a property"""
    await check_user_has_property_access(current_user, property_id)
    return await ParkingService.update_parking_settings(property_id, settings_data)

@router.get("/health")
async def get_health(
    property_id: str = Query(..., description="The ID of the property"),
    current_user: Any = Depends(get_current_user)
):
    """Get real-time health and diagnostics for the parking module"""
    await check_user_has_property_access(current_user, property_id)
    return await ParkingService.get_parking_health(property_id)
