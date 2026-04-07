-- Enable the uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table users if it does not exist
CREATE TABLE IF NOT EXISTS users (
    _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add new columns if they do not exist (safe for future schema amendments)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='last_login'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='status'
    ) THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END
$$;

-- =========================================================
-- App configuration (source base URLs)
-- =========================================================

CREATE TABLE IF NOT EXISTS app_configuration (
  _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_group TEXT NOT NULL DEFAULT 'masterdata',
  config_key TEXT NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (config_group, config_key)
);

CREATE OR REPLACE VIEW vw_admin_app_configuration AS
SELECT
  _id,
  config_group,
  config_key,
  config_value,
  description,
  is_active,
  updated_at
FROM app_configuration
WHERE config_group = 'masterdata';

-- Default source base URLs (insert-if-not-exists)
INSERT INTO app_configuration (config_group, config_key, config_value, description)
VALUES
  ('masterdata', 'ckan_base_url', 'https://data.moa.gov.et', 'Legacy MOA data portal CKAN API base URL'),
  ('masterdata', 'datahub_base_url', 'https://datahub.moa.gov.et', 'National Agricultural Data Hub CKAN API base URL'),
  ('masterdata', 'ethioseed_base_url', 'https://ethioseed.moa.gov.et', 'EthioSeed platform base URL (crop / seed catalogue)'),
  ('masterdata', 'ethionsdi_wfs_base_url', 'https://ethionsdi.gov.et/geoserver/wfs', 'Administrative boundary GeoServer WFS base URL (fallback)')
ON CONFLICT (config_group, config_key) DO NOTHING;

-- =========================================================
-- Master data: external catalogues (Crop/Seed, Location, Livestock)
-- =========================================================

-- Tracks sync runs so the admin can see what was pulled and when.
CREATE TABLE IF NOT EXISTS masterdata_sync_jobs (
  _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  catalogue TEXT NOT NULL, -- 'crop_catalogue' | 'location_catalogue' | 'livestock_catalogue' | 'all'
  status TEXT NOT NULL CHECK (status IN ('running','success','failed')),
  source_query JSONB NOT NULL DEFAULT '{}'::jsonb,

  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,

  inserted_count INT NOT NULL DEFAULT 0,
  updated_count INT NOT NULL DEFAULT 0,
  deactivated_count INT NOT NULL DEFAULT 0,

  last_error TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1) Crop Catalogue (Seed Varieties)
-- Note: IDs used across the app must remain stable, so we upsert using source_record_key
-- and never delete/reinsert rows.
CREATE TABLE IF NOT EXISTS master_crop_seed_varieties (
  _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  source_system TEXT NOT NULL, -- e.g. 'ethioseed.moa.gov.et'
  source_catalogue TEXT NOT NULL, -- 'crop_catalogue'

  -- Stable external identifier derived from CKAN rows/resources (or upstream API row id)
  source_record_key TEXT NOT NULL,

  variety_name TEXT,
  crop_name TEXT,
  producer_name TEXT,
  seed_supply_notes TEXT,

  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_hash TEXT,

  source_updated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (source_system, source_catalogue, source_record_key)
);

CREATE INDEX IF NOT EXISTS idx_master_crop_seed_varieties_active
  ON master_crop_seed_varieties (is_active);

-- 2) Location Catalogue (Administrative Boundaries)
CREATE TABLE IF NOT EXISTS master_location_administrative_boundaries (
  _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  source_system TEXT NOT NULL, -- e.g. 'datahub.moa.gov.et' | 'data.moa.gov.et' | 'ethionsdi.gov.et'
  source_catalogue TEXT NOT NULL, -- 'location_catalogue'

  source_record_key TEXT NOT NULL, -- stable: e.g. 'woreda:<p_code>'

  level TEXT, -- 'region' | 'zone' | 'woreda' (kept as text to match upstream values)
  p_code TEXT,
  name TEXT,
  parent_p_code TEXT,

  -- GeoJSON geometry (upstream WFS/WMS feed)
  geometry_geojson JSONB,

  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_hash TEXT,

  source_updated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (source_system, source_catalogue, source_record_key)
);

CREATE INDEX IF NOT EXISTS idx_master_location_administrative_boundaries_active
  ON master_location_administrative_boundaries (is_active);

-- 3) Livestock Catalogue
CREATE TABLE IF NOT EXISTS master_livestock_catalogue (
  _id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  source_system TEXT NOT NULL, -- e.g. 'datahub.moa.gov.et'
  source_catalogue TEXT NOT NULL, -- 'livestock_catalogue'

  source_record_key TEXT NOT NULL,

  species_common_name TEXT,
  species_scientific_name TEXT,
  production_program TEXT,
  animal_health_program TEXT,
  commercialization_program TEXT,

  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_hash TEXT,

  source_updated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (source_system, source_catalogue, source_record_key)
);

CREATE INDEX IF NOT EXISTS idx_master_livestock_catalogue_active
  ON master_livestock_catalogue (is_active);

-- =========================================================
-- Admin-facing views (backend enforces admin access; views keep output clean)
-- =========================================================

CREATE OR REPLACE VIEW vw_admin_master_crop_seed_varieties AS
SELECT
  _id,
  variety_name,
  crop_name,
  producer_name,
  seed_supply_notes,
  source_updated_at,
  updated_at
FROM master_crop_seed_varieties
WHERE is_active = TRUE;

CREATE OR REPLACE VIEW vw_admin_master_location_administrative_boundaries AS
SELECT
  _id,
  level,
  p_code,
  name,
  parent_p_code,
  geometry_geojson,
  source_updated_at,
  updated_at
FROM master_location_administrative_boundaries
WHERE is_active = TRUE;

CREATE OR REPLACE VIEW vw_admin_master_livestock_catalogue AS
SELECT
  _id,
  species_common_name,
  species_scientific_name,
  production_program,
  animal_health_program,
  commercialization_program,
  source_updated_at,
  updated_at
FROM master_livestock_catalogue
WHERE is_active = TRUE;