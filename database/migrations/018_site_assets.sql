-- Migration 018: Site Assets
-- Implements a key-value image management table for static page-specific images
-- (About hero, TravelWithUs hero, activity cards, CTA backgrounds, etc.)
-- These are admin-managed via the Content admin panel and consumed through the API.
-- S3 storage is used for uploaded images; external URLs are also supported.

CREATE TABLE IF NOT EXISTS site_assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_key     TEXT NOT NULL UNIQUE,       -- e.g. 'ABOUT_HERO', 'ACTIVITY_ALPINE_TREKKING'
  label         TEXT NOT NULL,              -- Human-readable label for admin UI
  group_name    TEXT NOT NULL,              -- Logical group: 'about', 'homepage', 'activities', 'pages'
  image_url     TEXT,                       -- Final resolved URL (external or built from storage key)
  storage_bucket TEXT,                     -- S3 bucket name (null for external URLs)
  storage_key   TEXT,                      -- S3 object key (null for external URLs)
  alt_text      TEXT,                      -- Alt text for accessibility
  description   TEXT,                      -- Admin hint / description of where this image is used
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast group lookups (admin UI renders by group)
CREATE INDEX IF NOT EXISTS idx_site_assets_group ON site_assets (group_name);

-- Seed the known static asset slots with their current Unsplash placeholder URLs.
-- These are TEMPLATE/DEMO images flagged for replacement.
-- The admin system is immediately ready to accept replacement images.
INSERT INTO site_assets (asset_key, label, group_name, image_url, alt_text, description) VALUES
  -- About page
  ('ABOUT_HERO',             'About Us Hero Image',          'about',      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920&h=900&fit=crop&auto=format',      'Hikers on Himalayan trail',         'Full-width hero image at the top of the About Us page'),
  ('ABOUT_DEEP_ROOTS',       'About Us — Deep Roots Image',  'about',      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop&auto=format',   'Local Uttarakhand community',       'Image in the Deep Roots section on the About page (forest background section)'),
  ('ABOUT_CTA_BG',           'About Us CTA Background',      'about',      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=600&fit=crop&auto=format',  'Forest light through trees',        'Background image for the CTA banner at the bottom of the About page'),

  -- Homepage
  ('HOME_WHY_US_IMAGE',      'Homepage — Why Us Image',      'homepage',   'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&h=600&fit=crop&auto=format',   'Travelers around campfire',         'Side image in the "Why Travelers Love Us" section on the homepage'),
  ('HOME_CTA_BG',            'Homepage CTA Background',      'homepage',   'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=600&fit=crop&auto=format',  'Forest mountain path',              'Background image for the "Ready to Travel Better?" CTA banner on the homepage'),

  -- Travel With Us page
  ('TRAVEL_WITH_US_HERO',    'Travel With Us Hero',          'pages',      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop&auto=format', 'Himalayan landscape',               'Full-width hero image on the Travel With Us page'),
  ('TRAVEL_WITH_US_CTA_BG',  'Travel With Us CTA Background','pages',      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=600&fit=crop&auto=format',  'Forest mountain path',              'Background image for the CTA section at the bottom of Travel With Us page'),

  -- Other page heroes
  ('PAST_TRIPS_HERO',        'Past Trips Page Hero',         'pages',      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=600&fit=crop&auto=format',   'Himalayan mountain valley',         'Hero image on the Past Adventures / Past Trips page'),
  ('REVIEWS_HERO',           'Reviews Page Hero',            'pages',      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1920&h=800&fit=crop&auto=format',   'Mountain travellers community',     'Hero image on the Reviews page'),
  ('FAQ_HERO',               'FAQ / Contact Page Hero',      'pages',      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1920&h=800&fit=crop&auto=format',   'Himalayan peaks',                   'Hero image on the FAQ & Contact page'),

  -- Activity category cards (Travel With Us page)
  ('ACTIVITY_ALPINE_TREKKING',    'Activity — Alpine Trekking',    'activities', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop&auto=format',  'Alpine trekking in Himalayas',      'Card image for Alpine Trekking category on the Travel With Us page'),
  ('ACTIVITY_MOUNTAIN_CAMPING',   'Activity — Mountain Camping',   'activities', 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=600&h=400&fit=crop&auto=format',  'Mountain camping at night',         'Card image for Mountain Camping category on the Travel With Us page'),
  ('ACTIVITY_RIVER_RAFTING',      'Activity — River Rafting',      'activities', 'https://images.unsplash.com/photo-1541540720359-d9c4da8f55af?w=600&h=400&fit=crop&auto=format',  'River rafting in Rishikesh',        'Card image for River Rafting category on the Travel With Us page'),
  ('ACTIVITY_HIMALAYAN_TEMPLES',  'Activity — Himalayan Temples',  'activities', 'https://images.unsplash.com/photo-1580281657702-257584239a55?w=600&h=400&fit=crop&auto=format',  'Himalayan temple architecture',     'Card image for Himalayan Temples category on the Travel With Us page'),
  ('ACTIVITY_SNOW_ADVENTURES',    'Activity — Snow Adventures',    'activities', 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600&h=400&fit=crop&auto=format',  'Snow adventure in mountains',       'Card image for Snow Adventures category on the Travel With Us page'),
  ('ACTIVITY_SUNRISE_MEDITATION', 'Activity — Sunrise Meditation', 'activities', 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&h=400&fit=crop&auto=format',  'Sunrise meditation in mountains',   'Card image for Sunrise Meditation category on the Travel With Us page')

ON CONFLICT (asset_key) DO NOTHING;

COMMENT ON TABLE site_assets IS 'Admin-managed static page images (hero, CTA backgrounds, activity cards, etc.). Replaces hardcoded URLs in page components. Images stored in S3 under site/ prefix.';
