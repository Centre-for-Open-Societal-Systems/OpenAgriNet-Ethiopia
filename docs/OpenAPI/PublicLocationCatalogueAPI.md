# Public API: Location (administrative boundaries) master catalogue

Read-only HTTP API for active administrative boundary rows (regions, zones, woredas, etc.) stored in OpenAgriNet. **No authentication** is required.

## Endpoint

| Method | Path |
|--------|------|
| `GET` | `/api/public/catalogues/location_catalogue/records` |

Base URL is your OpenAgriNet backend origin (for example `http://localhost:5001` in local development).

## Query parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | integer | `50` | `100` | Page size (clamped between 1 and 100). |
| `offset` | integer | `0` | — | Number of rows to skip (pagination). |
| `q` | string | — | 200 chars | Optional case-insensitive search across level, codes, name, parent code, source fields, and JSON `attributes`. |

Only rows with `is_active = true` are returned. Results are ordered by `updated_at` descending.

## Successful response

**Status:** `200 OK`

**Headers:** `Cache-Control: public, max-age=60`

**Body (JSON):**

```json
{
  "success": true,
  "catalogue": "location_catalogue",
  "count": 50,
  "total": 800,
  "data": [ /* array of row objects */ ],
  "limit": 50,
  "offset": 0,
  "q": ""
}
```

### Row object (typical fields)

Each element of `data` mirrors the `master_location_administrative_boundaries` row, including for example:

- `_id` (UUID)
- `source_system`, `source_catalogue`, `source_record_key`
- `level`, `p_code`, `name`, `parent_p_code`
- `geometry_geojson` (GeoJSON geometry, when present)
- `attributes` (object)
- `row_hash`, `source_updated_at`, `created_at`, `updated_at`

## Errors

| Status | Body |
|--------|------|
| `400` | `{ "success": false, "error": "Invalid catalogue..." }` |
| `500` | `{ "success": false, "error": "Unable to read catalogue records" }` |

## Examples

### cURL — paginate woreda-like rows

```bash
curl -sS "http://localhost:5001/api/public/catalogues/location_catalogue/records?limit=100&offset=200"
```

### cURL — filter by name fragment

```bash
curl -sS "http://localhost:5001/api/public/catalogues/location_catalogue/records?q=North&limit=30"
```

### JavaScript (fetch)

```javascript
const base = 'http://localhost:5001';
const res = await fetch(
  `${base}/api/public/catalogues/location_catalogue/records?limit=50&offset=0`
);
const { success, data, total } = await res.json();
```

## Data provenance

Upstream sync resolves GeoJSON from MOA CKAN portals and/or NSDI GeoServer WFS (for example layer `geonode:eth_woreda_2013`). This API returns the stored copy in OpenAgriNet.

## Admin vs public

| Aspect | Public API | Admin API |
|--------|------------|-----------|
| Path | `/api/public/catalogues/location_catalogue/records` | `/api/masterdata/location_catalogue/records` |
| Auth | None | Bearer + admin role |
| `limit` max | 100 | 500 |
