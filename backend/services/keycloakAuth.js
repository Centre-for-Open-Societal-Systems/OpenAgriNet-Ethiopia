/**
 * Keycloak Resource Owner Password grant (server-side only).
 * Used when KEYCLOAK_ENABLED=true and KEYCLOAK_URL is set.
 */
const jwt = require('jsonwebtoken');

function isKeycloakEnabled() {
  return (
    String(process.env.KEYCLOAK_ENABLED || '').toLowerCase() === 'true' &&
    Boolean(process.env.KEYCLOAK_URL && String(process.env.KEYCLOAK_URL).trim())
  );
}

function mapRealmRolesToAppRole(realmRoles) {
  if (!Array.isArray(realmRoles)) return null;
  const r = new Set(realmRoles);
  if (r.has('super')) return 'super';
  if (r.has('admin')) return 'admin';
  if (r.has('bank')) return 'bank';
  if (r.has('farmer')) return 'farmer';
  return null;
}

/**
 * @returns {Promise<null | { type: 'success', user: object, token: string } | { type: 'invalid_credentials' } | { type: 'unavailable', message: string }>}
 */
async function tryKeycloakPasswordLogin(username, password, selectedRole) {
  if (!isKeycloakEnabled()) return null;

  const base = String(process.env.KEYCLOAK_URL || '').replace(/\/$/, '');
  const realm = process.env.KEYCLOAK_REALM || 'openagrinet';
  const clientId = process.env.KEYCLOAK_CLIENT_ID || 'openagrinet-web';

  const url = `${base}/realms/${realm}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    username: String(username).trim(),
    password: String(password),
  });

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  } catch (err) {
    console.warn('[Keycloak] token request failed:', err && err.message ? err.message : err);
    return { type: 'unavailable', message: err && err.message ? err.message : String(err) };
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }

  if (!res.ok) {
    const errType = data.error;
    if (errType === 'invalid_grant' || res.status === 401) {
      return { type: 'invalid_credentials' };
    }
    console.warn('[Keycloak] token error:', res.status, text);
    return { type: 'unavailable', message: data.error_description || data.error || text || 'Keycloak error' };
  }

  const accessToken = data.access_token;
  if (!accessToken) {
    return { type: 'unavailable', message: 'No access_token from Keycloak' };
  }

  const payload = jwt.decode(accessToken);
  if (!payload || typeof payload !== 'object') {
    return { type: 'unavailable', message: 'Could not decode Keycloak access token' };
  }

  const realmRoles = (payload.realm_access && payload.realm_access.roles) || [];
  let appRole = mapRealmRolesToAppRole(realmRoles);

  if (!appRole) {
    return {
      type: 'unavailable',
      message:
        'User has no OpenAgriNet realm roles (need one of: super, admin, bank, farmer). Check Keycloak realm roles.',
    };
  }

  if (selectedRole && appRole !== selectedRole) {
    return {
      type: 'role_mismatch',
      message: `Keycloak roles (${realmRoles.join(', ')}) do not match selected portal role (${selectedRole}).`,
    };
  }

  const usernameOut =
    (payload.preferred_username && String(payload.preferred_username).toLowerCase()) ||
    String(username).trim().toLowerCase();

  const user = {
    id: payload.sub,
    username: usernameOut,
    role: appRole,
    source: 'keycloak',
  };

  const appToken = jwt.sign(
    {
      sub: String(payload.sub),
      role: appRole,
      username: usernameOut,
      source: 'keycloak',
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '2h' }
  );

  return { type: 'success', user, token: appToken };
}

module.exports = {
  isKeycloakEnabled,
  tryKeycloakPasswordLogin,
  mapRealmRolesToAppRole,
};
