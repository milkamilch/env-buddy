# Liquid Glass Redesign — Design Spec

## Goal

Vollständiger Rebuild aller Frontend-CSS-Dateien (19 Dateien) von Catppuccin-Tokens auf das TestBud Liquid Glass Design-System. Ergebnis: glassmorphe, Apple-inspirierte UI mit Orange-Akzent, Systemschriften und großen kontinuierlichen Ecken — in 6 sequenziellen Phasen.

## Architecture

**Token-System:** `testbud-tokens.css` ersetzt die Catppuccin-Tokens in `index.css`. Alle `--bg-*`, `--fg-*`, `--accent-*` Variablen werden durch `--tb-*` Variablen abgelöst. Der Tailwind-`@theme {}`-Block wird auf die neuen Token-Namen aktualisiert.

**Glass-Oberflächen:** Alle Surfaces verwenden `backdrop-filter: blur() saturate()` über einem gemeinsamen Seiten-Hintergrundgradient. Drei Ebenen: `glass-1` (Cards), `glass-2` (Topbar/Sidebar), `glass-modal` (Modals/Drawer).

**Phasing:** 6 unabhängige Git-Branches, jede Phase ist deploybar und CI-grün bevor die nächste beginnt.

## Design Tokens

Quelle: `/Users/larswenner/Downloads/testbud-tokens.css`

### Schrift
- **Display:** `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", system-ui, sans-serif` — kein Google Fonts Import
- **Mono:** `ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace`

### Farben
| Token | Wert Dark | Wert Light | Verwendung |
|-------|-----------|------------|------------|
| `--tb-accent` | `#FF6B35` | `#FF6B35` | Primäre Aktionen, Logo, aktive Nav |
| `--tb-accent-hover` | `#FF8559` | `#FF8559` | Hover-Zustand Accent-Buttons |
| `--tb-running` | `#30D158` | `#28A745` | Container running, Live-Badge |
| `--tb-warning` | `#FF9F0A` | `#F58A00` | Paused, Warnungen, Timer fast abgelaufen |
| `--tb-error` | `#FF453A` | `#E0352B` | Fehler, Stopp-Buttons, Toasts |
| `--tb-info` | `#64D2FF` | `#0A84FF` | Info-Toasts, CPU-Balken |
| `--tb-pending` | `#FFD60A` | `#E0A800` | Pending-Zustand |
| `--tb-network` | `#BF5AF2` | `#9D4EE0` | Templates/Network |

### Glass-Oberflächen (Dark)
| Klasse | Background | Verwendung |
|--------|------------|------------|
| `glass-1` | `rgba(28,28,32,.55)` | Cards, Toolbar-Items |
| `glass-2` | `rgba(36,36,42,.72)` | Topbar, Sidebar |
| `glass-modal` | `rgba(22,22,28,.74)` | Modals, Drawer, Command Palette |
| `backdrop-filter` | `blur(20px) saturate(180%)` | glass-1 |
| `backdrop-filter` | `blur(40px) saturate(180%)` | glass-2, glass-modal |

### Seiten-Hintergrund
```css
background-image:
  radial-gradient(1200px 600px at 80% -10%, rgba(255,107,53,0.10), transparent 60%),
  radial-gradient(900px 500px at 5% 110%, rgba(191,90,242,0.08), transparent 55%),
  linear-gradient(180deg, #0B0B0F 0%, #07070A 100%);
background-attachment: fixed;
```

### Radius-Skala
| Token | Wert | Verwendung |
|-------|------|------------|
| `--tb-radius-xs` | `6px` | Badges, Tags |
| `--tb-radius-sm` | `10px` | Inputs, kleine Buttons |
| `--tb-radius-md` | `14px` | Buttons, Chips |
| `--tb-radius-lg` | `20px` | Cards |
| `--tb-radius-xl` | `28px` | Modals, Drawer |
| `--tb-radius-2xl` | `36px` | Hero-Surfaces |
| `--tb-radius-pill` | `999px` | Tags, Badges, Timer |

