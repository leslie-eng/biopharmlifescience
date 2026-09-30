from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import load_user_roles, require_auth
from ..models import Profile, User
from ..ratelimit import client_ip, login_limiter
from ..schemas import AuthResponse, AuthUserOut, LoginBody, MeResponse, UserMetadata
from ..security import compare_password, sign_token

# Accounts are created with `python -m app.cli create-user`; there is no public sign-up.
router = APIRouter(prefix="/api/auth", tags=["auth"])


def _fetch_user_profile(db: Session, user_id: str) -> AuthUserOut | None:
    row = db.execute(
        select(User.id, User.email, Profile.full_name).join(Profile, Profile.id == User.id, isouter=True).where(User.id == user_id)
    ).first()
    if not row:
        return None
    return AuthUserOut(id=row.id, email=row.email, user_metadata=UserMetadata(full_name=row.full_name or ""))


@router.post("/login", response_model=AuthResponse)
def login(body: LoginBody, request: Request, db: Session = Depends(get_db)):
    ip = client_ip(request)
    wait = login_limiter.retry_after(ip)
    if wait is not None:
        raise HTTPException(
            status_code=429,
            detail="Too many failed sign-in attempts. Try again later.",
            headers={"Retry-After": str(wait)},
        )

    if not body.email.strip() or not body.password:
        raise HTTPException(status_code=400, detail="Email and password required")

    row = db.execute(
        select(User.id, User.password_hash).where(User.email == body.email.strip().lower())
    ).first()
    if not row or not compare_password(body.password, row.password_hash):
        login_limiter.record(ip)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = row.id
    token = sign_token(user_id)
    user = _fetch_user_profile(db, user_id)
    roles = load_user_roles(db, user_id)
    return AuthResponse(token=token, user=user, roles=roles)


@router.get("/me", response_model=MeResponse)
def me(user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    user = _fetch_user_profile(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    roles = load_user_roles(db, user_id)
    return MeResponse(user=user, roles=roles)


@router.post("/logout")
def logout():
    return {"ok": True}
