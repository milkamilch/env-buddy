#!/usr/bin/env python3
"""
Seed script — populates testbud.de with realistic demo data.

Usage (on the server):
  python3 seed.py

The script:
  1. Registers fake users via API
  2. Verifies them directly in the SQLite DB (bypasses email)
  3. Adds the real admin user (id=1) to all seeded teams via DB
  4. Creates teams with members and team templates
  5. Publishes marketplace templates with ratings & comments
  6. Creates user templates and snapshots
"""

import requests
import sqlite3
import json
import os
import sys

BASE_URL       = os.getenv("BASE_URL", "https://testbud.de")
DB_PATH        = os.getenv("DB_PATH",  "/home/deploy/envbuddy/data/testbuddy.db")
REAL_USER_ID   = int(os.getenv("REAL_USER_ID", "1"))   # ztudff76fd — already in prod

s = requests.Session()
s.headers.update({"Content-Type": "application/json"})

def api(method, path, token=None, **kwargs):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    r = s.request(method, f"{BASE_URL}{path}", headers=headers, **kwargs)
    if not r.ok:
        print(f"  !! {method} {path} → {r.status_code}: {r.text[:140]}")
    return r

def register(first, last, username, email, password):
    r = api("POST", "/api/auth/register", json={
        "first_name": first, "last_name": last,
        "username": username, "email": email, "password": password,
    })
    return r.ok

def verify_all_in_db():
    print("  → Verifiziere alle unverifizierten Nutzer ...")
    con = sqlite3.connect(DB_PATH)
    con.execute("UPDATE users SET is_verified = 1 WHERE is_verified = 0")
    con.commit()
    con.close()

def add_real_user_to_teams(team_ids: list[int]):
    print(f"  → Füge User {REAL_USER_ID} zu {len(team_ids)} Teams hinzu ...")
    con = sqlite3.connect(DB_PATH)
    for tid in team_ids:
        already = con.execute(
            "SELECT 1 FROM team_members WHERE team_id=? AND user_id=?", (tid, REAL_USER_ID)
        ).fetchone()
        if not already:
            con.execute(
                "INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'admin')",
                (tid, REAL_USER_ID),
            )
    con.commit()
    con.close()

def login(email, password):
    r = api("POST", "/api/auth/login", json={"email": email, "password": password})
    if r.ok:
        return r.json()["access_token"]
    return None

def post(path, token, payload):
    return api("POST", path, token=token, json=payload)

def get(path, token):
    return api("GET", path, token=token)


# ─── Fake users ───────────────────────────────────────────────────────────────
USERS = [
    # original 8
    ("Lars",    "Wenner",    "lars_w",    "lars@demo.testbud.de",    "Demo1234!"),
    ("Berkay",  "Polat",     "berkay_p",  "berkay@demo.testbud.de",  "Demo1234!"),
    ("Tim",     "Sack",      "tim_s",     "tim@demo.testbud.de",     "Demo1234!"),
    ("Anja",    "Richter",   "anja_r",    "anja@demo.testbud.de",    "Demo1234!"),
    ("Moritz",  "Braun",     "moritz_b",  "moritz@demo.testbud.de",  "Demo1234!"),
    ("Sophie",  "Klein",     "sophie_k",  "sophie@demo.testbud.de",  "Demo1234!"),
    ("Felix",   "Wagner",    "felix_w",   "felix@demo.testbud.de",   "Demo1234!"),
    ("Lena",    "Hoffmann",  "lena_h",    "lena@demo.testbud.de",    "Demo1234!"),
    # 5 new
    ("Niklas",  "Bauer",     "niklas_b",  "niklas@demo.testbud.de",  "Demo1234!"),
    ("Jana",    "Müller",    "jana_m",    "jana@demo.testbud.de",    "Demo1234!"),
    ("David",   "Koch",      "david_k",   "david@demo.testbud.de",   "Demo1234!"),
    ("Emma",    "Schreiber", "emma_s",    "emma@demo.testbud.de",    "Demo1234!"),
    ("Paul",    "Hartmann",  "paul_h",    "paul@demo.testbud.de",    "Demo1234!"),
]

