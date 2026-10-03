from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings

# bcrypt only reads the first 72 bytes; longer passwords are refused rather than truncated.
MIN_PASSWORD_LENGTH = 12
MAX_PASSWORD_BYTES = 72
MIN_DISTINCT_CHARACTERS = 5
# Fragments that make a password one of the first a guesser tries.
COMMON_FRAGMENTS = ("password", "passw0rd", "123456", "654321", "qwerty", "letmein", "welcome", "iloveyou")


def password_problem(password: str, username: str | None = None) -> str | None:
    """Why `password` is not acceptable as a new password, or None if it is."""
    if len(password) < MIN_PASSWORD_LENGTH:
        return f"Password must be at least {MIN_PASSWORD_LENGTH} characters"
    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        return f"Password must be at most {MAX_PASSWORD_BYTES} bytes"
    lowered = password.lower()
    if len(set(lowered)) < MIN_DISTINCT_CHARACTERS:
        return "Password is too repetitive"
    if any(fragment in lowered for fragment in COMMON_FRAGMENTS):
        return "Password is too easy to guess"
    name = (username or "").strip().lower().split("@")[0]
    if len(name) >= 3 and name in lowered:
        return "Password must not contain the username"
    return None


def sign_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
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
