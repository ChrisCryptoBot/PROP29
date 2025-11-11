"""
Access Control Service for PROPER 2.9
Handles biometric authentication, digital key management, and access logs
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from database import SessionLocal
from models import AccessControlEvent, User, Guest, Property
from schemas import AccessControlEventCreate, AccessControlEventResponse, DigitalKeyCreate, DigitalKeyResponse
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
                photo_capture=event.photo_capture
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
                photo_capture=db_event.photo_capture
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