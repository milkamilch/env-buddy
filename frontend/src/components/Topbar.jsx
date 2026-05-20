import { Sun, Moon, Plus } from "lucide-react";

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

export default function Topbar({ user, page, theme, onOpenProfile, onToggleTheme, onOpenDrawer }) {
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

        <button className="topbar-icon-btn" onClick={onToggleTheme} title="Theme wechseln"
          aria-label={theme === "dark" ? "Zu hellem Theme wechseln" : "Zu dunklem Theme wechseln"}>
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button className="topbar-icon-btn" onClick={onOpenDrawer} title="Container starten"
          aria-label="Container starten">
          <Plus size={16} />
        </button>

        <button className="topbar-avatar-btn" onClick={onOpenProfile}
          aria-label={`Profil von ${user.username} öffnen`}>
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
