import { useState, useEffect } from "react";
import { startContainer, startStack } from "../services/api";
import "./StartForm.css";

// templates: array of { key: "postgres"|"custom:42", label: "postgres", icon: "🐘" }
export default function StartForm({ templates, onStarted }) {
  const [mode, setMode] = useState("single"); // "single" | "stack"

  // Single mode
  const [template, setTemplate] = useState(templates[0]?.key || "");
  const [duration, setDuration] = useState(60);

  // Stack mode
  const [stackName, setStackName] = useState("");
  const [selected, setSelected] = useState([]); // array of template keys
  const [stackDuration, setStackDuration] = useState(60);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (templates.length > 0) setTemplate(templates[0].key);
  }, [templates]);

  // Only default (non-custom) templates can go into a stack
  const stackableTemplates = templates.filter((t) => !t.key.startsWith("custom:"));

  function toggleSelected(key) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleSubmitSingle(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const container = await startContainer(template, duration);
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
