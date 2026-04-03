/**
 * Verify Keycloak access tokens (RS256) using realm JWKS.
 */
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

function getJwksOptions() {
  const base = String(process.env.KEYCLOAK_URL || '').replace(/\/$/, '');
  const realm = process.env.KEYCLOAK_REALM || 'openagrinet';
  if (!base) return null;
  const issuer = `${base}/realms/${realm}`;
  const jwksUri = `${issuer}/protocol/openid-connect/certs`;
  return { issuer, jwksUri };
}

function createGetKey(jwksUri) {
  const client = jwksClient({
    jwksUri,
    cache: true,
    cacheMaxAge: 60 * 60 * 1000,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  });

  return function getKey(header, callback) {
    if (!header || !header.kid) {
      callback(new Error('Missing token kid'));
      return;
    }
    client.getSigningKey(header.kid, (err, key) => {
      if (err) return callback(err);
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    });
  };
}

/**
 * @param {string} accessToken
 * @returns {Promise<object>} decoded JWT payload
 */
function verifyKeycloakAccessToken(accessToken) {
  const opts = getJwksOptions();
  if (!opts) {
    return Promise.reject(new Error('KEYCLOAK_URL not configured'));
  }

  const getKey = createGetKey(opts.jwksUri);

  return new Promise((resolve, reject) => {
    jwt.verify(
      accessToken,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: opts.issuer,
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
