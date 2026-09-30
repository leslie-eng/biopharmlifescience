from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from .config import settings


def sign_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(days=settings.JWT_EXPIRES_DAYS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    """Raises jwt.PyJWTError (expired/invalid/malformed) on failure, same as the
    old auth.js verifyToken — callers catch broadly, matching the Express behavior."""
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])


def hash_password(password: str) -> str:
    # cost factor 12, matching bcryptjs.hash(password, 12) in the old backend
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def compare_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        # malformed hash in the DB — treat as no match rather than raising
        return False
