from unittest.mock import patch, MagicMock
from app.routers.auth import create_verify_token
from tests.conftest import REGISTER_PAYLOAD


def _login(client, payload=REGISTER_PAYLOAD) -> str:
    client.post("/api/auth/register", json=payload)
    token = create_verify_token(payload["email"])
    client.get(f"/api/auth/verify-email?token={token}")
    r = client.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]})
    return r.json()["access_token"]


def _auth(jwt_token):
    return {"Authorization": f"Bearer {jwt_token}"}


def test_workflow_example_returns_yaml(client):
    token = _login(client)
    r = client.get("/api/github-actions/workflow-example", headers=_auth(token))
    assert r.status_code == 200
    data = r.json()
    assert "yaml" in data
    assert "ENV_BUDDY_API_KEY" in data["yaml"]
    assert "github-actions/trigger" in data["yaml"]


def test_trigger_starts_container(client):
    token = _login(client)
    mock_result = {"name": "postgres-test", "port": 10001, "id": "abc123"}
    with patch("app.services.docker_service.start_container", return_value=mock_result):
        r = client.post(
            "/api/github-actions/trigger",
            json={"template": "postgres", "duration_minutes": 30},
            headers=_auth(token),
        )
    assert r.status_code == 200
    assert r.json()["status"] == "started"
    assert r.json()["container"]["name"] == "postgres-test"
