import docker
import uuid
from datetime import datetime, timezone, timedelta

client = docker.from_env()

_warned_containers: set = set()
_extensions: dict[str, int] = {}  # short_id -> extra minutes added by user

TEMPLATES = {
    # Datenbanken
    "postgres": {
        "image": "postgres:15",
        "env":   {"POSTGRES_PASSWORD": "envbuddy", "POSTGRES_DB": "testdb"},
        "port":  5432,
    },
    "mysql": {
        "image": "mysql:8",
        "env":   {"MYSQL_ROOT_PASSWORD": "envbuddy", "MYSQL_DATABASE": "testdb"},
        "port":  3306,
    },
    "mariadb": {
        "image": "mariadb:11",
        "env":   {"MARIADB_ROOT_PASSWORD": "envbuddy", "MARIADB_DATABASE": "testdb"},
        "port":  3306,
    },
    "mongo": {
        "image": "mongo:7",
        "env":   {},
        "port":  27017,
    },
    "redis": {
        "image": "redis:7",
        "env":   {},
        "port":  6379,
    },
    "elasticsearch": {
        "image": "elasticsearch:8.13.0",
        "env":   {"discovery.type": "single-node", "xpack.security.enabled": "false", "ES_JAVA_OPTS": "-Xms512m -Xmx512m"},
        "port":  9200,
    },
    "cassandra": {
        "image": "cassandra:4",
        "env":   {},
        "port":  9042,
    },
    "cockroachdb": {
        "image": "cockroachdb/cockroach:latest",
        "env":   {},
        "port":  26257,
    },
    "neo4j": {
        "image": "neo4j:5",
        "env":   {"NEO4J_AUTH": "none"},
        "port":  7474,
    },
    "influxdb": {
        "image": "influxdb:2",
        "env":   {"DOCKER_INFLUXDB_INIT_MODE": "setup", "DOCKER_INFLUXDB_INIT_USERNAME": "envbuddy",
                  "DOCKER_INFLUXDB_INIT_PASSWORD": "envbuddy123", "DOCKER_INFLUXDB_INIT_ORG": "testorg",
                  "DOCKER_INFLUXDB_INIT_BUCKET": "testbucket"},
        "port":  8086,
    },
    "couchdb": {
        "image": "couchdb:3",
        "env":   {"COUCHDB_USER": "envbuddy", "COUCHDB_PASSWORD": "envbuddy"},
        "port":  5984,
    },
    "timescaledb": {
        "image": "timescale/timescaledb:latest-pg15",
        "env":   {"POSTGRES_PASSWORD": "envbuddy", "POSTGRES_DB": "testdb"},
        "port":  5432,
    },
    # Message Broker
    "rabbitmq": {
        "image": "rabbitmq:3-management",
        "env":   {"RABBITMQ_DEFAULT_USER": "envbuddy", "RABBITMQ_DEFAULT_PASS": "envbuddy"},
        "port":  5672,
    },
    "kafka": {
        "image": "apache/kafka:latest",
        "env":   {"KAFKA_NODE_ID": "1",
                  "KAFKA_PROCESS_ROLES": "broker,controller",
                  "KAFKA_LISTENERS": "PLAINTEXT://:9092,CONTROLLER://:9093",
                  "KAFKA_ADVERTISED_LISTENERS": "PLAINTEXT://localhost:9092",
                  "KAFKA_LISTENER_SECURITY_PROTOCOL_MAP": "CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT",
                  "KAFKA_CONTROLLER_QUORUM_VOTERS": "1@localhost:9093",
                  "KAFKA_CONTROLLER_LISTENER_NAMES": "CONTROLLER",
                  "KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR": "1",
                  "KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS": "0"},
        "port":  9092,
    },
    "nats": {
        "image": "nats:2",
        "env":   {},
        "port":  4222,
    },
    "mosquitto": {
        "image": "eclipse-mosquitto:2",
        "env":   {},
        "port":  1883,
    },
    # Web / Proxy
    "nginx": {
        "image": "nginx:alpine",
        "env":   {},
        "port":  80,
    },
    "httpd": {
        "image": "httpd:2.4",
        "env":   {},
        "port":  80,
    },
    "traefik": {
        "image": "traefik:v3",
        "env":   {},
        "port":  8080,
    },
    # Entwicklung & Tools
    "mailhog": {
        "image": "mailhog/mailhog",
        "env":   {},
        "port":  8025,
    },
    "adminer": {
        "image": "adminer:latest",
        "env":   {},
        "port":  8080,
    },
    "minio": {
        "image": "minio/minio",
        "env":   {"MINIO_ROOT_USER": "envbuddy", "MINIO_ROOT_PASSWORD": "envbuddy123"},
        "port":  9000,
    },
    "vault": {
        "image": "vault:1.15",
        "env":   {"VAULT_DEV_ROOT_TOKEN_ID": "envbuddy", "VAULT_DEV_LISTEN_ADDRESS": "0.0.0.0:8200"},
        "port":  8200,
    },
    "keycloak": {
        "image": "quay.io/keycloak/keycloak:24.0",
        "env":   {"KEYCLOAK_ADMIN": "admin", "KEYCLOAK_ADMIN_PASSWORD": "envbuddy", "KC_HTTP_ENABLED": "true"},
        "port":  8080,
    },
    "gitea": {
        "image": "gitea/gitea:latest",
        "env":   {},
        "port":  3000,
    },
    "prometheus": {
        "image": "prom/prometheus:latest",
        "env":   {},
        "port":  9090,
    },
    "grafana": {
        "image": "grafana/grafana:latest",
        "env":   {"GF_SECURITY_ADMIN_PASSWORD": "envbuddy"},
        "port":  3000,
    },
    "jaeger": {
        "image": "jaegertracing/all-in-one:latest",
        "env":   {},
        "port":  16686,
    },
    "sonarqube": {
        "image": "sonarqube:community",
        "env":   {},
        "port":  9000,
    },
    "registry": {
        "image": "registry:2",
        "env":   {},
        "port":  5000,
    },
    "verdaccio": {
        "image": "verdaccio/verdaccio:latest",
        "env":   {},
        "port":  4873,
    },
}

