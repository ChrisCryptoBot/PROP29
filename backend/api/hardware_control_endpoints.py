from fastapi import APIRouter, Depends

from api.auth_dependencies import require_security_manager_or_admin
from services.hardware_control_service import HardwareControlService
from schemas import LockerReleaseRequest, LockerReleaseResponse

router = APIRouter(prefix="/hardware", tags=["Hardware Control"])

@router.post("/lockers/{locker_id}/release", response_model=LockerReleaseResponse)
def release_locker(
    locker_id: str,
    payload: LockerReleaseRequest,
    current_user=Depends(require_security_manager_or_admin),
):
    service = HardwareControlService()
    try:
        result = service.release_smart_locker(locker_id, str(current_user.user_id), reason=payload.reason)
        return LockerReleaseResponse(**result)
    finally:
        service.close()
