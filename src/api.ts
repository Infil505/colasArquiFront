// api.ts
const ORIGIN = import.meta.env.VITE_API_BASE || ""; 
const FN_BASE = `${ORIGIN}/.netlify/functions`; 

function fn(path: string) {
  return `${FN_BASE}${path}`; 
}

async function handle(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ------- Endpoints existentes -------
export async function listAuthors() {
  const r = await fetch(fn("/authors-get"));
  return handle(r);
}

export async function listPublishers() {
  const r = await fetch(fn("/publishers-get"));
  return handle(r);
}

export async function enqueueAuthor(action: string, payload: any) {
  const r = await fetch(fn("/queue-authors"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  return handle(r);
}

export async function enqueuePublisher(action: string, payload: any) {
  const r = await fetch(fn("/queue-publishers"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  return handle(r);
}

export async function runQueue() {
  const r = await fetch(fn("/run-queue"), { method: "POST" });
  return handle(r);
}

// ------- Lo que faltaba: LOGIN -------
type LoginBody = { gmail: string; password: string };
type LoginOk = { _id: string; gmail: string; name: string | null };

export async function login(body: LoginBody): Promise<LoginOk> {
  const r = await fetch(fn("/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handle(r);
}

// (Opcional útil)
export function saveUser(u: LoginOk) {
  localStorage.setItem("auth:user", JSON.stringify(u));
}
export function getUser(): LoginOk | null {
  const raw = localStorage.getItem("auth:user");
  return raw ? (JSON.parse(raw) as LoginOk) : null;
}
export function logout() {
  localStorage.removeItem("auth:user");
}
