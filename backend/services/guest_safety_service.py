"""
Guest Safety Service for PROPER 2.9
Handles Guest Safety incident workflows for admin UI
"""

from typing import List, Optional
from datetime import datetime
from database import SessionLocal
from models import GuestSafetyIncident, GuestSafetyTeam, GuestSafetySettings, UserRole, Property
from schemas import (
    GuestSafetyIncidentCreate,
    GuestSafetyIncidentUpdate,
    GuestSafetyIncidentResponse,
    GuestSafetyTeamResponse,
    GuestSafetySettingsUpdate,
    GuestSafetySettingsResponse,
)
from fastapi import HTTPException, status
import logging

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
    def _to_response(incident: GuestSafetyIncident) -> GuestSafetyIncidentResponse:
        return GuestSafetyIncidentResponse(
            id=incident.incident_id,
            title=incident.title,
            description=incident.description,
            location=incident.location,
            severity=incident.severity,
            status=incident.status,
            reported_by=incident.reported_by,
            reported_at=incident.reported_at,
            resolved_at=incident.resolved_at,
            resolved_by=incident.resolved_by,
            guest_involved=incident.guest_involved,
            room_number=incident.room_number,
            contact_info=incident.contact_info,
            assigned_team=incident.assigned_team,
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
            )
            db.add(db_incident)
            db.commit()
            db.refresh(db_incident)
            return GuestSafetyService._to_response(db_incident)
        finally:
            db.close()

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
