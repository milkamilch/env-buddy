from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel
from app.database import Base


class TeamInvitationDB(Base):
    __tablename__ = "team_invitations"

    id           = Column(Integer, primary_key=True, index=True)
    team_id      = Column(Integer, ForeignKey("teams.id"), nullable=False)
    inviter_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    invitee_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    status       = Column(String, default="pending")  # pending | accepted | declined
    created_at   = Column(DateTime(timezone=True), server_default=func.now())


class InvitationResponse(BaseModel):
    id:           int
    team_id:      int
    team_name:    str
    inviter_name: str
    status:       str
    created_at:   str

    model_config = {"from_attributes": True}
