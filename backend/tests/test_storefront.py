"""The public website's catalog: GET /api/public/products, /products/{id_or_slug} and /categories."""

import base64

import httpx

PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)
STOREFRONT_FIELDS = {"id", "slug", "name", "description", "category", "price", "unit", "in_stock", "image_url"}


def add_product(client, headers, name, **fields):
    body = {"name": name, "price": 100, "cost": 60, "stock": 10, "category": "PPE", **fields}
    res = client.post("/api/products", headers=headers, json=body)
    assert res.status_code == 201, res.text
    return res.json()


def names(res):
    return [p["name"] for p in res.json()["items"]]


def test_storefront_shows_only_safe_fields(client, staff_headers):
    add_product(client, staff_headers, "Gloves", description="Nitrile, box of 100", unit="box")

    [item] = client.get("/api/public/products").json()["items"]

    assert set(item) == STOREFRONT_FIELDS
    assert (item["price"], item["unit"], item["in_stock"], item["image_url"]) == (100, "box", True, None)


def test_storefront_shows_only_active_published_products(client, staff_headers):
    add_product(client, staff_headers, "Visible")
    add_product(client, staff_headers, "Unpublished", is_published=False)
    add_product(client, staff_headers, "Inactive", is_active=False)

    assert names(client.get("/api/public/products")) == ["Visible"]
    assert client.get("/api/public/products/unpublished").status_code == 404
    assert client.get("/api/public/products/inactive").status_code == 404


def test_pos_changes_show_up_immediately(client, staff_headers):
    product = add_product(client, staff_headers, "Gloves")

    client.patch(f"/api/products/{product['id']}", headers=staff_headers, json={"price": 120, "stock": 0})
    item = client.get("/api/public/products/gloves").json()
    assert (item["price"], item["in_stock"]) == (120, False)

    client.patch(f"/api/products/{product['id']}", headers=staff_headers, json={"is_published": False})
    assert client.get("/api/public/products").json()["items"] == []
    assert client.get(f"/api/public/products/{product['id']}").status_code == 404


def test_product_detail_by_id_or_slug(client, staff_headers):
    product = add_product(client, staff_headers, "Surgical masks")

    by_id = client.get(f"/api/public/products/{product['id']}")
    by_slug = client.get("/api/public/products/surgical-masks")

    assert by_id.status_code == by_slug.status_code == 200
    assert by_id.json() == by_slug.json()
    assert client.get("/api/public/products/no-such-thing").status_code == 404


def test_image_url_is_a_presigned_link_that_works(client, staff_headers):
    product = add_product(client, staff_headers, "Gloves")
    client.post(
        f"/api/products/{product['id']}/image", headers=staff_headers, files={"file": ("a.png", PNG, "image/png")}
    )

    url = client.get("/api/public/products/gloves").json()["image_url"]

    assert "X-Amz-Signature=" in url and "X-Amz-Expires=3600" in url
    assert httpx.get(url).content == PNG


def test_pagination(client, staff_headers):
    for i in range(5):
        add_product(client, staff_headers, f"Item {i}")

    page2 = client.get("/api/public/products?page=2&page_size=2").json()

    assert (page2["total"], page2["page"], page2["page_size"]) == (5, 2, 2)
    assert [p["name"] for p in page2["items"]] == ["Item 2", "Item 3"]
    assert client.get("/api/public/products?page=4&page_size=2").json()["items"] == []
    assert client.get("/api/public/products?page_size=101").status_code == 422
    assert client.get("/api/public/products?page=0").status_code == 422


def test_category_filter_and_categories(client, staff_headers):
    add_product(client, staff_headers, "Gloves", category="PPE")
    add_product(client, staff_headers, "Masks", category="PPE")
    add_product(client, staff_headers, "Spirit", category="Antiseptics")
    add_product(client, staff_headers, "Hidden", category="Secret", is_published=False)

    assert names(client.get("/api/public/products?category=ppe")) == ["Gloves", "Masks"]
    assert client.get("/api/public/categories").json() == [
        {"name": "Antiseptics", "count": 1},
        {"name": "PPE", "count": 2},
    ]


def test_search(client, staff_headers):
    add_product(client, staff_headers, "Nitrile gloves")
    add_product(client, staff_headers, "Masks", description="Three-ply, fits over gloves")
    add_product(client, staff_headers, "Spirit", category="Antiseptics")
    add_product(client, staff_headers, "100% cotton wool")

    assert names(client.get("/api/public/products?q=GLOVES")) == ["Masks", "Nitrile gloves"]
    assert names(client.get("/api/public/products?q=antisep")) == ["Spirit"]
    assert names(client.get("/api/public/products?q=100%25")) == ["100% cotton wool"]
    assert names(client.get("/api/public/products?q=_")) == []


def test_storefront_works_with_no_products(client):
    assert client.get("/api/public/products").json() == {"items": [], "total": 0, "page": 1, "page_size": 24}
    assert client.get("/api/public/categories").json() == []


def test_legacy_public_product_list_hides_unpublished_products(client, staff_headers):
    add_product(client, staff_headers, "Visible")
    add_product(client, staff_headers, "Unpublished", is_published=False)

    assert [p["name"] for p in client.get("/api/products").json()] == ["Visible"]
    staff_view = client.get("/api/products?staff=true", headers=staff_headers).json()
    assert sorted(p["name"] for p in staff_view) == ["Unpublished", "Visible"]