# ─── Teams ────────────────────────────────────────────────────────────────────
TEAMS = [
    {
        "name": "Backend Core",
        "admin": "lars_w",
        "members": ["berkay_p", "tim_s", "moritz_b", "niklas_b"],
        "templates": [
            {
                "name": "Backend Core — Dev Stack",
                "description": "Postgres + Redis für lokale API-Entwicklung",
                "icon": "🗄️",
                "containers": [
                    {"service_name": "postgres", "image": "postgres:15", "internal_port": 5432,
                     "env": {"POSTGRES_DB": "teamdb", "POSTGRES_PASSWORD": "teampass"}},
                    {"service_name": "redis", "image": "redis:7-alpine", "internal_port": 6379, "env": {}},
                ],
            },
            {
                "name": "Backend Core — Auth Service",
                "description": "Keycloak + Postgres für Auth-Tests",
                "icon": "🔐",
                "containers": [
                    {"service_name": "postgres", "image": "postgres:15", "internal_port": 5432,
                     "env": {"POSTGRES_DB": "keycloak", "POSTGRES_PASSWORD": "kcpass"}},
                ],
            },
        ],
    },
    {
        "name": "Frontend Guild",
        "admin": "anja_r",
        "members": ["sophie_k", "felix_w", "jana_m", "emma_s"],
        "templates": [
            {
                "name": "Frontend Guild — Mock APIs",
                "description": "Mailhog + Redis für Frontend-Integrationstests",
                "icon": "🎨",
                "containers": [
                    {"service_name": "mailhog", "image": "mailhog/mailhog", "internal_port": 1025, "env": {}},
                ],
            },
        ],
    },
    {
        "name": "DevOps & Infra",
        "admin": "moritz_b",
        "members": ["lars_w", "lena_h", "david_k", "paul_h"],
        "templates": [
            {
                "name": "DevOps — Monitoring Stack",
                "description": "Prometheus + Grafana für lokale Metriken",
                "icon": "📊",
                "containers": [
                    {"service_name": "prometheus", "image": "prom/prometheus", "internal_port": 9090, "env": {}},
                ],
            },
        ],
    },
    {
        "name": "QA & Testing",
        "admin": "tim_s",
        "members": ["anja_r", "emma_s", "paul_h", "sophie_k"],
        "templates": [
            {
                "name": "QA — Full Test Suite",
                "description": "Mailhog + Postgres + MongoDB für End-to-End-Tests",
                "icon": "🧪",
                "containers": [
                    {"service_name": "postgres", "image": "postgres:15", "internal_port": 5432,
                     "env": {"POSTGRES_DB": "testdb", "POSTGRES_PASSWORD": "testpass"}},
                    {"service_name": "mailhog", "image": "mailhog/mailhog", "internal_port": 1025, "env": {}},
                ],
            },
        ],
    },
    {
        "name": "Data & ML",
        "admin": "felix_w",
        "members": ["sophie_k", "niklas_b", "jana_m", "berkay_p"],
        "templates": [
            {
                "name": "Data — Elasticsearch + Kibana",
                "description": "Elasticsearch 8 für lokale Such- und ML-Experimente",
                "icon": "🔬",
                "containers": [
                    {"service_name": "elasticsearch", "image": "elasticsearch:8.12.0", "internal_port": 9200,
                     "env": {"discovery.type": "single-node", "xpack.security.enabled": "false",
                             "ES_JAVA_OPTS": "-Xms512m -Xmx512m"}},
                ],
            },
        ],
    },
]

