import { useState, useEffect } from "react";
import { fetchContainerConfig, updateContainerConfig } from "../services/api";
import "./ContainerEditModal.css";

const ALL_MEM_STEPS = [
  { label: "kein Limit", apiValue: "",     mb: 0     },
  { label: "256 MB",     apiValue: "256m", mb: 256   },
  { label: "512 MB",     apiValue: "512m", mb: 512   },
  { label: "1 GB",       apiValue: "1g",   mb: 1024  },
  { label: "2 GB",       apiValue: "2g",   mb: 2048  },
  { label: "4 GB",       apiValue: "4g",   mb: 4096  },
  { label: "8 GB",       apiValue: "8g",   mb: 8192  },
  { label: "16 GB",      apiValue: "16g",  mb: 16384 },
  { label: "32 GB",      apiValue: "32g",  mb: 32768 },
];

const CPU_STEPS = [
  { label: "kein Limit", value: null  },
  { label: "0.25 CPUs",  value: 0.25  },
  { label: "0.5 CPUs",   value: 0.5   },
  { label: "1 CPU",      value: 1.0   },
  { label: "2 CPUs",     value: 2.0   },
  { label: "4 CPUs",     value: 4.0   },
];

export default function ContainerEditModal({ containerId, onClose, onSaved, maxRamMb }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [config, setConfig] = useState(null);
  const [envVars, setEnvVars] = useState([]);
  const [hostPort, setHostPort] = useState("");
  const [containerName, setContainerName] = useState("");
  const [memStep, setMemStep] = useState(0);
  const [cpuStep, setCpuStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const memSteps = ALL_MEM_STEPS.filter((s) => s.mb === 0 || !maxRamMb || s.mb <= maxRamMb);

  useEffect(() => {
    fetchContainerConfig(containerId)
      .then((cfg) => {
        setConfig(cfg);
        setEnvVars(Object.entries(cfg.env).map(([key, value]) => ({ key, value })));
        setHostPort(cfg.port ? String(cfg.port) : "");
        setContainerName(cfg.name || "");
        const currentMem = cfg.mem_limit || "";
        const idx = memSteps.findIndex((s) => s.apiValue === currentMem);
        setMemStep(idx >= 0 ? idx : 0);
        const cpuIdx = CPU_STEPS.findIndex((s) => s.value === cfg.cpu_limit);
        setCpuStep(cpuIdx >= 0 ? cpuIdx : 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [containerId]);

  function updateEnvKey(i, key) {
    setEnvVars((prev) => prev.map((e, idx) => idx === i ? { ...e, key } : e));
  }
  function updateEnvValue(i, value) {
    setEnvVars((prev) => prev.map((e, idx) => idx === i ? { ...e, value } : e));
  }
  function removeEnvVar(i) {
    setEnvVars((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addEnvVar() {
    setEnvVars((prev) => [...prev, { key: "", value: "" }]);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const env_overrides = Object.fromEntries(
        envVars.filter((e) => e.key).map((e) => [e.key, e.value])
      );
      const memValue = memSteps[Math.min(memStep, memSteps.length - 1)].apiValue;
      const cpuValue = CPU_STEPS[Math.min(cpuStep, CPU_STEPS.length - 1)].value;
      await updateContainerConfig(containerId, {
        env_overrides,
        host_port: hostPort ? parseInt(hostPort, 10) : null,
        container_name: containerName || null,
        mem_limit: memValue || null,
        cpu_limit: cpuValue,
      });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">
            {config ? `${config.template} konfigurieren` : "Konfiguration"}
          </span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p className="modal-hint">Lade Konfiguration…</p>
        ) : (
          <div className="modal-body">
            <div className="modal-row">
              <label className="modal-label">Host-Port</label>
              <input className="modal-input modal-input-sm" type="number" value={hostPort}
                onChange={(e) => setHostPort(e.target.value)} placeholder="auto" min={1024} max={65535} />
            </div>

            <div className="modal-row">
              <label className="modal-label">Name</label>
              <input className="modal-input" type="text" value={containerName}
                onChange={(e) => setContainerName(e.target.value)} placeholder="auto" />
            </div>

            <div className="modal-row">
              <label className="modal-label">Memory-Limit</label>
              <div className="modal-mem-slider">
                <input type="range" min={0} max={memSteps.length - 1} step={1}
                  value={Math.min(memStep, memSteps.length - 1)}
                  onChange={(e) => setMemStep(Number(e.target.value))} />
                <div className="modal-mem-labels">
                  <span>kein Limit</span>
                  <span>{memSteps[memSteps.length - 1].label}</span>
                </div>
              </div>
              <span className="modal-mem-value">{memSteps[Math.min(memStep, memSteps.length - 1)].label}</span>
            </div>

            <div className="modal-row">
              <label className="modal-label">CPU-Limit</label>
              <div className="modal-mem-slider">
                <input type="range" min={0} max={CPU_STEPS.length - 1} step={1}
                  value={Math.min(cpuStep, CPU_STEPS.length - 1)}
                  onChange={(e) => setCpuStep(Number(e.target.value))} />
                <div className="modal-mem-labels">
                  <span>kein Limit</span>
                  <span>{CPU_STEPS[CPU_STEPS.length - 1].label}</span>
                </div>
              </div>
              <span className="modal-mem-value">{CPU_STEPS[Math.min(cpuStep, CPU_STEPS.length - 1)].label}</span>
            </div>

            <div className="modal-section-label">Umgebungsvariablen</div>

            {envVars.map((e, i) => (
              <div key={i} className="modal-env-row">
                <input className="modal-input modal-env-key" value={e.key}
                  onChange={(ev) => updateEnvKey(i, ev.target.value)} placeholder="KEY" />
                <span className="modal-env-sep">=</span>
                <input className="modal-input modal-env-val" value={e.value}
                  onChange={(ev) => updateEnvValue(i, ev.target.value)} placeholder="value" />
                <button className="btn-env-remove" onClick={() => removeEnvVar(i)} title="Entfernen">✕</button>
              </div>
            ))}

            <button className="btn-add-env" onClick={addEnvVar}>+ Variable hinzufügen</button>

            {error && <p className="modal-error">{error}</p>}
          </div>
        )}

        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>Abbrechen</button>
          <button className="modal-btn-save" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Startet neu…" : "↺ Speichern & Neustart"}
          </button>
        </div>
      </div>
    </div>
  );
}