def _stops_at(started_at_str: str | None, duration_minutes: int) -> str | None:
    if not started_at_str:
        return None
    dt = datetime.fromisoformat(started_at_str)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return (dt + timedelta(minutes=duration_minutes)).isoformat()

def get_free_port(start=10000,end=11000):
    import socket
    for port in range(start, end):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("localhost", port)) != 0:
                return port
    raise RuntimeError("No free port fund, bruh!")

def start_container(template_name: str, duration_minutes: int = 60,
                    env_overrides: dict = {}, host_port: int | None = None,
                    container_name: str | None = None, mem_limit: str | None = None,
                    extra_labels: dict = {}, user_id: int | None = None):
    if template_name not in TEMPLATES:
        raise ValueError(f"Template '{template_name}' not found")

    template = TEMPLATES[template_name]
    actual_port = host_port if host_port else get_free_port()
    actual_name = container_name if container_name else f"testbuddy-{template_name}-{uuid.uuid4().hex[:6]}"
    env = {**template["env"], **env_overrides}

    run_kwargs = dict(
        image=template["image"],
        name=actual_name,
        environment=env,
        ports={f"{template['port']}/tcp": actual_port},
        detach=True,
        labels={
            "managed-by": "test-buddy",
            "started-at": datetime.utcnow().isoformat(),
            "duration-minutes": str(duration_minutes),
            "template": template_name,
            "port": str(actual_port),
            "user-id": str(user_id) if user_id else "",
            **extra_labels,
        },
    )
    if mem_limit:
        run_kwargs["mem_limit"] = mem_limit

    container = client.containers.run(**run_kwargs)

    return {
        "id": container.id[:12],
        "name": actual_name,
        "template": template_name,
        "port": actual_port,
        "status": "running",
        "started_at": datetime.utcnow().isoformat(),
        "stops_at": (datetime.now(timezone.utc) + timedelta(minutes=duration_minutes)).isoformat(),
    }

def start_container_from_config(config: dict, duration_minutes: int,
                                user_id: int | None = None, template_label: str = "custom"):
    """Start a single container from a user/team template container config dict."""
    actual_port = get_free_port()
    service_name = config.get("service_name", "app")
    actual_name = f"testbuddy-{service_name}-{uuid.uuid4().hex[:6]}"

    container = client.containers.run(
        image=config["image"],
        name=actual_name,
        environment=config.get("env", {}),
        ports={f"{config['internal_port']}/tcp": actual_port},
        detach=True,
        labels={
            "managed-by": "test-buddy",
            "started-at": datetime.utcnow().isoformat(),
            "duration-minutes": str(duration_minutes),
            "template": template_label,
            "port": str(actual_port),
            "user-id": str(user_id) if user_id else "",
        },
    )
    return {
        "id": container.id[:12],
        "name": actual_name,
        "template": template_label,
        "port": actual_port,
        "status": "running",
        "started_at": datetime.utcnow().isoformat(),
        "stops_at": (datetime.now(timezone.utc) + timedelta(minutes=duration_minutes)).isoformat(),
    }


