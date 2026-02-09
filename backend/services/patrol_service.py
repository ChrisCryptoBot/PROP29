from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from database import SessionLocal
from models import Patrol, User, Property, PatrolRoute, PatrolTemplate, UserRole, PatrolSettings, PatrolStatus, SystemLog, Incident, IncidentType, IncidentSeverity, IncidentStatus
from services.push_notification_service import PushNotificationService
from schemas import (
    PatrolCreate, PatrolUpdate, PatrolResponse, 
    UserCreate, UserResponse, UserRoleEnum,
    PatrolRouteCreate, PatrolRouteUpdate, PatrolRouteResponse,
    PatrolTemplateCreate, PatrolTemplateUpdate, PatrolTemplateResponse,
    PatrolSettingsUpdate, PatrolSettingsResponse,
    SystemLogResponse
)
from passlib.context import CryptContext
from datetime import datetime
from uuid import uuid4, UUID
import os
import logging
from cachetools import TTLCache

logger = logging.getLogger(__name__)

# In-memory dedup for check-in request_id. Key: (patrol_id, checkpoint_id, request_id). TTL 24h.
_checkin_request_cache: TTLCache = TTLCache(maxsize=10000, ttl=86400)

# Officer heartbeat: officer_id -> {last_heartbeat: datetime, device_id?: str}. TTL 30 min.
_heartbeat_cache: TTLCache = TTLCache(maxsize=500, ttl=1800)
HEARTBEAT_ONLINE_SEC = 300  # 5 min
HEARTBEAT_OFFLINE_SEC = 900  # 15 min
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class PatrolService:
    @staticmethod
    def _validate_patrol_status_transition(
        current_status: PatrolStatus,
        next_status: PatrolStatus
    ) -> None:
        if current_status == next_status:
            return

        allowed_transitions = {
            PatrolStatus.PLANNED: {PatrolStatus.ACTIVE, PatrolStatus.INTERRUPTED},
            PatrolStatus.ACTIVE: {PatrolStatus.COMPLETED, PatrolStatus.INTERRUPTED},
            PatrolStatus.COMPLETED: set(),
            PatrolStatus.INTERRUPTED: set()
        }

        allowed = allowed_transitions.get(current_status, set())
        if next_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid patrol status transition: {current_status} -> {next_status}"
            )
    @staticmethod
    def _log_audit_event(
        db,
        *,
        action: str,
        user_id: Optional[str],
        property_id: Optional[str],
        resource_type: str,
        resource_id: Optional[str],
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        log_entry = SystemLog(
            log_level="info",
            message=action,
            service="patrols",
            log_metadata=metadata or {},
            user_id=user_id,
            property_id=property_id
        )
        db.add(log_entry)
        db.commit()
    @staticmethod
    def _get_default_property_id(db, user_id: Optional[str]) -> str:
        if user_id:
            role = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).first()
            if role:
                return role.property_id

        prop = db.query(Property).filter(Property.is_active == True).first()
        if not prop:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active property configured for patrol settings"
            )
        return prop.property_id

    @staticmethod
    def _validate_template_schedule(schedule: Dict[str, Any]) -> None:
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Schedule data is required"
            )
        start_time = schedule.get("startTime")
        end_time = schedule.get("endTime")
        days = schedule.get("days")

        if not start_time or not end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Schedule start and end time are required"
            )

        try:
            start_parts = [int(part) for part in start_time.split(":")]
            end_parts = [int(part) for part in end_time.split(":")]
            start_minutes = start_parts[0] * 60 + start_parts[1]
            end_minutes = end_parts[0] * 60 + end_parts[1]
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Schedule time format must be HH:MM"
            )

        if start_minutes >= end_minutes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Schedule end time must be after start time"
            )

        if not isinstance(days, list) or len(days) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Schedule must include at least one day"
            )

    @staticmethod
    def _schedule_overlaps(
        schedule_a: Dict[str, Any],
        schedule_b: Dict[str, Any]
    ) -> bool:
        days_a = set(schedule_a.get("days") or [])
        days_b = set(schedule_b.get("days") or [])
        if not days_a or not days_b or not days_a.intersection(days_b):
            return False

        def to_minutes(value: str) -> int:
            parts = [int(part) for part in value.split(":")]
            return parts[0] * 60 + parts[1]

        start_a = to_minutes(schedule_a.get("startTime", "00:00"))
        end_a = to_minutes(schedule_a.get("endTime", "00:00"))
        start_b = to_minutes(schedule_b.get("startTime", "00:00"))
        end_b = to_minutes(schedule_b.get("endTime", "00:00"))

        return max(start_a, start_b) < min(end_a, end_b)

    @staticmethod
    def _check_schedule_conflicts(
        db,
        *,
        property_id: str,
        schedule: Dict[str, Any],
        route_id: Optional[str],
        assigned_officers: List[str],
        exclude_template_id: Optional[str] = None
    ) -> None:
        templates = db.query(PatrolTemplate).filter(
            PatrolTemplate.property_id == property_id
        ).all()

        for template in templates:
            if exclude_template_id and str(template.template_id) == str(exclude_template_id):
                continue

            if not template.schedule:
                continue

            if not PatrolService._schedule_overlaps(schedule, template.schedule):
                continue

            same_route = route_id and str(template.route_id) == str(route_id)
            shared_officers = bool(set(assigned_officers or []).intersection(template.assigned_officers or []))

            if same_route or shared_officers:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Schedule conflicts with an existing patrol template"
                )
    @staticmethod
    async def get_patrols(
        user_id: str, 
        property_id: Optional[str] = None, 
        status: Optional[str] = None
    ) -> List[PatrolResponse]:
        """Get patrols with optional filtering"""
        db = SessionLocal()
        try:
            try:
                resolved_property_id = property_id or PatrolService._get_default_property_id(db, user_id)
            except HTTPException:
                resolved_property_id = None
            if resolved_property_id:
                query = db.query(Patrol).filter(Patrol.property_id == resolved_property_id)
                if status:
                    query = query.filter(Patrol.status == status)
                patrols = query.order_by(Patrol.created_at.desc()).all()
            else:
                patrols = []

            if not patrols:
                return []

            return [
                PatrolResponse(
                    patrol_id=patrol.patrol_id,
                    property_id=patrol.property_id,
                    guard_id=patrol.guard_id,
                    template_id=patrol.template_id,
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
                    property_name=patrol.property.property_name if patrol.property else None,
                    version=getattr(patrol, "version", 0),
                )
                for patrol in patrols
            ]
        except Exception as e:
            logger.error(f"Error getting patrols: {e}")
            return []
        finally:
            db.close()
    
    @staticmethod
    async def create_patrol(patrol: PatrolCreate, user_id: str) -> PatrolResponse:
        """Create a new patrol"""
        db = SessionLocal()
        try:
            property_id = str(patrol.property_id) if patrol.property_id else PatrolService._get_default_property_id(db, user_id)
            route_payload = patrol.route or {}
            if isinstance(route_payload, dict) and not route_payload.get("route_id") and route_payload.get("id"):
                route_payload["route_id"] = route_payload.get("id")
            db_patrol = Patrol(
                property_id=property_id,
                guard_id=patrol.guard_id,
                template_id=str(patrol.template_id) if patrol.template_id else None,
                patrol_type=patrol.patrol_type,
                route=route_payload,
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
                template_id=db_patrol.template_id,
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
                efficiency_score=db_patrol.efficiency_score,
                version=getattr(db_patrol, "version", 0),
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
                template_id=patrol.template_id,
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
                property_name=patrol.property.property_name if patrol.property else None,
                version=getattr(patrol, "version", 0),
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
            payload_version = getattr(patrol_update, "version", None)
            if payload_version is not None:
                current = getattr(patrol, "version", 0) or 0
                if current != payload_version:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Patrol was updated elsewhere; refresh and retry.",
                    )
            previous_status = patrol.status
            previous_guard_id = patrol.guard_id
            
            # Update fields (exclude version; we increment it ourselves)
            update_data = {k: v for k, v in patrol_update.model_dump(exclude_unset=True).items() if k != "version"}
            if "status" in update_data and update_data["status"]:
                PatrolService._validate_patrol_status_transition(patrol.status, update_data["status"])

            if "route" in update_data and isinstance(update_data.get("route"), dict):
                route_payload = update_data.get("route") or {}
                if not route_payload.get("route_id") and route_payload.get("id"):
                    route_payload["route_id"] = route_payload.get("id")
                update_data["route"] = route_payload

            for field, value in update_data.items():
                setattr(patrol, field, value)
            patrol.version = (getattr(patrol, "version", 0) or 0) + 1

            # Apply lifecycle timestamps when status changes
            if patrol_update.status:
                if patrol_update.status == PatrolStatus.ACTIVE and not patrol.started_at:
                    patrol.started_at = datetime.utcnow()
                if patrol_update.status == PatrolStatus.COMPLETED and not patrol.completed_at:
                    if not patrol.started_at:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Patrol must be started before completion"
                        )
                    patrol.completed_at = datetime.utcnow()
            
            db.commit()
            if "status" in update_data and update_data.get("status") != previous_status:
                PatrolService._log_audit_event(
                    db,
                    action="patrol_status_changed",
                    user_id=user_id,
                    property_id=patrol.property_id,
                    resource_type="patrol",
                    resource_id=patrol.patrol_id,
                    metadata={
                        "from": str(previous_status),
                        "to": str(update_data.get("status"))
                    }
                )
            if "guard_id" in update_data and update_data.get("guard_id") != previous_guard_id:
                PatrolService._log_audit_event(
                    db,
                    action="patrol_reassigned",
                    user_id=user_id,
                    property_id=patrol.property_id,
                    resource_type="patrol",
                    resource_id=patrol.patrol_id,
                    metadata={
                        "from": previous_guard_id,
                        "to": update_data.get("guard_id")
                    }
                )
            if "checkpoints" in update_data:
                PatrolService._log_audit_event(
                    db,
                    action="patrol_checkpoints_updated",
                    user_id=user_id,
                    property_id=patrol.property_id,
                    resource_type="patrol",
                    resource_id=patrol.patrol_id,
                    metadata={
                        "checkpoint_count": len(update_data.get("checkpoints") or [])
                    }
                )
            db.refresh(patrol)
            
            return PatrolResponse(
                patrol_id=patrol.patrol_id,
                property_id=patrol.property_id,
                guard_id=patrol.guard_id,
                template_id=patrol.template_id,
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
                version=patrol.version,
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
            
            PatrolService._validate_patrol_status_transition(patrol.status, PatrolStatus.ACTIVE)
            
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
            
            PatrolService._validate_patrol_status_transition(patrol.status, PatrolStatus.COMPLETED)
            if not patrol.started_at:
                raise ValueError("Patrol must be started before completion")
            
            patrol.status = "completed"
            patrol.completed_at = datetime.utcnow()
            
            # Calculate efficiency score based on completion time vs estimated time
            if patrol.started_at and patrol.completed_at:
                actual_duration = (patrol.completed_at - patrol.started_at).total_seconds() / 60  # minutes
                estimated_duration = patrol.route.get("estimated_duration", 60)  # default 60 minutes
                efficiency = max(0, min(100, (estimated_duration / actual_duration) * 100))
                patrol.efficiency_score = efficiency
            
            # Update route "last used" when patrol completes
            route_payload = patrol.route if isinstance(patrol.route, dict) else {}
            route_id = route_payload.get("route_id") or route_payload.get("id")
            if route_id:
                route = db.query(PatrolRoute).filter(PatrolRoute.route_id == str(route_id)).first()
                if route:
                    route.updated_at = datetime.utcnow()
            
            db.commit()
            
            return {"message": "Patrol completed successfully", "patrol_id": patrol_id}
        finally:
            db.close()

    @staticmethod
    async def get_officers(user_id: str) -> List[UserResponse]:
        """Get all security officers"""
        db = SessionLocal()
        try:
            # Query users who have 'security_officer' or 'guard' role
            from models import UserRole
            try:
                users = db.query(User).join(
                    UserRole, UserRole.user_id == User.user_id
                ).filter(
                    UserRole.role_name.in_([UserRoleEnum.SECURITY_OFFICER, UserRoleEnum.GUARD])
                ).all()
            except Exception as e:
                logger.warning(f"Error querying officers from DB: {e}")
                users = []

            def map_user(u):
                return UserResponse(
                    user_id=u.user_id,
                    email=u.email,
                    username=u.username,
                    first_name=u.first_name,
                    last_name=u.last_name,
                    phone=u.phone,
                    status=u.status,
                    created_at=u.created_at,
                    updated_at=u.updated_at,
                    roles=[{"role": r.role_name, "permissions": r.permissions} for r in u.user_roles],
                    profile_image_url=u.profile_image_url
                )

            if not users:
                return []

            return [map_user(u) for u in users]
        except Exception as e:
            logger.error(f"Error fetching officers: {e}")
            return []

    @staticmethod
    async def update_officer(user_id: str, updates: Dict[str, Any]) -> UserResponse:
        db = SessionLocal()
        try:
            db_user = db.query(User).filter(User.user_id == user_id).first()
            if not db_user:
                raise ValueError("Officer not found")
            
            # Update fields if present
            if 'name' in updates:
                # Naive split for first/last name if provided as full name
                parts = updates['name'].split(' ', 1)
                db_user.first_name = parts[0]
                if len(parts) > 1:
                    db_user.last_name = parts[1]
            
            # Explicit first/last name updates override
            if 'first_name' in updates: db_user.first_name = updates['first_name']
            if 'last_name' in updates: db_user.last_name = updates['last_name']
            if 'status' in updates: db_user.status = updates['status']
            
            # Roles/Specializations update is complex, skipping for MVP unless requested
            # Could update UserRole permissions here if needed

            db.commit()
            db.refresh(db_user)
            
            # Return full response using map helper logic (duplicated for now or extract)
            return UserResponse(
                user_id=db_user.user_id,
                email=db_user.email,
                username=db_user.username,
                first_name=db_user.first_name,
                last_name=db_user.last_name,
                phone=db_user.phone,
                status=db_user.status,
                created_at=db_user.created_at,
                updated_at=db_user.updated_at,
                roles=[{"role": r.role_name, "permissions": r.permissions} for r in db_user.user_roles],
                profile_image_url=db_user.profile_image_url
            )
        finally:
            db.close()

    @staticmethod
    async def delete_officer(user_id: str):
        db = SessionLocal()
        try:
            db_user = db.query(User).filter(User.user_id == user_id).first()
            if not db_user:
                raise ValueError("Officer not found")
            
            # Soft delete by setting status to inactive
            db_user.status = "inactive"
            db.commit()
            return {"message": "Officer deactivated successfully"}
        finally:
            db.close()

    @staticmethod
    def record_heartbeat(officer_id: str, device_id: Optional[str] = None) -> None:
        """Record heartbeat from officer device. In-memory only."""
        _heartbeat_cache[officer_id] = {
            "last_heartbeat": datetime.utcnow(),
            "device_id": device_id,
        }

    @staticmethod
    def get_officers_health(offline_threshold_minutes: Optional[int] = None) -> Dict[str, Dict[str, Any]]:
        """Return officer_id -> {last_heartbeat, connection_status} from heartbeat cache."""
        now = datetime.utcnow()
        offline_sec = (offline_threshold_minutes or (HEARTBEAT_OFFLINE_SEC // 60)) * 60
        result: Dict[str, Dict[str, Any]] = {}
        
        for oid, v in _heartbeat_cache.items():
            lb = v.get("last_heartbeat")
            if not lb:
                continue
            delta = (now - lb).total_seconds() if isinstance(lb, datetime) else 0
            if delta <= HEARTBEAT_ONLINE_SEC:
                status = "online"
            elif delta <= offline_sec:
                status = "unknown"
            else:
                status = "offline"
            result[str(oid)] = {
                "last_heartbeat": lb.isoformat() if isinstance(lb, datetime) else str(lb),
                "connection_status": status,
            }
        
        return result

    @staticmethod
    async def create_officer(
        name: Optional[str],
        badge_number: Optional[str],
        specializations: Optional[List[str]],
        admin_user_id: Optional[str]
    ) -> UserResponse:
        """Create a new security officer"""
        db = SessionLocal()
        try:
            badge = badge_number or f"SEC-{int(datetime.utcnow().timestamp())}"
            username = badge
            email = f"{badge.lower()}@proper.ai"
            display_name = name or "Unknown Officer"
            
            existing = db.query(User).filter((User.username == username) | (User.email == email)).first()
            if existing:
                raise ValueError("Officer with this badge/email already exists")

            # Create User
            new_user = User(
                username=username,
                email=email,
                password_hash=pwd_context.hash("proper123"),
                first_name=display_name.split(" ")[0],
                last_name=" ".join(display_name.split(" ")[1:]) or "Officer",
                status="active"
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            # Assign Role
            new_role = UserRole(
                user_id=new_user.user_id,
                role_name=UserRoleEnum.SECURITY_OFFICER,
                permissions={"specializations": specializations or []}
            )
            db.add(new_role)
            db.commit()
            
            return UserResponse(
                user_id=new_user.user_id,
                email=new_user.email,
                username=new_user.username,
                first_name=new_user.first_name,
                last_name=new_user.last_name,
                status=new_user.status,
                created_at=new_user.created_at,
                updated_at=new_user.updated_at,
                roles=[{"role": "security_officer", "permissions": new_role.permissions}],
                profile_image_url=new_user.profile_image_url
            )
        finally:
            db.close() 

    @staticmethod
    async def get_settings(user_id: Optional[str], property_id: Optional[str] = None) -> PatrolSettingsResponse:
        db = SessionLocal()
        try:
            resolved_property_id = property_id or PatrolService._get_default_property_id(db, user_id)
            settings = db.query(PatrolSettings).filter(PatrolSettings.property_id == resolved_property_id).first()
            if not settings:
                settings = PatrolSettings(property_id=resolved_property_id)
                db.add(settings)
                db.commit()
                db.refresh(settings)
            return PatrolSettingsResponse.model_validate(settings)
        except Exception as e:
            logger.error(f"Error getting settings: {e}")
            raise
        finally:
            db.close()

    @staticmethod
    async def update_settings(settings_update: PatrolSettingsUpdate, user_id: Optional[str], property_id: Optional[str] = None) -> PatrolSettingsResponse:
        db = SessionLocal()
        try:
            resolved_property_id = property_id or PatrolService._get_default_property_id(db, user_id)
            settings = db.query(PatrolSettings).filter(PatrolSettings.property_id == resolved_property_id).first()
            if not settings:
                settings = PatrolSettings(property_id=resolved_property_id)
                db.add(settings)

            for field, value in settings_update.model_dump(exclude_unset=True).items():
                setattr(settings, field, value)

            db.commit()
            db.refresh(settings)
            return PatrolSettingsResponse.model_validate(settings)
        finally:
            db.close()

    @staticmethod
    async def get_routes(property_id: Optional[str], user_id: Optional[str]) -> List[PatrolRouteResponse]:
        db = SessionLocal()
        try:
            resolved_property_id = property_id or PatrolService._get_default_property_id(db, user_id)
            routes = db.query(PatrolRoute).filter(PatrolRoute.property_id == resolved_property_id).all()
            
            if not routes:
                return []

            return [
                PatrolRouteResponse(
                    property_id=route.property_id,
                    name=route.name,
                    description=route.description,
                    checkpoints=route.checkpoints or [],
                    estimated_duration=route.estimated_duration,
                    difficulty=route.difficulty,
                    frequency=route.frequency,
                    route_id=route.route_id,
                    is_active=route.is_active,
                    created_at=route.created_at,
                    updated_at=route.updated_at,
                    created_by=route.created_by
                )
                for route in routes
            ]
        except Exception as e:
            logger.error(f"Error getting routes: {e}")
            return []
        finally:
            db.close()

    @staticmethod
    async def create_route(route: PatrolRouteCreate, user_id: str) -> PatrolRouteResponse:
        db = SessionLocal()
        try:
            property_id = str(route.property_id) if route.property_id else PatrolService._get_default_property_id(db, user_id)
            if not route.name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Route name is required"
                )
            db_route = PatrolRoute(
                property_id=property_id,
                name=route.name,
                description=route.description,
                checkpoints=route.checkpoints or [],
                estimated_duration=route.estimated_duration,
                difficulty=route.difficulty,
                frequency=route.frequency,
                created_by=user_id
            )
            db.add(db_route)
            db.commit()
            db.refresh(db_route)
            PatrolService._log_audit_event(
                db,
                action="patrol_route_created",
                user_id=user_id,
                property_id=db_route.property_id,
                resource_type="patrol_route",
                resource_id=db_route.route_id,
                metadata={"name": db_route.name}
            )
            return PatrolRouteResponse(
                property_id=db_route.property_id,
                name=db_route.name,
                description=db_route.description,
                checkpoints=db_route.checkpoints or [],
                estimated_duration=db_route.estimated_duration,
                difficulty=db_route.difficulty,
                frequency=db_route.frequency,
                route_id=db_route.route_id,
                is_active=db_route.is_active,
                created_at=db_route.created_at,
                updated_at=db_route.updated_at,
                created_by=db_route.created_by
            )
        finally:
            db.close()

    @staticmethod
    async def update_route(route_id: str, route_update: PatrolRouteUpdate, user_id: str) -> PatrolRouteResponse:
        db = SessionLocal()
        try:
            route = db.query(PatrolRoute).filter(PatrolRoute.route_id == route_id).first()
            if not route:
                raise ValueError("Route not found")

            update_data = route_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(route, field, value)

            db.commit()
            db.refresh(route)
            PatrolService._log_audit_event(
                db,
                action="patrol_route_updated",
                user_id=user_id,
                property_id=route.property_id,
                resource_type="patrol_route",
                resource_id=route.route_id,
                metadata={"fields": list(update_data.keys())}
            )
            return PatrolRouteResponse(
                property_id=route.property_id,
                name=route.name,
                description=route.description,
                checkpoints=route.checkpoints or [],
                estimated_duration=route.estimated_duration,
                difficulty=route.difficulty,
                frequency=route.frequency,
                route_id=route.route_id,
                is_active=route.is_active,
                created_at=route.created_at,
                updated_at=route.updated_at,
                created_by=route.created_by
            )
        finally:
            db.close()

    @staticmethod
    async def delete_route(route_id: str, user_id: str) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            route = db.query(PatrolRoute).filter(PatrolRoute.route_id == route_id).first()
            if not route:
                raise ValueError("Route not found")
            in_use = db.query(Patrol).filter(
                Patrol.property_id == route.property_id,
                Patrol.status.in_([PatrolStatus.PLANNED, PatrolStatus.ACTIVE])
            ).all()
            for patrol in in_use:
                route_data = patrol.route if isinstance(patrol.route, dict) else {}
                if (
                    route_data.get("route_id") == route_id
                    or route_data.get("id") == route_id
                    or (route_data.get("name") and route_data.get("name") == route.name)
                ):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot delete route while active patrols are using it"
                    )
            db.delete(route)
            db.commit()
            PatrolService._log_audit_event(
                db,
                action="patrol_route_deleted",
                user_id=user_id,
                property_id=route.property_id,
                resource_type="patrol_route",
                resource_id=route.route_id,
                metadata={"name": route.name}
            )
            return {"message": "Route deleted successfully"}
        finally:
            db.close()

    @staticmethod
    async def get_templates(property_id: Optional[str], user_id: Optional[str]) -> List[PatrolTemplateResponse]:
        db = SessionLocal()
        try:
            try:
                resolved_property_id = property_id or (PatrolService._get_default_property_id(db, user_id) if user_id else None)
            except HTTPException:
                resolved_property_id = None
            if resolved_property_id:
                templates = db.query(PatrolTemplate).filter(PatrolTemplate.property_id == resolved_property_id).all()
            else:
                templates = []
            
            if not templates:
                return []

            return [
                PatrolTemplateResponse(
                    property_id=template.property_id,
                    name=template.name,
                    description=template.description,
                    route_id=template.route_id,
                    assigned_officers=template.assigned_officers or [],
                    schedule=template.schedule or {},
                    priority=template.priority,
                    is_recurring=template.is_recurring,
                    template_id=template.template_id,
                    created_at=template.created_at,
                    updated_at=template.updated_at,
                    created_by=template.created_by
                )
                for template in templates
            ]
        except Exception as e:
            logger.error(f"Error getting templates: {e}")
            return []
        finally:
            db.close()

    @staticmethod
    async def create_template(template: PatrolTemplateCreate, user_id: str) -> PatrolTemplateResponse:
        db = SessionLocal()
        try:
            property_id = str(template.property_id) if template.property_id else PatrolService._get_default_property_id(db, user_id)
            PatrolService._validate_template_schedule(template.schedule or {})
            route = db.query(PatrolRoute).filter(PatrolRoute.route_id == str(template.route_id)).first()
            if not route:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Route not found for template"
                )
            PatrolService._check_schedule_conflicts(
                db,
                property_id=property_id,
                schedule=template.schedule or {},
                route_id=str(template.route_id),
                assigned_officers=[str(officer_id) for officer_id in (template.assigned_officers or [])]
            )
            db_template = PatrolTemplate(
                property_id=property_id,
                name=template.name,
                description=template.description,
                route_id=str(template.route_id),
                assigned_officers=template.assigned_officers or [],
                schedule=template.schedule or {},
                priority=template.priority,
                is_recurring=template.is_recurring,
                created_by=user_id
            )
            db.add(db_template)
            db.commit()
            db.refresh(db_template)
            PatrolService._log_audit_event(
                db,
                action="patrol_template_created",
                user_id=user_id,
                property_id=db_template.property_id,
                resource_type="patrol_template",
                resource_id=db_template.template_id,
                metadata={"name": db_template.name}
            )
            return PatrolTemplateResponse(
                property_id=db_template.property_id,
                name=db_template.name,
                description=db_template.description,
                route_id=db_template.route_id,
                assigned_officers=db_template.assigned_officers or [],
                schedule=db_template.schedule or {},
                priority=db_template.priority,
                is_recurring=db_template.is_recurring,
                template_id=db_template.template_id,
                created_at=db_template.created_at,
                updated_at=db_template.updated_at,
                created_by=db_template.created_by
            )
        finally:
            db.close()

    @staticmethod
    async def update_template(template_id: str, template_update: PatrolTemplateUpdate, user_id: str) -> PatrolTemplateResponse:
        db = SessionLocal()
        try:
            template = db.query(PatrolTemplate).filter(PatrolTemplate.template_id == template_id).first()
            if not template:
                raise ValueError("Template not found")

            update_data = template_update.model_dump(exclude_unset=True)
            if "schedule" in update_data:
                PatrolService._validate_template_schedule(update_data.get("schedule") or {})
            if "route_id" in update_data and update_data.get("route_id"):
                route = db.query(PatrolRoute).filter(PatrolRoute.route_id == str(update_data.get("route_id"))).first()
                if not route:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Route not found for template"
                    )
            merged_schedule = update_data.get("schedule") or template.schedule or {}
            merged_route_id = str(update_data.get("route_id")) if update_data.get("route_id") else str(template.route_id)
            merged_officers = update_data.get("assigned_officers") or template.assigned_officers or []
            PatrolService._check_schedule_conflicts(
                db,
                property_id=str(template.property_id),
                schedule=merged_schedule,
                route_id=merged_route_id,
                assigned_officers=[str(officer_id) for officer_id in merged_officers],
                exclude_template_id=template_id
            )
            for field, value in update_data.items():
                setattr(template, field, value)

            db.commit()
            db.refresh(template)
            PatrolService._log_audit_event(
                db,
                action="patrol_template_updated",
                user_id=user_id,
                property_id=template.property_id,
                resource_type="patrol_template",
                resource_id=template.template_id,
                metadata={"fields": list(update_data.keys())}
            )
            return PatrolTemplateResponse(
                property_id=template.property_id,
                name=template.name,
                description=template.description,
                route_id=template.route_id,
                assigned_officers=template.assigned_officers or [],
                schedule=template.schedule or {},
                priority=template.priority,
                is_recurring=template.is_recurring,
                template_id=template.template_id,
                created_at=template.created_at,
                updated_at=template.updated_at,
                created_by=template.created_by
            )
        finally:
            db.close()

    @staticmethod
    async def delete_template(template_id: str, user_id: str) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            template = db.query(PatrolTemplate).filter(PatrolTemplate.template_id == template_id).first()
            if not template:
                raise ValueError("Template not found")
            in_use = db.query(Patrol).filter(
                Patrol.property_id == template.property_id,
                Patrol.status.in_([PatrolStatus.PLANNED, PatrolStatus.ACTIVE])
            ).all()
            for patrol in in_use:
                if patrol.template_id and str(patrol.template_id) == str(template_id):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot delete template while active patrols are using it"
                    )
            db.delete(template)
            db.commit()
            PatrolService._log_audit_event(
                db,
                action="patrol_template_deleted",
                user_id=user_id,
                property_id=template.property_id,
                resource_type="patrol_template",
                resource_id=template.template_id,
                metadata={"name": template.name}
            )
            return {"message": "Template deleted successfully"}
        finally:
            db.close()

    @staticmethod
    async def check_in_checkpoint(
        patrol_id: str,
        checkpoint_id: str,
        payload: Dict[str, Any],
        user_id: Optional[str]
    ) -> PatrolResponse:
        db = SessionLocal()
        try:
            method = payload.get("method") or "manual"
            if method not in ["manual", "nfc", "qr", "gps", "hardware"]:
                raise ValueError("Invalid check-in method")
            device_id = payload.get("device_id")
            if method != "manual" and not device_id:
                raise ValueError("device_id is required for hardware check-ins")
            if method != "manual":
                allowlist_raw = os.getenv("HARDWARE_DEVICE_IDS", "")
                if allowlist_raw:
                    allowlist = {item.strip() for item in allowlist_raw.split(",") if item.strip()}
                    if allowlist and device_id not in allowlist:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Device not authorized for hardware check-in"
                        )

            request_id = payload.get("request_id")
            dedup_key = (patrol_id, checkpoint_id, request_id) if request_id else None
            if dedup_key and dedup_key in _checkin_request_cache:
                patrol = db.query(Patrol).filter(Patrol.patrol_id == patrol_id).first()
                if not patrol:
                    raise ValueError("Patrol not found")
                return PatrolResponse(
                    patrol_id=patrol.patrol_id,
                    property_id=patrol.property_id,
                    guard_id=patrol.guard_id,
                    template_id=patrol.template_id,
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
                    version=getattr(patrol, "version", 0),
                )

            patrol = db.query(Patrol).filter(Patrol.patrol_id == patrol_id).first()
            if not patrol:
                raise ValueError("Patrol not found")

            if patrol.status != PatrolStatus.ACTIVE:
                raise ValueError("Checkpoint check-in is only allowed for active patrols")

            route_checkpoints = patrol.route.get("checkpoints", []) if isinstance(patrol.route, dict) else []
            checkpoint_list = patrol.checkpoints or route_checkpoints
            if not checkpoint_list:
                raise ValueError("No checkpoints available for this patrol")

            completed_at = payload.get("completed_at")
            if isinstance(completed_at, datetime):
                completed_at = completed_at.isoformat()

            updated_checkpoints = []
            found = False
            for checkpoint in checkpoint_list:
                if checkpoint and checkpoint.get("id") == checkpoint_id:
                    if checkpoint.get("status") == "completed":
                        if dedup_key:
                            _checkin_request_cache[dedup_key] = True
                        return PatrolResponse(
                            patrol_id=patrol.patrol_id,
                            property_id=patrol.property_id,
                            guard_id=patrol.guard_id,
                            template_id=patrol.template_id,
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
                            version=getattr(patrol, "version", 0),
                        )
                    found = True
                    updated_checkpoints.append({
                        **checkpoint,
                        "status": "completed",
                        "completedAt": completed_at or datetime.utcnow().isoformat(),
                        "completedBy": payload.get("completed_by") or user_id or "hardware",
                        "notes": payload.get("notes"),
                        "method": method,
                        "deviceId": payload.get("device_id"),
                        "requestId": payload.get("request_id"),
                        "location": payload.get("location")
                    })
                else:
                    updated_checkpoints.append(checkpoint)

            if not found:
                raise ValueError("Checkpoint not found")

            patrol.checkpoints = updated_checkpoints
            db.commit()
            db.refresh(patrol)
            source = "web_admin" if method == "manual" else "mobile_agent"
            PatrolService._log_audit_event(
                db,
                action="patrol_checkpoint_checkin",
                user_id=user_id,
                property_id=patrol.property_id,
                resource_type="patrol_checkpoint",
                resource_id=checkpoint_id,
                metadata={
                    "patrol_id": str(patrol.patrol_id),
                    "method": payload.get("method"),
                    "device_id": payload.get("device_id"),
                    "source": source,
                    "request_id": payload.get("request_id")
                }
            )
            if dedup_key:
                _checkin_request_cache[dedup_key] = True

            return PatrolResponse(
                patrol_id=patrol.patrol_id,
                property_id=patrol.property_id,
                guard_id=patrol.guard_id,
                template_id=patrol.template_id,
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
                version=getattr(patrol, "version", 0),
            )
        finally:
            db.close()

    @staticmethod
    async def create_emergency_alert(payload: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            raw_property_id = payload.get("property_id")
            property_id = str(raw_property_id) if raw_property_id else PatrolService._get_default_property_id(db, user_id)
            incident_title = payload.get("message") or "Patrol emergency alert"
            incident = Incident(
                property_id=property_id,
                incident_type=IncidentType.OTHER,
                severity=IncidentSeverity.CRITICAL if payload.get("severity") == "critical" else IncidentSeverity.HIGH,
                status=IncidentStatus.OPEN,
                title=incident_title,
                description=payload.get("message") or "Emergency alert triggered from patrol command center.",
                location=payload.get("location") or {"source": "patrol", "detail": "Unknown"},
                reported_by=user_id
            )
            db.add(incident)
            log_entry = SystemLog(
                log_level="critical",
                message="patrol_emergency_alert",
                service="patrols",
                log_metadata=payload,
                user_id=user_id,
                property_id=property_id
            )
            db.add(log_entry)
            db.commit()
            db.refresh(log_entry)
            db.refresh(incident)
            PushNotificationService().send_notification(
                title="Patrol Emergency Alert",
                body=incident_title,
                data={"incident_id": incident.incident_id, "property_id": property_id}
            )
            return {
                "status": "alerted",
                "alert_id": log_entry.log_id,
                "incident_id": incident.incident_id
            }
        finally:
            db.close()

    @staticmethod
    def _empty_metrics() -> Dict[str, Any]:
        return {
            "total_patrols": 0,
            "completed_patrols": 0,
            "average_efficiency_score": 0.0,
            "patrols_by_type": {},
            "average_duration": 0.0,
            "incidents_found": 0,
            "efficiency_trend": [],
            "guard_performance": []
        }

    @staticmethod
    async def get_metrics(user_id: str, property_id: Optional[str] = None) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            try:
                resolved_property_id = property_id or PatrolService._get_default_property_id(db, user_id)
            except HTTPException:
                return PatrolService._empty_metrics()
            patrols = db.query(Patrol).filter(Patrol.property_id == resolved_property_id).all()

            total_patrols = len(patrols)
            completed_patrols = len([p for p in patrols if p.status == PatrolStatus.COMPLETED])

            efficiency_scores = [p.efficiency_score for p in patrols if p.efficiency_score is not None]
            average_efficiency_score = sum(efficiency_scores) / len(efficiency_scores) if efficiency_scores else 0.0

            durations = []
            for patrol in patrols:
                if patrol.started_at and patrol.completed_at:
                    durations.append((patrol.completed_at - patrol.started_at).total_seconds() / 60.0)
            average_duration = sum(durations) / len(durations) if durations else 0.0

            patrols_by_type: Dict[str, int] = {}
            for patrol in patrols:
                key = str(patrol.patrol_type)
                patrols_by_type[key] = patrols_by_type.get(key, 0) + 1

            incidents_found = 0
            for patrol in patrols:
                if isinstance(patrol.incidents_found, list):
                    incidents_found += len(patrol.incidents_found)

            # Efficiency trend for last 7 completed patrols by date
            trend: Dict[str, Dict[str, float]] = {}
            for patrol in patrols:
                if patrol.completed_at and patrol.efficiency_score is not None:
                    day_key = patrol.completed_at.date().isoformat()
                    if day_key not in trend:
                        trend[day_key] = {"total": 0.0, "count": 0.0}
                    trend[day_key]["total"] += patrol.efficiency_score
                    trend[day_key]["count"] += 1

            efficiency_trend = [
                {
                    "date": day,
                    "average_efficiency": (data["total"] / data["count"]) if data["count"] else 0.0
                }
                for day, data in sorted(trend.items(), key=lambda item: item[0])[-7:]
            ]

            guard_stats: Dict[str, Dict[str, Any]] = {}
            for patrol in patrols:
                if not patrol.guard_id:
                    continue
                if patrol.guard_id not in guard_stats:
                    guard = getattr(patrol, "guard", None)
                    guard_name = "Unknown"
                    if guard:
                        guard_name = f"{getattr(guard, 'first_name', '') or ''} {getattr(guard, 'last_name', '') or ''}".strip() or "Unknown"
                    guard_stats[patrol.guard_id] = {
                        "guard_id": patrol.guard_id,
                        "guard_name": guard_name,
                        "completed_patrols": 0,
                        "efficiency_total": 0.0,
                        "efficiency_count": 0
                    }
                if patrol.status == PatrolStatus.COMPLETED:
                    guard_stats[patrol.guard_id]["completed_patrols"] += 1
                if patrol.efficiency_score is not None:
                    guard_stats[patrol.guard_id]["efficiency_total"] += patrol.efficiency_score
                    guard_stats[patrol.guard_id]["efficiency_count"] += 1

            guard_performance = []
            for entry in guard_stats.values():
                avg_eff = entry["efficiency_total"] / entry["efficiency_count"] if entry["efficiency_count"] else 0.0
                guard_performance.append({
                    "guard_id": entry["guard_id"],
                    "guard_name": entry["guard_name"],
                    "completed_patrols": entry["completed_patrols"],
                    "average_efficiency": avg_eff
                })

            guard_performance = sorted(
                guard_performance,
                key=lambda item: (item["completed_patrols"], item["average_efficiency"]),
                reverse=True
            )[:10]

            if total_patrols == 0:
                return PatrolService._empty_metrics()

            return {
                "total_patrols": total_patrols,
                "completed_patrols": completed_patrols,
                "average_efficiency_score": round(average_efficiency_score, 2),
                "patrols_by_type": patrols_by_type,
                "average_duration": round(average_duration, 2),
                "incidents_found": incidents_found,
                "efficiency_trend": efficiency_trend,
                "guard_performance": guard_performance
            }
        except Exception as e:
            logger.error(f"Error getting patrol metrics: {e}")
            return PatrolService._empty_metrics()
        finally:
            db.close()

    @staticmethod
    async def get_audit_logs(user_id: str, property_id: Optional[str] = None) -> List[SystemLogResponse]:
        db = SessionLocal()
        try:
            resolved_property_id = property_id or PatrolService._get_default_property_id(db, user_id)
            logs = db.query(SystemLog).filter(
                SystemLog.service == "patrols",
                SystemLog.property_id == resolved_property_id
            ).order_by(SystemLog.timestamp.desc()).limit(50).all()
            return [
                SystemLogResponse(
                    log_id=log.log_id,
                    log_level=log.log_level,
                    message=log.message,
                    timestamp=log.timestamp,
                    service=log.service,
                    log_metadata=log.log_metadata,
                    user_id=log.user_id,
                    property_id=log.property_id
                )
                for log in logs
            ]
        except Exception as e:
            logger.error(f"Error getting patrol audit logs: {e}")
            return []
        finally:
            db.close()

    @staticmethod
    def get_dashboard_data(user_id: str, property_id: Optional[str] = None) -> Dict[str, Any]:
        """Return comprehensive dashboard data including alerts, weather, emergency status."""
        return {
            "alerts": [],
            "weather": {"temperature": 0, "condition": "Unknown", "windSpeed": 0, "visibility": "Unknown", "humidity": 0, "patrolRecommendation": "No data"},
            "emergencyStatus": {"level": "normal", "message": "No data", "activeAlerts": 0, "lastIncident": None, "escalationProtocols": "standard"},
            "metrics": {}
        }
