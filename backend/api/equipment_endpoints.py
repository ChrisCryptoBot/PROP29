from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from schemas import (
    EquipmentCreate,
    EquipmentResponse,
    MaintenanceRequestCreate,
    MaintenanceRequestResponse
)
from services.equipment_service import EquipmentService
from api.auth_dependencies import get_current_user
from models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/equipment", tags=["Equipment & Maintenance"])

@router.get("", response_model=List[EquipmentResponse])
async def get_equipment(
    property_id: str = Query(..., description="Property ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_user)
):
    """Get equipment for a property"""
    try:
        return await EquipmentService.get_equipment(
            user_id=str(current_user.user_id),
            property_id=property_id,
            category=category
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching equipment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("", response_model=EquipmentResponse)
async def create_equipment(
    data: EquipmentCreate,
    current_user: User = Depends(get_current_user)
):
    """Create new equipment"""
    try:
        return await EquipmentService.create_equipment(
            user_id=str(current_user.user_id),
            data=data
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating equipment: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/maintenance-requests", response_model=List[MaintenanceRequestResponse])
async def get_maintenance_requests(
    property_id: str = Query(..., description="Property ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_user)
):
    """Get maintenance requests for a property"""
    try:
        return await EquipmentService.get_maintenance_requests(
            user_id=str(current_user.user_id),
            property_id=property_id,
            status=status
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching maintenance requests: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/maintenance-requests", response_model=MaintenanceRequestResponse)
async def create_maintenance_request(
    data: MaintenanceRequestCreate,
    current_user: User = Depends(get_current_user)
):
    """Create new maintenance request"""
    try:
        return await EquipmentService.create_maintenance_request(
            user_id=str(current_user.user_id),
            data=data
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating maintenance request: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
