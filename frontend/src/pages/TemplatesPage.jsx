import { useState, useEffect } from "react";
import { fetchDefaultTemplates, fetchMyTemplates, fetchFavorites, saveFavorites, deleteTemplate } from "../services/api";
import CreateTemplateModal from "../components/CreateTemplateModal";
import "./TemplatesPage.css";

const DEFAULT_ICONS = {
  postgres: "🐘", mysql: "🐬", mariadb: "🐬", mongo: "🍃", redis: "⚡",
  cockroachdb: "🪳", neo4j: "🕸️", influxdb: "📈", couchdb: "🛋️", timescaledb: "⏱️",
  elasticsearch: "🔍", cassandra: "💎", rabbitmq: "🐰", kafka: "📨", nats: "🚀", mosquitto: "🦟",
  nginx: "🌐", httpd: "🌐", traefik: "🔀",
  mailhog: "📬", adminer: "🗄️", minio: "🪣", vault: "🔐", keycloak: "🗝️",
  gitea: "🐱", prometheus: "🔥", grafana: "📊", jaeger: "🔭", sonarqube: "🧹",
  registry: "📦", verdaccio: "📦",
};

export default function TemplatesPage() {
  const [defaultTemplates, setDefaultTemplates] = useState([]);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [favorites, setFavorites] = useState([]);  // array of string keys: "postgres", "custom:42"
  const [showModal, setShowModal] = useState(false);
  const [dragItem, setDragItem] = useState(null);
  const [dragOverFav, setDragOverFav] = useState(false);

  useEffect(() => {
    fetchDefaultTemplates().then(setDefaultTemplates).catch(() => {});
    fetchMyTemplates().then(setCustomTemplates).catch(() => {});
    fetchFavorites().then(setFavorites).catch(() => {});
  }, []);

  // ── Favorites helpers ────────────────────────────────────────────────────

  async function persistFavorites(next) {
    setFavorites(next);
    await saveFavorites(next).catch(() => {});
  }

  function removeFromFavorites(key) {
    persistFavorites(favorites.filter((k) => k !== key));
  }

  function addToFavorites(key) {
    if (!favorites.includes(key)) {
      persistFavorites([...favorites, key]);
    }
  }

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  function onDragStartLibrary(e, key) {
    setDragItem({ key, from: "library" });
    e.dataTransfer.effectAllowed = "copy";
  }

  function onDragStartFav(e, key, index) {
    setDragItem({ key, from: "favorites", index });
    e.dataTransfer.effectAllowed = "move";
  }

  function onDropFavorites(e) {
    e.preventDefault();
    setDragOverFav(false);
    if (!dragItem) return;
    if (dragItem.from === "library") {
      addToFavorites(dragItem.key);
    }
    setDragItem(null);
  }

  function onDropFavItem(e, targetIndex) {
    e.preventDefault();
    if (!dragItem || dragItem.from !== "favorites") return;
    const next = [...favorites];
    const [moved] = next.splice(dragItem.index, 1);
    next.splice(targetIndex, 0, moved);
    persistFavorites(next);
    setDragItem(null);
  }

  function onDropRemove(e) {
    e.preventDefault();
    if (dragItem?.from === "favorites") {
      removeFromFavorites(dragItem.key);
    }
    setDragItem(null);
  }

  // ── Custom template actions ──────────────────────────────────────────────

  async function handleDelete(id) {
    if (!confirm("Template löschen?")) return;
    await deleteTemplate(id).catch(() => {});
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
    persistFavorites(favorites.filter((k) => k !== `custom:${id}`));
  }

  function handleCreated(template) {
    setCustomTemplates((prev) => [...prev, template]);
    setShowModal(false);
  }

  // ── Render helpers ───────────────────────────────────────────────────────

  function favLabel(key) {
    if (key.startsWith("custom:")) {
      const t = customTemplates.find((t) => `custom:${t.id}` === key);
      return t ? `${t.icon} ${t.name}` : key;
    }
    return `${DEFAULT_ICONS[key] || "📦"} ${key}`;
  }

  return (
    <div className="templates-page">
      <div className="tp-header">
        <div>
          <h2>Templates</h2>
          <p className="tp-sub">Ziehe Templates in deine Schnellauswahl oder erstelle eigene.</p>
        </div>
        <button className="btn-new-template" onClick={() => setShowModal(true)}>+ Neues Template</button>
      </div>

      <div className="tp-layout">

        {/* ── Meine Auswahl ── */}
        <aside className="tp-sidebar">
          <div className="favorites-header">
            <span>⭐ Meine Schnellauswahl</span>
            <span className="fav-count">{favorites.length}</span>
          </div>
          <div
            className={`favorites-drop-zone ${dragOverFav && dragItem?.from === "library" ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverFav(true); }}
            onDragLeave={() => setDragOverFav(false)}
            onDrop={onDropFavorites}
          >
            {favorites.length === 0 ? (
              <p className="fav-empty">Templates hierher ziehen</p>
            ) : (
              favorites.map((key, i) => (
                <div
                  key={key}
                  className="fav-item"
                  draggable
                  onDragStart={(e) => onDragStartFav(e, key, i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDropFavItem(e, i)}
                >
                  <span className="fav-drag-handle">⠿</span>
                  <span className="fav-label">{favLabel(key)}</span>
                  <button className="fav-remove" onClick={() => removeFromFavorites(key)}>✕</button>
                </div>
              ))
            )}
          </div>

          {dragItem?.from === "favorites" && (
            <div
              className="fav-trash-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropRemove}
            >
              🗑 Hierher zum Entfernen
            </div>
          )}
        </aside>

        {/* ── Template-Bibliothek ── */}
        <section className="tp-library">
          {defaultTemplates.length > 0 && (
            <>
              <h3 className="library-section-title">Standard-Templates</h3>
              <div className="template-grid">
                {defaultTemplates.map((key) => (
                  <div
                    key={key}
                    className={`template-card ${favorites.includes(key) ? "is-favorite" : ""}`}
                    draggable
                    onDragStart={(e) => onDragStartLibrary(e, key)}
                  >
                    <div className="tc-icon">{DEFAULT_ICONS[key] || "📦"}</div>
                    <div className="tc-name">{key}</div>
                    <div className="tc-type">Standard</div>
                    {favorites.includes(key)
                      ? <button className="tc-btn tc-btn-remove" onClick={() => removeFromFavorites(key)}>✓ In Auswahl</button>
                      : <button className="tc-btn" onClick={() => addToFavorites(key)}>+ Auswahl</button>
                    }
                  </div>
                ))}
              </div>
            </>
          )}

          {customTemplates.length > 0 && (
            <>
              <h3 className="library-section-title">Meine Templates</h3>
              <div className="template-grid">
                {customTemplates.map((t) => {
                  const key = `custom:${t.id}`;
                  return (
                    <div
                      key={t.id}
                      className={`template-card custom-card ${favorites.includes(key) ? "is-favorite" : ""}`}
                      draggable
                      onDragStart={(e) => onDragStartLibrary(e, key)}
                    >
                      <div className="tc-icon">{t.icon}</div>
                      <div className="tc-name">{t.name}</div>
                      <div className="tc-desc">{t.description}</div>
                      <div className="tc-containers">
                        {t.containers.length} Container{t.containers.length !== 1 ? "" : ""}
                        {": "}
                        {t.containers.map((c) => c.image).join(", ")}
                      </div>
                      <div className="tc-actions">
                        {favorites.includes(key)
                          ? <button className="tc-btn tc-btn-remove" onClick={() => removeFromFavorites(key)}>✓ In Auswahl</button>
                          : <button className="tc-btn" onClick={() => addToFavorites(key)}>+ Auswahl</button>
                        }
                        <button className="tc-btn-delete" onClick={() => handleDelete(t.id)}>Löschen</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {customTemplates.length === 0 && (
            <div className="empty-custom">
              <p>Noch keine eigenen Templates. Erstelle dein erstes!</p>
              <button className="btn-new-template" onClick={() => setShowModal(true)}>+ Neues Template</button>
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <CreateTemplateModal onCreated={handleCreated} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
