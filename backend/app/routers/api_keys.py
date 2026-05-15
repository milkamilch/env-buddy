from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth_utils import get_current_user
from app.models.user import UserDB
from app.models.api_key import ApiKeyDB, ApiKeyCreate, ApiKeyResponse, ApiKeyCreated

router = APIRouter(prefix="/api/api-keys", tags=["API Keys"])


@router.get("/", response_model=List[ApiKeyResponse])
def list_keys(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    keys = db.query(ApiKeyDB).filter(ApiKeyDB.user_id == current_user.id, ApiKeyDB.is_active == True).all()
    return [ApiKeyResponse(
        id=k.id, name=k.name, key_prefix=k.key_prefix,
        created_at=k.created_at.isoformat(),
        last_used=k.last_used.isoformat() if k.last_used else None,
        is_active=k.is_active,
    ) for k in keys]


@router.post("/", response_model=ApiKeyCreated, status_code=201)
def create_key(req: ApiKeyCreate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    if db.query(ApiKeyDB).filter(ApiKeyDB.user_id == current_user.id, ApiKeyDB.is_active == True).count() >= 10:
        raise HTTPException(status_code=400, detail="Maximal 10 aktive API-Keys erlaubt")
    raw, hashed, prefix = ApiKeyDB.generate()
    key = ApiKeyDB(user_id=current_user.id, name=req.name, key_hash=hashed, key_prefix=prefix)
    db.add(key)
    db.commit()
    db.refresh(key)
    return ApiKeyCreated(
        id=key.id, name=key.name, key_prefix=key.key_prefix,
        created_at=key.created_at.isoformat(), last_used=None,
        is_active=True, raw_key=raw,
    )


@router.delete("/{key_id}", status_code=200)
def revoke_key(key_id: int, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    key = db.query(ApiKeyDB).filter(ApiKeyDB.id == key_id, ApiKeyDB.user_id == current_user.id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API-Key nicht gefunden")
    key.is_active = False
    db.commit()
    return {"message": "API-Key widerrufen"}
