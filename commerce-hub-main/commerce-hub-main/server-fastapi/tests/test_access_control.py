import pytest

SOME_ID = "00000000-0000-0000-0000-000000000000"

STAFF_ONLY = [
    ("POST", "/api/products"),
    ("PATCH", f"/api/products/{SOME_ID}"),
    ("DELETE", f"/api/products/{SOME_ID}"),
    ("GET", "/api/clients"),
    ("POST", "/api/clients"),
    ("PATCH", f"/api/clients/{SOME_ID}"),
    ("DELETE", f"/api/clients/{SOME_ID}"),
    ("GET", "/api/orders"),
    ("POST", "/api/orders"),
    ("GET", f"/api/orders/{SOME_ID}/items"),
    ("PATCH", f"/api/orders/{SOME_ID}"),
    ("GET", "/api/expenses"),
    ("POST", "/api/expenses"),
    ("DELETE", f"/api/expenses/{SOME_ID}"),
    ("GET", "/api/dashboard/overview"),
    ("GET", "/api/dashboard/reports"),
    ("POST", "/api/uploads/product-image"),
]


@pytest.mark.parametrize(("method", "path"), STAFF_ONLY, ids=[f"{m} {p}" for m, p in STAFF_ONLY])
def test_staff_only_route_rejects_anonymous_and_customers(client, customer_headers, method, path):
    assert client.request(method, path).status_code == 401
    assert client.request(method, path, headers=customer_headers).status_code == 403
