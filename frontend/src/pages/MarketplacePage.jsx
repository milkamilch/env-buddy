import { useState, useEffect, useRef } from "react";
import {
  fetchMarketplace, fetchMarketplaceTemplate, publishTemplate,
  deleteMarketplaceTemplate, rateMarketplaceTemplate,
  fetchMarketplaceComments, addMarketplaceComment, deleteMarketplaceComment,
  fetchMarketplaceImages, uploadMarketplaceImage, deleteMarketplaceImage,
  importMarketplaceTemplate, fetchMyTemplates,
} from "../services/api";
import { useToast } from "../components/Toast";
import "./MarketplacePage.css";

function Stars({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`star ${n <= (hovered || value) ? "star-filled" : ""}`}
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{ cursor: onChange ? "pointer" : "default" }}
        >★</span>
      ))}
    </span>
  );
}

function TemplateCard({ tmpl, onOpen, user }) {
  return (
    <div className="mp-card" onClick={() => onOpen(tmpl)}>
      <div className="mp-card-header">
        <span className="mp-icon">{tmpl.icon}</span>
        <div className="mp-card-info">
          <span className="mp-name">{tmpl.name}</span>
          <span className="mp-publisher">von {tmpl.publisher_name}</span>
        </div>
        {user?.id === tmpl.user_id && <span className="mp-own-badge">Mein Template</span>}
      </div>
      {tmpl.description && <p className="mp-desc">{tmpl.description}</p>}
      <div className="mp-tags">
        {tmpl.tags.map((t) => <span key={t} className="mp-tag">{t}</span>)}
      </div>
      <div className="mp-card-footer">
        <Stars value={Math.round(tmpl.avg_rating)} />
        <span className="mp-rating-num">{tmpl.avg_rating > 0 ? tmpl.avg_rating.toFixed(1) : "–"}</span>
        <span className="mp-separator">·</span>
        <span className="mp-stat">⬇ {tmpl.download_count}</span>
        <span className="mp-separator">·</span>
        <span className="mp-stat">🐳 {tmpl.containers.length} Container</span>
      </div>
    </div>
  );
}