def start_stack_from_configs(configs: list, stack_name: str, duration_minutes: int = 60,
                              user_id: int | None = None):
    """Start a stack from a list of container config dicts."""
    stack_id = uuid.uuid4().hex[:8]
    network_name = f"testbuddy-{stack_id}"
    network = client.networks.create(network_name, driver="bridge")
    started = []
    try:
        for config in configs:
            service_name = config.get("service_name", "app")
            free_port = config.get("host_port") or get_free_port()
            container_name = config.get("container_name") or f"testbuddy-{service_name}-{uuid.uuid4().hex[:6]}"
            container = client.containers.run(
                image=config["image"],
                name=container_name,
                environment=config.get("env", {}),
                ports={f"{config['internal_port']}/tcp": free_port},
                detach=True,
                network=network_name,
                hostname=service_name,
                labels={
                    "managed-by": "test-buddy",
                    "started-at": datetime.utcnow().isoformat(),
                    "duration-minutes": str(duration_minutes),
                    "template": service_name,
                    "stack-id": stack_id,
                    "stack-name": stack_name,
                    "stack-network": network_name,
                    "port": str(free_port),
                    "user-id": str(user_id) if user_id else "",
                },
            )
            network.connect(container, aliases=[service_name])
            started.append({
                "id": container.id[:12],
                "name": container_name,
                "template": service_name,
                "port": free_port,
                "status": "running",
                "started_at": datetime.utcnow().isoformat(),
            })
    except Exception:
        for c_info in started:
            try:
                stop_container(c_info["id"])
            except Exception:
                pass
        try:
            network.remove()
        except Exception:
            pass
        raise
    return {"stack_id": stack_id, "stack_name": stack_name, "network": network_name, "containers": started}


def _container_stats(c):
    if c.status != "running":
        return 0.0, 0.0, 0.0
    try:
        stats = c.stats(stream=False)
        cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - \
                    stats["precpu_stats"]["cpu_usage"]["total_usage"]
        system_delta = stats["cpu_stats"]["system_cpu_usage"] - \
                       stats["precpu_stats"]["system_cpu_usage"]
        cpu_percent = round((cpu_delta / system_delta) * 100, 2) if system_delta > 0 else 0
        ram_usage = stats["memory_stats"]["usage"]
        ram_limit = stats["memory_stats"].get("limit", 0)
        ram_mb = round(ram_usage / 1024 / 1024, 1)
        ram_percent = round((ram_usage / ram_limit) * 100, 2) if ram_limit > 0 else 0
        return cpu_percent, ram_mb, ram_percent
    except Exception:
        return 0.0, 0.0, 0.0

def list_containers(user_id: int | None = None):
    containers = client.containers.list(
        all=True,
        filters = {"label": "managed-by=test-buddy"}
    )

    result = []
    for c in containers:
        labels = c.labels
        if labels.get("stack-id"):  # skip stack containers
            continue
        if user_id is not None and labels.get("user-id") != str(user_id):
            continue
        cpu_percent, ram_mb, ram_percent = _container_stats(c)
        started_at = labels.get("started-at")
        duration = int(labels.get("duration-minutes", 60))
        extra = _extensions.get(c.short_id, 0)
        stops_at = _stops_at(started_at, duration + extra)
        result.append({
            "id": c.short_id,
            "name": c.name,
            "template": labels.get("template", "unknown"),
            "port": int(labels["port"]) if labels.get("port") else None,
            "status": c.status,
            "started_at": started_at,
            "stops_at": stops_at,
            "cpu_percent": cpu_percent,
            "ram_mb": ram_mb,
            "ram_percent": ram_percent,
        })

    return result

