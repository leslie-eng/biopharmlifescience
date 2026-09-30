import base64

import pytest

# A real 1x1 PNG and the leading bytes of a real JPEG and WebP file.
PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)
JPEG = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00" + b"\x00" * 64
WEBP = b"RIFF\x24\x00\x00\x00WEBPVP8 " + b"\x00" * 64
PHP = b"<?php system($_GET['c']); ?>"


def upload(client, headers, filename, content, content_type):
    return client.post(
        "/api/uploads/product-image", headers=headers, files={"file": (filename, content, content_type)}
    )


@pytest.mark.parametrize(
    ("content", "extension"), [(PNG, ".png"), (JPEG, ".jpg"), (WEBP, ".webp")], ids=["png", "jpeg", "webp"]
)
def test_product_image_is_stored_under_an_extension_chosen_from_its_contents(
    client, staff_headers, content, extension
):
    # the client's filename and declared type are deliberately misleading
    res = upload(client, staff_headers, "photo.php", content, "image/gif")

    assert res.status_code == 200, res.text
    url = res.json()["url"]
    assert url.startswith("http://api.test/uploads/catalog/")
    assert url.endswith(extension)
    served = client.get(url.removeprefix("http://api.test"))
    assert served.status_code == 200
    assert served.content == content


@pytest.mark.parametrize("filename", ["x.jpg", "x.php", "x.phtml"])
def test_script_disguised_as_an_image_is_rejected(client, staff_headers, filename):
    res = upload(client, staff_headers, filename, PHP, "image/jpeg")

    assert res.status_code == 400
    assert res.json() == {"error": "Only JPEG, PNG or WebP images are allowed"}


def test_only_staff_can_upload(client, customer_headers):
    assert upload(client, {}, "a.png", PNG, "image/png").status_code == 401
    assert upload(client, customer_headers, "a.png", PNG, "image/png").status_code == 403
