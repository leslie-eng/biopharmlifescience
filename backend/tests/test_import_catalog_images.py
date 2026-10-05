"""scripts/import_catalog_images.py: old static storefront photos move into the bucket."""

import re

from conftest import bucket_keys
from scripts import import_catalog_images

JPEG = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00" + b"\x00" * 64


def test_photo_is_matched_by_name_uploaded_and_keyed(client, staff_headers, tmp_path, capsys):
    # The POS spelled the slug differently; the name still matches the static catalog entry.
    product = client.post(
        "/api/products", headers=staff_headers, json={"name": "2cc Syringe — Akshar", "price": 5}
    ).json()
    (tmp_path / "syringe-2cc.jpg").write_bytes(JPEG)

    assert import_catalog_images.run(tmp_path, create_missing=False, dry_run=False) == 0

    key = client.get(f"/api/products/{product['id']}", headers=staff_headers).json()["image_key"]
    assert re.fullmatch(rf"products/{product['id']}/[0-9a-f-]{{36}}\.jpg", key)
    assert bucket_keys() == [key]
    report = capsys.readouterr().out
    assert "upload: 1" in report and "2cc Syringe — Akshar <- syringe-2cc.jpg" in report
    assert "static catalog products not in the POS (rerun with --create-missing, or add them): 96" in report

    # A second run leaves the product's image alone.
    import_catalog_images.run(tmp_path, create_missing=False, dry_run=False)
    assert bucket_keys() == [key]


def test_dry_run_with_create_missing_changes_nothing(client, staff_headers, tmp_path, capsys):
    (tmp_path / "syringe-2cc.jpg").write_bytes(JPEG)

    import_catalog_images.run(tmp_path, create_missing=True, dry_run=True)

    assert client.get("/api/products?staff=true", headers=staff_headers).json() == []
    assert bucket_keys() == []
    assert "[dry run] would create in the POS (price 0, stock 0: set them in the POS): 97" in capsys.readouterr().out
