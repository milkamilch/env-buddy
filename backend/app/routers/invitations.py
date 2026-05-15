from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth_utils import get_current_user
from app.models.user import UserDB
from app.models.team import TeamDB, TeamMemberDB
from app.models.invitation import TeamInvitationDB, InvitationResponse

router = APIRouter(prefix="/api/invitations", tags=["Invitations"])


@router.get("/", response_model=List[InvitationResponse])
def list_invitations(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitations = (
        db.query(TeamInvitationDB)
        .filter(
            TeamInvitationDB.invitee_id == current_user.id,
            TeamInvitationDB.status == "pending",
        )
        .order_by(TeamInvitationDB.created_at.desc())
        .all()
    )
    result = []
    for inv in invitations:
        team = db.query(TeamDB).filter(TeamDB.id == inv.team_id).first()
        inviter = db.query(UserDB).filter(UserDB.id == inv.inviter_id).first()
        result.append(InvitationResponse(
            id=inv.id,
            team_id=inv.team_id,
            team_name=team.name if team else "Unbekannt",
            inviter_name=inviter.username if inviter else "Unbekannt",
            status=inv.status,
            created_at=inv.created_at.isoformat() if inv.created_at else "",
        ))
    return result


@router.post("/{invitation_id}/accept")
def accept_invitation(
    invitation_id: int,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inv = db.query(TeamInvitationDB).filter(
        TeamInvitationDB.id == invitation_id,
        TeamInvitationDB.invitee_id == current_user.id,
        TeamInvitationDB.status == "pending",
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Einladung nicht gefunden")

    existing = db.query(TeamMemberDB).filter(
        TeamMemberDB.team_id == inv.team_id,
        TeamMemberDB.user_id == current_user.id,
    ).first()
    if not existing:
        db.add(TeamMemberDB(team_id=inv.team_id, user_id=current_user.id, role="member"))

    inv.status = "accepted"
    db.commit()
    return {"message": "Einladung angenommen"}


@router.post("/{invitation_id}/decline")
def decline_invitation(
    invitation_id: int,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inv = db.query(TeamInvitationDB).filter(
        TeamInvitationDB.id == invitation_id,
        TeamInvitationDB.invitee_id == current_user.id,
        TeamInvitationDB.status == "pending",
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Einladung nicht gefunden")

    inv.status = "declined"
    db.commit()
    return {"message": "Einladung abgelehnt"}
