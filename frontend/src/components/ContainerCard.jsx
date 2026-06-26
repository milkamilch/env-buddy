import { useState, useEffect, useRef } from "react";
import { Square, RotateCcw, TimerReset, Terminal, ScrollText, Trash2, Play, Copy, BarChart3, Link2, Users, Camera, BookmarkPlus } from "lucide-react";
import { stopContainer, removeContainer, restartContainer, startStoppedContainer, extendContainer, fetchContainerConfig, downloadContainerDotenv, probeContainerHealth, updateContainerImage, createTemplate, createSnapshot, fetchContainerShares, grantContainerAccess, revokeContainerAccess } from "../services/api";
import ContainerEditModal from "./ContainerEditModal";
import ContainerLogsModal from "./ContainerLogsModal";
import ResourceGraphModal from "./ResourceGraphModal";
import ContainerTerminalModal from "./ContainerTerminalModal";
import { useToast } from "./Toast";
import StatusPill from "./StatusPill";
import Sparkline from "./Sparkline";
import "./ContainerCard.css";

function tplGlyph(key) {
  return (key || "?").slice(0, 2).toUpperCase();
}

const EXTEND_MINUTES = [15, 30, 60];
const HISTORY_MAX = 60;

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


function LiveBadge({ isRunning }) {
  if (!isRunning) return null;
  return (
    <span className="live-badge live">
      <span className="live-badge-dot" />
      LIVE
    </span>
  );
}

function useCountdown(stopsAt) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (!stopsAt) return;
    const update = () => setRemaining(Math.floor((new Date(stopsAt) - Date.now()) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [stopsAt]);
  return remaining;
}

