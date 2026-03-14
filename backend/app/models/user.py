from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from pydantic import BaseModel
from app.database import Base


class UserDB(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    username        = Column(String, unique=True, index=True, nullable=False)
    first_name      = Column(String, nullable=False)
    last_name       = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    favorites_json  = Column(Text, default="[]")
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    notify_on_start   = Column(Boolean, default=True)
    notify_on_stop    = Column(Boolean, default=True)
    notify_on_warning = Column(Boolean, default=True)
    theme             = Column(String, default="dark")


class RegisterRequest(BaseModel):
    email:      str
    username:   str
    first_name: str
    last_name:  str
    password:   str

class LoginRequest(BaseModel):
    email:    str
    password: str

class UserResponse(BaseModel):
    id:         int
    email:      str
    username:   str
    first_name: str
    last_name:  str
    notify_on_start:   bool = True
    notify_on_stop:    bool = True
    notify_on_warning: bool = True
    theme:             str  = "dark"

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str
    user:         UserResponse

class NotificationPrefsRequest(BaseModel):
    notify_on_start:   bool
    notify_on_stop:    bool
    notify_on_warning: bool
    theme:             str = "dark"
