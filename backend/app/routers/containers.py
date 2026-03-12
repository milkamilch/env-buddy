from fastapi import APIRouter, HTTPException
from app.models.container import StartContainerRequest, ContainerResponse
from app.services import docker_service

router = APIRouter(prefix="/api/containers", tags=["Containers"])

@router.post("/start", response_model=ContainerResponse)
def start(request: StartContainerRequest):
    try:
        return docker_service.start_container(
            request.template,
            request.duration_minutes
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
def list_all():
    try:
        return docker_service.list_containers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{container_id}")
def stop(container_id: str):
    try:
        return docker_service.stop_container(container_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{container_id}/stats")
def stats(container_id: str):
    try:
        return docker_service.get_container_stats(container_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates")
def get_templates():
    return list(docker_service.TEMPLATES.keys())