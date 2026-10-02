from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import require_auth
from app.core.database import get_db
from app.core.errors import AppError
from app.core.ratelimit import client_ip, login_limiter
from app.schemas import AuthResponse, ChangePasswordBody, LoginBody, MeResponse
from app.services import auth as auth_service

# Accounts are created with `python -m app.cli create-user`; there is no public sign-up.
router = APIRouter(prefix="/api/auth", tags=["auth"])

# Failures that count towards the per-IP sign-in limit.
_GUESS_CODES = {"INVALID_CREDENTIALS", "CURRENT_PASSWORD_INCORRECT"}


def _refuse_if_rate_limited(ip: str) -> None:
    wait = login_limiter.retry_after(ip)
    if wait is not None:
        raise AppError(
            429, "Too many failed sign-in attempts. Try again later.", "RATE_LIMITED", {"Retry-After": str(wait)}
        )


def _record_guess(ip: str, exc: AppError) -> None:
    if exc.code in _GUESS_CODES:
        login_limiter.record(ip)


@router.post("/login", response_model=AuthResponse)
def login(body: LoginBody, request: Request, db: Session = Depends(get_db)):
    ip = client_ip(request)
    _refuse_if_rate_limited(ip)
    try:
        user_id = auth_service.authenticate(db, body.email, body.password)
    except AppError as exc:
        _record_guess(ip, exc)
        raise
    return auth_service.session_for(db, user_id)


@router.get("/me", response_model=MeResponse)
def me(user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    return auth_service.current_user(db, user_id)


@router.post("/change-password", response_model=AuthResponse)
def change_password(
    body: ChangePasswordBody,
    request: Request,
    user_id: str = Depends(require_auth),
    db: Session = Depends(get_db),
):
    # Wrong current passwords count towards the sign-in limit, so this can't be used to guess one.
    ip = client_ip(request)
    _refuse_if_rate_limited(ip)
    try:
        return auth_service.change_password(db, user_id, body.current_password, body.new_password)
    except AppError as exc:
        _record_guess(ip, exc)
        raise


@router.post("/logout")
def logout():
    return {"ok": True}
