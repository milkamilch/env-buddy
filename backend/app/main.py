import asyncio
import os
from contextlib import asynccontextmanager
from sqlalchemy import text
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from app.routers import containers, notifications, auth, user_templates, team_templates, teams, marketplace, audit
from app.database import engine
from app.models import user as user_model
from app.models import template as template_model
from app.models import team_template as team_template_model
from app.models import team as team_model
from app.models import marketplace as marketplace_model
from app.services import docker_service

user_model.Base.metadata.create_all(bind=engine)
template_model.Base.metadata.create_all(bind=engine)
team_model.Base.metadata.create_all(bind=engine)
team_template_model.Base.metadata.create_all(bind=engine)
marketplace_model.Base.metadata.create_all(bind=engine)
from app.models import audit as audit_model
audit_model.Base.metadata.create_all(bind=engine)

def _run_migrations():
    user_cols = [
        ("notify_on_start",   "1"),
        ("notify_on_stop",    "1"),
        ("notify_on_warning", "1"),
        ("theme",             "'dark'"),
    ]
    with engine.connect() as conn:
        for col, default in user_cols:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} INTEGER DEFAULT {default} NOT NULL"))
                conn.commit()
            except Exception:
                pass
        # team_id column for existing team_templates rows
        try:
            conn.execute(text("ALTER TABLE team_templates ADD COLUMN team_id INTEGER REFERENCES teams(id)"))
            conn.commit()
        except Exception:
            pass
        # is_verified column — bestehende User sind bereits verifiziert
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0 NOT NULL"))
            conn.commit()
            conn.execute(text("UPDATE users SET is_verified = 1"))
            conn.commit()
        except Exception:
            pass
        # rename owner → admin in team_members
        try:
            conn.execute(text("UPDATE team_members SET role = 'admin' WHERE role = 'owner'"))
            conn.commit()
        except Exception:
            pass
        # webhook_url column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN webhook_url TEXT"))
            conn.commit()
        except Exception:
            pass
        # avatar_url and bio columns
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url TEXT"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN bio TEXT"))
            conn.commit()
        except Exception:
            pass

async def _auto_stop_loop():
    while True:
        await asyncio.sleep(30)
        docker_service.auto_stop_expired_containers()

@asynccontextmanager
async def lifespan(app: FastAPI):
    _run_migrations()
    task = asyncio.create_task(_auto_stop_loop())
    yield
    task.cancel()

app = FastAPI(title="Env-Buddy API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(containers.router)
app.include_router(notifications.router)
app.include_router(user_templates.router)
app.include_router(team_templates.router)
app.include_router(teams.router)
app.include_router(marketplace.router)
app.include_router(audit.router)

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads", "marketplace"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads/marketplace", StaticFiles(directory=UPLOAD_DIR), name="marketplace-uploads")

AVATAR_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads", "avatars"))
os.makedirs(AVATAR_DIR, exist_ok=True)
app.mount("/uploads/avatars", StaticFiles(directory=AVATAR_DIR), name="avatar-uploads")

@app.get("/health")
def health():
    return {"status": "ok"}
