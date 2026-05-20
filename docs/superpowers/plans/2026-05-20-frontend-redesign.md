# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild das env-buddy Frontend nach dem Catppuccin Design Guide in 4 separaten Git-Branches, je ein Commit pro Branch.

**Architecture:** Tailwind v4 (CSS-basierte Konfiguration via `@theme`) als Build-Tool, CSS Custom Properties als semantische Token-Schicht, Lucide-React für Icons. Jede Phase produziert einen vollständig funktionsfähigen Stand — keine halbfertigen Zustände.

**Tech Stack:** React 19, Vite 7, Tailwind CSS v4 (`@tailwindcss/vite`), `lucide-react`, Google Fonts (Space Grotesk + JetBrains Mono)

**Spec:** `docs/superpowers/specs/2026-05-20-frontend-redesign-design.md`

---

## Phase 1 — Tailwind + Tokens + Fonts

**Branch:** `design/phase-1-tokens`  
**Ziel:** Tailwind ins Build-System einbauen, alle Design-Tokens definieren, Google Fonts einbinden. Kein sichtbarer UI-Break.

**Files:**
- Modify: `frontend/vite.config.js`
- Modify: `frontend/src/index.css` (vollständig ersetzen)
- Create: `frontend/tailwind.config.js`

---

### Task 1.1: Branch anlegen und Tailwind installieren

- [ ] **Branch erstellen**

```bash
cd /Users/larswenner/env-buddy/frontend
git checkout main   # oder gewünschter Basis-Branch
git checkout -b design/phase-1-tokens
```

- [ ] **Tailwind v4 und lucide-react installieren**

```bash
cd /Users/larswenner/env-buddy/frontend
npm install -D tailwindcss @tailwindcss/vite
npm install lucide-react
```

Erwartetes Ergebnis: `package.json` enthält `"tailwindcss"` in devDependencies und `"lucide-react"` in dependencies.

---

### Task 1.2: Vite-Plugin aktivieren

- [ ] **`frontend/vite.config.js` anpassen**

Ersetze den gesamten Inhalt mit:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api":     { target: "http://localhost:8000" },
      "/uploads": { target: "http://localhost:8000" },
    },
  },
})
```

---

### Task 1.3: `tailwind.config.js` anlegen (v3-Kompatibilitätsschicht)

- [ ] **`frontend/tailwind.config.js` anlegen**

Tailwind v4 liest diese Datei für Basis-Konfiguration; der Rest läuft über `@theme` in CSS:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
}
```

---

### Task 1.4: `index.css` komplett ersetzen

- [ ] **`frontend/src/index.css` ersetzen** mit:

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

/* =========================================================
   Catppuccin Tokens
   ========================================================= */

/* Dark — Mocha (default) */
:root {
  color-scheme: dark;

  --bg-base:     #11111b;
  --bg-mantle:   #181825;
  --bg-surface:  #1e1e2e;
  --bg-surface2: #232336;
  --bg-overlay0: #313244;
  --bg-overlay1: #45475a;

  --fg-subtext0: #6c7086;
  --fg-subtext1: #a6adc8;
  --fg-text:     #cdd6f4;

  --accent-blue:   #89b4fa;
  --accent-mauve:  #cba6f7;
  --accent-green:  #a6e3a1;
  --accent-peach:  #fab387;
  --accent-red:    #f38ba8;
  --accent-sky:    #74c7ec;
  --accent-yellow: #f9e2af;

  --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  --border-thin:   1px solid var(--bg-overlay0);
  --border-strong: 1px solid var(--bg-overlay1);

  --shadow-modal:   0 24px 48px -12px rgba(0,0,0,.6), 0 2px 4px rgba(0,0,0,.4);
  --shadow-popover: 0 8px 24px -8px rgba(0,0,0,.5);

  /* Backward-compat aliases — werden in Phase 3/4 entfernt */
  --base:         var(--bg-base);
  --mantle:       var(--bg-mantle);
  --surface:      var(--bg-surface);
  --overlay0:     var(--bg-overlay0);
  --overlay1:     var(--bg-overlay1);
  --overlay2:     #585b70;
  --subtext0:     var(--fg-subtext0);
  --subtext1:     var(--fg-subtext1);
  --text:         var(--fg-text);
  --blue:         var(--accent-blue);
  --red:          var(--accent-red);
  --green:        var(--accent-green);
  --peach:        var(--accent-peach);
  --sky:          var(--accent-sky);
  --mauve:        var(--accent-mauve);
  --red-surface:  #2d1b22;
  --green-surface:#1a2b1a;
  --peach-surface:#2b2418;
  --red-a:        color-mix(in oklch, var(--accent-red) 12%, transparent);
  --green-a:      color-mix(in oklch, var(--accent-green) 12%, transparent);
  --blue-a:       color-mix(in oklch, var(--accent-blue) 12%, transparent);
  --blue-a-sm:    color-mix(in oklch, var(--accent-blue) 8%, transparent);
  --blue-a-lg:    color-mix(in oklch, var(--accent-blue) 30%, transparent);
}

/* Light — Latte */
[data-theme="light"] {
  color-scheme: light;

  --bg-base:     #eff1f5;
  --bg-mantle:   #e6e9ef;
  --bg-surface:  #ffffff;
  --bg-surface2: #dce0e8;
  --bg-overlay0: #ccd0da;
  --bg-overlay1: #bcc0cc;

  --fg-subtext0: #8c8fa1;
  --fg-subtext1: #6c6f85;
  --fg-text:     #4c4f69;

  --accent-blue:   #1e66f5;
  --accent-mauve:  #8839ef;
  --accent-green:  #40a02b;
  --accent-peach:  #fe640b;
  --accent-red:    #d20f39;
  --accent-sky:    #04a5e5;
  --accent-yellow: #df8e1d;

  /* Backward-compat light aliases */
  --base:         var(--bg-base);
  --mantle:       var(--bg-mantle);
  --surface:      var(--bg-surface);
  --overlay0:     var(--bg-overlay0);
  --overlay1:     var(--bg-overlay1);
  --overlay2:     #9ca0b0;
  --subtext0:     var(--fg-subtext0);
  --subtext1:     var(--fg-subtext1);
  --text:         var(--fg-text);
  --blue:         var(--accent-blue);
  --red:          var(--accent-red);
  --green:        var(--accent-green);
  --peach:        var(--accent-peach);
  --sky:          var(--accent-sky);
  --mauve:        var(--accent-mauve);
  --red-surface:  #fce5e8;
  --green-surface:#e5f5e5;
  --peach-surface:#fff3e8;
  --red-a:        color-mix(in oklch, var(--accent-red) 12%, transparent);
  --green-a:      color-mix(in oklch, var(--accent-green) 12%, transparent);
  --blue-a:       color-mix(in oklch, var(--accent-blue) 12%, transparent);
  --blue-a-sm:    color-mix(in oklch, var(--accent-blue) 8%, transparent);
  --blue-a-lg:    color-mix(in oklch, var(--accent-blue) 30%, transparent);
}

/* =========================================================
   Tailwind @theme — mappt CSS-Variablen auf Utility-Klassen
   ========================================================= */

@theme {
  --font-sans: var(--font-display);
  --font-mono: var(--font-mono);

  --color-base:     var(--bg-base);
  --color-mantle:   var(--bg-mantle);
  --color-surface:  var(--bg-surface);
  --color-surface2: var(--bg-surface2);
  --color-overlay0: var(--bg-overlay0);
  --color-overlay1: var(--bg-overlay1);
  --color-subtext0: var(--fg-subtext0);
  --color-subtext1: var(--fg-subtext1);
  --color-text:     var(--fg-text);
  --color-blue:     var(--accent-blue);
  --color-mauve:    var(--accent-mauve);
  --color-green:    var(--accent-green);
  --color-peach:    var(--accent-peach);
  --color-red:      var(--accent-red);
  --color-sky:      var(--accent-sky);
  --color-yellow:   var(--accent-yellow);

  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);
}

/* =========================================================
   Global Resets
   ========================================================= */

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--font-display);
  font-size: 14px;
  line-height: 1.5;
  color: var(--fg-text);
  background: var(--bg-base);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

button { font-family: inherit; }

h1, h2, h3 { line-height: 1.2; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bg-overlay1); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #585b70; }

#root { min-height: 100vh; }

