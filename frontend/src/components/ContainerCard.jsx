import { stopContainer } from "../services/api";
import "./ContainerCard.css";

const TEMPLATE_ICONS = {
  postgres: "🐘",
  redis: "⚡",
  mysql: "🐬",
  mongo: "🍃",
};

export default function ContainerCard({ container, onStopped }) {
  async function handleStop() {
    try {
      await stopContainer(container.id);
      onStopped(container.id);
    } catch (err) {
      alert("Fehler beim Stoppen: " + err.message);
    }
  }

  const icon = TEMPLATE_ICONS[container.template] || "📦";
  const cpuColor = container.cpu_percent > 80 ? "#f38ba8" : container.cpu_percent > 50 ? "#fab387" : "#a6e3a1";
  const ramColor = container.ram_percent > 80 ? "#f38ba8" : container.ram_percent > 50 ? "#fab387" : "#a6e3a1";

  return (
    <div className="container-card">
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <div className="card-title">
          <span className="card-name">{container.name}</span>
          <span className={`card-status status-${container.status}`}>{container.status}</span>
        </div>
        <button className="btn-stop" onClick={handleStop}>⏹ Stop</button>
      </div>

      <div className="card-meta">
        <span>Port: <strong>{container.port || "—"}</strong></span>
        <span>Template: <strong>{container.template}</strong></span>
      </div>

      <div className="card-stats">
        <div className="stat">
          <div className="stat-label">CPU</div>
          <div className="stat-bar">
            <div
              className="stat-fill"
              style={{ width: `${Math.min(container.cpu_percent, 100)}%`, background: cpuColor }}
            />
          </div>
          <div className="stat-value" style={{ color: cpuColor }}>{container.cpu_percent}%</div>
        </div>

        <div className="stat">
          <div className="stat-label">RAM</div>
          <div className="stat-bar">
            <div
              className="stat-fill"
              style={{ width: `${Math.min(container.ram_percent ?? 0, 100)}%`, background: ramColor }}
            />
          </div>
          <div className="stat-value" style={{ color: ramColor }}>
            {container.ram_mb} MB
          </div>
        </div>
      </div>
    </div>
  );
}
