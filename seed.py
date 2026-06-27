#!/usr/bin/env python3
"""
Seed script — populates testbud.de with realistic demo data.

Usage (on the server):
  python3 seed.py

The script:
  1. Registers fake users via API
  2. Verifies them directly in the SQLite DB (bypasses email)
  3. Creates teams, sends + accepts invitations
  4. Publishes marketplace templates with ratings & comments
  5. Creates user templates and snapshots
"""

import requests
import sqlite3
import json
import os
import sys
import time

BASE_URL = os.getenv("BASE_URL", "https://testbud.de")
DB_PATH  = os.getenv("DB_PATH",  "/home/deploy/envbuddy/data/testbuddy.db")

s = requests.Session()
s.headers.update({"Content-Type": "application/json"})

def api(method, path, token=None, **kwargs):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    r = s.request(method, f"{BASE_URL}{path}", headers=headers, **kwargs)
    if not r.ok:
        print(f"  !! {method} {path} → {r.status_code}: {r.text[:120]}")
    return r

def register(first, last, username, email, password):
    r = api("POST", "/api/auth/register", json={
        "first_name": first, "last_name": last,
        "username": username, "email": email, "password": password,
    })
    return r.ok

def verify_all_in_db():
    print("  → Verifying all users in DB ...")
    con = sqlite3.connect(DB_PATH)
    con.execute("UPDATE users SET is_verified = 1 WHERE is_verified = 0")
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
    ("Lars",    "Wenner",   "lars_w",      "lars@demo.testbud.de",    "Demo1234!"),
    ("Berkay",  "Polat",    "berkay_p",    "berkay@demo.testbud.de",  "Demo1234!"),
    ("Tim",     "Sack",     "tim_s",       "tim@demo.testbud.de",     "Demo1234!"),
    ("Anja",    "Richter",  "anja_r",      "anja@demo.testbud.de",    "Demo1234!"),
    ("Moritz",  "Braun",    "moritz_b",    "moritz@demo.testbud.de",  "Demo1234!"),
    ("Sophie",  "Klein",    "sophie_k",    "sophie@demo.testbud.de",  "Demo1234!"),
    ("Felix",   "Wagner",   "felix_w",     "felix@demo.testbud.de",   "Demo1234!"),
    ("Lena",    "Hoffmann", "lena_h",      "lena@demo.testbud.de",    "Demo1234!"),
]

