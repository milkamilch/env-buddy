from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import List, Optional
from app.database import Base


class TeamDB(Base):
    __tablename__ = "teams"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TeamMemberDB(Base):
    __tablename__ = "team_members"
    __table_args__ = (UniqueConstraint("team_id", "user_id"),)

    id        = Column(Integer, primary_key=True, index=True)
    team_id   = Column(Integer, ForeignKey("teams.id"), nullable=False)
    user_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    role      = Column(String, default="member")   # "admin" | "manager" | "member"
    joined_at = Column(DateTime(timezone=True), server_default=func.now())


# ── Pydantic schemas ────────────────────────────────────────────────────────

class CreateTeamRequest(BaseModel):
    name: str


class TeamResponse(BaseModel):
    id:           int
    name:         str
    created_by:   int
    member_count: int


class TeamMemberResponse(BaseModel):
    user_id:    int
    username:   str
    first_name: str
    last_name:  str
    role:       str


class AddMemberRequest(BaseModel):
    username: str


class UpdateRoleRequest(BaseModel):
    role: str