# ─── Marketplace templates ────────────────────────────────────────────────────
MARKETPLACE = [
    {
        "author": "lars_w",
        "name": "PostgreSQL 15 Dev Stack",
        "description": "Schneller Postgres-Dev-Stack mit pgAdmin-ready Konfiguration. Bewährt im Backend-Team für Feature-Branches.",
        "icon": "🐘",
        "tags": ["postgres", "database", "sql"],
        "containers": [{"service_name": "postgres", "image": "postgres:15", "internal_port": 5432,
                        "env": {"POSTGRES_USER": "dev", "POSTGRES_PASSWORD": "devpass", "POSTGRES_DB": "appdb"}}],
        "ratings": [("berkay_p", 5), ("tim_s", 5), ("anja_r", 4), ("sophie_k", 5), ("niklas_b", 5), ("david_k", 4)],
        "comments": [
            ("berkay_p",  "Läuft sofort, genau was ich für lokale Feature-Tests brauche."),
            ("tim_s",     "Endlich kein manuelles docker run mehr. 👍"),
            ("anja_r",    "Würde mir noch ein pgAdmin-Template wünschen, aber für den reinen DB-Zugriff top."),
            ("niklas_b",  "Nutzen wir im ganzen Backend-Team als Standard. Sehr zuverlässig."),
            ("david_k",   "Perfekt für schnelle DB-Migrationen im lokalen Dev-Env."),
        ],
    },
    {
        "author": "anja_r",
        "name": "Redis + RedisInsight",
        "description": "Redis 7 mit RedisInsight auf Port 8001 für visuelles Debugging. Ideal für Session-Caching und Queue-Tests.",
        "icon": "🔴",
        "tags": ["redis", "cache", "queue"],
        "containers": [{"service_name": "redis", "image": "redis:7-alpine", "internal_port": 6379, "env": {}}],
        "ratings": [("lars_w", 4), ("moritz_b", 5), ("lena_h", 4), ("felix_w", 5), ("jana_m", 4), ("paul_h", 5)],
        "comments": [
            ("lars_w",   "Sehr praktisch für Bull-Queue-Debugging."),
            ("moritz_b", "redis:7-alpine ist angenehm klein, startet in Sekunden."),
            ("jana_m",   "Für unser Session-Handling im Frontend-Team ein Muss."),
            ("paul_h",   "Rate-Limiting lokal testen war noch nie so einfach."),
        ],
    },
    {
        "author": "tim_s",
        "name": "MongoDB 6 Replica-Set Lite",
        "description": "Einzelner MongoDB-Node im Replica-Set-Modus — notwendig für Mongoose Transactions in Tests.",
        "icon": "🍃",
        "tags": ["mongodb", "nosql", "replica"],
        "containers": [{"service_name": "mongo", "image": "mongo:6", "internal_port": 27017,
                        "env": {"MONGO_INITDB_ROOT_USERNAME": "admin", "MONGO_INITDB_ROOT_PASSWORD": "secret"}}],
        "ratings": [("lars_w", 5), ("berkay_p", 4), ("lena_h", 5), ("emma_s", 5), ("niklas_b", 4)],
        "comments": [
            ("lars_w",   "Endlich Transactions in Tests ohne extra Setup. Danke Tim!"),
            ("berkay_p", "Hab das für unsere Event-Sourcing-Tests genutzt, funktioniert einwandfrei."),
            ("emma_s",   "Für QA-Tests mit komplexen Dokumenten-Strukturen unverzichtbar."),
            ("niklas_b", "Replica-Set-Mode ist der entscheidende Unterschied zu anderen Templates."),
        ],
    },
    {
        "author": "moritz_b",
        "name": "RabbitMQ mit Management UI",
        "description": "RabbitMQ 3.12 inklusive Management-Plugin. Web-UI erreichbar über den zugewiesenen Port +1.",
        "icon": "🐰",
        "tags": ["rabbitmq", "messaging", "queue", "amqp"],
        "containers": [{"service_name": "rabbitmq", "image": "rabbitmq:3-management", "internal_port": 5672,
                        "env": {"RABBITMQ_DEFAULT_USER": "admin", "RABBITMQ_DEFAULT_PASS": "admin"}}],
        "ratings": [("tim_s", 4), ("anja_r", 3), ("felix_w", 4), ("david_k", 5), ("paul_h", 4)],
        "comments": [
            ("tim_s",   "Management UI ist Gold wert beim Debuggen von Dead-Letter-Queues."),
            ("felix_w", "Läuft stabil, hab es für unsere Notification-Pipeline genutzt."),
            ("david_k", "In unserem CI-Setup ersetzt das den echten Message-Broker komplett."),
            ("paul_h",  "AMQP-Protokoll funktioniert einwandfrei, alle Exchanges verfügbar."),
        ],
    },
    {
        "author": "sophie_k",
        "name": "MySQL 8 + initdb",
        "description": "MySQL 8 mit automatischer Datenbank-Erstellung. Kompatibel mit Hibernate und Prisma.",
        "icon": "🐬",
        "tags": ["mysql", "database", "sql", "hibernate"],
        "containers": [{"service_name": "mysql", "image": "mysql:8", "internal_port": 3306,
                        "env": {"MYSQL_ROOT_PASSWORD": "rootpass", "MYSQL_DATABASE": "testdb",
                                "MYSQL_USER": "app", "MYSQL_PASSWORD": "apppass"}}],
        "ratings": [("lars_w", 4), ("berkay_p", 3), ("moritz_b", 4), ("jana_m", 4), ("emma_s", 3)],
        "comments": [
            ("lars_w",   "Läuft gut mit unseren Liquibase-Migrations."),
            ("moritz_b", "Wäre cool wenn man das Init-SQL konfigurieren könnte, aber als Basis top."),
            ("jana_m",   "Für Legacy-Projekte mit MySQL-Pflicht ein Lifesaver."),
        ],
    },
    {
        "author": "felix_w",
        "name": "Mailhog — lokaler SMTP",
        "description": "Mailhog fängt alle ausgehenden E-Mails ab. Perfekt für Registrierungs- und Passwort-Reset-Tests ohne echten Mailserver.",
        "icon": "📬",
        "tags": ["smtp", "email", "testing", "mailhog"],
        "containers": [{"service_name": "mailhog", "image": "mailhog/mailhog", "internal_port": 1025, "env": {}}],
        "ratings": [("anja_r", 5), ("tim_s", 5), ("sophie_k", 5), ("lena_h", 5), ("berkay_p", 5),
                    ("emma_s", 5), ("paul_h", 5), ("niklas_b", 5)],
        "comments": [
            ("anja_r",   "Unverzichtbar! Haben das in jedem Projekt."),
            ("tim_s",    "Web-UI auf Port 8025 zeigt alle Mails live — hammer für E2E-Tests."),
            ("lena_h",   "Haben damit unsere komplette E-Mail-Pipeline getestet. Klare Empfehlung."),
            ("emma_s",   "Im QA-Team Pflichtbestandteil jedes Test-Setups."),
            ("niklas_b", "Seit ich das kenne, nie wieder Mails an echte Adressen versehentlich geschickt. 🙈"),
        ],
    },
    {
        "author": "lena_h",
        "name": "MinIO S3-kompatibler Storage",
        "description": "MinIO als lokaler S3-Ersatz. Identische API — AWS-SDK funktioniert direkt, einfach Endpoint-URL anpassen.",
        "icon": "🪣",
        "tags": ["minio", "s3", "storage", "aws"],
        "containers": [{"service_name": "minio", "image": "minio/minio", "internal_port": 9000,
                        "env": {"MINIO_ROOT_USER": "minioadmin", "MINIO_ROOT_PASSWORD": "minioadmin"}}],
        "ratings": [("lars_w", 5), ("moritz_b", 5), ("felix_w", 4), ("david_k", 5), ("niklas_b", 4)],
        "comments": [
            ("lars_w",   "Spart uns die AWS-Kosten für lokale Tests. Sehr zu empfehlen."),
            ("moritz_b", "Läuft in unserem CI-Setup super. Danke Lena!"),
            ("david_k",  "Bucket-Policies sind 1:1 kompatibel mit AWS S3. Kein Umbau nötig."),
            ("niklas_b", "Pre-Signed URLs funktionieren genauso wie in echtem S3."),
        ],
    },
    {
        "author": "berkay_p",
        "name": "Elasticsearch 8",
        "description": "Elasticsearch 8 im Single-Node-Modus mit deaktivierter Security für lokale Suchtests. Nicht für Produktion geeignet.",
        "icon": "🔍",
        "tags": ["elasticsearch", "search", "fulltext"],
        "containers": [{"service_name": "elasticsearch", "image": "elasticsearch:8.12.0", "internal_port": 9200,
                        "env": {"discovery.type": "single-node", "xpack.security.enabled": "false",
                                "ES_JAVA_OPTS": "-Xms512m -Xmx512m"}}],
        "ratings": [("lars_w", 4), ("tim_s", 4), ("lena_h", 3), ("felix_w", 4), ("jana_m", 5)],
        "comments": [
            ("lars_w",  "Hat etwas RAM-Hunger, aber für Suchindex-Tests perfekt."),
            ("tim_s",   "xpack.security disabled spart viel Setup-Zeit in der Entwicklung."),
            ("jana_m",  "Für unser ML-Ranking-Experiment genau richtig. Indexing-API ist top."),
            ("felix_w", "Kibana dazu wäre das Sahnehäubchen, aber als reiner ES-Stack super."),
        ],
    },
    # ── 5 new templates ────────────────────────────────────────────────────────
    {
        "author": "moritz_b",
        "name": "Grafana + Prometheus",
        "description": "Vollständiger Monitoring-Stack: Prometheus scrapt Metriken, Grafana visualisiert sie auf Port 3000. Vorkonfigurierter Datasource-Link.",
        "icon": "📊",
        "tags": ["grafana", "prometheus", "monitoring", "metrics", "observability"],
        "containers": [
            {"service_name": "prometheus", "image": "prom/prometheus:latest", "internal_port": 9090, "env": {}},
            {"service_name": "grafana",    "image": "grafana/grafana:latest", "internal_port": 3000,
             "env": {"GF_SECURITY_ADMIN_PASSWORD": "admin"}},
        ],
        "ratings": [("lars_w", 5), ("berkay_p", 5), ("tim_s", 5), ("lena_h", 4),
                    ("david_k", 5), ("paul_h", 5), ("niklas_b", 4)],
        "comments": [
            ("lars_w",   "Endlich ein fertiger Monitoring-Stack! Grafana startet sofort mit Prometheus-Datasource."),
            ("berkay_p", "Hab unsere API-Latenz damit in 10 Minuten sichtbar gemacht. Beeindruckend."),
            ("tim_s",    "Dashboard-Import über die Grafana-UI klappt problemlos. 5/5."),
            ("lena_h",   "In Kombination mit dem MinIO-Template: perfekte Infrastruktur-Simulation."),
            ("david_k",  "Standard für alle unsere Infra-Demos. Geht nicht einfacher."),
            ("paul_h",   "Alert-Rules lassen sich direkt in Prometheus konfigurieren, kein Grafana-Login nötig."),
        ],
    },
    {
        "author": "lars_w",
        "name": "Keycloak 23 Identity Provider",
        "description": "Keycloak 23 als vollwertiger OAuth2/OIDC-Provider. Admin-Konsole sofort verfügbar. Ideal für SSO-Tests ohne externen IdP.",
        "icon": "🗝️",
        "tags": ["keycloak", "auth", "oauth2", "oidc", "sso"],
        "containers": [
            {"service_name": "keycloak", "image": "quay.io/keycloak/keycloak:23.0", "internal_port": 8080,
             "env": {"KEYCLOAK_ADMIN": "admin", "KEYCLOAK_ADMIN_PASSWORD": "admin",
                     "KC_DB": "dev-file", "KC_HOSTNAME_STRICT": "false",
                     "KC_HTTP_ENABLED": "true"}},
        ],
        "ratings": [("berkay_p", 5), ("tim_s", 4), ("moritz_b", 5), ("niklas_b", 5), ("emma_s", 4)],
        "comments": [
            ("berkay_p", "Für OIDC-Integration das beste lokale Setup das ich kenne."),
            ("tim_s",    "Realm-Import über Admin-UI klappt einwandfrei. Spart stundenlange Keycloak-Doku-Lektüre."),
            ("moritz_b", "Wir testen damit unsere komplette SSO-Integration. Danke lars_w!"),
            ("niklas_b", "JWT-Tokens direkt im Admin-Interface debugbar — mega nützlich."),
            ("emma_s",   "Endlich kein Testumgebungs-Keycloak mehr bei anderen anfragen müssen."),
        ],
    },
    {
        "author": "tim_s",
        "name": "Apache Kafka + Zookeeper",
        "description": "Kafka 3.6 mit Zookeeper für lokales Event-Streaming. Inklusive Kafka-UI auf Port 8090 für Message-Inspektion.",
        "icon": "⚡",
        "tags": ["kafka", "streaming", "events", "zookeeper", "messaging"],
        "containers": [
            {"service_name": "zookeeper", "image": "confluentinc/cp-zookeeper:7.5.0", "internal_port": 2181,
             "env": {"ZOOKEEPER_CLIENT_PORT": "2181", "ZOOKEEPER_TICK_TIME": "2000"}},
            {"service_name": "kafka", "image": "confluentinc/cp-kafka:7.5.0", "internal_port": 9092,
             "env": {"KAFKA_BROKER_ID": "1", "KAFKA_ZOOKEEPER_CONNECT": "zookeeper:2181",
                     "KAFKA_ADVERTISED_LISTENERS": "PLAINTEXT://localhost:9092",
                     "KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR": "1"}},
        ],
        "ratings": [("lars_w", 4), ("berkay_p", 5), ("moritz_b", 4), ("felix_w", 5), ("david_k", 4)],
        "comments": [
            ("lars_w",   "Kafka lokal zum Laufen zu bringen war immer ein Alptraum — das hier macht es trivial."),
            ("berkay_p", "Event-Sourcing-Tests mit echtem Kafka statt Mocks. Game changer für uns."),
            ("moritz_b", "Zookeeper + Kafka korrekt verknüpft, man muss gar nichts anpassen."),
            ("felix_w",  "Consumer-Groups lassen sich perfekt testen. Sehr empfehlenswert."),
        ],
    },
    {
        "author": "niklas_b",
        "name": "LocalStack — AWS lokal simulieren",
        "description": "LocalStack simuliert AWS-Services (S3, SQS, DynamoDB, Lambda u.v.m.) komplett lokal. AWS SDK zeigt auf localhost, sonst kein Code-Umbau nötig.",
        "icon": "☁️",
        "tags": ["localstack", "aws", "s3", "sqs", "dynamodb", "lambda"],
        "containers": [
            {"service_name": "localstack", "image": "localstack/localstack:latest", "internal_port": 4566,
             "env": {"SERVICES": "s3,sqs,dynamodb,lambda,iam",
                     "DEBUG": "0", "AWS_DEFAULT_REGION": "eu-central-1",
                     "AWS_ACCESS_KEY_ID": "test", "AWS_SECRET_ACCESS_KEY": "test"}},
        ],
        "ratings": [("lars_w", 5), ("moritz_b", 5), ("lena_h", 4), ("david_k", 5), ("paul_h", 5)],
        "comments": [
            ("lars_w",   "MinIO ist gut für S3, aber LocalStack kann SQS, DynamoDB und Lambda gleich mit. Pflicht!"),
            ("moritz_b", "Unsere komplette AWS-Integration läuft jetzt ohne echte AWS-Kosten. 🚀"),
            ("lena_h",   "Für Lambda-Tests musst du das Image manuell pullen, aber danach läuft es problemlos."),
            ("david_k",  "IaC-Tests (Terraform) funktionieren einwandfrei mit LocalStack."),
            ("paul_h",   "SQS-Queue-Tests in Sekunden, nicht in Minuten. Danke niklas_b!"),
        ],
    },
    {
        "author": "david_k",
        "name": "Nginx Reverse Proxy Dev Setup",
        "description": "Nginx als lokaler Reverse Proxy mit hot-reload. Perfekt um Microservice-Routing und CORS-Konfiguration vor dem Deploy zu testen.",
        "icon": "🔀",
        "tags": ["nginx", "proxy", "routing", "cors", "microservices"],
        "containers": [
            {"service_name": "nginx", "image": "nginx:alpine", "internal_port": 80, "env": {}},
        ],
        "ratings": [("lars_w", 4), ("tim_s", 3), ("anja_r", 4), ("moritz_b", 4), ("niklas_b", 4)],
        "comments": [
            ("lars_w",   "Endlich CORS-Regeln lokal testen ohne es live auszuprobieren."),
            ("anja_r",   "Für das Frontend super: alle API-Calls über einen einzigen Proxy-Port."),
            ("moritz_b", "Rate-Limiting-Konfiguration lässt sich damit lokal validieren."),
        ],
    },
]

