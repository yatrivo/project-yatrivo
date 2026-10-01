-- Migration: 020_destination_media_associations.sql
-- Description: Backfill and synchronize all destination media associations (cover, gallery, trips, library)
-- ensuring many-to-many destination linking for both existing and future images.

BEGIN;

CREATE INDEX IF NOT EXISTS destination_media_dest_media_idx ON destination_media(destination_id, media_id);
CREATE INDEX IF NOT EXISTS destination_media_media_dest_idx ON destination_media(media_id, destination_id);
CREATE INDEX IF NOT EXISTS destination_media_usage_idx ON destination_media(usage);

-- 1. Ensure all destination cover images exist in media_assets and destination_media
DO $$
DECLARE
  dest RECORD;
  m_id uuid;
  clean_url text;
BEGIN
  FOR dest IN
    SELECT id, name, cover_image_url, cover_media_id
    FROM destinations
    WHERE (cover_image_url IS NOT NULL AND cover_image_url <> '') OR cover_media_id IS NOT NULL
  LOOP
    m_id := dest.cover_media_id;

    IF m_id IS NULL AND dest.cover_image_url IS NOT NULL AND dest.cover_image_url <> '' THEN
      clean_url := split_part(dest.cover_image_url, '?', 1);
      
      SELECT id INTO m_id 
      FROM media_assets 
      WHERE split_part(coalesce(public_url, external_url), '?', 1) = clean_url
      LIMIT 1;

      IF m_id IS NULL THEN
        INSERT INTO media_assets (
          category, destination_id, label, external_url, public_url, mime_type
        ) VALUES (
          'destinations', dest.id, dest.name || ' Cover', dest.cover_image_url, dest.cover_image_url, 'image/jpeg'
        ) RETURNING id INTO m_id;
      END IF;

      UPDATE destinations
      SET cover_media_id = m_id
      WHERE id = dest.id AND cover_media_id IS NULL;
    END IF;

    IF m_id IS NOT NULL THEN
      INSERT INTO destination_media (destination_id, media_id, usage, sort_order)
      VALUES (dest.id, m_id, 'cover', 0)
      ON CONFLICT (destination_id, media_id, usage) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- 2. Ensure all destination gallery images exist in media_assets and destination_media
DO $$
DECLARE
  dest RECORD;
  g_url text;
  clean_url text;
  m_id uuid;
  idx integer;
BEGIN
  FOR dest IN
    SELECT id, name, gallery_image_urls
    FROM destinations
    WHERE gallery_image_urls IS NOT NULL AND array_length(gallery_image_urls, 1) > 0
  LOOP
    idx := 1;
    FOREACH g_url IN ARRAY dest.gallery_image_urls
    LOOP
      IF g_url IS NOT NULL AND g_url <> '' THEN
        clean_url := split_part(g_url, '?', 1);

        SELECT id INTO m_id
        FROM media_assets
        WHERE split_part(coalesce(public_url, external_url), '?', 1) = clean_url
        LIMIT 1;

        IF m_id IS NULL THEN
          INSERT INTO media_assets (
            category, destination_id, label, external_url, public_url, mime_type
          ) VALUES (
            'destinations', dest.id, dest.name || ' Gallery ' || idx, g_url, g_url, 'image/jpeg'
          ) RETURNING id INTO m_id;
        END IF;

        INSERT INTO destination_media (destination_id, media_id, usage, sort_order)
        VALUES (dest.id, m_id, 'gallery', idx)
        ON CONFLICT (destination_id, media_id, usage) DO UPDATE SET
          sort_order = EXCLUDED.sort_order;

        idx := idx + 1;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 3. Backfill destination_media from existing direct destination_id on media_assets
INSERT INTO destination_media (destination_id, media_id, usage, sort_order)
SELECT m.destination_id, m.id, 'library', 0
FROM media_assets m
WHERE m.destination_id IS NOT NULL
ON CONFLICT (destination_id, media_id, usage) DO NOTHING;

-- 4. Backfill destination_media from storage_key destination slug path
INSERT INTO destination_media (destination_id, media_id, usage, sort_order)
SELECT d.id, m.id, 'library', 0
FROM media_assets m
JOIN destinations d ON m.storage_key LIKE 'destinations/' || d.slug || '/%'
ON CONFLICT (destination_id, media_id, usage) DO NOTHING;

-- 5. Backfill destination_media from trip cover media
INSERT INTO destination_media (destination_id, media_id, usage, sort_order)
SELECT td.destination_id, t.cover_media_id, 'trip_cover', 0
FROM trips t
JOIN trip_destinations td ON td.trip_id = t.id
WHERE t.cover_media_id IS NOT NULL
ON CONFLICT (destination_id, media_id, usage) DO NOTHING;

-- 6. Backfill destination_media from trip gallery media
INSERT INTO destination_media (destination_id, media_id, usage, sort_order)
SELECT td.destination_id, tm.media_id, 'trip_gallery', tm.sort_order
FROM trip_media tm
JOIN trip_destinations td ON td.trip_id = tm.trip_id
WHERE tm.media_id IS NOT NULL
ON CONFLICT (destination_id, media_id, usage) DO NOTHING;

COMMIT;
