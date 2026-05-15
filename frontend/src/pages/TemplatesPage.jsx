import { useState, useEffect } from "react";
import { fetchDefaultTemplates, fetchMyTemplates, fetchFavorites, saveFavorites, deleteTemplate, fetchTeamTemplates, fetchPublicTemplates, setTemplateVisibility } from "../services/api";
import CreateTemplateModal from "../components/CreateTemplateModal";
import { useToast } from "../components/Toast";
import TEMPLATE_ICONS from "../templateIcons";
import "./TemplatesPage.css";

const DEFAULT_ICONS = TEMPLATE_ICONS;

export default function TemplatesPage() {
  const [defaultTemplates, setDefaultTemplates] = useState([]);
  const toast = useToast();
  const [customTemplates, setCustomTemplates] = useState([]);
  const [teamTemplates, setTeamTemplates] = useState([]);
  const [publicTemplates, setPublicTemplates] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [dragItem, setDragItem] = useState(null);
  const [dragOverFav, setDragOverFav] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDefaultTemplates().then(setDefaultTemplates).catch(() => {});
    fetchMyTemplates().then(setCustomTemplates).catch(() => {});
    fetchTeamTemplates().then(setTeamTemplates).catch(() => {});
    fetchFavorites().then(setFavorites).catch(() => {});
    fetchPublicTemplates().then(setPublicTemplates).catch(() => {});
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
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
    try { await deleteTemplate(id); } catch (err) { toast.error("Fehler beim Löschen: " + err.message); return; }
    setConfirmDeleteId(null);
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
    if (key.startsWith("team:")) {
      const t = teamTemplates.find((t) => `team:${t.id}` === key);
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
        <div className="tp-header-actions">
          <input
            className="tp-search"
            type="search"
            placeholder="Suche…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-new-template" onClick={() => setShowModal(true)}>+ Mein Template</button>
        </div>
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
          {(() => {
            const q = search.toLowerCase();
            const filteredDefaults = defaultTemplates.filter((k) => !q || k.toLowerCase().includes(q));
            const filteredCustoms = customTemplates.filter((t) => !q || t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
            const filteredTeams = teamTemplates.filter((t) => !q || t.name.toLowerCase().includes(q) || t.creator_name?.toLowerCase().includes(q));
            const filteredPublic = publicTemplates.filter((t) => !q || t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
            const noResults = q && filteredDefaults.length === 0 && filteredCustoms.length === 0 && filteredTeams.length === 0 && filteredPublic.length === 0;
            return (
              <>
                {noResults && (
                  <p className="tp-no-results">Keine Templates für „{search}" gefunden.</p>
                )}

                {filteredDefaults.length > 0 && (
                  <>
                    <h3 className="library-section-title">Standard-Templates</h3>
                    <div className="template-grid">
                      {filteredDefaults.map((key) => (
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

                {(!q || filteredCustoms.length > 0) && (
                  <>
                    <h3 className="library-section-title">Meine Templates</h3>
                    {filteredCustoms.length === 0 && !q ? (
                      <div className="empty-custom">
                        <p>Noch keine eigenen Templates. Erstelle dein erstes!</p>
                        <button className="btn-new-template" onClick={() => setShowModal(true)}>+ Mein Template</button>
                      </div>
                    ) : (
                      <div className="template-grid">
                        {filteredCustoms.map((t) => {
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
                                {t.containers.length} Container{": "}
                                {t.containers.map((c) => c.image).join(", ")}
                              </div>
                              <div className="tc-actions">
                                {favorites.includes(key)
                                  ? <button className="tc-btn tc-btn-remove" onClick={() => removeFromFavorites(key)}>✓ In Auswahl</button>
                                  : <button className="tc-btn" onClick={() => addToFavorites(key)}>+ Auswahl</button>
                                }
                                <button
                                  className="tc-btn"
                                  style={{ opacity: 0.85 }}
                                  title={t.is_public ? "Öffentlich – klicken zum Verbergen" : "Privat – klicken zum Veröffentlichen"}
                                  onClick={async () => {
                                    const updated = await setTemplateVisibility(t.id, !t.is_public).catch(() => null);
                                    if (updated) setCustomTemplates((prev) => prev.map((x) => x.id === t.id ? { ...x, is_public: updated.is_public } : x));
                                  }}
                                >
                                  {t.is_public ? "🌐 Öffentlich" : "🔒 Privat"}
                                </button>
                                {confirmDeleteId === t.id ? (
                                  <>
                                    <span className="tc-confirm-label">Sicher?</span>
                                    <button className="tc-btn-confirm-yes" onClick={() => handleDelete(t.id)}>✓</button>
                                    <button className="tc-btn-confirm-no" onClick={() => setConfirmDeleteId(null)}>✕</button>
                                  </>
                                ) : (
                                  <button className="tc-btn-delete" onClick={() => handleDelete(t.id)}>Löschen</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {filteredTeams.length > 0 && (
                  <>
                    <div className="library-section-header">
                      <h3 className="library-section-title">Team-Templates</h3>
                      <span className="team-section-hint">Von deinen Teams — ins Teams-Tab für Verwaltung</span>
                    </div>
                    <div className="template-grid">
                      {filteredTeams.map((t) => {
                        const key = `team:${t.id}`;
                        return (
                          <div
                            key={t.id}
                            className={`template-card team-card ${favorites.includes(key) ? "is-favorite" : ""}`}
                            draggable
                            onDragStart={(e) => onDragStartLibrary(e, key)}
                          >
                            <div className="tc-icon">{t.icon}</div>
                            <div className="tc-name">{t.name}</div>
                            {t.description && <div className="tc-desc">{t.description}</div>}
                            <div className="tc-creator">👤 {t.creator_name}</div>
                            <div className="tc-containers">
                              {t.containers.length} Container: {t.containers.map((c) => c.image).join(", ")}
                            </div>
                            <div className="tc-actions">
                              {favorites.includes(key)
                                ? <button className="tc-btn tc-btn-remove" onClick={() => removeFromFavorites(key)}>✓ In Auswahl</button>
                                : <button className="tc-btn" onClick={() => addToFavorites(key)}>+ Auswahl</button>
                              }
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {filteredPublic.length > 0 && (
                  <>
                    <div className="library-section-header">
                      <h3 className="library-section-title">🌐 Öffentliche Templates</h3>
                      <span className="team-section-hint">Von anderen Benutzern geteilt</span>
                    </div>
                    <div className="template-grid">
                      {filteredPublic.map((t) => {
                        const key = `custom:${t.id}`;
                        return (
                          <div key={t.id} className="template-card" draggable onDragStart={(e) => onDragStartLibrary(e, key)}>
                            <div className="tc-icon">{t.icon}</div>
                            <div className="tc-name">{t.name}</div>
                            {t.description && <div className="tc-desc">{t.description}</div>}
                            <div className="tc-containers">
                              {t.containers.length} Container: {t.containers.map((c) => c.image).join(", ")}
                            </div>
                            <div className="tc-actions">
                              {favorites.includes(key)
                                ? <button className="tc-btn tc-btn-remove" onClick={() => removeFromFavorites(key)}>✓ In Auswahl</button>
                                : <button className="tc-btn" onClick={() => addToFavorites(key)}>+ Auswahl</button>
                              }
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </section>
      </div>

      {showModal && (
        <CreateTemplateModal onCreated={handleCreated} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
