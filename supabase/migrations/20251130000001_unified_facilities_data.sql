-- Migration: Data Migration to Unified Facilities
-- Purpose: Migrate existing buildings and old facilities data to new unified table

-- Helper function to create URL-friendly slugs
CREATE OR REPLACE FUNCTION slugify(text) RETURNS text AS $$
  SELECT lower(regexp_replace(regexp_replace($1, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
$$ LANGUAGE sql IMMUTABLE;

-- Migrate buildings (has_rooms = true)
INSERT INTO facilities (name, slug, description, category, has_rooms, latitude, longitude, image_url, created_at)
SELECT 
  name,
  COALESCE(slug, slugify(name)),
  description,
  'academic'::facility_category, -- Default category, update as needed
  true,
  latitude,
  longitude,
  image_url,
  COALESCE(created_at, now())
FROM buildings
ON CONFLICT (slug) DO NOTHING;

-- Note: Old facilities table migration would go here if it exists
-- The old facilities table used building_id as FK, which we're replacing

-- Clean up helper function (optional, can keep for future use)
-- DROP FUNCTION IF EXISTS slugify(text);
