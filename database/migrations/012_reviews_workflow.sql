-- Migration 012: Reviews and Post-Trip Review Workflow Enhancements

ALTER TABLE review_requests
  ADD COLUMN IF NOT EXISTS token text,
  ADD COLUMN IF NOT EXISTS custom_message text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS review_requests_token_idx ON review_requests(token);

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';

-- Seed initial completed departure reviews if reviews table is empty
DO $$
DECLARE
  chopta_trip_id uuid;
  chopta_inst_id uuid;
  chopta_dest_id uuid;
  rishikesh_trip_id uuid;
  rishikesh_inst_id uuid;
  rishikesh_dest_id uuid;
  rev_count integer;
BEGIN
  SELECT count(*) INTO rev_count FROM reviews;
  IF rev_count = 0 THEN
    -- Find Chopta trip and completed instance
    SELECT t.id, td.destination_id INTO chopta_trip_id, chopta_dest_id 
    FROM trips t 
    LEFT JOIN trip_destinations td ON td.trip_id = t.id 
    WHERE t.name ILIKE '%Chopta%' LIMIT 1;

    SELECT id INTO chopta_inst_id FROM trip_instances WHERE trip_id = chopta_trip_id AND completed_at IS NOT NULL LIMIT 1;

    -- Find Rishikesh trip and completed instance
    SELECT t.id, td.destination_id INTO rishikesh_trip_id, rishikesh_dest_id 
    FROM trips t 
    LEFT JOIN trip_destinations td ON td.trip_id = t.id 
    WHERE t.name ILIKE '%Rishikesh%' LIMIT 1;

    SELECT id INTO rishikesh_inst_id FROM trip_instances WHERE trip_id = rishikesh_trip_id AND completed_at IS NOT NULL LIMIT 1;

    IF chopta_trip_id IS NOT NULL THEN
      INSERT INTO reviews (trip_id, trip_instance_id, destination_id, reviewer_name, reviewer_avatar_initials, rating, body, status, submitted_at, published_at, photo_urls)
      VALUES (
        chopta_trip_id,
        chopta_inst_id,
        chopta_dest_id,
        'Siddharth Verma',
        'SV',
        5,
        'The views were unreal, but what made it truly magical was our crew and local guides. We stayed in warm wooden huts and sang pahadi folk songs around a real fireplace. Yatrivo''s attention to every tiny detail — from the food to the trail timings — was flawless.',
        'published',
        now() - interval '10 days',
        now() - interval '9 days',
        ARRAY['https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&fit=crop']
      );

      INSERT INTO reviews (trip_id, trip_instance_id, destination_id, reviewer_name, reviewer_avatar_initials, rating, body, status, submitted_at, published_at, photo_urls)
      VALUES (
        chopta_trip_id,
        chopta_inst_id,
        chopta_dest_id,
        'Tanvi Deshmukh',
        'TD',
        5,
        'Unbelievable sunrise trek to Chandrashila summit. The guides were extremely attentive, safe, and motivating. Highly recommended for beginners and experienced trekkers alike!',
        'pending',
        now() - interval '2 days',
        null,
        ARRAY['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&fit=crop']
      );
    END IF;

    IF rishikesh_trip_id IS NOT NULL THEN
      INSERT INTO reviews (trip_id, trip_instance_id, destination_id, reviewer_name, reviewer_avatar_initials, rating, body, status, submitted_at, published_at, photo_urls)
      VALUES (
        rishikesh_trip_id,
        rishikesh_inst_id,
        rishikesh_dest_id,
        'Ananya Mehta',
        'AM',
        5,
        'Truly a mindful escape. Yatrivo balanced intense white-water rafting with sunrise meditation. Premium riverside glamping with certified guides who put ecological respect first. The evening aarti was a moment I''ll carry forever.',
        'published',
        now() - interval '20 days',
        now() - interval '19 days',
        ARRAY['https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&fit=crop']
      );
    END IF;
  END IF;
END $$;
