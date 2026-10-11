-- Migration 025: Public Gallery
-- Table linking reusable media_assets to the public website gallery with display order and optional public caption

CREATE TABLE IF NOT EXISTS public_gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL UNIQUE REFERENCES media_assets(id) ON DELETE RESTRICT,
  sort_order integer NOT NULL DEFAULT 1,
  custom_title text,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT public_gallery_items_sort_order_check CHECK (sort_order >= 1)
);

CREATE INDEX IF NOT EXISTS public_gallery_items_sort_idx ON public_gallery_items(sort_order ASC, created_at ASC);
CREATE INDEX IF NOT EXISTS public_gallery_items_media_id_idx ON public_gallery_items(media_id);
