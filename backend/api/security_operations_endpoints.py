from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile, Form
from fastapi.responses import RedirectResponse, Response, FileResponse
from typing import List, Any, Dict, Optional
from datetime import datetime, timezone
import uuid

from sqlalchemy import text

from schemas import CameraCreate, CameraUpdate, CameraResponse, CameraMetricsResponse, CameraStatus
from api.auth_dependencies import get_current_user, require_security_manager_or_admin
from services.security_operations_service import CameraService
from services.evidence_file_service import evidence_file_service
from services.recording_export_service import recording_export_service
from services.analytics_engine_service import analytics_engine
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
_evidence_files: Dict[str, Dict[str, Any]] = {}  # evidence_id -> file_record
_evidence_chain_of_custody: Dict[str, List[Dict[str, Any]]] = {}  # evidence_id -> custody_entries
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
        "hasFiles": False,
        "fileCount": 0
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
        "hasFiles": False,
        "fileCount": 0
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


# Mock recordings data
_MOCK_RECORDINGS: List[Dict[str, Any]] = [
    {
        "id": "rec-1",
        "camera_id": _MOCK_CAMERA_IDS[0],
        "camera_name": "North Lobby",
        "start_time": "2024-01-24 14:30:00",
        "end_time": "2024-01-24 14:35:00",
        "duration": "00:05:00",
        "file_size": "45.2 MB",
        "resolution": "1920x1080",
        "format": "mp4",
        "motion_detected": True,
        "has_audio": False,
        "status": "available"
    },
    {
        "id": "rec-2", 
        "camera_id": _MOCK_CAMERA_IDS[1],
        "camera_name": "East Parking Lot",
        "start_time": "2024-01-24 13:15:00",
        "end_time": "2024-01-24 13:45:00", 
        "duration": "00:30:00",
        "file_size": "180.7 MB",
        "resolution": "1920x1080",
        "format": "mp4",
        "motion_detected": False,
        "has_audio": True,
        "status": "available"
    },
    {
        "id": "rec-3",
        "camera_id": _MOCK_CAMERA_IDS[2],
        "camera_name": "West Corridor",
        "start_time": "2024-01-24 12:00:00",
        "end_time": "2024-01-24 12:10:00",
        "duration": "00:10:00", 
        "file_size": "67.3 MB",
        "resolution": "1920x1080",
        "format": "mp4",
        "motion_detected": True,
        "has_audio": False,
        "status": "available"
    }
]


@router.get("/recordings")
def list_recordings(
    camera_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user=Depends(get_current_user)
) -> Dict[str, List[Any]]:
    """List recordings with optional filtering."""
    recordings = _MOCK_RECORDINGS.copy()
    
    # Apply filters
    if camera_id:
        recordings = [r for r in recordings if r["camera_id"] == camera_id]
    
    if start_date:
        recordings = [r for r in recordings if r["start_time"] >= start_date]
    
    if end_date:
        recordings = [r for r in recordings if r["end_time"] <= end_date]
    
    return {"data": recordings}


