# TestBud Light Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark Liquid Glass (`--tb-*`) design with the TestBud Clean & Minimal Light system (Variant A "Air") across all pages and components.

**Architecture:** New flat token namespace (`--bg`, `--surface`, `--ink`, `--accent`, etc.) replaces all `--tb-*` tokens. Phase 1 installs tokens and backward-compat aliases so the app stays functional; Phases 2–5 rebuild each layer; Phase 6 migrates remaining pages and removes aliases. Each phase is its own git branch, committed in the user's name (milkamilch / larswenner00@gmail.com), never add Co-Authored-By.

**Tech Stack:** React 19, Vite 7, CSS custom properties, Lucide icons (strokeWidth 1.6), JetBrains Mono (Google Fonts)

**Spec:** `docs/superpowers/specs/2026-06-26-testbud-light-redesign.md`

**Design handoff:** `/Users/larswenner/Downloads/TestBud_extracted/design_handoff_dashboard_minimal/`

---

## Task 1: Token System

**Branch:** `feat/light-phase-1-tokens`

**Files:**
- Modify: `frontend/src/index.css` (complete replacement)
- Modify: `frontend/index.html` (add Google Fonts link)

- [ ] **Step 1: Create branch**

```bash
git checkout -b feat/light-phase-1-tokens
```

- [ ] **Step 2: Replace `frontend/src/index.css` completely**

```css
@import "tailwindcss";

/* =========================================================
   TestBud Design Tokens — Clean Light (Variant A "Air")
   ========================================================= */
:root {
  /* Backgrounds */
  --bg:           #f4f3f0;
  --surface:      #ffffff;
  --surface-2:    #faf9f7;
  --surface-sink: #f0efe9;

  /* Borders */
  --line:         rgba(24,22,18,0.08);
  --line-2:       rgba(24,22,18,0.12);

  /* Text */
  --ink:          #1c1a16;
  --ink-2:        rgba(28,26,22,0.60);
  --ink-3:        rgba(28,26,22,0.40);
  --ink-4:        rgba(28,26,22,0.28);

  /* Accent */
  --accent:       #e85d2a;
  --accent-ink:   #b8420f;
  --accent-soft:  rgba(232,93,42,0.10);
  --accent-line:  rgba(232,93,42,0.30);

  /* Status */
  --run:  #1f9d57;
  --warn: #c97c12;
  --stop: #cc3b2e;
  --info: #2f6df0;

  /* Status soft */
  --run-soft:  rgba(31,157,87,0.10);
  --warn-soft: rgba(201,124,18,0.10);
  --stop-soft: rgba(204,59,46,0.10);
  --info-soft: rgba(47,109,240,0.10);

  /* Elevation */
  --shadow-card: 0 1px 2px rgba(24,22,18,0.04);
  --shadow-pop:  0 8px 24px rgba(24,22,18,0.12), 0 2px 6px rgba(24,22,18,0.06);

  /* Geometry */
  --r-card: 16px;
  --r-pill: 999px;
  --r-sm:   8px;
  --r-md:   12px;

  /* Motion */
  --ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);

  /* ── Backward-compat aliases (removed in Phase 6 cleanup) ── */
  --tb-font-display: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --tb-font-mono:    "JetBrains Mono", monospace;

  --tb-text-xs:    11px;  --tb-text-sm:   12px;  --tb-text-base: 13px;
  --tb-text-md:    15px;  --tb-text-lg:   17px;  --tb-text-xl:   22px;

  --tb-tracking-tight: -0.02em;
  --tb-tracking-caps:   0.06em;

  --tb-space-1:  4px;  --tb-space-2:  8px;  --tb-space-3: 12px;
  --tb-space-4: 16px;  --tb-space-5: 20px;  --tb-space-6: 24px;
  --tb-space-7: 32px;  --tb-space-8: 48px;  --tb-space-9: 64px;

  --tb-radius-xs:   6px;  --tb-radius-sm:   8px;  --tb-radius-md:  12px;
  --tb-radius-lg:  16px;  --tb-radius-xl:  20px;  --tb-radius-2xl: 28px;
  --tb-radius-pill: 999px;

  --tb-accent:        var(--accent);
  --tb-accent-hover:  var(--accent-ink);
  --tb-accent-soft:   var(--accent-soft);

  --tb-running: var(--run);
  --tb-warning: var(--warn);
  --tb-error:   var(--stop);
  --tb-info:    var(--info);
  --tb-network: #7a5ae0;
  --tb-pending: var(--warn);

  --tb-running-soft: var(--run-soft);
  --tb-warning-soft: var(--warn-soft);
  --tb-error-soft:   var(--stop-soft);
  --tb-info-soft:    var(--info-soft);
  --tb-network-soft: rgba(122,90,224,0.10);
  --tb-pending-soft: var(--warn-soft);

  --tb-bg-page:      var(--bg);
  --tb-bg-page-grad: none;

  --tb-glass-1:     var(--surface);
  --tb-glass-2:     var(--surface);
  --tb-glass-3:     var(--surface);
  --tb-glass-modal: var(--surface);

  --tb-stroke:        var(--line);
  --tb-stroke-strong: var(--line-2);
  --tb-stroke-inset:  inset 0 1px 0 var(--line);

  --tb-text-primary:    var(--ink);
  --tb-text-secondary:  var(--ink-2);
  --tb-text-tertiary:   var(--ink-3);
  --tb-text-quaternary: var(--ink-4);
  --tb-text-on-accent:  #ffffff;

  --tb-shadow-card:  var(--shadow-card);
  --tb-shadow-float: var(--shadow-pop);
  --tb-shadow-modal: var(--shadow-pop);

  --tb-track: var(--surface-sink);
}

@theme {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  --color-ink:     var(--ink);
  --color-ink-2:   var(--ink-2);
  --color-ink-3:   var(--ink-3);
  --color-accent:  var(--accent);
  --color-running: var(--run);
  --color-warning: var(--warn);
  --color-error:   var(--stop);
  --color-info:    var(--info);

  --radius-sm:   var(--r-sm);
  --radius-md:   var(--r-md);
  --radius-lg:   var(--r-card);
  --radius-pill: var(--r-pill);
}

/* =========================================================
   Global Resets
   ========================================================= */
*, *::before, *::after { box-sizing: border-box; }

html {
  background: var(--bg);
  min-height: 100vh;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink);
  background: transparent;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button { font-family: inherit; cursor: pointer; }
input, textarea, select { font-family: inherit; }
h1, h2, h3 { line-height: 1.2; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--line-2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(24,22,18,0.20); }

#root { min-height: 100vh; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

@keyframes spin        { to { transform: rotate(360deg); } }
@keyframes pulse-soft  { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
@keyframes pulse-dot   { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.85); } }
@keyframes toast-slide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes skeleton-shimmer {
  from { background-position: -200px 0; }
  to   { background-position: calc(200px + 100%) 0; }
}
```

- [ ] **Step 3: Add JetBrains Mono to `frontend/index.html`**

Insert these three lines inside `<head>`, before the closing `</head>` tag:

```html
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

- [ ] **Step 4: Build check**

```bash
cd /Users/larswenner/env-buddy/frontend && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Visual check**

```bash
cd /Users/larswenner/env-buddy/frontend && npm run dev
```

