"""
Event Log Service
Centralized event logging for audit trails and system events.
Generalizes AccessControlAuditLog and SecurityOperationsAuditLog patterns.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
import uuid

logger = logging.getLogger(__name__)


class EventLogService:
    """
    Centralized event logging service.
    Provides a unified interface for logging system events, user actions,
    and creating audit trails across all modules.
    """
    
    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self._events: List[Dict[str, Any]] = []  # In-memory store until DB model is ready
    
    def log_event(
        self,
        event_type: str,
        user_id: Optional[int] = None,
        description: str = "",
        severity: str = "info",
        module: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Log a system event.
        
        Args:
            event_type: Type of event (access_denied, incident_created, etc.)
            user_id: ID of the user who triggered the event
            description: Human-readable description
            severity: low, medium, high, critical
            module: Which module generated the event
            metadata: Additional structured data
        """
        event = {
            "id": str(uuid.uuid4()),
            "event_type": event_type,
            "user_id": user_id,
            "description": description,
            "severity": severity,
            "module": module,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow()
        }
        
        self._events.append(event)
        logger.info(f"Event logged: {event_type} - {description}")
        
        return event
    
    def search_events(
        self,
        query: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        severity: Optional[str] = None,
        event_type: Optional[str] = None,
        user_id: Optional[int] = None,
        module: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Search events with filtering.
        TODO: Replace with database queries when model is ready.
        """
        results = self._events.copy()
        
        if query:
            results = [e for e in results if query.lower() in e.get("description", "").lower()]
        
        if severity:
            results = [e for e in results if e.get("severity") == severity]
        
        if event_type:
            results = [e for e in results if e.get("event_type") == event_type]
        
        if user_id:
            results = [e for e in results if e.get("user_id") == user_id]
        
        if module:
            results = [e for e in results if e.get("module") == module]
        
        if start_date:
            results = [e for e in results if e.get("created_at", datetime.min) >= start_date]
        
        if end_date:
            results = [e for e in results if e.get("created_at", datetime.max) <= end_date]
        
        # Sort by timestamp descending
        results.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return results[offset:offset + limit]
    
    def get_event_statistics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        property_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get event statistics for a time period.
        """
        events = self.search_events(start_date=start_date, end_date=end_date)
        
        events_by_type: Dict[str, int] = {}
        events_by_severity: Dict[str, int] = {}
        
        for event in events:
            event_type = event.get("event_type", "unknown")
            severity = event.get("severity", "unknown")
            
            events_by_type[event_type] = events_by_type.get(event_type, 0) + 1
            events_by_severity[severity] = events_by_severity.get(severity, 0) + 1
        
        return {
            "total_events": len(events),
            "events_by_type": events_by_type,
            "events_by_severity": events_by_severity,
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            }
        }
    
    def get_recent_events(
        self,
        limit: int = 50,
        severity_filter: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get most recent events, optionally filtered by severity.
        """
        results = self._events.copy()
        
        if severity_filter:
            results = [e for e in results if e.get("severity") in severity_filter]
        
        results.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return results[:limit]
