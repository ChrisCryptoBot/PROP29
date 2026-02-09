"""
Mobile Agent Service
Handles persistence and business logic for mobile agent data.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import json
import uuid
import logging

from sqlalchemy.orm import Session
from sqlalchemy import and_

from models import PatrolSubmission, MobileIncidentReport, AgentLocation, AgentStatus
from schemas import (
    PatrolSubmissionResponse,
    MobileIncidentReportResponse,
    AgentLocationResponse,
    AgentStatusResponse,
)

logger = logging.getLogger(__name__)


class MobileAgentService:
    """Service for mobile agent data operations."""

    @staticmethod
    def create_patrol_submission(
        db: Session,
        agent_id: str,
        patrol_id: str,
        location_data: Dict[str, Any],
        observations: Dict[str, Any],
        photo_files: Optional[List[Dict[str, Any]]] = None,
        user_id: Optional[str] = None,
    ) -> PatrolSubmissionResponse:
        """Create a new patrol submission record."""
        submission_id = str(uuid.uuid4())
        submission = PatrolSubmission(
            submission_id=submission_id,
            agent_id=agent_id,
            patrol_id=patrol_id,
            location_latitude=location_data.get("latitude"),
            location_longitude=location_data.get("longitude"),
            location_accuracy=location_data.get("accuracy"),
            location_address=location_data.get("address"),
            observations=json.dumps(observations) if observations else None,
            photo_count=len(photo_files) if photo_files else 0,
            photo_files=json.dumps(photo_files) if photo_files else None,
            status="received",
            user_id=user_id,
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        logger.info("Patrol submission created: %s from agent %s", submission_id, agent_id)
        return PatrolSubmissionResponse(
            submission_id=submission.submission_id,
            agent_id=submission.agent_id,
            patrol_id=submission.patrol_id,
            timestamp=submission.timestamp,
            location_latitude=submission.location_latitude,
            location_longitude=submission.location_longitude,
            location_address=submission.location_address,
            observations=json.loads(submission.observations) if submission.observations else None,
            photo_count=submission.photo_count,
            photo_files=json.loads(submission.photo_files) if submission.photo_files else None,
            status=submission.status,
            processed_at=submission.processed_at,
        )

    @staticmethod
    def get_patrol_submissions(
        db: Session,
        agent_id: Optional[str] = None,
        patrol_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[PatrolSubmissionResponse]:
        """Get patrol submissions with optional filtering."""
        query = db.query(PatrolSubmission)
        if agent_id:
            query = query.filter(PatrolSubmission.agent_id == agent_id)
        if patrol_id:
            query = query.filter(PatrolSubmission.patrol_id == patrol_id)
        submissions = query.order_by(PatrolSubmission.timestamp.desc()).offset(offset).limit(limit).all()
        return [
            PatrolSubmissionResponse(
                submission_id=s.submission_id,
                agent_id=s.agent_id,
                patrol_id=s.patrol_id,
                timestamp=s.timestamp,
                location_latitude=s.location_latitude,
                location_longitude=s.location_longitude,
                location_address=s.location_address,
                observations=json.loads(s.observations) if s.observations else None,
                photo_count=s.photo_count,
                photo_files=json.loads(s.photo_files) if s.photo_files else None,
                status=s.status,
                processed_at=s.processed_at,
            )
            for s in submissions
        ]

    @staticmethod
    def create_incident_report(
        db: Session,
        agent_id: str,
        incident_type: str,
        severity: str,
        description: str,
        location_data: Dict[str, Any],
        evidence_files: Optional[List[Dict[str, Any]]] = None,
        guest_safety_incident_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> MobileIncidentReportResponse:
        """Create a new incident report record."""
        incident_id = str(uuid.uuid4())
        report = MobileIncidentReport(
            incident_id=incident_id,
            agent_id=agent_id,
            incident_type=incident_type,
            severity=severity,
            description=description,
            location_latitude=location_data.get("latitude"),
            location_longitude=location_data.get("longitude"),
            location_address=location_data.get("address"),
            location_room=location_data.get("room"),
            status="open",
            evidence_files=json.dumps(evidence_files) if evidence_files else None,
            follow_up_required=severity in ["high", "critical"],
            guest_safety_incident_id=guest_safety_incident_id,
            user_id=user_id,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        logger.info("Incident report created: %s from agent %s", incident_id, agent_id)
        return MobileIncidentReportResponse(
            incident_id=report.incident_id,
            agent_id=report.agent_id,
            incident_type=report.incident_type,
            severity=report.severity,
            description=report.description,
            location_latitude=report.location_latitude,
            location_longitude=report.location_longitude,
            location_address=report.location_address,
            location_room=report.location_room,
            timestamp=report.timestamp,
            status=report.status,
            evidence_files=json.loads(report.evidence_files) if report.evidence_files else None,
            follow_up_required=report.follow_up_required,
            guest_safety_incident_id=report.guest_safety_incident_id,
        )

    @staticmethod
    def get_incident_reports(
        db: Session,
        agent_id: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[MobileIncidentReportResponse]:
        """Get incident reports with optional filtering."""
        query = db.query(MobileIncidentReport)
        if agent_id:
            query = query.filter(MobileIncidentReport.agent_id == agent_id)
        if severity:
            query = query.filter(MobileIncidentReport.severity == severity)
        if status:
            query = query.filter(MobileIncidentReport.status == status)
        reports = query.order_by(MobileIncidentReport.timestamp.desc()).offset(offset).limit(limit).all()
        return [
            MobileIncidentReportResponse(
                incident_id=r.incident_id,
                agent_id=r.agent_id,
                incident_type=r.incident_type,
                severity=r.severity,
                description=r.description,
                location_latitude=r.location_latitude,
                location_longitude=r.location_longitude,
                location_address=r.location_address,
                location_room=r.location_room,
                timestamp=r.timestamp,
                status=r.status,
                evidence_files=json.loads(r.evidence_files) if r.evidence_files else None,
                follow_up_required=r.follow_up_required,
                guest_safety_incident_id=r.guest_safety_incident_id,
            )
            for r in reports
        ]

    @staticmethod
    def update_agent_location(
        db: Session,
        agent_id: str,
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None,
        altitude: Optional[float] = None,
        speed: Optional[float] = None,
        heading: Optional[float] = None,
    ) -> AgentLocationResponse:
        """Record agent location update."""
        timestamp = datetime.now(timezone.utc)
        location = AgentLocation(
            agent_id=agent_id,
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy,
            altitude=altitude,
            speed=speed,
            heading=heading,
            timestamp=timestamp,
        )
        db.add(location)
        agent_status = db.query(AgentStatus).filter(AgentStatus.agent_id == agent_id).first()
        if agent_status:
            agent_status.last_seen = timestamp
            agent_status.current_latitude = latitude
            agent_status.current_longitude = longitude
            agent_status.status = "active"
            agent_status.updated_at = timestamp
        else:
            agent_status = AgentStatus(
                agent_id=agent_id,
                last_seen=timestamp,
                current_latitude=latitude,
                current_longitude=longitude,
                status="active",
            )
            db.add(agent_status)
        db.commit()
        return AgentLocationResponse(
            agent_id=agent_id,
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy,
            altitude=altitude,
            speed=speed,
            heading=heading,
            timestamp=timestamp,
        )

    @staticmethod
    def get_agent_location_history(
        db: Session,
        agent_id: str,
        hours: int = 24,
    ) -> List[AgentLocationResponse]:
        """Get location history for an agent."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        locations = (
            db.query(AgentLocation)
            .filter(and_(AgentLocation.agent_id == agent_id, AgentLocation.timestamp > cutoff))
            .order_by(AgentLocation.timestamp.desc())
            .all()
        )
        return [
            AgentLocationResponse(
                agent_id=loc.agent_id,
                latitude=loc.latitude,
                longitude=loc.longitude,
                accuracy=loc.accuracy,
                altitude=loc.altitude,
                speed=loc.speed,
                heading=loc.heading,
                timestamp=loc.timestamp,
            )
            for loc in locations
        ]

    @staticmethod
    def get_all_agent_status(db: Session) -> List[AgentStatusResponse]:
        """Get status of all agents."""
        statuses = db.query(AgentStatus).all()
        return [
            AgentStatusResponse(
                agent_id=s.agent_id,
                last_seen=s.last_seen,
                current_latitude=s.current_latitude,
                current_longitude=s.current_longitude,
                status=s.status,
                battery_level=s.battery_level,
                app_version=s.app_version,
            )
            for s in statuses
        ]

    @staticmethod
    def cleanup_old_locations(db: Session, retention_hours: int = 168) -> int:
        """Clean up location records older than retention period (default 7 days)."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=retention_hours)
        deleted = db.query(AgentLocation).filter(AgentLocation.timestamp < cutoff).delete()
        db.commit()
        logger.info("Cleaned up %s old agent location records", deleted)
        return deleted
