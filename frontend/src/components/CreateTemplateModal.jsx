import { useState } from "react";
import { createTemplate } from "../services/api";
import "./CreateTemplateModal.css";

const EMPTY_CONTAINER = { service_name: "", image: "", internal_port: "", env: {} };

export default function CreateTemplateModal({ onCreated, onClose, createFn = createTemplate, title = "Neues Template erstellen" }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📦");
  const [containers, setContainers] = useState([{ ...EMPTY_CONTAINER }]);
  const [envInputs, setEnvInputs] = useState([""]);  // raw "KEY=VALUE" strings per container
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function addContainer() {
    setContainers((prev) => [...prev, { ...EMPTY_CONTAINER }]);
    setEnvInputs((prev) => [...prev, ""]);
  }

  function removeContainer(i) {
    setContainers((prev) => prev.filter((_, idx) => idx !== i));
    setEnvInputs((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateContainer(i, field, value) {
    setContainers((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  }

  function updateEnvInput(i, value) {
    setEnvInputs((prev) => prev.map((v, idx) => idx === i ? value : v));
  }

  function parseEnv(raw) {
    const env = {};
    raw.split("\n").forEach((line) => {
      const eq = line.indexOf("=");
      if (eq > 0) {
        env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
      }
    });
    return env;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const payload = {
      name, description, icon,
      containers: containers.map((c, i) => ({
        service_name:  c.service_name,
        image:         c.image,
        internal_port: parseInt(c.internal_port) || 8080,
        env:           parseEnv(envInputs[i]),
      })),
    };
    if (payload.containers.some((c) => !c.service_name || !c.image)) {
      setError("Jeder Container braucht einen Namen und ein Image.");
      return;
    }
    setLoading(true);
    try {
      const created = await createFn(payload);
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field" style={{ width: "60px" }}>
              <label>Icon</label>
              <input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mein Stack" required />
            </div>
          </div>

          <div className="field">
            <label>Beschreibung</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Wofür ist dieses Template?" />
          </div>

          <div className="containers-section">
            <div className="containers-header">
              <span className="section-label">Container ({containers.length})</span>
              <button type="button" className="btn-add-container" onClick={addContainer}>+ Hinzufügen</button>
            </div>

            {containers.map((c, i) => (
              <div key={i} className="container-config">
                <div className="container-config-header">
                  <span className="container-index">Container {i + 1}</span>
                  {containers.length > 1 && (
                    <button type="button" className="btn-remove" onClick={() => removeContainer(i)}>✕</button>
                  )}
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Service-Name *</label>
                    <input value={c.service_name} onChange={(e) => updateContainer(i, "service_name", e.target.value)} placeholder="db" required />
                  </div>
                  <div className="field">
                    <label>Port (intern) *</label>
                    <input type="number" value={c.internal_port} onChange={(e) => updateContainer(i, "internal_port", e.target.value)} placeholder="5432" required />
                  </div>
                </div>
                <div className="field">
                  <label>Docker Image *</label>
                  <input value={c.image} onChange={(e) => updateContainer(i, "image", e.target.value)} placeholder="postgres:15" required />
                </div>
                <div className="field">
                  <label>Umgebungsvariablen <span className="field-hint">(KEY=VALUE, eine pro Zeile)</span></label>
                  <textarea
                    value={envInputs[i]}
                    onChange={(e) => updateEnvInput(i, e.target.value)}
                    placeholder={"POSTGRES_PASSWORD=secret\nPOSTGRES_DB=testdb"}
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="btn-create" disabled={loading || !name}>
              {loading ? "Erstelle..." : "Template erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
