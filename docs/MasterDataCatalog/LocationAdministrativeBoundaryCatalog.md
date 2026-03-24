# Location Administrative Boundary Catalogue (Admin Master Data)

## Data Sources

### 1. CKAN dataset
- Dataset ID: `ethiopian-administrative-boundary`
- CKAN API base URL: `ckan_base_url`

### 2. GeoServer/WFS GeoJSON resource
- Base URL (config key): `ethionsdi_wfs_base_url`
- Sync selects a dataset resource that provides GeoJSON via WFS `outputFormat=json` (when available).

## Stored Table + Stable IDs

- Table: `master_location_administrative_boundaries`
- Stable sync key: `source_record_key`
  - Derived from upstream `p_code` extracted from feature properties
  - Sync upserts rows (no delete+reinsert), preserving OpenAgriNet `_id` values.

## Admin Views

- Admin view: `vw_admin_master_location_administrative_boundaries`
- Read endpoint: `GET /api/masterdata/location_catalogue`

