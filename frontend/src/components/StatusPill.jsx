import "./StatusPill.css";

const STATUS_CONFIG = {
  running:  { cls: "run",   label: "Running" },
  stopped:  { cls: "stop",  label: "Stopped" },
  exited:   { cls: "stop",  label: "Exited" },
  starting: { cls: "start", label: "Starting" },
  paused:   { cls: "warn",  label: "Paused" },
  pending:  { cls: "start", label: "Pending" },
};

export default function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { cls: "stop", label: status };
  return (
    <span className={`pill pill-${cfg.cls}`}>
      <span className="pill-dot" />
      {cfg.label}
    </span>
  );
}
