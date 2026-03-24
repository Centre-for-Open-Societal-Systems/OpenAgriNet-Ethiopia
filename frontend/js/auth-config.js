/**
 * Shared auth / Keycloak defaults. Override before this script in HTML if needed.
 * Used by index.html (login) and logout.html (Keycloak sign-out).
 */
window.OAN_API_BASE = window.OAN_API_BASE || 'http://localhost:5001';
window.OAN_KEYCLOAK_URL = window.OAN_KEYCLOAK_URL || 'http://localhost:8090';
window.OAN_KEYCLOAK_REALM = window.OAN_KEYCLOAK_REALM || 'openagrinet';
window.OAN_KEYCLOAK_CLIENT_ID = window.OAN_KEYCLOAK_CLIENT_ID || 'openagrinet-web';
window.OAN_KEYCLOAK_BROWSER = window.OAN_KEYCLOAK_BROWSER !== false;
