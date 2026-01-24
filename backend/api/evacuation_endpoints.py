from fastapi import APIRouter, Depends, HTTPException
from schemas import (
    EvacuationStartRequest,
    EvacuationEndRequest,
    EvacuationAnnouncementRequest,
    EvacuationAssignAssistanceRequest,
    EvacuationCompleteAssistanceRequest,
    EvacuationSessionResponse,
    EvacuationActionResponse,
)
from api.auth_dependencies import require_security_manager_or_admin
from services.evacuation_service import EvacuationService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/evacuation", tags=["Evacuation"])

@router.post("/start", response_model=EvacuationSessionResponse)
def start_evacuation(payload: EvacuationStartRequest, current_user=Depends(require_security_manager_or_admin)):
    return EvacuationService.start_evacuation(payload, str(current_user.user_id))

@router.post("/end", response_model=EvacuationSessionResponse)
def end_evacuation(payload: EvacuationEndRequest, current_user=Depends(require_security_manager_or_admin)):
    return EvacuationService.end_evacuation(payload, str(current_user.user_id))

@router.get("/status", response_model=EvacuationSessionResponse | None)
def get_status(current_user=Depends(require_security_manager_or_admin)):
    return EvacuationService.get_active_session(str(current_user.user_id))

@router.post("/actions/announcement", response_model=EvacuationActionResponse)
def send_announcement(payload: EvacuationAnnouncementRequest, current_user=Depends(require_security_manager_or_admin)):
    return EvacuationService.log_action("announcement", payload.dict(), str(current_user.user_id))

@router.post("/actions/unlock-exits", response_model=EvacuationActionResponse)
def unlock_exits(current_user=Depends(require_security_manager_or_admin)):
    return EvacuationService.log_action("unlock_exits", {}, str(current_user.user_id))

@router.post("/actions/contact-emergency", response_model=EvacuationActionResponse)
def contact_emergency(current_user=Depends(require_security_manager_or_admin)):
    return EvacuationService.log_action("contact_emergency", {}, str(current_user.user_id))

@router.post("/actions/notify-guests", response_model=EvacuationActionResponse)
def notify_guests(current_user=Depends(require_security_manager_or_admin)):
    return EvacuationService.log_action("notify_guests", {}, str(current_user.user_id))

@router.post("/assistance/assign", response_model=EvacuationActionResponse)
def assign_assistance(payload: EvacuationAssignAssistanceRequest, current_user=Depends(require_security_manager_or_admin)):
    return EvacuationService.assign_assistance(payload, str(current_user.user_id))

@router.post("/assistance/complete", response_model=EvacuationActionResponse)
def complete_assistance(payload: EvacuationCompleteAssistanceRequest, current_user=Depends(require_security_manager_or_admin)):
    return EvacuationService.complete_assistance(payload, str(current_user.user_id))
