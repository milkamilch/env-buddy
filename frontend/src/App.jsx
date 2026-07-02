import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { fetchDefaultTemplates, fetchMyTemplates, fetchFavorites, fetchContainers, fetchStacks, fetchTeamTemplates, fetchInvitations, acceptInvitation, declineInvitation } from "./services/api";
import TEMPLATE_ICONS from "./templateIcons";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import TemplatesPage from "./pages/TemplatesPage";
import TeamsPage from "./pages/TeamsPage";
import MarketplacePage from "./pages/MarketplacePage";
import AuditPage from "./pages/AuditPage";
import ProfileModal from "./components/ProfileModal";
import CommandPalette from "./components/CommandPalette";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import StartDrawer from "./components/StartDrawer";
import "./App.css";

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}

export default function App() {
  const [user, setUser] = useState(getStoredUser);
  const [profileOpen, setProfileOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [containers, setContainers] = useState([]);
  const [stacks, setStacks] = useState([]);
  const [startFormTemplates, setStartFormTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [clonePrefill, setClonePrefill] = useState(null);
  const [pendingContainers, setPendingContainers] = useState([]);

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
        if (authErr.message?.includes("401") || authErr.message?.includes("Ungültiger")) { handleLogout(); return; }
      }
      const customMap = Object.fromEntries(customs.map((t) => [`custom:${t.id}`, { key: `custom:${t.id}`, label: t.name, icon: t.icon, containers: t.containers }]));
      const teamMap = Object.fromEntries(teamTpls.map((t) => [`team:${t.id}`, { key: `team:${t.id}`, label: t.name, icon: t.icon, containers: t.containers }]));
      const allMap = { ...defaultMap, ...customMap, ...teamMap };
      setStartFormTemplates(favKeys.length > 0 ? favKeys.map((k) => allMap[k]).filter(Boolean) : Object.values(allMap));
    } catch {
      setError("Backend nicht erreichbar");
    }
  }

  async function loadAll() {
    try {
      const [data, stackData] = await Promise.all([fetchContainers(), fetchStacks()]);
      setContainers(data);
      setStacks(stackData);
      setPendingContainers([]);
      setLoading(false);
    } catch { setLoading(false); }
  }

  function addPending(label, icon) {
    const id = `pending-${Date.now()}`;
    setPendingContainers((prev) => [...prev, {
      id, name: label, template: label, icon,
      status: "starting", port: null, stops_at: null, started_at: null, _pending: true,
    }]);
  }

  useEffect(() => {
    function onAuthLogout() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      navigate("/");
    }
    window.addEventListener("auth:logout", onAuthLogout);
    return () => window.removeEventListener("auth:logout", onAuthLogout);
  }, [navigate]);

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
    const running = [
      ...containers.filter((c) => c.status === "running"),
      ...stacks.flatMap((s) => s.containers).filter((c) => c.status === "running"),
    ].length;
    document.title = running > 0 ? `(${running}) Env-Buddy` : "Env-Buddy";
  }, [containers, stacks]);

  useEffect(() => {
    if (user) loadStartFormTemplates(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadAll(); // eslint-disable-line react-hooks/set-state-in-effect
    const interval = setInterval(loadAll, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) {
    return <AuthPage onAuth={(u) => { setUser(u); navigate("/"); }} />;
  }

  const path = location.pathname.replace(/^\//, "") || "dashboard";

  function handleNavigate(target) {
    navigate("/" + target);
    if (target === "templates") loadStartFormTemplates();
  }

  return (
    <div className="app">
      <Sidebar page={path} onNavigate={handleNavigate} />

      <div className="main">
        <Topbar
          user={user}
          page={path}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
          onOpenInbox={() => setInboxOpen(true)}
          invitationCount={invitations.length}
        />

        <div className="scroll">
          {error && <div className="error-banner">Backend nicht erreichbar — läuft auf http://localhost:8000?</div>}

          <Routes>
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/teams" element={<TeamsPage user={user} />} />
            <Route path="/marketplace" element={<MarketplacePage user={user} />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/dashboard" element={
              <DashboardPage
                containers={[...containers, ...pendingContainers]}
                stacks={stacks}
                loading={loading}
                startFormTemplates={startFormTemplates}
                onStarted={loadAll}
                onStopped={loadAll}
                onRemoved={(id) => setContainers((prev) => prev.filter((c) => c.id !== id))}
                onStackStopped={(stackId) => { setStacks((prev) => prev.filter((s) => s.stack_id !== stackId)); loadAll(); }}
                onOpenDrawer={() => setDrawerOpen(true)}
                onClone={(config) => { setClonePrefill(config); setDrawerOpen(true); }}
              />
            } />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>

      <StartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        templates={startFormTemplates}
        onStarted={loadAll}
        onStarting={addPending}
        prefill={clonePrefill}
        onPrefillConsumed={() => setClonePrefill(null)}
      />

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
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Einladungen</span>
              <button className="modal-close" onClick={() => setInboxOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              {invitations.length === 0 ? (
                <p style={{ color: "var(--ink-3)", fontSize: "13px" }}>Keine ausstehenden Einladungen.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {invitations.map((inv) => (
                    <div key={inv.id} style={{
                      background: "var(--surface-sink)",
                      border: "1px solid var(--line)",
                      borderRadius: "var(--r-md)",
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: "var(--ink)" }}>{inv.team_name}</div>
                        <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>
                          Eingeladen von @{inv.inviter_name}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          await acceptInvitation(inv.id);
                          setInvitations((p) => p.filter((i) => i.id !== inv.id));
                        }}
                        style={{
                          padding: "5px 12px", borderRadius: "var(--r-sm)",
                          border: "1px solid var(--run)", color: "var(--run)",
                          background: "transparent", cursor: "pointer", fontSize: "12px", fontWeight: 600,
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
                          padding: "5px 12px", borderRadius: "var(--r-sm)",
                          border: "1px solid var(--line-2)", color: "var(--ink-3)",
                          background: "transparent", cursor: "pointer", fontSize: "12px",
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
