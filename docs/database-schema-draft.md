# Yatrivo Database Schema Draft

Status: review draft, not a migration file.
Source of truth used for this draft: current `frontend/src` design and state models, plus existing product and architecture docs.
Target database: Neon PostgreSQL.
Expected ORM later: Pris ORM.

## 1. Product Reading From Frontend

The frontend currently represents Yatrivo as an enquiry-first travel platform:

- Public visitors browse destinations, trips/packages, dated departures, completed trips, reviews, FAQs, content pages, and media-heavy homepage sections.
- Public visitors can submit package enquiries and custom trip requests without login.
- Admin staff manage destinations, trips, departures, enquiries, bookings, reviews, media, homepage content, notifications, settings, and audit logs.
- Booking is currently admin-created after enquiry/offline conversation, not customer self-checkout.
- Reviews are submitted without customer login and should be approved before public display.
- A customer account/dashboard/wishlist/payment flow is future scope, but the schema should not block it.

Important conflict to review:

- An imported frontend audit reference says there is no public customer account system and old login concepts should be removed.
- Your current direction asks for future-compatible user login and roles such as admin, user, and super admin.
- This draft supports staff/admin login immediately and keeps customer accounts optional. Visitor enquiries/bookings can exist without `users.id`.

## 2. Naming And Modeling Conventions

- Primary keys: `uuid`.
- Public slugs: unique `text` slugs separate from primary keys.
- Money: integer paise, e.g. `price_from_paise`.
- Dates:
  - `date` for travel/departure dates.
  - `timestamptz` for created/updated/login/event timestamps.
- Soft lifecycle:
  - Public content uses `status` fields such as `draft`, `published`, `archived`.
  - Operational records use domain statuses and are not physically deleted by default.
- Auditability:
  - Main admin-managed tables include `created_by_user_id`, `updated_by_user_id`, `created_at`, `updated_at` where useful.
  - `audit_logs` records important admin mutations, exports, auth events, and status changes.
- Media:
  - Store object storage metadata in `media_assets`.
  - Link media to trips/destinations/reviews/etc. using join tables.
  - Avoid storing only raw image URLs in production business tables.

## 3. Enums

These can be PostgreSQL enums or lookup tables. For early development, PostgreSQL enums are acceptable; lookup tables are better if admins must edit values later.

```text
user_role: super_admin, admin, user
user_status: invited, active, disabled, deleted
auth_provider: password, phone_otp, google

destination_status: draft, published, archived
destination_category: high_altitude, spiritual, weekend, nature, adventure, city, other

trip_status: draft, published, archived
trip_category: trekking, adventure, weekend, spiritual, nature, custom, other
trip_difficulty: easy, moderate, challenging, strenuous

trip_instance_status: upcoming, completed, cancelled

enquiry_status: received, contacted, quoted, confirmed, cancelled

booking_status: confirmed, completed, cancelled
payment_status: unpaid, partial, paid, refunded
payment_method: cash, upi, bank_transfer, card, payment_gateway, other

review_status: pending, published, hidden, rejected

notification_type: enquiry, booking, review, system, marketing
notification_status: draft, queued, sent, failed, cancelled
notification_channel: email, whatsapp, sms, in_app

media_category: homepage, destinations, trips, completed_trips, reviews, users, documents, general
content_page_status: draft, published, archived
```

## 4. Identity, Auth, And Roles

### users

Stores both staff and future customer accounts. A customer account is optional for V1 enquiries/bookings.

| Column             |                          Type | Notes                                                             |
| ------------------ | ----------------------------: | ----------------------------------------------------------------- |
| id                 |                       uuid pk |                                                                   |
| full_name          |                          text | Required for staff; optional for future customers until completed |
| email              |        citext unique nullable | Nullable because phone-first auth is planned                      |
| phone              |          text unique nullable | E.164 normalized where possible                                   |
| avatar_media_id    | uuid fk media_assets nullable |                                                                   |
| role               |                     user_role | `super_admin`, `admin`, `user`, future `partner`          |
| status             |                   user_status |                                                                   |
| password_hash      |                 text nullable | Staff password auth; never store temporary passwords              |
| email_verified_at  |          timestamptz nullable |                                                                   |
| phone_verified_at  |          timestamptz nullable |                                                                   |
| last_login_at      |          timestamptz nullable |                                                                   |
| invited_by_user_id |        uuid fk users nullable | Admin invitation flow                                             |
| created_at         |                   timestamptz |                                                                   |
| updated_at         |                   timestamptz |                                                                   |

Indexes:

- unique lower/email through `citext`
- unique phone
- `(role, status)`

### user_auth_identities

Supports Google OAuth, phone OTP, and password identities without redesigning `users`.

| Column           |            Type | Notes                              |
| ---------------- | --------------: | ---------------------------------- |
| id               |         uuid pk |                                    |
| user_id          |   uuid fk users |                                    |
| provider         |   auth_provider |                                    |
| provider_subject |   text nullable | Google subject, phone number, etc. |
| provider_email   | citext nullable |                                    |
| created_at       |     timestamptz |                                    |
| updated_at       |     timestamptz |                                    |

Constraints:

- unique `(provider, provider_subject)` when subject is not null.

### user_sessions

Optional if the backend uses database-backed sessions. If JWT-only is chosen later, this can be skipped.

| Column     |                 Type | Notes           |
| ---------- | -------------------: | --------------- |
| id         |              uuid pk |                 |
| user_id    |        uuid fk users |                 |
| token_hash |          text unique | Store hash only |
| user_agent |        text nullable |                 |
| ip_address |        inet nullable |                 |
| expires_at |          timestamptz |                 |
| revoked_at | timestamptz nullable |                 |
| created_at |          timestamptz |                 |

