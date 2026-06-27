from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import UserDB
from app.models.audit import AuditLogDB
from app.auth_utils import get_current_user


router = APIRouter(prefix="/api/audit", tags=["Audit"])


@router.get("/")
def get_audit_log(current_user: UserDB = Depends(get_current_user),
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