/* Reduzierte Bewegung */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}

/* =========================================================
   Globale Animationen
   ========================================================= */

@keyframes spin        { to { transform: rotate(360deg); } }
@keyframes pulse-soft  { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
@keyframes toast-slide { from { opacity: 0; transform: translateX(1rem); } to { opacity: 1; transform: translateX(0); } }
@keyframes skeleton-shimmer {
  from { background-position: -200px 0; }
  to   { background-position: calc(200px + 100%) 0; }
}
```

---

### Task 1.5: Dev-Server starten und Fonts prüfen

- [ ] **Dev-Server starten**

```bash
cd /Users/larswenner/env-buddy/frontend
npm run dev
```

Erwartetes Ergebnis: Server startet auf `http://localhost:5173` ohne Fehler.

- [ ] **Im Browser prüfen:**
  - Öffne DevTools → Elements → Body → `font-family` muss `Space Grotesk` sein
  - Dark/Light-Toggle testen: `document.documentElement.setAttribute('data-theme', 'light')` in Console → Farben wechseln

---

### Task 1.6: Commit

- [ ] **Commit erstellen**

```bash
cd /Users/larswenner/env-buddy
git add frontend/vite.config.js frontend/src/index.css frontend/tailwind.config.js frontend/package.json frontend/package-lock.json
git commit -m "feat(design): add Tailwind v4, Catppuccin tokens, Space Grotesk + JetBrains Mono"
```

---

## Phase 2 — Layout: Sidebar + Topbar

**Branch:** `design/phase-2-layout`  
**Ziel:** Horizontale Nav durch Sidebar-Nav (240px) + 56px Topbar ersetzen. StartForm in Drawer auslagern.

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/App.css`
- Modify: `frontend/src/pages/DashboardPage.jsx`
- Create: `frontend/src/components/Topbar.jsx`
- Create: `frontend/src/components/Sidebar.jsx`
- Create: `frontend/src/components/StartDrawer.jsx`

---

### Task 2.1: Branch anlegen

- [ ] **Branch erstellen**

```bash
cd /Users/larswenner/env-buddy/frontend
git checkout design/phase-1-tokens  # oder main nach Merge
git checkout -b design/phase-2-layout
```

---

### Task 2.2: `Topbar.jsx` erstellen

- [ ] **`frontend/src/components/Topbar.jsx` anlegen**

```jsx
import { Gauge, Plus, Sun, Moon } from "lucide-react";

const AVATAR_COLORS = ["#89b4fa","#a6e3a1","#fab387","#f38ba8","#cba6f7","#89dceb","#f9e2af"];
function avatarColor(username = "") {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const PAGE_LABELS = {
  dashboard:   "Dashboard",
  templates:   "Templates",
  marketplace: "Marketplace",
  teams:       "Teams",
  audit:       "Audit",
};

export default function Topbar({ user, page, onOpenProfile, onToggleTheme, onOpenDrawer }) {
  const theme = document.documentElement.getAttribute("data-theme") || "dark";
  const initials = ((user.first_name?.[0] || "") + (user.last_name?.[0] || "")).toUpperCase() || "?";
  const color = avatarColor(user.username);

  return (
    <header className="topbar">
      <div className="topbar-logo">
        <span className="topbar-logo-icon">env-buddy</span>
      </div>

      <div className="topbar-breadcrumb">
        <span className="topbar-bc-parent">Dashboard</span>
        {page !== "dashboard" && (
          <>
            <span className="topbar-bc-sep">›</span>
            <span className="topbar-bc-current">{PAGE_LABELS[page] ?? page}</span>
          </>
        )}
      </div>

      <div className="topbar-actions">
        <button className="topbar-cmdk-pill" disabled title="Command Palette (coming soon)">
          <span className="topbar-cmdk-text">Suche</span>
          <kbd className="topbar-cmdk-key">⌘K</kbd>
        </button>

        <button className="topbar-icon-btn" onClick={onToggleTheme} title="Theme wechseln">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button className="topbar-icon-btn" onClick={onOpenDrawer} title="Container starten">
          <Plus size={16} />
        </button>

        <button className="topbar-avatar-btn" onClick={onOpenProfile}>
          <span
            className="topbar-avatar"
            style={{ background: color + "33", border: `1.5px solid ${color}`, color }}
          >
            {initials}
          </span>
        </button>
      </div>
    </header>
  );
}
```

---

### Task 2.3: `Sidebar.jsx` erstellen

- [ ] **`frontend/src/components/Sidebar.jsx` anlegen**

```jsx
import { Gauge, Bookmark, Store, Users, ScrollText } from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard",   label: "Dashboard",   Icon: Gauge },
  { key: "templates",   label: "Templates",   Icon: Bookmark },
  { key: "marketplace", label: "Marketplace", Icon: Store },
  { key: "teams",       label: "Teams",       Icon: Users },
  { key: "audit",       label: "Audit",       Icon: ScrollText },
];

export default function Sidebar({ page, onNavigate }) {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`sidebar-nav-item ${page === key ? "active" : ""}`}
            onClick={() => onNavigate(key)}
          >
            <Icon size={20} strokeWidth={1.75} className="sidebar-nav-icon" />
            <span className="sidebar-nav-label">{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
```

---

### Task 2.4: `StartDrawer.jsx` erstellen

- [ ] **`frontend/src/components/StartDrawer.jsx` anlegen**

```jsx
import { X } from "lucide-react";
import StartForm from "./StartForm";

export default function StartDrawer({ open, onClose, templates, onStarted, prefill, onPrefillConsumed }) {
  if (!open) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-header">
          <span className="drawer-title">Container starten</span>
          <button className="drawer-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="drawer-body">
          {templates.length > 0 && (
            <StartForm
              templates={templates}
              onStarted={() => { onStarted(); onClose(); }}
              prefill={prefill}
              onPrefillConsumed={onPrefillConsumed}
            />
          )}
        </div>
      </aside>
    </>
  );
}
```

---

### Task 2.5: `App.jsx` umbauen

- [ ] **`frontend/src/App.jsx` ersetzen** mit:

```jsx
import { useState, useEffect } from "react";
import { fetchDefaultTemplates, fetchMyTemplates, fetchFavorites, fetchContainers, fetchStacks, fetchTeamTemplates } from "./services/api";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import TemplatesPage from "./pages/TemplatesPage";
import TeamsPage from "./pages/TeamsPage";
import MarketplacePage from "./pages/MarketplacePage";
import AuditPage from "./pages/AuditPage";
import ProfileModal from "./components/ProfileModal";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import StartDrawer from "./components/StartDrawer";
import "./App.css";

const DEFAULT_ICONS = {
  postgres: "🐘", mysql: "🐬", mariadb: "🐬", mongo: "🍃", redis: "⚡",
  cockroachdb: "🪳", neo4j: "🕸️", influxdb: "📈", couchdb: "🛋️", timescaledb: "⏱️",
  elasticsearch: "🔍", cassandra: "💎", rabbitmq: "🐰", kafka: "📨", nats: "🚀", mosquitto: "🦟",
  nginx: "🌐", httpd: "🌐", traefik: "🔀", mailhog: "📬", adminer: "🗄️", minio: "🪣",
  vault: "🔐", keycloak: "🗝️", gitea: "🐱", prometheus: "🔥", grafana: "📊",
  jaeger: "🔭", sonarqube: "🧹", registry: "📦", verdaccio: "📦",
};

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}