### otp_challenges

Short-lived OTP state for phone/email login. Do not cache permanent auth state only in Redis.

| Column      |                 Type | Notes                                       |
| ----------- | -------------------: | ------------------------------------------- |
| id          |              uuid pk |                                             |
| destination |                 text | Phone or email                              |
| purpose     |                 text | login, signup, verify_phone, reset_password |
| code_hash   |                 text | Hash only                                   |
| attempts    |                  int | default 0                                   |
| expires_at  |          timestamptz |                                             |
| consumed_at | timestamptz nullable |                                             |
| created_at  |          timestamptz |                                             |

Indexes:

- `(destination, purpose, expires_at)`

## 5. Destinations

### destinations

Maps frontend `Destination` plus SEO and lifecycle fields.

| Column             |                          Type | Notes                                                       |
| ------------------ | ----------------------------: | ----------------------------------------------------------- |
| id                 |                       uuid pk |                                                             |
| slug               |                   text unique | e.g.`chopta`                                              |
| name               |                          text | e.g. Chopta Valley                                          |
| tagline            |                 text nullable |                                                             |
| description        |                 text nullable |                                                             |
| category           |          destination_category | Current UI: high-altitude, spiritual, weekend               |
| season_label       |                 text nullable | UI currently stores text like April-Nov                     |
| best_time_label    |                 text nullable | Human readable                                              |
| elevation_label    |                 text nullable | Keep label because UI uses "2,680 m"; can add numeric later |
| status             |            destination_status | draft/published/archived                                    |
| sort_order         |                           int |                                                             |
| seo_title          |                 text nullable |                                                             |
| seo_description    |                 text nullable |                                                             |
| og_media_id        | uuid fk media_assets nullable |                                                             |
| cover_media_id     | uuid fk media_assets nullable | Replaces frontend`image`                                  |
| created_by_user_id |        uuid fk users nullable |                                                             |
| updated_by_user_id |        uuid fk users nullable |                                                             |
| created_at         |                   timestamptz |                                                             |
| updated_at         |                   timestamptz |                                                             |

Indexes:

- `(status, sort_order)`
- `(category, status)`
- full-text search on `name`, `tagline`, `description`

### destination_highlights

| Column         |                 Type | Notes          |
| -------------- | -------------------: | -------------- |
| id             |              uuid pk |                |
| destination_id | uuid fk destinations | cascade delete |
| text           |                 text |                |
| sort_order     |                  int |                |

### destination_activities

| Column         |                 Type | Notes          |
| -------------- | -------------------: | -------------- |
| id             |              uuid pk |                |
| destination_id | uuid fk destinations | cascade delete |
| name           |                 text |                |
| sort_order     |                  int |                |

### destination_media

| Column         |                 Type | Notes              |
| -------------- | -------------------: | ------------------ |
| id             |              uuid pk |                    |
| destination_id | uuid fk destinations |                    |
| media_id       | uuid fk media_assets |                    |
| usage          |                 text | cover, gallery, og |
| alt_text       |        text nullable |                    |
| sort_order     |                  int |                    |

Constraint:

- unique `(destination_id, media_id, usage)`

## 6. Trips / Packages

### trips

Maps frontend `Trip` and admin trip editor. Trips are reusable packages; dated availability lives in `trip_instances`.

| Column                |                          Type | Notes                                              |
| --------------------- | ----------------------------: | -------------------------------------------------- |
| id                    |                       uuid pk |                                                    |
| slug                  |                   text unique | e.g.`chopta-trek`                                |
| destination_id        | uuid fk destinations nullable | Nullable for future multi-destination/custom trips |
| name                  |                          text |                                                    |
| short_description     |                 text nullable | Admin editor has`shortDesc`                      |
| overview              |                 text nullable | Detail page content                                |
| duration_label        |                          text | e.g. 4 Days / 3 Nights                             |
| duration_days         |                  int nullable | Useful for sorting                                 |
| duration_nights       |                  int nullable |                                                    |
| category              |                 trip_category |                                                    |
| difficulty            |      trip_difficulty nullable |                                                    |
| price_from_paise      |                           int | frontend`price` converted to paise               |
| currency              |                       char(3) | default INR                                        |
| price_notes           |                 text nullable | Admin editor has`priceNotes`                     |
| cancellation_policy   |                 text nullable |                                                    |
| badge                 |                 text nullable | BESTSELLER, WEEKEND, etc.                          |
| starting_point        |                 text nullable | Future quick facts                                 |
| suitable_for          |                 text nullable | Future quick facts                                 |
| accommodation_summary |                 text nullable | Requirement support                                |
| transport_summary     |                 text nullable | Requirement support                                |
| important_notes       |                 text nullable | Weather, permits, fitness, restrictions            |
| status                |                   trip_status |                                                    |
| is_featured           |                       boolean | Optional listing/homepage flag                     |
| sort_order            |                           int | Recommended sort support                           |
| seo_title             |                 text nullable |                                                    |
| seo_description       |                 text nullable |                                                    |
| og_media_id           | uuid fk media_assets nullable |                                                    |
| cover_media_id        | uuid fk media_assets nullable | Replaces frontend`image`                         |
| created_by_user_id    |        uuid fk users nullable |                                                    |
| updated_by_user_id    |        uuid fk users nullable |                                                    |
| created_at            |                   timestamptz |                                                    |
| updated_at            |                   timestamptz |                                                    |

Indexes:

- `(status, sort_order)`
- `(destination_id, status)`
- `(category, status)`
- `(price_from_paise)`
- full-text search on `name`, `short_description`, `overview`

### trip_highlights

