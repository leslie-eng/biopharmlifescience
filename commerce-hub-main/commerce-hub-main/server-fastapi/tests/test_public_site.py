def test_health_reports_database_connected(client):
    res = client.get("/api/health")

    assert res.status_code == 200
    assert res.json()["database"] == "connected"


def test_visitors_see_only_active_products_without_signing_in(client, staff_headers):
    client.post("/api/products", headers=staff_headers, json={"name": "Face shield", "price": 300, "stock": 5})
    client.post(
        "/api/products", headers=staff_headers, json={"name": "Old stock", "price": 10, "stock": 0, "is_active": False}
    )

    res = client.get("/api/products")

    assert res.status_code == 200
    assert [p["name"] for p in res.json()] == ["Face shield"]


def test_visitor_can_request_a_restock_notification_once(client, staff_headers):
    product = client.post(
        "/api/products", headers=staff_headers, json={"name": "Dialyzer", "price": 4200, "stock": 0}
    ).json()
    request = {"product_id": product["id"], "email": "Nurse@Clinic.test"}

    first = client.post("/api/stock-interest", json=request)
    again = client.post("/api/stock-interest", json=request)

    assert first.status_code == 201
    assert first.json()["email"] == "nurse@clinic.test"
    assert again.status_code == 409