def start_stack(templates: list, stack_name: str, duration_minutes: int = 60, user_id: int | None = None):
    stack_id = uuid.uuid4().hex[:8]
    started = []
    try:
        for tpl_name in templates:
            if tpl_name not in TEMPLATES:
                raise ValueError(f"Template '{tpl_name}' not found")
            template = TEMPLATES[tpl_name]
            free_port = get_free_port()
            container_name = f"testbuddy-{tpl_name}-{uuid.uuid4().hex[:6]}"
            container = client.containers.run(
                image=template["image"],
                name=container_name,
                environment=template["env"],
                ports={f"{template['port']}/tcp": free_port},
                detach=True,
                labels={
                    "managed-by": "test-buddy",
                    "started-at": datetime.utcnow().isoformat(),
                    "duration-minutes": str(duration_minutes),
                    "template": tpl_name,
                    "stack-id": stack_id,
                    "stack-name": stack_name,
                    "port": str(free_port),
                    "user-id": str(user_id) if user_id else "",
                },
            )
            started.append({
                "id": container.id[:12],
                "name": container_name,
                "template": tpl_name,
                "port": free_port,
                "status": "running",
                "started_at": datetime.utcnow().isoformat(),
            })
    except Exception:
        for c_info in started:
            try:
                stop_container(c_info["id"])
            except Exception:
                pass
        raise
    return {"stack_id": stack_id, "stack_name": stack_name, "containers": started}

def list_stacks(user_id: int | None = None):
    containers = client.containers.list(
        all=True,
        filters={"label": "managed-by=test-buddy"}
    )
    stacks = {}
    for c in containers:
        labels = c.labels
        stack_id = labels.get("stack-id")
        if not stack_id:
            continue
        if user_id is not None and labels.get("user-id") != str(user_id):
            continue
        cpu_percent, ram_mb, ram_percent = _container_stats(c)
        started_at = labels.get("started-at")
        duration = int(labels.get("duration-minutes", 60))
        extra = _extensions.get(c.short_id, 0)
        stops_at = _stops_at(started_at, duration + extra)
        container_info = {
            "id": c.short_id,
            "name": c.name,
            "template": labels.get("template", "unknown"),
            "port": int(labels["port"]) if labels.get("port") else None,
            "status": c.status,
            "started_at": started_at,
            "stops_at": stops_at,
            "cpu_percent": cpu_percent,
            "ram_mb": ram_mb,
            "ram_percent": ram_percent,
        }
        if stack_id not in stacks:
            stacks[stack_id] = {
                "stack_id": stack_id,
                "stack_name": labels.get("stack-name", stack_id),
                "network": labels.get("stack-network"),
                "started_at": labels.get("started-at"),
                "containers": [],
            }
        stacks[stack_id]["containers"].append(container_info)
    return list(stacks.values())

def stop_stack(stack_id: str):
    containers = client.containers.list(
        filters={"label": f"stack-id={stack_id}"}
    )
    for c in containers:
        c.stop()
    return {"message": f"Stack {stack_id} stopped"}

def remove_stack(stack_id: str):
    containers = client.containers.list(
        all=True,
        filters={"label": f"stack-id={stack_id}"}
    )
    network_name = None
    for c in containers:
        if not network_name:
            network_name = c.labels.get("stack-network")
        if c.status == "running":
            c.stop()
        c.remove()
    if network_name:
        try:
            net = client.networks.get(network_name)
            net.remove()
        except Exception:
            pass
    return {"message": f"Stack {stack_id} removed"}

def start_stopped_stack(stack_id: str):
    containers = client.containers.list(
        all=True,
        filters={"label": f"stack-id={stack_id}"}
    )
    for c in containers:
        if c.status != "running":
            c.start()
    return {"message": f"Stack {stack_id} started"}

def stop_container(container_id: str):
    container = client.containers.get(container_id)
    container.stop()
    return {"message": f"Container {container_id} stopped"}

def remove_container(container_id: str):
    container = client.containers.get(container_id)
    if container.status == "running":
        container.stop()
    container.remove()
    return {"message": f"Container {container_id} removed"}

def start_stopped_container(container_id: str):
    container = client.containers.get(container_id)
    container.start()
    return {"message": f"Container {container_id} started"}

def restart_container(container_id: str):
    container = client.containers.get(container_id)
    container.restart()
    return {"message": f"Container {container_id} restarted"}

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

