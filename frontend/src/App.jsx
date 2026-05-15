import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { fetchDefaultTemplates, fetchMyTemplates, fetchFavorites, fetchContainers, fetchStacks, fetchTeamTemplates, fetchInvitations, acceptInvitation, declineInvitation, updateNotificationPrefs } from "./services/api";
import TEMPLATE_ICONS from "./templateIcons";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import TemplatesPage from "./pages/TemplatesPage";
import TeamsPage from "./pages/TeamsPage";
import MarketplacePage from "./pages/MarketplacePage";
import AuditPage from "./pages/AuditPage";
import ProfileModal from "./components/ProfileModal";
import CommandPalette from "./components/CommandPalette";
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


function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}

export default function App() {
  const [user, setUser] = useState(getStoredUser);
  const [profileOpen, setProfileOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [containers, setContainers] = useState([]);
  const [stacks, setStacks] = useState([]);
  const [startFormTemplates, setStartFormTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  }

  async function loadStartFormTemplates() {
    try {
      const defaults = await fetchDefaultTemplates();
      const defaultMap = Object.fromEntries(
        defaults.map((k) => [k, { key: k, label: k, icon: TEMPLATE_ICONS[k] || "📦" }])
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
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!user) return;
    function loadInvitations() {
      fetchInvitations().then(setInvitations).catch(() => {});
    }
    loadInvitations();
    const id = setInterval(loadInvitations, 30000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", user?.theme || "dark");
  }, [user?.theme]);

  useEffect(() => {
    const running = [
      ...containers.filter((c) => c.status === "running"),
      ...stacks.flatMap((s) => s.containers).filter((c) => c.status === "running"),
    ].length;
    document.title = running > 0 ? `(${running}) Env-Buddy` : "Env-Buddy";
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
    return <AuthPage onAuth={(u) => { setUser(u); navigate("/"); }} />;
  }

  const path = location.pathname.replace(/^\//, "") || "dashboard";

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo">🧪</div>
        <div>
          <h1 className="header-title">Env-Buddy</h1>
          <p className="header-sub">On-Demand Testumgebungen</p>
        </div>

        <nav className="app-nav">
          <button className={`nav-btn ${path === "dashboard" ? "active" : ""}`} onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
          <button
            className={`nav-btn ${path === "templates" ? "active" : ""}`}
            onClick={() => { navigate("/templates"); loadStartFormTemplates(); }}
          >
            Templates
          </button>
          <button
            className={`nav-btn ${path === "teams" ? "active" : ""}`}
            onClick={() => navigate("/teams")}
          >
            Teams
          </button>
          <button
            className={`nav-btn ${path === "marketplace" ? "active" : ""}`}
            onClick={() => navigate("/marketplace")}
          >
            Marketplace
          </button>
          <button
            className={`nav-btn ${path === "audit" ? "active" : ""}`}
            onClick={() => navigate("/audit")}
          >
            Verlauf
          </button>
        </nav>

        <div className="header-badge">
          <span className={`status-dot ${error ? "dot-error" : "dot-ok"}`} />
          {error ? "Offline" : "Backend verbunden"}
        </div>
        <div className="header-user">
          <button
            className="btn-theme-toggle"
            title={user.theme === "dark" ? "Light Mode" : "Dark Mode"}
            onClick={async () => {
              const newTheme = user.theme === "dark" ? "light" : "dark";
              const updated = await updateNotificationPrefs({
                notify_on_start:   user.notify_on_start   ?? true,
                notify_on_stop:    user.notify_on_stop    ?? true,
                notify_on_warning: user.notify_on_warning ?? true,
                theme:             newTheme,
                webhook_url:       user.webhook_url       ?? null,
                allow_invitations: user.allow_invitations ?? true,
              });
              const newUser = { ...user, ...updated };
              setUser(newUser);
              localStorage.setItem("user", JSON.stringify(newUser));
            }}
          >
            {user.theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button
            className="btn-inbox"
            onClick={() => setInboxOpen(true)}
            title="Team-Einladungen"
            style={{ position: "relative" }}
          >
            ✉
            {invitations.length > 0 && (
              <span className="inbox-badge">{invitations.length}</span>
            )}
          </button>
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

      <Routes>
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/teams" element={<TeamsPage user={user} />} />
        <Route path="/marketplace" element={<MarketplacePage user={user} />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/dashboard" element={
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
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

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

      {paletteOpen && (
        <CommandPalette
          templates={startFormTemplates}
          onClose={() => setPaletteOpen(false)}
        />
      )}

      {inboxOpen && (
        <div className="modal-overlay" onClick={() => setInboxOpen(false)}>
          <div className="modal-box" style={{ maxWidth: "32rem" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Einladungen</span>
              <button className="modal-close" onClick={() => setInboxOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              {invitations.length === 0 ? (
                <p style={{ color: "var(--subtext0)", fontSize: "0.875rem" }}>Keine ausstehenden Einladungen.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {invitations.map((inv) => (
                    <div key={inv.id} style={{
                      background: "var(--surface1, #1e1e2e)", borderRadius: "8px",
                      padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "1rem",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{inv.team_name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--subtext0)" }}>
                          Eingeladen von @{inv.inviter_name}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          await acceptInvitation(inv.id);
                          setInvitations((p) => p.filter((i) => i.id !== inv.id));
                        }}
                        style={{
                          padding: "0.3rem 0.7rem", borderRadius: "6px",
                          border: "1px solid #a6e3a1", color: "#a6e3a1", background: "transparent",
                          cursor: "pointer", fontSize: "0.82rem",
                        }}
                      >
                        Annehmen
                      </button>
                      <button
                        onClick={async () => {
                          await declineInvitation(inv.id);
                          setInvitations((p) => p.filter((i) => i.id !== inv.id));
                        }}
                        style={{
                          padding: "0.3rem 0.7rem", borderRadius: "6px",
                          border: "1px solid var(--overlay1)", color: "var(--subtext0)", background: "transparent",
                          cursor: "pointer", fontSize: "0.82rem",
                        }}
                      >
                        Ablehnen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
