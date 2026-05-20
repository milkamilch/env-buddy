# Frontend Redesign — Design Spec

**Datum:** 2026-05-20  
**Projekt:** env-buddy  
**Grundlage:** `/Users/larswenner/Downloads/DESIGN_GUIDE.md`

---

## Überblick

Das Frontend wird nach dem Catppuccin-Design-Guide in vier voneinander unabhängigen Git-Branches umgebaut. Jeder Branch enthält einen einzigen Commit und wird separat gemergt. Technologie: **Tailwind CSS v4** + CSS Custom Properties für Tokens.

---

## Phase 1 — Tailwind + Tokens + Fonts

**Branch:** `design/phase-1-tokens`

### Was passiert

- `tailwind` als devDependency installieren (v4 via `@tailwindcss/vite`)
- `tailwind.config.js` mit allen Catppuccin-Tokens als CSS-Variablen-Referenzen anlegen (kein Hex-Literal)
- `index.css` komplett ersetzen:
  - `@import "tailwindcss"` oben
  - Dark-Mode-Tokens (`html` default) und Light-Mode-Tokens (`[data-theme="light"]`) mit korrekten Variablennamen nach Spec (`--bg-base`, `--bg-mantle`, `--bg-surface`, `--bg-surface2`, `--bg-overlay0`, `--bg-overlay1`, `--fg-subtext0`, `--fg-subtext1`, `--fg-text`, `--accent-*`)
  - Spacing-Tokens (`--space-1` bis `--space-8`), Radius-Tokens (`--radius-sm/md/lg/xl`), Border-Tokens, Shadow-Tokens
  - Font-Tokens (`--font-display`, `--font-mono`)
  - Google Fonts einbinden: `Space Grotesk` + `JetBrains Mono` via `@import` in CSS
  - `font-family` auf `var(--font-display)` setzen, `:root` auf korrekte Werte
- Alle bestehenden `.css`-Dateien im Projekt bleiben noch unberührt — nur `index.css` + Tailwind-Config werden geändert
- Scrollbar-Styles, `box-sizing`, `color-scheme` bleiben erhalten

### Akzeptanzkriterien

- `npm run dev` startet ohne Fehler
- Space Grotesk ist im Browser sichtbar
- Dark/Light-Toggle (`data-theme="light"`) wechselt korrekt auf Catppuccin Latte

---

## Phase 2 — Layout: Sidebar + Topbar

**Branch:** `design/phase-2-layout`

### Was passiert

**`App.jsx` + `App.css` werden umgebaut:**

Aktuell: `app-header` (horizontal, nav + user + badge) + `app-main` (sidebar 340px + content)