Open http://localhost:5173. The app should show a warm off-white background (`#f4f3f0`). Text should be dark (`#1c1a16`). Layout may look imperfect until Phase 2 — that is expected.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/index.css frontend/index.html
git commit -m "feat: replace tb-* tokens with clean light token system + JetBrains Mono"
```

- [ ] **Step 7: Merge to main**

```bash
git checkout main && git merge feat/light-phase-1-tokens
```

---

## Task 2: App Shell

**Branch:** `feat/light-phase-2-shell`

**Files:**
- Modify: `frontend/src/App.css` (complete replacement)
- Modify: `frontend/src/App.jsx` (structural update: grid layout, remove theme toggle, fix invitation modal styles)
- Modify: `frontend/src/components/Sidebar.jsx` (rebuild with brand mark)
- Modify: `frontend/src/components/Topbar.jsx` (rebuild with ⌘K, bell, user pill)

- [ ] **Step 1: Create branch**

```bash
git checkout -b feat/light-phase-2-shell
```

- [ ] **Step 2: Replace `frontend/src/App.css` completely**

```css
/* === App Shell (grid: sidebar | main) === */
.app {
  display: grid;
  grid-template-columns: 248px 1fr;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
  color: var(--ink);
}

/* === Sidebar === */
.sidebar {
  background: var(--surface);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-brand {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}

.sidebar-brand-icon { font-size: 20px; }

.sidebar-brand-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.02em;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 8px;
  flex: 1;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 36px;
  padding: 0 12px;
  border-radius: var(--r-sm);
  border: none;
  background: transparent;
  color: var(--ink-3);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s, color 0.12s;
  width: 100%;
}

.sidebar-nav-item:hover {
  background: var(--surface-sink);
  color: var(--ink);
}

.sidebar-nav-item.active {
  background: var(--accent-soft);
  color: var(--accent);
}

.sidebar-nav-icon { flex-shrink: 0; }
.sidebar-nav-label { flex: 1; }

.sidebar-nav-badge {
  background: var(--accent);
  color: #fff;
  border-radius: var(--r-pill);
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  min-width: 18px;
  text-align: center;
}

/* === Main column === */
.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* === Topbar === */
.topbar {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  background: color-mix(in srgb, var(--surface) 78%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
  z-index: 50;
}

.topbar-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-3);
}

.topbar-bc-sep { color: var(--ink-4); }
.topbar-bc-current { color: var(--ink); font-weight: 600; }

.topbar-cmdk {
  flex: 1;
  max-width: 280px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-sink);
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  padding: 0 12px;
  height: 32px;
  color: var(--ink-3);
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.12s;
  margin: 0 auto;
}
.topbar-cmdk:hover { border-color: var(--line-2); }
.topbar-cmdk-label { flex: 1; text-align: left; }
.topbar-cmdk-kbd {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 1px 5px;
  color: var(--ink-3);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.topbar-icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--r-sm);
  color: var(--ink-3);
  cursor: pointer;
  position: relative;
  transition: background 0.12s, color 0.12s;
}
.topbar-icon-btn:hover { background: var(--surface-sink); color: var(--ink); }

.topbar-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 7px;
  height: 7px;
  background: var(--stop);
  border-radius: 50%;
  border: 1.5px solid var(--surface);
}

.topbar-btn-new {
  height: 32px;
  padding: 0 14px;
  background: var(--accent);
  border: none;
  border-radius: var(--r-md);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;
}
.topbar-btn-new:hover { background: var(--accent-ink); }

.topbar-user-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-sink);
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  padding: 3px 10px 3px 3px;
  cursor: pointer;
  transition: border-color 0.12s;
}
.topbar-user-pill:hover { border-color: var(--line-2); }

.topbar-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}

.topbar-username {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
}

/* === Scroll container === */
.scroll {
  flex: 1;
  overflow-y: auto;
}

/* === Error banner === */
.error-banner {
  background: var(--stop-soft);
  border-bottom: 1px solid var(--stop);
  color: var(--stop);
  padding: 10px 20px;
  font-size: 13px;
}

/* === Modal overlay (for invitations inbox, etc.) === */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.25);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-pop);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
}

.modal-title { font-size: 15px; font-weight: 600; color: var(--ink); }

.modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-sink);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  color: var(--ink-3);
  cursor: pointer;
  transition: color 0.12s;
}
.modal-close:hover { color: var(--ink); }

.modal-body { padding: 16px 20px; overflow-y: auto; }

/* === Drawer === */
.drawer-scrim {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.20);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 90;
}

.drawer {
  position: fixed;
  top: 14px;
  right: 14px;
  bottom: 14px;
  width: 440px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: var(--shadow-pop);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}

.drawer-title { font-size: 15px; font-weight: 600; color: var(--ink); }

.drawer-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-sink);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  color: var(--ink-3);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.drawer-close:hover { background: var(--line); color: var(--ink); }

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* === Loading spinner === */
.loading-spinner-wrap {
  display: flex;
  justify-content: center;
  padding: 48px 20px;
}
.loading-spinner {
  width: 28px;
  height: 28px;
  border: 2px solid var(--line-2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* === Toolbar (dashboard) === */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.search-wrapper {
  display: flex;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 0 10px;
  gap: 8px;
  min-width: 200px;
  flex: 1;
  max-width: 280px;
  height: 34px;
  transition: border-color 0.12s;
}
.search-wrapper:focus-within { border-color: var(--accent); }
.search-icon { color: var(--ink-3); flex-shrink: 0; }
.search-input {
  background: transparent;
  border: none;
  color: var(--ink);
  font-size: 13px;
  flex: 1;
  outline: none;
  padding: 0;
}
.search-input::placeholder { color: var(--ink-4); }
.search-clear {
  background: transparent;
  border: none;
  color: var(--ink-3);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}
.search-clear:hover { color: var(--ink); }

.view-toggle {
  display: flex;
  background: var(--surface-sink);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  padding: 2px;
}
.view-btn {
  background: transparent;
  border: none;
  border-radius: calc(var(--r-sm) - 2px);
  color: var(--ink-3);
  padding: 4px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.12s, color 0.12s;
}
.view-btn.active {
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-card);
}

/* === Container grid / list === */
.container-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
.container-list { display: flex; flex-direction: column; gap: 4px; }

/* === Section labels === */
.section-label {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-4);
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-count {
  background: var(--surface-sink);
  color: var(--ink-3);
  border-radius: var(--r-pill);
  padding: 1px 6px;
  font-size: 10px;
}

/* === Empty state === */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 24px;
  text-align: center;
}
.empty-state-icon { color: var(--ink-4); }
.empty-state-title { margin: 0; font-size: 18px; font-weight: 600; color: var(--ink-3); }
.empty-state-sub { margin: 0; font-size: 13px; color: var(--ink-3); max-width: 300px; }

