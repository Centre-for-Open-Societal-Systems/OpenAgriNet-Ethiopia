import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080",   // ✅ FIXED
  realm: "openagrinet",
  clientId: "openagrinet-web",   // ⚠️ must match Keycloak client
});

export default keycloak;



