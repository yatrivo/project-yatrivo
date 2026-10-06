-- 023_fix_trip_instance_capacity.sql
-- Fix trip_instance_capacity view:
-- 1. Correctly include all active bookings (awaiting_traveller_details, details_received, confirmed, completed), excluding only cancelled and draft.
-- 2. Accurately count booked passenger seats using GREATEST(traveller_count, count of booking_travellers), preventing undercounting.
-- 3. Set remaining capacity to 0 for completed or cancelled departures.

CREATE OR REPLACE VIEW trip_instance_capacity AS
SELECT
  ti.id AS trip_instance_id,
  ti.spots_total,
  CASE
    WHEN ti.is_cancelled = true OR ti.completed_at IS NOT NULL THEN 0
    ELSE GREATEST(
      ti.spots_total - COALESCE(
        (
          SELECT SUM(GREATEST(COALESCE(b.traveller_count, 1), COALESCE(bt_agg.cnt, 1)))::bigint
          FROM bookings b
          LEFT JOIN (
            SELECT booking_id, COUNT(*)::bigint AS cnt
            FROM booking_travellers
            GROUP BY booking_id
          ) bt_agg ON bt_agg.booking_id = b.id
          WHERE b.trip_instance_id = ti.id
            AND b.status NOT IN ('cancelled'::booking_status, 'draft'::booking_status)
        ),
        0::bigint
      ),
      0::bigint
    )
  END AS remaining_capacity
FROM trip_instances ti;
