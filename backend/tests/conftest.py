import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from unittest.mock import patch

from app.database import Base, get_db
from app.models import user, template, team, team_template  # register all models with Base


@pytest.fixture
def client():
    # StaticPool ensures all connections share the same in-memory database
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    from app.main import app
    app.dependency_overrides[get_db] = override_get_db

    # Prevent actual email sending and Docker calls during tests
    with patch("app.routers.auth._send_async"):
        yield TestClient(app)  # no context manager = no lifespan, no side effects

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


REGISTER_PAYLOAD = {
    "email": "test@example.com",
    "username": "testuser",
    "first_name": "Max",
    "last_name": "Muster",
    "password": "secret123",
}
