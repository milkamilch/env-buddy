from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.services import notification_service

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class TestMailRequest(BaseModel):
    to: str
    container_name: str = "testbuddy-postgres-abc123"
    template: str = "postgres"
    port: int = 10001
    duration_minutes: int = 60

@router.post("/test")
def send_test_mail(request: TestMailRequest):
    """Sendet eine Test-E-Mail um das Setup zu prüfen."""
    try:
        notification_service.notify_container_started(
            to=request.to,
            container_name=request.container_name,
            template=request.template,
            port=request.port,
            duration_minutes=request.duration_minutes,
        )
        return {"message": f"Test-Mail erfolgreich an {request.to} gesendet!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))