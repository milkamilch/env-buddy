import { useState, useEffect, useMemo } from "react";
import { fetchDefaultTemplates, fetchMyTemplates, fetchFavorites, fetchContainers, fetchStacks } from "./services/api";
import StartForm from "./components/StartForm";
import ContainerCard from "./components/ContainerCard";
import StackCard from "./components/StackCard";
import AuthPage from "./pages/AuthPage";
import TemplatesPage from "./pages/TemplatesPage";
import "./App.css";

const STATUS_FILTERS = ["alle", "running", "paused", "exited"];
const DEFAULT_ICONS  = {
  postgres: "🐘", mysql: "🐬", mariadb: "🐬", mongo: "🍃", redis: "⚡",
  cockroachdb: "🪳", neo4j: "🕸️", influxdb: "📈", couchdb: "🛋️", timescaledb: "⏱️",
  elasticsearch: "🔍", cassandra: "💎", rabbitmq: "🐰", kafka: "📨", nats: "🚀", mosquitto: "🦟",
  nginx: "🌐", httpd: "🌐", traefik: "🔀",
  mailhog: "📬", adminer: "🗄️", minio: "🪣", vault: "🔐", keycloak: "🗝️",
  gitea: "🐱", prometheus: "🔥", grafana: "📊", jaeger: "🔭", sonarqube: "🧹",
  registry: "📦", verdaccio: "📦",
};

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}

export default function App() {
  const [user, setUser] = useState(getStoredUser);
  const [page, setPage] = useState("dashboard");
  const [containers, setContainers] = useState([]);
  const [stacks, setStacks] = useState([]);
  const [startFormTemplates, setStartFormTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTemplate, setActiveTemplate] = useState("alle");
  const [activeStatus, setActiveStatus] = useState("alle");

  useEffect(() => {
    if (!user) return;
    loadStartFormTemplates();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadAll();
    const interval = setInterval(loadAll, 5000);
    return () => clearInterval(interval);
  }, [user]);

  async function loadStartFormTemplates() {
    try {
      const defaults = await fetchDefaultTemplates();
      const defaultMap = Object.fromEntries(
        defaults.map((k) => [k, { key: k, label: k, icon: DEFAULT_ICONS[k] || "📦" }])
      );

      let customs = [], favKeys = [];
      try {
        [customs, favKeys] = await Promise.all([fetchMyTemplates(), fetchFavorites()]);
      } catch (authErr) {
        // 401 = token abgelaufen → ausloggen
        if (authErr.message?.includes("401") || authErr.message?.includes("Ungültiger")) {
          handleLogout();
          return;
        }
      }

      const customMap = Object.fromEntries(
        customs.map((t) => [`custom:${t.id}`, { key: `custom:${t.id}`, label: t.name, icon: t.icon }])
      );
      const allMap = { ...defaultMap, ...customMap };

      if (favKeys.length > 0) {
        setStartFormTemplates(favKeys.map((k) => allMap[k]).filter(Boolean));
      } else {
        setStartFormTemplates(Object.values(defaultMap));
      }
    } catch {
      setError("Backend nicht erreichbar");
    }
  }

  async function loadAll() {
    try {
      const [data, stackData] = await Promise.all([fetchContainers(), fetchStacks()]);
      setContainers(data);
      setStacks(stackData);
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

  function handleStackStopped(stackId) {
    setStacks((prev) => prev.filter((s) => s.stack_id !== stackId));
    loadAll(); // refresh to catch partial stops
  }

  const filtered = useMemo(() => {
    return containers.filter((c) => {
      const matchSearch   = c.name.toLowerCase().includes(search.toLowerCase());
      const matchTemplate = activeTemplate === "alle" || c.template === activeTemplate;
      const matchStatus   = activeStatus   === "alle" || c.status   === activeStatus;
      return matchSearch && matchTemplate && matchStatus;
    });
  }, [containers, search, activeTemplate, activeStatus]);

  if (!user) {
    return <AuthPage onAuth={(u) => setUser(u)} />;
  }

  const templateFilterOptions = ["alle", ...new Set(containers.map((c) => c.template))];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo">🧪</div>
        <div>
          <h1 className="header-title">Test-Buddy</h1>
          <p className="header-sub">On-Demand Testumgebungen</p>
        </div>

        <nav className="app-nav">
          <button className={`nav-btn ${page === "dashboard" ? "active" : ""}`} onClick={() => setPage("dashboard")}>
            Dashboard
          </button>
          <button
            className={`nav-btn ${page === "templates" ? "active" : ""}`}
            onClick={() => { setPage("templates"); loadStartFormTemplates(); }}
          >
            Templates
          </button>
        </nav>

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

      {page === "templates" ? (
        <TemplatesPage />
      ) : (
        <main className="app-main">
          <aside className="app-sidebar">
            {startFormTemplates.length > 0 && (
              <StartForm templates={startFormTemplates} onStarted={loadAll} />
            )}
          </aside>

          <section className="app-content">
            <div className="content-header">
              <h2>Laufende Container</h2>
              <span className="container-count">
                {filtered.length + stacks.length} / {containers.length + stacks.length}
              </span>
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
                {templateFilterOptions.map((t) => (
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
            ) : filtered.length === 0 && containers.length === 0 && stacks.length === 0 ? (
              <p className="hint">Keine aktiven Container. Starte einen über das Formular.</p>
            ) : filtered.length === 0 && stacks.length === 0 ? (
              <p className="hint">Keine Container gefunden für diese Filter.</p>
            ) : (
              <div className="container-grid">
                {stacks.map((s) => (
                  <StackCard key={s.stack_id} stack={s} onStopped={handleStackStopped} />
                ))}
                {filtered.map((c) => (
                  <ContainerCard key={c.id} container={c} onStopped={handleStopped} />
                ))}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
