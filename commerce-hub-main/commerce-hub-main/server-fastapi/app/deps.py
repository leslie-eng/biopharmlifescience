import jwt
from fastapi import Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import UserRole
from .security import verify_token


def _extract_bearer(authorization: str | None) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization[len("Bearer ") :]


def get_optional_user_id(authorization: str | None = Header(default=None)) -> str | None:
    """Mirrors middleware.js optionalAuth: silently ignores a missing/invalid token."""
    token = _extract_bearer(authorization)
    if not token:
        return None
    try:
        payload = verify_token(token)
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


def require_auth(authorization: str | None = Header(default=None)) -> str:
    """Mirrors middleware.js requireAuth: 401 if missing/invalid."""
    token = _extract_bearer(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        payload = verify_token(token)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return payload.get("sub")


def load_user_roles(db: Session, user_id: str) -> list[str]:
    rows = db.execute(select(UserRole.role).where(UserRole.user_id == user_id)).scalars().all()
    return list(rows)


def require_staff(
    user_id: str = Depends(require_auth),
    db: Session = Depends(get_db),
) -> tuple[str, list[str]]:
    """Mirrors middleware.js requireStaff: 403 if the user has neither admin nor staff role."""
    roles = load_user_roles(db, user_id)
    if "admin" not in roles and "staff" not in roles:
        raise HTTPException(status_code=403, detail="Staff access required")
    return user_id, roles