/* === Bulk bar === */
.bulk-bar {
  position: fixed;
  bottom: 16px;
  left: 264px;
  right: 16px;
  z-index: 80;
  background: var(--ink);
  border-radius: var(--r-md);
  padding: 10px 16px;
  display: flex;
  gap: 10px;
  align-items: center;
  box-shadow: var(--shadow-pop);
}
```

- [ ] **Step 3: Rewrite `frontend/src/App.jsx`**

The key changes from the current file:
1. Layout: `<div class="app">` becomes a grid (sidebar | main). Move `<Sidebar>` before `<div class="main">`, put `<Topbar>` inside `.main`, wrap `<Routes>` in `.scroll`.
2. Remove `handleToggleTheme` function.
3. Remove `onToggleTheme` and `theme` props from `<Topbar>`.
4. Add `onOpenPalette` and `onOpenDrawer` props to `<Topbar>` (already exists, keep it).
5. Update the inline invitations modal to use new CSS classes.
6. Change class `app-body` → remove it; change `app-content` → remove it; the scroll container is now `.scroll`.

Write the complete new `frontend/src/App.jsx`:

```jsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { fetchDefaultTemplates, fetchMyTemplates, fetchFavorites, fetchContainers, fetchStacks, fetchTeamTemplates, fetchInvitations, acceptInvitation, declineInvitation } from "./services/api";
import TEMPLATE_ICONS from "./templateIcons";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import TemplatesPage from "./pages/TemplatesPage";
import TeamsPage from "./pages/TeamsPage";
import MarketplacePage from "./pages/MarketplacePage";
import AuditPage from "./pages/AuditPage";
import ProfileModal from "./components/ProfileModal";
import CommandPalette from "./components/CommandPalette";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import StartDrawer from "./components/StartDrawer";
import "./App.css";

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}