def auto_stop_expired_containers():
    from app.database import SessionLocal
    from app.models.user import UserDB
    from app.services.notification_service import notify_container_stopped, notify_container_warning
    import threading

    now = datetime.now(timezone.utc)
    db = SessionLocal()
    try:
        containers = client.containers.list(
            filters={"label": "managed-by=test-buddy", "status": "running"}
        )
    except Exception:
        db.close()
        return

    for c in containers:
        labels = c.labels
        started_at_str = labels.get("started-at")
        duration_str = labels.get("duration-minutes")
        user_id_str = labels.get("user-id", "")
        if not started_at_str or not duration_str:
            continue
        try:
            started_at = datetime.fromisoformat(started_at_str)
            if started_at.tzinfo is None:
                started_at = started_at.replace(tzinfo=timezone.utc)
            extra = _extensions.get(c.short_id, 0)
            stops_at = started_at + timedelta(minutes=int(duration_str) + extra)

            user = None
            if user_id_str:
                try:
                    user = db.query(UserDB).filter(UserDB.id == int(user_id_str)).first()
                except Exception:
                    pass

            # Warning: 5 min before stop
            warn_at = stops_at - timedelta(minutes=5)
            if c.id not in _warned_containers and warn_at <= now < stops_at:
                _warned_containers.add(c.id)
                if user and user.notify_on_warning:
                    threading.Thread(target=notify_container_warning,
                                     args=(user.email, c.name, 5), daemon=True).start()

            # Auto-stop
            if now >= stops_at:
                _warned_containers.discard(c.id)
                _extensions.pop(c.short_id, None)
                if user and user.notify_on_stop:
                    threading.Thread(target=notify_container_stopped,
                                     args=(user.email, c.name), daemon=True).start()
                c.stop()
                try:
                    from app.models.audit import AuditLogDB
                    log = AuditLogDB(
                        user_id=user.id if user else None,
                        username=user.username if user else None,
                        action="auto_stopped",
                        container_name=c.name,
                        template=labels.get("template"),
                    )
                    db.add(log)
                    db.commit()
                except Exception:
                    pass
        except Exception:
            continue
    db.close()

def extend_container(container_id: str, extra_minutes: int = 30) -> dict:
    c = client.containers.get(container_id)
    _extensions[c.short_id] = _extensions.get(c.short_id, 0) + extra_minutes
    _warned_containers.discard(c.id)  # allow re-warning after extension
    labels = c.labels
    started_at = labels.get("started-at")
    duration = int(labels.get("duration-minutes", 60))
    total_extra = _extensions[c.short_id]
    new_stops_at = _stops_at(started_at, duration + total_extra)
    return {"extended_by": extra_minutes, "total_extra": total_extra, "stops_at": new_stops_at}


def get_container_logs(container_id: str, tail: int = 200) -> list[str]:
    import re
    c = client.containers.get(container_id)
    raw = c.logs(tail=tail, timestamps=False)
    text = raw.decode("utf-8", errors="replace")
    # strip ANSI escape codes
    ansi_escape = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")
    text = ansi_escape.sub("", text)
    return [line for line in text.splitlines() if line]


def get_container_config(container_id: str):
    c = client.containers.get(container_id)
    labels = c.labels

    env_list = c.attrs["Config"].get("Env") or []
    env_dict = {}
    for item in env_list:
        if "=" in item:
            k, v = item.split("=", 1)
            env_dict[k] = v

    mem_bytes = c.attrs["HostConfig"].get("Memory", 0)
    mem_limit = None
    if mem_bytes and mem_bytes > 0:
        mb = mem_bytes // (1024 * 1024)
        mem_limit = f"{mb // 1024}g" if mb >= 1024 and mb % 1024 == 0 else f"{mb}m"

    return {
        "id": c.short_id,
        "name": c.name,
        "template": labels.get("template"),
        "port": int(labels["port"]) if labels.get("port") else None,
        "duration_minutes": int(labels.get("duration-minutes", 60)),
        "env": env_dict,
        "mem_limit": mem_limit,
    }

def update_container_config(container_id: str, env_overrides: dict,
                             host_port: int | None, container_name: str | None,
                             mem_limit: str | None):
    c = client.containers.get(container_id)
    labels = c.labels
    template_name = labels.get("template")
    duration = int(labels.get("duration-minutes", 60))
    extra_labels = {k: labels[k] for k in ("stack-id", "stack-name") if k in labels}
    user_id_str = labels.get("user-id", "")
    user_id = int(user_id_str) if user_id_str else None
    if c.status == "running":
        c.stop()
    c.remove()
    return start_container(template_name, duration,
                           env_overrides=env_overrides,
                           host_port=host_port,
                           container_name=container_name,
                           mem_limit=mem_limit,
                           extra_labels=extra_labels,
                           user_id=user_id)