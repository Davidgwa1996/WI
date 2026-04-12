from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.jwt_handler import decode_access_token
from app.database import get_db
from app.models import User

# auto_error=False lets us support optional auth for public pages
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Require a valid logged-in user.
    Used for protected routes.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.query(User).filter(User.email == payload["sub"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is inactive",
        )

    return user


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """
    Return the logged-in user if a valid token exists.
    Return None for public/preview access when no token is provided.

    Useful for routes that are visible to everyone but can show
    extra controls for signed-in users.
    """
    if db is None:
        return None

    if credentials is None or not credentials.credentials:
        return None

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        return None

    user = db.query(User).filter(User.email == payload["sub"]).first()
    if not user or not user.is_active:
        return None

    return user


def require_roles(*roles: str):
    """
    Restrict a route to one or more roles.
    Example:
        Depends(require_roles("owner", "admin"))
    """
    allowed_roles = {role.strip().lower() for role in roles if role.strip()}

    def dependency(user: User = Depends(get_current_user)) -> User:
        user_role = (user.role or "").strip().lower()

        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return dependency


def require_owner(user: User = Depends(get_current_user)) -> User:
    """
    Shortcut for owner-only routes.
    """
    if (user.role or "").strip().lower() != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner access required",
        )
    return user


def require_admin_or_owner(user: User = Depends(get_current_user)) -> User:
    """
    Shortcut for admin/owner routes.
    """
    if (user.role or "").strip().lower() not in {"owner", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or owner access required",
        )
    return user