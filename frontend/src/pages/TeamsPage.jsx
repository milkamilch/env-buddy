import { useState, useEffect, useCallback } from "react";
import {
  fetchMyTeams, createTeam, deleteTeam,
  fetchTeamMembers, addTeamMember, removeTeamMember, updateMemberRole,
  fetchTeamScopedTemplates, deleteTeamTemplate,
  createTemplate, fetchFavorites, saveFavorites,
} from "../services/api";
import TeamStackBuilder from "../components/TeamStackBuilder";
import { useToast } from "../components/Toast";
import "./TeamsPage.css";

const ROLE_LABELS = { admin: "Admin", manager: "Manager", member: "Mitglied" };
const ROLE_LEVEL  = { member: 0, manager: 1, admin: 2 };

export default function TeamsPage({ user }) {
  const toast = useToast();
  const [teams, setTeams]               = useState([]);
  const [selectedId, setSelectedId]     = useState(null);
  const [members, setMembers]           = useState([]);
  const [templates, setTemplates]       = useState([]);
  const [loadingTeam, setLoadingTeam]   = useState(false);

  // Create team dialog
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName]       = useState("");
  const [creatingTeam, setCreatingTeam]     = useState(false);

  // Add member
  const [addUsername, setAddUsername]   = useState("");
  const [addingMember, setAddingMember] = useState(false);

  // Template modal
  const [showTmplModal, setShowTmplModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Delete confirmations
  const [confirmDeleteTmpl, setConfirmDeleteTmpl] = useState(null);
  const [confirmDeleteTeam, setConfirmDeleteTeam] = useState(false);

  // Favorites (for Auswahl toggle)
  const [favorites, setFavorites] = useState([]);
  const [copyingTmpl, setCopyingTmpl] = useState(null);

  useEffect(() => {
    fetchFavorites().then(setFavorites).catch(() => {});
  }, []);

  // Load teams on mount
  useEffect(() => {
    fetchMyTeams()
      .then((data) => {
        setTeams(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => {});
  }, []);

  // Load members + templates when selectedId changes
  const loadTeamData = useCallback(async (teamId) => {
    if (!teamId) return;
    setLoadingTeam(true);
    try {
      const [m, t] = await Promise.all([fetchTeamMembers(teamId), fetchTeamScopedTemplates(teamId)]);
      setMembers(m);
      setTemplates(t);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingTeam(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTeamData(selectedId);
  }, [selectedId, loadTeamData]);

  // Eigene Rolle im aktuell gewählten Team
  const myMembership = members.find((m) => m.user_id === user.id);
  const myRole       = myMembership?.role ?? "member";
  const myLevel      = ROLE_LEVEL[myRole] ?? 0;
  const canManage    = myLevel >= 1;  // admin oder manager
  const isAdmin      = myRole === "admin";

  // ── Create team ──────────────────────────────────────────────────────────

  async function handleCreateTeam(e) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreatingTeam(true);
    try {
      const team = await createTeam(newTeamName.trim());
      setTeams((prev) => [...prev, team]);
      setSelectedId(team.id);
      setNewTeamName("");
      setShowCreateTeam(false);
      toast.success(`Team "${team.name}" erstellt`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreatingTeam(false);
    }
  }

  // ── Delete team ──────────────────────────────────────────────────────────

  async function handleDeleteTeam() {
    if (!confirmDeleteTeam) { setConfirmDeleteTeam(true); return; }
    try {
      await deleteTeam(selectedId);
      const remaining = teams.filter((t) => t.id !== selectedId);
      setTeams(remaining);
      setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      setMembers([]);
      setTemplates([]);
      setConfirmDeleteTeam(false);
      toast.success("Team gelöscht");
    } catch (err) {
      toast.error(err.message);
    }
  }

  // ── Members ──────────────────────────────────────────────────────────────

  async function handleAddMember(e) {
    e.preventDefault();
    if (!addUsername.trim() || !selectedId) return;
    setAddingMember(true);
    try {
      const member = await addTeamMember(selectedId, addUsername.trim());
      setMembers((prev) => [...prev, member]);
      setAddUsername("");
      toast.success(`@${member.username} hinzugefügt`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(memberId, username) {
    try {
      await removeTeamMember(selectedId, memberId);
      setMembers((prev) => prev.filter((m) => m.user_id !== memberId));
      toast.info(memberId === user.id ? "Du hast das Team verlassen" : `@${username} entfernt`);
      if (memberId === user.id) {
        const remaining = teams.filter((t) => t.id !== selectedId);
        setTeams(remaining);
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleChangeRole(memberId, newRole) {
    try {
      await updateMemberRole(selectedId, memberId, newRole);
      setMembers((prev) =>
        prev.map((m) => m.user_id === memberId ? { ...m, role: newRole } : m)
      );
      toast.success("Rolle geändert");
    } catch (err) {
      toast.error(err.message);
    }
  }

  // ── Templates ────────────────────────────────────────────────────────────

  async function handleTemplateCreated(tmpl) {
    if (editingTemplate) {
      setTemplates((prev) => prev.map((t) => t.id === tmpl.id ? tmpl : t));
      toast.success(`Template "${tmpl.name}" aktualisiert`);
    } else {
      setTemplates((prev) => [...prev, tmpl]);
      toast.success(`Template "${tmpl.name}" erstellt`);
    }
    setShowTmplModal(false);
    setEditingTemplate(null);
  }

  async function handleDeleteTemplate(tmplId) {
    if (confirmDeleteTmpl !== tmplId) { setConfirmDeleteTmpl(tmplId); return; }
    try {
      await deleteTeamTemplate(selectedId, tmplId);
      setTemplates((prev) => prev.filter((t) => t.id !== tmplId));
      setConfirmDeleteTmpl(null);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleToggleFavorite(t) {
    const key = `team:${t.id}`;
    const next = favorites.includes(key)
      ? favorites.filter((k) => k !== key)
      : [...favorites, key];
    setFavorites(next);
    try {
      await saveFavorites(next);
    } catch (err) {
      setFavorites(favorites);
      toast.error(err.message);
    }
  }

  async function handleCopyTemplate(t) {
    setCopyingTmpl(t.id);
    try {
      await createTemplate({
        name: t.name,
        description: t.description || "",
        icon: t.icon,
        containers: t.containers,
      });
      toast.success(`"${t.name}" als eigenes Template gespeichert`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCopyingTmpl(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="teams-page">
      {/* Header */}
      <div className="teams-header">
        <div>
          <h2>Teams</h2>
          <p className="teams-sub">Verwalte dein Team und teile Templates mit anderen.</p>
        </div>
        <button className="btn-create-team" onClick={() => setShowCreateTeam(true)}>
          + Neues Team
        </button>
      </div>

      {/* Team selector */}
      {teams.length > 0 && (
        <div className="team-selector-bar">
          <div className="team-selector-left">
            <label className="team-selector-label">Team:</label>
            <select
              className="team-dropdown"
              value={selectedId || ""}
              onChange={(e) => { setSelectedId(Number(e.target.value)); setConfirmDeleteTeam(false); }}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.member_count} {t.member_count === 1 ? "Mitglied" : "Mitglieder"})
                </option>
              ))}
            </select>
            {myRole && <span className={`my-role-badge role-${myRole}`}>{ROLE_LABELS[myRole]}</span>}
          </div>
          {isAdmin && (
            confirmDeleteTeam ? (
              <div className="delete-team-confirm">
                <span>Wirklich löschen?</span>
                <button className="btn-confirm-yes-sm" onClick={handleDeleteTeam}>Ja, löschen</button>
                <button className="btn-confirm-no-sm" onClick={() => setConfirmDeleteTeam(false)}>Abbrechen</button>
              </div>
            ) : (
              <button className="btn-delete-team" onClick={handleDeleteTeam} title="Team löschen">
                🗑 Team löschen
              </button>
            )
          )}
        </div>
      )}

      {/* No teams empty state */}
      {teams.length === 0 && (
        <div className="teams-empty">
          <span className="teams-empty-icon">👥</span>
          <p className="teams-empty-title">Noch kein Team</p>
          <p className="teams-empty-sub">Erstelle dein erstes Team und lade Kollegen ein.</p>
          <button className="btn-create-team" onClick={() => setShowCreateTeam(true)}>
            + Neues Team erstellen
          </button>
        </div>
      )}

      {/* Team body */}
      {selectedId && (
        <div className="team-body">
          {loadingTeam ? (
            <div className="team-loading"><span className="loading-spinner" /></div>
          ) : (
            <>
              {/* Members panel */}
              <aside className="team-members-panel">
                <div className="panel-header">
                  <span className="panel-title">Mitglieder</span>
                  <span className="panel-count">{members.length}</span>
                </div>

                <div className="members-list">
                  {members.map((m) => {
                    // Kann actor die Rolle dieses Mitglieds ändern?
                    const canChangeRole =
                      canManage &&
                      m.user_id !== user.id &&
                      !(myRole === "manager" && m.role === "admin");
                    // Kann actor dieses Mitglied entfernen?
                    const canRemove =
                      m.user_id === user.id
                        ? m.role !== "admin"   // selbst verlassen (nicht als admin)
                        : canManage && !(myRole === "manager" && m.role === "admin");

                    return (
                      <div key={m.user_id} className="member-row">
                        <div className="member-avatar" style={{ background: avatarBg(m.username), color: avatarColor(m.username) }}>
                          {(m.first_name[0] + m.last_name[0]).toUpperCase()}
                        </div>
                        <div className="member-info">
                          <span className="member-name">{m.first_name} {m.last_name}</span>
                          <span className="member-handle">@{m.username}</span>
                        </div>

                        {canChangeRole ? (
                          <select
                            className={`member-role-select role-${m.role}`}
                            value={m.role}
                            onChange={(e) => handleChangeRole(m.user_id, e.target.value)}
                            title="Rolle ändern"
                          >
                            <option value="member">Mitglied</option>
                            <option value="manager">Manager</option>
                            {isAdmin && <option value="admin">Admin</option>}
                          </select>
                        ) : (
                          <span className={`member-role role-${m.role}`}>{ROLE_LABELS[m.role] ?? m.role}</span>
                        )}

                        {canRemove && (
                          <button
                            className="btn-remove-member"
                            onClick={() => handleRemoveMember(m.user_id, m.username)}
                            title={m.user_id === user.id ? "Team verlassen" : "Entfernen"}
                          >
                            {m.user_id === user.id ? "Verlassen" : "✕"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {canManage && (
                  <form className="add-member-form" onSubmit={handleAddMember}>
                    <input
                      className="add-member-input"
                      type="text"
                      placeholder="Benutzername..."
                      value={addUsername}
                      onChange={(e) => setAddUsername(e.target.value)}
                    />
                    <button type="submit" className="btn-add-member" disabled={addingMember || !addUsername.trim()}>
                      {addingMember ? "…" : "+ Hinzufügen"}
                    </button>
                  </form>
                )}
              </aside>

              {/* Templates panel */}
              <section className="team-templates-panel">
                <div className="panel-header">
                  <span className="panel-title">Team-Templates</span>
                  <span className="panel-count">{templates.length}</span>
                  <button className="btn-add-template" onClick={() => setShowTmplModal(true)}>
                    + Template
                  </button>
                </div>

                {templates.length === 0 ? (
                  <div className="templates-empty">
                    <p>Noch keine Templates für dieses Team.</p>
                    <button className="btn-add-template" onClick={() => setShowTmplModal(true)}>
                      + Erstes Template erstellen
                    </button>
                  </div>
                ) : (
                  <div className="team-templates-grid">
                    {templates.map((t) => {
                      const canEdit = t.created_by === user.id || canManage;
                      return (
                        <div key={t.id} className="team-tmpl-card">
                          <div className="ttc-icon">{t.icon}</div>
                          <div className="ttc-name">{t.name}</div>
                          {t.description && <div className="ttc-desc">{t.description}</div>}
                          <div className="ttc-creator">👤 {t.creator_name}</div>
                          <div className="ttc-containers">
                            {t.containers.length} Container: {t.containers.map((c) => c.image).join(", ")}
                          </div>
                          <div className="ttc-actions">
                            {confirmDeleteTmpl === t.id ? (
                              <>
                                <span className="tc-confirm-label">Sicher?</span>
                                <button className="tc-btn-confirm-yes" onClick={() => handleDeleteTemplate(t.id)}>✓</button>
                                <button className="tc-btn-confirm-no" onClick={() => setConfirmDeleteTmpl(null)}>✕</button>
                              </>
                            ) : (
                              <>
                                {favorites.includes(`team:${t.id}`) ? (
                                  <button className="ttc-btn-fav ttc-btn-fav-active" onClick={() => handleToggleFavorite(t)}>
                                    ✓ In Auswahl
                                  </button>
                                ) : (
                                  <button className="ttc-btn-fav" onClick={() => handleToggleFavorite(t)}>
                                    + Auswahl
                                  </button>
                                )}
                                <button
                                  className="ttc-btn-copy"
                                  onClick={() => handleCopyTemplate(t)}
                                  disabled={copyingTmpl === t.id}
                                >
                                  {copyingTmpl === t.id ? "…" : "Lokal kopieren"}
                                </button>
                                {canEdit && (
                                  <>
                                    <button className="ttc-btn-edit" onClick={() => { setEditingTemplate(t); setShowTmplModal(true); }}>
                                      Bearbeiten
                                    </button>
                                    <button className="ttc-btn-delete" onClick={() => handleDeleteTemplate(t.id)}>
                                      Löschen
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {/* Create team dialog */}
      {showCreateTeam && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateTeam(false)}>
          <div className="modal-box" style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <span className="modal-title">Neues Team erstellen</span>
              <button className="modal-close" onClick={() => setShowCreateTeam(false)}>✕</button>
            </div>
            <form className="modal-body" onSubmit={handleCreateTeam}>
              <label style={{ fontSize: "0.85rem", color: "var(--subtext0)", display: "block", marginBottom: "0.35rem" }}>
                Team-Name
              </label>
              <input
                className="create-team-input"
                type="text"
                placeholder="z.B. Backend-Team"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                autoFocus
              />
              <div className="modal-footer">
                <button type="button" className="modal-btn-cancel" onClick={() => setShowCreateTeam(false)}>
                  Abbrechen
                </button>
                <button type="submit" className="modal-btn-save" disabled={creatingTeam || !newTeamName.trim()}>
                  {creatingTeam ? "Erstellt…" : "Team erstellen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team stack builder */}
      {showTmplModal && (
        <TeamStackBuilder
          teamId={selectedId}
          onCreated={handleTemplateCreated}
          onClose={() => { setShowTmplModal(false); setEditingTemplate(null); }}
          initialTemplate={editingTemplate}
        />
      )}
    </div>
  );
}

// ── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#e85d2a", "#2f6df0", "#1f9d57", "#7a5ae0", "#c97c12", "#cc3b2e"];
function _hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return h;
}
function avatarColor(username) { return AVATAR_COLORS[_hash(username) % AVATAR_COLORS.length]; }
function avatarBg(username) { return avatarColor(username) + "22"; }
