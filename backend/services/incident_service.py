from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Incident, User, Property
from schemas import IncidentCreate, IncidentUpdate, IncidentResponse, EmergencyAlertCreate, EmergencyAlertResponse
from datetime import datetime
import logging
from uuid import UUID

logger = logging.getLogger(__name__)

class IncidentService:
    @staticmethod
    async def get_incidents(
        user_id: str, 
        property_id: Optional[str] = None, 
        status: Optional[str] = None, 
        severity: Optional[str] = None
    ) -> List[IncidentResponse]:
        """Get incidents with optional filtering"""
        db = SessionLocal()
        try:
            query = db.query(Incident)
            
            if property_id:
                query = query.filter(Incident.property_id == property_id)
            if status:
                query = query.filter(Incident.status == status)
            if severity:
                query = query.filter(Incident.severity == severity)
            
            incidents = query.order_by(Incident.created_at.desc()).all()
            
            return [
                IncidentResponse(
                    incident_id=incident.incident_id,
                    property_id=incident.property_id,
                    incident_type=incident.incident_type,
                    severity=incident.severity,
                    status=incident.status,
                    title=incident.title,
                    description=incident.description,
                    location=incident.location,
                    reported_by=incident.reported_by,
                    assigned_to=incident.assigned_to,
                    created_at=incident.created_at,
                    updated_at=incident.updated_at,
                    resolved_at=incident.resolved_at,
                    evidence=incident.evidence,
                    witnesses=incident.witnesses,
                    ai_confidence=incident.ai_confidence,
                    follow_up_required=incident.follow_up_required,
                    insurance_claim=incident.insurance_claim,
                    reporter_name=f"{incident.reporter.first_name} {incident.reporter.last_name}" if incident.reporter else None,
                    assignee_name=f"{incident.assignee.first_name} {incident.assignee.last_name}" if incident.assignee else None,
                    property_name=incident.property.property_name if incident.property else None
                )
                for incident in incidents
            ]
        finally:
            db.close()
    
    @staticmethod
    async def create_incident(incident: IncidentCreate, user_id: str) -> IncidentResponse:
        """Create a new incident"""
        db = SessionLocal()
        try:
            db_incident = Incident(
                property_id=incident.property_id,
                incident_type=incident.incident_type,
                severity=incident.severity,
                title=incident.title,
                description=incident.description,
                location=incident.location,
                reported_by=user_id,
                assigned_to=incident.assigned_to,
                evidence=incident.evidence,
                witnesses=incident.witnesses
            )
            
            db.add(db_incident)
            db.commit()
            db.refresh(db_incident)
            
            return IncidentResponse(
                incident_id=db_incident.incident_id,
                property_id=db_incident.property_id,
                incident_type=db_incident.incident_type,
                severity=db_incident.severity,
                status=db_incident.status,
                title=db_incident.title,
                description=db_incident.description,
                location=db_incident.location,
                reported_by=db_incident.reported_by,
                assigned_to=db_incident.assigned_to,
                created_at=db_incident.created_at,
                updated_at=db_incident.updated_at,
                resolved_at=db_incident.resolved_at,
                evidence=db_incident.evidence,
                witnesses=db_incident.witnesses,
                ai_confidence=db_incident.ai_confidence,
                follow_up_required=db_incident.follow_up_required,
                insurance_claim=db_incident.insurance_claim
            )
        finally:
            db.close()
    
    @staticmethod
    async def get_incident(incident_id: str, user_id: str) -> IncidentResponse:
        """Get a specific incident"""
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
            if not incident:
                raise ValueError("Incident not found")
            
            return IncidentResponse(
                incident_id=incident.incident_id,
                property_id=incident.property_id,
                incident_type=incident.incident_type,
                severity=incident.severity,
                status=incident.status,
                title=incident.title,
                description=incident.description,
                location=incident.location,
                reported_by=incident.reported_by,
                assigned_to=incident.assigned_to,
                created_at=incident.created_at,
                updated_at=incident.updated_at,
                resolved_at=incident.resolved_at,
                evidence=incident.evidence,
                witnesses=incident.witnesses,
                ai_confidence=incident.ai_confidence,
                follow_up_required=incident.follow_up_required,
                insurance_claim=incident.insurance_claim,
                reporter_name=f"{incident.reporter.first_name} {incident.reporter.last_name}" if incident.reporter else None,
                assignee_name=f"{incident.assignee.first_name} {incident.assignee.last_name}" if incident.assignee else None,
                property_name=incident.property.property_name if incident.property else None
            )
        finally:
            db.close()
    
    @staticmethod
    async def update_incident(incident_id: str, incident_update: IncidentUpdate, user_id: str) -> IncidentResponse:
        """Update an incident"""
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
            if not incident:
                raise ValueError("Incident not found")
            
            # Update fields
            update_data = incident_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(incident, field, value)
            
            incident.updated_at = datetime.utcnow()
            
            # If status is being set to resolved, set resolved_at
            if incident_update.status == "resolved" and not incident.resolved_at:
                incident.resolved_at = datetime.utcnow()
            
            db.commit()
            db.refresh(incident)
            
            return IncidentResponse(
                incident_id=incident.incident_id,
                property_id=incident.property_id,
                incident_type=incident.incident_type,
                severity=incident.severity,
                status=incident.status,
                title=incident.title,
                description=incident.description,
                location=incident.location,
                reported_by=incident.reported_by,
                assigned_to=incident.assigned_to,
                created_at=incident.created_at,
                updated_at=incident.updated_at,
                resolved_at=incident.resolved_at,
                evidence=incident.evidence,
                witnesses=incident.witnesses,
                ai_confidence=incident.ai_confidence,
                follow_up_required=incident.follow_up_required,
                insurance_claim=incident.insurance_claim
            )
        finally:
            db.close()
    
    @staticmethod
    async def delete_incident(incident_id: str, user_id: str) -> Dict[str, str]:
        """Delete an incident"""
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
            if not incident:
                raise ValueError("Incident not found")
            
            db.delete(incident)
            db.commit()
            
            return {"message": "Incident deleted successfully"}
        finally:
            db.close()
    
    @staticmethod
    async def create_emergency_alert(alert: EmergencyAlertCreate, user_id: str) -> EmergencyAlertResponse:
        """Create an emergency alert"""
        db = SessionLocal()
        try:
            # Create incident for emergency alert
            incident = Incident(
                property_id=alert.property_id,
                incident_type="other",  # Emergency alerts are typically "other"
                severity=alert.severity,
                title=f"EMERGENCY: {alert.alert_type}",
                description=alert.description,
                location=alert.location,
                reported_by=user_id,
                status="open"
            )
            
            db.add(incident)
            db.commit()
            db.refresh(incident)
            
            # In a real implementation, you would:
            # 1. Send notifications to all security staff
            # 2. Contact emergency services if requested
            # 3. Trigger alarms and lockdown procedures
            # 4. Send mass notifications to guests
            
            return EmergencyAlertResponse(
                alert_id=incident.incident_id,
                property_id=incident.property_id,
                alert_type=alert.alert_type,
                location=alert.location,
                description=alert.description,
                severity=alert.severity,
                status="active",
                created_at=incident.created_at,
                emergency_services_contacted=alert.contact_emergency_services,
                response_time=None
            )
        finally:
            db.close() 