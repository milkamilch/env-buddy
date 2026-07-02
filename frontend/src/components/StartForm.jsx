import { useState, useEffect } from "react";
import { startContainer, startStack, fetchTemplateDetails, fetchSystemInfo } from "../services/api";
import { useToast } from "./Toast";
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

const CPU_STEPS = [
  { label: "kein Limit", value: null  },
  { label: "0.25 CPUs",  value: 0.25  },
  { label: "0.5 CPUs",   value: 0.5   },
  { label: "1 CPU",      value: 1.0   },
  { label: "2 CPUs",     value: 2.0   },
  { label: "4 CPUs",     value: 4.0   },
];

function buildMemSteps(totalRamMb) {
  return ALL_MEM_STEPS.filter((s) => s.mb === 0 || s.mb <= totalRamMb);
}

export default function StartForm({ templates, onStarted, onStarting, onClose, prefill, onPrefillConsumed }) {
  const toast = useToast();
  const [mode, setMode] = useState("single");

  // ── Single mode ──────────────────────────────────────────────────────────
  const [template, setTemplate]           = useState(templates[0]?.key || "");
  const [duration, setDuration]           = useState(60);
  const [showConfig, setShowConfig]       = useState(false);
  const [envVars, setEnvVars]             = useState([]);
  const [hostPort, setHostPort]           = useState("");
  const [containerName, setContainerName] = useState("");
  const [memStep, setMemStep]             = useState(0);
  const [memSteps, setMemSteps]           = useState(ALL_MEM_STEPS.slice(0, 6));
  const [cpuStep, setCpuStep]             = useState(0);
  const [defaultPort, setDefaultPort]     = useState(null);
  const [password, setPassword]           = useState("");
  const [showPw, setShowPw]               = useState(false);

  // ── Stack mode ───────────────────────────────────────────────────────────
  const [stackStep, setStackStep]         = useState(1);
  const [stackSelected, setStackSelected] = useState([]); // template keys (step 1)
  const [stackName, setStackName]         = useState("");
  const [stackDuration, setStackDuration] = useState(60);
  // step 2: [{_id, _icon, service_name, image, internal_port, host_port, container_name, env:[{key,val}]}]
  const [stackContainers, setStackContainers] = useState([]);

  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState(null);

  useEffect(() => {
    if (templates.length > 0) setTemplate(templates[0].key);
  }, [templates]);

  useEffect(() => {
    if (!prefill) return;
    if (prefill.template) setTemplate(prefill.template);
    if (prefill.env) setEnvVars(Object.entries(prefill.env).map(([key, val]) => ({ key, value: val })));
    if (prefill.port) setHostPort(String(prefill.port));
    if (prefill.duration_minutes) setDuration(prefill.duration_minutes);
    setContainerName("");
    setShowConfig(true);
    onPrefillConsumed?.();
  }, [prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchSystemInfo()
      .then(({ total_ram_mb }) => setMemSteps(buildMemSteps(total_ram_mb)))
      .catch(() => {});
  }, []);

  // ── Single: pre-fill when template changes ───────────────────────────────
  useEffect(() => {
    setHostPort(""); setContainerName(""); setMemStep(0); setPassword("");
    if (!template) { setEnvVars([]); setDefaultPort(null); return; }
    if (template.startsWith("custom:") || template.startsWith("team:")) {
      const first = templates.find((t) => t.key === template)?.containers?.[0];
      if (first) {
        setEnvVars(Object.entries(first.env || {}).map(([k, v]) => ({ key: k, value: v })));
        setDefaultPort(first.internal_port || null);
      } else { setEnvVars([]); setDefaultPort(null); }
      return;
    }
    fetchTemplateDetails(template)
      .then((d) => {
        setEnvVars(Object.entries(d.env).map(([k, v]) => ({ key: k, value: v })));
        setDefaultPort(d.port);
      })
      .catch(() => { setEnvVars([]); setDefaultPort(null); });
  }, [template]); // eslint-disable-line react-hooks/exhaustive-deps

  const isMultiContainer = (template.startsWith("custom:") || template.startsWith("team:"))
    && (templates.find((t) => t.key === template)?.containers?.length ?? 0) > 1;

  // ── Single helpers ────────────────────────────────────────────────────────
  const updEnv    = (i, f, v) => setEnvVars((p) => p.map((e, idx) => idx === i ? { ...e, [f]: v } : e));
  const removeEnv = (i)       => setEnvVars((p) => p.filter((_, idx) => idx !== i));
  const addEnv    = ()        => setEnvVars((p) => [...p, { key: "", value: "" }]);

  function handleSubmitSingle(e) {
    e.preventDefault();
    const config = {};
    if (envVars.length > 0)
      config.env_overrides = Object.fromEntries(envVars.filter((e) => e.key).map((e) => [e.key, e.value]));
    if (hostPort) config.host_port = parseInt(hostPort, 10);
    if (containerName) config.container_name = containerName;
    const memValue = memSteps[Math.min(memStep, memSteps.length - 1)].apiValue;
    if (memValue) config.mem_limit = memValue;
    const cpuValue = CPU_STEPS[Math.min(cpuStep, CPU_STEPS.length - 1)].value;
    if (cpuValue) config.cpu_limit = cpuValue;
    if (password) config.password = password;
    onClose?.();
    onStarting?.(template?.label || template, template?.icon);
    toast.info(`${template?.label || template} wird gestartet…`);
    startContainer(template, duration, config)
      .then(() => { toast.success("Container gestartet"); onStarted(); })
      .catch((err) => toast.error(err.message));
  }

  // ── Stack: step 1 — chip toggle ───────────────────────────────────────────
  function toggleStackChip(key) {
    setStackSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  // ── Stack: step 1 → step 2 — resolve selected templates ──────────────────
  async function handleStackNext() {
    setLoading(true); setError(null);
    try {
      const resolved = [];
      for (const key of stackSelected) {
        const tmplMeta = templates.find((t) => t.key === key);
        if (key.startsWith("custom:") || key.startsWith("team:")) {
          for (const c of (tmplMeta?.containers || [])) {
            resolved.push({
              _id:           Math.random().toString(36).slice(2),
              _icon:         tmplMeta?.icon || "📦",
              service_name:  c.service_name,
              image:         c.image,
              internal_port: String(c.internal_port),
              env:           Object.entries(c.env || {}).map(([k, v]) => ({ key: k, val: v })),
              host_port:     "",
              container_name: "",
            });
          }
        } else {
          const d = await fetchTemplateDetails(key);
          resolved.push({
            _id:           Math.random().toString(36).slice(2),
            _icon:         tmplMeta?.icon || "📦",
            service_name:  key,
            image:         d.image,
            internal_port: String(d.port),
            env:           Object.entries(d.env || {}).map(([k, v]) => ({ key: k, val: v })),
            host_port:     "",
            container_name: "",
          });
        }
      }
      setStackContainers(resolved);
      setStackStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  // ── Stack step 2: container field helpers ─────────────────────────────────
  const updSC      = (id, f, v)  => setStackContainers((p) => p.map((c) => c._id === id ? { ...c, [f]: v } : c));
  const updSCEnvK  = (id, i, k)  => setStackContainers((p) => p.map((c) => c._id === id
    ? { ...c, env: c.env.map((e, idx) => idx === i ? { ...e, key: k } : e) } : c));
  const updSCEnvV  = (id, i, v)  => setStackContainers((p) => p.map((c) => c._id === id
    ? { ...c, env: c.env.map((e, idx) => idx === i ? { ...e, val: v } : e) } : c));
  const removeSCEnv = (id, i)    => setStackContainers((p) => p.map((c) => c._id === id
    ? { ...c, env: c.env.filter((_, idx) => idx !== i) } : c));
  const addSCEnv    = (id)       => setStackContainers((p) => p.map((c) => c._id === id
    ? { ...c, env: [...c.env, { key: "", val: "" }] } : c));

  function handleSubmitStack(e) {
    e.preventDefault();
    const containers = stackContainers.map((c) => ({
      service_name:   c.service_name,
      image:          c.image,
      internal_port:  parseInt(c.internal_port) || 0,
      env:            Object.fromEntries(c.env.filter((e) => e.key).map((e) => [e.key, e.val])),
      host_port:      c.host_port ? parseInt(c.host_port) : null,
      container_name: c.container_name || null,
    }));
    const defaultName = stackSelected.map((k) => templates.find((t) => t.key === k)?.label || k).join("+");
    const name = stackName || defaultName;
    onClose?.();
    onStarting?.(name, null);
    toast.info(`Stack „${name}" wird gestartet…`);
    startStack(containers, name, stackDuration)
      .then(() => { toast.success(`Stack „${name}" gestartet`); onStarted(); })
      .catch((err) => toast.error(err.message));
    setStackStep(1); setStackSelected([]); setStackContainers([]); setStackName("");
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="start-form">
      <div className="mode-tabs">
        <button type="button" className={`mode-tab ${mode === "single" ? "active" : ""}`}
          onClick={() => { setMode("single"); setError(null); }}>
          Container
        </button>
        <button type="button" className={`mode-tab ${mode === "stack" ? "active" : ""}`}
          onClick={() => { setMode("stack"); setError(null); }}>
          Stack
        </button>
      </div>

      {/* ── Single mode ── */}
      {mode === "single" && (
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
            <input type="range" min={5} max={480} step={5} value={duration}
              onChange={(e) => setDuration(Number(e.target.value))} />
            <div className="range-labels"><span>5 min</span><span>8 h</span></div>
          </div>
          {isMultiContainer ? (
            <p className="custom-multi-hint">
              📦 {templates.find((t) => t.key === template)?.containers?.length} Container — startet als Stack
            </p>
          ) : (
            <button type="button" className={`btn-config-toggle ${showConfig ? "open" : ""}`}
              onClick={() => setShowConfig((v) => !v)}>
              <span>⚙ Konfiguration</span>
              <span className="toggle-arrow">{showConfig ? "▲" : "▼"}</span>
            </button>
          )}
          {showConfig && !isMultiContainer && (
            <div className="config-panel">
              <div className="config-row">
                <label className="config-label">Host-Port</label>
                <input className="config-input config-input-sm" type="number"
                  placeholder={defaultPort ? `auto (z.B. ${defaultPort})` : "auto"}
                  value={hostPort} onChange={(e) => setHostPort(e.target.value)} min={1024} max={65535} />
              </div>
              <div className="config-row">
                <label className="config-label">Name</label>
                <input className="config-input" type="text"
                  placeholder={`auto (testbuddy-${template}-…)`}
                  value={containerName} onChange={(e) => setContainerName(e.target.value)} />
              </div>
              <div className="config-row">
                <label className="config-label">Passwort</label>
                <div className="config-pw-wrap">
                  <input
                    className="config-input config-pw-input"
                    type={showPw ? "text" : "password"}
                    placeholder="auto-generiert"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" className="btn-pw-toggle" onClick={() => setShowPw((v) => !v)}
                    title={showPw ? "Verbergen" : "Anzeigen"}>
                    {showPw ? "🙈" : "👁"}
                  </button>
                  <button type="button" className="btn-pw-gen" title="Passwort generieren"
                    onClick={() => {
                      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#%^&*";
                      setPassword(Array.from(crypto.getRandomValues(new Uint8Array(16)))
                        .map((b) => chars[b % chars.length]).join(""));
                      setShowPw(true);
                    }}>
                    🎲
                  </button>
                </div>
              </div>
              <div className="config-row">
                <label className="config-label">Memory-Limit</label>
                <div className="config-mem-slider">
                  <input type="range" min={0} max={memSteps.length - 1} step={1}
                    value={Math.min(memStep, memSteps.length - 1)}
                    onChange={(e) => setMemStep(Number(e.target.value))} />
                  <div className="config-mem-labels">
                    <span>kein Limit</span><span>{memSteps[memSteps.length - 1].label}</span>
                  </div>
                </div>
                <span className="config-mem-value">{memSteps[Math.min(memStep, memSteps.length - 1)].label}</span>
              </div>
              <div className="config-row">
                <label className="config-label">CPU-Limit</label>
                <div className="config-mem-slider">
                  <input type="range" min={0} max={CPU_STEPS.length - 1} step={1}
                    value={Math.min(cpuStep, CPU_STEPS.length - 1)}
                    onChange={(e) => setCpuStep(Number(e.target.value))} />
                  <div className="config-mem-labels">
                    <span>kein Limit</span><span>{CPU_STEPS[CPU_STEPS.length - 1].label}</span>
                  </div>
                </div>
                <span className="config-mem-value">{CPU_STEPS[Math.min(cpuStep, CPU_STEPS.length - 1)].label}</span>
              </div>
              {envVars.length > 0 && <div className="config-section-label">Umgebungsvariablen</div>}
              {envVars.map((e, i) => (
                <div key={i} className="config-env-row">
                  <input className="config-input config-env-key" value={e.key} placeholder="KEY"
                    onChange={(ev) => updEnv(i, "key", ev.target.value)} />
                  <span className="config-env-sep">=</span>
                  <input className="config-input config-env-val" value={e.value} placeholder="value"
                    onChange={(ev) => updEnv(i, "value", ev.target.value)} />
                  <button type="button" className="btn-env-remove" onClick={() => removeEnv(i)}>✕</button>
                </div>
              ))}
              <button type="button" className="btn-add-env" onClick={addEnv}>+ Env-Variable</button>
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={!template} className="btn-start">
            ▶ Starten
          </button>
        </form>
      )}

      {/* ── Stack mode ── */}
      {mode === "stack" && stackStep === 1 && (
        <div style={{ display: "contents" }}>
          <div className="stack-step-header">
            <span className="stack-step-label">Schritt 1 von 2</span>
            <span className="stack-step-title">Templates auswählen</span>
          </div>

          <div className="form-group">
            <label>
              Templates{" "}
              <span className="label-hint">
                {stackSelected.length > 0 ? `${stackSelected.length} ausgewählt` : "mind. 2 wählen"}
              </span>
            </label>
            <div className="service-grid">
              {templates.map((t) => {
                const sel = stackSelected.includes(t.key);
                const count = t.containers?.length;
                return (
                  <button key={t.key} type="button"
                    className={`service-chip ${sel ? "selected" : ""}`}
                    onClick={() => toggleStackChip(t.key)}>
                    <span>{t.icon || "📦"}</span>
                    <span className="chip-label">{t.label}</span>
                    {count > 1 && <span className="chip-multi">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label>Stack-Name (optional)</label>
            <input className="stack-name-input" type="text" placeholder="z.B. my-backend-stack"
              value={stackName} onChange={(e) => setStackName(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Laufzeit: <strong>{stackDuration} Minuten</strong></label>
            <input type="range" min={5} max={480} step={5} value={stackDuration}
              onChange={(e) => setStackDuration(Number(e.target.value))} />
            <div className="range-labels"><span>5 min</span><span>8 h</span></div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="button" className="btn-start"
            disabled={loading || stackSelected.length < 2}
            onClick={handleStackNext}>
            {loading ? "Lädt…" : `Weiter (${stackSelected.length} gewählt) →`}
          </button>
        </div>
      )}

      {mode === "stack" && stackStep === 2 && (
        <form onSubmit={handleSubmitStack} style={{ display: "contents" }}>
          <div className="stack-step-header">
            <span className="stack-step-label">Schritt 2 von 2</span>
            <span className="stack-step-title">Container konfigurieren</span>
          </div>

          <div className="stack-containers-list">
            {stackContainers.map((c) => (
              <div key={c._id} className="stack-container-block">
                <div className="scb-header">
                  <span className="scb-image">{c._icon} {c.image}</span>
                  <span className="scb-from">{c.service_name}</span>
                </div>
                <div className="scb-row">
                  <label className="scb-label">Service-Name</label>
                  <input className="scb-input" value={c.service_name}
                    onChange={(e) => updSC(c._id, "service_name", e.target.value)} />
                </div>
                <div className="scb-row">
                  <label className="scb-label">Host-Port</label>
                  <input className="scb-input scb-input-sm" type="number"
                    placeholder={`auto (intern: ${c.internal_port})`}
                    value={c.host_port}
                    onChange={(e) => updSC(c._id, "host_port", e.target.value)}
                    min={1024} max={65535} />
                </div>
                <div className="scb-row">
                  <label className="scb-label">Name</label>
                  <input className="scb-input" placeholder="auto"
                    value={c.container_name}
                    onChange={(e) => updSC(c._id, "container_name", e.target.value)} />
                </div>
                {c.env.length > 0 && <div className="scb-env-label">Env-Variablen</div>}
                {c.env.map((e, i) => (
                  <div key={i} className="config-env-row">
                    <input className="config-input config-env-key" value={e.key} placeholder="KEY"
                      onChange={(ev) => updSCEnvK(c._id, i, ev.target.value)} />
                    <span className="config-env-sep">=</span>
                    <input className="config-input config-env-val" value={e.val} placeholder="value"
                      onChange={(ev) => updSCEnvV(c._id, i, ev.target.value)} />
                    <button type="button" className="btn-env-remove"
                      onClick={() => removeSCEnv(c._id, i)}>✕</button>
                  </div>
                ))}
                <button type="button" className="btn-add-env" onClick={() => addSCEnv(c._id)}>
                  + Env
                </button>
              </div>
            ))}
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="stack-step2-actions">
            <button type="button" className="btn-back"
              onClick={() => { setStackStep(1); setError(null); }}>
              ← Zurück
            </button>
            <button type="submit" className="btn-start" style={{ flex: 1 }}
              disabled={stackContainers.length < 2}>
              {`▶ Stack starten (${stackContainers.length})`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
