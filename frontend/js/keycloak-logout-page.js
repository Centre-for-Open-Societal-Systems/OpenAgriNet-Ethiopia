/**
 * Dedicated logout page: uses keycloak-js logout() so Keycloak ends the SSO session
 * correctly (GET-only logout URLs are unreliable in Keycloak 18+ without id_token_hint).
 */
(function () {
  var KEYCLOAK_URL = window.OAN_KEYCLOAK_URL || 'http://localhost:8090';
  var KEYCLOAK_REALM = window.OAN_KEYCLOAK_REALM || 'openagrinet';
  var KEYCLOAK_CLIENT_ID = window.OAN_KEYCLOAK_CLIENT_ID || 'openagrinet-web';
  var USE_BROWSER_KEYCLOAK = window.OAN_KEYCLOAK_BROWSER !== false;

  var indexUri = new URL('index.html', window.location.href).href;

  if (!USE_BROWSER_KEYCLOAK || typeof Keycloak === 'undefined') {
    window.location.replace(indexUri);
    return;
  }

  var keycloak = new Keycloak({
    url: KEYCLOAK_URL,
    realm: KEYCLOAK_REALM,
    clientId: KEYCLOAK_CLIENT_ID,
  });

  keycloak
    .init({ onLoad: 'check-sso', pkceMethod: 'S256', checkLoginIframe: false })
    .then(function (authenticated) {
      if (!authenticated) {
        window.location.replace(indexUri);
        return;
      }
      keycloak.logout({ redirectUri: indexUri });
    })
    .catch(function (err) {
      console.warn('Keycloak logout page:', err);
      window.location.replace(indexUri);
    });
})();
