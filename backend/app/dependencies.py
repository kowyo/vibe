from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.auth_service import auth_service

AsyncDBSession = Annotated[AsyncSession, Depends(get_db)]


def _extract_token_from_request(
    authorization: str | None = None,
    cookie: str | None = None,
    token_param: str | None = None,
) -> str | None:
    """Extract JWT token from Authorization header, cookie, or query parameter."""
    # Try Authorization header first (Bearer token)
    if authorization:
        try:
            scheme, token = authorization.split(" ", 1)
            if scheme.lower() == "bearer":
                return token
        except ValueError:
            pass
    
    # Try query parameter (for preview assets)
    if token_param:
        return token_param
    
    # Try cookie (better-auth might set session token in cookie)
    # Better-auth typically uses cookie name like "better-auth.session_token"
    # or "better-auth.sessionToken" depending on configuration
    if cookie:
        # The cookie header might contain multiple cookies, parse it
        for cookie_part in cookie.split(";"):
            cookie_part = cookie_part.strip()
            if "=" in cookie_part:
                name, value = cookie_part.split("=", 1)
                name = name.strip()
                # Check for better-auth session token cookie names
                if "session" in name.lower() and "token" in name.lower():
                    return value
    
    return None


async def get_current_user(
    request: Request,
    db: AsyncDBSession,
    authorization: Annotated[str | None, Header()] = None,
    token: str | None = None,
) -> User:
    """Dependency to get current authenticated user from bearer token, cookie, or query parameter."""
    
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
            detail="Authentication required. Provide token via Authorization header, cookie, or query parameter.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await auth_service.get_user_from_token(token_value, db)
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


# Keep the existing project_manager dependency
from app.services.project_service import ProjectManager, project_manager


def get_project_manager() -> ProjectManager:
    """FastAPI dependency that returns the shared project manager."""

    return project_manager
