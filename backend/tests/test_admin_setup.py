"""First-admin setup, Swagger login and credential recovery, all over HTTP (no shell needed)."""

from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from conftest import create_user, login

SETUP_TOKEN = "setup-" + "s" * 40
RESET_TOKEN = "reset-" + "r" * 40
EMAIL = "owner@biolinks.test"
PASSWORD = "Teal-Harbour-Lantern-58"


@pytest.fixture
def setup_enabled(monkeypatch):
    monkeypatch.setattr(settings, "SETUP_TOKEN", SETUP_TOKEN)


def setup_admin(client, username=EMAIL, password=PASSWORD, token=SETUP_TOKEN):
    return client.post("/api/setup/admin", json={"username": username, "password": password, "setup_token": token})


def token_login(client, username, password):
    return client.post("/api/auth/token", data={"username": username, "password": password})


# --- POST /api/setup/admin -------------------------------------------------------------


def test_setup_is_refused_while_no_setup_token_is_configured(client, monkeypatch):
    monkeypatch.setattr(settings, "SETUP_TOKEN", None)

    res = setup_admin(client)

    assert res.status_code == 503
    assert res.json()["code"] == "SETUP_DISABLED"


def test_setup_rejects_a_wrong_setup_token(client, setup_enabled):
    res = setup_admin(client, token="not-the-token")

    assert res.status_code == 403
    assert res.json()["code"] == "SETUP_TOKEN_INVALID"


def test_setup_creates_the_first_admin_and_never_echoes_the_password(client, setup_enabled):
    res = setup_admin(client, username="  Owner@Biolinks.test ")

    assert res.status_code == 201
    assert res.json() == {"username": EMAIL, "roles": ["admin"]}
    assert PASSWORD not in res.text and "$2b$" not in res.text

    token = token_login(client, EMAIL, PASSWORD)
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token.json()['access_token']}"})
    assert me.json()["roles"] == ["admin"]
    assert me.json()["must_change_password"] is False


def test_setup_refuses_once_an_admin_exists_and_changes_nothing(client, setup_enabled):
    assert setup_admin(client).status_code == 201

    res = setup_admin(client, username="intruder@biolinks.test", password="Another-Long-Passphrase-9")

    assert res.status_code == 409
    assert res.json()["code"] == "ADMIN_EXISTS"
    assert token_login(client, EMAIL, PASSWORD).status_code == 200
    assert token_login(client, "intruder@biolinks.test", "Another-Long-Passphrase-9").status_code == 401


def test_setup_refuses_when_an_admin_was_created_another_way(client, setup_enabled):
    create_user("cli-admin@biolinks.test", role="admin")

    assert setup_admin(client).status_code == 409


def test_concurrent_setups_create_exactly_one_admin(setup_enabled):
    def attempt(i):
        with TestClient(app) as c:
            return setup_admin(c, username=f"racer{i}@biolinks.test").status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses = sorted(pool.map(attempt, range(2)))

    assert statuses == [201, 409]


@pytest.mark.parametrize(
    "password",
    ["short-pw-1", "aaaaaaaaaaaaaaaa", "MyPassword-2026!", "owner-is-the-best-1"],
    ids=["too-short", "repetitive", "common-word", "contains-username"],
)
def test_setup_rejects_weak_passwords(client, setup_enabled, password):
    res = setup_admin(client, password=password)

    assert res.status_code == 400
    assert res.json()["code"] == "WEAK_PASSWORD"


@pytest.mark.parametrize("username", ["ab", "not-an-email", "x" * 45 + "@b.test"])
def test_setup_validates_the_username(client, setup_enabled, username):
    res = setup_admin(client, username=username)

    assert res.status_code == 422
    assert res.json()["code"] == "VALIDATION_ERROR"


def test_setup_is_rate_limited_per_ip(client, setup_enabled):
    for _ in range(5):
        assert setup_admin(client, token="guess").status_code == 403

    blocked = setup_admin(client)

    assert blocked.status_code == 429
    assert "Retry-After" in blocked.headers


# --- POST /api/auth/token (Swagger's Authorize button) ----------------------------------


def test_token_endpoint_issues_a_bearer_token(client):
    create_user(EMAIL, password=PASSWORD, role="admin")

    res = token_login(client, EMAIL, PASSWORD)

    assert res.status_code == 200
    assert res.json()["token_type"] == "bearer"
    assert client.get("/api/orders", headers={"Authorization": f"Bearer {res.json()['access_token']}"}).status_code == 200


