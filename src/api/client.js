const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

const STORAGE_KEY = 'oan-app-jwt';

export function getApiBase() {
  return API_BASE;
}

export function getAppJwt() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setAppJwt(token) {
  if (token) localStorage.setItem(STORAGE_KEY, token);
  else localStorage.removeItem(STORAGE_KEY);
}

export async function exchangeKeycloakSession(accessToken) {
  if (!accessToken) return null;
  const res = await fetch(`${API_BASE}/api/auth/keycloak-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.ok && json.token) {
    setAppJwt(json.token);
    return json.token;
  }
  return null;
}

export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!headers['Content-Type'] && options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  const t = getAppJwt();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers,
  });
  return res;
}
