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

@router.get("/detections")
async def get_detections(
    property_id: Optional[str] = Query(None),
    limit: int = Query(100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detection alerts"""
    try:
        service = BannedIndividualsService(db)
        return service.get_detection_alerts(property_id=property_id, limit=limit)
    except Exception as e:
        logger.error(f"Error getting detections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/detections/{detection_id}/false-positive")
async def mark_false_positive(
    detection_id: str,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a detection as false positive"""
    try:
        service = BannedIndividualsService(db)
        result = service.mark_detection_false_positive(detection_id, notes)
        return {"success": result}
    except Exception as e:
        logger.error(f"Error marking false positive: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/detections/{detection_id}/acknowledge")
async def acknowledge_detection(
    detection_id: str,
    action_taken: str,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Acknowledge a detection"""
    try:
        service = BannedIndividualsService(db)
        result = service.acknowledge_detection(detection_id, action_taken, notes)
        return {"success": result}
    except Exception as e:
        logger.error(f"Error acknowledging detection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/detections/{detection_id}/footage")
async def get_detection_footage(
    detection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get video footage URL for a detection"""
    try:
        service = BannedIndividualsService(db)
        footage_url = service.get_detection_footage(detection_id)
        if not footage_url:
            raise HTTPException(status_code=404, detail="Footage not found")
        return {"video_url": footage_url}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting footage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{banned_id}/photo")
async def upload_photo(
    banned_id: str,
    photo: Any,  # File upload
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload photo for a banned individual"""
    try:
        service = BannedIndividualsService(db)
        # In production, this would handle actual file upload
        photo_url = f"/api/banned-individuals/{banned_id}/photo"
        result = service.update_banned_individual(banned_id, photo_url=photo_url)
        return {"photo_url": photo_url}
    except Exception as e:
        logger.error(f"Error uploading photo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk-import")
async def bulk_import(
    csv_data: str,
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Bulk import banned individuals from CSV"""
    try:
        service = BannedIndividualsService(db)
        result = service.bulk_import(csv_data)
        return result
    except Exception as e:
        logger.error(f"Error bulk importing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/settings")
async def get_settings(
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get banned individuals settings"""
    try:
        service = BannedIndividualsService(db)
        return service.get_settings(property_id)
    except Exception as e:
        logger.error(f"Error getting settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/settings")
async def update_settings(
    settings: Dict[str, Any],
    current_user: User = Depends(require_admin_role),
    db: Session = Depends(get_db)
):
    """Update banned individuals settings"""
    try:
        service = BannedIndividualsService(db)
        result = service.update_settings(settings)
        return {"success": result}
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics")
async def get_analytics(
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    property_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analytics data"""
    try:
        service = BannedIndividualsService(db)
        return service.get_analytics(
            start_date=startDate,
            end_date=endDate,
            property_id=property_id
        )
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
