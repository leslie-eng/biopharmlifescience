"""Claiming the first admin account, and recovering it, over HTTP (no server shell needed).

Both endpoints are off (503) until their token is set in the environment, and each token
is only useful once: after use, delete it from the Render dashboard.
"""

import secrets

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.errors import AppError
from app.core.ratelimit import client_ip, setup_limiter
from app.schemas import ResetAdminPasswordBody, SetupAdminBody, SetupAdminResponse
from app.services import auth as auth_service

router = APIRouter(prefix="/api/setup", tags=["setup"])

MIN_TOKEN_LENGTH = 32

# Shown in Swagger UI next to each endpoint, so a refusal explains itself.
_TOKEN_RESPONSES = {
    403: {"description": "Wrong token (5 wrong tries per 15 minutes per IP, then 429)"},
    429: {"description": "Too many wrong tokens from this IP; see Retry-After"},
    503: {"description": "Disabled: the token isn't set in the server environment"},
}


def _check_token(request: Request, configured: str | None, given: str, code: str, what: str) -> None:
    """`code` is SETUP or RESET: errors are <code>_DISABLED and <code>_TOKEN_INVALID."""
    if not configured:
        raise AppError(503, f"{what} is disabled: set its token in the server environment first", f"{code}_DISABLED")
    if len(configured) < MIN_TOKEN_LENGTH:
        raise AppError(
            503, f"{what} is disabled: its token must be at least {MIN_TOKEN_LENGTH} characters", f"{code}_DISABLED"
        )

    ip = client_ip(request)
    wait = setup_limiter.retry_after(ip)
    if wait is not None:
        raise AppError(429, "Too many attempts. Try again later.", "RATE_LIMITED", {"Retry-After": str(wait)})
    if not secrets.compare_digest(given.encode("utf-8"), configured.encode("utf-8")):
        setup_limiter.record(ip)
        raise AppError(403, "Invalid token", f"{code}_TOKEN_INVALID")


@router.post(
    "/admin",
    status_code=201,
    response_model=SetupAdminResponse,
    responses={**_TOKEN_RESPONSES, 400: {"description": "Password too weak"}, 409: {"description": "An admin already exists; nothing was changed"}},
)
def setup_admin(body: SetupAdminBody, request: Request, db: Session = Depends(get_db)):
    """Create the first admin. Needs SETUP_TOKEN; refuses with 409 once any admin exists."""
    _check_token(request, settings.SETUP_TOKEN, body.setup_token, "SETUP", "Admin setup")
    auth_service.create_first_admin(db, body.username, body.password)
    return SetupAdminResponse(username=body.username, roles=["admin"])


@router.post(
    "/reset-admin-password",
    responses={**_TOKEN_RESPONSES, 400: {"description": "Password too weak"}, 404: {"description": "No admin with that username"}},
)
def reset_admin_password(body: ResetAdminPasswordBody, request: Request, db: Session = Depends(get_db)):
    """Set a new password for an existing admin. Needs ADMIN_RESET_TOKEN; remove it after use."""
    _check_token(request, settings.ADMIN_RESET_TOKEN, body.reset_token, "RESET", "Admin password reset")
    auth_service.reset_admin_password(db, body.username, body.new_password)
    return {"ok": True}
