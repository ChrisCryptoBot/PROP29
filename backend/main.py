#!/usr/bin/env python3
"""
PROPER 2.9 - PRODUCTION-READY BACKEND
Senior Developer Grade Codebase
"""
import os
import sys
import time
import json
import logging
from pathlib import Path
from fastapi import FastAPI, Request, Response, status, APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
import uvicorn

# Set environment variables FIRST
os.environ.setdefault("SECRET_KEY", "dev-secret-key-change-in-production-1234567890abcdef")
os.environ.setdefault("DATABASE_URL", "sqlite:///./proper29.db")
os.environ.setdefault("ENVIRONMENT", "development")

# Add current directory to Python path
current_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(current_dir))

from database import init_db
from services.camera_health_service import CameraHealthService
from services.auth_service import AuthService
from services.analytics_engine_service import analytics_engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import API routers
from api.auth_endpoints import router as auth_router
from api.user_endpoints import router as user_router
from api.incident_endpoints import router as incident_router
from api.guest_safety_endpoints import router as guest_safety_router
from api.visitor_endpoints import router as visitor_router
from api.access_control_endpoints import router as access_control_router
from api.lost_found_endpoints import router as lost_found_router
from api.package_endpoints import router as package_router
from api.parking_endpoints import router as parking_router
from api.security_operations_endpoints import router as security_operations_router
from api.iot_environmental_endpoints import router as iot_environmental_router
from api.hardware_control_endpoints import router as hardware_control_router
from api.banned_individuals_endpoints import router as banned_individuals_router
from api.patrol_endpoints import router as patrol_router
from api.handover_endpoints import router as handover_router
from api.equipment_endpoints import router as equipment_router
from api.maintenance_requests_endpoints import router as maintenance_requests_router
from api.lockdown_endpoints import router as lockdown_router
from api.mobile_agent_endpoints import router as mobile_agent_router

# Create FastAPI app
app = FastAPI(
    title="PROPER 2.9 - Hotel Security Management Platform",
    version="2.9.0",
    description="Comprehensive hotel security management system with AI-powered analytics",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Initialize DB tables on startup (development safe)
@app.on_event("startup")
async def startup_event():
    init_db()
    # Initialize analytics engine with sample data
    await analytics_engine.simulate_realtime_data()
    # CameraHealthService.start_background_service()

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error", 
            "detail": str(exc) if os.getenv("ENVIRONMENT") == "development" else None,
            "path": request.url.path
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error: {exc.errors()} at {request.url.path}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": "Validation error", "detail": exc.errors()}
    )

# Structured Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Extract client IP
    client_ip = request.client.host if request.client else "unknown"
    
    # Process the request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Log structured data
    log_data = {
        "method": request.method,
        "path": request.url.path,
        "status": response.status_code,
        "duration_ms": round(duration * 1000, 2),
        "ip": client_ip,
        "user_agent": request.headers.get("user-agent", "unknown")
    }
    
    logger.info(f"Request: {json.dumps(log_data)}")
    
    return response

# Add CORS middleware
allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Consolidate API routers under /api prefix
api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(incident_router)
api_router.include_router(guest_safety_router)
api_router.include_router(visitor_router)
api_router.include_router(access_control_router)
api_router.include_router(lost_found_router)
api_router.include_router(package_router)
api_router.include_router(security_operations_router)
api_router.include_router(iot_environmental_router)
api_router.include_router(hardware_control_router)
api_router.include_router(parking_router)
api_router.include_router(banned_individuals_router)
api_router.include_router(patrol_router)
api_router.include_router(handover_router)
api_router.include_router(equipment_router)
api_router.include_router(maintenance_requests_router)
api_router.include_router(lockdown_router)
api_router.include_router(mobile_agent_router)

# Include the consolidated API router in the app
app.include_router(api_router)

# Root endpoints
@app.get("/")
async def root():
    return {
        "message": "PROPER 2.9 Backend is running!",
        "status": "healthy",
        "version": "2.9.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "PROPER 2.9",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "database": "connected",
        "api_endpoints": [
            "/api/auth/login",
            "/api/auth/me",
            "/api/users/",
            "/api/incidents/",
            "/api/visitors/"
        ]
    }

# --- WebSocket Connection Manager (minimal) ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id] = [
                ws for ws in self.active_connections[user_id] if ws != websocket
            ]
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, user_id: str, message: dict):
        for ws in self.active_connections.get(user_id, []):
            await ws.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    token = websocket.query_params.get("token")
    if os.getenv("ENVIRONMENT") != "development":
        if not token:
            await websocket.close(code=1008)
            return
        try:
            AuthService.verify_token(token)
        except Exception:
            await websocket.close(code=1008)
            return
    await manager.connect(user_id, websocket)
    await manager.send_personal_message(user_id, {"type": "connected", "user_id": user_id})
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            else:
                await websocket.send_text(data)
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

if __name__ == "__main__":
    logger.info("🚀 Starting PROPER 2.9 Backend")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info("Backend will be available at: http://127.0.0.1:8000")
    logger.info("API docs will be available at: http://127.0.0.1:8000/docs")
    # NOTE (Windows): Uvicorn reload/watch mode can trigger noisy WinError 5
    # (named pipe PermissionError) in some restricted environments. Default to
    # reload OFF on Windows unless explicitly forced.
    reload_enabled = os.getenv("UVICORN_RELOAD", "true").strip().lower() in {"1", "true", "yes", "on"}
    if os.name == "nt" and os.getenv("FORCE_UVICORN_RELOAD", "").strip().lower() not in {"1", "true", "yes", "on"}:
        reload_enabled = False
    
    uvicorn.run(
        "main:app",
        host="127.0.0.1", 
        port=8000,
        log_level="info",
        reload=reload_enabled
    )
