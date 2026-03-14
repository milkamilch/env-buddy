import docker
import uuid
from datetime import datetime

client = docker.from_env()

TEMPLATES = {
    "postgres": {
        "image": "postgres:15",
        "env" : {"POSTGRES_PASSWORD": "envbuddy", "POSTGRES_DB": "testdb"},
        "port": 1871,
    },
    "redis" : {
        "image": "redis:7",
        "env": {},
        "port": 1872,
    },
    "mysql": {
        "image": "mysql:8",
        "env": {"MYSQL_ROOT_PASSWORD": "envbuddy", "MYSQL_DATABASE": "testdb"},
        "port": 1873,
    },
    "mongo": {
        "image": "mongo:6",
        "env": {},
        "port": 27017,
    },
}

def get_free_port(start=10000,end=11000):
    import socket
    for port in range(start, end):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("localhost", port)) != 0:
                return port
    raise RuntimeError("No free port fund, bruh!")

def start_container(template_name: str, duration_minutes: int=60):
    if template_name not in TEMPLATES:
        raise ValueError(f"Template '{template_name}' not found")

    template = TEMPLATES[template_name]
    free_port = get_free_port()
    container_name = f"testbuddy-{template_name}-{uuid.uuid4().hex[:6]}"

    container = client.containers.run(
        image = template["image"], 
        name = container_name,
        environment = template["env"],
        ports = {f"{template['port']}/tcp": free_port},
        detach = True,
        labels = {"managed-by": "test-buddy",
            "started-at": datetime.utcnow().isoformat(),
            "duration-minutes": str(duration_minutes),
            "template": template_name,
        },
    )

    return {
        "id": container.id[:12],
        "name": container_name,
        "template": template_name,
        "port": free_port,
        "status": "running",
        "started_at": datetime.utcnow().isoformat(),
        "stops_at": None,  # Timer muss noch gebaut werden / 12.03.26
    }

def list_containers():
    containers = client.containers.list(
        filters = {"label": "managed-by=test-buddy"}
    )

    result = []
    for c in containers:
        labels = c.labels
        stats = c.stats(stream=False)

        cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - \
                    stats["precpu_stats"]["cpu_usage"]["total_usage"]
        system_delta = stats["cpu_stats"]["system_cpu_usage"] - \
                        stats["precpu_stats"]["system_cpu_usage"]
        cpu_percent = round((cpu_delta / system_delta) * 100, 2) if system_delta > 0 else 0

        ram_mb = round(stats["memory_stats"]["usage"] / 1024 / 1024, 1)

        result.append({
            "id": c.short_id,
            "name": c.name,
            "template": labels.get("template", "unknown"),
            "status": c.status,
            "started_at": labels.get("started-at"),
            "cpu_percent": cpu_percent,
            "ram_mb": ram_mb,
        })

    return result

def stop_container(container_id: str):
    container = client.containers.get(container_id)
    container.stop()
    container.remove()
    return {"message": f"Container {container_id} stopped and removed"}

def get_container_stats(container_id: str):
    container = client.containers.get(container_id)
    stats = container.stats(stream=False)

    cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - \
                stats["precpu_stats"]["cpu_usage"]["total_usage"]
    system_delta = stats["cpu_stats"]["system_cpu_usage"] - \
                   stats["precpu_stats"]["system_cpu_usage"]
    cpu_percent = round((cpu_delta / system_delta) * 100, 2) if system_delta > 0 else 0

    ram_usage = stats["memory_stats"]["usage"]
    ram_limit = stats["memory_stats"]["limit"]

    return {
        "id": container_id,
        "cpu_percent": cpu_percent,
        "ram_mb": round(ram_usage / 1024 / 1024, 1),
        "ram_limit_mb": round(ram_limit / 1024 / 1024, 1),
        "ram_percent": round((ram_usage / ram_limit) * 100, 2),
    }