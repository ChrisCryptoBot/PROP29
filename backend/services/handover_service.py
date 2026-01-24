"""
Handover Service
Business logic for Digital Handover management
Enforces property-level authorization and RBAC
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Handover, HandoverChecklistItem, HandoverSettings, User, Property, UserRole
from schemas import (
    HandoverCreate,
    HandoverUpdate,
    HandoverResponse,
    HandoverChecklistItemResponse,
    HandoverSettingsUpdate,
    HandoverSettingsResponse,
    HandoverMetricsResponse
)
from datetime import datetime, timedelta
import logging
import json

logger = logging.getLogger(__name__)


class HandoverService:
    @staticmethod
    async def get_handovers(
        user_id: str,
        property_id: Optional[str] = None,
        status: Optional[str] = None,
        shift_type: Optional[str] = None
    ) -> List[HandoverResponse]:
        """Get handovers with optional filtering - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            # Get user's accessible property IDs
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]

            if not user_property_ids:
                return []

            # Filter by user's accessible properties
            query = db.query(Handover).filter(Handover.property_id.in_(user_property_ids))

            # Additional filters
            if property_id:
                if property_id not in user_property_ids:
                    raise ValueError("Access denied to this property")
                query = query.filter(Handover.property_id == property_id)
            if status:
                query = query.filter(Handover.status == status)
            if shift_type:
                query = query.filter(Handover.shiftType == shift_type)

            handovers = query.order_by(Handover.handoverDate.desc()).all()

            return [HandoverResponse.from_orm(h) for h in handovers]
        finally:
            db.close()

    @staticmethod
    async def get_handover(handover_id: str, user_id: str) -> HandoverResponse:
        """Get a specific handover - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            handover = db.query(Handover).filter(Handover.handover_id == handover_id).first()
            if not handover:
                raise ValueError("Handover not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]

            if handover.property_id not in user_property_ids:
                raise ValueError("Access denied to this handover")

            return HandoverResponse.from_orm(handover)
        finally:
            db.close()

    @staticmethod
    async def create_handover(handover_data: HandoverCreate, user_id: str) -> HandoverResponse:
        """Create a new handover - Enforces property-level authorization and shift validation"""
        db = SessionLocal()
        try:
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if str(handover_data.property_id) not in user_property_ids:
                raise ValueError("Access denied to this property")

            # Shift overlap validation
            existing = db.query(Handover).filter(
                Handover.property_id == str(handover_data.property_id),
                Handover.handoverDate == handover_data.handoverDate,
                Handover.shiftType == handover_data.shiftType
            ).first()
            if existing:
                raise ValueError(f"A handover for the {handover_data.shiftType} shift on {handover_data.handoverDate.date()} already exists.")

            db_handover = Handover(
                property_id=str(handover_data.property_id),
                shiftType=handover_data.shiftType,
                handoverFrom=handover_data.handoverFrom,
                handoverTo=handover_data.handoverTo,
                handoverDate=handover_data.handoverDate,
                startTime=handover_data.startTime,
                endTime=handover_data.endTime,
                priority=handover_data.priority,
                handoverNotes=handover_data.handoverNotes,
                incidentsSummary=handover_data.incidentsSummary,
                specialInstructions=handover_data.specialInstructions,
                equipmentStatus=handover_data.equipmentStatus,
                status="pending"
            )

            db.add(db_handover)
            db.flush()  # Get ID for checklist items

            # Add checklist items
            if hasattr(handover_data, 'checklist_items') and handover_data.checklist_items:
                for item in handover_data.checklist_items:
                    db_item = HandoverChecklistItem(
                        handover_id=db_handover.handover_id,
                        title=item.title,
                        description=item.description,
                        category=item.category,
                        priority=item.priority,
                        assignedTo=item.assignedTo,
                        dueDate=item.dueDate,
                        status="pending"
                    )
                    db.add(db_item)

            db.commit()
            db.refresh(db_handover)

            return HandoverResponse.from_orm(db_handover)
        finally:
            db.close()

    @staticmethod
    async def update_handover(handover_id: str, updates: HandoverUpdate, user_id: str) -> HandoverResponse:
        """Update an existing handover - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            handover = db.query(Handover).filter(Handover.handover_id == handover_id).first()
            if not handover:
                raise ValueError("Handover not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]

            if handover.property_id not in user_property_ids:
                raise ValueError("Access denied to this handover")

            # Update fields
            update_data = updates.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(handover, field, value)

            if updates.status == "completed":
                handover.completedAt = datetime.utcnow()
                # Get user name for completedBy
                user = db.query(User).filter(User.user_id == user_id).first()
                if user:
                    handover.completedBy = f"{user.first_name} {user.last_name}"

            db.commit()
            db.refresh(handover)

            return HandoverResponse.from_orm(handover)
        finally:
            db.close()

    @staticmethod
    async def complete_handover(handover_id: str, user_id: str) -> HandoverResponse:
        """Complete a handover - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            handover = db.query(Handover).filter(Handover.handover_id == handover_id).first()
            if not handover:
                raise ValueError("Handover not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]

            if handover.property_id not in user_property_ids:
                raise ValueError("Access denied to this handover")

            handover.status = "completed"
            handover.completedAt = datetime.utcnow()
            
            # Get user name for completedBy
            user = db.query(User).filter(User.user_id == user_id).first()
            if user:
                handover.completedBy = f"{user.first_name} {user.last_name}"

            db.commit()
            db.refresh(handover)

            return HandoverResponse.from_orm(handover)
        finally:
            db.close()

    @staticmethod
    async def get_settings(user_id: str, property_id: str) -> HandoverSettingsResponse:
        """Get handover settings for a property"""
        db = SessionLocal()
        try:
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if property_id not in user_property_ids:
                raise ValueError("Access denied to this property")

            settings = db.query(HandoverSettings).filter(HandoverSettings.property_id == property_id).first()
            
            if not settings:
                # Create default settings if not exists
                settings = HandoverSettings(property_id=property_id)
                db.add(settings)
                db.commit()
                db.refresh(settings)

            return HandoverSettingsResponse.from_orm(settings)
        finally:
            db.close()

    @staticmethod
    async def update_settings(user_id: str, property_id: str, updates: HandoverSettingsUpdate) -> HandoverSettingsResponse:
        """Update handover settings for a property"""
        db = SessionLocal()
        try:
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if property_id not in user_property_ids:
                raise ValueError("Access denied to this property")

            # Check for admin/manager role
            has_permission = any(
                role.role_name.value in ["admin", "security_manager", "manager"] and role.property_id == property_id
                for role in user_roles
            )
            if not has_permission:
                raise ValueError("Insufficient permissions to update settings")

            settings = db.query(HandoverSettings).filter(HandoverSettings.property_id == property_id).first()
            if not settings:
                settings = HandoverSettings(property_id=property_id)
                db.add(settings)

            # Update fields
            update_data = updates.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(settings, field, value)
            
            settings.updated_by = user_id
            
            db.commit()
            db.refresh(settings)

            return HandoverSettingsResponse.from_orm(settings)
        finally:
            db.close()

    @staticmethod
    async def get_metrics(user_id: str, property_id: str) -> HandoverMetricsResponse:
        """Get handover metrics/analytics"""
        db = SessionLocal()
        try:
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if property_id not in user_property_ids:
                raise ValueError("Access denied to this property")

            handovers = db.query(Handover).filter(Handover.property_id == property_id).all()
            
            total = len(handovers)
            completed = len([h for h in handovers if h.status == "completed"])
            pending = len([h for h in handovers if h.status == "pending"])
            overdue = len([h for h in handovers if h.status == "overdue"])
            
            completion_rate = (completed / total * 100) if total > 0 else 0.0
            
            # Simple average completion time (mock logic for now)
            avg_completion_time = "12 min"
            
            # Group by shift
            by_shift = {"morning": 0, "afternoon": 0, "night": 0}
            for h in handovers:
                by_shift[h.shiftType] = by_shift.get(h.shiftType, 0) + 1
                
            # Group by status
            by_status = {"completed": completed, "pending": pending, "overdue": overdue, "in_progress": 0}
            for h in handovers:
                if h.status not in by_status:
                    by_status[h.status] = 1
                else:
                    by_status[h.status] += 1

            # Monthly trend (last 6 months)
            monthly = []
            for i in range(6):
                date = datetime.utcnow() - timedelta(days=30 * i)
                monthly.insert(0, {
                    "month": date.strftime("%b"),
                    "completed": len([h for h in handovers if h.status == "completed" and h.handoverDate.month == date.month]),
                    "total": len([h for h in handovers if h.handoverDate.month == date.month])
                })

            # Checklist completion rate
            items_query = db.query(HandoverChecklistItem).join(Handover).filter(Handover.property_id == property_id)
            all_items = items_query.all()
            completed_items = [i for i in all_items if i.status == "completed"]
            checklist_rate = (len(completed_items) / len(all_items) * 100) if all_items else 0.0
            
            # Average rating
            rated_handovers = [h.handoverRating for h in handovers if h.handoverRating is not None]
            avg_rating = (sum(rated_handovers) / len(rated_handovers)) if rated_handovers else 0.0

            return HandoverMetricsResponse(
                totalHandovers=total,
                completedHandovers=completed,
                pendingHandovers=pending,
                overdueHandovers=overdue,
                averageCompletionTime=avg_completion_time,
                completionRate=completion_rate,
                handoversByShift=by_shift,
                handoversByStatus=by_status,
                monthlyHandovers=monthly,
                checklistCompletionRate=checklist_rate,
                averageRating=avg_rating
            )
        finally:
            db.close()

    @staticmethod
    async def get_property_staff(user_id: str, property_id: str) -> List[Dict[str, Any]]:
        """Get staff members for a property"""
        db = SessionLocal()
        try:
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if property_id not in user_property_ids:
                raise ValueError("Access denied to this property")

            # Get all users with roles at this property
            staff_roles = db.query(UserRole, User).join(User).filter(
                UserRole.property_id == property_id,
                UserRole.is_active == True
            ).all()

            return [
                {
                    "id": str(r.User.user_id),
                    "name": f"{r.User.first_name} {r.User.last_name}",
                    "role": r.role_name.value,
                    "status": "Available"  # Mock status for now
                }
                for r in staff_roles
            ]
        finally:
            db.close()

    @staticmethod
    async def get_shift_timeline(user_id: str, property_id: str) -> List[Dict[str, Any]]:
        """Get today's shift timeline for a property"""
        db = SessionLocal()
        try:
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if property_id not in user_property_ids:
                raise ValueError("Access denied to this property")

            settings = db.query(HandoverSettings).filter(HandoverSettings.property_id == property_id).first()
            if not settings:
                return []

            today = datetime.utcnow().date()
            handovers = db.query(Handover).filter(
                Handover.property_id == property_id,
                Handover.handoverDate == today
            ).all()

            timeline = []
            if settings.shiftConfigurations:
                for shift_name, config in settings.shiftConfigurations.items():
                    # Find handover for this shift
                    handover = next((h for h in handovers if h.shiftType == shift_name), None)
                    
                    timeline.append({
                        "shift": shift_name.capitalize(),
                        "time": f"{config.get('start', '')} - {config.get('end', '')}",
                        "staff": f"{handover.handoverFrom} → {handover.handoverTo}" if handover else "TBD",
                        "status": handover.status if handover else "pending"
                    })

            return timeline
        except Exception as e:
            logger.error(f"Error fetching shift timeline: {str(e)}")
            return []
        finally:
            db.close()
    @staticmethod
    async def get_verification_status(handover_id: str, user_id: str) -> Dict[str, Any]:
        """Get verification status for a handover"""
        db = SessionLocal()
        try:
            handover = db.query(Handover).filter(Handover.handover_id == handover_id).first()
            if not handover:
                raise ValueError("Handover not found")
            
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]
            
            if handover.property_id not in user_property_ids:
                raise ValueError("Access denied to this handover")

            return {
                "handoverId": handover_id,
                "status": handover.verificationStatus,
                "verifiedAt": handover.verifiedAt,
                "verifiedBy": handover.verifiedBy,
                "hasSignatureFrom": bool(handover.signatureFrom),
                "hasSignatureTo": bool(handover.signatureTo)
            }
        finally:
            db.close()

    @staticmethod
    async def request_verification(handover_id: str, user_id: str) -> Dict[str, Any]:
        """Request verification for a handover"""
        db = SessionLocal()
        try:
            handover = db.query(Handover).filter(Handover.handover_id == handover_id).first()
            if not handover:
                raise ValueError("Handover not found")
            
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]
            
            if handover.property_id not in user_property_ids:
                raise ValueError("Access denied to this handover")

            handover.verificationStatus = "requested"
            db.commit()
            
            return {"status": "requested", "handoverId": handover_id}
        finally:
            db.close()

    @staticmethod
    async def submit_signature(handover_id: str, user_id: str, signature: str, role: str) -> Dict[str, Any]:
        """Submit an officer signature for verification"""
        db = SessionLocal()
        try:
            handover = db.query(Handover).filter(Handover.handover_id == handover_id).first()
            if not handover:
                raise ValueError("Handover not found")
            
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]
            
            if handover.property_id not in user_property_ids:
                raise ValueError("Access denied to this handover")

            if role == "from":
                handover.signatureFrom = signature
            elif role == "to":
                handover.signatureTo = signature
                handover.verificationStatus = "verified"
                handover.verifiedAt = datetime.utcnow()
                
                # Get user name
                user = db.query(User).filter(User.user_id == user_id).first()
                if user:
                    handover.verifiedBy = f"{user.first_name} {user.last_name}"
            else:
                raise ValueError("Invalid role for signature. Must be 'from' or 'to'.")

            db.commit()
            return {"status": handover.verificationStatus, "handoverId": handover_id}
        finally:
            db.close()

    @staticmethod
    async def get_templates(user_id: str, property_id: str, operational_post: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get checklist templates for a property"""
        db = SessionLocal()
        try:
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if property_id not in user_property_ids:
                raise ValueError("Access denied to this property")

            from models import HandoverTemplate
            query = db.query(HandoverTemplate).filter(HandoverTemplate.property_id == property_id)
            if operational_post:
                query = query.filter(HandoverTemplate.operationalPost == operational_post)
            
            templates = query.all()
            return templates
        finally:
            db.close()

    @staticmethod
    async def get_template(template_id: str, user_id: str) -> Dict[str, Any]:
        """Get a specific template"""
        db = SessionLocal()
        try:
            from models import HandoverTemplate
            template = db.query(HandoverTemplate).filter(HandoverTemplate.template_id == template_id).first()
            if not template:
                raise ValueError("Template not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if str(template.property_id) not in user_property_ids:
                raise ValueError("Access denied to this template")

            return template
        finally:
            db.close()

    @staticmethod
    async def create_template(user_id: str, data: Any) -> Dict[str, Any]:
        """Create a new checklist template"""
        db = SessionLocal()
        try:
            from models import HandoverTemplate, HandoverTemplateItem
            
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if str(data.property_id) not in user_property_ids:
                raise ValueError("Access denied to this property")

            db_template = HandoverTemplate(
                property_id=str(data.property_id),
                name=data.name,
                category=data.category,
                operationalPost=data.operationalPost,
                isDefault=data.isDefault
            )
            db.add(db_template)
            db.flush()

            for item in data.items:
                db_item = HandoverTemplateItem(
                    template_id=db_template.template_id,
                    title=item.title,
                    description=item.description,
                    category=item.category,
                    priority=item.priority,
                    assignedTo=item.assignedTo
                )
                db.add(db_item)

            db.commit()
            db.refresh(db_template)
            return db_template
        finally:
            db.close()

    @staticmethod
    async def delete_template(template_id: str, user_id: str) -> None:
        """Delete a checklist template"""
        db = SessionLocal()
        try:
            from models import HandoverTemplate
            template = db.query(HandoverTemplate).filter(HandoverTemplate.template_id == template_id).first()
            if not template:
                raise ValueError("Template not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if str(template.property_id) not in user_property_ids:
                raise ValueError("Access denied to this template")

            db.delete(template)
            db.commit()
        finally:
            db.close()

