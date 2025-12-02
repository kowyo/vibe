from __future__ import annotations

from http.cookies import CookieError, SimpleCookie
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import HTTPConnection

from app.config import settings
from app.database import AsyncSessionLocal, get_db
from app.models.user import User
from app.repositories.project_repository import ProjectRepository
from app.services.auth_service import auth_service
from app.services.build_service import BuildService
from app.services.claude_service import ClaudeService
from app.services.fallback_generator import FallbackGenerator
from app.services.notification_service import NotificationService
from app.services.preview_service import PreviewService
from app.services.project_service import ProjectService
from app.services.task_service import TaskService

AsyncDBSession = Annotated[AsyncSession, Depends(get_db)]


TOKEN_COOKIE_KEYS = (
    "better-auth.session_token",
    "better-auth.sessionToken",
    "session_token",
    "sessionToken",
)


def _extract_token_from_request(
    authorization: str | None = None,
    cookie: str | None = None,
    token_param: str | None = None,
) -> str | None:
    """Extract JWT token from Authorization header, cookie, or query parameter."""

    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]

    if token_param:
        return token_param

    if not cookie:
        return None

    try:
        jar = SimpleCookie()
        jar.load(cookie)
        cookies = {name: morsel.value for name, morsel in jar.items()}
    except CookieError:
        # Malformed cookie header - gracefully return None
        return None

    for key in TOKEN_COOKIE_KEYS:
        if key in cookies:
            return cookies[key]

    for name, value in cookies.items():
        normalized = name.lower()
        if "token" in normalized and ("session" in normalized or "better-auth" in normalized):
            return value

    return None


async def get_current_user(
    request: Request,
    db: AsyncDBSession,
    authorization: Annotated[str | None, Header()] = None,
    token: Annotated[str | None, Query()] = None,
) -> User:
    """Dependency to get current authenticated user from bearer token,
    cookie, or query parameter."""

    # Get all cookies from request headers
    cookies_str = request.headers.get("cookie", "")

    # Try to extract token from various sources
    token_value = _extract_token_from_request(
        authorization=authorization,
        cookie=cookies_str,
        token_param=token,
    )

    if not token_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Authentication required. Provide token via Authorization header, "
                "cookie, or query parameter."
            ),
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await auth_service.get_user_from_token(token_value, db)

    # Store the token in request state so it can be accessed by endpoints
    request.state.auth_token = token_value

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_user_optional(
    request: Request,
    db: AsyncDBSession,
    authorization: Annotated[str | None, Header()] = None,
    token: Annotated[str | None, Query()] = None,
) -> User | None:
    """Optional dependency to get current authenticated user from bearer token,
    cookie, or query parameter. Returns None if no token is found instead of raising an error."""

    # Get all cookies from request headers
    cookies_str = request.headers.get("cookie", "")

    # Try to extract token from various sources
    token_value = _extract_token_from_request(
        authorization=authorization,
        cookie=cookies_str,
        token_param=token,
    )

    if not token_value:
        # No token found, return None (don't raise error)
        return None

    try:
        user = await auth_service.get_user_from_token(token_value, db)
        # Store the token in request state so it can be accessed by endpoints
        request.state.auth_token = token_value
        return user
    except Exception:
        # If token validation fails, return None instead of raising
        return None


OptionalUser = Annotated[User | None, Depends(get_current_user_optional)]


def get_notification_service(connection: HTTPConnection) -> NotificationService:
    return connection.app.state.notification_service


def get_task_service(connection: HTTPConnection) -> TaskService:
    return connection.app.state.task_service


def get_build_service() -> BuildService:
    return BuildService()


def get_preview_service() -> PreviewService:
    return PreviewService(settings.api_prefix)


def get_claude_service() -> ClaudeService:
    return ClaudeService()


def get_fallback_generator() -> FallbackGenerator:
    return FallbackGenerator()


def get_project_repository(db: AsyncDBSession) -> ProjectRepository:
    return ProjectRepository(db)


def get_project_service(
    repository: Annotated[ProjectRepository, Depends(get_project_repository)],
    notification_service: Annotated[NotificationService, Depends(get_notification_service)],
    task_service: Annotated[TaskService, Depends(get_task_service)],
    build_service: Annotated[BuildService, Depends(get_build_service)],
    preview_service: Annotated[PreviewService, Depends(get_preview_service)],
    claude_service: Annotated[ClaudeService, Depends(get_claude_service)],
    fallback_generator: Annotated[FallbackGenerator, Depends(get_fallback_generator)],
) -> ProjectService:
    return ProjectService(
        repository=repository,
        notification_service=notification_service,
        task_service=task_service,
        build_service=build_service,
        preview_service=preview_service,
        claude_service=claude_service,
        fallback_generator=fallback_generator,
        session_factory=AsyncSessionLocal,
        base_dir=settings.projects_root,
    )


ProjectServiceDep = Annotated[ProjectService, Depends(get_project_service)]
