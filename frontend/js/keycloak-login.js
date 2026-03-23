/**
 * Browser OIDC sign-in via Keycloak (Authorization Code + PKCE).
 * Requires keycloak-js (see index.html) and backend POST /api/auth/keycloak-session.
 */
(function () {
  var KEYCLOAK_URL = window.OAN_KEYCLOAK_URL || 'http://localhost:8090';
  var KEYCLOAK_REALM = window.OAN_KEYCLOAK_REALM || 'openagrinet';
  var KEYCLOAK_CLIENT_ID = window.OAN_KEYCLOAK_CLIENT_ID || 'openagrinet-web';
  var USE_BROWSER_KEYCLOAK = window.OAN_KEYCLOAK_BROWSER !== false;
  var apiBase = window.OAN_API_BASE || 'http://localhost:5001';

  if (!USE_BROWSER_KEYCLOAK || typeof Keycloak === 'undefined') {
    window.OAN_KEYCLOAK_ACTIVE = false;
    window.OAN_KEYCLOAK_INIT = Promise.resolve();
    return;
  }

  var keycloak = new Keycloak({
    url: KEYCLOAK_URL,
    realm: KEYCLOAK_REALM,
    clientId: KEYCLOAK_CLIENT_ID,
  });

  window.OAN_KEYCLOAK_ACTIVE = true;
  window.OAN_KEYCLOAK = keycloak;

  var VALID_APP_ROLES = ['farmer', 'bank', 'admin', 'super'];

  function hasValidAppRole() {
    var r = (localStorage.getItem('oan-role') || '').trim().toLowerCase();
    return VALID_APP_ROLES.indexOf(r) !== -1;
  }

  function afterKeycloakAuth() {
    if (!keycloak.token) return Promise.resolve();
    var intended = sessionStorage.getItem('oan-intended-role') || null;
    return fetch(apiBase + '/api/auth/keycloak-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: keycloak.token, intendedRole: intended }),
    })
      .then(function (r) {
        return r.text().then(function (text) {
          var data = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch (parseErr) {
            console.warn('Non-JSON response from API:', text && text.slice ? text.slice(0, 200) : text);
            data = { error: 'Invalid response from server' };
          }
          return { ok: r.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data.success) {
          sessionStorage.removeItem('oan-intended-role');
          sessionStorage.removeItem('oan-want-fresh-login');
          sessionStorage.removeItem('oan-app-logged-out');
          localStorage.setItem('oan-user', result.data.user.username);
          localStorage.setItem('oan-role', result.data.user.role);
          if (result.data.token) localStorage.setItem('oan-token', result.data.token);
          window.location.href = 'dashboard.html';
          return;
        }
        var msg = (result.data && result.data.error) || 'Session exchange failed';
        alert(msg);
        try {
          keycloak.logout({ redirectUri: new URL('index.html', window.location.href).href });
        } catch (e) {
          console.error(e);
        }
      })
      .catch(function (err) {
        console.error(err);
        alert(
          'Cannot reach API for Keycloak session (' +
            apiBase +
            '). Check the backend is running and CORS allows this origin. Details: ' +
            (err && err.message ? err.message : String(err))
        );
      });
  }

  window.OAN_KEYCLOAK_FINISH_SESSION = afterKeycloakAuth;

  window.OAN_KEYCLOAK_INIT = keycloak
    .init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    })
    .then(function (authenticated) {
      // Clear logout marker only once Keycloak reports no SSO session (avoids mistaken auto-exchange).
      if (!authenticated) {
        sessionStorage.removeItem('oan-app-logged-out');
        sessionStorage.removeItem('oan-kc-logout-attempts');
        return;
      }
      // MUST run before the "send to dashboard" branch: if oan-token + oan-role still exist (race,
      // sync, or missed removeItem), we would skip logout and keep the user "signed in" to the app.
      var appLoggedOut = sessionStorage.getItem('oan-app-logged-out') === '1';
      if (appLoggedOut) {
        localStorage.removeItem('oan-token');
        localStorage.removeItem('oan-role');
        localStorage.removeItem('oan-user');
        localStorage.removeItem('oan-email');
        localStorage.removeItem('oan-mobile');
        var attempts = parseInt(sessionStorage.getItem('oan-kc-logout-attempts') || '0', 10);
        if (attempts >= 2) {
          sessionStorage.removeItem('oan-app-logged-out');
          sessionStorage.removeItem('oan-kc-logout-attempts');
          return keycloak.login({
            prompt: 'login',
            redirectUri: new URL('index.html', window.location.href).href,
          });
        }
        sessionStorage.setItem('oan-kc-logout-attempts', String(attempts + 1));
        return keycloak.logout({
          redirectUri: new URL('index.html', window.location.href).href,
        });
      }
      var hasAppJwt = !!localStorage.getItem('oan-token');
      if (hasAppJwt && !hasValidAppRole()) {
        localStorage.removeItem('oan-token');
        hasAppJwt = false;
      }
      if (hasAppJwt && hasValidAppRole()) {
        window.location.href = 'dashboard.html';
        return;
      }
      sessionStorage.removeItem('oan-kc-logout-attempts');
      return afterKeycloakAuth();
    })
    .catch(function (err) {
      console.warn('Keycloak init failed (use local login):', err);
      window.OAN_KEYCLOAK_ACTIVE = false;
    });

  window.OAN_KEYCLOAK_SIGNIN = function (selectedRole) {
    sessionStorage.setItem('oan-intended-role', selectedRole);
    var redirectUri = new URL('index.html', window.location.href).href;
    var opts = { redirectUri: redirectUri };
    // After app logout we ask Keycloak for a fresh login (not silent SSO reuse).
    if (sessionStorage.getItem('oan-want-fresh-login') === '1') {
      opts.prompt = 'login';
    }
    return keycloak.login(opts);
  };
})();
