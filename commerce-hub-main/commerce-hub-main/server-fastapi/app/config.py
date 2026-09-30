import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


def _split_csv(value: str) -> list[str]:
    return [s.strip() for s in value.split(",") if s.strip()]


class Settings:
    # --- Database ---
    # Full SQLAlchemy URL, e.g. postgresql+psycopg2://user:pass@host:5432/dbname
    # Falls back to assembling one from discrete DB_* vars (mirrors the old server/.env shape)
    # so existing .env files mostly still work after swapping DB_NAME's engine.
    DATABASE_URL: str = os.getenv("DATABASE_URL") or (
        "postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}".format(
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", ""),
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432"),
            name=os.getenv("DB_NAME", "biolinks"),
        )
    )

    # --- Auth ---
    # NOTE: unlike the old Express app, there is deliberately NO hardcoded fallback here.
    # A missing JWT_SECRET fails startup instead of silently signing tokens with a
    # well-known dev value (that was flagged in the security audit).
    JWT_SECRET: str = os.environ["JWT_SECRET"]
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_DAYS: int = int(os.getenv("JWT_EXPIRES_DAYS", "7"))

    # --- CORS ---
    CORS_ORIGINS: list[str] = _split_csv(os.getenv("CORS_ORIGIN", "http://localhost:8080"))

    # --- Uploads ---
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR") or (BASE_DIR / "uploads")).resolve()
    PUBLIC_URL: str = os.getenv("PUBLIC_URL", "").rstrip("/")
    MAX_UPLOAD_BYTES: int = 5 * 1024 * 1024


    # --- Chat / RAG ---
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    OPENAI_CHAT_MODEL: str = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

    # --- Server ---
    PORT: int = int(os.getenv("PORT", "3001"))

    # --- Proxy ---
    # true when every request arrives through a reverse proxy that appends the caller's
    # IP to X-Forwarded-For (Render does). Rate limits then key on that last hop.
    TRUST_PROXY: bool = os.getenv("TRUST_PROXY", "false").lower() == "true"


MIN_JWT_SECRET_LENGTH = 32

settings = Settings()
if len(settings.JWT_SECRET) < MIN_JWT_SECRET_LENGTH:
    raise SystemExit(f"JWT_SECRET must be at least {MIN_JWT_SECRET_LENGTH} characters")
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
(settings.UPLOAD_DIR / "catalog").mkdir(parents=True, exist_ok=True)
