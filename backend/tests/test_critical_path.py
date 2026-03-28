"""Critical path tests for RVA Contract Lens."""
import pytest
import sys

sys.path.insert(0, ".")


def test_health_endpoint():
    from app.main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_contracts_list():
    from app.main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)
    r = client.get("/api/contracts?limit=5")
    assert r.status_code == 200
    data = r.json()
    assert "contracts" in data
    assert len(data["contracts"]) <= 5


def test_compliance_check():
    from app.main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)
    r = client.get("/api/contracts/compliance-check/ITRON%20INC")
    assert r.status_code == 200
    data = r.json()
    assert data["total_lists"] == 7
    assert "sam_check" in data


def test_health_scan():
    from app.main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)
    r = client.get("/api/health-scan")
    assert r.status_code == 200
    data = r.json()
    assert "health_score" in data
    assert 0 <= data["health_score"] <= 100


def test_nl_query():
    from app.main import app
    from fastapi.testclient import TestClient

    client = TestClient(app)
    r = client.post("/api/nl-query", json={"question": "How many contracts?"})
    assert r.status_code == 200
    data = r.json()
    assert "sql" in data or "error" in data
