"""POS sale: POST /api/orders as sent by src/pages/dashboard/Pos.tsx."""

import pytest


def add_product(client, headers, name, price, stock):
    res = client.post("/api/products", headers=headers, json={"name": name, "price": price, "stock": stock})
    assert res.status_code == 201, res.text
    return res.json()


def sale(lines, **order):
    return {
        "order": {"customer_name": "Walk-in", "status": "paid", "payment_method": "cash", **order},
        "items": lines,
    }


def line(product, quantity, unit_price=None):
    price = product["price"] if unit_price is None else unit_price
    return {
        "product_id": product["id"],
        "product_name": product["name"],
        "unit_price": price,
        "quantity": quantity,
        "line_total": price * quantity,
    }


def stock_of(client, product):
    return client.get(f"/api/products/{product['id']}").json()["stock"]


def test_sale_is_priced_from_the_catalog_not_from_what_the_till_sends(client, staff_headers):
    gloves = add_product(client, staff_headers, "Nitrile gloves", price=850, stock=40)
    syringe = add_product(client, staff_headers, "Syringe 5cc", price=12.5, stock=500)

    res = client.post(
        "/api/orders",
        headers=staff_headers,
        json=sale(
            [line(gloves, 2, unit_price=0.01), line(syringe, 10, unit_price=1)],
            subtotal=1,
            total=1,
        ),
    )

    assert res.status_code == 201, res.text
    order = res.json()
    assert order["subtotal"] == 1825
    assert order["total"] == 1825
    items = client.get(f"/api/orders/{order['id']}/items", headers=staff_headers).json()
    assert sorted((i["unit_price"], i["quantity"], i["line_total"]) for i in items) == [
        (12.5, 10, 125),
        (850, 2, 1700),
    ]


def test_sale_takes_the_sold_quantity_out_of_stock(client, staff_headers):
    gloves = add_product(client, staff_headers, "Nitrile gloves", price=850, stock=40)

    client.post("/api/orders", headers=staff_headers, json=sale([line(gloves, 3)]))

    assert stock_of(client, gloves) == 37


def test_sale_with_insufficient_stock_is_rejected_and_records_nothing(client, staff_headers):
    gloves = add_product(client, staff_headers, "Nitrile gloves", price=850, stock=40)
    dialyzer = add_product(client, staff_headers, "Dialyzer", price=4200, stock=1)

    res = client.post("/api/orders", headers=staff_headers, json=sale([line(gloves, 5), line(dialyzer, 2)]))

    assert res.status_code == 400
    assert res.json() == {"error": "Insufficient stock for Dialyzer"}
    assert stock_of(client, gloves) == 40
    assert client.get("/api/orders", headers=staff_headers).json() == []


def test_sale_line_must_reference_a_catalog_product(client, staff_headers):
    manual = {"product_name": "Something off-list", "unit_price": 100, "quantity": 1, "line_total": 100}

    res = client.post("/api/orders", headers=staff_headers, json=sale([manual]))

    assert res.status_code in (400, 422)
    assert client.get("/api/orders", headers=staff_headers).json() == []


@pytest.mark.parametrize("quantity", [0, -2, 0.5])
def test_sale_quantity_must_be_a_positive_whole_number(client, staff_headers, quantity):
    gloves = add_product(client, staff_headers, "Nitrile gloves", price=850, stock=40)

    res = client.post("/api/orders", headers=staff_headers, json=sale([line(gloves, quantity)]))

    assert res.status_code == 422
    assert stock_of(client, gloves) == 40


def test_only_staff_can_record_a_sale(client, staff_headers, customer_headers):
    gloves = add_product(client, staff_headers, "Nitrile gloves", price=850, stock=40)
    pending = sale([line(gloves, 1)], status="pending")

    assert client.post("/api/orders", json=pending).status_code == 401
    assert client.post("/api/orders", headers=customer_headers, json=pending).status_code == 403
    assert stock_of(client, gloves) == 40


def test_stock_goes_down_even_if_the_till_asks_it_not_to(client, staff_headers):
    gloves = add_product(client, staff_headers, "Nitrile gloves", price=850, stock=40)
    body = {**sale([line(gloves, 3)]), "decrement_stock": False}

    assert client.post("/api/orders", headers=staff_headers, json=body).status_code == 201
    assert stock_of(client, gloves) == 37


def test_a_deactivated_product_cannot_be_sold(client, staff_headers):
    old = add_product(client, staff_headers, "Old stock", price=10, stock=5)
    client.patch(f"/api/products/{old['id']}", headers=staff_headers, json={"is_active": False})

    res = client.post("/api/orders", headers=staff_headers, json=sale([line(old, 1)]))

    assert res.status_code == 400
    assert res.json() == {"error": "Old stock is no longer for sale"}
