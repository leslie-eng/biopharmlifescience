from app import cli
from conftest import create_user, login


def test_staff_created_from_cli_can_log_in_and_see_their_role(client):
    create_user("ops@biolinks.test", password="s3cure-enough", role="staff")

    headers = login(client, "ops@biolinks.test", password="s3cure-enough")
    me = client.get("/api/auth/me", headers=headers)

    assert me.status_code == 200
    assert me.json()["user"]["email"] == "ops@biolinks.test"
    assert me.json()["roles"] == ["staff"]


def test_cli_refuses_a_duplicate_email(capsys):
    create_user("ops@biolinks.test")

    exit_code = cli.main(["create-user", "--email", "OPS@biolinks.test", "--password", "another-password", "--role", "admin"])

    assert exit_code == 1
    assert "already exists" in capsys.readouterr().err


def test_wrong_password_is_rejected(client):
    create_user("ops@biolinks.test")

    res = client.post("/api/auth/login", json={"email": "ops@biolinks.test", "password": "wrong-password"})

    assert res.status_code == 401
    assert res.json() == {"error": "Invalid email or password"}


def test_login_is_blocked_after_five_failed_attempts_from_one_ip(client):
    create_user("ops@biolinks.test")
    for _ in range(5):
        assert client.post("/api/auth/login", json={"email": "ops@biolinks.test", "password": "guess"}).status_code == 401

    blocked = client.post("/api/auth/login", json={"email": "ops@biolinks.test", "password": "correct-horse-battery"})

    assert blocked.status_code == 429
    assert "Retry-After" in blocked.headers


def test_public_registration_is_disabled_even_on_an_empty_database(client):
    res = client.post("/api/auth/register", json={"email": "first@example.test", "password": "hunter2hunter2"})

    assert res.status_code == 404
    # and nobody was able to take the admin seat by registering first
    assert client.post("/api/auth/login", json={"email": "first@example.test", "password": "hunter2hunter2"}).status_code == 401
