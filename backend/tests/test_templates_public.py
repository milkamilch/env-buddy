from app.routers.auth import create_verify_token
from tests.conftest import REGISTER_PAYLOAD

PAYLOAD_A = REGISTER_PAYLOAD
PAYLOAD_B = {**REGISTER_PAYLOAD, "email": "b@b.com", "username": "userb"}

TEMPLATE_PAYLOAD = {
    "name": "My PG Template",
    "description": "postgres setup",
    "icon": "🐘",
    "containers": [{"service_name": "db", "image": "postgres:15", "internal_port": 5432, "env": {}}],
}


def _login(client, payload) -> str:
    client.post("/api/auth/register", json=payload)
    token = create_verify_token(payload["email"])
    client.get(f"/api/auth/verify-email?token={token}")
    r = client.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]})
    return r.json()["access_token"]


def _auth(jwt_token):
    return {"Authorization": f"Bearer {jwt_token}"}


def test_template_is_private_by_default(client):
    token = _login(client, PAYLOAD_A)
    tmpl = client.post("/api/user-templates/", json=TEMPLATE_PAYLOAD, headers=_auth(token)).json()
    assert tmpl["is_public"] is False


def test_set_template_public(client):
    token = _login(client, PAYLOAD_A)
    tmpl = client.post("/api/user-templates/", json=TEMPLATE_PAYLOAD, headers=_auth(token)).json()
    r = client.patch(f"/api/user-templates/{tmpl['id']}/visibility", json={"is_public": True}, headers=_auth(token))
    assert r.status_code == 200
    assert r.json()["is_public"] is True


def test_public_template_visible_to_other_users(client):
    token_a = _login(client, PAYLOAD_A)
    token_b = _login(client, PAYLOAD_B)
    tmpl = client.post("/api/user-templates/", json=TEMPLATE_PAYLOAD, headers=_auth(token_a)).json()
    client.patch(f"/api/user-templates/{tmpl['id']}/visibility", json={"is_public": True}, headers=_auth(token_a))

    public = client.get("/api/user-templates/public", headers=_auth(token_b)).json()
    assert any(t["id"] == tmpl["id"] for t in public)


def test_own_public_template_not_in_public_listing(client):
    token_a = _login(client, PAYLOAD_A)
    tmpl = client.post("/api/user-templates/", json=TEMPLATE_PAYLOAD, headers=_auth(token_a)).json()
    client.patch(f"/api/user-templates/{tmpl['id']}/visibility", json={"is_public": True}, headers=_auth(token_a))
    own_public = client.get("/api/user-templates/public", headers=_auth(token_a)).json()
    assert all(t["id"] != tmpl["id"] for t in own_public)
