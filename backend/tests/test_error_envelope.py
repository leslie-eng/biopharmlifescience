"""Every error response has the same shape: {"error": <message>, "code": <MACHINE_CODE>}."""


def test_unknown_route_uses_the_envelope(client):
    res = client.get("/api/no-such-thing")

    assert res.status_code == 404
    assert res.json() == {"error": "Not Found", "code": "NOT_FOUND"}


def test_invalid_body_is_a_validation_error(client):
    res = client.post("/api/auth/login", json={"email": "someone@example.test"})

    assert res.status_code == 422
    assert res.json()["code"] == "VALIDATION_ERROR"
    assert res.json()["error"]


def test_missing_session_says_authentication_is_required(client):
    res = client.get("/api/orders")

    assert res.status_code == 401
    assert res.json() == {"error": "Authentication required", "code": "AUTH_REQUIRED"}


def test_customers_are_told_the_area_is_staff_only(client, customer_headers):
    res = client.get("/api/orders", headers=customer_headers)

    assert res.status_code == 403
    assert res.json() == {"error": "Staff access required", "code": "STAFF_ONLY"}
