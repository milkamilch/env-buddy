import { useState, useEffect } from "react";
import { stopContainer, removeContainer, restartContainer, startStoppedContainer } from "../services/api";
import ContainerEditModal from "./ContainerEditModal";
import ContainerLogsModal from "./ContainerLogsModal";
import { useToast } from "./Toast";
import "./ContainerCard.css";

const TEMPLATE_ICONS = {
  postgres: "🐘", mysql: "🐬", mariadb: "🐬", mongo: "🍃", redis: "⚡",
  cockroachdb: "🪳", neo4j: "🕸️", influxdb: "📈", couchdb: "🛋️", timescaledb: "⏱️",
  elasticsearch: "🔍", cassandra: "💎", rabbitmq: "🐰", kafka: "📨", nats: "🚀", mosquitto: "🦟",
  nginx: "🌐", httpd: "🌐", traefik: "🔀",
  mailhog: "📬", adminer: "🗄️", minio: "🪣", vault: "🔐", keycloak: "🗝️",
  gitea: "🐱", prometheus: "🔥", grafana: "📊", jaeger: "🔭", sonarqube: "🧹",
  registry: "📦", verdaccio: "📦",
};

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

export default function ContainerCard({ container, onStopped, onRemoved, viewMode = "grid" }) {
  const toast = useToast();
  const [restarting, setRestarting] = useState(false);
  const [acting, setActing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isRunning = container.status === "running";
  const remaining = useCountdown(isRunning ? container.stops_at : null);
  const isExpiringSoon = remaining != null && remaining > 0 && remaining <= 300;

  const icon = TEMPLATE_ICONS[container.template] || "📦";
  const cpuColor = container.cpu_percent > 80 ? "#f38ba8" : container.cpu_percent > 50 ? "#fab387" : "#a6e3a1";
  const ramColor = container.ram_percent > 80 ? "#f38ba8" : container.ram_percent > 50 ? "#fab387" : "#a6e3a1";

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

  async function handleRemove(e) {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try { await removeContainer(container.id); onRemoved(container.id); }
    catch (err) { toast.error("Fehler beim Löschen: " + err.message); }
    finally { setConfirmDelete(false); }
  }

  const actions = (
    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
      <button className="btn-logs" onClick={(e) => { e.stopPropagation(); setLogsOpen(true); }} title="Logs anzeigen">▤</button>
      {isRunning && (
        <button className="btn-restart" onClick={handleRestart} disabled={restarting} title="Neustart">
          {restarting ? "…" : "↺ Neustart"}
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
      {confirmDelete ? (
        <>
          <span className="confirm-label">Sicher?</span>
          <button className="btn-confirm-yes" onClick={handleRemove} title="Ja, löschen">✓</button>
          <button className="btn-confirm-no" onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }} title="Abbrechen">✕</button>
        </>
      ) : (
        <button className="btn-remove" onClick={handleRemove} title="Löschen">🗑</button>
      )}
    </div>
  );

  if (viewMode === "list") {
    return (
      <>
        <div
          className={`container-row ${!isRunning ? "card-stopped" : ""}`}
          onClick={() => setEditOpen(true)}
          title="Konfiguration bearbeiten"
        >
          <span className="row-icon-sm">{icon}</span>
          <div className="row-info-sm">
            <span className="row-name-sm">{container.name}</span>
            <span className={`row-status-sm status-${container.status}`}>{container.status}</span>
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
        onClick={() => setEditOpen(true)}
        style={{ cursor: "pointer" }}
        title="Konfiguration bearbeiten"
      >
        <div className="card-header">
          <span className="card-icon">{icon}</span>
          <div className="card-title">
            <span className="card-name">{container.name}</span>
            <span className={`card-status status-${container.status}`}>{container.status}</span>
          </div>
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
    </>
  );
}
