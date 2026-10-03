"""CRUD, validation and not-found behaviour for the dashboard modules, as the staff pages use them.

Anonymous (401) and customer (403) access to every staff route is covered in test_access_control.py,
uploads in test_uploads.py and the POS sale itself in test_pos_sale.py.
"""

from datetime import date, timedelta

import pytest

UNKNOWN_ID = "00000000-0000-0000-0000-000000000000"


def add_product(client, headers, name="Nitrile gloves", **fields):
    res = client.post("/api/products", headers=headers, json={"name": name, "price": 850, "stock": 40, **fields})
    assert res.status_code == 201, res.text
    return res.json()


def add_client(client, headers, full_name="Kisumu Dental", **fields):
    res = client.post("/api/clients", headers=headers, json={"full_name": full_name, **fields})
    assert res.status_code == 201, res.text
    return res.json()


def sell(client, headers, product, quantity=1, status="paid", **order):
    body = {
        "order": {"customer_name": "Walk-in", "status": status, "payment_method": "cash", **order},
        "items": [{"product_id": product["id"], "quantity": quantity}],
    }
    res = client.post("/api/orders", headers=headers, json=body)
    assert res.status_code == 201, res.text
    return res.json()


# --- Products ---------------------------------------------------------------------------


def test_product_crud(client, staff_headers):
    product = add_product(client, staff_headers, cost=600, category="PPE")

    listed = client.get("/api/products?staff=true", headers=staff_headers).json()
    assert [p["id"] for p in listed] == [product["id"]]
    assert client.get(f"/api/products/{product['id']}", headers=staff_headers).json()["cost"] == 600

    updated = client.patch(f"/api/products/{product['id']}", headers=staff_headers, json={"price": 900, "stock": 12})
    assert updated.status_code == 200
    assert (updated.json()["price"], updated.json()["stock"]) == (900, 12)

    assert client.delete(f"/api/products/{product['id']}", headers=staff_headers).json() == {"ok": True}
    assert client.get(f"/api/products/{product['id']}", headers=staff_headers).status_code == 404


def test_visitors_see_active_products_without_cost(client, staff_headers):
    add_product(client, staff_headers, "On sale", cost=600)
    add_product(client, staff_headers, "Hidden", is_active=False)

    public = client.get("/api/products").json()

    assert [p["name"] for p in public] == ["On sale"]
    assert "cost" not in public[0]


def test_product_needs_a_name(client, staff_headers):
    assert client.post("/api/products", headers=staff_headers, json={"price": 1}).status_code == 422
    assert client.post("/api/products", headers=staff_headers, json={"name": "  "}).status_code == 400


@pytest.mark.parametrize("field", ["price", "cost", "stock"])
def test_product_amounts_cannot_be_negative(client, staff_headers, field):
    created = client.post("/api/products", headers=staff_headers, json={"name": "Gloves", field: -1})
    assert created.status_code == 422

    product = add_product(client, staff_headers)
    updated = client.patch(f"/api/products/{product['id']}", headers=staff_headers, json={field: -1})
    assert updated.status_code == 422


def test_product_slug_must_be_unique(client, staff_headers):
    add_product(client, staff_headers, "Nitrile gloves")

    res = client.post("/api/products", headers=staff_headers, json={"name": "Nitrile Gloves"})

    assert res.status_code == 409
    assert res.json()["code"] == "SLUG_TAKEN"


def test_renaming_a_product_onto_a_taken_slug_is_refused(client, staff_headers):
    add_product(client, staff_headers, "Gloves", slug="gloves")
    other = add_product(client, staff_headers, "Masks", slug="masks")

    res = client.patch(f"/api/products/{other['id']}", headers=staff_headers, json={"slug": "gloves"})

    assert res.status_code == 409


@pytest.mark.parametrize("product_id", [UNKNOWN_ID, "not-a-uuid"])
def test_unknown_product_is_404(client, staff_headers, product_id):
    assert client.get(f"/api/products/{product_id}", headers=staff_headers).status_code == 404
    assert client.patch(f"/api/products/{product_id}", headers=staff_headers, json={"price": 1}).status_code == 404
    assert client.delete(f"/api/products/{product_id}", headers=staff_headers).status_code == 404


def test_deleting_a_sold_product_keeps_the_order_history(client, staff_headers):
    product = add_product(client, staff_headers)
    order = sell(client, staff_headers, product, quantity=2)

    assert client.delete(f"/api/products/{product['id']}", headers=staff_headers).status_code == 200

    items = client.get(f"/api/orders/{order['id']}/items", headers=staff_headers).json()
    assert [(i["product_id"], i["product_name"], i["line_total"]) for i in items] == [(None, "Nitrile gloves", 1700)]


# --- Clients ----------------------------------------------------------------------------


