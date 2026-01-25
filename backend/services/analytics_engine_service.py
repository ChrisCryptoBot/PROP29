import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Tuple
import statistics
import logging

logger = logging.getLogger(__name__)

class AnalyticsEngine:
    """Real-time analytics engine for security operations data."""
    
    def __init__(self):
        self._motion_events: List[Dict[str, Any]] = []
        self._camera_health_data: Dict[str, List[Dict[str, Any]]] = {}
        self._alert_history: List[Dict[str, Any]] = []
        self._performance_metrics: Dict[str, Any] = {}
    
    async def process_motion_event(self, event: Dict[str, Any]) -> None:
        """Process a motion detection event."""
        event["processed_at"] = datetime.now(timezone.utc).isoformat()
        self._motion_events.append(event)
        
        # Keep only recent events (last 24 hours)
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        self._motion_events = [
            e for e in self._motion_events 
            if datetime.fromisoformat(e["timestamp"].replace('Z', '+00:00')) > cutoff
        ]
        
        # Check for alert conditions
        await self._check_alert_conditions(event)
    
    async def process_camera_health_update(self, camera_id: str, health_data: Dict[str, Any]) -> None:
        """Process camera health/status update."""
        if camera_id not in self._camera_health_data:
            self._camera_health_data[camera_id] = []
        
        health_entry = {
            **health_data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        self._camera_health_data[camera_id].append(health_entry)
        
        # Keep only recent data (last 7 days)
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        self._camera_health_data[camera_id] = [
            entry for entry in self._camera_health_data[camera_id]
            if datetime.fromisoformat(entry["timestamp"].replace('Z', '+00:00')) > cutoff
        ]
    
    async def _check_alert_conditions(self, motion_event: Dict[str, Any]) -> None:
        """Check if motion event triggers any alert conditions."""
        camera_id = motion_event.get("camera_id")
        
        # Check for motion frequency alerts
        recent_motion = [
            e for e in self._motion_events
            if e.get("camera_id") == camera_id and
            datetime.fromisoformat(e["timestamp"].replace('Z', '+00:00')) > 
            datetime.now(timezone.utc) - timedelta(minutes=10)
        ]
        
        if len(recent_motion) > 5:  # More than 5 motion events in 10 minutes
            alert = {
                "id": f"alert-{len(self._alert_history)}",
                "type": "high_motion_frequency", 
                "camera_id": camera_id,
                "severity": "medium",
                "message": f"High motion frequency detected on {motion_event.get('camera_name', camera_id)}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {"motion_count": len(recent_motion), "time_window": "10_minutes"}
            }
            self._alert_history.append(alert)
            logger.warning(f"Alert triggered: {alert['message']}")
    
    def get_motion_analytics(self, hours: int = 24) -> Dict[str, Any]:
        """Get motion detection analytics for specified time period."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        recent_events = [
            e for e in self._motion_events
            if datetime.fromisoformat(e["timestamp"].replace('Z', '+00:00')) > cutoff
        ]
        
        if not recent_events:
            return {
                "total_events": 0,
                "events_by_camera": {},
                "events_by_hour": [],
                "peak_activity_hour": None,
                "average_events_per_hour": 0
            }
        
        # Events by camera
        events_by_camera = {}
        for event in recent_events:
            camera_id = event.get("camera_id", "unknown")
            camera_name = event.get("camera_name", camera_id)
            if camera_name not in events_by_camera:
                events_by_camera[camera_name] = 0
            events_by_camera[camera_name] += 1
        
        # Events by hour
        events_by_hour = {}
        for event in recent_events:
            timestamp = datetime.fromisoformat(event["timestamp"].replace('Z', '+00:00'))
            hour = timestamp.strftime("%H:00")
            if hour not in events_by_hour:
                events_by_hour[hour] = 0
            events_by_hour[hour] += 1
        
        # Find peak activity
        peak_activity_hour = max(events_by_hour.items(), key=lambda x: x[1])[0] if events_by_hour else None
        
        return {
            "total_events": len(recent_events),
            "events_by_camera": events_by_camera,
            "events_by_hour": [{"hour": h, "count": c} for h, c in sorted(events_by_hour.items())],
            "peak_activity_hour": peak_activity_hour,
            "average_events_per_hour": len(recent_events) / hours
        }
    
    def get_camera_performance_analytics(self) -> Dict[str, Any]:
        """Get camera performance and health analytics."""
        camera_stats = {}
        
        for camera_id, health_data in self._camera_health_data.items():
            if not health_data:
                continue
            
            # Calculate uptime
            online_entries = [e for e in health_data if e.get("status") == "online"]
            uptime_percentage = (len(online_entries) / len(health_data)) * 100 if health_data else 0
            
            # Calculate response times if available
            response_times = [e.get("response_time", 0) for e in health_data if e.get("response_time")]
            avg_response_time = statistics.mean(response_times) if response_times else None
            
            # Check for recent issues
            recent_issues = [
                e for e in health_data[-10:]  # Last 10 entries
                if e.get("status") != "online"
            ]
            
            camera_stats[camera_id] = {
                "uptime_percentage": round(uptime_percentage, 2),
                "average_response_time": round(avg_response_time, 2) if avg_response_time else None,
                "recent_issues_count": len(recent_issues),
                "last_status": health_data[-1].get("status") if health_data else "unknown",
                "data_points": len(health_data)
            }
        
        return camera_stats
    
    def get_alert_analytics(self, hours: int = 24) -> Dict[str, Any]:
        """Get alert and incident analytics."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        recent_alerts = [
            alert for alert in self._alert_history
            if datetime.fromisoformat(alert["timestamp"].replace('Z', '+00:00')) > cutoff
        ]
        
        # Count by severity
        alerts_by_severity = {}
        for alert in recent_alerts:
            severity = alert.get("severity", "unknown")
            if severity not in alerts_by_severity:
                alerts_by_severity[severity] = 0
            alerts_by_severity[severity] += 1
        
        # Count by type
        alerts_by_type = {}
        for alert in recent_alerts:
            alert_type = alert.get("type", "unknown")
            if alert_type not in alerts_by_type:
                alerts_by_type[alert_type] = 0
            alerts_by_type[alert_type] += 1
        
        # Calculate response time (mock data)
        avg_response_time = "2.3 min" if recent_alerts else "N/A"
        
        return {
            "total_alerts": len(recent_alerts),
            "alerts_by_severity": alerts_by_severity,
            "alerts_by_type": alerts_by_type,
            "average_response_time": avg_response_time,
            "most_common_type": max(alerts_by_type.items(), key=lambda x: x[1])[0] if alerts_by_type else None
        }
    
    def get_comprehensive_analytics(self) -> Dict[str, Any]:
        """Get comprehensive analytics combining all data sources."""
        motion_analytics = self.get_motion_analytics(24)
        camera_performance = self.get_camera_performance_analytics()
        alert_analytics = self.get_alert_analytics(24)
        
        # Calculate overall system health score
        camera_uptime_scores = [
            stats["uptime_percentage"] for stats in camera_performance.values()
            if stats["uptime_percentage"] is not None
        ]
        avg_system_uptime = statistics.mean(camera_uptime_scores) if camera_uptime_scores else 0
        
        # Determine peak activity period
        peak_activity = motion_analytics.get("peak_activity_hour", "N/A")
        
        return {
            "motion_events": motion_analytics["total_events"],
            "alerts_triggered": alert_analytics["total_alerts"],
            "average_response_time": alert_analytics["average_response_time"],
            "peak_activity": f"{peak_activity}" if peak_activity != "N/A" else "No activity",
            "system_uptime": f"{avg_system_uptime:.1f}%" if avg_system_uptime else "N/A",
            "camera_performance": camera_performance,
            "motion_analytics": motion_analytics,
            "alert_analytics": alert_analytics,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    
    def generate_trend_data(self, days: int = 7) -> Dict[str, List[Dict[str, Any]]]:
        """Generate trend data for charts and graphs."""
        # Generate mock trend data for demonstration
        trends = {
            "motion_trends": [],
            "alert_trends": [],
            "uptime_trends": []
        }
        
        # Generate daily data points
        for i in range(days):
            date = datetime.now(timezone.utc) - timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            
            # Mock motion trend (would be calculated from real data)
            motion_count = max(0, 50 + (i * 2) + (i % 3 * 10))  # Mock pattern
            trends["motion_trends"].append({
                "date": date_str,
                "count": motion_count
            })
            
            # Mock alert trend
            alert_count = max(0, 5 + (i % 4))  # Mock pattern
            trends["alert_trends"].append({
                "date": date_str,
                "count": alert_count
            })
            
            # Mock uptime trend
            uptime = max(85, 99 - (i % 2 * 3))  # Mock pattern
            trends["uptime_trends"].append({
                "date": date_str,
                "percentage": uptime
            })
        
        # Reverse to get chronological order
        for trend_name in trends:
            trends[trend_name].reverse()
        
        return trends
    
    async def simulate_realtime_data(self) -> None:
        """Simulate real-time data generation for demonstration."""
        # Generate some mock motion events
        cameras = [
            {"id": "cam-1", "name": "North Lobby"},
            {"id": "cam-2", "name": "East Parking Lot"},
            {"id": "cam-3", "name": "West Corridor"}
        ]
        
        # Add some motion events
        for i in range(10):
            camera = cameras[i % len(cameras)]
            motion_event = {
                "id": f"motion-{i}",
                "camera_id": camera["id"],
                "camera_name": camera["name"],
                "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=i*5)).isoformat(),
                "confidence": 0.85 + (i % 3) * 0.05,
                "detection_zone": f"Zone {(i % 3) + 1}"
            }
            await self.process_motion_event(motion_event)
        
        # Add some camera health data
        for camera in cameras:
            health_data = {
                "status": "online" if camera["id"] != "cam-2" else "offline",
                "response_time": 120 + (hash(camera["id"]) % 50),
                "stream_quality": "good",
                "last_motion": datetime.now(timezone.utc).isoformat()
            }
            await self.process_camera_health_update(camera["id"], health_data)

# Global analytics engine instance
analytics_engine = AnalyticsEngine()