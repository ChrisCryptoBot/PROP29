import os
import uuid
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class RecordingExportService:
    """Recording export system with format conversion and batch operations."""
    
    RECORDINGS_STORAGE_PATH = "storage/recordings"
    EXPORTS_STORAGE_PATH = "storage/exports"
    MAX_EXPORT_SIZE = 2 * 1024 * 1024 * 1024  # 2GB
    SUPPORTED_FORMATS = ["mp4", "avi", "mov", "webm"]
    DEFAULT_RETENTION_DAYS = 90
    
    def __init__(self):
        self._ensure_directories()
        self._export_queue: List[Dict[str, Any]] = []
    
    def _ensure_directories(self):
        """Create storage directories if they don't exist."""
        os.makedirs(self.RECORDINGS_STORAGE_PATH, exist_ok=True)
        os.makedirs(self.EXPORTS_STORAGE_PATH, exist_ok=True)
    
    async def export_recording(
        self,
        recording_id: str,
        format: str = "mp4",
        quality: str = "high",
        user_id: str = None
    ) -> Dict[str, Any]:
        """Export a single recording with format conversion."""
        if format not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported format: {format}")
        
        export_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)
        
        export_job = {
            "export_id": export_id,
            "recording_id": recording_id,
            "format": format,
            "quality": quality,
            "status": "pending",
            "created_at": timestamp.isoformat(),
            "user_id": user_id,
            "progress": 0,
            "file_path": None,
            "file_size": 0,
            "error_message": None
        }
        
        try:
            # Simulate processing (in production, would use ffmpeg)
            export_job["status"] = "processing"
            self._export_queue.append(export_job)
            
            # Mock export processing
            await asyncio.sleep(0.1)  # Simulate processing time
            
            # Generate export file path
            export_filename = f"{recording_id}_{export_id}.{format}"
            export_path = os.path.join(self.EXPORTS_STORAGE_PATH, export_filename)
            
            # Simulate file creation (mock data)
            mock_content = f"Mock exported recording data for {recording_id}".encode()
            with open(export_path, "wb") as f:
                f.write(mock_content)
            
            export_job.update({
                "status": "completed",
                "progress": 100,
                "file_path": export_path,
                "file_size": len(mock_content),
                "completed_at": datetime.now(timezone.utc).isoformat()
            })
            
            logger.info(f"Recording exported: {recording_id} -> {export_id}")
            return export_job
            
        except Exception as e:
            export_job.update({
                "status": "failed",
                "error_message": str(e),
                "failed_at": datetime.now(timezone.utc).isoformat()
            })
            logger.error(f"Recording export failed: {e}")
            raise
    
    async def export_recordings_batch(
        self,
        recording_ids: List[str],
        format: str = "mp4",
        quality: str = "high",
        user_id: str = None
    ) -> Dict[str, Any]:
        """Export multiple recordings as a batch."""
        batch_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)
        
        batch_job = {
            "batch_id": batch_id,
            "recording_ids": recording_ids,
            "format": format,
            "quality": quality,
            "status": "pending",
            "created_at": timestamp.isoformat(),
            "user_id": user_id,
            "total_count": len(recording_ids),
            "completed_count": 0,
            "failed_count": 0,
            "exports": [],
            "archive_path": None
        }
        
        try:
            batch_job["status"] = "processing"
            
            # Process each recording
            for recording_id in recording_ids:
                try:
                    export_result = await self.export_recording(
                        recording_id, format, quality, user_id
                    )
                    batch_job["exports"].append(export_result)
                    batch_job["completed_count"] += 1
                except Exception as e:
                    batch_job["failed_count"] += 1
                    batch_job["exports"].append({
                        "recording_id": recording_id,
                        "status": "failed",
                        "error_message": str(e)
                    })
            
            # Create archive if successful exports
            if batch_job["completed_count"] > 0:
                archive_path = await self._create_batch_archive(batch_job)
                batch_job["archive_path"] = archive_path
            
            batch_job.update({
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat()
            })
            
            logger.info(f"Batch export completed: {batch_id} ({batch_job['completed_count']}/{batch_job['total_count']})")
            return batch_job
            
        except Exception as e:
            batch_job.update({
                "status": "failed",
                "error_message": str(e),
                "failed_at": datetime.now(timezone.utc).isoformat()
            })
            logger.error(f"Batch export failed: {e}")
            raise
    
    async def _create_batch_archive(self, batch_job: Dict[str, Any]) -> str:
        """Create ZIP archive of batch export."""
        # In production, would create actual ZIP file
        archive_filename = f"batch_{batch_job['batch_id']}.zip"
        archive_path = os.path.join(self.EXPORTS_STORAGE_PATH, archive_filename)
        
        # Mock archive creation
        mock_content = f"Mock batch archive for {batch_job['batch_id']}".encode()
        with open(archive_path, "wb") as f:
            f.write(mock_content)
        
        return archive_path
    
    def get_export_status(self, export_id: str) -> Optional[Dict[str, Any]]:
        """Get status of an export job."""
        for export_job in self._export_queue:
            if export_job["export_id"] == export_id:
                return export_job
        return None
    
    def list_user_exports(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """List export jobs for a specific user."""
        user_exports = [
            job for job in self._export_queue 
            if job.get("user_id") == user_id
        ]
        return sorted(user_exports, key=lambda x: x["created_at"], reverse=True)[:limit]
    
    def cleanup_old_exports(self, days_old: int = 7) -> int:
        """Clean up export files older than specified days."""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_old)
        cleaned_count = 0
        
        try:
            for export_job in self._export_queue[:]:
                created_at = datetime.fromisoformat(export_job["created_at"].replace('Z', '+00:00'))
                
                if created_at < cutoff_date:
                    # Remove export file
                    if export_job.get("file_path") and os.path.exists(export_job["file_path"]):
                        os.remove(export_job["file_path"])
                    
                    # Remove from queue
                    self._export_queue.remove(export_job)
                    cleaned_count += 1
            
            logger.info(f"Cleaned up {cleaned_count} old export files")
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Export cleanup failed: {e}")
            return 0
    
    def apply_retention_policy(self, retention_days: int = None) -> Dict[str, int]:
        """Apply retention policy to recordings."""
        days = retention_days or self.DEFAULT_RETENTION_DAYS
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Mock retention policy application
        result = {
            "scanned_count": 100,  # Mock
            "deleted_count": 15,   # Mock
            "archived_count": 5,   # Mock
            "retention_days": days
        }
        
        logger.info(f"Retention policy applied: {result}")
        return result

# Global service instance
recording_export_service = RecordingExportService()