def test_client_crud(client, staff_headers):
    created = add_client(client, staff_headers, email="Info@KisumuDental.co.ke", phone="+254 712 345 678")
    assert created["email"] == "info@kisumudental.co.ke"

    assert [c["id"] for c in client.get("/api/clients", headers=staff_headers).json()] == [created["id"]]

    updated = client.patch(f"/api/clients/{created['id']}", headers=staff_headers, json={"notes": "Pays by M-Pesa"})
    assert updated.status_code == 200
    assert updated.json()["notes"] == "Pays by M-Pesa"

    assert client.delete(f"/api/clients/{created['id']}", headers=staff_headers).status_code == 200
    assert client.get("/api/clients", headers=staff_headers).json() == []


def test_client_needs_a_name(client, staff_headers):
    assert client.post("/api/clients", headers=staff_headers, json={}).status_code == 422
    assert client.post("/api/clients", headers=staff_headers, json={"full_name": " "}).status_code == 400


@pytest.mark.parametrize(
    "fields",
    [{"email": "not-an-email"}, {"phone": "call me"}, {"phone": "12"}],
    ids=["bad-email", "letters-in-phone", "short-phone"],
)
def test_client_contact_details_are_validated(client, staff_headers, fields):
    assert client.post("/api/clients", headers=staff_headers, json={"full_name": "A", **fields}).status_code == 422

    existing = add_client(client, staff_headers)
    assert client.patch(f"/api/clients/{existing['id']}", headers=staff_headers, json=fields).status_code == 422


def test_blank_contact_details_are_stored_as_missing(client, staff_headers):
    created = add_client(client, staff_headers, email="", phone=" ")

    assert (created["email"], created["phone"]) == (None, None)


def test_two_clients_cannot_share_an_email(client, staff_headers):
    add_client(client, staff_headers, "Kisumu Dental", email="info@kisumudental.co.ke")
    other = add_client(client, staff_headers, "Eldoret Vet")

    created = client.post(
        "/api/clients", headers=staff_headers, json={"full_name": "Copy", "email": "INFO@kisumudental.co.ke"}
    )
    updated = client.patch(
        f"/api/clients/{other['id']}", headers=staff_headers, json={"email": "info@kisumudental.co.ke"}
    )

    assert created.status_code == updated.status_code == 409
    assert created.json()["code"] == "CLIENT_EMAIL_TAKEN"


@pytest.mark.parametrize("client_id", [UNKNOWN_ID, "not-a-uuid"])
def test_unknown_client_is_404(client, staff_headers, client_id):
    assert client.patch(f"/api/clients/{client_id}", headers=staff_headers, json={"notes": "x"}).status_code == 404
    assert client.delete(f"/api/clients/{client_id}", headers=staff_headers).status_code == 404


def test_deleting_a_client_keeps_their_orders(client, staff_headers):
    buyer = add_client(client, staff_headers)
    order = sell(client, staff_headers, add_product(client, staff_headers), client_id=buyer["id"])

    assert client.delete(f"/api/clients/{buyer['id']}", headers=staff_headers).status_code == 200

    [kept] = client.get("/api/orders", headers=staff_headers).json()
    assert (kept["id"], kept["client_id"], kept["total"]) == (order["id"], None, 850)


# --- Orders -----------------------------------------------------------------------------


def test_order_is_listed_with_its_items_and_computed_totals(client, staff_headers):
    gloves = add_product(client, staff_headers, "Gloves", price=850)
    masks = add_product(client, staff_headers, "Masks", price=12.5)
    body = {
        "order": {"customer_name": "Walk-in", "status": "paid", "payment_method": "mpesa"},
        "items": [{"product_id": gloves["id"], "quantity": 2}, {"product_id": masks["id"], "quantity": 4}],
    }

    order = client.post("/api/orders", headers=staff_headers, json=body).json()

    assert (order["subtotal"], order["total"]) == (1750, 1750)
    assert order["order_number"]
    assert [o["id"] for o in client.get("/api/orders", headers=staff_headers).json()] == [order["id"]]
    items = client.get(f"/api/orders/{order['id']}/items", headers=staff_headers).json()
    assert sorted((i["product_name"], i["quantity"], i["line_total"]) for i in items) == [
        ("Gloves", 2, 1700),
        ("Masks", 4, 50),
    ]


def test_order_needs_at_least_one_item(client, staff_headers):
    res = client.post("/api/orders", headers=staff_headers, json={"order": {"status": "paid"}, "items": []})

    assert res.status_code in (400, 422)


@pytest.mark.parametrize("status", ["processing", "shipped", "delivered", "cancelled", "refunded"])
def test_order_status_can_move_to_any_known_status(client, staff_headers, status):
    order = sell(client, staff_headers, add_product(client, staff_headers), status="pending")

    res = client.patch(f"/api/orders/{order['id']}", headers=staff_headers, json={"status": status})

    assert res.status_code == 200
    assert res.json()["status"] == status


def test_unknown_order_status_is_a_validation_error(client, staff_headers):
    order = sell(client, staff_headers, add_product(client, staff_headers))

    res = client.patch(f"/api/orders/{order['id']}", headers=staff_headers, json={"status": "teleported"})

    assert res.status_code == 422
    assert client.get("/api/orders", headers=staff_headers).json()[0]["status"] == "paid"


