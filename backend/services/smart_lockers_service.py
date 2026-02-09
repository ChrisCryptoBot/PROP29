"""
Smart Lockers Service
Business logic for smart locker management.
Handles locker assignment, access control, and maintenance.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
import uuid

logger = logging.getLogger(__name__)


class SmartLockersService:
    """
    Service for managing smart locker operations.
    Handles locker inventory, user assignments, access logging, and maintenance.
    """
    
    def __init__(self, db: Optional[Session] = None):
        self.db = db
        # In-memory store until database models are created
        self._lockers: Dict[str, Dict[str, Any]] = {}
        self._assignments: Dict[str, Dict[str, Any]] = {}
        self._access_logs: List[Dict[str, Any]] = []
    
    def assign_locker(
        self,
        user_id: int,
        locker_id: str,
        duration_hours: int = 24,
        pin_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Assign a locker to a user for a specified duration.
        """
        assignment_id = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=duration_hours)
        
        assignment = {
            "id": assignment_id,
            "user_id": user_id,
            "locker_id": locker_id,
            "assigned_at": datetime.utcnow().isoformat(),
            "expires_at": expires_at.isoformat(),
            "pin_code": pin_code,
            "status": "active"
        }
        
        self._assignments[assignment_id] = assignment
        
        # Update locker status
        if locker_id not in self._lockers:
            self._lockers[locker_id] = {"id": locker_id, "status": "available"}
        self._lockers[locker_id]["status"] = "occupied"
        self._lockers[locker_id]["assigned_to"] = user_id
        
        logger.info(f"Locker {locker_id} assigned to user {user_id}")
        
        return {
            "assigned": True,
            "assignment_id": assignment_id,
            "locker_id": locker_id,
            "user_id": user_id,
            "expires_at": expires_at.isoformat()
        }
    
    def access_locker(
        self,
        user_id: int,
        locker_id: str,
        access_type: str = "open",
        pin_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Attempt to access a locker.
        
        Args:
            user_id: ID of the user attempting access
            locker_id: Locker to access
            access_type: "open" or "close"
            pin_code: Optional PIN for verification
        """
        # Find active assignment
        assignment = None
        for a in self._assignments.values():
            if a["locker_id"] == locker_id and a["user_id"] == user_id and a["status"] == "active":
                assignment = a
                break
        
        access_granted = assignment is not None
        
        # Log the access attempt
        access_log = {
            "id": str(uuid.uuid4()),
            "locker_id": locker_id,
            "user_id": user_id,
            "access_type": access_type,
            "access_granted": access_granted,
            "timestamp": datetime.utcnow().isoformat()
        }
        self._access_logs.append(access_log)
        
        if access_granted:
            logger.info(f"Locker {locker_id} {access_type} by user {user_id}")
        else:
            logger.warning(f"Locker access denied: {locker_id} for user {user_id}")
        
        return {
            "access_granted": access_granted,
            "locker_id": locker_id,
            "access_type": access_type,
            "timestamp": access_log["timestamp"]
        }
    
    def get_locker_status(self, locker_id: str) -> Dict[str, Any]:
        """
        Get the current status of a locker.
        """
        if locker_id in self._lockers:
            locker = self._lockers[locker_id]
            return {
                "id": locker_id,
                "available": locker.get("status") == "available",
                "status": locker.get("status", "unknown"),
                "assigned_to": locker.get("assigned_to"),
                "last_accessed": locker.get("last_accessed")
            }
        
        # Default status for unknown locker
        return {
            "id": locker_id,
            "available": True,
            "status": "available",
            "assigned_to": None,
            "last_accessed": None
        }
    
    def release_locker(self, locker_id: str, user_id: int) -> Dict[str, Any]:
        """
        Release a locker assignment.
        """
        # Find and deactivate assignment
        for a in self._assignments.values():
            if a["locker_id"] == locker_id and a["user_id"] == user_id and a["status"] == "active":
                a["status"] = "released"
                a["released_at"] = datetime.utcnow().isoformat()
                break
        
        # Update locker status
        if locker_id in self._lockers:
            self._lockers[locker_id]["status"] = "available"
            self._lockers[locker_id]["assigned_to"] = None
        
        logger.info(f"Locker {locker_id} released by user {user_id}")
        
        return {
            "released": True,
            "locker_id": locker_id
        }
    
    def get_locker_access_log(
        self,
        locker_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get access history for a locker.
        """
        logs = [log for log in self._access_logs if log["locker_id"] == locker_id]
        logs.sort(key=lambda x: x["timestamp"], reverse=True)
        return logs[:limit]
    
    def create_maintenance_request(
        self,
        locker_id: str,
        issue_type: str,
        description: str,
        reported_by: int
    ) -> Dict[str, Any]:
        """
        Create a maintenance request for a locker.
        """
        request_id = str(uuid.uuid4())
        
        # Mark locker as under maintenance
        if locker_id in self._lockers:
            self._lockers[locker_id]["status"] = "maintenance"
        
        logger.info(f"Maintenance request created for locker {locker_id}: {issue_type}")
        
        return {
            "id": request_id,
            "locker_id": locker_id,
            "issue_type": issue_type,
            "description": description,
            "reported_by": reported_by,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }
    
    def unlock_locker_remote(
        self,
        locker_id: str,
        admin_user_id: int,
        reason: str
    ) -> Dict[str, Any]:
        """
        Remotely unlock a locker (admin function).
        """
        # Log the remote unlock
        access_log = {
            "id": str(uuid.uuid4()),
            "locker_id": locker_id,
            "user_id": admin_user_id,
            "access_type": "remote_unlock",
            "access_granted": True,
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat()
        }
        self._access_logs.append(access_log)
        
        logger.info(f"Remote unlock of locker {locker_id} by admin {admin_user_id}: {reason}")
        
        return {
            "unlocked": True,
            "locker_id": locker_id,
            "unlocked_by": admin_user_id,
            "reason": reason,
            "timestamp": access_log["timestamp"]
        }
