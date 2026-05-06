import os
import uuid
import threading
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel

from app.database import get_db
from app.models.user import UserDB, RegisterRequest, LoginRequest, TokenResponse, UserResponse, NotificationPrefsRequest, UpdateProfileRequest
from app.services.notification_service import send_welcome_email, send_password_reset_email, send_verification_email

router = APIRouter(prefix="/api/auth", tags=["Auth"])

SECRET_KEY          = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM           = "HS256"
TOKEN_EXPIRE_HOURS  = 24
RESET_EXPIRE_HOURS  = 1
VERIFY_EXPIRE_HOURS = 48
FRONTEND_URL        = os.getenv("FRONTEND_URL", "http://localhost:5173")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_token(user_id: int) -> str:
    payload = {"sub": str(user_id), "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_reset_token(email: str) -> str:
    payload = {"reset": email, "exp": datetime.now(timezone.utc) + timedelta(hours=RESET_EXPIRE_HOURS)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_verify_token(email: str) -> str:
    payload = {"verify": email, "exp": datetime.now(timezone.utc) + timedelta(hours=VERIFY_EXPIRE_HOURS)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def _send_async(fn, *args):
    threading.Thread(target=fn, args=args, daemon=True).start()


@router.post("/register", status_code=201)
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
        is_verified      = False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    verify_token = create_verify_token(user.email)
    verify_url = f"{FRONTEND_URL}?verify_token={verify_token}"
    _send_async(send_verification_email, user.email, user.first_name, verify_url)

    return {"message": "Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse."}


@router.get("/verify-email", status_code=200)
def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("verify")
        if not email:
            raise HTTPException(status_code=400, detail="Ungültiger Token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Token ungültig oder abgelaufen")

    user = db.query(UserDB).filter(UserDB.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    if user.is_verified:
        return {"message": "E-Mail bereits bestätigt"}

    user.is_verified = True
    db.commit()
    _send_async(send_welcome_email, user.email, user.first_name, user.last_name, user.username)
    return {"message": "E-Mail erfolgreich bestätigt"}


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.email == req.email).first()
    if not user or not pwd_context.verify(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="E-Mail-Adresse noch nicht bestätigt. Bitte prüfe dein Postfach.")

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


from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security

_bearer = HTTPBearer(auto_error=False)

def get_current_user(creds: HTTPAuthorizationCredentials = Security(_bearer), db: Session = Depends(get_db)):
    if not creds:
        raise HTTPException(status_code=401, detail="Nicht authentifiziert")
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Ungültiger Token")
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    return user


@router.get("/me", response_model=UserResponse)
def me(current_user: UserDB = Depends(get_current_user)):
    return current_user


@router.put("/me/profile", response_model=UserResponse)
def update_profile(req: UpdateProfileRequest, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.username and req.username != current_user.username:
        if db.query(UserDB).filter(UserDB.username == req.username, UserDB.id != current_user.id).first():
            raise HTTPException(status_code=409, detail="Benutzername bereits vergeben")
        current_user.username = req.username
    if req.email and req.email != current_user.email:
        if db.query(UserDB).filter(UserDB.email == req.email, UserDB.id != current_user.id).first():
            raise HTTPException(status_code=409, detail="E-Mail bereits vergeben")
        current_user.email = req.email
    if req.first_name:
        current_user.first_name = req.first_name
    if req.last_name:
        current_user.last_name = req.last_name
    if req.new_password:
        if len(req.new_password) < 6:
            raise HTTPException(status_code=400, detail="Passwort muss mindestens 6 Zeichen haben")
        current_user.hashed_password = pwd_context.hash(req.new_password)
    if req.bio is not None:
        current_user.bio = req.bio or None
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


AVATAR_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "avatars"))

@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Nur Bilddateien erlaubt")
    os.makedirs(AVATAR_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    path = os.path.join(AVATAR_DIR, filename)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Maximale Dateigröße: 5 MB")
    with open(path, "wb") as f:
        f.write(content)
    current_user.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.put("/me/notifications")
def update_notifications(req: NotificationPrefsRequest, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.notify_on_start   = req.notify_on_start
    current_user.notify_on_stop    = req.notify_on_stop
    current_user.notify_on_warning = req.notify_on_warning
    current_user.theme             = req.theme
    current_user.webhook_url       = req.webhook_url or None
    current_user.allow_invitations = req.allow_invitations
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
