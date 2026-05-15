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


def test_create_api_key_returns_raw_key(client):
    token = _login(client)
    r = client.post("/api/api-keys/", json={"name": "CI key"}, headers=_auth(token))
    assert r.status_code == 201
    data = r.json()
    assert "raw_key" in data
    assert data["raw_key"].startswith("ebk_")
    assert data["name"] == "CI key"
    assert data["is_active"] is True


def test_list_api_keys(client):
    token = _login(client)
    client.post("/api/api-keys/", json={"name": "k1"}, headers=_auth(token))
    client.post("/api/api-keys/", json={"name": "k2"}, headers=_auth(token))
    r = client.get("/api/api-keys/", headers=_auth(token))
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_revoke_api_key(client):
    token = _login(client)
    created = client.post("/api/api-keys/", json={"name": "temp"}, headers=_auth(token)).json()
    r = client.delete(f"/api/api-keys/{created['id']}", headers=_auth(token))
    assert r.status_code == 200
    remaining = client.get("/api/api-keys/", headers=_auth(token)).json()
    assert all(k["id"] != created["id"] for k in remaining)


def test_api_key_auth_works(client):
    token = _login(client)
    created = client.post("/api/api-keys/", json={"name": "test"}, headers=_auth(token)).json()
    raw_key = created["raw_key"]
    r = client.get("/api/api-keys/", headers={"X-Api-Key": raw_key})
    assert r.status_code == 200


def test_max_10_api_keys(client):
    token = _login(client)
    for i in range(10):
        client.post("/api/api-keys/", json={"name": f"k{i}"}, headers=_auth(token))
    r = client.post("/api/api-keys/", json={"name": "overflow"}, headers=_auth(token))
    assert r.status_code == 400
    assert "10" in r.json()["detail"]
