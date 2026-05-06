import { useState, useEffect, useMemo } from "react";
import { fetchAuditLog } from "../services/api";
import "./AuditPage.css";

const ACTION_ICONS = {
  started:      "▶",
  stopped:      "⏹",
  removed:      "🗑",
  restarted:    "↺",
  extended:     "⏱",
  auto_stopped: "⏰",
};

const ACTION_LABELS = {
  started:      "Gestartet",
  stopped:      "Gestoppt",
  removed:      "Gelöscht",
  restarted:    "Neustart",
  extended:     "Verlängert",
  auto_stopped: "Auto-Stop",
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AuditPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState("alle");

  useEffect(() => {
    fetchAuditLog()
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const actions = useMemo(
    () => ["alle", ...new Set(entries.map((e) => e.action))],
    [entries]
  );

  const filtered = filter === "alle" ? entries : entries.filter((e) => e.action === filter);

  return (
    <div className="audit-page">
      <h2 className="audit-title">Verlauf</h2>

      <div className="audit-filters">
        {actions.map((a) => (
          <button
            key={a}
            className={`audit-filter-btn ${filter === a ? "active" : ""}`}
            onClick={() => setFilter(a)}
          >
            {a === "alle" ? "Alle" : (ACTION_LABELS[a] || a)}
          </button>
        ))}
      </div>

      {loading && <p className="audit-empty">Lädt…</p>}
      {error   && <p className="audit-error">Fehler: {error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="audit-empty">Keine Einträge.</p>
      )}

      {!loading && filtered.length > 0 && (
        <table className="audit-table">
          <thead>
            <tr>
              <th>Zeit</th>
              <th>Aktion</th>
              <th>Container</th>
              <th>Template</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id}>
                <td className="audit-td audit-td-time">{formatDate(e.created_at)}</td>
                <td className="audit-td audit-td-action">
                  <span className="audit-td-action-icon">{ACTION_ICONS[e.action] || "•"}</span>
                  {ACTION_LABELS[e.action] || e.action}
                </td>
                <td className="audit-td audit-td-name">{e.container_name || "—"}</td>
                <td className="audit-td audit-td-muted">{e.template || "—"}</td>
                <td className="audit-td audit-td-muted">{e.extra || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
