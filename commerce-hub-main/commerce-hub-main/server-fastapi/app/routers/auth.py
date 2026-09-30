from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import load_user_roles, require_auth
from ..models import Profile, User, UserRole
from ..schemas import AuthResponse, AuthUserOut, LoginBody, MeResponse, RegisterBody, UserMetadata
from ..security import compare_password, hash_password, sign_token
from ..utils import new_id

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _fetch_user_profile(db: Session, user_id: str) -> AuthUserOut | None:
    row = db.execute(
        select(User.id, User.email, Profile.full_name).join(Profile, Profile.id == User.id, isouter=True).where(User.id == user_id)
    ).first()
    if not row:
        return None
    return AuthUserOut(id=row.id, email=row.email, user_metadata=UserMetadata(full_name=row.full_name or ""))


@router.post("/register", status_code=201, response_model=AuthResponse)
def register(body: RegisterBody, db: Session = Depends(get_db)):
    if not body.email.strip() or not body.password or len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Valid email and password (min 6 chars) required")

    normalized_email = body.email.strip().lower()
    existing = db.execute(select(User.id).where(User.email == normalized_email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user_id = new_id()
    password_hash = hash_password(body.password)
    user_count = db.execute(select(func.count()).select_from(User)).scalar_one()
    role = "admin" if user_count == 0 else "customer"

    db.add(User(id=user_id, email=normalized_email, password_hash=password_hash, email_confirmed_at=func.now()))
    db.add(Profile(id=user_id, full_name=(body.fullName or "").strip(), email=normalized_email))
    db.add(UserRole(id=new_id(), user_id=user_id, role=role))
    db.commit()

    token = sign_token(user_id)
    user = _fetch_user_profile(db, user_id)
    roles = load_user_roles(db, user_id)
    return AuthResponse(token=token, user=user, roles=roles)


@router.post("/login", response_model=AuthResponse)
def login(body: LoginBody, db: Session = Depends(get_db)):
    if not body.email.strip() or not body.password:
        raise HTTPException(status_code=400, detail="Email and password required")

    row = db.execute(
        select(User.id, User.password_hash).where(User.email == body.email.strip().lower())
    ).first()
    if not row or not compare_password(body.password, row.password_hash):
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
