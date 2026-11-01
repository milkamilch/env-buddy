# Env-Buddy

> **On-demand test environments at the push of a button**
> A self-service web dashboard for starting, monitoring and automatically stopping Docker containers – for the whole development team.

---

## Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running Locally](#running-locally)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Available Templates](#available-templates)
- [Team](#team)
- [Git Workflow](#git-workflow)
- [Commit Convention](#commit-convention)

---

## About the Project

Developers and testers lose valuable time every day waiting for manually provisioned test environments. Env-Buddy solves this with a central web dashboard where anyone on the team can start isolated Docker containers with a click – no Docker knowledge or IT tickets required.

Once a configurable timer runs out, environments shut down automatically – no forgotten containers, no wasted resources.

---

## Features

### Container Management
- Start containers with a click (from your own, team or public templates)
- Stop, restart, extend and delete containers
- Live CPU and RAM usage with sparkline history
- Search & filter by template and status
- Grid and list view
- Stream container logs live via WebSocket (`● LIVE` / `● POLLING` badge)
- Built-in browser terminal (xterm.js, directly inside the container)
- Share a container configuration link (`?start=base64` for cloning)
- Save a container as a template or snapshot
- Share container access with other users
- Download the `.env` file
- One-click Docker image update (pull & restart)
- Docker health check display + TCP reachability check
- Bulk actions: stop/delete several containers at once
- Import containers (paste JSON or upload a file, `docker inspect` format supported)

### Stacks
- Start, stop and delete multi-container stacks
- Stack overview with all contained containers

### Templates
- Create, edit and favorite your own templates
- Mark a template as public (visible to other users)
- Share and co-manage team templates
- Marketplace: community templates with ratings, comments and images
- Template search across all categories
- Drag & drop quick-select sidebar

### Snapshots
- Save a running container's configuration as a snapshot (`📷` button on the card)
- List and delete snapshots in the profile settings

### API Keys
- Create and revoke up to 10 personal API keys
- Key prefix for identification; the raw key is shown only once
- Authenticate via `X-Api-Key` header or `Authorization: ApiKey xxx`
- Falls back to JWT automatically

### GitHub Actions Integration
- `POST /api/github-actions/trigger` starts containers using API key auth
- Ready-made workflow YAML example in the profile settings

### Teams
- Create teams and invite members
- Roles: Admin, Member
- Team-owned template library

### Authentication & Profile
- Sign-up with email verification
- Login with JWT (valid for 24 h)
- Password reset via email
- Edit profile (name, username, bio, password, avatar)
- Dark/light mode toggle
- Webhook URL for external notifications (container.started / container.stopped)
- Email notifications on start, stop and a 5-minute warning

### UX
- Command palette (`Ctrl+K` / `Cmd+K`) for fast navigation and template launch
- Full keyboard navigation
- React Router (deep links, browser back/forward)
- Toast notifications

---

## Tech Stack

| Area | Technology | Version |
|---------|-------------|---------|
| Backend | Python + FastAPI | 3.11+ |
| Frontend | React + Vite | 19 / 7+ |
| Routing | React Router | v7 |
| Terminal | xterm.js (@xterm/xterm) | v6 |
| Container | Docker SDK for Python | 7+ |
| Database | SQLite (via SQLAlchemy) | 2+ |
| Auth | JWT (python-jose) + bcrypt | - |
| Email | SMTP / Gmail | - |
| API docs | Swagger UI (automatic) | - |

---

## Prerequisites

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Docker](https://www.docker.com/products/docker-desktop/) (must be running in the background)
- [Git](https://git-scm.com/)

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/milkamilch/env-buddy.git
cd env-buddy
```

### 2. Set up the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # macOS / Linux
# .\venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt
```

### 3. Set up the frontend

```bash
cd frontend
npm install
```

### 4. Create environment variables

Create `backend/.env`:

```env
# JWT auth
SECRET_KEY=irgendein-langer-geheimer-string

# CORS (comma-separated for multiple origins)
CORS_ORIGINS=http://localhost:5173

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deine@gmail.com
SMTP_PASSWORD=dein-app-passwort
NOTIFICATION_FROM=Env-Buddy <deine@gmail.com>

# Frontend URL (for password reset links in emails)
FRONTEND_URL=http://localhost:5173

# Container limit per user (0 = unlimited)
MAX_CONTAINERS_PER_USER=10
```

> **Gmail app password:** Google Account → Security → 2-Step Verification → App passwords → new password for "Mail".

---

## Running Locally

### One-command start

```bash
./start.sh
```

Backend: **http://localhost:8000**  
Frontend: **http://localhost:5173**  
Swagger UI: **http://localhost:8000/docs**

### Manually

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

## API Documentation

Interactive Swagger docs: **http://localhost:8000/docs**

### Auth

| Method | Endpoint | Description |
|---------|----------|--------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Log in, receive JWT |
| `GET` | `/api/auth/me` | Get own profile |
| `PUT` | `/api/auth/me/profile` | Update profile |
| `POST` | `/api/auth/me/avatar` | Upload avatar |
| `PUT` | `/api/auth/me/notifications` | Save notification settings |
| `POST` | `/api/auth/forgot-password` | Request reset link |
| `POST` | `/api/auth/reset-password` | Reset password |

### Containers

| Method | Endpoint | Description |
|---------|----------|--------------|
| `GET` | `/api/containers/` | List own containers |
| `POST` | `/api/containers/start` | Start container |
| `POST` | `/api/containers/{id}/stop` | Stop container |
| `POST` | `/api/containers/{id}/start` | Start stopped container |
| `POST` | `/api/containers/{id}/restart` | Restart container |
| `POST` | `/api/containers/{id}/extend` | Extend runtime |
| `DELETE` | `/api/containers/{id}` | Delete container |
| `GET` | `/api/containers/{id}/config` | Get configuration |
| `PUT` | `/api/containers/{id}/config` | Update configuration |
| `GET` | `/api/containers/{id}/logs` | Get logs (HTTP) |
| `WS` | `/api/containers/{id}/logs/stream?token=` | Stream logs live (WebSocket) |
| `WS` | `/api/containers/{id}/terminal?token=` | Browser terminal (WebSocket) |
| `GET` | `/api/containers/{id}/stats` | Live CPU & RAM |
| `GET` | `/api/containers/{id}/stats/history` | Resource history |
| `GET` | `/api/containers/{id}/health` | TCP reachability check |
| `GET` | `/api/containers/{id}/dotenv` | Download .env |
| `POST` | `/api/containers/{id}/update-image` | Update image |

### Stacks

| Method | Endpoint | Description |
|---------|----------|--------------|
| `GET` | `/api/containers/stacks` | List all stacks |
| `POST` | `/api/containers/stacks/start` | Start stack |
| `POST` | `/api/containers/stacks/{id}/stop` | Stop stack |
| `POST` | `/api/containers/stacks/{id}/start` | Start stopped stack |
| `DELETE` | `/api/containers/stacks/{id}` | Delete stack |

### User Templates

| Method | Endpoint | Description |
|---------|----------|--------------|
| `GET` | `/api/user-templates/` | Own templates |
| `POST` | `/api/user-templates/` | Create template |
| `DELETE` | `/api/user-templates/{id}` | Delete template |
| `PATCH` | `/api/user-templates/{id}/visibility` | Toggle public / private |
| `GET` | `/api/user-templates/public` | Other users' public templates |
| `GET` | `/api/user-templates/favorites` | Get favorites |
| `PUT` | `/api/user-templates/favorites` | Save favorites |

### API Keys

| Method | Endpoint | Description |
|---------|----------|--------------|
| `GET` | `/api/api-keys/` | List active keys |
| `POST` | `/api/api-keys/` | Create new key (raw key shown once) |
| `DELETE` | `/api/api-keys/{id}` | Revoke key |

### Snapshots

| Method | Endpoint | Description |
|---------|----------|--------------|
| `GET` | `/api/snapshots/` | List own snapshots |
| `POST` | `/api/snapshots/` | Create snapshot |
| `DELETE` | `/api/snapshots/{id}` | Delete snapshot |

### Shared Environments

| Method | Endpoint | Description |
|---------|----------|--------------|
| `GET` | `/api/shared-access/{label}` | List users with access |
| `POST` | `/api/shared-access/{label}` | Grant access to a user |
| `DELETE` | `/api/shared-access/{share_id}` | Revoke access |
| `GET` | `/api/shared-access/my/shared-with-me` | Containers shared with you |

### GitHub Actions

| Method | Endpoint | Description |
|---------|----------|--------------|
| `POST` | `/api/github-actions/trigger` | Start container via API key |
| `GET` | `/api/github-actions/workflow-example` | Workflow YAML example |

### Teams

| Method | Endpoint | Description |
|---------|----------|--------------|
| `GET` | `/api/teams/` | Own teams |
| `POST` | `/api/teams/` | Create team |
| `DELETE` | `/api/teams/{id}` | Delete team |
| `GET` | `/api/teams/{id}/members` | Members |
| `POST` | `/api/teams/{id}/members` | Add member |
| `DELETE` | `/api/teams/{id}/members/{uid}` | Remove member |
| `PUT` | `/api/teams/{id}/members/{uid}/role` | Change role |
| `GET` | `/api/teams/{id}/templates` | Team templates |
| `POST` | `/api/teams/{id}/templates` | Add template |
| `PUT` | `/api/teams/{id}/templates/{tid}` | Edit template |
| `DELETE` | `/api/teams/{id}/templates/{tid}` | Remove template |

### Marketplace

| Method | Endpoint | Description |
|---------|----------|--------------|
| `GET` | `/api/marketplace/` | Public templates |
| `POST` | `/api/marketplace/` | Publish template |
| `GET` | `/api/marketplace/{id}` | Template details |
| `DELETE` | `/api/marketplace/{id}` | Remove template |
| `POST` | `/api/marketplace/{id}/rate` | Rate |
| `GET/POST` | `/api/marketplace/{id}/comments` | Comments |
| `DELETE` | `/api/marketplace/{id}/comments/{cid}` | Delete comment |
| `GET/POST` | `/api/marketplace/{id}/images` | Images |
| `DELETE` | `/api/marketplace/{id}/images/{iid}` | Delete image |
| `POST` | `/api/marketplace/{id}/import` | Import into own library |

---

## Project Structure

```
env-buddy/
├── start.sh
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                     # FastAPI entry point + lifespan
│   │   ├── database.py                 # SQLite / SQLAlchemy setup
│   │   ├── auth_utils.py               # JWT + API key authentication
│   │   ├── routers/
│   │   │   ├── auth.py                 # Login, register, profile
│   │   │   ├── containers.py           # Containers + WebSocket (logs, terminal)
│   │   │   ├── notifications.py        # Email notifications
│   │   │   ├── user_templates.py       # Own templates + visibility
│   │   │   ├── team_templates.py       # Team templates (across teams)
│   │   │   ├── teams.py                # Teams & members
│   │   │   ├── marketplace.py          # Marketplace
│   │   │   ├── audit.py                # Audit log
│   │   │   ├── invitations.py          # Team invitations
│   │   │   ├── api_keys.py             # REST API keys
│   │   │   ├── snapshots.py            # Container snapshots
│   │   │   ├── shared_access.py        # Shared container access
│   │   │   └── github_actions.py       # GitHub Actions integration
│   │   ├── services/
│   │   │   ├── docker_service.py       # Docker SDK logic
│   │   │   ├── notification_service.py # Email sending
│   │   │   └── webhook_service.py      # Webhook calls
│   │   └── models/
│   │       ├── user.py
│   │       ├── container.py
│   │       ├── template.py             # UserTemplateDB (+ is_public)
│   │       ├── team.py
│   │       ├── team_template.py
│   │       ├── marketplace.py
│   │       ├── audit.py
│   │       ├── invitation.py
│   │       ├── api_key.py              # API keys
│   │       ├── snapshot.py             # Snapshots
│   │       └── shared_access.py        # Shared access
│   ├── templates/                      # HTML email templates
│   └── tests/
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   │   ├── main.jsx                    # React + BrowserRouter
│   │   ├── App.jsx                     # Navigation, routes, command palette
│   │   ├── templateIcons.js            # Shared icon map
│   │   ├── components/
│   │   │   ├── ContainerCard.jsx       # Card with stats, terminal, share, snapshot
│   │   │   ├── ContainerEditModal.jsx
│   │   │   ├── ContainerLogsModal.jsx  # Live logs (WebSocket)
│   │   │   ├── ContainerTerminalModal.jsx  # Browser terminal (xterm.js)
│   │   │   ├── CommandPalette.jsx      # Ctrl+K palette
│   │   │   ├── CreateTemplateModal.jsx
│   │   │   ├── DashboardStats.jsx
│   │   │   ├── ImportContainerModal.jsx
│   │   │   ├── ProfileModal.jsx        # Profile, API keys, snapshots, CI/CD snippet
│   │   │   ├── ResourceGraphModal.jsx
│   │   │   ├── StackCard.jsx
│   │   │   ├── StartForm.jsx
│   │   │   ├── TeamStackBuilder.jsx
│   │   │   └── Toast.jsx
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── DashboardPage.jsx       # Container management + import
│   │   │   ├── MarketplacePage.jsx
│   │   │   ├── TeamsPage.jsx
│   │   │   ├── TemplatesPage.jsx       # Templates + public templates
│   │   │   └── AuditPage.jsx
│   │   └── services/
│   │       └── api.js
│   └── package.json
└── .github/
    └── workflows/
        └── deploy.yml                  # CI: test → build → push GHCR → SSH deploy
```

---

## Available Templates

| Template | Image | Port |
|----------|-------|------|
| `postgres` | postgres:15 | 5432 |
| `redis` | redis:7 | 6379 |
| `mysql` | mysql:8 | 3306 |
| `mongo` | mongo:7 | 27017 |
| `rabbitmq` | rabbitmq:3-management | 5672 |
| `minio` | minio/minio | 9000 |
| `elasticsearch` | elasticsearch:8.13.0 | 9200 |
| `mariadb` | mariadb:11 | 3306 |

> Ports are assigned dynamically in the range 10000–11000.  
> Custom templates can be added via the **Templates** tab or the **Marketplace**.

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
main        ← Stable releases (CI/CD deploys automatically)
feature/*   ← Feature branches → PR to main
```

```bash
git checkout -b feature/mein-feature
# work, commit
git push origin feature/mein-feature
# open a pull request → main
```

---

## Commit Convention

| Prefix | When |
|--------|------|
| `feat:` | New feature |
| `fix:` | Bug fixed |
| `docs:` | Documentation |
| `test:` | Tests |
| `refactor:` | Restructuring |
| `chore:` | Setup, config, dependencies |

---

## License

This project was developed as part of the **Software Engineering** module.
