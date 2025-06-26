from typing import List, Optional, Dict, Any
from database import SessionLocal
from models import Patrol, User, Property
from schemas import PatrolCreate, PatrolUpdate, PatrolResponse
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PatrolService:
    @staticmethod
    async def get_patrols(
        user_id: str, 
        property_id: Optional[str] = None, 
        status: Optional[str] = None
    ) -> List[PatrolResponse]:
        """Get patrols with optional filtering"""
        db = SessionLocal()
        try:
            query = db.query(Patrol)
            
            if property_id:
                query = query.filter(Patrol.property_id == property_id)
            if status:
                query = query.filter(Patrol.status == status)
            
            patrols = query.order_by(Patrol.created_at.desc()).all()
            
            return [
                PatrolResponse(
                    patrol_id=patrol.patrol_id,
                    property_id=patrol.property_id,
                    guard_id=patrol.guard_id,
                    patrol_type=patrol.patrol_type,
                    route=patrol.route,
                    status=patrol.status,
                    started_at=patrol.started_at,
                    completed_at=patrol.completed_at,
                    created_at=patrol.created_at,
                    ai_priority_score=patrol.ai_priority_score,
                    checkpoints=patrol.checkpoints,
                    observations=patrol.observations,
                    incidents_found=patrol.incidents_found,
                    efficiency_score=patrol.efficiency_score,
                    guard_name=f"{patrol.guard.first_name} {patrol.guard.last_name}" if patrol.guard else None,
                    property_name=patrol.property.property_name if patrol.property else None
                )
                for patrol in patrols
            ]
        finally:
            db.close()
    
    @staticmethod
    async def create_patrol(patrol: PatrolCreate, user_id: str) -> PatrolResponse:
        """Create a new patrol"""
        db = SessionLocal()
        try:
            db_patrol = Patrol(
                property_id=patrol.property_id,
                guard_id=patrol.guard_id,
                patrol_type=patrol.patrol_type,
                route=patrol.route,
                checkpoints=patrol.checkpoints,
                observations=patrol.observations
            )
            
            db.add(db_patrol)
            db.commit()
            db.refresh(db_patrol)
            
            return PatrolResponse(
                patrol_id=db_patrol.patrol_id,
                property_id=db_patrol.property_id,
                guard_id=db_patrol.guard_id,
                patrol_type=db_patrol.patrol_type,
                route=db_patrol.route,
                status=db_patrol.status,
                started_at=db_patrol.started_at,
                completed_at=db_patrol.completed_at,
                created_at=db_patrol.created_at,
                ai_priority_score=db_patrol.ai_priority_score,
                checkpoints=db_patrol.checkpoints,
                observations=db_patrol.observations,
                incidents_found=db_patrol.incidents_found,
                efficiency_score=db_patrol.efficiency_score
            )
        finally:
            db.close()
    
    @staticmethod
    async def get_patrol(patrol_id: str, user_id: str) -> PatrolResponse:
        """Get a specific patrol"""
        db = SessionLocal()
        try:
            patrol = db.query(Patrol).filter(Patrol.patrol_id == patrol_id).first()
            if not patrol:
                raise ValueError("Patrol not found")
            
            return PatrolResponse(
                patrol_id=patrol.patrol_id,
                property_id=patrol.property_id,
                guard_id=patrol.guard_id,
                patrol_type=patrol.patrol_type,
                route=patrol.route,
                status=patrol.status,
                started_at=patrol.started_at,
                completed_at=patrol.completed_at,
                created_at=patrol.created_at,
                ai_priority_score=patrol.ai_priority_score,
                checkpoints=patrol.checkpoints,
                observations=patrol.observations,
                incidents_found=patrol.incidents_found,
                efficiency_score=patrol.efficiency_score,
                guard_name=f"{patrol.guard.first_name} {patrol.guard.last_name}" if patrol.guard else None,
                property_name=patrol.property.property_name if patrol.property else None
            )
        finally:
            db.close()
    
    @staticmethod
    async def update_patrol(patrol_id: str, patrol_update: PatrolUpdate, user_id: str) -> PatrolResponse:
        """Update a patrol"""
        db = SessionLocal()
        try:
            patrol = db.query(Patrol).filter(Patrol.patrol_id == patrol_id).first()
            if not patrol:
                raise ValueError("Patrol not found")
            
            # Update fields
            update_data = patrol_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(patrol, field, value)
            
            db.commit()
            db.refresh(patrol)
            
            return PatrolResponse(
                patrol_id=patrol.patrol_id,
                property_id=patrol.property_id,
                guard_id=patrol.guard_id,
                patrol_type=patrol.patrol_type,
                route=patrol.route,
                status=patrol.status,
                started_at=patrol.started_at,
                completed_at=patrol.completed_at,
                created_at=patrol.created_at,
                ai_priority_score=patrol.ai_priority_score,
                checkpoints=patrol.checkpoints,
                observations=patrol.observations,
                incidents_found=patrol.incidents_found,
                efficiency_score=patrol.efficiency_score
            )
        finally:
            db.close()
    
    @staticmethod
    async def start_patrol(patrol_id: str, user_id: str) -> Dict[str, Any]:
        """Start a patrol"""
        db = SessionLocal()
        try:
            patrol = db.query(Patrol).filter(Patrol.patrol_id == patrol_id).first()
            if not patrol:
                raise ValueError("Patrol not found")
            
            if patrol.status != "planned":
                raise ValueError("Patrol can only be started if it's in planned status")
            
            patrol.status = "active"
            patrol.started_at = datetime.utcnow()
            
            db.commit()
            
            return {"message": "Patrol started successfully", "patrol_id": patrol_id}
        finally:
            db.close()
    
    @staticmethod
    async def complete_patrol(patrol_id: str, user_id: str) -> Dict[str, Any]:
        """Complete a patrol"""
        db = SessionLocal()
        try:
            patrol = db.query(Patrol).filter(Patrol.patrol_id == patrol_id).first()
            if not patrol:
                raise ValueError("Patrol not found")
            
            if patrol.status != "active":
                raise ValueError("Patrol can only be completed if it's active")
            
            patrol.status = "completed"
            patrol.completed_at = datetime.utcnow()
            
            # Calculate efficiency score based on completion time vs estimated time
            if patrol.started_at and patrol.completed_at:
                actual_duration = (patrol.completed_at - patrol.started_at).total_seconds() / 60  # minutes
                estimated_duration = patrol.route.get("estimated_duration", 60)  # default 60 minutes
                efficiency = max(0, min(100, (estimated_duration / actual_duration) * 100))
                patrol.efficiency_score = efficiency
            
            db.commit()
            
            return {"message": "Patrol completed successfully", "patrol_id": patrol_id}
        finally:
            db.close() 