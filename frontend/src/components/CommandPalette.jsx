import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CommandPalette.css";

const PAGES = [
  { id: "dashboard",   label: "Dashboard",   icon: "🏠", path: "/dashboard" },
  { id: "templates",   label: "Templates",   icon: "📋", path: "/templates" },
  { id: "teams",       label: "Teams",       icon: "👥", path: "/teams" },
  { id: "marketplace", label: "Marketplace", icon: "🛒", path: "/marketplace" },
  { id: "audit",       label: "Verlauf",     icon: "📜", path: "/audit" },
];

export default function CommandPalette({ templates, onClose }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.toLowerCase();

  const pageResults = PAGES
    .filter((p) => !q || p.label.toLowerCase().includes(q) || p.id.includes(q))
    .map((p) => ({ ...p, type: "page" }));

  const templateResults = (templates || [])
    .filter((t) => !q || t.label.toLowerCase().includes(q) || t.key.toLowerCase().includes(q))
    .slice(0, 8)
    .map((t) => ({ id: t.key, label: t.label, icon: t.icon || "📦", type: "template", key: t.key }));

  const results = [...pageResults, ...templateResults];

  useEffect(() => { setActive(0); }, [query]);

  function execute(item) {
    if (item.type === "page") {
      navigate(item.path);
    } else if (item.type === "template") {
      navigate(`/dashboard?start=${btoa(JSON.stringify({ template: item.key, env: {}, duration_minutes: 60 }))}`);
    }
    onClose();
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { if (results[active]) execute(results[active]); }
    else if (e.key === "Escape") onClose();
  }

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cp-search-row">
          <span className="cp-search-icon">⌘</span>
          <input
            ref={inputRef}
            className="cp-input"
            placeholder="Seite öffnen oder Template starten…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
        {results.length > 0 && (
          <ul className="cp-list">
            {results.map((item, i) => (
              <li
                key={item.id}
                className={`cp-item ${i === active ? "cp-item-active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => execute(item)}
              >
                <span className="cp-item-icon">{item.icon}</span>
                <span className="cp-item-label">{item.label}</span>
                <span className="cp-item-type">{item.type === "page" ? "Seite" : "Template starten"}</span>
              </li>
            ))}
          </ul>
        )}
        {results.length === 0 && query && (
          <p className="cp-empty">Keine Ergebnisse für „{query}"</p>
        )}
        <div className="cp-footer">
          <span>↑↓ navigieren</span>
          <span>↵ auswählen</span>
          <span>Esc schließen</span>
        </div>
      </div>
    </div>
  );
}
