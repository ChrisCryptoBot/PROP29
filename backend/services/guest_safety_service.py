"""
Guest Safety Service for PROPER 2.9
Handles Guest Safety incident workflows for admin UI
"""

from typing import List, Optional, Dict, Any
import json
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
from models import GuestSafetyIncident, GuestSafetyTeam, GuestSafetySettings, GuestMessage, UserRole, Property, Incident
from schemas import (
    GuestSafetyIncidentCreate,
    GuestSafetyIncidentUpdate,
    GuestSafetyIncidentResponse,
    GuestSafetyTeamResponse,
    GuestSafetySettingsUpdate,
    GuestSafetySettingsResponse,
    GuestMessageCreate,
    GuestMessageResponse,
    GuestMessageUpdate,
    IncidentType,
    IncidentSeverity,
    IncidentStatus,
)
from fastapi import HTTPException, status
import logging
import uuid

logger = logging.getLogger(__name__)


class GuestSafetyService:
    """Service for managing guest safety incidents"""

    @staticmethod
    def _get_default_property_id(db, user_id: Optional[str]) -> str:
        # Prefer user's assigned property
        if user_id:
            role = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).first()
            if role:
                return role.property_id

        # Fallback to first active property
        prop = db.query(Property).filter(Property.is_active == True).first()
        if not prop:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active property configured for guest safety incidents"
            )
        return prop.property_id

    @staticmethod
    def _infer_incident_type(incident: GuestSafetyIncident) -> str:
        """Infer type from title/description for evacuation and API compatibility."""
        text = f"{(incident.title or '')} {(incident.description or '')}".lower()
        if "evacuation" in text:
            return "evacuation"
        if "medical" in text or "heart" in text or "fall" in text:
            return "medical"
        if "security" in text or "suspicious" in text:
            return "security"
        if "maintenance" in text or "repair" in text:
            return "maintenance"
        if "service" in text or "towel" in text:
            return "service"
        if "noise" in text:
            return "noise"
        return "other"

    @staticmethod
    def _to_response(incident: GuestSafetyIncident) -> GuestSafetyIncidentResponse:
        return GuestSafetyIncidentResponse(
            id=incident.incident_id,
            title=incident.title,
            description=incident.description,
            location=incident.location,
            severity=incident.severity,
            status=incident.status,
            type=GuestSafetyService._infer_incident_type(incident),
            reported_by=incident.reported_by,
            reported_at=incident.reported_at,
            resolved_at=incident.resolved_at,
            resolved_by=incident.resolved_by,
            guest_involved=incident.guest_involved,
            room_number=incident.room_number,
            contact_info=incident.contact_info,
            assigned_team=incident.assigned_team,
            source=getattr(incident, 'source', 'MANAGER') or 'MANAGER',
            source_metadata=getattr(incident, 'source_metadata', None),
        )

    @staticmethod
    def _settings_to_response(settings: GuestSafetySettings) -> GuestSafetySettingsResponse:
        return GuestSafetySettingsResponse(
            alertThreshold=settings.alert_threshold,
            autoEscalation=settings.auto_escalation,
            notificationChannels=settings.notification_channels or {"inApp": True, "sms": True, "email": True},
            responseTeamAssignment=settings.response_team_assignment,
        )

    @staticmethod
    def get_incidents(user_id: Optional[str] = None) -> List[GuestSafetyIncidentResponse]:
        db = SessionLocal()
        try:
            incidents = db.query(GuestSafetyIncident).order_by(GuestSafetyIncident.reported_at.desc()).all()
            return [GuestSafetyService._to_response(i) for i in incidents]
        finally:
            db.close()

    @staticmethod
    def _map_severity_to_incident_severity(severity: str) -> IncidentSeverity:
        """Map GuestSafetySeverity to IncidentSeverity"""
        severity_map = {
            "low": IncidentSeverity.LOW,
            "medium": IncidentSeverity.MEDIUM,
            "high": IncidentSeverity.HIGH,
            "critical": IncidentSeverity.CRITICAL,
            "emergency": IncidentSeverity.CRITICAL,  # Emergency maps to Critical
        }
        return severity_map.get(severity.lower(), IncidentSeverity.MEDIUM)

    @staticmethod
    def _map_status_to_incident_status(status: str) -> IncidentStatus:
        """Map Guest Safety status to Incident Log status"""
        status_map = {
            "reported": IncidentStatus.OPEN,
            "responding": IncidentStatus.INVESTIGATING,
            "resolved": IncidentStatus.RESOLVED,
            "closed": IncidentStatus.CLOSED,
        }
        return status_map.get(status.lower(), IncidentStatus.OPEN)

    @staticmethod
    def _create_incident_log_entry(
        db: Session,
        guest_safety_incident: GuestSafetyIncident,
        property_id: str,
        user_id: Optional[str]
    ) -> None:
        """Create corresponding entry in Incident Log module"""
        try:
            # Map location string to JSON format
            location_dict: Dict[str, Any] = {
                "address": guest_safety_incident.location,
                "room_number": guest_safety_incident.room_number,
            }
            if guest_safety_incident.room_number:
                location_dict["room"] = guest_safety_incident.room_number

            # Build source metadata
            source_metadata: Dict[str, Any] = {
                "guest_safety_incident_id": guest_safety_incident.incident_id,
                "guest_involved": guest_safety_incident.guest_involved,
                "contact_info": guest_safety_incident.contact_info,
                "assigned_team": guest_safety_incident.assigned_team,
            }
            if guest_safety_incident.source_metadata:
                source_metadata.update(guest_safety_incident.source_metadata)

            # Create incident log entry
            incident_log_entry = Incident(
                incident_id=str(uuid.uuid4()),
                property_id=property_id,
                incident_type=IncidentType.GUEST_COMPLAINT,  # Guest safety incidents are guest complaints
                severity=GuestSafetyService._map_severity_to_incident_severity(
                    guest_safety_incident.severity.value if hasattr(guest_safety_incident.severity, 'value') else str(guest_safety_incident.severity)
                ),
                status=GuestSafetyService._map_status_to_incident_status(guest_safety_incident.status),
                title=guest_safety_incident.title,
                description=guest_safety_incident.description,
                location=location_dict,
                reported_by=user_id or guest_safety_incident.reported_by or "system",
                source="guest_safety",
                source_metadata=source_metadata,
                idempotency_key=f"guest_safety_{guest_safety_incident.incident_id}",  # Prevent duplicates
            )
            db.add(incident_log_entry)
            db.commit()
            logger.info(
                f"Created incident log entry for guest safety incident {guest_safety_incident.incident_id}",
                extra={"guest_safety_incident_id": guest_safety_incident.incident_id}
            )
        except Exception as e:
            # Log error but don't fail guest safety incident creation
            logger.error(
                f"Failed to create incident log entry for guest safety incident {guest_safety_incident.incident_id}: {e}",
                exc_info=True,
                extra={"guest_safety_incident_id": guest_safety_incident.incident_id}
            )
            # Rollback only the incident log entry, not the guest safety incident
            db.rollback()

    @staticmethod
    def create_incident(incident: GuestSafetyIncidentCreate, user_id: Optional[str] = None) -> GuestSafetyIncidentResponse:
        db = SessionLocal()
        try:
            property_id = GuestSafetyService._get_default_property_id(db, user_id)
            db_incident = GuestSafetyIncident(
                property_id=property_id,
                title=incident.title,
                description=incident.description,
                location=incident.location,
                severity=incident.severity,
                status=incident.status,
                reported_by=user_id or incident.reported_by,
                reported_at=datetime.utcnow(),
                guest_involved=incident.guest_involved,
                room_number=incident.room_number,
                contact_info=incident.contact_info,
                assigned_team=incident.assigned_team,
                source=incident.source or "MANAGER",
                source_metadata=incident.source_metadata,
            )
            db.add(db_incident)
            db.commit()
            db.refresh(db_incident)
            
            # Automatically create corresponding entry in Incident Log
            GuestSafetyService._create_incident_log_entry(db, db_incident, property_id, user_id)
            
            return GuestSafetyService._to_response(db_incident)
        finally:
            db.close()

    @staticmethod
    def _sync_incident_log_update(
        db: Session,
        guest_safety_incident: GuestSafetyIncident,
        updates: GuestSafetyIncidentUpdate
    ) -> None:
        """Update corresponding entry in Incident Log module"""
        try:
            # Find the incident log entry by idempotency key
            incident_log_entry = db.query(Incident).filter(
                Incident.idempotency_key == f"guest_safety_{guest_safety_incident.incident_id}"
            ).first()
            
            if not incident_log_entry:
                logger.warning(
                    f"Incident log entry not found for guest safety incident {guest_safety_incident.incident_id}",
                    extra={"guest_safety_incident_id": guest_safety_incident.incident_id}
                )
                return

            # Update fields that changed
            updates_dict = updates.dict(exclude_unset=True)
            
            if "severity" in updates_dict:
                incident_log_entry.severity = GuestSafetyService._map_severity_to_incident_severity(
                    updates_dict["severity"].value if hasattr(updates_dict["severity"], 'value') else str(updates_dict["severity"])
                )
            
            if "status" in updates_dict:
                incident_log_entry.status = GuestSafetyService._map_status_to_incident_status(updates_dict["status"])
            
            if "title" in updates_dict:
                incident_log_entry.title = updates_dict["title"]
            
            if "description" in updates_dict:
                incident_log_entry.description = updates_dict["description"]
            
            if "location" in updates_dict:
                location_dict: Dict[str, Any] = {
                    "address": updates_dict["location"],
                    "room_number": guest_safety_incident.room_number,
                }
                if guest_safety_incident.room_number:
                    location_dict["room"] = guest_safety_incident.room_number
                incident_log_entry.location = location_dict

            if "resolved_at" in updates_dict and updates_dict["resolved_at"]:
                incident_log_entry.resolved_at = updates_dict["resolved_at"]
                incident_log_entry.status = IncidentStatus.RESOLVED

            if "resolved_by" in updates_dict:
                # Note: Incident model doesn't have resolved_by, but we can track in metadata
                if not incident_log_entry.source_metadata:
                    incident_log_entry.source_metadata = {}
                incident_log_entry.source_metadata["resolved_by"] = updates_dict["resolved_by"]

            db.commit()
            logger.info(
                f"Updated incident log entry for guest safety incident {guest_safety_incident.incident_id}",
                extra={"guest_safety_incident_id": guest_safety_incident.incident_id}
            )
        except Exception as e:
            logger.error(
                f"Failed to update incident log entry for guest safety incident {guest_safety_incident.incident_id}: {e}",
                exc_info=True,
                extra={"guest_safety_incident_id": guest_safety_incident.incident_id}
            )
            db.rollback()

    @staticmethod
    def update_incident(incident_id: str, updates: GuestSafetyIncidentUpdate) -> GuestSafetyIncidentResponse:
        db = SessionLocal()
        try:
            incident = db.query(GuestSafetyIncident).filter(GuestSafetyIncident.incident_id == incident_id).first()
            if not incident:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

            for field, value in updates.dict(exclude_unset=True).items():
                setattr(incident, field, value)

            db.commit()
            db.refresh(incident)
            
            # Sync update to Incident Log
            GuestSafetyService._sync_incident_log_update(db, incident, updates)
            
            return GuestSafetyService._to_response(incident)
        finally:
            db.close()

    @staticmethod
    def delete_incident(incident_id: str) -> None:
        db = SessionLocal()
        try:
            incident = db.query(GuestSafetyIncident).filter(GuestSafetyIncident.incident_id == incident_id).first()
            if not incident:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
            db.delete(incident)
            db.commit()
        finally:
            db.close()

    @staticmethod
    def resolve_incident(incident_id: str, resolver_id: Optional[str] = None) -> GuestSafetyIncidentResponse:
        db = SessionLocal()
        try:
            incident = db.query(GuestSafetyIncident).filter(GuestSafetyIncident.incident_id == incident_id).first()
            if not incident:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
            incident.status = "resolved"
            incident.resolved_at = datetime.utcnow()
            incident.resolved_by = resolver_id
            db.commit()
            db.refresh(incident)
            
            # Sync resolution to Incident Log
            try:
                incident_log_entry = db.query(Incident).filter(
                    Incident.idempotency_key == f"guest_safety_{incident.incident_id}"
                ).first()
                
                if incident_log_entry:
                    incident_log_entry.status = IncidentStatus.RESOLVED
                    incident_log_entry.resolved_at = incident.resolved_at
                    if not incident_log_entry.source_metadata:
                        incident_log_entry.source_metadata = {}
                    incident_log_entry.source_metadata["resolved_by"] = resolver_id
                    db.commit()
                    logger.info(
                        f"Synced resolution to incident log for guest safety incident {incident.incident_id}",
                        extra={"guest_safety_incident_id": incident.incident_id}
                    )
            except Exception as e:
                logger.error(
                    f"Failed to sync resolution to incident log for guest safety incident {incident.incident_id}: {e}",
                    exc_info=True,
                    extra={"guest_safety_incident_id": incident.incident_id}
                )
                db.rollback()
            
            return GuestSafetyService._to_response(incident)
        finally:
            db.close()

    @staticmethod
    def get_teams(user_id: Optional[str] = None) -> List[GuestSafetyTeamResponse]:
        db = SessionLocal()
        try:
            property_id = GuestSafetyService._get_default_property_id(db, user_id)
            teams = db.query(GuestSafetyTeam).filter(GuestSafetyTeam.property_id == property_id).all()

            if not teams:
                default_teams = [
                    ("Security Team Alpha", "Security", "available", "SA"),
                    ("Medical Response", "Medical", "available", "MR"),
                    ("Guest Services", "Service", "available", "GS"),
                    ("Technical Support", "Maintenance", "available", "TS"),
                ]
                for name, role, status, avatar in default_teams:
                    team = GuestSafetyTeam(
                        property_id=property_id,
                        name=name,
                        role=role,
                        status=status,
                        avatar=avatar,
                    )
                    db.add(team)
                db.commit()
                teams = db.query(GuestSafetyTeam).filter(GuestSafetyTeam.property_id == property_id).all()

            return [
                GuestSafetyTeamResponse(
                    id=t.team_id,
                    name=t.name,
                    role=t.role,
                    status=t.status,
                    avatar=t.avatar,
                )
                for t in teams
            ]
        finally:
            db.close()

    @staticmethod
    def get_settings(user_id: Optional[str] = None) -> GuestSafetySettingsResponse:
        db = SessionLocal()
        try:
            property_id = GuestSafetyService._get_default_property_id(db, user_id)
            settings = db.query(GuestSafetySettings).filter(GuestSafetySettings.property_id == property_id).first()
            if not settings:
                settings = GuestSafetySettings(
                    property_id=property_id,
                    alert_threshold=5,
                    auto_escalation=True,
                    notification_channels={"inApp": True, "sms": True, "email": True},
                    response_team_assignment="automatic",
                )
                db.add(settings)
                db.commit()
                db.refresh(settings)
            return GuestSafetyService._settings_to_response(settings)
        finally:
            db.close()

    @staticmethod
    def update_settings(updates: GuestSafetySettingsUpdate, user_id: Optional[str] = None) -> GuestSafetySettingsResponse:
        db = SessionLocal()
        try:
            property_id = GuestSafetyService._get_default_property_id(db, user_id)
            settings = db.query(GuestSafetySettings).filter(GuestSafetySettings.property_id == property_id).first()
            if not settings:
                settings = GuestSafetySettings(property_id=property_id)
                db.add(settings)
                db.commit()
                db.refresh(settings)

            payload = updates.dict(exclude_unset=True)
            if "alertThreshold" in payload:
                settings.alert_threshold = payload["alertThreshold"]
            if "autoEscalation" in payload:
                settings.auto_escalation = payload["autoEscalation"]
            if "notificationChannels" in payload:
                settings.notification_channels = payload["notificationChannels"]
            if "responseTeamAssignment" in payload:
                settings.response_team_assignment = payload["responseTeamAssignment"]

            db.commit()
            db.refresh(settings)
            return GuestSafetyService._settings_to_response(settings)
        finally:
            db.close()

    @staticmethod
    def get_evacuation_check_ins(incident_id: str) -> List[Dict[str, Any]]:
        """Get evacuation check-ins for an incident"""
        db = SessionLocal()
        try:
            # Check-ins would be stored as messages or in a separate table
            # For now, return empty list - this would be implemented with actual check-in storage
            messages = db.query(GuestMessage).filter(
                GuestMessage.incident_id == incident_id,
                GuestMessage.message_type == 'emergency'
            ).all()
            
            check_ins = []
            for msg in messages:
                try:
                    metadata = json.loads(msg.source_metadata) if msg.source_metadata else {}
                    if metadata.get('check_in_status'):
                        check_ins.append({
                            'id': msg.id,
                            'guestId': msg.guest_id or '',
                            'guestName': msg.guest_name or 'Unknown',
                            'roomNumber': msg.room_number or '',
                            'status': metadata.get('check_in_status', 'safe'),
                            'checkedInAt': msg.created_at.isoformat() if hasattr(msg.created_at, 'isoformat') else str(msg.created_at),
                            'location': metadata.get('location'),
                            'notes': msg.message_text if len(msg.message_text) < 200 else None,
                        })
                except Exception as e:
                    logger.warning(f"Failed to parse check-in from message {msg.id}: {e}")
            
            return check_ins
        finally:
            db.close()

    @staticmethod
    def submit_evacuation_check_in(
        incident_id: str,
        guest_id: str,
        status: str = 'safe',
        location: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Submit evacuation check-in from guest app"""
        db = SessionLocal()
        try:
            # Create a guest message to store the check-in
            check_in_message = GuestMessage(
                id=str(uuid.uuid4()),
                incident_id=incident_id,
                guest_id=guest_id,
                message_text=notes or f"Guest checked in as {status}",
                message_type='emergency',
                direction='guest_to_staff',
                is_read=False,
                source='GUEST_APP',
                source_metadata=json.dumps({
                    'check_in_status': status,
                    'location': location,
                    'check_in_time': datetime.utcnow().isoformat()
                })
            )
            
            db.add(check_in_message)
            db.commit()
            db.refresh(check_in_message)
            
            # Get guest info from incident or message
            incident = db.query(GuestSafetyIncident).filter(GuestSafetyIncident.incident_id == incident_id).first()
            guest_name = 'Guest'
            room_number = ''
            
            if incident:
                # Try to extract guest info from incident metadata
                try:
                    metadata = json.loads(incident.metadata) if incident.metadata else {}
                    guest_name = metadata.get('guest_name', 'Guest')
                    room_number = metadata.get('room_number', '')
                except:
                    pass
            
            return {
                'id': check_in_message.id,
                'guestId': guest_id,
                'guestName': guest_name,
                'roomNumber': room_number,
                'status': status,
                'checkedInAt': check_in_message.created_at.isoformat() if hasattr(check_in_message.created_at, 'isoformat') else str(check_in_message.created_at),
                'location': location,
                'notes': notes,
            }
        finally:
            db.close()
