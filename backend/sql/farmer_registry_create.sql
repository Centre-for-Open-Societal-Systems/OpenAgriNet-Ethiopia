-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table if not exists
CREATE TABLE IF NOT EXISTS tbl_farmer_registry (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  unique_id VARCHAR(50) UNIQUE,
  national_id VARCHAR(50) NOT NULL UNIQUE,

  given_name VARCHAR(255) NOT NULL,
  family_name VARCHAR(255),
  gf_name_eng VARCHAR(255),

  first_name_amh VARCHAR(255),
  family_name_amh VARCHAR(255),
  gf_name_amh VARCHAR(255),

  gender VARCHAR(10),
  birthdate DATE,
  birthdate_ec VARCHAR(20),

  phone_number VARCHAR(20),

  admin_level_1 VARCHAR(100),
  admin_level_2 VARCHAR(100),
  admin_level_3 VARCHAR(100),
  admin_level_4 VARCHAR(100),

  household_size INT,
  primary_livelihood VARCHAR(150),

  registration_date DATE,
  status VARCHAR(20) DEFAULT 'Valid',

  verification_status BOOLEAN,
  verification_date DATE,
  verified_by VARCHAR(100),

  source_system VARCHAR(100),
  source_id VARCHAR(100),

  notes TEXT,

  create_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  create_uid VARCHAR(100),
  write_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  write_uid VARCHAR(100)
);

-- Add missing columns safely (future-proof)
DO $$
BEGIN

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='tbl_farmer_registry' AND column_name='last_sync_timestamp'
    ) THEN
        ALTER TABLE tbl_farmer_registry ADD COLUMN last_sync_timestamp TIMESTAMP WITH TIME ZONE;
    END IF;

END
$$;
