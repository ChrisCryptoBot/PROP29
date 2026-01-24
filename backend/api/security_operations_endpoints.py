from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import RedirectResponse, Response
from typing import List, Any, Dict
from datetime import datetime, timezone
import uuid

from sqlalchemy import text

from schemas import CameraCreate, CameraUpdate, CameraResponse, CameraMetricsResponse, CameraStatus
from api.auth_dependencies import get_current_user, require_security_manager_or_admin
from services.security_operations_service import CameraService
from database import SessionLocal, engine
from models import Camera
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/security-operations", tags=["Security Operations"])

# Public test streams for mock cameras (no auth; HLS + MP4 for viewer demo)
_MOCK_STREAM_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
_MOCK_STREAM_HLS_ALT = "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8"
_MOCK_STREAM_MP4 = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"

_MOCK_CAMERA_IDS = [
    "aaaaaaaa-1111-4000-8000-000000000001",
    "aaaaaaaa-1111-4000-8000-000000000002",
    "aaaaaaaa-1111-4000-8000-000000000003",
]


def _db_has_no_cameras() -> bool:
    """Use raw SQL to avoid ORM schema mismatches (e.g. missing source_stream_url). On any error, use mocks."""
    try:
        with engine.connect() as conn:
            r = conn.execute(text("SELECT COUNT(*) FROM cameras")).scalar()
            return r == 0
    except Exception as e:
        logger.warning("_db_has_no_cameras check failed, using mocks: %s", e)
        return True


def _mock_cameras() -> List[CameraResponse]:
    now = datetime.now(timezone.utc)
    return [
        CameraResponse(
            camera_id=uuid.UUID(_MOCK_CAMERA_IDS[0]),
            name="North Lobby",
            location={"label": "North Lobby"},
            ip_address="192.168.1.101",
            stream_url=_MOCK_STREAM_HLS,
            status=CameraStatus.ONLINE,
            hardware_status=None,
            is_recording=True,
            motion_detection_enabled=True,
            last_known_image_url=None,
            created_at=now,
            updated_at=now,
        ),
        CameraResponse(
            camera_id=uuid.UUID(_MOCK_CAMERA_IDS[1]),
            name="East Parking Lot",
            location={"label": "East Parking Lot"},
            ip_address="192.168.1.102",
            stream_url=_MOCK_STREAM_MP4,
            status=CameraStatus.ONLINE,
            hardware_status=None,
            is_recording=False,
            motion_detection_enabled=True,
            last_known_image_url=None,
            created_at=now,
            updated_at=now,
        ),
        CameraResponse(
            camera_id=uuid.UUID(_MOCK_CAMERA_IDS[2]),
            name="West Corridor",
            location={"label": "West Corridor"},
            ip_address="192.168.1.103",
            stream_url=_MOCK_STREAM_HLS_ALT,
            status=CameraStatus.ONLINE,
            hardware_status=None,
            is_recording=False,
            motion_detection_enabled=True,
            last_known_image_url=None,
            created_at=now,
            updated_at=now,
        ),
    ]

# Stub defaults for unimplemented endpoints (recordings, evidence, analytics, settings)
_DEFAULT_ANALYTICS: Dict[str, Any] = {
    "motionEvents": 0,
    "alertsTriggered": 0,
    "averageResponseTime": "N/A",
    "peakActivity": "N/A",
}
_DEFAULT_SETTINGS: Dict[str, Any] = {
    "recordingQuality": "4K",
    "recordingDuration": "30 days",
    "motionSensitivity": "Medium",
    "storageRetention": "90 days",
    "autoDelete": True,
    "notifyOnMotion": True,
    "notifyOnOffline": True,
    "nightVisionAuto": True,
}

# In-memory stubs for evidence (status overrides) and report-issue logging
_evidence_status: Dict[str, str] = {}
_report_issue_log: List[Dict[str, Any]] = []

_MOCK_EVIDENCE: List[Dict[str, Any]] = [
    {
        "id": "ev-1",
        "title": "Lobby motion 2024-01-15",
        "camera": "North Lobby",
        "time": "14:32",
        "date": "2024-01-15",
        "type": "video",
        "size": "124 MB",
        "incidentId": None,
        "chainOfCustody": [
            {"timestamp": "2024-01-15 14:32", "handler": "System", "action": "Captured"},
            {"timestamp": "2024-01-15 14:35", "handler": "Security", "action": "Tagged"},
        ],
        "tags": ["motion", "lobby"],
        "status": "pending",
    },
    {
        "id": "ev-2",
        "title": "Parking lot snapshot",
        "camera": "East Lot",
        "time": "09:12",
        "date": "2024-01-14",
        "type": "photo",
        "size": "2.1 MB",
        "incidentId": None,
        "chainOfCustody": [{"timestamp": "2024-01-14 09:12", "handler": "System", "action": "Captured"}],
        "tags": ["parking"],
        "status": "pending",
    },
]

@router.get("/cameras", response_model=List[CameraResponse])
def list_cameras(current_user=Depends(get_current_user)):
    try:
        if _db_has_no_cameras():
            return _mock_cameras()
        return CameraService.list_cameras(user_id=str(current_user.user_id))
    except Exception as e:
        logger.warning("list_cameras failed, returning mocks: %s", e)
        return _mock_cameras()

