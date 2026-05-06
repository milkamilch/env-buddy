import { useState, useEffect } from "react";
import { fetchDefaultTemplates, fetchTemplateDetails, fetchMyTemplates, createTeamTemplate, updateTeamTemplate } from "../services/api";
import "./TeamStackBuilder.css";

// initialTemplate: existing TeamTemplateResponse for edit mode (optional)
export default function TeamStackBuilder({ teamId, onCreated, onClose, initialTemplate = null }) {
  const isEdit = Boolean(initialTemplate);

  // ── Template meta (left panel) ───────────────────────────────────────────
  const [name, setName]               = useState(initialTemplate?.name || "");
  const [icon, setIcon]               = useState(initialTemplate?.icon || "📦");
  const [description, setDescription] = useState(initialTemplate?.description || "");

  // ── Palette ───────────────────────────────────────────────────────────────
  // [{key, label, icon, containers?}]
  const [palette, setPalette]   = useState([]);
  const [paletteLoading, setPaletteLoading] = useState(true);

  // ── Drop zone items ────────────────────────────────────────────────────────
  // [{_id, _icon, service_name, image, internal_port, host_port, container_name,
  //   env:[{key,val}], expanded}]
  const [items, setItems]   = useState(() => {
    if (!initialTemplate?.containers) return [];
    return initialTemplate.containers.map((c) => ({
      _id:           Math.random().toString(36).slice(2),
      _icon:         initialTemplate.icon || "📦",
      service_name:  c.service_name,
      image:         c.image,
      internal_port: String(c.internal_port),
      host_port:     "",
      container_name: "",
      env:           Object.entries(c.env || {}).map(([k, v]) => ({ key: k, val: v })),
      expanded:      false,
    }));
  });
  const [dragOver, setDragOver] = useState(false);
  const [dragSrcId, setDragSrcId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // ── Load palette ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [defaults, customs] = await Promise.all([
          fetchDefaultTemplates(),
          fetchMyTemplates().catch(() => []),
        ]);
        const defaultItems = defaults.map((k) => ({ key: k, label: k, icon: "📦", containers: null }));
        const customItems  = customs.map((t) => ({
          key:        `custom:${t.id}`,
          label:      t.name,
          icon:       t.icon || "📦",
          containers: t.containers,
        }));
        setPalette([...defaultItems, ...customItems]);
      } catch {
        // palette stays empty — user can still create manually
      } finally {
        setPaletteLoading(false);
      }
    }
    load();
  }, []);

  // ── Resolve template key → drop items ─────────────────────────────────────
  async function resolveToItems(key) {
    const meta = palette.find((p) => p.key === key);
    if (key.startsWith("custom:") && meta?.containers?.length) {
      return meta.containers.map((c) => ({
        _id:           Math.random().toString(36).slice(2),
        _icon:         meta.icon,
        service_name:  c.service_name,
        image:         c.image,
        internal_port: String(c.internal_port),
        host_port:     "",
        container_name: "",
        env:           Object.entries(c.env || {}).map(([k, v]) => ({ key: k, val: v })),
        expanded:      false,
      }));
    }
    const d = await fetchTemplateDetails(key);
    return [{
      _id:           Math.random().toString(36).slice(2),
      _icon:         meta?.icon || "📦",
      service_name:  key,
      image:         d.image,
      internal_port: String(d.port),
      host_port:     "",
      container_name: "",
      env:           Object.entries(d.env || {}).map(([k, v]) => ({ key: k, val: v })),
      expanded:      false,
    }];
  }

  async function addFromKey(key) {
    try {
      const resolved = await resolveToItems(key);
      setItems((prev) => [...prev, ...resolved]);
    } catch {
      setError(`Fehler beim Laden von "${key}"`);
    }
  }

  async function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.getData("tsb-reorder")) return; // handled by item onDrop
    const key = e.dataTransfer.getData("tsb-key");
    if (key) await addFromKey(key);
  }

  function handleItemDragStart(e, id) {
    e.dataTransfer.setData("tsb-reorder", id);
    e.dataTransfer.effectAllowed = "move";
    setDragSrcId(id);
  }

  function handleItemDragOver(e, id) {
    e.preventDefault();
    e.stopPropagation();
    if (id !== dragSrcId) setDragOverId(id);
  }

  function handleItemDrop(e, targetId) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    setDragSrcId(null);
    if (!dragSrcId || dragSrcId === targetId) return;
    setItems((prev) => {
      const srcIdx = prev.findIndex((c) => c._id === dragSrcId);
      const tgtIdx = prev.findIndex((c) => c._id === targetId);
      if (srcIdx === -1 || tgtIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(srcIdx, 1);
      next.splice(tgtIdx, 0, moved);
      return next;
    });
  }

  // ── Item helpers ──────────────────────────────────────────────────────────
  const updItem     = (id, f, v) => setItems((p) => p.map((c) => c._id === id ? { ...c, [f]: v } : c));
  const removeItem  = (id)       => setItems((p) => p.filter((c) => c._id !== id));
  const toggleExp   = (id)       => setItems((p) => p.map((c) => c._id === id ? { ...c, expanded: !c.expanded } : c));
  const updEnvK     = (id, i, k) => setItems((p) => p.map((c) => c._id === id
    ? { ...c, env: c.env.map((e, idx) => idx === i ? { ...e, key: k } : e) } : c));
  const updEnvV     = (id, i, v) => setItems((p) => p.map((c) => c._id === id
    ? { ...c, env: c.env.map((e, idx) => idx === i ? { ...e, val: v } : e) } : c));
  const removeEnv   = (id, i)    => setItems((p) => p.map((c) => c._id === id
    ? { ...c, env: c.env.filter((_, idx) => idx !== i) } : c));
  const addEnv      = (id)       => setItems((p) => p.map((c) => c._id === id
    ? { ...c, env: [...c.env, { key: "", val: "" }] } : c));

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Name ist erforderlich."); return; }
    if (items.length === 0) { setError("Mindestens einen Container hinzufügen."); return; }
    setLoading(true); setError(null);
    try {
      const containers = items.map((c) => ({
        service_name:   c.service_name,
        image:          c.image,
        internal_port:  parseInt(c.internal_port) || 8080,
        env:            Object.fromEntries(c.env.filter((e) => e.key).map((e) => [e.key, e.val])),
      }));
      const payload = { name: name.trim(), icon, description, containers };
      const result = isEdit
        ? await updateTeamTemplate(teamId, initialTemplate.id, payload)
        : await createTeamTemplate(teamId, payload);
      onCreated(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="tsb-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tsb-modal">

        {/* Header */}
        <div className="tsb-header">
          <span className="tsb-title">{isEdit ? "Team-Template bearbeiten" : "Team-Template erstellen"}</span>
          <button className="tsb-close" onClick={onClose}>✕</button>
        </div>

        <div className="tsb-body">

          {/* ── Left panel: template info ── */}
          <form className="tsb-left" onSubmit={handleSubmit}>
            <div className="tsb-section-label">Template-Info</div>

            <div className="tsb-field-row">
              <div className="tsb-field" style={{ width: "3.5rem" }}>
                <label className="tsb-label">Icon</label>
                <input className="tsb-input" value={icon}
                  onChange={(e) => setIcon(e.target.value)} maxLength={4} />
              </div>
              <div className="tsb-field" style={{ flex: 1 }}>
                <label className="tsb-label">Name *</label>
                <input className="tsb-input" placeholder="z.B. Backend-Stack"
                  value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>

            <div className="tsb-field">
              <label className="tsb-label">Beschreibung</label>
              <input className="tsb-input" placeholder="Wofür ist dieses Template?"
                value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="tsb-section-label" style={{ marginTop: "0.5rem" }}>
              Container ({items.length})
            </div>
            {items.length === 0 && (
              <p className="tsb-hint">Ziehe Templates aus der Palette rechts in den Bereich.</p>
            )}
            {items.length > 0 && (
              <ul className="tsb-container-summary">
                {items.map((c) => (
                  <li key={c._id} className="tsb-summary-item">
                    <span className="tsb-summary-icon">{c._icon}</span>
                    <span className="tsb-summary-name">{c.service_name}</span>
                    <span className="tsb-summary-image">{c.image}</span>
                  </li>
                ))}
              </ul>
            )}

            <div style={{ flex: 1 }} />

            {error && <p className="tsb-error">{error}</p>}

            <button type="submit" className="tsb-btn-submit"
              disabled={loading || !name.trim() || items.length === 0}>
              {loading ? (isEdit ? "Speichert…" : "Erstellt…") : (isEdit ? "✓ Änderungen speichern" : "✓ Team-Template erstellen")}
            </button>
            <button type="button" className="tsb-btn-cancel" onClick={onClose}>
              Abbrechen
            </button>
          </form>

          {/* ── Right panel: palette + drop zone ── */}
          <div className="tsb-right">

            {/* Palette */}
            <div className="tsb-section-label">
              Deine Templates — ziehen oder klicken
            </div>
            {paletteLoading ? (
              <p className="tsb-hint">Lädt…</p>
            ) : (
              <div className="tsb-palette">
                {palette.map((t) => (
                  <div key={t.key} className="tsb-chip"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("tsb-key", t.key)}
                    onClick={() => addFromKey(t.key)}
                    title={t.label}>
                    <span>{t.icon}</span>
                    <span className="tsb-chip-label">{t.label}</span>
                    {t.containers?.length > 1 && (
                      <span className="tsb-chip-multi">{t.containers.length}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone */}
            <div
              className={`tsb-drop-zone ${dragOver ? "tsb-dz-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {items.length === 0 ? (
                <p className="tsb-dz-hint">Templates hierher ziehen oder oben klicken</p>
              ) : (
                items.map((c) => (
                  <div
                    key={c._id}
                    className={`tsb-item ${dragOverId === c._id ? "tsb-item-drag-over" : ""} ${dragSrcId === c._id ? "tsb-item-dragging" : ""}`}
                    draggable
                    onDragStart={(e) => handleItemDragStart(e, c._id)}
                    onDragOver={(e) => handleItemDragOver(e, c._id)}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={(e) => handleItemDrop(e, c._id)}
                    onDragEnd={() => { setDragSrcId(null); setDragOverId(null); }}
                  >
                    <div className="tsb-item-header">
                      <span className="tsb-item-drag-handle" title="Ziehen zum Neuanordnen">⠿</span>
                      <span className="tsb-item-icon">{c._icon}</span>
                      <span className="tsb-item-name">{c.service_name}</span>
                      <span className="tsb-item-image">{c.image}</span>
                      <button type="button" className="tsb-item-btn"
                        onClick={() => toggleExp(c._id)} title="Bearbeiten">
                        {c.expanded ? "▲" : "⚙"}
                      </button>
                      <button type="button" className="tsb-item-btn tsb-item-remove"
                        onClick={() => removeItem(c._id)} title="Entfernen">
                        ✕
                      </button>
                    </div>

                    {c.expanded && (
                      <div className="tsb-item-config">
                        <div className="tsb-cfg-row">
                          <label className="tsb-cfg-label">Service-Name</label>
                          <input className="tsb-cfg-input" value={c.service_name}
                            onChange={(e) => updItem(c._id, "service_name", e.target.value)} />
                        </div>
                        <div className="tsb-cfg-row">
                          <label className="tsb-cfg-label">Port (intern)</label>
                          <input className="tsb-cfg-input tsb-cfg-input-sm" type="number"
                            value={c.internal_port}
                            onChange={(e) => updItem(c._id, "internal_port", e.target.value)}
                            min={1} max={65535} />
                        </div>
                        <div className="tsb-cfg-row">
                          <label className="tsb-cfg-label">Image</label>
                          <input className="tsb-cfg-input" value={c.image}
                            onChange={(e) => updItem(c._id, "image", e.target.value)} />
                        </div>
                        {c.env.length > 0 && (
                          <div className="tsb-env-title">Env-Variablen</div>
                        )}
                        {c.env.map((e, i) => (
                          <div key={i} className="tsb-env-row">
                            <input className="tsb-cfg-input tsb-env-key" value={e.key}
                              placeholder="KEY"
                              onChange={(ev) => updEnvK(c._id, i, ev.target.value)} />
                            <span className="tsb-env-sep">=</span>
                            <input className="tsb-cfg-input tsb-env-val" value={e.val}
                              placeholder="value"
                              onChange={(ev) => updEnvV(c._id, i, ev.target.value)} />
                            <button type="button" className="tsb-item-btn tsb-item-remove"
                              onClick={() => removeEnv(c._id, i)}>✕</button>
                          </div>
                        ))}
                        <button type="button" className="tsb-btn-add-env"
                          onClick={() => addEnv(c._id)}>
                          + Env
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
