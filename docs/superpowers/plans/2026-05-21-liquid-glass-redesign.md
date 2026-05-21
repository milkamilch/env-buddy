# Liquid Glass Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 19 frontend CSS files — full rewrite from Catppuccin tokens to TestBud Liquid Glass (glassmorphism, orange accent #FF6B35, system fonts, Apple-inspired radii).

**Architecture:** Six sequential phases, each independently buildable. Token foundation in Phase 1 defines all `--tb-*` variables that every subsequent file consumes. No JSX logic changes — CSS class names are preserved.

**Tech Stack:** CSS custom properties, `backdrop-filter` glassmorphism, Tailwind v4 `@theme {}`, Vite 7, React 19

**Spec:** `docs/superpowers/specs/2026-05-21-liquid-glass-redesign.md`

**Glass patterns (used throughout all phases):**
```css
/* glass-1 — cards, toolbars */
background: var(--tb-glass-1);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid var(--tb-stroke);
box-shadow: var(--tb-shadow-card);

/* glass-2 — topbar, sidebar */
background: var(--tb-glass-2);
backdrop-filter: blur(40px) saturate(180%);
border: 1px solid var(--tb-stroke);

/* glass-modal — modals, drawer */
background: var(--tb-glass-modal);
backdrop-filter: blur(40px) saturate(180%);
border: 1px solid var(--tb-stroke);
box-shadow: var(--tb-shadow-modal);
```

**Token migration quick-ref:**
| Old | New |
|-----|-----|
| `--bg-base/mantle/surface` | glass values or `--tb-bg-page` |
| `--fg-text` | `--tb-text-primary` |
| `--fg-subtext1` | `--tb-text-secondary` |
| `--fg-subtext0` | `--tb-text-tertiary` |
| `--accent-blue` | `--tb-info` (cyan, informational) or `--tb-accent` (orange, action) |
| `--accent-green` | `--tb-running` |
| `--accent-red` | `--tb-error` |
| `--accent-peach` | `--tb-warning` |
| `--accent-mauve` | `--tb-network` |
| `border: 1px solid var(--bg-overlay0/1)` | `border: 1px solid var(--tb-stroke)` |
| `--radius-md` (8px) | `--tb-radius-md` (14px) for btns; `--tb-radius-lg` (20px) for cards |

---

### Task 1: Phase 1 — Foundation

**Files:**
- Modify: `frontend/src/index.css`

**What changes:** Remove Google Fonts import, inline all TestBud tokens, update `@theme {}` block, update html/body to use page gradient, keep existing animations.

- [ ] **Step 1: Replace `frontend/src/index.css` with the new token foundation**

```css
@import "tailwindcss";

/* =========================================================
   TestBud Design Tokens — Liquid Glass
   ========================================================= */
:root {
  --tb-font-display: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
    "Helvetica Neue", system-ui, sans-serif;
  --tb-font-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace;

  --tb-text-xs:    11px;
  --tb-text-sm:    12px;
  --tb-text-base:  13px;
  --tb-text-md:    15px;
  --tb-text-lg:    17px;
  --tb-text-xl:    22px;

  --tb-tracking-tight:  -0.02em;
  --tb-tracking-caps:    0.06em;

  --tb-space-1:  4px;  --tb-space-2:  8px;  --tb-space-3: 12px;
  --tb-space-4: 16px;  --tb-space-5: 20px;  --tb-space-6: 24px;
  --tb-space-7: 32px;  --tb-space-8: 48px;  --tb-space-9: 64px;

  --tb-radius-xs:   6px;
  --tb-radius-sm:  10px;
  --tb-radius-md:  14px;
  --tb-radius-lg:  20px;
  --tb-radius-xl:  28px;
  --tb-radius-2xl: 36px;
  --tb-radius-pill: 999px;

  /* Status — invariant across themes */
  --tb-running:  #30D158;
  --tb-warning:  #FF9F0A;
  --tb-error:    #FF453A;
  --tb-info:     #64D2FF;
  --tb-pending:  #FFD60A;
  --tb-network:  #BF5AF2;

  /* Accent — TestBud orange */
  --tb-accent:        #FF6B35;
  --tb-accent-hover:  #FF8559;
  --tb-accent-soft:   color-mix(in oklch, var(--tb-accent) 14%, transparent);
}

/* ── Dark mode (default) ── */
:root,
:root[data-theme="dark"] {
  color-scheme: dark;

  --tb-bg-page: #0B0B0F;
  --tb-bg-page-grad:
    radial-gradient(1200px 600px at 80% -10%, rgba(255,107,53,0.10), transparent 60%),
    radial-gradient(900px 500px at 5% 110%, rgba(191,90,242,0.08), transparent 55%),
    linear-gradient(180deg, #0B0B0F 0%, #07070A 100%);

  --tb-glass-1:     rgba(28, 28, 32, 0.55);
  --tb-glass-2:     rgba(36, 36, 42, 0.72);
  --tb-glass-3:     rgba(44, 44, 52, 0.85);
  --tb-glass-modal: rgba(22, 22, 28, 0.74);

  --tb-stroke:        rgba(255, 255, 255, 0.10);
  --tb-stroke-strong: rgba(255, 255, 255, 0.18);
  --tb-stroke-inset:  inset 0 1px 0 rgba(255, 255, 255, 0.06);

  --tb-text-primary:    rgba(255, 255, 255, 0.96);
  --tb-text-secondary:  rgba(255, 255, 255, 0.66);
  --tb-text-tertiary:   rgba(255, 255, 255, 0.42);
  --tb-text-quaternary: rgba(255, 255, 255, 0.24);
  --tb-text-on-accent:  #1A0A02;

  --tb-shadow-card:
    0 0.5px 0 rgba(255,255,255,0.08) inset,
    0 1px 2px rgba(0,0,0,0.30),
    0 8px 24px -8px rgba(0,0,0,0.50);
  --tb-shadow-float:
    0 0.5px 0 rgba(255,255,255,0.10) inset,
    0 8px 24px rgba(0,0,0,0.40),
    0 32px 64px -16px rgba(0,0,0,0.60);
  --tb-shadow-modal:
    0 0.5px 0 rgba(255,255,255,0.12) inset,
    0 24px 48px rgba(0,0,0,0.55),
    0 48px 96px -24px rgba(0,0,0,0.65);

  --tb-track: rgba(255, 255, 255, 0.08);

  --tb-running-soft:  color-mix(in oklch, var(--tb-running) 14%, transparent);
  --tb-error-soft:    color-mix(in oklch, var(--tb-error) 14%, transparent);
  --tb-info-soft:     color-mix(in oklch, var(--tb-info) 14%, transparent);
  --tb-network-soft:  color-mix(in oklch, var(--tb-network) 14%, transparent);
  --tb-warning-soft:  color-mix(in oklch, var(--tb-warning) 14%, transparent);
}

/* ── Light mode ── */
:root[data-theme="light"] {
  color-scheme: light;

  --tb-bg-page: #F2F2F5;
  --tb-bg-page-grad:
    radial-gradient(1100px 600px at 85% -10%, rgba(255,107,53,0.12), transparent 60%),
    radial-gradient(900px 500px at 0% 110%, rgba(191,90,242,0.08), transparent 55%),
    linear-gradient(180deg, #F6F6F9 0%, #EDEDF1 100%);

  --tb-glass-1:     rgba(255, 255, 255, 0.62);
  --tb-glass-2:     rgba(255, 255, 255, 0.78);
  --tb-glass-3:     rgba(255, 255, 255, 0.92);
  --tb-glass-modal: rgba(252, 252, 254, 0.82);

  --tb-stroke:        rgba(0, 0, 0, 0.08);
  --tb-stroke-strong: rgba(0, 0, 0, 0.14);
  --tb-stroke-inset:  inset 0 1px 0 rgba(255, 255, 255, 0.80);

  --tb-text-primary:    rgba(0, 0, 0, 0.92);
  --tb-text-secondary:  rgba(0, 0, 0, 0.60);
  --tb-text-tertiary:   rgba(0, 0, 0, 0.42);
  --tb-text-quaternary: rgba(0, 0, 0, 0.24);
  --tb-text-on-accent:  #FFFFFF;

  --tb-shadow-card:
    0 0.5px 0 rgba(255,255,255,0.80) inset,
    0 1px 2px rgba(15,15,20,0.06),
    0 8px 24px -8px rgba(15,15,20,0.10);
  --tb-shadow-float:
    0 0.5px 0 rgba(255,255,255,0.80) inset,
    0 8px 24px rgba(15,15,20,0.08),
    0 32px 64px -16px rgba(15,15,20,0.14);
  --tb-shadow-modal:
    0 0.5px 0 rgba(255,255,255,0.90) inset,
    0 24px 48px rgba(15,15,20,0.14),
    0 48px 96px -24px rgba(15,15,20,0.20);

  --tb-track: rgba(0, 0, 0, 0.06);

  --tb-running:  #28A745;
  --tb-warning:  #F58A00;
  --tb-error:    #E0352B;
  --tb-info:     #0A84FF;
  --tb-pending:  #E0A800;
  --tb-network:  #9D4EE0;

  --tb-running-soft:  color-mix(in oklch, var(--tb-running) 14%, transparent);
  --tb-error-soft:    color-mix(in oklch, var(--tb-error) 14%, transparent);
  --tb-info-soft:     color-mix(in oklch, var(--tb-info) 14%, transparent);
  --tb-network-soft:  color-mix(in oklch, var(--tb-network) 14%, transparent);
  --tb-warning-soft:  color-mix(in oklch, var(--tb-warning) 14%, transparent);
}

/* =========================================================
   Tailwind @theme
   ========================================================= */
@theme {
  --font-sans: var(--tb-font-display);
  --font-mono: var(--tb-font-mono);

  --color-glass-1:   var(--tb-glass-1);
  --color-glass-2:   var(--tb-glass-2);
  --color-ink:       var(--tb-text-primary);
  --color-ink-2:     var(--tb-text-secondary);
  --color-ink-3:     var(--tb-text-tertiary);
  --color-stroke:    var(--tb-stroke);
  --color-accent:    var(--tb-accent);
  --color-running:   var(--tb-running);
  --color-warning:   var(--tb-warning);
  --color-error:     var(--tb-error);
  --color-info:      var(--tb-info);
  --color-pending:   var(--tb-pending);
  --color-network:   var(--tb-network);

  --radius-xs:   var(--tb-radius-xs);
  --radius-sm:   var(--tb-radius-sm);
  --radius-md:   var(--tb-radius-md);
  --radius-lg:   var(--tb-radius-lg);
  --radius-xl:   var(--tb-radius-xl);
  --radius-2xl:  var(--tb-radius-2xl);
  --radius-pill: var(--tb-radius-pill);
}

/* =========================================================
   Global Resets
   ========================================================= */
*, *::before, *::after { box-sizing: border-box; }

html {
  background: var(--tb-bg-page);
  background-image: var(--tb-bg-page-grad);
  background-attachment: fixed;
  min-height: 100vh;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--tb-font-display);
  font-size: var(--tb-text-base);
  line-height: 1.5;
  color: var(--tb-text-primary);
  background: transparent;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button { font-family: inherit; cursor: pointer; }
input, textarea, select { font-family: inherit; }
h1, h2, h3 { line-height: 1.2; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.25); }

#root { min-height: 100vh; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

/* =========================================================
   Global Animations (unchanged)
   ========================================================= */
@keyframes spin        { to { transform: rotate(360deg); } }
@keyframes pulse-soft  { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
@keyframes toast-slide { from { opacity: 0; transform: translateX(1rem); } to { opacity: 1; transform: translateX(0); } }
@keyframes skeleton-shimmer {
  from { background-position: -200px 0; }
  to   { background-position: calc(200px + 100%) 0; }
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```
Expected: Exit 0, no errors.

- [ ] **Step 3: Verify lint passes**

```bash
cd frontend && npm run lint
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(css): phase 1 — TestBud token foundation, remove Google Fonts"
```

---

### Task 2: Phase 2 — Layout

**Files:**
- Modify: `frontend/src/App.css`

**What changes:** Sidebar shrinks 240px→200px. Topbar: 56px→52px, glass-2 surface, logo becomes orange. Sidebar: glass-1 surface, active nav item uses orange accent. Drawer: glass-modal, rounded left corners. Toolbar: glass-1. All old Catppuccin variables replaced.

- [ ] **Step 1: Replace `frontend/src/App.css`**

