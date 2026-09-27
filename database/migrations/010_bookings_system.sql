-- 010_bookings_system.sql
-- Booking system lifecycle, traveller details, secure token, and booking activity timeline

ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'awaiting_traveller_details';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'details_received';

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS traveller_count integer NOT NULL DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS details_token text UNIQUE;
ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'awaiting_traveller_details';

ALTER TABLE booking_travellers ADD COLUMN IF NOT EXISTS id_number text;
ALTER TABLE booking_travellers ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE booking_travellers ADD COLUMN IF NOT EXISTS source text DEFAULT 'admin';

CREATE TABLE IF NOT EXISTS booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  old_status booking_status,
  new_status booking_status,
  title text NOT NULL,
  details jsonb,
  actor_type text NOT NULL DEFAULT 'admin',
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_events_booking_created_idx ON booking_events(booking_id, created_at ASC);
CREATE INDEX IF NOT EXISTS bookings_details_token_idx ON bookings(details_token) WHERE details_token IS NOT NULL;