| Column     |          Type | Notes          |
| ---------- | ------------: | -------------- |
| id         |       uuid pk |                |
| trip_id    | uuid fk trips | cascade delete |
| text       |          text |                |
| sort_order |           int |                |

### trip_itinerary_days

| Column      |          Type | Notes          |
| ----------- | ------------: | -------------- |
| id          |       uuid pk |                |
| trip_id     | uuid fk trips | cascade delete |
| day_number  |           int |                |
| title       |          text |                |
| description |          text |                |
| meals       | text nullable | Future         |
| stay        | text nullable | Future         |
| sort_order  |           int |                |

Constraint:

- unique `(trip_id, day_number)`

### trip_inclusions

| Column     |          Type | Notes          |
| ---------- | ------------: | -------------- |
| id         |       uuid pk |                |
| trip_id    | uuid fk trips | cascade delete |
| text       |          text |                |
| sort_order |           int |                |

### trip_exclusions

Same shape as `trip_inclusions`.

### trip_addons

Admin editor has add-ons with name and price.

| Column      |          Type | Notes          |
| ----------- | ------------: | -------------- |
| id          |       uuid pk |                |
| trip_id     | uuid fk trips | cascade delete |
| name        |          text |                |
| description | text nullable |                |
| price_paise |  int nullable |                |
| currency    |       char(3) | default INR    |
| sort_order  |           int |                |

### trip_faqs

Trip-specific FAQ support.

| Column       |          Type | Notes          |
| ------------ | ------------: | -------------- |
| id           |       uuid pk |                |
| trip_id      | uuid fk trips | cascade delete |
| question     |          text |                |
| answer       |          text |                |
| sort_order   |           int |                |
| is_published |       boolean |                |

### trip_media

| Column     |                 Type | Notes                         |
| ---------- | -------------------: | ----------------------------- |
| id         |              uuid pk |                               |
| trip_id    |        uuid fk trips |                               |
| media_id   | uuid fk media_assets |                               |
| usage      |                 text | cover, gallery, itinerary, og |
| alt_text   |        text nullable |                               |
| sort_order |                  int |                               |

## 7. Departures / Trip Instances

### trip_instances

Frontend calls these `TripInstance`. They are dated departures of a package.

| Column               |                   Type | Notes                                                       |
| -------------------- | ---------------------: | ----------------------------------------------------------- |
| id                   |                uuid pk |                                                             |
| trip_id              |          uuid fk trips |                                                             |
| starts_on            |                   date |                                                             |
| ends_on              |          date nullable | Can derive from duration but useful for future operations   |
| display_date         |          text nullable | Optional cached human label; can also derive in API         |
| price_paise          |                    int | Departure-specific price                                    |
| currency             |                char(3) | default INR                                                 |
| spots_total          |                    int |                                                             |
| spots_left           |                    int | Keep for admin UX; recalculate or validate against bookings |
| status               |   trip_instance_status | upcoming/completed/cancelled                                |
| notes                |          text nullable |                                                             |
| completed_at         |   timestamptz nullable |                                                             |
| completed_by_user_id | uuid fk users nullable |                                                             |
| created_by_user_id   | uuid fk users nullable |                                                             |
| updated_by_user_id   | uuid fk users nullable |                                                             |
| created_at           |            timestamptz |                                                             |
| updated_at           |            timestamptz |                                                             |

Indexes:

- `(trip_id, starts_on)`
- `(status, starts_on)`
- `(starts_on)`

Constraint:

- `spots_left <= spots_total`

### trip_instance_media

Used for completed trip photos and departure-specific media.

| Column           |                   Type | Notes                    |
| ---------------- | ---------------------: | ------------------------ |
| id               |                uuid pk |                          |
| trip_instance_id | uuid fk trip_instances |                          |
| media_id         |   uuid fk media_assets |                          |
| usage            |                   text | completed_photo, gallery |
| alt_text         |          text nullable |                          |
| sort_order       |                    int |                          |

## 8. Enquiries And Custom Trip Requests

### enquiries

Captures package enquiries, WhatsApp/manual leads, and custom planner submissions.

| Column                    |                            Type | Notes                                              |
| ------------------------- | ------------------------------: | -------------------------------------------------- |
| id                        |                         uuid pk |                                                    |
| enquiry_number            |                     text unique | e.g. ENQ-000001                                    |
| source                    |                  enquiry_source | website, whatsapp, phone, walk_in, etc.            |
| status                    |                  enquiry_status | received/contacted/quoted/confirmed/lost/cancelled |
| assigned_to_user_id       |          uuid fk users nullable | Admin                                              |
| customer_user_id          |          uuid fk users nullable | Future account link; nullable for V1 visitors      |
| customer_name             |                            text |                                                    |
| customer_phone            |                            text |                                                    |
| customer_email            |                 citext nullable |                                                    |
| pickup_city               |                   text nullable |                                                    |
| destination_id            |   uuid fk destinations nullable |                                                    |
| destination_label         |                   text nullable | Preserve free-text/custom destination              |
| trip_id                   |          uuid fk trips nullable |                                                    |
| trip_instance_id          | uuid fk trip_instances nullable |                                                    |
| trip_label                |                   text nullable | Preserve free-text/manual trip                     |
| requested_travel_date     |                   date nullable |                                                    |
| flexible_dates            |                         boolean | Custom planner support                             |
| requested_traveller_count |                             int |                                                    |
| budget_label              |                   text nullable | Custom planner budget bucket                       |
| message                   |                   text nullable |                                                    |
| utm_source                |                   text nullable |                                                    |
| utm_medium                |                   text nullable |                                                    |
| utm_campaign              |                   text nullable |                                                    |
| referrer                  |                   text nullable |                                                    |
| submitted_at              |                     timestamptz |                                                    |
| created_by_user_id        |          uuid fk users nullable | Admin for manual inquiry                           |
| updated_by_user_id        |          uuid fk users nullable |                                                    |
| created_at                |                     timestamptz |                                                    |
| updated_at                |                     timestamptz |                                                    |

