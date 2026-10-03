"""Request dependencies that decide who the caller is and what they may reach."""

import jwt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.errors import AppError
from app.core.security import verify_token
from app.services.auth import is_staff, load_user_roles, must_change_password


# Reads `Authorization: Bearer <token>`, and tells Swagger UI's "Authorize" button where to
# sign in. auto_error=False so a missing token reaches our own 401 with the usual error body.
bearer_token = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)


def get_optional_user_id(token: str | None = Depends(bearer_token)) -> str | None:
    """The caller's user id, or None for visitors. A missing or invalid token is ignored."""
    if not token:
        return None
    try:
        payload = verify_token(token)
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


def require_auth(token: str | None = Depends(bearer_token)) -> str:
    """The caller's user id. 401 if the token is missing or invalid."""
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


def require_admin(staff: tuple[str, list[str]] = Depends(require_staff)) -> str:
    """The caller's user id. 403 unless they have the admin role (staff aren't enough)."""
    user_id, roles = staff
    if "admin" not in roles:
        raise AppError(403, "Admin access required", "ADMIN_ONLY")
    return user_id
