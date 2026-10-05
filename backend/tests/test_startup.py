"""The API refuses to start with an unsafe JWT secret (audit C4)."""

import os
import subprocess
import sys

from conftest import SERVER_DIR


def start_with(jwt_secret):
    env = {**os.environ}
    if jwt_secret is None:
        env.pop("JWT_SECRET", None)
    else:
        env["JWT_SECRET"] = jwt_secret
    return subprocess.run(
        [sys.executable, "-c", "import app.main"], cwd=SERVER_DIR, env=env, capture_output=True, text=True
    )


def test_refuses_to_start_without_a_jwt_secret():
    result = start_with(None)

    assert result.returncode != 0
    assert "JWT_SECRET" in result.stderr


def test_refuses_to_start_with_a_short_jwt_secret():
    result = start_with("dev-only-change-me")

    assert result.returncode != 0
    assert "JWT_SECRET must be at least 32 characters" in result.stderr


def test_starts_with_a_long_jwt_secret():
    assert start_with("k" * 48).returncode == 0


def test_cors_origins_forgive_trailing_slashes_quotes_and_spaces():
    from app.core.config import _cors_origins

    value = ' "https://www.biopharmlifescience.co.ke/", https://biopharmlifescience.co.ke ,, '

    assert _cors_origins(value) == ["https://www.biopharmlifescience.co.ke", "https://biopharmlifescience.co.ke"]


def test_refuses_to_start_without_image_storage_settings():
    env = {**os.environ, "JWT_SECRET": "k" * 48}
    env.pop("S3_BUCKET_NAME")
    env["AWS_REGION"] = ""
    result = subprocess.run(
        [sys.executable, "-c", "import app.main"], cwd=SERVER_DIR, env=env, capture_output=True, text=True
    )

    assert result.returncode != 0
    assert "set AWS_REGION, S3_BUCKET_NAME" in result.stderr