Indexes:

- `(status, submitted_at desc)`
- `(assigned_to_user_id, status)`
- `(trip_id, status)`
- `(trip_instance_id)`
- `(customer_phone)`
- `(customer_email)`

### enquiry_travellers

Custom planner collects traveller details before booking. Keep them separate from booking travellers because an enquiry may not convert.

| Column     |              Type | Notes                                     |
| ---------- | ----------------: | ----------------------------------------- |
| id         |           uuid pk |                                           |
| enquiry_id | uuid fk enquiries | cascade delete                            |
| full_name  |              text |                                           |
| age        |      int nullable |                                           |
| gender     |     text nullable | Current options include prefer not to say |
| sort_order |               int |                                           |

### enquiry_interests

Custom planner selected interests: Nature, Adventure, Spiritual, etc.

| Column     |              Type | Notes          |
| ---------- | ----------------: | -------------- |
| id         |           uuid pk |                |
| enquiry_id | uuid fk enquiries | cascade delete |
| interest   |              text |                |

### enquiry_notes

Internal admin notes.

| Column             |              Type | Notes          |
| ------------------ | ----------------: | -------------- |
| id                 |           uuid pk |                |
| enquiry_id         | uuid fk enquiries | cascade delete |
| body               |              text |                |
| created_by_user_id |     uuid fk users |                |
| created_at         |       timestamptz |                |

### enquiry_events

Timeline/status/contact history.

| Column             |                    Type | Notes                                                                                |
| ------------------ | ----------------------: | ------------------------------------------------------------------------------------ |
| id                 |                 uuid pk |                                                                                      |
| enquiry_id         |       uuid fk enquiries | cascade delete                                                                       |
| event_type         |                    text | enquiry_received, status_changed, contacted, quote_sent, note_added, booking_created |
| old_status         | enquiry_status nullable |                                                                                      |
| new_status         | enquiry_status nullable |                                                                                      |
| title              |                    text |                                                                                      |
| details            |          jsonb nullable |                                                                                      |
| created_by_user_id |  uuid fk users nullable |                                                                                      |
| created_at         |             timestamptz |                                                                                      |

## 9. Bookings And Payments

### bookings

Admin-managed booking records. Can be created from an enquiry or directly/offline.

| Column                |                            Type | Notes                                                               |
| --------------------- | ------------------------------: | ------------------------------------------------------------------- |
| id                    |                         uuid pk |                                                                     |
| booking_number        |                     text unique | e.g. BK-000001                                                      |
| enquiry_id            |      uuid fk enquiries nullable |                                                                     |
| customer_user_id      |          uuid fk users nullable | Future account link                                                 |
| primary_contact_name  |                            text |                                                                     |
| primary_contact_phone |                            text |                                                                     |
| primary_contact_email |                 citext nullable |                                                                     |
| destination_id        |   uuid fk destinations nullable |                                                                     |
| destination_label     |                   text nullable | Preserve manual/offline values                                      |
| trip_id               |          uuid fk trips nullable |                                                                     |
| trip_instance_id      | uuid fk trip_instances nullable |                                                                     |
| trip_label            |                   text nullable | Preserve manual/offline values                                      |
| trip_date_label       |                   text nullable | Current UI stores strings; prefer`trip_instance_id` when possible |
| final_amount_paise    |                    int nullable |                                                                     |
| currency              |                         char(3) | default INR                                                         |
| payment_status        |                  payment_status | unpaid/partial/paid/refunded                                        |
| status                |                  booking_status | confirmed/completed/cancelled                                       |
| booking_date          |                            date |                                                                     |
| completed_at          |            timestamptz nullable |                                                                     |
| cancelled_at          |            timestamptz nullable |                                                                     |
| payment_notes         |                   text nullable |                                                                     |
| internal_notes        |                   text nullable |                                                                     |
| created_by_user_id    |          uuid fk users nullable |                                                                     |
| updated_by_user_id    |          uuid fk users nullable |                                                                     |
| created_at            |                     timestamptz |                                                                     |
| updated_at            |                     timestamptz |                                                                     |

Indexes:

- `(status, booking_date desc)`
- `(payment_status)`
- `(trip_instance_id, status)`
- `(customer_phone)` via `primary_contact_phone`
- `(enquiry_id)`

### booking_travellers

| Column                    |             Type | Notes                        |
| ------------------------- | ---------------: | ---------------------------- |
| id                        |          uuid pk |                              |
| booking_id                | uuid fk bookings | cascade delete               |
| full_name                 |             text |                              |
| age                       |     int nullable |                              |
| gender                    |    text nullable |                              |
| phone                     |    text nullable | Future                       |
| email                     |  citext nullable | Future                       |
| document_type             |    text nullable | Future                       |
| document_number_encrypted |    text nullable | Future, if IDs are collected |
| sort_order                |              int |                              |

### payments

Not required for V1 checkout, but useful for future payment links and admin tracking.