```css
:root {
  --sidebar-width: 200px;
}

/* === App Shell === */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
  color: var(--tb-text-primary);
}

/* === Topbar === */
.topbar {
  height: 52px;
  display: flex;
  align-items: center;
  gap: var(--tb-space-3);
  padding: 0 var(--tb-space-4);
  background: var(--tb-glass-2);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-bottom: 1px solid var(--tb-stroke);
  flex-shrink: 0;
  z-index: 50;
}

.topbar-logo-icon {
  font-family: var(--tb-font-display);
  font-size: 15px;
  font-weight: 700;
  color: var(--tb-accent);
  letter-spacing: var(--tb-tracking-tight);
}

.topbar-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--tb-space-2);
  font-size: 13px;
}

.topbar-bc-parent  { color: var(--tb-text-tertiary); }
.topbar-bc-sep     { color: var(--tb-text-quaternary); }
.topbar-bc-current { color: var(--tb-text-primary); font-weight: 500; }

.topbar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--tb-space-2);
}

.topbar-cmdk-pill {
  display: flex;
  align-items: center;
  gap: var(--tb-space-2);
  background: rgba(255,255,255,.06);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-pill);
  padding: 5px 10px;
  color: var(--tb-text-tertiary);
  font-size: 12px;
  cursor: default;
  transition: border-color 0.12s;
}
.topbar-cmdk-pill:hover { border-color: var(--tb-stroke-strong); }

.topbar-cmdk-key {
  font-family: var(--tb-font-mono);
  font-size: 10px;
  background: rgba(255,255,255,.08);
  border-radius: 3px;
  padding: 1px 4px;
  color: var(--tb-text-secondary);
}

.topbar-icon-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--tb-text-secondary);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.topbar-icon-btn:hover { background: rgba(255,255,255,.08); color: var(--tb-text-primary); }

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
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  border: 1.5px solid var(--tb-accent-soft);
}

/* === App Body === */
.app-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* === Sidebar === */
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  background: var(--tb-glass-1);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-right: 1px solid var(--tb-stroke);
  display: flex;
  flex-direction: column;
  padding: var(--tb-space-3) 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0 var(--tb-space-2);
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: var(--tb-space-3);
  height: 38px;
  padding: 0 var(--tb-space-3);
  border-radius: var(--tb-radius-sm);
  border: none;
  background: transparent;
  color: var(--tb-text-tertiary);
  font-family: var(--tb-font-display);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s, color 0.12s;
  margin: 1px 6px;
}
.sidebar-nav-item:hover {
  background: rgba(255,255,255,.07);
  color: var(--tb-text-primary);
}
.sidebar-nav-item.active {
  background: rgba(255, 107, 53, 0.15);
  color: var(--tb-text-primary);
  box-shadow: inset 2px 0 0 var(--tb-accent);
  border-radius: 0 var(--tb-radius-sm) var(--tb-radius-sm) 0;
  padding-left: calc(var(--tb-space-3) - 2px);
}
.sidebar-nav-icon { flex-shrink: 0; }
.sidebar-nav-label { flex: 1; }

/* === App Content === */
.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: transparent;
  overflow-y: auto;
}

/* === Dashboard Page === */
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: var(--tb-space-4);
  padding: var(--tb-space-5);
  max-width: 1200px;
  width: 100%;
}

/* === Error Banner === */
.error-banner {
  background: var(--tb-error-soft);
  border-bottom: 1px solid var(--tb-error);
  color: var(--tb-error);
  padding: var(--tb-space-3) var(--tb-space-5);
  font-size: 13px;
}

/* === Content Header === */
.content-header {
  display: flex;
  align-items: center;
  gap: var(--tb-space-3);
}

.content-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--tb-text-primary);
}

/* === Drawer === */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 90;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  background: var(--tb-glass-modal);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-left: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-xl) 0 0 var(--tb-radius-xl);
  box-shadow: var(--tb-shadow-float);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 var(--tb-space-5);
  border-bottom: 1px solid var(--tb-stroke);
  flex-shrink: 0;
}

.drawer-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--tb-text-primary);
}

.drawer-close {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--tb-text-secondary);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.drawer-close:hover { background: rgba(255,255,255,.08); color: var(--tb-text-primary); }

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--tb-space-5);
}

/* === Global Buttons === */
.btn-start-all {
  background: transparent;
  border: 1px solid var(--tb-running);
  border-radius: var(--tb-radius-sm);
  color: var(--tb-running);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-start-all:hover { background: var(--tb-running-soft); }
.btn-start-all:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-open-drawer {
  margin-left: auto;
  background: var(--tb-accent);
  border: none;
  border-radius: var(--tb-radius-md);
  color: var(--tb-text-on-accent);
  font-size: 13px;
  font-weight: 600;
  padding: 6px 14px;
  cursor: pointer;
  transition: background 0.12s;
}
.btn-open-drawer:hover { background: var(--tb-accent-hover); }

.container-count {
  background: rgba(255,255,255,.08);
  color: var(--tb-text-secondary);
  border-radius: var(--tb-radius-pill);
  padding: 2px 8px;
  font-size: 12px;
  font-family: var(--tb-font-mono);
  font-weight: 500;
}

/* === Loading / Empty === */
.loading-spinner-wrap {
  display: flex;
  justify-content: center;
  padding: var(--tb-space-8) var(--tb-space-5);
}
.loading-spinner {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(255,255,255,.12);
  border-top-color: var(--tb-accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* === Toolbar === */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--tb-space-3);
  align-items: center;
  background: var(--tb-glass-1);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-lg);
  padding: var(--tb-space-3) var(--tb-space-4);
}

.search-wrapper {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,.06);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-sm);
  padding: 0 var(--tb-space-2);
  gap: var(--tb-space-2);
  min-width: 180px;
  flex: 1;
  max-width: 300px;
  height: 32px;
}
.search-wrapper:focus-within { border-color: var(--tb-accent); }
.search-icon { font-size: 12px; flex-shrink: 0; color: var(--tb-text-tertiary); }
.search-input {
  background: transparent;
  border: none;
  color: var(--tb-text-primary);
  font-size: 13px;
  flex: 1;
  outline: none;
  padding: 0;
}
.search-input::placeholder { color: var(--tb-text-tertiary); }
.search-clear { background: transparent; border: none; color: var(--tb-text-tertiary); cursor: pointer; font-size: 11px; padding: 0; }
.search-clear:hover { color: var(--tb-text-primary); }

.filter-group { display: flex; align-items: center; gap: var(--tb-space-1); flex-wrap: nowrap; overflow-x: auto; }
.filter-label { font-size: 11px; color: var(--tb-text-tertiary); flex-shrink: 0; }
.filter-btn {
  background: rgba(255,255,255,.06);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-xs);
  color: var(--tb-text-secondary);
  font-size: 11px;
  padding: 3px 8px;
  cursor: pointer;
  transition: all 0.12s;
  text-transform: capitalize;
  flex-shrink: 0;
  height: 24px;
}
.filter-btn:hover { border-color: var(--tb-stroke-strong); color: var(--tb-text-primary); }
.filter-btn.active { background: var(--tb-accent-soft); border-color: var(--tb-accent); color: var(--tb-accent); }
.filter-status-running.active { border-color: var(--tb-running); color: var(--tb-running); background: var(--tb-running-soft); }
.filter-status-paused.active  { border-color: var(--tb-warning); color: var(--tb-warning); background: var(--tb-warning-soft); }
.filter-status-exited.active  { border-color: var(--tb-error);   color: var(--tb-error);   background: var(--tb-error-soft); }

.view-toggle { display: flex; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); padding: 3px; }
.view-btn { background: transparent; border: none; border-radius: var(--tb-radius-xs); color: var(--tb-text-tertiary); padding: 3px 8px; font-size: 14px; cursor: pointer; transition: background 0.12s, color 0.12s; }
.view-btn.active { background: rgba(255,255,255,.10); color: var(--tb-text-primary); }
.btn-view-toggle { background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-secondary); font-size: 12px; padding: 4px 10px; cursor: pointer; }
.btn-view-toggle.active { background: rgba(255,255,255,.10); color: var(--tb-text-primary); }

.container-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: var(--tb-space-4); }
.container-grid.grid-list { display: flex; flex-direction: column; gap: var(--tb-space-2); }

.section-block { display: flex; flex-direction: column; gap: var(--tb-space-3); }
.section-label {
  font-family: var(--tb-font-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tb-tracking-caps);
  color: var(--tb-text-tertiary);
  display: flex;
  align-items: center;
  gap: var(--tb-space-2);
}
.section-count { background: rgba(255,255,255,.08); color: var(--tb-text-secondary); border-radius: var(--tb-radius-pill); padding: 1px 6px; font-size: 10px; }
.section-divider { border: none; border-top: 1px solid var(--tb-stroke); margin: 0; }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--tb-space-3); padding: var(--tb-space-8) var(--tb-space-5); text-align: center; }
.empty-state-icon { opacity: 0.3; }
.empty-state-title { margin: 0; font-size: 20px; font-weight: 600; color: var(--tb-text-tertiary); }
.empty-state-sub { margin: 0; font-size: 13px; color: var(--tb-text-tertiary); max-width: 320px; }

.bulk-bar {
  position: fixed; bottom: 0; left: var(--sidebar-width); right: 0; z-index: 80;
  background: var(--tb-glass-2);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-top: 1px solid var(--tb-stroke);
  padding: var(--tb-space-3) var(--tb-space-5);
  display: flex; gap: var(--tb-space-3); align-items: center;
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Verify lint passes**

```bash
cd frontend && npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.css
git commit -m "feat(css): phase 2 — glass layout (topbar 52px, sidebar 200px, orange accent)"
```

---

### Task 3: Phase 3 — Cards & Dashboard

**Files:**
- Modify: `frontend/src/components/ContainerCard.css`
- Modify: `frontend/src/components/StackCard.css`
- Modify: `frontend/src/components/DashboardStats.css`

---

#### ContainerCard.css

- [ ] **Step 1: Replace `frontend/src/components/ContainerCard.css`**

```css
/* ── Card surface ── */
.container-card {
  background: var(--tb-glass-1);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-lg);
  padding: var(--tb-space-4);
  display: flex;
  flex-direction: column;
  gap: 0;
  box-shadow: var(--tb-shadow-card);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.container-card:hover { border-color: var(--tb-stroke-strong); }

/* ── Header ── */
.card-header {
  display: flex;
  align-items: center;
  gap: var(--tb-space-3);
  margin-bottom: var(--tb-space-3);
}

/* ── Status dot with glow ── */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot-running  { background: var(--tb-running); box-shadow: 0 0 10px var(--tb-running); }
.status-dot-paused   { background: var(--tb-warning); box-shadow: 0 0 8px var(--tb-warning); }
.status-dot-exited   { background: var(--tb-error); box-shadow: 0 0 8px var(--tb-error); }
.status-dot-stopped  { background: var(--tb-text-tertiary); }
.status-dot-starting { background: var(--tb-info); box-shadow: 0 0 8px var(--tb-info); animation: pulse-soft 1.5s infinite; }
.status-dot-pending  { background: var(--tb-pending); box-shadow: 0 0 8px var(--tb-pending); }

/* ── Status labels ── */
.card-status-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
.status-running  { color: var(--tb-running); }
.status-paused   { color: var(--tb-warning); }
.status-exited   { color: var(--tb-error); }
.status-stopped  { color: var(--tb-text-tertiary); }
.status-starting { color: var(--tb-info); }
.status-pending  { color: var(--tb-pending); }

/* ── Card image / tag ── */
.card-image {
  font-family: var(--tb-font-mono);
  font-size: 11px;
  color: var(--tb-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

/* ── Timer chip ── */
.card-timer {
  font-family: var(--tb-font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--tb-text-secondary);
  background: rgba(255,255,255,.07);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-pill);
  padding: 2px 8px;
  flex-shrink: 0;
}
.card-timer.urgent {
  color: var(--tb-error);
  background: var(--tb-error-soft);
  border-color: var(--tb-error);
}

/* ── More button ── */
.card-more {
  background: transparent;
  border: none;
  color: var(--tb-text-tertiary);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 6px;
  font-size: 14px;
  flex-shrink: 0;
  transition: color 0.12s, background 0.12s;
}
.card-more:hover { color: var(--tb-text-primary); background: rgba(255,255,255,.08); }

/* ── Name & sub ── */
.card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--tb-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.card-sub {
  font-size: 11px;
  color: var(--tb-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: var(--tb-space-3);
}

/* ── Stats area ── */
.card-stats {
  display: flex;
  flex-direction: column;
  gap: var(--tb-space-2);
  margin-bottom: var(--tb-space-3);
}

.stat-row { display: flex; align-items: center; gap: var(--tb-space-2); }
.stat-lbl { font-size: 11px; color: var(--tb-text-tertiary); width: 3rem; flex-shrink: 0; }
.stat-val { font-size: 11px; font-weight: 600; color: var(--tb-text-secondary); font-family: var(--tb-font-mono); min-width: 3.5rem; }

/* Progress bar */
.stat-bar-track {
  flex: 1;
  height: 4px;
  background: var(--tb-track);
  border-radius: 2px;
  overflow: hidden;
}
.stat-bar-fill-cpu  { height: 100%; background: var(--tb-info);    border-radius: 2px; transition: width 0.4s; }
.stat-bar-fill-ram  { height: 100%; background: var(--tb-running); border-radius: 2px; transition: width 0.4s; }

/* ── Sparkline ── */
.stat-sparkline { flex: 0 0 60px; }

/* ── Card spacer / divider ── */
.card-spacer { flex: 1; }
.card-divider { border: none; border-top: 1px solid rgba(255,255,255,.07); margin: 0 0 var(--tb-space-3); }

/* ── Actions ── */
.card-actions {
  display: flex;
  gap: var(--tb-space-2);
  align-items: center;
  flex-wrap: wrap;
}

/* Shared small button base */
.btn-sm {
  border-radius: var(--tb-radius-sm);
  font-size: 12px;
  font-weight: 500;
  padding: 5px 10px;
  border: none;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
  white-space: nowrap;
}

.btn-default, .btn-ghost {
  background: transparent;
  border: 1px solid var(--tb-stroke-strong);
  color: var(--tb-text-secondary);
}
.btn-default:hover, .btn-ghost:hover {
  background: rgba(255,255,255,.08);
  color: var(--tb-text-primary);
}

.btn-destructive, .btn-danger {
  background: var(--tb-error-soft);
  border: 1px solid var(--tb-error);
  color: var(--tb-error);
}
.btn-destructive:hover, .btn-danger:hover { background: color-mix(in oklch, var(--tb-error) 22%, transparent); }

.btn-primary, .btn-accent {
  background: var(--tb-accent);
  border: none;
  color: var(--tb-text-on-accent);
  font-weight: 600;
}
.btn-primary:hover, .btn-accent:hover { background: var(--tb-accent-hover); }

/* Icon-only small button */
.btn-icon-sm {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--tb-stroke);
  border-radius: 8px;
  color: var(--tb-text-tertiary);
  cursor: pointer;
  transition: all 0.12s;
}
.btn-icon-sm:hover { border-color: var(--tb-stroke-strong); color: var(--tb-text-primary); background: rgba(255,255,255,.06); }

/* ── Live badge ── */
.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--tb-running-soft);
  border: 1px solid var(--tb-running);
  border-radius: var(--tb-radius-pill);
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  color: var(--tb-running);
  letter-spacing: 0.05em;
}
.live-badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--tb-running);
  animation: pulse-soft 2s infinite;
}

/* ── Confirm label ── */
.confirm-label { font-size: 11px; color: var(--tb-warning); white-space: nowrap; }

