from app.routers.auth import create_verify_token
from tests.conftest import REGISTER_PAYLOAD

PAYLOAD_A = REGISTER_PAYLOAD
PAYLOAD_B = {**REGISTER_PAYLOAD, "email": "b@b.com", "username": "userb"}


def _login(client, payload) -> str:
    client.post("/api/auth/register", json=payload)
    token = create_verify_token(payload["email"])
    client.get(f"/api/auth/verify-email?token={token}")
    r = client.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]})
    return r.json()["access_token"]


def _auth(jwt_token):
    return {"Authorization": f"Bearer {jwt_token}"}


def test_grant_and_list_access(client):
    token_a = _login(client, PAYLOAD_A)
    _login(client, PAYLOAD_B)
    r = client.post("/api/shared-access/abc123", json={"username": "userb"}, headers=_auth(token_a))
    assert r.status_code == 201
    data = r.json()
    assert data["grantee_username"] == "userb"
    assert data["container_label"] == "abc123"

    listing = client.get("/api/shared-access/abc123", headers=_auth(token_a)).json()
    assert len(listing) == 1
    assert listing[0]["grantee_username"] == "userb"


def test_cannot_share_with_self(client):
    token_a = _login(client, PAYLOAD_A)
    r = client.post("/api/shared-access/abc123", json={"username": "testuser"}, headers=_auth(token_a))
    assert r.status_code == 400


def test_duplicate_share_rejected(client):
    token_a = _login(client, PAYLOAD_A)
    _login(client, PAYLOAD_B)
    client.post("/api/shared-access/abc123", json={"username": "userb"}, headers=_auth(token_a))
    r = client.post("/api/shared-access/abc123", json={"username": "userb"}, headers=_auth(token_a))
    assert r.status_code == 409


def test_revoke_access(client):
    token_a = _login(client, PAYLOAD_A)
    _login(client, PAYLOAD_B)
    share = client.post("/api/shared-access/abc123", json={"username": "userb"}, headers=_auth(token_a)).json()
    r = client.delete(f"/api/shared-access/{share['id']}", headers=_auth(token_a))
    assert r.status_code == 200
    listing = client.get("/api/shared-access/abc123", headers=_auth(token_a)).json()
    assert listing == []
