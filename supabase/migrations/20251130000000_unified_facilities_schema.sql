-- Migration: Unified Facilities Schema
-- Purpose: Create unified facilities table that replaces separate buildings and facilities tables
-- The has_rooms boolean discriminates between buildings (true) and POIs (false)

-- 1. Create facility_category enum with all possible categories
-- Categories aligned with VSU campus data (locations.md)
CREATE TYPE facility_category AS ENUM (
  -- Buildings with rooms (has_rooms = true)
  'academic',
  'administrative',
  'research',
  'office',
  'residential',
  'dormitory',
  'lodging',
  -- Facilities/POIs (has_rooms = false typically)
  'sports',
  'dining',
  'library',
  'medical',
  'parking',
  'landmark',
  'religious',
  'utility',
  'commercial',
  'transportation',
  'atm'
);

-- 2. Create unified facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category facility_category NOT NULL,
  has_rooms BOOLEAN NOT NULL DEFAULT false,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes for common queries
CREATE INDEX idx_facilities_category ON facilities(category);
CREATE INDEX idx_facilities_has_rooms ON facilities(has_rooms);
CREATE INDEX idx_facilities_slug ON facilities(slug);
CREATE INDEX idx_facilities_location ON facilities(latitude, longitude);

-- 4. Enable RLS
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- 5. Public read policy
CREATE POLICY "Public read access for facilities"
  ON facilities
  FOR SELECT
  TO public
  USING (true);

-- 6. Authenticated write policy
CREATE POLICY "Authenticated users can manage facilities"
  ON facilities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER facilities_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
