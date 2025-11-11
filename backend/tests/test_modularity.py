"""
Tests for modularity improvements.

This module tests that the new modular structure works correctly
without breaking existing functionality.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

# Import the new modular components
from core.service_registry import ServiceRegistry, ServiceRegistryHelpers
from config import Config, get_config
from routes.auth_routes import router as auth_router
from routes.incident_routes import router as incident_router

# Import existing components for comparison
from services.auth_service import AuthService
from services.incident_service import IncidentService

class TestServiceRegistry:
    """Test the service registry functionality."""
    
    def test_service_registration(self):
        """Test that services can be registered and retrieved."""
        # Clear registry
        ServiceRegistry.clear()
        
        # Create mock service
        mock_service = Mock()
        mock_service.name = "test_service"
        
        # Register service
        ServiceRegistry.register("test_service", mock_service)
        
        # Retrieve service
        retrieved_service = ServiceRegistry.get("test_service")
        
        assert retrieved_service == mock_service
        assert retrieved_service.name == "test_service"
    
    def test_service_fallback(self):
        """Test that service registry falls back to direct instantiation."""
        # Clear registry
        ServiceRegistry.clear()
        
        # Try to get auth service (should fall back to direct instantiation)
        auth_service = ServiceRegistryHelpers.get_auth_service()
        
        assert auth_service is not None
        assert isinstance(auth_service, AuthService)
    
    def test_service_class_registration(self):
        """Test that service classes can be registered for lazy instantiation."""
        # Clear registry
        ServiceRegistry.clear()
        
        # Register service class
        ServiceRegistry.register_class("auth_service", AuthService)
        
        # Get service (should create new instance)
        auth_service = ServiceRegistry.get_or_create("auth_service")
        
        assert auth_service is not None
        assert isinstance(auth_service, AuthService)
    
    def test_list_services(self):
        """Test listing registered services."""
        # Clear registry
        ServiceRegistry.clear()
        
        # Register some services
        ServiceRegistry.register("service1", Mock())
        ServiceRegistry.register("service2", Mock())
        
        # List services
        services = ServiceRegistry.list_services()
        
        assert "service1" in services
        assert "service2" in services
        assert len(services) == 2

class TestConfiguration:
    """Test the configuration management."""
    
    def test_config_loading(self):
        """Test that configuration loads correctly."""
        config = get_config()
        
        assert config is not None
        assert hasattr(config, 'DATABASE_URL')
        assert hasattr(config, 'SECRET_KEY')
        assert hasattr(config, 'DEBUG')
    
    def test_environment_specific_config(self):
        """Test environment-specific configuration."""
        # Test development config
        dev_config = get_config()
        assert dev_config.DEBUG == True
        
        # Test production config (with environment variable)
        with patch.dict('os.environ', {'ENVIRONMENT': 'production'}):
            prod_config = get_config()
            assert prod_config.DEBUG == False
    
    def test_config_validation(self):
        """Test configuration validation."""
        config = get_config()
        
        # Should not raise exception for valid config
        assert config.validate() == True
    
    def test_feature_flags(self):
        """Test feature flags configuration."""
        config = get_config()
        feature_flags = config.get_feature_flags()
        
        assert isinstance(feature_flags, dict)
        assert 'ai_predictions' in feature_flags
        assert 'panic_button' in feature_flags
        assert 'iot_monitoring' in feature_flags
        assert 'cybersecurity_monitoring' in feature_flags

class TestRouteModularity:
    """Test that routes work correctly in modular structure."""
    
    def test_auth_router_creation(self):
        """Test that auth router can be created."""
        assert auth_router is not None
        assert hasattr(auth_router, 'routes')
    
    def test_incident_router_creation(self):
        """Test that incident router can be created."""
        assert incident_router is not None
        assert hasattr(incident_router, 'routes')
    
    def test_router_prefixes(self):
        """Test that routers have correct prefixes."""
        assert auth_router.prefix == "/auth"
        assert incident_router.prefix == "/incidents"
    
    def test_router_tags(self):
        """Test that routers have correct tags."""
        assert "Authentication" in auth_router.tags
        assert "Incidents" in incident_router.tags

class TestBackwardCompatibility:
    """Test that existing functionality still works."""
    
    def test_existing_service_imports(self):
        """Test that existing service imports still work."""
        # These should work exactly as before
        from services.auth_service import AuthService
        from services.incident_service import IncidentService
        from services.patrol_service import PatrolService
        
        assert AuthService is not None
        assert IncidentService is not None
        assert PatrolService is not None
    
    def test_existing_service_methods(self):
        """Test that existing service methods still work."""
        auth_service = AuthService()
        
        # Test that existing methods are available
        assert hasattr(auth_service, 'verify_password')
        assert hasattr(auth_service, 'get_password_hash')
        assert hasattr(auth_service, 'create_access_token')
    
    def test_service_static_methods(self):
        """Test that static methods still work."""
        # Test static method call (existing pattern)
        password = "test_password"
        hashed = AuthService.get_password_hash(password)
        
        assert hashed is not None
        assert hashed != password
        assert AuthService.verify_password(password, hashed) == True

class TestIntegration:
    """Test integration between modular components."""
    
    def test_service_registry_with_config(self):
        """Test that service registry works with configuration."""
        config = get_config()
        
        # Initialize services with config
        ServiceRegistry.clear()
        ServiceRegistry.register("config", config)
        
        # Retrieve config from registry
        retrieved_config = ServiceRegistry.get("config")
        
        assert retrieved_config == config
        assert retrieved_config.DATABASE_URL == config.DATABASE_URL
    
    def test_route_with_service_registry(self):
        """Test that routes can use service registry."""
        # This test demonstrates how routes could use the registry
        # without breaking existing functionality
        
        # Get service from registry
        auth_service = ServiceRegistryHelpers.get_auth_service()
        
        # Verify it works
        assert auth_service is not None
        assert isinstance(auth_service, AuthService)
        
        # Test that it has the expected methods
        assert hasattr(auth_service, 'authenticate_user')
        assert hasattr(auth_service, 'verify_token')

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__]) 