/* ── Connection string ── */
.card-connection {
  margin-top: var(--tb-space-2);
  display: flex;
  align-items: center;
  gap: var(--tb-space-2);
  padding: var(--tb-space-2) var(--tb-space-3);
  background: rgba(255,255,255,.04);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-sm);
}
.card-conn-str {
  font-family: var(--tb-font-mono);
  font-size: 11px;
  color: var(--tb-text-secondary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.btn-copy-conn {
  background: transparent;
  border: none;
  color: var(--tb-text-tertiary);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
  flex-shrink: 0;
  transition: color 0.12s;
}
.btn-copy-conn:hover { color: var(--tb-accent); }

/* ── Health badge ── */
.health-badge { font-size: 10px; font-weight: 700; border-radius: var(--tb-radius-xs); padding: 2px 6px; }
.health-up   { background: var(--tb-running-soft); color: var(--tb-running); border: 1px solid var(--tb-running); }
.health-down { background: var(--tb-error-soft);   color: var(--tb-error);   border: 1px solid var(--tb-error); }

/* ── Row view ── */
.container-row {
  display: flex;
  align-items: center;
  gap: var(--tb-space-3);
  background: var(--tb-glass-1);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-sm);
  padding: var(--tb-space-2) var(--tb-space-4);
  transition: border-color 0.15s;
}
.container-row:hover { border-color: var(--tb-stroke-strong); }
.row-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.row-name { font-size: 13px; font-weight: 600; color: var(--tb-text-primary); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row-port { font-size: 12px; color: var(--tb-info); font-weight: 600; font-family: var(--tb-font-mono); }
.row-sparkline { flex-shrink: 0; }
.row-cpu-val { font-size: 11px; color: var(--tb-text-secondary); font-family: var(--tb-font-mono); width: 3rem; text-align: right; flex-shrink: 0; }
.row-timer { font-size: 11px; color: var(--tb-text-tertiary); font-family: var(--tb-font-mono); flex-shrink: 0; }
.row-started-by { font-size: 11px; color: var(--tb-text-tertiary); flex-shrink: 0; }
.row-actions { display: flex; gap: var(--tb-space-1); flex-shrink: 0; }
```

#### StackCard.css

- [ ] **Step 2: Replace `frontend/src/components/StackCard.css`**

```css
.stack-card {
  background: var(--tb-glass-1);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-lg);
  padding: var(--tb-space-4);
  display: flex;
  flex-direction: column;
  gap: 0;
  box-shadow: var(--tb-shadow-card);
  transition: border-color 0.2s;
}
.stack-card:hover { border-color: var(--tb-stroke-strong); }

.stack-header { display: flex; align-items: center; gap: 0.75rem; }
.stack-icons { display: flex; gap: 0.2rem; flex-shrink: 0; }
.stack-icon-chip { font-size: 1.25rem; line-height: 1; }
.stack-icon-more { font-size: 0.75rem; color: var(--tb-text-tertiary); align-self: center; padding-left: 0.2rem; }

.stack-title { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
.stack-name { font-size: 0.95rem; font-weight: 600; color: var(--tb-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stack-status { font-size: 0.72rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; color: var(--tb-text-secondary); }

.status-running { color: var(--tb-running); }
.status-partial  { color: var(--tb-warning); }
.status-stopped  { color: var(--tb-text-tertiary); }

.stack-status-row { display: flex; align-items: center; gap: 0.6rem; }
.stack-countdown { font-size: 0.75rem; color: var(--tb-text-tertiary); }
.stack-network { font-size: 0.72rem; color: var(--tb-text-tertiary); font-family: var(--tb-font-mono); margin-top: 0.15rem; opacity: 0.75; }

.countdown-urgent { color: var(--tb-warning); font-weight: 600; animation: pulse-soft 1.5s ease-in-out infinite; }

.stack-actions { display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0; }

.btn-expand {
  background: transparent;
  border: 1px solid var(--tb-stroke);
  color: var(--tb-text-secondary);
  border-radius: var(--tb-radius-xs);
  padding: 0.3rem 0.55rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.btn-expand:hover { background: rgba(255,255,255,.07); border-color: var(--tb-info); color: var(--tb-info); }

.btn-stack-stop, .btn-stack-start, .btn-stack-remove {
  background: transparent;
  border-radius: var(--tb-radius-xs);
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}
.btn-stack-stop   { border: 1px solid var(--tb-error);   color: var(--tb-error); }
.btn-stack-stop:hover { background: var(--tb-error-soft); }
.btn-stack-start  { border: 1px solid var(--tb-running); color: var(--tb-running); }
.btn-stack-start:hover { background: var(--tb-running-soft); }
.btn-stack-remove { border: 1px solid var(--tb-stroke); color: var(--tb-text-tertiary); padding: 0.35rem 0.55rem; }
.btn-stack-remove:hover { background: var(--tb-error-soft); border-color: var(--tb-error); color: var(--tb-error); }

.confirm-label { font-size: 0.72rem; color: var(--tb-warning); white-space: nowrap; }
.btn-stack-confirm-yes, .btn-stack-confirm-no {
  background: transparent; border-radius: var(--tb-radius-xs);
  padding: 0.35rem 0.55rem; font-size: 0.8rem; cursor: pointer; transition: background 0.15s;
}
.btn-stack-confirm-yes { border: 1px solid var(--tb-running); color: var(--tb-running); }
.btn-stack-confirm-yes:hover { background: var(--tb-running-soft); }
.btn-stack-confirm-no  { border: 1px solid var(--tb-stroke); color: var(--tb-text-tertiary); }
.btn-stack-confirm-no:hover  { background: var(--tb-error-soft); border-color: var(--tb-error); color: var(--tb-error); }

.stack-containers {
  margin-top: var(--tb-space-4);
  display: flex; flex-direction: column; gap: 0.5rem;
  border-top: 1px solid var(--tb-stroke);
  padding-top: var(--tb-space-4);
}

.stack-container-row {
  display: flex; align-items: center; gap: 0.6rem;
  background: rgba(255,255,255,.04);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-sm);
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: border-color 0.15s;
}
.stack-container-row:hover { border-color: var(--tb-stroke-strong); }

.row-icon { font-size: 1.1rem; flex-shrink: 0; }
.row-info { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
.row-name { font-size: 0.8rem; font-weight: 600; color: var(--tb-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-status { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 500; }
.row-meta { display: flex; gap: 0.75rem; align-items: center; flex-shrink: 0; }
.row-port { font-size: 0.75rem; color: var(--tb-info); font-weight: 600; }
.row-stat { font-size: 0.75rem; font-weight: 600; }
.row-btns { display: flex; gap: 0.35rem; flex-shrink: 0; }

.btn-restart {
  background: transparent; border: 1px solid var(--tb-info); color: var(--tb-info);
  border-radius: var(--tb-radius-xs); padding: 0.25rem 0.5rem; font-size: 0.85rem;
  cursor: pointer; transition: background 0.15s; line-height: 1;
}
.btn-restart:hover:not(:disabled) { background: var(--tb-info-soft); }
.btn-restart:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-logs-sm {
  background: transparent; border: 1px solid var(--tb-stroke); color: var(--tb-text-tertiary);
  border-radius: var(--tb-radius-xs); padding: 0.25rem 0.5rem; font-size: 0.9rem;
  cursor: pointer; transition: all 0.15s; line-height: 1;
}
.btn-logs-sm:hover { background: var(--tb-info-soft); border-color: var(--tb-info); color: var(--tb-info); }

.btn-stop-sm {
  background: transparent; border: 1px solid var(--tb-error); color: var(--tb-error);
  border-radius: var(--tb-radius-xs); padding: 0.25rem 0.5rem; font-size: 0.8rem;
  cursor: pointer; transition: background 0.15s; line-height: 1;
}
.btn-stop-sm:hover { background: var(--tb-error-soft); }
```

#### DashboardStats.css

- [ ] **Step 3: Replace `frontend/src/components/DashboardStats.css`**

```css
.dash-stats {
  display: flex;
  gap: var(--tb-space-3);
  flex-wrap: wrap;
}

.stat-card {
  background: var(--tb-glass-1);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-lg);
  padding: var(--tb-space-4);
  flex: 1;
  min-width: 140px;
  box-shadow: var(--tb-shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--tb-space-2);
}

.stat-card-value {
  font-size: 26px;
  font-weight: 700;
  color: var(--tb-text-primary);
  letter-spacing: var(--tb-tracking-tight);
  line-height: 1;
}
.stat-green { color: var(--tb-running); }
.stat-red   { color: var(--tb-error); }
.stat-blue  { color: var(--tb-info); }

.stat-card-label {
  font-size: 11px;
  color: var(--tb-text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tb-tracking-caps);
  font-weight: 600;
}

.stat-divider { border: none; border-top: 1px solid var(--tb-stroke); margin: 0; }

.stat-card-bar { display: flex; flex-direction: column; gap: var(--tb-space-2); }

.stat-progress-track {
  height: 4px;
  background: var(--tb-track);
  border-radius: 2px;
  overflow: hidden;
}
.stat-progress-fill { height: 100%; border-radius: 2px; transition: width 0.4s; }

.stat-card-templates { display: flex; flex-direction: column; gap: var(--tb-space-2); }
.stat-template-bars { display: flex; flex-direction: column; gap: 5px; }
.stat-tpl-row { display: flex; align-items: center; gap: var(--tb-space-2); }
.stat-tpl-track { flex: 1; height: 3px; background: var(--tb-track); border-radius: 2px; overflow: hidden; }
.stat-tpl-fill { height: 100%; background: var(--tb-accent); border-radius: 2px; }
```

- [ ] **Step 4: Verify build passes**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: Verify lint passes**

```bash
cd frontend && npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ContainerCard.css frontend/src/components/StackCard.css frontend/src/components/DashboardStats.css
git commit -m "feat(css): phase 3 — glass cards (glow dots, live badge, orange accent btns)"
```

---

### Task 4: Phase 4 — Forms & Modals

**Files:**
- Modify: `frontend/src/components/StartForm.css`
- Modify: `frontend/src/components/ContainerEditModal.css`
- Modify: `frontend/src/components/ProfileModal.css`
- Modify: `frontend/src/components/CreateTemplateModal.css`
- Modify: `frontend/src/components/ResourceGraphModal.css`
- Modify: `frontend/src/components/TeamStackBuilder.css`

**Glass-modal pattern** (used by all modals):
```css
background: var(--tb-glass-modal);
backdrop-filter: blur(40px) saturate(180%);
-webkit-backdrop-filter: blur(40px) saturate(180%);
border: 1px solid var(--tb-stroke);
border-radius: var(--tb-radius-xl);  /* 28px */
box-shadow: var(--tb-shadow-modal);
```
**Overlay pattern** (used by all modal overlays):
```css
position: fixed; inset: 0; z-index: 1000;
background: rgba(0,0,0,0.5);
backdrop-filter: blur(8px);
-webkit-backdrop-filter: blur(8px);
display: flex; align-items: center; justify-content: center; padding: 1rem;
```

---

#### StartForm.css

- [ ] **Step 1: Replace `frontend/src/components/StartForm.css`**

Apply glass-1 surface to the form container, `--tb-*` tokens for all colors. Key class changes:
- `.start-form`: glass-1, `border-radius: var(--tb-radius-xl)` 
- form inputs (`.form-group select`, `.config-input`, `.scb-input`, `.si-input`, `.tsb-input`): `background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-primary);` — focus adds `border-color: var(--tb-accent)`
- `.mode-tab.active`: `background: rgba(255,255,255,.10); color: var(--tb-text-primary);`
- `.service-chip.selected`: `border-color: var(--tb-accent); background: var(--tb-accent-soft); color: var(--tb-accent);`
- `.btn-start`: `background: var(--tb-accent); color: var(--tb-text-on-accent); border-radius: var(--tb-radius-md);`
- `.stack-drop-zone.dz-over`: `border-color: var(--tb-accent); background: var(--tb-accent-soft);`
- `.palette-chip:hover`: `border-color: var(--tb-accent); color: var(--tb-text-primary);`
- `.scb-image`: `color: var(--tb-accent);` (was accent-blue)
- `.btn-back`: `background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); color: var(--tb-text-secondary);`

```css
.start-form {
  background: var(--tb-glass-1);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-xl);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.start-form h2 { margin: 0; font-size: 1.1rem; color: var(--tb-text-primary); }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; }
.form-group label { font-size: 0.85rem; color: var(--tb-text-secondary); }
.form-group select {
  background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-sm); color: var(--tb-text-primary);
  padding: 0.5rem 0.75rem; font-size: 0.95rem; cursor: pointer;
}
.form-group select:focus { outline: none; border-color: var(--tb-accent); }
.form-group input[type="range"] { accent-color: var(--tb-accent); width: 100%; cursor: pointer; }
.range-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--tb-text-tertiary); }
.custom-multi-hint { font-size: 0.78rem; color: var(--tb-text-tertiary); background: rgba(255,255,255,.04); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); padding: 0.4rem 0.65rem; margin: 0; }
.form-error { color: var(--tb-error); font-size: 0.85rem; margin: 0; background: var(--tb-error-soft); border: 1px solid var(--tb-error); border-radius: var(--tb-radius-xs); padding: 0.5rem 0.75rem; }
.btn-start { background: var(--tb-accent); color: var(--tb-text-on-accent); border: none; border-radius: var(--tb-radius-md); padding: 0.6rem 1.2rem; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-start:hover:not(:disabled) { background: var(--tb-accent-hover); }
.btn-start:disabled { opacity: 0.5; cursor: not-allowed; }
.mode-tabs { display: flex; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); padding: 3px; }
.mode-tab { flex: 1; background: transparent; border: none; border-radius: var(--tb-radius-xs); color: var(--tb-text-tertiary); padding: 0.35rem 0; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s; }
.mode-tab.active { background: rgba(255,255,255,.10); color: var(--tb-text-primary); }
.mode-tab:hover:not(.active) { color: var(--tb-text-secondary); }
.stack-name-input { background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-primary); padding: 0.5rem 0.75rem; font-size: 0.9rem; width: 100%; box-sizing: border-box; }
.stack-name-input:focus { outline: none; border-color: var(--tb-accent); }
.stack-name-input::placeholder { color: var(--tb-text-tertiary); }
.label-hint { color: var(--tb-accent); font-size: 0.78rem; }
.service-grid { display: flex; flex-wrap: wrap; gap: 0.4rem; max-height: 220px; overflow-y: auto; padding: 0.25rem 0; }
.service-chip { display: flex; align-items: center; gap: 0.3rem; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-secondary); padding: 0.3rem 0.6rem; font-size: 0.78rem; cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s; white-space: nowrap; }
.service-chip:hover { border-color: var(--tb-stroke-strong); color: var(--tb-text-primary); }
.service-chip.selected { border-color: var(--tb-accent); background: var(--tb-accent-soft); color: var(--tb-accent); }
.chip-label { font-weight: 500; }
.btn-config-toggle { display: flex; justify-content: space-between; align-items: center; width: 100%; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-secondary); padding: 0.45rem 0.75rem; font-size: 0.85rem; cursor: pointer; transition: border-color 0.15s, color 0.15s; }
.btn-config-toggle:hover, .btn-config-toggle.open { border-color: var(--tb-stroke-strong); color: var(--tb-text-primary); }
.toggle-arrow { font-size: 0.7rem; color: var(--tb-text-tertiary); }
.config-panel { background: rgba(255,255,255,.04); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.7rem; }
.config-section-label { font-size: 0.75rem; color: var(--tb-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.3rem; }
.config-row { display: flex; align-items: center; gap: 0.75rem; }
.config-label { font-size: 0.82rem; color: var(--tb-text-secondary); width: 6.5rem; flex-shrink: 0; }
.config-input { flex: 1; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-primary); padding: 0.4rem 0.7rem; font-size: 0.88rem; min-width: 0; }
.config-input:focus { outline: none; border-color: var(--tb-accent); }
.config-input::placeholder { color: var(--tb-text-tertiary); }
.config-input-sm { max-width: 7.5rem; flex: 0 0 7.5rem; }
.config-mem-slider { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
.config-mem-slider input[type="range"] { width: 100%; accent-color: var(--tb-accent); cursor: pointer; }
.config-mem-labels { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--tb-text-tertiary); }
.config-mem-value { font-size: 0.82rem; font-weight: 600; color: var(--tb-accent); text-align: right; min-width: 4.5rem; flex-shrink: 0; }
.config-env-row { display: flex; align-items: center; gap: 0.4rem; }
.config-env-key { flex: 0 0 40%; font-family: var(--tb-font-mono); font-size: 0.8rem; }
.config-env-val { flex: 1; font-family: var(--tb-font-mono); font-size: 0.8rem; }
.config-env-sep { color: var(--tb-text-tertiary); font-size: 0.9rem; flex-shrink: 0; }
.btn-env-remove { background: transparent; border: none; color: var(--tb-text-tertiary); cursor: pointer; font-size: 0.75rem; padding: 0.2rem 0.3rem; border-radius: 4px; flex-shrink: 0; }
.btn-env-remove:hover { color: var(--tb-error); }
.btn-add-env { background: transparent; border: 1px dashed var(--tb-stroke-strong); border-radius: var(--tb-radius-xs); color: var(--tb-text-tertiary); padding: 0.3rem 0.6rem; font-size: 0.8rem; cursor: pointer; transition: border-color 0.15s, color 0.15s; align-self: flex-start; margin-top: 0.1rem; }
.btn-add-env:hover { border-color: var(--tb-accent); color: var(--tb-accent); }
.stack-step-header { display: flex; flex-direction: column; gap: 0.1rem; }
.stack-step-label { font-size: 0.7rem; color: var(--tb-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
.stack-step-title { font-size: 0.9rem; font-weight: 600; color: var(--tb-text-primary); }
.chip-multi { background: rgba(255,255,255,.08); color: var(--tb-text-secondary); font-size: 0.65rem; border-radius: 99px; padding: 0.05rem 0.35rem; font-weight: 700; line-height: 1.4; }
.stack-containers-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 340px; overflow-y: auto; }
.stack-container-block { background: rgba(255,255,255,.04); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); padding: 0.75rem; display: flex; flex-direction: column; gap: 0.45rem; }
.scb-header { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.1rem; }
.scb-image { font-size: 0.8rem; font-weight: 600; color: var(--tb-accent); font-family: var(--tb-font-mono); }
.scb-from { font-size: 0.7rem; color: var(--tb-text-tertiary); }
.scb-row { display: flex; align-items: center; gap: 0.5rem; }
.scb-label { font-size: 0.75rem; color: var(--tb-text-tertiary); width: 5.5rem; flex-shrink: 0; }
.scb-input { flex: 1; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-primary); font-size: 0.82rem; padding: 0.3rem 0.5rem; outline: none; transition: border-color 0.15s; }
.scb-input:focus { border-color: var(--tb-accent); }
.scb-input-sm { max-width: 140px; }
.scb-env-label { font-size: 0.72rem; color: var(--tb-text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 0.1rem; }
.stack-step2-actions { display: flex; gap: 0.5rem; }
.btn-back { background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-secondary); font-size: 0.875rem; padding: 0.6rem 0.9rem; cursor: pointer; transition: border-color 0.15s, color 0.15s; flex-shrink: 0; }
.btn-back:hover { border-color: var(--tb-stroke-strong); color: var(--tb-text-primary); }
.stack-palette-label { font-size: 0.72rem; color: var(--tb-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
.stack-palette { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.palette-chip { display: flex; align-items: center; gap: 0.3rem; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-secondary); padding: 0.28rem 0.55rem; font-size: 0.78rem; cursor: grab; user-select: none; transition: border-color 0.15s, background 0.15s, color 0.15s; white-space: nowrap; }
.palette-chip:hover { border-color: var(--tb-accent); color: var(--tb-text-primary); background: rgba(255,255,255,.08); }
.palette-chip:active { cursor: grabbing; }
.palette-label { font-weight: 500; }
.palette-multi { background: rgba(255,255,255,.08); color: var(--tb-text-secondary); font-size: 0.62rem; border-radius: 99px; padding: 0.05rem 0.3rem; font-weight: 700; line-height: 1.4; }
.stack-drop-zone { min-height: 72px; border: 1.5px dashed var(--tb-stroke-strong); border-radius: var(--tb-radius-sm); padding: 0.5rem; display: flex; flex-direction: column; gap: 0.45rem; transition: border-color 0.15s, background 0.15s; }
.stack-drop-zone.dz-over { border-color: var(--tb-accent); background: var(--tb-accent-soft); }
.dz-empty { display: flex; align-items: center; justify-content: center; min-height: 52px; pointer-events: none; }
.dz-hint { font-size: 0.8rem; color: var(--tb-text-tertiary); }
.si-block { background: rgba(255,255,255,.04); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); overflow: hidden; }
.si-header { display: flex; align-items: center; gap: 0.45rem; padding: 0.45rem 0.6rem; }
.si-icon { font-size: 1rem; flex-shrink: 0; }
.si-name { font-size: 0.82rem; font-weight: 600; color: var(--tb-text-primary); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.si-image { font-size: 0.72rem; color: var(--tb-text-tertiary); font-family: var(--tb-font-mono); flex-shrink: 0; max-width: 7rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.si-btn-expand, .si-btn-remove { background: transparent; border: none; cursor: pointer; border-radius: 4px; padding: 0.15rem 0.35rem; font-size: 0.75rem; flex-shrink: 0; transition: color 0.15s; }
.si-btn-expand { color: var(--tb-text-tertiary); }
.si-btn-expand:hover { color: var(--tb-accent); }
.si-btn-remove { color: var(--tb-text-tertiary); }
.si-btn-remove:hover { color: var(--tb-error); }
.si-config { border-top: 1px solid var(--tb-stroke); padding: 0.6rem 0.75rem; display: flex; flex-direction: column; gap: 0.4rem; }
.si-row { display: flex; align-items: center; gap: 0.5rem; }
.si-label { font-size: 0.75rem; color: var(--tb-text-tertiary); width: 5.5rem; flex-shrink: 0; }
.si-input { flex: 1; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-primary); font-size: 0.82rem; padding: 0.3rem 0.5rem; outline: none; transition: border-color 0.15s; min-width: 0; }
.si-input:focus { border-color: var(--tb-accent); }
.si-input-sm { max-width: 130px; flex: 0 0 130px; }
.si-env-title { font-size: 0.7rem; color: var(--tb-text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 0.15rem; }
```

---

#### ContainerEditModal.css

- [ ] **Step 2: Replace `frontend/src/components/ContainerEditModal.css`**

```css
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.modal-box {
  background: var(--tb-glass-modal);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-xl);
  box-shadow: var(--tb-shadow-modal);
  width: 100%; max-width: 540px; max-height: 90vh;
  display: flex; flex-direction: column; overflow: hidden;
}
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--tb-stroke); }
.modal-title { font-size: 1rem; font-weight: 600; color: var(--tb-text-primary); }
.modal-close { background: transparent; border: none; color: var(--tb-text-tertiary); font-size: 1rem; cursor: pointer; padding: 0.2rem 0.4rem; border-radius: 4px; }
.modal-close:hover { color: var(--tb-error); }
.modal-view-toggle { display: flex; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); padding: 2px; gap: 0; margin-left: auto; margin-right: 0.75rem; }
.modal-view-btn { background: transparent; border: none; border-radius: 4px; color: var(--tb-text-tertiary); font-size: 0.78rem; font-weight: 500; padding: 0.2rem 0.6rem; cursor: pointer; transition: background 0.15s, color 0.15s; }
.modal-view-btn.active { background: rgba(255,255,255,.10); color: var(--tb-text-primary); }
.modal-view-btn:hover:not(.active) { color: var(--tb-text-primary); }
.modal-json-hint { font-size: 0.78rem; color: var(--tb-text-tertiary); margin: 0 0 0.5rem; }
.modal-json-hint code { background: rgba(255,255,255,.08); border-radius: 3px; padding: 0.05rem 0.3rem; font-size: 0.75rem; color: var(--tb-network); }
.modal-json-editor { width: 100%; box-sizing: border-box; background: rgba(255,255,255,.04); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-primary); font-family: var(--tb-font-mono); font-size: 0.82rem; line-height: 1.5; padding: 0.75rem; resize: vertical; outline: none; transition: border-color 0.15s; }
.modal-json-editor:focus { border-color: var(--tb-accent); }
.modal-body { padding: 1rem 1.25rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.7rem; flex: 1; }
.modal-hint { padding: 1.5rem; color: var(--tb-text-tertiary); text-align: center; }
.modal-row { display: flex; align-items: center; gap: 0.75rem; }
.modal-label { font-size: 0.82rem; color: var(--tb-text-secondary); width: 7rem; flex-shrink: 0; }
.modal-input { flex: 1; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-primary); padding: 0.4rem 0.7rem; font-size: 0.88rem; min-width: 0; }
.modal-input:focus { outline: none; border-color: var(--tb-accent); }
.modal-input::placeholder { color: var(--tb-text-tertiary); }
.modal-input-sm { max-width: 7rem; flex: 0 0 7rem; }
.modal-mem-slider { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
.modal-mem-slider input[type="range"] { width: 100%; accent-color: var(--tb-accent); cursor: pointer; }
.modal-mem-labels { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--tb-text-tertiary); }
.modal-mem-value { font-size: 0.82rem; font-weight: 600; color: var(--tb-accent); min-width: 4.5rem; text-align: right; flex-shrink: 0; }
.modal-section-label { font-size: 0.75rem; color: var(--tb-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.3rem; }
.modal-env-row { display: flex; align-items: center; gap: 0.4rem; }
.modal-env-key { flex: 0 0 38%; font-family: var(--tb-font-mono); font-size: 0.82rem; }
.modal-env-val { flex: 1; font-family: var(--tb-font-mono); font-size: 0.82rem; }
.modal-env-sep { color: var(--tb-text-tertiary); font-size: 0.9rem; flex-shrink: 0; }
.btn-env-remove { background: transparent; border: none; color: var(--tb-text-tertiary); cursor: pointer; font-size: 0.75rem; padding: 0.2rem 0.3rem; border-radius: 4px; flex-shrink: 0; }
.btn-env-remove:hover { color: var(--tb-error); }
.btn-add-env { background: transparent; border: 1px dashed var(--tb-stroke-strong); border-radius: var(--tb-radius-xs); color: var(--tb-text-tertiary); padding: 0.3rem 0.6rem; font-size: 0.8rem; cursor: pointer; transition: border-color 0.15s, color 0.15s; align-self: flex-start; }
.btn-add-env:hover { border-color: var(--tb-accent); color: var(--tb-accent); }
.modal-error { color: var(--tb-error); font-size: 0.85rem; background: var(--tb-error-soft); border: 1px solid var(--tb-error); border-radius: var(--tb-radius-xs); padding: 0.5rem 0.75rem; margin: 0; }
.modal-footer { display: flex; gap: 0.75rem; justify-content: flex-end; padding: 0.875rem 1.25rem; border-top: 1px solid var(--tb-stroke); }
.modal-btn-cancel { background: transparent; border: 1px solid var(--tb-stroke-strong); border-radius: var(--tb-radius-sm); color: var(--tb-text-secondary); padding: 0.5rem 1rem; font-size: 0.88rem; cursor: pointer; }
.modal-btn-cancel:hover { border-color: var(--tb-text-secondary); }
.modal-btn-save { background: var(--tb-accent); border: none; border-radius: var(--tb-radius-sm); color: var(--tb-text-on-accent); padding: 0.5rem 1.1rem; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.modal-btn-save:hover:not(:disabled) { background: var(--tb-accent-hover); }
.modal-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
```

---

#### ProfileModal.css

- [ ] **Step 3: Replace `frontend/src/components/ProfileModal.css`**

```css
/* Reuses modal-overlay, modal-box, modal-header, modal-title, modal-close,
   modal-body, modal-footer, modal-btn-cancel, modal-btn-save from ContainerEditModal.css */

.profile-section-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--tb-text-tertiary); margin-bottom: 0.5rem; }
.profile-info-grid { display: grid; grid-template-columns: 7rem 1fr; gap: 0.4rem 0.75rem; font-size: 0.88rem; }
.profile-info-key { color: var(--tb-text-tertiary); }
.profile-info-val { color: var(--tb-text-primary); font-weight: 500; }
.profile-edit-grid { display: grid; grid-template-columns: 7.5rem 1fr; gap: 0.45rem 0.75rem; align-items: center; font-size: 0.88rem; }
.profile-edit-label { color: var(--tb-text-secondary); }
.profile-edit-input { background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-primary); font-size: 0.88rem; padding: 0.3rem 0.6rem; outline: none; width: 100%; box-sizing: border-box; }
.profile-edit-input:focus { border-color: var(--tb-accent); }
.profile-prefs { display: flex; flex-direction: column; gap: 0.1rem; }
.pref-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.6rem 0.75rem; border-radius: var(--tb-radius-sm); cursor: pointer; transition: background 0.15s; }
.pref-row:hover { background: rgba(255,255,255,.05); }
.pref-text { display: flex; flex-direction: column; gap: 0.15rem; }
.pref-label { font-size: 0.88rem; color: var(--tb-text-primary); font-weight: 500; }
.pref-desc { font-size: 0.78rem; color: var(--tb-text-tertiary); }
.theme-toggle-row { display: flex; gap: 0.5rem; }
.theme-btn { flex: 1; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-secondary); font-size: 0.875rem; padding: 0.5rem 1rem; cursor: pointer; transition: all 0.15s; }
.theme-btn:hover { border-color: var(--tb-stroke-strong); color: var(--tb-text-primary); }
.theme-btn.active { background: rgba(255,255,255,.10); border-color: var(--tb-accent); color: var(--tb-accent); font-weight: 600; }
.toggle { width: 2.5rem; height: 1.4rem; background: rgba(255,255,255,.12); border-radius: 99px; position: relative; flex-shrink: 0; transition: background 0.2s; cursor: pointer; }
.toggle-on { background: var(--tb-accent); }
.toggle-thumb { position: absolute; top: 3px; left: 3px; width: 1rem; height: 1rem; background: #fff; border-radius: 50%; transition: transform 0.2s; }
.toggle-on .toggle-thumb { transform: translateX(1.1rem); }
.avatar-section { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
.avatar-preview { position: relative; width: 4rem; height: 4rem; border-radius: 50%; cursor: pointer; overflow: hidden; flex-shrink: 0; border: 2px solid var(--tb-stroke-strong); }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { width: 100%; height: 100%; background: rgba(255,255,255,.10); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: var(--tb-text-primary); }
.avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.1rem; opacity: 0; transition: opacity 0.15s; }
.avatar-preview:hover .avatar-overlay { opacity: 1; }
.avatar-hint { font-size: 0.75rem; color: var(--tb-text-tertiary); }
.profile-bio { resize: vertical; min-height: 4rem; font-family: inherit; }
```

---

#### CreateTemplateModal.css

- [ ] **Step 4: Replace `frontend/src/components/CreateTemplateModal.css`**

```css
.modal-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.modal {
  background: var(--tb-glass-modal);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-xl);
  box-shadow: var(--tb-shadow-modal);
  width: 100%; max-width: 600px; max-height: 90vh;
  overflow-y: auto; display: flex; flex-direction: column;
}
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--tb-stroke); position: sticky; top: 0; background: var(--tb-glass-modal); backdrop-filter: blur(40px) saturate(180%); z-index: 1; }
.modal-header h2 { margin: 0; font-size: 1.05rem; color: var(--tb-text-primary); }
.modal-close { background: transparent; border: none; color: var(--tb-text-tertiary); font-size: 1rem; cursor: pointer; padding: 0; line-height: 1; }
.modal-close:hover { color: var(--tb-text-primary); }
.modal-form { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.35rem; }
.field label { font-size: 0.8rem; color: var(--tb-text-secondary); font-weight: 500; }
.field-hint { color: var(--tb-text-tertiary); font-weight: 400; }
.field input, .field textarea { background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-primary); font-size: 0.875rem; padding: 0.5rem 0.75rem; outline: none; font-family: inherit; resize: vertical; transition: border-color 0.15s; }
.field input:focus, .field textarea:focus { border-color: var(--tb-accent); }
.field input::placeholder, .field textarea::placeholder { color: var(--tb-text-tertiary); }
.field-row { display: flex; gap: 0.75rem; }
.field-row .field { flex: 1; }
.containers-section { display: flex; flex-direction: column; gap: 0.75rem; }
.containers-header { display: flex; align-items: center; justify-content: space-between; }
.section-label { font-size: 0.85rem; font-weight: 600; color: var(--tb-text-primary); }
.btn-add-container { background: transparent; border: 1px dashed var(--tb-stroke-strong); border-radius: var(--tb-radius-xs); color: var(--tb-accent); font-size: 0.8rem; padding: 0.3rem 0.75rem; cursor: pointer; transition: all 0.15s; }
.btn-add-container:hover { border-color: var(--tb-accent); background: var(--tb-accent-soft); }
.container-config { background: rgba(255,255,255,.04); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.container-config-header { display: flex; align-items: center; justify-content: space-between; }
.container-index { font-size: 0.8rem; font-weight: 600; color: var(--tb-accent); }
.btn-remove { background: transparent; border: none; color: var(--tb-text-tertiary); font-size: 0.8rem; cursor: pointer; padding: 0; }
.btn-remove:hover { color: var(--tb-error); }
.modal-error { background: var(--tb-error-soft); border: 1px solid var(--tb-error); border-radius: var(--tb-radius-sm); color: var(--tb-error); font-size: 0.83rem; margin: 0; padding: 0.55rem 0.75rem; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; padding-top: 0.25rem; }
.btn-cancel { background: transparent; border: 1px solid var(--tb-stroke-strong); border-radius: var(--tb-radius-sm); color: var(--tb-text-secondary); font-size: 0.875rem; padding: 0.55rem 1.25rem; cursor: pointer; transition: all 0.15s; }
.btn-cancel:hover { border-color: var(--tb-text-secondary); }
.btn-create { background: var(--tb-accent); border: none; border-radius: var(--tb-radius-sm); color: var(--tb-text-on-accent); font-size: 0.875rem; font-weight: 700; padding: 0.55rem 1.25rem; cursor: pointer; transition: background 0.2s; }
.btn-create:hover:not(:disabled) { background: var(--tb-accent-hover); }
.btn-create:disabled { opacity: 0.5; cursor: not-allowed; }
```

---

#### ResourceGraphModal.css

- [ ] **Step 5: Replace `frontend/src/components/ResourceGraphModal.css`**

```css
.rg-backdrop {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.rg-modal { background: var(--tb-glass-modal); backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xl); box-shadow: var(--tb-shadow-modal); width: 100%; max-width: 560px; display: flex; flex-direction: column; overflow: hidden; }
.rg-header { display: flex; align-items: center; justify-content: space-between; padding: 0.9rem 1.25rem; border-bottom: 1px solid var(--tb-stroke); flex-shrink: 0; }
.rg-title { font-size: 0.95rem; font-weight: 700; color: var(--tb-text-primary); }
.rg-close { background: transparent; border: none; color: var(--tb-text-tertiary); font-size: 0.9rem; cursor: pointer; padding: 0.25rem 0.4rem; border-radius: 4px; transition: color 0.15s; }
.rg-close:hover { color: var(--tb-error); }
.rg-body { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
.rg-meta { display: flex; align-items: center; gap: 0.75rem; font-size: 0.75rem; color: var(--tb-text-tertiary); }
.rg-meta-count { flex-shrink: 0; }
.rg-meta-range { color: var(--tb-text-quaternary); }
.rg-charts { display: flex; flex-direction: column; gap: 1rem; }
.rg-chart-block { background: rgba(255,255,255,.04); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); padding: 0.75rem 1rem; }
.rg-chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.rg-chart-label { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--tb-text-tertiary); }
.rg-chart-value { font-size: 0.85rem; font-weight: 700; font-family: var(--tb-font-mono); }
.sparkline { display: block; border-radius: 4px; overflow: visible; }
.rg-chart-axis { display: flex; justify-content: space-between; margin-top: 0.25rem; font-size: 0.65rem; color: var(--tb-text-quaternary); font-family: var(--tb-font-mono); }
.rg-hint { font-size: 0.82rem; color: var(--tb-text-tertiary); text-align: center; margin: 0; padding: 0.5rem 0; }
.rg-error { font-size: 0.82rem; color: var(--tb-error); text-align: center; margin: 0; }
.rg-footer { display: flex; justify-content: flex-end; padding: 0.75rem 1.25rem; border-top: 1px solid var(--tb-stroke); }
.rg-btn-close { background: transparent; border: 1px solid var(--tb-stroke-strong); border-radius: var(--tb-radius-sm); color: var(--tb-text-secondary); font-size: 0.82rem; padding: 0.45rem 0.9rem; cursor: pointer; transition: border-color 0.15s, color 0.15s; }
.rg-btn-close:hover { border-color: var(--tb-text-secondary); color: var(--tb-text-primary); }
```

---

#### TeamStackBuilder.css

- [ ] **Step 6: Replace `frontend/src/components/TeamStackBuilder.css`**

```css
.tsb-backdrop { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.tsb-modal { background: var(--tb-glass-modal); backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xl); box-shadow: var(--tb-shadow-modal); width: 100%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
.tsb-header { display: flex; align-items: center; justify-content: space-between; padding: 0.9rem 1.25rem; border-bottom: 1px solid var(--tb-stroke); flex-shrink: 0; }
.tsb-title { font-size: 1rem; font-weight: 700; color: var(--tb-text-primary); }
.tsb-close { background: transparent; border: none; color: var(--tb-text-tertiary); font-size: 0.9rem; cursor: pointer; padding: 0.25rem 0.4rem; border-radius: 4px; transition: color 0.15s; }
.tsb-close:hover { color: var(--tb-error); }
.tsb-body { display: grid; grid-template-columns: 260px 1fr; gap: 0; overflow: hidden; flex: 1; min-height: 0; }
.tsb-left { display: flex; flex-direction: column; gap: 0.6rem; padding: 1.1rem 1rem; border-right: 1px solid var(--tb-stroke); background: rgba(255,255,255,.03); overflow-y: auto; }
.tsb-right { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.1rem; overflow-y: auto; }
.tsb-section-label { font-size: 0.7rem; color: var(--tb-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
.tsb-hint { font-size: 0.8rem; color: var(--tb-text-tertiary); margin: 0; }
.tsb-error { font-size: 0.82rem; color: var(--tb-error); background: var(--tb-error-soft); border: 1px solid var(--tb-error); border-radius: var(--tb-radius-xs); padding: 0.45rem 0.7rem; margin: 0; }
.tsb-field-row { display: flex; gap: 0.5rem; }
.tsb-field { display: flex; flex-direction: column; gap: 0.3rem; }
.tsb-label { font-size: 0.75rem; color: var(--tb-text-secondary); }
.tsb-input { background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-primary); font-size: 0.88rem; padding: 0.45rem 0.6rem; outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.15s; }
.tsb-input:focus { border-color: var(--tb-accent); }
.tsb-input::placeholder { color: var(--tb-text-tertiary); }
.tsb-container-summary { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.3rem; }
.tsb-summary-item { display: flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,.04); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); padding: 0.3rem 0.5rem; font-size: 0.78rem; }
.tsb-summary-icon { flex-shrink: 0; font-size: 0.9rem; }
.tsb-summary-name { font-weight: 600; color: var(--tb-text-primary); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tsb-summary-image { color: var(--tb-text-tertiary); font-family: var(--tb-font-mono); font-size: 0.72rem; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-left: auto; }
.tsb-btn-submit { background: var(--tb-accent); border: none; border-radius: var(--tb-radius-sm); color: var(--tb-text-on-accent); font-size: 0.88rem; font-weight: 700; padding: 0.6rem 0.9rem; cursor: pointer; transition: background 0.15s; }
.tsb-btn-submit:hover:not(:disabled) { background: var(--tb-accent-hover); }
.tsb-btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }
.tsb-btn-cancel { background: transparent; border: 1px solid var(--tb-stroke-strong); border-radius: var(--tb-radius-sm); color: var(--tb-text-secondary); font-size: 0.82rem; padding: 0.5rem 0.9rem; cursor: pointer; transition: border-color 0.15s, color 0.15s; }
.tsb-btn-cancel:hover { border-color: var(--tb-text-secondary); color: var(--tb-text-primary); }
.tsb-palette { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.tsb-chip { display: flex; align-items: center; gap: 0.3rem; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-secondary); padding: 0.28rem 0.55rem; font-size: 0.78rem; cursor: grab; user-select: none; white-space: nowrap; transition: border-color 0.15s, background 0.15s, color 0.15s; }
.tsb-chip:hover { border-color: var(--tb-network); color: var(--tb-text-primary); background: rgba(255,255,255,.08); }
.tsb-chip:active { cursor: grabbing; }
.tsb-chip-label { font-weight: 500; }
.tsb-chip-multi { background: rgba(255,255,255,.08); color: var(--tb-text-secondary); font-size: 0.62rem; border-radius: 99px; padding: 0.05rem 0.3rem; font-weight: 700; line-height: 1.4; }
.tsb-drop-zone { flex: 1; min-height: 120px; border: 1.5px dashed var(--tb-stroke-strong); border-radius: var(--tb-radius-sm); padding: 0.6rem; display: flex; flex-direction: column; gap: 0.45rem; transition: border-color 0.15s, background 0.15s; }
.tsb-dz-over { border-color: var(--tb-network); background: var(--tb-network-soft); }
.tsb-dz-hint { margin: auto; font-size: 0.82rem; color: var(--tb-text-tertiary); text-align: center; pointer-events: none; }
.tsb-item { background: rgba(255,255,255,.04); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); overflow: hidden; }
.tsb-item-header { display: flex; align-items: center; gap: 0.45rem; padding: 0.45rem 0.6rem; }
.tsb-item-icon { font-size: 1rem; flex-shrink: 0; }
.tsb-item-name { font-size: 0.82rem; font-weight: 600; color: var(--tb-text-primary); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tsb-item-image { font-size: 0.72rem; color: var(--tb-text-tertiary); font-family: var(--tb-font-mono); max-width: 8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0; }
.tsb-item-btn { background: transparent; border: none; cursor: pointer; border-radius: 4px; padding: 0.15rem 0.35rem; font-size: 0.75rem; flex-shrink: 0; color: var(--tb-text-tertiary); transition: color 0.15s; }
.tsb-item-btn:hover { color: var(--tb-network); }
.tsb-item-remove:hover { color: var(--tb-error) !important; }
.tsb-item-drag-handle { cursor: grab; color: var(--tb-text-quaternary); font-size: 0.9rem; flex-shrink: 0; user-select: none; transition: color 0.12s; }
.tsb-item:hover .tsb-item-drag-handle { color: var(--tb-text-tertiary); }
.tsb-item-dragging { opacity: 0.4; }
.tsb-item-drag-over { border-color: var(--tb-network); box-shadow: 0 -2px 0 var(--tb-network); }
.tsb-item-config { border-top: 1px solid var(--tb-stroke); padding: 0.6rem 0.75rem; display: flex; flex-direction: column; gap: 0.4rem; }
.tsb-cfg-row { display: flex; align-items: center; gap: 0.5rem; }
.tsb-cfg-label { font-size: 0.75rem; color: var(--tb-text-tertiary); width: 5.5rem; flex-shrink: 0; }
.tsb-cfg-input { flex: 1; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-primary); font-size: 0.82rem; padding: 0.3rem 0.5rem; outline: none; min-width: 0; transition: border-color 0.15s; }
.tsb-cfg-input:focus { border-color: var(--tb-accent); }
.tsb-cfg-input-sm { max-width: 120px; flex: 0 0 120px; }
.tsb-env-title { font-size: 0.7rem; color: var(--tb-text-tertiary); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 0.1rem; }
.tsb-env-row { display: flex; align-items: center; gap: 0.35rem; }
.tsb-env-key { flex: 0 0 38%; font-family: var(--tb-font-mono); font-size: 0.78rem; }
.tsb-env-val { flex: 1; font-family: var(--tb-font-mono); font-size: 0.78rem; }
.tsb-env-sep { color: var(--tb-text-tertiary); font-size: 0.9rem; flex-shrink: 0; }
.tsb-btn-add-env { background: transparent; border: 1px dashed var(--tb-stroke-strong); border-radius: var(--tb-radius-xs); color: var(--tb-text-tertiary); padding: 0.25rem 0.55rem; font-size: 0.75rem; cursor: pointer; align-self: flex-start; transition: border-color 0.15s, color 0.15s; }
.tsb-btn-add-env:hover { border-color: var(--tb-accent); color: var(--tb-accent); }
```

- [ ] **Step 7: Verify build passes**

```bash
cd frontend && npm run build
```

- [ ] **Step 8: Verify lint passes**

```bash
cd frontend && npm run lint
```

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/StartForm.css frontend/src/components/ContainerEditModal.css frontend/src/components/ProfileModal.css frontend/src/components/CreateTemplateModal.css frontend/src/components/ResourceGraphModal.css frontend/src/components/TeamStackBuilder.css
git commit -m "feat(css): phase 4 — glass modals (28px radius, blur overlay, orange accent)"
```

