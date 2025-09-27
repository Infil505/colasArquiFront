const API_BASE = import.meta.env.VITE_API_BASE || "";

function api(path: string) {
  return `${API_BASE}/api${path}`;
}

export async function listAuthors() {
  const r = await fetch(api('/authors-get'));
  return r.json();
}
export async function listPublishers() {
  const r = await fetch(api('/publishers-get'));
  return r.json();
}

export async function enqueueAuthor(action: string, payload: any) {
  await fetch(api('/queue-authors'), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload })
  });
}

export async function enqueuePublisher(action: string, payload: any) {
  await fetch(api('/queue-publishers'), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload })
  });
}

export async function runQueue() {
  const r = await fetch(api('/run-queue'), { method: "POST" });
  return r.json();
}
