# 🧪 Test-Buddy

> **On-Demand Testumgebungen auf Knopfdruck**
> Ein Self-Service Web-Dashboard zum Starten, Überwachen und automatischen Stoppen von Docker-Containern – für das gesamte Entwicklerteam.

---

## 📋 Inhaltsverzeichnis

- [Über das Projekt](#-über-das-projekt)
- [Features](#-features)
- [Tech-Stack](#-tech-stack)
- [Voraussetzungen](#-voraussetzungen)
- [Installation & Setup](#-installation--setup)
- [Projekt lokal starten](#-projekt-lokal-starten)
- [API Dokumentation](#-api-dokumentation)
- [Projektstruktur](#-projektstruktur)
- [Verfügbare Templates](#-verfügbare-templates)
- [Team](#-team)
- [Git Workflow](#-git-workflow)
- [Commit Konvention](#-commit-konvention)

---

## 🎯 Über das Projekt

Entwickler und Tester verlieren täglich wertvolle Zeit, weil sie auf manuell bereitgestellte Testumgebungen warten müssen. Test-Buddy löst dieses Problem mit einem zentralen Web-Dashboard, über das jeder im Team per Klick isolierte Docker-Container starten kann – ganz ohne Docker-Kenntnisse oder Zugriff auf die IT-Abteilung.

Nach Ablauf eines konfigurierbaren Timers werden die Umgebungen automatisch wieder heruntergefahren – keine vergessenen Container, keine Ressourcenverschwendung.

---

## ✨ Features

### Container-Verwaltung
- ▶️ Container per Klick starten (aus vordefinierten Templates)
- ⏹️ Container manuell stoppen
- 📊 Live CPU- und RAM-Auslastung pro Container
- 🔍 Suche & Filter nach Template und Status

### Authentifizierung
- 👤 Registrierung mit Name, Vorname, Benutzername & E-Mail
- 🔐 Login mit JWT-Token (24h gültig)
- 🔑 Passwort zurücksetzen per E-Mail

### Notifications
- 📧 Willkommens-E-Mail bei Registrierung
- 📧 E-Mail-Benachrichtigung bei Container-Start

---

## 🛠️ Tech-Stack

| Bereich | Technologie | Version |
|---------|-------------|---------|
| Backend | Python + FastAPI | 3.11+ |
| Frontend | React + Vite | 19 / 7+ |
| Container | Docker SDK for Python | 7+ |
| Datenbank | SQLite (via SQLAlchemy) | 2+ |
| Auth | JWT (python-jose) + bcrypt | - |
| E-Mail | SMTP / Gmail | - |
| API Doku | Swagger UI (automatisch) | - |

---

## ✅ Voraussetzungen

Folgende Tools müssen installiert sein:

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Docker](https://www.docker.com/products/docker-desktop/) (muss im Hintergrund laufen)
- [Git](https://git-scm.com/)

---

## 🚀 Installation & Setup

### 1. Repository klonen

```bash
git clone https://github.com/milkamilch/env-buddy-1.git
cd env-buddy-1
```

### 2. Backend einrichten

```bash
cd backend

# Virtual Environment erstellen & aktivieren
# macOS / Linux:
python3 -m venv venv
source venv/bin/activate

# Windows:
python -m venv venv
.\venv\Scripts\Activate.ps1

# Abhängigkeiten installieren
pip install -r requirements.txt
```

### 3. Frontend einrichten

```bash
cd frontend
npm install
```

### 4. Umgebungsvariablen anlegen

Erstelle die Datei `backend/.env` mit folgendem Inhalt:

```env
# JWT Auth
SECRET_KEY=irgendein-langer-geheimer-string

# E-Mail (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deine@gmail.com
SMTP_PASSWORD=dein-app-passwort
NOTIFICATION_FROM=Test-Buddy <deine@gmail.com>

# Frontend-URL (für Passwort-Reset-Links in E-Mails)
FRONTEND_URL=http://localhost:5173
```

> **Gmail App-Passwort erstellen:**
> Google-Konto → Sicherheit → 2-Faktor-Authentifizierung aktivieren → App-Passwörter → neues Passwort für "Mail" generieren.
> Das generierte 16-stellige Passwort (ohne Leerzeichen) als `SMTP_PASSWORD` eintragen.

---

## ▶️ Projekt lokal starten

Das Projekt benötigt **zwei Terminals** — eines für Backend, eines für Frontend.

### Terminal 1 — Backend

```bash
cd backend

# venv aktivieren (macOS / Linux)
source venv/bin/activate

# venv aktivieren (Windows)
.\venv\Scripts\Activate.ps1

# Server starten
uvicorn app.main:app --reload
```

✅ Backend läuft auf: **http://localhost:8000**
📖 Swagger UI (API-Doku): **http://localhost:8000/docs**

> Die SQLite-Datenbank (`testbuddy.db`) wird beim ersten Start automatisch erstellt.

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

✅ Frontend läuft auf: **http://localhost:5173**

### Docker prüfen

Docker muss im Hintergrund aktiv sein, damit Container gestartet werden können:

```bash
docker info
```

---

## 📖 API Dokumentation

Nach dem Start des Backends ist die interaktive Swagger-Doku erreichbar:

**http://localhost:8000/docs**

### Auth

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `POST` | `/api/auth/register` | Neuen Account erstellen |
| `POST` | `/api/auth/login` | Einloggen, JWT-Token erhalten |
| `POST` | `/api/auth/forgot-password` | Reset-Link per E-Mail anfordern |
| `POST` | `/api/auth/reset-password` | Passwort mit Token zurücksetzen |

### Container

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `GET` | `/health` | Server-Status prüfen |
| `GET` | `/api/containers/templates` | Verfügbare Templates abrufen |
| `POST` | `/api/containers/start` | Container starten |
| `GET` | `/api/containers/` | Alle laufenden Container auflisten |
| `DELETE` | `/api/containers/{id}` | Container stoppen & entfernen |
| `GET` | `/api/containers/{id}/stats` | Live CPU & RAM eines Containers |

---

## 📁 Projektstruktur

```
env-buddy-1/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI Einstiegspunkt
│   │   ├── database.py                 # SQLite / SQLAlchemy Setup
│   │   ├── routers/
│   │   │   ├── auth.py                 # Login, Register, Passwort-Reset
│   │   │   ├── containers.py           # Container-Endpunkte
│   │   │   └── notifications.py        # Notifications-Endpunkte
│   │   ├── services/
│   │   │   ├── docker_service.py       # Docker SDK Logik
│   │   │   └── notification_service.py # E-Mail Versand (SMTP)
│   │   └── models/
│   │       ├── container.py            # Container Pydantic-Modelle
│   │       └── user.py                 # User DB-Modell & Schemas
│   ├── venv/
│   ├── testbuddy.db                    # SQLite Datenbank (auto-erstellt)
│   ├── .env                            # Umgebungsvariablen (nicht einchecken!)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ContainerCard.jsx       # Container-Karte mit Stats & Stop
│   │   │   └── StartForm.jsx           # Template-Auswahl & Laufzeit
│   │   ├── pages/
│   │   │   └── AuthPage.jsx            # Login / Register / Passwort-Reset
│   │   ├── services/
│   │   │   └── api.js                  # Alle API-Aufrufe
│   │   └── App.jsx                     # Haupt-Dashboard
│   └── package.json
├── templates/                          # HTML E-Mail Templates
│   ├── welcome.html                    # Willkommens-Mail
│   ├── password_reset.html             # Passwort-Reset-Mail
│   ├── container_started.html          # Container gestartet
│   └── container_warning.html          # Container läuft ab
├── .gitignore
└── README.md
```

---

## 🧱 Verfügbare Templates

| Template | Image | Interner Port |
|----------|-------|---------------|
| `postgres` | postgres:15 | 5432 |
| `redis` | redis:7 | 6379 |
| `mysql` | mysql:8 | 3306 |
| `mongo` | mongo:6 | 27017 |

> Ports werden dynamisch im Bereich 10000–11000 zugewiesen – keine Konflikte mit laufenden Diensten!

---

## 👥 Team

| | Name |
|--|------|
| 👤 | Berkay Polat |
| 👤 | Lars Wenner |
| 👤 | Timothy Sack |

---

## 🌿 Git Workflow

```
main        ← Nur stabile, fertige Versionen (kein direkter Push!)
develop     ← Tägliche Zusammenführung aller Features
feature/*   ← Jeder arbeitet in seinem eigenen Branch
```

**Täglicher Ablauf:**

```bash
# Neuesten Stand holen
git checkout develop
git pull origin develop

# Auf eigenen Branch wechseln & develop einmergen
git checkout feature/mein-feature
git merge develop

# Arbeiten, committen, pushen
git add .
git commit -m "feat: kurze beschreibung"
git push origin feature/mein-feature

# Fertig? → Pull Request auf GitHub öffnen: feature/* → develop
```

---

## 📝 Commit Konvention

| Prefix | Wann benutzen |
|--------|---------------|
| `feat:` | Neues Feature |
| `fix:` | Bug behoben |
| `docs:` | README oder Kommentare |
| `test:` | Tests hinzugefügt |
| `refactor:` | Code umgebaut |
| `chore:` | Setup, Config, Dependencies |

**Beispiele:**
```
feat: Container-Start Endpoint implementiert
fix: Timer läuft jetzt korrekt nach 60 Minuten
docs: README mit lokalem Setup ergänzt
test: Unit-Test für Auth-Endpoint hinzugefügt
```

---

## 📄 Lizenz

Dieses Projekt wurde im Rahmen des Moduls **Software Engineering** entwickelt.