| Column              |                          Type | Notes                                         |
| ------------------- | ----------------------------: | --------------------------------------------- |
| id                  |                       uuid pk |                                               |
| booking_id          |              uuid fk bookings |                                               |
| amount_paise        |                           int |                                               |
| currency            |                       char(3) | default INR                                   |
| method              |                payment_method |                                               |
| provider            |                 text nullable | razorpay/stripe/cashfree/etc. later           |
| provider_payment_id |                 text nullable |                                               |
| provider_order_id   |                 text nullable |                                               |
| status              |                          text | created, pending, succeeded, failed, refunded |
| paid_at             |          timestamptz nullable |                                               |
| reference_number    |                 text nullable | UPI/bank/offline reference                    |
| notes               |                 text nullable |                                               |
| receipt_media_id    | uuid fk media_assets nullable | Future invoice/receipt file                   |
| created_by_user_id  |        uuid fk users nullable |                                               |
| created_at          |                   timestamptz |                                               |
| updated_at          |                   timestamptz |                                               |

Indexes:

- `(booking_id, created_at desc)`
- `(provider, provider_payment_id)`
- `(status, created_at desc)`

## 10. Reviews And Review Requests

### review_requests

Supports secure review links without login. The frontend currently passes `reviewToken` but does not persist tokens yet.

| Column             |                            Type | Notes                                          |
| ------------------ | ------------------------------: | ---------------------------------------------- |
| id                 |                         uuid pk |                                                |
| token_hash         |                     text unique | Store hash, never raw token                    |
| booking_id         |       uuid fk bookings nullable | Preferred when review came from actual booking |
| trip_id            |          uuid fk trips nullable |                                                |
| trip_instance_id   | uuid fk trip_instances nullable |                                                |
| customer_name      |                   text nullable | Prefill                                        |
| customer_phone     |                   text nullable |                                                |
| customer_email     |                 citext nullable |                                                |
| expires_at         |            timestamptz nullable |                                                |
| used_at            |            timestamptz nullable |                                                |
| created_by_user_id |          uuid fk users nullable | Admin who generated/sent                       |
| created_at         |                     timestamptz |                                                |

Indexes:

- `(booking_id)`
- `(trip_instance_id)`

### reviews

Reviews belong to their actual trip and, where possible, exact completed departure/booking.

| Column                   |                             Type | Notes                                |
| ------------------------ | -------------------------------: | ------------------------------------ |
| id                       |                          uuid pk |                                      |
| review_request_id        | uuid fk review_requests nullable |                                      |
| booking_id               |        uuid fk bookings nullable |                                      |
| customer_user_id         |           uuid fk users nullable | Future                               |
| trip_id                  |                    uuid fk trips |                                      |
| trip_instance_id         |  uuid fk trip_instances nullable | Important for completed-trip context |
| destination_id           |    uuid fk destinations nullable | Derivable but useful for filtering   |
| reviewer_name            |                             text |                                      |
| reviewer_avatar_initials |                    text nullable | Derived in API if not stored         |
| rating                   |                              int | 1-5                                  |
| body                     |                             text |                                      |
| status                   |                    review_status | pending/published/hidden/rejected    |
| submitted_at             |                      timestamptz |                                      |
| published_at             |             timestamptz nullable |                                      |
| moderated_by_user_id     |           uuid fk users nullable |                                      |
| moderation_notes         |                    text nullable |                                      |
| is_homepage_featured     |                          boolean | Could also use homepage join table   |
| homepage_sort_order      |                     int nullable |                                      |
| created_at               |                      timestamptz |                                      |
| updated_at               |                      timestamptz |                                      |

Indexes:

- `(status, submitted_at desc)`
- `(trip_id, status)`
- `(trip_instance_id, status)`
- `(destination_id, status)`
- `(is_homepage_featured, homepage_sort_order)`

Constraint:

- rating between 1 and 5.

### review_media

Future/customer photos, also supports collective review-photo gallery.

| Column     |                 Type | Notes                               |
| ---------- | -------------------: | ----------------------------------- |
| id         |              uuid pk |                                     |
| review_id  |      uuid fk reviews | cascade delete                      |
| media_id   | uuid fk media_assets |                                     |
| sort_order |                  int |                                     |
| is_public  |              boolean | default false until review approved |

## 11. Media Library And Object Storage

### media_assets

Stores Neon Object Storage/S3-compatible object references and external imported URLs during transition.

| Column              |                   Type | Notes                                        |
| ------------------- | ---------------------: | -------------------------------------------- |
| id                  |                uuid pk |                                              |
| category            |         media_category |                                              |
| label               |          text nullable |                                              |
| alt_text            |          text nullable |                                              |
| storage_bucket      |          text nullable | default`yatrivo-media` for uploaded assets |
| storage_key         |          text nullable | e.g.`trips/chopta/uuid.webp`               |
| external_url        |          text nullable | Temporary support for Unsplash/imported URLs |
| public_url          |          text nullable | Cached served URL if needed                  |
| mime_type           |          text nullable |                                              |
| file_size_bytes     |           int nullable |                                              |
| width               |           int nullable |                                              |
| height              |           int nullable |                                              |
| checksum_sha256     |          text nullable |                                              |
| uploaded_by_user_id | uuid fk users nullable |                                              |
| created_at          |            timestamptz |                                              |
| updated_at          |            timestamptz |                                              |

Indexes:

- `(category, created_at desc)`
- full-text search on `label`, `alt_text`, `storage_key`, `external_url`

Validation:

- exactly one of `(storage_bucket/storage_key)` or `external_url` should be present during transition.

## 12. Homepage, CMS Content, Settings, FAQs

### site_settings

Key-value style for global settings that are not large content blocks.

| Column             |                   Type | Notes                                          |
| ------------------ | ---------------------: | ---------------------------------------------- |
| key                |                text pk | e.g.`site.tagline`, `contact.public_phone` |
| value              |                  jsonb |                                                |
| updated_by_user_id | uuid fk users nullable |                                                |
| updated_at         |            timestamptz |                                                |

Suggested keys:

- `site.tagline`
- `site.description`
- `contact.public_phone`
- `contact.public_whatsapp`
- `contact.email`
- `contact.address`
- `contact.inquiry_whatsapp`
- `social.instagram`
- `social.youtube`
- `social.facebook`
- `social.twitter`
- `analytics.ga4_measurement_id`
- `seo.default_title`
- `seo.default_description`

### cancellation_policy_rules

The admin settings UI has editable rows.

| Column             |                   Type | Notes                     |
| ------------------ | ---------------------: | ------------------------- |
| id                 |                uuid pk |                           |
| label              |                   text | e.g. 30+ days before      |
| days_before_min    |           int nullable | Structured future support |
| days_before_max    |           int nullable |                           |
| refund_percent     |  numeric(5,2) nullable |                           |
| note               |          text nullable |                           |
| sort_order         |                    int |                           |
| is_active          |                boolean |                           |
| updated_by_user_id | uuid fk users nullable |                           |
| created_at         |            timestamptz |                           |
| updated_at         |            timestamptz |                           |

### homepage_config

Use one active row to version homepage content safely.

| Column             |                   Type | Notes                    |
| ------------------ | ---------------------: | ------------------------ |
| id                 |                uuid pk |                          |
| hero_title         |                   text |                          |
| hero_subtitle      |                   text |                          |
| why_us_title       |                   text |                          |
| why_us_description |                   text |                          |
| status             |    content_page_status | draft/published/archived |
| published_at       |   timestamptz nullable |                          |
| created_by_user_id | uuid fk users nullable |                          |
| updated_by_user_id | uuid fk users nullable |                          |
| created_at         |            timestamptz |                          |
| updated_at         |            timestamptz |                          |

### homepage_slides

Supports trip slides and static image slides.

| Column             |                            Type | Notes              |
| ------------------ | ------------------------------: | ------------------ |
| id                 |                         uuid pk |                    |
| homepage_config_id |         uuid fk homepage_config | cascade delete     |
| slide_type         |                            text | trip or static     |
| trip_instance_id   | uuid fk trip_instances nullable |                    |
| media_id           |   uuid fk media_assets nullable | Static slide image |
| title_override     |                   text nullable |                    |
| subtitle_override  |                   text nullable |                    |
| sort_order         |                             int |                    |
| is_active          |                         boolean |                    |

Validation:

- trip slide requires `trip_instance_id`.
- static slide requires `media_id` and title.

### homepage_featured_destinations

| Column             |                    Type | Notes |
| ------------------ | ----------------------: | ----- |
| homepage_config_id | uuid fk homepage_config |       |
| destination_id     |    uuid fk destinations |       |
| sort_order         |                     int |       |

Primary key:

- `(homepage_config_id, destination_id)`

### homepage_featured_reviews

| Column             |                    Type | Notes |
| ------------------ | ----------------------: | ----- |
| homepage_config_id | uuid fk homepage_config |       |
| review_id          |         uuid fk reviews |       |
| sort_order         |                     int |       |

Primary key:

- `(homepage_config_id, review_id)`

### homepage_why_us_points

| Column             |                    Type | Notes                       |
| ------------------ | ----------------------: | --------------------------- |
| id                 |                 uuid pk |                             |
| homepage_config_id | uuid fk homepage_config | cascade delete              |
| icon               |           text nullable | Current UI stores icon text |
| title              |                    text |                             |
| description        |                    text |                             |
| sort_order         |                     int |                             |

### faqs

Global FAQ page/content tab.

| Column             |                   Type | Notes           |
| ------------------ | ---------------------: | --------------- |
| id                 |                uuid pk |                 |
| question           |                   text |                 |
| answer             |                   text |                 |
| category           |          text nullable | Future grouping |
| sort_order         |                    int |                 |
| is_published       |                boolean |                 |
| created_by_user_id | uuid fk users nullable |                 |
| updated_by_user_id | uuid fk users nullable |                 |
| created_at         |            timestamptz |                 |
| updated_at         |            timestamptz |                 |

### content_pages

About, terms, privacy, cancellation/refund, booking terms, future blog pages.

| Column             |                          Type | Notes                           |
| ------------------ | ----------------------------: | ------------------------------- |
| id                 |                       uuid pk |                                 |
| slug               |                   text unique | about, terms, privacy           |
| title              |                          text |                                 |
| body               |                          text | Markdown or sanitized rich text |
| status             |           content_page_status |                                 |
| seo_title          |                 text nullable |                                 |
| seo_description    |                 text nullable |                                 |
| og_media_id        | uuid fk media_assets nullable |                                 |
| published_at       |          timestamptz nullable |                                 |
| created_by_user_id |        uuid fk users nullable |                                 |
| updated_by_user_id |        uuid fk users nullable |                                 |
| created_at         |                   timestamptz |                                 |
| updated_at         |                   timestamptz |                                 |

Future blog readiness can reuse this table with `content_type`, or split into `blog_posts` later. If blog is expected soon, add `content_type text default 'page'` now.

## 13. Notifications

### notification_templates

Review request copy and operational templates with dynamic variables like booking number and review link.

| Column             |                   Type | Notes                                               |
| ------------------ | ---------------------: | --------------------------------------------------- |
| id                 |                uuid pk |                                                     |
| key                |            text unique | review_request_whatsapp, enquiry_confirmation, etc. |
| type               |      notification_type |                                                     |
| channel            |   notification_channel |                                                     |
| title_template     |          text nullable |                                                     |
| body_template      |                   text |                                                     |
| required_variables |                 text[] | e.g.`review_link` for review request              |
| is_active          |                boolean |                                                     |
| created_by_user_id | uuid fk users nullable |                                                     |
| updated_by_user_id | uuid fk users nullable |                                                     |
| created_at         |            timestamptz |                                                     |
| updated_at         |            timestamptz |                                                     |

