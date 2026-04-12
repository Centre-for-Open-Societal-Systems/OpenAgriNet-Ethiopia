import keycloak, { initKeycloak, KEYCLOAK_INIT_OPTIONS } from '../keycloak';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

const STORAGE_KEY = 'oan-app-jwt';

export function getApiBase() {
  return API_BASE;
}

export function getAppJwt() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

function isExpiredJwt(jwtStr) {
  if (!jwtStr || typeof jwtStr !== 'string') return true;
  const parts = jwtStr.split('.');
  if (parts.length !== 3) return true;
  try {
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json);
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now() + 10_000;
  } catch {
    return true;
  }
}

/**
 * Prefer Keycloak access token when the user has an OIDC session — it is always RS256 and
 * matches what the backend verifies via JWKS. Stale or wrong localStorage app JWTs often
 * caused 401 before this.
 */
function bearerTokenForApi() {
  try {
    if (keycloak && keycloak.authenticated && keycloak.token) {
      return keycloak.token;
    }
  } catch (_) {
    /* keycloak not ready */
  }
  const app = getAppJwt();
  if (app && !isExpiredJwt(app)) return app;
  try {
    if (keycloak && keycloak.token) return keycloak.token;
  } catch (_) {}
  return app || '';
}

/**
 * Refresh OIDC token and exchange for app JWT when possible.
 * Must await the same Keycloak init promise as App — child effects can run before init completes,
 * and keycloak.authenticated stays false until then, which previously caused empty Bearer tokens and 401s.
 */
export async function ensureSessionForApi() {
  try {
    await initKeycloak(KEYCLOAK_INIT_OPTIONS).catch(() => {});
    if (!keycloak || !keycloak.authenticated) return;
    await keycloak.updateToken(30).catch(() => {});
    if (keycloak.token) await exchangeKeycloakSession(keycloak.token);
  } catch (_) {
    /* non-fatal */
  }
}

export function setAppJwt(token) {
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem('oan-token', token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('oan-token');
  }
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
    const u = json.user;
    if (u && u.role) localStorage.setItem('oan-role', String(u.role).toLowerCase());
    if (u && u.username) localStorage.setItem('oan-user', String(u.username));
    return json.token;
  }
  return null;
}

export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!headers['Content-Type'] && options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  if (!headers.Authorization) {
    const t = bearerTokenForApi();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    headers,
  });
  return res;
}
