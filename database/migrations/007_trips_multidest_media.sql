-- Migration 007: Trips Multidestination, Cover Media & Lifecycle Migration
BEGIN;

ALTER TABLE trips
  ALTER COLUMN status SET DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_image_urls text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS trips_status_idx ON trips(status);
CREATE INDEX IF NOT EXISTS trips_archived_at_idx ON trips(archived_at);
CREATE INDEX IF NOT EXISTS trips_cover_media_idx ON trips(cover_media_id);
CREATE INDEX IF NOT EXISTS trip_destinations_dest_idx ON trip_destinations(destination_id, trip_id);
CREATE INDEX IF NOT EXISTS trip_destinations_trip_sort_idx ON trip_destinations(trip_id, sort_order);
CREATE INDEX IF NOT EXISTS trip_media_trip_sort_idx ON trip_media(trip_id, sort_order);
CREATE INDEX IF NOT EXISTS trip_instances_trip_status_idx ON trip_instances(trip_id, is_cancelled, starts_on);

COMMIT;