def test_token_endpoint_gives_the_same_error_for_unknown_users_and_wrong_passwords(client):
    create_user(EMAIL, password=PASSWORD, role="admin")

    wrong_password = token_login(client, EMAIL, "Wrong-Passphrase-123")
    unknown_user = token_login(client, "nobody@biolinks.test", PASSWORD)

    assert wrong_password.status_code == unknown_user.status_code == 401
    assert wrong_password.json() == unknown_user.json() == {
        "error": "Incorrect username or password",
        "code": "INVALID_CREDENTIALS",
    }


def test_token_endpoint_shares_the_sign_in_rate_limit(client):
    for _ in range(5):
        assert token_login(client, EMAIL, "Wrong-Passphrase-123").status_code == 401

    assert token_login(client, EMAIL, PASSWORD).status_code == 429


def test_swagger_is_told_where_to_get_a_token():
    schemes = app.openapi()["components"]["securitySchemes"]

    flows = [s["flows"]["password"]["tokenUrl"] for s in schemes.values() if s.get("type") == "oauth2"]
    assert flows == ["/api/auth/token"]


# --- POST /api/admin/change-username ----------------------------------------------------


def change_username(client, headers, current_password, new_username):
    return client.post(
        "/api/admin/change-username",
        headers=headers,
        json={"current_password": current_password, "new_username": new_username},
    )


def test_admin_can_change_their_username(client):
    create_user(EMAIL, password=PASSWORD, role="admin")
    headers = login(client, EMAIL, PASSWORD)

    res = change_username(client, headers, PASSWORD, "New.Owner@biolinks.test")

    assert res.status_code == 200
    assert res.json()["user"]["email"] == "new.owner@biolinks.test"
    assert token_login(client, "new.owner@biolinks.test", PASSWORD).status_code == 200
    assert token_login(client, EMAIL, PASSWORD).status_code == 401


def test_change_username_needs_the_current_password(client):
    create_user(EMAIL, password=PASSWORD, role="admin")
    headers = login(client, EMAIL, PASSWORD)

    res = change_username(client, headers, "Wrong-Passphrase-123", "new.owner@biolinks.test")

    assert res.status_code == 401
    assert res.json()["code"] == "CURRENT_PASSWORD_INCORRECT"


def test_change_username_refuses_a_taken_username(client):
    create_user(EMAIL, password=PASSWORD, role="admin")
    create_user("taken@biolinks.test", role="staff")
    headers = login(client, EMAIL, PASSWORD)

    res = change_username(client, headers, PASSWORD, "taken@biolinks.test")

    assert res.status_code == 409
    assert res.json()["code"] == "USERNAME_TAKEN"


def test_change_username_is_admin_only(client, staff_headers):
    res = change_username(client, staff_headers, "correct-horse-battery", "other@biolinks.test")

    assert res.status_code == 403
    assert res.json()["code"] == "ADMIN_ONLY"


# --- POST /api/setup/reset-admin-password (recovery without a shell) ---------------------


def reset_password(client, username=EMAIL, new_password="Recovered-Passphrase-42", token=RESET_TOKEN):
    return client.post(
        "/api/setup/reset-admin-password",
        json={"username": username, "new_password": new_password, "reset_token": token},
    )


def test_reset_is_refused_while_no_reset_token_is_configured(client, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_RESET_TOKEN", None)

    res = reset_password(client)

    assert res.status_code == 503
    assert res.json()["code"] == "RESET_DISABLED"


def test_reset_replaces_an_admins_forgotten_password(client, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_RESET_TOKEN", RESET_TOKEN)
    create_user(EMAIL, password=PASSWORD, role="admin")

    res = reset_password(client)

    assert res.status_code == 200
    assert "Recovered-Passphrase-42" not in res.text
    assert token_login(client, EMAIL, "Recovered-Passphrase-42").status_code == 200
    assert token_login(client, EMAIL, PASSWORD).status_code == 401


def test_reset_rejects_a_wrong_token_and_non_admin_accounts(client, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_RESET_TOKEN", RESET_TOKEN)
    create_user("cashier@biolinks.test", role="staff")

    assert reset_password(client, token="guess").status_code == 403
    assert reset_password(client, username="cashier@biolinks.test").status_code == 404
