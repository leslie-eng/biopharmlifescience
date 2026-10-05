"""Test harness: real PostgreSQL, the real FastAPI app over HTTP, the real CLI.

Set TEST_DATABASE_URL to point at a throwaway database; it is wiped before every test.
Default matches: docker run -d --name biolinks-test-pg -e POSTGRES_PASSWORD=test \
    -e POSTGRES_DB=biolinks_test -p 55432:5432 postgres:17-alpine
Product images go to a real S3-compatible server: `docker compose up -d s3` (TEST_S3_ENDPOINT_URL
overrides it). Bucket biolinks-test is emptied before every test.
"""

import os
import tempfile
from pathlib import Path

import pytest

SERVER_DIR = Path(__file__).resolve().parent.parent

# app.config reads the environment at import time, so this must run before any app import.
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg2://postgres:test@localhost:55432/biolinks_test"
)
os.environ["JWT_SECRET"] = "test-secret-" + "x" * 40
os.environ["UPLOAD_DIR"] = tempfile.mkdtemp(prefix="biolinks-uploads-")
os.environ["PUBLIC_URL"] = "http://api.test"
os.environ["TRUST_PROXY"] = "true"
os.environ["AWS_ENDPOINT_URL_S3"] = os.environ.get("TEST_S3_ENDPOINT_URL", "http://localhost:59000")
os.environ["AWS_ACCESS_KEY_ID"] = "test-key"
os.environ["AWS_SECRET_ACCESS_KEY"] = "test-secret"
os.environ["AWS_REGION"] = "us-east-1"
os.environ["S3_BUCKET_NAME"] = "biolinks-test"
os.environ.pop("OPENAI_API_KEY", None)

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app import cli  # noqa: E402
from app.core.database import engine  # noqa: E402
from app.main import app  # noqa: E402
from app.core.ratelimit import chat_limiter, login_limiter, setup_limiter  # noqa: E402
from app.services import storage  # noqa: E402


def bucket_keys() -> list[str]:
    """Every object key in the test bucket."""
    s3, bucket = storage._client(), os.environ["S3_BUCKET_NAME"]
    return sorted(o["Key"] for o in s3.list_objects_v2(Bucket=bucket).get("Contents", []))


def alembic(*args: str) -> None:
    from alembic.config import main as alembic_main

    alembic_main(argv=["-c", str(SERVER_DIR / "alembic.ini"), *args])


@pytest.fixture(scope="session", autouse=True)
def schema():
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
    alembic("upgrade", "head")


@pytest.fixture(autouse=True)
def clean_state(schema):
    with engine.begin() as conn:
        tables = conn.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'alembic_version'")
        ).scalars().all()
        conn.execute(text(f"TRUNCATE {', '.join(tables)} RESTART IDENTITY CASCADE"))
    for key in bucket_keys():
        storage._client().delete_object(Bucket=os.environ["S3_BUCKET_NAME"], Key=key)
    login_limiter.reset()
    chat_limiter.reset()
    setup_limiter.reset()


@pytest.fixture
def client():
    return TestClient(app)


def create_user(email: str, password: str = "correct-horse-battery", role: str = "staff") -> None:
    exit_code = cli.main(["create-user", "--email", email, "--password", password, "--role", role])
    assert exit_code == 0


def login(client: TestClient, email: str, password: str = "correct-horse-battery") -> dict:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['token']}"}


@pytest.fixture
def staff_headers(client):
    create_user("cashier@biolinks.test", role="staff")
    return login(client, "cashier@biolinks.test")


@pytest.fixture
def customer_headers(client):
    create_user("visitor@example.test", role="customer")
    return login(client, "visitor@example.test")
