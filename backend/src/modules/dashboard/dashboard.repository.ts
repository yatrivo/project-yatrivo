import { query } from "../../db/postgres";
import type {
  DashboardKpiStats,
  DashboardRecentEnquiry,
  DashboardSummaryData,
  DashboardUpcomingDeparture,
  MonthlyEnquiryTrend
} from "./dashboard.types";

export const dashboardRepository = {
  async getSummary(): Promise<DashboardSummaryData> {
    // 1. KPI Aggregates
    const kpiRes = await query<{
      total_enquiries: number;
      new_received: number;
      confirmed_bookings: number;
      upcoming_trips: number;
      completed_trips: number;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM enquiries)::int AS total_enquiries,
        (SELECT COUNT(*) FROM enquiries WHERE LOWER(status::text) = 'received')::int AS new_received,
        (
          SELECT COUNT(*)
          FROM bookings
          WHERE LOWER(status::text) = 'confirmed'
        )::int AS confirmed_bookings,
        (
          SELECT COUNT(*)
          FROM trip_instances
          WHERE is_cancelled = false AND completed_at IS NULL AND starts_on >= CURRENT_DATE
        )::int AS upcoming_trips,
        (
          SELECT COUNT(*)
          FROM trip_instances
          WHERE completed_at IS NOT NULL OR (starts_on < CURRENT_DATE AND is_cancelled = false)
        )::int AS completed_trips;
    `);

    const statsRow = kpiRes.rows[0] || {
      total_enquiries: 0,
      new_received: 0,
      confirmed_bookings: 0,
      upcoming_trips: 0,
      completed_trips: 0
    };

    const stats: DashboardKpiStats = {
      totalEnquiries: Number(statsRow.total_enquiries),
      newReceivedEnquiries: Number(statsRow.new_received),
      confirmedBookings: Number(statsRow.confirmed_bookings),
      upcomingTrips: Number(statsRow.upcoming_trips),
      completedTrips: Number(statsRow.completed_trips)
    };

    // 2. Monthly Enquiry Trends (Starts from earliest active month e.g. Sep 2026, showing upcoming months, sliding once filled)
    const trendsRes = await query<{
      month: string;
      year_month: string;
      enquiries: number;
    }>(`
      WITH config AS (
        SELECT
          COALESCE(
            (SELECT date_trunc('month', MIN(submitted_at)) FROM enquiries),
            date_trunc('month', CURRENT_DATE)
          ) AS start_month,
          date_trunc('month', CURRENT_DATE) AS current_month
      ),
      window_bounds AS (
        SELECT
          CASE
            WHEN current_month < start_month + INTERVAL '5 months' THEN start_month
            ELSE current_month - INTERVAL '5 months'
          END AS win_start,
          CASE
            WHEN current_month < start_month + INTERVAL '5 months' THEN start_month + INTERVAL '5 months'
            ELSE current_month
          END AS win_end
        FROM config
      ),
      months AS (
        SELECT generate_series(
          (SELECT win_start FROM window_bounds),
          (SELECT win_end FROM window_bounds),
          INTERVAL '1 month'
        )::date AS m
      )
      SELECT
        to_char(months.m, 'Mon') AS month,
        to_char(months.m, 'YYYY-MM') AS year_month,
        COUNT(e.id)::int AS enquiries
      FROM months
      LEFT JOIN enquiries e
        ON date_trunc('month', e.submitted_at) = months.m
      GROUP BY months.m
      ORDER BY months.m ASC;
    `);

    const monthlyTrends: MonthlyEnquiryTrend[] = trendsRes.rows.map((r) => ({
      month: r.month,
      yearMonth: r.year_month,
      enquiries: Number(r.enquiries)
    }));


    // 3. Upcoming Departures (Top 4)
    const upcomingRes = await query<{
      id: string;
      trip_id: string;
      trip_name: string;
      trip_image: string | null;
      starts_on: string;
      ends_on: string | null;
      display_date: string | null;
      spots_total: number;
      spots_left: number;
      price_paise: number;
      status: "upcoming" | "completed" | "cancelled";
    }>(`
      SELECT
        ti.id,
        ti.trip_id,
        t.name AS trip_name,
        COALESCE(
          (
            SELECT COALESCE(ma.public_url, ma.external_url)
            FROM trip_media tm
            JOIN media_assets ma ON ma.id = tm.media_id
            WHERE tm.trip_id = t.id
            ORDER BY CASE WHEN tm.usage = 'cover' THEN 0 ELSE 1 END, tm.sort_order ASC
            LIMIT 1
          ),
          (
            SELECT COALESCE(ma.public_url, ma.external_url)
            FROM trip_destinations td
            JOIN destination_media dm ON dm.destination_id = td.destination_id
            JOIN media_assets ma ON ma.id = dm.media_id
            WHERE td.trip_id = t.id
            ORDER BY CASE WHEN dm.usage = 'cover' THEN 0 ELSE 1 END, dm.sort_order ASC
            LIMIT 1
          )
        ) AS trip_image,
        ti.starts_on::text AS starts_on,
        ti.ends_on::text AS ends_on,
        ti.display_date,
        ti.spots_total,
        COALESCE(c.remaining_capacity, ti.spots_total)::int AS spots_left,
        ti.price_paise,
        CASE
          WHEN ti.is_cancelled THEN 'cancelled'
          WHEN ti.completed_at IS NOT NULL OR ti.starts_on < CURRENT_DATE THEN 'completed'
          ELSE 'upcoming'
        END AS status
      FROM trip_instances ti
      JOIN trips t ON t.id = ti.trip_id
      LEFT JOIN trip_instance_capacity c ON c.trip_instance_id = ti.id
      WHERE ti.is_cancelled = false AND ti.completed_at IS NULL AND ti.starts_on >= CURRENT_DATE
      ORDER BY ti.starts_on ASC
      LIMIT 4;
    `);

    const upcomingDepartures: DashboardUpcomingDeparture[] = upcomingRes.rows.map((r) => ({
      id: r.id,
      tripId: r.trip_id,
      tripName: r.trip_name,
      tripImage: r.trip_image,
      startsOn: r.starts_on,
      endsOn: r.ends_on,
      displayDate: r.display_date || r.starts_on,
      spotsTotal: Number(r.spots_total),
      spotsBooked: Math.max(0, Number(r.spots_total) - Number(r.spots_left)),
      spotsLeft: Number(r.spots_left),
      pricePaise: Number(r.price_paise),
      status: r.status
    }));

    // 4. Recent Enquiries (Top 5)
    const recentRes = await query<{
      id: string;
      enquiry_number: string;
      customer_name: string;
      customer_email: string | null;
      customer_phone: string;
      trip_name: string;
      destination: string;
      travel_date: string;
      status: string;
      submitted_at: string;
    }>(`
      SELECT
        e.id,
        e.enquiry_number,
        e.customer_name,
        e.customer_email,
        e.customer_phone,
        COALESCE(t.name, e.destination_label, 'Himalayan Expedition') AS trip_name,
        COALESCE(e.destination_label, d.name, 'Uttarakhand') AS destination,
        COALESCE(to_char(e.requested_travel_date, 'YYYY-MM-DD'), to_char(e.submitted_at, 'YYYY-MM-DD')) AS travel_date,
        e.status,
        e.submitted_at::text AS submitted_at
      FROM enquiries e
      LEFT JOIN trips t ON t.id = e.trip_id
      LEFT JOIN destinations d ON d.id = e.destination_id
      ORDER BY e.submitted_at DESC
      LIMIT 5;
    `);

    const recentEnquiries: DashboardRecentEnquiry[] = recentRes.rows.map((r) => ({
      id: r.id,
      enquiryNumber: r.enquiry_number,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      customerPhone: r.customer_phone,
      tripName: r.trip_name,
      destination: r.destination,
      travelDate: r.travel_date,
      status: r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) : "Received",
      submittedAt: r.submitted_at
    }));

    return {
      stats,
      monthlyTrends,
      upcomingDepartures,
      recentEnquiries
    };
  }
};