# ─── Private User-Templates ───────────────────────────────────────────────────
USER_TEMPLATES = {
    "lars_w": [
        {"name": "Auth-Service Stack", "description": "Postgres + Redis für Auth-Service lokale Entwicklung",
         "icon": "🔐",
         "containers": [
             {"service_name": "postgres", "image": "postgres:15", "internal_port": 5432,
              "env": {"POSTGRES_DB": "auth_db", "POSTGRES_PASSWORD": "secret"}},
             {"service_name": "redis", "image": "redis:alpine", "internal_port": 6379, "env": {}},
         ]},
        {"name": "Keycloak Local SSO", "description": "Keycloak für Auth-Flows lokal testen",
         "icon": "🗝️",
         "containers": [
             {"service_name": "keycloak", "image": "quay.io/keycloak/keycloak:23.0", "internal_port": 8080,
              "env": {"KEYCLOAK_ADMIN": "admin", "KEYCLOAK_ADMIN_PASSWORD": "admin", "KC_DB": "dev-file",
                      "KC_HOSTNAME_STRICT": "false", "KC_HTTP_ENABLED": "true"}},
         ]},
    ],
    "berkay_p": [
        {"name": "Event-Sourcing Dev", "description": "MongoDB für Event-Sourcing Pattern",
         "icon": "📋",
         "containers": [
             {"service_name": "mongo", "image": "mongo:6", "internal_port": 27017,
              "env": {"MONGO_INITDB_ROOT_USERNAME": "admin", "MONGO_INITDB_ROOT_PASSWORD": "pass"}},
             {"service_name": "kafka", "image": "confluentinc/cp-kafka:7.5.0", "internal_port": 9092,
              "env": {"KAFKA_BROKER_ID": "1", "KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR": "1"}},
         ]},
    ],
    "anja_r": [
        {"name": "Frontend Mock APIs", "description": "Mailhog für E-Mail-Tests im Frontend",
         "icon": "🎨",
         "containers": [
             {"service_name": "mailhog", "image": "mailhog/mailhog", "internal_port": 1025, "env": {}},
         ]},
        {"name": "Design-System Dev", "description": "Nginx für statische Assets + Mailhog für Formulartests",
         "icon": "✏️",
         "containers": [
             {"service_name": "nginx", "image": "nginx:alpine", "internal_port": 80, "env": {}},
             {"service_name": "mailhog", "image": "mailhog/mailhog", "internal_port": 1025, "env": {}},
         ]},
    ],
    "moritz_b": [
        {"name": "Monitoring Stack", "description": "Prometheus + Grafana für lokale Metriken",
         "icon": "📊",
         "containers": [
             {"service_name": "prometheus", "image": "prom/prometheus", "internal_port": 9090, "env": {}},
             {"service_name": "grafana", "image": "grafana/grafana", "internal_port": 3000,
              "env": {"GF_SECURITY_ADMIN_PASSWORD": "admin"}},
         ]},
    ],
    "lena_h": [
        {"name": "Cloud Storage Local", "description": "MinIO + LocalStack für S3-kompatible Tests",
         "icon": "🪣",
         "containers": [
             {"service_name": "minio", "image": "minio/minio", "internal_port": 9000,
              "env": {"MINIO_ROOT_USER": "minioadmin", "MINIO_ROOT_PASSWORD": "minioadmin"}},
         ]},
    ],
    "niklas_b": [
        {"name": "AWS Local Dev", "description": "LocalStack für alle AWS-Services lokal",
         "icon": "☁️",
         "containers": [
             {"service_name": "localstack", "image": "localstack/localstack", "internal_port": 4566,
              "env": {"SERVICES": "s3,sqs,dynamodb", "AWS_DEFAULT_REGION": "eu-central-1",
                      "AWS_ACCESS_KEY_ID": "test", "AWS_SECRET_ACCESS_KEY": "test"}},
         ]},
    ],
    "david_k": [
        {"name": "Infra Simulation", "description": "Nginx + Kafka + LocalStack für vollständige Infra-Sim",
         "icon": "🏗️",
         "containers": [
             {"service_name": "nginx", "image": "nginx:alpine", "internal_port": 80, "env": {}},
             {"service_name": "localstack", "image": "localstack/localstack", "internal_port": 4566,
              "env": {"SERVICES": "s3,sqs", "AWS_DEFAULT_REGION": "eu-central-1",
                      "AWS_ACCESS_KEY_ID": "test", "AWS_SECRET_ACCESS_KEY": "test"}},
         ]},
    ],
}

