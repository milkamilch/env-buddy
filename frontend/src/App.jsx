import { useState, useEffect, useMemo } from "react";
import { fetchTemplates, fetchContainers } from "./services/api";
import StartForm from "./components/StartForm";
import ContainerCard from "./components/ContainerCard";
import AuthPage from "./pages/AuthPage";
import "./App.css";

const STATUS_FILTERS = ["alle", "running", "paused", "exited"];

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}

export default function App() {
  const [user, setUser] = useState(getStoredUser);
  const [templates, setTemplates] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTemplate, setActiveTemplate] = useState("alle");
  const [activeStatus, setActiveStatus] = useState("alle");

  useEffect(() => {
    if (!user) return;
    fetchTemplates()
      .then(setTemplates)
      .catch(() => setError("Backend nicht erreichbar"));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadContainers();
    const interval = setInterval(loadContainers, 5000);
    return () => clearInterval(interval);
  }, [user]);

  async function loadContainers() {
    try {
      const data = await fetchContainers();
      setContainers(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
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

  if (!user) {
    return <AuthPage onAuth={(u) => setUser(u)} />;
  }

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
        <div className="header-user">
          <span className="user-name">{user.first_name} {user.last_name}</span>
          <span className="user-handle">@{user.username}</span>
          <button className="btn-logout" onClick={handleLogout}>Abmelden</button>
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
