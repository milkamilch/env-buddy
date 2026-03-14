const BASE = "http://localhost:8000";

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

export async function fetchTemplates() {
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
