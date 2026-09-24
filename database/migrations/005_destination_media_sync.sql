-- Migration 005: Destination Media Sync & External Media Migration
-- Synchronizes existing cover and gallery image URLs into media_assets and destination_media

BEGIN;

-- 1. Ensure indexes on destination_media
CREATE INDEX IF NOT EXISTS destination_media_dest_sort_idx ON destination_media(destination_id, sort_order);
CREATE INDEX IF NOT EXISTS destination_media_media_idx ON destination_media(media_id);
CREATE INDEX IF NOT EXISTS media_assets_external_url_idx ON media_assets(external_url) WHERE external_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS media_assets_storage_key_idx ON media_assets(storage_key) WHERE storage_key IS NOT NULL;

-- 2. Migrate existing destination cover_image_urls into media_assets
DO $$
DECLARE
  dest RECORD;
  m_id uuid;
BEGIN
  FOR dest IN 
    SELECT id, name, cover_image_url 
    FROM destinations 
    WHERE cover_image_url IS NOT NULL AND cover_image_url <> ''
  LOOP
    -- Find existing or insert new external media asset
    SELECT id INTO m_id FROM media_assets WHERE external_url = dest.cover_image_url LIMIT 1;
    
    IF m_id IS NULL THEN
      INSERT INTO media_assets (
        category, label, external_url, public_url, mime_type
      ) VALUES (
        'destinations', dest.name || ' Cover', dest.cover_image_url, dest.cover_image_url, 'image/jpeg'
      ) RETURNING id INTO m_id;
    END IF;

    -- Update destination cover_media_id
    UPDATE destinations 
    SET cover_media_id = m_id 
    WHERE id = dest.id AND cover_media_id IS NULL;
  END LOOP;
END $$;

-- 3. Migrate existing destination gallery_image_urls into media_assets and destination_media
DO $$
DECLARE
  dest RECORD;
  g_url text;
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
        -- Find existing or insert new external media asset
        SELECT id INTO m_id FROM media_assets WHERE external_url = g_url LIMIT 1;
        
        IF m_id IS NULL THEN
          INSERT INTO media_assets (
            category, label, external_url, public_url, mime_type
          ) VALUES (
            'destinations', dest.name || ' Gallery ' || idx, g_url, g_url, 'image/jpeg'
          ) RETURNING id INTO m_id;
        END IF;

        -- Attach to destination_media
        INSERT INTO destination_media (
          destination_id, media_id, usage, sort_order
        ) VALUES (
          dest.id, m_id, 'gallery', idx
        ) ON CONFLICT (destination_id, media_id, usage) DO UPDATE SET
          sort_order = EXCLUDED.sort_order;

        idx := idx + 1;
      END IF;
    END LOOP;
  END LOOP;
END $$;

COMMIT;
