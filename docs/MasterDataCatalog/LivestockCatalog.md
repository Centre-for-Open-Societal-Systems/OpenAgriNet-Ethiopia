# Livestock Catalogue Specification (Admin Master Data)

## Data Sources (CKAN discovery + resource normalization)

### 1. CKAN discovery (best-effort)
- CKAN API base URL: `ckan_base_url`
- Default: `https://data.moa.gov.et`
- Sync attempts:
  - `package_search` with `q=tags:Livestock` and/or `q=tags:livestock`
  - `package_search` with query term `livestock-commercialization`

After discovery, the sync fetches candidate CKAN resources and tries to parse JSON-array payloads it can understand.

## Stored Table + Stable IDs

- Table: `master_livestock_catalogue`
- Sync identity key: `source_record_key`
- When upstream `id` exists, the sync uses it as the stable key.
- If upstream `id` is missing, the sync falls back to a deterministic hash of the normalized row content.

### Upsert rule (no delete+reinsert)
Sync uses `INSERT ... ON CONFLICT (source_system, source_catalogue, source_record_key) DO UPDATE`
to preserve OpenAgriNet `_id` values across syncs.

## Admin Views

- Admin view: `vw_admin_master_livestock_catalogue`
- Read endpoint: `GET /api/masterdata/livestock_catalogue`