function formatCountdown(seconds) {
  if (seconds == null) return null;
  if (seconds <= 0) return "läuft ab";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

function statusDotClass(status) {
  const map = { running: "status-dot-running", stopped: "status-dot-stopped", exited: "status-dot-exited", starting: "status-dot-starting", pending: "status-dot-pending", paused: "status-dot-paused" };
  return map[status] ?? "status-dot-stopped";
}

export default function ContainerCard({ container, onStopped, onRemoved, viewMode = "grid", selectMode = false, isSelected = false, onToggleSelect, onClone }) {
  const toast = useToast();
  const [acting, setActing] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [extending, setExtending] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  const templateBase = (container.template || "").split(":")[0].split("/").pop().toLowerCase();

  const cpuColor = container.cpu_percent > 80
    ? "var(--stop)"
    : container.cpu_percent > 50
    ? "var(--warn)"
    : "var(--run)";
  const ramColor = (container.ram_percent ?? 0) > 80
    ? "var(--stop)"
    : (container.ram_percent ?? 0) > 50
    ? "var(--warn)"
    : "var(--info)";

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
    const close = () => setExtendOpen(false);
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
    } catch (err) { toast.error("Fehler: " + err.message); }
    finally { setExtending(false); }
  }

  async function handleClone(e) {
    e.stopPropagation();
    setCloning(true);
    try { const config = await fetchContainerConfig(container.id); onClone?.(config); }
    catch (err) { toast.error("Fehler beim Klonen: " + err.message); }
    finally { setCloning(false); }
  }

  async function handleRemove(e) {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (deleting) return;
    setDeleting(true);
    try { await removeContainer(container.id); onRemoved(container.id); }
    catch (err) { toast.error("Fehler beim Löschen: " + err.message); }
    finally { setConfirmDelete(false); setDeleting(false); }
  }

  async function handleShare() {
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

  // === LIST MODE ===
  if (viewMode === "list") {
    return (
      <>
        <div
          className={`container-row ${!isRunning ? "card-stopped" : ""}`}
          onClick={() => selectMode ? onToggleSelect(container.id) : setEditOpen(true)}
        >
          <span className={`row-status-dot status-dot ${statusDotClass(container.status)}`} />
          <span className={`row-status-label status-${container.status}`}>{container.status}</span>
          <span className="row-name">{container.name}</span>
          {container.port && <span className="row-port">:{container.port}</span>}
          <div className="row-sparkline">
            {isRunning && statsHistory.length >= 2 && (
              <Sparkline values={statsHistory.map(p => p.cpu)} color={cpuColor} height={16} gradientId={`fill-list-${container.id}`} />
            )}
          </div>
          {container.started_by && <span className="row-started-by">👤 {container.started_by}</span>}
          {container.shared_from && <span className="row-started-by" style={{ color: "var(--info)" }}>🔗 @{container.shared_from}</span>}
          {isRunning && remaining != null && (
            <span className={`row-timer ${isExpiringSoon ? "expiring" : ""}`}>{formatCountdown(remaining)}</span>
          )}
          {isRunning && (
            <span className="row-cpu-val" style={{ color: cpuColor }}>{container.cpu_percent}%</span>
          )}
          {selectMode && (
            <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(container.id)} onClick={e => e.stopPropagation()} style={{ accentColor: "var(--accent-blue)" }} />
          )}
          <div className="row-actions" onClick={e => e.stopPropagation()}>
            <button className="btn-icon-sm" onClick={e => { e.stopPropagation(); setLogsOpen(true); }} title="Logs" aria-label="Logs anzeigen">
              <ScrollText size={14} strokeWidth={1.75} />
            </button>
            {isRunning
              ? <button className="btn-icon-sm btn-destructive" onClick={handleStop} disabled={acting} title="Stop" aria-label="Container stoppen"><Square size={14} strokeWidth={1.75} /></button>
              : <button className="btn-icon-sm" onClick={handleStart} disabled={acting} title="Start" aria-label="Container starten" style={{ color: "var(--accent-green)", borderColor: "color-mix(in oklch, var(--accent-green) 30%, transparent)" }}><Play size={14} strokeWidth={1.75} /></button>
            }
            {confirmDelete ? (
              <>
                <span className="confirm-label">Sicher?</span>
                <button className="btn-icon-sm" onClick={handleRemove} disabled={deleting} style={{ color: "var(--accent-green)" }} aria-label="Löschen bestätigen">✓</button>
                <button className="btn-icon-sm" onClick={e => { e.stopPropagation(); setConfirmDelete(false); }} aria-label="Abbrechen">✕</button>
              </>
            ) : (
              <button className="btn-icon-sm" onClick={handleRemove} title="Löschen" aria-label="Container löschen" style={{ color: "var(--accent-red)", borderColor: "color-mix(in oklch, var(--accent-red) 30%, transparent)" }}>
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
        {editOpen && <ContainerEditModal containerId={container.id} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); onStopped(); }} />}
        {logsOpen && <ContainerLogsModal containerId={container.id} containerName={container.name} isRunning={isRunning} onClose={() => setLogsOpen(false)} />}
      </>
    );
  }

  // === GRID MODE ===
  return (
    <>
      <div
        className={`container-card ${!isRunning ? "card-stopped" : ""}`}
        onClick={() => selectMode ? onToggleSelect(container.id) : setEditOpen(true)}
      >
        {/* Head */}
        <div className="card-header">
          <div className="card-tpl-ico">{tplGlyph(templateBase)}</div>
          <div className="card-head-info">
            <div className="card-name">{container.name}</div>
            <div className="card-meta">
              <span>{templateBase || container.template}</span>
              {container.port && <><span className="card-meta-sep">·</span><span>:{container.port}</span></>}
              <span className="card-meta-sep">·</span>
              <span>{container.id.slice(0, 8)}</span>
            </div>
          </div>
          <div className="card-head-right">
            <StatusPill status={container.status} />
          </div>
        </div>

        {/* Connection String */}
        {container.connection_string && (
          <div className="card-connection" onClick={(e) => e.stopPropagation()}>
            <code className="card-conn-str" title={container.connection_string}>
              {container.connection_string}
            </code>
            <button className="btn-copy-conn" onClick={handleCopyConnectionString} title="Connection String kopieren">⧉</button>
            <button className="btn-copy-conn" onClick={handleDownloadDotenv} title=".env herunterladen">.env</button>
          </div>
        )}

        {/* Stats */}
        <div className="card-stats">
          <div className="stat-row">
            <div className="stat-row-head">
              <span className="stat-lbl">CPU</span>
              <span className={`stat-val ${!isRunning ? "stat-val-dim" : ""}`} style={{ color: isRunning ? cpuColor : undefined }}>
                {isRunning ? `${container.cpu_percent?.toFixed(1)} %` : "—"}
              </span>
            </div>
            <div className="stat-sparkline">
              <Sparkline
                values={statsHistory.length >= 2 ? statsHistory.map(p => p.cpu) : Array(10).fill(0)}
                color={isRunning ? cpuColor : "var(--line-2)"}
                height={24}
                gradientId={`fill-cpu-${container.id}`}
              />
            </div>
          </div>
          <div className="stat-row">
            <div className="stat-row-head">
              <span className="stat-lbl">RAM</span>
              <span className={`stat-val ${!isRunning ? "stat-val-dim" : ""}`} style={{ color: isRunning ? ramColor : undefined }}>
                {isRunning ? `${container.ram_mb} MB` : "—"}
              </span>
            </div>
            <div className="stat-sparkline">
              <Sparkline
                values={statsHistory.length >= 2 ? statsHistory.map(p => p.ram) : Array(10).fill(0)}
                color={isRunning ? ramColor : "var(--line-2)"}
                height={24}
                gradientId={`fill-ram-${container.id}`}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="card-foot" onClick={e => e.stopPropagation()}>
          <div className="card-foot-left">
            {isRunning && remaining != null ? (
              <span className={`card-timer ${isExpiringSoon ? "expiring" : ""}`}>
                <TimerReset size={13} strokeWidth={1.6} style={{ opacity: 0.5 }} />
                {formatCountdown(remaining)}
              </span>
            ) : (
              <span className="card-foot-owner">
                {container.started_by || container.owner || ""}
              </span>
            )}
          </div>
          <div className="card-foot-actions">
            {selectMode && (
              <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(container.id)} onClick={e => e.stopPropagation()} style={{ accentColor: "var(--accent)" }} />
            )}
            {isRunning ? (
              <>
                <button className="act" title="Terminal" onClick={e => { e.stopPropagation(); setTerminalOpen(true); }}><Terminal size={15} strokeWidth={1.6} /></button>
                <button className="act" title="Logs" onClick={e => { e.stopPropagation(); setLogsOpen(true); }}><ScrollText size={15} strokeWidth={1.6} /></button>
                <button className="act" title="Ressourcen" onClick={e => { e.stopPropagation(); setGraphOpen(true); }}><BarChart3 size={15} strokeWidth={1.6} /></button>
                <div style={{ position: "relative" }}>
                  <button className="act" title="Verlängern" onClick={e => { e.stopPropagation(); setExtendOpen(o => !o); }} disabled={extending}><TimerReset size={15} strokeWidth={1.6} /></button>
                  {extendOpen && (
                    <div className="extend-popover" onClick={e => e.stopPropagation()}>
                      {EXTEND_MINUTES.map(m => (
                        <button key={m} className="btn-sm btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={e => handleExtend(e, m)} disabled={extending}>+{m} Min.</button>
                      ))}
                    </div>
                  )}
                </div>
                <button className="act" title="Neustart" onClick={handleRestart} disabled={restarting}><RotateCcw size={15} strokeWidth={1.6} /></button>
                <button className="act" title="Snapshot" onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const config = await fetchContainerConfig(container.id);
                    await createSnapshot({ name: container.name || container.id.slice(0, 12), template: container.template || config.name || "", env: config.env || {}, port: config.port || null, mem_limit: config.mem_limit || null, cpu_limit: config.cpu_limit || null, duration_minutes: config.duration_minutes || 60 });
                    toast.success("Snapshot gespeichert");
                  } catch (err) { toast.error("Fehler: " + err.message); }
                }}><Camera size={15} strokeWidth={1.6} /></button>
                <button className="act" title="Link teilen" onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const config = await fetchContainerConfig(container.id);
                    const payload = { template: container.template || config.name, env: config.env || {}, port: config.port || null, container_name: "", duration_minutes: config.duration_minutes || 60 };
                    const encoded = btoa(JSON.stringify(payload));
                    await navigator.clipboard.writeText(`${window.location.origin}/dashboard?start=${encoded}`);
                    toast.success("Link kopiert");
                  } catch { toast.error("Fehler beim Erstellen des Links"); }
                }}><Link2 size={15} strokeWidth={1.6} /></button>
                {onClone && <button className="act" onClick={handleClone} disabled={cloning} title="Klonen"><Copy size={15} strokeWidth={1.6} /></button>}
                <button className="act" title="Als Template speichern" onClick={(e) => { e.stopPropagation(); setTemplateName(container.name || ""); setSaveTemplateOpen(true); }}><BookmarkPlus size={15} strokeWidth={1.6} /></button>
                {updateConfirm ? (
                  <>
                    <span className="confirm-label">Neu starten?</span>
                    <button className="act" onClick={handleUpdate} title="Update bestätigen" style={{ color: "var(--run)" }}>✓</button>
                    <button className="act" onClick={e => { e.stopPropagation(); setUpdateConfirm(false); }} title="Abbrechen">✕</button>
                  </>
                ) : (
                  <button className="act" onClick={handleUpdate} disabled={updating} title="Image aktualisieren"><RotateCcw size={15} strokeWidth={1.6} style={{ transform: "scaleX(-1)" }} /></button>
                )}
                <button className="act danger" title="Stoppen" onClick={handleStop} disabled={acting}><Square size={14} strokeWidth={1.6} /></button>
              </>
            ) : (
              <>
                <button className="act go" title="Starten" onClick={handleStart} disabled={acting}><Play size={14} strokeWidth={1.6} /></button>
                <button className="act" title="Logs" onClick={e => { e.stopPropagation(); setLogsOpen(true); }}><ScrollText size={15} strokeWidth={1.6} /></button>
                {confirmDelete ? (
                  <>
                    <span className="confirm-label">Sicher?</span>
                    <button className="act" onClick={handleRemove} disabled={deleting} style={{ color: "var(--run)" }} title="Bestätigen">✓</button>
                    <button className="act" onClick={e => { e.stopPropagation(); setConfirmDelete(false); }} title="Abbrechen">✕</button>
                  </>
                ) : (
                  <button className="act danger" onClick={handleRemove} title="Löschen"><Trash2 size={15} strokeWidth={1.6} /></button>
                )}
              </>
            )}
          </div>
        </div>
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
                      icon: TEMPLATE_ICONS[templateBase] || "📦",
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
                        style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "0.35rem", border: "1px solid var(--border)", background: "transparent", color: "var(--stop)", cursor: "pointer" }}
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
                    onKeyDown={(e) => { if (e.key === "Enter" && shareUsername.trim()) handleShare(); }}
                  />
                  <button
                    className="btn-primary"
                    disabled={!shareUsername.trim() || shareLoading}
                    onClick={handleShare}
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