---

### Task 5: Phase 5 — Pages

**Files:**
- Modify: `frontend/src/pages/AuthPage.css`
- Modify: `frontend/src/pages/TemplatesPage.css`
- Modify: `frontend/src/pages/TeamsPage.css`
- Modify: `frontend/src/pages/MarketplacePage.css`
- Modify: `frontend/src/pages/AuditPage.css`

---

#### AuthPage.css

- [ ] **Step 1: Replace `frontend/src/pages/AuthPage.css`**

```css
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.auth-card {
  background: var(--tb-glass-modal);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-xl);
  box-shadow: var(--tb-shadow-modal);
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.auth-logo {
  font-size: 2rem;
  font-weight: 800;
  color: var(--tb-accent);
  letter-spacing: var(--tb-tracking-tight);
  text-align: center;
}

.auth-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--tb-text-primary); text-align: center; }
.auth-sub { margin: 0; font-size: 0.88rem; color: var(--tb-text-tertiary); text-align: center; }

.auth-tabs { display: flex; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); padding: 3px; }
.auth-tab { flex: 1; background: transparent; border: none; border-radius: var(--tb-radius-xs); color: var(--tb-text-tertiary); padding: 0.45rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s; }
.auth-tab.active { background: rgba(255,255,255,.12); color: var(--tb-text-primary); }

.auth-form { display: flex; flex-direction: column; gap: 0.85rem; }

.field-row { display: flex; flex-direction: column; gap: 0.3rem; }
.field { display: flex; flex-direction: column; gap: 0.3rem; }
.field label { font-size: 0.82rem; color: var(--tb-text-secondary); font-weight: 500; }
.field input {
  background: rgba(255,255,255,.06);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-sm);
  color: var(--tb-text-primary);
  font-size: 0.95rem;
  padding: 0.55rem 0.75rem;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.field input:focus { border-color: var(--tb-accent); }
.field input::placeholder { color: var(--tb-text-tertiary); }

.auth-error { color: var(--tb-error); font-size: 0.83rem; background: var(--tb-error-soft); border: 1px solid var(--tb-error); border-radius: var(--tb-radius-xs); padding: 0.5rem 0.75rem; margin: 0; }

.auth-submit {
  background: var(--tb-accent);
  border: none;
  border-radius: var(--tb-radius-md);
  color: var(--tb-text-on-accent);
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.7rem;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
}
.auth-submit:hover:not(:disabled) { background: var(--tb-accent-hover); }
.auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.auth-success { color: var(--tb-running); font-size: 0.88rem; background: var(--tb-running-soft); border: 1px solid var(--tb-running); border-radius: var(--tb-radius-xs); padding: 0.5rem 0.75rem; margin: 0; text-align: center; }
.auth-link { background: transparent; border: none; color: var(--tb-accent); font-size: 0.88rem; cursor: pointer; padding: 0; text-decoration: underline; }
.auth-back { background: transparent; border: none; color: var(--tb-text-tertiary); font-size: 0.88rem; cursor: pointer; padding: 0; text-decoration: underline; }
.auth-mode-title { font-size: 1rem; font-weight: 600; color: var(--tb-text-primary); margin: 0; }
```

