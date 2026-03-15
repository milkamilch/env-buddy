from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from jose import jwt

from app.routers.auth import create_token, create_reset_token, SECRET_KEY, ALGORITHM
from tests.conftest import REGISTER_PAYLOAD


# ---------------------------------------------------------------------------
# Token helper functions
# ---------------------------------------------------------------------------

def test_create_token_contains_user_id():
    token = create_token(42)
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "42"


def test_create_token_expires_in_24h():
    before = datetime.now(timezone.utc)
    token = create_token(1)
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    assert timedelta(hours=23, minutes=55) < (exp - before) <= timedelta(hours=24, minutes=5)


def test_create_reset_token_contains_email():
    token = create_reset_token("user@example.com")
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["reset"] == "user@example.com"


# ---------------------------------------------------------------------------
# POST /api/auth/register
# ---------------------------------------------------------------------------

def test_register_returns_token_and_user(client):
    r = client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == REGISTER_PAYLOAD["email"]
    assert data["user"]["username"] == REGISTER_PAYLOAD["username"]


def test_register_duplicate_email_returns_409(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    duplicate = {**REGISTER_PAYLOAD, "username": "otheruser"}
    r = client.post("/api/auth/register", json=duplicate)
    assert r.status_code == 409
    assert "E-Mail" in r.json()["detail"]


def test_register_duplicate_username_returns_409(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    duplicate = {**REGISTER_PAYLOAD, "email": "other@example.com"}
    r = client.post("/api/auth/register", json=duplicate)
    assert r.status_code == 409
    assert "Benutzername" in r.json()["detail"]


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------

def test_login_success(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    r = client.post("/api/auth/login", json={
        "email": REGISTER_PAYLOAD["email"],
        "password": REGISTER_PAYLOAD["password"],
    })
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password_returns_401(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    r = client.post("/api/auth/login", json={
        "email": REGISTER_PAYLOAD["email"],
        "password": "wrongpassword",
    })
    assert r.status_code == 401


def test_login_unknown_email_returns_401(client):
    r = client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "whatever",
    })
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# GET /api/auth/me
# ---------------------------------------------------------------------------

def test_me_returns_current_user(client):
    reg = client.post("/api/auth/register", json=REGISTER_PAYLOAD).json()
    token = reg["access_token"]
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == REGISTER_PAYLOAD["email"]


def test_me_without_token_returns_401(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_me_with_invalid_token_returns_401(client):
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer notarealtoken"})
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# POST /api/auth/forgot-password
# ---------------------------------------------------------------------------

def test_forgot_password_always_returns_200_for_unknown_email(client):
    r = client.post("/api/auth/forgot-password", json={"email": "ghost@example.com"})
    assert r.status_code == 200


def test_forgot_password_returns_200_for_known_email(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    r = client.post("/api/auth/forgot-password", json={"email": REGISTER_PAYLOAD["email"]})
    assert r.status_code == 200


# ---------------------------------------------------------------------------
# POST /api/auth/reset-password
# ---------------------------------------------------------------------------

def test_reset_password_success(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    reset_token = create_reset_token(REGISTER_PAYLOAD["email"])
    r = client.post("/api/auth/reset-password", json={
        "token": reset_token,
        "new_password": "newpassword123",
    })
    assert r.status_code == 200

    # new password should work for login
    login = client.post("/api/auth/login", json={
        "email": REGISTER_PAYLOAD["email"],
        "password": "newpassword123",
    })
    assert login.status_code == 200


def test_reset_password_invalid_token_returns_400(client):
    r = client.post("/api/auth/reset-password", json={
        "token": "invalidtoken",
        "new_password": "newpassword123",
    })
    assert r.status_code == 400


def test_reset_password_too_short_returns_400(client):
    client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    reset_token = create_reset_token(REGISTER_PAYLOAD["email"])
    r = client.post("/api/auth/reset-password", json={
        "token": reset_token,
        "new_password": "abc",
    })
    assert r.status_code == 400
