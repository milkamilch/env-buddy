from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth_utils import get_current_user
from app.models.user import UserDB
from app.models.shared_access import SharedAccessDB, ShareRequest, SharedAccessResponse

router = APIRouter(prefix="/api/shared-access", tags=["Shared Access"])


@router.get("/{container_label}", response_model=List[SharedAccessResponse])
def list_shares(container_label: str, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    shares = db.query(SharedAccessDB).filter(
        SharedAccessDB.container_label == container_label,
        SharedAccessDB.owner_id == current_user.id,
    ).all()
    result = []
    for s in shares:
        grantee = db.query(UserDB).filter(UserDB.id == s.grantee_id).first()
        result.append(SharedAccessResponse(
            id=s.id,
            container_label=s.container_label,
            grantee_username=grantee.username if grantee else "unknown",
            created_at=s.created_at.isoformat(),
        ))
    return result


@router.post("/{container_label}", response_model=SharedAccessResponse, status_code=201)
def grant_access(container_label: str, req: ShareRequest, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    grantee = db.query(UserDB).filter(UserDB.username == req.username).first()
    if not grantee:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    if grantee.id == current_user.id:
        raise HTTPException(status_code=400, detail="Kann nicht mit sich selbst teilen")
    existing = db.query(SharedAccessDB).filter(
        SharedAccessDB.container_label == container_label,
        SharedAccessDB.grantee_id == grantee.id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Zugriff bereits gewährt")
    share = SharedAccessDB(
        container_label=container_label,
        owner_id=current_user.id,
        grantee_id=grantee.id,
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    return SharedAccessResponse(
        id=share.id,
        container_label=container_label,
        grantee_username=grantee.username,
        created_at=share.created_at.isoformat(),
    )


@router.delete("/{share_id}", status_code=200)
def revoke_access(share_id: int, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    share = db.query(SharedAccessDB).filter(
        SharedAccessDB.id == share_id,
        SharedAccessDB.owner_id == current_user.id,
    ).first()
    if not share:
        raise HTTPException(status_code=404, detail="Freigabe nicht gefunden")
    db.delete(share)
    db.commit()
    return {"message": "Freigabe entfernt"}


@router.get("/my/shared-with-me")
def shared_with_me(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    shares = db.query(SharedAccessDB).filter(SharedAccessDB.grantee_id == current_user.id).all()
    return [{"container_label": s.container_label, "share_id": s.id} for s in shares]
