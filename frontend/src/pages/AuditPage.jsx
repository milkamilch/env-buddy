import { useState, useEffect } from "react";
import { fetchAuditLog } from "../services/api";

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

  const actions = ["alle", ...new Set(entries.map((e) => e.action))];
  const filtered = filter === "alle" ? entries : entries.filter((e) => e.action === filter);

  return (
    <div style={{ padding: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "1rem", color: "var(--text-primary, #cdd6f4)" }}>Verlauf</h2>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {actions.map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "1rem",
              border: "1px solid var(--border, #45475a)",
              background: filter === a ? "var(--accent, #89b4fa)" : "transparent",
              color: filter === a ? "#1e1e2e" : "var(--text-primary, #cdd6f4)",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: filter === a ? 700 : 400,
            }}
          >
            {a === "alle" ? "Alle" : (ACTION_LABELS[a] || a)}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: "var(--text-muted, #6c7086)" }}>Lädt…</p>}
      {error   && <p style={{ color: "#f38ba8" }}>Fehler: {error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p style={{ color: "var(--text-muted, #6c7086)" }}>Keine Einträge.</p>
      )}

      {!loading && filtered.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border, #45475a)", color: "var(--text-muted, #6c7086)" }}>
              <th style={{ textAlign: "left", padding: "0.5rem 0.75rem" }}>Zeit</th>
              <th style={{ textAlign: "left", padding: "0.5rem 0.75rem" }}>Aktion</th>
              <th style={{ textAlign: "left", padding: "0.5rem 0.75rem" }}>Container</th>
              <th style={{ textAlign: "left", padding: "0.5rem 0.75rem" }}>Template</th>
              <th style={{ textAlign: "left", padding: "0.5rem 0.75rem" }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} style={{ borderBottom: "1px solid var(--border, #313244)" }}>
                <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted, #6c7086)", whiteSpace: "nowrap" }}>
                  {formatDate(e.created_at)}
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <span style={{ marginRight: "0.35rem" }}>{ACTION_ICONS[e.action] || "•"}</span>
                  <span style={{ color: "var(--text-primary, #cdd6f4)" }}>
                    {ACTION_LABELS[e.action] || e.action}
                  </span>
                </td>
                <td style={{ padding: "0.5rem 0.75rem", fontFamily: "monospace", color: "var(--text-primary, #cdd6f4)" }}>
                  {e.container_name || "—"}
                </td>
                <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted, #6c7086)" }}>
                  {e.template || "—"}
                </td>
                <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted, #6c7086)" }}>
                  {e.extra || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
