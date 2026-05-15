from app.routers.auth import create_verify_token
from tests.conftest import REGISTER_PAYLOAD

SNAP_PAYLOAD = {
    "name": "my-postgres-snap",
    "template": "postgres",
    "env": {"POSTGRES_PASSWORD": "secret"},
    "port": None,
    "mem_limit": None,
    "cpu_limit": None,
    "duration_minutes": 60,
}


def _login(client, payload=REGISTER_PAYLOAD) -> str:
    client.post("/api/auth/register", json=payload)
    token = create_verify_token(payload["email"])
    client.get(f"/api/auth/verify-email?token={token}")
    r = client.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]})
    return r.json()["access_token"]


def _auth(jwt_token):
    return {"Authorization": f"Bearer {jwt_token}"}


def test_create_snapshot(client):
    token = _login(client)
    r = client.post("/api/snapshots/", json=SNAP_PAYLOAD, headers=_auth(token))
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == SNAP_PAYLOAD["name"]
    assert data["config"]["template"] == "postgres"
    assert "id" in data


def test_list_snapshots(client):
    token = _login(client)
    client.post("/api/snapshots/", json=SNAP_PAYLOAD, headers=_auth(token))
    client.post("/api/snapshots/", json={**SNAP_PAYLOAD, "name": "second"}, headers=_auth(token))
    r = client.get("/api/snapshots/", headers=_auth(token))
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_delete_snapshot(client):
    token = _login(client)
    snap = client.post("/api/snapshots/", json=SNAP_PAYLOAD, headers=_auth(token)).json()
    r = client.delete(f"/api/snapshots/{snap['id']}", headers=_auth(token))
    assert r.status_code == 200
    remaining = client.get("/api/snapshots/", headers=_auth(token)).json()
    assert remaining == []


def test_snapshots_are_user_scoped(client):
    token_a = _login(client)
    token_b = _login(client, {**REGISTER_PAYLOAD, "email": "b@b.com", "username": "userb"})
    client.post("/api/snapshots/", json=SNAP_PAYLOAD, headers=_auth(token_a))
    r = client.get("/api/snapshots/", headers=_auth(token_b))
    assert r.json() == []
