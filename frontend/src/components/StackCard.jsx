import { useState, useEffect } from "react";
import { stopStack, startStoppedStack, removeStack, stopContainer, restartContainer } from "../services/api";
import ContainerEditModal from "./ContainerEditModal";
import ContainerLogsModal from "./ContainerLogsModal";
import { useToast } from "./Toast";
import "./StackCard.css";

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

const TEMPLATE_ICONS = {
  postgres: "🐘", mysql: "🐬", mariadb: "🐬", mongo: "🍃", redis: "⚡",
  cockroachdb: "🪳", neo4j: "🕸️", influxdb: "📈", couchdb: "🛋️", timescaledb: "⏱️",
  elasticsearch: "🔍", cassandra: "💎", rabbitmq: "🐰", kafka: "📨", nats: "🚀", mosquitto: "🦟",
  nginx: "🌐", httpd: "🌐", traefik: "🔀",
  mailhog: "📬", adminer: "🗄️", minio: "🪣", vault: "🔐", keycloak: "🗝️",
  gitea: "🐱", prometheus: "🔥", grafana: "📊", jaeger: "🔭", sonarqube: "🧹",
  registry: "📦", verdaccio: "📦",
};

export default function StackCard({ stack, onStopped, viewMode = "grid" }) {
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const showContainers = viewMode === "grid" || expanded;
  const [restarting, setRestarting] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [logsId, setLogsId] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  async function handleStopStack() {
    try {
      await stopStack(stack.stack_id);
      onStopped(stack.stack_id);
    } catch (err) {
      toast.error("Fehler beim Stoppen: " + err.message);
    }
  }

  async function handleStartStack() {
    try {
      await startStoppedStack(stack.stack_id);
      onStopped(stack.stack_id);
    } catch (err) {
      toast.error("Fehler beim Starten: " + err.message);
    }
  }

  async function handleRemoveStack() {
    if (!confirmRemove) { setConfirmRemove(true); return; }
    try {
      await removeStack(stack.stack_id);
      onStopped(stack.stack_id);
    } catch (err) {
      toast.error("Fehler beim Löschen: " + err.message);
    } finally {
      setConfirmRemove(false);
    }
  }

  async function handleStopContainer(containerId) {
    try {
      await stopContainer(containerId);
      onStopped(stack.stack_id);
    } catch (err) {
      toast.error("Fehler beim Stoppen: " + err.message);
    }
  }

  async function handleRestart(containerId) {
    setRestarting((prev) => ({ ...prev, [containerId]: true }));
    try {
      await restartContainer(containerId);
    } catch (err) {
      toast.error("Fehler beim Neustart: " + err.message);
    } finally {
      setRestarting((prev) => ({ ...prev, [containerId]: false }));
    }
  }

  const allRunning = stack.containers.every((c) => c.status === "running");
  const allStopped = stack.containers.every((c) => c.status !== "running");
  const stackStatus = allRunning ? "running" : allStopped ? "stopped" : "partial";

  const stopsAt = stack.containers.find((c) => c.status === "running")?.stops_at ?? null;
  const remaining = useCountdown(stopsAt);
  const isExpiringSoon = remaining != null && remaining > 0 && remaining <= 300;

  return (
    <div className={`stack-card ${viewMode === "grid" ? "stack-card--grid" : ""}`}>
      <div className="stack-header">
        <div className="stack-icons">
          {stack.containers.slice(0, 3).map((c) => (
            <span key={c.id} className="stack-icon-chip" title={c.template}>
              {TEMPLATE_ICONS[c.template] || "📦"}
            </span>
          ))}
          {stack.containers.length > 3 && (
            <span className="stack-icon-more">+{stack.containers.length - 3}</span>
          )}
        </div>

        <div className="stack-title">
          <span className="stack-name">{stack.stack_name}</span>
          <div className="stack-status-row">
            <span className={`stack-status status-${stackStatus}`}>
              {stackStatus} · {stack.containers.length} services
            </span>
            {remaining != null && (
              <span className={`stack-countdown ${isExpiringSoon ? "countdown-urgent" : ""}`}>
                ⏱ {formatCountdown(remaining)}
              </span>
            )}
          </div>
        </div>

        <div className="stack-actions">
          {viewMode === "list" && (
            <button
              className="btn-expand"
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? "Einklappen" : "Ausklappen"}
            >
              {expanded ? "▲" : "▼"}
            </button>
          )}
          {allStopped ? (
            <button className="btn-stack-start" onClick={handleStartStack}>▶ Start all</button>
          ) : (
            <button className="btn-stack-stop" onClick={handleStopStack}>⏹ Stop all</button>
          )}
          {confirmRemove ? (
            <>
              <span className="confirm-label">Sicher?</span>
              <button className="btn-stack-confirm-yes" onClick={handleRemoveStack} title="Ja, löschen">✓</button>
              <button className="btn-stack-confirm-no" onClick={() => setConfirmRemove(false)} title="Abbrechen">✕</button>
            </>
          ) : (
            <button className="btn-stack-remove" onClick={handleRemoveStack} title="Stack löschen">🗑</button>
          )}
        </div>
      </div>

      {showContainers && (
        <div className="stack-containers">
          {stack.containers.map((c) => {
            const cpuColor = c.cpu_percent > 80 ? "#f38ba8" : c.cpu_percent > 50 ? "#fab387" : "#a6e3a1";
            const ramColor = c.ram_percent > 80 ? "#f38ba8" : c.ram_percent > 50 ? "#fab387" : "#a6e3a1";
            return (
              <div
                key={c.id}
                className="stack-container-row"
                onClick={() => setEditingId(c.id)}
                title="Konfiguration bearbeiten"
              >
                <span className="row-icon">{TEMPLATE_ICONS[c.template] || "📦"}</span>
                <div className="row-info">
                  <span className="row-name">{c.name}</span>
                  <span className={`row-status status-${c.status}`}>{c.status}</span>
                </div>
                <div className="row-meta">
                  {c.port && <span className="row-port">:{c.port}</span>}
                  <span className="row-stat" style={{ color: cpuColor }}>{c.cpu_percent}% CPU</span>
                  <span className="row-stat" style={{ color: ramColor }}>{c.ram_mb} MB</span>
                </div>
                <div className="row-btns" onClick={(e) => e.stopPropagation()}>
                  <button className="btn-logs-sm" onClick={() => setLogsId(c.id)} title="Logs">▤</button>
                  <button
                    className="btn-restart"
                    onClick={() => handleRestart(c.id)}
                    disabled={restarting[c.id]}
                    title="Neustart"
                  >
                    {restarting[c.id] ? "…" : "↺"}
                  </button>
                  <button className="btn-stop-sm" onClick={() => handleStopContainer(c.id)} title="Stop">
                    ⏹
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingId && (
        <ContainerEditModal
          containerId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => { setEditingId(null); onStopped(stack.stack_id); }}
        />
      )}
      {logsId && (() => {
        const c = stack.containers.find((x) => x.id === logsId);
        return c ? (
          <ContainerLogsModal
            containerId={c.id}
            containerName={c.name}
            isRunning={c.status === "running"}
            onClose={() => setLogsId(null)}
          />
        ) : null;
      })()}
    </div>
  );
}
