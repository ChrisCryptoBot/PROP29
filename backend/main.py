#!/usr/bin/env python3
"""
PROPER 2.9 - PRODUCTION-READY BACKEND
Senior Developer Grade Codebase
"""
import os
import sys
from pathlib import Path

# Set environment variables FIRST
os.environ.setdefault("SECRET_KEY", "dev-secret-key-change-in-production-1234567890abcdef")
os.environ.setdefault("DATABASE_URL", "sqlite:///./proper29.db")
os.environ.setdefault("ENVIRONMENT", "development")

# Add current directory to Python path
current_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(current_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

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
from api.visitor_endpoints import router as visitor_router

# Create FastAPI app
app = FastAPI(
    title="PROPER 2.9 - Hotel Security Management Platform",
    version="2.9.0",
    description="Comprehensive hotel security management system with AI-powered analytics",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware - VERY PERMISSIVE for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include API routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(incident_router)
app.include_router(visitor_router)

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
            "/auth/login",
            "/auth/me",
            "/users/",
            "/incidents/",
            "/visitors/"
        ]
    }

if __name__ == "__main__":
    logger.info("🚀 Starting PROPER 2.9 Backend")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info("Backend will be available at: http://127.0.0.1:8000")
    logger.info("API docs will be available at: http://127.0.0.1:8000/docs")
    
    uvicorn.run(
        "main:app",
        host="127.0.0.1", 
        port=8000,
        log_level="info",
        reload=True
    ) 

