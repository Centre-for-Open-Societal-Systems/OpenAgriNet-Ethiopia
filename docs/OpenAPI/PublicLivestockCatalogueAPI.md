# Public API: Livestock species master catalogue

Read-only HTTP API for active livestock reference rows (species and related programme metadata) stored in OpenAgriNet. **No authentication** is required.

## Endpoint

| Method | Path |
|--------|------|
| `GET` | `/api/public/catalogues/livestock_catalogue/records` |

Base URL is your OpenAgriNet backend origin (for example `http://localhost:5001` in local development).

## Query parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | integer | `50` | `100` | Page size (clamped between 1 and 100). |
| `offset` | integer | `0` | — | Number of rows to skip (pagination). |
| `q` | string | — | 200 chars | Optional case-insensitive search across species names, programme fields, source fields, and JSON `attributes`. |

Only rows with `is_active = true` are returned. Results are ordered by `updated_at` descending.

## Successful response

**Status:** `200 OK`

**Headers:** `Cache-Control: public, max-age=60`

**Body (JSON):**

```json
{
  "success": true,
  "catalogue": "livestock_catalogue",
  "count": 12,
  "total": 45,
  "data": [ /* array of row objects */ ],
  "limit": 50,
  "offset": 0,
  "q": ""
}
```

### Row object (typical fields)

Each element of `data` mirrors the `master_livestock_catalogue` row, including for example:

- `_id` (UUID)
- `source_system`, `source_catalogue`, `source_record_key`
- `species_common_name`, `species_scientific_name`
- `production_program`, `animal_health_program`, `commercialization_program`
- `attributes` (object)
- `row_hash`, `source_updated_at`, `created_at`, `updated_at`

Rows may originate from MOA CKAN JSON resources or from the built-in seed list (`source_system` value `openagrinet.masterdata.seed`) when upstream discovery finds no suitable JSON.

## Errors

| Status | Body |
|--------|------|
| `400` | `{ "success": false, "error": "Invalid catalogue..." }` |
| `500` | `{ "success": false, "error": "Unable to read catalogue records" }` |

## Examples

### cURL

```bash
curl -sS "http://localhost:5001/api/public/catalogues/livestock_catalogue/records?limit=100&offset=0"
```

### cURL — search by species name

```bash
curl -sS "http://localhost:5001/api/public/catalogues/livestock_catalogue/records?q=cattle"
```

## Data provenance

Discovery uses MOA CKAN (`data.moa.gov.et`, then `datahub.moa.gov.et`) JSON resources where available; otherwise a curated baseline list may be applied during admin sync. This API returns the current database state.

## Admin vs public

| Aspect | Public API | Admin API |
|--------|------------|-----------|
| Path | `/api/public/catalogues/livestock_catalogue/records` | `/api/masterdata/livestock_catalogue/records` |
| Auth | None | Bearer + admin role |
| `limit` max | 100 | 500 |
