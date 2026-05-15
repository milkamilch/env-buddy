import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth_utils import get_current_user
from app.models.user import UserDB
from app.models.snapshot import SnapshotDB, SnapshotCreate, SnapshotResponse

router = APIRouter(prefix="/api/snapshots", tags=["Snapshots"])


@router.get("/", response_model=List[SnapshotResponse])
def list_snapshots(current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    snaps = db.query(SnapshotDB).filter(SnapshotDB.user_id == current_user.id).order_by(SnapshotDB.created_at.desc()).all()
    return [SnapshotResponse(id=s.id, name=s.name, config=s.config, created_at=s.created_at.isoformat()) for s in snaps]


@router.post("/", response_model=SnapshotResponse, status_code=201)
def create_snapshot(req: SnapshotCreate, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    config = {
        "template": req.template, "env": req.env, "port": req.port,
        "mem_limit": req.mem_limit, "cpu_limit": req.cpu_limit,
        "duration_minutes": req.duration_minutes,
    }
    snap = SnapshotDB(user_id=current_user.id, name=req.name, config_json=json.dumps(config))
    db.add(snap)
    db.commit()
    db.refresh(snap)
    return SnapshotResponse(id=snap.id, name=snap.name, config=snap.config, created_at=snap.created_at.isoformat())


@router.delete("/{snapshot_id}", status_code=200)
def delete_snapshot(snapshot_id: int, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    snap = db.query(SnapshotDB).filter(SnapshotDB.id == snapshot_id, SnapshotDB.user_id == current_user.id).first()
    if not snap:
        raise HTTPException(status_code=404, detail="Snapshot nicht gefunden")
    db.delete(snap)
    db.commit()
    return {"message": "Snapshot gelöscht"}