export default function App() {
  const [user, setUser] = useState(getStoredUser);
  const [profileOpen, setProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [containers, setContainers] = useState([]);
  const [stacks, setStacks] = useState([]);
  const [startFormTemplates, setStartFormTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clonePrefill, setClonePrefill] = useState(null);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  function handleToggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    const updated = { ...user, theme: next };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  }

  async function loadStartFormTemplates() {
    try {
      const defaults = await fetchDefaultTemplates();
      const defaultMap = Object.fromEntries(
        defaults.map((k) => [k, { key: k, label: k, icon: DEFAULT_ICONS[k] || "📦" }])
      );
      let customs = [], teamTpls = [], favKeys = [];
      try {
        [customs, teamTpls, favKeys] = await Promise.all([fetchMyTemplates(), fetchTeamTemplates(), fetchFavorites()]);
      } catch (authErr) {
        if (authErr.message?.includes("401") || authErr.message?.includes("Ungültiger")) { handleLogout(); return; }
      }
      const customMap = Object.fromEntries(customs.map((t) => [`custom:${t.id}`, { key: `custom:${t.id}`, label: t.name, icon: t.icon, containers: t.containers }]));
      const teamMap = Object.fromEntries(teamTpls.map((t) => [`team:${t.id}`, { key: `team:${t.id}`, label: t.name, icon: t.icon, containers: t.containers }]));
      const allMap = { ...defaultMap, ...customMap, ...teamMap };
      setStartFormTemplates(favKeys.length > 0 ? favKeys.map((k) => allMap[k]).filter(Boolean) : Object.values(defaultMap));
    } catch {
      setError("Backend nicht erreichbar");
    }
  }

  async function loadAll() {
    try {
      const [data, stackData] = await Promise.all([fetchContainers(), fetchStacks()]);
      setContainers(data);
      setStacks(stackData);
      setLoading(false);
    } catch { setLoading(false); }
  }

  useEffect(() => {
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", user?.theme || "dark");
  }, [user?.theme]);

  useEffect(() => {
    const running = [
      ...containers.filter((c) => c.status === "running"),
      ...stacks.flatMap((s) => s.containers).filter((c) => c.status === "running"),
    ].length;
    document.title = running > 0 ? `(${running}) env-buddy` : "env-buddy";
  }, [containers, stacks]);

  useEffect(() => { if (user) { loadStartFormTemplates(); } }, [user]);
  useEffect(() => {
    if (!user) return;
    loadAll();
    const interval = setInterval(loadAll, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return <AuthPage onAuth={(u) => setUser(u)} />;

  function handleNavigate(target) {
    setPage(target);
    if (target === "templates") loadStartFormTemplates();
  }

  return (
    <div className="app">
      <Topbar
        user={user}
        page={page}
        onOpenProfile={() => setProfileOpen(true)}
        onToggleTheme={handleToggleTheme}
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      <div className="app-body">
        <Sidebar page={page} onNavigate={handleNavigate} />

        <main className="app-content">
          {error && <div className="error-banner">Backend nicht erreichbar — läuft auf http://localhost:8000?</div>}

          {page === "templates"   && <TemplatesPage />}
          {page === "teams"       && <TeamsPage user={user} />}
          {page === "marketplace" && <MarketplacePage user={user} />}
          {page === "audit"       && <AuditPage />}
          {page === "dashboard"   && (
            <DashboardPage
              containers={containers}
              stacks={stacks}
              loading={loading}
              onStarted={loadAll}
              onStopped={loadAll}
              onRemoved={(id) => setContainers((prev) => prev.filter((c) => c.id !== id))}
              onStackStopped={(stackId) => { setStacks((prev) => prev.filter((s) => s.stack_id !== stackId)); loadAll(); }}
              onOpenDrawer={() => setDrawerOpen(true)}
              onClone={(config) => { setClonePrefill(config); setDrawerOpen(true); }}
            />
          )}
        </main>
      </div>

      <StartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        templates={startFormTemplates}
        onStarted={loadAll}
        prefill={clonePrefill}
        onPrefillConsumed={() => setClonePrefill(null)}
      />

      {profileOpen && (
        <ProfileModal
          user={user}
          onClose={() => setProfileOpen(false)}
          onUpdate={(updated) => {
            const newUser = { ...user, ...updated };
            setUser(newUser);
            localStorage.setItem("user", JSON.stringify(newUser));
          }}
        />
      )}
    </div>
  );
}
```

---

### Task 2.6: `DashboardPage.jsx` anpassen

- [ ] **Props-Signatur ändern** — oben in der Komponente:

```jsx
// ALT:
export default function DashboardPage({
  containers, stacks, loading, startFormTemplates,
  onStarted, onStopped, onRemoved, onStackStopped,
}) {

// NEU:
export default function DashboardPage({
  containers, stacks, loading,
  onStarted, onStopped, onRemoved, onStackStopped,
  onOpenDrawer, onClone,
}) {
```

- [ ] **`clonePrefill`-State und `setClonePrefill` aus DashboardPage entfernen** (liegt jetzt in App.jsx).  
  Ersetze in der ContainerCard-Zeile: `onClone={setClonePrefill}` → `onClone={onClone}`

- [ ] **Den kompletten `return`-Block ersetzen** — äußerer `<main className="app-main">` + `<aside>` weg, alles in `<div className="dashboard-page">`:

```jsx
return (
  <div className="dashboard-page">
    {/* Content Header */}
    <div className="content-header">
      <h2 className="content-title">Container</h2>
      <span className="container-count">
        {filtered.length + filteredStacks.length} / {containers.length + stacks.length}
      </span>
      {stoppedContainers.length > 0 && (
        <button className="btn-start-all" onClick={handleStartAll} disabled={startingAll}>
          {startingAll ? "…" : `▶ Alle starten (${stoppedContainers.length})`}
        </button>
      )}
      <button className="btn-open-drawer" onClick={onOpenDrawer}>
        + Starten
      </button>
    </div>

    {/* DashboardStats — unverändert */}
    {!loading && (containers.length > 0 || stacks.length > 0) && (
      <DashboardStats containers={containers} stacks={stacks} systemTotalRamMb={systemTotalRamMb} maxContainers={maxContainers} />
    )}

    {/* Toolbar — KOMPLETT aus bestehendem DashboardPage.jsx übernehmen, Zeilen 173–225 */}
    <div className="toolbar">
      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input className="search-input" type="text" placeholder="Container suchen..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && <button className="search-clear" onClick={() => setSearch("")}>✕</button>}
      </div>
      <div className="filter-group">
        <span className="filter-label">Template:</span>
        {templateFilterOptions.map((t) => (
          <button key={t} className={`filter-btn ${activeTemplate === t ? "active" : ""}`} onClick={() => setActiveTemplate(t)}>{t}</button>
        ))}
      </div>
      <div className="filter-group">
        <span className="filter-label">Status:</span>
        {STATUS_FILTERS.map((s) => (
          <button key={s} className={`filter-btn filter-status-${s} ${activeStatus === s ? "active" : ""}`} onClick={() => setActiveStatus(s)}>{s}</button>
        ))}
      </div>
      <button className={`btn-view-toggle ${selectMode ? "active" : ""}`} onClick={toggleSelectMode}>
        {selectMode ? "✕ Abbrechen" : "Auswählen"}
      </button>
      <div className="view-toggle">
        <button className={`view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")} title="Kachelansicht">⊞</button>
        <button className={`view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")} title="Listenansicht">☰</button>
      </div>
    </div>

    {/* Grid/List/Empty — KOMPLETT aus bestehendem DashboardPage.jsx übernehmen, Zeilen 227–271 */}
    {loading ? (
      <div className="loading-spinner-wrap"><span className="loading-spinner" /></div>
    ) : containers.length === 0 && stacks.length === 0 ? (
      <div className="empty-state">
        <EmptyIcon />
        <p className="empty-state-title">Noch keine Container</p>
        <p className="empty-state-sub">Drücke <kbd>⌘K</kbd> oder klicke auf „+ Starten".</p>
      </div>
    ) : filtered.length === 0 && filteredStacks.length === 0 ? (
      <div className="empty-state">
        <EmptyIcon />
        <p className="empty-state-title">Keine Treffer</p>
        <p className="empty-state-sub">Kein Container passt zu den aktiven Filtern.</p>
      </div>
    ) : (
      <>
        {filteredStacks.length > 0 && (
          <div className="section-block">
            <div className="section-label">Stacks <span className="section-count">{filteredStacks.length}</span></div>
            <div className={`container-grid ${viewMode === "list" ? "grid-list" : ""}`}>
              {filteredStacks.map((s) => (
                <StackCard key={s.stack_id} stack={s} onStopped={onStackStopped} viewMode={viewMode} />
              ))}
            </div>
          </div>
        )}
        {filteredStacks.length > 0 && filtered.length > 0 && <hr className="section-divider" />}
        {filtered.length > 0 && (
          <div className="section-block">
            <div className="section-label">Container <span className="section-count">{filtered.length}</span></div>
            <div className={`container-grid ${viewMode === "list" ? "grid-list" : ""}`}>
              {filtered.map((c) => (
                <ContainerCard key={c.id} container={c} onStopped={onStopped} onRemoved={onRemoved}
                  viewMode={viewMode} selectMode={selectMode} isSelected={selected.has(c.id)}
                  onToggleSelect={toggleSelect} onClone={onClone} />
              ))}
            </div>
          </div>
        )}
      </>
    )}

    {/* Bulk Bar */}
    {selectMode && (
      <div className="bulk-bar">
        <span style={{ color: "var(--fg-subtext0)", fontSize: "13px", marginRight: "4px" }}>{selected.size} ausgewählt</span>
        <button className="btn-sm btn-destructive" disabled={bulkWorking || selected.size === 0} onClick={handleBulkStop}>⏹ Stoppen</button>
        <button className="btn-sm btn-destructive" disabled={bulkWorking || selected.size === 0} onClick={handleBulkRemove}>🗑 Löschen</button>
        <button className="btn-sm btn-default" disabled={bulkWorking} onClick={handleCleanupExited} style={{ marginLeft: "auto" }}>🧹 Exited aufräumen</button>
      </div>
    )}
  </div>
);
```

**Hinweis:** Die `EmptyIcon`-Komponente aus Task 2.8 muss am Anfang der Datei definiert sein (vor dem `export default`).

---

### Task 2.7: `App.css` ersetzen

- [ ] **`frontend/src/App.css` ersetzen** mit:

```css
/* === App Shell === */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);
  color: var(--fg-text);
}

/* === Topbar === */
.topbar {
  height: 56px;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: 0 var(--space-5);
  background: var(--bg-mantle);
  border-bottom: var(--border-thin);
  flex-shrink: 0;
  z-index: 50;
}

.topbar-logo-icon {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  color: var(--accent-blue);
  letter-spacing: -0.02em;
}

.topbar-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 13px;
}

.topbar-bc-parent  { color: var(--fg-subtext0); }
.topbar-bc-sep     { color: var(--bg-overlay1); }
.topbar-bc-current { color: var(--fg-text); font-weight: 500; }

.topbar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.topbar-cmdk-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--bg-surface2);
  border: var(--border-thin);
  border-radius: var(--radius-md);
  padding: 5px 10px;
  color: var(--fg-subtext0);
  font-size: 12px;
  font-family: var(--font-display);
  cursor: default;
  transition: border-color 0.12s;
}
.topbar-cmdk-pill:hover { border-color: var(--bg-overlay1); }

.topbar-cmdk-key {
  font-family: var(--font-mono);
  font-size: 10px;
  background: var(--bg-overlay0);
  border-radius: 3px;
  padding: 1px 4px;
  color: var(--fg-subtext1);
}

.topbar-icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--fg-subtext1);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.topbar-icon-btn:hover { background: var(--bg-surface2); color: var(--fg-text); }

.topbar-avatar-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 50%;
  transition: opacity 0.12s;
}
.topbar-avatar-btn:hover { opacity: 0.8; }

