# Keycloak (local dev)

## Ports

- **Keycloak** is mapped to **http://localhost:8090** (container internal `8080`) so it does **not** conflict with the static frontend on **http://localhost:8080**.
- **Backend API** (typical local run): **http://localhost:5001**
- **Frontend** (static server): **http://localhost:8080**

---

## What you should do (detailed checklist)

Follow these steps in order the first time you set up Keycloak with OpenAgriNet, and use the same order after a machine restart.

### 1. Prerequisites

| Requirement | Why |
|-------------|-----|
| **Docker Desktop** running | Keycloak runs in a container |
| **Node.js 18+** | Backend API |
| **Python 3** (optional) | To serve `frontend/` with `python3 -m http.server` |
| **PostgreSQL** reachable | App users and master data (often Docker on **localhost:5433**) |

---

### 2. Start PostgreSQL (if you use Docker for the DB)

From the repo:

```bash
cd infrastructure
docker compose up -d postgres
```

Confirm:

```bash
psql "postgresql://admin:admin@localhost:5433/openagrinet" -c "SELECT 1;"
```

Apply schema if needed:

```bash
psql "postgresql://admin:admin@localhost:5433/openagrinet" -f backend/sql/create_tables.sql
```

*(Paths are from the **repository root**; adjust if your shell is already in `infrastructure/`.)*

---

### 3. Start Keycloak

```bash
cd infrastructure
docker compose up -d keycloak
```

**First boot** can take **30–60 seconds**. Watch logs until you see realm bootstrap messages:

```bash
docker logs -f openagrinet-keycloak
```

Look for:

- `Bootstrapping OpenAgriNet realm...`
- `[Keycloak init] Done.`

**If `docker compose` fails** with “No such container” or stale IDs, try:

```bash
docker rm -f openagrinet-keycloak 2>/dev/null
docker compose -p openagrinet up -d keycloak
```