@router.post("/recordings/{recording_id}/export")
async def export_recording(
    recording_id: str,
    format: str = Body("mp4"),
    quality: str = Body("high"),
    current_user=Depends(require_security_manager_or_admin)
) -> Dict[str, Any]:
    """Export a single recording with format conversion."""
    # Check if recording exists
    recording = next((r for r in _MOCK_RECORDINGS if r["id"] == recording_id), None)
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    try:
        export_result = await recording_export_service.export_recording(
            recording_id=recording_id,
            format=format,
            quality=quality,
            user_id=str(current_user.user_id)
        )
        
        return {
            "export_id": export_result["export_id"],
            "status": export_result["status"],
            "download_url": f"/security-operations/exports/{export_result['export_id']}"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Recording export failed: {e}")
        raise HTTPException(status_code=500, detail="Export failed")


@router.post("/recordings/export-batch")
async def export_recordings_batch(
    recording_ids: List[str] = Body(...),
    format: str = Body("mp4"),
    quality: str = Body("high"),
    current_user=Depends(require_security_manager_or_admin)
) -> Dict[str, Any]:
    """Export multiple recordings as a batch."""
    if not recording_ids:
        raise HTTPException(status_code=400, detail="No recordings specified")
    
    if len(recording_ids) > 50:
        raise HTTPException(status_code=400, detail="Too many recordings (max 50)")
    
    # Verify all recordings exist
    existing_ids = {r["id"] for r in _MOCK_RECORDINGS}
    missing_ids = set(recording_ids) - existing_ids
    if missing_ids:
        raise HTTPException(status_code=404, detail=f"Recordings not found: {list(missing_ids)}")
    
    try:
        batch_result = await recording_export_service.export_recordings_batch(
            recording_ids=recording_ids,
            format=format,
            quality=quality,
            user_id=str(current_user.user_id)
        )
        
        return {
            "batch_id": batch_result["batch_id"],
            "status": batch_result["status"],
            "total_count": batch_result["total_count"],
            "completed_count": batch_result["completed_count"],
            "failed_count": batch_result["failed_count"],
            "download_url": f"/security-operations/exports/batch/{batch_result['batch_id']}" if batch_result.get("archive_path") else None
        }
        
    except Exception as e:
        logger.error(f"Batch export failed: {e}")
        raise HTTPException(status_code=500, detail="Batch export failed")


@router.get("/exports/{export_id}")
def download_export(
    export_id: str,
    current_user=Depends(get_current_user)
) -> FileResponse:
    """Download an exported recording file."""
    export_job = recording_export_service.get_export_status(export_id)
    
    if not export_job:
        raise HTTPException(status_code=404, detail="Export not found")
    
    if export_job["status"] != "completed":
        raise HTTPException(status_code=400, detail=f"Export status: {export_job['status']}")
    
    if not export_job.get("file_path") or not os.path.exists(export_job["file_path"]):
        raise HTTPException(status_code=404, detail="Export file not found")
    
    return FileResponse(
        path=export_job["file_path"],
        filename=f"recording_{export_job['recording_id']}.{export_job['format']}",
        media_type="video/mp4"
    )


@router.get("/exports/batch/{batch_id}")
def download_batch_export(
    batch_id: str,
    current_user=Depends(get_current_user)
) -> FileResponse:
    """Download a batch export archive."""
    # Find batch job (simplified lookup)
    batch_path = os.path.join(recording_export_service.EXPORTS_STORAGE_PATH, f"batch_{batch_id}.zip")
    
    if not os.path.exists(batch_path):
        raise HTTPException(status_code=404, detail="Batch export not found")
    
    return FileResponse(
        path=batch_path,
        filename=f"recordings_batch_{batch_id}.zip",
        media_type="application/zip"
    )


@router.get("/exports")
def list_user_exports(
    current_user=Depends(get_current_user)
) -> Dict[str, List[Dict[str, Any]]]:
    """List export jobs for the current user."""
    exports = recording_export_service.list_user_exports(str(current_user.user_id))
    return {"data": exports}


def _evidence_with_status() -> List[Dict[str, Any]]:
    out = []
    for e in _MOCK_EVIDENCE:
        copied = dict(e)
        copied["status"] = _evidence_status.get(e["id"], e["status"])
        # Add file information
        copied["hasFiles"] = e["id"] in _evidence_files
        copied["fileCount"] = 1 if e["id"] in _evidence_files else 0
        if e["id"] in _evidence_files:
            file_record = _evidence_files[e["id"]]
            copied["fileUrl"] = evidence_file_service.get_file_url(file_record["file_id"])
            copied["thumbnailUrl"] = evidence_file_service.get_thumbnail_url(file_record["file_id"])
        out.append(copied)
    return out


@router.post("/evidence/{evidence_id}/files")
async def upload_evidence_file(
    evidence_id: str,
    file: UploadFile = File(...),
    case_id: Optional[str] = Form(None),
    current_user=Depends(require_security_manager_or_admin)
) -> Dict[str, Any]:
    """Upload a file as evidence (photo, video, document)."""
    try:
        # Read file data
        file_data = await file.read()
        
        # Upload through evidence file service
        file_record = await evidence_file_service.upload_evidence_file(
            file_data=file_data,
            filename=file.filename or "unknown",
            evidence_id=evidence_id,
            uploaded_by=str(current_user.user_id),
            case_id=case_id
        )
        
        # Store file record in memory (in production, save to database)
        _evidence_files[evidence_id] = file_record
        
        # Create chain of custody entry
        custody_entry = evidence_file_service.create_chain_of_custody_entry(
            evidence_id=evidence_id,
            action="File Uploaded",
            handler=f"{current_user.first_name} {current_user.last_name}",
            details={
                "filename": file.filename,
                "file_size": file_record["file_size"],
                "mime_type": file_record["mime_type"]
            }
        )
        
        if evidence_id not in _evidence_chain_of_custody:
            _evidence_chain_of_custody[evidence_id] = []
        _evidence_chain_of_custody[evidence_id].append(custody_entry)
        
        logger.info(f"Evidence file uploaded: {file_record['file_id']} for evidence {evidence_id}")
        
        return {
            "file_id": file_record["file_id"],
            "evidence_id": evidence_id,
            "filename": file.filename,
            "file_size": file_record["file_size"],
            "file_url": evidence_file_service.get_file_url(file_record["file_id"]),
            "thumbnail_url": evidence_file_service.get_thumbnail_url(file_record["file_id"]),
            "uploaded_at": file_record["uploaded_at"]
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Evidence file upload failed: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")


@router.get("/evidence/files/{file_id}")
def download_evidence_file(
    file_id: str,
    current_user=Depends(get_current_user)
) -> FileResponse:
    """Download an evidence file by ID."""
    # Find file record
    file_record = None
    for evidence_id, record in _evidence_files.items():
        if record["file_id"] == file_id:
            file_record = record
            break
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Verify file integrity
    if not evidence_file_service.verify_file_integrity(file_record):
        raise HTTPException(status_code=410, detail="File integrity compromised")
    
    file_path = file_record["file_path"]
    return FileResponse(
        path=file_path,
        filename=file_record["original_filename"],
        media_type=file_record["mime_type"]
    )


@router.get("/evidence/thumbnails/{file_id}")
def get_evidence_thumbnail(
    file_id: str,
    current_user=Depends(get_current_user)
) -> FileResponse:
    """Get thumbnail for an evidence file."""
    # Find file record
    file_record = None
    for evidence_id, record in _evidence_files.items():
        if record["file_id"] == file_id:
            file_record = record
            break
    
    if not file_record or not file_record.get("thumbnail_path"):
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    
    thumbnail_path = file_record["thumbnail_path"]
    return FileResponse(
        path=thumbnail_path,
        media_type="image/jpeg"
    )


@router.get("/evidence/{evidence_id}/chain-of-custody")
def get_evidence_chain_of_custody(
    evidence_id: str,
    current_user=Depends(get_current_user)
) -> Dict[str, List[Dict[str, Any]]]:
    """Get complete chain of custody for evidence."""
    custody_chain = _evidence_chain_of_custody.get(evidence_id, [])
    
    # Add default system entries if none exist
    if not custody_chain and evidence_id in [e["id"] for e in _MOCK_EVIDENCE]:
        evidence = next(e for e in _MOCK_EVIDENCE if e["id"] == evidence_id)
        custody_chain = evidence.get("chainOfCustody", [])
    
    return {"data": custody_chain}


@router.get("/evidence")
def list_evidence(current_user=Depends(get_current_user)) -> Dict[str, List[Any]]:
    """List all evidence with file information and status overrides."""
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
    """Get comprehensive security analytics and metrics."""
    analytics_data = analytics_engine.get_comprehensive_analytics()
    return {"data": analytics_data}


@router.get("/analytics/motion")
def get_motion_analytics(
    hours: int = 24,
    current_user=Depends(get_current_user)
) -> Dict[str, Any]:
    """Get detailed motion detection analytics."""
    motion_data = analytics_engine.get_motion_analytics(hours)
    return {"data": motion_data}


@router.get("/analytics/performance")
def get_camera_performance_analytics(
    current_user=Depends(get_current_user)
) -> Dict[str, Any]:
    """Get camera performance and health analytics."""
    performance_data = analytics_engine.get_camera_performance_analytics()
    return {"data": performance_data}


@router.get("/analytics/alerts")  
def get_alert_analytics(
    hours: int = 24,
    current_user=Depends(get_current_user)
) -> Dict[str, Any]:
    """Get alert and incident analytics."""
    alert_data = analytics_engine.get_alert_analytics(hours)
    return {"data": alert_data}


@router.get("/analytics/trends")
def get_analytics_trends(
    days: int = 7,
    current_user=Depends(get_current_user)
) -> Dict[str, Any]:
    """Get trend data for charts and analysis."""
    trend_data = analytics_engine.generate_trend_data(days)
    return {"data": trend_data}


@router.post("/analytics/motion-event")
async def report_motion_event(
    event: Dict[str, Any] = Body(...),
    current_user=Depends(get_current_user)
) -> Dict[str, str]:
    """Report a motion detection event for processing."""
    try:
        await analytics_engine.process_motion_event(event)
        return {"status": "processed", "event_id": event.get("id")}
    except Exception as e:
        logger.error(f"Motion event processing failed: {e}")
        raise HTTPException(status_code=500, detail="Event processing failed")


@router.post("/analytics/camera-health")
async def report_camera_health(
    camera_id: str,
    health_data: Dict[str, Any] = Body(...),
    current_user=Depends(get_current_user)
) -> Dict[str, str]:
    """Report camera health/status update."""
    try:
        await analytics_engine.process_camera_health_update(camera_id, health_data)
        return {"status": "processed", "camera_id": camera_id}
    except Exception as e:
        logger.error(f"Camera health update failed: {e}")
        raise HTTPException(status_code=500, detail="Health update failed")


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
