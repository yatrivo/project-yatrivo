-- Migration 013: Link review requests and reviews to individual passengers (booking_travellers)

ALTER TABLE review_requests
  ADD COLUMN IF NOT EXISTS booking_traveller_id uuid REFERENCES booking_travellers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS review_requests_booking_traveller_idx ON review_requests(booking_traveller_id);

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS booking_traveller_id uuid REFERENCES booking_travellers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS reviews_booking_traveller_idx ON reviews(booking_traveller_id);
