from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Incident, User, Property, UserRole, UserActivity
from schemas import (
    IncidentCreate, IncidentUpdate, IncidentResponse, 
    EmergencyAlertCreate, EmergencyAlertResponse,
    IncidentSettings, IncidentSettingsResponse,
    PatternRecognitionRequest, PatternRecognitionResponse, Pattern,
    ReportExportRequest, UserActivityResponse
)
from datetime import datetime, timedelta
import logging
from uuid import UUID
from services.ai_ml_service import get_llm_service
from io import BytesIO, StringIO
import csv
from collections import Counter, defaultdict

logger = logging.getLogger(__name__)

class IncidentService:
    @staticmethod
    async def get_incidents(
        user_id: str, 
        property_id: Optional[str] = None, 
        status: Optional[str] = None, 
        severity: Optional[str] = None
    ) -> List[IncidentResponse]:
        """Get incidents with optional filtering - Enforces property-level authorization"""
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
            query = db.query(Incident).filter(Incident.property_id.in_(user_property_ids))
            
            # Additional filters
            if property_id:
                # Verify user has access to requested property
                if property_id not in user_property_ids:
                    raise ValueError("Access denied to this property")
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
                    idempotency_key=incident.idempotency_key,
                    source=incident.source,
                    source_agent_id=incident.source_agent_id,
                    source_device_id=incident.source_device_id,
                    source_metadata=incident.source_metadata,
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
    async def create_incident(incident: IncidentCreate, user_id: str, use_ai_classification: bool = False) -> IncidentResponse:
        """Create a new incident with optional AI classification"""
        db = SessionLocal()
        try:
            # Use AI classification if requested and title/description provided
            ai_confidence = None
            if use_ai_classification and incident.description:
                try:
                    llm_service = get_llm_service()
                    ai_result = llm_service.classify_incident(
                        description=incident.description,
                        title=incident.title,
                        location=incident.location
                    )

                    # Log AI classification result
                    logger.info(f"AI Classification: {ai_result['incident_type']} ({ai_result['severity']}) "
                               f"with {ai_result['confidence']} confidence")

                    # Store AI confidence
                    ai_confidence = ai_result['confidence']

                    # If user didn't specify type/severity, use AI suggestions
                    # This allows manual override while still getting AI confidence
                    if not incident.incident_type or use_ai_classification:
                        # Use AI suggestion if confidence is high enough
                        if ai_result['confidence'] >= llm_service.confidence_threshold:
                            logger.info(f"Using AI suggested incident_type: {ai_result['incident_type']}")
                            # Note: We'll store the AI suggestion in a metadata field instead of overriding
                            # This preserves user choice while providing AI insights

                except Exception as e:
                    logger.error(f"AI classification failed, continuing without AI: {e}")
                    # Continue without AI - don't block incident creation

            agent_sources = {"agent", "device", "sensor"}
            status = "pending_review" if (incident.source or "").lower() in agent_sources else "open"

            if incident.idempotency_key:
                existing = db.query(Incident).filter(
                    Incident.property_id == str(incident.property_id),
                    Incident.idempotency_key == incident.idempotency_key
                ).first()
                if existing:
                    return IncidentResponse(
                        incident_id=existing.incident_id,
                        property_id=existing.property_id,
                        incident_type=existing.incident_type,
                        severity=existing.severity,
                        status=existing.status,
                        title=existing.title,
                        description=existing.description,
                        location=existing.location,
                        idempotency_key=existing.idempotency_key,
                        source=existing.source,
                        source_agent_id=existing.source_agent_id,
                        source_device_id=existing.source_device_id,
                        source_metadata=existing.source_metadata,
                        reported_by=existing.reported_by,
                        assigned_to=existing.assigned_to,
                        created_at=existing.created_at,
                        updated_at=existing.updated_at,
                        resolved_at=existing.resolved_at,
                        evidence=existing.evidence,
                        witnesses=existing.witnesses,
                        ai_confidence=existing.ai_confidence,
                        follow_up_required=existing.follow_up_required,
                        insurance_claim=existing.insurance_claim
                    )

            db_incident = Incident(
                property_id=incident.property_id,
                incident_type=incident.incident_type,
                severity=incident.severity,
                status=status,
                title=incident.title,
                description=incident.description,
                location=incident.location,
                reported_by=user_id,
                assigned_to=incident.assigned_to,
                evidence=incident.evidence,
                witnesses=incident.witnesses,
                ai_confidence=ai_confidence,
                idempotency_key=incident.idempotency_key,
                source=incident.source,
                source_agent_id=incident.source_agent_id,
                source_device_id=incident.source_device_id,
                source_metadata=incident.source_metadata
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
                idempotency_key=db_incident.idempotency_key,
                source=db_incident.source,
                source_agent_id=db_incident.source_agent_id,
                source_device_id=db_incident.source_device_id,
                source_metadata=db_incident.source_metadata,
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
    async def get_ai_classification_suggestion(title: str, description: str, location: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get AI classification suggestion without creating an incident"""
        try:
            llm_service = get_llm_service()
            result = llm_service.classify_incident(
                description=description,
                title=title,
                location=location
            )
            logger.info(f"AI Classification suggestion: {result}")
            return result
        except Exception as e:
            logger.error(f"Failed to get AI classification: {e}")
            return {
                "incident_type": "other",
                "severity": "medium",
                "confidence": 0.0,
                "reasoning": f"AI classification unavailable: {str(e)}",
                "fallback_used": True
            }
    
    @staticmethod
    async def get_incident(incident_id: str, user_id: str) -> IncidentResponse:
        """Get a specific incident - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
            if not incident:
                raise ValueError("Incident not found")
            
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]
            
            if incident.property_id not in user_property_ids:
                raise ValueError("Access denied to this incident")
            
            return IncidentResponse(
                incident_id=incident.incident_id,
                property_id=incident.property_id,
                incident_type=incident.incident_type,
                severity=incident.severity,
                status=incident.status,
                title=incident.title,
                description=incident.description,
                location=incident.location,
                idempotency_key=incident.idempotency_key,
                source=incident.source,
                source_agent_id=incident.source_agent_id,
                source_device_id=incident.source_device_id,
                source_metadata=incident.source_metadata,
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
    async def update_incident(
        incident_id: str,
        incident_update: IncidentUpdate,
        user_id: str,
        request_info: Optional[Dict[str, Any]] = None
    ) -> IncidentResponse:
        """Update an incident - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
            if not incident:
                raise ValueError("Incident not found")
            
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]
            
            if incident.property_id not in user_property_ids:
                raise ValueError("Access denied to this incident")
            
            previous_status = incident.status

            # Update fields
            update_data = incident_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(incident, field, value)
            
            incident.updated_at = datetime.utcnow()
            
            # If status is being set to resolved, set resolved_at
            if incident_update.status == "resolved" and not incident.resolved_at:
                incident.resolved_at = datetime.utcnow()

            # Activity logging for review actions/status changes
            if request_info and incident_update.status and previous_status != incident.status:
                action_type = "incident_status_change"
                if previous_status == "pending_review" and incident.status == "open":
                    action_type = "incident_review_approved"
                elif previous_status == "pending_review" and incident.status == "closed":
                    action_type = "incident_review_rejected"

                activity_metadata = {
                    "previous_status": previous_status,
                    "new_status": incident.status
                }
                rejection_reason = (incident_update.source_metadata or {}).get("rejection_reason")
                if rejection_reason:
                    activity_metadata["rejection_reason"] = rejection_reason

                db.add(UserActivity(
                    user_id=user_id,
                    property_id=incident.property_id,
                    action_type=action_type,
                    resource_type="incident",
                    resource_id=incident.incident_id,
                    activity_metadata=activity_metadata,
                    ip_address=request_info.get("ip_address", "0.0.0.0"),
                    user_agent=request_info.get("user_agent", "unknown"),
                    session_id=request_info.get("session_id")
                ))
            
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
                idempotency_key=incident.idempotency_key,
                source=incident.source,
                source_agent_id=incident.source_agent_id,
                source_device_id=incident.source_device_id,
                source_metadata=incident.source_metadata,
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
        """Delete an incident - Enforces property-level authorization"""
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
            if not incident:
                raise ValueError("Incident not found")
            
            # Check property access
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]
            
            if incident.property_id not in user_property_ids:
                raise ValueError("Access denied to this incident")
            
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

    @staticmethod
    async def get_incident_activity(incident_id: str, user_id: str) -> List[UserActivityResponse]:
        """Get activity timeline for an incident"""
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
            if not incident:
                raise ValueError("Incident not found")

            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]

            if incident.property_id not in user_property_ids:
                raise ValueError("Access denied to this incident")

            activities = db.query(UserActivity).filter(
                UserActivity.resource_type == "incident",
                UserActivity.resource_id == incident_id
            ).order_by(UserActivity.timestamp.desc()).all()

            return [
                UserActivityResponse(
                    activity_id=activity.activity_id,
                    user_id=activity.user_id,
                    property_id=activity.property_id,
                    action_type=activity.action_type,
                    resource_type=activity.resource_type,
                    resource_id=activity.resource_id,
                    activity_metadata=activity.activity_metadata,
                    timestamp=activity.timestamp,
                    ip_address=activity.ip_address,
                    user_agent=activity.user_agent,
                    session_id=activity.session_id,
                    duration=activity.duration,
                    user_name=f"{activity.user.first_name} {activity.user.last_name}" if activity.user else None,
                    property_name=activity.property.property_name if activity.property else None
                )
                for activity in activities
            ]
        finally:
            db.close()

    @staticmethod
    async def get_pattern_recognition(
        user_id: str,
        request: PatternRecognitionRequest
    ) -> PatternRecognitionResponse:
        """Generate lightweight pattern recognition from incident history"""
        db = SessionLocal()
        try:
            user_roles = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).all()
            user_property_ids = [role.property_id for role in user_roles]

            if not user_property_ids:
                return PatternRecognitionResponse(patterns=[], generated_at=datetime.utcnow(), time_range=request.time_range or "all")

            query = db.query(Incident).filter(Incident.property_id.in_(user_property_ids))
            if request.property_id:
                if request.property_id not in user_property_ids:
                    raise ValueError("Access denied to this property")
                query = query.filter(Incident.property_id == request.property_id)

            if request.time_range:
                time_map = {"7d": 7, "30d": 30, "90d": 90}
                days = time_map.get(request.time_range, 30)
                query = query.filter(Incident.created_at >= datetime.utcnow() - timedelta(days=days))

            incidents = query.all()
            if not incidents:
                return PatternRecognitionResponse(patterns=[], generated_at=datetime.utcnow(), time_range=request.time_range or "all")

            type_counts = Counter([incident.incident_type for incident in incidents])
            severity_counts = Counter([incident.severity for incident in incidents])
            location_counts = Counter([
                incident.location.get("area") if isinstance(incident.location, dict) else incident.location
                for incident in incidents
            ])

            patterns: List[Pattern] = []
            if type_counts:
                top_type, top_type_count = type_counts.most_common(1)[0]
                patterns.append(Pattern(
                    type="incident_type",
                    confidence=min(1.0, top_type_count / max(len(incidents), 1)),
                    insight=f"Most common incident type is {top_type} ({top_type_count} reports).",
                    recommendations=["Increase monitoring in high-incident categories."],
                    affected_incidents=[str(inc.incident_id) for inc in incidents if inc.incident_type == top_type][:10]
                ))

            if severity_counts:
                top_severity, top_severity_count = severity_counts.most_common(1)[0]
                patterns.append(Pattern(
                    type="severity_trend",
                    confidence=min(1.0, top_severity_count / max(len(incidents), 1)),
                    insight=f"Severity trend leans {top_severity} ({top_severity_count} reports).",
                    recommendations=["Review response protocols for dominant severity levels."],
                    affected_incidents=[str(inc.incident_id) for inc in incidents if inc.severity == top_severity][:10]
                ))

            if location_counts:
                top_location, top_location_count = location_counts.most_common(1)[0]
                if top_location:
                    patterns.append(Pattern(
                        type="location_pattern",
                        confidence=min(1.0, top_location_count / max(len(incidents), 1)),
                        insight=f"Hotspot detected at {top_location} ({top_location_count} reports).",
                        recommendations=["Increase patrols in hotspot areas."],
                        affected_incidents=[str(inc.incident_id) for inc in incidents if (inc.location.get("area") if isinstance(inc.location, dict) else inc.location) == top_location][:10]
                    ))

            return PatternRecognitionResponse(
                patterns=patterns,
                generated_at=datetime.utcnow(),
                time_range=request.time_range or "all"
            )
        finally:
            db.close()