.topbar-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-display);
}

/* === App Body === */
.app-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* === Sidebar === */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--bg-mantle);
  border-right: var(--border-thin);
  display: flex;
  flex-direction: column;
  padding: var(--space-3) 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 var(--space-2);
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 40px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--fg-subtext0);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s, color 0.12s;
  position: relative;
}
.sidebar-nav-item:hover {
  background: var(--bg-surface2);
  color: var(--fg-text);
}
.sidebar-nav-item.active {
  background: var(--bg-surface);
  color: var(--fg-text);
  box-shadow: inset 2px 0 0 var(--accent-blue);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  padding-left: calc(var(--space-3) - 2px);
  margin-left: 0;
}
.sidebar-nav-icon { flex-shrink: 0; }
.sidebar-nav-label { flex: 1; }

/* === App Content === */
.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-base);
}

/* === Dashboard Page === */
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  max-width: 1200px;
  width: 100%;
}

/* === Error Banner === */
.error-banner {
  background: color-mix(in oklch, var(--accent-red) 12%, transparent);
  border-bottom: 1px solid var(--accent-red);
  color: var(--accent-red);
  padding: var(--space-3) var(--space-5);
  font-size: 13px;
}

/* === Content Header === */
.content-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.content-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--fg-text);
}

/* === Drawer === */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17,17,27,.5);
  z-index: 90;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  background: var(--bg-surface);
  border-left: var(--border-thin);
  box-shadow: var(--shadow-popover);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 var(--space-5);
  border-bottom: var(--border-thin);
  flex-shrink: 0;
}

.drawer-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--fg-text);
}

.drawer-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--fg-subtext1);
  cursor: pointer;
  transition: background 0.12s;
}
.drawer-close:hover { background: var(--bg-surface2); color: var(--fg-text); }

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

/* === Buttons (global) === */
.btn-start-all {
  background: transparent;
  border: 1px solid var(--accent-green);
  border-radius: var(--radius-md);
  color: var(--accent-green);
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-display);
  padding: 5px 12px;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-start-all:hover { background: color-mix(in oklch, var(--accent-green) 12%, transparent); }
.btn-start-all:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-open-drawer {
  margin-left: auto;
  background: var(--accent-blue);
  border: none;
  border-radius: var(--radius-md);
  color: var(--bg-base);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-display);
  padding: 6px 14px;
  cursor: pointer;
  transition: opacity 0.12s;
}
.btn-open-drawer:hover { opacity: 0.88; }

.container-count {
  background: var(--bg-overlay0);
  color: var(--fg-subtext1);
  border-radius: 99px;
  padding: 2px 8px;
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: 500;
}

/* === Loading / Empty === */
.loading-spinner-wrap {
  display: flex;
  justify-content: center;
  padding: var(--space-8) var(--space-5);
}
.loading-spinner {
  width: 28px;
  height: 28px;
  border: 2px solid var(--bg-overlay0);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Toolbar, Filter, Grid — aus bisherigem App.css übernommen, Token-Namen schon ok durch Aliases */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  background: var(--bg-surface);
  border: var(--border-thin);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
}

.search-wrapper {
  display: flex;
  align-items: center;
  background: var(--bg-mantle);
  border: var(--border-strong);
  border-radius: var(--radius-md);
  padding: 0 var(--space-2);
  gap: var(--space-2);
  min-width: 180px;
  flex: 1;
  max-width: 300px;
  height: 32px;
}
.search-wrapper:focus-within { border-color: var(--accent-blue); }
.search-icon { font-size: 12px; flex-shrink: 0; color: var(--fg-subtext0); }
.search-input {
  background: transparent;
  border: none;
  color: var(--fg-text);
  font-size: 13px;
  font-family: var(--font-display);
  flex: 1;
  outline: none;
  padding: 0;
}
.search-input::placeholder { color: var(--fg-subtext0); }
.search-clear { background: transparent; border: none; color: var(--fg-subtext0); cursor: pointer; font-size: 11px; padding: 0; }
.search-clear:hover { color: var(--fg-text); }

.filter-group { display: flex; align-items: center; gap: var(--space-1); flex-wrap: nowrap; overflow-x: auto; }
.filter-label { font-size: 11px; color: var(--fg-subtext0); flex-shrink: 0; }
.filter-btn {
  background: var(--bg-mantle);
  border: var(--border-thin);
  border-radius: var(--radius-sm);
  color: var(--fg-subtext1);
  font-size: 11px;
  font-family: var(--font-display);
  padding: 3px 8px;
  cursor: pointer;
  transition: all 0.12s;
  text-transform: capitalize;
  flex-shrink: 0;
  height: 24px;
}
.filter-btn:hover { border-color: var(--bg-overlay1); color: var(--fg-text); }
.filter-btn.active { background: var(--bg-overlay0); border-color: var(--accent-blue); color: var(--accent-blue); }
.filter-status-running.active { border-color: var(--accent-green); color: var(--accent-green); }
.filter-status-paused.active  { border-color: var(--accent-peach);  color: var(--accent-peach); }
.filter-status-exited.active  { border-color: var(--accent-red);    color: var(--accent-red); }

.view-toggle { display: flex; background: var(--bg-mantle); border: var(--border-strong); border-radius: var(--radius-md); padding: 3px; }
.view-btn { background: transparent; border: none; border-radius: var(--radius-sm); color: var(--fg-subtext0); padding: 3px 8px; font-size: 14px; cursor: pointer; transition: background 0.12s, color 0.12s; }
.view-btn.active { background: var(--bg-overlay0); color: var(--fg-text); }
.btn-view-toggle { background: var(--bg-mantle); border: var(--border-thin); border-radius: var(--radius-md); color: var(--fg-subtext1); font-size: 12px; padding: 4px 10px; cursor: pointer; }
.btn-view-toggle.active { background: var(--bg-overlay0); color: var(--fg-text); }

