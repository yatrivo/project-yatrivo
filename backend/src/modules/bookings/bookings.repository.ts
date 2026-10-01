import crypto from "node:crypto";
import { query, withTransaction } from "../../db/postgres";
import { AppError } from "../../errors/AppError";
import type {
  BookingDto,
  BookingEventDto,
  BookingFilters,
  BookingPaymentDto,
  BookingStatus,
  BookingTravellerDto,
  CreateBookingInput,
  PaymentStatus,
  SaveTravellerItem
} from "./bookings.types";

export const ALLOWED_BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ["awaiting_traveller_details", "details_received", "confirmed", "cancelled"],
  awaiting_traveller_details: ["details_received", "confirmed", "cancelled"],
  details_received: ["awaiting_traveller_details", "confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  cancelled: [],
  completed: []
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function generateBookingNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `BOOK-${year}-${rand}`;
}

function generateDetailsToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

async function resolveValidUserId(id?: string | null): Promise<string | null> {
  if (!id || !UUID_REGEX.test(id)) return null;
  const res = await query(`SELECT 1 FROM users WHERE id = $1 LIMIT 1`, [id]);
  return res.rows.length > 0 ? id : null;
}

function normalizePaymentMethod(method?: string | null): string {
  if (!method) return "other";
  const m = method.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const allowed = ["cash", "upi", "bank_transfer", "card", "payment_gateway", "other"];
  return allowed.includes(m) ? m : "other";
}