export default function App() {
  const [user, setUser] = useState(getStoredUser);
  const [profileOpen, setProfileOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [containers, setContainers] = useState([]);
  const [stacks, setStacks] = useState([]);
  const [startFormTemplates, setStartFormTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [clonePrefill, setClonePrefill] = useState(null);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  }

  async function loadStartFormTemplates() {
    try {
      const defaults = await fetchDefaultTemplates();
      const defaultMap = Object.fromEntries(
        defaults.map((k) => [k, { key: k, label: k, icon: TEMPLATE_ICONS[k] || "📦" }])
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
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!user) return;
    function loadInvitations() {
      fetchInvitations().then(setInvitations).catch(() => {});
    }
    loadInvitations();
    const id = setInterval(loadInvitations, 30000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    const running = [
      ...containers.filter((c) => c.status === "running"),
      ...stacks.flatMap((s) => s.containers).filter((c) => c.status === "running"),
    ].length;
    document.title = running > 0 ? `(${running}) Env-Buddy` : "Env-Buddy";
  }, [containers, stacks]);

  useEffect(() => {
    if (user) loadStartFormTemplates();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadAll();
    const interval = setInterval(loadAll, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) {
    return <AuthPage onAuth={(u) => { setUser(u); navigate("/"); }} />;
  }

  const path = location.pathname.replace(/^\//, "") || "dashboard";

  function handleNavigate(target) {
    navigate("/" + target);
    if (target === "templates") loadStartFormTemplates();
  }

  return (
    <div className="app">
      <Sidebar page={path} onNavigate={handleNavigate} />

      <div className="main">
        <Topbar
          user={user}
          page={path}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenInbox={() => setInboxOpen(true)}
          invitationCount={invitations.length}
        />

        <div className="scroll">
          {error && <div className="error-banner">Backend nicht erreichbar — läuft auf http://localhost:8000?</div>}

          <Routes>
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/teams" element={<TeamsPage user={user} />} />
            <Route path="/marketplace" element={<MarketplacePage user={user} />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/dashboard" element={
              <DashboardPage
                containers={containers}
                stacks={stacks}
                loading={loading}
                startFormTemplates={startFormTemplates}
                onStarted={loadAll}
                onStopped={loadAll}
                onRemoved={(id) => setContainers((prev) => prev.filter((c) => c.id !== id))}
                onStackStopped={(stackId) => { setStacks((prev) => prev.filter((s) => s.stack_id !== stackId)); loadAll(); }}
                onOpenDrawer={() => setDrawerOpen(true)}
                onClone={(config) => { setClonePrefill(config); setDrawerOpen(true); }}
              />
            } />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
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

      {paletteOpen && (
        <CommandPalette
          templates={startFormTemplates}
          onClose={() => setPaletteOpen(false)}
        />
      )}

      {inboxOpen && (
        <div className="modal-overlay" onClick={() => setInboxOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Einladungen</span>
              <button className="modal-close" onClick={() => setInboxOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              {invitations.length === 0 ? (
                <p style={{ color: "var(--ink-3)", fontSize: "13px" }}>Keine ausstehenden Einladungen.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {invitations.map((inv) => (
                    <div key={inv.id} style={{
                      background: "var(--surface-sink)",
                      border: "1px solid var(--line)",
                      borderRadius: "var(--r-md)",
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: "var(--ink)" }}>{inv.team_name}</div>
                        <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>
                          Eingeladen von @{inv.inviter_name}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          await acceptInvitation(inv.id);
                          setInvitations((p) => p.filter((i) => i.id !== inv.id));
                        }}
                        style={{
                          padding: "5px 12px", borderRadius: "var(--r-sm)",
                          border: "1px solid var(--run)", color: "var(--run)",
                          background: "transparent", cursor: "pointer", fontSize: "12px", fontWeight: 600,
                        }}
                      >
                        Annehmen
                      </button>
                      <button
                        onClick={async () => {
                          await declineInvitation(inv.id);
                          setInvitations((p) => p.filter((i) => i.id !== inv.id));
                        }}
                        style={{
                          padding: "5px 12px", borderRadius: "var(--r-sm)",
                          border: "1px solid var(--line-2)", color: "var(--ink-3)",
                          background: "transparent", cursor: "pointer", fontSize: "12px",
                        }}
                      >
                        Ablehnen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `frontend/src/components/Sidebar.jsx`**

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
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">🧪</span>
        <span className="sidebar-brand-name">env-buddy</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`sidebar-nav-item ${page === item.key ? "active" : ""}`}
            onClick={() => onNavigate(item.key)}
          >
            <item.Icon size={16} strokeWidth={1.6} className="sidebar-nav-icon" />
            <span className="sidebar-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 5: Rewrite `frontend/src/components/Topbar.jsx`**

```jsx
import { Bell, Plus } from "lucide-react";

const AVATAR_COLORS = ["#e85d2a","#2f6df0","#1f9d57","#7a5ae0","#c97c12"];
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

export default function Topbar({ user, page, onOpenProfile, onOpenDrawer, onOpenPalette, onOpenInbox, invitationCount }) {
  const initials = ((user.first_name?.[0] || "") + (user.last_name?.[0] || "")).toUpperCase() || "?";
  const color = avatarColor(user.username);

  return (
    <header className="topbar">
      <div className="topbar-breadcrumb">
        <span>Dashboard</span>
        {page !== "dashboard" && (
          <>
            <span className="topbar-bc-sep">›</span>
            <span className="topbar-bc-current">{PAGE_LABELS[page] ?? page}</span>
          </>
        )}
      </div>

      <button className="topbar-cmdk" onClick={onOpenPalette} aria-label="Befehlspalette öffnen">
        <span className="topbar-cmdk-label">Suchen…</span>
        <kbd className="topbar-cmdk-kbd">⌘K</kbd>
      </button>

      <div className="topbar-actions">
        <button className="topbar-icon-btn" onClick={onOpenInbox} aria-label="Einladungen">
          <Bell size={16} strokeWidth={1.6} />
          {invitationCount > 0 && <span className="topbar-badge" />}
        </button>

        <button className="topbar-btn-new" onClick={onOpenDrawer}>
          <Plus size={14} strokeWidth={2} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
          Neu
        </button>

        <button className="topbar-user-pill" onClick={onOpenProfile} aria-label="Profil öffnen">
          <span
            className="topbar-avatar"
            style={{ background: color + "22", color }}
          >
            {initials}
          </span>
          <span className="topbar-username">{user.username}</span>
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Build check**

```bash
cd /Users/larswenner/env-buddy/frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 7: Visual check**

```bash
cd /Users/larswenner/env-buddy/frontend && npm run dev
```

Verify: sidebar 248px on left with brand mark + nav, topbar 60px with ⌘K bar and user pill, warm white background, no dark elements in shell.

- [ ] **Step 8: Commit and merge**

```bash
git add frontend/src/App.css frontend/src/App.jsx frontend/src/components/Sidebar.jsx frontend/src/components/Topbar.jsx
git commit -m "feat: rebuild app shell with light grid layout (sidebar, topbar)"
git checkout main && git merge feat/light-phase-2-shell
```

---

## Task 3: Atoms (StatusPill, Sparkline, Segmented)

**Branch:** `feat/light-phase-3-atoms`

**Files:**
- Create: `frontend/src/components/StatusPill.jsx`
- Create: `frontend/src/components/StatusPill.css`
- Create: `frontend/src/components/Sparkline.jsx`
- Create: `frontend/src/components/Segmented.jsx`
- Create: `frontend/src/components/Segmented.css`

- [ ] **Step 1: Create branch**

```bash
git checkout -b feat/light-phase-3-atoms
```

- [ ] **Step 2: Create `frontend/src/components/StatusPill.jsx`**

```jsx
import "./StatusPill.css";

const STATUS_CONFIG = {
  running:  { cls: "run",   label: "Running" },
  stopped:  { cls: "stop",  label: "Stopped" },
  exited:   { cls: "stop",  label: "Exited" },
  starting: { cls: "start", label: "Starting" },
  paused:   { cls: "warn",  label: "Paused" },
  pending:  { cls: "start", label: "Pending" },
};

export default function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { cls: "stop", label: status };
  return (
    <span className={`pill pill-${cfg.cls}`}>
      <span className="pill-dot" />
      {cfg.label}
    </span>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/StatusPill.css`**

```css
.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: var(--r-pill);
  font-size: 11px;
  font-weight: 600;
}

.pill-run  { background: var(--run-soft);  color: var(--run); }
.pill-stop { background: var(--stop-soft); color: var(--stop); }
.pill-warn { background: var(--warn-soft); color: var(--warn); }
.pill-start { background: var(--info-soft); color: var(--info); }

.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.pill-run .pill-dot {
  animation: pulse-dot 1.8s ease-in-out infinite;
}
```

- [ ] **Step 4: Create `frontend/src/components/Sparkline.jsx`**

```jsx
const POINTS = 60;

export default function Sparkline({ values = [], color = "var(--accent)", height = 32 }) {
  if (values.length < 2) return <svg width="100%" height={height} />;

  const w = 100;
  const max = Math.max(...values, 1);
  const step = w / (POINTS - 1);

  const pts = values.map((v, i) => {
    const x = ((POINTS - values.length + i) * step).toFixed(1);
    const y = (height - (v / max) * (height - 2) - 1).toFixed(1);
    return `${x},${y}`;
  });

  const polyPts = pts.join(" ");
  const fillPts = `${pts[0].split(",")[0]},${height} ${polyPts} ${pts[pts.length - 1].split(",")[0]},${height}`;
  const gradId = `sg-${color.replace(/[^a-z0-9]/gi, "")}-${height}`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#${gradId})`} />
      <polyline
        points={polyPts}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
```

- [ ] **Step 5: Create `frontend/src/components/Segmented.jsx`**

```jsx
import "./Segmented.css";

export default function Segmented({ options, value, onChange, counts }) {
  return (
    <div className="segmented">
      {options.map((opt) => {
        const label = typeof opt === "string" ? opt : opt.label;
        const val   = typeof opt === "string" ? opt : opt.value;
        return (
          <button
            key={val}
            className={`seg-btn ${value === val ? "active" : ""}`}
            onClick={() => onChange(val)}
          >
            {label}
            {counts?.[val] != null && (
              <span className="seg-count">{counts[val]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: Create `frontend/src/components/Segmented.css`**

```css
.segmented {
  display: flex;
  background: var(--surface-sink);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  padding: 2px;
  gap: 1px;
}

.seg-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: calc(var(--r-sm) - 2px);
  border: none;
  background: transparent;
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, box-shadow 0.12s;
}

.seg-btn:hover { color: var(--ink); }

.seg-btn.active {
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-card);
}

.seg-count {
  font-size: 10px;
  color: var(--ink-4);
  font-variant-numeric: tabular-nums;
}

.seg-btn.active .seg-count { color: var(--ink-3); }
```

- [ ] **Step 7: Build check**

```bash
cd /Users/larswenner/env-buddy/frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 8: Commit and merge**

```bash
git add frontend/src/components/StatusPill.jsx frontend/src/components/StatusPill.css frontend/src/components/Sparkline.jsx frontend/src/components/Segmented.jsx frontend/src/components/Segmented.css
git commit -m "feat: add StatusPill, Sparkline, Segmented atoms"
git checkout main && git merge feat/light-phase-3-atoms
```

---

## Task 4: Dashboard Core

**Branch:** `feat/light-phase-4-dashboard`

**Files:**
- Modify: `frontend/src/components/ContainerCard.jsx` (visual rebuild, use new atoms)
- Modify: `frontend/src/components/ContainerCard.css` (complete replacement)
- Modify: `frontend/src/components/DashboardStats.jsx` (light rebuild)
- Modify: `frontend/src/components/DashboardStats.css` (complete replacement)
- Modify: `frontend/src/pages/DashboardPage.jsx` (use Segmented for filters)
- Modify: `frontend/src/components/StackCard.jsx` (light rebuild)
- Modify: `frontend/src/components/StackCard.css` (complete replacement)

- [ ] **Step 1: Create branch**

```bash
git checkout -b feat/light-phase-4-dashboard
```

- [ ] **Step 2: Replace `frontend/src/components/ContainerCard.css`**

```css
/* === Grid card === */
.container-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.15s var(--ease), transform 0.15s var(--ease), border-color 0.15s;
  cursor: pointer;
}
.container-card:hover {
  box-shadow: var(--shadow-pop);
  transform: translateY(-1px);
  border-color: var(--line-2);
}
.container-card.card-stopped { opacity: 0.65; }

/* Card head */
.card-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.card-tpl-ico {
  font-size: 22px;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 1px;
}
.card-head-info { flex: 1; min-width: 0; }
.card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: "JetBrains Mono", monospace;
}
.card-image {
  font-size: 11px;
  color: var(--ink-3);
  font-family: "JetBrains Mono", monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.card-head-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}
.card-timer {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  color: var(--ink-3);
}
.card-timer.expiring { color: var(--warn); }

/* Connection string */
.card-connection {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-sink);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  padding: 5px 8px;
}
.card-conn-str {
  flex: 1;
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.btn-copy-conn {
  background: transparent;
  border: none;
  color: var(--ink-3);
  cursor: pointer;
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 4px;
  flex-shrink: 0;
}
.btn-copy-conn:hover { color: var(--accent); }

/* Stat grid */
.card-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.stat-row {
  background: var(--surface-sink);
  border-radius: var(--r-sm);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stat-lbl {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-4);
}
.stat-val {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
}
.stat-sparkline { height: 24px; }

/* Card footer */
.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  border-top: 1px solid var(--line);
  padding-top: 10px;
  margin-top: 2px;
}

/* Action buttons */
.btn-sm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
  white-space: nowrap;
}
.btn-sm:hover { border-color: var(--line-2); color: var(--ink); }
.btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-destructive {
  border-color: var(--stop-soft);
  color: var(--stop);
  background: var(--stop-soft);
}
.btn-destructive:hover { background: rgba(204,59,46,0.16); border-color: rgba(204,59,46,0.30); }

.btn-default { }

.btn-ghost {
  border-color: transparent;
  background: transparent;
}
.btn-ghost:hover { background: var(--surface-sink); border-color: var(--line); }

.btn-icon-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink-3);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}
.btn-icon-sm:hover { color: var(--ink); background: var(--surface-sink); }
.btn-icon-sm.btn-destructive { color: var(--stop); border-color: var(--stop-soft); background: var(--stop-soft); }
.btn-icon-sm.btn-ghost { border-color: transparent; background: transparent; }

/* Health badge */
.health-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: var(--r-pill);
}
.health-up   { background: var(--run-soft);  color: var(--run); }
.health-down { background: var(--stop-soft); color: var(--stop); }

/* List row */
.container-row {
  display: grid;
  grid-template-columns: auto 80px 1fr auto auto auto auto auto auto;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
}
.container-row:hover { border-color: var(--line-2); background: var(--surface-2); }
.container-row.card-stopped { opacity: 0.65; }

.row-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.row-status-dot.status-dot-running  { background: var(--run); }
.row-status-dot.status-dot-exited   { background: var(--stop); }
.row-status-dot.status-dot-stopped  { background: var(--ink-4); }
.row-status-dot.status-dot-starting { background: var(--info); }
.row-status-dot.status-dot-paused   { background: var(--warn); }
.row-status-dot.status-dot-pending  { background: var(--warn); }

.row-status-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}
.status-running  { color: var(--run); }
.status-stopped  { color: var(--ink-3); }
.status-exited   { color: var(--stop); }
.status-starting { color: var(--info); }
.status-paused   { color: var(--warn); }
.status-pending  { color: var(--warn); }

.row-name {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-port {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  color: var(--ink-3);
}
.row-sparkline { width: 60px; height: 16px; }
.row-started-by { font-size: 11px; color: var(--ink-3); }
.row-timer { font-family: "JetBrains Mono", monospace; font-size: 11px; color: var(--ink-3); }
.row-timer.expiring { color: var(--warn); }
.row-cpu-val { font-family: "JetBrains Mono", monospace; font-size: 11px; font-weight: 600; }
.row-actions { display: flex; align-items: center; gap: 4px; }

.confirm-label { font-size: 11px; color: var(--stop); font-weight: 600; }

/* Extend popover */
.extend-popover {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 7rem;
  box-shadow: var(--shadow-pop);
}

/* Live badge */
.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  font-weight: 600;
  color: var(--run);
  background: var(--run-soft);
  border-radius: var(--r-pill);
  padding: 2px 7px;
}
.live-badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--run);
  animation: pulse-dot 1.4s ease-in-out infinite;
}

/* Save template / share open inline forms */
.card-save-form, .card-share-form {
  background: var(--surface-sink);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.card-save-form input, .card-share-form input {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--ink);
  font-size: 12px;
  outline: none;
}
.card-save-form input:focus, .card-share-form input:focus { border-color: var(--accent); }
.card-form-row { display: flex; gap: 6px; }

.share-list { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
.share-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--ink-2);
  padding: 3px 0;
}
```

- [ ] **Step 3: Update `frontend/src/components/ContainerCard.jsx`**

At the top of the file, replace the local `Sparkline` component definition (lines 28–53 of the current file) with an import, and replace the `statusDotClass` usages in CSS with the new class names. Keep ALL business logic (hooks, handlers, state) unchanged.

Find and replace only these sections:

**Replace** the local `Sparkline` function (remove lines 28–53):
```jsx
// DELETE the local Sparkline function definition entirely
```

**Add** at the top of imports (after existing imports):
```jsx
import StatusPill from "./StatusPill";
import Sparkline from "./Sparkline";
```

**Replace** the grid card header section (starting at `{/* Header */}` in the current GRID MODE render) with:
```jsx
        {/* Head */}
        <div className="card-header">
          <span className="card-tpl-ico">{TEMPLATE_ICONS[templateBase] || "📦"}</span>
          <div className="card-head-info">
            <div className="card-name">{container.name}</div>
            <div className="card-image">{templateBase || container.template}</div>
          </div>
          <div className="card-head-right">
            <StatusPill status={container.status} />
            {isRunning && remaining != null && (
              <span className={`card-timer ${isExpiringSoon ? "expiring" : ""}`}>
                {formatCountdown(remaining)}
              </span>
            )}
          </div>
        </div>
```

**Replace** the card-stats section with:
```jsx
        {/* Stats */}
        {isRunning && (
          <div className="card-stats">
            <div className="stat-row">
              <div className="stat-row-head">
                <span className="stat-lbl">CPU</span>
                <span className="stat-val">{container.cpu_percent?.toFixed(1)}%</span>
              </div>
              <div className="stat-sparkline">
                <Sparkline values={statsHistory.map(p => p.cpu)} color="var(--run)" height={24} />
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-row-head">
                <span className="stat-lbl">RAM</span>
                <span className="stat-val">{container.ram_mb}MB</span>
              </div>
              <div className="stat-sparkline">
                <Sparkline values={statsHistory.map(p => p.ram)} color="var(--info)" height={24} />
              </div>
            </div>
          </div>
        )}
```

**Replace** the extend-open inline popover style (from `<div style={{ position: "absolute", top: "110%"...}}`) with:
```jsx
              {extendOpen && (
                <div className="extend-popover" onClick={e => e.stopPropagation()}>
                  {EXTEND_MINUTES.map(m => (
                    <button key={m} className="btn-sm btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={e => handleExtend(e, m)} disabled={extending}>+{m} Min.</button>
                  ))}
                </div>
              )}
```

Keep all other code unchanged. The cpuColor/ramColor variables are no longer used for sparklines (colors are now fixed: `var(--run)` for CPU, `var(--info)` for RAM), but keep them for the list row's `row-cpu-val`.

- [ ] **Step 4: Replace `frontend/src/components/DashboardStats.css`**

```css
.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  padding: 16px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-card-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-4);
  font-family: "JetBrains Mono", monospace;
}

.stat-card-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1;
  font-family: "JetBrains Mono", monospace;
}

.stat-card-sub {
  font-size: 11px;
  color: var(--ink-4);
}

.stat-green { color: var(--run); }
.stat-red   { color: var(--stop); }
.stat-blue  { color: var(--info); }

/* Bar cards */
.stat-card-bar { gap: 6px; }
.stat-bar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stat-bar-value {
  font-family: "JetBrains Mono", monospace;
  font-size: 14px;
  font-weight: 700;
}
.stat-progress-track {
  height: 4px;
  background: var(--surface-sink);
  border-radius: 2px;
  overflow: hidden;
}
.stat-progress-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--accent);
  transition: width 0.3s var(--ease);
}
.stat-bar-sub {
  font-size: 10px;
  color: var(--ink-4);
}

/* Divider */
.stat-divider { display: none; }

/* Top templates */
.stat-card-templates { grid-column: span 2; }
.stat-card-label-top { margin-bottom: 6px; display: block; }
.stat-template-bars { display: flex; flex-direction: column; gap: 6px; }
.stat-tpl-row {
  display: grid;
  grid-template-columns: 1fr 60px auto;
  align-items: center;
  gap: 8px;
}
.stat-tpl-name { font-size: 12px; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stat-tpl-track { height: 4px; background: var(--surface-sink); border-radius: 2px; }
.stat-tpl-fill { height: 100%; background: var(--accent-soft); border-radius: 2px; }
.stat-tpl-count { font-size: 11px; color: var(--ink-4); font-family: "JetBrains Mono", monospace; text-align: right; }
```

- [ ] **Step 5: Update `frontend/src/components/DashboardStats.jsx`**

Replace only the color logic section. Find lines:
```jsx
  const cpuColor = totalCpu > 80 ? "#f38ba8" : totalCpu > 50 ? "#fab387" : "#a6e3a1";
  const ramColor = ramPercent > 80 ? "#f38ba8" : ramPercent > 50 ? "#fab387" : "#a6e3a1";
```

Replace with:
```jsx
  const cpuColor = totalCpu > 80 ? "var(--stop)" : totalCpu > 50 ? "var(--warn)" : "var(--run)";
  const ramColor = ramPercent > 80 ? "var(--stop)" : ramPercent > 50 ? "var(--warn)" : "var(--info)";
```

Keep all other logic and JSX unchanged. The CSS now handles the visual styling.

- [ ] **Step 6: Update `frontend/src/pages/DashboardPage.jsx`**

Add import at top (after existing imports):
```jsx
import Segmented from "../components/Segmented";
```

Find the filter buttons section. It currently renders individual `<button className="filter-btn">` elements. Replace the entire filter button group with:
```jsx
                  <Segmented
                    options={STATUS_FILTERS.map(f => ({ label: f === "alle" ? "Alle" : f.charAt(0).toUpperCase() + f.slice(1), value: f }))}
                    value={activeStatus}
                    onChange={setActiveStatus}
                    counts={Object.fromEntries(STATUS_FILTERS.map(f => [
                      f,
                      f === "alle"
                        ? containers.length + stacks.length
                        : containers.filter(c => c.status === f).length
                    ]))}
                  />
```

Also replace the view toggle buttons section (currently `.view-toggle` with `.view-btn`) — keep the existing class names `.view-toggle` / `.view-btn` since App.css already defines them. No JSX change needed for the view toggle.

Replace `.container-grid.grid-list` class on list container:
- Find: `<div className={...grid-list...}>` 
- Change list view wrapper to: `<div className="container-list">`
- Change grid view wrapper to: `<div className="container-grid">`

- [ ] **Step 7: Replace `frontend/src/components/StackCard.css`**

```css
.stack-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-card);
}

.stack-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stack-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  flex: 1;
}

.stack-card-status {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-3);
}
.stack-card-status.active { color: var(--run); }

.stack-containers { display: flex; flex-direction: column; gap: 4px; }

.stack-container-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--surface-sink);
  border-radius: var(--r-sm);
  font-size: 12px;
}

.stack-container-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.stack-dot-run  { background: var(--run); }
.stack-dot-stop { background: var(--ink-4); }
.stack-dot-warn { background: var(--warn); }

.stack-container-name {
  flex: 1;
  font-family: "JetBrains Mono", monospace;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stack-card-actions {
  display: flex;
  gap: 6px;
  border-top: 1px solid var(--line);
  padding-top: 10px;
}

.btn-stack {
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  background: var(--surface);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s;
}
.btn-stack:hover { border-color: var(--line-2); color: var(--ink); }
.btn-stack:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-stack-stop { color: var(--stop); border-color: var(--stop-soft); background: var(--stop-soft); }
.btn-stack-stop:hover { background: rgba(204,59,46,0.16); }
```

- [ ] **Step 8: Update `frontend/src/components/StackCard.jsx`**

In `StackCard.jsx`, replace all `--tb-*` color references in JSX inline styles and class names with new token equivalents:
- `var(--tb-running)` → `var(--run)`
- `var(--tb-error)` → `var(--stop)`
- `var(--tb-warning)` → `var(--warn)`
- `var(--tb-text-tertiary)` → `var(--ink-3)`
- Any hardcoded dark hex colors → appropriate `var(--ink-*)` tokens

Replace the class names on the card wrapper from `stack-card-glass` or similar → `stack-card`. Replace button classes to use `btn-stack` / `btn-stack-stop`.

- [ ] **Step 9: Build check**

```bash
cd /Users/larswenner/env-buddy/frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 10: Visual check**

Start dev server and open http://localhost:5173. Dashboard should show: white cards with hairline borders, StatusPill chips on each card, sparklines for CPU/RAM, Segmented filter control. No dark backgrounds on dashboard.

- [ ] **Step 11: Commit and merge**

```bash
git add frontend/src/components/ContainerCard.jsx frontend/src/components/ContainerCard.css frontend/src/components/DashboardStats.jsx frontend/src/components/DashboardStats.css frontend/src/pages/DashboardPage.jsx frontend/src/components/StackCard.jsx frontend/src/components/StackCard.css
git commit -m "feat: rebuild dashboard cards and stats with light design"
git checkout main && git merge feat/light-phase-4-dashboard
```

---

## Task 5: Overlays

**Branch:** `feat/light-phase-5-overlays`

**Files:**
- Modify: `frontend/src/components/StartDrawer.jsx` (use new class names)
- Modify: `frontend/src/components/StartForm.jsx` (light styles)
- Modify: `frontend/src/components/StartForm.css` (complete replacement)
- Modify: `frontend/src/components/CommandPalette.jsx` (light rebuild)
- Modify: `frontend/src/components/CommandPalette.css` (complete replacement)
- Modify: `frontend/src/components/Toast.jsx` (dark pill style)
- Modify: `frontend/src/components/Toast.css` (complete replacement)
- Modify: `frontend/src/components/ContainerEditModal.css` (token swap)
- Modify: `frontend/src/components/ContainerLogsModal.css` (token swap)
- Modify: `frontend/src/components/ResourceGraphModal.css` (token swap)
- Modify: `frontend/src/components/ProfileModal.css` (token swap)
- Modify: `frontend/src/components/CreateTemplateModal.css` (token swap)

- [ ] **Step 1: Create branch**

```bash
git checkout -b feat/light-phase-5-overlays
```

- [ ] **Step 2: Update `frontend/src/components/StartDrawer.jsx`**

The drawer already uses `.drawer-overlay`, `.drawer`, `.drawer-header`, `.drawer-title`, `.drawer-close`, `.drawer-body` class names. The only change needed is:

Find `className="drawer-overlay"` and change to `className="drawer-scrim"` (App.css defines `.drawer-scrim`).

No other changes needed — all other class names already match App.css definitions.

- [ ] **Step 3: Replace `frontend/src/components/StartForm.css`**

```css
.start-form { display: flex; flex-direction: column; gap: 16px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: "JetBrains Mono", monospace;
}

.form-input, .form-select {
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--surface-sink);
  color: var(--ink);
  font-size: 13px;
  outline: none;
  transition: border-color 0.12s;
  width: 100%;
}
.form-input:focus, .form-select:focus { border-color: var(--accent); background: var(--surface); }
.form-input::placeholder { color: var(--ink-4); }

.form-select { cursor: pointer; }

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.template-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--surface-sink);
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
}
.template-btn:hover { border-color: var(--line-2); background: var(--surface); }
.template-btn.selected { border-color: var(--accent); background: var(--accent-soft); }
.template-btn-icon { font-size: 20px; line-height: 1; }
.template-btn-label { font-size: 10px; color: var(--ink-3); text-align: center; }

.env-pairs { display: flex; flex-direction: column; gap: 6px; }
.env-pair { display: grid; grid-template-columns: 1fr 1fr auto; gap: 6px; align-items: center; }
.env-pair .form-input { height: 30px; font-size: 12px; font-family: "JetBrains Mono", monospace; }
.btn-env-remove {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--line); border-radius: var(--r-sm);
  background: transparent; color: var(--ink-3); cursor: pointer;
}
.btn-env-remove:hover { color: var(--stop); border-color: var(--stop-soft); }

.btn-env-add {
  height: 28px; padding: 0 10px;
  border: 1px dashed var(--line-2); border-radius: var(--r-sm);
  background: transparent; color: var(--ink-3);
  font-size: 12px; cursor: pointer; align-self: flex-start;
}
.btn-env-add:hover { border-color: var(--accent); color: var(--accent); }

.btn-start-submit {
  height: 40px;
  background: var(--accent);
  border: none;
  border-radius: var(--r-md);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
  width: 100%;
}
.btn-start-submit:hover { background: var(--accent-ink); }
.btn-start-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.form-error { font-size: 12px; color: var(--stop); }
```

- [ ] **Step 4: Replace `frontend/src/components/CommandPalette.css`**

```css
.cmd-scrim {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.25);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 300;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
}

.cmd {
  width: 600px;
  max-width: calc(100vw - 40px);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--shadow-pop);
  overflow: hidden;
  max-height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
}

.cmd-search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
}

.cmd-search-icon { color: var(--ink-3); flex-shrink: 0; }

.cmd-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  color: var(--ink);
}
.cmd-input::placeholder { color: var(--ink-4); }

.cmd-kbd {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  background: var(--surface-sink);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 2px 6px;
  color: var(--ink-3);
}

.cmd-results { overflow-y: auto; padding: 6px; }

.cmd-section { margin-bottom: 4px; }

.cmd-section-label {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-4);
  padding: 6px 10px 4px;
}

.cmd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: background 0.08s;
}
.cmd-item:hover, .cmd-item.active { background: var(--accent-soft); }

.cmd-item-icon { color: var(--ink-3); flex-shrink: 0; }
.cmd-item-label { font-size: 13px; color: var(--ink); flex: 1; }
.cmd-item-sub { font-size: 11px; color: var(--ink-3); }

.cmd-empty {
  padding: 32px 20px;
  text-align: center;
  color: var(--ink-3);
  font-size: 13px;
}
```

- [ ] **Step 5: Update `frontend/src/components/CommandPalette.jsx`**

In `CommandPalette.jsx`, replace the outer overlay class name from whatever it currently is to `cmd-scrim`, and the panel to `cmd`. Replace all `--tb-*` inline style references with new tokens. Replace the search input class to `cmd-input`. Replace result item classes to `cmd-item` / `cmd-item.active` / `cmd-item-icon` / `cmd-item-label`.

Keep all keyboard navigation logic (↑↓/↵/Esc) unchanged.

- [ ] **Step 6: Replace `frontend/src/components/Toast.css`**

```css
.toast-container {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 400;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--ink);
  color: #fff;
  border-radius: var(--r-pill);
  font-size: 13px;
  font-weight: 500;
  box-shadow: var(--shadow-pop);
  pointer-events: all;
  animation: toast-slide 0.15s var(--ease) both;
  max-width: 380px;
  white-space: nowrap;
}

.toast-strip { display: none; }

.toast-body { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }

.toast-msg { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }

.toast-action {
  background: rgba(255,255,255,0.15);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 8px;
  cursor: pointer;
  white-space: nowrap;
}
.toast-action:hover { background: rgba(255,255,255,0.25); }

.toast-close {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
  flex-shrink: 0;
}
.toast-close:hover { color: #fff; }

/* Type accent dots (subtle left border) */
.toast-success { border-left: 3px solid var(--run); }
.toast-error   { border-left: 3px solid var(--stop); }
.toast-warning { border-left: 3px solid var(--warn); }
.toast-info    { border-left: 3px solid var(--info); }
```

- [ ] **Step 7: Update modal CSS files (token swap)**

For each of the following files, do a global search-replace of all `--tb-*` tokens using the mapping below. Keep all layout/structure CSS unchanged, only replace token names.

**Token mapping:**
- `var(--tb-glass-1)` / `var(--tb-glass-2)` / `var(--tb-glass-modal)` → `var(--surface)`
- `var(--tb-stroke)` → `var(--line)`
- `var(--tb-stroke-strong)` → `var(--line-2)`
- `var(--tb-text-primary)` → `var(--ink)`
- `var(--tb-text-secondary)` → `var(--ink-2)`
- `var(--tb-text-tertiary)` → `var(--ink-3)`
- `var(--tb-text-quaternary)` → `var(--ink-4)`
- `var(--tb-text-on-accent)` → `#fff`
- `var(--tb-shadow-card)` / `var(--tb-shadow-float)` / `var(--tb-shadow-modal)` → `var(--shadow-pop)`
- `var(--tb-accent)` → `var(--accent)`
- `var(--tb-accent-hover)` → `var(--accent-ink)`
- `var(--tb-accent-soft)` → `var(--accent-soft)`
- `var(--tb-running)` → `var(--run)`
- `var(--tb-warning)` → `var(--warn)`
- `var(--tb-error)` → `var(--stop)`
- `var(--tb-info)` → `var(--info)`
- `var(--tb-running-soft)` → `var(--run-soft)`
- `var(--tb-error-soft)` → `var(--stop-soft)`
- `var(--tb-warning-soft)` → `var(--warn-soft)`
- `var(--tb-track)` → `var(--surface-sink)`
- `var(--tb-radius-xs)` / `var(--tb-radius-sm)` → `var(--r-sm)`
- `var(--tb-radius-md)` → `var(--r-md)`
- `var(--tb-radius-lg)` → `var(--r-card)`
- `var(--tb-radius-pill)` → `var(--r-pill)`
- `var(--tb-font-mono)` → `"JetBrains Mono", monospace`
- `var(--tb-font-display)` → `inherit`
- `var(--tb-space-1)` → `4px`, `var(--tb-space-2)` → `8px`, `var(--tb-space-3)` → `12px`
- `var(--tb-space-4)` → `16px`, `var(--tb-space-5)` → `20px`, `var(--tb-space-6)` → `24px`

Apply this mapping to:
- `frontend/src/components/ContainerEditModal.css`
- `frontend/src/components/ContainerLogsModal.css`
- `frontend/src/components/ResourceGraphModal.css`
- `frontend/src/components/ProfileModal.css`
- `frontend/src/components/CreateTemplateModal.css`

Also remove any `backdrop-filter: blur(...)` on modal card surfaces (keep it only on the overlay scrim).

- [ ] **Step 8: Build check**

```bash
cd /Users/larswenner/env-buddy/frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 9: Visual check**

Open app. Test:
1. Click "+ Neu" — drawer slides in from right with 14px gap, 18px radius, white background
2. Press ⌘K — command palette appears centered, light background
3. Perform an action (stop/start container) — toast appears at bottom as dark pill
4. Open profile modal — light modal with correct token colors

- [ ] **Step 10: Commit and merge**

```bash
git add frontend/src/components/StartDrawer.jsx frontend/src/components/StartForm.jsx frontend/src/components/StartForm.css frontend/src/components/CommandPalette.jsx frontend/src/components/CommandPalette.css frontend/src/components/Toast.jsx frontend/src/components/Toast.css frontend/src/components/ContainerEditModal.css frontend/src/components/ContainerLogsModal.css frontend/src/components/ResourceGraphModal.css frontend/src/components/ProfileModal.css frontend/src/components/CreateTemplateModal.css
git commit -m "feat: rebuild overlays and modals with light design"
git checkout main && git merge feat/light-phase-5-overlays
```

---

## Task 6: Pages + Cleanup

**Branch:** `feat/light-phase-6-pages`

**Files:**
- Modify: `frontend/src/pages/TemplatesPage.css` (token swap + light)
- Modify: `frontend/src/pages/TeamsPage.css` (token swap + light)
- Modify: `frontend/src/components/TeamStackBuilder.css` (token swap + light)
- Modify: `frontend/src/pages/MarketplacePage.css` (token swap + light)
- Modify: `frontend/src/pages/AuditPage.css` (token swap + light)
- Modify: `frontend/src/pages/AuditPage.jsx` (remove hardcoded dark colors)
- Modify: `frontend/src/pages/AuthPage.css` (complete replacement)
- Modify: `frontend/src/pages/AuthPage.jsx` (remove inline dark styles)
- Modify: `frontend/src/index.css` (remove backward-compat `--tb-*` aliases)

- [ ] **Step 1: Create branch**

```bash
git checkout -b feat/light-phase-6-pages
```

- [ ] **Step 2: Token swap for page CSS files**

Apply the same token mapping from Task 5 Step 7 to:
- `frontend/src/pages/TemplatesPage.css`
- `frontend/src/pages/TeamsPage.css`
- `frontend/src/components/TeamStackBuilder.css`
- `frontend/src/pages/MarketplacePage.css`
- `frontend/src/pages/AuditPage.css`

Additionally, add page-level layout to each file (if not already present):

```css
/* Add to each page CSS file */
.page-wrap {
  max-width: 1200px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--ink);
  margin: 0;
  letter-spacing: -0.02em;
}

.page-sub {
  font-size: 13px;
  color: var(--ink-3);
  margin: 4px 0 0;
}
```

- [ ] **Step 3: Update `frontend/src/pages/AuditPage.jsx`**

In `AuditPage.jsx`, find any hardcoded dark hex colors (e.g., `#cdd6f4`, `#a6e3a1`, `#f38ba8`) and replace with semantic tokens:
- Green/success colors → `var(--run)`
- Red/error colors → `var(--stop)`
- Blue/info colors → `var(--info)`
- Amber/warning colors → `var(--warn)`
- Light text colors → `var(--ink-3)`

Wrap the return content in `<div className="page-wrap">` if not already wrapped.

- [ ] **Step 4: Replace `frontend/src/pages/AuthPage.css`**

```css
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 24px;
}

.auth-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-pop);
  padding: 32px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auth-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  margin-bottom: 4px;
}

.auth-brand-icon { font-size: 28px; }

.auth-brand-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: -0.02em;
}

.auth-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  margin: 0;
  text-align: center;
}

.auth-subtitle {
  font-size: 13px;
  color: var(--ink-3);
  text-align: center;
  margin: 0;
}

.auth-form { display: flex; flex-direction: column; gap: 12px; }

.auth-field { display: flex; flex-direction: column; gap: 5px; }

.auth-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
}

.auth-input {
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--surface-sink);
  color: var(--ink);
  font-size: 13px;
  outline: none;
  transition: border-color 0.12s;
  width: 100%;
}
.auth-input:focus { border-color: var(--accent); background: var(--surface); }
.auth-input::placeholder { color: var(--ink-4); }

.auth-submit {
  height: 40px;
  background: var(--accent);
  border: none;
  border-radius: var(--r-md);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
  width: 100%;
  margin-top: 4px;
}
.auth-submit:hover { background: var(--accent-ink); }
.auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.auth-error {
  font-size: 12px;
  color: var(--stop);
  background: var(--stop-soft);
  border: 1px solid rgba(204,59,46,0.20);
  border-radius: var(--r-sm);
  padding: 8px 12px;
}

.auth-success {
  font-size: 12px;
  color: var(--run);
  background: var(--run-soft);
  border: 1px solid rgba(31,157,87,0.20);
  border-radius: var(--r-sm);
  padding: 8px 12px;
}

.auth-switch {
  text-align: center;
  font-size: 13px;
  color: var(--ink-3);
}

.auth-link {
  color: var(--accent);
  font-weight: 600;
  cursor: pointer;
  background: none;
  border: none;
  font-size: inherit;
  padding: 0;
}
.auth-link:hover { color: var(--accent-ink); }
```

- [ ] **Step 5: Update `frontend/src/pages/AuthPage.jsx`**

Replace all inline `style={{ ... }}` attributes that reference hardcoded dark colors or catppuccin tokens. Replace the outer wrapper class with `auth-page`, the card with `auth-card`. Replace form inputs with `auth-input` class, submit buttons with `auth-submit`, error messages with `auth-error`, success messages with `auth-success`, mode-switch link buttons with `auth-link`.

Add brand mark at top of auth card:
```jsx
<div className="auth-brand">
  <span className="auth-brand-icon">🧪</span>
  <span className="auth-brand-name">env-buddy</span>
</div>
```

Keep all auth logic (login/register/forgot-password/reset/verify flows) completely unchanged.

- [ ] **Step 6: Remove backward-compat aliases from `frontend/src/index.css`**

First, verify no `--tb-*` references remain in any source file:

```bash
grep -r "\-\-tb-" /Users/larswenner/env-buddy/frontend/src --include="*.css" --include="*.jsx" --include="*.js" -l
```

Expected: no output (empty). If files remain, fix them before proceeding.

Then in `frontend/src/index.css`, remove the entire "Backward-compat aliases" section — everything from the comment `/* ── Backward-compat aliases (removed in Phase 6 cleanup) ── */` down to the end of the `:root {}` block.

- [ ] **Step 7: Final build check**

```bash
cd /Users/larswenner/env-buddy/frontend && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 8: Verify no dark backgrounds**

```bash
cd /Users/larswenner/env-buddy/frontend && npm run dev
```

Navigate to each page (Dashboard, Templates, Teams, Marketplace, Audit). Confirm:
- All backgrounds are warm white / off-white
- No dark panels, no glass/blur on sidebar or cards
- Auth page (test by clearing localStorage) shows centered white card
- Orange accent `#e85d2a` throughout (buttons, active nav, etc.)
- JetBrains Mono on container names, ports, resource values

- [ ] **Step 9: Commit and merge**

```bash
git add frontend/src/pages/TemplatesPage.css frontend/src/pages/TeamsPage.css frontend/src/components/TeamStackBuilder.css frontend/src/pages/MarketplacePage.css frontend/src/pages/AuditPage.css frontend/src/pages/AuditPage.jsx frontend/src/pages/AuthPage.css frontend/src/pages/AuthPage.jsx frontend/src/index.css
git commit -m "feat: migrate all pages to light theme, remove tb-* backward-compat aliases"
git checkout main && git merge feat/light-phase-6-pages
```
