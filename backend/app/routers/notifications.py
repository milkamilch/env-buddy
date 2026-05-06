import threading
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import UserDB
from app.services import notification_service

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM  = "HS256"
_bearer    = HTTPBearer(auto_error=False)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


def _get_required_user(creds: HTTPAuthorizationCredentials = Security(_bearer),
                        db: Session = Depends(get_db)):
    if not creds:
        raise HTTPException(status_code=401, detail="Nicht angemeldet")
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user = db.query(UserDB).filter(UserDB.id == int(payload["sub"])).first()
        if not user:
            raise HTTPException(status_code=401, detail="Ungültiger Token")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Ungültiger Token")


@router.post("/test")
def send_test_mail(current_user: UserDB = Depends(_get_required_user)):
    """Sendet eine Test-E-Mail an die eigene Adresse."""
    try:
        threading.Thread(
            target=notification_service.notify_container_started,
            args=(current_user.email, "testbuddy-postgres-demo", "postgres", 10001, 60),
            daemon=True,
        ).start()
        return {"message": f"Test-Mail wird gesendet an {current_user.email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
