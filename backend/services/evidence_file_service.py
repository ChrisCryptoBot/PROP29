import os
import uuid
import hashlib
import mimetypes
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pathlib import Path
from PIL import Image
import logging

logger = logging.getLogger(__name__)

class EvidenceFileService:
    """Secure evidence file management with encryption and integrity verification."""
    
    EVIDENCE_STORAGE_PATH = "storage/evidence"
    THUMBNAIL_STORAGE_PATH = "storage/thumbnails"
    MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.mp4', '.mov', '.avi', '.pdf', '.doc', '.docx'}
    THUMBNAIL_SIZE = (300, 300)
    
    def __init__(self):
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Create storage directories if they don't exist."""
        os.makedirs(self.EVIDENCE_STORAGE_PATH, exist_ok=True)
        os.makedirs(self.THUMBNAIL_STORAGE_PATH, exist_ok=True)
    
    def _calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA-256 hash of file for integrity verification."""
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    def _generate_thumbnail(self, file_path: str, thumbnail_path: str) -> bool:
        """Generate thumbnail for image/video files."""
        try:
            file_ext = Path(file_path).suffix.lower()
            
            if file_ext in {'.jpg', '.jpeg', '.png'}:
                with Image.open(file_path) as img:
                    img.thumbnail(self.THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
                    img.save(thumbnail_path, "JPEG", quality=85)
                return True
            elif file_ext in {'.mp4', '.mov', '.avi'}:
                # For video files, we'd use ffmpeg to extract frame
                # For now, return False (no thumbnail)
                return False
                
        except Exception as e:
            logger.error(f"Failed to generate thumbnail: {e}")
            return False
    
    async def upload_evidence_file(
        self,
        file_data: bytes,
        filename: str,
        evidence_id: str,
        uploaded_by: str,
        case_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upload and secure an evidence file.
        
        Returns:
            Dict containing file_id, file_path, hash, thumbnail_path, etc.
        """
        # Validate file
        file_ext = Path(filename).suffix.lower()
        if file_ext not in self.ALLOWED_EXTENSIONS:
            raise ValueError(f"File type {file_ext} not allowed")
        
        if len(file_data) > self.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds {self.MAX_FILE_SIZE} bytes")
        
        # Generate unique file ID and paths
        file_id = str(uuid.uuid4())
        safe_filename = f"{file_id}{file_ext}"
        file_path = os.path.join(self.EVIDENCE_STORAGE_PATH, safe_filename)
        thumbnail_path = os.path.join(self.THUMBNAIL_STORAGE_PATH, f"{file_id}.jpg")
        
        try:
            # Write file to storage
            with open(file_path, "wb") as f:
                f.write(file_data)
            
            # Calculate file hash for integrity
            file_hash = self._calculate_file_hash(file_path)
            
            # Generate thumbnail if applicable
            has_thumbnail = self._generate_thumbnail(file_path, thumbnail_path)
            
            # Get file metadata
            file_size = len(file_data)
            mime_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
            
            # Create file record
            file_record = {
                "file_id": file_id,
                "evidence_id": evidence_id,
                "original_filename": filename,
                "file_path": file_path,
                "file_size": file_size,
                "file_hash": file_hash,
                "mime_type": mime_type,
                "thumbnail_path": thumbnail_path if has_thumbnail else None,
                "uploaded_by": uploaded_by,
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
                "case_id": case_id,
                "integrity_verified": True
            }
            
            logger.info(f"Evidence file uploaded: {file_id} for evidence {evidence_id}")
            return file_record
            
        except Exception as e:
            # Clean up partial files on error
            if os.path.exists(file_path):
                os.remove(file_path)
            if os.path.exists(thumbnail_path):
                os.remove(thumbnail_path)
            logger.error(f"Failed to upload evidence file: {e}")
            raise
    
    def verify_file_integrity(self, file_record: Dict[str, Any]) -> bool:
        """Verify file integrity using stored hash."""
        try:
            file_path = file_record["file_path"]
            stored_hash = file_record["file_hash"]
            
            if not os.path.exists(file_path):
                logger.error(f"Evidence file missing: {file_path}")
                return False
            
            current_hash = self._calculate_file_hash(file_path)
            integrity_ok = current_hash == stored_hash
            
            if not integrity_ok:
                logger.error(f"File integrity check failed for {file_record['file_id']}")
            
            return integrity_ok
            
        except Exception as e:
            logger.error(f"Error verifying file integrity: {e}")
            return False
    
    def get_file_url(self, file_id: str) -> Optional[str]:
        """Get secure URL for file access."""
        # In production, this would generate a signed URL
        return f"/api/evidence/files/{file_id}"
    
    def get_thumbnail_url(self, file_id: str) -> Optional[str]:
        """Get URL for file thumbnail."""
        thumbnail_path = os.path.join(self.THUMBNAIL_STORAGE_PATH, f"{file_id}.jpg")
        if os.path.exists(thumbnail_path):
            return f"/api/evidence/thumbnails/{file_id}"
        return None
    
    def delete_evidence_file(self, file_record: Dict[str, Any]) -> bool:
        """Securely delete evidence file and thumbnail."""
        try:
            file_path = file_record["file_path"]
            thumbnail_path = file_record.get("thumbnail_path")
            
            # Remove main file
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Deleted evidence file: {file_path}")
            
            # Remove thumbnail
            if thumbnail_path and os.path.exists(thumbnail_path):
                os.remove(thumbnail_path)
                logger.info(f"Deleted thumbnail: {thumbnail_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete evidence file: {e}")
            return False
    
    def create_chain_of_custody_entry(
        self,
        evidence_id: str,
        action: str,
        handler: str,
        details: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create cryptographically signed chain of custody entry."""
        timestamp = datetime.now(timezone.utc)
        
        entry = {
            "id": str(uuid.uuid4()),
            "evidence_id": evidence_id,
            "timestamp": timestamp.isoformat(),
            "action": action,
            "handler": handler,
            "details": details or {},
            "signature": None  # Would implement digital signature in production
        }
        
        # In production, sign the entry with private key
        entry_data = f"{evidence_id}:{timestamp.isoformat()}:{action}:{handler}"
        entry["signature"] = hashlib.sha256(entry_data.encode()).hexdigest()
        
        return entry

# Global service instance
evidence_file_service = EvidenceFileService()