### notifications

Records sent/draft notifications.

| Column              |                       Type | Notes                      |
| ------------------- | -------------------------: | -------------------------- |
| id                  |                    uuid pk |                            |
| type                |          notification_type |                            |
| channel             |       notification_channel |                            |
| status              |        notification_status |                            |
| audience_label      |              text nullable | Admin Team, Customer, etc. |
| recipient_user_id   |     uuid fk users nullable |                            |
| recipient_name      |              text nullable |                            |
| recipient_email     |            citext nullable |                            |
| recipient_phone     |              text nullable |                            |
| title               |                       text |                            |
| message             |                       text |                            |
| related_enquiry_id  | uuid fk enquiries nullable |                            |
| related_booking_id  |  uuid fk bookings nullable |                            |
| related_review_id   |   uuid fk reviews nullable |                            |
| provider            |              text nullable |                            |
| provider_message_id |              text nullable |                            |
| sent_at             |       timestamptz nullable |                            |
| failure_reason      |              text nullable |                            |
| created_by_user_id  |     uuid fk users nullable |                            |
| created_at          |                timestamptz |                            |
| updated_at          |                timestamptz |                            |

Indexes:

- `(type, created_at desc)`
- `(status, created_at desc)`
- `(related_enquiry_id)`
- `(related_booking_id)`

## 14. Saved Items / Wishlist

Frontend has saved items without auth, but requirements mark wishlist as future scope. For V1, prefer browser-only saved items. Add database persistence only when customer accounts are introduced.

### saved_items

Future table.

| Column         |                          Type | Notes               |
| -------------- | ----------------------------: | ------------------- |
| id             |                       uuid pk |                     |
| user_id        |                 uuid fk users |                     |
| item_type      |                          text | trip or destination |
| trip_id        |        uuid fk trips nullable |                     |
| destination_id | uuid fk destinations nullable |                     |
| created_at     |                   timestamptz |                     |

Constraints:

- exactly one of `trip_id`, `destination_id`.
- unique `(user_id, item_type, trip_id)` where `trip_id` is not null.
- unique `(user_id, item_type, destination_id)` where `destination_id` is not null.

## 15. Analytics And Operational Reporting

Do not build a heavy analytics warehouse now. Store operational events needed for admin metrics and conversion tracking.

### tracking_events

Optional V1/future table for server-side conversion events.

| Column         |                          Type | Notes                                                                                 |
| -------------- | ----------------------------: | ------------------------------------------------------------------------------------- |
| id             |                       uuid pk |                                                                                       |
| event_name     |                          text | enquiry_submitted, whatsapp_clicked, trip_viewed, destination_viewed, booking_created |
| anonymous_id   |                 text nullable |                                                                                       |
| user_id        |        uuid fk users nullable |                                                                                       |
| session_id     |                 text nullable |                                                                                       |
| trip_id        |        uuid fk trips nullable |                                                                                       |
| destination_id | uuid fk destinations nullable |                                                                                       |
| enquiry_id     |    uuid fk enquiries nullable |                                                                                       |
| booking_id     |     uuid fk bookings nullable |                                                                                       |
| properties     |                         jsonb |                                                                                       |
| utm_source     |                 text nullable |                                                                                       |
| utm_medium     |                 text nullable |                                                                                       |
| utm_campaign   |                 text nullable |                                                                                       |
| ip_address     |                 inet nullable | Consider privacy retention                                                            |
| user_agent     |                 text nullable |                                                                                       |
| created_at     |                   timestamptz |                                                                                       |

Indexes:

- `(event_name, created_at desc)`
- `(trip_id, event_name)`
- `(destination_id, event_name)`

## 16. Audit Logs

### audit_logs

Restricted to super admins in the frontend.

| Column              |                   Type | Notes                                                  |
| ------------------- | ---------------------: | ------------------------------------------------------ |
| id                  |                uuid pk |                                                        |
| actor_user_id       | uuid fk users nullable | Nullable for system jobs                               |
| actor_name_snapshot |          text nullable | Preserve display even if user changes                  |
| action              |                   text | updated_trip, published_destination, exported_bookings |
| entity_type         |          text nullable | trip, destination, enquiry, booking, user, media       |
| entity_id           |          uuid nullable |                                                        |
| details             |          text nullable | Human-readable summary                                 |
| before_data         |         jsonb nullable | Optional, avoid secrets                                |
| after_data          |         jsonb nullable | Optional, avoid secrets                                |
| ip_address          |          inet nullable |                                                        |
| user_agent          |          text nullable |                                                        |
| created_at          |            timestamptz |                                                        |

Indexes:

- `(created_at desc)`
- `(actor_user_id, created_at desc)`
- `(entity_type, entity_id)`
- full-text search on `action`, `details`, `actor_name_snapshot`

## 17. Relationship Summary

```text
users
  -> enquiries.assigned_to_user_id
  -> bookings.created_by_user_id
  -> audit_logs.actor_user_id

destinations
  -> trips.destination_id
  -> enquiries.destination_id
  -> bookings.destination_id
  -> reviews.destination_id

trips
  -> trip_instances.trip_id
  -> enquiries.trip_id
  -> bookings.trip_id
  -> reviews.trip_id

trip_instances
  -> enquiries.trip_instance_id
  -> bookings.trip_instance_id
  -> reviews.trip_instance_id
  -> homepage_slides.trip_instance_id

enquiries
  -> bookings.enquiry_id
  -> enquiry_notes/events/travellers/interests

bookings
  -> booking_travellers
  -> payments
  -> review_requests
  -> reviews

media_assets
  -> destination_media
  -> trip_media
  -> trip_instance_media
  -> review_media
  -> content og/cover images
```

