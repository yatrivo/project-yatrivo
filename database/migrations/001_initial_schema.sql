-- Yatrivo initial PostgreSQL schema migration.
-- Source plan: docs/database-schema-v1.md

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('invited', 'active', 'disabled', 'deleted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE auth_provider AS ENUM ('password', 'phone_otp', 'google'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE destination_status AS ENUM ('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE destination_category AS ENUM ('high_altitude', 'spiritual', 'weekend', 'nature', 'adventure', 'city', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE trip_status AS ENUM ('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE trip_category AS ENUM ('trekking', 'adventure', 'weekend', 'spiritual', 'nature', 'custom', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE trip_difficulty AS ENUM ('easy', 'moderate', 'challenging', 'strenuous'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE enquiry_status AS ENUM ('received', 'contacted', 'quoted', 'confirmed', 'lost', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE enquiry_source AS ENUM ('website', 'whatsapp', 'phone', 'walk_in', 'instagram', 'google', 'admin', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE booking_status AS ENUM ('confirmed', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('cash', 'upi', 'bank_transfer', 'card', 'payment_gateway', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE review_status AS ENUM ('pending', 'published', 'hidden', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('enquiry', 'booking', 'review', 'system', 'marketing'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_status AS ENUM ('draft', 'queued', 'sent', 'failed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_channel AS ENUM ('email', 'whatsapp', 'sms', 'in_app'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE media_category AS ENUM ('homepage', 'destinations', 'trips', 'completed_trips', 'reviews', 'users', 'documents', 'general'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE content_page_status AS ENUM ('draft', 'published', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  email citext UNIQUE,
  phone text UNIQUE,
  avatar_media_id uuid,
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'invited',
  password_hash text,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  last_login_at timestamptz,
  invited_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_role_status_idx ON users(role, status);

CREATE TABLE IF NOT EXISTS user_auth_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider auth_provider NOT NULL,
  provider_subject text,
  provider_email citext,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS user_auth_identities_provider_subject_uidx ON user_auth_identities(provider, provider_subject) WHERE provider_subject IS NOT NULL;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  user_agent text,
  ip_address inet,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_expires_idx ON refresh_tokens(user_id, expires_at);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_revoked_idx ON refresh_tokens(user_id, revoked_at);

CREATE TABLE IF NOT EXISTS otp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination text NOT NULL,
  purpose text NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_challenges_lookup_idx ON otp_challenges(destination, purpose, expires_at);

CREATE TABLE IF NOT EXISTS media_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES media_folders(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL,
  storage_path text NOT NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_id, slug)
);

CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES media_folders(id) ON DELETE SET NULL,
  category media_category NOT NULL DEFAULT 'general',
  label text,
  alt_text text,
  storage_bucket text DEFAULT 'yatrivo-media',
  storage_key text,
  external_url text,
  public_url text,
  mime_type text,
  file_size_bytes integer,
  width integer,
  height integer,
  checksum_sha256 text,
  uploaded_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_assets_one_source_chk CHECK ((storage_key IS NOT NULL) <> (external_url IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS media_assets_category_created_idx ON media_assets(category, created_at DESC);

DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_avatar_media_fk FOREIGN KEY (avatar_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  description text,
  category destination_category NOT NULL DEFAULT 'other',
  season_label text,
  best_time_label text,
  elevation_label text,
  status destination_status NOT NULL DEFAULT 'draft',
  sort_order integer NOT NULL DEFAULT 0,
  seo_title text,
  seo_description text,
  og_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  cover_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS destinations_status_sort_idx ON destinations(status, sort_order);
CREATE INDEX IF NOT EXISTS destinations_category_status_idx ON destinations(category, status);

CREATE TABLE IF NOT EXISTS destination_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  text text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS destination_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS destination_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
  usage text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(destination_id, media_id, usage)
);

CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  short_description text,
  overview text,
  duration_label text NOT NULL,
  duration_days integer,
  duration_nights integer,
  category trip_category NOT NULL DEFAULT 'other',
  difficulty trip_difficulty,
  price_from_paise integer NOT NULL DEFAULT 0,
  currency char(3) NOT NULL DEFAULT 'INR',
  price_notes text,
  cancellation_policy text,
  badge text,
  starting_point text,
  suitable_for text,
  accommodation_summary text,
  transport_summary text,
  important_notes text,
  status trip_status NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  seo_title text,
  seo_description text,
  og_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  cover_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trips_status_sort_idx ON trips(status, sort_order);
CREATE INDEX IF NOT EXISTS trips_category_status_idx ON trips(category, status);
CREATE INDEX IF NOT EXISTS trips_price_idx ON trips(price_from_paise);

CREATE TABLE IF NOT EXISTS trip_destinations (
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  destination_id uuid NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (trip_id, destination_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS trip_destinations_one_primary_uidx ON trip_destinations(trip_id) WHERE is_primary;

CREATE TABLE IF NOT EXISTS trip_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  text text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS trip_itinerary_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  meals text,
  stay text,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(trip_id, day_number)
);
CREATE TABLE IF NOT EXISTS trip_inclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  text text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS trip_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  text text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS trip_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_paise integer,
  currency char(3) NOT NULL DEFAULT 'INR',
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS trip_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS trip_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
  usage text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS trip_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  starts_on date NOT NULL,
  ends_on date,
  display_date text,
  price_paise integer NOT NULL,
  currency char(3) NOT NULL DEFAULT 'INR',
  spots_total integer NOT NULL,
  notes text,
  completed_at timestamptz,
  completed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  completion_notes text,
  is_cancelled boolean NOT NULL DEFAULT false,
  cancelled_at timestamptz,
  cancelled_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trip_instances_spots_total_positive_chk CHECK (spots_total >= 0)
);
CREATE INDEX IF NOT EXISTS trip_instances_trip_starts_idx ON trip_instances(trip_id, starts_on);
CREATE INDEX IF NOT EXISTS trip_instances_cancelled_starts_idx ON trip_instances(is_cancelled, starts_on);
CREATE INDEX IF NOT EXISTS trip_instances_starts_idx ON trip_instances(starts_on);

CREATE TABLE IF NOT EXISTS trip_instance_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_instance_id uuid NOT NULL REFERENCES trip_instances(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
  usage text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_number text NOT NULL UNIQUE,
  source enquiry_source NOT NULL DEFAULT 'website',
  status enquiry_status NOT NULL DEFAULT 'received',
  assigned_to_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  customer_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email citext,
  pickup_city text,
  destination_id uuid REFERENCES destinations(id) ON DELETE SET NULL,
  destination_label text,
  requested_destination_text text,
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  trip_instance_id uuid REFERENCES trip_instances(id) ON DELETE SET NULL,
  requested_travel_date date,
  flexible_dates boolean NOT NULL DEFAULT false,
  requested_traveller_count integer NOT NULL DEFAULT 1,
  budget_label text,
  message text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT enquiries_traveller_count_positive_chk CHECK (requested_traveller_count >= 1)
);
CREATE INDEX IF NOT EXISTS enquiries_status_submitted_idx ON enquiries(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_assigned_status_idx ON enquiries(assigned_to_user_id, status);
CREATE INDEX IF NOT EXISTS enquiries_trip_status_idx ON enquiries(trip_id, status);
CREATE INDEX IF NOT EXISTS enquiries_trip_instance_idx ON enquiries(trip_instance_id);
CREATE INDEX IF NOT EXISTS enquiries_customer_phone_idx ON enquiries(customer_phone);
CREATE INDEX IF NOT EXISTS enquiries_customer_email_idx ON enquiries(customer_email);

CREATE TABLE IF NOT EXISTS enquiry_travellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  age integer,
  gender text,
  sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS enquiry_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  interest text NOT NULL
);
CREATE TABLE IF NOT EXISTS enquiry_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS enquiry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id uuid NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  old_status enquiry_status,
  new_status enquiry_status,
  title text NOT NULL,
  details jsonb,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text NOT NULL UNIQUE,
  enquiry_id uuid REFERENCES enquiries(id) ON DELETE SET NULL,
  customer_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  primary_contact_name text NOT NULL,
  primary_contact_phone text NOT NULL,
  primary_contact_email citext,
  destination_id uuid REFERENCES destinations(id) ON DELETE SET NULL,
  destination_label text,
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  trip_instance_id uuid REFERENCES trip_instances(id) ON DELETE SET NULL,
  trip_label text,
  trip_date_label text,
  final_amount_paise integer,
  currency char(3) NOT NULL DEFAULT 'INR',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  status booking_status NOT NULL DEFAULT 'confirmed',
  booking_date date NOT NULL DEFAULT CURRENT_DATE,
  completed_at timestamptz,
  cancelled_at timestamptz,
  payment_notes text,
  internal_notes text,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_final_amount_nonnegative_chk CHECK (final_amount_paise IS NULL OR final_amount_paise >= 0)
);
CREATE INDEX IF NOT EXISTS bookings_status_date_idx ON bookings(status, booking_date DESC);
CREATE INDEX IF NOT EXISTS bookings_payment_status_idx ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS bookings_trip_instance_status_idx ON bookings(trip_instance_id, status);
CREATE INDEX IF NOT EXISTS bookings_primary_contact_phone_idx ON bookings(primary_contact_phone);
CREATE INDEX IF NOT EXISTS bookings_enquiry_idx ON bookings(enquiry_id);

CREATE TABLE IF NOT EXISTS booking_travellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  age integer,
  gender text,
  phone text,
  email citext,
  document_type text,
  document_number_encrypted text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS booking_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount_paise integer NOT NULL,
  currency char(3) NOT NULL DEFAULT 'INR',
  method payment_method NOT NULL DEFAULT 'other',
  provider text,
  provider_payment_id text,
  provider_order_id text,
  status text NOT NULL DEFAULT 'created',
  paid_at timestamptz,
  reference_number text,
  notes text,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_payments_amount_nonnegative_chk CHECK (amount_paise >= 0)
);
CREATE INDEX IF NOT EXISTS booking_payments_booking_created_idx ON booking_payments(booking_id, created_at DESC);
CREATE INDEX IF NOT EXISTS booking_payments_provider_payment_idx ON booking_payments(provider, provider_payment_id);
CREATE INDEX IF NOT EXISTS booking_payments_status_created_idx ON booking_payments(status, created_at DESC);

-- Capacity is derived, not stored: remaining_capacity = spots_total - count of travellers on confirmed/completed bookings for the instance.
CREATE OR REPLACE VIEW trip_instance_capacity AS
SELECT
  ti.id AS trip_instance_id,
  ti.spots_total,
  GREATEST(ti.spots_total - COALESCE(SUM(CASE WHEN b.status IN ('confirmed','completed') THEN 1 ELSE 0 END), 0), 0) AS remaining_capacity
FROM trip_instances ti
LEFT JOIN bookings b ON b.trip_instance_id = ti.id
LEFT JOIN booking_travellers bt ON bt.booking_id = b.id
GROUP BY ti.id, ti.spots_total;
CREATE TABLE IF NOT EXISTS review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  trip_instance_id uuid REFERENCES trip_instances(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  customer_email citext,
  expires_at timestamptz,
  used_at timestamptz,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS review_requests_booking_idx ON review_requests(booking_id);
CREATE INDEX IF NOT EXISTS review_requests_trip_instance_idx ON review_requests(trip_instance_id);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_request_id uuid REFERENCES review_requests(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  customer_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  trip_instance_id uuid REFERENCES trip_instances(id) ON DELETE SET NULL,
  destination_id uuid REFERENCES destinations(id) ON DELETE SET NULL,
  reviewer_name text NOT NULL,
  reviewer_avatar_initials text,
  rating integer NOT NULL,
  body text NOT NULL,
  status review_status NOT NULL DEFAULT 'pending',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  moderated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  moderation_notes text,
  is_homepage_featured boolean NOT NULL DEFAULT false,
  homepage_sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_rating_range_chk CHECK (rating BETWEEN 1 AND 5)
);
CREATE INDEX IF NOT EXISTS reviews_status_submitted_idx ON reviews(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS reviews_trip_status_idx ON reviews(trip_id, status);
CREATE INDEX IF NOT EXISTS reviews_trip_instance_status_idx ON reviews(trip_instance_id, status);
CREATE INDEX IF NOT EXISTS reviews_destination_status_idx ON reviews(destination_id, status);
CREATE INDEX IF NOT EXISTS reviews_homepage_featured_idx ON reviews(is_homepage_featured, homepage_sort_order);

CREATE TABLE IF NOT EXISTS review_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
  sort_order integer NOT NULL DEFAULT 0,
  is_public boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cancellation_policy_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  days_before_min integer,
  days_before_max integer,
  refund_percent numeric(5,2),
  note text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS homepage_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_title text NOT NULL,
  hero_subtitle text NOT NULL,
  why_us_title text NOT NULL,
  why_us_description text NOT NULL,
  status content_page_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS homepage_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homepage_config_id uuid NOT NULL REFERENCES homepage_config(id) ON DELETE CASCADE,
  slide_type text NOT NULL,
  trip_instance_id uuid REFERENCES trip_instances(id) ON DELETE SET NULL,
  media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  title_override text,
  subtitle_override text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT homepage_slides_type_chk CHECK (slide_type IN ('trip', 'static'))
);

CREATE TABLE IF NOT EXISTS homepage_featured_destinations (
  homepage_config_id uuid NOT NULL REFERENCES homepage_config(id) ON DELETE CASCADE,
  destination_id uuid NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (homepage_config_id, destination_id)
);

CREATE TABLE IF NOT EXISTS homepage_featured_reviews (
  homepage_config_id uuid NOT NULL REFERENCES homepage_config(id) ON DELETE CASCADE,
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE RESTRICT,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (homepage_config_id, review_id)
);

CREATE TABLE IF NOT EXISTS homepage_why_us_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homepage_config_id uuid NOT NULL REFERENCES homepage_config(id) ON DELETE CASCADE,
  icon text,
  title text NOT NULL,
  description text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  status content_page_status NOT NULL DEFAULT 'draft',
  seo_title text,
  seo_description text,
  og_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  type notification_type NOT NULL,
  channel notification_channel NOT NULL,
  title_template text,
  body_template text NOT NULL,
  required_variables text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  channel notification_channel NOT NULL,
  status notification_status NOT NULL DEFAULT 'draft',
  audience_label text,
  recipient_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  recipient_name text,
  recipient_email citext,
  recipient_phone text,
  title text NOT NULL,
  message text NOT NULL,
  related_enquiry_id uuid REFERENCES enquiries(id) ON DELETE SET NULL,
  related_booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  related_review_id uuid REFERENCES reviews(id) ON DELETE SET NULL,
  provider text,
  provider_message_id text,
  sent_at timestamptz,
  failure_reason text,
  created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_type_created_idx ON notifications(type, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_status_created_idx ON notifications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_enquiry_idx ON notifications(related_enquiry_id);
CREATE INDEX IF NOT EXISTS notifications_booking_idx ON notifications(related_booking_id);

CREATE TABLE IF NOT EXISTS saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  destination_id uuid REFERENCES destinations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_items_type_chk CHECK (item_type IN ('trip', 'destination')),
  CONSTRAINT saved_items_one_target_chk CHECK ((trip_id IS NOT NULL)::int + (destination_id IS NOT NULL)::int = 1)
);
CREATE UNIQUE INDEX IF NOT EXISTS saved_items_user_trip_uidx ON saved_items(user_id, trip_id) WHERE trip_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS saved_items_user_destination_uidx ON saved_items(user_id, destination_id) WHERE destination_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  anonymous_id text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id text,
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  destination_id uuid REFERENCES destinations(id) ON DELETE SET NULL,
  enquiry_id uuid REFERENCES enquiries(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tracking_events_name_created_idx ON tracking_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS tracking_events_trip_name_idx ON tracking_events(trip_id, event_name);
CREATE INDEX IF NOT EXISTS tracking_events_destination_name_idx ON tracking_events(destination_id, event_name);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_name_snapshot text,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details text,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_created_idx ON audit_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs(entity_type, entity_id);

COMMIT;