### Schatten
- **`--tb-shadow-card`**: weicher ambient shadow, weiße Inset-Linie oben
- **`--tb-shadow-float`**: größer, für schwebende Elemente
- **`--tb-shadow-modal`**: groß + tief, für Modals

## Component Specs

### ContainerCard
- **Oberfläche:** `glass-1` (rgba(28,28,32,.55)), `border-radius: 20px`
- **Status-Dot:** `8px` Kreis, Farbe = `--tb-running/warning/error`, `box-shadow: 0 0 10px <color>` (Glüh-Effekt)
- **Live-Badge:** pill-förmig (`border-radius: 999px`), `color-mix(in oklch, --tb-running 12%, transparent)` Hintergrund, passende Border
- **CPU-Balken:** `background: --tb-info` (blau)
- **RAM-Balken:** `background: --tb-running` (grün)
- **Sparklines:** SVG mit `linearGradient`, transparenter Fill, farbige Linie
- **Timer-Chip:** mono font, pill, bei `≤ 300s` → `--tb-error` Farbe + Hintergrund
- **Buttons:** `btn-ghost` (transparent + Border), `btn-danger` (error-tinted), `btn-accent` (orange solid)
- **Trennlinie:** `1px solid rgba(255,255,255,.07)` zwischen Stats und Buttons

### Topbar
- **Höhe:** 52px
- **Oberfläche:** `glass-2`, `border-bottom: 1px solid rgba(255,255,255,.10)`
- **Logo:** `font-weight: 700`, `color: --tb-accent`, `letter-spacing: -0.02em`
- **⌘K Pill:** abgerundete Pill mit Border, disabled-Styling
- **Theme-Toggle / Icons:** `30px` quadratische Ghost-Buttons, `border-radius: 8px`
- **+ Starten:** `border-radius: 14px`, `background: --tb-accent`, `color: --tb-text-on-accent`
- **Avatar:** `28px`, kreisförmig, accent-tinted Border

### Sidebar
- **Breite:** 200px (vorher 240px)
- **Oberfläche:** `glass-1` (leichter als Topbar)
- **Nav-Items:** `border-radius: 10px`, `margin: 1px 6px`, bei active: `background: rgba(255,107,53,.15)`, `box-shadow: inset 2px 0 0 --tb-accent`
- **Icon:** 16px, links, via `item.Icon` member expression (kein ESLint-Problem)

### Start-Drawer
- **Oberfläche:** `glass-modal`
- **Border-radius:** `0 28px 28px 0` (linke Seite gerade für den Slide-in)
- **Overlay:** `rgba(0,0,0,.4)` + `backdrop-filter: blur(4px)`
- **Inputs:** `border-radius: 10px`, glass-Hintergrund
- **Template-Chips:** `4×n` Grid, Chip mit Icon + Label, active = accent-tinted

### Modals (Logs, Edit, Profile, etc.)
- **Oberfläche:** `glass-modal`, `border-radius: 28px`
- **Overlay:** `rgba(0,0,0,.5)` + `backdrop-filter: blur(8px)`
- **Header:** Divider `1px solid rgba(255,255,255,.08)` unten
- **Inset-Highlight:** `box-shadow: 0 0.5px 0 rgba(255,255,255,.12) inset`

### Toasts
- **Oberfläche:** `glass-1` + stärkere Opacity, `border-radius: 14px`
- **Strip:** 4px links, Farbe = Status
- **Keine Änderung am API** (`toast.success/error/warning/info`)

### Auth-Seite (Login/Register)
- **Hintergrund:** Eigener Seitengradient mit stärkerem Orange-Blob (kein Sidebar/Topbar)
- **Card:** `glass-modal`, `border-radius: 28px`, zentriert
- **Logo:** groß, `font-weight: 800`, `color: --tb-accent`

### Command Palette
- **Oberfläche:** `glass-modal`, `border-radius: 20px`
- **Input:** großes Search-Input oben, borderless, `font-size: 16px`
- **Ergebnis-Items:** `border-radius: 10px`, hover = accent-soft background