## 18. Initial Migration Order

When this draft is approved, create migrations in this rough order:

1. Enable extensions: `uuid-ossp` or `pgcrypto`, `citext`.
2. Create enums.
3. Create identity/auth tables: `users`, `user_auth_identities`, optional sessions/OTP.
4. Create `media_assets`.
5. Create destinations and destination child tables.
6. Create trips and trip child tables.
7. Create `trip_instances` and `trip_instance_media`.
8. Create enquiries and enquiry child tables.
9. Create bookings, booking travellers, payments.
10. Create review requests, reviews, review media.
11. Create CMS/settings/homepage/content/FAQ tables.
12. Create notification templates and notifications.
13. Create saved items if customer accounts are in scope.
14. Create tracking events if analytics events are in scope.
15. Create audit logs.
16. Seed roles/admin user, initial settings, initial content, and current frontend destinations/trips as needed.

## 19. Data Migration From Current Frontend Fixtures

Current fixture mapping:

- `frontend/src/data/destinations.ts`
  - `INITIAL_DESTINATIONS` -> `destinations`, `destination_highlights`, `destination_activities`, `media_assets`, `destination_media`.
- `frontend/src/data/trips.ts`
  - `INITIAL_TRIPS` -> `trips`, `trip_highlights`, `trip_inclusions`, `trip_exclusions`, `media_assets`, `trip_media`.
  - `INITIAL_TRIP_INSTANCES` -> `trip_instances`, `trip_instance_media`.
- `frontend/src/data/reviews.ts`
  - `REVIEWS` -> `reviews`.
  - Existing review `tripName` should be resolved to `trips.id` during seed.
- `frontend/src/context/AppContext.tsx`
  - `DEFAULT_HOMEPAGE_CONTENT` -> homepage config/slides/featured links.
  - `DEFAULT_FAQ_ITEMS` -> `faqs`.
  - `SEED_GALLERY_IMAGES` -> `media_assets`.
  - seed `enquiries` and `bookings` only for development/demo, not production.

## 20. Recommended Backend API Resource Boundaries

These are not required for the schema file, but they show why the tables are grouped this way.

- Public:
  - `GET /api/destinations`
  - `GET /api/destinations/:slug`
  - `GET /api/trips`
  - `GET /api/trips/:slug`
  - `GET /api/trip-instances`
  - `POST /api/enquiries`
  - `POST /api/reviews`
- Admin:
  - `/api/admin/destinations`
  - `/api/admin/trips`
  - `/api/admin/trip-instances`
  - `/api/admin/enquiries`
  - `/api/admin/bookings`
  - `/api/admin/reviews`
  - `/api/admin/media`
  - `/api/admin/content`
  - `/api/admin/settings`
  - `/api/admin/users`
  - `/api/admin/audit-logs`

## 21. Redis / Client Cache Fit

Database remains the source of truth.

Good Redis candidates:

- Published destination list/details.
- Published trip list/details.
- Published homepage config.
- Published FAQs/content pages.

Avoid Redis caching:

- Admin mutations.
- Auth/OTP source of truth.
- Enquiries/bookings/reviews pending moderation.
- User-specific data.

Cache invalidation later:

- Updating a destination invalidates destination detail, destination list, homepage if featured.
- Updating a trip invalidates trip detail, trip list, destination detail trip sections, homepage slides if linked.
- Updating homepage config invalidates homepage config key.
- Publishing/hiding review invalidates trip review list and homepage reviews if featured.

## 22. Decisions Needed Before Migrations

1. Customer accounts:

   - Keep V1 public side no-login with only staff/admin auth?
   - Or implement customer login in the first backend phase?
2. Saved items:

   - Browser-only for now, or database-backed wishlist tied to future `users`?
3. Media:

   - Should migration seed current Unsplash URLs as `external_url`, or should we upload approved media into `yatrivo-media` first?
4. Admin roles:

   - Are `super_admin` and `admin` enough for launch?
   - Do we need granular permissions such as content_editor, sales_agent, operations_manager?
5. Custom planner:

   - Is Plan My Trip in V1 production scope, or should custom planner tables be migration-ready but not exposed yet?
6. Reviews:

   - Should public review submission always require an admin-generated review token?
   - Or should open public review submission remain available with moderation?
7. Booking payments:

   - Should `payments` be included in the initial migration for admin tracking, even before gateway integration?
8. Blog/content:

   - Is future blog close enough that `content_pages` should include `content_type`, author, excerpt, and publish date now?
9. Destination/trip categories:

   - Should categories be fixed enums, or admin-manageable lookup tables?
10. PII retention:

- How long should enquiry/booking phone/email/traveller data be retained, and do we need deletion/anonymization workflows?

## 23. Fields That Look Redundant Or Confusing In Frontend

These should be cleaned up during backend integration:

- `destination` appears as both destination id and display name in different places. Schema separates `destination_id` from `destination_label`.
- `tripName` is used instead of `trip_id` in enquiries/bookings/reviews. Schema keeps ids plus label snapshots for manual/offline records.
- `displayDate` is stored in frontend. Schema stores `starts_on` and optionally caches `display_date`.
- Booking `totalAmount` is a formatted string in frontend. Schema stores integer paise.
- Media is currently mostly URL strings. Schema moves media into `media_assets` and linking tables.
- Admin users are called "Users" in admin UI, but future customers are also users. Schema uses one `users` table with roles, while UI should label staff management clearly.
- Reviews currently can be created without token and only store trip name/destination. Schema supports exact booking/trip instance linkage.
- Saved items exist in frontend despite no login. Schema treats database saved items as future account-backed wishlist.
