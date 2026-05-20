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
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`sidebar-nav-item ${page === item.key ? "active" : ""}`}
            onClick={() => onNavigate(item.key)}
          >
            <item.Icon size={20} strokeWidth={1.75} className="sidebar-nav-icon" />
            <span className="sidebar-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
