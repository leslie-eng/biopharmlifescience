"""Every API response, including served uploads and errors, carries basic hardening headers (audit M3)."""

import pytest

from app.core.config import settings
from test_product_images import PNG

EXPECTED = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}


@pytest.mark.parametrize("path", ["/api/health", "/api/products", "/api/does-not-exist"])
def test_api_responses_carry_hardening_headers(client, path):
    res = client.get(path)

    for header, value in EXPECTED.items():
        assert res.headers.get(header) == value, header


def test_served_legacy_uploads_carry_hardening_headers(client):
    (settings.UPLOAD_DIR / "catalog" / "legacy.png").write_bytes(PNG)

    res = client.get("/uploads/catalog/legacy.png")

    assert res.headers["X-Content-Type-Options"] == "nosniff"
    assert res.headers["Content-Type"] == "image/png"


def test_interactive_api_docs_are_not_published_by_default(client):
    assert client.get("/docs").status_code == 404
    assert client.get("/openapi.json").status_code == 404
