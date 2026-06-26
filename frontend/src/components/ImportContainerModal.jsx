import { useState, useRef } from "react";
import { useToast } from "./Toast";

export default function ImportContainerModal({ onImport, onClose }) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const toast = useToast();

  function parseConfig(raw) {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    // docker inspect format (array with one element)
    const src = Array.isArray(data) ? data[0] : data;

    // env-buddy export format: { template, env, port, container_name, duration_minutes }
    if (src.template || src.env) {
      return {
        template:         src.template         || src.image || "",
        env:              src.env              || {},
        port:             src.host_port        || src.port  || null,
        container_name:   src.container_name   || src.name  || "",
        duration_minutes: src.duration_minutes || 60,
      };
    }

    // docker inspect format
    const image = src.Config?.Image || src.Image || "";
    const envList = src.Config?.Env || [];
    const envMap = {};
    for (const e of envList) {
      const idx = e.indexOf("=");
      if (idx > 0) envMap[e.slice(0, idx)] = e.slice(idx + 1);
    }
    const portBindings = src.HostConfig?.PortBindings || {};
    let hostPort = null;
    for (const bindings of Object.values(portBindings)) {
      if (bindings?.[0]?.HostPort) { hostPort = parseInt(bindings[0].HostPort, 10); break; }
    }
    const name = (src.Name || src.Names?.[0] || "").replace(/^\//, "");

    return {
      template:         image.split(":")[0].split("/").pop(),
      env:              envMap,
      port:             hostPort,
      container_name:   name,
      duration_minutes: 60,
    };
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setJsonText(ev.target.result);
    reader.readAsText(file);
  }

  function handleApply() {
    setError(null);
    try {
      const config = parseConfig(jsonText);
      onImport(config);
      toast.success("Konfiguration importiert");
      onClose();
    } catch (e) {
      setError("Ungültiges JSON: " + e.message);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: "32rem" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Container importieren</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--subtext1)" }}>
            Füge JSON ein (env-buddy-Export oder <code>docker inspect</code> Ausgabe) oder lade eine Datei hoch.
          </p>
          <textarea
            style={{
              background: "var(--surface1)", border: "1px solid var(--overlay0)", borderRadius: "6px",
              color: "var(--text)", fontFamily: "monospace", fontSize: "0.8rem",
              padding: "0.6rem", resize: "vertical", minHeight: "10rem", outline: "none",
            }}
            placeholder={'{\n  "template": "postgres",\n  "env": { "POSTGRES_PASSWORD": "secret" },\n  "port": 5432\n}'}
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setError(null); }}
          />
          {error && <p style={{ color: "var(--stop)", fontSize: "0.82rem", margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between", alignItems: "center" }}>
            <button
              style={{
                background: "transparent", border: "1px solid var(--overlay1)", borderRadius: "6px",
                color: "var(--subtext1)", fontSize: "0.82rem", padding: "0.4rem 0.8rem", cursor: "pointer",
              }}
              onClick={() => fileRef.current?.click()}
            >
              📂 Datei wählen
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleFile} />
            <button
              className="btn-primary"
              disabled={!jsonText.trim()}
              onClick={handleApply}
            >
              Importieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
