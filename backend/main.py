from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
import logging
from datetime import datetime, timedelta
import os
from typing import List, Optional

from database import engine, get_db
from models import Base
from schemas import *
from services.auth_service import AuthService
from services.incident_service import IncidentService
from services.patrol_service import PatrolService
from services.ai_service import AIService
from services.metrics_service import MetricsService
from services.user_service import UserService
from services.property_service import PropertyService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting PROPER 2.9 AI-Enhanced Hotel Security Platform")
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # Initialize AI models
    await AIService.initialize_models()
    
    # Start background tasks
    await MetricsService.start_background_tasks()
    
    yield
    
    # Shutdown
    logger.info("Shutting down PROPER 2.9")

# Create FastAPI app
app = FastAPI(
    title="PROPER 2.9 - AI-Enhanced Hotel Security Platform",
    description="Comprehensive hotel security management system with AI-powered analytics",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency injection
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return AuthService.verify_token(credentials.credentials)

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0",
        "service": "PROPER 2.9 API"
    }

# Authentication endpoints
@app.post("/auth/login", response_model=TokenResponse)
async def login(credentials: LoginCredentials):
    return await AuthService.authenticate_user(credentials)

@app.post("/auth/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str):
    return await AuthService.refresh_token(refresh_token)

@app.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    return await AuthService.logout_user(current_user["user_id"])

# User management
@app.get("/users/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return await UserService.get_user_by_id(current_user["user_id"])

@app.put("/users/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    return await UserService.update_user(current_user["user_id"], user_update)

# Property management
@app.get("/properties", response_model=List[PropertyResponse])
async def get_properties(current_user: dict = Depends(get_current_user)):
    return await PropertyService.get_user_properties(current_user["user_id"])

@app.get("/properties/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await PropertyService.get_property(property_id, current_user["user_id"])

# Incident management
@app.get("/incidents", response_model=List[IncidentResponse])
async def get_incidents(
    property_id: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    return await IncidentService.get_incidents(
        current_user["user_id"], property_id, status, severity
    )

@app.post("/incidents", response_model=IncidentResponse)
async def create_incident(
    incident: IncidentCreate,
    current_user: dict = Depends(get_current_user)
):
    return await IncidentService.create_incident(incident, current_user["user_id"])

@app.get("/incidents/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await IncidentService.get_incident(incident_id, current_user["user_id"])

@app.put("/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    incident_update: IncidentUpdate,
    current_user: dict = Depends(get_current_user)
):
    return await IncidentService.update_incident(
        incident_id, incident_update, current_user["user_id"]
    )

@app.delete("/incidents/{incident_id}")
async def delete_incident(
    incident_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await IncidentService.delete_incident(incident_id, current_user["user_id"])

# Patrol management
@app.get("/patrols", response_model=List[PatrolResponse])
async def get_patrols(
    property_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    return await PatrolService.get_patrols(
        current_user["user_id"], property_id, status
    )

@app.post("/patrols", response_model=PatrolResponse)
async def create_patrol(
    patrol: PatrolCreate,
    current_user: dict = Depends(get_current_user)
):
    return await PatrolService.create_patrol(patrol, current_user["user_id"])

@app.get("/patrols/{patrol_id}", response_model=PatrolResponse)
async def get_patrol(
    patrol_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await PatrolService.get_patrol(patrol_id, current_user["user_id"])

@app.put("/patrols/{patrol_id}", response_model=PatrolResponse)
async def update_patrol(
    patrol_id: str,
    patrol_update: PatrolUpdate,
    current_user: dict = Depends(get_current_user)
):
    return await PatrolService.update_patrol(
        patrol_id, patrol_update, current_user["user_id"]
    )

@app.post("/patrols/{patrol_id}/start")
async def start_patrol(
    patrol_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await PatrolService.start_patrol(patrol_id, current_user["user_id"])

@app.post("/patrols/{patrol_id}/complete")
async def complete_patrol(
    patrol_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await PatrolService.complete_patrol(patrol_id, current_user["user_id"])

# AI and Analytics
@app.get("/ai/predictions", response_model=List[PredictionResponse])
async def get_ai_predictions(
    property_id: str,
    prediction_type: str = "incidents",
    days_ahead: int = 7,
    current_user: dict = Depends(get_current_user)
):
    return await AIService.get_predictions(
        property_id, prediction_type, days_ahead, current_user["user_id"]
    )

@app.post("/ai/analyze-incident", response_model=IncidentAnalysisResponse)
async def analyze_incident(
    incident_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await AIService.analyze_incident(incident_id, current_user["user_id"])

@app.get("/ai/optimize-patrols", response_model=List[PatrolOptimizationResponse])
async def optimize_patrols(
    property_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await AIService.optimize_patrols(property_id, current_user["user_id"])

# Metrics and Dashboard
@app.get("/metrics/dashboard", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(
    property_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    return await MetricsService.get_dashboard_metrics(
        current_user["user_id"], property_id
    )

@app.get("/metrics/incidents", response_model=IncidentMetricsResponse)
async def get_incident_metrics(
    property_id: str,
    timeframe: str = "30d",
    current_user: dict = Depends(get_current_user)
):
    return await MetricsService.get_incident_metrics(
        property_id, timeframe, current_user["user_id"]
    )

@app.get("/metrics/patrols", response_model=PatrolMetricsResponse)
async def get_patrol_metrics(
    property_id: str,
    timeframe: str = "30d",
    current_user: dict = Depends(get_current_user)
):
    return await MetricsService.get_patrol_metrics(
        property_id, timeframe, current_user["user_id"]
    )

# Emergency endpoints
@app.post("/emergency/alert", response_model=EmergencyAlertResponse)
async def trigger_emergency_alert(
    alert: EmergencyAlertCreate,
    current_user: dict = Depends(get_current_user)
):
    return await IncidentService.create_emergency_alert(
        alert, current_user["user_id"]
    )

@app.post("/emergency/lockdown")
async def trigger_lockdown(
    property_id: str,
    current_user: dict = Depends(get_current_user)
):
    return await PropertyService.trigger_lockdown(property_id, current_user["user_id"])

# WebSocket for real-time updates
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket, user_id: str):
    await MetricsService.handle_websocket_connection(websocket, user_id)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 