---

#### TemplatesPage.css

- [ ] **Step 2: Replace `frontend/src/pages/TemplatesPage.css`**

```css
.templates-page { display: flex; flex-direction: column; gap: 1.5rem; padding: 1.5rem 2rem; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box; }
.tp-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.tp-header h2 { margin: 0 0 0.25rem; font-size: 1.2rem; color: var(--tb-text-primary); }
.tp-sub { margin: 0; font-size: 0.85rem; color: var(--tb-text-tertiary); }
.btn-new-template { background: var(--tb-accent); border: none; border-radius: var(--tb-radius-sm); color: var(--tb-text-on-accent); font-size: 0.875rem; font-weight: 700; padding: 0.55rem 1.1rem; cursor: pointer; transition: background 0.2s; white-space: nowrap; flex-shrink: 0; }
.btn-new-template:hover { background: var(--tb-accent-hover); }
.tp-header-actions { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
.tp-search { background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-primary); font-size: 0.875rem; padding: 0.5rem 0.75rem; width: 14rem; outline: none; transition: border-color 0.15s; }
.tp-search:focus { border-color: var(--tb-accent); }
.tp-search::placeholder { color: var(--tb-text-tertiary); }
.tp-no-results { color: var(--tb-text-tertiary); font-size: 0.9rem; padding: 2rem 0; text-align: center; }
.tp-layout { display: flex; gap: 1.5rem; align-items: flex-start; }
.tp-sidebar { width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.favorites-header { display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; font-weight: 600; color: var(--tb-text-primary); background: var(--tb-glass-1); backdrop-filter: blur(20px) saturate(180%); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm) var(--tb-radius-sm) 0 0; padding: 0.75rem 1rem; }
.fav-count { background: rgba(255,255,255,.08); color: var(--tb-text-secondary); border-radius: 99px; padding: 0.1rem 0.55rem; font-size: 0.75rem; }
.favorites-drop-zone { background: var(--tb-glass-1); backdrop-filter: blur(20px) saturate(180%); border: 1px solid var(--tb-stroke); border-top: none; border-radius: 0 0 var(--tb-radius-sm) var(--tb-radius-sm); padding: 0.5rem; min-height: 200px; transition: border-color 0.15s; }
.favorites-drop-zone.drag-over { border-color: var(--tb-accent); background: var(--tb-accent-soft); }
.fav-empty { color: var(--tb-text-tertiary); font-size: 0.82rem; text-align: center; padding: 2rem 1rem; margin: 0; border: 1px dashed var(--tb-stroke); border-radius: var(--tb-radius-sm); }
.fav-item { display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,.04); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); padding: 0.5rem 0.6rem; margin-bottom: 0.4rem; cursor: grab; user-select: none; transition: border-color 0.15s; }
.fav-item:hover { border-color: var(--tb-stroke-strong); }
.fav-item:active { cursor: grabbing; }
.fav-drag-handle { color: var(--tb-text-quaternary); font-size: 1rem; flex-shrink: 0; }
.fav-label { flex: 1; font-size: 0.85rem; color: var(--tb-text-primary); text-transform: capitalize; }
.fav-remove { background: transparent; border: none; color: var(--tb-text-tertiary); font-size: 0.75rem; cursor: pointer; padding: 0; flex-shrink: 0; line-height: 1; }
.fav-remove:hover { color: var(--tb-error); }
.fav-trash-zone { border: 1px dashed var(--tb-error); border-radius: var(--tb-radius-sm); color: var(--tb-error); font-size: 0.8rem; text-align: center; padding: 0.75rem; opacity: 0.7; transition: opacity 0.15s; }
.fav-trash-zone:hover { opacity: 1; }
.tp-library { flex: 1; display: flex; flex-direction: column; gap: 1.25rem; }
.library-section-title { margin: 0 0 0.75rem; font-size: 0.9rem; font-weight: 600; color: var(--tb-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
.template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.875rem; }
.template-card { background: var(--tb-glass-1); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-lg); padding: 1.1rem; display: flex; flex-direction: column; gap: 0.4rem; cursor: grab; user-select: none; transition: border-color 0.15s, transform 0.1s; box-shadow: var(--tb-shadow-card); }
.template-card:hover { border-color: var(--tb-stroke-strong); transform: translateY(-1px); }
.template-card:active { cursor: grabbing; }
.template-card.is-favorite { border-color: color-mix(in oklch, var(--tb-accent) 40%, transparent); }
.tc-icon { font-size: 1.75rem; line-height: 1; }
.tc-name { font-size: 0.95rem; font-weight: 600; color: var(--tb-text-primary); text-transform: capitalize; }
.tc-type { font-size: 0.72rem; color: var(--tb-text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
.tc-desc { font-size: 0.8rem; color: var(--tb-text-tertiary); line-height: 1.4; }
.tc-containers { font-size: 0.75rem; color: var(--tb-text-secondary); background: rgba(255,255,255,.06); border-radius: var(--tb-radius-xs); padding: 0.3rem 0.5rem; }
.tc-actions { display: flex; gap: 0.4rem; margin-top: 0.25rem; }
.tc-btn { flex: 1; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke-strong); border-radius: var(--tb-radius-xs); color: var(--tb-text-secondary); font-size: 0.75rem; padding: 0.3rem 0.5rem; cursor: pointer; transition: all 0.15s; }
.tc-btn:hover { border-color: var(--tb-accent); color: var(--tb-accent); }
.tc-btn-remove { flex: 1; background: var(--tb-accent-soft); border: 1px solid var(--tb-accent); border-radius: var(--tb-radius-xs); color: var(--tb-accent); font-size: 0.75rem; padding: 0.3rem 0.5rem; cursor: pointer; }
.tc-btn-delete { background: transparent; border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-tertiary); font-size: 0.75rem; padding: 0.3rem 0.5rem; cursor: pointer; transition: all 0.15s; }
.tc-btn-delete:hover { border-color: var(--tb-error); color: var(--tb-error); }
.tc-confirm-label { font-size: 0.72rem; color: var(--tb-warning); }
.tc-btn-confirm-yes, .tc-btn-confirm-no { background: transparent; border-radius: var(--tb-radius-xs); padding: 0.3rem 0.5rem; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; }
.tc-btn-confirm-yes { border: 1px solid var(--tb-running); color: var(--tb-running); }
.tc-btn-confirm-yes:hover { background: var(--tb-running-soft); }
.tc-btn-confirm-no  { border: 1px solid var(--tb-stroke); color: var(--tb-text-tertiary); }
.tc-btn-confirm-no:hover { border-color: var(--tb-error); color: var(--tb-error); }
.empty-custom { text-align: center; color: var(--tb-text-tertiary); font-size: 0.9rem; padding: 2rem; border: 1px dashed var(--tb-stroke); border-radius: var(--tb-radius-lg); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.empty-custom p { margin: 0; }
.custom-card { border-color: color-mix(in oklch, var(--tb-stroke-strong) 60%, transparent); }
.team-card { border-color: color-mix(in oklch, var(--tb-network) 30%, transparent); }
.team-card:hover { border-color: var(--tb-network); }
.team-card.is-favorite { border-color: color-mix(in oklch, var(--tb-network) 60%, transparent); }
.tc-creator { font-size: 0.72rem; color: var(--tb-network); font-weight: 500; }
.library-section-header { display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 0.75rem; }
.library-section-header .library-section-title { margin-bottom: 0; }
.team-section-hint { font-size: 0.75rem; color: var(--tb-text-tertiary); }
```