.container-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); }
.container-grid.grid-list { display: flex; flex-direction: column; gap: var(--space-1); }

.section-block { display: flex; flex-direction: column; gap: var(--space-3); }
.section-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--fg-subtext0);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.section-count { background: var(--bg-overlay0); color: var(--fg-subtext1); border-radius: 99px; padding: 1px 6px; font-size: 10px; }
.section-divider { border: none; border-top: var(--border-thin); margin: 0; }

/* Empty State */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-3); padding: var(--space-8) var(--space-5); text-align: center; }
.empty-state-icon { opacity: 0.35; }
.empty-state-title { margin: 0; font-size: 20px; font-weight: 600; color: var(--fg-subtext0); }
.empty-state-sub { margin: 0; font-size: 13px; color: var(--fg-subtext0); max-width: 320px; }

/* Bulk Bar */
.bulk-bar {
  position: fixed; bottom: 0; left: 240px; right: 0; z-index: 80;
  background: var(--bg-mantle);
  border-top: var(--border-thin);
  padding: var(--space-3) var(--space-5);
  display: flex; gap: var(--space-3); align-items: center;
}
```

---

### Task 2.8: `DashboardPage.jsx` Empty-State Icon aktualisieren

- [ ] **In `DashboardPage.jsx`** die zwei `empty-state` Blöcke anpassen — Emoji `🧪` und `🔍` durch SVG-Ornamente ersetzen:

```jsx
// Leeres SVG-Ornament (kein Emoji)
const EmptyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="empty-state-icon">
    <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4"/>
    <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
  </svg>
);

// Ersetze <span className="empty-state-icon">🧪</span> und <span className="empty-state-icon">🔍</span>
// mit: <EmptyIcon />
```

---

### Task 2.9: Dev-Server starten und Layout prüfen

- [ ] **Dev-Server starten**

```bash
cd /Users/larswenner/env-buddy/frontend
npm run dev
```

- [ ] **Prüfpunkte im Browser:**
  - Sidebar (240px) mit 5 Nav-Items sichtbar
  - Topbar (56px) mit "env-buddy" + Breadcrumb + ⌘K-Pill + Avatar
  - `+`-Button im Topbar öffnet Drawer mit StartForm
  - Dark/Light-Toggle (☀️/🌙) im Topbar funktioniert
  - Alle 5 Nav-Seiten erreichbar
  - Sidebar-Item wird blau highlighted bei aktiver Seite
  - Logout noch funktional (über Profil-Modal)

---

### Task 2.10: Commit

- [ ] **Commit erstellen**

```bash
cd /Users/larswenner/env-buddy
git add frontend/src/App.jsx frontend/src/App.css \
        frontend/src/components/Topbar.jsx \
        frontend/src/components/Sidebar.jsx \
        frontend/src/components/StartDrawer.jsx \
        frontend/src/pages/DashboardPage.jsx
git commit -m "feat(design): sidebar nav + topbar + start-drawer layout"
```

---

## Phase 3 — ContainerCard + Buttons + Badges

**Branch:** `design/phase-3-cards`  
**Ziel:** ContainerCard komplett nach Spec redesignen, Button-Varianten einführen, LIVE-Badge hinzufügen.

**Files:**
- Modify: `frontend/src/components/ContainerCard.jsx`
- Modify: `frontend/src/components/ContainerCard.css`

---

### Task 3.1: Branch anlegen

- [ ] **Branch erstellen**

```bash
cd /Users/larswenner/env-buddy/frontend
git checkout design/phase-2-layout  # oder main nach Merge
git checkout -b design/phase-3-cards
```

---

### Task 3.2: `ContainerCard.css` ersetzen

- [ ] **`frontend/src/components/ContainerCard.css` ersetzen** mit:

```css
/* === ContainerCard — Grid Mode === */
.container-card {
  background: var(--bg-surface);
  border: var(--border-thin);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: border-color 0.12s cubic-bezier(.2,.8,.2,1);
  cursor: pointer;
}
.container-card:hover { border-color: var(--bg-overlay1); }
.container-card.card-stopped { opacity: 0.7; }

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* Status Dot */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot-running {
  background: var(--accent-green);
  box-shadow: 0 0 12px var(--accent-green);
  animation: pulse-soft 2s ease-in-out infinite;
}
.status-dot-stopped,
.status-dot-exited { background: var(--accent-red); }
.status-dot-starting,
.status-dot-pending { background: var(--accent-yellow); }
.status-dot-paused  { background: var(--accent-peach); }

/* Status Label */
.card-status-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.status-running  { color: var(--accent-green); }
.status-stopped,
.status-exited   { color: var(--accent-red); }
.status-starting,
.status-pending  { color: var(--accent-yellow); }
.status-paused   { color: var(--accent-peach); }

.card-image {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-subtext0);
  margin-left: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

/* Timer */
.card-timer {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-subtext0);
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  font-feature-settings: "tnum";
}
.card-timer.expiring {
  color: var(--accent-peach);
  animation: pulse-soft 2s ease-in-out infinite;
}

.card-more {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--fg-subtext0);
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s;
}
.card-more:hover { background: var(--bg-surface2); color: var(--fg-text); }

/* Card Name + Sub */
.card-name {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--fg-text);
  word-break: break-all;
  letter-spacing: -0.01em;
}

.card-sub {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-subtext0);
  display: flex;
  gap: var(--space-2);
  align-items: center;
  margin-top: 3px;
  font-feature-settings: "tnum";
}
.card-sub-sep { color: var(--bg-overlay0); }

/* Stats */
.card-stats {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.stat-lbl {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-subtext0);
  width: 28px;
  flex-shrink: 0;
}

.stat-val {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  width: 44px;
  flex-shrink: 0;
  text-align: right;
  font-feature-settings: "tnum";
}

.stat-sparkline {
  flex: 1;
  min-width: 0;
}

/* Actions Row */
.card-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: var(--border-thin);
}

/* === Buttons (scoped to card) === */
.btn-sm {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s cubic-bezier(.2,.8,.2,1);
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-default {
  background: var(--bg-surface2);
  border: var(--border-thin);
  color: var(--fg-text);
}
.btn-default:not(:disabled):hover { border-color: var(--bg-overlay1); }

.btn-destructive {
  background: transparent;
  border: 1px solid color-mix(in oklch, var(--accent-red) 30%, transparent);
  color: var(--accent-red);
}
.btn-destructive:not(:disabled):hover {
  background: color-mix(in oklch, var(--accent-red) 12%, transparent);
  border-color: var(--accent-red);
}

.btn-ghost {
  background: transparent;
  border: none;
  color: var(--fg-subtext1);
  padding: 0 6px;
}
.btn-ghost:not(:disabled):hover { color: var(--fg-text); background: var(--bg-surface2); border-radius: var(--radius-md); }

.btn-icon-sm {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: var(--border-thin);
  border-radius: var(--radius-md);
  color: var(--fg-subtext1);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  flex-shrink: 0;
}
.btn-icon-sm:hover { background: var(--bg-surface2); color: var(--fg-text); }
.btn-icon-sm:disabled { opacity: 0.4; cursor: not-allowed; }

.card-spacer { flex: 1; }

/* === LIVE Badge === */
.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}
.live-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.live-badge.live {
  background: color-mix(in oklch, var(--accent-green) 12%, transparent);
  color: var(--accent-green);
}
.live-badge.live .live-badge-dot { animation: pulse-soft 1.6s ease-in-out infinite; }
.live-badge.polling {
  background: color-mix(in oklch, var(--accent-yellow) 12%, transparent);
  color: var(--accent-yellow);
}
.live-badge.offline {
  background: color-mix(in oklch, var(--accent-red) 12%, transparent);
  color: var(--accent-red);
}

/* === Confirm Delete inline === */
.confirm-label { font-family: var(--font-mono); font-size: 11px; color: var(--accent-peach); white-space: nowrap; }

