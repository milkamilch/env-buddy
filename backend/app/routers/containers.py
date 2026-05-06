from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security
from jose import jwt, JWTError
import os
import threading
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.container import StartContainerRequest, StackContainerSpec
from app.models.user import UserDB
from app.models.template import UserTemplateDB
from app.models.team_template import TeamTemplateDB
from app.services import docker_service
from app.services.notification_service import notify_container_started
from app.services.webhook_service import call_webhook
from app.models.audit import AuditLogDB


def _container_limit() -> int:
    try:
        return int(os.getenv("MAX_CONTAINERS_PER_USER", "10"))
    except ValueError:
        return 10


SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
_bearer = HTTPBearer(auto_error=False)


def _get_required_user(creds: HTTPAuthorizationCredentials = Security(_bearer), db: Session = Depends(get_db)):
    if not creds:
        raise HTTPException(status_code=401, detail="Nicht angemeldet")
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Ungültiger Token")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Ungültiger Token")


def _assert_owner(container_id: str, user: UserDB):
    """Raises 403 if the container belongs to a different user."""
    try:
        c = docker_service.client.containers.get(container_id)
        uid = c.labels.get("user-id", "")
        if uid and uid != str(user.id):
            raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Container")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Container nicht gefunden")


def _assert_stack_owner(stack_id: str, user: UserDB):
    """Raises 403 if the stack belongs to a different user."""
    containers = docker_service.client.containers.list(
        all=True, filters={"label": f"stack-id={stack_id}"}
    )
    if not containers:
        raise HTTPException(status_code=404, detail="Stack nicht gefunden")
    uid = containers[0].labels.get("user-id", "")
    if uid and uid != str(user.id):
        raise HTTPException(status_code=403, detail="Kein Zugriff auf diesen Stack")


def _log(db: Session, user: UserDB, action: str, container_name: str,
         template: str = None, extra: str = None):
    try:
        db.add(AuditLogDB(
            user_id=user.id, username=user.username,
            action=action, container_name=container_name,
            template=template, extra=extra,
        ))
        db.commit()
    except Exception:
        pass


router = APIRouter(prefix="/api/containers", tags=["Containers"])


class StartStackRequest(BaseModel):
    containers:       list[StackContainerSpec]
    stack_name:       str
    duration_minutes: int = 60


