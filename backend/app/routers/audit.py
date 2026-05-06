from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security
from jose import jwt, JWTError
from sqlalchemy.orm import Session
import os

from app.database import get_db
from app.models.user import UserDB
from app.models.audit import AuditLogDB

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
_bearer = HTTPBearer(auto_error=False)


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


router = APIRouter(prefix="/api/audit", tags=["Audit"])


@router.get("/")
def get_audit_log(current_user: UserDB = Depends(_get_required_user),
                  db: Session = Depends(get_db)):
    entries = (
        db.query(AuditLogDB)
        .filter(AuditLogDB.user_id == current_user.id)
        .order_by(AuditLogDB.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "id": e.id,
            "action": e.action,
            "container_name": e.container_name,
            "template": e.template,
            "extra": e.extra,
            "username": e.username,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in entries
    ]
