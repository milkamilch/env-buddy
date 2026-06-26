import { Gauge, Bookmark, Store, Users, ScrollText } from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard",   label: "Dashboard",   Icon: Gauge },
  { key: "templates",   label: "Templates",   Icon: Bookmark },
  { key: "marketplace", label: "Marketplace", Icon: Store },
  { key: "teams",       label: "Teams",       Icon: Users },
  { key: "audit",       label: "Audit",       Icon: ScrollText },
];

const QUICK_TEMPLATES = ["postgres", "redis", "mysql", "mongo", "rabbitmq"];

export default function Sidebar({ page, onNavigate, onOpenDrawer }) {
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

      <div className="sidebar-section">
        <div className="sidebar-quick-label">Quick-Start</div>
        <div className="sidebar-quick">
          {QUICK_TEMPLATES.map((tpl) => (
            <button
              key={tpl}
              className="sidebar-quick-pill"
              onClick={() => onOpenDrawer?.(tpl)}
              title={`${tpl} starten`}
            >
              {tpl}
            </button>
          ))}
        </div>
        <div className="sidebar-foot">
          <span className="sidebar-foot-dot" />
          <span>API · online</span>
          <span style={{ marginLeft: "auto" }}>v2.0</span>
        </div>
      </div>
    </aside>
  );
}
