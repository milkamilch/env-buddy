from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth_utils import get_current_user
from app.models.user import UserDB
from app.services import docker_service

router = APIRouter(prefix="/api/github-actions", tags=["GitHub Actions"])


class TriggerRequest(BaseModel):
    template: str
    env_overrides: dict = {}
    host_port: int | None = None
    duration_minutes: int = 60
    mem_limit: str | None = None
    cpu_limit: float | None = None


@router.post("/trigger")
def trigger(req: TriggerRequest, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        result = docker_service.start_container(
            req.template,
            req.duration_minutes,
            env_overrides=req.env_overrides,
            host_port=req.host_port,
            mem_limit=req.mem_limit,
            cpu_limit=req.cpu_limit,
            user_id=current_user.id,
        )
        return {
            "status": "started",
            "container": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/workflow-example")
def workflow_example(current_user: UserDB = Depends(get_current_user)):
    base_url = "http://your-env-buddy-host:8000"
    return {
        "yaml": f"""name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start test database
        id: db
        run: |
          RESPONSE=$(curl -s -X POST {base_url}/api/github-actions/trigger \\
            -H "X-Api-Key: ${{{{ secrets.ENV_BUDDY_API_KEY }}}}" \\
            -H "Content-Type: application/json" \\
            -d '{{"template":"postgres","duration_minutes":30}}')
          echo "port=$(echo $RESPONSE | jq -r '.container.port')" >> $GITHUB_OUTPUT

      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:${{{{ steps.db.outputs.port }}}}/postgres
        run: npm test
"""
    }
