const BASE = "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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
  const res = await fetch(`${BASE}/api/containers/templates`);
  if (!res.ok) throw new Error("Failed to fetch templates");
  return res.json();
}

export async function fetchContainers() {
  const res = await fetch(`${BASE}/api/containers/`);
  if (!res.ok) throw new Error("Failed to fetch containers");
  return res.json();
}

export async function startContainer(template, duration_minutes) {
  const res = await fetch(`${BASE}/api/containers/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template, duration_minutes }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to start container");
  }
  return res.json();
}

export async function stopContainer(containerId) {
  const res = await fetch(`${BASE}/api/containers/${containerId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to stop container");
  return res.json();
}

export async function restartContainer(containerId) {
  const res = await fetch(`${BASE}/api/containers/${containerId}/restart`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to restart container");
  return res.json();
}

export async function startStack(templates, stackName, duration_minutes) {
  const res = await fetch(`${BASE}/api/containers/stacks/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templates, stack_name: stackName, duration_minutes }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to start stack");
  }
  return res.json();
}

export async function fetchStacks() {
  const res = await fetch(`${BASE}/api/containers/stacks`);
  if (!res.ok) throw new Error("Failed to fetch stacks");
  return res.json();
}

export async function stopStack(stackId) {
  const res = await fetch(`${BASE}/api/containers/stacks/${stackId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to stop stack");
  return res.json();
}

// ── User Templates ────────────────────────────────────────────────────────────

export async function fetchMyTemplates() {
  const res = await fetch(`${BASE}/api/user-templates/`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Laden der Templates");
  return json;
}

export async function createTemplate(data) {
  const res = await fetch(`${BASE}/api/user-templates/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Erstellen");
  return json;
}

export async function deleteTemplate(id) {
  const res = await fetch(`${BASE}/api/user-templates/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Fehler beim Löschen");
  return res.json();
}

export async function fetchFavorites() {
  const res = await fetch(`${BASE}/api/user-templates/favorites`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Laden");
  return json;
}

export async function saveFavorites(favorites) {
  const res = await fetch(`${BASE}/api/user-templates/favorites`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ favorites }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail || "Fehler beim Speichern");
  return json;
}
