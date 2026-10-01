-- Migration 022: Add trip_id to homepage_slides and backfill from trip_instances
ALTER TABLE homepage_slides
  ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES trips(id) ON DELETE SET NULL;

-- Backfill trip_id from trip_instances for any existing rows that have trip_instance_id
UPDATE homepage_slides hs
SET trip_id = ti.trip_id
FROM trip_instances ti
WHERE hs.trip_instance_id = ti.id
  AND hs.trip_id IS NULL;
