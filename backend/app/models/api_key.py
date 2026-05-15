import secrets
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional
from app.database import Base


class ApiKeyDB(Base):
    __tablename__ = "api_keys"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    name       = Column(String, nullable=False)
    key_hash   = Column(String, unique=True, nullable=False, index=True)
    key_prefix = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used  = Column(DateTime(timezone=True), nullable=True)
    is_active  = Column(Boolean, default=True)

    @staticmethod
    def generate() -> tuple[str, str, str]:
        """Returns (raw_key, key_hash, key_prefix)."""
        import hashlib
        raw = "ebk_" + secrets.token_urlsafe(32)
        hashed = hashlib.sha256(raw.encode()).hexdigest()
        prefix = raw[:12]
        return raw, hashed, prefix


class ApiKeyCreate(BaseModel):
    name: str

class ApiKeyResponse(BaseModel):
    id:         int
    name:       str
    key_prefix: str
    created_at: str
    last_used:  Optional[str] = None
    is_active:  bool

    model_config = {"from_attributes": True}

class ApiKeyCreated(ApiKeyResponse):
    raw_key: str
