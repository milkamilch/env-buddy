from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.auth_utils import get_current_user
from app.models.user import UserDB
from app.models.template import ContainerConfig
from app.models.team_template import TeamTemplateDB, TeamTemplateResponse
from app.models.team import TeamMemberDB

router = APIRouter(prefix="/api/team-templates", tags=["Team Templates"])


@router.get("/", response_model=List[TeamTemplateResponse])
def get_my_team_templates(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all templates from teams the current user belongs to."""
    memberships = db.query(TeamMemberDB).filter(TeamMemberDB.user_id == current_user.id).all()
    team_ids = [m.team_id for m in memberships]
    if not team_ids:
        return []
    templates = db.query(TeamTemplateDB).filter(TeamTemplateDB.team_id.in_(team_ids)).all()
    result = []
    for t in templates:
        creator = db.query(UserDB).filter(UserDB.id == t.created_by).first()
        creator_name = f"{creator.first_name} {creator.last_name}" if creator else "Unbekannt"
        result.append(TeamTemplateResponse(
            id=t.id,
            team_id=t.team_id,
            created_by=t.created_by,
            creator_name=creator_name,
            name=t.name,
            description=t.description,
            icon=t.icon,
            containers=[ContainerConfig(**c) for c in t.containers],
        ))
    return result