---

#### TeamsPage.css

- [ ] **Step 3: Replace `frontend/src/pages/TeamsPage.css`**

```css
.teams-page { display: flex; flex-direction: column; gap: 1.5rem; padding: 1.5rem 2rem; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box; }
.teams-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.teams-header h2 { margin: 0 0 0.25rem; font-size: 1.2rem; color: var(--tb-text-primary); }
.teams-sub { margin: 0; font-size: 0.85rem; color: var(--tb-text-tertiary); }
.team-selector-bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; background: var(--tb-glass-1); backdrop-filter: blur(20px) saturate(180%); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); padding: 0.65rem 1rem; }
.team-selector-left { display: flex; align-items: center; gap: 0.6rem; }
.team-selector-label { font-size: 0.85rem; color: var(--tb-text-tertiary); font-weight: 600; white-space: nowrap; }
.team-dropdown { background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-primary); font-size: 0.9rem; font-weight: 500; padding: 0.4rem 0.75rem; cursor: pointer; outline: none; transition: border-color 0.15s; min-width: 220px; }
.team-dropdown:focus { border-color: var(--tb-accent); }
.btn-create-team { background: var(--tb-accent); border: none; border-radius: var(--tb-radius-sm); color: var(--tb-text-on-accent); font-size: 0.875rem; font-weight: 700; padding: 0.55rem 1.1rem; cursor: pointer; transition: background 0.2s; white-space: nowrap; flex-shrink: 0; }
.btn-create-team:hover { background: var(--tb-accent-hover); }
.btn-delete-team { background: transparent; border: 1px solid var(--tb-stroke-strong); border-radius: var(--tb-radius-sm); color: var(--tb-text-tertiary); font-size: 0.8rem; padding: 0.4rem 0.75rem; cursor: pointer; transition: all 0.15s; }
.btn-delete-team:hover { border-color: var(--tb-error); color: var(--tb-error); }
.teams-empty { text-align: center; padding: 4rem 2rem; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
.teams-empty-icon { font-size: 3rem; }
.teams-empty-title { margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--tb-text-primary); }
.teams-empty-sub { margin: 0; font-size: 0.875rem; color: var(--tb-text-tertiary); }
.team-body { display: grid; grid-template-columns: 280px 1fr; gap: 1.25rem; align-items: start; }
.team-loading { grid-column: 1 / -1; display: flex; justify-content: center; padding: 3rem; }
.panel-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: var(--tb-glass-1); backdrop-filter: blur(20px) saturate(180%); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm) var(--tb-radius-sm) 0 0; border-bottom: none; }
.panel-title { font-size: 0.85rem; font-weight: 600; color: var(--tb-text-primary); flex: 1; }
.panel-count { background: rgba(255,255,255,.08); color: var(--tb-text-secondary); border-radius: 99px; padding: 0.1rem 0.55rem; font-size: 0.75rem; }
.team-members-panel { display: flex; flex-direction: column; border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); overflow: hidden; }
.members-list { background: var(--tb-glass-1); backdrop-filter: blur(20px) saturate(180%); display: flex; flex-direction: column; }
.member-row { display: flex; align-items: center; gap: 0.65rem; padding: 0.6rem 1rem; border-bottom: 1px solid var(--tb-stroke); transition: background 0.12s; }
.member-row:hover { background: rgba(255,255,255,.04); }
.member-row:last-child { border-bottom: none; }
.member-avatar { width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; flex-shrink: 0; }
.member-info { display: flex; flex-direction: column; gap: 0.05rem; flex: 1; min-width: 0; }
.member-name { font-size: 0.875rem; color: var(--tb-text-primary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.member-handle { font-size: 0.72rem; color: var(--tb-text-tertiary); }
.member-role { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-radius: var(--tb-radius-xs); padding: 0.15rem 0.4rem; flex-shrink: 0; }
.role-admin   { background: var(--tb-error-soft); color: var(--tb-error); }
.role-manager { background: var(--tb-info-soft);  color: var(--tb-info); }
.role-member  { background: rgba(255,255,255,.08); color: var(--tb-text-secondary); }
.my-role-badge { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-radius: var(--tb-radius-xs); padding: 0.15rem 0.45rem; }
.member-role-select { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; border-radius: var(--tb-radius-xs); padding: 0.15rem 0.35rem; cursor: pointer; outline: none; border: 1px solid var(--tb-stroke); background: rgba(255,255,255,.06); color: var(--tb-text-primary); flex-shrink: 0; transition: border-color 0.15s; }
.member-role-select:focus { border-color: var(--tb-accent); }
.member-role-select.role-admin   { border-color: var(--tb-error);  color: var(--tb-error); }
.member-role-select.role-manager { border-color: var(--tb-info);   color: var(--tb-info); }
.delete-team-confirm { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--tb-warning); }
.btn-confirm-yes-sm { background: transparent; border: 1px solid var(--tb-error); border-radius: var(--tb-radius-xs); color: var(--tb-error); font-size: 0.78rem; padding: 0.25rem 0.65rem; cursor: pointer; transition: background 0.15s; }
.btn-confirm-yes-sm:hover { background: var(--tb-error-soft); }
.btn-confirm-no-sm { background: transparent; border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-tertiary); font-size: 0.78rem; padding: 0.25rem 0.65rem; cursor: pointer; transition: all 0.15s; }
.btn-confirm-no-sm:hover { border-color: var(--tb-stroke-strong); color: var(--tb-text-primary); }
.btn-remove-member { background: transparent; border: none; color: var(--tb-text-quaternary); font-size: 0.72rem; cursor: pointer; padding: 0.2rem 0.4rem; border-radius: 4px; flex-shrink: 0; transition: all 0.12s; white-space: nowrap; }
.btn-remove-member:hover { color: var(--tb-error); background: var(--tb-error-soft); }
.add-member-form { display: flex; flex-direction: column; gap: 0.4rem; padding: 0.65rem 0.75rem; background: rgba(255,255,255,.03); border-top: 1px solid var(--tb-stroke); }
.add-member-input { flex: 1; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-primary); font-size: 0.82rem; padding: 0.4rem 0.6rem; outline: none; transition: border-color 0.15s; }
.add-member-input:focus { border-color: var(--tb-accent); }
.add-member-input::placeholder { color: var(--tb-text-tertiary); }
.btn-add-member { background: var(--tb-accent); border: none; border-radius: var(--tb-radius-xs); color: var(--tb-text-on-accent); font-size: 0.78rem; font-weight: 600; padding: 0.4rem 0.65rem; cursor: pointer; width: 100%; transition: background 0.15s; }
.btn-add-member:hover:not(:disabled) { background: var(--tb-accent-hover); }
.btn-add-member:disabled { opacity: 0.5; cursor: default; }
.team-templates-panel { border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); overflow: hidden; }
.team-templates-panel .panel-header { border-radius: 0; }
.btn-add-template { background: var(--tb-network); border: none; border-radius: var(--tb-radius-xs); color: #fff; font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.7rem; cursor: pointer; margin-left: auto; transition: opacity 0.15s; white-space: nowrap; }
.btn-add-template:hover { opacity: 0.85; }
.templates-empty { background: var(--tb-glass-1); backdrop-filter: blur(20px) saturate(180%); padding: 2rem; text-align: center; color: var(--tb-text-tertiary); font-size: 0.875rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.templates-empty p { margin: 0; }
.team-templates-grid { background: var(--tb-glass-1); backdrop-filter: blur(20px) saturate(180%); display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.875rem; padding: 1rem; }
.team-tmpl-card { background: rgba(255,255,255,.04); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); padding: 1rem; display: flex; flex-direction: column; gap: 0.35rem; transition: border-color 0.15s; }
.team-tmpl-card:hover { border-color: var(--tb-network); }
.ttc-icon { font-size: 1.75rem; line-height: 1; }
.ttc-name { font-size: 0.95rem; font-weight: 600; color: var(--tb-text-primary); }
.ttc-desc { font-size: 0.78rem; color: var(--tb-text-tertiary); line-height: 1.4; }
.ttc-creator { font-size: 0.72rem; color: var(--tb-network); font-weight: 500; }
.ttc-containers { font-size: 0.72rem; color: var(--tb-text-secondary); background: rgba(255,255,255,.06); border-radius: var(--tb-radius-xs); padding: 0.25rem 0.45rem; margin-top: 0.1rem; }
.ttc-actions { display: flex; gap: 0.4rem; margin-top: 0.25rem; align-items: center; }
.ttc-btn-edit { background: transparent; border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-tertiary); font-size: 0.72rem; padding: 0.25rem 0.5rem; cursor: pointer; transition: all 0.15s; }
.ttc-btn-edit:hover { border-color: var(--tb-network); color: var(--tb-network); }
.ttc-btn-delete { background: transparent; border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-tertiary); font-size: 0.72rem; padding: 0.25rem 0.5rem; cursor: pointer; transition: all 0.15s; }
.ttc-btn-delete:hover { border-color: var(--tb-error); color: var(--tb-error); }
.ttc-btn-fav { background: transparent; border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-tertiary); font-size: 0.72rem; padding: 0.25rem 0.5rem; cursor: pointer; transition: all 0.15s; }
.ttc-btn-fav:hover { border-color: var(--tb-info); color: var(--tb-info); }
.ttc-btn-fav-active { border-color: var(--tb-running); color: var(--tb-running); }
.ttc-btn-fav-active:hover { border-color: var(--tb-error); color: var(--tb-error); }
.ttc-btn-copy { background: transparent; border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-tertiary); font-size: 0.72rem; padding: 0.25rem 0.5rem; cursor: pointer; transition: all 0.15s; }
.ttc-btn-copy:hover { border-color: var(--tb-network); color: var(--tb-network); }
.ttc-btn-copy:disabled { opacity: 0.5; cursor: default; }
.create-team-input { width: 100%; box-sizing: border-box; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-primary); font-size: 0.9rem; padding: 0.55rem 0.75rem; outline: none; transition: border-color 0.15s; margin-bottom: 0.25rem; }
.create-team-input:focus { border-color: var(--tb-accent); }
.create-team-input::placeholder { color: var(--tb-text-tertiary); }
```

