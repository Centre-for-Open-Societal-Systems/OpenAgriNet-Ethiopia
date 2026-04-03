#!/bin/sh
# Idempotent OpenAgriNet realm setup (run inside Keycloak container after kcadm login to master).
set +e

KC="/opt/keycloak/bin/kcadm.sh"

echo "[Keycloak init] Configuring realm openagrinet..."

if ! $KC get realms/openagrinet >/dev/null 2>&1; then
  $KC create realms -s realm=openagrinet -s enabled=true -s sslRequired=NONE && echo "[Keycloak init] Created realm openagrinet"
else
  echo "[Keycloak init] Realm openagrinet already exists"
fi

# Public client — backend uses password grant server-side only
CID=$($KC get clients -r openagrinet -q clientId=openagrinet-web --fields id --format csv --noquotes 2>/dev/null | head -1)
if [ -z "$CID" ]; then
  $KC create clients -r openagrinet \
    -s clientId=openagrinet-web \
    -s name=openagrinet-web \
    -s publicClient=true \
    -s directAccessGrantsEnabled=true \
    -s standardFlowEnabled=true \
    -s 'redirectUris=["http://localhost:5173/*","http://localhost:8080/*"]' \
    -s 'webOrigins=["http://localhost:5173","http://localhost:8080"]' \
    && echo "[Keycloak init] Created client openagrinet-web"
else
  echo "[Keycloak init] Client openagrinet-web exists — enabling direct access grants and Vite redirect URIs"
  $KC update "clients/$CID" -r openagrinet \
    -s directAccessGrantsEnabled=true \
    -s publicClient=true \
    -s 'redirectUris=["http://localhost:5173/*","http://localhost:8080/*"]' \
    -s 'webOrigins=["http://localhost:5173","http://localhost:8080"]' \
    2>/dev/null || true
fi

# Legacy / cached SPA bundles may still request this client id — mirror openagrinet-web.
FRONT_CID=$($KC get clients -r openagrinet -q clientId=openagrinet-frontend --fields id --format csv --noquotes 2>/dev/null | head -1)
if [ -z "$FRONT_CID" ]; then
  $KC create clients -r openagrinet \
    -s clientId=openagrinet-frontend \
    -s name=openagrinet-frontend \
    -s publicClient=true \
    -s directAccessGrantsEnabled=true \
    -s standardFlowEnabled=true \
    -s 'redirectUris=["http://localhost:5173/*","http://localhost:8080/*"]' \
    -s 'webOrigins=["http://localhost:5173","http://localhost:8080"]' \
    && echo "[Keycloak init] Created client openagrinet-frontend (alias for Vite / old builds)"
else
  echo "[Keycloak init] Client openagrinet-frontend exists — refreshing redirect URIs"
  $KC update "clients/$FRONT_CID" -r openagrinet \
    -s directAccessGrantsEnabled=true \
    -s publicClient=true \
    -s 'redirectUris=["http://localhost:5173/*","http://localhost:8080/*"]' \
    -s 'webOrigins=["http://localhost:5173","http://localhost:8080"]' \
    2>/dev/null || true
fi

for R in super admin bank farmer; do
  $KC create roles -r openagrinet -s name="$R" 2>/dev/null || true
done
echo "[Keycloak init] Realm roles: super, admin, bank, farmer"

assign_realm_role() {
  USERNAME="$1"
  ROLENAME="$2"
  USER_ID=$($KC get users -r openagrinet -q "username=$USERNAME" --fields id --format csv --noquotes 2>/dev/null | head -1)
  if [ -n "$USER_ID" ]; then
    $KC add-roles -r openagrinet --uid "$USER_ID" --rolename "$ROLENAME" 2>/dev/null || true
  fi
}

create_user() {
  U="$1"
  P="$2"
  $KC create users -r openagrinet -s "username=$U" -s enabled=true -s emailVerified=true 2>/dev/null || true
  $KC set-password -r openagrinet --username "$U" --new-password "$P" --temporary false 2>/dev/null || true
}

create_user admin admin
assign_realm_role admin admin

create_user superuser superuser
assign_realm_role superuser super

echo "[Keycloak init] Users: admin/admin (admin), superuser/superuser (super)"
echo "[Keycloak init] Done."
