-- Migration 026: Multi-resolution image variants and gallery cursor pagination index
-- Adds variant URL columns, tiny base64 placeholder, and structured variants metadata to media_assets
-- while preserving a single media_assets record per logical image.

BEGIN;

ALTER TABLE media_assets
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS medium_url text,
  ADD COLUMN IF NOT EXISTS viewer_url text,
  ADD COLUMN IF NOT EXISTS placeholder_base64 text,
  ADD COLUMN IF NOT EXISTS variants jsonb;

-- Index for fast cursor-based pagination on public_gallery_items
CREATE INDEX IF NOT EXISTS public_gallery_items_cursor_idx
  ON public_gallery_items(sort_order ASC, created_at ASC, id ASC);

-- Partial index to quickly locate internal storage assets needing variant backfill
CREATE INDEX IF NOT EXISTS media_assets_missing_variants_idx
  ON media_assets(created_at ASC)
  WHERE storage_key IS NOT NULL
    AND (thumbnail_url IS NULL OR medium_url IS NULL OR viewer_url IS NULL OR placeholder_base64 IS NULL);

COMMIT;
