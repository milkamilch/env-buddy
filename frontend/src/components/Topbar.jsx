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
