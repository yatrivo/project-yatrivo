-- Yatrivo Destination Lifecycle Migration
-- Sets default status to 'active', adds archived_at, cover_image_url, and gallery_image_urls

ALTER TABLE destinations 
  ALTER COLUMN status SET DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_image_urls text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS destinations_status_idx ON destinations(status);
CREATE INDEX IF NOT EXISTS destinations_archived_at_idx ON destinations(archived_at);
