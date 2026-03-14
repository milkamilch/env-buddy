import { useState } from "react";
import { startContainer } from "../services/api";
import "./StartForm.css";

export default function StartForm({ templates, onStarted }) {
  const [template, setTemplate] = useState(templates[0] || "");
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
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

  return (
    <form className="start-form" onSubmit={handleSubmit}>
      <h2>Container starten</h2>

      <div className="form-group">
        <label>Template</label>
        <select value={template} onChange={(e) => setTemplate(e.target.value)}>
          {templates.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Laufzeit: <strong>{duration} Minuten</strong></label>
        <input
          type="range"
          min={5}
          max={480}
          step={5}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
        <div className="range-labels">
          <span>5 min</span>
          <span>8 h</span>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={loading} className="btn-start">
        {loading ? "Startet..." : "▶ Starten"}
      </button>
    </form>
  );
}