/* === ContainerCard — List Row === */
.container-row {
  background: var(--bg-surface);
  border: var(--border-thin);
  border-radius: var(--radius-md);
  height: 48px;
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  transition: border-color 0.12s;
}
.container-row:hover { border-color: var(--bg-overlay1); }
.container-row.card-stopped { opacity: 0.65; }

.row-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.row-status-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  width: 64px;
  flex-shrink: 0;
}
.row-name {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--fg-text);
  min-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-port {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--fg-subtext0);
  flex-shrink: 0;
  font-feature-settings: "tnum";
}
.row-sparkline { flex: 1; min-width: 0; }
.row-cpu-val {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  width: 36px;
  text-align: right;
  flex-shrink: 0;
  font-feature-settings: "tnum";
}
.row-timer {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--fg-subtext0);
  width: 52px;
  text-align: right;
  flex-shrink: 0;
  font-feature-settings: "tnum";
}
.row-timer.expiring { color: var(--accent-peach); animation: pulse-soft 2s ease-in-out infinite; }
.row-started-by { font-size: 11px; color: var(--fg-subtext0); flex-shrink: 0; }
.row-actions { display: flex; align-items: center; gap: var(--space-1); margin-left: auto; flex-shrink: 0; }
```

---

### Task 3.3: `ContainerCard.jsx` ersetzen

- [ ] **`frontend/src/components/ContainerCard.jsx` ersetzen** mit:

```jsx
import { useState, useEffect, useRef } from "react";
import { Square, RotateCcw, TimerReset, Terminal, ScrollText, Trash2, Play, Copy } from "lucide-react";
import { stopContainer, removeContainer, restartContainer, startStoppedContainer, extendContainer, fetchContainerConfig } from "../services/api";
import ContainerEditModal from "./ContainerEditModal";
import ContainerLogsModal from "./ContainerLogsModal";
import { useToast } from "./Toast";
import "./ContainerCard.css";

const EXTEND_MINUTES = [15, 30, 60];
const HISTORY_MAX = 60;

function useStatsHistory(container) {
  const histRef = useRef([]);
  useEffect(() => {
    if (container.status !== "running") return;
    histRef.current = [
      ...histRef.current,
      { cpu: container.cpu_percent ?? 0, ram: container.ram_percent ?? 0 },
    ].slice(-HISTORY_MAX);
  }, [container.cpu_percent, container.ram_percent, container.status]);
  return histRef.current;
}

function Sparkline({ values, color, width = "100%", height = 22 }) {
  if (values.length < 2) return <svg width={width} height={height} />;
  const svgWidth = 120;
  const max = Math.max(...values, 1);
  const step = svgWidth / (HISTORY_MAX - 1);
  const pts = values.map((v, i) => {
    const x = ((HISTORY_MAX - values.length + i) * step).toFixed(1);
    const y = (height - (v / max) * (height - 2) - 1).toFixed(1);
    return `${x},${y}`;
  });
  const polyPts = pts.join(" ");
  const fillPts = `${pts[0].split(",")[0]},${height} ${polyPts} ${pts[pts.length - 1].split(",")[0]},${height}`;
  const fillId = `fill-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${svgWidth} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#${fillId})`} />
      <polyline points={polyPts} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function LiveBadge({ isRunning }) {
  if (!isRunning) return null;
  return (
    <span className="live-badge live">
      <span className="live-badge-dot" />
      LIVE
    </span>
  );
}

function useCountdown(stopsAt) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (!stopsAt) return;
    const update = () => setRemaining(Math.floor((new Date(stopsAt) - Date.now()) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [stopsAt]);
  return remaining;
}