def test_unknown_payment_method_is_a_validation_error(client, staff_headers):
    product = add_product(client, staff_headers)
    body = {"order": {"payment_method": "bitcoin"}, "items": [{"product_id": product["id"], "quantity": 1}]}

    assert client.post("/api/orders", headers=staff_headers, json=body).status_code == 422


@pytest.mark.parametrize("order_id", [UNKNOWN_ID, "not-a-uuid"])
def test_unknown_order_is_404(client, staff_headers, order_id):
    assert client.patch(f"/api/orders/{order_id}", headers=staff_headers, json={"status": "paid"}).status_code == 404
    assert client.get(f"/api/orders/{order_id}/items", headers=staff_headers).status_code == 404


# --- Expenses ---------------------------------------------------------------------------


def test_expense_crud(client, staff_headers):
    res = client.post(
        "/api/expenses",
        headers=staff_headers,
        json={"category": "Transport", "amount": 1250.5, "description": "Delivery to Nakuru"},
    )
    assert res.status_code == 201
    expense = res.json()
    assert (expense["amount"], expense["occurred_on"]) == (1250.5, date.today().isoformat())

    assert [e["id"] for e in client.get("/api/expenses", headers=staff_headers).json()] == [expense["id"]]
    assert client.delete(f"/api/expenses/{expense['id']}", headers=staff_headers).status_code == 200
    assert client.get("/api/expenses", headers=staff_headers).json() == []


def test_expenses_are_listed_newest_first(client, staff_headers):
    for days_ago in (10, 0, 3):
        occurred = (date.today() - timedelta(days=days_ago)).isoformat()
        client.post(
            "/api/expenses", headers=staff_headers, json={"category": "Rent", "amount": 100, "occurred_on": occurred}
        )

    dates = [e["occurred_on"] for e in client.get("/api/expenses", headers=staff_headers).json()]

    assert dates == sorted(dates, reverse=True)


@pytest.mark.parametrize(
    "body",
    [{"category": "Rent", "amount": 0}, {"category": "Rent", "amount": -5}, {"category": " ", "amount": 5}],
    ids=["zero", "negative", "blank-category"],
)
def test_expense_needs_a_category_and_a_positive_amount(client, staff_headers, body):
    assert client.post("/api/expenses", headers=staff_headers, json=body).status_code in (400, 422)
    assert client.get("/api/expenses", headers=staff_headers).json() == []


def test_expense_fields_are_type_checked(client, staff_headers):
    assert client.post("/api/expenses", headers=staff_headers, json={"category": "Rent"}).status_code == 422
    bad_date = {"category": "Rent", "amount": 5, "occurred_on": "yesterday"}
    assert client.post("/api/expenses", headers=staff_headers, json=bad_date).status_code == 422


@pytest.mark.parametrize("expense_id", [UNKNOWN_ID, "not-a-uuid"])
def test_unknown_expense_is_404(client, staff_headers, expense_id):
    assert client.delete(f"/api/expenses/{expense_id}", headers=staff_headers).status_code == 404


# --- Dashboard --------------------------------------------------------------------------


def test_overview_works_with_empty_tables(client, staff_headers):
    res = client.get("/api/dashboard/overview", headers=staff_headers)

    assert res.status_code == 200
    assert res.json() == {
        "stats": {"revenue": 0, "orders": 0, "clients": 0, "products": 0, "lowStock": 0},
        "recentOrders": [],
    }
    assert client.get("/api/dashboard/reports", headers=staff_headers).json() == {"orders": [], "order_items": []}


def test_overview_figures_match_the_underlying_data(client, staff_headers):
    gloves = add_product(client, staff_headers, "Gloves", price=100, stock=50)
    add_product(client, staff_headers, "Masks", price=10, stock=3)  # low stock
    add_client(client, staff_headers)
    for status in ("paid", "paid", "delivered", "pending", "cancelled", "paid"):
        sell(client, staff_headers, gloves, quantity=1, status=status)

    overview = client.get("/api/dashboard/overview", headers=staff_headers).json()

    # Gloves sold 6 → 44 left (not low); Masks 3 ≤ 5 (low). Pending and cancelled orders earn nothing.
    assert overview["stats"] == {"revenue": 400, "orders": 6, "clients": 1, "products": 2, "lowStock": 1}
    assert len(overview["recentOrders"]) == 5


def test_reports_list_recent_sales(client, staff_headers):
    sell(client, staff_headers, add_product(client, staff_headers, price=100), quantity=3)

    reports = client.get("/api/dashboard/reports", headers=staff_headers).json()

    assert [(o["total"], o["status"]) for o in reports["orders"]] == [(300, "paid")]
    assert [(i["product_name"], i["quantity"], i["line_total"]) for i in reports["order_items"]] == [
        ("Nitrile gloves", 3, 300)
    ]
    future = (date.today() + timedelta(days=1)).isoformat()
    assert client.get(f"/api/dashboard/reports?since={future}", headers=staff_headers).json()["orders"] == []


def test_reports_reject_a_malformed_since_date(client, staff_headers):
    res = client.get("/api/dashboard/reports?since=last-tuesday", headers=staff_headers)

    assert res.status_code == 422