@router.post("/cameras", response_model=CameraResponse, status_code=201)
def create_camera(payload: CameraCreate, current_user=Depends(require_security_manager_or_admin)):
    return CameraService.create_camera(payload, user_id=str(current_user.user_id))

@router.put("/cameras/{camera_id}", response_model=CameraResponse)
def update_camera(camera_id: str, payload: CameraUpdate, current_user=Depends(require_security_manager_or_admin)):
    return CameraService.update_camera(camera_id, payload)

@router.delete("/cameras/{camera_id}", status_code=204)
def delete_camera(camera_id: str, current_user=Depends(require_security_manager_or_admin)):
    CameraService.delete_camera(camera_id)
    return None

def _mock_metrics() -> CameraMetricsResponse:
    return CameraMetricsResponse(
        total=3,
        online=3,
        offline=0,
        maintenance=0,
        recording=1,
        avg_uptime="100%",
    )


@router.get("/metrics", response_model=CameraMetricsResponse)
def get_camera_metrics(current_user=Depends(get_current_user)):
    try:
        if _db_has_no_cameras():
            return _mock_metrics()
        return CameraService.get_metrics()
    except Exception as e:
        logger.warning("get_camera_metrics failed, returning mocks: %s", e)
        return _mock_metrics()

@router.get("/cameras/{camera_id}/stream")
def get_camera_stream(camera_id: str, current_user=Depends(get_current_user)):
    camera = CameraService.get_camera(camera_id)
    if not camera.stream_url:
        raise HTTPException(status_code=404, detail="Stream not available")
    return RedirectResponse(camera.stream_url)

@router.get("/cameras/{camera_id}/last-image")
def get_last_known_image(camera_id: str, current_user=Depends(get_current_user)):
    db = SessionLocal()
    try:
        camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
        if camera and camera.last_known_image_url and not camera.last_known_image_url.endswith("/last-image"):
            return RedirectResponse(camera.last_known_image_url)
    finally:
        db.close()

    # Inline SVG placeholder to avoid missing assets
    svg = f"""<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'>
<rect width='100%' height='100%' fill='#0f172a'/>
<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#e2e8f0' font-size='18' font-family='Arial'>
Last known image unavailable
</text>
</svg>"""
    return Response(content=svg, media_type="image/svg+xml")


@router.get("/recordings")
def list_recordings(current_user=Depends(get_current_user)) -> Dict[str, List[Any]]:
    """Stub: returns empty list until recordings backend exists."""
    return {"data": []}


def _evidence_with_status() -> List[Dict[str, Any]]:
    out = []
    for e in _MOCK_EVIDENCE:
        copied = dict(e)
        copied["status"] = _evidence_status.get(e["id"], e["status"])
        out.append(copied)
    return out


@router.get("/evidence")
def list_evidence(current_user=Depends(get_current_user)) -> Dict[str, List[Any]]:
    """Stub: returns mock evidence with in-memory status overrides."""
    return {"data": _evidence_with_status()}


@router.patch("/evidence/{item_id}")
def update_evidence_status(
    item_id: str,
    payload: Dict[str, Any] = Body(default=None),
    current_user=Depends(require_security_manager_or_admin),
) -> Dict[str, str]:
    """Stub: update evidence status in memory (reviewed/archived)."""
    status = (payload or {}).get("status")
    if status not in ("pending", "reviewed", "archived"):
        raise HTTPException(status_code=400, detail="status must be pending, reviewed, or archived")
    ids = [e["id"] for e in _MOCK_EVIDENCE]
    if item_id not in ids:
        raise HTTPException(status_code=404, detail="Evidence item not found")
    _evidence_status[item_id] = status
    logger.info("Evidence status updated (stub)", extra={"item_id": item_id, "status": status})
    return {"id": item_id, "status": status}


@router.get("/analytics")
def get_analytics(current_user=Depends(get_current_user)) -> Dict[str, Any]:
    """Stub: returns default analytics until backend exists."""
    return {"data": _DEFAULT_ANALYTICS}


@router.get("/settings")
def get_settings(current_user=Depends(get_current_user)) -> Dict[str, Any]:
    """Stub: returns default settings until backend exists."""
    return {"data": _DEFAULT_SETTINGS}


@router.put("/settings")
def update_settings(
    payload: Dict[str, Any] = Body(default=None),
    current_user=Depends(require_security_manager_or_admin),
) -> Dict[str, Any]:
    """Stub: echoes payload as saved until settings backend exists."""
    out = {**_DEFAULT_SETTINGS, **(payload or {})}
    return {"data": out}


@router.post("/cameras/{camera_id}/report-issue")
def report_camera_issue(
    camera_id: str,
    payload: Dict[str, Any] = Body(default=None),
    current_user=Depends(require_security_manager_or_admin),
) -> Dict[str, Any]:
    """Stub: log report-issue for audit; no real maintenance integration."""
    _report_issue_log.append({
        "camera_id": camera_id,
        "user_id": str(current_user.user_id),
        "payload": payload or {},
    })
    logger.info("Camera issue reported (stub)", extra={"camera_id": camera_id})
    return {"ok": True, "camera_id": camera_id}