---

#### MarketplacePage.css

- [ ] **Step 4: Replace `frontend/src/pages/MarketplacePage.css`**

Apply the standard token migration across all classes. Key design changes:
- `.mp-card`: glass-1 surface with `border-radius: var(--tb-radius-lg)`, hover lifts and highlights accent border
- `.btn-search`, `.btn-import`, `.btn-publish`: `background: var(--tb-accent); color: var(--tb-text-on-accent);`
- `.btn-sort.active`: `background: var(--tb-accent); border-color: var(--tb-accent); color: var(--tb-text-on-accent);`
- `.mp-own-badge`: `background: var(--tb-accent-soft); color: var(--tb-accent);`
- `.mp-rating-num`: `color: var(--tb-pending);`
- `.star-filled`: `color: var(--tb-pending);`
- `.mp-detail-modal`, `.mp-publish-modal`: glass-modal surface, `border-radius: var(--tb-radius-xl)`
- All inputs: `background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke);`

```css
.mp-page { display: flex; flex-direction: column; gap: 1.5rem; padding: 1.5rem 2rem; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box; }
.mp-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.mp-header h2 { margin: 0 0 0.25rem; font-size: 1.2rem; color: var(--tb-text-primary); }
.mp-sub { margin: 0; font-size: 0.85rem; color: var(--tb-text-tertiary); }
.mp-controls { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.mp-search-form { display: flex; gap: 0.5rem; flex: 1; min-width: 200px; }
.mp-search-input { flex: 1; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-primary); padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; }
.mp-search-input:focus { border-color: var(--tb-accent); }
.btn-search { background: var(--tb-accent); border: none; border-radius: var(--tb-radius-sm); color: var(--tb-text-on-accent); font-size: 0.875rem; font-weight: 600; padding: 0.5rem 1rem; cursor: pointer; transition: background 0.15s; }
.btn-search:hover { background: var(--tb-accent-hover); }
.mp-sort { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--tb-text-tertiary); }
.btn-sort { background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-secondary); font-size: 0.8rem; padding: 0.3rem 0.7rem; cursor: pointer; transition: all 0.15s; }
.btn-sort.active { background: var(--tb-accent); border-color: var(--tb-accent); color: var(--tb-text-on-accent); font-weight: 600; }
.btn-sort:not(.active):hover { border-color: var(--tb-accent); color: var(--tb-accent); }
.mp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
.mp-loading, .mp-empty { text-align: center; padding: 3rem; color: var(--tb-text-tertiary); }
.mp-empty { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.mp-card { background: var(--tb-glass-1); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-lg); box-shadow: var(--tb-shadow-card); padding: 1rem; display: flex; flex-direction: column; gap: 0.6rem; cursor: pointer; transition: border-color 0.15s, transform 0.1s; }
.mp-card:hover { border-color: var(--tb-accent); transform: translateY(-1px); }
.mp-card-header { display: flex; align-items: center; gap: 0.75rem; }
.mp-icon { font-size: 1.6rem; flex-shrink: 0; }
.mp-icon-lg { font-size: 2.2rem; }
.mp-card-info { display: flex; flex-direction: column; gap: 0.1rem; flex: 1; min-width: 0; }
.mp-name { font-weight: 700; font-size: 0.95rem; color: var(--tb-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-publisher { font-size: 0.78rem; color: var(--tb-text-tertiary); }
.mp-own-badge { background: var(--tb-accent-soft); color: var(--tb-accent); border-radius: var(--tb-radius-xs); font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.5rem; white-space: nowrap; }
.mp-desc { margin: 0; font-size: 0.82rem; color: var(--tb-text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.mp-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.mp-tag { background: rgba(255,255,255,.07); border-radius: var(--tb-radius-xs); color: var(--tb-text-secondary); font-size: 0.72rem; padding: 0.15rem 0.5rem; }
.mp-card-footer { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--tb-text-tertiary); margin-top: auto; }
.mp-separator { color: var(--tb-text-quaternary); }
.mp-rating-num { color: var(--tb-pending); font-weight: 600; }
.mp-stat { color: var(--tb-text-tertiary); }
.stars { display: inline-flex; gap: 0.1rem; }
.star { color: rgba(255,255,255,.15); font-size: 1rem; line-height: 1; transition: color 0.1s; user-select: none; }
.star-filled { color: var(--tb-pending); }
.btn-publish-open { background: var(--tb-running); border: none; border-radius: var(--tb-radius-sm); color: #fff; font-size: 0.875rem; font-weight: 700; padding: 0.55rem 1.1rem; cursor: pointer; white-space: nowrap; transition: opacity 0.15s; }
.btn-publish-open:hover { opacity: 0.85; }
.mp-detail-modal { background: var(--tb-glass-modal); backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xl); box-shadow: var(--tb-shadow-modal); padding: 1.5rem; width: 700px; max-width: 95vw; max-height: 90vh; overflow-y: auto; position: relative; display: flex; flex-direction: column; gap: 1.2rem; }
.mp-detail-header { display: flex; align-items: center; gap: 1rem; }
.mp-detail-title { margin: 0 0 0.2rem; font-size: 1.2rem; color: var(--tb-text-primary); }
.mp-detail-actions { margin-left: auto; display: flex; gap: 0.5rem; }
.btn-import { background: var(--tb-running); border: none; border-radius: var(--tb-radius-sm); color: #fff; font-size: 0.875rem; font-weight: 700; padding: 0.5rem 1rem; cursor: pointer; transition: opacity 0.15s; }
.btn-import:hover { opacity: 0.85; }
.btn-delete-tmpl { background: transparent; border: 1px solid var(--tb-error); border-radius: var(--tb-radius-sm); color: var(--tb-error); font-size: 0.875rem; padding: 0.5rem 1rem; cursor: pointer; transition: background 0.15s; }
.btn-delete-tmpl:hover { background: var(--tb-error-soft); }
.mp-detail-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-size: 0.85rem; }
.mp-detail-desc { margin: 0; font-size: 0.9rem; color: var(--tb-text-secondary); line-height: 1.5; }
.mp-section h3 { margin: 0 0 0.75rem; font-size: 0.9rem; color: var(--tb-text-primary); font-weight: 600; }
.mp-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.mp-section-header h3 { margin: 0; }
.mp-container-list { display: flex; flex-direction: column; gap: 0.4rem; }
.mp-container-item { display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,.04); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); padding: 0.5rem 0.75rem; font-size: 0.85rem; }
.mp-container-name { font-weight: 600; color: var(--tb-text-primary); min-width: 80px; }
.mp-container-image { color: var(--tb-text-secondary); font-size: 0.82rem; }
.mp-container-port { color: var(--tb-text-tertiary); margin-left: auto; }
.mp-images { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.mp-image-wrap { position: relative; border-radius: var(--tb-radius-sm); overflow: hidden; border: 1px solid var(--tb-stroke); }
.mp-image { width: 140px; height: 100px; object-fit: cover; display: block; cursor: zoom-in; }
.btn-delete-img { position: absolute; top: 4px; right: 4px; background: color-mix(in oklch, var(--tb-error) 80%, transparent); border: none; border-radius: 4px; color: white; font-size: 0.7rem; padding: 0.15rem 0.35rem; cursor: pointer; }
.btn-upload { background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-secondary); font-size: 0.8rem; padding: 0.3rem 0.7rem; cursor: pointer; transition: border-color 0.15s; }
.btn-upload:hover { border-color: var(--tb-accent); color: var(--tb-accent); }
.mp-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.85); display: flex; align-items: center; justify-content: center; z-index: 1000; cursor: zoom-out; }
.mp-lightbox-img { max-width: 90vw; max-height: 90vh; border-radius: var(--tb-radius-sm); object-fit: contain; box-shadow: 0 8px 40px rgba(0,0,0,.6); }
.mp-empty-hint { margin: 0; font-size: 0.82rem; color: var(--tb-text-tertiary); }
.mp-comments { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 0.75rem; }
.mp-comment { background: rgba(255,255,255,.04); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); padding: 0.6rem 0.75rem; }
.mp-comment-meta { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }
.mp-comment-user { font-weight: 600; font-size: 0.82rem; color: var(--tb-accent); }
.mp-comment-date { font-size: 0.75rem; color: var(--tb-text-tertiary); margin-left: auto; }
.btn-delete-comment { background: transparent; border: none; color: var(--tb-text-quaternary); font-size: 0.75rem; cursor: pointer; padding: 0; line-height: 1; }
.btn-delete-comment:hover { color: var(--tb-error); }
.mp-comment-text { margin: 0; font-size: 0.85rem; color: var(--tb-text-secondary); line-height: 1.4; }
.mp-comment-form { display: flex; gap: 0.5rem; align-items: flex-end; }
.mp-comment-input { flex: 1; background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-primary); padding: 0.5rem 0.75rem; font-size: 0.875rem; resize: vertical; outline: none; }
.mp-comment-input:focus { border-color: var(--tb-accent); }
.btn-comment { background: var(--tb-accent); border: none; border-radius: var(--tb-radius-sm); color: var(--tb-text-on-accent); font-size: 0.875rem; font-weight: 600; padding: 0.5rem 1rem; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
.btn-comment:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-comment:not(:disabled):hover { background: var(--tb-accent-hover); }
.mp-publish-modal { background: var(--tb-glass-modal); backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xl); box-shadow: var(--tb-shadow-modal); padding: 1.5rem; width: 560px; max-width: 95vw; max-height: 90vh; overflow-y: auto; position: relative; display: flex; flex-direction: column; gap: 1rem; }
.mp-publish-modal h2 { margin: 0; font-size: 1.1rem; color: var(--tb-text-primary); }
.mp-field { display: flex; flex-direction: column; gap: 0.35rem; }
.mp-field label { font-size: 0.8rem; font-weight: 600; color: var(--tb-text-secondary); }
.mp-field-row { display: flex; gap: 0.75rem; align-items: flex-end; }
.mp-input { background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-primary); font-size: 0.875rem; padding: 0.5rem 0.75rem; width: 100%; box-sizing: border-box; resize: vertical; outline: none; }
.mp-input:focus { border-color: var(--tb-accent); }
.mp-select { background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-sm); color: var(--tb-text-primary); font-size: 0.875rem; padding: 0.5rem 0.75rem; width: 100%; cursor: pointer; }
.mp-container-editor { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.4rem; }
.mp-input-port { width: 80px; flex-shrink: 0; }
.btn-add-container { background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-secondary); font-size: 0.8rem; padding: 0.3rem 0.7rem; cursor: pointer; }
.btn-add-container:hover { border-color: var(--tb-running); color: var(--tb-running); }
.btn-remove-container { background: transparent; border: none; color: var(--tb-text-quaternary); font-size: 0.9rem; cursor: pointer; flex-shrink: 0; padding: 0 0.25rem; }
.btn-remove-container:hover { color: var(--tb-error); }
.mp-publish-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
.btn-cancel { background: transparent; border: 1px solid var(--tb-stroke-strong); border-radius: var(--tb-radius-sm); color: var(--tb-text-secondary); font-size: 0.875rem; padding: 0.5rem 1rem; cursor: pointer; }
.btn-cancel:hover { border-color: var(--tb-error); color: var(--tb-error); }
.btn-publish { background: var(--tb-running); border: none; border-radius: var(--tb-radius-sm); color: #fff; font-size: 0.875rem; font-weight: 700; padding: 0.5rem 1.2rem; cursor: pointer; transition: opacity 0.15s; }
.btn-publish:hover { opacity: 0.85; }
```

