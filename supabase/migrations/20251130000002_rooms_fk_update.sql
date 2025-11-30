-- Migration: Update Rooms FK to Reference Unified Facilities
-- Purpose: Add facility_id column to rooms table, migrate data, and update constraints

-- 1. Add new facility_id column
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS facility_id UUID;

-- 2. Migrate existing building_id references to facility_id
-- Match by building name to facility name (since we migrated buildings to facilities)
UPDATE rooms r
SET facility_id = f.id
FROM buildings b
JOIN facilities f ON f.name = b.name AND f.has_rooms = true
WHERE r.building_id = b.id
  AND r.facility_id IS NULL;

-- 3. Add foreign key constraint
ALTER TABLE rooms 
ADD CONSTRAINT fk_rooms_facility 
FOREIGN KEY (facility_id) 
REFERENCES facilities(id) 
ON DELETE CASCADE;

-- 4. Create index for the new FK
CREATE INDEX IF NOT EXISTS idx_rooms_facility_id ON rooms(facility_id);

-- Note: building_id column is kept for backward compatibility during transition
-- It can be dropped in a future migration after all code is updated
