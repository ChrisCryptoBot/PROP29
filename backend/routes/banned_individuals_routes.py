"""
Banned Individuals API Routes
Handles HTTP requests for banned individuals management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from services.banned_individuals_service import BannedIndividualsService
from schemas import BannedIndividualCreate, BannedIndividualResponse
from models import BannedIndividual

router = APIRouter(prefix="/api/banned-individuals", tags=["banned-individuals"])

@router.get("/", response_model=List[dict])
async def get_banned_individuals(
    property_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get list of banned individuals with optional filters."""
    try:
        service = BannedIndividualsService(db)
        individuals = service.get_banned_individuals(
            property_id=property_id,
            is_active=is_active,
            limit=limit,
            offset=offset
        )
        return individuals
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving banned individuals: {str(e)}"
        )

@router.get("/{banned_id}", response_model=dict)
async def get_banned_individual(
    banned_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific banned individual by ID."""
    try:
        service = BannedIndividualsService(db)
        individual = service.get_banned_individual(banned_id)
        
        if not individual:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Banned individual not found"
            )
        
        return individual
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving banned individual: {str(e)}"
        )

@router.post("/", response_model=dict)
async def create_banned_individual(
    individual_data: BannedIndividualCreate,
    db: Session = Depends(get_db)
):
    """Create a new banned individual."""
    try:
        service = BannedIndividualsService(db)
        result = service.add_banned_individual(
            property_id=individual_data.property_id,
            first_name=individual_data.first_name,
            last_name=individual_data.last_name,
            reason_for_ban=individual_data.reason_for_ban,
            added_by=individual_data.added_by,
            date_of_birth=individual_data.date_of_birth,
            photo_url=individual_data.photo_url,
            facial_recognition_data=individual_data.facial_recognition_data,
            ban_end_date=individual_data.ban_end_date,
            is_permanent=individual_data.is_permanent,
            notes=individual_data.notes
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating banned individual: {str(e)}"
        )

@router.put("/{banned_id}", response_model=dict)
async def update_banned_individual(
    banned_id: str,
    update_data: dict,
    db: Session = Depends(get_db)
):
    """Update a banned individual's information."""
    try:
        service = BannedIndividualsService(db)
        result = service.update_banned_individual(banned_id, **update_data)
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating banned individual: {str(e)}"
        )

@router.delete("/{banned_id}", response_model=dict)
async def delete_banned_individual(
    banned_id: str,
    db: Session = Depends(get_db)
):
    """Deactivate a banned individual."""
    try:
        service = BannedIndividualsService(db)
        result = service.delete_banned_individual(banned_id)
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["error"]
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting banned individual: {str(e)}"
        )

@router.post("/check", response_model=dict)
async def check_individual(
    name: Optional[str] = None,
    photo_data: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Check if an individual is banned using name or photo."""
    try:
        service = BannedIndividualsService(db)
        result = service.check_individual(name=name, photo_data=photo_data)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking individual: {str(e)}"
        )

@router.post("/{banned_id}/detection", response_model=dict)
async def record_detection(
    banned_id: str,
    location: str,
    confidence: float,
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Record a detection of a banned individual."""
    try:
        service = BannedIndividualsService(db)
        result = service.record_detection(
            banned_id=banned_id,
            location=location,
            confidence=confidence,
            notes=notes
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error recording detection: {str(e)}"
        )

@router.get("/statistics/detections", response_model=dict)
async def get_detection_statistics(
    property_id: Optional[str] = None,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get detection statistics for the specified period."""
    try:
        service = BannedIndividualsService(db)
        stats = service.get_detection_statistics(
            property_id=property_id,
            days=days
        )
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting detection statistics: {str(e)}"
        )

@router.get("/metrics/overview", response_model=dict)
async def get_overview_metrics(
    property_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get overview metrics for the banned individuals system."""
    try:
        service = BannedIndividualsService(db)
        
        individuals = service.get_banned_individuals(
            property_id=property_id,
            is_active=True,
            limit=1000
        )
        
        detection_stats = service.get_detection_statistics(
            property_id=property_id,
            days=7
        )
        
        records_with_photo = sum(1 for i in individuals if i.get("photo_url"))
        
        return {
            "active_bans": len(individuals),
            "recent_detections": detection_stats.get("recent_detections", 0),
            "facial_recognition_accuracy": records_with_photo,
            "chain_wide_bans": len([i for i in individuals if i.get("is_permanent", False)]),
            "detection_rate": detection_stats.get("detection_rate", 0)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting overview metrics: {str(e)}"
        )
