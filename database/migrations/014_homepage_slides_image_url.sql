-- Migration 014: Add image_url to homepage_slides for direct static image URLs
ALTER TABLE homepage_slides
  ADD COLUMN IF NOT EXISTS image_url text;
