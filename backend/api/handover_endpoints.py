from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from schemas import (
    HandoverCreate,
    HandoverUpdate,
    HandoverResponse,
    HandoverSettingsUpdate,
    HandoverSettingsResponse,
    HandoverMetricsResponse,
    HandoverTemplateCreate,
    HandoverTemplateResponse
)
from services.handover_service import HandoverService
from api.auth_dependencies import get_current_user
from models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/handovers", tags=["Digital Handover"])


@router.get("", response_model=List[HandoverResponse])
async def get_handovers(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    shift_type: Optional[str] = Query(None, description="Filter by shift type"),
    current_user: User = Depends(get_current_user)
):
    """Get handovers with optional filtering"""
    try:
        return await HandoverService.get_handovers(
            user_id=str(current_user.user_id),
            property_id=property_id,
            status=status,
            shift_type=shift_type
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching handovers: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{handover_id}", response_model=HandoverResponse)
async def get_handover(
    handover_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific handover by ID"""
    try:
        # Avoid conflict with special paths
        if handover_id in ["settings", "metrics", "templates"]:
             # This shouldn't happen with correct routing order but good to have
             pass
             
        return await HandoverService.get_handover(
            handover_id=handover_id,
            user_id=str(current_user.user_id)
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching handover {handover_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("", response_model=HandoverResponse)
async def create_handover(
    handover_data: HandoverCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new handover"""
    try:
        return await HandoverService.create_handover(
            handover_data=handover_data,
            user_id=str(current_user.user_id)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating handover: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{handover_id}", response_model=HandoverResponse)
async def update_handover(
    handover_id: str,
    updates: HandoverUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an existing handover"""
    try:
        return await HandoverService.update_handover(
            handover_id=handover_id,
            updates=updates,
            user_id=str(current_user.user_id)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating handover {handover_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/settings", response_model=HandoverSettingsResponse)
async def get_settings(
    property_id: str = Query(..., description="Property ID to get settings for"),
    current_user: User = Depends(get_current_user)
):
    """Get handover settings for a property"""
    try:
        return await HandoverService.get_settings(
            user_id=str(current_user.user_id),
            property_id=property_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching settings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/settings", response_model=HandoverSettingsResponse)
async def update_settings(
    property_id: str = Query(..., description="Property ID to update settings for"),
    updates: HandoverSettingsUpdate = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Update handover settings for a property"""
    try:
        return await HandoverService.update_settings(
            user_id=str(current_user.user_id),
            property_id=property_id,
            updates=updates
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/metrics", response_model=HandoverMetricsResponse)
async def get_metrics(
    property_id: str = Query(..., description="Property ID to get metrics for"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user)
):
    """Get handover metrics/analytics"""
    try:
        # Validate dates if provided
        if date_from and date_to:
            try:
                datetime.strptime(date_from, "%Y-%m-%d")
                datetime.strptime(date_to, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        elif (date_from and not date_to) or (date_to and not date_from):
            raise HTTPException(status_code=400, detail="Both date_from and date_to must be provided together")

        return await HandoverService.get_metrics(
            user_id=str(current_user.user_id),
            property_id=property_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching metrics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/templates", response_model=List[HandoverTemplateResponse])
async def get_templates(
    property_id: str = Query(..., description="Property ID"),
    operational_post: Optional[str] = Query(None, description="Filter by operational post"),
    current_user: User = Depends(get_current_user)
):
    """Get checklist templates"""
    try:
        return await HandoverService.get_templates(
            user_id=str(current_user.user_id),
            property_id=property_id,
            operational_post=operational_post
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching templates: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/templates", response_model=HandoverTemplateResponse)
async def create_template(
    data: HandoverTemplateCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new template"""
    try:
        return await HandoverService.create_template(
            user_id=str(current_user.user_id),
            data=data
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating template: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a template"""
    try:
        await HandoverService.delete_template(
            template_id=template_id,
            user_id=str(current_user.user_id)
        )
        return {"status": "deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error deleting template: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{handover_id}/complete", response_model=HandoverResponse)
async def complete_handover(
    handover_id: str,
    current_user: User = Depends(get_current_user)
):
    """Complete a handover"""
    try:
        return await HandoverService.complete_handover(
            handover_id=handover_id,
            user_id=str(current_user.user_id)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error completing handover {handover_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/config/staff", response_model=List[Dict[str, Any]])
async def get_staff(
    property_id: str = Query(..., description="Property ID"),
    current_user: User = Depends(get_current_user)
):
    """Get staff members for a property"""
    try:
        return await HandoverService.get_property_staff(
            user_id=str(current_user.user_id),
            property_id=property_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching staff: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{handover_id}/verification", response_model=Dict[str, Any])
async def get_verification_status(
    handover_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get verification status for a handover"""
    try:
        return await HandoverService.get_verification_status(
            handover_id=handover_id,
            user_id=str(current_user.user_id)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching verification status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/{handover_id}/verification/request", response_model=Dict[str, Any])
async def request_verification(
    handover_id: str,
    current_user: User = Depends(get_current_user)
):
    """Request verification for a handover"""
    try:
        return await HandoverService.request_verification(
            handover_id=handover_id,
            user_id=str(current_user.user_id)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error requesting verification: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/{handover_id}/verification/signature", response_model=Dict[str, Any])
async def submit_signature(
    handover_id: str,
    data: Dict[str, str],
    current_user: User = Depends(get_current_user)
):
    """Submit an officer signature"""
    try:
        if "signature" not in data or "role" not in data:
            raise ValueError("Signature and role are required")
            
        return await HandoverService.submit_signature(
            handover_id=handover_id,
            user_id=str(current_user.user_id),
            signature=data["signature"],
            role=data["role"]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error submitting signature: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/analytics/timeline", response_model=List[Dict[str, Any]])
async def get_timeline(
    property_id: str = Query(..., description="Property ID"),
    current_user: User = Depends(get_current_user)
):
    """Get today's shift timeline"""
    try:
        return await HandoverService.get_shift_timeline(
            user_id=str(current_user.user_id),
            property_id=property_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching timeline: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
