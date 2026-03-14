import os
import threading
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel

from app.database import get_db
from app.models.user import UserDB, RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.services.notification_service import send_welcome_email, send_password_reset_email

router = APIRouter(prefix="/api/auth", tags=["Auth"])

SECRET_KEY         = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM          = "HS256"
TOKEN_EXPIRE_HOURS = 24
RESET_EXPIRE_HOURS = 1
FRONTEND_URL       = os.getenv("FRONTEND_URL", "http://localhost:5173")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_token(user_id: int) -> str:
    payload = {"sub": str(user_id), "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_reset_token(email: str) -> str:
    payload = {"reset": email, "exp": datetime.utcnow() + timedelta(hours=RESET_EXPIRE_HOURS)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def _send_async(fn, *args):
    threading.Thread(target=fn, args=args, daemon=True).start()


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(UserDB).filter(UserDB.email == req.email).first():
        raise HTTPException(status_code=409, detail="E-Mail bereits vergeben")
    if db.query(UserDB).filter(UserDB.username == req.username).first():
        raise HTTPException(status_code=409, detail="Benutzername bereits vergeben")

    user = UserDB(
        email            = req.email,
        username         = req.username,
        first_name       = req.first_name,
        last_name        = req.last_name,
        hashed_password  = pwd_context.hash(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _send_async(send_welcome_email, user.email, user.first_name, user.last_name, user.username)

    return TokenResponse(
        access_token=create_token(user.id),
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == req.email).first()
    if not user or not pwd_context.verify(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch")

    return TokenResponse(
        access_token=create_token(user.id),
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


class ForgotPasswordRequest(BaseModel):
    email: str

@router.post("/forgot-password", status_code=200)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == req.email).first()
    if user:
        token = create_reset_token(user.email)
        reset_url = f"{FRONTEND_URL}?reset_token={token}"
        _send_async(send_password_reset_email, user.email, user.first_name, reset_url)
    # Always return 200 — don't leak whether email exists
    return {"message": "Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet."}


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/reset-password", status_code=200)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("reset")
        if not email:
            raise HTTPException(status_code=400, detail="Ungültiger Token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Token ungültig oder abgelaufen")

    user = db.query(UserDB).filter(UserDB.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Passwort muss mindestens 6 Zeichen haben")

    user.hashed_password = pwd_context.hash(req.new_password)
    db.commit()
    return {"message": "Passwort erfolgreich geändert"}
