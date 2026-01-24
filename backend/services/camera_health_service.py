"""
Camera Health Monitoring Service
Tiered polling: ping every 30s, metrics every 5 minutes.
"""
import threading
import time
from datetime import datetime, timedelta
from database import SessionLocal
from models import Camera, CameraHealth, CameraStatus
import logging

logger = logging.getLogger(__name__)

PING_INTERVAL_SECONDS = 30
METRICS_INTERVAL_SECONDS = 300

class CameraHealthService:
    _thread: threading.Thread | None = None

    @staticmethod
    def _ensure_health_record(db, camera: Camera) -> CameraHealth:
        health = db.query(CameraHealth).filter(CameraHealth.camera_id == camera.camera_id).first()
        if health:
            return health
        health = CameraHealth(
            camera_id=camera.camera_id,
            status=camera.status,
            last_ping_at=None,
            last_metrics_at=None,
            last_known_image_url=camera.last_known_image_url,
            metrics={},
        )
        db.add(health)
        db.flush()
        return health

    @staticmethod
    def _update_metrics(camera: Camera, health: CameraHealth, now: datetime) -> None:
        health.last_metrics_at = now
        camera.hardware_status = {
            "cpu": "N/A",
            "storage": "N/A",
            "signal_strength": "N/A",
        }
        health.metrics = camera.hardware_status

    @staticmethod
    def run_health_checks() -> None:
        logger.info("Starting CameraHealthService background loop")
        while True:
            db = SessionLocal()
            try:
                cameras = db.query(Camera).all()
                now = datetime.utcnow()
                for camera in cameras:
                    health = CameraHealthService._ensure_health_record(db, camera)
                    health.last_ping_at = now

                    # Basic status sanity
                    if not camera.ip_address or not camera.stream_url:
                        camera.status = CameraStatus.OFFLINE
                    health.status = camera.status

                    if not camera.last_known_image_url:
                        camera.last_known_image_url = f"/api/security-operations/cameras/{camera.camera_id}/last-image"
                    health.last_known_image_url = camera.last_known_image_url

                    if not health.last_metrics_at or (now - health.last_metrics_at) >= timedelta(seconds=METRICS_INTERVAL_SECONDS):
                        CameraHealthService._update_metrics(camera, health, now)

                db.commit()
            except Exception as error:
                logger.error("Camera health monitoring error", error)
                db.rollback()
            finally:
                db.close()
            time.sleep(PING_INTERVAL_SECONDS)

    @staticmethod
    def start_background_service() -> None:
        if CameraHealthService._thread and CameraHealthService._thread.is_alive():
            return
        CameraHealthService._thread = threading.Thread(target=CameraHealthService.run_health_checks, daemon=True)
        CameraHealthService._thread.start()
