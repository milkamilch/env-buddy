# TestBud Light Redesign — Design Spec

**Date:** 2026-06-26
**Replaces:** `2026-05-21-liquid-glass-redesign.md` (dark Liquid Glass / `--tb-*` system)

---

## Goal

Replace the dark Liquid Glass design (glassmorphism, `--tb-*` tokens) with the TestBud Clean & Minimal Light system from the design handoff at `/Users/larswenner/Downloads/TestBud_extracted/design_handoff_dashboard_minimal/`. Full app scope — all pages go light. Variant A "Air" throughout.

---

## Scope

- **In:** All pages (Dashboard, Templates, Teams, Marketplace, Audit, Auth) + App shell (Sidebar, Topbar)
- **In:** New token system, new atoms (StatusPill, Sparkline, Segmented), full component rebuild
- **Out:** Tweaks panel (design-handoff prototype artifact, not shipped to product)
- **Out:** Variant B "Console" overrides (not needed)
- **Out:** Backend / API layer (zero changes)

---

## Design System

### Palette & Tokens

All tokens live in `:root {}` in `frontend/src/index.css`. The entire `--tb-*` namespace is removed.

```css
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
}
```

### Typography

- **UI text:** System sans-serif (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`)
- **Mono:** JetBrains Mono 400/500/600 via Google Fonts — `<link>` added to `frontend/index.html`
- Applied via `font-family: "JetBrains Mono", monospace` on `.mono`, `code`, container names, port numbers, resource values

---

## App Shell

```
div.app
  grid-template-columns: 248px 1fr
  height: 100vh
  overflow: hidden
  background: var(--bg)

  Sidebar (248px, full height)
  div.main (flex-col)
    Topbar (height: 60px, backdrop-filter: blur(12px))
    div.scroll (flex: 1, overflow-y: auto)
      <page content>
```

### Sidebar

- Width: 248px, `background: var(--surface)`, `border-right: 1px solid var(--line)`
- Brand mark top (logo + "TestBud" wordmark)
- Nav items: icon + label + optional badge; active item: `background: var(--accent-soft)`, `color: var(--accent)`
- Quick-start pills at bottom of nav area
- Side-foot: API status indicator + user info

### Topbar

- Height: 60px, `background: color-mix(in srgb, var(--surface) 78%, transparent)`, `backdrop-filter: blur(12px)`
- `border-bottom: 1px solid var(--line)`
- Left: breadcrumb (page title)
- Center: ⌘K search trigger bar
- Right: bell icon with badge dot, "+ New" CTA button, user pill with avatar

---

## New Atom Components

### StatusPill (`StatusPill.jsx`)

Colored chip with animated dot for container status.

```jsx
// Usage: <StatusPill status="running" />
// Props: status: "running" | "stopped" | "starting"
```

- `.pill.run`: green dot + "Running" label, `background: rgba(31,157,87,0.10)`, `color: var(--run)`
- `.pill.stop`: red dot + "Stopped", `background: rgba(204,59,46,0.10)`, `color: var(--stop)`
- `.pill.start`: amber dot + "Starting", `background: rgba(201,124,18,0.10)`, `color: var(--warn)`
- Dot: 6px circle, `.run` dot has CSS `animation: pulse 1.8s ease-in-out infinite`
- Prop-to-class mapping: `"running"` → `.run`, `"stopped"` → `.stop`, `"starting"` → `.start`

### Sparkline (`Sparkline.jsx`)

SVG mini-chart for CPU/RAM series data.

```jsx
// Usage: <Sparkline data={cpuSeries} color={color} height={32} />
// Props: data: number[], color: string, height: number
```

- SVG `viewBox="0 0 100 32"`, `preserveAspectRatio="none"`
- Polyline `strokeWidth={1.4}`, no fill on stroke
- LinearGradient fill: `opacity 0.18 → 0` from top to bottom
- Points computed from normalized data array (0–100 range)

### Segmented (`Segmented.jsx`)

Tab/filter control with sliding active indicator.

```jsx
// Usage: <Segmented options={["alle","running","stopped"]} counts={counts} value={filter} onChange={setFilter} />
```

- Container: `background: var(--surface-sink)`, `border-radius: var(--r-sm)`, padding 3px
- Active button: `background: var(--surface)`, `box-shadow: var(--shadow-card)`, `border-radius: calc(var(--r-sm) - 2px)`
- Count badge: small `--ink-3` number after label

---

## Dashboard Components

### ContainerCard (`ContainerCard.jsx`)

Three-section card: head / statgrid / foot.

- **Head:** Template icon (emoji or image) + container name (mono) + image tag + StatusPill
- **Statgrid:** 2 columns — CPU% with Sparkline, RAM used/max with Sparkline
- **Foot (running):** countdown timer (mono) + action icon buttons (stop, extend, terminal, logs, more)
- **Foot (stopped):** owner label + start button + delete button
- Card: `background: var(--surface)`, `border: 1px solid var(--line)`, `border-radius: var(--r-card)`, `box-shadow: var(--shadow-card)`
- Hover: `box-shadow: var(--shadow-pop)`, `transform: translateY(-1px)`, transition 150ms

### DashboardStats (`DashboardStats.jsx`)

4-up stats strip above the container grid.

- StatCards: total / running / CPU avg / RAM avg
- Each: label (`--ink-3`) + large value (`--ink`) + optional trend indicator
- Grid: `repeat(4, 1fr)`, gap 12px

### DashboardPage (`DashboardPage.jsx`)

- Toolbar: search input + Segmented filter + spacer + grid/list toggle (icon segmented)
- Grid view: `repeat(auto-fill, minmax(300px, 1fr))`
- List view: `ContainerRow` — 6 columns: `1.6fr 0.7fr 1fr 1fr 0.9fr auto`
- Empty state: icon + headline + sub + CTA button

---

## Overlay Components

### StartDrawer (`StartDrawer.jsx`)

Right-side sheet for creating a new container.

- `position: fixed; top: 14px; right: 14px; bottom: 14px; width: 440px`
- `border-radius: 18px`, `background: var(--surface)`, `box-shadow: var(--shadow-pop)`
- Scrim: full-screen `rgba(0,0,0,0.20)` with `backdrop-filter: blur(2px)`
- Slide-in animation: `translateX(100%) → translateX(0)`, 200ms
- Form: template picker, name field, memory select, auto-stop select, submit CTA

### CommandPalette (`CommandPalette.jsx`)

Centered overlay with keyboard navigation.

- Scrim: `rgba(0,0,0,0.25)`, `backdrop-filter: blur(4px)`
- Panel: `width: 600px`, `border-radius: 16px`, `background: var(--surface)`, `box-shadow: var(--shadow-pop)`
- Search input at top, results below in sections (Aktionen / Navigation / Container)
- Keyboard: `↑↓` to navigate, `↵` to execute, `Esc` to close
- Active result: `background: var(--accent-soft)`

### Toast (`Toast.jsx`)

Dark pill notification, centered bottom.

- `background: var(--ink)`, `color: #fff`, `border-radius: var(--r-pill)`
- `position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%)`
- Fade-in / slide-up 150ms, auto-dismiss after 2600ms
- Layout: check icon + message text + optional mono tag

---

## Other Pages (Phase 6)

All pages (Templates, Teams, Marketplace, Audit, Auth) get a full rebuild using the new token system. Since none are implemented beyond placeholder stubs in the current codebase, each page gets:

- Proper page header (title + description)
- Relevant content structure (tables, cards, forms) consistent with Dashboard aesthetic
- No dark backgrounds, no `--tb-*` tokens

Exact layouts to be designed during implementation, following Dashboard patterns as blueprint.

---

## Implementation Phases

| Phase | Branch | Files touched |
|---|---|---|
| 1 — Tokens | `feat/light-phase-1-tokens` | `frontend/src/index.css`, `frontend/index.html` |
| 2 — Shell | `feat/light-phase-2-shell` | `App.css`, `App.jsx`, `Sidebar.jsx`, `Topbar.jsx` |
| 3 — Atoms | `feat/light-phase-3-atoms` | `StatusPill.jsx/.css`, `Sparkline.jsx`, `Segmented.jsx/.css` |
| 4 — Dashboard | `feat/light-phase-4-dashboard` | `ContainerCard.jsx/.css`, `DashboardStats.jsx/.css`, `DashboardPage.jsx` |
| 5 — Overlays | `feat/light-phase-5-overlays` | `StartDrawer.jsx/.css`, `CommandPalette.jsx/.css`, `Toast.jsx/.css` |
| 6 — Pages | `feat/light-phase-6-pages` | All remaining page JSX + CSS files |

Each phase: own branch → commit in user's name → push → merge to main before next phase starts.

---

## Success Criteria

- `npm run dev` runs without errors after each phase
- No `--tb-*` token references anywhere in the codebase after Phase 1
- No dark background (`#0B0B0F` or similar) visible in the browser after Phase 2
- All status colors use semantic tokens (`--run`, `--stop`, `--warn`)
- JetBrains Mono renders for all mono elements (container names, ports, resource values)
- Design matches Variant A "Air" from the handoff (white cards, hairline borders, orange accent)
- Tweaks panel is NOT present in the shipped product
