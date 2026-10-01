import type { PoolClient } from "pg";
import { query, withTransaction } from "../../db/postgres";
import { AppError } from "../../errors/AppError";
import crypto from "node:crypto";
import type {
  DepartureOperationalDto,
  EnrolledTravellerDto,
  ReviewDto,
  ReviewFilters,
  ReviewRecord,
  ReviewRequestDto,
  ReviewRequestRecord,
  ReviewStatus,
  SubmitReviewInput
} from "./reviews.types";

function toReviewDto(row: ReviewRecord): ReviewDto {
  const initials =
    row.reviewer_avatar_initials ||
    row.reviewer_name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    "YR";

  return {
    id: row.id,
    reviewRequestId: row.review_request_id,
    bookingId: row.booking_id,
    tripId: row.trip_id,
    tripName: row.trip_name || "Himalayan Expedition",
    tripInstanceId: row.trip_instance_id,
    departureDisplayDate: row.departure_display_date || null,
    destinationId: row.destination_id,
    destinationName: row.destination_name || "Uttarakhand",
    destinationSlug: row.destination_slug || "uttarakhand",
    reviewerName: row.reviewer_name,
    avatar: initials,
    rating: row.rating,
    body: row.body,
    status: row.status,
    submittedAt: new Date(row.submitted_at).toISOString(),
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls : [],
    bookingNumber: row.booking_number || null,
    moderationNotes: row.moderation_notes || null
  };
}

