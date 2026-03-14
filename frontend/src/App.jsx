import { useState, useEffect, useMemo } from "react";
import { fetchTemplates, fetchContainers } from "./services/api";
import StartForm from "./components/StartForm";
import ContainerCard from "./components/ContainerCard";
import "./App.css";

const STATUS_FILTERS = ["alle", "running", "paused", "exited"];

export default function App() {
  const [templates, setTemplates] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTemplate, setActiveTemplate] = useState("alle");
  const [activeStatus, setActiveStatus] = useState("alle");

  useEffect(() => {
    fetchTemplates()
      .then(setTemplates)
      .catch(() => setError("Backend nicht erreichbar"));
  }, []);

  useEffect(() => {
    loadContainers();
    const interval = setInterval(loadContainers, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadContainers() {
    try {
      const data = await fetchContainers();
      setContainers(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  function handleStopped(id) {
    setContainers((prev) => prev.filter((c) => c.id !== id));
  }

  const filtered = useMemo(() => {
    return containers.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchTemplate = activeTemplate === "alle" || c.template === activeTemplate;
      const matchStatus = activeStatus === "alle" || c.status === activeStatus;
      return matchSearch && matchTemplate && matchStatus;
    });
  }, [containers, search, activeTemplate, activeStatus]);

  const templateOptions = ["alle", ...templates];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo">🧪</div>
        <div>
          <h1 className="header-title">Test-Buddy</h1>
          <p className="header-sub">On-Demand Testumgebungen</p>
        </div>
        <div className="header-badge">
          <span className={`status-dot ${error ? "dot-error" : "dot-ok"}`} />
          {error ? "Offline" : "Backend verbunden"}
        </div>
      </header>

      {error && (
        <div className="error-banner">
          ⚠️ {error} — Backend läuft auf http://localhost:8000?
        </div>
      )}

      <main className="app-main">
        <aside className="app-sidebar">
          {templates.length > 0 && (
            <StartForm templates={templates} onStarted={loadContainers} />
          )}
        </aside>

        <section className="app-content">
          <div className="content-header">
            <h2>Laufende Container</h2>
            <span className="container-count">{filtered.length} / {containers.length}</span>
          </div>

          <div className="toolbar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                placeholder="Container suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch("")}>✕</button>
              )}
            </div>

            <div className="filter-group">
              <span className="filter-label">Template:</span>
              {templateOptions.map((t) => (
                <button
                  key={t}
                  className={`filter-btn ${activeTemplate === t ? "active" : ""}`}
                  onClick={() => setActiveTemplate(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="filter-group">
              <span className="filter-label">Status:</span>
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  className={`filter-btn filter-status-${s} ${activeStatus === s ? "active" : ""}`}
                  onClick={() => setActiveStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="hint">Lade...</p>
          ) : filtered.length === 0 && containers.length === 0 ? (
            <p className="hint">Keine aktiven Container. Starte einen über das Formular.</p>
          ) : filtered.length === 0 ? (
            <p className="hint">Keine Container gefunden für diese Filter.</p>
          ) : (
            <div className="container-grid">
              {filtered.map((c) => (
                <ContainerCard key={c.id} container={c} onStopped={handleStopped} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
