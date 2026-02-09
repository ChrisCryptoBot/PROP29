from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile, Form, Header, Request
from fastapi.responses import RedirectResponse, Response, FileResponse, StreamingResponse
from typing import List, Any, Dict, Optional
from datetime import datetime, timezone
import asyncio
import uuid
import os

import httpx
from sqlalchemy import text

from schemas import CameraCreate, CameraUpdate, CameraResponse, CameraMetricsResponse, CameraStatus
from api.auth_dependencies import get_current_user, get_current_user_optional, require_security_manager_or_admin, verify_hardware_ingest_key
from services.security_operations_service import CameraService
from services.stream_proxy_service import HLS_GATEWAY_BASE_URL
from services.stream_manager_service import stream_manager
from services.evidence_file_service import evidence_file_service
from services.recording_export_service import recording_export_service
from services.analytics_engine_service import analytics_engine
from database import SessionLocal, engine
from models import Camera, CameraStatus, SecurityOperationsAuditLog
import logging
import hashlib
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/security-operations", tags=["Security Operations"])


def _normalize_camera_id(camera_id: str) -> str:
    """Normalize camera_id to hyphenated UUID string so lookup matches DB (stored as str(uuid))."""
    if not camera_id:
        return camera_id
    try:
        return str(uuid.UUID(camera_id))
    except (ValueError, TypeError):
        return camera_id


def _db_has_no_cameras() -> bool:
    """Use raw SQL to avoid ORM schema mismatches. On any error, assume no cameras."""
    try:
        with engine.connect() as conn:
            r = conn.execute(text("SELECT COUNT(*) FROM cameras")).scalar()
            return r == 0
    except Exception as e:
        logger.warning("_db_has_no_cameras check failed: %s", e)
        return True


def _empty_metrics() -> CameraMetricsResponse:
    """Return zeroed metrics when no cameras in DB."""
    return CameraMetricsResponse(
        total=0,
        online=0,
        offline=0,
        maintenance=0,
        recording=0,
        avg_uptime="0%",
    )

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

# Evidence from DB when implemented; empty until then
_EVIDENCE: List[Dict[str, Any]] = []

@router.get("/cameras", response_model=List[CameraResponse])
def list_cameras(current_user=Depends(get_current_user)):
    try:
        if _db_has_no_cameras():
            return []
        return CameraService.list_cameras(user_id=str(current_user.user_id))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("list_cameras failed: %s", e)
        raise HTTPException(status_code=503, detail="Failed to load cameras. Please try again.")

@router.post("/cameras", response_model=CameraResponse, status_code=201)
def create_camera(payload: CameraCreate, current_user=Depends(require_security_manager_or_admin)):
    try:
        return CameraService.create_camera(payload, user_id=str(current_user.user_id))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Create camera failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create camera: {str(e)}")

@router.put("/cameras/{camera_id}", response_model=CameraResponse)
def update_camera(camera_id: str, payload: CameraUpdate, current_user=Depends(require_security_manager_or_admin)):
    return CameraService.update_camera(camera_id, payload)

@router.delete("/cameras/{camera_id}", status_code=204)
def delete_camera(camera_id: str, current_user=Depends(require_security_manager_or_admin)):
    CameraService.delete_camera(camera_id)
    return None

@router.get("/metrics", response_model=CameraMetricsResponse)
def get_camera_metrics(current_user=Depends(get_current_user)):
    try:
        if _db_has_no_cameras():
            return _empty_metrics()
        return CameraService.get_metrics()
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("get_camera_metrics failed: %s", e)
        raise HTTPException(status_code=503, detail="Failed to load camera metrics. Please try again.")

@router.get("/cameras/{camera_id}/stream")
def get_camera_stream(camera_id: str, current_user=Depends(get_current_user)):
    camera = CameraService.get_camera(camera_id)
    if not camera.stream_url:
        raise HTTPException(status_code=404, detail="Stream not available")
    return RedirectResponse(camera.stream_url)


