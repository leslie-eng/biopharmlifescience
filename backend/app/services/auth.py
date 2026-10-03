"""Sign-in, sessions and passwords. Accounts are created by app.cli, or the very first admin by /api/setup/admin."""

import logging

from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import compare_password, hash_password, password_problem, sign_token
from app.models import Profile, User, UserRole
from app.schemas import AuthResponse, AuthUserOut, MeResponse, UserMetadata
from app.utils import new_id

logger = logging.getLogger("biolinks_api")

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

    problem = password_problem(new_password, user.email)
    if problem:
        raise AppError(400, problem, "WEAK_PASSWORD")
    if new_password == current_password:
        raise AppError(400, "New password must be different from the current one", "PASSWORD_UNCHANGED")

    user.password_hash = hash_password(new_password)
    user.must_change_password = False
    db.commit()
    return session_for(db, user_id)


def change_username(db: Session, user_id: str, current_password: str, new_username: str) -> AuthResponse:
    """Change the sign-in email (the "username"). Needs the current password. Returns a fresh session."""
    user = db.get(User, user_id)
    if not user:
        raise AppError(401, "Invalid or expired session", "SESSION_INVALID")
    if not compare_password(current_password, user.password_hash):
        raise AppError(401, "Current password is incorrect", "CURRENT_PASSWORD_INCORRECT")

    new_username = new_username.strip().lower()
    if db.execute(select(User.id).where(User.email == new_username, User.id != user_id)).first():
        raise AppError(409, "That username is already in use", "USERNAME_TAKEN")
    user.email = new_username
    if user.profile:
        user.profile.email = new_username
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(409, "That username is already in use", "USERNAME_TAKEN")
    logger.info("Admin %s changed their username", user_id)
    return session_for(db, user_id)


# Serializes first-admin setup across concurrent requests (and processes): the lock is held
# until the transaction ends, so "is there an admin yet?" and the insert can't interleave.
_FIRST_ADMIN_LOCK_KEY = 0x0B10_AD01


def create_first_admin(db: Session, username: str, password: str) -> str:
    """Create the first admin account. Refuses (409) if any admin already exists; changes nothing then."""
    username = username.strip().lower()
    problem = password_problem(password, username)
    if problem:
        raise AppError(400, problem, "WEAK_PASSWORD")

    try:
        db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": _FIRST_ADMIN_LOCK_KEY})
        if db.execute(select(UserRole.id).where(UserRole.role == "admin").limit(1)).first():
            raise AppError(409, "An admin already exists. Sign in instead.", "ADMIN_EXISTS")
        if db.execute(select(User.id).where(User.email == username)).first():
            raise AppError(409, "An account with that username already exists", "ADMIN_EXISTS")

        user_id = new_id()
        db.add(User(id=user_id, email=username, password_hash=hash_password(password)))
        db.flush()
        db.add(Profile(id=user_id, full_name="", email=username))
        db.add(UserRole(id=new_id(), user_id=user_id, role="admin"))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(409, "An account with that username already exists", "ADMIN_EXISTS")
    except Exception:
        db.rollback()
        raise
    logger.warning("First admin %s created through /api/setup/admin; remove SETUP_TOKEN now", username)
    return user_id


def reset_admin_password(db: Session, username: str, new_password: str) -> None:
    """Recovery without a shell: set a new password for an existing admin account."""
    username = username.strip().lower()
    user = db.execute(
        select(User)
        .join(UserRole, UserRole.user_id == User.id)
        .where(User.email == username, UserRole.role == "admin")
    ).scalar_one_or_none()
    if not user:
        raise AppError(404, "No admin account with that username", "ADMIN_NOT_FOUND")
    problem = password_problem(new_password, username)
    if problem:
        raise AppError(400, problem, "WEAK_PASSWORD")

    user.password_hash = hash_password(new_password)
    user.must_change_password = False
    db.commit()
    logger.warning("Admin %s password reset through /api/setup/reset-admin-password; remove ADMIN_RESET_TOKEN now", user.id)
