"""
Maintenance Requests API Endpoints
FastAPI router for Maintenance Request management
Separate router to match frontend API expectations (/api/maintenance-requests)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from schemas import (
    MaintenanceRequestCreate,
    MaintenanceRequestUpdate,
    MaintenanceRequestResponse
)
from services.equipment_service import EquipmentService
from api.auth_dependencies import get_current_user, check_user_has_property_access
from models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/maintenance-requests", tags=["Maintenance Requests"])


@router.get("", response_model=List[MaintenanceRequestResponse])
async def get_maintenance_requests(
    property_id: str = Query(..., description="Property ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_user)
):
    """
    Get maintenance requests for a property
    
    - **property_id**: Required property ID
    - **status**: Optional status filter (pending, in_progress, completed, resolved)
    """
    try:
        # Check property access
        if not check_user_has_property_access(current_user, property_id):
            logger.warning(f"User {current_user.user_id} attempted to access maintenance requests for property {property_id} without access")
            raise HTTPException(status_code=403, detail="Access denied to this property")
        
        requests = await EquipmentService.get_maintenance_requests(
            user_id=str(current_user.user_id),
            property_id=property_id,
            status=status
        )
        return requests
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching maintenance requests: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve maintenance requests. Please try again.")


@router.get("/{request_id}", response_model=MaintenanceRequestResponse)
async def get_maintenance_request_by_id(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a single maintenance request by ID
    
    - **request_id**: Maintenance request ID
    """
    try:
        request = await EquipmentService.get_maintenance_request_by_id(
            user_id=str(current_user.user_id),
            request_id=request_id
        )
        return request
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching maintenance request {request_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve maintenance request. Please try again.")


@router.post("", response_model=MaintenanceRequestResponse, status_code=201)
async def create_maintenance_request(
    data: MaintenanceRequestCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create new maintenance request
    
    Requires property access to the specified property_id
    The current user will be set as the reporter
    """
    try:
        # Check property access
        if not check_user_has_property_access(current_user, str(data.property_id)):
            logger.warning(f"User {current_user.user_id} attempted to create maintenance request for property {data.property_id} without access")
            raise HTTPException(status_code=403, detail="Access denied to this property")
        
        request = await EquipmentService.create_maintenance_request(
            user_id=str(current_user.user_id),
            data=data
        )
        logger.info(f"Maintenance request created: {request.id} by user {current_user.user_id}")
        return request
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating maintenance request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create maintenance request. Please try again.")


@router.put("/{request_id}", response_model=MaintenanceRequestResponse)
async def update_maintenance_request(
    request_id: str,
    data: MaintenanceRequestUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update existing maintenance request
    
    - **request_id**: Maintenance request ID to update
    - Only provided fields will be updated
    - If status is updated to completed/resolved, completed_at will be automatically set
    """
    try:
        request = await EquipmentService.update_maintenance_request(
            user_id=str(current_user.user_id),
            request_id=request_id,
            data=data
        )
        logger.info(f"Maintenance request updated: {request_id} by user {current_user.user_id}")
        return request
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating maintenance request {request_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update maintenance request. Please try again.")
