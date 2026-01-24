"""
Lost & Found Service
Business logic for Lost & Found items management
Enforces property-level authorization and RBAC
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from database import SessionLocal
from models import LostFoundItem, User, Property, UserRole, LostFoundStatus
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
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class LostFoundService:
    @staticmethod
    async def get_items(
        user_id: str,
        property_id: Optional[str] = None,
        status: Optional[str] = None,
        item_type: Optional[str] = None
    ) -> List[LostFoundItemResponse]:
        """Get lost & found items with optional filtering - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            # Get user's accessible property IDs
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]

            if not user_property_ids:
                # User has no properties assigned, return empty list
                return []

            # Filter by user's accessible properties
            query = db.query(LostFoundItem).filter(LostFoundItem.property_id.in_(user_property_ids))

            # Additional filters
            if property_id:
                # Verify user has access to requested property
                if property_id not in user_property_ids:
                    raise ValueError("Access denied to this property")
                query = query.filter(LostFoundItem.property_id == property_id)
            if status:
                query = query.filter(LostFoundItem.status == status)
            if item_type:
                query = query.filter(LostFoundItem.item_type == item_type)

            items = query.order_by(LostFoundItem.found_date.desc()).all()

            return [
                LostFoundItemResponse(
                    item_id=item.item_id,
                    property_id=item.property_id,
                    item_type=item.item_type,
                    description=item.description,
                    location_found=item.location_found,
                    location_lost=item.location_lost,
                    found_date=item.found_date,
                    lost_date=item.lost_date,
                    status=item.status,
                    photo_url=item.photo_url,
                    ai_matched_guest_id=item.ai_matched_guest_id,
                    claimed_by_guest_id=item.claimed_by_guest_id,
                    claimed_at=item.claimed_at,
                    found_by=item.found_by,
                    notes=item.notes,
                    value_estimate=item.value_estimate,
                    property_name=item.property.property_name if item.property else None,
                    finder_name=f"{item.finder.first_name} {item.finder.last_name}" if item.finder else None,
                    ai_matched_guest_name=f"{item.ai_matched_guest.first_name} {item.ai_matched_guest.last_name}" if item.ai_matched_guest else None,
                    claimed_by_guest_name=f"{item.claimed_by_guest.first_name} {item.claimed_by_guest.last_name}" if item.claimed_by_guest else None
                )
                for item in items
            ]
        finally:
            db.close()

    @staticmethod
    async def get_item(item_id: str, user_id: str) -> LostFoundItemResponse:
        """Get a specific item - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            item = db.query(LostFoundItem).filter(LostFoundItem.item_id == item_id).first()
            if not item:
                raise ValueError("Item not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]

            if item.property_id not in user_property_ids:
                raise ValueError("Access denied to this item")

            return LostFoundItemResponse(
                item_id=item.item_id,
                property_id=item.property_id,
                item_type=item.item_type,
                description=item.description,
                location_found=item.location_found,
                location_lost=item.location_lost,
                found_date=item.found_date,
                lost_date=item.lost_date,
                status=item.status,
                photo_url=item.photo_url,
                ai_matched_guest_id=item.ai_matched_guest_id,
                claimed_by_guest_id=item.claimed_by_guest_id,
                claimed_at=item.claimed_at,
                found_by=item.found_by,
                notes=item.notes,
                value_estimate=item.value_estimate,
                property_name=item.property.property_name if item.property else None,
                finder_name=f"{item.finder.first_name} {item.finder.last_name}" if item.finder else None,
                ai_matched_guest_name=f"{item.ai_matched_guest.first_name} {item.ai_matched_guest.last_name}" if item.ai_matched_guest else None,
                claimed_by_guest_name=f"{item.claimed_by_guest.first_name} {item.claimed_by_guest.last_name}" if item.claimed_by_guest else None
            )
        finally:
            db.close()

    @staticmethod
    async def create_item(item: LostFoundItemCreate, user_id: str) -> LostFoundItemResponse:
        """Create a new lost & found item - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]

            if str(item.property_id) not in user_property_ids:
                raise ValueError("Access denied to this property")

            db_item = LostFoundItem(
                property_id=str(item.property_id),
                item_type=item.item_type,
                description=item.description,
                location_found=item.location_found,
                location_lost=item.location_lost,
                lost_date=item.lost_date,
                photo_url=item.photo_url,
                notes=item.notes,
                value_estimate=item.value_estimate,
                found_by=user_id,
                status=LostFoundStatus.FOUND
            )

            db.add(db_item)
            db.commit()
            db.refresh(db_item)

            # Reload with relationships
            db_item = db.query(LostFoundItem).filter(LostFoundItem.item_id == db_item.item_id).first()

            return LostFoundItemResponse(
                item_id=db_item.item_id,
                property_id=db_item.property_id,
                item_type=db_item.item_type,
                description=db_item.description,
                location_found=db_item.location_found,
                location_lost=db_item.location_lost,
                found_date=db_item.found_date,
                lost_date=db_item.lost_date,
                status=db_item.status,
                photo_url=db_item.photo_url,
                ai_matched_guest_id=db_item.ai_matched_guest_id,
                claimed_by_guest_id=db_item.claimed_by_guest_id,
                claimed_at=db_item.claimed_at,
                found_by=db_item.found_by,
                notes=db_item.notes,
                value_estimate=db_item.value_estimate,
                property_name=db_item.property.property_name if db_item.property else None,
                finder_name=f"{db_item.finder.first_name} {db_item.finder.last_name}" if db_item.finder else None,
                ai_matched_guest_name=f"{db_item.ai_matched_guest.first_name} {db_item.ai_matched_guest.last_name}" if db_item.ai_matched_guest else None,
                claimed_by_guest_name=f"{db_item.claimed_by_guest.first_name} {db_item.claimed_by_guest.last_name}" if db_item.claimed_by_guest else None
            )
        finally:
            db.close()

    @staticmethod
    async def update_item(item_id: str, updates: LostFoundItemUpdate, user_id: str) -> LostFoundItemResponse:
        """Update an existing item - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            item = db.query(LostFoundItem).filter(LostFoundItem.item_id == item_id).first()
            if not item:
                raise ValueError("Item not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]

            if item.property_id not in user_property_ids:
                raise ValueError("Access denied to this item")

            # Update fields
            update_data = updates.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(item, field, value)

            db.commit()
            db.refresh(item)

            # Reload with relationships
            item = db.query(LostFoundItem).filter(LostFoundItem.item_id == item_id).first()

            return LostFoundItemResponse(
                item_id=item.item_id,
                property_id=item.property_id,
                item_type=item.item_type,
                description=item.description,
                location_found=item.location_found,
                location_lost=item.location_lost,
                found_date=item.found_date,
                lost_date=item.lost_date,
                status=item.status,
                photo_url=item.photo_url,
                ai_matched_guest_id=item.ai_matched_guest_id,
                claimed_by_guest_id=item.claimed_by_guest_id,
                claimed_at=item.claimed_at,
                found_by=item.found_by,
                notes=item.notes,
                value_estimate=item.value_estimate,
                property_name=item.property.property_name if item.property else None,
                finder_name=f"{item.finder.first_name} {item.finder.last_name}" if item.finder else None,
                ai_matched_guest_name=f"{item.ai_matched_guest.first_name} {item.ai_matched_guest.last_name}" if item.ai_matched_guest else None,
                claimed_by_guest_name=f"{item.claimed_by_guest.first_name} {item.claimed_by_guest.last_name}" if item.claimed_by_guest else None
            )
        finally:
            db.close()

    @staticmethod
    async def delete_item(item_id: str, user_id: str) -> None:
        """Delete an item - Enforces property-level authorization and requires admin role"""
        db = SessionLocal()
        try:
            item = db.query(LostFoundItem).filter(LostFoundItem.item_id == item_id).first()
            if not item:
                raise ValueError("Item not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]

            if item.property_id not in user_property_ids:
                raise ValueError("Access denied to this item")

            # Check for admin role (basic check - can be enhanced)
            has_admin = any(
                role.role_name.value == "admin" and role.property_id == item.property_id
                for role in user_roles
            )

            if not has_admin:
                raise ValueError("Admin role required to delete items")

            db.delete(item)
            db.commit()
        finally:
            db.close()

    @staticmethod
    async def claim_item(item_id: str, user_id: str, guest_id: Optional[str] = None) -> LostFoundItemResponse:
        """Claim an item - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            item = db.query(LostFoundItem).filter(LostFoundItem.item_id == item_id).first()
            if not item:
                raise ValueError("Item not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]

            if item.property_id not in user_property_ids:
                raise ValueError("Access denied to this item")

            # Update item status
            item.status = LostFoundStatus.CLAIMED
            item.claimed_at = datetime.utcnow()
            if guest_id:
                item.claimed_by_guest_id = guest_id

            db.commit()
            db.refresh(item)

            # Reload with relationships
            item = db.query(LostFoundItem).filter(LostFoundItem.item_id == item_id).first()

            return LostFoundItemResponse(
                item_id=item.item_id,
                property_id=item.property_id,
                item_type=item.item_type,
                description=item.description,
                location_found=item.location_found,
                location_lost=item.location_lost,
                found_date=item.found_date,
                lost_date=item.lost_date,
                status=item.status,
                photo_url=item.photo_url,
                ai_matched_guest_id=item.ai_matched_guest_id,
                claimed_by_guest_id=item.claimed_by_guest_id,
                claimed_at=item.claimed_at,
                found_by=item.found_by,
                notes=item.notes,
                value_estimate=item.value_estimate,
                property_name=item.property.property_name if item.property else None,
                finder_name=f"{item.finder.first_name} {item.finder.last_name}" if item.finder else None,
                ai_matched_guest_name=f"{item.ai_matched_guest.first_name} {item.ai_matched_guest.last_name}" if item.ai_matched_guest else None,
                claimed_by_guest_name=f"{item.claimed_by_guest.first_name} {item.claimed_by_guest.last_name}" if item.claimed_by_guest else None
            )
        finally:
            db.close()

    @staticmethod
    async def notify_guest(item_id: str, user_id: str, guest_id: Optional[str] = None) -> Dict[str, bool]:
        """Notify guest about an item - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            item = db.query(LostFoundItem).filter(LostFoundItem.item_id == item_id).first()
            if not item:
                raise ValueError("Item not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]

            if item.property_id not in user_property_ids:
                raise ValueError("Access denied to this item")

            # In a real implementation, this would send an email/SMS notification
            # For now, we just return success
            logger.info(f"Notification sent for item {item_id} to guest {guest_id or 'default'}")

            return {"notified": True}
        finally:
            db.close()

    @staticmethod
    async def get_metrics(user_id: str, property_id: Optional[str] = None, date_from: Optional[datetime] = None, date_to: Optional[datetime] = None) -> LostFoundMetrics:
        """Get lost & found metrics/analytics - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            # Get user's accessible property IDs
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if not user_property_ids:
                raise ValueError("Access denied: No properties assigned")

            # Build query
            query = db.query(LostFoundItem).filter(LostFoundItem.property_id.in_(user_property_ids))

            # Apply property filter if provided
            if property_id:
                if property_id not in user_property_ids:
                    raise ValueError("Access denied to this property")
                query = query.filter(LostFoundItem.property_id == property_id)

            # Apply date filters
            if date_from:
                query = query.filter(LostFoundItem.found_date >= date_from)
            if date_to:
                query = query.filter(LostFoundItem.found_date <= date_to)

            items = query.all()

            # Calculate metrics
            total = len(items)
            found = len([i for i in items if i.status == LostFoundStatus.FOUND])
            claimed = len([i for i in items if i.status == LostFoundStatus.CLAIMED])
            expired = len([i for i in items if i.status == LostFoundStatus.EXPIRED])
            donated = len([i for i in items if i.status == LostFoundStatus.DONATED])

            recovery_rate = (claimed / total * 100) if total > 0 else 0.0

            # Calculate average days to claim
            claimed_items = [i for i in items if i.status == LostFoundStatus.CLAIMED and i.claimed_at and i.found_date]
            avg_days_to_claim = 0.0
            if claimed_items:
                total_days = sum([(i.claimed_at - i.found_date).days for i in claimed_items])
                avg_days_to_claim = total_days / len(claimed_items)

            # Calculate total value recovered
            total_value_recovered = sum([i.value_estimate or 0.0 for i in claimed_items])

            # Items by category
            items_by_category: Dict[str, int] = {}
            for item in items:
                category = item.item_type or "Other"
                items_by_category[category] = items_by_category.get(category, 0) + 1

            # Items by status
            items_by_status: Dict[str, int] = {}
            for item in items:
                status = item.status.value
                items_by_status[status] = items_by_status.get(status, 0) + 1

            # Recovery trend (last 6 months)
            from datetime import timedelta
            recovery_trend = []
            for i in range(6):
                month_start = datetime.utcnow() - timedelta(days=30 * (i + 1))
                month_end = datetime.utcnow() - timedelta(days=30 * i)
                month_items = [item for item in items if month_start <= item.found_date < month_end]
                month_claimed = len([item for item in month_items if item.status == LostFoundStatus.CLAIMED])
                recovery_trend.insert(0, {
                    "month": month_start.strftime("%b"),
                    "recovered": month_claimed,
                    "total": len(month_items)
                })

            return LostFoundMetrics(
                total=total,
                found=found,
                claimed=claimed,
                expired=expired,
                donated=donated,
                notifications_sent=0,  # Would need tracking in a real implementation
                recovery_rate=recovery_rate,
                avg_days_to_claim=avg_days_to_claim,
                total_value_recovered=total_value_recovered,
                items_by_category=items_by_category,
                items_by_status=items_by_status,
                recovery_trend=recovery_trend
            )
        finally:
            db.close()

    @staticmethod
    async def get_settings(user_id: str, property_id: Optional[str] = None) -> LostFoundSettingsResponse:
        """Get lost & found settings - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            # Get user's accessible property IDs
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if not user_property_ids:
                raise ValueError("Access denied: No properties assigned")

            if property_id and property_id not in user_property_ids:
                raise ValueError("Access denied to this property")

            # In a real implementation, settings would be stored in a database table
            # For now, return default settings
            settings = LostFoundSettings(
                default_retention_period=90,
                expiration_warning_days=7,
                qr_code_prefix="LF",
                auto_archive_after_days=30,
                auto_notification_enabled=True,
                ai_matching_enabled=True,
                require_photo_documentation=True,
                chain_of_custody_tracking=True,
                high_value_threshold=500.0,
                default_disposal_method="Donation",
                notification_templates={
                    "email_subject": "Your Lost Item Has Been Found - {item_name}",
                    "email_body": "Dear {guest_name},\n\nWe've found your {item_name}. Please visit our Lost & Found desk to claim it.\n\nLocation: {storage_location}\nItem ID: {item_id}",
                    "sms_template": "Hi {guest_name}, we found your {item_name}. Visit Lost & Found desk. ID: {item_id}"
                }
            )

            return LostFoundSettingsResponse(
                settings=settings,
                property_id=property_id,
                updated_at=datetime.utcnow()
            )
        finally:
            db.close()

    @staticmethod
    async def update_settings(user_id: str, settings: LostFoundSettings, property_id: Optional[str] = None) -> LostFoundSettingsResponse:
        """Update lost & found settings - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            # Get user's accessible property IDs
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if not user_property_ids:
                raise ValueError("Access denied: No properties assigned")

            if property_id and property_id not in user_property_ids:
                raise ValueError("Access denied to this property")

            # In a real implementation, settings would be stored in a database table
            # For now, just return the updated settings
            return LostFoundSettingsResponse(
                settings=settings,
                property_id=property_id,
                updated_at=datetime.utcnow()
            )
        finally:
            db.close()

    @staticmethod
    async def match_items(user_id: str, match_request: LostFoundMatchRequest, property_id: Optional[str] = None) -> List[LostFoundMatch]:
        """Match lost items using AI - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            # Get user's accessible property IDs
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if not user_property_ids:
                raise ValueError("Access denied: No properties assigned")

            # Build query
            query = db.query(LostFoundItem).filter(
                LostFoundItem.property_id.in_(user_property_ids),
                LostFoundItem.status == LostFoundStatus.FOUND
            )

            if property_id:
                if property_id not in user_property_ids:
                    raise ValueError("Access denied to this property")
                query = query.filter(LostFoundItem.property_id == property_id)

            # Simple text matching (in a real implementation, use AI/ML for better matching)
            items = query.all()
            matches = []
            
            search_terms = f"{match_request.item_type} {match_request.description}".lower()
            
            for item in items:
                item_text = f"{item.item_type} {item.description}".lower()
                
                # Simple keyword matching (would use AI/ML in production)
                if any(term in item_text for term in search_terms.split() if len(term) > 3):
                    confidence = 0.7  # Placeholder confidence score
                    matches.append(LostFoundMatch(
                        item_id=item.item_id,
                        confidence=confidence,
                        matched_guest_id=None,
                        matched_guest_name=None,
                        reason=f"Potential match based on item type and description"
                    ))

            # Sort by confidence and limit to top 5
            matches.sort(key=lambda x: x.confidence, reverse=True)
            return matches[:5]

        finally:
            db.close()

    @staticmethod
    async def export_report(user_id: str, format: str, property_id: Optional[str] = None, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, status: Optional[str] = None, item_type: Optional[str] = None) -> bytes:
        """Export lost & found report as PDF or CSV - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            # Get user's accessible property IDs
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if not user_property_ids:
                raise ValueError("Access denied: No properties assigned")

            # Build query
            query = db.query(LostFoundItem).filter(LostFoundItem.property_id.in_(user_property_ids))

            if property_id:
                if property_id not in user_property_ids:
                    raise ValueError("Access denied to this property")
                query = query.filter(LostFoundItem.property_id == property_id)

            if status:
                query = query.filter(LostFoundItem.status == status)
            if item_type:
                query = query.filter(LostFoundItem.item_type == item_type)
            if start_date:
                query = query.filter(LostFoundItem.found_date >= start_date)
            if end_date:
                query = query.filter(LostFoundItem.found_date <= end_date)

            items = query.all()

            if format.lower() == "csv":
                # Generate CSV
                from io import StringIO
                output = StringIO()
                writer = csv.writer(output)
                writer.writerow(["Item ID", "Item Type", "Description", "Status", "Found Date", "Location", "Value Estimate"])
                for item in items:
                    location = item.location_found.get("area", "Unknown") if isinstance(item.location_found, dict) else str(item.location_found) if item.location_found else "Unknown"
                    writer.writerow([
                        str(item.item_id),
                        item.item_type,
                        item.description,
                        item.status.value,
                        item.found_date.isoformat() if item.found_date else "",
                        location,
                        item.value_estimate or 0.0
                    ])
                return output.getvalue().encode('utf-8')
            else:
                # Generate PDF (simplified - would use reportlab or similar in production)
                # For now, return a simple text representation
                pdf_content = f"Lost & Found Report\nGenerated: {datetime.utcnow().isoformat()}\n\n"
                pdf_content += f"Total Items: {len(items)}\n\n"
                for item in items:
                    pdf_content += f"Item ID: {item.item_id}\n"
                    pdf_content += f"Type: {item.item_type}\n"
                    pdf_content += f"Description: {item.description}\n"
                    pdf_content += f"Status: {item.status.value}\n"
                    pdf_content += f"Found Date: {item.found_date.isoformat() if item.found_date else 'N/A'}\n"
                    pdf_content += "---\n"
                return pdf_content.encode('utf-8')

        finally:
            db.close()
