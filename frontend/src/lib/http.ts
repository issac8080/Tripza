import { API_URL } from "./config";
import { clearStoredToken, getStoredToken } from "./authToken";

export function authHeaders(): HeadersInit {
  const t = getStoredToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const auth = new Headers(authHeaders());
  auth.forEach((value, key) => {
    headers.set(key, value);
  });
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });
  const text = await res.text();
  if (res.status === 401) {
    clearStoredToken();
  }
  if (!res.ok) {
    throw new Error(text || `Request failed (${res.status})`);
  }
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