@router.post("/start")
def start(request: StartContainerRequest,
          current_user: UserDB = Depends(_get_required_user),
          db: Session = Depends(get_db)):
    limit = _container_limit()
    if limit > 0:
        running = [c for c in docker_service.list_containers(user_id=current_user.id) if c["status"] == "running"]
        if len(running) >= limit:
            raise HTTPException(
                status_code=429,
                detail=f"Limit erreicht: maximal {limit} laufende Container pro User."
            )
    try:
        if request.template.startswith("team:"):
            tmpl_id = int(request.template.split(":")[1])
            tmpl = db.query(TeamTemplateDB).filter(TeamTemplateDB.id == tmpl_id).first()
            if not tmpl:
                raise HTTPException(status_code=404, detail="Team-Template nicht gefunden")
            configs = tmpl.containers
            if len(configs) == 1:
                result = docker_service.start_container_from_config(
                    configs[0], request.duration_minutes,
                    user_id=current_user.id, template_label=request.template,
                )
            else:
                result = docker_service.start_stack_from_configs(
                    configs, tmpl.name, request.duration_minutes, user_id=current_user.id,
                )
        elif request.template.startswith("custom:"):
            tmpl_id = int(request.template.split(":")[1])
            tmpl = db.query(UserTemplateDB).filter(
                UserTemplateDB.id == tmpl_id,
                UserTemplateDB.user_id == current_user.id,
            ).first()
            if not tmpl:
                raise HTTPException(status_code=404, detail="Template nicht gefunden")
            configs = tmpl.containers
            if len(configs) == 1:
                result = docker_service.start_container_from_config(
                    configs[0], request.duration_minutes,
                    user_id=current_user.id, template_label=request.template,
                )
            else:
                result = docker_service.start_stack_from_configs(
                    configs, tmpl.name, request.duration_minutes, user_id=current_user.id,
                )
        else:
            result = docker_service.start_container(
                request.template,
                request.duration_minutes,
                env_overrides=request.env_overrides,
                host_port=request.host_port,
                container_name=request.container_name,
                mem_limit=request.mem_limit,
                cpu_limit=request.cpu_limit,
                user_id=current_user.id,
            )
        name = result.get("name") or (result.get("containers") or [{}])[0].get("name", "")
        port = result.get("port") or 0
        _log(db, current_user, "started", name, template=request.template)
        if current_user.notify_on_start:
            threading.Thread(
                target=notify_container_started,
                args=(current_user.email, name, request.template, port, request.duration_minutes),
                daemon=True,
            ).start()
        if current_user.webhook_url:
            threading.Thread(
                target=call_webhook,
                args=(current_user.webhook_url, "container.started",
                      {"name": name, "template": request.template, "port": port}),
                daemon=True,
            ).start()
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stacks/start")
def start_stack(request: StartStackRequest,
                current_user: UserDB = Depends(_get_required_user)):
    limit = _container_limit()
    if limit > 0:
        running = [c for c in docker_service.list_containers(user_id=current_user.id) if c["status"] == "running"]
        if len(running) >= limit:
            raise HTTPException(
                status_code=429,
                detail=f"Limit erreicht: maximal {limit} laufende Container pro User."
            )
    try:
        return docker_service.start_stack_from_configs(
            [c.model_dump() for c in request.containers],
            request.stack_name,
            request.duration_minutes,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stacks")
def list_stacks(current_user: UserDB = Depends(_get_required_user)):
    try:
        stacks = docker_service.list_stacks(user_id=current_user.id)
        for s in stacks:
            for c in s["containers"]:
                c["started_by"] = current_user.username
        return stacks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stacks/{stack_id}/stop")
def stop_stack(stack_id: str, current_user: UserDB = Depends(_get_required_user)):
    _assert_stack_owner(stack_id, current_user)
    try:
        return docker_service.stop_stack(stack_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stacks/{stack_id}/start")
def start_stopped_stack(stack_id: str, current_user: UserDB = Depends(_get_required_user)):
    _assert_stack_owner(stack_id, current_user)
    try:
        return docker_service.start_stopped_stack(stack_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/stacks/{stack_id}")
def remove_stack(stack_id: str, current_user: UserDB = Depends(_get_required_user)):
    _assert_stack_owner(stack_id, current_user)
    try:
        return docker_service.remove_stack(stack_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/system-info")
def system_info():
    info = docker_service.client.info()
    total_ram_mb = info["MemTotal"] // (1024 * 1024)
    limit = _container_limit()
    return {"total_ram_mb": total_ram_mb, "max_containers_per_user": limit}


@router.get("/templates")
def get_templates():
    return list(docker_service.TEMPLATES.keys())


@router.get("/templates/{name}")
def get_template_details(name: str):
    if name not in docker_service.TEMPLATES:
        raise HTTPException(status_code=404, detail=f"Template '{name}' not found")
    t = docker_service.TEMPLATES[name]
    return {"name": name, "image": t["image"], "port": t["port"], "env": t["env"]}


@router.get("/")
def list_all(current_user: UserDB = Depends(_get_required_user)):
    try:
        containers = docker_service.list_containers(user_id=current_user.id)
        for c in containers:
            c["started_by"] = current_user.username
        return containers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{container_id}/config")
def get_config(container_id: str, current_user: UserDB = Depends(_get_required_user)):
    _assert_owner(container_id, current_user)
    try:
        return docker_service.get_container_config(container_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class UpdateConfigRequest(BaseModel):
    env_overrides: dict[str, str] = {}
    host_port: int | None = None
    container_name: str | None = None
    mem_limit: str | None = None
    cpu_limit: float | None = None


@router.put("/{container_id}/config")
def update_config(container_id: str, request: UpdateConfigRequest, current_user: UserDB = Depends(_get_required_user)):
    _assert_owner(container_id, current_user)
    try:
        return docker_service.update_container_config(
            container_id,
            env_overrides=request.env_overrides,
            host_port=request.host_port,
            container_name=request.container_name,
            mem_limit=request.mem_limit,
            cpu_limit=request.cpu_limit,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{container_id}/stop")
def stop(container_id: str, current_user: UserDB = Depends(_get_required_user),
         db: Session = Depends(get_db)):
    _assert_owner(container_id, current_user)
    try:
        c = docker_service.client.containers.get(container_id)
        name = c.name
        tpl = c.labels.get("template")
        result = docker_service.stop_container(container_id)
        _log(db, current_user, "stopped", name, template=tpl)
        if current_user.webhook_url:
            threading.Thread(
                target=call_webhook,
                args=(current_user.webhook_url, "container.stopped", {"name": name, "template": tpl}),
                daemon=True,
            ).start()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{container_id}")
def remove(container_id: str, current_user: UserDB = Depends(_get_required_user),
           db: Session = Depends(get_db)):
    _assert_owner(container_id, current_user)
    try:
        c = docker_service.client.containers.get(container_id)
        name = c.name
        tpl = c.labels.get("template")
        result = docker_service.remove_container(container_id)
        _log(db, current_user, "removed", name, template=tpl)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{container_id}/start")
def start_stopped(container_id: str, current_user: UserDB = Depends(_get_required_user)):
    _assert_owner(container_id, current_user)
    try:
        return docker_service.start_stopped_container(container_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{container_id}/restart")
def restart(container_id: str, current_user: UserDB = Depends(_get_required_user),
            db: Session = Depends(get_db)):
    _assert_owner(container_id, current_user)
    try:
        c = docker_service.client.containers.get(container_id)
        name = c.name
        tpl = c.labels.get("template")
        result = docker_service.restart_container(container_id)
        _log(db, current_user, "restarted", name, template=tpl)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ExtendRequest(BaseModel):
    extra_minutes: int = 30


@router.post("/{container_id}/extend")
def extend(container_id: str, request: ExtendRequest,
           current_user: UserDB = Depends(_get_required_user),
           db: Session = Depends(get_db)):
    _assert_owner(container_id, current_user)
    try:
        c = docker_service.client.containers.get(container_id)
        name = c.name
        tpl = c.labels.get("template")
        result = docker_service.extend_container(container_id, request.extra_minutes)
        _log(db, current_user, "extended", name, template=tpl,
             extra=f"+{request.extra_minutes}min")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{container_id}/logs")
def get_logs(container_id: str, tail: int = 200, current_user: UserDB = Depends(_get_required_user)):
    _assert_owner(container_id, current_user)
    try:
        return docker_service.get_container_logs(container_id, tail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{container_id}/stats")
def stats(container_id: str, current_user: UserDB = Depends(_get_required_user)):
    _assert_owner(container_id, current_user)
    try:
        return docker_service.get_container_stats(container_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
