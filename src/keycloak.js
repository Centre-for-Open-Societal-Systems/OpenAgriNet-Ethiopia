import Keycloak from "keycloak-js";

const clientId =
  (typeof window !== "undefined" && window.__OAN_KEYCLOAK_CLIENT_ID__) ||
  import.meta.env.VITE_KEYCLOAK_CLIENT_ID ||
  "openagrinet-web";

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

export const KEYCLOAK_INIT_OPTIONS = Object.freeze({
  onLoad: "check-sso",
  pkceMethod: "S256",
});

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
