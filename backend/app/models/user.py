from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
from app.database import Base


class UserDB(Base):
    __tablename__ = "users"

    id             = Column(Integer, primary_key=True, index=True)
    email          = Column(String, unique=True, index=True, nullable=False)
    username       = Column(String, unique=True, index=True, nullable=False)
    first_name     = Column(String, nullable=False)
    last_name      = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())


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

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str
    user:         UserResponse
