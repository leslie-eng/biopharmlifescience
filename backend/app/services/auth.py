"""Sign-in, sessions and passwords. Accounts themselves are created by app.cli (no public sign-up)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import compare_password, hash_password, password_problem, sign_token
from app.models import Profile, User, UserRole
from app.schemas import AuthResponse, AuthUserOut, MeResponse, UserMetadata

STAFF_ROLES = ("admin", "staff")

# Checked against when the email is unknown, so a miss takes as long as a wrong password
# and response times don't reveal which emails have accounts.
_DUMMY_HASH = hash_password("timing-equaliser-not-a-real-password")


def load_user_roles(db: Session, user_id: str) -> list[str]:
    return list(db.execute(select(UserRole.role).where(UserRole.user_id == user_id)).scalars().all())


def is_staff(roles: list[str]) -> bool:
    return any(role in roles for role in STAFF_ROLES)


def must_change_password(db: Session, user_id: str) -> bool:
    return bool(db.execute(select(User.must_change_password).where(User.id == user_id)).scalar())


def _profile(db: Session, user_id: str) -> AuthUserOut | None:
    row = db.execute(
        select(User.id, User.email, Profile.full_name)
        .join(Profile, Profile.id == User.id, isouter=True)
        .where(User.id == user_id)
    ).first()
    if not row:
        return None
    return AuthUserOut(id=row.id, email=row.email, user_metadata=UserMetadata(full_name=row.full_name or ""))


def session_for(db: Session, user_id: str) -> AuthResponse:
    """A fresh token plus everything the frontend needs to know about the signed-in user."""
    return AuthResponse(
        token=sign_token(user_id),
        user=_profile(db, user_id),
        roles=load_user_roles(db, user_id),
        must_change_password=must_change_password(db, user_id),
    )


def authenticate(db: Session, email: str, password: str) -> str:
    """The user id for these credentials. Raises AppError(401, INVALID_CREDENTIALS) otherwise."""
    if not email.strip() or not password:
        raise AppError(400, "Email and password required", "CREDENTIALS_REQUIRED")
    row = db.execute(select(User.id, User.password_hash).where(User.email == email.strip().lower())).first()
    password_ok = compare_password(password, row.password_hash if row else _DUMMY_HASH)
    if not row or not password_ok:
        raise AppError(401, "Invalid email or password", "INVALID_CREDENTIALS")
    return row.id


def current_user(db: Session, user_id: str) -> MeResponse:
    user = _profile(db, user_id)
    if not user:
        raise AppError(404, "User not found", "USER_NOT_FOUND")
    return MeResponse(
        user=user, roles=load_user_roles(db, user_id), must_change_password=must_change_password(db, user_id)
    )


def change_password(db: Session, user_id: str, current_password: str, new_password: str) -> AuthResponse:
    """Replace the password and clear any temporary-password flag. Returns a fresh session."""
    user = db.get(User, user_id)
    if not user:
        raise AppError(401, "Invalid or expired session", "SESSION_INVALID")
    if not compare_password(current_password, user.password_hash):
        raise AppError(401, "Current password is incorrect", "CURRENT_PASSWORD_INCORRECT")

    problem = password_problem(new_password)
    if problem:
        raise AppError(400, problem, "WEAK_PASSWORD")
    if new_password == current_password:
        raise AppError(400, "New password must be different from the current one", "PASSWORD_UNCHANGED")

    user.password_hash = hash_password(new_password)
    user.must_change_password = False
    db.commit()
    return session_for(db, user_id)
