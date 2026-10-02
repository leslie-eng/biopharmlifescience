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



def test_visitors_never_see_what_a_product_cost_us(client, staff_headers):
    product = client.post(
        "/api/products", headers=staff_headers, json={"name": "Face shield", "price": 300, "cost": 120, "stock": 5}
    ).json()

    listed = client.get("/api/products").json()[0]
    detail = client.get(f"/api/products/{product['id']}").json()

    assert "cost" not in listed
    assert "cost" not in detail
    assert detail["price"] == 300


def test_staff_still_see_cost_in_the_back_office(client, staff_headers):
    client.post("/api/products", headers=staff_headers, json={"name": "Face shield", "price": 300, "cost": 120})

    listed = client.get("/api/products?staff=true", headers=staff_headers).json()[0]

    assert listed["cost"] == 120


def test_inactive_product_is_hidden_from_visitors_but_not_staff(client, staff_headers):
    product = client.post(
        "/api/products", headers=staff_headers, json={"name": "Old stock", "price": 10, "is_active": False}
    ).json()

    assert client.get(f"/api/products/{product['id']}").status_code == 404
    assert client.get(f"/api/products/{product['id']}", headers=staff_headers).status_code == 200
