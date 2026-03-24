# Crop/Seed Catalogue Specification (Admin Master Data)

## Data Sources

### 1. CKAN discovery (optional, used by the sync runner)
- CKAN API base URL: `ckan_base_url`
- Default: `https://data.moa.gov.et`
- CKAN actions used:
  - `package_search` to locate the Ethiopian Seed Catalog dataset and its resources
  - `package_show` (via discovery) to read dataset metadata

### 2. Ethiopian Seed Catalog (authoritative data)
- Base URL: `ethioseed_base_url`
- Default: `https://ethioseed.moa.gov.et`
- Endpoints:
  - `/api/crops-catalog`
  - `/api/varieties-catalog`

## Stored Table + Stable IDs

- Table: `master_crop_seed_varieties`
- Sync identity key (stable across updates): `source_record_key`
- Upstream stable key used by the sync: `varieties.id`

### Upsert rule (no delete+reinsert)
Sync uses `INSERT ... ON CONFLICT (source_system, source_catalogue, source_record_key) DO UPDATE`
so OpenAgriNet `_id` values remain stable.

## Admin Views

- Admin view: `vw_admin_master_crop_seed_varieties`
- Read endpoint: `GET /api/masterdata/crop_catalogue`