# ─── Teams ────────────────────────────────────────────────────────────────────
TEAMS = [
    {
        "name": "Backend Core",
        "description": "Zuständig für API, Auth und Datenbankschicht",
        "admin": "lars_w",
        "members": ["berkay_p", "tim_s", "moritz_b"],
    },
    {
        "name": "Frontend Guild",
        "description": "React, Design-System und UX",
        "admin": "anja_r",
        "members": ["sophie_k", "felix_w"],
    },
    {
        "name": "DevOps & Infra",
        "description": "CI/CD, Server, Monitoring",
        "admin": "moritz_b",
        "members": ["lars_w", "lena_h"],
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
        "ratings": [("berkay_p", 5), ("tim_s", 5), ("anja_r", 4), ("sophie_k", 5)],
        "comments": [
            ("berkay_p", "Läuft sofort, genau was ich für lokale Feature-Tests brauche."),
            ("tim_s", "Endlich kein manuelles docker run mehr. 👍"),
            ("anja_r", "Würde mir noch ein pgAdmin-Template wünschen, aber für den reinen DB-Zugriff top."),
        ],
    },
    {
        "author": "anja_r",
        "name": "Redis + RedisInsight",
        "description": "Redis 7 mit RedisInsight auf Port 8001 für visuelles Debugging. Ideal für Session-Caching und Queue-Tests.",
        "icon": "🔴",
        "tags": ["redis", "cache", "queue"],
        "containers": [{"service_name": "redis", "image": "redis:7-alpine", "internal_port": 6379,
                        "env": {}}],
        "ratings": [("lars_w", 4), ("moritz_b", 5), ("lena_h", 4), ("felix_w", 5)],
        "comments": [
            ("lars_w", "Sehr praktisch für Bull-Queue-Debugging."),
            ("moritz_b", "redis:7-alpine ist angenehm klein, startet in Sekunden."),
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
        "ratings": [("lars_w", 5), ("berkay_p", 4), ("lena_h", 5)],
        "comments": [
            ("lars_w", "Endlich Transactions in Tests ohne extra Setup. Danke Tim!"),
            ("berkay_p", "Hab das für unsere Event-Sourcing-Tests genutzt, funktioniert einwandfrei."),
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
        "ratings": [("tim_s", 4), ("anja_r", 3), ("felix_w", 4)],
        "comments": [
            ("tim_s", "Management UI ist Gold wert beim Debuggen von Dead-Letter-Queues."),
            ("felix_w", "Läuft stabil, hab es für unsere Notification-Pipeline genutzt."),
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
        "ratings": [("lars_w", 4), ("berkay_p", 3), ("moritz_b", 4)],
        "comments": [
            ("lars_w", "Läuft gut mit unseren Liquibase-Migrations."),
            ("moritz_b", "Wäre cool wenn man das Init-SQL konfigurieren könnte, aber als Basis top."),
        ],
    },
    {
        "author": "felix_w",
        "name": "Mailhog — lokaler SMTP",
        "description": "Mailhog fängt alle ausgehenden E-Mails ab. Perfekt für Registrierungs- und Passwort-Reset-Tests ohne echten Mailserver.",
        "icon": "📬",
        "tags": ["smtp", "email", "testing", "mailhog"],
        "containers": [{"service_name": "mailhog", "image": "mailhog/mailhog", "internal_port": 1025,
                        "env": {}}],
        "ratings": [("anja_r", 5), ("tim_s", 5), ("sophie_k", 5), ("lena_h", 5), ("berkay_p", 5)],
        "comments": [
            ("anja_r", "Unverzichtbar! Haben das in jedem Projekt."),
            ("tim_s", "Web-UI auf Port 8025 zeigt alle Mails live — hammer für E2E-Tests."),
            ("lena_h", "Haben damit unsere komplette E-Mail-Pipeline getestet. Klare Empfehlung."),
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
        "ratings": [("lars_w", 5), ("moritz_b", 5), ("felix_w", 4)],
        "comments": [
            ("lars_w", "Spart uns die AWS-Kosten für lokale Tests. Sehr zu empfehlen."),
            ("moritz_b", "Läuft in unserem CI-Setup super. Danke Lena!"),
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
        "ratings": [("lars_w", 4), ("tim_s", 4), ("lena_h", 3)],
        "comments": [
            ("lars_w", "Hat etwas RAM-Hunger, aber für Suchindex-Tests perfekt."),
            ("tim_s", "xpack.security disabled spart viel Setup-Zeit in der Entwicklung."),
        ],
    },
]

# ─── User templates (private) ─────────────────────────────────────────────────
USER_TEMPLATES = {
    "lars_w": [
        {"name": "Auth-Service Stack", "description": "Postgres + Redis für Auth-Service lokale Entwicklung",
         "icon": "🔐", "containers": [
             {"service_name": "postgres", "image": "postgres:15", "internal_port": 5432,
              "env": {"POSTGRES_DB": "auth_db", "POSTGRES_PASSWORD": "secret"}},
             {"service_name": "redis", "image": "redis:alpine", "internal_port": 6379, "env": {}},
         ]},
    ],
    "berkay_p": [
        {"name": "Event-Sourcing Dev", "description": "MongoDB für Event-Sourcing Pattern",
         "icon": "📋", "containers": [
             {"service_name": "mongo", "image": "mongo:6", "internal_port": 27017,
              "env": {"MONGO_INITDB_ROOT_USERNAME": "admin", "MONGO_INITDB_ROOT_PASSWORD": "pass"}},
         ]},
    ],
    "anja_r": [
        {"name": "Frontend Mock APIs", "description": "Mailhog für E-Mail-Tests im Frontend",
         "icon": "🎨", "containers": [
             {"service_name": "mailhog", "image": "mailhog/mailhog", "internal_port": 1025, "env": {}},
         ]},
    ],
    "moritz_b": [
        {"name": "Monitoring Stack", "description": "Prometheus für lokale Metrics",
         "icon": "📊", "containers": [
             {"service_name": "prometheus", "image": "prom/prometheus", "internal_port": 9090, "env": {}},
         ]},
    ],
}


def main():
    print("\n=== Test-Buddy Seed ===\n")

    # 1. Register users
    print("1. Registriere Nutzer ...")
    tokens = {}
    for first, last, username, email, pw in USERS:
        r = register(first, last, username, email, pw)
        status = "✓" if r else "skip (exists?)"
        print(f"   {status} {username} <{email}>")

    # 2. Verify in DB
    print("\n2. Verifiziere alle Nutzer in der DB ...")
    try:
        verify_all_in_db()
        print("   ✓ Done")
    except Exception as e:
        print(f"   !! DB-Fehler: {e}")
        print("   Bitte manuell ausführen:")
        print(f'   sqlite3 {DB_PATH} "UPDATE users SET is_verified=1"')
        sys.exit(1)

    # 3. Login all users
    print("\n3. Login aller Nutzer ...")
    user_map = {u[2]: u for u in USERS}
    for first, last, username, email, pw in USERS:
        token = login(email, pw)
        if token:
            tokens[username] = token
            print(f"   ✓ {username}")
        else:
            print(f"   !! Login fehlgeschlagen für {username}")

    # 4. Create teams + invite members
    print("\n4. Erstelle Teams ...")
    for team in TEAMS:
        admin_token = tokens.get(team["admin"])
        if not admin_token:
            continue
        r = post("/api/teams/", admin_token, {"name": team["name"]})
        if not r.ok:
            # might already exist
            teams_r = get("/api/teams/", admin_token)
            existing = next((t for t in teams_r.json() if t["name"] == team["name"]), None)
            if existing:
                team_id = existing["id"]
                print(f"   ~ {team['name']} (bereits vorhanden, ID {team_id})")
            else:
                print(f"   !! Konnte {team['name']} nicht erstellen")
                continue
        else:
            team_id = r.json()["id"]
            print(f"   ✓ {team['name']} (ID {team_id})")

        team["_id"] = team_id

        # Invite members
        for member in team["members"]:
            ir = post(f"/api/teams/{team_id}/members", admin_token, {"username": member})
            if ir.ok:
                print(f"     → Eingeladen: {member}")
                # Accept invitation as the member
                member_token = tokens.get(member)
                if member_token:
                    invs = get("/api/invitations/", member_token).json()
                    for inv in invs:
                        if inv["team_id"] == team_id and inv["status"] == "pending":
                            post(f"/api/invitations/{inv['id']}/accept", member_token, {})
                            print(f"     ✓ {member} hat angenommen")

        # Create a team template
        tmpl_r = post(f"/api/teams/{team_id}/templates", admin_token, {
            "name": f"{team['name']} — Standard DB",
            "description": f"Standard-Datenbankstack für das {team['name']}-Team",
            "icon": "🗄️",
            "containers": [{"service_name": "postgres", "image": "postgres:15",
                            "internal_port": 5432,
                            "env": {"POSTGRES_DB": "teamdb", "POSTGRES_PASSWORD": "teampass"}}],
        })
        if tmpl_r.ok:
            print(f"     ✓ Team-Template angelegt")

    # 5. Publish marketplace templates
    print("\n5. Veröffentliche Marketplace-Templates ...")
    mp_ids = {}
    for tpl in MARKETPLACE:
        author_token = tokens.get(tpl["author"])
        if not author_token:
            continue
        r = post("/api/marketplace/", author_token, {
            "name": tpl["name"],
            "description": tpl["description"],
            "icon": tpl["icon"],
            "tags": tpl["tags"],
            "containers": tpl["containers"],
        })
        if r.ok:
            mp_id = r.json()["id"]
            mp_ids[tpl["name"]] = mp_id
            print(f"   ✓ {tpl['name']} (ID {mp_id})")
        elif "bereits" in r.text.lower() or r.status_code == 409:
            print(f"   ~ {tpl['name']} (bereits vorhanden)")
        else:
            print(f"   !! {tpl['name']}: {r.text[:80]}")
            continue

        if tpl["name"] not in mp_ids:
            continue
        mp_id = mp_ids[tpl["name"]]

        # Ratings
        for rater_username, rating in tpl["ratings"]:
            rater_token = tokens.get(rater_username)
            if rater_token:
                rr = post(f"/api/marketplace/{mp_id}/rate", rater_token, {"rating": rating})
                if rr.ok:
                    print(f"     ★ {rater_username}: {rating}/5")

        # Comments
        for commenter_username, text in tpl["comments"]:
            commenter_token = tokens.get(commenter_username)
            if commenter_token:
                cr = post(f"/api/marketplace/{mp_id}/comments", commenter_token, {"content": text})
                if cr.ok:
                    print(f"     💬 {commenter_username}")

        # Import once per template so download_count > 0
        for importer in list(tokens.keys())[:3]:
            if importer != tpl["author"]:
                post(f"/api/marketplace/{mp_id}/import", tokens[importer], {})
        print(f"     ↓ Imports simuliert")

    # 6. User templates
    print("\n6. Erstelle private User-Templates ...")
    for username, templates in USER_TEMPLATES.items():
        token = tokens.get(username)
        if not token:
            continue
        for t in templates:
            r = post("/api/user-templates/", token, t)
            if r.ok:
                print(f"   ✓ {username}: {t['name']}")

    # 7. Snapshots
    print("\n7. Erstelle Snapshots ...")
    snap_data = [
        ("lars_w",    "pg-auth-service-v2",  "postgres",        {"POSTGRES_PASSWORD": "secret", "POSTGRES_DB": "auth_db"}, 5432),
        ("berkay_p",  "mongo-events-prod",   "mongo",           {"MONGO_INITDB_ROOT_PASSWORD": "pass"}, 27017),
        ("moritz_b",  "rabbit-staging",      "rabbitmq",        {"RABBITMQ_DEFAULT_USER": "admin", "RABBITMQ_DEFAULT_PASS": "admin"}, 5672),
    ]
    for username, name, template, env, port in snap_data:
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
