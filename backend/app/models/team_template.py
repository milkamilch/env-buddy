import json
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List
from app.database import Base
from app.models.template import ContainerConfig


class TeamTemplateDB(Base):
    __tablename__ = "team_templates"

    id              = Column(Integer, primary_key=True, index=True)
    team_id         = Column(Integer, ForeignKey("teams.id"), nullable=True)
    created_by      = Column(Integer, ForeignKey("users.id"), nullable=False)
    name            = Column(String, nullable=False)
    description     = Column(String, default="")
    icon            = Column(String, default="📦")
    containers_json = Column(Text, nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def containers(self) -> list:
        return json.loads(self.containers_json)


class CreateTeamTemplateRequest(BaseModel):
    name:        str
    description: str = ""
    icon:        str = "📦"
    containers:  List[ContainerConfig]


class TeamTemplateResponse(BaseModel):
    id:           int
    team_id:      int | None
    created_by:   int
    creator_name: str
    name:         str
    description:  str
    icon:         str
    containers:   List[ContainerConfig]

    model_config = {"from_attributes": True}
