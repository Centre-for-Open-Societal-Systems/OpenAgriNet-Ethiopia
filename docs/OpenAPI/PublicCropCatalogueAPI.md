# Public API: Crop & seed master catalogue

Read-only HTTP API for active crop and registered seed variety rows stored in OpenAgriNet. **No authentication** is required.

## Endpoint

| Method | Path |
|--------|------|
| `GET` | `/api/public/catalogues/crop_catalogue/records` |

Base URL is your OpenAgriNet backend origin (for example `http://localhost:5001` in local development).

## Query parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | integer | `50` | `100` | Page size (clamped between 1 and 100). |
| `offset` | integer | `0` | — | Number of rows to skip (pagination). |
| `q` | string | — | 200 chars | Optional case-insensitive search across variety name, crop name, producer, notes, source fields, and JSON `attributes`. |

Only rows with `is_active = true` are returned. Results are ordered by `updated_at` descending.

## Successful response

**Status:** `200 OK`

**Headers:** `Cache-Control: public, max-age=60`

**Body (JSON):**

```json
{
  "success": true,
  "catalogue": "crop_catalogue",
  "count": 50,
  "total": 1240,
  "data": [ /* array of row objects */ ],
  "limit": 50,
  "offset": 0,
  "q": ""
}
```

### Row object (typical fields)

Each element of `data` mirrors the `master_crop_seed_varieties` row, including for example:

- `_id` (UUID)
- `source_system`, `source_catalogue`, `source_record_key`
- `variety_name`, `crop_name`, `producer_name`, `seed_supply_notes`
- `attributes` (object)
- `row_hash`, `source_updated_at`, `created_at`, `updated_at`

Exact columns may evolve with schema migrations; treat unknown fields as optional.

## Errors

| Status | Body |
|--------|------|
| `400` | `{ "success": false, "error": "Invalid catalogue..." }` |
| `500` | `{ "success": false, "error": "Unable to read catalogue records" }` |

## Examples

### cURL — first page

```bash
curl -sS "http://localhost:5001/api/public/catalogues/crop_catalogue/records?limit=25&offset=0"
```

### cURL — search

```bash
curl -sS "http://localhost:5001/api/public/catalogues/crop_catalogue/records?q=wheat&limit=20"
```

### JavaScript (fetch)

```javascript
const base = 'http://localhost:5001';
const url = new URL('/api/public/catalogues/crop_catalogue/records', base);
url.searchParams.set('limit', '50');
url.searchParams.set('offset', '0');
const res = await fetch(url);
const json = await res.json();
if (json.success) console.log(json.data.length, 'of', json.total);
```

## Data provenance

Upstream sync pulls from the Ministry of Agriculture **EthioSeed** JSON catalogues (`/api/crops-catalog`, `/api/varieties-catalog`). This public API returns whatever is currently stored in OpenAgriNet after sync and local admin edits.

## Admin vs public

| Aspect | Public API | Admin API |
|--------|------------|-----------|
| Path | `/api/public/catalogues/crop_catalogue/records` | `/api/masterdata/crop_catalogue/records` |
| Auth | None | Bearer (app JWT or Keycloak token) + admin role |
| `limit` max | 100 | 500 |
