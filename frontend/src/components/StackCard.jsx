import { useState } from "react";
import { stopStack, stopContainer, restartContainer } from "../services/api";
import "./StackCard.css";

const TEMPLATE_ICONS = {
  postgres: "🐘", mysql: "🐬", mariadb: "🐬", mongo: "🍃", redis: "⚡",
  cockroachdb: "🪳", neo4j: "🕸️", influxdb: "📈", couchdb: "🛋️", timescaledb: "⏱️",
  elasticsearch: "🔍", cassandra: "💎", rabbitmq: "🐰", kafka: "📨", nats: "🚀", mosquitto: "🦟",
  nginx: "🌐", httpd: "🌐", traefik: "🔀",
  mailhog: "📬", adminer: "🗄️", minio: "🪣", vault: "🔐", keycloak: "🗝️",
  gitea: "🐱", prometheus: "🔥", grafana: "📊", jaeger: "🔭", sonarqube: "🧹",
  registry: "📦", verdaccio: "📦",
};

export default function StackCard({ stack, onStopped }) {
  const [expanded, setExpanded] = useState(false);
  const [restarting, setRestarting] = useState({});

  async function handleStopStack() {
    try {
      await stopStack(stack.stack_id);
      onStopped(stack.stack_id);
    } catch (err) {
      alert("Fehler beim Stoppen: " + err.message);
    }
  }

  async function handleStopContainer(containerId) {
    try {
      await stopContainer(containerId);
      onStopped(stack.stack_id); // refresh whole stack
    } catch (err) {
      alert("Fehler beim Stoppen: " + err.message);
    }
  }

  async function handleRestart(containerId) {
    setRestarting((prev) => ({ ...prev, [containerId]: true }));
    try {
      await restartContainer(containerId);
    } catch (err) {
      alert("Fehler beim Neustart: " + err.message);
    } finally {
      setRestarting((prev) => ({ ...prev, [containerId]: false }));
    }
  }

  const allRunning = stack.containers.every((c) => c.status === "running");
  const stackStatus = allRunning ? "running" : "partial";

  return (
    <div className="stack-card">
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
          <span className={`stack-status status-${stackStatus}`}>
            {stackStatus === "running" ? "running" : "partial"} · {stack.containers.length} services
          </span>
        </div>

        <div className="stack-actions">
          <button
            className="btn-expand"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Einklappen" : "Ausklappen"}
          >
            {expanded ? "▲" : "▼"}
          </button>
          <button className="btn-stop" onClick={handleStopStack}>⏹ Stop all</button>
        </div>
      </div>

      {expanded && (
        <div className="stack-containers">
          {stack.containers.map((c) => {
            const cpuColor = c.cpu_percent > 80 ? "#f38ba8" : c.cpu_percent > 50 ? "#fab387" : "#a6e3a1";
            const ramColor = c.ram_mb > 500 ? "#f38ba8" : c.ram_mb > 200 ? "#fab387" : "#a6e3a1";
            return (
              <div key={c.id} className="stack-container-row">
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
                <div className="row-btns">
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
    </div>
  );
}