function formatCountdown(seconds) {
  if (seconds == null) return null;
  if (seconds <= 0) return "läuft ab";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

function statusDotClass(status) {
  const map = { running: "status-dot-running", stopped: "status-dot-stopped", exited: "status-dot-exited", starting: "status-dot-starting", pending: "status-dot-pending", paused: "status-dot-paused" };
  return map[status] ?? "status-dot-stopped";
}

export default function ContainerCard({ container, onStopped, onRemoved, viewMode = "grid", selectMode = false, isSelected = false, onToggleSelect, onClone }) {
  const toast = useToast();
  const [acting, setActing] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [extending, setExtending] = useState(false);
  const [cloning, setCloning] = useState(false);

  const isRunning = container.status === "running";
  const remaining = useCountdown(isRunning ? container.stops_at : null);
  const isExpiringSoon = remaining != null && remaining > 0 && remaining <= 300;
  const statsHistory = useStatsHistory(container);

  const templateBase = (container.template || "").split(":")[0].split("/").pop().toLowerCase();

  // CPU color by threshold
  const cpuColor = container.cpu_percent > 80
    ? "var(--accent-red)"
    : container.cpu_percent > 50
    ? "var(--accent-peach)"
    : "var(--accent-green)";
  const ramColor = (container.ram_percent ?? 0) > 80
    ? "var(--accent-red)"
    : (container.ram_percent ?? 0) > 50
    ? "var(--accent-peach)"
    : "var(--accent-sky)";

  useEffect(() => {
    if (!extendOpen) return;
    const close = () => setExtendOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [extendOpen]);

  async function handleStop(e) {
    e.stopPropagation();
    setActing(true);
    try { await stopContainer(container.id); onStopped(); }
    catch (err) { toast.error("Fehler beim Stoppen: " + err.message); }
    finally { setActing(false); }
  }

  async function handleStart(e) {
    e.stopPropagation();
    setActing(true);
    try { await startStoppedContainer(container.id); onStopped(); }
    catch (err) { toast.error("Fehler beim Starten: " + err.message); }
    finally { setActing(false); }
  }

  async function handleRestart(e) {
    e.stopPropagation();
    setRestarting(true);
    try { await restartContainer(container.id); }
    catch (err) { toast.error("Fehler beim Neustart: " + err.message); }
    finally { setRestarting(false); }
  }

  async function handleExtend(e, minutes) {
    e.stopPropagation();
    setExtending(true);
    try {
      await extendContainer(container.id, minutes);
      setExtendOpen(false);
      onStopped();
      toast.success(`+${minutes} Min. hinzugefügt`);
    } catch (err) { toast.error("Fehler: " + err.message); }
    finally { setExtending(false); }
  }

  async function handleClone(e) {
    e.stopPropagation();
    setCloning(true);
    try { const config = await fetchContainerConfig(container.id); onClone?.(config); }
    catch (err) { toast.error("Fehler beim Klonen: " + err.message); }
    finally { setCloning(false); }
  }

  async function handleRemove(e) {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try { await removeContainer(container.id); onRemoved(container.id); }
    catch (err) { toast.error("Fehler beim Löschen: " + err.message); }
    finally { setConfirmDelete(false); }
  }

  // === LIST MODE ===
  if (viewMode === "list") {
    return (
      <>
        <div
          className={`container-row ${!isRunning ? "card-stopped" : ""}`}
          onClick={() => selectMode ? onToggleSelect(container.id) : setEditOpen(true)}
        >
          <span className={`row-status-dot status-dot ${statusDotClass(container.status)}`} />
          <span className={`row-status-label status-${container.status}`}>{container.status}</span>
          <span className="row-name">{container.name}</span>
          {container.port && <span className="row-port">:{container.port}</span>}
          <div className="row-sparkline">
            {isRunning && statsHistory.length >= 2 && (
              <Sparkline values={statsHistory.map(p => p.cpu)} color="var(--accent-green)" height={16} />
            )}
          </div>
          {isRunning && (
            <span className="row-cpu-val" style={{ color: cpuColor }}>{container.cpu_percent}%</span>
          )}
          {isRunning && remaining != null && (
            <span className={`row-timer ${isExpiringSoon ? "expiring" : ""}`}>{formatCountdown(remaining)}</span>
          )}
          {container.started_by && <span className="row-started-by">{container.started_by}</span>}
          {selectMode && (
            <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(container.id)} onClick={e => e.stopPropagation()} style={{ accentColor: "var(--accent-blue)" }} />
          )}
          <div className="row-actions" onClick={e => e.stopPropagation()}>
            <button className="btn-icon-sm" onClick={e => { e.stopPropagation(); setLogsOpen(true); }} title="Logs">
              <ScrollText size={14} strokeWidth={1.75} />
            </button>
            {isRunning
              ? <button className="btn-icon-sm btn-destructive" onClick={handleStop} disabled={acting} title="Stop"><Square size={14} strokeWidth={1.75} /></button>
              : <button className="btn-icon-sm" onClick={handleStart} disabled={acting} title="Start" style={{ color: "var(--accent-green)", borderColor: "color-mix(in oklch, var(--accent-green) 30%, transparent)" }}><Play size={14} strokeWidth={1.75} /></button>
            }
            {confirmDelete ? (
              <>
                <span className="confirm-label">Sicher?</span>
                <button className="btn-icon-sm" onClick={handleRemove} style={{ color: "var(--accent-green)" }}>✓</button>
                <button className="btn-icon-sm" onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}>✕</button>
              </>
            ) : (
              <button className="btn-icon-sm" onClick={handleRemove} title="Löschen" style={{ color: "var(--accent-red)", borderColor: "color-mix(in oklch, var(--accent-red) 30%, transparent)" }}>
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
        {editOpen && <ContainerEditModal containerId={container.id} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); onStopped(); }} />}
        {logsOpen && <ContainerLogsModal containerId={container.id} containerName={container.name} isRunning={isRunning} onClose={() => setLogsOpen(false)} />}
      </>
    );
  }

  // === GRID MODE ===
  return (
    <>
      <div
        className={`container-card ${!isRunning ? "card-stopped" : ""}`}
        onClick={() => selectMode ? onToggleSelect(container.id) : setEditOpen(true)}
      >
        {/* Header */}
        <div className="card-header">
          <span className={`status-dot ${statusDotClass(container.status)}`} />
          <span className={`card-status-label status-${container.status}`}>{container.status}</span>
          <span className="card-image">{templateBase || container.template}</span>
          {isRunning && remaining != null && (
            <span className={`card-timer ${isExpiringSoon ? "expiring" : ""}`}>⌄ {formatCountdown(remaining)}</span>
          )}
          {selectMode && (
            <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(container.id)} onClick={e => e.stopPropagation()} style={{ accentColor: "var(--accent-blue)", marginLeft: "auto" }} />
          )}
          <button className="card-more" onClick={e => e.stopPropagation()} title="Mehr Aktionen">⋮</button>
        </div>

        {/* Name + Sub */}
        <div>
          <div className="card-name">{container.name}</div>
          <div className="card-sub">
            {container.id && <span>{container.id.slice(0, 12)}…</span>}
            {container.port && <><span className="card-sub-sep">·</span><span>:{container.port}</span></>}
            {container.started_by && <><span className="card-sub-sep">·</span><span>{container.started_by}</span></>}
          </div>
        </div>

        {/* Stats */}
        {isRunning && (
          <div className="card-stats">
            <div className="stat-row">
              <span className="stat-lbl">CPU</span>
              <span className="stat-val" style={{ color: cpuColor }}>{container.cpu_percent}%</span>
              <div className="stat-sparkline">
                <Sparkline values={statsHistory.map(p => p.cpu)} color="var(--accent-green)" />
              </div>
            </div>
            <div className="stat-row">
              <span className="stat-lbl">RAM</span>
              <span className="stat-val" style={{ color: ramColor }}>{container.ram_mb}MB</span>
              <div className="stat-sparkline">
                <Sparkline values={statsHistory.map(p => p.ram)} color="var(--accent-sky)" />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="card-actions" onClick={e => e.stopPropagation()}>
          {isRunning ? (
            <button className="btn-sm btn-destructive" onClick={handleStop} disabled={acting}>
              <Square size={12} strokeWidth={2} /> Stop
            </button>
          ) : (
            <button className="btn-sm btn-default" onClick={handleStart} disabled={acting} style={{ color: "var(--accent-green)" }}>
              <Play size={12} strokeWidth={2} /> Starten
            </button>
          )}

          {isRunning && (
            <div style={{ position: "relative" }}>
              <button className="btn-sm btn-default" onClick={e => { e.stopPropagation(); setExtendOpen(o => !o); }} disabled={extending} style={isExpiringSoon ? { color: "var(--accent-peach)", borderColor: "color-mix(in oklch, var(--accent-peach) 40%, transparent)" } : {}}>
                <TimerReset size={12} strokeWidth={1.75} /> Verlängern
              </button>
              {extendOpen && (
                <div style={{ position: "absolute", top: "110%", left: 0, zIndex: 100, background: "var(--bg-surface2)", border: "var(--border-thin)", borderRadius: "var(--radius-md)", padding: "var(--space-1)", display: "flex", flexDirection: "column", gap: 2, minWidth: "7rem", boxShadow: "var(--shadow-popover)" }} onClick={e => e.stopPropagation()}>
                  {EXTEND_MINUTES.map(m => (
                    <button key={m} className="btn-sm btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={e => handleExtend(e, m)} disabled={extending}>+{m} Min.</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {isRunning && (
            <button className="btn-icon-sm btn-ghost" onClick={e => { e.stopPropagation(); setLogsOpen(true); }} title="Logs">
              <ScrollText size={14} strokeWidth={1.75} />
            </button>
          )}

          {onClone && isRunning && (
            <button className="btn-icon-sm btn-ghost" onClick={handleClone} disabled={cloning} title="Klonen">
              <Copy size={14} strokeWidth={1.75} />
            </button>
          )}

          <span className="card-spacer" />

          {isRunning && <LiveBadge isRunning />}

          {!isRunning && (
            confirmDelete ? (
              <>
                <span className="confirm-label">Sicher?</span>
                <button className="btn-sm btn-ghost" onClick={handleRemove} style={{ color: "var(--accent-green)" }}>✓</button>
                <button className="btn-sm btn-ghost" onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}>✕</button>
              </>
            ) : (
              <button className="btn-sm btn-destructive" onClick={handleRemove} title="Löschen">
                <Trash2 size={12} strokeWidth={1.75} /> Löschen
              </button>
            )
          )}
        </div>
      </div>

      {editOpen && <ContainerEditModal containerId={container.id} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); onStopped(); }} />}
      {logsOpen && <ContainerLogsModal containerId={container.id} containerName={container.name} isRunning={isRunning} onClose={() => setLogsOpen(false)} />}
    </>
  );
}
```

---

### Task 3.4: Dev-Server starten und ContainerCard prüfen

- [ ] **Dev-Server starten**

```bash
cd /Users/larswenner/env-buddy/frontend
npm run dev
```

- [ ] **Prüfpunkte:**
  - Running-Container: Grüner Pulse-Dot mit Glow sichtbar
  - Sparklines rendern mit Fläche darunter
  - Timer bei < 5 min in Peach-Farbe pulsierend
  - `LIVE`-Badge rechts in Actions-Row
  - Stopped-Container: ausgegraut, kein Stats-Block
  - Verlängern-Dropdown öffnet sich
  - List-Mode: 48px Zeilen mit Inline-Sparkline

---

### Task 3.5: Commit

- [ ] **Commit erstellen**

```bash
cd /Users/larswenner/env-buddy
git add frontend/src/components/ContainerCard.jsx frontend/src/components/ContainerCard.css
git commit -m "feat(design): ContainerCard redesign — status dot, sparklines, LIVE badge, btn variants"
```

---

## Phase 4 — Restliche Komponenten

**Branch:** `design/phase-4-components`  
**Ziel:** Toast, Modal, und verbliebene Component-CSS auf neue Tokens migrieren. Aliases aus index.css entfernen.

**Files:**
- Modify: `frontend/src/components/Toast.jsx`
- Modify: `frontend/src/components/Toast.css`
- Modify: `frontend/src/components/ContainerLogsModal.css`
- Modify: `frontend/src/components/ContainerEditModal.css`
- Modify: `frontend/src/components/ProfileModal.css`
- Modify: `frontend/src/components/StartForm.css`
- Modify: `frontend/src/pages/AuthPage.css`
- Modify: `frontend/src/pages/TemplatesPage.css`
- Modify: `frontend/src/pages/MarketplacePage.css`
- Modify: `frontend/src/pages/TeamsPage.css`
- Modify: `frontend/src/pages/AuditPage.css`
- Modify: `frontend/src/components/DashboardStats.css`
- Modify: `frontend/src/index.css` (Backward-Compat-Aliases entfernen)

---

### Task 4.1: Branch anlegen

- [ ] **Branch erstellen**

```bash
cd /Users/larswenner/env-buddy/frontend
git checkout design/phase-3-cards  # oder main nach Merge
git checkout -b design/phase-4-components
```

---

### Task 4.2: Toast umbauen

- [ ] **`frontend/src/components/Toast.jsx` — `dismiss`-Timeout nach Typ differenzieren**

Ersetze den `toast`-Callback:

```jsx
const toast = useCallback((message, type = "error", opts = {}) => {
  const id = ++_id;
  setToasts((prev) => [...prev.slice(-2), { id, message, type, action: opts.action }]);
  const delay = opts.persistent ? null : (type === "success" ? 4000 : type === "warning" ? 5000 : 6000);
  if (delay) setTimeout(() => dismiss(id), delay);
}, [dismiss]);

toast.error   = (msg, opts) => toast(msg, "error", opts);
toast.success = (msg, opts) => toast(msg, "success", opts);
toast.warning = (msg, opts) => toast(msg, "warning", opts);
toast.info    = (msg, opts) => toast(msg, "info", opts);
```

- [ ] **JSX des einzelnen Toasts ersetzen:**

```jsx
<div
  key={t.id}
  className={`toast toast-${t.type}`}
  onMouseEnter={() => {/* pause: optional */}}
>
  <span className={`toast-strip toast-strip-${t.type}`} />
  <div className="toast-body">
    <span className="toast-msg">{t.message}</span>
    {t.action && (
      <button className="toast-action" onClick={() => { t.action.fn(); dismiss(t.id); }}>
        {t.action.label}
      </button>
    )}
  </div>
  <button className="toast-close" onClick={() => dismiss(t.id)}>
    <X size={12} />
  </button>
</div>
```

Füge oben hinzu: `import { X } from "lucide-react";`

- [ ] **`frontend/src/components/Toast.css` ersetzen** mit:

```css
.toast-container {
  position: fixed;
  bottom: var(--space-5);
  right: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  z-index: 1000;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: stretch;
  width: 320px;
  background: var(--bg-surface);
  border: var(--border-thin);
  border-radius: var(--radius-md);
  overflow: hidden;
  pointer-events: all;
  animation: toast-slide 0.18s cubic-bezier(.2,.8,.2,1);
  box-shadow: var(--shadow-popover);
}

.toast-strip {
  width: 4px;
  flex-shrink: 0;
}
.toast-strip-success { background: var(--accent-green); }
.toast-strip-error   { background: var(--accent-red); }
.toast-strip-warning { background: var(--accent-peach); }
.toast-strip-info    { background: var(--accent-blue); }

.toast-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: var(--space-3) var(--space-3);
  min-width: 0;
}

