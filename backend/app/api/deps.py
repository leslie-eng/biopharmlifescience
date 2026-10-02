"""Request dependencies that decide who the caller is and what they may reach."""

import jwt
from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.errors import AppError
from app.core.security import verify_token
from app.services.auth import is_staff, load_user_roles, must_change_password


def _extract_bearer(authorization: str | None) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization[len("Bearer ") :]


def get_optional_user_id(authorization: str | None = Header(default=None)) -> str | None:
    """The caller's user id, or None for visitors. A missing or invalid token is ignored."""
    token = _extract_bearer(authorization)
    if not token:
        return None
    try:
        payload = verify_token(token)
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


def require_auth(authorization: str | None = Header(default=None)) -> str:
    """The caller's user id. 401 if the token is missing or invalid."""
    token = _extract_bearer(authorization)
    if not token:
        raise AppError(401, "Authentication required", "AUTH_REQUIRED")
    try:
        payload = verify_token(token)
    except jwt.PyJWTError:
        raise AppError(401, "Invalid or expired session", "SESSION_INVALID")
    return payload.get("sub")


def require_staff(
    user_id: str = Depends(require_auth),
    db: Session = Depends(get_db),
) -> tuple[str, list[str]]:
    """403 if the user has neither admin nor staff role, or still has a temporary password."""
    roles = load_user_roles(db, user_id)
    if not is_staff(roles):
        raise AppError(403, "Staff access required", "STAFF_ONLY")
    if must_change_password(db, user_id):
        raise AppError(403, "Password change required", "PASSWORD_CHANGE_REQUIRED")
    return user_id, roles
