import { useState, useEffect } from "react";
import { startContainer, startStack, fetchTemplateDetails, fetchSystemInfo } from "../services/api";
import "./StartForm.css";

const ALL_MEM_STEPS = [
  { label: "kein Limit", apiValue: "",      mb: 0     },
  { label: "256 MB",     apiValue: "256m",  mb: 256   },
  { label: "512 MB",     apiValue: "512m",  mb: 512   },
  { label: "1 GB",       apiValue: "1g",    mb: 1024  },
  { label: "2 GB",       apiValue: "2g",    mb: 2048  },
  { label: "4 GB",       apiValue: "4g",    mb: 4096  },
  { label: "8 GB",       apiValue: "8g",    mb: 8192  },
  { label: "16 GB",      apiValue: "16g",   mb: 16384 },
  { label: "32 GB",      apiValue: "32g",   mb: 32768 },
];

function buildMemSteps(totalRamMb) {
  // always include "kein Limit", then all steps that fit in total RAM
  return ALL_MEM_STEPS.filter((s) => s.mb === 0 || s.mb <= totalRamMb);
}

// templates: array of { key: "postgres"|"custom:42", label: "postgres", icon: "🐘" }
export default function StartForm({ templates, onStarted }) {
  const [mode, setMode] = useState("single"); // "single" | "stack"

  // Single mode
  const [template, setTemplate] = useState(templates[0]?.key || "");
  const [duration, setDuration] = useState(60);
  const [showConfig, setShowConfig] = useState(false);

  // Config fields
  const [envVars, setEnvVars] = useState([]);      // [{key, value}]
  const [hostPort, setHostPort] = useState("");
  const [containerName, setContainerName] = useState("");
  const [memStep, setMemStep] = useState(0);
  const [memSteps, setMemSteps] = useState(ALL_MEM_STEPS.slice(0, 6)); // default until loaded
  const [defaultPort, setDefaultPort] = useState(null);

  // Stack mode
  const [stackName, setStackName] = useState("");
  const [selected, setSelected] = useState([]);
  const [stackDuration, setStackDuration] = useState(60);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (templates.length > 0) setTemplate(templates[0].key);
  }, [templates]);

  useEffect(() => {
    fetchSystemInfo()
      .then(({ total_ram_mb }) => setMemSteps(buildMemSteps(total_ram_mb)))
      .catch(() => {}); // fallback: keep defaults
  }, []);

  // Load template defaults whenever template changes (only for non-custom templates)
  useEffect(() => {
    if (!template || template.startsWith("custom:")) {
      setEnvVars([]);
      setDefaultPort(null);
      return;
    }
    fetchTemplateDetails(template)
      .then((details) => {
        setEnvVars(Object.entries(details.env).map(([key, value]) => ({ key, value })));
        setDefaultPort(details.port);
      })
      .catch(() => {
        setEnvVars([]);
        setDefaultPort(null);
      });
    // reset port/name when template switches
    setHostPort("");
    setContainerName("");
    setMemStep(0);
  }, [template]);

  const stackableTemplates = templates.filter((t) => !t.key.startsWith("custom:"));

  function toggleSelected(key) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function updateEnvValue(index, value) {
    setEnvVars((prev) => prev.map((e, i) => (i === index ? { ...e, value } : e)));
  }

  function addEnvVar() {
    setEnvVars((prev) => [...prev, { key: "", value: "" }]);
  }

  function updateEnvKey(index, key) {
    setEnvVars((prev) => prev.map((e, i) => (i === index ? { ...e, key } : e)));
  }

  function removeEnvVar(index) {
    setEnvVars((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmitSingle(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const config = {};
      if (envVars.length > 0) {
        config.env_overrides = Object.fromEntries(
          envVars.filter((e) => e.key).map((e) => [e.key, e.value])
        );
      }
      if (hostPort) config.host_port = parseInt(hostPort, 10);
      if (containerName) config.container_name = containerName;
      const memValue = memSteps[Math.min(memStep, memSteps.length - 1)].apiValue;
      if (memValue) config.mem_limit = memValue;

      const container = await startContainer(template, duration, config);
      onStarted(container);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitStack(e) {
    e.preventDefault();
    if (selected.length < 2) {
      setError("Mindestens 2 Services auswählen");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const stack = await startStack(selected, stackName || selected.join("+"), stackDuration);
      onStarted(stack);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="start-form">
      <div className="mode-tabs">
        <button
          type="button"
          className={`mode-tab ${mode === "single" ? "active" : ""}`}
          onClick={() => { setMode("single"); setError(null); }}
        >
          Container
        </button>
        <button
          type="button"
          className={`mode-tab ${mode === "stack" ? "active" : ""}`}
          onClick={() => { setMode("stack"); setError(null); }}
        >
          Stack
        </button>
      </div>

      {mode === "single" ? (
        <form onSubmit={handleSubmitSingle} style={{ display: "contents" }}>
          <div className="form-group">
            <label>Template</label>
            <select value={template} onChange={(e) => setTemplate(e.target.value)}>
              {templates.map((t) => (
                <option key={t.key} value={t.key}>{t.icon} {t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Laufzeit: <strong>{duration} Minuten</strong></label>
            <input
              type="range"
              min={5} max={480} step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
            <div className="range-labels"><span>5 min</span><span>8 h</span></div>
          </div>

          {/* Config toggle */}
          {!template.startsWith("custom:") && (
            <button
              type="button"
              className={`btn-config-toggle ${showConfig ? "open" : ""}`}
              onClick={() => setShowConfig((v) => !v)}
            >
              <span>⚙ Konfiguration</span>
              <span className="toggle-arrow">{showConfig ? "▲" : "▼"}</span>
            </button>
          )}

          {showConfig && !template.startsWith("custom:") && (
            <div className="config-panel">

              {/* Port */}
              <div className="config-row">
                <label className="config-label">Host-Port</label>
                <input
                  className="config-input config-input-sm"
                  type="number"
                  placeholder={defaultPort ? `auto (z.B. ${defaultPort})` : "auto"}
                  value={hostPort}
                  onChange={(e) => setHostPort(e.target.value)}
                  min={1024}
                  max={65535}
                />
              </div>

              {/* Name */}
              <div className="config-row">
                <label className="config-label">Name</label>
                <input
                  className="config-input"
                  type="text"
                  placeholder={`auto (testbuddy-${template}-…)`}
                  value={containerName}
                  onChange={(e) => setContainerName(e.target.value)}
                />
              </div>

              {/* Memory */}
              <div className="config-row">
                <label className="config-label">Memory-Limit</label>
                <div className="config-mem-slider">
                  <input
                    type="range"
                    min={0}
                    max={memSteps.length - 1}
                    step={1}
                    value={Math.min(memStep, memSteps.length - 1)}
                    onChange={(e) => setMemStep(Number(e.target.value))}
                  />
                  <div className="config-mem-labels">
                    <span>kein Limit</span>
                    <span>{memSteps[memSteps.length - 1].label}</span>
                  </div>
                </div>
                <span className="config-mem-value">{memSteps[Math.min(memStep, memSteps.length - 1)].label}</span>
              </div>

              {/* Env vars */}
              {envVars.length > 0 && (
                <div className="config-section-label">Umgebungsvariablen</div>
              )}
              {envVars.map((e, i) => (
                <div key={i} className="config-env-row">
                  <input
                    className="config-input config-env-key"
                    value={e.key}
                    onChange={(ev) => updateEnvKey(i, ev.target.value)}
                    placeholder="KEY"
                  />
                  <span className="config-env-sep">=</span>
                  <input
                    className="config-input config-env-val"
                    value={e.value}
                    onChange={(ev) => updateEnvValue(i, ev.target.value)}
                    placeholder="value"
                  />
                  <button
                    type="button"
                    className="btn-env-remove"
                    onClick={() => removeEnvVar(i)}
                    title="Entfernen"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" className="btn-add-env" onClick={addEnvVar}>
                + Env-Variable hinzufügen
              </button>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={loading || !template} className="btn-start">
            {loading ? "Startet..." : "▶ Starten"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmitStack} style={{ display: "contents" }}>
          <div className="form-group">
            <label>Stack-Name (optional)</label>
            <input
              className="stack-name-input"
              type="text"
              placeholder="z.B. my-backend-stack"
              value={stackName}
              onChange={(e) => setStackName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Services auswählen <span className="label-hint">({selected.length} ausgewählt)</span></label>
            <div className="service-grid">
              {stackableTemplates.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`service-chip ${selected.includes(t.key) ? "selected" : ""}`}
                  onClick={() => toggleSelected(t.key)}
                  title={t.label}
                >
                  <span>{t.icon || "📦"}</span>
                  <span className="chip-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Laufzeit: <strong>{stackDuration} Minuten</strong></label>
            <input
              type="range"
              min={5} max={480} step={5}
              value={stackDuration}
              onChange={(e) => setStackDuration(Number(e.target.value))}
            />
            <div className="range-labels"><span>5 min</span><span>8 h</span></div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={loading || selected.length < 2} className="btn-start">
            {loading ? "Startet..." : `▶ Stack starten (${selected.length})`}
          </button>
        </form>
      )}
    </div>
  );
}
