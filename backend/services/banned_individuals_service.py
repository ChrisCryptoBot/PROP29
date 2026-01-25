"""
Banned Individuals Service
Handles banned individuals management, facial recognition, and detection alerts.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import uuid
import json
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from models import BannedIndividual, User, Property
from schemas import BannedIndividualCreate, BannedIndividualResponse
import logging

logger = logging.getLogger(__name__)

class BannedIndividualsService:
    """Service for managing banned individuals and facial recognition."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def add_banned_individual(
        self,
        property_id: str,
        first_name: str,
        last_name: str,
        reason_for_ban: str,
        added_by: str,
        date_of_birth: Optional[datetime] = None,
        photo_url: Optional[str] = None,
        facial_recognition_data: Optional[Dict[str, Any]] = None,
        ban_end_date: Optional[datetime] = None,
        is_permanent: bool = False,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Add a new banned individual to the database."""
        try:
            banned_individual = BannedIndividual(
                banned_id=str(uuid.uuid4()),
                property_id=property_id,
                first_name=first_name,
                last_name=last_name,
                date_of_birth=date_of_birth,
                photo_url=photo_url,
                facial_recognition_data=facial_recognition_data,
                reason_for_ban=reason_for_ban,
                ban_end_date=ban_end_date,
                is_permanent=is_permanent,
                added_by=added_by,
                notes=notes,
                is_active=True
            )
            
            self.db.add(banned_individual)
            self.db.commit()
            self.db.refresh(banned_individual)
            
            logger.info(f"Added banned individual: {first_name} {last_name}")
            
            return {
                "banned_id": banned_individual.banned_id,
                "name": f"{first_name} {last_name}",
                "status": "active",
                "message": "Banned individual added successfully"
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error adding banned individual: {str(e)}")
            raise e
    
    def get_banned_individuals(
        self,
        property_id: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get list of banned individuals with optional filters."""
        try:
            query = self.db.query(BannedIndividual)
            
            if property_id:
                query = query.filter(BannedIndividual.property_id == property_id)
            
            if is_active is not None:
                query = query.filter(BannedIndividual.is_active == is_active)
            
            banned_individuals = query.offset(offset).limit(limit).all()
            
            result = []
            for individual in banned_individuals:
                result.append({
                    "banned_id": individual.banned_id,
                    "first_name": individual.first_name,
                    "last_name": individual.last_name,
                    "date_of_birth": individual.date_of_birth.isoformat() if individual.date_of_birth else None,
                    "photo_url": individual.photo_url,
                    "reason_for_ban": individual.reason_for_ban,
                    "ban_start_date": individual.ban_start_date.isoformat(),
                    "ban_end_date": individual.ban_end_date.isoformat() if individual.ban_end_date else None,
                    "is_permanent": individual.is_permanent,
                    "added_by": individual.added_by,
                    "detection_count": individual.detection_count,
                    "last_detection": individual.last_detection.isoformat() if individual.last_detection else None,
                    "notes": individual.notes,
                    "is_active": individual.is_active,
                    "created_at": individual.ban_start_date.isoformat()
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting banned individuals: {str(e)}")
            raise e
    
    def get_banned_individual(self, banned_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific banned individual by ID."""
        try:
            individual = self.db.query(BannedIndividual).filter(
                BannedIndividual.banned_id == banned_id
            ).first()
            
            if not individual:
                return None
            
            return {
                "banned_id": individual.banned_id,
                "first_name": individual.first_name,
                "last_name": individual.last_name,
                "date_of_birth": individual.date_of_birth.isoformat() if individual.date_of_birth else None,
                "photo_url": individual.photo_url,
                "facial_recognition_data": individual.facial_recognition_data,
                "reason_for_ban": individual.reason_for_ban,
                "ban_start_date": individual.ban_start_date.isoformat(),
                "ban_end_date": individual.ban_end_date.isoformat() if individual.ban_end_date else None,
                "is_permanent": individual.is_permanent,
                "added_by": individual.added_by,
                "detection_count": individual.detection_count,
                "last_detection": individual.last_detection.isoformat() if individual.last_detection else None,
                "notes": individual.notes,
                "is_active": individual.is_active
            }
            
        except Exception as e:
            logger.error(f"Error getting banned individual {banned_id}: {str(e)}")
            raise e
    
    def update_banned_individual(
        self,
        banned_id: str,
        **updates
    ) -> Dict[str, Any]:
        """Update a banned individual's information."""
        try:
            individual = self.db.query(BannedIndividual).filter(
                BannedIndividual.banned_id == banned_id
            ).first()
            
            if not individual:
                return {"error": "Banned individual not found"}
            
            # Update allowed fields
            allowed_fields = [
                'first_name', 'last_name', 'date_of_birth', 'photo_url',
                'facial_recognition_data', 'reason_for_ban', 'ban_end_date',
                'is_permanent', 'notes', 'is_active'
            ]
            
            for field, value in updates.items():
                if field in allowed_fields and hasattr(individual, field):
                    setattr(individual, field, value)
            
            self.db.commit()
            self.db.refresh(individual)
            
            logger.info(f"Updated banned individual: {banned_id}")
            
            return {
                "banned_id": individual.banned_id,
                "message": "Banned individual updated successfully"
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating banned individual {banned_id}: {str(e)}")
            raise e
    
    def delete_banned_individual(self, banned_id: str) -> Dict[str, Any]:
        """Soft delete a banned individual (set is_active to False)."""
        try:
            individual = self.db.query(BannedIndividual).filter(
                BannedIndividual.banned_id == banned_id
            ).first()
            
            if not individual:
                return {"error": "Banned individual not found"}
            
            individual.is_active = False
            self.db.commit()
            
            logger.info(f"Deactivated banned individual: {banned_id}")
            
            return {
                "banned_id": banned_id,
                "message": "Banned individual deactivated successfully"
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting banned individual {banned_id}: {str(e)}")
            raise e
    
    def check_individual(
        self,
        name: Optional[str] = None,
        photo_data: Optional[str] = None
    ) -> Dict[str, Any]:
        """Check if an individual is banned using name or photo."""
        try:
            query = self.db.query(BannedIndividual).filter(
                BannedIndividual.is_active == True
            )
            
            if name:
                # Simple name matching (in real implementation, use fuzzy matching)
                name_parts = name.lower().split()
                for part in name_parts:
                    query = query.filter(
                        or_(
                            BannedIndividual.first_name.ilike(f"%{part}%"),
                            BannedIndividual.last_name.ilike(f"%{part}%")
                        )
                    )
            
            matches = query.all()
            
            if matches:
                return {
                    "is_banned": True,
                    "matches": len(matches),
                    "individuals": [
                        {
                            "banned_id": match.banned_id,
                            "name": f"{match.first_name} {match.last_name}",
                            "reason": match.reason_for_ban,
                            "risk_level": "HIGH" if match.is_permanent else "MEDIUM"
                        }
                        for match in matches
                    ]
                }
            else:
                return {
                    "is_banned": False,
                    "matches": 0,
                    "individuals": []
                }
                
        except Exception as e:
            logger.error(f"Error checking individual: {str(e)}")
            raise e
    
    def facial_recognition_check(self, photo_data: str) -> Dict[str, Any]:
        """Check if a photo matches any banned individuals using facial recognition."""
        try:
            # In a real implementation, this would use actual facial recognition
            # For now, we'll simulate the process
            
            # Get all active banned individuals with facial recognition data
            individuals = self.db.query(BannedIndividual).filter(
                and_(
                    BannedIndividual.is_active == True,
                    BannedIndividual.facial_recognition_data.isnot(None)
                )
            ).all()
            
            # Simulate facial recognition matching
            # In reality, this would use a facial recognition API
            matches = []
            for individual in individuals:
                # Simulate confidence score
                confidence = 85.0 + (hash(photo_data) % 15)  # Random confidence between 85-100
                
                if confidence > 90.0:  # Threshold for match
                    matches.append({
                        "banned_id": individual.banned_id,
                        "name": f"{individual.first_name} {individual.last_name}",
                        "confidence": confidence,
                        "reason": individual.reason_for_ban
                    })
            
            return {
                "match": len(matches) > 0,
                "confidence": max([m["confidence"] for m in matches]) if matches else 0,
                "matches": matches
            }
            
        except Exception as e:
            logger.error(f"Error in facial recognition check: {str(e)}")
            raise e
    
    def record_detection(
        self,
        banned_id: str,
        location: str,
        confidence: float,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Record a detection of a banned individual."""
        try:
            individual = self.db.query(BannedIndividual).filter(
                BannedIndividual.banned_id == banned_id
            ).first()
            
            if not individual:
                return {"error": "Banned individual not found"}
            
            # Update detection count and last detection
            individual.detection_count += 1
            individual.last_detection = datetime.utcnow()
            
            self.db.commit()
            
            logger.info(f"Recorded detection for banned individual: {banned_id}")
            
            return {
                "banned_id": banned_id,
                "detection_count": individual.detection_count,
                "last_detection": individual.last_detection.isoformat(),
                "message": "Detection recorded successfully"
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error recording detection: {str(e)}")
            raise e
    
    def get_detection_statistics(
        self,
        property_id: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get detection statistics for the specified period."""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            query = self.db.query(BannedIndividual).filter(
                BannedIndividual.is_active == True
            )
            
            if property_id:
                query = query.filter(BannedIndividual.property_id == property_id)
            
            individuals = query.all()
            
            total_detections = sum(individual.detection_count for individual in individuals)
            active_individuals = len(individuals)
            
            # Calculate recent detections (last 7 days)
            recent_detections = 0
            for individual in individuals:
                if individual.last_detection and individual.last_detection >= start_date:
                    recent_detections += 1
            
            return {
                "total_banned_individuals": active_individuals,
                "total_detections": total_detections,
                "recent_detections": recent_detections,
                "detection_rate": total_detections / max(active_individuals, 1),
                "period_days": days
            }
            
        except Exception as e:
            logger.error(f"Error getting detection statistics: {str(e)}")
            raise e
    
    def get_facial_recognition_status(self) -> Dict[str, Any]:
        """Get facial recognition system status and statistics."""
        try:
            # Get all individuals with facial recognition data
            individuals_with_fr = self.db.query(BannedIndividual).filter(
                and_(
                    BannedIndividual.is_active == True,
                    BannedIndividual.facial_recognition_data.isnot(None)
                )
            ).count()
            
            total_active = self.db.query(BannedIndividual).filter(
                BannedIndividual.is_active == True
            ).count()
            
            # Calculate training status
            training_percentage = (individuals_with_fr / max(total_active, 1)) * 100
            
            if training_percentage >= 90:
                training_status = "TRAINED"
            elif training_percentage >= 50:
                training_status = "TRAINING"
            else:
                training_status = "NEEDS_TRAINING"
            
            return {
                "training_status": training_status,
                "training_percentage": round(training_percentage, 1),
                "total_faces": individuals_with_fr,
                "active_individuals": total_active,
                "accuracy": 96.8,  # Simulated accuracy
                "last_training": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting facial recognition status: {str(e)}")
            raise e
    
    def get_detection_alerts(self, property_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get detection alerts"""
        # Placeholder - in production this would query a detections table
        return []
    
    def mark_detection_false_positive(self, detection_id: str, notes: Optional[str] = None) -> bool:
        """Mark a detection as false positive"""
        # Placeholder - in production this would update the detection status
        return True
    
    def acknowledge_detection(self, detection_id: str, action_taken: str, notes: Optional[str] = None) -> bool:
        """Acknowledge a detection"""
        # Placeholder - in production this would update the detection
        return True
    
    def get_detection_footage(self, detection_id: str) -> Optional[str]:
        """Get video footage URL for a detection"""
        # Placeholder - in production this would return actual footage URL
        return None
    
    def bulk_import(self, csv_data: str) -> Dict[str, Any]:
        """Bulk import banned individuals from CSV"""
        # Placeholder - in production this would parse CSV and import
        return {"success": 0, "failed": 0, "errors": []}
    
    def get_settings(self, property_id: Optional[str] = None) -> Dict[str, Any]:
        """Get banned individuals settings"""
        # Placeholder - in production this would fetch from settings table
        return {
            "auto_share_permanent_bans": True,
            "facial_recognition_alerts": True,
            "strict_id_verification": False,
            "audit_logs_retention": "180",
            "biometric_data_purge": "30",
            "confidence_threshold": 85,
            "retention_days": 180
        }
    
    def update_settings(self, settings: Dict[str, Any]) -> bool:
        """Update banned individuals settings"""
        # Placeholder - in production this would save to settings table
        return True
    
    def update_fr_config(self, confidence_threshold: int, retention_days: int) -> bool:
        """Update facial recognition configuration"""
        # Placeholder - in production this would update config
        return True
    
    def trigger_training(self) -> str:
        """Trigger facial recognition model training"""
        # Placeholder - in production this would start training job
        return str(uuid.uuid4())
    
    def get_analytics(self, start_date: Optional[str] = None, end_date: Optional[str] = None, property_id: Optional[str] = None) -> Dict[str, Any]:
        """Get analytics data"""
        # Placeholder - in production this would calculate real analytics
        return {
            "detection_frequency": "2.3",
            "security_effectiveness": "96.8",
            "monthly_trends": []
        }
