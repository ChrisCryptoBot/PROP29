"""
Package API Endpoints
FastAPI router for Package management
Enforces authentication, authorization, and property-level access control
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from schemas import (
    PackageCreate,
    PackageUpdate,
    PackageResponse
)
from services.package_service import PackageService
from api.auth_dependencies import get_current_user
from models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/packages", tags=["Packages"])


@router.get("", response_model=List[PackageResponse])
async def get_packages(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    guest_id: Optional[str] = Query(None, description="Filter by guest ID"),
    current_user: User = Depends(get_current_user)
):
    """Get all packages with optional filtering"""
    try:
        packages = await PackageService.get_packages(
            user_id=str(current_user.user_id),
            property_id=property_id,
            status=status,
            guest_id=guest_id
        )
        return packages
    except ValueError as e:
        error_msg = str(e)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to get packages: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve packages. Please try again.")


@router.get("/{package_id}", response_model=PackageResponse)
async def get_package(
    package_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific package by ID"""
    try:
        package = await PackageService.get_package(package_id, str(current_user.user_id))
        return package
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to get package: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve package. Please try again.")


@router.post("", response_model=PackageResponse, status_code=201)
async def create_package(
    package: PackageCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new package"""
    try:
        new_package = await PackageService.create_package(package, str(current_user.user_id))
        return new_package
    except ValueError as e:
        error_msg = str(e)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to create package: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create package. Please try again.")


@router.put("/{package_id}", response_model=PackageResponse)
async def update_package(
    package_id: str,
    updates: PackageUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an existing package"""
    try:
        updated_package = await PackageService.update_package(package_id, updates, str(current_user.user_id))
        return updated_package
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to update package: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update package. Please try again.")


@router.delete("/{package_id}", status_code=204)
async def delete_package(
    package_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a package (admin only)"""
    try:
        await PackageService.delete_package(package_id, str(current_user.user_id))
        return None
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        if "access denied" in error_msg.lower() or "admin" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to delete package: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete package. Please try again.")


@router.post("/{package_id}/notify", response_model=Dict[str, bool])
async def notify_guest(
    package_id: str,
    guest_id: Optional[str] = Query(None, description="Guest ID to notify"),
    current_user: User = Depends(get_current_user)
):
    """Notify a guest about a package"""
    try:
        result = await PackageService.notify_guest(package_id, str(current_user.user_id), guest_id)
        return result
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to notify guest: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to notify guest. Please try again.")


@router.post("/{package_id}/deliver", response_model=PackageResponse)
async def deliver_package(
    package_id: str,
    delivered_to: Optional[str] = Query(None, description="Recipient name"),
    current_user: User = Depends(get_current_user)
):
    """Deliver a package"""
    try:
        delivered_package = await PackageService.deliver_package(package_id, str(current_user.user_id), delivered_to)
        return delivered_package
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to deliver package: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to deliver package. Please try again.")


@router.post("/{package_id}/pickup", response_model=PackageResponse)
async def pickup_package(
    package_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a package as picked up"""
    try:
        picked_up_package = await PackageService.pickup_package(package_id, str(current_user.user_id))
        return picked_up_package
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to pickup package: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to pickup package. Please try again.")
