"""
Package Service
Business logic for Package management
Enforces property-level authorization and RBAC
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Package, User, Property, UserRole, PackageStatus
from schemas import (
    PackageCreate,
    PackageUpdate,
    PackageResponse
)
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class PackageService:
    @staticmethod
    async def get_packages(
        user_id: str,
        property_id: Optional[str] = None,
        status: Optional[str] = None,
        guest_id: Optional[str] = None
    ) -> List[PackageResponse]:
        """Get packages with optional filtering - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            # Get user's accessible property IDs
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if not user_property_ids:
                # User has no properties assigned, return empty list
                return []

            # Filter by user's accessible properties
            query = db.query(Package).filter(Package.property_id.in_(user_property_ids))

            # Additional filters
            if property_id:
                # Verify user has access to requested property
                if property_id not in user_property_ids:
                    raise ValueError("Access denied to this property")
                query = query.filter(Package.property_id == property_id)

            if status:
                try:
                    status_enum = PackageStatus(status)
                    query = query.filter(Package.status == status_enum)
                except ValueError:
                    raise ValueError(f"Invalid status: {status}")

            if guest_id:
                query = query.filter(Package.guest_id == guest_id)

            packages = query.all()

            # Convert to response format
            return [
                PackageResponse(
                    package_id=package.package_id,
                    property_id=package.property_id,
                    guest_id=package.guest_id,
                    tracking_number=package.tracking_number,
                    sender_name=package.sender_name,
                    sender_contact=package.sender_contact,
                    description=package.description,
                    size=package.size,
                    weight=package.weight,
                    status=package.status,
                    received_at=package.received_at,
                    notified_at=package.notified_at,
                    delivered_at=package.delivered_at,
                    delivered_to=package.delivered_to,
                    location=package.location,
                    notes=package.notes,
                    photo_url=package.photo_url,
                    received_by=package.received_by
                )
                for package in packages
            ]
        finally:
            db.close()

    @staticmethod
    async def get_package(package_id: str, user_id: str) -> PackageResponse:
        """Get a single package by ID - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            package = db.query(Package).filter(Package.package_id == package_id).first()
            if not package:
                raise ValueError("Package not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if package.property_id not in user_property_ids:
                raise ValueError("Access denied to this package")

            return PackageResponse(
                package_id=package.package_id,
                property_id=package.property_id,
                guest_id=package.guest_id,
                tracking_number=package.tracking_number,
                sender_name=package.sender_name,
                sender_contact=package.sender_contact,
                description=package.description,
                size=package.size,
                weight=package.weight,
                status=package.status,
                received_at=package.received_at,
                notified_at=package.notified_at,
                delivered_at=package.delivered_at,
                delivered_to=package.delivered_to,
                location=package.location,
                notes=package.notes,
                photo_url=package.photo_url,
                received_by=package.received_by
            )
        finally:
            db.close()

    @staticmethod
    async def create_package(package_data: PackageCreate, user_id: str) -> PackageResponse:
        """Create a new package - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if str(package_data.property_id) not in user_property_ids:
                raise ValueError("Access denied to this property")

            # Create package
            package = Package(
                property_id=str(package_data.property_id),
                guest_id=str(package_data.guest_id) if package_data.guest_id else None,
                tracking_number=package_data.tracking_number,
                sender_name=package_data.sender_name,
                sender_contact=package_data.sender_contact,
                description=package_data.description,
                size=package_data.size,
                weight=package_data.weight,
                location=package_data.location,
                notes=package_data.notes,
                status=PackageStatus.PENDING,
                received_by=user_id
            )

            db.add(package)
            db.commit()
            db.refresh(package)

            return PackageResponse(
                package_id=package.package_id,
                property_id=package.property_id,
                guest_id=package.guest_id,
                tracking_number=package.tracking_number,
                sender_name=package.sender_name,
                sender_contact=package.sender_contact,
                description=package.description,
                size=package.size,
                weight=package.weight,
                status=package.status,
                received_at=package.received_at,
                notified_at=package.notified_at,
                delivered_at=package.delivered_at,
                delivered_to=package.delivered_to,
                location=package.location,
                notes=package.notes,
                photo_url=package.photo_url,
                received_by=package.received_by
            )
        finally:
            db.close()

    @staticmethod
    async def update_package(package_id: str, package_update: PackageUpdate, user_id: str) -> PackageResponse:
        """Update a package - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            package = db.query(Package).filter(Package.package_id == package_id).first()
            if not package:
                raise ValueError("Package not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if package.property_id not in user_property_ids:
                raise ValueError("Access denied to this package")

            # Update fields
            update_data = package_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(package, field, value)

            db.commit()
            db.refresh(package)

            return PackageResponse(
                package_id=package.package_id,
                property_id=package.property_id,
                guest_id=package.guest_id,
                tracking_number=package.tracking_number,
                sender_name=package.sender_name,
                sender_contact=package.sender_contact,
                description=package.description,
                size=package.size,
                weight=package.weight,
                status=package.status,
                received_at=package.received_at,
                notified_at=package.notified_at,
                delivered_at=package.delivered_at,
                delivered_to=package.delivered_to,
                location=package.location,
                notes=package.notes,
                photo_url=package.photo_url,
                received_by=package.received_by
            )
        finally:
            db.close()

    @staticmethod
    async def delete_package(package_id: str, user_id: str) -> Dict[str, str]:
        """Delete a package - Enforces property-level authorization and RBAC (Admin only)"""
        db = SessionLocal()
        try:
            package = db.query(Package).filter(Package.package_id == package_id).first()
            if not package:
                raise ValueError("Package not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if package.property_id not in user_property_ids:
                raise ValueError("Access denied to this package")

            # Check for admin role (basic check - can be enhanced)
            has_admin = any(
                role.role_name.value == "admin" and str(role.property_id) == package.property_id
                for role in user_roles
            )

            if not has_admin:
                raise ValueError("Admin role required to delete packages")

            db.delete(package)
            db.commit()

            return {"message": "Package deleted successfully"}
        finally:
            db.close()

    @staticmethod
    async def notify_guest(package_id: str, user_id: str, guest_id: Optional[str] = None) -> Dict[str, bool]:
        """Notify guest about a package - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            package = db.query(Package).filter(Package.package_id == package_id).first()
            if not package:
                raise ValueError("Package not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if package.property_id not in user_property_ids:
                raise ValueError("Access denied to this package")

            # Update status to NOTIFIED
            package.status = PackageStatus.NOTIFIED
            package.notified_at = datetime.utcnow()
            if guest_id:
                package.guest_id = guest_id

            db.commit()

            # In a real implementation, this would send an email/SMS notification
            # For now, we just return success
            logger.info(f"Notification sent for package {package_id} to guest {guest_id or 'default'}")

            return {"notified": True}
        finally:
            db.close()

    @staticmethod
    async def deliver_package(package_id: str, user_id: str, delivered_to: Optional[str] = None) -> PackageResponse:
        """Deliver a package - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            package = db.query(Package).filter(Package.package_id == package_id).first()
            if not package:
                raise ValueError("Package not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if package.property_id not in user_property_ids:
                raise ValueError("Access denied to this package")

            # Update status to DELIVERED
            package.status = PackageStatus.DELIVERED
            package.delivered_at = datetime.utcnow()
            if delivered_to:
                package.delivered_to = delivered_to

            db.commit()
            db.refresh(package)

            return PackageResponse(
                package_id=package.package_id,
                property_id=package.property_id,
                guest_id=package.guest_id,
                tracking_number=package.tracking_number,
                sender_name=package.sender_name,
                sender_contact=package.sender_contact,
                description=package.description,
                size=package.size,
                weight=package.weight,
                status=package.status,
                received_at=package.received_at,
                notified_at=package.notified_at,
                delivered_at=package.delivered_at,
                delivered_to=package.delivered_to,
                location=package.location,
                notes=package.notes,
                photo_url=package.photo_url,
                received_by=package.received_by
            )
        finally:
            db.close()

    @staticmethod
    async def pickup_package(package_id: str, user_id: str) -> PackageResponse:
        """Mark package as picked up - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            package = db.query(Package).filter(Package.package_id == package_id).first()
            if not package:
                raise ValueError("Package not found")

            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [str(role.property_id) for role in user_roles]

            if package.property_id not in user_property_ids:
                raise ValueError("Access denied to this package")

            # Update status - Note: PackageStatus doesn't have PICKED_UP, using DELIVERED or EXPIRED
            # For now, we'll mark as DELIVERED when picked up (can be enhanced with PICKED_UP status)
            package.status = PackageStatus.DELIVERED
            # Note: If you want to track pickup separately, add PICKED_UP to PackageStatus enum

            db.commit()
            db.refresh(package)

            return PackageResponse(
                package_id=package.package_id,
                property_id=package.property_id,
                guest_id=package.guest_id,
                tracking_number=package.tracking_number,
                sender_name=package.sender_name,
                sender_contact=package.sender_contact,
                description=package.description,
                size=package.size,
                weight=package.weight,
                status=package.status,
                received_at=package.received_at,
                notified_at=package.notified_at,
                delivered_at=package.delivered_at,
                delivered_to=package.delivered_to,
                location=package.location,
                notes=package.notes,
                photo_url=package.photo_url,
                received_by=package.received_by
            )
        finally:
            db.close()
