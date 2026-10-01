-- Migration 019: Remove obsolete category column from destinations
-- Destinations now exclusively use experience_tags.

BEGIN;

DROP INDEX IF EXISTS destinations_category_status_idx;

ALTER TABLE destinations
  DROP COLUMN IF EXISTS category;

COMMIT;