**If image pull fails** with snapshot / layer errors, see [Troubleshooting](#troubleshooting) below. The project may use **Keycloak 24.x** in `docker-compose.yml` (not necessarily `:23.0`).

**Verify Keycloak responds:**

- Open **http://localhost:8090** — you should get a redirect or Keycloak page (HTTP **302** is normal).
- Admin console: log in with **admin** / **admin** (master realm).

---

### 4. Configure the backend (`backend/.env`)

Create or edit **`backend/.env`** (you can copy from **`backend/.env.example`** if present):

```env
DATABASE_URL=postgresql://admin:admin@localhost:5433/openagrinet

JWT_SECRET=dev-secret

KEYCLOAK_ENABLED=true
KEYCLOAK_URL=http://localhost:8090
KEYCLOAK_REALM=openagrinet
KEYCLOAK_CLIENT_ID=openagrinet-web
```

| Variable | Local Node on your Mac | Backend inside Docker Compose |
|----------|------------------------|-------------------------------|
| `KEYCLOAK_URL` | `http://localhost:8090` | `http://keycloak:8080` |

**Important:** After any change to `.env`, **restart** the Node process.

---

### 5. Start the backend API

From the repo root:

```bash
cd backend
PORT=5001 npm run start
```

**Why `PORT=5001`?** On macOS, **port 5000** is often used by **AirPlay Receiver**; `5001` avoids clashes.

Confirm:

```bash
curl -s http://localhost:5001/health
```

You should see JSON like `{"status":"ok","service":"openagrinet-backend"}`.

---

### 6. Start the frontend (static files)

From the repo root:

```bash
cd frontend
python3 -m http.server 8080
```

Open **http://localhost:8080/index.html** (or **http://localhost:8080/**).

---

### 7. Sign in with Keycloak (browser / recommended)

This uses the **Keycloak login page** (OIDC Authorization Code + PKCE), not the username/password fields on the OpenAgriNet form for authentication.

1. Open **http://localhost:8080/index.html**
2. **Select the role card** that matches the Keycloak user you will use:
   - **Admin User** → Keycloak user **`admin`** (realm role `admin`)
   - **Super User** → Keycloak user **`superuser`** (realm role `super`)
3. Click **Sign In** (do **not** hold **Alt**).
4. You should be redirected to **Keycloak’s** login page.
5. Sign in with the matching test user, for example:
   - Username **`admin`**, password **`admin`** (with **Admin User** card), or  
   - Username **`superuser`**, password **`superuser`** (with **Super User** card)
6. After success, you are redirected back to **`index.html`**, the app calls **`POST /api/auth/keycloak-session`**, stores **`oan-token`** (and role/user in `localStorage`), then sends you to **`dashboard.html`**.

If the **role card** does not match your Keycloak realm roles, the API returns **403** — pick the correct card and try again.

---

### 8. Optional: sign in without Keycloak (local API / Postgres)

Use this for users that exist **only in Postgres** (created via **`POST /api/users`**) or when Keycloak is down.

1. On **http://localhost:8080/index.html**, enter **username** and **password**.
2. Hold **Alt** and click **Sign In**.
3. The browser sends **`POST /api/login`** to the backend (bcrypt + optional Keycloak password grant on the server, depending on `.env`).

**Demo shortcut (no real user):** leave username and password **empty**, hold **Alt**, click **Sign In** — the old **demo** redirect to the dashboard may still apply (see `index.html` logic).

---

### 9. Optional: create a Postgres-only user

If you need a user that never exists in Keycloak:

```bash
curl -sS -X POST "http://localhost:5001/api/users" \
  -H "Content-Type: application/json" \
  -d '{"username":"myuser","password":"mypass","role":"admin"}'
```

Then use **Alt + Sign In** with **`myuser` / `mypass`** and the matching **role card**.

---

### 10. Verify everything

| Check | How |
|-------|-----|
| Keycloak up | **http://localhost:8090** loads |
| Backend up | `curl http://localhost:5001/health` |
| Browser Keycloak flow | Sign In (no Alt) → Keycloak page → return → **dashboard** |
| API token | DevTools → Application → Local Storage → **`oan-token`** present |
| Admin master realm | **http://localhost:8090** → admin / admin |

---

## Start Keycloak (short reference)

```bash
cd infrastructure
docker compose up -d keycloak
```

```bash
docker logs -f openagrinet-keycloak
```

## Admin console

- URL: **http://localhost:8090**
- Master realm admin: **admin** / **admin**

## OpenAgriNet realm (auto-created)

The container runs `keycloak-init-openagrinet.sh` to create:

| Username    | Password     | Realm role |
|-------------|--------------|------------|
| `admin`     | `admin`      | `admin`    |
| `superuser` | `superuser`  | `super`    |

Realm roles used by the app: `super`, `admin`, `bank`, `farmer`.

## Backend integration

With `KEYCLOAK_ENABLED=true` in `backend/.env`, `POST /api/login` tries **Keycloak** first (Resource Owner Password grant, server-side), then falls back to **Postgres** users if Keycloak is unreachable or the user only exists locally.

Set:

```env
KEYCLOAK_ENABLED=true
KEYCLOAK_URL=http://localhost:8090
KEYCLOAK_REALM=openagrinet
KEYCLOAK_CLIENT_ID=openagrinet-web
```

When the backend runs **inside Docker**, `KEYCLOAK_URL` is `http://keycloak:8080` (see `infrastructure/docker-compose.yml`).

## Sign-in UI

### Browser (OIDC redirect)

The static app loads **keycloak-js** and **Sign In** redirects to the Keycloak login page (Authorization Code + PKCE). After login, the app calls **`POST /api/auth/keycloak-session`** to verify the Keycloak access token (JWKS) and store an **app JWT** in `localStorage`.

- Pick the **role card** that matches your Keycloak realm role **before** clicking Sign In.
- Hold **Alt** while clicking **Sign In** to skip Keycloak and use **local** `POST /api/login` (Postgres users) instead.
- Hold **Alt** with **empty** username/password for the old **demo** dashboard shortcut.

### API-only (password grant)

Use the **same role card** as the user’s Keycloak realm role (e.g. select **Admin User** when signing in as `admin`) when using **`POST /api/login`** with username/password (server-side Keycloak grant).

If the selected portal role does not match Keycloak realm roles, login is rejected with 403.

## Troubleshooting

### Docker: `unable to prepare extraction snapshot` / `AlreadyExists: target snapshot`

This comes from Docker’s image store, not this repo. Try on your Mac:

1. Restart **Docker Desktop**
2. `docker system prune -af` (removes unused images/containers — confirm you’re OK with that)
3. Pull the image tag used in **`infrastructure/docker-compose.yml`** (e.g. `quay.io/keycloak/keycloak:24.0.5`)
4. `cd infrastructure && docker compose up -d keycloak`

### `Bind for 0.0.0.0:8090 failed: port is already allocated`

Something is **already listening on host port 8090** — usually another **Keycloak** container from an earlier `docker compose up`.

1. See what is using the port:
   ```bash
   lsof -nP -iTCP:8090 -sTCP:LISTEN
   docker ps --format '{{.Names}} {{.Ports}}' | grep 8090
   ```
2. If you already have **`openagrinet-keycloak`** running and healthy, you **do not** need to start another one — use **http://localhost:8090** as-is.
3. If you have a **stuck** `Created` container (duplicate name) or a dead duplicate, remove it and start again:
   ```bash
   docker rm -f 9315ad3c7917_openagrinet-keycloak   # example stale name from compose
   docker rm -f openagrinet-keycloak               # only if you intend to recreate
   cd infrastructure && docker compose up -d keycloak
   ```

### Compose: `No such container: 9315ad3c7917...` (truncated ID)

Docker Compose’s **project state** can reference an old container id. Fix:

```bash
cd infrastructure
docker compose down --remove-orphans
docker rm -f openagrinet-keycloak 2>/dev/null
docker compose -p openagrinetkc up -d keycloak
```

Using a **fresh project name** (`-p openagrinetkc`) avoids the bad metadata. You can pick any unused name.

### Login still uses Postgres only

- Restart the Node backend after changing `backend/.env`.
- Confirm Keycloak is listening: open **http://localhost:8090** (admin / admin).
- If `KEYCLOAK_URL` is wrong, `/api/login` will log a Keycloak warning and use local users.

### Browser stuck after Keycloak login

- Confirm the backend is on the same **`OAN_API_BASE`** as in `index.html` (default **http://localhost:5001**).
- Check browser **Network** tab for **`/api/auth/keycloak-session`** — 401 often means JWT verification failed (issuer / JWKS mismatch vs `KEYCLOAK_URL`).

### Disable browser Keycloak temporarily

Before loading `keycloak-login.js`, set:

```html
<script>window.OAN_KEYCLOAK_BROWSER = false;</script>
```

Or only use **Alt + Sign In** for local login without changing scripts.
