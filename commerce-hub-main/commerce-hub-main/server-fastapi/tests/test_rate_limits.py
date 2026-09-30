"""Rate limits key on the visitor's real IP: the last X-Forwarded-For hop, which Render's proxy appends."""

from conftest import create_user


def via_proxy(real_ip, spoofed="1.2.3.4"):
    return {"X-Forwarded-For": f"{spoofed}, {real_ip}"}


def fail_login(client, headers):
    return client.post(
        "/api/auth/login", headers=headers, json={"email": "ops@biolinks.test", "password": "guess"}
    ).status_code


def test_one_visitor_failing_logins_does_not_lock_out_another(client):
    create_user("ops@biolinks.test")
    for _ in range(5):
        fail_login(client, via_proxy("203.0.113.5"))

    assert fail_login(client, via_proxy("203.0.113.5")) == 429
    assert fail_login(client, via_proxy("198.51.100.7")) == 401


def test_faking_the_forwarded_header_does_not_escape_the_login_limit(client):
    create_user("ops@biolinks.test")
    for n in range(5):
        fail_login(client, via_proxy("203.0.113.5", spoofed=f"10.0.0.{n}"))

    assert fail_login(client, via_proxy("203.0.113.5", spoofed="10.0.0.99")) == 429


def test_chatbot_allows_twenty_messages_a_minute_per_visitor(client):
    ask = {"message": "Do you stock nitrile gloves?"}
    for _ in range(20):
        assert client.post("/api/chat", headers=via_proxy("203.0.113.5"), json=ask).status_code == 200

    assert client.post("/api/chat", headers=via_proxy("203.0.113.5"), json=ask).status_code == 429
    assert client.post("/api/chat", headers=via_proxy("198.51.100.7"), json=ask).status_code == 200


def test_cloudflare_connecting_ip_wins_over_a_faked_forwarded_header(client):
    create_user("ops@biolinks.test")
    for n in range(5):
        fail_login(client, {"CF-Connecting-IP": "203.0.113.5", "X-Forwarded-For": f"10.0.0.{n}, 172.16.0.{n}"})

    assert fail_login(client, {"CF-Connecting-IP": "203.0.113.5", "X-Forwarded-For": "10.9.9.9"}) == 429
    assert fail_login(client, {"CF-Connecting-IP": "198.51.100.7", "X-Forwarded-For": "10.0.0.1"}) == 401
