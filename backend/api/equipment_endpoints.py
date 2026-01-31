"""
Equipment API Endpoints
FastAPI router for Equipment tracking
Enforces authentication, authorization, and property-level access control

Note: Maintenance Request endpoints are in maintenance_requests_endpoints.py
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from schemas import (
    EquipmentCreate,
    EquipmentUpdate,
    EquipmentResponse
)
from services.equipment_service import EquipmentService
from api.auth_dependencies import get_current_user, check_user_has_property_access
from models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/equipment", tags=["Equipment"])


# Equipment Endpoints

@router.get("", response_model=List[EquipmentResponse])
async def get_equipment(
    property_id: str = Query(..., description="Property ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_user)
):
    """
    Get equipment for a property
    
    - **property_id**: Required property ID
    - **category**: Optional category filter
    """
    try:
        # Check property access
        if not check_user_has_property_access(current_user, property_id):
            logger.warning(f"User {current_user.user_id} attempted to access equipment for property {property_id} without access")
            raise HTTPException(status_code=403, detail="Access denied to this property")
        
        equipment = await EquipmentService.get_equipment(
            user_id=str(current_user.user_id),
            property_id=property_id,
            category=category
        )
        return equipment
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching equipment: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve equipment. Please try again.")


@router.get("/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment_by_id(
    equipment_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a single equipment item by ID
    
    - **equipment_id**: Equipment ID
    """
    try:
        equipment = await EquipmentService.get_equipment_by_id(
            user_id=str(current_user.user_id),
            equipment_id=equipment_id
        )
        return equipment
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching equipment {equipment_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve equipment. Please try again.")


@router.post("", response_model=EquipmentResponse, status_code=201)
async def create_equipment(
    data: EquipmentCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create new equipment
    
    Requires property access to the specified property_id
    """
    try:
        # Check property access
        if not check_user_has_property_access(current_user, str(data.property_id)):
            logger.warning(f"User {current_user.user_id} attempted to create equipment for property {data.property_id} without access")
            raise HTTPException(status_code=403, detail="Access denied to this property")
        
        equipment = await EquipmentService.create_equipment(
            user_id=str(current_user.user_id),
            data=data
        )
        logger.info(f"Equipment created: {equipment.id} by user {current_user.user_id}")
        return equipment
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating equipment: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create equipment. Please try again.")


@router.put("/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment(
    equipment_id: str,
    data: EquipmentUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update existing equipment
    
    - **equipment_id**: Equipment ID to update
    - Only provided fields will be updated
    """
    try:
        equipment = await EquipmentService.update_equipment(
            user_id=str(current_user.user_id),
            equipment_id=equipment_id,
            data=data
        )
        logger.info(f"Equipment updated: {equipment_id} by user {current_user.user_id}")
        return equipment
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating equipment {equipment_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update equipment. Please try again.")


@router.delete("/{equipment_id}", status_code=204)
async def delete_equipment(
    equipment_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete equipment
    
    - **equipment_id**: Equipment ID to delete
    """
    try:
        await EquipmentService.delete_equipment(
            user_id=str(current_user.user_id),
            equipment_id=equipment_id
        )
        logger.info(f"Equipment deleted: {equipment_id} by user {current_user.user_id}")
        return None
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting equipment {equipment_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete equipment. Please try again.")
