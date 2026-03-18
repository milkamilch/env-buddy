import { useState, useEffect } from "react";
import { fetchDefaultTemplates, fetchMyTemplates, fetchFavorites, fetchContainers, fetchStacks, fetchTeamTemplates } from "./services/api";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import TemplatesPage from "./pages/TemplatesPage";
import TeamsPage from "./pages/TeamsPage";
import MarketplacePage from "./pages/MarketplacePage";
import ProfileModal from "./components/ProfileModal";
import "./App.css";

const AVATAR_COLORS = ["#89b4fa","#a6e3a1","#fab387","#f38ba8","#cba6f7","#89dceb","#f9e2af"];
function avatarColor(username = "") {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = (h * 31 + username.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function UserAvatar({ user }) {
  const initials = ((user.first_name?.[0] || "") + (user.last_name?.[0] || "")).toUpperCase() || "?";
  const color = avatarColor(user.username);
  return (
    <span style={{
      width: "2rem", height: "2rem", borderRadius: "50%",
      background: color + "33", border: `1.5px solid ${color}`,
      color, fontWeight: 700, fontSize: "0.78rem",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {initials}
    </span>
  );
}

const DEFAULT_ICONS = {
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [containers, setContainers] = useState([]);
  const [stacks, setStacks] = useState([]);
  const [startFormTemplates, setStartFormTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  async function loadStartFormTemplates() {
    try {
      const defaults = await fetchDefaultTemplates();
      const defaultMap = Object.fromEntries(
        defaults.map((k) => [k, { key: k, label: k, icon: DEFAULT_ICONS[k] || "📦" }])
      );

      let customs = [], teamTpls = [], favKeys = [];
      try {
        [customs, teamTpls, favKeys] = await Promise.all([fetchMyTemplates(), fetchTeamTemplates(), fetchFavorites()]);
      } catch (authErr) {
        if (authErr.message?.includes("401") || authErr.message?.includes("Ungültiger")) {
          handleLogout();
          return;
        }
      }

      const customMap = Object.fromEntries(
        customs.map((t) => [`custom:${t.id}`, { key: `custom:${t.id}`, label: t.name, icon: t.icon, containers: t.containers }])
      );
      const teamMap = Object.fromEntries(
        teamTpls.map((t) => [`team:${t.id}`, { key: `team:${t.id}`, label: t.name, icon: t.icon, containers: t.containers }])
      );
      const allMap = { ...defaultMap, ...customMap, ...teamMap };

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

  function handleStopped() { loadAll(); }
  function handleRemoved(id) { setContainers((prev) => prev.filter((c) => c.id !== id)); }
  function handleStackStopped(stackId) {
    setStacks((prev) => prev.filter((s) => s.stack_id !== stackId));
    loadAll();
  }

  useEffect(() => {
    function onAuthLogout() { handleLogout(); }
    window.addEventListener("auth:logout", onAuthLogout);
    return () => window.removeEventListener("auth:logout", onAuthLogout);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", user?.theme || "dark");
  }, [user?.theme]);

  useEffect(() => {
    const running = [
      ...containers.filter((c) => c.status === "running"),
      ...stacks.flatMap((s) => s.containers).filter((c) => c.status === "running"),
    ].length;
    document.title = running > 0 ? `(${running}) Test-Buddy` : "Test-Buddy";
  }, [containers, stacks]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStartFormTemplates();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
    const interval = setInterval(loadAll, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) {
    return <AuthPage onAuth={(u) => setUser(u)} />;
  }

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
          <button
            className={`nav-btn ${page === "teams" ? "active" : ""}`}
            onClick={() => setPage("teams")}
          >
            Teams
          </button>
          <button
            className={`nav-btn ${page === "marketplace" ? "active" : ""}`}
            onClick={() => setPage("marketplace")}
          >
            Marketplace
          </button>
        </nav>

        <div className="header-badge">
          <span className={`status-dot ${error ? "dot-error" : "dot-ok"}`} />
          {error ? "Offline" : "Backend verbunden"}
        </div>
        <div className="header-user">
          <button className="btn-profile" onClick={() => setProfileOpen(true)}>
            <UserAvatar user={user} />
            <div>
              <span className="user-name">{user.first_name} {user.last_name}</span>
              <span className="user-handle">@{user.username}</span>
            </div>
          </button>
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
      ) : page === "teams" ? (
        <TeamsPage user={user} />
      ) : page === "marketplace" ? (
        <MarketplacePage user={user} />
      ) : (
        <DashboardPage
          containers={containers}
          stacks={stacks}
          loading={loading}
          startFormTemplates={startFormTemplates}
          onStarted={loadAll}
          onStopped={handleStopped}
          onRemoved={handleRemoved}
          onStackStopped={handleStackStopped}
        />
      )}

      {profileOpen && (
        <ProfileModal
          user={user}
          onClose={() => setProfileOpen(false)}
          onUpdate={(updated) => {
            const newUser = { ...user, ...updated };
            setUser(newUser);
            localStorage.setItem("user", JSON.stringify(newUser));
          }}
        />
      )}
    </div>
  );
}
