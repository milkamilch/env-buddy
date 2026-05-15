import hashlib
import os
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import UserDB

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM  = "HS256"

security = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> UserDB:
    # Try API key first (header: X-Api-Key or Authorization: ApiKey xxx)
    api_key = request.headers.get("x-api-key")
    if not api_key:
        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("apikey "):
            api_key = auth_header[7:]

    if api_key:
        from app.models.api_key import ApiKeyDB
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        key_obj = db.query(ApiKeyDB).filter(
            ApiKeyDB.key_hash == key_hash,
            ApiKeyDB.is_active == True,
        ).first()
        if not key_obj:
            raise HTTPException(status_code=401, detail="Ungültiger API-Key")
        key_obj.last_used = datetime.now(timezone.utc)
        db.commit()
        user = db.query(UserDB).filter(UserDB.id == key_obj.user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Benutzer nicht gefunden")
        return user

    # Fall back to JWT
    if not credentials:
        raise HTTPException(status_code=401, detail="Nicht authentifiziert")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Ungültiger oder abgelaufener Token")
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Benutzer nicht gefunden")
    return user
