-- Migration: 021_strict_destination_media_links.sql
-- Description: Enforce strict destination media linking so that only images actually used
-- in a destination's details (cover / title page or gallery) are linked to that destination.
-- Cleans up obsolete library, trip, and storage-path linkages.

BEGIN;

-- 1. Remove all destination_media rows that are not strictly 'cover' or 'gallery'
DELETE FROM destination_media WHERE usage NOT IN ('cover', 'gallery');

-- 2. Clean up any gallery links where the media is no longer in the destination's gallery_image_urls
DELETE FROM destination_media dm
WHERE dm.usage = 'gallery'
  AND NOT EXISTS (
    SELECT 1 FROM destinations d
    JOIN media_assets ma ON ma.id = dm.media_id
    WHERE d.id = dm.destination_id
      AND EXISTS (
        SELECT 1 FROM unnest(d.gallery_image_urls) gurl
        WHERE split_part(gurl, '?', 1) = split_part(COALESCE(ma.public_url, ma.external_url), '?', 1)
      )
  );

-- 3. Clean up any cover links where the media is no longer the destination's cover
DELETE FROM destination_media dm
WHERE dm.usage = 'cover'
  AND NOT EXISTS (
    SELECT 1 FROM destinations d
    JOIN media_assets ma ON ma.id = dm.media_id
    WHERE d.id = dm.destination_id
      AND (
        d.cover_media_id = dm.media_id
        OR (d.cover_image_url IS NOT NULL AND split_part(d.cover_image_url, '?', 1) = split_part(COALESCE(ma.public_url, ma.external_url), '?', 1))
      )
  );

COMMIT;
