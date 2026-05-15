# Env-Buddy

> **On-Demand Testumgebungen auf Knopfdruck**
> Ein Self-Service Web-Dashboard zum Starten, Überwachen und automatischen Stoppen von Docker-Containern – für das gesamte Entwicklerteam.

---

## Inhaltsverzeichnis

- [Über das Projekt](#über-das-projekt)
- [Features](#features)
- [Tech-Stack](#tech-stack)
- [Voraussetzungen](#voraussetzungen)
- [Installation & Setup](#installation--setup)
- [Projekt lokal starten](#projekt-lokal-starten)
- [API Dokumentation](#api-dokumentation)
- [Projektstruktur](#projektstruktur)
- [Verfügbare Templates](#verfügbare-templates)
- [Team](#team)
- [Git Workflow](#git-workflow)
- [Commit Konvention](#commit-konvention)

---

## Über das Projekt

Entwickler und Tester verlieren täglich wertvolle Zeit, weil sie auf manuell bereitgestellte Testumgebungen warten müssen. Env-Buddy löst dieses Problem mit einem zentralen Web-Dashboard, über das jeder im Team per Klick isolierte Docker-Container starten kann – ganz ohne Docker-Kenntnisse oder Zugriff auf die IT-Abteilung.

Nach Ablauf eines konfigurierbaren Timers werden die Umgebungen automatisch wieder heruntergefahren – keine vergessenen Container, keine Ressourcenverschwendung.

---

## Features

### Container-Verwaltung
- Container per Klick starten (aus eigenen, Team- oder öffentlichen Templates)
- Container stoppen, neu starten, verlängern und löschen
- Live CPU- und RAM-Auslastung mit Spark-Line-Verlauf
- Suche & Filter nach Template und Status
- Grid- und Listenansicht
- Container-Logs live per WebSocket streamen (`● LIVE` / `● POLLING` Badge)
- Integriertes Browser-Terminal (xterm.js, direkt im Container)
- Container-Konfigurationslink teilen (`?start=base64` zum Klonen)
- Container als Template oder Snapshot speichern
- Zugriff auf Container mit anderen Benutzern teilen
- `.env`-Datei herunterladen
- Docker-Image-Update per Klick (Pull & Restart)
- Docker-Health-Check-Anzeige + TCP-Erreichbarkeitsprüfung
- Bulk-Aktionen: mehrere Container gleichzeitig stoppen/löschen
- Container importieren (JSON-Einfügen oder Datei-Upload, auch `docker inspect`-Format)

### Stacks
- Multi-Container-Stacks starten, stoppen und löschen
- Stack-Übersicht mit allen enthaltenen Containern

### Templates
- Eigene Templates erstellen, bearbeiten, als Favoriten markieren
- Template als öffentlich markieren (für andere Nutzer sichtbar)
- Team-Templates teilen und gemeinsam verwalten
- Marketplace: Community-Templates mit Bewertungen, Kommentaren und Bildern
- Template-Suche über alle Kategorien
- Drag & Drop Schnellauswahl-Sidebar

### Snapshots
- Laufende Container-Konfiguration als Snapshot speichern (Knopf `📷` auf der Karte)
- Snapshots in den Profileinstellungen auflisten und löschen

### API-Keys
- Bis zu 10 persönliche API-Keys erstellen und widerrufen
- Key-Prefix zur Identifikation, Raw-Key wird einmalig angezeigt
- Authentifizierung via `X-Api-Key`-Header oder `Authorization: ApiKey xxx`
- Fällt automatisch auf JWT zurück

### GitHub Actions Integration
- `POST /api/github-actions/trigger` startet Container über API-Key-Auth
- Fertiges Workflow-YAML-Beispiel in den Profileinstellungen

### Teams
- Teams erstellen und Mitglieder einladen
- Rollen: Admin, Member
- Team-eigene Template-Bibliothek

### Authentifizierung & Profil
- Registrierung mit E-Mail-Verifikation
- Login mit JWT (24 h gültig)
- Passwort zurücksetzen per E-Mail
- Profil bearbeiten (Name, Benutzername, Bio, Passwort, Avatar)
- Dark/Light-Mode-Toggle
- Webhook-URL für externe Benachrichtigungen (container.started / container.stopped)
- E-Mail-Benachrichtigungen bei Start, Stop und 5-Minuten-Warnung

### UX
- Command Palette (`Ctrl+K` / `Cmd+K`) für schnelle Navigation und Template-Start
- Keyboard-Navigation durchgehend unterstützt
- React Router (Deep Links, Browser-Back/Forward)
- Toast-Benachrichtigungen

---

## Tech-Stack

| Bereich | Technologie | Version |
|---------|-------------|---------|
| Backend | Python + FastAPI | 3.11+ |
| Frontend | React + Vite | 19 / 7+ |
| Routing | React Router | v7 |
| Terminal | xterm.js (@xterm/xterm) | v6 |
| Container | Docker SDK for Python | 7+ |
| Datenbank | SQLite (via SQLAlchemy) | 2+ |
| Auth | JWT (python-jose) + bcrypt | - |
| E-Mail | SMTP / Gmail | - |
| API Doku | Swagger UI (automatisch) | - |

---

## Voraussetzungen

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Docker](https://www.docker.com/products/docker-desktop/) (muss im Hintergrund laufen)
- [Git](https://git-scm.com/)

---

## Installation & Setup

### 1. Repository klonen

```bash
git clone https://github.com/milkamilch/env-buddy.git
cd env-buddy
```

### 2. Backend einrichten

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # macOS / Linux
# .\venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt
```

### 3. Frontend einrichten

```bash
cd frontend
npm install
```

### 4. Umgebungsvariablen anlegen

Erstelle `backend/.env`:

```env
# JWT Auth
SECRET_KEY=irgendein-langer-geheimer-string

# CORS (kommagetrennt für mehrere Origins)
CORS_ORIGINS=http://localhost:5173

# E-Mail (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deine@gmail.com
SMTP_PASSWORD=dein-app-passwort
NOTIFICATION_FROM=Env-Buddy <deine@gmail.com>

# Frontend-URL (für Passwort-Reset-Links in E-Mails)
FRONTEND_URL=http://localhost:5173

# Container-Limit pro User (0 = unbegrenzt)
MAX_CONTAINERS_PER_USER=10
```

> **Gmail App-Passwort:** Google-Konto → Sicherheit → 2-Faktor-Auth → App-Passwörter → neues Passwort für "Mail".

---

## Projekt lokal starten

### Ein-Befehl-Start

```bash
./start.sh
```

Backend: **http://localhost:8000**  
Frontend: **http://localhost:5173**  
Swagger UI: **http://localhost:8000/docs**

### Manuell

**Terminal 1 — Backend**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```

---

## API Dokumentation

Interaktive Swagger-Doku: **http://localhost:8000/docs**

### Auth

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `POST` | `/api/auth/register` | Account erstellen |
| `POST` | `/api/auth/login` | Einloggen, JWT erhalten |
| `GET` | `/api/auth/me` | Eigenes Profil abrufen |
| `PUT` | `/api/auth/me/profile` | Profil aktualisieren |
| `POST` | `/api/auth/me/avatar` | Avatar hochladen |
| `PUT` | `/api/auth/me/notifications` | Benachrichtigungseinstellungen speichern |
| `POST` | `/api/auth/forgot-password` | Reset-Link anfordern |
| `POST` | `/api/auth/reset-password` | Passwort zurücksetzen |

### Container

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `GET` | `/api/containers/` | Eigene Container auflisten |
| `POST` | `/api/containers/start` | Container starten |
| `POST` | `/api/containers/{id}/stop` | Container stoppen |
| `POST` | `/api/containers/{id}/start` | Gestoppten Container starten |
| `POST` | `/api/containers/{id}/restart` | Container neu starten |
| `POST` | `/api/containers/{id}/extend` | Laufzeit verlängern |
| `DELETE` | `/api/containers/{id}` | Container löschen |
| `GET` | `/api/containers/{id}/config` | Konfiguration abrufen |
| `PUT` | `/api/containers/{id}/config` | Konfiguration aktualisieren |
| `GET` | `/api/containers/{id}/logs` | Logs abrufen (HTTP) |
| `WS` | `/api/containers/{id}/logs/stream?token=` | Logs live streamen (WebSocket) |
| `WS` | `/api/containers/{id}/terminal?token=` | Browser-Terminal (WebSocket) |
| `GET` | `/api/containers/{id}/stats` | Live CPU & RAM |
| `GET` | `/api/containers/{id}/stats/history` | Ressourcen-Verlauf |
| `GET` | `/api/containers/{id}/health` | TCP-Erreichbarkeitsprüfung |
| `GET` | `/api/containers/{id}/dotenv` | .env herunterladen |
| `POST` | `/api/containers/{id}/update-image` | Image aktualisieren |

### Stacks

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `GET` | `/api/containers/stacks` | Alle Stacks auflisten |
| `POST` | `/api/containers/stacks/start` | Stack starten |
| `POST` | `/api/containers/stacks/{id}/stop` | Stack stoppen |
| `POST` | `/api/containers/stacks/{id}/start` | Gestoppten Stack starten |
| `DELETE` | `/api/containers/stacks/{id}` | Stack löschen |

### User Templates

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `GET` | `/api/user-templates/` | Eigene Templates |
| `POST` | `/api/user-templates/` | Template erstellen |
| `DELETE` | `/api/user-templates/{id}` | Template löschen |
| `PATCH` | `/api/user-templates/{id}/visibility` | Öffentlich / privat schalten |
| `GET` | `/api/user-templates/public` | Öffentliche Templates anderer Nutzer |
| `GET` | `/api/user-templates/favorites` | Favoriten abrufen |
| `PUT` | `/api/user-templates/favorites` | Favoriten speichern |

### API-Keys

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `GET` | `/api/api-keys/` | Aktive Keys auflisten |
| `POST` | `/api/api-keys/` | Neuen Key erstellen (Raw-Key einmalig) |
| `DELETE` | `/api/api-keys/{id}` | Key widerrufen |

### Snapshots

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `GET` | `/api/snapshots/` | Eigene Snapshots auflisten |
| `POST` | `/api/snapshots/` | Snapshot erstellen |
| `DELETE` | `/api/snapshots/{id}` | Snapshot löschen |

### Shared Environments

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `GET` | `/api/shared-access/{label}` | Zugriffsberechtigte auflisten |
| `POST` | `/api/shared-access/{label}` | Zugriff für Benutzer gewähren |
| `DELETE` | `/api/shared-access/{share_id}` | Zugriff entziehen |
| `GET` | `/api/shared-access/my/shared-with-me` | Container, auf die man Zugriff hat |

### GitHub Actions

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `POST` | `/api/github-actions/trigger` | Container per API-Key starten |
| `GET` | `/api/github-actions/workflow-example` | Workflow-YAML-Beispiel |

### Teams

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `GET` | `/api/teams/` | Eigene Teams |
| `POST` | `/api/teams/` | Team erstellen |
| `DELETE` | `/api/teams/{id}` | Team löschen |
| `GET` | `/api/teams/{id}/members` | Mitglieder |
| `POST` | `/api/teams/{id}/members` | Mitglied hinzufügen |
| `DELETE` | `/api/teams/{id}/members/{uid}` | Mitglied entfernen |
| `PUT` | `/api/teams/{id}/members/{uid}/role` | Rolle ändern |
| `GET` | `/api/teams/{id}/templates` | Team-Templates |
| `POST` | `/api/teams/{id}/templates` | Template hinzufügen |
| `PUT` | `/api/teams/{id}/templates/{tid}` | Template bearbeiten |
| `DELETE` | `/api/teams/{id}/templates/{tid}` | Template entfernen |

### Marketplace

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `GET` | `/api/marketplace/` | Öffentliche Templates |
| `POST` | `/api/marketplace/` | Template veröffentlichen |
| `GET` | `/api/marketplace/{id}` | Template-Details |
| `DELETE` | `/api/marketplace/{id}` | Template entfernen |
| `POST` | `/api/marketplace/{id}/rate` | Bewerten |
| `GET/POST` | `/api/marketplace/{id}/comments` | Kommentare |
| `DELETE` | `/api/marketplace/{id}/comments/{cid}` | Kommentar löschen |
| `GET/POST` | `/api/marketplace/{id}/images` | Bilder |
| `DELETE` | `/api/marketplace/{id}/images/{iid}` | Bild löschen |
| `POST` | `/api/marketplace/{id}/import` | In eigene Bibliothek importieren |

---

## Projektstruktur

```
env-buddy/
├── start.sh
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                     # FastAPI Einstiegspunkt + Lifespan
│   │   ├── database.py                 # SQLite / SQLAlchemy Setup
│   │   ├── auth_utils.py               # JWT + API-Key Authentifizierung
│   │   ├── routers/
│   │   │   ├── auth.py                 # Login, Register, Profil
│   │   │   ├── containers.py           # Container + WebSocket (Logs, Terminal)
│   │   │   ├── notifications.py        # E-Mail-Benachrichtigungen
│   │   │   ├── user_templates.py       # Eigene Templates + Sichtbarkeit
│   │   │   ├── team_templates.py       # Team-Templates (teamübergreifend)
│   │   │   ├── teams.py                # Teams & Mitglieder
│   │   │   ├── marketplace.py          # Marketplace
│   │   │   ├── audit.py                # Audit-Log
│   │   │   ├── invitations.py          # Team-Einladungen
│   │   │   ├── api_keys.py             # REST-API-Keys
│   │   │   ├── snapshots.py            # Container-Snapshots
│   │   │   ├── shared_access.py        # Geteilter Container-Zugriff
│   │   │   └── github_actions.py       # GitHub Actions Integration
│   │   ├── services/
│   │   │   ├── docker_service.py       # Docker SDK Logik
│   │   │   ├── notification_service.py # E-Mail Versand
│   │   │   └── webhook_service.py      # Webhook-Calls
│   │   └── models/
│   │       ├── user.py
│   │       ├── container.py
│   │       ├── template.py             # UserTemplateDB (+ is_public)
│   │       ├── team.py
│   │       ├── team_template.py
│   │       ├── marketplace.py
│   │       ├── audit.py
│   │       ├── invitation.py
│   │       ├── api_key.py              # API-Keys
│   │       ├── snapshot.py             # Snapshots
│   │       └── shared_access.py        # Geteilter Zugriff
│   ├── templates/                      # HTML E-Mail Templates
│   └── tests/
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   │   ├── main.jsx                    # React + BrowserRouter
│   │   ├── App.jsx                     # Navigation, Routes, Command Palette
│   │   ├── templateIcons.js            # Gemeinsame Icon-Map
│   │   ├── components/
│   │   │   ├── ContainerCard.jsx       # Karte mit Stats, Terminal, Share, Snapshot
│   │   │   ├── ContainerEditModal.jsx
│   │   │   ├── ContainerLogsModal.jsx  # Live-Logs (WebSocket)
│   │   │   ├── ContainerTerminalModal.jsx  # Browser-Terminal (xterm.js)
│   │   │   ├── CommandPalette.jsx      # Ctrl+K Palette
│   │   │   ├── CreateTemplateModal.jsx
│   │   │   ├── DashboardStats.jsx
│   │   │   ├── ImportContainerModal.jsx
│   │   │   ├── ProfileModal.jsx        # Profil, API-Keys, Snapshots, CI/CD-Snippet
│   │   │   ├── ResourceGraphModal.jsx
│   │   │   ├── StackCard.jsx
│   │   │   ├── StartForm.jsx
│   │   │   ├── TeamStackBuilder.jsx
│   │   │   └── Toast.jsx
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── DashboardPage.jsx       # Container-Verwaltung + Import
│   │   │   ├── MarketplacePage.jsx
│   │   │   ├── TeamsPage.jsx
│   │   │   ├── TemplatesPage.jsx       # Templates + öffentliche Templates
│   │   │   └── AuditPage.jsx
│   │   └── services/
│   │       └── api.js
│   └── package.json
└── .github/
    └── workflows/
        └── deploy.yml                  # CI: Test → Build → Push GHCR → SSH Deploy
```

---

## Verfügbare Templates

| Template | Image | Port |
|----------|-------|------|
| `postgres` | postgres:15 | 5432 |
| `redis` | redis:7 | 6379 |
| `mysql` | mysql:8 | 3306 |
| `mongo` | mongo:6 | 27017 |
| `rabbitmq` | rabbitmq:3-management | 15672 |
| `minio` | minio/minio | 9000 |
| `elasticsearch` | elasticsearch:8 | 9200 |
| `mariadb` | mariadb:11 | 3306 |

> Ports werden dynamisch im Bereich 10000–11000 zugewiesen.  
> Eigene Templates können über das **Templates**-Tab oder den **Marketplace** hinzugefügt werden.

---

## Team

| Name |
|------|
| Berkay Polat |
| Lars Wenner |
| Timothy Sack |

---

## Git Workflow

```
main        ← Stabile Versionen (CI/CD deployt automatisch)
feature/*   ← Feature-Branches → PR auf main
```

```bash
git checkout -b feature/mein-feature
# arbeiten, committen
git push origin feature/mein-feature
# Pull Request öffnen → main
```

---

## Commit Konvention

| Prefix | Wann |
|--------|------|
| `feat:` | Neues Feature |
| `fix:` | Bug behoben |
| `docs:` | Dokumentation |
| `test:` | Tests |
| `refactor:` | Umstrukturierung |
| `chore:` | Setup, Config, Dependencies |

---

## Lizenz

Dieses Projekt wurde im Rahmen des Moduls **Software Engineering** entwickelt.
