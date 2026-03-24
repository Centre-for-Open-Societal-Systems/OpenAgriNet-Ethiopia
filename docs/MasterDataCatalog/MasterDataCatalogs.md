# Master Data Catalogs (Admin Master Data)

OpenAgriNet maintains **master catalogues** (reference data) for the app’s canonical IDs. These catalogues are pulled from external sources and synced into OpenAgriNet **via admin-only sync jobs**.

## Data sources & base URLs

Base URLs for external sources are stored in `app_configuration` (config group `masterdata`) and can be managed through the admin API.

Default keys:
- `ckan_base_url` (default `https://data.moa.gov.et`)
- `ethioseed_base_url` (default `https://ethioseed.moa.gov.et`)
- `ethionsdi_wfs_base_url` (default `http://www.ethionsdi.gov.et/geoserver/wfs`)

## Sync overview (admin)

- Each sync run writes to `masterdata_sync_jobs`
- Sync endpoints:
  - `POST /api/masterdata/sync` with body `{ "catalogue": "crop_catalogue|location_catalogue|livestock_catalogue|all" }`
  - `GET /api/masterdata/sync-jobs/:jobId`
  - `GET /api/masterdata/:catalogue` (reads admin SQL views)

## Stable IDs rule

The sync **does not delete + reinsert**. It uses `source_record_key` as the upstream-stable identity key and performs `INSERT ... ON CONFLICT ... DO UPDATE` to preserve OpenAgriNet `_id` values across syncs.

## Dedicated catalogue docs

- [`CropSeedCatalog.md`](./CropSeedCatalog.md)
- [`LocationAdministrativeBoundaryCatalog.md`](./LocationAdministrativeBoundaryCatalog.md)
- [`LivestockCatalog.md`](./LivestockCatalog.md)