Neu:
```
┌── .app ──────────────────────────────────────────────────────┐
│  .app-topbar (56px, bg-mantle, border-bottom)                │
│    [Logo + "env-buddy"]  [Breadcrumbs]  [⌘K Pill]  [Avatar] │
├──────────────────────────────────────────────────────────────┤
│  .app-body (flex, flex-1)                                    │
│  ┌── .app-sidebar (240px, bg-mantle, border-right) ─────┐   │
│  │  Nav-Items (Dashboard, Templates, Marketplace,       │   │
│  │             Teams, Audit)                             │   │
│  │  Aktiver Item: 2px left-border accent-blue +         │   │
│  │                bg-surface                            │   │
│  │  ─────────────────────────────────────────────────   │   │
│  │  Quick-Start Section (unten, collapsed by default)   │   │
│  └───────────────────────────────────────────────────────┘   │
│  ┌── .app-content (flex-1, bg-base) ────────────────────┐   │
│  │  <Outlet> (DashboardPage, TemplatesPage, …)          │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Topbar-Details:**
- Höhe 56px, `background: var(--bg-mantle)`, `border-bottom: var(--border-thin)`
- Links: Logo-Icon (Lucide `box` 20px, accent-blue) + Text "env-buddy" (Space Grotesk, 16px, 600)
- Mitte: Breadcrumb — Seitenname als `fg-subtext0 › fg-text`
- Rechts: ⌘K-Pill (Suchbox-Optik: `bg-surface2`, `border-thin`, Hotkey `⌘K` in monospace), Avatar

**Sidebar-Details:**
- 240px fix, `background: var(--bg-mantle)`, `border-right: var(--border-thin)`
- Nav-Items: 40px Höhe, Icon (Lucide 20px, stroke 1.75) + Label 14px Space Grotesk
- Aktiv: `border-left: 2px solid var(--accent-blue)`, `background: var(--bg-surface)`
- Icons nach Guide-Mapping: Dashboard→`gauge`, Templates→`bookmark`, Marketplace→`store`, Teams→`users`, Audit→`scroll-text`
- Quick-Start unten: Divider + Label "QUICK START" 11px mono caps + Kacheln 56×56px (Template-Icons als Text-Emoji, da user-defined)

**StartForm:**
- Verschwindet als `app-sidebar` aus dem Main-Bereich
- Wird als Drawer geöffnet via `+`-Button (Lucide `plus`) ganz rechts im Topbar (neben Avatar)
- Drawer: 400px breit, von rechts eingeschoben, `bg-surface`, `border-left: border-thin`, `shadow-popover`
- Drawer-Hintergrund: kein `backdrop-filter`, nur halbtransparentes Overlay (`rgba(17,17,27,.4)`)

**`DashboardPage.jsx`:**
- Entfernt `<aside className="app-sidebar">` + `<main className="app-main">` Wrapper
- Gibt nur noch `<section className="app-content">` zurück (Layout kommt von App-Shell)
- StartForm-Drawer-State (`startDrawerOpen`) wird in `App.jsx` verwaltet

### Akzeptanzkriterien

- Sidebar mit korrekten Nav-Items und aktivem Highlighting
- Topbar 56px mit Breadcrumb, ⌘K-Pill, Avatar
- Light/Dark-Toggle weiterhin funktional
- Alle Seiten erreichbar
- Start-Container weiterhin möglich

---

## Phase 3 — ContainerCard + Buttons + Badges

**Branch:** `design/phase-3-cards`

### ContainerCard (Grid-Mode)

Struktur:
```
┌─ .container-card ────────────────────────────────────┐
│ [●status-dot] [STATUS] [image:tag] [timer] [⋮]       │  ← Header
│                                                       │
│ container-name (mono, 15px, 600)                      │  ← Name
│ uuid… · :port (mono, 11px, subtext0)                  │  ← Sub
│                                                       │
│ CPU  2.3%  [────sparkline────────────────]            │  ← Stats
│ RAM  148MB [────sparkline────────────────]            │
│                                                       │
│ ─────────────────────────────────────────────────    │
│ [Stop] [Verlängern] [Terminal] [Logs]  ·  ● LIVE     │  ← Actions
└───────────────────────────────────────────────────────┘
```

**Status-Dot:**
- 8px, `border-radius: 50%`
- `running`: `background: var(--accent-green)`, `box-shadow: 0 0 12px var(--accent-green)`, `@keyframes pulse-soft` (2s, opacity 1→0.45)
- `stopped/exited`: `background: var(--accent-red)`, kein Glow, kein Pulse
- `starting`: `background: var(--accent-yellow)`, kein Glow

**Auto-Stop-Timer:**
- Rechts im Header, JetBrains Mono 11px
- Normal: `fg-subtext0`
- `remaining <= 300s`: Farbe `accent-peach`, `@keyframes pulse-soft` 2s

**Sparklines:**
- SVG `<polyline>`, 60 Datenpunkte max, 1.2px stroke
- CPU: `stroke: var(--accent-green)`, Fläche darunter mit 12% Alpha als `<polygon>`
- RAM: `stroke: var(--accent-sky)`, gleiche Fläche
- Füllfläche: `color-mix(in oklch, var(--accent-green) 12%, transparent)`

**Actions-Row:**
- Border-top `var(--border-thin)`, `padding-top: var(--space-2)`
- Buttons: `btn-destructive` (Stop), `btn-default` (Verlängern, Terminal, Logs), alle Höhe 28px
- LIVE-Badge rechts

**Stopped-State:**
- `opacity: 0.7`
- Keine Stats-Section
- Nur `[▶ Starten]` + `[🗑 Löschen]` als Actions

**List-Mode (kompakt):**
- 48px Zeilenhöhe, `border-radius: var(--radius-md)`
- Status-Dot | Status-Label (60px) | Name (mono, min 140px) | Port (mono) | Inline-Sparkline (80×16px SVG) | CPU-Wert | Timer | Icon-Buttons (28×28px)

### Button-Varianten (globale Komponente)

Alle Buttons nutzen Tailwind-Klassen mit CSS-Variablen:

| Klasse | BG | Text | Border | Einsatz |
|---|---|---|---|---|
| `btn-primary` | `accent-blue` | `bg-base` | none | 1× pro View |
| `btn-default` | `bg-surface2` | `fg-text` | `border-thin` | Standard |
| `btn-ghost` | transparent | `fg-subtext1` | none | Toolbar |
| `btn-destructive` | transparent | `accent-red` | `1px solid accent-red@30%` | Stop, Löschen |
| `btn-icon` | transparent | `fg-subtext1` | none, hover: surface2 | 32×32px |

Höhen: `btn-sm` 28px (Cards), `btn-md` 36px (Standard), `btn-lg` 44px (Modal-Submit)  
Disabled: `opacity-40 cursor-not-allowed`

### LIVE/POLLING-Badge

```
● LIVE     → accent-green @ 12% bg, pulse-soft 1.6s
● POLLING  → accent-yellow @ 12% bg, kein pulse
● OFFLINE  → accent-red @ 12% bg
```
11px mono uppercase, 6px Dot, `padding: 2px 8px`, `border-radius: var(--radius-sm)`

### Akzeptanzkriterien

- Status-Dot-Glow bei `running`
- Timer wird peach bei < 5 min
- Sparkline rendert mit Füllfläche
- LIVE-Badge sichtbar
- Buttons in allen 5 Varianten funktional
- List-Mode mit Inline-Sparkline

---

## Phase 4 — Restliche Komponenten

**Branch:** `design/phase-4-components`

### Toast

- Position: `fixed bottom-4 right-4`, gestapelt, max 3, neue oben
- Breite 320px, `border-radius: var(--radius-md)`
- Linker farbiger Strip 4px: success→green, error→red, warning→peach, info→blue
- Auto-dismiss: success 4s, error 6s, mit Aktion: nie; Pause on hover
- Inhalt: Titel (14px, 600) + optional 1 Zeile Subline (13px, subtext1) + optional 1 Button

### Modals

- Backdrop: `rgba(17,17,27,.72)` + `backdrop-filter: blur(4px)` (einzige Ausnahme für backdrop-blur)
- Modal: `bg-surface`, `border-thin`, `radius-lg`, `shadow-modal`
- Größen: sm 560px, md 720px, lg 960px (Logs/Terminal)
- Header 56px: Titel links (16px, 600) + Close-Button rechts; `border-bottom: border-thin`
- Footer: Primary-Button rechts, Ghost-Cancel links davon, 16px gap
- Escape schließt, `inert` auf Background, Tab-Trap

### Empty States

- Kein Emoji als Icon — stattdessen kleines SVG-Ornament aus geometrischen Primitiven (Kreis + gestricheltes Rechteck, 48px)
- Headline `text-xl` (24px), Subline `text-base fg-subtext1`
- Primary-Button darunter

### Tabellen (Marketplace, Templates, API-Keys, Members)

- Zebra: ungerade Zeilen `bg-surface`, gerade `bg-mantle`
- Header: 12px mono uppercase, `fg-subtext0`, sortable mit `↕`
- Zeilenhöhe 48px, Hover `bg-surface2`
- Aktionen: Icon-Buttons + `⋮` Overflow am Ende

### Akzeptanzkriterien

- Toasts mit farbigem Strip statt Emoji
- Modals mit korrektem Backdrop-Blur + Escape-Handling
- Empty States ohne Emoji-Icons
- Tabellen mit Zebra-Striping

---

## Technische Entscheidungen

| Entscheidung | Wahl | Grund |
|---|---|---|
| CSS-Strategie | Tailwind v4 + CSS Custom Properties | Tokens bleiben themeable ohne Class-Switching |
| Icon-Library | `lucide-react` | Pflicht per Design Guide |
| Fonts | Google Fonts via CSS `@import` | Kein Build-Step nötig, beide im Guide spezifiziert |
| Branches | 1 Branch pro Phase, 1 Commit | Reviewbar, einzeln mergebar |
| Emoji als Icons | Nur wo user-defined (Template-Avatar) | Guide: nie als Status-Indikator |

---

## Nicht in Scope

- Command Palette (⌘K) — eigene Feature-Story
- xterm.js Terminal-Integration — eigene Feature-Story  
- Drag-and-Drop Quick-Start-Kacheln — eigene Feature-Story
- Backend-Änderungen
