-- Migration 008: Restructure Destination Tags, Trip Highlights & FAQs, Global Cancellation Policy
BEGIN;

-- 1. Destinations: Add experience_tags text array and GIN index
ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS experience_tags text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS destinations_tags_gin_idx ON destinations USING GIN(experience_tags);

-- Populate initial experience tags for existing destinations
UPDATE destinations
SET experience_tags = ARRAY['Trekking & Hiking', 'Nature & Wildlife', 'Snow & Winter', 'Camping & Outdoors']
WHERE slug = 'chopta' OR name ILIKE '%chopta%';

UPDATE destinations
SET experience_tags = ARRAY['Adventure', 'Snow & Winter', 'Nature & Wildlife']
WHERE slug = 'auli' OR name ILIKE '%auli%';

UPDATE destinations
SET experience_tags = ARRAY['Adventure', 'Spiritual & Pilgrimage', 'Wellness & Retreats']
WHERE slug = 'rishikesh' OR name ILIKE '%rishikesh%';

UPDATE destinations
SET experience_tags = ARRAY['Spiritual & Pilgrimage', 'Trekking & Hiking', 'Culture & Heritage']
WHERE slug = 'kedarnath' OR name ILIKE '%kedarnath%';

UPDATE destinations
SET experience_tags = ARRAY['Camping & Outdoors', 'Nature & Wildlife', 'Wellness & Retreats']
WHERE slug = 'kanatal' OR name ILIKE '%kanatal%';

UPDATE destinations
SET experience_tags = ARRAY['Nature & Wildlife', 'Lakes & Waterfalls', 'Village & Rural Life']
WHERE slug = 'chakrata' OR name ILIKE '%chakrata%';

UPDATE destinations
SET experience_tags = ARRAY['Culture & Heritage', 'Nature & Wildlife', 'Wellness & Retreats']
WHERE slug = 'mussoorie' OR name ILIKE '%mussoorie%';

-- 2. Trips: Add flexible structured highlights and faqs columns
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS highlights jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]';

-- Populate default highlights for existing trips where highlights is currently empty
UPDATE trips
SET highlights = jsonb_build_array(
  jsonb_build_object('icon', '📍', 'label', 'Starting Point', 'value', COALESCE(starting_point, 'Dehradun')),
  jsonb_build_object('icon', '👥', 'label', 'Group Size', 'value', 'Max 12'),
  jsonb_build_object('icon', '🏕️', 'label', 'Stay Style', 'value', 'Timber Cabins'),
  jsonb_build_object('icon', '🍽️', 'label', 'Meals', 'value', 'All Included')
)
WHERE highlights IS NULL OR jsonb_array_length(highlights) = 0;

-- Populate default FAQs for existing trips where faqs is currently empty
UPDATE trips
SET faqs = jsonb_build_array(
  jsonb_build_object('question', 'What fitness level is required?', 'answer', 'A moderate fitness level with basic walking stamina. No prior high-altitude expedition experience is required.'),
  jsonb_build_object('question', 'What should I pack?', 'answer', 'Warm thermal layers, waterproof shell jacket, sturdy trekking shoes, sunglasses, and personal medication. We provide a detailed packing list upon booking.'),
  jsonb_build_object('question', 'Is altitude sickness a risk?', 'answer', 'Routes above 2,500m include gradual acclimatization. Our trek leaders carry pulse oximeters and first-aid kits.'),
  jsonb_build_object('question', 'Are meals included?', 'answer', 'Yes, all wholesome mountain meals (Pahadi local cuisine and organic produce) are provided throughout the itinerary.')
)
WHERE faqs IS NULL OR jsonb_array_length(faqs) = 0;

-- 3. Seed Global Cancellation Policy in site_settings
INSERT INTO site_settings (key, value)
VALUES (
  'cancellation_policy',
  '{
    "title": "Global Cancellation & Refund Policy",
    "description": "Our mindful Himalayan trips prioritize small-group planning and authentic village stays. Cancellations are processed based on notice given prior to scheduled departure.",
    "rules": [
      { "days": "30+ days before departure", "refund": "100%", "note": "Full refund (less nominal processing fee)" },
      { "days": "15–29 days before departure", "refund": "50%", "note": "50% refund or 100% trip credit voucher" },
      { "days": "Under 15 days before departure", "refund": "0%", "note": "Non-refundable due to reserved cabin & permit logistics" }
    ]
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

COMMIT;