# ─── Snapshots ────────────────────────────────────────────────────────────────
SNAPSHOTS = [
    ("lars_w",   "pg-auth-service-v2",    "postgres",       {"POSTGRES_PASSWORD": "secret", "POSTGRES_DB": "auth_db"}, 5432),
    ("lars_w",   "keycloak-staging-cfg",  "keycloak",       {"KEYCLOAK_ADMIN": "admin", "KC_DB": "dev-file"}, 8080),
    ("berkay_p", "mongo-events-prod",     "mongo",          {"MONGO_INITDB_ROOT_PASSWORD": "pass"}, 27017),
    ("berkay_p", "kafka-event-bus-v3",    "kafka",          {"KAFKA_BROKER_ID": "1"}, 9092),
    ("moritz_b", "rabbit-staging",        "rabbitmq",       {"RABBITMQ_DEFAULT_USER": "admin", "RABBITMQ_DEFAULT_PASS": "admin"}, 5672),
    ("moritz_b", "grafana-dashboard-v1",  "grafana",        {"GF_SECURITY_ADMIN_PASSWORD": "admin"}, 3000),
    ("lena_h",   "minio-prod-backup",     "minio",          {"MINIO_ROOT_USER": "minioadmin", "MINIO_ROOT_PASSWORD": "minioadmin"}, 9000),
    ("niklas_b", "localstack-integration","localstack",     {"SERVICES": "s3,sqs,dynamodb"}, 4566),
]


