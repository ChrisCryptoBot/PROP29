"""
Access Control Service for PROPER 2.9
Handles biometric authentication, digital key management, and access logs
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from database import SessionLocal
from models import (
    AccessControlEvent,
    AccessControlEmergencyState,
    AccessControlUser,
    AccessControlAuditLog,
    AccessPoint,
    User,
    UserRole,
    Guest,
    Property
)
from schemas import AccessControlEventCreate, AccessControlEventResponse, DigitalKeyCreate, DigitalKeyResponse, AccessControlAuditCreate, AccessControlAuditResponse
from fastapi import HTTPException, status
import logging
import hashlib
import secrets
import json

logger = logging.getLogger(__name__)

class AccessControlService:
    """Service for managing access control operations"""
    
    @staticmethod
    async def create_access_event(event: AccessControlEventCreate, user_id: str) -> AccessControlEventResponse:
        """Create a new access control event"""
        db = SessionLocal()
        try:
            # Validate access permissions
            if not await AccessControlService._validate_access_permission(
                event.access_point, event.user_id, event.guest_id, db
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied - insufficient permissions"
                )
            
            # Create access event
            db_event = AccessControlEvent(
                property_id=event.property_id,
                user_id=event.user_id,
                guest_id=event.guest_id,
                access_point=event.access_point,
                access_method=event.access_method,
                event_type=event.event_type,
                location=event.location,
                device_info=event.device_info,
                is_authorized=event.is_authorized,
                alert_triggered=event.alert_triggered,
                photo_capture=event.photo_capture,
                source=getattr(event, 'source', 'manager') or 'manager',
                source_agent_id=str(getattr(event, 'source_agent_id', None)) if getattr(event, 'source_agent_id', None) else None,
                source_device_id=getattr(event, 'source_device_id', None),
                source_metadata=getattr(event, 'source_metadata', None) or {},
                idempotency_key=getattr(event, 'idempotency_key', None),
                review_status=getattr(event, 'review_status', 'approved') or 'approved'
            )
            
            db.add(db_event)
            db.commit()
            db.refresh(db_event)
            
            # Trigger alerts if unauthorized access
            if not event.is_authorized:
                await AccessControlService._trigger_unauthorized_alert(db_event)
            
            return AccessControlEventResponse(
                event_id=db_event.event_id,
                property_id=db_event.property_id,
                user_id=db_event.user_id,
                guest_id=db_event.guest_id,
                access_point=db_event.access_point,
                access_method=db_event.access_method,
                event_type=db_event.event_type,
                timestamp=db_event.timestamp,
                location=db_event.location,
                device_info=db_event.device_info,
                is_authorized=db_event.is_authorized,
                alert_triggered=db_event.alert_triggered,
                photo_capture=db_event.photo_capture,
                source=db_event.source,
                source_agent_id=db_event.source_agent_id,
                source_device_id=db_event.source_device_id,
                source_metadata=db_event.source_metadata or {},
                idempotency_key=db_event.idempotency_key,
                review_status=db_event.review_status,
                rejection_reason=db_event.rejection_reason,
                reviewed_by=db_event.reviewed_by,
                reviewed_at=db_event.reviewed_at
            )
            
        except Exception as e:
            logger.error(f"Error creating access event: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create access event"
            )
        finally:
            db.close()
    
    @staticmethod
    async def get_access_events(
        property_id: str,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        access_point: Optional[str] = None,
        event_type: Optional[str] = None
    ) -> List[AccessControlEventResponse]:
        """Get access control events with filtering"""
        db = SessionLocal()
        try:
            query = db.query(AccessControlEvent).filter(
                AccessControlEvent.property_id == property_id
            )
            
            if start_date:
                query = query.filter(AccessControlEvent.timestamp >= start_date)
            if end_date:
                query = query.filter(AccessControlEvent.timestamp <= end_date)
            if access_point:
                query = query.filter(AccessControlEvent.access_point == access_point)
            if event_type:
                query = query.filter(AccessControlEvent.event_type == event_type)
            
            events = query.order_by(AccessControlEvent.timestamp.desc()).all()
            
            return [
                AccessControlEventResponse(
                    event_id=event.event_id,
                    property_id=event.property_id,
                    user_id=event.user_id,
                    guest_id=event.guest_id,
                    access_point=event.access_point,
                    access_method=event.access_method,
                    event_type=event.event_type,
                    timestamp=event.timestamp,
                    location=event.location,
                    device_info=event.device_info,
                    is_authorized=event.is_authorized,
                    alert_triggered=event.alert_triggered,
                    photo_capture=event.photo_capture
                )
                for event in events
            ]
            
        except Exception as e:
            logger.error(f"Error getting access events: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve access events"
            )
        finally:
            db.close()
    
    @staticmethod
    async def create_digital_key(key_data: DigitalKeyCreate, user_id: str) -> DigitalKeyResponse:
        """Create a digital key for access"""
        db = SessionLocal()
        try:
            # Generate secure key
            key_token = secrets.token_urlsafe(32)
            key_hash = hashlib.sha256(key_token.encode()).hexdigest()
            
            # Set expiration
            expires_at = datetime.utcnow() + timedelta(hours=key_data.validity_hours)
            
            # Store key data (in production, use Redis for better performance)
            key_info = {
                "key_hash": key_hash,
                "user_id": key_data.user_id,
                "guest_id": key_data.guest_id,
                "property_id": key_data.property_id,
                "access_points": key_data.access_points,
                "created_at": datetime.utcnow().isoformat(),
                "expires_at": expires_at.isoformat(),
                "created_by": user_id
            }
            
            # In a real implementation, store in Redis or database
            # For now, we'll return the key info
            return DigitalKeyResponse(
                key_id=secrets.token_urlsafe(16),
                key_token=key_token,
                user_id=key_data.user_id,
                guest_id=key_data.guest_id,
                property_id=key_data.property_id,
                access_points=key_data.access_points,
                created_at=datetime.utcnow(),
                expires_at=expires_at,
                is_active=True
            )
            
        except Exception as e:
            logger.error(f"Error creating digital key: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create digital key"
            )
        finally:
            db.close()
    
    @staticmethod
    async def validate_digital_key(key_token: str, access_point: str) -> Dict[str, Any]:
        """Validate a digital key for access"""
        try:
            # In production, validate against stored keys in Redis/database
            # For now, return a mock validation
            key_hash = hashlib.sha256(key_token.encode()).hexdigest()
            
            # Mock validation logic
            is_valid = len(key_token) == 43  # Basic validation
            has_access = True  # Mock access check
            
            return {
                "is_valid": is_valid,
                "has_access": has_access,
                "access_point": access_point,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error validating digital key: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to validate digital key"
            )

    @staticmethod
    async def create_audit_entry(payload: AccessControlAuditCreate, property_id: Optional[str], user_id: Optional[str]) -> AccessControlAuditResponse:
        db = SessionLocal()
        try:
            actor = payload.actor or (f"user:{user_id}" if user_id else "System")
            db_entry = AccessControlAuditLog(
                property_id=property_id or payload.property_id,
                actor=actor,
                action=payload.action,
                status=payload.status,
                target=payload.target,
                reason=payload.reason,
                source=payload.source,
            )
            db.add(db_entry)
            db.commit()
            db.refresh(db_entry)
            return AccessControlAuditResponse(
                audit_id=db_entry.audit_id,
                timestamp=db_entry.timestamp,
                actor=db_entry.actor,
                action=db_entry.action,
                status=db_entry.status,
                target=db_entry.target,
                reason=db_entry.reason
            )
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating audit entry: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create audit entry"
            )
        finally:
            db.close()

    @staticmethod
    async def get_audit_entries(property_id: Optional[str], limit: int = 50, offset: int = 0) -> List[AccessControlAuditResponse]:
        db = SessionLocal()
        try:
            query = db.query(AccessControlAuditLog)
            if property_id:
                query = query.filter(AccessControlAuditLog.property_id == property_id)
            entries = query.order_by(AccessControlAuditLog.timestamp.desc()).offset(offset).limit(limit).all()
            return [
                AccessControlAuditResponse(
                    audit_id=entry.audit_id,
                    timestamp=entry.timestamp,
                    actor=entry.actor,
                    action=entry.action,
                    status=entry.status,
                    target=entry.target,
                    reason=entry.reason
                )
                for entry in entries
            ]
        except Exception as e:
            logger.error(f"Error fetching audit entries: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch audit entries"
            )
        finally:
            db.close()
    
    @staticmethod
    async def revoke_digital_key(key_id: str, user_id: str) -> Dict[str, str]:
        """Revoke a digital key"""
        try:
            # In production, mark key as revoked in database/Redis
            logger.info(f"Digital key {key_id} revoked by user {user_id}")
            
            return {"message": "Digital key revoked successfully", "key_id": key_id}
            
        except Exception as e:
            logger.error(f"Error revoking digital key: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to revoke digital key"
            )
    
    @staticmethod
    async def get_access_analytics(property_id: str, timeframe: str = "24h") -> Dict[str, Any]:
        """Get access control analytics"""
        db = SessionLocal()
        try:
            # Calculate time range
            end_time = datetime.utcnow()
            if timeframe == "24h":
                start_time = end_time - timedelta(hours=24)
            elif timeframe == "7d":
                start_time = end_time - timedelta(days=7)
            elif timeframe == "30d":
                start_time = end_time - timedelta(days=30)
            else:
                start_time = end_time - timedelta(hours=24)
            
            # Get access events
            events = db.query(AccessControlEvent).filter(
                AccessControlEvent.property_id == property_id,
                AccessControlEvent.timestamp >= start_time,
                AccessControlEvent.timestamp <= end_time
            ).all()
            
            # Calculate analytics
            total_events = len(events)
            authorized_events = len([e for e in events if e.is_authorized])
            unauthorized_events = total_events - authorized_events
            alert_events = len([e for e in events if e.alert_triggered])
            
            # Access method breakdown
            access_methods = {}
            for event in events:
                method = event.access_method
                access_methods[method] = access_methods.get(method, 0) + 1
            
            # Access point breakdown
            access_points = {}
            for event in events:
                point = event.access_point
                access_points[point] = access_points.get(point, 0) + 1
            
            return {
                "timeframe": timeframe,
                "total_events": total_events,
                "authorized_events": authorized_events,
                "unauthorized_events": unauthorized_events,
                "alert_events": alert_events,
                "authorization_rate": (authorized_events / total_events * 100) if total_events > 0 else 0,
                "access_methods": access_methods,
                "access_points": access_points,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting access analytics: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve access analytics"
            )
        finally:
            db.close()

    @staticmethod
    def _get_default_property_id(db: SessionLocal, user_id: Optional[str]) -> str:
        if user_id:
            role = db.query(UserRole).filter(UserRole.user_id == user_id).first()
            if role and role.property_id:
                return role.property_id
        default_property = db.query(Property).first()
        return default_property.property_id if default_property else "default-prop"

    @staticmethod
    def _map_access_point(point: AccessPoint) -> Dict[str, Any]:
        metadata = point.details or {}
        return {
            "id": point.access_point_id,
            "name": point.name,
            "location": point.location,
            "type": point.type,
            "status": point.status,
            "accessMethod": point.access_method,
            "lastAccess": point.last_access.isoformat() if point.last_access else None,
            "accessCount": point.access_count,
            "permissions": point.permissions or [],
            "securityLevel": point.security_level,
            "isOnline": point.is_online,
            "sensorStatus": point.sensor_status,
            "powerSource": point.power_source,
            "batteryLevel": point.battery_level,
            "lastStatusChange": point.last_status_change.isoformat() if point.last_status_change else None,
            "groupId": metadata.get("group_id"),
            "zoneId": metadata.get("zone_id"),
            "cachedEvents": point.cached_events or [],
            "permanentAccess": metadata.get("permanent_access"),
            "hardwareVendor": metadata.get("hardware_vendor"),
            "ipAddress": metadata.get("ip_address")
        }

    @staticmethod
    def _map_access_user(user: AccessControlUser) -> Dict[str, Any]:
        return {
            "id": user.access_user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "department": user.department,
            "status": user.status,
            "accessLevel": user.access_level,
            "lastAccess": user.last_access.isoformat() if user.last_access else None,
            "accessCount": user.access_count,
            "avatar": user.avatar,
            "permissions": user.permissions or [],
            "phone": user.phone,
            "employeeId": user.employee_id,
            "accessSchedule": user.access_schedule,
            "temporaryAccesses": user.temporary_accesses or [],
            "autoRevokeAtCheckout": user.auto_revoke_at_checkout
        }

    @staticmethod
    async def get_access_points(property_id: Optional[str], user_id: Optional[str]) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            resolved_property_id = property_id or AccessControlService._get_default_property_id(db, user_id)
            points = db.query(AccessPoint).filter(AccessPoint.property_id == resolved_property_id).all()
            return [AccessControlService._map_access_point(point) for point in points]
        finally:
            db.close()

    @staticmethod
    async def create_access_point(
        payload: Dict[str, Any],
        property_id: Optional[str],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            resolved_property_id = property_id or AccessControlService._get_default_property_id(db, user_id)
            metadata = {
                "group_id": payload.get("groupId"),
                "zone_id": payload.get("zoneId"),
                "permanent_access": payload.get("permanentAccess"),
                "hardware_vendor": payload.get("hardwareVendor"),
                "ip_address": payload.get("ipAddress")
            }
            point = AccessPoint(
                property_id=resolved_property_id,
                name=payload["name"],
                location=payload["location"],
                type=payload["type"],
                status=payload.get("status", "active"),
                access_method=payload.get("accessMethod", "card"),
                access_count=payload.get("accessCount", 0),
                permissions=payload.get("permissions", []),
                security_level=payload.get("securityLevel", "medium"),
                is_online=payload.get("isOnline", True),
                sensor_status=payload.get("sensorStatus"),
                power_source=payload.get("powerSource"),
                battery_level=payload.get("batteryLevel"),
                cached_events=payload.get("cachedEvents", []),
                details=metadata
            )
            db.add(point)
            db.commit()
            db.refresh(point)
            return AccessControlService._map_access_point(point)
        finally:
            db.close()

    @staticmethod
    async def update_access_point(point_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            point = db.query(AccessPoint).filter(AccessPoint.access_point_id == point_id).first()
            if not point:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access point not found")
            status_updated = "status" in payload and payload.get("status") is not None
            for field, attr in [
                ("name", "name"),
                ("location", "location"),
                ("type", "type"),
                ("status", "status"),
                ("accessMethod", "access_method"),
                ("accessCount", "access_count"),
                ("permissions", "permissions"),
                ("securityLevel", "security_level"),
                ("isOnline", "is_online"),
                ("sensorStatus", "sensor_status"),
                ("powerSource", "power_source"),
                ("batteryLevel", "battery_level")
            ]:
                if field in payload and payload[field] is not None:
                    setattr(point, attr, payload[field])
            if status_updated:
                point.last_status_change = datetime.utcnow()
            metadata = point.details or {}
            for meta_field, key in [
                ("groupId", "group_id"),
                ("zoneId", "zone_id"),
                ("permanentAccess", "permanent_access"),
                ("hardwareVendor", "hardware_vendor"),
                ("ipAddress", "ip_address")
            ]:
                if meta_field in payload and payload[meta_field] is not None:
                    metadata[key] = payload[meta_field]
            if "cachedEvents" in payload and payload["cachedEvents"] is not None:
                point.cached_events = payload["cachedEvents"]
            point.details = metadata
            if "lastAccess" in payload and payload["lastAccess"]:
                point.last_access = datetime.fromisoformat(payload["lastAccess"])
            if "lastStatusChange" in payload and payload["lastStatusChange"]:
                point.last_status_change = datetime.fromisoformat(payload["lastStatusChange"])
            db.commit()
            db.refresh(point)
            return AccessControlService._map_access_point(point)
        finally:
            db.close()

    @staticmethod
    async def delete_access_point(point_id: str) -> None:
        db = SessionLocal()
        try:
            point = db.query(AccessPoint).filter(AccessPoint.access_point_id == point_id).first()
            if not point:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access point not found")
            db.delete(point)
            db.commit()
        finally:
            db.close()

    @staticmethod
    async def get_access_users(property_id: Optional[str], user_id: Optional[str]) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            resolved_property_id = property_id or AccessControlService._get_default_property_id(db, user_id)
            users = db.query(AccessControlUser).filter(AccessControlUser.property_id == resolved_property_id).all()
            return [AccessControlService._map_access_user(user) for user in users]
        finally:
            db.close()

    @staticmethod
    async def create_access_user(
        payload: Dict[str, Any],
        property_id: Optional[str],
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            resolved_property_id = property_id or AccessControlService._get_default_property_id(db, user_id)
            user = AccessControlUser(
                property_id=resolved_property_id,
                name=payload["name"],
                email=payload["email"],
                role=payload.get("role", "employee"),
                department=payload.get("department", "Operations"),
                status=payload.get("status", "active"),
                access_level=payload.get("accessLevel", "standard"),
                access_count=payload.get("accessCount", 0),
                avatar=payload.get("avatar", ""),
                permissions=payload.get("permissions", []),
                phone=payload.get("phone"),
                employee_id=payload.get("employeeId"),
                access_schedule=payload.get("accessSchedule"),
                temporary_accesses=payload.get("temporaryAccesses", []),
                auto_revoke_at_checkout=payload.get("autoRevokeAtCheckout", False)
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            return AccessControlService._map_access_user(user)
        finally:
            db.close()

    @staticmethod
    async def update_access_user(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            user = db.query(AccessControlUser).filter(AccessControlUser.access_user_id == user_id).first()
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access user not found")
            for field, attr in [
                ("name", "name"),
                ("email", "email"),
                ("role", "role"),
                ("department", "department"),
                ("status", "status"),
                ("accessLevel", "access_level"),
                ("accessCount", "access_count"),
                ("avatar", "avatar"),
                ("permissions", "permissions"),
                ("phone", "phone"),
                ("employeeId", "employee_id"),
                ("accessSchedule", "access_schedule"),
                ("temporaryAccesses", "temporary_accesses"),
                ("autoRevokeAtCheckout", "auto_revoke_at_checkout")
            ]:
                if field in payload and payload[field] is not None:
                    setattr(user, attr, payload[field])
            if "lastAccess" in payload and payload["lastAccess"]:
                user.last_access = datetime.fromisoformat(payload["lastAccess"])
            db.commit()
            db.refresh(user)
            return AccessControlService._map_access_user(user)
        finally:
            db.close()

    @staticmethod
    async def delete_access_user(user_id: str) -> None:
        db = SessionLocal()
        try:
            user = db.query(AccessControlUser).filter(AccessControlUser.access_user_id == user_id).first()
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access user not found")
            db.delete(user)
            db.commit()
        finally:
            db.close()

    @staticmethod
    async def get_access_events_summary(
        property_id: Optional[str],
        user_id: Optional[str],
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            resolved_property_id = property_id or AccessControlService._get_default_property_id(db, user_id)
            query = db.query(AccessControlEvent).filter(
                AccessControlEvent.property_id == resolved_property_id
            )
            if filters:
                action = filters.get("action")
                if action == "denied":
                    query = query.filter(AccessControlEvent.is_authorized == False)
                if action == "granted":
                    query = query.filter(AccessControlEvent.is_authorized == True)
                if action == "timeout":
                    query = query.filter(AccessControlEvent.event_type == "timeout")
                if filters.get("userId"):
                    query = query.filter(AccessControlEvent.user_id == filters["userId"])
                if filters.get("accessPointId"):
                    query = query.filter(AccessControlEvent.access_point == filters["accessPointId"])
                if filters.get("startDate"):
                    query = query.filter(AccessControlEvent.timestamp >= datetime.fromisoformat(filters["startDate"]))
                if filters.get("endDate"):
                    query = query.filter(AccessControlEvent.timestamp <= datetime.fromisoformat(filters["endDate"]))
            events = query.order_by(AccessControlEvent.timestamp.desc()).all()
            access_points = {
                point.access_point_id: point.name for point in db.query(AccessPoint).filter(
                    AccessPoint.property_id == resolved_property_id
                ).all()
            }
            users = {
                user.access_user_id: user.name for user in db.query(AccessControlUser).filter(
                    AccessControlUser.property_id == resolved_property_id
                ).all()
            }
            results = []
            for event in events:
                action = event.event_type
                if action not in ["granted", "denied", "timeout"]:
                    action = "granted" if event.is_authorized else "denied"
                location_value = event.location
                if isinstance(location_value, dict):
                    location_text = location_value.get("name") or location_value.get("label") or json.dumps(location_value)
                else:
                    location_text = str(location_value)
                results.append({
                    "id": event.event_id,
                    "userId": event.user_id or "unknown",
                    "userName": users.get(event.user_id) or "Unknown User",
                    "accessPointId": event.access_point,
                    "accessPointName": access_points.get(event.access_point, event.access_point),
                    "action": action,
                    "timestamp": event.timestamp.isoformat(),
                    "reason": event.rejection_reason if event.review_status == "rejected" else None,
                    "location": location_text,
                    "accessMethod": event.access_method,
                    "source": event.source or "manager",
                    "source_agent_id": event.source_agent_id,
                    "source_device_id": event.source_device_id,
                    "source_metadata": event.source_metadata or {},
                    "idempotency_key": event.idempotency_key,
                    "review_status": event.review_status or "approved",
                    "rejection_reason": event.rejection_reason,
                    "reviewed_by": event.reviewed_by,
                    "reviewed_at": event.reviewed_at.isoformat() if event.reviewed_at else None
                })
            return results
        finally:
            db.close()

    @staticmethod
    async def sync_cached_events(
        access_point_id: str,
        events: List[Dict[str, Any]],
        property_id: Optional[str],
        user_id: Optional[str]
    ) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            resolved_property_id = property_id or AccessControlService._get_default_property_id(db, user_id)
            for event in events:
                db_event = AccessControlEvent(
                    property_id=resolved_property_id,
                    user_id=event.get("userId"),
                    access_point=access_point_id,
                    access_method=event.get("action", "card"),
                    event_type=event.get("action", "granted"),
                    location={"name": event.get("location", "Unknown")},
                    device_info={"source": "cached"},
                    is_authorized=event.get("action") != "denied",
                    alert_triggered=False,
                    photo_capture=None
                )
                db.add(db_event)
            point = db.query(AccessPoint).filter(AccessPoint.access_point_id == access_point_id).first()
            if point:
                point.access_count = (point.access_count or 0) + len(events)
                point.last_access = datetime.utcnow()
                point.cached_events = []
            db.commit()
            return await AccessControlService.get_access_events_summary(resolved_property_id, user_id)
        finally:
            db.close()

    @staticmethod
    async def get_access_metrics(property_id: Optional[str], user_id: Optional[str]) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            resolved_property_id = property_id or AccessControlService._get_default_property_id(db, user_id)
            points = db.query(AccessPoint).filter(AccessPoint.property_id == resolved_property_id).all()
            users = db.query(AccessControlUser).filter(AccessControlUser.property_id == resolved_property_id).all()
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            events_today = db.query(AccessControlEvent).filter(
                AccessControlEvent.property_id == resolved_property_id,
                AccessControlEvent.timestamp >= today_start
            ).all()
            denied_events = [event for event in events_today if not event.is_authorized]
            top_points = {}
            for event in events_today:
                top_points[event.access_point] = top_points.get(event.access_point, 0) + 1
            top_access_points = [
                {"name": point.name, "count": top_points.get(point.access_point_id, 0)}
                for point in points
            ]
            total_events = len(events_today)
            authorization_rate = int((total_events - len(denied_events)) / total_events * 100) if total_events else 100
            return {
                "totalAccessPoints": len(points),
                "activeAccessPoints": len([point for point in points if point.status == "active"]),
                "totalUsers": len(users),
                "activeUsers": len([user for user in users if user.status == "active"]),
                "todayAccessEvents": total_events,
                "deniedAccessEvents": len(denied_events),
                "averageResponseTime": "0.8s",
                "systemUptime": "99.98%",
                "topAccessPoints": top_access_points[:5],
                "recentAlerts": len([event for event in events_today if event.alert_triggered]),
                "securityScore": authorization_rate,
                "lastSecurityScan": datetime.utcnow().isoformat()
            }
        finally:
            db.close()

    @staticmethod
    async def apply_emergency_mode(
        mode: str,
        property_id: Optional[str],
        user_id: Optional[str],
        reason: Optional[str],
        timeout_minutes: Optional[int]
    ) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            resolved_property_id = property_id or AccessControlService._get_default_property_id(db, user_id)
            points = db.query(AccessPoint).filter(AccessPoint.property_id == resolved_property_id).all()
            state = db.query(AccessControlEmergencyState).filter(
                AccessControlEmergencyState.property_id == resolved_property_id
            ).first()
            if not state:
                state = AccessControlEmergencyState(property_id=resolved_property_id)
                db.add(state)
            if mode == "restore":
                previous_statuses = {entry["id"]: entry["status"] for entry in (state.previous_statuses or [])}
                for point in points:
                    if point.access_point_id in previous_statuses:
                        point.status = previous_statuses[point.access_point_id]
                state.mode = "normal"
            else:
                state.previous_statuses = [{"id": point.access_point_id, "status": point.status} for point in points]
                if mode == "lockdown":
                    for point in points:
                        point.status = "disabled"
                if mode == "unlock":
                    for point in points:
                        point.status = "active"
                state.mode = mode
            state.initiated_by = user_id
            state.reason = reason
            state.timestamp = datetime.utcnow()
            state.timeout_minutes = timeout_minutes
            state.expires_at = datetime.utcnow() + timedelta(minutes=timeout_minutes) if timeout_minutes else None
            db.commit()
            return {
                "mode": state.mode,
                "initiated_by": state.initiated_by,
                "reason": state.reason,
                "timestamp": state.timestamp.isoformat(),
                "timeout_minutes": state.timeout_minutes,
                "expires_at": state.expires_at.isoformat() if state.expires_at else None
            }
        finally:
            db.close()
    
    @staticmethod
    async def _validate_access_permission(
        access_point: str, 
        user_id: Optional[str], 
        guest_id: Optional[str], 
        db: SessionLocal
    ) -> bool:
        """Validate if user/guest has permission to access the point"""
        try:
            # Check user permissions
            if user_id:
                user = db.query(User).filter(User.user_id == user_id).first()
                if user and user.status.value == "active":
                    # Check user role permissions
                    user_roles = db.query(UserRole).filter(
                        UserRole.user_id == user_id,
                        UserRole.is_active == True
                    ).all()
                    
                    for role in user_roles:
                        permissions = role.permissions
                        if permissions.get("access_control", {}).get(access_point, False):
                            return True
            
            # Check guest permissions
            if guest_id:
                guest = db.query(Guest).filter(Guest.guest_id == guest_id).first()
                if guest and guest.check_out_date > datetime.utcnow():
                    # Check guest access permissions
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error validating access permission: {str(e)}")
            return False
    
    @staticmethod
    async def _trigger_unauthorized_alert(event: AccessControlEvent) -> None:
        """Trigger alert for unauthorized access"""
        try:
            # In production, send to alert system
            alert_data = {
                "type": "unauthorized_access",
                "severity": "high",
                "event_id": event.event_id,
                "access_point": event.access_point,
                "timestamp": event.timestamp.isoformat(),
                "location": event.location,
                "device_info": event.device_info
            }
            
            logger.warning(f"Unauthorized access alert: {json.dumps(alert_data)}")
            
            # Send to notification system
            # await NotificationService.send_alert(alert_data)
            
        except Exception as e:
            logger.error(f"Error triggering unauthorized alert: {str(e)}")
    
    @staticmethod
    async def get_biometric_data(user_id: str) -> Dict[str, Any]:
        """Get biometric data for user (mock implementation)"""
        try:
            # In production, integrate with biometric hardware
            return {
                "user_id": user_id,
                "biometric_type": "fingerprint",
                "templates": ["template_1", "template_2"],
                "last_updated": datetime.utcnow().isoformat(),
                "status": "active"
            }
        except Exception as e:
            logger.error(f"Error getting biometric data: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve biometric data"
            )
    
    @staticmethod
    async def enroll_biometric(user_id: str, biometric_data: Dict[str, Any]) -> Dict[str, str]:
        """Enroll biometric data for user (mock implementation)"""
        try:
            # In production, integrate with biometric hardware
            logger.info(f"Biometric enrollment for user {user_id}")
            
            return {
                "message": "Biometric enrollment successful",
                "user_id": user_id,
                "template_id": secrets.token_urlsafe(16)
            }
        except Exception as e:
            logger.error(f"Error enrolling biometric: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to enroll biometric data"
            ) 