@router.get("/cameras/{camera_id}/stream-status")
async def get_camera_stream_status(
    camera_id: str,
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Check if the HLS stream is available. For RTSP cameras the backend serves HLS itself;
    for others we probe the external HLS gateway.
    """
    camera_resp, source_stream_url, _ = CameraService.get_camera_and_stream_config(camera_id)
    del camera_resp  # 404 already raised if not found
    if stream_manager.is_rtsp_camera(camera_id, source_stream_url=source_stream_url):
        return {
            "gateway_reachable": True,
            "manifest_available": stream_manager.manifest_exists(camera_id),
            "source": "backend_rtsp",
        }
    gateway_base = HLS_GATEWAY_BASE_URL.rstrip("/")
    manifest_url = f"{gateway_base}/hls/{camera_id}/index.m3u8"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(manifest_url)
            return {
                "gateway_reachable": True,
                "manifest_available": r.status_code == 200,
                "status_code": r.status_code,
            }
    except (httpx.ConnectError, httpx.TimeoutException):
        return {
            "gateway_reachable": False,
            "manifest_available": False,
            "hint": "Start the HLS gateway: scripts/run-hls-gateway.ps1",
        }


@router.get("/cameras/{camera_id}/hls/{path:path}")
async def proxy_camera_hls(
    camera_id: str,
    path: str,
    request: Request,
    current_user=Depends(get_current_user),
):
    """
    Serve HLS stream for the camera. For RTSP cameras, the backend starts FFmpeg on demand
    and serves from local disk so users don't need to run scripts. Otherwise proxies to
    the external HLS gateway.
    """
    camera_resp, source_stream_url, credentials = CameraService.get_camera_and_stream_config(camera_id)
    del camera_resp  # 404 already raised if not found

    # Built-in: RTSP cameras — start FFmpeg on demand and serve from local disk (single DB call above)
    if stream_manager.is_rtsp_camera(camera_id, source_stream_url=source_stream_url):
        # Run blocking ensure_stream_running in thread so the event loop is not blocked (avoids heartbeat/other requests timing out)
        ok, err = await asyncio.to_thread(
            stream_manager.ensure_stream_running,
            camera_id,
            source_stream_url=source_stream_url,
            credentials=credentials,
        )
        if not ok:
            logger.warning("HLS stream failed for camera %s: %s", camera_id, err or "unknown")
            raise HTTPException(
                status_code=503,
                detail=err or "Stream could not be started. Check camera URL and that FFmpeg is installed.",
            )
        result = stream_manager.serve_stream_file(camera_id, path)
        if result:
            file_path, media_type = result
            return FileResponse(
                path=str(file_path),
                media_type=media_type,
                headers={"Cache-Control": "no-cache, no-store"},
            )
        # Segment/manifest missing: stream may have died — restart with shorter wait so we don't block 20s
        ok2, _ = await asyncio.to_thread(
            stream_manager.ensure_stream_running,
            camera_id,
            source_stream_url=source_stream_url,
            credentials=credentials,
            manifest_wait_timeout=8,
        )
        if ok2:
            result2 = stream_manager.serve_stream_file(camera_id, path)
            if result2:
                file_path, media_type = result2
                return FileResponse(
                    path=str(file_path),
                    media_type=media_type,
                    headers={"Cache-Control": "no-cache, no-store"},
                )
        raise HTTPException(
            status_code=503,
            detail="Stream segment not ready. Retry in a moment.",
        )

    # Fallback: proxy to external HLS gateway (for non-RTSP or legacy setup)
    gateway_url = f"{HLS_GATEWAY_BASE_URL.rstrip('/')}/hls/{camera_id}/{path}"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.get(gateway_url)
            r.raise_for_status()
            content_type = r.headers.get("content-type", "application/vnd.apple.mpegurl")
            return Response(
                content=r.content,
                status_code=r.status_code,
                media_type=content_type,
                headers={"Cache-Control": "no-cache, no-store"},
            )
    except httpx.HTTPStatusError as e:
        logger.warning("HLS proxy upstream error for %s: %s", gateway_url, e.response.status_code)
        raise HTTPException(status_code=e.response.status_code, detail="Stream gateway unavailable")
    except (httpx.ConnectError, httpx.TimeoutException) as e:
        logger.warning("HLS proxy unreachable %s: %s", gateway_url, e)
        raise HTTPException(status_code=502, detail="Stream gateway unreachable; ensure FFmpeg and HLS gateway are running.")


@router.get("/cameras/{camera_id}/last-image")
def get_last_known_image(camera_id: str, current_user=Depends(get_current_user_optional)):
    """
    Return last known frame or placeholder. Uses optional auth so <img src=".../last-image">
    requests (which do not send the JWT) get 200 + placeholder instead of 403.
    """
    cid = _normalize_camera_id(camera_id)
    db = SessionLocal()
    try:
        camera = db.query(Camera).filter(Camera.camera_id == cid).first()
        if camera and camera.last_known_image_url and not camera.last_known_image_url.endswith("/last-image"):
            return RedirectResponse(camera.last_known_image_url)
    finally:
        db.close()

    # Inline SVG placeholder (no auth required for img tags that cannot send Authorization)
    svg = """<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'>
<rect width='100%' height='100%' fill='#0f172a'/>
<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#e2e8f0' font-size='18' font-family='Arial'>
Last known image unavailable
</text>
</svg>"""
    return Response(content=svg, media_type="image/svg+xml")


# Recordings from DB/export service when implemented; empty until then
_RECORDINGS: List[Dict[str, Any]] = []


@router.get("/recordings")
def list_recordings(
    camera_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user=Depends(get_current_user)
) -> Dict[str, List[Any]]:
    """List recordings with optional filtering."""
    recordings = list(_RECORDINGS)
    if camera_id:
        recordings = [r for r in recordings if r.get("camera_id") == camera_id]
    if start_date:
        recordings = [r for r in recordings if r.get("start_time", "") >= start_date]
    if end_date:
        recordings = [r for r in recordings if r.get("end_time", "") <= end_date]
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
    recording = next((r for r in _RECORDINGS if r.get("id") == recording_id), None)
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
    existing_ids = {r["id"] for r in _RECORDINGS}
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


def _create_audit_entry(
    action: str,
    entity: str,
    entity_id: str,
    user_id: str,
    changes: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
) -> None:
    """Create tamper-evident audit log entry."""
    try:
        with SessionLocal() as db:
            # Build hash for integrity verification
            hash_data = {
                "action": action,
                "entity": entity,
                "entity_id": entity_id,
                "user_id": user_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "changes": changes or {},
            }
            hash_str = hashlib.sha256(json.dumps(hash_data, sort_keys=True).encode()).hexdigest()
            
            audit_entry = SecurityOperationsAuditLog(
                user_id=user_id,
                action=action,
                entity=entity,
                entity_id=entity_id,
                changes=changes,
                extra_metadata=metadata,
                ip_address=request.client.host if request else None,
                user_agent=request.headers.get("user-agent") if request else None,
                hash=hash_str
            )
            db.add(audit_entry)
            db.commit()
    except Exception as e:
        logger.error(f"Failed to create audit entry: {e}")


@router.post("/audit-trail", status_code=201)
def create_audit_trail_entry(
    request: Request,
    body: Dict[str, Any] = Body(...),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """Create an audit log entry (e.g. camera delete). Used by the frontend to record actions."""
    action = body.get("action") or ""
    entity = body.get("entity") or ""
    entity_id = body.get("entity_id") or ""
    changes = body.get("changes")
    metadata = body.get("metadata")
    _create_audit_entry(
        action=action,
        entity=entity,
        entity_id=entity_id,
        user_id=str(current_user.user_id),
        changes=changes,
        metadata=metadata,
        request=request,
    )
    return {"ok": True}


@router.get("/audit-trail")
def get_audit_trail(
    entity: Optional[str] = None,
    entity_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user=Depends(get_current_user)
) -> Dict[str, Any]:
    """Get audit trail entries. RBAC: Security Manager or Admin only."""
    # Check permissions
    if not (hasattr(current_user, 'role') and current_user.role in ['security_manager', 'admin']):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        with SessionLocal() as db:
            query = db.query(SecurityOperationsAuditLog)
            
            if entity:
                query = query.filter(SecurityOperationsAuditLog.entity == entity)
            if entity_id:
                query = query.filter(SecurityOperationsAuditLog.entity_id == entity_id)
            
            total = query.count()
            entries = query.order_by(SecurityOperationsAuditLog.timestamp.desc()).offset(offset).limit(limit).all()
            
            return {
                "data": [{
                    "id": e.audit_id,
                    "timestamp": e.timestamp.isoformat(),
                    "userId": e.user_id,
                    "action": e.action,
                    "entity": e.entity,
                    "entityId": e.entity_id,
                    "changes": e.changes,
                    "metadata": e.extra_metadata,
                    "hash": e.hash
                } for e in entries],
                "total": total,
                "limit": limit,
                "offset": offset
            }
    except Exception as e:
        logger.error(f"Failed to get audit trail: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve audit trail")


def _evidence_with_status() -> List[Dict[str, Any]]:
    out = []
    for e in _EVIDENCE:
        copied = dict(e)
        copied["status"] = _evidence_status.get(e["id"], e.get("status", "pending"))
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
    
    if not custody_chain and evidence_id in [e["id"] for e in _EVIDENCE]:
        evidence = next((e for e in _EVIDENCE if e["id"] == evidence_id), None)
        if evidence:
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
    ids = [e["id"] for e in _EVIDENCE]
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


# ============================================================================
# Mobile Agent & Hardware Device Integration Endpoints
# ============================================================================

@router.post("/cameras/ingest/mobile-agent")
async def ingest_mobile_agent_camera_data(
    payload: Dict[str, Any] = Body(...),
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Ingest camera data from mobile agent application.
    Auth: JWT or X-API-Key (mobile agent).
    """
    try:
        # Verify hardware ingest key if provided (for mobile agents)
        if x_api_key:
            await verify_hardware_ingest_key(x_api_key)
        
        agent_id = payload.get("agent_id")
        camera_name = payload.get("camera_name", f"Mobile Agent Camera - {agent_id}")
        location = payload.get("location", "Unknown")
        stream_url = payload.get("stream_url")
        status = payload.get("status", "online")
        
        # Create or update camera from mobile agent
        camera_data = {
            "name": camera_name,
            "location": location,
            "status": status,
            "source_stream_url": stream_url,
        }
        
        # Check if camera already exists for this agent (using source_metadata)
        with SessionLocal() as db:
            existing = db.query(Camera).filter(
                Camera.name == camera_name
            ).filter(
                Camera.source_metadata.contains({"agent_id": agent_id}) if hasattr(Camera, 'source_metadata') else False
            ).first()
            
            if not existing:
                # Try alternative: check by name pattern
                existing = db.query(Camera).filter(
                    Camera.name.like(f"%{agent_id}%")
                ).first()
            
            if existing:
                # Update existing camera
                for key, value in camera_data.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                if hasattr(existing, 'last_heartbeat'):
                    existing.last_heartbeat = datetime.now(timezone.utc)
                if hasattr(existing, 'source_metadata'):
                    existing.source_metadata = existing.source_metadata or {}
                    existing.source_metadata.update({"agent_id": agent_id, "source": "mobile_agent"})
                db.commit()
                db.refresh(existing)
                logger.info(f"Mobile agent camera updated: {existing.camera_id} from agent {agent_id}")
                return {"ok": True, "camera_id": str(existing.camera_id), "action": "updated"}
            else:
                # Create new camera
                new_camera = Camera(**camera_data)
                new_camera.camera_id = uuid.uuid4()
                if hasattr(new_camera, 'created_at'):
                    new_camera.created_at = datetime.now(timezone.utc)
                if hasattr(new_camera, 'last_heartbeat'):
                    new_camera.last_heartbeat = datetime.now(timezone.utc)
                if hasattr(new_camera, 'source_metadata'):
                    new_camera.source_metadata = {"agent_id": agent_id, "source": "mobile_agent"}
                db.add(new_camera)
                db.commit()
                db.refresh(new_camera)
                logger.info(f"Mobile agent camera created: {new_camera.camera_id} from agent {agent_id}")
                return {"ok": True, "camera_id": str(new_camera.camera_id), "action": "created"}
                
    except Exception as e:
        logger.error(f"Failed to ingest mobile agent camera data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to ingest camera data: {str(e)}")


@router.post("/cameras/ingest/hardware-device")
async def ingest_hardware_device_camera_data(
    payload: Dict[str, Any] = Body(...),
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
) -> Dict[str, Any]:
    """
    Ingest camera data from hardware device (Plug & Play).
    Auth: X-API-Key (hardware) required.
    """
    try:
        # Verify hardware ingest key (required for hardware devices)
        await verify_hardware_ingest_key(x_api_key)
        
        device_id = payload.get("device_id")
        device_name = payload.get("device_name", f"Hardware Camera - {device_id}")
        location = payload.get("location", "Unknown")
        stream_url = payload.get("stream_url")
        status = payload.get("status", "online")
        device_type = payload.get("device_type", "camera")
        
        # Create or update camera from hardware device
        camera_data = {
            "name": device_name,
            "location": location,
            "status": status,
            "source_stream_url": stream_url,
        }
        
        # Check if camera already exists for this device (using source_metadata)
        with SessionLocal() as db:
            existing = db.query(Camera).filter(
                Camera.name == device_name
            ).first()
            
            if not existing and hasattr(Camera, 'source_metadata'):
                # Try to find by device_id in metadata
                existing = db.query(Camera).filter(
                    Camera.source_metadata.contains({"device_id": device_id})
                ).first()
            
            if existing:
                # Update existing camera
                for key, value in camera_data.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                if hasattr(existing, 'last_heartbeat'):
                    existing.last_heartbeat = datetime.now(timezone.utc)
                if hasattr(existing, 'source_metadata'):
                    existing.source_metadata = existing.source_metadata or {}
                    existing.source_metadata.update({"device_id": device_id, "source": "hardware_device", "device_type": device_type})
                db.commit()
                db.refresh(existing)
                logger.info(f"Hardware device camera updated: {existing.camera_id} from device {device_id}")
                return {"ok": True, "camera_id": str(existing.camera_id), "action": "updated"}
            else:
                # Create new camera
                new_camera = Camera(**camera_data)
                new_camera.camera_id = uuid.uuid4()
                if hasattr(new_camera, 'created_at'):
                    new_camera.created_at = datetime.now(timezone.utc)
                if hasattr(new_camera, 'last_heartbeat'):
                    new_camera.last_heartbeat = datetime.now(timezone.utc)
                if hasattr(new_camera, 'source_metadata'):
                    new_camera.source_metadata = {"device_id": device_id, "source": "hardware_device", "device_type": device_type}
                db.add(new_camera)
                db.commit()
                db.refresh(new_camera)
                logger.info(f"Hardware device camera created: {new_camera.camera_id} from device {device_id}")
                return {"ok": True, "camera_id": str(new_camera.camera_id), "action": "created"}
                
    except Exception as e:
        logger.error(f"Failed to ingest hardware device camera data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to ingest camera data: {str(e)}")


@router.post("/cameras/{camera_id}/ptz")
async def control_camera_ptz(
    camera_id: str,
    action: str = Body(..., embed=True, description="PTZ action: pan_left, pan_right, tilt_up, tilt_down, zoom_in, zoom_out, home"),
    current_user=Depends(require_security_manager_or_admin),
) -> Dict[str, Any]:
    """
    Control camera PTZ (Pan-Tilt-Zoom).
    Auth: Security Manager or Admin only.
    """
    try:
        cid = _normalize_camera_id(camera_id)
        with SessionLocal() as db:
            camera = db.query(Camera).filter(Camera.camera_id == cid).first()
            if not camera:
                raise HTTPException(status_code=404, detail="Camera not found")
            
            # Validate action
            valid_actions = ["pan_left", "pan_right", "tilt_up", "tilt_down", "zoom_in", "zoom_out", "home"]
            if action not in valid_actions:
                raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {', '.join(valid_actions)}")
            
            # TODO: In production, this would send command to camera hardware via ONVIF/RTSP
            # For now, log the action
            logger.info(f"PTZ command sent: camera_id={camera_id}, action={action}, user={current_user.user_id}")
            
            return {
                "ok": True,
                "camera_id": camera_id,
                "action": action,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to control PTZ: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to control PTZ: {str(e)}")


@router.post("/cameras/{camera_id}/heartbeat")
async def record_camera_heartbeat(
    camera_id: str,
    payload: Dict[str, Any] = Body(default=None),
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Record heartbeat from camera hardware device.
    Auth: JWT or X-API-Key (hardware).
    """
    try:
        # Verify hardware ingest key if provided
        if x_api_key:
            await verify_hardware_ingest_key(x_api_key)
        
        cid = _normalize_camera_id(camera_id)
        with SessionLocal() as db:
            camera = db.query(Camera).filter(Camera.camera_id == cid).first()
            if not camera:
                raise HTTPException(status_code=404, detail="Camera not found")
            
            # Update heartbeat timestamp
            camera.last_heartbeat = datetime.now(timezone.utc)
            # Receiving a heartbeat means the device is live: set to online unless payload says otherwise
            if payload and "status" in payload:
                camera.status = payload["status"]
            else:
                camera.status = CameraStatus.ONLINE
            db.commit()
            logger.info(f"Camera heartbeat recorded: {camera_id}")
            return {"ok": True, "camera_id": camera_id, "timestamp": camera.last_heartbeat.isoformat()}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to record camera heartbeat: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to record heartbeat: {str(e)}")


@router.post("/recordings/ingest/mobile-agent")
async def ingest_mobile_agent_recording(
    payload: Dict[str, Any] = Body(...),
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Ingest recording from mobile agent application.
    Auth: JWT or X-API-Key (mobile agent).
    """
    try:
        if x_api_key:
            await verify_hardware_ingest_key(x_api_key)
        
        agent_id = payload.get("agent_id")
        camera_id = payload.get("camera_id")
        recording_url = payload.get("recording_url")
        duration = payload.get("duration", 0)
        timestamp = payload.get("timestamp", datetime.now(timezone.utc).isoformat())
        
        # Create recording entry (stub - would integrate with recording service)
        recording_id = str(uuid.uuid4())
        logger.info(f"Mobile agent recording ingested: {recording_id} from agent {agent_id}, camera {camera_id}")
        
        return {
            "ok": True,
            "recording_id": recording_id,
            "camera_id": camera_id,
            "agent_id": agent_id,
        }
        
    except Exception as e:
        logger.error(f"Failed to ingest mobile agent recording: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to ingest recording: {str(e)}")


@router.post("/evidence/ingest/mobile-agent")
async def ingest_mobile_agent_evidence(
    payload: Dict[str, Any] = Body(...),
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Ingest evidence from mobile agent application.
    Auth: JWT or X-API-Key (mobile agent).
    """
    try:
        if x_api_key:
            await verify_hardware_ingest_key(x_api_key)
        
        agent_id = payload.get("agent_id")
        camera_id = payload.get("camera_id")
        evidence_type = payload.get("evidence_type", "image")
        evidence_url = payload.get("evidence_url")
        description = payload.get("description", "Mobile agent evidence")
        timestamp = payload.get("timestamp", datetime.now(timezone.utc).isoformat())
        
        # Create evidence entry (stub - would integrate with evidence service)
        evidence_id = str(uuid.uuid4())
        logger.info(f"Mobile agent evidence ingested: {evidence_id} from agent {agent_id}, camera {camera_id}")
        
        return {
            "ok": True,
            "evidence_id": evidence_id,
            "camera_id": camera_id,
            "agent_id": agent_id,
        }
        
    except Exception as e:
        logger.error(f"Failed to ingest mobile agent evidence: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to ingest evidence: {str(e)}")


@router.post("/cameras/register/hardware-device")
async def register_hardware_camera_device(
    payload: Dict[str, Any] = Body(...),
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
) -> Dict[str, Any]:
    """
    Register a new hardware camera device (Plug & Play).
    Auth: X-API-Key (hardware) required.
    """
    try:
        # Verify hardware ingest key (required)
        await verify_hardware_ingest_key(x_api_key)
        
        device_id = payload.get("device_id")
        device_name = payload.get("device_name", f"Hardware Camera - {device_id}")
        device_type = payload.get("device_type", "camera")
        location = payload.get("location", "Unknown")
        stream_url = payload.get("stream_url")
        capabilities = payload.get("capabilities", {})
        
        # Register device as camera
        camera_data = {
            "name": device_name,
            "location": location,
            "status": "online",
            "source_stream_url": stream_url,
        }
        
        with SessionLocal() as db:
            # Check if device already registered (using source_metadata)
            existing = None
            if hasattr(Camera, 'source_metadata'):
                existing = db.query(Camera).filter(
                    Camera.source_metadata.contains({"device_id": device_id})
                ).first()
            
            if not existing:
                # Try by name
                existing = db.query(Camera).filter(
                    Camera.name == device_name
                ).first()
            
            if existing:
                # Update metadata if needed
                if hasattr(existing, 'source_metadata'):
                    existing.source_metadata = existing.source_metadata or {}
                    existing.source_metadata.update({"device_id": device_id, "source": "hardware_device", "device_type": device_type})
                    db.commit()
                logger.info(f"Hardware device {device_id} already registered as camera {existing.camera_id}")
                return {
                    "ok": True,
                    "camera_id": str(existing.camera_id),
                    "action": "already_registered",
                }
            
            # Create new camera
            new_camera = Camera(**camera_data)
            new_camera.camera_id = uuid.uuid4()
            if hasattr(new_camera, 'created_at'):
                new_camera.created_at = datetime.now(timezone.utc)
            if hasattr(new_camera, 'last_heartbeat'):
                new_camera.last_heartbeat = datetime.now(timezone.utc)
            if hasattr(new_camera, 'source_metadata'):
                new_camera.source_metadata = {"device_id": device_id, "source": "hardware_device", "device_type": device_type}
            db.add(new_camera)
            db.commit()
            db.refresh(new_camera)
            
            logger.info(f"Hardware device {device_id} registered as camera {new_camera.camera_id}")
            return {
                "ok": True,
                "camera_id": str(new_camera.camera_id),
                "action": "registered",
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering hardware camera device: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to register hardware device"
        )
