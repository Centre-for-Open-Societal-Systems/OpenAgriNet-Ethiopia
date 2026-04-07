#!/bin/sh
set -e

# Start Keycloak in background so we can run kcadm after it's ready
/opt/keycloak/bin/kc.sh start-dev &
KC_PID=$!

# Wait for Keycloak to be ready, then disable SSL requirement for master realm
echo "Waiting for Keycloak to start..."
KC_READY=0
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do
  sleep 2
  if /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin 2>/dev/null; then
    /opt/keycloak/bin/kcadm.sh update realms/master -s sslRequired=NONE 2>/dev/null && echo "SSL requirement disabled for master realm." || true
    KC_READY=1
    break
  fi
done

if [ "$KC_READY" = "1" ] && [ -f /scripts/keycloak-init-openagrinet.sh ]; then
  echo "Bootstrapping OpenAgriNet realm..."
  sh /scripts/keycloak-init-openagrinet.sh || echo "OpenAgriNet realm bootstrap had warnings (may already exist)."
fi

echo "Keycloak admin console (map host port in docker-compose): admin / admin"
echo "OpenAgriNet realm users: admin/admin, admin1/admin1 (admin), superuser/superuser (super)"

wait $KC_PID
