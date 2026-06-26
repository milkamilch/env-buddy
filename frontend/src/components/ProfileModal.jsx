import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe, updateNotificationPrefs, updateProfile, sendTestNotification, uploadAvatar, fetchApiKeys, createApiKey, revokeApiKey, fetchSnapshots, deleteSnapshot, fetchWorkflowExample } from "../services/api";
import "./ProfileModal.css";

const BASE = import.meta.env.VITE_API_URL || "";

const PREFS = [
  { key: "notify_on_start",   label: "E-Mail bei Container-Start",              desc: "Wenn du einen Container oder Stack startest" },
  { key: "notify_on_stop",    label: "E-Mail bei automatischem Stop",            desc: "Wenn ein Container durch den Timer gestoppt wird" },
  { key: "notify_on_warning", label: "Warnung 5 Min. vor Ablauf",                desc: "5 Minuten bevor ein Container automatisch stoppt" },
  { key: "allow_invitations", label: "Team-Einladungen erlauben",                desc: "Andere können dich in ihre Teams einladen" },
];

export default function ProfileModal({ user, onClose, onUpdate }) {
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [prefs, setPrefs] = useState({
    notify_on_start:   user.notify_on_start   ?? true,
    notify_on_stop:    user.notify_on_stop    ?? true,
    notify_on_warning: user.notify_on_warning ?? true,
    theme:             user.theme ?? "dark",
    webhook_url:       user.webhook_url ?? "",
    allow_invitations: user.allow_invitations ?? true,
  });
  const [editProfile, setEditProfile] = useState({
    first_name: user.first_name || "",
    last_name:  user.last_name  || "",
    username:   user.username   || "",
    email:      user.email      || "",
    new_password: "",
    bio:        user.bio || "",
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved,  setProfileSaved]  = useState(false);
  const [profileError,  setProfileError]  = useState(null);
  const profileTimerRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult]   = useState(null);

  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState(null);
  const [keyCreating, setKeyCreating] = useState(false);

  const [snapshots, setSnapshots] = useState([]);
  const [workflowYaml, setWorkflowYaml] = useState(null);

  const saveTimerRef = useRef(null);
  const testTimerRef = useRef(null);

  useEffect(() => {
    fetchApiKeys().then(setApiKeys).catch(() => {});
    fetchSnapshots().then(setSnapshots).catch(() => {});
    fetchWorkflowExample().then((r) => setWorkflowYaml(r.yaml)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchMe().then((me) => setPrefs({
      notify_on_start:   me.notify_on_start,
      notify_on_stop:    me.notify_on_stop,
      notify_on_warning: me.notify_on_warning,
      theme:             me.theme ?? "dark",
      webhook_url:       me.webhook_url ?? "",
      allow_invitations: me.allow_invitations ?? true,
    })).catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current);
      clearTimeout(testTimerRef.current);
      clearTimeout(profileTimerRef.current);
    };
  }, []);

  async function handleProfileSave() {
    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      const payload = {
        first_name: editProfile.first_name || undefined,
        last_name:  editProfile.last_name  || undefined,
        username:   editProfile.username   || undefined,
        email:      editProfile.email      || undefined,
        new_password: editProfile.new_password || undefined,
        bio:        editProfile.bio !== undefined ? editProfile.bio : undefined,
      };
      const updated = await updateProfile(payload);
      onUpdate(updated);
      setProfileSaved(true);
      setEditProfile((p) => ({ ...p, new_password: "" }));
      profileTimerRef.current = setTimeout(() => setProfileSaved(false), 2000);
    } catch (e) {
      setProfileError(e.message);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const updated = await uploadAvatar(file);
      onUpdate(updated);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleTestEmail() {
    setTestSending(true);
    setTestResult(null);
    try {
      await sendTestNotification();
      setTestResult("ok");
      testTimerRef.current = setTimeout(() => setTestResult(null), 4000);
    } catch (e) {
      setTestResult("error: " + e.message);
    } finally {
      setTestSending(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateNotificationPrefs(prefs);
      onUpdate(updated);
      setSaved(true);
      saveTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Profil</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="profile-section-label">Profilbild</div>
          <div className="avatar-section">
            <div className="avatar-preview" onClick={() => avatarInputRef.current?.click()} title="Klicken zum Ändern">
              {user.avatar_url ? (
                <img src={`${BASE}${user.avatar_url}`} alt="Avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {(user.first_name?.[0] || user.username?.[0] || "?").toUpperCase()}
                </div>
              )}
              <div className="avatar-overlay">{avatarUploading ? "…" : "✎"}</div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarUpload}
            />
            <span className="avatar-hint">JPG, PNG, GIF — max. 5 MB</span>
          </div>

          <div className="profile-section-label" style={{ marginTop: "1rem" }}>Konto</div>
          <div className="profile-edit-grid">
            <label className="profile-edit-label">Vorname</label>
            <input className="profile-edit-input" value={editProfile.first_name}
              onChange={(e) => setEditProfile((p) => ({ ...p, first_name: e.target.value }))} />
            <label className="profile-edit-label">Nachname</label>
            <input className="profile-edit-input" value={editProfile.last_name}
              onChange={(e) => setEditProfile((p) => ({ ...p, last_name: e.target.value }))} />
            <label className="profile-edit-label">Benutzername</label>
            <input className="profile-edit-input" value={editProfile.username}
              onChange={(e) => setEditProfile((p) => ({ ...p, username: e.target.value }))} />
            <label className="profile-edit-label">E-Mail</label>
            <input className="profile-edit-input" type="email" value={editProfile.email}
              onChange={(e) => setEditProfile((p) => ({ ...p, email: e.target.value }))} />
            <label className="profile-edit-label">Neues Passwort</label>
            <input className="profile-edit-input" type="password" placeholder="Leer lassen = unverändert"
              value={editProfile.new_password}
              onChange={(e) => setEditProfile((p) => ({ ...p, new_password: e.target.value }))} />
            <label className="profile-edit-label">Bio</label>
            <textarea className="profile-edit-input profile-bio" rows={3} placeholder="Kurze Beschreibung (optional)"
              value={editProfile.bio}
              onChange={(e) => setEditProfile((p) => ({ ...p, bio: e.target.value }))} />
          </div>
          {profileError && <p className="modal-error">{profileError}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button className="modal-btn-save" onClick={handleProfileSave} disabled={profileSaving}>
              {profileSaving ? "Speichert…" : profileSaved ? "✓ Gespeichert" : "Profil speichern"}
            </button>
          </div>

          <div className="profile-section-label" style={{ marginTop: "1.25rem" }}>Darstellung</div>
          <div className="theme-toggle-row">
            <button
              className={`theme-btn ${prefs.theme === "dark" ? "active" : ""}`}
              onClick={() => setPrefs((p) => ({ ...p, theme: "dark" }))}
            >
              🌙 Dark
            </button>
            <button
              className={`theme-btn ${prefs.theme === "light" ? "active" : ""}`}
              onClick={() => setPrefs((p) => ({ ...p, theme: "light" }))}
            >
              ☀️ Light
            </button>
          </div>

          <div className="profile-section-label" style={{ marginTop: "1.25rem" }}>E-Mail-Benachrichtigungen</div>

          <div className="profile-prefs">
            {PREFS.map(({ key, label, desc }) => (
              <label key={key} className="pref-row">
                <div className="pref-text">
                  <span className="pref-label">{label}</span>
                  <span className="pref-desc">{desc}</span>
                </div>
                <div
                  className={`toggle ${prefs[key] ? "toggle-on" : ""}`}
                  onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                >
                  <div className="toggle-thumb" />
                </div>
              </label>
            ))}
          </div>

          <div className="profile-section-label" style={{ marginTop: "1.25rem" }}>Webhook</div>
          <input
            className="profile-edit-input"
            type="url"
            placeholder="https://example.com/webhook (optional)"
            value={prefs.webhook_url}
            onChange={(e) => setPrefs((p) => ({ ...p, webhook_url: e.target.value }))}
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
          <p style={{ fontSize: "0.78rem", color: "var(--subtext0)", margin: "0 0 0.75rem" }}>
            POST-Request bei container.started / container.stopped / container.auto_stopped
          </p>

          <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--ink)",
                cursor: testSending ? "not-allowed" : "pointer",
                fontSize: "0.8rem",
              }}
              onClick={handleTestEmail}
              disabled={testSending}
            >
              {testSending ? "Sendet…" : "Test-E-Mail senden"}
            </button>
            {testResult === "ok" && (
              <span style={{ color: "var(--run)", fontSize: "0.8rem" }}>✓ Gesendet!</span>
            )}
            {testResult && testResult !== "ok" && (
              <span style={{ color: "var(--stop)", fontSize: "0.8rem" }}>{testResult}</span>
            )}
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="profile-section-label" style={{ marginTop: "1.25rem" }}>API-Keys</div>
          <p style={{ fontSize: "0.78rem", color: "var(--subtext0)", margin: "0 0 0.75rem" }}>
            Für CI/CD und externe Skripte. Nur beim Erstellen sichtbar.
          </p>
          {apiKeys.map((k) => (
            <div key={k.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <code style={{ fontSize: "0.8rem", flex: 1, color: "var(--subtext1)" }}>{k.key_prefix}…</code>
              <span style={{ fontSize: "0.78rem", color: "var(--subtext0)" }}>{k.name}</span>
              <button
                style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "0.35rem", border: "1px solid var(--border)", background: "transparent", color: "var(--stop)", cursor: "pointer" }}
                onClick={async () => {
                  await revokeApiKey(k.id).catch(() => {});
                  setApiKeys((prev) => prev.filter((x) => x.id !== k.id));
                }}
              >
                Widerrufen
              </button>
            </div>
          ))}
          {createdKey && (
            <div style={{ background: "var(--surface1)", border: "1px solid var(--run)", borderRadius: "0.5rem", padding: "0.75rem", marginBottom: "0.5rem" }}>
              <p style={{ fontSize: "0.78rem", color: "var(--run)", margin: "0 0 0.4rem" }}>Kopiere den Key jetzt — er wird nicht mehr angezeigt:</p>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <code style={{ fontSize: "0.8rem", flex: 1, wordBreak: "break-all" }}>{createdKey}</code>
                <button
                  style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "0.35rem", border: "1px solid var(--border)", background: "transparent", color: "var(--text-primary)", cursor: "pointer" }}
                  onClick={() => { navigator.clipboard.writeText(createdKey); }}
                >
                  ⧉
                </button>
              </div>
              <button style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "var(--subtext0)", background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => setCreatedKey(null)}>Schließen</button>
            </div>
          )}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <input
              className="profile-edit-input"
              style={{ flex: 1 }}
              placeholder="Key-Name (z.B. GitHub CI)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newKeyName.trim() && !keyCreating && document.getElementById("create-key-btn").click()}
            />
            <button
              id="create-key-btn"
              className="modal-btn-save"
              disabled={!newKeyName.trim() || keyCreating || apiKeys.length >= 10}
              onClick={async () => {
                setKeyCreating(true);
                try {
                  const k = await createApiKey(newKeyName.trim());
                  setApiKeys((prev) => [...prev, k]);
                  setCreatedKey(k.raw_key);
                  setNewKeyName("");
                } catch (e) {
                  setError(e.message);
                } finally {
                  setKeyCreating(false);
                }
              }}
            >
              {keyCreating ? "…" : "Erstellen"}
            </button>
          </div>

          {workflowYaml && (
            <>
              <div className="profile-section-label" style={{ marginTop: "1.25rem" }}>GitHub Actions Beispiel</div>
              <pre style={{ fontSize: "0.72rem", background: "var(--surface1)", borderRadius: "0.5rem", padding: "0.75rem", overflowX: "auto", maxHeight: "14rem", color: "var(--subtext1)", margin: 0 }}>{workflowYaml}</pre>
            </>
          )}

          <div className="profile-section-label" style={{ marginTop: "1.25rem" }}>Snapshots</div>
          <p style={{ fontSize: "0.78rem", color: "var(--subtext0)", margin: "0 0 0.75rem" }}>
            Gespeicherte Konfigurationen für schnellen Re-Start.
          </p>
          {snapshots.length === 0 ? (
            <p style={{ fontSize: "0.82rem", color: "var(--subtext0)" }}>Keine Snapshots. Nutze 📷 auf einem Container um einen zu speichern.</p>
          ) : (
            snapshots.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <span style={{ flex: 1, fontSize: "0.85rem" }}>{s.name}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--subtext0)" }}>{new Date(s.created_at).toLocaleDateString()}</span>
                <button
                  style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "0.35rem", border: "1px solid var(--info)", background: "transparent", color: "var(--info)", cursor: "pointer" }}
                  onClick={() => {
                    const encoded = btoa(JSON.stringify(s.config));
                    navigate(`/dashboard?start=${encoded}`);
                    onClose();
                  }}
                >
                  ▶ Starten
                </button>
                <button
                  style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "0.35rem", border: "1px solid var(--border)", background: "transparent", color: "var(--stop)", cursor: "pointer" }}
                  onClick={async () => {
                    await deleteSnapshot(s.id).catch(() => {});
                    setSnapshots((prev) => prev.filter((x) => x.id !== s.id));
                  }}
                >
                  Löschen
                </button>
              </div>
            ))
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>Schließen</button>
          <button className="modal-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? "Speichert…" : saved ? "✓ Gespeichert" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
