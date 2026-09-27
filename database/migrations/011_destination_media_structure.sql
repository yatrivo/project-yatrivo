-- Migration: 011_destination_media_structure.sql
-- Description: Adds destination_id reference to media_assets for automated destination-based media organization and filtering.

ALTER TABLE media_assets 
ADD COLUMN IF NOT EXISTS destination_id uuid REFERENCES destinations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS media_assets_destination_id_idx ON media_assets(destination_id);

-- 1. Backfill destination_id from destinations cover_media_id
UPDATE media_assets m
SET destination_id = d.id
FROM destinations d
WHERE d.cover_media_id = m.id
  AND m.destination_id IS NULL;

-- 2. Backfill destination_id from destination_media
UPDATE media_assets m
SET destination_id = dm.destination_id
FROM destination_media dm
WHERE dm.media_id = m.id
  AND m.destination_id IS NULL;

-- 3. Backfill destination_id from trips cover_media_id via trip_destinations
UPDATE media_assets m
SET destination_id = td.destination_id
FROM trips t
JOIN trip_destinations td ON td.trip_id = t.id
WHERE t.cover_media_id = m.id
  AND m.destination_id IS NULL;

-- 4. Backfill destination_id from trip_media via trip_destinations
UPDATE media_assets m
SET destination_id = td.destination_id
FROM trip_media tm
JOIN trip_destinations td ON td.trip_id = tm.trip_id
WHERE tm.media_id = m.id
  AND m.destination_id IS NULL;

-- 5. Backfill destination_id by parsing slug from storage_key (e.g. destinations/kedarnath/...)
UPDATE media_assets m
SET destination_id = d.id
FROM destinations d
WHERE m.storage_key LIKE 'destinations/' || d.slug || '/%'
  AND m.destination_id IS NULL;