## Migration Map (Alt → Neu)

| Alt (Catppuccin) | Neu (TestBud) |
|------------------|---------------|
| `--bg-base` | `--tb-bg-page` |
| `--bg-surface` | `--tb-glass-1` |
| `--bg-mantle` | `--tb-glass-2` |
| `--fg-text` | `--tb-text-primary` |
| `--fg-subtext0` | `--tb-text-tertiary` |
| `--fg-subtext1` | `--tb-text-secondary` |
| `--accent-blue` | `--tb-info` |
| `--accent-green` | `--tb-running` |
| `--accent-red` | `--tb-error` |
| `--accent-peach` | `--tb-warning` |
| `--border-thin` | `1px solid rgba(255,255,255,.10)` |
| `--border-strong` | `1px solid rgba(255,255,255,.18)` |
| `--radius-md` | `--tb-radius-lg` (20px für Cards) |
| `--shadow-modal` | `--tb-shadow-modal` |

## Tailwind Config

Der bestehende `@theme {}`-Block in `index.css` wird aktualisiert:

```css
@theme {
  --font-sans: var(--tb-font-display);
  --font-mono: var(--tb-font-mono);

  --color-glass-1:    var(--tb-glass-1);
  --color-glass-2:    var(--tb-glass-2);
  --color-ink:        var(--tb-text-primary);
  --color-ink-2:      var(--tb-text-secondary);
  --color-ink-3:      var(--tb-text-tertiary);
  --color-stroke:     var(--tb-stroke);
  --color-accent:     var(--tb-accent);
  --color-running:    var(--tb-running);
  --color-warning:    var(--tb-warning);
  --color-error:      var(--tb-error);
  --color-info:       var(--tb-info);
  --color-pending:    var(--tb-pending);
  --color-network:    var(--tb-network);

  --radius-xs:  var(--tb-radius-xs);
  --radius-sm:  var(--tb-radius-sm);
  --radius-md:  var(--tb-radius-md);
  --radius-lg:  var(--tb-radius-lg);
  --radius-xl:  var(--tb-radius-xl);
  --radius-2xl: var(--tb-radius-2xl);
  --radius-pill: var(--tb-radius-pill);
}
```

Tailwind bleibt v4 (`@tailwindcss/vite`). Keine `tailwind.config.js` nötig — der Snippet aus den Referenz-Dateien ist für v3 und wird nicht verwendet; stattdessen direktes `@theme {}`.

## Phasenplan

| Phase | Inhalt | Dateien |
|-------|--------|---------|
| 1 | **Foundation** — Tokens, Schrift, Hintergrund, globale Resets | `index.css` |
| 2 | **Layout** — Topbar, Sidebar, App-Shell, Drawer | `App.css`, `App.jsx` (minimal), `StartDrawer` |
| 3 | **Cards & Dashboard** | `ContainerCard.css/jsx`, `StackCard.css`, `DashboardStats.css`, `DashboardPage` partials |
| 4 | **Forms & Modals** | `StartForm.css`, `ContainerEditModal.css`, `ProfileModal.css`, `CreateTemplateModal.css`, `ResourceGraphModal.css`, `TeamStackBuilder.css` |
| 5 | **Pages** | `AuthPage.css`, `TemplatesPage.css`, `TeamsPage.css`, `MarketplacePage.css`, `AuditPage.css` |
| 6 | **Polish** | `Toast.css`, `CommandPalette.css`, `ContainerLogsModal.css` + Token-Cleanup: alle `var(--bg-*)` Reste |

## Out of Scope

- Keine JSX-Logik-Änderungen (nur CSS, außer wo Token-Referenzen in `style={}`-Props sitzen)
- Keine neuen Features
- Kein Upgrade von React, Vite oder anderen Dependencies
- `tailwind.config.snippet.js` aus den Referenz-Dateien wird **nicht** als `tailwind.config.js` eingesetzt (v4 inkompatibel)