---

#### AuditPage.css

- [ ] **Step 5: Replace `frontend/src/pages/AuditPage.css`**

```css
.audit-page { padding: 1.5rem; max-width: 900px; margin: 0 auto; }
.audit-title { margin-bottom: 1rem; color: var(--tb-text-primary); }
.audit-filters { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
.audit-filter-btn { padding: 0.3rem 0.75rem; border-radius: var(--tb-radius-pill); border: 1px solid var(--tb-stroke); background: transparent; color: var(--tb-text-secondary); cursor: pointer; font-size: 0.8rem; transition: all 0.15s; }
.audit-filter-btn.active { background: var(--tb-accent); border-color: var(--tb-accent); color: var(--tb-text-on-accent); font-weight: 700; }
.audit-filter-btn:not(.active):hover { border-color: var(--tb-stroke-strong); color: var(--tb-text-primary); }
.audit-empty { color: var(--tb-text-tertiary); }
.audit-error { color: var(--tb-error); }
.audit-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.audit-table thead tr { border-bottom: 1px solid var(--tb-stroke); color: var(--tb-text-tertiary); }
.audit-table th { text-align: left; padding: 0.5rem 0.75rem; }
.audit-table tbody tr { border-bottom: 1px solid var(--tb-stroke); }
.audit-table tbody tr:hover { background: rgba(255,255,255,.03); }
.audit-td { padding: 0.5rem 0.75rem; }
.audit-td-time { color: var(--tb-text-tertiary); white-space: nowrap; }
.audit-td-action { color: var(--tb-text-primary); }
.audit-td-action-icon { margin-right: 0.35rem; }
.audit-td-name { font-family: var(--tb-font-mono); color: var(--tb-text-primary); }
.audit-td-muted { color: var(--tb-text-tertiary); }
```

- [ ] **Step 6: Verify build passes**

```bash
cd frontend && npm run build
```

- [ ] **Step 7: Verify lint passes**

```bash
cd frontend && npm run lint
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/AuthPage.css frontend/src/pages/TemplatesPage.css frontend/src/pages/TeamsPage.css frontend/src/pages/MarketplacePage.css frontend/src/pages/AuditPage.css
git commit -m "feat(css): phase 5 — pages (auth glass card, orange CTA buttons)"
```

---

### Task 6: Phase 6 — Polish

**Files:**
- Modify: `frontend/src/components/Toast.css`
- Modify: `frontend/src/components/CommandPalette.css`
- Modify: `frontend/src/components/ContainerLogsModal.css`

---

#### Toast.css

- [ ] **Step 1: Replace `frontend/src/components/Toast.css`**

```css
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: stretch;
  background: var(--tb-glass-modal);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-md);
  box-shadow: var(--tb-shadow-float);
  overflow: hidden;
  animation: toast-slide 0.2s ease-out;
  pointer-events: auto;
  min-width: 280px;
  max-width: 380px;
}

.toast-strip {
  width: 4px;
  flex-shrink: 0;
}
.toast-strip-success { background: var(--tb-running); }
.toast-strip-error   { background: var(--tb-error); }
.toast-strip-warning { background: var(--tb-warning); }
.toast-strip-info    { background: var(--tb-info); }

.toast-body {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--tb-space-3);
  padding: var(--tb-space-3) var(--tb-space-4);
}

.toast-msg {
  flex: 1;
  font-size: 13px;
  color: var(--tb-text-primary);
  line-height: 1.4;
}

.toast-action {
  background: transparent;
  border: 1px solid var(--tb-stroke-strong);
  border-radius: var(--tb-radius-xs);
  color: var(--tb-text-secondary);
  font-size: 12px;
  padding: 3px 8px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}
.toast-action:hover { background: rgba(255,255,255,.08); color: var(--tb-text-primary); }

.toast-close {
  background: transparent;
  border: none;
  color: var(--tb-text-tertiary);
  font-size: 14px;
  padding: 0 var(--tb-space-3) 0 0;
  cursor: pointer;
  flex-shrink: 0;
  align-self: center;
  transition: color 0.12s;
}
.toast-close:hover { color: var(--tb-text-primary); }
```

---

#### CommandPalette.css

- [ ] **Step 2: Replace `frontend/src/components/CommandPalette.css`**

```css
.cp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
}

.cp-modal {
  background: var(--tb-glass-modal);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-lg);
  box-shadow: var(--tb-shadow-modal);
  width: 100%;
  max-width: 560px;
  overflow: hidden;
}

.cp-search-row {
  display: flex;
  align-items: center;
  gap: var(--tb-space-3);
  padding: var(--tb-space-4);
  border-bottom: 1px solid var(--tb-stroke);
}

.cp-search-icon { color: var(--tb-text-tertiary); flex-shrink: 0; font-size: 16px; }

.cp-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--tb-text-primary);
  font-size: 16px;
  font-family: var(--tb-font-display);
  outline: none;
}
.cp-input::placeholder { color: var(--tb-text-tertiary); }

.cp-list {
  max-height: 380px;
  overflow-y: auto;
  padding: var(--tb-space-2);
}

.cp-item {
  display: flex;
  align-items: center;
  gap: var(--tb-space-3);
  padding: var(--tb-space-3) var(--tb-space-3);
  border-radius: var(--tb-radius-sm);
  cursor: pointer;
  transition: background 0.1s;
}
.cp-item:hover, .cp-item-active { background: var(--tb-accent-soft); }

.cp-item-icon { color: var(--tb-text-tertiary); flex-shrink: 0; font-size: 15px; }
.cp-item-label { flex: 1; font-size: 14px; color: var(--tb-text-primary); }
.cp-item-type { font-size: 11px; color: var(--tb-text-tertiary); background: rgba(255,255,255,.07); border-radius: var(--tb-radius-xs); padding: 2px 6px; flex-shrink: 0; }

.cp-empty {
  padding: var(--tb-space-6) var(--tb-space-4);
  text-align: center;
  color: var(--tb-text-tertiary);
  font-size: 14px;
}

.cp-footer {
  display: flex;
  gap: var(--tb-space-4);
  padding: var(--tb-space-3) var(--tb-space-4);
  border-top: 1px solid var(--tb-stroke);
  font-size: 11px;
  color: var(--tb-text-tertiary);
}
```

---

#### ContainerLogsModal.css

- [ ] **Step 3: Replace `frontend/src/components/ContainerLogsModal.css`**

```css
.logs-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1.5rem;
}

.logs-modal {
  background: var(--tb-glass-modal);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-xl);
  box-shadow: var(--tb-shadow-modal);
  width: 100%;
  max-width: 900px;
  height: 75vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.logs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255,255,255,.03);
  border-bottom: 1px solid var(--tb-stroke);
  flex-shrink: 0;
  gap: 1rem;
}

.logs-title { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
.logs-icon { font-size: 1rem; color: var(--tb-text-tertiary); flex-shrink: 0; }
.logs-name { font-size: 0.9rem; font-weight: 600; color: var(--tb-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.logs-live-badge { font-size: 0.72rem; font-weight: 700; color: var(--tb-running); letter-spacing: 0.05em; flex-shrink: 0; animation: pulse-soft 2s infinite; }
.logs-live-badge-polling { color: var(--tb-warning); }

.logs-controls { display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0; }
.logs-tail-label { font-size: 0.78rem; color: var(--tb-text-tertiary); margin-right: 0.1rem; }
.logs-tail-btn { background: rgba(255,255,255,.06); border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-secondary); font-size: 0.75rem; padding: 0.2rem 0.5rem; cursor: pointer; transition: all 0.15s; }
.logs-tail-btn:hover { border-color: var(--tb-stroke-strong); color: var(--tb-text-primary); }
.logs-tail-btn.active { background: rgba(255,255,255,.10); border-color: var(--tb-accent); color: var(--tb-accent); }

.logs-actions { display: flex; gap: 0.25rem; margin-left: 0.25rem; }
.logs-action-btn { background: transparent; border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-tertiary); font-size: 0.85rem; width: 1.8rem; height: 1.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.logs-action-btn:hover:not(:disabled) { border-color: var(--tb-accent); color: var(--tb-accent); background: var(--tb-accent-soft); }
.logs-action-btn:disabled { opacity: 0.3; cursor: default; }

.logs-close-btn { background: transparent; border: 1px solid var(--tb-stroke); border-radius: var(--tb-radius-xs); color: var(--tb-text-tertiary); font-size: 0.85rem; width: 1.8rem; height: 1.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; margin-left: 0.25rem; }
.logs-close-btn:hover { border-color: var(--tb-error); color: var(--tb-error); }

.logs-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
  font-family: var(--tb-font-mono);
  font-size: 0.78rem;
  line-height: 1.6;
  color: var(--tb-text-primary);
}
.logs-body::-webkit-scrollbar { width: 6px; }
.logs-body::-webkit-scrollbar-track { background: transparent; }
.logs-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 3px; }

.log-line { white-space: pre-wrap; word-break: break-all; padding: 0.05rem 0; border-bottom: 1px solid transparent; }
.log-line:hover { background: rgba(255,255,255,.03); border-color: var(--tb-stroke); border-radius: 3px; }

.logs-hint { color: var(--tb-text-tertiary); font-size: 0.85rem; font-family: var(--tb-font-display); }

.logs-scroll-btn {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: var(--tb-glass-2);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--tb-stroke);
  border-radius: var(--tb-radius-pill);
  color: var(--tb-text-primary);
  font-size: 0.78rem;
  padding: 0.35rem 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
}
.logs-scroll-btn:hover { border-color: var(--tb-stroke-strong); }
```

- [ ] **Step 4: Token cleanup — search for any remaining old Catppuccin variable references across all CSS files**

```bash
cd frontend && grep -rn 'var(--bg-\|var(--fg-\|var(--accent-\|var(--border-\|var(--shadow-modal\|var(--font-display\|var(--font-mono\|var(--radius-\|var(--space-\|#1e1e2e\|#181825\|#313244\|#45475a\|#cdd6f4\|#a6adc8\|#6c7086\|#89b4fa\|#f38ba8\|#a6e3a1\|#fab387' src/
```
Expected: no output (zero matches).

If any remain, replace them using the migration map at the top of this plan.

- [ ] **Step 5: Verify build passes**

```bash
cd frontend && npm run build
```

- [ ] **Step 6: Verify lint passes**

```bash
cd frontend && npm run lint
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/Toast.css frontend/src/components/CommandPalette.css frontend/src/components/ContainerLogsModal.css
git commit -m "feat(css): phase 6 — glass toasts, command palette, log modal + token cleanup"
```

---

## Post-Implementation Checklist

After all 6 phases are committed:

- [ ] **Final build check**
```bash
cd frontend && npm run build && npm run lint
```

- [ ] **Visual review checklist** — open the app and verify:
  - [ ] Page background gradient visible through glass surfaces
  - [ ] Topbar is 52px, logo is orange
  - [ ] Sidebar nav active item has orange left-border glow
  - [ ] Container cards have rounded-20px corners and glass effect
  - [ ] Status dots glow (running = green, exited = red)
  - [ ] Live badge is pill-shaped, green-tinted
  - [ ] Modals use 28px radius and blur overlay
  - [ ] Auth page shows centered glass card
  - [ ] Toasts appear in bottom-right with colored left strip
  - [ ] Command palette has large search input

- [ ] **Push to main**
```bash
git push origin main
```
