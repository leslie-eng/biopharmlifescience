"""Every API response, including served uploads and errors, carries basic hardening headers (audit M3)."""

import pytest

from test_uploads import PNG, upload

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


def test_served_uploads_carry_hardening_headers(client, staff_headers):
    url = upload(client, staff_headers, "a.png", PNG, "image/png").json()["url"]

    res = client.get(url.removeprefix("http://api.test"))

    assert res.headers["X-Content-Type-Options"] == "nosniff"
    assert res.headers["Content-Type"] == "image/png"