export const reviewsRepository = {
  async findAll(filters: ReviewFilters): Promise<{ reviews: ReviewDto[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.status && filters.status !== "all") {
      conditions.push(`r.status = $${paramIndex++}::review_status`);
      params.push(filters.status);
    }

    if (filters.destinationId && filters.destinationId !== "all") {
      conditions.push(`(r.destination_id::text = $${paramIndex} OR d.slug = $${paramIndex})`);
      params.push(filters.destinationId);
      paramIndex++;
    }

    if (filters.tripId) {
      conditions.push(`r.trip_id::text = $${paramIndex++}`);
      params.push(filters.tripId);
    }

    if (filters.tripInstanceId) {
      conditions.push(`r.trip_instance_id::text = $${paramIndex++}`);
      params.push(filters.tripInstanceId);
    }

    if (filters.rating && filters.rating > 0) {
      conditions.push(`r.rating = $${paramIndex++}`);
      params.push(filters.rating);
    }

    if (filters.search) {
      conditions.push(
        `(r.reviewer_name ILIKE $${paramIndex} OR r.body ILIKE $${paramIndex} OR t.name ILIKE $${paramIndex} OR d.name ILIKE $${paramIndex} OR b.booking_number ILIKE $${paramIndex})`
      );
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRes = await query<{ count: string }>(
      `SELECT count(*)::text as count
       FROM reviews r
       LEFT JOIN trips t ON t.id = r.trip_id
       LEFT JOIN destinations d ON d.id = r.destination_id
       LEFT JOIN bookings b ON b.id = r.booking_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || "0", 10);

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const offset = (page - 1) * limit;

    const listRes = await query<ReviewRecord>(
      `SELECT r.*,
              t.name as trip_name,
              d.name as destination_name,
              d.slug as destination_slug,
              ti.display_date as departure_display_date,
              b.booking_number
       FROM reviews r
       LEFT JOIN trips t ON t.id = r.trip_id
       LEFT JOIN destinations d ON d.id = r.destination_id
       LEFT JOIN trip_instances ti ON ti.id = r.trip_instance_id
       LEFT JOIN bookings b ON b.id = r.booking_id
       ${whereClause}
       ORDER BY r.submitted_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return {
      reviews: listRes.rows.map(toReviewDto),
      total
    };
  },

  async findById(id: string): Promise<ReviewDto | null> {
    const res = await query<ReviewRecord>(
      `SELECT r.*,
              t.name as trip_name,
              d.name as destination_name,
              d.slug as destination_slug,
              ti.display_date as departure_display_date,
              b.booking_number
       FROM reviews r
       LEFT JOIN trips t ON t.id = r.trip_id
       LEFT JOIN destinations d ON d.id = r.destination_id
       LEFT JOIN trip_instances ti ON ti.id = r.trip_instance_id
       LEFT JOIN bookings b ON b.id = r.booking_id
       WHERE r.id = $1`,
      [id]
    );

    if (res.rows.length === 0) return null;
    return toReviewDto(res.rows[0]);
  },

  async updateStatus(
    id: string,
    status: ReviewStatus,
    moderationNotes?: string | null,
    userId?: string | null
  ): Promise<ReviewDto | null> {
    const isPublishing = status === "published";
    const res = await query<ReviewRecord>(
      `UPDATE reviews
       SET status = $1::review_status,
           published_at = CASE WHEN $2 = true THEN coalesce(published_at, now()) ELSE null END,
           moderated_by_user_id = $3,
           moderation_notes = coalesce($4, moderation_notes),
           updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [status, isPublishing, userId || null, moderationNotes || null, id]
    );

    if (res.rows.length === 0) return null;
    return this.findById(id);
  },

  async getDepartureOperational(instanceId: string): Promise<DepartureOperationalDto | null> {
    // 1. Fetch Departure with Trip and Destination details
    const depRes = await query<{
      id: string;
      trip_id: string;
      trip_name: string;
      trip_slug: string;
      trip_description: string | null;
      duration_label: string | null;
      duration_days: number | null;
      duration_nights: number | null;
      starting_point: string | null;
      destination_name: string | null;
      destination_slug: string | null;
      starts_on: string;
      display_date: string;
      price_paise: number;
      spots_total: number;
      notes: string | null;
      is_cancelled: boolean;
      completed_at: string | null;
      remaining_capacity: number | null;
      cover_image_url: string | null;
    }>(
      `SELECT ti.id, ti.trip_id, t.name as trip_name, t.slug as trip_slug, t.short_description as trip_description,
              t.duration_label, t.duration_days, t.duration_nights, t.starting_point,
              t.cover_image_url,
              d.name as destination_name, d.slug as destination_slug,
              ti.starts_on::text, ti.display_date, ti.price_paise, ti.spots_total, ti.notes,
              ti.is_cancelled, ti.completed_at::text, c.remaining_capacity
       FROM trip_instances ti
       JOIN trips t ON t.id = ti.trip_id
       LEFT JOIN trip_destinations td ON td.trip_id = t.id AND td.sort_order = 0
       LEFT JOIN destinations d ON d.id = td.destination_id
       LEFT JOIN trip_instance_capacity c ON c.trip_instance_id = ti.id
       WHERE ti.id = $1`,
      [instanceId]
    );

    if (depRes.rows.length === 0) return null;
    const dep = depRes.rows[0];

    const status: "upcoming" | "completed" | "cancelled" = dep.is_cancelled
      ? "cancelled"
      : dep.completed_at
      ? "completed"
      : "upcoming";

    // 2. Fetch all individual enrolled passengers with their review requests and submitted reviews
    const travellersRes = await query<{
      traveller_id: string | null;
      booking_id: string;
      booking_number: string;
      enquiry_number: string | null;
      passenger_name: string;
      passenger_phone: string;
      passenger_email: string | null;
      sort_order: number;
      is_primary_contact: boolean;
      total_booking_pax: number;
      booking_status: string;
      review_request_id: string | null;
      review_token: string | null;
      request_status: string | null;
      review_id: string | null;
      review_rating: number | null;
    }>(
      `WITH booking_passengers AS (
        -- Passengers from booking_travellers
        SELECT
          bt.id as traveller_id,
          b.id as booking_id,
          b.booking_number,
          e.enquiry_number,
          bt.full_name as passenger_name,
          COALESCE(NULLIF(TRIM(bt.phone), ''), b.primary_contact_phone) as passenger_phone,
          COALESCE(NULLIF(TRIM(bt.email), ''), b.primary_contact_email) as passenger_email,
          bt.sort_order,
          CASE WHEN bt.sort_order = 1 OR bt.full_name = b.primary_contact_name THEN true ELSE false END as is_primary_contact,
          b.traveller_count as total_booking_pax,
          b.status::text as booking_status,
          b.created_at as booking_created_at
        FROM bookings b
        JOIN booking_travellers bt ON bt.booking_id = b.id
        LEFT JOIN enquiries e ON e.id = b.enquiry_id
        WHERE b.trip_instance_id = $1 AND b.status != 'cancelled'

        UNION ALL

        -- Fallback for bookings with NO booking_travellers rows
        SELECT
          NULL::uuid as traveller_id,
          b.id as booking_id,
          b.booking_number,
          e.enquiry_number,
          b.primary_contact_name as passenger_name,
          b.primary_contact_phone as passenger_phone,
          b.primary_contact_email as passenger_email,
          1 as sort_order,
          true as is_primary_contact,
          b.traveller_count as total_booking_pax,
          b.status::text as booking_status,
          b.created_at as booking_created_at
        FROM bookings b
        LEFT JOIN enquiries e ON e.id = b.enquiry_id
        WHERE b.trip_instance_id = $1 
          AND b.status != 'cancelled'
          AND NOT EXISTS (SELECT 1 FROM booking_travellers bt WHERE bt.booking_id = b.id)
      )
      SELECT
        bp.*,
        latest_rr.id as review_request_id,
        latest_rr.token as review_token,
        latest_rr.status as request_status,
        latest_r.id as review_id,
        latest_r.rating as review_rating
      FROM booking_passengers bp
      LEFT JOIN LATERAL (
        SELECT rr.id, rr.token, rr.status
        FROM review_requests rr
        WHERE rr.booking_id = bp.booking_id
          AND rr.trip_instance_id = $1
          AND (
            (bp.traveller_id IS NOT NULL AND rr.booking_traveller_id = bp.traveller_id)
            OR (rr.booking_traveller_id IS NULL AND (bp.is_primary_contact = true OR rr.customer_name = bp.passenger_name))
          )
        ORDER BY rr.created_at DESC
        LIMIT 1
      ) latest_rr ON true
      LEFT JOIN LATERAL (
        SELECT r.id, r.rating
        FROM reviews r
        WHERE (r.booking_id = bp.booking_id OR (latest_rr.id IS NOT NULL AND r.review_request_id = latest_rr.id))
          AND r.trip_instance_id = $1
          AND (
            (bp.traveller_id IS NOT NULL AND r.booking_traveller_id = bp.traveller_id)
            OR (r.booking_traveller_id IS NULL AND (bp.is_primary_contact = true OR r.reviewer_name = bp.passenger_name))
          )
        ORDER BY r.submitted_at DESC
        LIMIT 1
      ) latest_r ON true
      ORDER BY bp.booking_created_at ASC, bp.sort_order ASC`,
      [instanceId]
    );

    const enrolledTravellers: EnrolledTravellerDto[] = travellersRes.rows.map((row) => {
      let reqStatus: EnrolledTravellerDto["reviewRequestStatus"] = "not_requested";
      if (row.review_id || row.request_status === "submitted") {
        reqStatus = "submitted";
      } else if (row.review_request_id || row.request_status === "pending") {
        reqStatus = "sent";
      }

      const id = row.traveller_id || `book_${row.booking_id}`;

      return {
        id,
        travellerId: row.traveller_id,
        bookingId: row.booking_id,
        bookingNumber: row.booking_number,
        enquiryNumber: row.enquiry_number,
        passengerName: row.passenger_name,
        primaryContactName: row.passenger_name,
        passengerPhone: row.passenger_phone,
        primaryContactPhone: row.passenger_phone,
        passengerEmail: row.passenger_email,
        primaryContactEmail: row.passenger_email,
        isPrimaryContact: Boolean(row.is_primary_contact),
        passengerCount: row.total_booking_pax,
        bookingStatus: row.booking_status,
        reviewRequestStatus: reqStatus,
        reviewRequestId: row.review_request_id,
        reviewToken: row.review_token,
        reviewId: row.review_id,
        reviewRating: row.review_rating
      };
    });

    // 3. Fetch reviews for this specific departure
    const reviewsRes = await query<ReviewRecord>(
      `SELECT r.*,
              t.name as trip_name,
              d.name as destination_name,
              d.slug as destination_slug,
              ti.display_date as departure_display_date,
              b.booking_number
       FROM reviews r
       LEFT JOIN trips t ON t.id = r.trip_id
       LEFT JOIN destinations d ON d.id = r.destination_id
       LEFT JOIN trip_instances ti ON ti.id = r.trip_instance_id
       LEFT JOIN bookings b ON b.id = r.booking_id
       WHERE r.trip_instance_id = $1
       ORDER BY r.submitted_at DESC`,
      [instanceId]
    );

    const departureReviews = reviewsRes.rows.map(toReviewDto);

    // 4. Calculate summary metrics
    const totalEligible = enrolledTravellers.length;
    const requestsSent = enrolledTravellers.filter((t) => t.reviewRequestStatus === "sent" || t.reviewRequestStatus === "submitted").length;
    const reviewsReceived = departureReviews.length;
    const pendingApproval = departureReviews.filter((r) => r.status === "pending").length;
    const published = departureReviews.filter((r) => r.status === "published").length;
    const avgRating =
      departureReviews.length > 0
        ? Number((departureReviews.reduce((sum, r) => sum + r.rating, 0) / departureReviews.length).toFixed(1))
        : null;

    const spotsLeft =
      dep.remaining_capacity !== null && dep.remaining_capacity !== undefined
        ? dep.remaining_capacity
        : dep.spots_total;

    return {
      id: dep.id,
      tripId: dep.trip_id,
      tripName: dep.trip_name,
      tripSlug: dep.trip_slug,
      tripDescription: dep.trip_description || undefined,
      destinationName: dep.destination_name || "Uttarakhand",
      destinationSlug: dep.destination_slug || "uttarakhand",
      startsOn: dep.starts_on,
      displayDate: dep.display_date,
      price: Math.round(dep.price_paise / 100),
      spotsTotal: dep.spots_total,
      spotsLeft,
      status,
      notes: dep.notes,
      coverImage: dep.cover_image_url,
      durationLabel: dep.duration_label,
      durationDays: dep.duration_days,
      durationNights: dep.duration_nights,
      startingPoint: dep.starting_point,
      enrolledTravellers,
      summary: {
        totalEligibleTravellers: totalEligible,
        reviewRequestsSent: requestsSent,
        reviewsReceived,
        reviewsPendingApproval: pendingApproval,
        reviewsPublished: published,
        averageRating: avgRating
      },
      reviews: departureReviews
    };
  },

  async createReviewRequest(data: {
    bookingId: string;
    bookingTravellerId?: string | null;
    tripId: string;
    tripInstanceId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    customMessage: string;
    userId?: string | null;
  }): Promise<ReviewRequestDto> {
    const rawToken = `rev_${crypto.randomBytes(16).toString("hex")}`;
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const res = await query<ReviewRequestRecord>(
      `INSERT INTO review_requests (
        token_hash, token, booking_id, booking_traveller_id, trip_id, trip_instance_id,
        customer_name, customer_phone, customer_email, custom_message,
        status, sent_at, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', now(), $11)
      ON CONFLICT (token_hash) DO UPDATE
        SET token = EXCLUDED.token, custom_message = EXCLUDED.custom_message, sent_at = now()
      RETURNING *`,
      [
        tokenHash,
        rawToken,
        data.bookingId,
        data.bookingTravellerId || null,
        data.tripId,
        data.tripInstanceId,
        data.customerName,
        data.customerPhone,
        data.customerEmail || null,
        data.customMessage,
        data.userId || null
      ]
    );

    const r = res.rows[0];
    return {
      id: r.id,
      token: rawToken,
      bookingId: r.booking_id,
      bookingTravellerId: r.booking_traveller_id || null,
      tripId: r.trip_id,
      tripInstanceId: r.trip_instance_id,
      customerName: r.customer_name || "",
      customerPhone: r.customer_phone || "",
      customMessage: r.custom_message,
      reviewLink: `/review?token=${rawToken}`,
      status: "pending",
      sentAt: r.sent_at ? new Date(r.sent_at).toISOString() : null,
      createdAt: new Date(r.created_at).toISOString()
    };
  },

  async findRequestByToken(token: string): Promise<{
    request: ReviewRequestDto;
    tripName: string;
    packageName: string;
    destinationName: string;
    destinationSlug: string;
    tripDate: string;
    tripId: string;
    tripInstanceId: string;
    bookingNumber: string;
    customerName: string;
    isUsed: boolean;
  } | null> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const res = await query<{
      id: string;
      token: string;
      token_hash: string;
      booking_id: string;
      booking_traveller_id: string | null;
      trip_id: string;
      trip_instance_id: string;
      customer_name: string;
      customer_phone: string;
      custom_message: string | null;
      status: string;
      used_at: string | null;
      sent_at: string | null;
      created_at: string;
      trip_name: string;
      destination_name: string | null;
      destination_slug: string | null;
      display_date: string;
      booking_number: string;
    }>(
      `SELECT rr.*,
              t.name as trip_name,
              d.name as destination_name,
              d.slug as destination_slug,
              ti.display_date,
              b.booking_number
       FROM review_requests rr
       JOIN trips t ON t.id = rr.trip_id
       LEFT JOIN trip_destinations td ON td.trip_id = t.id AND td.sort_order = 0
       LEFT JOIN destinations d ON d.id = td.destination_id
       JOIN trip_instances ti ON ti.id = rr.trip_instance_id
       JOIN bookings b ON b.id = rr.booking_id
       WHERE rr.token = $1 OR rr.token_hash = $2`,
      [token, tokenHash]
    );

    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    const isUsed = Boolean(r.used_at || r.status === "submitted");

    return {
      request: {
        id: r.id,
        token: r.token || token,
        bookingNumber: r.booking_number,
        tripId: r.trip_id,
        tripInstanceId: r.trip_instance_id,
        customerName: r.customer_name,
        customMessage: r.custom_message,
        reviewLink: `/review?token=${r.token || token}`,
        status: isUsed ? "submitted" : "pending",
        sentAt: r.sent_at ? new Date(r.sent_at).toISOString() : null,
        createdAt: new Date(r.created_at).toISOString()
      },
      tripName: r.trip_name,
      packageName: r.trip_name,
      destinationName: r.destination_name || "Uttarakhand",
      destinationSlug: r.destination_slug || "uttarakhand",
      tripDate: r.display_date,
      tripId: r.trip_id,
      tripInstanceId: r.trip_instance_id,
      bookingNumber: r.booking_number,
      customerName: r.customer_name,
      isUsed
    };
  },

  async submitReview(input: SubmitReviewInput): Promise<ReviewDto> {
    return withTransaction(async (client) => {
      const token = input.token.trim();
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const reqRes = await client.query<{
        id: string;
        token: string | null;
        booking_id: string | null;
        booking_traveller_id: string | null;
        trip_id: string;
        trip_instance_id: string | null;
        customer_name: string | null;
        used_at: string | null;
        expires_at: string | null;
      }>(
        `SELECT id, token, booking_id, booking_traveller_id, trip_id, trip_instance_id,
                customer_name, used_at::text, expires_at::text
         FROM review_requests
         WHERE token = $1 OR token_hash = $2
         FOR UPDATE`,
        [token, tokenHash]
      );

      if (reqRes.rows.length === 0) {
        throw new AppError(404, "TOKEN_INVALID", "This review link is invalid or has expired.");
      }

      const reqRow = reqRes.rows[0];

      if (reqRow.used_at) {
        throw new AppError(400, "TOKEN_ALREADY_USED", "This review link has already been used to submit a review.");
      }

      if (reqRow.expires_at && new Date(reqRow.expires_at) < new Date()) {
        throw new AppError(400, "TOKEN_EXPIRED", "This review link has expired.");
      }

      const tripId = reqRow.trip_id;
      const tripInstanceId = reqRow.trip_instance_id;
      const bookingId = reqRow.booking_id;
      const bookingTravellerId = reqRow.booking_traveller_id;
      const reviewRequestId = reqRow.id;
      const reviewerName = reqRow.customer_name || input.reviewerName?.trim() || "Verified Traveller";

      // Find destination ID
      let destinationId: string | null = null;
      const destRes = await client.query<{ id: string }>(
        `SELECT td.destination_id as id FROM trip_destinations td WHERE td.trip_id = $1 LIMIT 1`,
        [tripId]
      );
      if (destRes.rows.length > 0) {
        destinationId = destRes.rows[0].id;
      }

      const initials = reviewerName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "YR";

      // Insert review into reviews table with status 'pending'
      const res = await client.query<ReviewRecord>(
        `INSERT INTO reviews (
          review_request_id, booking_id, booking_traveller_id, trip_id, trip_instance_id, destination_id,
          reviewer_name, reviewer_avatar_initials, rating, body,
          status, photo_urls, submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, now())
        RETURNING *`,
        [
          reviewRequestId,
          bookingId,
          bookingTravellerId,
          tripId,
          tripInstanceId,
          destinationId,
          reviewerName,
          initials,
          input.rating,
          input.body.trim(),
          input.photos || []
        ]
      );

      // Atomically mark review_request used
      await client.query(
        `UPDATE review_requests SET used_at = now(), status = 'submitted' WHERE id = $1`,
        [reviewRequestId]
      );

      return toReviewDto(res.rows[0]);
    });
  }
};