def main():
    print("\n=== Test-Buddy Seed (v2) ===\n")

    # 1. Register users
    print("1. Registriere Nutzer ...")
    for first, last, username, email, pw in USERS:
        r = register(first, last, username, email, pw)
        status = "✓" if r else "~ (bereits vorhanden)"
        print(f"   {status} {username} <{email}>")

    # 2. Verify in DB
    print("\n2. Verifiziere Nutzer in der DB ...")
    try:
        verify_all_in_db()
        print("   ✓ Done")
    except Exception as e:
        print(f"   !! DB-Fehler: {e}")
        print(f'   Bitte manuell: sqlite3 {DB_PATH} "UPDATE users SET is_verified=1"')
        sys.exit(1)

    # 3. Login all users
    print("\n3. Login aller Nutzer ...")
    tokens = {}
    for first, last, username, email, pw in USERS:
        token = login(email, pw)
        if token:
            tokens[username] = token
            print(f"   ✓ {username}")
        else:
            print(f"   !! Login fehlgeschlagen: {username}")

    # 4. Create teams
    print("\n4. Erstelle Teams ...")
    seeded_team_ids = []
    for team in TEAMS:
        admin_token = tokens.get(team["admin"])
        if not admin_token:
            continue

        r = post("/api/teams/", admin_token, {"name": team["name"]})
        if r.ok:
            team_id = r.json()["id"]
            print(f"   ✓ {team['name']} (ID {team_id})")
        else:
            teams_r = get("/api/teams/", admin_token)
            existing = next((t for t in teams_r.json() if t["name"] == team["name"]), None)
            if existing:
                team_id = existing["id"]
                print(f"   ~ {team['name']} (bereits vorhanden, ID {team_id})")
            else:
                print(f"   !! Konnte {team['name']} nicht erstellen")
                continue

        team["_id"] = team_id
        seeded_team_ids.append(team_id)

        # Invite + accept members
        for member in team["members"]:
            ir = post(f"/api/teams/{team_id}/members", admin_token, {"username": member})
            if ir.ok:
                member_token = tokens.get(member)
                if member_token:
                    invs = get("/api/invitations/", member_token).json()
                    for inv in invs:
                        if inv["team_id"] == team_id and inv["status"] == "pending":
                            post(f"/api/invitations/{inv['id']}/accept", member_token, {})
                            print(f"     ✓ {member} beigetreten")

        # Create team templates
        for tmpl in team["templates"]:
            tr = post(f"/api/teams/{team_id}/templates", admin_token, tmpl)
            if tr.ok:
                print(f"     ✓ Team-Template: {tmpl['name']}")

    # 5. Add real user (ztudff76fd) to all seeded teams via DB
    print(f"\n5. Füge deinen Account (User-ID {REAL_USER_ID}) zu allen Teams hinzu ...")
    try:
        add_real_user_to_teams(seeded_team_ids)
        print(f"   ✓ User {REAL_USER_ID} ist jetzt Admin in {len(seeded_team_ids)} Teams")
    except Exception as e:
        print(f"   !! DB-Fehler: {e}")

    # 6. Publish marketplace templates
    print("\n6. Veröffentliche Marketplace-Templates ...")
    mp_ids = {}
    for tpl in MARKETPLACE:
        author_token = tokens.get(tpl["author"])
        if not author_token:
            continue
        r = post("/api/marketplace/", author_token, {
            "name":        tpl["name"],
            "description": tpl["description"],
            "icon":        tpl["icon"],
            "tags":        tpl["tags"],
            "containers":  tpl["containers"],
        })
        if r.ok:
            mp_id = r.json()["id"]
            mp_ids[tpl["name"]] = mp_id
            print(f"   ✓ {tpl['name']} (ID {mp_id})")
        elif r.status_code == 409 or "bereits" in r.text.lower():
            print(f"   ~ {tpl['name']} (bereits vorhanden)")
            continue
        else:
            print(f"   !! {tpl['name']}: übersprungen")
            continue

        mp_id = mp_ids[tpl["name"]]

        for rater_username, rating in tpl["ratings"]:
            rater_token = tokens.get(rater_username)
            if rater_token:
                rr = post(f"/api/marketplace/{mp_id}/rate", rater_token, {"rating": rating})
                if rr.ok:
                    print(f"     ★ {rater_username}: {rating}/5")

        for commenter_username, text in tpl["comments"]:
            commenter_token = tokens.get(commenter_username)
            if commenter_token:
                cr = post(f"/api/marketplace/{mp_id}/comments", commenter_token, {"content": text})
                if cr.ok:
                    print(f"     💬 {commenter_username}")

        importers = [u for u in list(tokens.keys()) if u != tpl["author"]][:4]
        for importer in importers:
            post(f"/api/marketplace/{mp_id}/import", tokens[importer], {})
        print(f"     ↓ {len(importers)} Imports simuliert")

    # 7. User templates
    print("\n7. Erstelle private User-Templates ...")
    for username, templates in USER_TEMPLATES.items():
        token = tokens.get(username)
        if not token:
            continue
        for t in templates:
            r = post("/api/user-templates/", token, t)
            if r.ok:
                print(f"   ✓ {username}: {t['name']}")

    # 8. Snapshots
    print("\n8. Erstelle Snapshots ...")
    for username, name, template, env, port in SNAPSHOTS:
        token = tokens.get(username)
        if not token:
            continue
        r = post("/api/snapshots/", token, {
            "name": name, "container_id": "seed", "template": template,
            "env": env, "port": port,
        })
        if r.ok:
            print(f"   ✓ {username}: {name}")

    print("\n✅ Seeding abgeschlossen!\n")


if __name__ == "__main__":
    main()
