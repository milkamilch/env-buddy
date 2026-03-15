import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth_utils import get_current_user
from app.models.user import UserDB
from app.models.team import TeamDB, TeamMemberDB, CreateTeamRequest, TeamResponse, TeamMemberResponse, AddMemberRequest
from app.models.template import ContainerConfig
from app.models.team_template import TeamTemplateDB, CreateTeamTemplateRequest, TeamTemplateResponse

router = APIRouter(prefix="/api/teams", tags=["Teams"])


def _get_team_or_404(team_id: int, db: Session) -> TeamDB:
    team = db.query(TeamDB).filter(TeamDB.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team nicht gefunden")
    return team


def _assert_member(team_id: int, user_id: int, db: Session) -> TeamMemberDB:
    m = db.query(TeamMemberDB).filter(
        TeamMemberDB.team_id == team_id,
        TeamMemberDB.user_id == user_id,
    ).first()
    if not m:
        raise HTTPException(status_code=403, detail="Kein Mitglied dieses Teams")
    return m


def _assert_owner(team_id: int, user_id: int, db: Session):
    m = _assert_member(team_id, user_id, db)
    if m.role != "owner":
        raise HTTPException(status_code=403, detail="Nur der Team-Owner kann das tun")


# ── Teams CRUD ──────────────────────────────────────────────────────────────

@router.get("/", response_model=List[TeamResponse])
def list_my_teams(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memberships = db.query(TeamMemberDB).filter(TeamMemberDB.user_id == current_user.id).all()
    result = []
    for m in memberships:
        team = db.query(TeamDB).filter(TeamDB.id == m.team_id).first()
        if not team:
            continue
        count = db.query(TeamMemberDB).filter(TeamMemberDB.team_id == team.id).count()
        result.append(TeamResponse(id=team.id, name=team.name, created_by=team.created_by, member_count=count))
    return result


@router.post("/", response_model=TeamResponse, status_code=201)
def create_team(
    req: CreateTeamRequest,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Team-Name darf nicht leer sein")
    team = TeamDB(name=req.name.strip(), created_by=current_user.id)
    db.add(team)
    db.flush()
    member = TeamMemberDB(team_id=team.id, user_id=current_user.id, role="owner")
    db.add(member)
    db.commit()
    db.refresh(team)
    return TeamResponse(id=team.id, name=team.name, created_by=team.created_by, member_count=1)


@router.delete("/{team_id}", status_code=200)
def delete_team(
    team_id: int,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_team_or_404(team_id, db)
    _assert_owner(team_id, current_user.id, db)
    db.query(TeamTemplateDB).filter(TeamTemplateDB.team_id == team_id).delete()
    db.query(TeamMemberDB).filter(TeamMemberDB.team_id == team_id).delete()
    db.query(TeamDB).filter(TeamDB.id == team_id).delete()
    db.commit()
    return {"message": "Team gelöscht"}


# ── Members ─────────────────────────────────────────────────────────────────

@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
def list_members(
    team_id: int,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_team_or_404(team_id, db)
    _assert_member(team_id, current_user.id, db)
    members = db.query(TeamMemberDB).filter(TeamMemberDB.team_id == team_id).all()
    result = []
    for m in members:
        u = db.query(UserDB).filter(UserDB.id == m.user_id).first()
        if u:
            result.append(TeamMemberResponse(
                user_id=u.id, username=u.username,
                first_name=u.first_name, last_name=u.last_name, role=m.role,
            ))
    return result


@router.post("/{team_id}/members", status_code=201)
def add_member(
    team_id: int,
    req: AddMemberRequest,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_team_or_404(team_id, db)
    _assert_owner(team_id, current_user.id, db)
    user = db.query(UserDB).filter(UserDB.username == req.username).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Benutzer '{req.username}' nicht gefunden")
    existing = db.query(TeamMemberDB).filter(
        TeamMemberDB.team_id == team_id,
        TeamMemberDB.user_id == user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Benutzer ist bereits Mitglied")
    member = TeamMemberDB(team_id=team_id, user_id=user.id, role="member")
    db.add(member)
    db.commit()
    return TeamMemberResponse(
        user_id=user.id, username=user.username,
        first_name=user.first_name, last_name=user.last_name, role="member",
    )


@router.delete("/{team_id}/members/{user_id}", status_code=200)
def remove_member(
    team_id: int,
    user_id: int,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_team_or_404(team_id, db)
    current_member = _assert_member(team_id, current_user.id, db)
    # Owner can remove anyone; members can only remove themselves (leave)
    if user_id != current_user.id and current_member.role != "owner":
        raise HTTPException(status_code=403, detail="Nur der Owner kann Mitglieder entfernen")
    # Owner cannot leave — must delete the team
    target = db.query(TeamMemberDB).filter(
        TeamMemberDB.team_id == team_id,
        TeamMemberDB.user_id == user_id,
    ).first()
    if not target:
        raise HTTPException(status_code=404, detail="Mitglied nicht gefunden")
    if target.role == "owner":
        raise HTTPException(status_code=400, detail="Der Owner kann das Team nicht verlassen. Lösche das Team stattdessen.")
    db.delete(target)
    db.commit()
    return {"message": "Mitglied entfernt"}


# ── Team Templates ───────────────────────────────────────────────────────────

@router.get("/{team_id}/templates", response_model=List[TeamTemplateResponse])
def list_team_templates(
    team_id: int,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_team_or_404(team_id, db)
    _assert_member(team_id, current_user.id, db)
    templates = db.query(TeamTemplateDB).filter(TeamTemplateDB.team_id == team_id).all()
    result = []
    for t in templates:
        creator = db.query(UserDB).filter(UserDB.id == t.created_by).first()
        creator_name = f"{creator.first_name} {creator.last_name}" if creator else "Unbekannt"
        result.append(TeamTemplateResponse(
            id=t.id, team_id=t.team_id, created_by=t.created_by,
            creator_name=creator_name, name=t.name, description=t.description,
            icon=t.icon, containers=[ContainerConfig(**c) for c in t.containers],
        ))
    return result


@router.post("/{team_id}/templates", response_model=TeamTemplateResponse, status_code=201)
def create_team_template(
    team_id: int,
    req: CreateTeamTemplateRequest,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_team_or_404(team_id, db)
    _assert_member(team_id, current_user.id, db)
    if not req.containers:
        raise HTTPException(status_code=400, detail="Mindestens ein Container erforderlich")
    tmpl = TeamTemplateDB(
        team_id=team_id,
        created_by=current_user.id,
        name=req.name,
        description=req.description,
        icon=req.icon,
        containers_json=json.dumps([c.model_dump() for c in req.containers]),
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)
    return TeamTemplateResponse(
        id=tmpl.id, team_id=tmpl.team_id, created_by=tmpl.created_by,
        creator_name=f"{current_user.first_name} {current_user.last_name}",
        name=tmpl.name, description=tmpl.description, icon=tmpl.icon,
        containers=req.containers,
    )


@router.put("/{team_id}/templates/{tmpl_id}", response_model=TeamTemplateResponse)
def update_team_template(
    team_id: int,
    tmpl_id: int,
    req: CreateTeamTemplateRequest,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_team_or_404(team_id, db)
    _assert_member(team_id, current_user.id, db)
    tmpl = db.query(TeamTemplateDB).filter(
        TeamTemplateDB.id == tmpl_id,
        TeamTemplateDB.team_id == team_id,
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template nicht gefunden")
    if tmpl.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Nur der Ersteller kann dieses Template bearbeiten")
    if not req.containers:
        raise HTTPException(status_code=400, detail="Mindestens ein Container erforderlich")
    tmpl.name = req.name
    tmpl.description = req.description
    tmpl.icon = req.icon
    tmpl.containers_json = json.dumps([c.model_dump() for c in req.containers])
    db.commit()
    db.refresh(tmpl)
    return TeamTemplateResponse(
        id=tmpl.id, team_id=tmpl.team_id, created_by=tmpl.created_by,
        creator_name=f"{current_user.first_name} {current_user.last_name}",
        name=tmpl.name, description=tmpl.description, icon=tmpl.icon,
        containers=req.containers,
    )


@router.delete("/{team_id}/templates/{tmpl_id}", status_code=200)
def delete_team_template(
    team_id: int,
    tmpl_id: int,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_team_or_404(team_id, db)
    _assert_member(team_id, current_user.id, db)
    tmpl = db.query(TeamTemplateDB).filter(
        TeamTemplateDB.id == tmpl_id,
        TeamTemplateDB.team_id == team_id,
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template nicht gefunden")
    if tmpl.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Nur der Ersteller kann dieses Template löschen")
    db.delete(tmpl)
    db.commit()
    return {"message": "Template gelöscht"}
