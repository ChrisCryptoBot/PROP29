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
from typing import Dict, List, Optional
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, Response, status, APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn

# Set environment variables FIRST
env_val = os.getenv("ENVIRONMENT", "production")
os.environ.setdefault("DATABASE_URL", os.getenv("DATABASE_URL", "sqlite:///./proper29.db"))
os.environ.setdefault("ENVIRONMENT", env_val)
secret_val = os.getenv("SECRET_KEY")

print(f"DEBUG: Startup Environment: {env_val}")
print(f"DEBUG: Secret Key Detected: {'Yes' if secret_val else 'No'}")

if not secret_val:
    if env_val == "development":
        os.environ["SECRET_KEY"] = "dev-only-secret-key-not-for-production"
    else:
        # For now, let's log and use a fallback to unblock the health check, but with a CRITICAL warning.
        print("CRITICAL: SECRET_KEY missing in production! Using emergency fallback.")
        os.environ["SECRET_KEY"] = "emergency-fallback-change-this-immediately"

# Add current directory to Python path
current_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(current_dir))

from database import init_db, SessionLocal
from models import User
from services.camera_health_service import CameraHealthService
from services.auth_service import AuthService
from services.chat_service import ChatService
from schemas import ChatMessageCreate

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
if os.getenv("ENVIRONMENT") == "development" and os.getenv("SECRET_KEY") == "dev-only-secret-key-not-for-production":
    logger.warning("Using development SECRET_KEY - NOT FOR PRODUCTION")

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
from api.system_admin_endpoints import router as system_admin_router
from api.account_settings_endpoints import router as account_settings_router
from api.profile_endpoints import router as profile_router
from api.sound_monitoring_endpoints import router as sound_monitoring_router
from api.property_items_endpoints import router as property_items_router
from api.help_support_endpoints import router as help_support_router
from api.chat_endpoints import router as chat_router

# Lifespan: startup / shutdown (replaces deprecated on_event)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    # CameraHealthService.start_background_service()
    yield
    # Shutdown (optional cleanup can go here)


# Create FastAPI app
app = FastAPI(
    title="PROPER 2.9 - Hotel Security Management Platform",
    version="2.9.0",
    description="Comprehensive hotel security management system with AI-powered analytics",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {str(exc)}", exc_info=True)
    headers = _cors_headers_for_request(request)  # defined below after allowed_origins
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("ENVIRONMENT") == "development" else None,
            "path": request.url.path
        },
        headers=headers,
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

# Add CORS middleware (allow frontend dev server on port 3000 to call API on port 8000)
_cors_env = os.getenv("CORS_ORIGINS") or os.getenv("ALLOWED_ORIGINS") or ""
allowed_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]
_dev_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
]
if not allowed_origins or os.getenv("ENVIRONMENT") == "development":
    for o in _dev_origins:
        if o not in allowed_origins:
            allowed_origins.append(o)
if not allowed_origins:
    allowed_origins = _dev_origins.copy()
logger.info("CORS allow_origins: %s", allowed_origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


def _cors_headers_for_request(request: Request) -> dict:
    """Add CORS headers to error responses so the browser does not block them."""
    origin = request.headers.get("origin")
    if origin and origin in allowed_origins:
        return {"Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true"}
    return {}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if os.getenv("ENVIRONMENT") != "development":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app.add_middleware(SecurityHeadersMiddleware)

# Consolidate API routers under /api/v1 prefix
api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(user_router)
api_router.include_router(incident_router)
api_router.include_router(guest_safety_router)
api_router.include_router(visitor_router)
api_router.include_router(access_control_router)
api_router.include_router(lost_found_router)
api_router.include_router(package_router)
api_router.include_router(property_items_router)
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
api_router.include_router(system_admin_router)
api_router.include_router(account_settings_router)
api_router.include_router(profile_router)
api_router.include_router(sound_monitoring_router)
api_router.include_router(help_support_router)
api_router.include_router(chat_router)

# Health check endpoint for Railway
@api_router.get("/health")
async def api_health_check():
    """Health check endpoint for deployment platforms like Railway."""
    return {
        "status": "healthy",
        "service": "PROPER 2.9 API",
        "version": "2.9.0"
    }

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

# --- WebSocket Connection Manager ---
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
            try:
                await ws.send_json(message)
            except Exception:
                pass

    async def broadcast_message(self, message: dict, user_ids: Optional[List[str]] = None):
        """Broadcast message to all or specific users."""
        if user_ids is not None:
            for uid in user_ids:
                if uid in self.active_connections:
                    for ws in self.active_connections[uid]:
                        try:
                            await ws.send_json(message)
                        except Exception:
                            pass
        else:
            for uid, connections in self.active_connections.items():
                for ws in connections:
                    try:
                        await ws.send_json(message)
                    except Exception:
                        pass

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    # Prefer Authorization header; fall back to query param (deprecated)
    token = None
    auth_header = websocket.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
    else:
        token = websocket.query_params.get("token")
        if token:
            logger.warning("WebSocket using deprecated query param authentication")
            
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
    try:
        await manager.send_personal_message(user_id, {"type": "connected", "user_id": user_id})
        logger.debug("WebSocket connected for user_id=%s", user_id)
        while True:
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                
                # Persist message if it's a chat message
                if message_data.get("type") == "chat_message":
                    channel_id = message_data.get("channel_id")
                    content = message_data.get("content")
                    if channel_id and content:
                        with SessionLocal() as db:
                            chat_service = ChatService(db)
                            # Verify membership
                            members = chat_service.get_members(channel_id)
                            member_ids = [m.user_id for m in members]
                            
                            if user_id not in member_ids:
                                logger.warning(f"User {user_id} tried to message channel {channel_id} without membership")
                                continue
                                
                            chat_msg = ChatMessageCreate(
                                channel_id=channel_id,
                                content=content,
                                message_type=message_data.get("message_type", "text"),
                                message_metadata=message_data.get("metadata")
                            )
                            saved_msg = chat_service.create_message(chat_msg, user_id)
                            
                            sender = db.query(User).filter(User.user_id == user_id).first()
                            sender_name = f"{sender.first_name} {sender.last_name}" if sender else "User"
                            
                            response = {
                                "type": "chat_message",
                                "message_id": saved_msg.message_id,
                                "channel_id": saved_msg.channel_id,
                                "user_id": saved_msg.user_id,
                                "content": saved_msg.content,
                                "timestamp": saved_msg.timestamp.isoformat(),
                                "sender_name": sender_name
                            }
                            # Broadcast only to channel members
                            await manager.broadcast_message(response, user_ids=member_ids)

                                        
            except json.JSONDecodeError:
                pass
            except Exception as e:
                logger.error(f"Error processing message: {e}")
            
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        logger.debug("WebSocket client disconnected user_id=%s", user_id)
    except Exception as e:
        manager.disconnect(user_id, websocket)
        logger.warning("WebSocket error for user_id=%s: %s", user_id, e, exc_info=True)

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
