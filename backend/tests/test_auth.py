import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from app.main import app
from app.dependencies import get_current_user
from app.models.auth import User

client = TestClient(app)

@pytest.fixture
def mock_user():
    return User(
        id="test-user-id",
        email="test@example.com",
        name="Test User",
        created_at="2024-01-01T00:00:00Z"
    )

@pytest.fixture
def authenticated_client(mock_user):
    def override_get_current_user():
        return mock_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield client
    app.dependency_overrides.clear()

class TestAuthEndpoints:
    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}

    def test_generate_endpoint_requires_auth(self):
        response = client.post("/api/generate", json={"prompt": "test"})
        assert response.status_code == 401

    def test_get_projects_requires_auth(self):
        response = client.get("/api/projects")
        assert response.status_code == 401

    @patch('app.services.project_service.ProjectService.create_project')
    def test_generate_with_auth(self, mock_create_project, authenticated_client):
        mock_create_project.return_value = {
            "id": "test-project-id",
            "status": "generating",
            "prompt": "test prompt"
        }
        
        response = authenticated_client.post("/api/generate", json={"prompt": "test prompt"})
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "test-project-id"
        assert data["status"] == "generating"

    @patch('app.services.project_service.ProjectService.get_user_projects')
    def test_get_projects_with_auth(self, mock_get_projects, authenticated_client):
        mock_get_projects.return_value = []
        
        response = authenticated_client.get("/api/projects")
        assert response.status_code == 200
        assert response.json() == []

class TestSecurityHeaders:
    def test_security_headers_present(self):
        response = client.get("/health")
        
        # Check for security headers
        assert 'x-content-type-options' in response.headers
        assert response.headers['x-content-type-options'] == 'nosniff'
        
        # Note: Other security headers are set by Next.js in production
        # These would be tested in the full integration environment