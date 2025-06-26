from typing import Dict, Any, List
from datetime import datetime, timedelta
import logging
import random
import asyncio

logger = logging.getLogger(__name__)

class MetricsService:
    _background_tasks_started = False
    
    @staticmethod
    async def start_background_tasks():
        """Start background tasks for metrics collection"""
        if not MetricsService._background_tasks_started:
            logger.info("Starting background metrics tasks...")
            MetricsService._background_tasks_started = True
            logger.info("Background metrics tasks started")
    
    @staticmethod
    async def get_dashboard_metrics(user_id: str, property_id: str = None) -> Dict[str, Any]:
        """Get comprehensive dashboard metrics"""
        # Simulate real-time metrics
        active_incidents = random.randint(0, 5)
        guards_on_duty = random.randint(2, 8)
        ai_optimized_patrols = random.randint(1, 4)
        security_alerts = random.randint(0, 3)
        patrol_efficiency_score = random.uniform(75, 95)
        cyber_threats_blocked = random.randint(10, 50)
        guest_safety_score = random.uniform(85, 98)
        biometric_access_events = random.randint(100, 500)
        
        iot_sensor_status = {
            "total_sensors": 45,
            "online": 42,
            "offline": 2,
            "maintenance": 1,
            "health_score": 93.3
        }
        
        response_time_averages = {
            "theft": random.uniform(2.5, 5.0),
            "disturbance": random.uniform(1.5, 3.0),
            "medical": random.uniform(1.0, 2.5),
            "fire": random.uniform(0.5, 1.5),
            "cyber": random.uniform(3.0, 6.0)
        }
        
        recent_incidents = [
            {
                "id": "inc-001",
                "type": "theft",
                "severity": "medium",
                "location": "Room 205",
                "time": datetime.utcnow() - timedelta(hours=2),
                "status": "investigating"
            },
            {
                "id": "inc-002", 
                "type": "disturbance",
                "severity": "low",
                "location": "Lobby",
                "time": datetime.utcnow() - timedelta(hours=4),
                "status": "resolved"
            }
        ]
        
        upcoming_patrols = [
            {
                "id": "pat-001",
                "guard": "John Smith",
                "route": "Main Building",
                "start_time": datetime.utcnow() + timedelta(minutes=30),
                "estimated_duration": 45
            },
            {
                "id": "pat-002",
                "guard": "Sarah Johnson", 
                "route": "Parking Areas",
                "start_time": datetime.utcnow() + timedelta(hours=1),
                "estimated_duration": 30
            }
        ]
        
        system_status = {
            "overall_health": "excellent",
            "camera_systems": "operational",
            "access_control": "operational", 
            "alarm_systems": "operational",
            "network": "operational",
            "ai_models": "operational"
        }
        
        return {
            "active_incidents": active_incidents,
            "guards_on_duty": guards_on_duty,
            "ai_optimized_patrols": ai_optimized_patrols,
            "security_alerts": security_alerts,
            "patrol_efficiency_score": patrol_efficiency_score,
            "cyber_threats_blocked": cyber_threats_blocked,
            "guest_safety_score": guest_safety_score,
            "biometric_access_events": biometric_access_events,
            "iot_sensor_status": iot_sensor_status,
            "response_time_averages": response_time_averages,
            "recent_incidents": recent_incidents,
            "upcoming_patrols": upcoming_patrols,
            "system_status": system_status
        }
    
    @staticmethod
    async def get_incident_metrics(property_id: str, timeframe: str, user_id: str) -> Dict[str, Any]:
        """Get incident metrics for a specific timeframe"""
        total_incidents = random.randint(50, 200)
        
        incidents_by_type = {
            "theft": random.randint(10, 30),
            "disturbance": random.randint(15, 40),
            "medical": random.randint(5, 15),
            "fire": random.randint(0, 3),
            "cyber": random.randint(2, 8),
            "other": random.randint(8, 20)
        }
        
        incidents_by_severity = {
            "low": random.randint(20, 50),
            "medium": random.randint(15, 35),
            "high": random.randint(5, 15),
            "critical": random.randint(0, 5)
        }
        
        incidents_by_status = {
            "open": random.randint(2, 8),
            "investigating": random.randint(3, 10),
            "resolved": random.randint(40, 150),
            "closed": random.randint(5, 20)
        }
        
        average_resolution_time = random.uniform(2.5, 8.0)
        
        incidents_trend = []
        for i in range(30):
            date = datetime.utcnow() - timedelta(days=29-i)
            incidents_trend.append({
                "date": date.strftime("%Y-%m-%d"),
                "count": random.randint(0, 8),
                "resolved": random.randint(0, 6)
            })
        
        top_locations = [
            {"location": "Parking Lot A", "incidents": random.randint(8, 15)},
            {"location": "Lobby", "incidents": random.randint(5, 12)},
            {"location": "Pool Area", "incidents": random.randint(3, 8)},
            {"location": "Guest Rooms Floor 2", "incidents": random.randint(2, 6)},
            {"location": "Restaurant", "incidents": random.randint(1, 4)}
        ]
        
        monthly_comparison = {
            "current_month": total_incidents,
            "previous_month": random.randint(40, 180),
            "change_percentage": random.uniform(-20, 30)
        }
        
        return {
            "total_incidents": total_incidents,
            "incidents_by_type": incidents_by_type,
            "incidents_by_severity": incidents_by_severity,
            "incidents_by_status": incidents_by_status,
            "average_resolution_time": average_resolution_time,
            "incidents_trend": incidents_trend,
            "top_locations": top_locations,
            "monthly_comparison": monthly_comparison
        }
    
    @staticmethod
    async def get_patrol_metrics(property_id: str, timeframe: str, user_id: str) -> Dict[str, Any]:
        """Get patrol metrics for a specific timeframe"""
        total_patrols = random.randint(100, 300)
        completed_patrols = int(total_patrols * random.uniform(0.85, 0.98))
        average_efficiency_score = random.uniform(75, 95)
        
        patrols_by_type = {
            "scheduled": random.randint(60, 200),
            "ai_optimized": random.randint(20, 80),
            "emergency": random.randint(5, 15),
            "custom": random.randint(10, 30)
        }
        
        average_duration = random.uniform(25, 60)
        incidents_found = random.randint(5, 25)
        
        efficiency_trend = []
        for i in range(30):
            date = datetime.utcnow() - timedelta(days=29-i)
            efficiency_trend.append({
                "date": date.strftime("%Y-%m-%d"),
                "efficiency": random.uniform(70, 100),
                "patrols_completed": random.randint(3, 8)
            })
        
        guard_performance = [
            {"guard": "John Smith", "efficiency": random.uniform(80, 95), "patrols": random.randint(20, 40)},
            {"guard": "Sarah Johnson", "efficiency": random.uniform(75, 90), "patrols": random.randint(15, 35)},
            {"guard": "Mike Davis", "efficiency": random.uniform(70, 85), "patrols": random.randint(10, 25)},
            {"guard": "Lisa Wilson", "efficiency": random.uniform(85, 98), "patrols": random.randint(18, 30)}
        ]
        
        return {
            "total_patrols": total_patrols,
            "completed_patrols": completed_patrols,
            "average_efficiency_score": average_efficiency_score,
            "patrols_by_type": patrols_by_type,
            "average_duration": average_duration,
            "incidents_found": incidents_found,
            "efficiency_trend": efficiency_trend,
            "guard_performance": guard_performance
        }
    
    @staticmethod
    async def handle_websocket_connection(websocket, user_id: str):
        """Handle WebSocket connection for real-time updates"""
        try:
            while True:
                # Send real-time metrics every 30 seconds
                metrics = await MetricsService.get_dashboard_metrics(user_id)
                await websocket.send_json(metrics)
                await asyncio.sleep(30)
        except Exception as e:
            logger.error(f"WebSocket error: {str(e)}")
        finally:
            await websocket.close() 