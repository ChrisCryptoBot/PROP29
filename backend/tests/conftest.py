import pytest
import asyncio
from typing import AsyncGenerator, Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import get_db, Base
from models import User, Role, Permission
from schemas import UserCreate
from services.auth_service import AuthService
from services.user_service import UserService

# Test database configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db_session) -> Generator:
    """Create a test client with a fresh database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def auth_service(db_session):
    """Create an auth service instance for testing."""
    return AuthService(db_session)

@pytest.fixture
def user_service(db_session):
    """Create a user service instance for testing."""
    return UserService(db_session)

@pytest.fixture
def test_user(db_session):
    """Create a test user for authentication tests."""
    user_service = UserService(db_session)
    user_data = UserCreate(
        username="testuser",
        email="test@example.com",
        password="testpassword123",
        full_name="Test User",
        role="admin"
    )
    user = user_service.create_user(user_data)
    return user

@pytest.fixture
def auth_headers(client, test_user):
    """Get authentication headers for authenticated requests."""
    response = client.post("/auth/login", data={
        "username": "testuser",
        "password": "testpassword123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_user(db_session):
    """Create an admin user for testing."""
    user_service = UserService(db_session)
    user_data = UserCreate(
        username="admin",
        email="admin@example.com",
        password="adminpassword123",
        full_name="Admin User",
        role="admin"
    )
    user = user_service.create_user(user_data)
    return user

@pytest.fixture
def security_user(db_session):
    """Create a security user for testing."""
    user_service = UserService(db_session)
    user_data = UserCreate(
        username="security",
        email="security@example.com",
        password="securitypass123",
        full_name="Security User",
        role="security"
    )
    user = user_service.create_user(user_data)
    return user

# Mock data factories
@pytest.fixture
def sample_access_log_data():
    """Sample access log data for testing."""
    return {
        "user_id": 1,
        "door_id": "main_entrance",
        "access_type": "card",
        "status": "granted",
        "timestamp": "2024-01-15T10:30:00Z"
    }

@pytest.fixture
def sample_incident_data():
    """Sample incident data for testing."""
    return {
        "title": "Test Incident",
        "description": "Test incident description",
        "severity": "medium",
        "location": "Lobby",
        "reported_by": 1,
        "status": "open"
    }

@pytest.fixture
def sample_visitor_data():
    """Sample visitor data for testing."""
    return {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "purpose": "Meeting",
        "host_id": 1,
        "check_in_time": "2024-01-15T09:00:00Z"
    }

@pytest.fixture
def sample_package_data():
    """Sample package data for testing."""
    return {
        "tracking_number": "PKG123456789",
        "recipient_name": "Jane Smith",
        "recipient_room": "101",
        "carrier": "FedEx",
        "status": "delivered",
        "delivered_at": "2024-01-15T14:30:00Z"
    }

# WebSocket testing fixtures
@pytest.fixture
def websocket_client():
    """Create a WebSocket test client."""
    from fastapi.testclient import TestClient
    with TestClient(app) as client:
        with client.websocket_connect("/ws") as websocket:
            yield websocket

# Performance testing fixtures
@pytest.fixture
def large_dataset():
    """Create a large dataset for performance testing."""
    return [{"id": i, "data": f"test_data_{i}"} for i in range(1000)]

# Integration testing fixtures
@pytest.fixture
def external_api_mock():
    """Mock external API responses for integration testing."""
    return {
        "weather_api": {"temperature": 22, "humidity": 65},
        "payment_api": {"status": "success", "transaction_id": "txn_123"},
        "notification_api": {"status": "sent", "message_id": "msg_456"}
    } 