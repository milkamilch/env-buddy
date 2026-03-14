import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.database import get_db
from app.auth_utils import get_current_user
from app.models.user import UserDB
from app.models.template import UserTemplateDB, CreateTemplateRequest, TemplateResponse, ContainerConfig

router = APIRouter(prefix="/api/user-templates", tags=["User Templates"])


@router.get("/", response_model=List[TemplateResponse])
def get_my_templates(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    templates = db.query(UserTemplateDB).filter(UserTemplateDB.user_id == current_user.id).all()
    return [
        TemplateResponse(
            id=t.id,
            user_id=t.user_id,
            name=t.name,
            description=t.description,
            icon=t.icon,
            containers=[ContainerConfig(**c) for c in t.containers],
        )
        for t in templates
    ]


@router.post("/", response_model=TemplateResponse, status_code=201)
def create_template(
    req: CreateTemplateRequest,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not req.containers:
        raise HTTPException(status_code=400, detail="Mindestens ein Container erforderlich")

    template = UserTemplateDB(
        user_id         = current_user.id,
        name            = req.name,
        description     = req.description,
        icon            = req.icon,
        containers_json = json.dumps([c.model_dump() for c in req.containers]),
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    return TemplateResponse(
        id=template.id,
        user_id=template.user_id,
        name=template.name,
        description=template.description,
        icon=template.icon,
        containers=req.containers,
    )


@router.delete("/{template_id}", status_code=200)
def delete_template(
    template_id: int,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = db.query(UserTemplateDB).filter(
        UserTemplateDB.id == template_id,
        UserTemplateDB.user_id == current_user.id,
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template nicht gefunden")
    db.delete(template)
    db.commit()
    return {"message": "Template gelöscht"}


@router.get("/favorites")
def get_favorites(current_user: UserDB = Depends(get_current_user)):
    return json.loads(current_user.favorites_json or "[]")


class FavoritesUpdate(BaseModel):
    favorites: List[str]

@router.put("/favorites")
def update_favorites(
    body: FavoritesUpdate,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.favorites_json = json.dumps(body.favorites)
    db.commit()
    return {"favorites": body.favorites}
