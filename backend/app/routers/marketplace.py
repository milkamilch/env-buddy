import json
import os
import uuid
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.auth_utils import get_current_user
from app.models.user import UserDB
from app.models.template import UserTemplateDB, ContainerConfig
from app.models.marketplace import (
    MarketplaceTemplateDB, MarketplaceRatingDB, MarketplaceCommentDB, MarketplaceImageDB,
    PublishTemplateRequest, MarketplaceTemplateResponse, RateRequest,
    CommentRequest, CommentResponse, ImageResponse,
)

router = APIRouter(prefix="/api/marketplace", tags=["Marketplace"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "marketplace")
UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _build_response(tmpl: MarketplaceTemplateDB, db: Session, publisher_name: str) -> dict:
    ratings = db.query(MarketplaceRatingDB).filter(MarketplaceRatingDB.template_id == tmpl.id).all()
    avg = round(sum(r.rating for r in ratings) / len(ratings), 1) if ratings else 0.0
    return {
        "id":             tmpl.id,
        "user_id":        tmpl.user_id,
        "publisher_name": publisher_name,
        "name":           tmpl.name,
        "description":    tmpl.description,
        "icon":           tmpl.icon,
        "containers":     [ContainerConfig(**c) for c in tmpl.containers],
        "tags":           tmpl.tags,
        "download_count": tmpl.download_count,
        "avg_rating":     avg,
        "rating_count":   len(ratings),
        "created_at":     tmpl.created_at.isoformat() if tmpl.created_at else "",
    }


# --- Liste ---

@router.get("/", response_model=List[MarketplaceTemplateResponse])
def list_templates(
    search: Optional[str] = Query(None),
    sort:   str           = Query("newest", pattern="^(newest|rating|downloads)$"),
    db:     Session       = Depends(get_db),
):
    q = db.query(MarketplaceTemplateDB)
    if search:
        q = q.filter(MarketplaceTemplateDB.name.ilike(f"%{search}%"))

    templates = q.all()

    results = []
    for t in templates:
        publisher = db.query(UserDB).filter(UserDB.id == t.user_id).first()
        name = f"{publisher.first_name} {publisher.last_name}" if publisher else "Unbekannt"
        results.append(_build_response(t, db, name))

    if sort == "rating":
        results.sort(key=lambda x: x["avg_rating"], reverse=True)
    elif sort == "downloads":
        results.sort(key=lambda x: x["download_count"], reverse=True)
    else:
        results.sort(key=lambda x: x["created_at"], reverse=True)

    return results


# --- Veröffentlichen ---

@router.post("/", response_model=MarketplaceTemplateResponse, status_code=201)
def publish_template(
    req:          PublishTemplateRequest,
    current_user: UserDB  = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    if not req.containers:
        raise HTTPException(status_code=400, detail="Mindestens ein Container erforderlich")
    for c in req.containers:
        if not c.service_name.strip():
            raise HTTPException(status_code=400, detail="service_name darf nicht leer sein")
        if not c.image.strip():
            raise HTTPException(status_code=400, detail="image darf nicht leer sein")

    tmpl = MarketplaceTemplateDB(
        user_id         = current_user.id,
        name            = req.name,
        description     = req.description,
        icon            = req.icon,
        containers_json = json.dumps([c.model_dump() for c in req.containers]),
        tags_json       = json.dumps(req.tags),
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)

    publisher_name = f"{current_user.first_name} {current_user.last_name}"
    return _build_response(tmpl, db, publisher_name)


# --- Detail ---

@router.get("/{template_id}", response_model=MarketplaceTemplateResponse)
def get_template(
    template_id: int,
    db:          Session = Depends(get_db),
):
    tmpl = db.query(MarketplaceTemplateDB).filter(MarketplaceTemplateDB.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template nicht gefunden")
    publisher = db.query(UserDB).filter(UserDB.id == tmpl.user_id).first()
    name = f"{publisher.first_name} {publisher.last_name}" if publisher else "Unbekannt"
    return _build_response(tmpl, db, name)


# --- Löschen ---

@router.delete("/{template_id}", status_code=200)
def delete_template(
    template_id:  int,
    current_user: UserDB  = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    tmpl = db.query(MarketplaceTemplateDB).filter(
        MarketplaceTemplateDB.id == template_id,
        MarketplaceTemplateDB.user_id == current_user.id,
    ).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template nicht gefunden")

    db.query(MarketplaceRatingDB).filter(MarketplaceRatingDB.template_id == template_id).delete()
    db.query(MarketplaceCommentDB).filter(MarketplaceCommentDB.template_id == template_id).delete()
    db.query(MarketplaceImageDB).filter(MarketplaceImageDB.template_id == template_id).delete()
    db.delete(tmpl)
    db.commit()
    return {"message": "Template gelöscht"}


# --- Bewerten ---

@router.post("/{template_id}/rate", status_code=200)
def rate_template(
    template_id:  int,
    req:          RateRequest,
    current_user: UserDB  = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    if not 1 <= req.rating <= 5:
        raise HTTPException(status_code=400, detail="Bewertung muss zwischen 1 und 5 liegen")

    tmpl = db.query(MarketplaceTemplateDB).filter(MarketplaceTemplateDB.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template nicht gefunden")
    if tmpl.user_id == current_user.id:
        raise HTTPException(status_code=403, detail="Eigene Templates können nicht bewertet werden")

    existing = db.query(MarketplaceRatingDB).filter(
        MarketplaceRatingDB.template_id == template_id,
        MarketplaceRatingDB.user_id == current_user.id,
    ).first()

    if existing:
        existing.rating = req.rating
    else:
        db.add(MarketplaceRatingDB(
            template_id=template_id,
            user_id=current_user.id,
            rating=req.rating,
        ))
    db.commit()
    return {"message": "Bewertung gespeichert"}


# --- Kommentare ---

@router.get("/{template_id}/comments", response_model=List[CommentResponse])
def get_comments(
    template_id: int,
    db:          Session = Depends(get_db),
):
    comments = db.query(MarketplaceCommentDB).filter(
        MarketplaceCommentDB.template_id == template_id
    ).order_by(MarketplaceCommentDB.created_at.asc()).all()

    result = []
    for c in comments:
        user = db.query(UserDB).filter(UserDB.id == c.user_id).first()
        result.append(CommentResponse(
            id=c.id,
            user_id=c.user_id,
            username=user.username if user else "Unbekannt",
            content=c.content,
            created_at=c.created_at.isoformat() if c.created_at else "",
        ))
    return result


@router.post("/{template_id}/comments", response_model=CommentResponse, status_code=201)
def add_comment(
    template_id:  int,
    req:          CommentRequest,
    current_user: UserDB  = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Kommentar darf nicht leer sein")

    tmpl = db.query(MarketplaceTemplateDB).filter(MarketplaceTemplateDB.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template nicht gefunden")

    comment = MarketplaceCommentDB(
        template_id=template_id,
        user_id=current_user.id,
        content=req.content.strip(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id,
        user_id=comment.user_id,
        username=current_user.username,
        content=comment.content,
        created_at=comment.created_at.isoformat() if comment.created_at else "",
    )


@router.delete("/{template_id}/comments/{comment_id}", status_code=200)
def delete_comment(
    template_id:  int,
    comment_id:   int,
    current_user: UserDB  = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    comment = db.query(MarketplaceCommentDB).filter(
        MarketplaceCommentDB.id == comment_id,
        MarketplaceCommentDB.template_id == template_id,
        MarketplaceCommentDB.user_id == current_user.id,
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Kommentar nicht gefunden")
    db.delete(comment)
    db.commit()
    return {"message": "Kommentar gelöscht"}


# --- Bilder ---

@router.post("/{template_id}/images", response_model=ImageResponse, status_code=201)
async def upload_image(
    template_id:  int,
    file:         UploadFile = File(...),
    current_user: UserDB     = Depends(get_current_user),
    db:           Session    = Depends(get_db),
):
    tmpl = db.query(MarketplaceTemplateDB).filter(MarketplaceTemplateDB.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template nicht gefunden")

    if file.content_type not in ("image/jpeg", "image/png", "image/gif", "image/webp"):
        raise HTTPException(status_code=400, detail="Nur Bilder (jpeg, png, gif, webp) erlaubt")

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(await file.read())

    img = MarketplaceImageDB(
        template_id=template_id,
        user_id=current_user.id,
        filename=filename,
    )
    db.add(img)
    db.commit()
    db.refresh(img)

    return ImageResponse(id=img.id, filename=filename, url=f"/uploads/marketplace/{filename}")


@router.get("/{template_id}/images", response_model=List[ImageResponse])
def get_images(
    template_id: int,
    db:          Session = Depends(get_db),
):
    images = db.query(MarketplaceImageDB).filter(MarketplaceImageDB.template_id == template_id).all()
    return [
        ImageResponse(id=i.id, filename=i.filename, url=f"/uploads/marketplace/{i.filename}")
        for i in images
    ]


@router.delete("/{template_id}/images/{image_id}", status_code=200)
def delete_image(
    template_id:  int,
    image_id:     int,
    current_user: UserDB  = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    img = db.query(MarketplaceImageDB).filter(
        MarketplaceImageDB.id == image_id,
        MarketplaceImageDB.template_id == template_id,
        MarketplaceImageDB.user_id == current_user.id,
    ).first()
    if not img:
        raise HTTPException(status_code=404, detail="Bild nicht gefunden")

    path = os.path.join(UPLOAD_DIR, img.filename)
    if os.path.exists(path):
        os.remove(path)

    db.delete(img)
    db.commit()
    return {"message": "Bild gelöscht"}


# --- Importieren ---

@router.post("/{template_id}/import", status_code=201)
def import_template(
    template_id:  int,
    current_user: UserDB  = Depends(get_current_user),
    db:           Session = Depends(get_db),
):
    tmpl = db.query(MarketplaceTemplateDB).filter(MarketplaceTemplateDB.id == template_id).first()
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template nicht gefunden")

    new_tmpl = UserTemplateDB(
        user_id         = current_user.id,
        name            = tmpl.name,
        description     = tmpl.description,
        icon            = tmpl.icon,
        containers_json = tmpl.containers_json,
    )
    db.add(new_tmpl)

    tmpl.download_count += 1
    db.commit()
    db.refresh(new_tmpl)

    return {"message": "Template importiert", "template_id": new_tmpl.id}
