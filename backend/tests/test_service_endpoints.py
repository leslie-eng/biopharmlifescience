"""The API identifies itself at / and answers a cheap liveness probe at /health."""


def test_root_names_the_api_and_points_to_the_health_checks(client):
    res = client.get("/")

    assert res.status_code == 200
    assert res.json() == {
        "service": "biolinks-commerce-api",
        "health": "/health",
        "readiness": "/api/health",
    }


def test_health_reports_healthy_without_touching_the_database(client):
    res = client.get("/health")

    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}


def test_readiness_still_checks_the_database(client):
    res = client.get("/api/health")

    assert res.status_code == 200
    assert res.json()["database"] == "connected"
