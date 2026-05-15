import { useState, useEffect, useRef } from "react";
import { stopContainer, removeContainer, restartContainer, startStoppedContainer, extendContainer, fetchContainerConfig, downloadContainerDotenv, probeContainerHealth, updateContainerImage, createTemplate, createSnapshot, fetchContainerShares, grantContainerAccess, revokeContainerAccess } from "../services/api";
import ContainerEditModal from "./ContainerEditModal";
import ContainerLogsModal from "./ContainerLogsModal";
import ResourceGraphModal from "./ResourceGraphModal";
import ContainerTerminalModal from "./ContainerTerminalModal";
import { useToast } from "./Toast";
import TEMPLATE_ICONS from "../templateIcons";
import "./ContainerCard.css";

const EXTEND_MINUTES = [15, 30, 60];

const HISTORY_MAX = 30;

function useStatsHistory(container) {
  const histRef = useRef([]);
  useEffect(() => {
    if (container.status !== "running") return;
    histRef.current = [
      ...histRef.current,
      { cpu: container.cpu_percent ?? 0, ram: container.ram_percent ?? 0 },
    ].slice(-HISTORY_MAX);
  }, [container.cpu_percent, container.ram_percent, container.status]);
  // eslint-disable-next-line react-hooks/refs
  return histRef.current;
}