export const bookingsRepository = {
  async create(
    input: CreateBookingInput,
    actor?: { id: string; fullName: string | null; role: string }
  ): Promise<BookingDto> {
    let resolvedTripId: string | null = null;
    let resolvedTripName = input.tripName || null;

    if (input.tripId) {
      if (UUID_REGEX.test(input.tripId)) {
        const tripRes = await query<{ id: string; name: string }>(
          `SELECT id, name FROM trips WHERE id = $1 LIMIT 1`,
          [input.tripId]
        );
        if (tripRes.rows.length > 0) {
          resolvedTripId = tripRes.rows[0].id;
          resolvedTripName = resolvedTripName || tripRes.rows[0].name;
        }
      } else {
        const tripRes = await query<{ id: string; name: string }>(
          `SELECT id, name FROM trips WHERE LOWER(slug) = LOWER($1) OR LOWER(id) = LOWER($1) LIMIT 1`,
          [input.tripId]
        );
        if (tripRes.rows.length > 0) {
          resolvedTripId = tripRes.rows[0].id;
          resolvedTripName = resolvedTripName || tripRes.rows[0].name;
        }
      }
    }

    let resolvedDestId: string | null = null;
    let resolvedDestLabel = input.destinationLabel || null;

    if (input.destinationId) {
      if (UUID_REGEX.test(input.destinationId)) {
        const destRes = await query<{ id: string; name: string }>(
          `SELECT id, name FROM destinations WHERE id = $1 LIMIT 1`,
          [input.destinationId]
        );
        if (destRes.rows.length > 0) {
          resolvedDestId = destRes.rows[0].id;
          resolvedDestLabel = resolvedDestLabel || destRes.rows[0].name;
        }
      } else {
        const destRes = await query<{ id: string; name: string }>(
          `SELECT id, name FROM destinations WHERE LOWER(slug) = LOWER($1) OR LOWER(id) = LOWER($1) LIMIT 1`,
          [input.destinationId]
        );
        if (destRes.rows.length > 0) {
          resolvedDestId = destRes.rows[0].id;
          resolvedDestLabel = resolvedDestLabel || destRes.rows[0].name;
        }
      }
    }

    let resolvedTripInstanceId: string | null = null;
    let resolvedDateLabel = input.tripDateLabel || null;

    if (input.tripInstanceId && UUID_REGEX.test(input.tripInstanceId)) {
      const instRes = await query<{ id: string; starts_on: string; display_date: string | null }>(
        `SELECT id, starts_on::text, display_date FROM trip_instances WHERE id = $1 LIMIT 1`,
        [input.tripInstanceId]
      );
      if (instRes.rows.length > 0) {
        resolvedTripInstanceId = instRes.rows[0].id;
        if (!resolvedDateLabel) {
          resolvedDateLabel = instRes.rows[0].display_date || instRes.rows[0].starts_on;
        }
      }
    }

    let bookingNumber = generateBookingNumber();
    for (let attempts = 0; attempts < 5; attempts++) {
      const check = await query(`SELECT 1 FROM bookings WHERE booking_number = $1 LIMIT 1`, [bookingNumber]);
      if (check.rows.length === 0) break;
      bookingNumber = generateBookingNumber();
    }

    let resolvedEnquiryId: string | null = null;
    let resolvedEnquiryNumber: string | null = null;

    if (input.enquiryId && input.enquiryId.trim()) {
      const cleanEnquiryId = input.enquiryId.trim();
      if (!UUID_REGEX.test(cleanEnquiryId)) {
        throw new AppError(400, "INVALID_ENQUIRY", "Referenced enquiry does not exist");
      }
      const enqCheck = await query<{ id: string; enquiry_number: string }>(
        `SELECT id, enquiry_number FROM enquiries WHERE id = $1 LIMIT 1`,
        [cleanEnquiryId]
      );
      if (enqCheck.rows.length === 0) {
        throw new AppError(400, "INVALID_ENQUIRY", "Referenced enquiry does not exist");
      }
      resolvedEnquiryId = enqCheck.rows[0].id;
      resolvedEnquiryNumber = enqCheck.rows[0].enquiry_number;
    }

    const detailsToken = generateDetailsToken();
    const travellerCount = Math.max(1, input.travellerCount || 1);
    const finalAmountPaise = input.totalAmount ? Math.round(input.totalAmount * 100) : null;
    const initialStatus: BookingStatus = input.status || "awaiting_traveller_details";
    const initialPaymentStatus: PaymentStatus = input.paymentStatus || "unpaid";
    const createdByUserId = await resolveValidUserId(actor?.id);

    const createdBookingId = await withTransaction(async (client) => {
      // Insert booking
      const insertRes = await client.query<{ id: string }>(
        `INSERT INTO bookings (
          booking_number, enquiry_id, primary_contact_name, primary_contact_phone, primary_contact_email,
          destination_id, destination_label, trip_id, trip_instance_id, trip_label, trip_date_label,
          traveller_count, final_amount_paise, payment_status, status, details_token,
          payment_notes, internal_notes, created_by_user_id
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19
        ) RETURNING id`,
        [
          bookingNumber,
          resolvedEnquiryId,
          input.primaryContactName.trim(),
          input.primaryContactPhone.trim(),
          input.primaryContactEmail?.trim() || null,
          resolvedDestId,
          resolvedDestLabel,
          resolvedTripId,
          resolvedTripInstanceId,
          resolvedTripName,
          resolvedDateLabel,
          travellerCount,
          finalAmountPaise,
          initialPaymentStatus,
          initialStatus,
          detailsToken,
          input.paymentNotes?.trim() || null,
          input.internalNotes?.trim() || null,
          createdByUserId
        ]
      );

      const bookingRow = insertRes.rows[0];

      // If converted from enquiry: update enquiry and log events on both sides
      if (resolvedEnquiryId) {
        const enqNumber = resolvedEnquiryNumber || resolvedEnquiryId;

        // Update enquiry status to 'converted'
        await client.query(
          `UPDATE enquiries SET status = 'converted', updated_at = now(), updated_by_user_id = $1 WHERE id = $2`,
          [createdByUserId, resolvedEnquiryId]
        );

        // Log in enquiry_events
        await client.query(
          `INSERT INTO enquiry_events (enquiry_id, event_type, new_status, title, details, created_by_user_id)
           VALUES ($1, 'enquiry_converted_to_booking', 'converted', $2, $3, $4)`,
          [
            resolvedEnquiryId,
            `Converted to Booking #${bookingNumber}`,
            JSON.stringify({
              bookingId: bookingRow.id,
              bookingNumber,
              convertedByName: actor?.fullName || "Admin"
            }),
            createdByUserId
          ]
        );

        // Log in booking_events
        await client.query(
          `INSERT INTO booking_events (booking_id, event_type, new_status, title, details, actor_type, created_by_user_id)
           VALUES ($1, 'booking_converted_from_enquiry', $2, $3, $4, 'admin', $5)`,
          [
            bookingRow.id,
            initialStatus,
            `Booking converted from enquiry #${enqNumber}`,
            JSON.stringify({
              enquiryId: resolvedEnquiryId,
              enquiryNumber: enqNumber,
              createdByName: actor?.fullName || "Admin"
            }),
            createdByUserId
          ]
        );
      } else {
        // Standalone manual booking
        await client.query(
          `INSERT INTO booking_events (booking_id, event_type, new_status, title, details, actor_type, created_by_user_id)
           VALUES ($1, 'booking_created', $2, 'Booking created', $3, 'admin', $4)`,
          [
            bookingRow.id,
            initialStatus,
            JSON.stringify({
              createdByName: actor?.fullName || "Admin",
              travellerCount
            }),
            createdByUserId
          ]
        );
      }

      // Auto-create initial slot for primary customer in booking_travellers
      await client.query(
        `INSERT INTO booking_travellers (booking_id, full_name, phone, email, sort_order, source)
         VALUES ($1, $2, $3, $4, 1, 'admin')`,
        [
          bookingRow.id,
          input.primaryContactName.trim(),
          input.primaryContactPhone.trim(),
          input.primaryContactEmail?.trim() || null
        ]
      );

      // If initial payment provided:
      if (input.initialPayment && input.initialPayment.amount > 0) {
        const payPaise = Math.round(input.initialPayment.amount * 100);
        await client.query(
          `INSERT INTO booking_payments (booking_id, amount_paise, method, status, paid_at, reference_number, notes, created_by_user_id)
           VALUES ($1, $2, $3, 'paid', now(), $4, $5, $6)`,
          [
            bookingRow.id,
            payPaise,
            normalizePaymentMethod(input.initialPayment.method),
            input.initialPayment.referenceNumber || null,
            input.initialPayment.notes || null,
            createdByUserId
          ]
        );

        // Determine payment status
        const totalPaise = finalAmountPaise || 0;
        let newPayStatus: PaymentStatus = "partial";
        if (payPaise >= totalPaise && totalPaise > 0) {
          newPayStatus = "paid";
        }

        await client.query(
          `UPDATE bookings SET payment_status = $1 WHERE id = $2`,
          [newPayStatus, bookingRow.id]
        );

        await client.query(
          `INSERT INTO booking_events (booking_id, event_type, title, details, actor_type, created_by_user_id)
           VALUES ($1, 'payment_recorded', $2, $3, 'admin', $4)`,
          [
            bookingRow.id,
            `Initial payment recorded: ₹${input.initialPayment.amount.toLocaleString("en-IN")}`,
            JSON.stringify({
              amount: input.initialPayment.amount,
              method: input.initialPayment.method,
              referenceNumber: input.initialPayment.referenceNumber
            }),
            createdByUserId
          ]
        );
      }

      return bookingRow.id;
    });

    const created = await this.findById(createdBookingId);
    return created!;
  },

  async findMany(filters: BookingFilters = {}): Promise<{ bookings: BookingDto[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status && filters.status !== "all") {
      params.push(filters.status.toLowerCase());
      conditions.push(`LOWER(b.status::text) = $${params.length}`);
    }

    if (filters.paymentStatus && filters.paymentStatus !== "all") {
      params.push(filters.paymentStatus.toLowerCase());
      conditions.push(`LOWER(b.payment_status::text) = $${params.length}`);
    }

    if (filters.search) {
      params.push(`%${filters.search.toLowerCase()}%`);
      const idx = params.length;
      conditions.push(
        `(LOWER(b.primary_contact_name) LIKE $${idx} OR LOWER(b.primary_contact_phone) LIKE $${idx} OR LOWER(COALESCE(b.primary_contact_email, '')) LIKE $${idx} OR LOWER(b.booking_number) LIKE $${idx} OR LOWER(COALESCE(b.trip_label, '')) LIKE $${idx})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRes = await query<{ count: string }>(
      `SELECT count(*)::text as count FROM bookings b ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || "0", 10);

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const dataParams = [...params, limit, offset];
    const res = await query<{
      id: string;
      booking_number: string;
      enquiry_id: string | null;
      enquiry_number: string | null;
      primary_contact_name: string;
      primary_contact_phone: string;
      primary_contact_email: string | null;
      destination_id: string | null;
      destination_label: string | null;
      trip_id: string | null;
      trip_label: string | null;
      trip_instance_id: string | null;
      trip_date_label: string | null;
      traveller_count: number;
      final_amount_paise: number | null;
      payment_status: PaymentStatus;
      status: BookingStatus;
      booking_date: string;
      details_token: string;
      payment_notes: string | null;
      internal_notes: string | null;
      created_by_name: string | null;
      created_at: string;
      updated_at: string;
      paid_amount_paise: string;
    }>(
      `SELECT b.id, b.booking_number, b.enquiry_id, e.enquiry_number,
              b.primary_contact_name, b.primary_contact_phone, b.primary_contact_email,
              b.destination_id, b.destination_label,
              b.trip_id, b.trip_label,
              b.trip_instance_id, b.trip_date_label,
              b.traveller_count, b.final_amount_paise,
              b.payment_status, b.status, b.details_token,
              b.payment_notes, b.internal_notes,
              b.booking_date::text, b.created_at::text, b.updated_at::text,
              COALESCE(u.full_name, u.email, 'Admin') as created_by_name,
              COALESCE(SUM(CASE WHEN bp.status IN ('paid', 'success') THEN bp.amount_paise ELSE 0 END), 0)::text as paid_amount_paise
       FROM bookings b
       LEFT JOIN enquiries e ON e.id = b.enquiry_id
       LEFT JOIN users u ON u.id = b.created_by_user_id
       LEFT JOIN booking_payments bp ON bp.booking_id = b.id
       ${whereClause}
       GROUP BY b.id, e.enquiry_number, u.full_name, u.email
       ORDER BY b.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    const bookings: BookingDto[] = res.rows.map((row) => {
      const finalPaise = row.final_amount_paise || 0;
      const paidPaise = parseInt(row.paid_amount_paise, 10) || 0;
      const totalAmount = Math.round(finalPaise / 100);
      const paidAmount = Math.round(paidPaise / 100);
      const remainingAmount = Math.max(0, totalAmount - paidAmount);

      return {
        id: row.id,
        bookingNumber: row.booking_number,
        enquiryId: row.enquiry_id,
        enquiryNumber: row.enquiry_number,
        primaryContactName: row.primary_contact_name,
        primaryContactPhone: row.primary_contact_phone,
        primaryContactEmail: row.primary_contact_email,
        destinationId: row.destination_id,
        destinationLabel: row.destination_label,
        tripId: row.trip_id,
        tripName: row.trip_label,
        tripInstanceId: row.trip_instance_id,
        tripDateLabel: row.trip_date_label,
        travellerCount: row.traveller_count || 1,
        finalAmountPaise: row.final_amount_paise,
        totalAmount,
        paidAmount,
        remainingAmount,
        paymentStatus: row.payment_status,
        status: row.status,
        bookingDate: row.booking_date,
        completedAt: null,
        cancelledAt: null,
        detailsToken: row.details_token,
        detailsFormUrl: `/booking-details/${row.details_token}`,
        paymentNotes: row.payment_notes,
        internalNotes: row.internal_notes,
        createdByName: row.created_by_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    return { bookings, total };
  },

  async findById(idOrNumber: string): Promise<BookingDto | null> {
    const isUuid = UUID_REGEX.test(idOrNumber);
    const whereCond = isUuid ? "b.id = $1" : "LOWER(b.booking_number) = LOWER($1)";

    const res = await query<{
      id: string;
      booking_number: string;
      enquiry_id: string | null;
      enquiry_number: string | null;
      primary_contact_name: string;
      primary_contact_phone: string;
      primary_contact_email: string | null;
      destination_id: string | null;
      destination_label: string | null;
      trip_id: string | null;
      trip_label: string | null;
      trip_instance_id: string | null;
      trip_date_label: string | null;
      traveller_count: number;
      final_amount_paise: number | null;
      payment_status: PaymentStatus;
      status: BookingStatus;
      booking_date: string;
      completed_at: string | null;
      cancelled_at: string | null;
      details_token: string;
      payment_notes: string | null;
      internal_notes: string | null;
      created_by_name: string | null;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT b.id, b.booking_number, b.enquiry_id, e.enquiry_number,
              b.primary_contact_name, b.primary_contact_phone, b.primary_contact_email,
              b.destination_id, b.destination_label,
              b.trip_id, b.trip_label,
              b.trip_instance_id, b.trip_date_label,
              b.traveller_count, b.final_amount_paise,
              b.payment_status, b.status, b.details_token,
              b.completed_at::text, b.cancelled_at::text,
              b.payment_notes, b.internal_notes,
              b.booking_date::text, b.created_at::text, b.updated_at::text,
              COALESCE(u.full_name, u.email, 'Admin') as created_by_name
       FROM bookings b
       LEFT JOIN enquiries e ON e.id = b.enquiry_id
       LEFT JOIN users u ON u.id = b.created_by_user_id
       WHERE ${whereCond}
       LIMIT 1`,
      [idOrNumber]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    // Fetch travellers
    const travellersRes = await query<{
      id: string;
      booking_id: string;
      full_name: string;
      age: number | null;
      gender: string | null;
      phone: string | null;
      email: string | null;
      document_type: string | null;
      id_number: string | null;
      notes: string | null;
      sort_order: number;
      source: string;
    }>(
      `SELECT id, booking_id, full_name, age, gender, phone, email,
              document_type, id_number, notes, sort_order, source
       FROM booking_travellers
       WHERE booking_id = $1
       ORDER BY sort_order ASC, id ASC`,
      [row.id]
    );

    // Fetch payments
    const paymentsRes = await query<{
      id: string;
      booking_id: string;
      amount_paise: number;
      currency: string;
      method: string;
      status: string;
      paid_at: string | null;
      reference_number: string | null;
      notes: string | null;
      created_by_name: string | null;
      created_at: string;
    }>(
      `SELECT bp.id, bp.booking_id, bp.amount_paise, bp.currency,
              bp.method, bp.status, bp.paid_at::text, bp.reference_number, bp.notes,
              COALESCE(u.full_name, u.email, 'Admin') as created_by_name,
              bp.created_at::text
       FROM booking_payments bp
       LEFT JOIN users u ON u.id = bp.created_by_user_id
       WHERE bp.booking_id = $1
       ORDER BY bp.created_at ASC`,
      [row.id]
    );

    // Fetch events
    const eventsRes = await query<{
      id: string;
      booking_id: string;
      event_type: string;
      old_status: string | null;
      new_status: string | null;
      title: string;
      details: Record<string, unknown> | null;
      actor_type: string;
      created_by_name: string | null;
      created_at: string;
    }>(
      `SELECT be.id, be.booking_id, be.event_type, be.old_status::text, be.new_status::text,
              be.title, be.details, be.actor_type,
              COALESCE(u.full_name, u.email, 'System') as created_by_name,
              be.created_at::text
       FROM booking_events be
       LEFT JOIN users u ON u.id = be.created_by_user_id
       WHERE be.booking_id = $1
       ORDER BY be.created_at ASC`,
      [row.id]
    );

    const finalPaise = row.final_amount_paise || 0;
    const paidPaise = paymentsRes.rows
      .filter((p) => p.status === "paid" || p.status === "success")
      .reduce((sum, p) => sum + p.amount_paise, 0);

    const totalAmount = Math.round(finalPaise / 100);
    const paidAmount = Math.round(paidPaise / 100);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    return {
      id: row.id,
      bookingNumber: row.booking_number,
      enquiryId: row.enquiry_id,
      enquiryNumber: row.enquiry_number,
      primaryContactName: row.primary_contact_name,
      primaryContactPhone: row.primary_contact_phone,
      primaryContactEmail: row.primary_contact_email,
      destinationId: row.destination_id,
      destinationLabel: row.destination_label,
      tripId: row.trip_id,
      tripName: row.trip_label,
      tripInstanceId: row.trip_instance_id,
      tripDateLabel: row.trip_date_label,
      travellerCount: row.traveller_count || 1,
      finalAmountPaise: row.final_amount_paise,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentStatus: row.payment_status,
      status: row.status,
      bookingDate: row.booking_date,
      completedAt: row.completed_at,
      cancelledAt: row.cancelled_at,
      detailsToken: row.details_token,
      detailsFormUrl: `/booking-details/${row.details_token}`,
      paymentNotes: row.payment_notes,
      internalNotes: row.internal_notes,
      createdByName: row.created_by_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      travellers: travellersRes.rows.map((t) => ({
        id: t.id,
        bookingId: t.booking_id,
        fullName: t.full_name,
        age: t.age,
        gender: t.gender,
        phone: t.phone,
        email: t.email,
        documentType: t.document_type,
        idNumber: t.id_number,
        notes: t.notes,
        sortOrder: t.sort_order,
        source: t.source || "admin"
      })),
      payments: paymentsRes.rows.map((p) => ({
        id: p.id,
        bookingId: p.booking_id,
        amountPaise: p.amount_paise,
        amountInRupees: Math.round(p.amount_paise / 100),
        currency: p.currency,
        method: p.method,
        status: p.status,
        paidAt: p.paid_at,
        referenceNumber: p.reference_number,
        notes: p.notes,
        createdByName: p.created_by_name,
        createdAt: p.created_at
      })),
      events: eventsRes.rows.map((ev) => ({
        id: ev.id,
        bookingId: ev.booking_id,
        eventType: ev.event_type,
        oldStatus: ev.old_status,
        newStatus: ev.new_status,
        title: ev.title,
        details: ev.details,
        actorType: ev.actor_type,
        createdByName: ev.created_by_name,
        createdAt: ev.created_at
      }))
    };
  },

  async findByDetailsToken(token: string): Promise<BookingDto | null> {
    const res = await query<{ id: string }>(
      `SELECT id FROM bookings WHERE details_token = $1 LIMIT 1`,
      [token.trim()]
    );
    if (res.rows.length === 0) return null;
    return this.findById(res.rows[0].id);
  },

  async saveTravellers(
    bookingId: string,
    travellers: SaveTravellerItem[],
    actor: { type: "customer" | "admin"; userId?: string; name?: string }
  ): Promise<BookingDto> {
    const existing = await this.findById(bookingId);
    if (!existing) {
      throw new AppError(404, "NOT_FOUND", "Booking not found");
    }

    // Replace or update travellers
    await query(`DELETE FROM booking_travellers WHERE booking_id = $1`, [existing.id]);

    for (let i = 0; i < travellers.length; i++) {
      const t = travellers[i];
      if (!t.fullName || !t.fullName.trim()) continue;

      await query(
        `INSERT INTO booking_travellers (
          booking_id, full_name, age, gender, phone, email,
          document_type, id_number, notes, sort_order, source
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11
        )`,
        [
          existing.id,
          t.fullName.trim(),
          t.age || null,
          t.gender || null,
          t.phone?.trim() || null,
          t.email?.trim() || null,
          t.documentType || null,
          t.idNumber?.trim() || null,
          t.notes?.trim() || null,
          i + 1,
          actor.type
        ]
      );
    }

    // Transition status to details_received if it was awaiting_traveller_details or draft
    if (existing.status === "awaiting_traveller_details" || existing.status === "draft") {
      await query(
        `UPDATE bookings SET status = 'details_received', updated_at = now() WHERE id = $1`,
        [existing.id]
      );
    }

    // Log timeline event
    if (actor.type === "customer") {
      await query(
        `INSERT INTO booking_events (booking_id, event_type, old_status, new_status, title, details, actor_type)
         VALUES ($1, 'traveller_details_submitted', $2, 'details_received', 'Traveller details submitted by customer', $3, 'customer')`,
        [
          existing.id,
          existing.status,
          JSON.stringify({
            travellerCount: travellers.length,
            submittedVia: "customer_portal"
          })
        ]
      ).catch(() => {});
    } else {
      await query(
        `INSERT INTO booking_events (booking_id, event_type, title, details, actor_type, created_by_user_id)
         VALUES ($1, 'traveller_details_updated', 'Traveller details updated by admin', $2, 'admin', $3)`,
        [
          existing.id,
          JSON.stringify({
            travellerCount: travellers.length,
            updatedByName: actor.name || "Admin"
          }),
          await resolveValidUserId(actor.userId)
        ]
      ).catch(() => {});
    }

    const updated = await this.findById(existing.id);
    return updated!;
  },

  async updateStatus(
    bookingId: string,
    newStatus: BookingStatus,
    actor?: { id?: string; fullName?: string | null; role?: string }
  ): Promise<BookingDto> {
    const existing = await this.findById(bookingId);
    if (!existing) {
      throw new AppError(404, "NOT_FOUND", "Booking not found");
    }

    const oldStatus = existing.status;
    const normalizedNew = newStatus.toLowerCase() as BookingStatus;

    if (oldStatus === normalizedNew) {
      return existing;
    }

    const allowed = ALLOWED_BOOKING_TRANSITIONS[oldStatus] || [];
    if (!allowed.includes(normalizedNew)) {
      throw new AppError(
        400,
        "INVALID_STATUS_TRANSITION",
        `Cannot transition booking from '${oldStatus}' to '${normalizedNew}'. Terminal or non-sequential transitions require an explicit reopen operation.`
      );
    }

    let extraSql = "";
    if (normalizedNew === "completed") {
      extraSql = ", completed_at = now()";
    } else if (normalizedNew === "cancelled") {
      extraSql = ", cancelled_at = now()";
    }

    const actorUserId = await resolveValidUserId(actor?.id);

    await query(
      `UPDATE bookings
       SET status = $1, updated_at = now(), updated_by_user_id = $2 ${extraSql}
       WHERE id = $3`,
      [normalizedNew, actorUserId, existing.id]
    );

    let eventTitle = `Status changed: ${oldStatus} → ${normalizedNew}`;
    let eventType = "booking_status_changed";

    if (normalizedNew === "confirmed") {
      eventType = "booking_confirmed";
      eventTitle = "Booking officially confirmed";
    } else if (normalizedNew === "cancelled") {
      eventType = "booking_cancelled";
      eventTitle = "Booking cancelled";
    } else if (normalizedNew === "completed") {
      eventType = "booking_completed";
      eventTitle = "Trip & booking completed";
    }

    await query(
      `INSERT INTO booking_events (booking_id, event_type, old_status, new_status, title, details, actor_type, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'admin', $7)`,
      [
        existing.id,
        eventType,
        oldStatus,
        normalizedNew,
        eventTitle,
        JSON.stringify({
          oldStatus,
          newStatus: normalizedNew,
          changedByName: actor?.fullName || "Admin"
        }),
        actorUserId
      ]
    );

    const updated = await this.findById(existing.id);
    return updated!;
  },

  async reopen(
    bookingId: string,
    actor?: { id?: string; fullName?: string | null; role?: string }
  ): Promise<BookingDto> {
    const existing = await this.findById(bookingId);
    if (!existing) {
      throw new AppError(404, "NOT_FOUND", "Booking not found");
    }

    if (existing.status === "completed") {
      throw new AppError(
        400,
        "CANNOT_REOPEN_COMPLETED",
        "Completed bookings cannot be reopened."
      );
    }

    if (existing.status !== "cancelled") {
      throw new AppError(
        400,
        "BOOKING_NOT_CANCELLED",
        `Only cancelled bookings can be reopened. Current status is '${existing.status}'.`
      );
    }

    const targetStatus: BookingStatus = "awaiting_traveller_details";
    const actorUserId = await resolveValidUserId(actor?.id);

    await query(
      `UPDATE bookings
       SET status = $1, cancelled_at = null, updated_at = now(), updated_by_user_id = $2
       WHERE id = $3`,
      [targetStatus, actorUserId, existing.id]
    );

    await query(
      `INSERT INTO booking_events (booking_id, event_type, old_status, new_status, title, details, actor_type, created_by_user_id)
       VALUES ($1, 'booking_reopened', 'cancelled', $2, 'Booking reopened by admin', $3, 'admin', $4)`,
      [
        existing.id,
        targetStatus,
        JSON.stringify({
          oldStatus: "cancelled",
          newStatus: targetStatus,
          reopenedByName: actor?.fullName || "Admin"
        }),
        actorUserId
      ]
    );

    const updated = await this.findById(existing.id);
    return updated!;
  },

  async recordPayment(
    bookingId: string,
    payment: { amount: number; method: string; referenceNumber?: string; notes?: string },
    actor?: { id?: string; fullName?: string | null; role?: string }
  ): Promise<BookingDto> {
    const existing = await this.findById(bookingId);
    if (!existing) {
      throw new AppError(404, "NOT_FOUND", "Booking not found");
    }

    const payPaise = Math.round(payment.amount * 100);
    const actorUserId = await resolveValidUserId(actor?.id);

    await query(
      `INSERT INTO booking_payments (booking_id, amount_paise, method, status, paid_at, reference_number, notes, created_by_user_id)
       VALUES ($1, $2, $3, 'paid', now(), $4, $5, $6)`,
      [
        existing.id,
        payPaise,
        normalizePaymentMethod(payment.method),
        payment.referenceNumber?.trim() || null,
        payment.notes?.trim() || null,
        actorUserId
      ]
    );

    // Re-evaluate payment status
    const payRes = await query<{ total_paid: string }>(
      `SELECT COALESCE(SUM(amount_paise), 0)::text as total_paid
       FROM booking_payments
       WHERE booking_id = $1 AND status IN ('paid', 'success')`,
      [existing.id]
    );

    const totalPaidPaise = parseInt(payRes.rows[0]?.total_paid || "0", 10);
    const finalPaise = existing.finalAmountPaise || 0;

    let newPayStatus: PaymentStatus = "partial";
    if (finalPaise > 0 && totalPaidPaise >= finalPaise) {
      newPayStatus = "paid";
    } else if (totalPaidPaise === 0) {
      newPayStatus = "unpaid";
    }

    await query(
      `UPDATE bookings SET payment_status = $1, updated_at = now(), updated_by_user_id = $2 WHERE id = $3`,
      [newPayStatus, actorUserId, existing.id]
    );

    await query(
      `INSERT INTO booking_events (booking_id, event_type, title, details, actor_type, created_by_user_id)
       VALUES ($1, 'payment_recorded', $2, $3, 'admin', $4)`,
      [
        existing.id,
        `Payment recorded: ₹${payment.amount.toLocaleString("en-IN")}`,
        JSON.stringify({
          amount: payment.amount,
          method: payment.method,
          referenceNumber: payment.referenceNumber,
          recordedByName: actor?.fullName || "Admin"
        }),
        actorUserId
      ]
    ).catch(() => {});

    const updated = await this.findById(existing.id);
    return updated!;
  }
};
