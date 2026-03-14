const BASE = "http://localhost:8000";

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
