#!/bin/sh
set -e

# Start Keycloak in background so we can run kcadm after it's ready
/opt/keycloak/bin/kc.sh start-dev &
KC_PID=$!

# Wait for Keycloak to be ready, then disable SSL requirement for master realm
echo "Waiting for Keycloak to start..."
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  sleep 2
  if /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin 2>/dev/null; then
    /opt/keycloak/bin/kcadm.sh update realms/master -s sslRequired=NONE 2>/dev/null && echo "SSL requirement disabled for master realm." || true
    break
  fi
done

echo "Keycloak running at http://localhost:8080 (admin / admin)"
wait $KC_PID
