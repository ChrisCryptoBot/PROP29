from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from database import SessionLocal
from schemas import BannedIndividualCreate, BannedIndividualResponse
from services.banned_individuals_service import BannedIndividualsService
from api.auth_dependencies import get_current_user, require_admin_role, check_user_has_property_access
from models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/banned-individuals", tags=["Banned Individuals"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[BannedIndividualResponse])
async def get_banned_individuals(
    property_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all banned individuals with optional filtering"""
    try:
        service = BannedIndividualsService(db)
        return service.get_banned_individuals(property_id=property_id, is_active=is_active)
    except Exception as e:
        logger.error(f"Error getting banned individuals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=BannedIndividualResponse, status_code=201)
async def add_banned_individual(
    individual: BannedIndividualCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new banned individual"""
    try:
        # Check property access
        if not check_user_has_property_access(current_user, str(individual.property_id)):
            raise HTTPException(status_code=403, detail="Access denied to this property")
            
        service = BannedIndividualsService(db)
        result = service.add_banned_individual(
            property_id=str(individual.property_id),
            first_name=individual.first_name,
            last_name=individual.last_name,
            reason_for_ban=individual.reason_for_ban,
            added_by=str(current_user.user_id),
            date_of_birth=individual.date_of_birth,
            photo_url=individual.photo_url,
            facial_recognition_data=individual.facial_recognition_data,
            ban_end_date=individual.ban_end_date,
            is_permanent=individual.is_permanent,
            notes=individual.notes
        )
        
        # Fetch the created individual to return full response
        new_individual = service.get_banned_individual(result["banned_id"])
        return new_individual
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding banned individual: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_stats(
    property_id: Optional[str] = Query(None),
    days: int = Query(30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detection statistics"""
    try:
        service = BannedIndividualsService(db)
        return service.get_detection_statistics(property_id=property_id, days=days)
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/facial-recognition-status")
async def get_fr_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get facial recognition system status"""
    try:
        service = BannedIndividualsService(db)
        return service.get_facial_recognition_status()
    except Exception as e:
        logger.error(f"Error getting FR status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{banned_id}", response_model=BannedIndividualResponse)
async def get_banned_individual(
    banned_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific banned individual by ID"""
    try:
        service = BannedIndividualsService(db)
        individual = service.get_banned_individual(banned_id)
        if not individual:
            raise HTTPException(status_code=404, detail="Banned individual not found")
        return individual
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting banned individual: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{banned_id}", response_model=BannedIndividualResponse)
async def update_banned_individual(
    banned_id: str,
    updates: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a banned individual's information"""
    try:
        service = BannedIndividualsService(db)
        result = service.update_banned_individual(banned_id, **updates)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        # Fetch updated individual
        return service.get_banned_individual(banned_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating banned individual: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{banned_id}")
async def delete_banned_individual(
    banned_id: str,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Soft delete a banned individual"""
    try:
        service = BannedIndividualsService(db)
        result = service.delete_banned_individual(banned_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting banned individual: {e}")
        raise HTTPException(status_code=500, detail=str(e))
