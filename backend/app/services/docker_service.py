import docker
import uuid
from datetime import datetime

client = docker.from_env()

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
        "image": "bitnami/kafka:3.7",
        "env":   {"KAFKA_CFG_NODE_ID": "0", "KAFKA_CFG_PROCESS_ROLES": "controller,broker",
                  "KAFKA_CFG_LISTENERS": "PLAINTEXT://:9092,CONTROLLER://:9093",
                  "KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP": "CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT",
                  "KAFKA_CFG_CONTROLLER_QUORUM_VOTERS": "0@localhost:9093",
                  "KAFKA_CFG_CONTROLLER_LISTENER_NAMES": "CONTROLLER"},
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

def _container_stats(c):
    stats = c.stats(stream=False)
    cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - \
                stats["precpu_stats"]["cpu_usage"]["total_usage"]
    system_delta = stats["cpu_stats"]["system_cpu_usage"] - \
                   stats["precpu_stats"]["system_cpu_usage"]
    cpu_percent = round((cpu_delta / system_delta) * 100, 2) if system_delta > 0 else 0
    ram_mb = round(stats["memory_stats"]["usage"] / 1024 / 1024, 1)
    return cpu_percent, ram_mb

def list_containers():
    containers = client.containers.list(
        filters = {"label": "managed-by=test-buddy"}
    )

    result = []
    for c in containers:
        labels = c.labels
        if labels.get("stack-id"):  # skip stack containers
            continue
        cpu_percent, ram_mb = _container_stats(c)
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

def start_stack(templates: list, stack_name: str, duration_minutes: int = 60):
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

def list_stacks():
    containers = client.containers.list(
        filters={"label": "managed-by=test-buddy"}
    )
    stacks = {}
    for c in containers:
        labels = c.labels
        stack_id = labels.get("stack-id")
        if not stack_id:
            continue
        cpu_percent, ram_mb = _container_stats(c)
        container_info = {
            "id": c.short_id,
            "name": c.name,
            "template": labels.get("template", "unknown"),
            "status": c.status,
            "started_at": labels.get("started-at"),
            "cpu_percent": cpu_percent,
            "ram_mb": ram_mb,
        }
        if stack_id not in stacks:
            stacks[stack_id] = {
                "stack_id": stack_id,
                "stack_name": labels.get("stack-name", stack_id),
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
        c.remove()
    return {"message": f"Stack {stack_id} stopped"}

def stop_container(container_id: str):
    container = client.containers.get(container_id)
    container.stop()
    container.remove()
    return {"message": f"Container {container_id} stopped and removed"}

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