function Sparkline({ values, color, width = 80, height = 22 }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const step = width / (HISTORY_MAX - 1);
  const pts = values.map((v, i) => {
    const x = (HISTORY_MAX - values.length + i) * step;
    const y = height - (v / max) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

function useCountdown(stopsAt) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (!stopsAt) return;
    function update() {
      setRemaining(Math.floor((new Date(stopsAt) - Date.now()) / 1000));
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [stopsAt]);
  return remaining;
}

function formatCountdown(seconds) {
  if (seconds == null) return null;
  if (seconds <= 0) return "läuft ab…";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export default function ContainerCard({ container, onStopped, onRemoved, viewMode = "grid", selectMode = false, isSelected = false, onToggleSelect, onClone }) {
  const toast = useToast();
  const [restarting, setRestarting] = useState(false);
  const [acting, setActing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [extending, setExtending] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [tcpReachable, setTcpReachable] = useState(null);
  const [updateConfirm, setUpdateConfirm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUsername, setShareUsername] = useState("");
  const [shares, setShares] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);

  const isRunning = container.status === "running";
  const remaining = useCountdown(isRunning ? container.stops_at : null);
  const isExpiringSoon = remaining != null && remaining > 0 && remaining <= 300;

  const statsHistory = useStatsHistory(container);

  const HEALTH_COLOR = { healthy: "#a6e3a1", unhealthy: "#f38ba8", starting: "#fab387", none: "transparent" };
  const HEALTH_TITLE = { healthy: "healthy", unhealthy: "unhealthy", starting: "starting…", none: "" };
  const health = container.health || "none";
  const healthColor = HEALTH_COLOR[health] ?? "transparent";
  const healthTitle = HEALTH_TITLE[health] ?? "";

  const templateBase = (container.template || "").split(":")[0].split("/").pop().toLowerCase();
  const icon = TEMPLATE_ICONS[templateBase] || "📦";
  const cpuColor = container.cpu_percent > 80 ? "#f38ba8" : container.cpu_percent > 50 ? "#fab387" : "#a6e3a1";
  const ramColor = container.ram_percent > 80 ? "#f38ba8" : container.ram_percent > 50 ? "#fab387" : "#a6e3a1";

  async function handleCopyConnectionString(e) {
    e.stopPropagation();
    if (!container.connection_string) return;
    try {
      await navigator.clipboard.writeText(container.connection_string);
      toast.success("Connection String kopiert");
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  }

  async function handleDownloadDotenv(e) {
    e.stopPropagation();
    try {
      await downloadContainerDotenv(container.id, container.name);
      toast.success(".env heruntergeladen");
    } catch (err) {
      toast.error("Fehler: " + err.message);
    }
  }

  useEffect(() => {
    if (!isRunning) { setTcpReachable(null); return; }
    let cancelled = false;
    async function probe() {
      try {
        const result = await probeContainerHealth(container.id);
        if (!cancelled) setTcpReachable(result.reachable);
      } catch { if (!cancelled) setTcpReachable(null); }
    }
    probe();
    const id = setInterval(probe, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, [container.id, isRunning]);

  useEffect(() => {
    if (!extendOpen) return;
    function close() { setExtendOpen(false); }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [extendOpen]);

  async function handleStop(e) {
    e.stopPropagation();
    setActing(true);
    try { await stopContainer(container.id); onStopped(); }
    catch (err) { toast.error("Fehler beim Stoppen: " + err.message); }
    finally { setActing(false); }
  }

  async function handleStart(e) {
    e.stopPropagation();
    setActing(true);
    try { await startStoppedContainer(container.id); onStopped(); }
    catch (err) { toast.error("Fehler beim Starten: " + err.message); }
    finally { setActing(false); }
  }

  async function handleRestart(e) {
    e.stopPropagation();
    setRestarting(true);
    try { await restartContainer(container.id); }
    catch (err) { toast.error("Fehler beim Neustart: " + err.message); }
    finally { setRestarting(false); }
  }

  async function handleExtend(e, minutes) {
    e.stopPropagation();
    setExtending(true);
    try {
      await extendContainer(container.id, minutes);
      setExtendOpen(false);
      onStopped();
      toast.success(`+${minutes} Min. hinzugefügt`);
    } catch (err) {
      toast.error("Fehler: " + err.message);
    } finally {
      setExtending(false);
    }
  }

  async function handleClone(e) {
    e.stopPropagation();
    setCloning(true);
    try {
      const config = await fetchContainerConfig(container.id);
      onClone?.(config);
    } catch (err) {
      toast.error("Fehler beim Klonen: " + err.message);
    } finally {
      setCloning(false);
    }
  }

  async function handleRemove(e) {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try { await removeContainer(container.id); onRemoved(container.id); }
    catch (err) { toast.error("Fehler beim Löschen: " + err.message); }
    finally { setConfirmDelete(false); }
  }

  async function handleUpdate(e) {
    e.stopPropagation();
    if (!updateConfirm) { setUpdateConfirm(true); return; }
    setUpdating(true);
    setUpdateConfirm(false);
    try {
      await updateContainerImage(container.id);
      onStopped();
      toast.success("Image aktualisiert, Container neu gestartet");
    } catch (err) {
      toast.error("Update fehlgeschlagen: " + err.message);
    } finally {
      setUpdating(false);
    }
  }

  const actions = (
    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
      <button className="btn-logs" onClick={(e) => { e.stopPropagation(); setLogsOpen(true); }} title="Logs anzeigen">▤</button>
      {isRunning && (
        <button className="btn-logs" onClick={(e) => { e.stopPropagation(); setGraphOpen(true); }} title="Ressourcen-Verlauf">📊</button>
      )}
      {isRunning && (
        <button className="btn-logs" onClick={(e) => { e.stopPropagation(); setTerminalOpen(true); }} title="Terminal öffnen">⌨</button>
      )}
      <button
        className="btn-logs"
        title="Konfiguration teilen (Link kopieren)"
        onClick={async (e) => {
          e.stopPropagation();
          try {
            const config = await fetchContainerConfig(container.id);
            const payload = {
              template:       container.template || config.name,
              env:            config.env || {},
              port:           config.port || null,
              container_name: "",
              duration_minutes: config.duration_minutes || 60,
            };
            const encoded = btoa(JSON.stringify(payload));
            const url = `${window.location.origin}/dashboard?start=${encoded}`;
            await navigator.clipboard.writeText(url);
            toast.success("Link kopiert");
          } catch {
            toast.error("Fehler beim Erstellen des Links");
          }
        }}
      >🔗</button>
      <button
        className="btn-logs"
        title="Zugriff teilen"
        onClick={async (e) => {
          e.stopPropagation();
          const label = container.id.slice(0, 12);
          setShareLoading(true);
          try {
            const list = await fetchContainerShares(label);
            setShares(list);
          } catch { setShares([]); }
          finally { setShareLoading(false); }
          setShareUsername("");
          setShareOpen(true);
        }}
      >👥</button>
      <button
        className="btn-logs"
        title="Als Snapshot speichern"
        onClick={async (e) => {
          e.stopPropagation();
          try {
            const config = await fetchContainerConfig(container.id);
            await createSnapshot({
              name: container.name || container.id.slice(0, 12),
              template: container.template || config.name || "",
              env: config.env || {},
              port: config.port || null,
              mem_limit: config.mem_limit || null,
              cpu_limit: config.cpu_limit || null,
              duration_minutes: config.duration_minutes || 60,
            });
            toast.success("Snapshot gespeichert");
          } catch (err) {
            toast.error("Fehler: " + err.message);
          }
        }}
      >📷</button>
      <button
        className="btn-logs"
        title="Als Template speichern"
        onClick={(e) => {
          e.stopPropagation();
          setTemplateName(container.name || "");
          setSaveTemplateOpen(true);
        }}
      >⊕</button>
      {isRunning && (
        <button className="btn-restart" onClick={handleRestart} disabled={restarting} title="Neustart">
          {restarting ? "…" : "↺ Neustart"}
        </button>
      )}
      {isRunning && (
        <div style={{ position: "relative", display: "inline-block" }}>
          <button
            className="btn-restart"
            onClick={(e) => { e.stopPropagation(); setExtendOpen((o) => !o); }}
            disabled={extending}
            title="Laufzeit verlängern"
          >
            ⏱+
          </button>
          {extendOpen && (
            <div
              style={{
                position: "absolute", top: "110%", right: 0, zIndex: 100,
                background: "var(--surface1)", border: "1px solid var(--border)",
                borderRadius: "0.5rem", padding: "0.4rem", display: "flex",
                flexDirection: "column", gap: "0.3rem", minWidth: "7rem",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {EXTEND_MINUTES.map((m) => (
                <button
                  key={m}
                  className="btn-restart"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={(e) => handleExtend(e, m)}
                  disabled={extending}
                >
                  +{m} Min.
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {isRunning && onClone && (
        <button className="btn-restart" onClick={handleClone} disabled={cloning} title="Mit gleicher Konfiguration neu starten">
          {cloning ? "…" : "⧉"}
        </button>
      )}
      {isRunning ? (
        <button className="btn-stop" onClick={handleStop} disabled={acting} title="Stoppen">
          {acting ? "…" : "⏹"}
        </button>
      ) : (
        <button className="btn-start" onClick={handleStart} disabled={acting} title="Starten">
          {acting ? "…" : "▶"}
        </button>
      )}
      {updateConfirm ? (
        <>
          <span className="confirm-label">Neu starten?</span>
          <button className="btn-confirm-yes" onClick={handleUpdate} title="Ja, aktualisieren">✓</button>
          <button className="btn-confirm-no" onClick={(e) => { e.stopPropagation(); setUpdateConfirm(false); }} title="Abbrechen">✕</button>
        </>
      ) : confirmDelete ? (
        <>
          <span className="confirm-label">Sicher?</span>
          <button className="btn-confirm-yes" onClick={handleRemove} title="Ja, löschen">✓</button>
          <button className="btn-confirm-no" onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }} title="Abbrechen">✕</button>
        </>
      ) : (
        <>
          {isRunning && (
            <button
              className="btn-restart"
              onClick={handleUpdate}
              disabled={updating}
              title="Neuestes Image pullen und Container neu starten"
            >
              {updating ? "…" : "↑ Update"}
            </button>
          )}
          <button className="btn-remove" onClick={handleRemove} title="Löschen">🗑</button>
        </>
      )}
    </div>
  );

  if (viewMode === "list") {
    return (
      <>
        <div
          className={`container-row ${!isRunning ? "card-stopped" : ""}`}
          onClick={() => selectMode ? onToggleSelect(container.id) : setEditOpen(true)}
          title="Konfiguration bearbeiten"
        >
          <span className="row-icon-sm">{icon}</span>
          <div className="row-info-sm">
            <span className="row-name-sm">{container.name}</span>
            <span className={`row-status-sm status-${container.status}`}>{container.status}</span>
            {health !== "none" && (
              <span title={`Health: ${healthTitle}`} style={{
                width: "0.5rem", height: "0.5rem", borderRadius: "50%",
                background: healthColor, display: "inline-block", flexShrink: 0,
              }} />
            )}
          </div>
          {container.port && <span className="row-port-sm">:{container.port}</span>}
          {container.started_by && <span className="row-started-by">👤 {container.started_by}</span>}
          {isRunning && remaining != null && (
            <span className={`row-countdown-sm ${isExpiringSoon ? "countdown-urgent" : ""}`}>
              ⏱ {formatCountdown(remaining)}
            </span>
          )}
          {isRunning && (
            <div className="row-stats-sm">
              <div className="row-stat-bar" title={`CPU ${container.cpu_percent}%`}>
                <div className="row-stat-fill" style={{ width: `${Math.min(container.cpu_percent, 100)}%`, background: cpuColor }} />
              </div>
              <span className="row-stat-label" style={{ color: cpuColor }}>{container.cpu_percent}%</span>
              <div className="row-stat-bar" title={`RAM ${container.ram_mb} MB`}>
                <div className="row-stat-fill" style={{ width: `${Math.min(container.ram_percent ?? 0, 100)}%`, background: ramColor }} />
              </div>
              <span className="row-stat-label" style={{ color: ramColor }}>{container.ram_mb} MB</span>
            </div>
          )}
          {selectMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => { e.stopPropagation(); onToggleSelect(container.id); }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: "1.1rem", height: "1.1rem", cursor: "pointer", accentColor: "var(--accent, #89b4fa)" }}
            />
          )}
          {actions}
        </div>
        {editOpen && (
          <ContainerEditModal
            containerId={container.id}
            onClose={() => setEditOpen(false)}
            onSaved={() => { setEditOpen(false); onStopped(); }}
          />
        )}
        {logsOpen && (
          <ContainerLogsModal
            containerId={container.id}
            containerName={container.name}
            isRunning={isRunning}
            onClose={() => setLogsOpen(false)}
          />
        )}
      </>
    );
  }

  // Grid mode
  return (
    <>
      <div
        className={`container-card ${!isRunning ? "card-stopped" : ""}`}
        onClick={() => selectMode ? onToggleSelect(container.id) : setEditOpen(true)}
        style={{ cursor: "pointer" }}
        title="Konfiguration bearbeiten"
      >
        <div className="card-header">
          <span className="card-icon">{icon}</span>
          <div className="card-title">
            <span className="card-name">{container.name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span className={`card-status status-${container.status}`}>{container.status}</span>
              {health !== "none" && (
                <span title={`Docker Health: ${healthTitle}`} style={{
                  width: "0.55rem", height: "0.55rem", borderRadius: "50%",
                  background: healthColor, display: "inline-block", flexShrink: 0,
                }} />
              )}
              {isRunning && tcpReachable !== null && (
                <span
                  className={`health-badge ${tcpReachable ? "health-up" : "health-down"}`}
                  title={tcpReachable ? "Dienst erreichbar" : "Dienst antwortet nicht"}
                >
                  {tcpReachable ? "● erreichbar" : "● nicht erreichbar"}
                </span>
              )}
            </div>
          </div>
          {selectMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => { e.stopPropagation(); onToggleSelect(container.id); }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: "1.1rem", height: "1.1rem", cursor: "pointer", accentColor: "var(--accent, #89b4fa)" }}
            />
          )}
          {actions}
        </div>

        <div className="card-meta">
          <span>Port: <strong>{container.port || "—"}</strong></span>
          <span>Template: <strong>{container.template}</strong></span>
          {container.started_by && (
            <span className="card-started-by">👤 {container.started_by}</span>
          )}
          {isRunning && remaining != null && (
            <span className={`card-countdown ${isExpiringSoon ? "countdown-urgent" : ""}`}>
              ⏱ {formatCountdown(remaining)}
            </span>
          )}
        </div>

        {container.connection_string && (
          <div className="card-connection" onClick={(e) => e.stopPropagation()}>
            <code className="card-conn-str" title={container.connection_string}>
              {container.connection_string}
            </code>
            <button className="btn-copy-conn" onClick={handleCopyConnectionString} title="Connection String kopieren">⧉</button>
            <button className="btn-copy-conn" onClick={handleDownloadDotenv} title=".env herunterladen">.env</button>
          </div>
        )}

        {isRunning && (
          <div className="card-stats">
            <div className="stat">
              <div className="stat-label">CPU</div>
              <div className="stat-bar">
                <div className="stat-fill" style={{ width: `${Math.min(container.cpu_percent, 100)}%`, background: cpuColor }} />
              </div>
              <div className="stat-value" style={{ color: cpuColor }}>{container.cpu_percent}%</div>
            </div>
            <div className="stat">
              <div className="stat-label">RAM</div>
              <div className="stat-bar">
                <div className="stat-fill" style={{ width: `${Math.min(container.ram_percent ?? 0, 100)}%`, background: ramColor }} />
              </div>
              <div className="stat-value" style={{ color: ramColor }}>{container.ram_mb} MB</div>
            </div>
            {statsHistory.length >= 2 && (
              <div className="stat-sparklines">
                <Sparkline values={statsHistory.map((p) => p.cpu)} color={cpuColor} />
                <Sparkline values={statsHistory.map((p) => p.ram)} color={ramColor} />
              </div>
            )}
          </div>
        )}
      </div>
      {editOpen && (
        <ContainerEditModal
          containerId={container.id}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); onStopped(); }}
        />
      )}
      {logsOpen && (
        <ContainerLogsModal
          containerId={container.id}
          containerName={container.name}
          isRunning={isRunning}
          onClose={() => setLogsOpen(false)}
        />
      )}
      {graphOpen && (
        <ResourceGraphModal
          containerId={container.id}
          containerName={container.name || container.id.slice(0, 12)}
          onClose={() => setGraphOpen(false)}
        />
      )}
      {terminalOpen && (
        <ContainerTerminalModal
          containerId={container.id}
          containerName={container.name || container.id.slice(0, 12)}
          onClose={() => setTerminalOpen(false)}
        />
      )}
      {saveTemplateOpen && (
        <div className="modal-overlay" onClick={() => setSaveTemplateOpen(false)}>
          <div className="modal-box" style={{ maxWidth: "22rem" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Als Template speichern</span>
              <button className="modal-close" onClick={() => setSaveTemplateOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--subtext1)" }}>
                Name
                <input
                  className="modal-input"
                  style={{ display: "block", marginTop: "0.3rem", width: "100%", boxSizing: "border-box" }}
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  autoFocus
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") e.currentTarget.form?.requestSubmit?.();
                  }}
                />
              </label>
              <button
                className="btn-primary"
                style={{ alignSelf: "flex-end" }}
                disabled={!templateName.trim()}
                onClick={async () => {
                  try {
                    const config = await fetchContainerConfig(container.id);
                    const image = (container.template || "").split(":")[0] || container.name;
                    const internalPort = config.port || 5432;
                    await createTemplate({
                      name: templateName.trim(),
                      icon: icon,
                      description: `Gespeichert von Container ${container.name}`,
                      containers: [{
                        service_name: image.split("/").pop().split(":")[0],
                        image,
                        internal_port: internalPort,
                        env: config.env || {},
                      }],
                    });
                    toast.success("Template gespeichert");
                    setSaveTemplateOpen(false);
                  } catch (err) {
                    toast.error("Fehler: " + err.message);
                  }
                }}
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
      {shareOpen && (
        <div className="modal-overlay" onClick={() => setShareOpen(false)}>
          <div className="modal-box" style={{ maxWidth: "26rem" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Zugriff teilen — {container.name}</span>
              <button className="modal-close" onClick={() => setShareOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {shares.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.78rem", color: "var(--subtext0)", marginBottom: "0.4rem" }}>Geteilter Zugriff:</div>
                  {shares.map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                      <span style={{ flex: 1, fontSize: "0.85rem" }}>👤 {s.grantee_username}</span>
                      <button
                        style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "0.35rem", border: "1px solid var(--border)", background: "transparent", color: "#f38ba8", cursor: "pointer" }}
                        onClick={async () => {
                          await revokeContainerAccess(s.id).catch(() => {});
                          setShares((prev) => prev.filter((x) => x.id !== s.id));
                        }}
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label style={{ fontSize: "0.85rem", color: "var(--subtext1)" }}>
                Benutzername
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem" }}>
                  <input
                    className="modal-input"
                    style={{ flex: 1 }}
                    placeholder="z.B. max"
                    value={shareUsername}
                    onChange={(e) => setShareUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && shareUsername.trim() && document.getElementById("share-btn").click()}
                  />
                  <button
                    id="share-btn"
                    className="btn-primary"
                    disabled={!shareUsername.trim() || shareLoading}
                    onClick={async () => {
                      const label = container.id.slice(0, 12);
                      setShareLoading(true);
                      try {
                        const s = await grantContainerAccess(label, shareUsername.trim());
                        setShares((prev) => [...prev, s]);
                        setShareUsername("");
                        toast.success(`Zugriff für ${shareUsername} gewährt`);
                      } catch (err) {
                        toast.error(err.message);
                      } finally {
                        setShareLoading(false);
                      }
                    }}
                  >
                    {shareLoading ? "…" : "Teilen"}
                  </button>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
