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
- [Projekt starten](#-projekt-starten)
- [API Dokumentation](#-api-dokumentation)
- [Projektstruktur](#-projektstruktur)
- [Verfügbare Templates](#-verfügbare-templates)
- [Team & Aufgabenverteilung](#-team--aufgabenverteilung)
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
- ⏸️ Container pausieren & fortsetzen
- 🔁 Automatischer Neustart bei Absturz
- 📦 Mehrere Container als Stack starten

### Monitoring & Statistiken
- 📊 Live CPU- und RAM-Auslastung pro Container
- 🕐 Laufzeit-Anzeige
- 📈 Ressourcen-Heatmap im Dashboard

### Notifications
- 📧 E-Mail-Benachrichtigung bei Container-Start & -Stop
- 🔔 Browser-Push wenn Timer in 10 Minuten abläuft
- ⚠️ Warnung bei Ressourcen-Limit (> 90% RAM)

### Template-Builder
- 🧱 Vordefinierte Templates (PostgreSQL, Redis, MySQL, MongoDB, Nginx)
- ✏️ Eigene Templates erstellen & im Team teilen
- 📤 Templates als JSON exportieren / importieren

### Aktivitäts-Log
- 📜 Vollständiges Log aller Aktionen (wer, wann, was)
- 🔍 Filterbar nach Zeitraum, Nutzer, Container-Typ
- 📥 Export als CSV

### Kosten- & Ressourcenübersicht
- 💰 Ressourcenverbrauch in Echtzeit sichtbar
- 📉 Eingesparte Ressourcen durch Auto-Shutdown
- 📄 Monatsreport exportierbar

---

## 🛠️ Tech-Stack

| Bereich | Technologie | Version |
|---------|-------------|---------|
| Backend | Python + FastAPI | 3.11 / 0.100+ |
| Frontend | React + Vite | 18 / 4+ |
| Container | Docker SDK for Python | 6+ |
| HTTP Client | Axios | 1+ |
| Styling | CSS / TailwindCSS | - |
| Datenbank | SQLite (via SQLAlchemy) | - |
| API Doku | Swagger UI (automatisch) | - |

---

## ✅ Voraussetzungen

Folgende Tools müssen installiert sein:

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

---

## 🚀 Installation & Setup

### 1. Repository klonen

```bash
git clone https://github.com/milkamilch/test-buddy.git
cd test-buddy
```

### 2. Backend einrichten

```bash
cd backend

# Virtual Environment erstellen & aktivieren
# Windows:
python -m venv venv
.\venv\Scripts\Activate.ps1

# macOS / Linux:
python3 -m venv venv
source venv/bin/activate

# Abhängigkeiten installieren
pip install -r requirements.txt
```

### 3. Frontend einrichten

```bash
cd frontend
npm install
```

### 4. Umgebungsvariablen anlegen

```bash
# Im Root-Ordner eine .env Datei erstellen:
cp .env.example .env
```

Inhalt der `.env`:

```env
# Backend
SECRET_KEY=dein-geheimer-schlüssel
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=deine@email.de
SMTP_PASSWORD=dein-passwort

# Docker
DOCKER_HOST=unix:///var/run/docker.sock
```

---

## ▶️ Projekt starten

### Backend starten

```bash
cd backend
.\venv\Scripts\Activate.ps1   # Windows
source venv/bin/activate       # macOS / Linux

uvicorn app.main:app --reload
```

Backend läuft auf: **http://localhost:8000**

### Frontend starten

```bash
cd frontend
npm run dev
```

Frontend läuft auf: **http://localhost:5173**

### Mit Docker Compose (alles auf einmal)

```bash
docker-compose up --build
```

---

## 📖 API Dokumentation

Nach dem Start des Backends ist die interaktive API-Dokumentation erreichbar unter:

**http://localhost:8000/docs**

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| `GET` | `/health` | Server-Status prüfen |
| `POST` | `/api/containers/start` | Container starten |
| `GET` | `/api/containers/` | Alle Container auflisten |
| `DELETE` | `/api/containers/{id}` | Container stoppen |
| `GET` | `/api/containers/{id}/stats` | Live CPU & RAM |
| `GET` | `/api/containers/templates` | Verfügbare Templates |

---

## 📁 Projektstruktur

```
env-buddy/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI Einstiegspunkt
│   │   ├── routers/
│   │   │   └── containers.py    # API Endpunkte
│   │   ├── services/
│   │   │   └── docker_service.py # Docker-Logik
│   │   └── models/
│   │       └── container.py     # Datenmodelle (Pydantic)
│   ├── venv/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Wiederverwendbare UI-Komponenten
│   │   ├── pages/               # Seiten (Dashboard, Templates, Log)
│   │   └── services/            # API-Aufrufe (Axios)
│   └── package.json
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🧱 Verfügbare Templates

| Template | Image | Standard-Port |
|----------|-------|---------------|
| `postgres` | postgres:15 | 5432 |
| `mysql` | mysql:8 | 3306 |
| `redis` | redis:7 | 6379 |
| `mongo` | mongo:6 | 27017 |
| `nginx` | nginx:latest | 80 |

> Ports werden dynamisch zugewiesen – keine Konflikte mit laufenden Diensten!

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
docs: README mit API-Tabelle ergänzt
test: Unit-Test für Stop-Endpoint hinzugefügt
```

---

## 📄 Lizenz

Dieses Projekt wurde im Rahmen des Moduls **Software Engineering** entwickelt.
