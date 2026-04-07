/**
 * Verify Keycloak access tokens using realm JWKS.
 * - `issuer` / `jwt.verify` still use the token's `iss` claim exactly.
 * - JWKS fetch URL: when KEYCLOAK_URL is set, use `${KEYCLOAK_URL}/realms/<realm>/protocol/openid-connect/certs`
 *   so a backend **inside Docker** loads keys from `http://keycloak:8080/...` while the browser token
 *   still says `iss=http://localhost:8090/...` (otherwise Node would request JWKS from container localhost and fail).
 */
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const EXPECTED_REALM = process.env.KEYCLOAK_REALM || 'openagrinet';

/** signing-key getter per JWKS URL */
const getKeyByJwksUri = new Map();

function getSigningKeyGetter(jwksUri) {
  if (!getKeyByJwksUri.has(jwksUri)) {
    const client = jwksClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 60 * 60 * 1000,
      rateLimit: true,
      jwksRequestsPerMinute: 30,
    });
    const getKey = (header, callback) => {
      if (!header || !header.kid) {
        callback(new Error('Missing token kid'));
        return;
      }
      client.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        callback(null, key.getPublicKey());
      });
    };
    getKeyByJwksUri.set(jwksUri, getKey);
  }
  return getKeyByJwksUri.get(jwksUri);
}

function getJwksOptions() {
  const base = String(process.env.KEYCLOAK_URL || 'http://localhost:8090')
    .trim()
    .replace(/\/$/, '');
  const realm = EXPECTED_REALM;
  if (!base) return null;
  const issuer = `${base}/realms/${realm}`;
  const jwksUri = `${issuer}/protocol/openid-connect/certs`;
  return { issuer, jwksUri };
}

function realmFromIssuer(iss) {
  const m = String(iss || '')
    .replace(/\/$/, '')
    .match(/\/realms\/([^/]+)$/);
  return m ? m[1] : null;
}

/**
 * URL used only to download signing keys. May differ from `iss` when the API runs in Docker.
 */
function jwksUriForTokenIssuer(issuerFromToken) {
  const issNoSlash = String(issuerFromToken).replace(/\/$/, '');
  const fromIss = `${issNoSlash}/protocol/openid-connect/certs`;

  const configuredBase = String(process.env.KEYCLOAK_URL || '')
    .trim()
    .replace(/\/$/, '');
  const realm = realmFromIssuer(issuerFromToken);
  if (!configuredBase || !realm) return fromIss;

  return `${configuredBase}/realms/${realm}/protocol/openid-connect/certs`;
}

/**
 * @param {string} accessToken
 * @returns {Promise<object>} decoded JWT payload
 */
function verifyKeycloakAccessToken(accessToken) {
  const decoded = jwt.decode(accessToken, { complete: true });
  if (!decoded || !decoded.header || !decoded.payload) {
    return Promise.reject(new Error('Could not decode access token'));
  }

  const alg = String(decoded.header.alg || '');
  const allowedAlgs = new Set([
    'RS256',
    'RS384',
    'RS512',
    'PS256',
    'PS384',
    'PS512',
    'ES256',
    'ES384',
    'ES512',
  ]);
  if (!allowedAlgs.has(alg)) {
    return Promise.reject(new Error(`Unsupported Keycloak access token alg: ${alg}`));
  }

  const issuerFromToken = decoded.payload.iss;
  if (!issuerFromToken || typeof issuerFromToken !== 'string') {
    return Promise.reject(new Error('Token missing iss'));
  }

  const realm = realmFromIssuer(issuerFromToken);
  if (!realm || realm !== EXPECTED_REALM) {
    return Promise.reject(
      new Error(`Token realm mismatch (expected realm "${EXPECTED_REALM}", iss="${issuerFromToken}")`)
    );
  }

  const jwksUri = jwksUriForTokenIssuer(issuerFromToken);
  const getKey = getSigningKeyGetter(jwksUri);

  return new Promise((resolve, reject) => {
    jwt.verify(
      accessToken,
      getKey,
      {
        algorithms: [alg],
        issuer: issuerFromToken,
        clockTolerance: 120,
      },
      (err, payload) => {
        if (err) return reject(err);
        resolve(payload);
      }
    );
  });
}

module.exports = {
  verifyKeycloakAccessToken,
  getJwksOptions,
};
