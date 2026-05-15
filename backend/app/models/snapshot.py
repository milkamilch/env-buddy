import json
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel
from app.database import Base


class SnapshotDB(Base):
    __tablename__ = "snapshots"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    name       = Column(String, nullable=False)
    config_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def config(self) -> dict:
        return json.loads(self.config_json)


class SnapshotCreate(BaseModel):
    name:      str
    template:  str
    env:       dict = {}
    port:      int | None = None
    mem_limit: str | None = None
    cpu_limit: float | None = None
    duration_minutes: int = 60

class SnapshotResponse(BaseModel):
    id:         int
    name:       str
    config:     dict
    created_at: str

    model_config = {"from_attributes": True}
