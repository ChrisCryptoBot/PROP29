"""
Smart Parking Service for PROPER 2.9
Handles parking space management, guest registration, and telemetry ingestion.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from database import SessionLocal
from models import ParkingSpace, ParkingOccupancyEvent, GuestParking, ParkingBillingRecord, ParkingStatus, ParkingSettings
from schemas import (
    ParkingSpaceCreate, ParkingSpaceUpdate, GuestParkingCreate, 
    LPRIngestion, SensorTelemetry, ParkingSettingsUpdate
)
from fastapi import HTTPException, status
import logging
import uuid
import math

logger = logging.getLogger(__name__)

class ParkingService:
    """Service for managing parking operations"""
    
    @staticmethod
    async def get_parking_spaces(property_id: str) -> List[ParkingSpace]:
        """Retrieve all parking spaces for a property"""
        db = SessionLocal()
        try:
            return db.query(ParkingSpace).filter(ParkingSpace.property_id == property_id).all()
        finally:
            db.close()

    @staticmethod
    async def get_active_registrations(property_id: str) -> List[GuestParking]:
        """Retrieve all active guest registrations for a property"""
        return await ParkingService.get_registrations(property_id, status="active")

    @staticmethod
    async def get_registrations(property_id: str, status: Optional[str] = None) -> List[GuestParking]:
        """Retrieve guest registrations with optional status filter"""
        db = SessionLocal()
        try:
            settings = db.query(ParkingSettings).filter(ParkingSettings.property_id == property_id).first()
            max_stay_hours = settings.max_stay_hours if settings else 24
            overdue_cutoff = datetime.utcnow() - timedelta(hours=max_stay_hours)

            overdue_candidates = db.query(GuestParking).filter(
                GuestParking.property_id == property_id,
                GuestParking.status == "active",
                GuestParking.checkin_at <= overdue_cutoff
            ).all()

            if overdue_candidates:
                for registration in overdue_candidates:
                    registration.status = "overdue"
                db.commit()

            query = db.query(GuestParking).filter(GuestParking.property_id == property_id)
            if status and status != "all":
                query = query.filter(GuestParking.status == status)

            return query.all()
        finally:
            db.close()

    @staticmethod
    async def register_guest_parking(parking_data: GuestParkingCreate) -> Dict[str, Any]:
        """Register a new guest vehicle and optionally assign a space"""
        db = SessionLocal()
        try:
            # 1. Handle space assignment
            assigned_space_id = parking_data.space_id
            space = None
            
            if not assigned_space_id:
                # Auto-assign logic: Find first available space of requested type/zone
                query = db.query(ParkingSpace).filter(ParkingSpace.status == ParkingStatus.AVAILABLE)
                if parking_data.vehicle_info and parking_data.vehicle_info.get("type"):
                    query = query.filter(ParkingSpace.type == parking_data.vehicle_info.get("type"))
                
                space = query.first()
                if space:
                    assigned_space_id = space.space_id
                    logger.info(f"Auto-assigned space {space.label} to {parking_data.plate}")
            else:
                space = db.query(ParkingSpace).filter(ParkingSpace.space_id == assigned_space_id).first()
                if not space:
                    raise HTTPException(status_code=404, detail="Parking space not found")
                if space.status != ParkingStatus.AVAILABLE:
                    raise HTTPException(status_code=400, detail="Space is already occupied or reserved")
            
            db_registration = GuestParking(
                property_id=parking_data.property_id,
                guest_id=parking_data.guest_id,
                guest_name=parking_data.guest_name,
                plate=parking_data.plate,
                vehicle_info=parking_data.vehicle_info,
                space_id=assigned_space_id,
                status="active"
            )
            db.add(db_registration)
            db.flush() # Get registration_id
            
            # Update space status if assigned
            if space:
                space.status = ParkingStatus.OCCUPIED
                space.current_guest_id = db_registration.registration_id
            
            db.commit()
            db.refresh(db_registration)
            
            return {
                "registration_id": str(db_registration.registration_id),
                "space_label": space.label if space else None,
                "status": db_registration.status,
                "message": "Guest parking registered successfully"
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error registering guest parking: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to register guest parking")
        finally:
            db.close()

    @staticmethod
    async def ingest_lpr_event(property_id: str, lpr_data: LPRIngestion) -> Dict[str, Any]:
        """Ingest License Plate Recognition event with idempotency"""
        db = SessionLocal()
        try:
            # Idempotency Check: Don't process the same plate/camera within 2 minutes
            grace_period = datetime.utcnow() - timedelta(minutes=2)
            # Since we don't have a dedicated LPR event table yet (Phase 1/2), 
            # we check the GuestParking last seen/updated or just log and process.
            # In Phase 3, we ensure we don't trigger redundant logic.
            
            active_parking = db.query(GuestParking).filter(
                GuestParking.property_id == property_id,
                GuestParking.plate == lpr_data.plate,
                GuestParking.status == "active"
            ).first()
            
            if active_parking:
                # If recently updated (last seen within 2 mins), skip intensive logic
                # (last_seen is on ParkingSpace, let's check that if linked)
                if active_parking.space:
                    if active_parking.space.last_seen and active_parking.space.last_seen >= grace_period:
                        logger.info(f"LPR Idempotency: Skipping redundant event for {lpr_data.plate}")
                        return {"status": "skipped_idempotent", "plate": lpr_data.plate}
                
                logger.info(f"LPR Match: Plate {lpr_data.plate} matched registration {active_parking.registration_id}")
                return {
                    "matched": True,
                    "registration_id": str(active_parking.registration_id),
                    "guest_name": active_parking.guest_name
                }
            
            # TODO: Fuzzy matching logic here in later phases
            return {"matched": False, "plate": lpr_data.plate}
        finally:
            db.close()

    @staticmethod
    async def ingest_sensor_telemetry(property_id: str, sensor_data: SensorTelemetry) -> Dict[str, Any]:
        """Ingest occupancy sensor telemetry with state-based idempotency"""
        db = SessionLocal()
        try:
            space = db.query(ParkingSpace).filter(ParkingSpace.space_id == sensor_data.spaceId).first()
            if not space:
                raise HTTPException(status_code=404, detail=f"Space {sensor_data.spaceId} not found")

            # State-based Idempotency: Only record if status is actually changing
            # OR if it's been more than 15 minutes since last heartbeat
            current_occupied = (space.status == ParkingStatus.OCCUPIED)
            last_seen = space.last_seen or (datetime.utcnow() - timedelta(hours=1))
            
            if current_occupied == sensor_data.occupied and (datetime.utcnow() - last_seen) < timedelta(minutes=15):
                # No change and not a heartbeat interval, skip DB write
                return {"status": "unchanged", "current_status": space.status}

            # Record the event for history
            event = ParkingOccupancyEvent(
                space_id=sensor_data.spaceId,
                timestamp=sensor_data.timestamp,
                source=f"sensor:{sensor_data.sensorId}",
                value=sensor_data.occupied
            )
            db.add(event)
            
            # Update the space status
            new_status = ParkingStatus.OCCUPIED if sensor_data.occupied else ParkingStatus.AVAILABLE
            space.status = new_status
            space.last_seen = sensor_data.timestamp
            
            db.commit()
            logger.info(f"Sensor Update: Space {space.label} is now {new_status}")
            return {"status": "success", "new_status": new_status}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error ingesting sensor data: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to ingest sensor data")
        finally:
            db.close()

    @staticmethod
    async def get_parking_health(property_id: str) -> Dict[str, Any]:
        """Check health of parking components"""
        db = SessionLocal()
        try:
            total_spaces = db.query(ParkingSpace).filter(ParkingSpace.property_id == property_id).count()
            active_guests = db.query(GuestParking).filter(
                GuestParking.property_id == property_id,
                GuestParking.status.in_(["active", "overdue"])
            ).count()
            
            # Check for "offline" sensors (no data for > 30 mins)
            cutoff = datetime.utcnow() - timedelta(minutes=30)
            offline_spaces = db.query(ParkingSpace).filter(
                ParkingSpace.property_id == property_id,
                ParkingSpace.last_seen < cutoff
            ).count()

            return {
                "status": "healthy" if offline_spaces == 0 else "degraded",
                "components": {
                    "database": "connected",
                    "sensors": f"{total_spaces - offline_spaces}/{total_spaces} online"
                },
                "metrics": {
                    "total_spaces": total_spaces,
                    "occupancy_rate": f"{(active_guests/total_spaces)*100:.1f}%" if total_spaces > 0 else "0%",
                    "offline_sensors": offline_spaces
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        finally:
            db.close()

    @staticmethod
    async def create_parking_space(space_data: ParkingSpaceCreate) -> ParkingSpace:
        """Create a new parking space"""
        db = SessionLocal()
        try:
            db_space = ParkingSpace(
                property_id=space_data.property_id,
                label=space_data.label,
                zone=space_data.zone,
                type=space_data.type,
                status=ParkingStatus.AVAILABLE
            )
            db.add(db_space)
            db.commit()
            db.refresh(db_space)
            return db_space
        finally:
            db.close()

    @staticmethod
    async def update_parking_space(space_id: str, space_data: ParkingSpaceUpdate) -> ParkingSpace:
        """Update an existing parking space"""
        db = SessionLocal()
        try:
            db_space = db.query(ParkingSpace).filter(ParkingSpace.space_id == space_id).first()
            if not db_space:
                raise HTTPException(status_code=404, detail="Parking space not found")
            
            update_data = space_data.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_space, key, value)
            
            db.commit()
            db.refresh(db_space)
            return db_space
        finally:
            db.close()

    @staticmethod
    async def get_parking_settings(property_id: str) -> ParkingSettings:
        """Retrieve parking settings for a property"""
        db = SessionLocal()
        try:
            settings = db.query(ParkingSettings).filter(ParkingSettings.property_id == property_id).first()
            if not settings:
                # Create default settings if they don't exist
                settings = ParkingSettings(property_id=property_id)
                db.add(settings)
                db.commit()
                db.refresh(settings)
            return settings
        finally:
            db.close()

    @staticmethod
    async def update_parking_settings(property_id: str, settings_data: ParkingSettingsUpdate) -> ParkingSettings:
        """Update parking settings for a property"""
        db = SessionLocal()
        try:
            settings = db.query(ParkingSettings).filter(ParkingSettings.property_id == property_id).first()
            if not settings:
                settings = ParkingSettings(property_id=property_id)
                db.add(settings)
            
            update_data = settings_data.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(settings, key, value)
            
            db.commit()
            db.refresh(settings)
            return settings
        finally:
            db.close()

    @staticmethod
    async def checkout_guest_parking(registration_id: str) -> Dict[str, Any]:
        """Checkout guest vehicle and calculate charges"""
        db = SessionLocal()
        try:
            registration = db.query(GuestParking).filter(GuestParking.registration_id == registration_id).first()
            if not registration:
                raise HTTPException(status_code=404, detail="Registration not found")
            
            if registration.status == "completed":
                raise HTTPException(status_code=400, detail="Already checked out")

            # Fetch settings for fee calculation
            settings = db.query(ParkingSettings).filter(ParkingSettings.property_id == registration.property_id).first()
            if not settings:
                settings = ParkingSettings(property_id=registration.property_id)
            
            # Update registration
            registration.status = "completed"
            registration.checkout_at = datetime.utcnow()
            registration.valet_status = "idle"
            
            # Calculate fees
            fees = ParkingService._calculate_fees(registration.checkin_at, registration.checkout_at, settings)
            
            # Create billing record
            billing = ParkingBillingRecord(
                registration_id=registration.registration_id,
                amount_cents=fees["total_cents"],
                status="pending"
            )
            db.add(billing)
            
            # Free up the space
            if registration.space_id:
                space = db.query(ParkingSpace).filter(ParkingSpace.space_id == registration.space_id).first()
                if space:
                    space.status = ParkingStatus.AVAILABLE
                    space.current_guest_id = None
            
            db.commit()
            return {
                "registration": registration,
                "billing": billing,
                "fees": fees
            }
        finally:
            db.close()

    @staticmethod
    def _calculate_fees(checkin_at: datetime, checkout_at: datetime, settings: ParkingSettings) -> Dict[str, Any]:
        """Business logic for fee calculation"""
        duration = checkout_at - checkin_at
        total_seconds = int(duration.total_seconds())
        total_minutes = total_seconds // 60
        
        # 30-minute grace period
        if total_minutes <= settings.grace_period_minutes:
            return {"total_cents": 0, "duration_minutes": total_minutes, "reason": "grace_period"}
            
        hours = math.ceil(total_minutes / 60)
        daily_rate = settings.guest_daily_rate
        hourly_rate = settings.guest_hourly_rate
        
        total_cents = hours * hourly_rate
        
        # Cap at daily rate
        if total_cents > daily_rate:
            total_cents = daily_rate
            
        return {
            "total_cents": total_cents,
            "duration_minutes": total_minutes,
            "hours_charged": hours,
            "rate_applied": hourly_rate
        }

    @staticmethod
    async def update_valet_status(registration_id: str, new_valet_status: str) -> Dict[str, Any]:
        """Update the valet state for a parking registration"""
        valid_statuses = ["idle", "requested", "retrieving", "ready", "delivered"]
        if new_valet_status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid valet status")
            
        db = SessionLocal()
        try:
            parking = db.query(GuestParking).filter(GuestParking.registration_id == registration_id).first()
            if not parking:
                raise HTTPException(status_code=404, detail="Parking registration not found")
            
            parking.valet_status = new_valet_status
            db.commit()
            
            return {
                "registration_id": registration_id,
                "valet_status": new_valet_status,
                "message": f"Valet status updated to {new_valet_status}"
            }
        finally:
            db.close()