.toast-msg {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 500;
  color: var(--fg-text);
  line-height: 1.4;
}

.toast-action {
  background: transparent;
  border: var(--border-thin);
  border-radius: var(--radius-sm);
  color: var(--accent-blue);
  font-size: 12px;
  font-family: var(--font-display);
  padding: 2px 8px;
  cursor: pointer;
  align-self: flex-start;
  margin-top: 2px;
}
.toast-action:hover { background: var(--bg-surface2); }

.toast-close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--fg-subtext0);
  padding: var(--space-3) var(--space-3);
  display: flex;
  align-items: center;
  transition: color 0.12s;
  flex-shrink: 0;
}
.toast-close:hover { color: var(--fg-text); }
```

---

### Task 4.3: Modal-CSS vereinheitlichen

Für jede Modal-CSS-Datei: Suche nach alten Token-Namen (`var(--surface`, `var(--overlay`, `var(--text`, `var(--blue`, `var(--red`, `var(--green`, `var(--peach`, `var(--subtext`) und ersetze sie durch neue Namen. Die Backward-Compat-Aliases aus Phase 1 decken das ab — dieser Task macht es explizit sauber.

- [ ] **Globaler Token-Rename in allen `.css`-Dateien unter `src/`**

Führe die folgenden Ersetzungen in **allen** CSS-Dateien (außer `index.css`) durch:

```
var(--base)     → var(--bg-base)
var(--mantle)   → var(--bg-mantle)
var(--surface)  → var(--bg-surface)   (Vorsicht: nur wenn nicht "surface1" oder andere)
var(--overlay0) → var(--bg-overlay0)
var(--overlay1) → var(--bg-overlay1)
var(--overlay2) → #585b70
var(--subtext0) → var(--fg-subtext0)
var(--subtext1) → var(--fg-subtext1)
var(--text)     → var(--fg-text)
var(--blue)     → var(--accent-blue)
var(--red)      → var(--accent-red)
var(--green)    → var(--accent-green)
var(--peach)    → var(--accent-peach)
var(--sky)      → var(--accent-sky)
var(--mauve)    → var(--accent-mauve)
```

Bash-Befehl für alle CSS-Dateien auf einmal:

```bash
cd /Users/larswenner/env-buddy/frontend/src
# Jeweils einzeln ausführen und danach prüfen:
find . -name "*.css" ! -name "index.css" | xargs sed -i '' \
  -e 's/var(--base)/var(--bg-base)/g' \
  -e 's/var(--mantle)/var(--bg-mantle)/g' \
  -e 's/var(--overlay0)/var(--bg-overlay0)/g' \
  -e 's/var(--overlay1)/var(--bg-overlay1)/g' \
  -e 's/var(--subtext0)/var(--fg-subtext0)/g' \
  -e 's/var(--subtext1)/var(--fg-subtext1)/g' \
  -e 's/var(--text))/var(--fg-text))/g' \
  -e 's/var(--blue)/var(--accent-blue)/g' \
  -e 's/var(--red)/var(--accent-red)/g' \
  -e 's/var(--green)/var(--accent-green)/g' \
  -e 's/var(--peach)/var(--accent-peach)/g' \
  -e 's/var(--sky)/var(--accent-sky)/g' \
  -e 's/var(--mauve)/var(--accent-mauve)/g'
```

**Achtung:** `var(--surface)` und `var(--text)` vorsichtig prüfen — nur ersetzen wenn kein Prefix folgt (z.B. `var(--surface2)` darf nicht ersetzt werden).

Danach manuell prüfen mit: `grep -r "var(--surface)" src --include="*.css"` — verbleibende Treffer händisch prüfen.

---

### Task 4.4: Backward-Compat-Aliases aus `index.css` entfernen

- [ ] **In `frontend/src/index.css`** den gesamten Block `/* Backward-compat aliases */` in `:root` und in `[data-theme="light"]` entfernen.

Nach dem Remove: Dev-Server starten und alle Seiten auf Darstellungsfehler prüfen.

---

### Task 4.5: Dev-Server starten — finale Überprüfung

- [ ] **Dev-Server starten**

```bash
cd /Users/larswenner/env-buddy/frontend
npm run dev
```

- [ ] **Prüfpunkte:**
  - Toast: 320px breit, farbiger 4px-Strip links (grün/rot/orange/blau)
  - Toast-Text in `fg-text` (nicht in Akzentfarbe)
  - Keine Darstellungsfehler auf: Dashboard, Templates, Marketplace, Teams, Audit
  - Light-Mode (`data-theme="light"`) korrekt — alle Farben Catppuccin Latte
  - Keine alten `var(--base)` o.ä. im Browser-CSS (DevTools → Computed → background)

---

### Task 4.6: Commit

- [ ] **Commit erstellen**

```bash
cd /Users/larswenner/env-buddy
git add frontend/src/components/Toast.jsx frontend/src/components/Toast.css \
        frontend/src/components/ContainerLogsModal.css \
        frontend/src/components/ContainerEditModal.css \
        frontend/src/components/ProfileModal.css \
        frontend/src/components/StartForm.css \
        frontend/src/components/DashboardStats.css \
        frontend/src/pages/AuthPage.css \
        frontend/src/pages/TemplatesPage.css \
        frontend/src/pages/MarketplacePage.css \
        frontend/src/pages/TeamsPage.css \
        frontend/src/pages/AuditPage.css \
        frontend/src/index.css
git commit -m "feat(design): toast redesign, token cleanup, remove backward-compat aliases"
```

---

## Merge-Reihenfolge

```
main
  └── design/phase-1-tokens   → merge → main
        └── design/phase-2-layout  → merge → main
              └── design/phase-3-cards  → merge → main
                    └── design/phase-4-components  → merge → main
```

Jede Phase baut auf der vorherigen auf. Branches werden sequentiell von `main` (nach Merge der vorherigen Phase) abgezweigt.
