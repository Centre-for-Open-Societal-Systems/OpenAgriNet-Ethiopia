import Keycloak from "keycloak-js";

// window override (see index.html) wins over env — helps when a stale cached chunk still hardcodes the wrong id.
const clientId =
  (typeof window !== "undefined" && window.__OAN_KEYCLOAK_CLIENT_ID__) ||
  import.meta.env.VITE_KEYCLOAK_CLIENT_ID ||
  "openagrinet-web";

const keycloak = new Keycloak({
  url: "http://localhost:8090",
  realm: "openagrinet",
  clientId,
});

/** Default init options — use everywhere that must wait for Keycloak (avoids API calls before init finishes). */
export const KEYCLOAK_INIT_OPTIONS = Object.freeze({
  onLoad: "check-sso",
  pkceMethod: "S256",
});

/**
 * keycloak-js throws if init() runs twice. React StrictMode mounts effects twice in dev,
 * so we reuse a single init promise for the app lifetime.
 */
let initPromise = null;

export function initKeycloak(options) {
  const opts = { ...KEYCLOAK_INIT_OPTIONS, ...options };
  if (initPromise) return initPromise;
  initPromise = keycloak.init(opts).catch((err) => {
    initPromise = null;
    throw err;
  });
  return initPromise;
}

export default keycloak;