from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import containers, notifications

app = FastAPI(title="Env-Buddy API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(containers.router)
app.include_router(notifications.router)

@app.get("/health")
def health():
    return {"status": "ok"}