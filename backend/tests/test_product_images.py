"""Product photos from the POS: POST/DELETE /api/products/{id}/image, stored in the S3-compatible bucket."""

import base64
import re

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.main import app
from app.services import storage
from conftest import bucket_keys

# A real 1x1 PNG and the leading bytes of a real JPEG and WebP file.
PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)
JPEG = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00" + b"\x00" * 64
WEBP = b"RIFF\x24\x00\x00\x00WEBPVP8 " + b"\x00" * 64
PHP = b"<?php system($_GET['c']); ?>"
WINDOWS_EXE = b"MZ\x90\x00" + b"\x00" * 64


def add_product(client, headers, name="Nitrile gloves"):
    res = client.post("/api/products", headers=headers, json={"name": name, "price": 850, "stock": 40})
    assert res.status_code == 201, res.text
    return res.json()


def upload(client, headers, product_id, content, filename="photo.jpg", content_type="image/jpeg"):
    return client.post(
        f"/api/products/{product_id}/image", headers=headers, files={"file": (filename, content, content_type)}
    )


@pytest.mark.parametrize(("content", "ext"), [(PNG, "png"), (JPEG, "jpg"), (WEBP, "webp")], ids=["png", "jpeg", "webp"])
def test_image_is_stored_under_a_key_chosen_by_the_server(client, staff_headers, content, ext):
    product = add_product(client, staff_headers)

    # the client's filename and declared type are deliberately misleading
    res = upload(client, staff_headers, product["id"], content, filename="../../etc/photo.php", content_type="image/gif")

    assert res.status_code == 200, res.text
    key = res.json()["image_key"]
    assert re.fullmatch(rf"products/{product['id']}/[0-9a-f-]{{36}}\.{ext}", key)
    assert bucket_keys() == [key]
    stored = storage._client().get_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
    assert stored["Body"].read() == content
    assert stored["ContentType"] == {"png": "image/png", "jpg": "image/jpeg", "webp": "image/webp"}[ext]


def test_staff_get_a_presigned_link_to_the_image(client, staff_headers):
    product = add_product(client, staff_headers)
    key = upload(client, staff_headers, product["id"], PNG).json()["image_key"]

    url = client.get(f"/api/products/{product['id']}", headers=staff_headers).json()["image_url"]

    assert f"/{settings.S3_BUCKET_NAME}/{key}?" in url  # path-style addressing
    assert "X-Amz-Signature=" in url and "X-Amz-Expires=3600" in url
    assert httpx.get(url).content == PNG


@pytest.mark.parametrize("content", [PHP, WINDOWS_EXE, b"GIF89a" + b"\x00" * 32], ids=["php", "exe", "gif"])
def test_anything_but_jpeg_png_or_webp_is_rejected(client, staff_headers, content):
    product = add_product(client, staff_headers)

    res = upload(client, staff_headers, product["id"], content, filename="photo.jpg")

    assert res.status_code == 400
    assert res.json() == {"error": "Only JPEG, PNG or WebP images are allowed", "code": "IMAGE_TYPE_NOT_ALLOWED"}
    assert bucket_keys() == []


def test_images_over_5_mb_are_rejected(client, staff_headers):
    product = add_product(client, staff_headers)

    res = upload(client, staff_headers, product["id"], PNG + b"\x00" * (5 * 1024 * 1024))

    assert res.status_code == 413
    assert res.json()["code"] == "IMAGE_TOO_LARGE"
    assert bucket_keys() == []


def test_replacing_an_image_deletes_the_old_object(client, staff_headers):
    product = add_product(client, staff_headers)
    first = upload(client, staff_headers, product["id"], PNG).json()["image_key"]

    second = upload(client, staff_headers, product["id"], JPEG).json()["image_key"]

    assert second != first
    assert bucket_keys() == [second]


def test_removing_an_image_deletes_the_object(client, staff_headers):
    product = add_product(client, staff_headers)
    upload(client, staff_headers, product["id"], PNG)

    res = client.delete(f"/api/products/{product['id']}/image", headers=staff_headers)

    assert res.status_code == 200
    assert (res.json()["image_key"], res.json()["image_url"]) == (None, None)
    assert bucket_keys() == []


def test_deleting_a_product_deletes_its_image(client, staff_headers):
    product = add_product(client, staff_headers)
    upload(client, staff_headers, product["id"], PNG)

    assert client.delete(f"/api/products/{product['id']}", headers=staff_headers).status_code == 200
    assert bucket_keys() == []


def test_uploaded_object_is_removed_when_saving_the_product_fails(client, staff_headers, monkeypatch):
    product = add_product(client, staff_headers)
    old_key = upload(client, staff_headers, product["id"], PNG).json()["image_key"]

    def broken_commit(self):
        raise RuntimeError("database went away")

    monkeypatch.setattr(Session, "commit", broken_commit)
    res = upload(TestClient(app, raise_server_exceptions=False), staff_headers, product["id"], JPEG)
    monkeypatch.undo()

    assert res.status_code == 500
    assert bucket_keys() == [old_key]  # the new object is gone, the old one untouched
    assert client.get(f"/api/products/{product['id']}", headers=staff_headers).json()["image_key"] == old_key


def test_bucket_failure_is_reported_and_changes_nothing(client, staff_headers, monkeypatch):
    product = add_product(client, staff_headers)

    def refuse(*args, **kwargs):
        raise storage.ClientError({"Error": {"Code": "AccessDenied", "Message": "nope"}}, "PutObject")

    monkeypatch.setattr(storage, "put", refuse)
    res = upload(client, staff_headers, product["id"], PNG)

    assert res.status_code == 502
    assert res.json()["code"] == "IMAGE_STORAGE_FAILED"
    assert client.get(f"/api/products/{product['id']}", headers=staff_headers).json()["image_key"] is None


def test_image_of_an_unknown_product_is_404(client, staff_headers):
    assert upload(client, staff_headers, "00000000-0000-0000-0000-000000000000", PNG).status_code == 404
    assert client.delete("/api/products/not-a-uuid/image", headers=staff_headers).status_code == 404
    assert bucket_keys() == []


def test_only_staff_can_change_images(client, staff_headers, customer_headers):
    product = add_product(client, staff_headers)

    assert upload(client, {}, product["id"], PNG).status_code == 401
    assert upload(client, customer_headers, product["id"], PNG).status_code == 403
    assert bucket_keys() == []


def test_products_without_a_key_fall_back_to_the_deprecated_image_url(client, staff_headers):
    res = client.post(
        "/api/products",
        headers=staff_headers,
        json={"name": "Legacy", "price": 1, "image_url": "http://api.test/uploads/catalog/old.jpg"},
    )

    assert res.json()["image_url"] == "http://api.test/uploads/catalog/old.jpg"
