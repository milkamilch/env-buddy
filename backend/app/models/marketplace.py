import json
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
from app.database import Base
from app.models.template import ContainerConfig


class MarketplaceTemplateDB(Base):
    __tablename__ = "marketplace_templates"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    name            = Column(String, nullable=False)
    description     = Column(String, default="")
    icon            = Column(String, default="📦")
    containers_json = Column(Text, nullable=False)
    tags_json       = Column(Text, default="[]")
    download_count  = Column(Integer, default=0)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def containers(self) -> list:
        return json.loads(self.containers_json)

    @property
    def tags(self) -> list:
        return json.loads(self.tags_json)


class MarketplaceRatingDB(Base):
    __tablename__ = "marketplace_ratings"
    __table_args__ = (UniqueConstraint("template_id", "user_id"),)

    id          = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("marketplace_templates.id"), nullable=False)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating      = Column(Integer, nullable=False)  # 1–5
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class MarketplaceCommentDB(Base):
    __tablename__ = "marketplace_comments"

    id          = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("marketplace_templates.id"), nullable=False)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    content     = Column(Text, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class MarketplaceImageDB(Base):
    __tablename__ = "marketplace_images"

    id          = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("marketplace_templates.id"), nullable=False)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename    = Column(String, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


# --- Pydantic schemas ---

class PublishTemplateRequest(BaseModel):
    name:        str
    description: str = ""
    icon:        str = "📦"
    containers:  List[ContainerConfig]
    tags:        List[str] = []

class MarketplaceTemplateResponse(BaseModel):
    id:             int
    user_id:        int
    publisher_name: str
    name:           str
    description:    str
    icon:           str
    containers:     List[ContainerConfig]
    tags:           List[str]
    download_count: int
    avg_rating:     float
    rating_count:   int
    created_at:     str

    model_config = {"from_attributes": True}

class RateRequest(BaseModel):
    rating: int  # 1–5

class CommentRequest(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id:         int
    user_id:    int
    username:   str
    content:    str
    created_at: str

    model_config = {"from_attributes": True}

class ImageResponse(BaseModel):
    id:       int
    filename: str
    url:      str
