from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class AuditLogDB(Base):
    __tablename__ = "audit_logs"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, nullable=True)
    username       = Column(String, nullable=True)
    action         = Column(String, nullable=False)
    container_name = Column(String, nullable=True)
    template       = Column(String, nullable=True)
    extra          = Column(String, nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
