"""A temporary password opens nothing but the change-password screen until it is replaced."""

from app import cli
from conftest import create_user, login

TEMP = "temporary-pass-123"
NEW = "a-much-better-passphrase"


def create_temporary_admin(monkeypatch, email="admin@biolinks.test"):
    monkeypatch.setenv("BOOTSTRAP_PASSWORD", TEMP)
    exit_code = cli.main(
        ["create-user", "--email", email, "--role", "admin", "--password-env", "BOOTSTRAP_PASSWORD", "--temporary"]
    )
    assert exit_code == 0


def change(client, headers, current, new):
    return client.post(
        "/api/auth/change-password", headers=headers, json={"current_password": current, "new_password": new}
    )


def test_login_with_a_temporary_password_reports_that_it_must_be_changed(client, monkeypatch):
    create_temporary_admin(monkeypatch)

    res = client.post("/api/auth/login", json={"email": "admin@biolinks.test", "password": TEMP})

    assert res.status_code == 200
    assert res.json()["must_change_password"] is True
    headers = {"Authorization": f"Bearer {res.json()['token']}"}
    assert client.get("/api/auth/me", headers=headers).json()["must_change_password"] is True


def test_staff_endpoints_are_refused_until_the_temporary_password_is_changed(client, monkeypatch):
    create_temporary_admin(monkeypatch)
    headers = login(client, "admin@biolinks.test", TEMP)

    res = client.get("/api/orders", headers=headers)

    assert res.status_code == 403
    assert res.json() == {"error": "Password change required", "code": "PASSWORD_CHANGE_REQUIRED"}


def test_changing_the_password_unlocks_the_dashboard_and_retires_the_old_one(client, monkeypatch):
    create_temporary_admin(monkeypatch)
    headers = login(client, "admin@biolinks.test", TEMP)

    res = change(client, headers, TEMP, NEW)

    assert res.status_code == 200
    assert res.json()["must_change_password"] is False
    new_headers = {"Authorization": f"Bearer {res.json()['token']}"}
    assert client.get("/api/orders", headers=new_headers).status_code == 200
    assert client.post("/api/auth/login", json={"email": "admin@biolinks.test", "password": TEMP}).status_code == 401
    login(client, "admin@biolinks.test", NEW)


def test_change_password_rejects_a_wrong_current_password(client, monkeypatch):
    create_temporary_admin(monkeypatch)
    headers = login(client, "admin@biolinks.test", TEMP)

    res = change(client, headers, "not-the-password", NEW)

    assert res.status_code == 401
    assert res.json() == {"error": "Current password is incorrect", "code": "CURRENT_PASSWORD_INCORRECT"}


def test_change_password_rejects_a_short_or_unchanged_password(client, monkeypatch):
    create_temporary_admin(monkeypatch)
    headers = login(client, "admin@biolinks.test", TEMP)

    assert change(client, headers, TEMP, "short").status_code == 400
    assert change(client, headers, TEMP, TEMP).status_code == 400


def test_change_password_requires_a_session(client):
    assert change(client, {}, TEMP, NEW).status_code == 401


def test_set_password_resets_an_existing_account_without_duplicating_it(client, monkeypatch):
    create_user("ops@biolinks.test", role="admin")
    monkeypatch.setenv("RESET_PASSWORD", TEMP)

    exit_code = cli.main(["set-password", "--email", "OPS@biolinks.test", "--password-env", "RESET_PASSWORD", "--temporary"])

    assert exit_code == 0
    res = client.post("/api/auth/login", json={"email": "ops@biolinks.test", "password": TEMP})
    assert res.status_code == 200
    assert res.json()["must_change_password"] is True
    assert res.json()["roles"] == ["admin"]


def test_set_password_refuses_an_unknown_email(capsys, monkeypatch):
    monkeypatch.setenv("RESET_PASSWORD", TEMP)

    exit_code = cli.main(["set-password", "--email", "nobody@biolinks.test", "--password-env", "RESET_PASSWORD"])

    assert exit_code == 1
    assert "No user" in capsys.readouterr().err


def test_cli_refuses_an_empty_password_variable(capsys, monkeypatch):
    monkeypatch.delenv("BOOTSTRAP_PASSWORD", raising=False)

    exit_code = cli.main(
        ["create-user", "--email", "admin@biolinks.test", "--role", "admin", "--password-env", "BOOTSTRAP_PASSWORD"]
    )

    assert exit_code == 1
    assert "BOOTSTRAP_PASSWORD" in capsys.readouterr().err
