const jwt = require('jsonwebtoken');
const { verifyKeycloakAccessToken } = require('../services/keycloakJwtVerify');
const { mapRealmRolesToAppRole } = require('../services/keycloakAuth');

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  if (typeof header !== 'string') return '';
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
  return header.trim();
}

/**
 * Accepts either (1) OpenAgriNet app JWT from login/keycloak-session, or
 * (2) a raw Keycloak access token (RS256) so browser calls work even if session exchange failed.
 */
async function authRequiredAsync(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing Authorization token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = payload;
    return next();
  } catch (_) {
    /* not a valid app JWT — try Keycloak */
  }

  try {
    const kcPayload = await verifyKeycloakAccessToken(token);
    const realmRoles = (kcPayload.realm_access && kcPayload.realm_access.roles) || [];
    const appRole = mapRealmRolesToAppRole(realmRoles);
    if (!appRole) {
      return res.status(403).json({
        success: false,
        error: 'User has no OpenAgriNet realm roles (need one of: super, admin, bank, farmer).',
      });
    }
    const username =
      (kcPayload.preferred_username && String(kcPayload.preferred_username).toLowerCase()) ||
      (kcPayload.email && String(kcPayload.email).toLowerCase()) ||
      String(kcPayload.sub);
    req.user = {
      sub: String(kcPayload.sub),
      role: appRole,
      username,
      source: 'keycloak-bearer',
    };
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      detail: process.env.NODE_ENV === 'development' ? String(err && err.message ? err.message : err) : undefined,
    });
  }
}

function authRequired(req, res, next) {
  authRequiredAsync(req, res, next).catch((err) => {
    console.error('authRequired:', err);
    if (!res.headersSent) {
      res.status(401).json({ success: false, error: 'Authentication failed' });
    }
  });
}

function requireAdmin(req, res, next) {
  const role = req.user && req.user.role;
  if (role !== 'admin' && role !== 'super') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}

module.exports = { authRequired, requireAdmin };

