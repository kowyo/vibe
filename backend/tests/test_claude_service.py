import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.services.claude_service import ClaudeService
from app.models.project import ProjectRequest


class TestClaudeService:
    @pytest.fixture
    def claude_service(self):
        return ClaudeService()

    @pytest.fixture
    def mock_project_request(self):
        return ProjectRequest(
            prompt="Create a simple todo app",
            user_id="test-user-123"
        )

    @pytest.mark.asyncio
    async def test_generate_project_success(self, claude_service, mock_project_request):
        # Mock the Claude API response
        mock_response = Mock()
        mock_response.content = [
            Mock(
                type='text',
                text='''{
                "project_name": "Todo App",
                "files": [
                    {
                        "path": "index.html",
                        "content": "<html><body>Hello World</body></html>"
                    }
                ],
                "preview_server": {
                    "port": 3000,
                    "framework": "vanilla"
                }
            }'''
            )
        ]

        with patch.object(claude_service, 'client') as mock_client:
            mock_client.messages.create = AsyncMock(return_value=mock_response)
            
            result = await claude_service.generate_project(mock_project_request)
            
            assert result.project_name == "Todo App"
            assert len(result.files) == 1
            assert result.files[0].path == "index.html"
            assert result.preview_server.port == 3000
            assert result.preview_server.framework == "vanilla"

    @pytest.mark.asyncio
    async def test_generate_project_invalid_json(self, claude_service, mock_project_request):
        # Mock invalid JSON response
        mock_response = Mock()
        mock_response.content = [
            Mock(
                type='text',
                text='invalid json response'
            )
        ]

        with patch.object(claude_service, 'client') as mock_client:
            mock_client.messages.create = AsyncMock(return_value=mock_response)
            
            with pytest.raises(ValueError, match="Failed to parse Claude response"):
                await claude_service.generate_project(mock_project_request)

    @pytest.mark.asyncio
    async def test_generate_project_empty_response(self, claude_service, mock_project_request):
        # Mock empty response
        mock_response = Mock()
        mock_response.content = []

        with patch.object(claude_service, 'client') as mock_client:
            mock_client.messages.create = AsyncMock(return_value=mock_response)
            
            with pytest.raises(ValueError, match="No content in Claude response"):
                await claude_service.generate_project(mock_project_request)

    @pytest.mark.asyncio
    async def test_generate_project_api_error(self, claude_service, mock_project_request):
        # Mock API error
        with patch.object(claude_service, 'client') as mock_client:
            mock_client.messages.create = AsyncMock(side_effect=Exception("API Error"))
            
            with pytest.raises(Exception, match="API Error"):
                await claude_service.generate_project(mock_project_request)

    @pytest.mark.asyncio
    async def test_generate_project_missing_required_fields(self, claude_service, mock_project_request):
        # Mock response with missing required fields
        mock_response = Mock()
        mock_response.content = [
            Mock(
                type='text',
                text='{"project_name": "Todo App"}'  # Missing files and preview_server
            )
        ]

        with patch.object(claude_service, 'client') as mock_client:
            mock_client.messages.create = AsyncMock(return_value=mock_response)
            
            with pytest.raises(ValueError, match="Missing required fields"):
                await claude_service.generate_project(mock_project_request)

    def test_claude_service_initialization(self, claude_service):
        """Test that ClaudeService initializes correctly with API key."""
        assert claude_service.client is not None
        assert hasattr(claude_service, 'model')
        assert claude_service.model == "claude-3-5-sonnet-20241022"