function DetailModal({ tmpl, user, onClose, onImported, onDeleted }) {
  const toast = useToast();
  const [detail, setDetail] = useState(tmpl);
  const [comments, setComments] = useState([]);
  const [images, setImages] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    fetchMarketplaceTemplate(tmpl.id).then(setDetail).catch(() => {});
    fetchMarketplaceComments(tmpl.id).then(setComments).catch(() => {});
    fetchMarketplaceImages(tmpl.id).then(setImages).catch(() => {});
  }, [tmpl.id]);

  async function handleRate(n) {
    try {
      await rateMarketplaceTemplate(tmpl.id, n);
      setMyRating(n);
      const updated = await fetchMarketplaceTemplate(tmpl.id);
      setDetail(updated);
      toast.success("Bewertung gespeichert");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleComment() {
    if (!commentText.trim()) return;
    try {
      const c = await addMarketplaceComment(tmpl.id, commentText);
      setComments((prev) => [...prev, c]);
      setCommentText("");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await deleteMarketplaceComment(tmpl.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const img = await uploadMarketplaceImage(tmpl.id, file);
      setImages((prev) => [...prev, img]);
      toast.success("Bild hochgeladen");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(imageId) {
    try {
      await deleteMarketplaceImage(tmpl.id, imageId);
      setImages((prev) => prev.filter((i) => i.id !== imageId));
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleImport() {
    try {
      await importMarketplaceTemplate(tmpl.id);
      toast.success("Template in deine Templates importiert");
      onImported?.();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleDelete() {
    if (!confirm(`Template "${detail.name}" wirklich löschen?`)) return;
    try {
      await deleteMarketplaceTemplate(tmpl.id);
      toast.success("Template gelöscht");
      onDeleted?.(tmpl.id);
      onClose();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const BASE = import.meta.env.VITE_API_URL || "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="mp-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="mp-detail-header">
          <span className="mp-icon mp-icon-lg">{detail.icon}</span>
          <div>
            <h2 className="mp-detail-title">{detail.name}</h2>
            <span className="mp-publisher">von {detail.publisher_name}</span>
          </div>
          <div className="mp-detail-actions">
            {user && user.id !== detail.user_id && (
              <button className="btn-import" onClick={handleImport}>⬇ Importieren</button>
            )}
            {user && user.id === detail.user_id && (
              <button className="btn-delete-tmpl" onClick={handleDelete}>Löschen</button>
            )}
          </div>
        </div>

        <div className="mp-detail-meta">
          <Stars value={Math.round(detail.avg_rating)} />
          <span className="mp-rating-num">{detail.avg_rating > 0 ? detail.avg_rating.toFixed(1) : "–"} ({detail.rating_count})</span>
          <span className="mp-separator">·</span>
          <span className="mp-stat">⬇ {detail.download_count} Downloads</span>
          {detail.tags.length > 0 && (
            <>
              <span className="mp-separator">·</span>
              {detail.tags.map((t) => <span key={t} className="mp-tag">{t}</span>)}
            </>
          )}
        </div>

        {detail.description && <p className="mp-detail-desc">{detail.description}</p>}

        {/* Containers */}
        <div className="mp-section">
          <h3>🐳 Container ({detail.containers.length})</h3>
          <div className="mp-container-list">
            {detail.containers.map((c, i) => (
              <div key={i} className="mp-container-item">
                <span className="mp-container-name">{c.service_name}</span>
                <code className="mp-container-image">{c.image}</code>
                <span className="mp-container-port">:{c.internal_port}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bewertung */}
        {user && user.id !== detail.user_id && (
          <div className="mp-section">
            <h3>⭐ Bewerten</h3>
            <Stars value={myRating} onChange={handleRate} />
          </div>
        )}

        {/* Bilder */}
        <div className="mp-section">
          <div className="mp-section-header">
            <h3>🖼 Bilder ({images.length})</h3>
            {user && (
              <>
                <button className="btn-upload" onClick={() => fileRef.current.click()} disabled={uploading}>
                  {uploading ? "Lädt…" : "+ Bild hochladen"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
              </>
            )}
          </div>
          {images.length > 0 ? (
            <div className="mp-images">
              {images.map((img) => (
                <div key={img.id} className="mp-image-wrap">
                  <img
                    src={`${BASE}${img.url}`}
                    alt=""
                    className="mp-image"
                    onClick={() => setLightbox(`${BASE}${img.url}`)}
                  />
                  {user && user.id === img.user_id && (
                    <button className="btn-delete-img" onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mp-empty-hint">Noch keine Bilder</p>
          )}
          {lightbox && (
            <div className="mp-lightbox" onClick={() => setLightbox(null)}>
              <img src={lightbox} alt="" className="mp-lightbox-img" />
            </div>
          )}
        </div>

        {/* Kommentare */}
        <div className="mp-section">
          <h3>💬 Kommentare ({comments.length})</h3>
          <div className="mp-comments">
            {comments.length === 0 && <p className="mp-empty-hint">Noch keine Kommentare</p>}
            {comments.map((c) => (
              <div key={c.id} className="mp-comment">
                <div className="mp-comment-meta">
                  <span className="mp-comment-user">@{c.username}</span>
                  <span className="mp-comment-date">{new Date(c.created_at).toLocaleDateString("de-DE")}</span>
                  {user && user.id === c.user_id && (
                    <button className="btn-delete-comment" onClick={() => handleDeleteComment(c.id)}>✕</button>
                  )}
                </div>
                <p className="mp-comment-text">{c.content}</p>
              </div>
            ))}
          </div>
          {user && (
            <div className="mp-comment-form">
              <textarea
                className="mp-comment-input"
                placeholder="Kommentar schreiben…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
              />
              <button className="btn-comment" onClick={handleComment} disabled={!commentText.trim()}>
                Senden
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PublishModal({ onClose, onPublished }) {
  const toast = useToast();
  const [myTemplates, setMyTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📦");
  const [tagsInput, setTagsInput] = useState("");
  const [containers, setContainers] = useState([{ service_name: "", image: "", internal_port: 3000, env: {} }]);

  useEffect(() => {
    fetchMyTemplates().then(setMyTemplates).catch(() => {});
  }, []);

  function loadFromTemplate(id) {
    const t = myTemplates.find((t) => t.id === Number(id));
    if (!t) return;
    setSelectedId(id);
    setName(t.name);
    setDescription(t.description || "");
    setIcon(t.icon || "📦");
    setContainers(t.containers.map((c) => ({ ...c })));
  }

  async function handleSubmit() {
    if (!name.trim()) return toast.error("Name erforderlich");
    if (!containers.length) return toast.error("Mindestens ein Container erforderlich");
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      const result = await publishTemplate({ name, description, icon, containers, tags });
      toast.success("Template veröffentlicht!");
      onPublished(result);
      onClose();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="mp-publish-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>Template veröffentlichen</h2>

        {myTemplates.length > 0 && (
          <div className="mp-field">
            <label>Aus eigenen Templates übernehmen</label>
            <select value={selectedId || ""} onChange={(e) => loadFromTemplate(e.target.value)} className="mp-select">
              <option value="">— Vorlage wählen —</option>
              {myTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mp-field-row">
          <div className="mp-field" style={{ flex: 1 }}>
            <label>Name *</label>
            <input className="mp-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Postgres + Redis Stack" />
          </div>
          <div className="mp-field" style={{ width: "80px" }}>
            <label>Icon</label>
            <input className="mp-input" value={icon} onChange={(e) => setIcon(e.target.value)} />
          </div>
        </div>

        <div className="mp-field">
          <label>Beschreibung</label>
          <textarea className="mp-input" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Wofür ist dieses Template?" />
        </div>

        <div className="mp-field">
          <label>Tags (kommagetrennt)</label>
          <input className="mp-input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="database, postgres, backend" />
        </div>

        <div className="mp-field">
          <div className="mp-section-header">
            <label>Container</label>
            <button className="btn-add-container" onClick={() =>
              setContainers((prev) => [...prev, { service_name: "", image: "", internal_port: 3000, env: {} }])
            }>+ Hinzufügen</button>
          </div>
          {containers.map((c, i) => (
            <div key={i} className="mp-container-editor">
              <input className="mp-input" placeholder="Service-Name" value={c.service_name}
                onChange={(e) => setContainers((prev) => prev.map((x, j) => j === i ? { ...x, service_name: e.target.value } : x))} />
              <input className="mp-input" placeholder="Image (z.B. postgres:15)" value={c.image}
                onChange={(e) => setContainers((prev) => prev.map((x, j) => j === i ? { ...x, image: e.target.value } : x))} />
              <input className="mp-input mp-input-port" type="number" placeholder="Port" value={c.internal_port}
                onChange={(e) => setContainers((prev) => prev.map((x, j) => j === i ? { ...x, internal_port: Number(e.target.value) } : x))} />
              {containers.length > 1 && (
                <button className="btn-remove-container" onClick={() =>
                  setContainers((prev) => prev.filter((_, j) => j !== i))
                }>✕</button>
              )}
            </div>
          ))}
        </div>

        <div className="mp-publish-footer">
          <button className="btn-cancel" onClick={onClose}>Abbrechen</button>
          <button className="btn-publish" onClick={handleSubmit}>Veröffentlichen</button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage({ user }) {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedTmpl, setSelectedTmpl] = useState(null);
  const [showPublish, setShowPublish] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchMarketplace({ search, sort });
      setTemplates(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [sort]);

  function handleSearch(e) {
    e.preventDefault();
    load();
  }

  return (
    <div className="mp-page">
      <div className="mp-header">
        <div>
          <h2>Marketplace</h2>
          <p className="mp-sub">Community-Templates entdecken, bewerten und importieren</p>
        </div>
        {user && (
          <button className="btn-publish-open" onClick={() => setShowPublish(true)}>
            + Template veröffentlichen
          </button>
        )}
      </div>

      <div className="mp-controls">
        <form onSubmit={handleSearch} className="mp-search-form">
          <input
            className="mp-search-input"
            placeholder="Templates suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-search">Suchen</button>
        </form>
        <div className="mp-sort">
          <span>Sortieren:</span>
          {["newest", "rating", "downloads"].map((s) => (
            <button
              key={s}
              className={`btn-sort ${sort === s ? "active" : ""}`}
              onClick={() => setSort(s)}
            >
              {s === "newest" ? "Neueste" : s === "rating" ? "Bewertung" : "Downloads"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mp-loading">Lädt…</div>
      ) : templates.length === 0 ? (
        <div className="mp-empty">
          <p>Noch keine Templates vorhanden.</p>
          {user && <button className="btn-publish-open" onClick={() => setShowPublish(true)}>Erstes Template veröffentlichen</button>}
        </div>
      ) : (
        <div className="mp-grid">
          {templates.map((t) => (
            <TemplateCard key={t.id} tmpl={t} user={user} onOpen={setSelectedTmpl} />
          ))}
        </div>
      )}

      {selectedTmpl && (
        <DetailModal
          tmpl={selectedTmpl}
          user={user}
          onClose={() => setSelectedTmpl(null)}
          onImported={load}
          onDeleted={(id) => {
            setTemplates((prev) => prev.filter((t) => t.id !== id));
            setSelectedTmpl(null);
          }}
        />
      )}

      {showPublish && (
        <PublishModal
          onClose={() => setShowPublish(false)}
          onPublished={(t) => setTemplates((prev) => [t, ...prev])}
        />
      )}
    </div>
  );
}
