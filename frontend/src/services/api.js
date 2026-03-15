const BASE = import.meta.env.VITE_API_URL || "";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    window.dispatchEvent(new Event("auth:logout"));
  }
  return res;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function register(data) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Registrierung fehlgeschlagen");
  return json;
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Login fehlgeschlagen");
  return json;
}

export async function forgotPassword(email) {
  const res = await fetch(`${BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Senden");
  return json;
}

export async function resetPassword(token, new_password) {
  const res = await fetch(`${BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Zurücksetzen");
  return json;
}

// ── Containers ───────────────────────────────────────────────────────────────

export async function fetchDefaultTemplates() {
  const res = await apiFetch(`${BASE}/api/containers/templates`);
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

export async function fetchTemplateDetails(name) {
  const res = await apiFetch(`${BASE}/api/containers/templates/${name}`);
  if (!res.ok) throw new Error("Failed to fetch template details");
  return res.json();
}

export async function fetchSystemInfo() {
  const res = await apiFetch(`${BASE}/api/containers/system-info`);
  if (!res.ok) throw new Error("Failed to fetch system info");
  return res.json();
}

export async function fetchContainers() {
  const res = await apiFetch(`${BASE}/api/containers/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch containers");
  return res.json();
}

export async function startContainer(template, duration_minutes, config = {}) {
  const res = await apiFetch(`${BASE}/api/containers/start`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ template, duration_minutes, ...config }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to start container");
  }
  return res.json();
}

export async function stopContainer(containerId) {
  const res = await apiFetch(`${BASE}/api/containers/${containerId}/stop`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to stop container");
  return res.json();
}

export async function removeContainer(containerId) {
  const res = await apiFetch(`${BASE}/api/containers/${containerId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove container");
  return res.json();
}

export async function startStoppedContainer(containerId) {
  const res = await apiFetch(`${BASE}/api/containers/${containerId}/start`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to start container");
  return res.json();
}

export async function fetchContainerConfig(containerId) {
  const res = await apiFetch(`${BASE}/api/containers/${containerId}/config`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch container config");
  return res.json();
}

export async function updateContainerConfig(containerId, data) {
  const res = await apiFetch(`${BASE}/api/containers/${containerId}/config`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update container config");
  }
  return res.json();
}

export async function restartContainer(containerId) {
  const res = await apiFetch(`${BASE}/api/containers/${containerId}/restart`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to restart container");
  return res.json();
}

export async function startStack(containers, stackName, duration_minutes) {
  const res = await apiFetch(`${BASE}/api/containers/stacks/start`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ containers, stack_name: stackName, duration_minutes }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to start stack");
  }
  return res.json();
}

export async function fetchStacks() {
  const res = await apiFetch(`${BASE}/api/containers/stacks`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch stacks");
  return res.json();
}

export async function stopStack(stackId) {
  const res = await apiFetch(`${BASE}/api/containers/stacks/${stackId}/stop`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to stop stack");
  return res.json();
}

export async function startStoppedStack(stackId) {
  const res = await apiFetch(`${BASE}/api/containers/stacks/${stackId}/start`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to start stack");
  return res.json();
}

export async function removeStack(stackId) {
  const res = await apiFetch(`${BASE}/api/containers/stacks/${stackId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove stack");
  return res.json();
}

// ── User Templates ────────────────────────────────────────────────────────────

export async function fetchMyTemplates() {
  const res = await apiFetch(`${BASE}/api/user-templates/`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Laden der Templates");
  return json;
}

export async function createTemplate(data) {
  const res = await apiFetch(`${BASE}/api/user-templates/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Erstellen");
  return json;
}

export async function deleteTemplate(id) {
  const res = await apiFetch(`${BASE}/api/user-templates/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Fehler beim Löschen");
  return res.json();
}

export async function fetchFavorites() {
  const res = await apiFetch(`${BASE}/api/user-templates/favorites`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Laden");
  return json;
}

export async function saveFavorites(favorites) {
  const res = await apiFetch(`${BASE}/api/user-templates/favorites`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ favorites }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Speichern");
  return json;
}

// ── Team Templates ───────────────────────────────────────────────────────────

export async function fetchTeamTemplates() {
  const res = await apiFetch(`${BASE}/api/team-templates/`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Laden der Team-Templates");
  return json;
}

export async function createTeamTemplate(teamId, data) {
  const res = await apiFetch(`${BASE}/api/teams/${teamId}/templates`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Erstellen");
  return json;
}

export async function updateTeamTemplate(teamId, tmplId, data) {
  const res = await apiFetch(`${BASE}/api/teams/${teamId}/templates/${tmplId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Aktualisieren");
  return json;
}

export async function deleteTeamTemplate(teamId, tmplId) {
  const res = await apiFetch(`${BASE}/api/teams/${teamId}/templates/${tmplId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.detail || "Fehler beim Löschen");
  }
  return res.json();
}

// ── Teams ─────────────────────────────────────────────────────────────────

export async function fetchMyTeams() {
  const res = await apiFetch(`${BASE}/api/teams/`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Laden");
  return json;
}

export async function createTeam(name) {
  const res = await apiFetch(`${BASE}/api/teams/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Erstellen");
  return json;
}

export async function deleteTeam(teamId) {
  const res = await apiFetch(`${BASE}/api/teams/${teamId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.detail || "Fehler beim Löschen");
  }
  return res.json();
}

export async function fetchTeamMembers(teamId) {
  const res = await apiFetch(`${BASE}/api/teams/${teamId}/members`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Laden");
  return json;
}

export async function addTeamMember(teamId, username) {
  const res = await apiFetch(`${BASE}/api/teams/${teamId}/members`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ username }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Hinzufügen");
  return json;
}

export async function removeTeamMember(teamId, userId) {
  const res = await apiFetch(`${BASE}/api/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.detail || "Fehler beim Entfernen");
  }
  return res.json();
}

export async function fetchTeamScopedTemplates(teamId) {
  const res = await apiFetch(`${BASE}/api/teams/${teamId}/templates`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Laden");
  return json;
}

export async function fetchContainerLogs(containerId, tail = 200) {
  const res = await apiFetch(`${BASE}/api/containers/${containerId}/logs?tail=${tail}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export async function fetchMe() {
  const res = await apiFetch(`${BASE}/api/auth/me`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler");
  return json;
}

export async function updateNotificationPrefs(prefs) {
  const res = await apiFetch(`${BASE}/api/auth/me/notifications`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(prefs),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Speichern");
  return json;
}
