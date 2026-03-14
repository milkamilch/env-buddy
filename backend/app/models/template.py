import json
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Dict
from app.database import Base


class UserTemplateDB(Base):
    __tablename__ = "user_templates"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    name           = Column(String, nullable=False)
    description    = Column(String, default="")
    icon           = Column(String, default="📦")
    containers_json = Column(Text, nullable=False)  # JSON array of container configs
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def containers(self) -> list:
        return json.loads(self.containers_json)


class ContainerConfig(BaseModel):
    service_name:  str
    image:         str
    internal_port: int
    env:           Dict[str, str] = {}

class CreateTemplateRequest(BaseModel):
    name:        str
    description: str = ""
    icon:        str = "📦"
    containers:  List[ContainerConfig]

class TemplateResponse(BaseModel):
    id:          int
    user_id:     int
    name:        str
    description: str
    icon:        str
    containers:  List[ContainerConfig]

    model_config = {"from_attributes": True}
