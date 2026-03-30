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

export default keycloak;