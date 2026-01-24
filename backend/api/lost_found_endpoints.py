"""
Lost & Found API Endpoints
FastAPI router for Lost & Found items management
Enforces authentication, authorization, and property-level access control
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
from schemas import (
    LostFoundItemCreate,
    LostFoundItemUpdate,
    LostFoundItemResponse,
    LostFoundMetrics,
    LostFoundSettings,
    LostFoundSettingsResponse,
    LostFoundMatch,
    LostFoundMatchRequest
)
from services.lost_found_service import LostFoundService
from api.auth_dependencies import get_current_user
from models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/lost-found", tags=["Lost & Found"])


@router.get("/items", response_model=List[LostFoundItemResponse])
async def get_items(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    item_type: Optional[str] = Query(None, description="Filter by item type"),
    current_user: User = Depends(get_current_user)
):
    """Get all lost & found items with optional filtering"""
    try:
        items = await LostFoundService.get_items(
            user_id=str(current_user.user_id),
            property_id=property_id,
            status=status,
            item_type=item_type
        )
        return items
    except ValueError as e:
        # Re-raise ValueError as-is (e.g., "Access denied")
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get items: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve items. Please try again.")


@router.get("/items/{item_id}", response_model=LostFoundItemResponse)
async def get_item(
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific lost & found item by ID"""
    try:
        item = await LostFoundService.get_item(item_id, str(current_user.user_id))
        return item
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        raise HTTPException(status_code=403, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to get item: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve item. Please try again.")


@router.post("/items", response_model=LostFoundItemResponse, status_code=201)
async def create_item(
    item: LostFoundItemCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new lost & found item"""
    try:
        new_item = await LostFoundService.create_item(item, str(current_user.user_id))
        return new_item
    except ValueError as e:
        error_msg = str(e)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to create item: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create item. Please try again.")


@router.put("/items/{item_id}", response_model=LostFoundItemResponse)
async def update_item(
    item_id: str,
    updates: LostFoundItemUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an existing lost & found item"""
    try:
        updated_item = await LostFoundService.update_item(item_id, updates, str(current_user.user_id))
        return updated_item
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to update item: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update item. Please try again.")


@router.delete("/items/{item_id}", status_code=204)
async def delete_item(
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a lost & found item (admin only)"""
    try:
        await LostFoundService.delete_item(item_id, str(current_user.user_id))
        return None
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        if "access denied" in error_msg.lower() or "admin" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to delete item: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete item. Please try again.")


@router.post("/items/{item_id}/claim", response_model=LostFoundItemResponse)
async def claim_item(
    item_id: str,
    guest_id: Optional[str] = Query(None, description="Guest ID who is claiming the item"),
    current_user: User = Depends(get_current_user)
):
    """Claim a lost & found item"""
    try:
        claimed_item = await LostFoundService.claim_item(item_id, str(current_user.user_id), guest_id)
        return claimed_item
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to claim item: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to claim item. Please try again.")


@router.post("/items/{item_id}/notify", response_model=Dict[str, bool])
async def notify_guest(
    item_id: str,
    guest_id: Optional[str] = Query(None, description="Guest ID to notify"),
    current_user: User = Depends(get_current_user)
):
    """Notify a guest about a lost & found item"""
    try:
        result = await LostFoundService.notify_guest(item_id, str(current_user.user_id), guest_id)
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


@router.get("/metrics", response_model=LostFoundMetrics)
async def get_metrics(
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    date_from: Optional[datetime] = Query(None, description="Start date for metrics"),
    date_to: Optional[datetime] = Query(None, description="End date for metrics"),
    current_user: User = Depends(get_current_user)
):
    """Get lost & found metrics/analytics"""
    try:
        # Validate dates if provided
        if (date_from and not date_to) or (date_to and not date_from):
            raise HTTPException(status_code=400, detail="Both date_from and date_to must be provided together")

        metrics = await LostFoundService.get_metrics(
            user_id=str(current_user.user_id),
            property_id=property_id,
            date_from=date_from,
            date_to=date_to
        )
        return metrics
    except ValueError as e:
        error_msg = str(e)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve metrics. Please try again.")


@router.get("/settings", response_model=LostFoundSettingsResponse)
async def get_settings(
    property_id: Optional[str] = Query(None, description="Property ID (optional)"),
    current_user: User = Depends(get_current_user)
):
    """Get lost & found settings for a property"""
    try:
        settings = await LostFoundService.get_settings(
            user_id=str(current_user.user_id),
            property_id=property_id
        )
        return settings
    except ValueError as e:
        error_msg = str(e)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to get settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve settings. Please try again.")


@router.put("/settings", response_model=LostFoundSettingsResponse)
async def update_settings(
    settings: LostFoundSettings,
    property_id: Optional[str] = Query(None, description="Property ID (optional)"),
    current_user: User = Depends(get_current_user)
):
    """Update lost & found settings for a property"""
    try:
        updated_settings = await LostFoundService.update_settings(
            user_id=str(current_user.user_id),
            settings=settings,
            property_id=property_id
        )
        return updated_settings
    except ValueError as e:
        error_msg = str(e)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to update settings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update settings. Please try again.")


@router.post("/match", response_model=List[LostFoundMatch])
async def match_items(
    match_request: LostFoundMatchRequest,
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    current_user: User = Depends(get_current_user)
):
    """Match lost items using AI"""
    try:
        matches = await LostFoundService.match_items(
            user_id=str(current_user.user_id),
            match_request=match_request,
            property_id=property_id
        )
        return matches
    except ValueError as e:
        error_msg = str(e)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to match items: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to match items. Please try again.")


@router.get("/reports/export")
async def export_report(
    format: str = Query(..., description="Export format: pdf or csv"),
    start_date: Optional[datetime] = Query(None, description="Start date"),
    end_date: Optional[datetime] = Query(None, description="End date"),
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    item_type: Optional[str] = Query(None, description="Filter by item type"),
    current_user: User = Depends(get_current_user)
):
    """Export lost & found report as PDF or CSV"""
    try:
        file_content = await LostFoundService.export_report(
            user_id=str(current_user.user_id),
            format=format,
            property_id=property_id,
            start_date=start_date,
            end_date=end_date,
            status=status,
            item_type=item_type
        )
        
        # Set content type and filename
        if format.lower() == 'csv':
            media_type = 'text/csv'
            filename = f"lost-found-report-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.csv"
        else:
            media_type = 'application/pdf'
            filename = f"lost-found-report-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.pdf"
        
        return StreamingResponse(
            iter([file_content]),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as e:
        error_msg = str(e)
        if "access denied" in error_msg.lower():
            raise HTTPException(status_code=403, detail=error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        logger.error(f"Failed to export report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to export report. Please try again.")
