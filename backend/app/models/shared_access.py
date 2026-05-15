from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from pydantic import BaseModel
from app.database import Base


class SharedAccessDB(Base):
    __tablename__ = "shared_access"
    __table_args__ = (UniqueConstraint("container_label", "grantee_id"),)

    id              = Column(Integer, primary_key=True, index=True)
    container_label = Column(String, nullable=False, index=True)  # docker container id (short)
    owner_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    grantee_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())


class ShareRequest(BaseModel):
    username: str

class SharedAccessResponse(BaseModel):
    id:              int
    container_label: str
    grantee_username: str
    created_at:      str
