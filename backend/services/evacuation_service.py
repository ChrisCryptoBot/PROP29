"""
Evacuation Service
"""
from typing import Optional
from datetime import datetime
from database import SessionLocal
from models import EvacuationSession, EvacuationAction, EvacuationAssistance, EvacuationStatus, UserRole, Property
from schemas import (
    EvacuationStartRequest,
    EvacuationEndRequest,
    EvacuationAnnouncementRequest,
    EvacuationAssignAssistanceRequest,
    EvacuationCompleteAssistanceRequest,
    EvacuationSessionResponse,
    EvacuationActionResponse,
)
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

class EvacuationService:
    @staticmethod
    def _get_default_property_id(db, user_id: Optional[str]) -> Optional[str]:
        if user_id:
            role = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.is_active == True
            ).first()
            if role:
                return role.property_id

        prop = db.query(Property).filter(Property.is_active == True).first()
        if prop:
            return prop.property_id
        return None

    @staticmethod
    def _to_session_response(session: EvacuationSession) -> EvacuationSessionResponse:
        return EvacuationSessionResponse(
            session_id=session.session_id,
            property_id=session.property_id,
            status=session.status,
            started_at=session.started_at,
            ended_at=session.ended_at,
            initiated_by=session.initiated_by,
            completed_by=session.completed_by,
            notes=session.notes,
        )

    @staticmethod
    def get_active_session(user_id: Optional[str]) -> Optional[EvacuationSessionResponse]:
        db = SessionLocal()
        try:
            property_id = EvacuationService._get_default_property_id(db, user_id)
            if not property_id:
                return None
            session = db.query(EvacuationSession).filter(
                EvacuationSession.property_id == property_id,
                EvacuationSession.status == EvacuationStatus.ACTIVE
            ).first()
            if not session:
                return None
            return EvacuationService._to_session_response(session)
        finally:
            db.close()

    @staticmethod
    def start_evacuation(payload: EvacuationStartRequest, user_id: str) -> EvacuationSessionResponse:
        db = SessionLocal()
        try:
            property_id = EvacuationService._get_default_property_id(db, user_id)
            if not property_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No property assigned")

            existing = db.query(EvacuationSession).filter(
                EvacuationSession.property_id == property_id,
                EvacuationSession.status == EvacuationStatus.ACTIVE
            ).first()
            if existing:
                return EvacuationService._to_session_response(existing)

            session = EvacuationSession(
                property_id=property_id,
                status=EvacuationStatus.ACTIVE,
                started_at=datetime.utcnow(),
                initiated_by=user_id,
                notes=payload.notes,
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            return EvacuationService._to_session_response(session)
        finally:
            db.close()

    @staticmethod
    def end_evacuation(payload: EvacuationEndRequest, user_id: str) -> EvacuationSessionResponse:
        db = SessionLocal()
        try:
            property_id = EvacuationService._get_default_property_id(db, user_id)
            session = db.query(EvacuationSession).filter(
                EvacuationSession.property_id == property_id,
                EvacuationSession.status == EvacuationStatus.ACTIVE
            ).first()
            if not session:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active evacuation session")

            session.status = EvacuationStatus.COMPLETED
            session.ended_at = datetime.utcnow()
            session.completed_by = user_id
            if payload.notes:
                session.notes = payload.notes

            db.commit()
            db.refresh(session)
            return EvacuationService._to_session_response(session)
        finally:
            db.close()

    @staticmethod
    def log_action(action_type: str, payload: dict, user_id: str) -> EvacuationActionResponse:
        db = SessionLocal()
        try:
            property_id = EvacuationService._get_default_property_id(db, user_id)
            if not property_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No property assigned")
            session = db.query(EvacuationSession).filter(
                EvacuationSession.property_id == property_id,
                EvacuationSession.status == EvacuationStatus.ACTIVE
            ).first()

            action = EvacuationAction(
                session_id=session.session_id if session else None,
                action_type=action_type,
                payload=payload,
                created_by=user_id,
            )
            db.add(action)
            db.commit()
            db.refresh(action)
            return EvacuationActionResponse(
                action_id=action.action_id,
                session_id=action.session_id,
                action_type=action.action_type,
                payload=action.payload,
                created_at=action.created_at,
                created_by=action.created_by,
            )
        finally:
            db.close()

    @staticmethod
    def assign_assistance(payload: EvacuationAssignAssistanceRequest, user_id: str) -> EvacuationActionResponse:
        db = SessionLocal()
        try:
            assistance = EvacuationAssistance(
                session_id=payload.session_id,
                guest_name=payload.guest_name,
                room=payload.room,
                need=payload.need,
                priority=payload.priority,
                status="assigned",
                assigned_staff=payload.assigned_staff,
                notes=payload.notes,
            )
            db.add(assistance)
            db.commit()
            db.refresh(assistance)
            return EvacuationService.log_action(
                "assign_assistance",
                payload.dict(),
                user_id,
            )
        finally:
            db.close()

    @staticmethod
    def complete_assistance(payload: EvacuationCompleteAssistanceRequest, user_id: str) -> EvacuationActionResponse:
        db = SessionLocal()
        try:
            assistance = db.query(EvacuationAssistance).filter(
                EvacuationAssistance.assistance_id == payload.assistance_id
            ).first()
            if assistance:
                assistance.status = "completed"
                db.commit()
            return EvacuationService.log_action(
                "complete_assistance",
                payload.dict(),
                user_id,
            )
        finally:
            db.close()
