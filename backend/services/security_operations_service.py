"""
Security Operations Center - Camera Service
"""
import uuid
from typing import List, Optional, Tuple, Any
from datetime import datetime
from database import SessionLocal
from models import Camera, CameraHealth, CameraStatus, UserRole, Property
from schemas import CameraCreate, CameraUpdate, CameraResponse, CameraMetricsResponse
from fastapi import HTTPException, status
from services.stream_proxy_service import StreamProxyService
import logging

logger = logging.getLogger(__name__)


def _normalize_camera_id(camera_id: str) -> str:
    """Normalize to hyphenated UUID string so lookup matches DB (stored as str(uuid))."""
    if not camera_id:
        return camera_id
    try:
        return str(uuid.UUID(camera_id))
    except (ValueError, TypeError):
        return camera_id


class CameraService:
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
    def _serialize_camera(camera: Camera) -> CameraResponse:
        return CameraResponse(
            camera_id=camera.camera_id,
            name=camera.name,
            location=camera.location,
            ip_address=camera.ip_address,
            stream_url=StreamProxyService.resolve_stream_url(camera.stream_url, camera.camera_id),
            status=camera.status,
            hardware_status=camera.hardware_status,
            is_recording=camera.is_recording,
            motion_detection_enabled=camera.motion_detection_enabled,
            last_known_image_url=camera.last_known_image_url,
            created_at=camera.created_at,
            updated_at=camera.updated_at,
        )

    @staticmethod
    def list_cameras(user_id: Optional[str] = None) -> List[CameraResponse]:
        db = SessionLocal()
        try:
            cameras = db.query(Camera).all()
            return [CameraService._serialize_camera(camera) for camera in cameras]
        finally:
            db.close()

    @staticmethod
    def get_camera(camera_id: str) -> CameraResponse:
        cid = _normalize_camera_id(camera_id)
        db = SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.camera_id == cid).first()
            if not camera:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camera not found")
            return CameraService._serialize_camera(camera)
        finally:
            db.close()

    @staticmethod
    def get_camera_and_stream_config(camera_id: str) -> Tuple[CameraResponse, Optional[str], Optional[Any]]:
        """One-shot fetch for HLS endpoint: returns serialized camera (for 404/auth) plus source_stream_url and credentials for stream manager."""
        cid = _normalize_camera_id(camera_id)
        db = SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.camera_id == cid).first()
            if not camera:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camera not found")
            return (
                CameraService._serialize_camera(camera),
                getattr(camera, "source_stream_url", None) or None,
                camera.credentials if isinstance(getattr(camera, "credentials", None), dict) else None,
            )
        finally:
            db.close()

    @staticmethod
    def create_camera(payload: CameraCreate, user_id: Optional[str] = None) -> CameraResponse:
        db = SessionLocal()
        try:
            property_id = CameraService._get_default_property_id(db, user_id)
            safe_stream_url = StreamProxyService.resolve_stream_url(payload.stream_url, "pending")
            # Use model enum for status (payload may use schema enum)
            status_value = (payload.status.value if payload.status is not None else None) or CameraStatus.OFFLINE.value
            status_enum = CameraStatus(status_value) if isinstance(status_value, str) else CameraStatus.OFFLINE

            camera = Camera(
                property_id=property_id,
                name=payload.name,
                location=payload.location if isinstance(payload.location, dict) else {"label": payload.location},
                ip_address=payload.ip_address,
                stream_url=safe_stream_url,
                source_stream_url=payload.stream_url,
                credentials=payload.credentials,
                status=status_enum,
                is_recording=payload.is_recording or False,
                motion_detection_enabled=payload.motion_detection_enabled if payload.motion_detection_enabled is not None else True,
            )
            db.add(camera)
            db.flush()

            camera.stream_url = StreamProxyService.resolve_stream_url(payload.stream_url, camera.camera_id)
            camera.last_known_image_url = f"/api/security-operations/cameras/{camera.camera_id}/last-image"
            health = CameraHealth(
                camera_id=camera.camera_id,
                status=camera.status,
                last_ping_at=datetime.utcnow(),
                last_metrics_at=None,
                last_known_image_url=camera.last_known_image_url,
                metrics={}
            )
            db.add(health)
            db.commit()
            db.refresh(camera)
            return CameraService._serialize_camera(camera)
        except Exception as error:
            db.rollback()
            logger.exception("Failed to create camera: %s", error)
            raise
        finally:
            db.close()

    @staticmethod
    def update_camera(camera_id: str, payload: CameraUpdate) -> CameraResponse:
        cid = _normalize_camera_id(camera_id)
        db = SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.camera_id == cid).first()
            if not camera:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camera not found")

            if payload.name is not None:
                camera.name = payload.name
            if payload.location is not None:
                camera.location = payload.location if isinstance(payload.location, dict) else {"label": payload.location}
            if payload.ip_address is not None:
                camera.ip_address = payload.ip_address
            if payload.stream_url is not None:
                camera.source_stream_url = payload.stream_url
                camera.stream_url = StreamProxyService.resolve_stream_url(payload.stream_url, camera.camera_id)
            if payload.credentials is not None:
                camera.credentials = payload.credentials
            if payload.status is not None:
                camera.status = payload.status
            if payload.is_recording is not None:
                camera.is_recording = payload.is_recording
            if payload.motion_detection_enabled is not None:
                camera.motion_detection_enabled = payload.motion_detection_enabled
            if payload.hardware_status is not None:
                camera.hardware_status = payload.hardware_status
            if payload.last_known_image_url is not None:
                camera.last_known_image_url = payload.last_known_image_url

            db.commit()
            db.refresh(camera)
            return CameraService._serialize_camera(camera)
        except Exception as error:
            db.rollback()
            logger.error("Failed to update camera", error)
            raise
        finally:
            db.close()

    @staticmethod
    def delete_camera(camera_id: str) -> None:
        cid = _normalize_camera_id(camera_id)
        db = SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.camera_id == cid).first()
            if not camera:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camera not found")
            db.delete(camera)
            db.commit()
        except Exception as error:
            db.rollback()
            logger.error("Failed to delete camera", error)
            raise
        finally:
            db.close()

    @staticmethod
    def get_metrics() -> CameraMetricsResponse:
        db = SessionLocal()
        try:
            cameras = db.query(Camera).all()
            total = len(cameras)
            online = len([c for c in cameras if c.status == CameraStatus.ONLINE])
            offline = len([c for c in cameras if c.status == CameraStatus.OFFLINE])
            maintenance = len([c for c in cameras if c.status == CameraStatus.MAINTENANCE])
            recording = len([c for c in cameras if c.is_recording])
            avg_uptime = "0%"
            if total > 0:
                avg_uptime = f"{int((online / total) * 100)}%"
            return CameraMetricsResponse(
                total=total,
                online=online,
                offline=offline,
                maintenance=maintenance,
                recording=recording,
                avg_uptime=avg_uptime,
            )
        finally:
            db.close()
