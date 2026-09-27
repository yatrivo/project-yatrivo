import { query } from "../../db/postgres";
import { AppError } from "../../errors/AppError";
import { env, isWhatsAppProviderConfigured } from "../../config/env";
import type {
  CreateEnquiryInput,
  EnquiryAdminDto,
  EnquiryDto,
  EnquiryEventDto,
  EnquiryFilters,
  EnquiryNoteDto
} from "./enquiries.types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_ADMIN_WHATSAPP = env.ADMIN_WHATSAPP_NUMBER || "919876543210";

function generateEnquiryNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `ENQ-${year}-${rand}`;
}

export const enquiriesRepository = {
  async create(
    input: CreateEnquiryInput,
    actor?: { id: string; fullName: string | null; role: string }
  ): Promise<EnquiryDto> {
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
    let resolvedTravelDate = input.requestedTravelDate || null;

    if (input.tripInstanceId && UUID_REGEX.test(input.tripInstanceId)) {
      const instRes = await query<{ id: string; starts_on: string; display_date: string | null }>(
        `SELECT id, starts_on::text, display_date FROM trip_instances WHERE id = $1 LIMIT 1`,
        [input.tripInstanceId]
      );
      if (instRes.rows.length > 0) {
        resolvedTripInstanceId = instRes.rows[0].id;
        if (!resolvedTravelDate) {
          resolvedTravelDate = instRes.rows[0].starts_on;
        }
      }
    }

    let enquiryNumber = generateEnquiryNumber();
    for (let attempts = 0; attempts < 5; attempts++) {
      const check = await query(`SELECT 1 FROM enquiries WHERE enquiry_number = $1 LIMIT 1`, [enquiryNumber]);
      if (check.rows.length === 0) break;
      enquiryNumber = generateEnquiryNumber();
    }

    const travellerCount = Math.max(1, input.requestedTravellerCount || 1);
    const source = input.source || "website";
    const createdByUserId = actor?.id || input.createdByUserId || null;

    const insertRes = await query<{
      id: string;
      enquiry_number: string;
      source: string;
      status: string;
      customer_name: string;
      customer_phone: string;
      customer_email: string | null;
      destination_id: string | null;
      destination_label: string | null;
      trip_id: string | null;
      trip_instance_id: string | null;
      requested_travel_date: string | null;
      requested_traveller_count: number;
      budget_label: string | null;
      message: string | null;
      submitted_at: string;
    }>(
      `INSERT INTO enquiries (
        enquiry_number, source, status,
        customer_name, customer_phone, customer_email,
        destination_id, destination_label,
        trip_id, trip_instance_id,
        requested_travel_date, requested_traveller_count,
        budget_label, message, submitted_at,
        created_by_user_id
      ) VALUES (
        $1, $2, 'received',
        $3, $4, $5,
        $6, $7,
        $8, $9,
        $10, $11,
        $12, $13, now(),
        $14
      ) RETURNING id, enquiry_number, source, status, customer_name, customer_phone, customer_email,
                  destination_id, destination_label, trip_id, trip_instance_id,
                  requested_travel_date::text, requested_traveller_count, budget_label, message, submitted_at::text`,
      [
        enquiryNumber,
        source,
        input.customerName.trim(),
        input.customerPhone.trim(),
        input.customerEmail?.trim() || null,
        resolvedDestId,
        resolvedDestLabel,
        resolvedTripId,
        resolvedTripInstanceId,
        resolvedTravelDate,
        travellerCount,
        input.budgetLabel || null,
        input.message?.trim() || null,
        createdByUserId
      ]
    );

    const row = insertRes.rows[0];

    // Create real initial event in enquiry_events
    if (source === "website") {
      await query(
        `INSERT INTO enquiry_events (enquiry_id, event_type, new_status, title, details)
         VALUES ($1, 'enquiry_received', 'received', 'Enquiry received', $2)`,
        [
          row.id,
          JSON.stringify({
            source: "website",
            tripName: resolvedTripName || "Custom Expedition",
            destination: resolvedDestLabel || "Uttarakhand"
          })
        ]
      ).catch(() => {});
    } else {
      await query(
        `INSERT INTO enquiry_events (enquiry_id, event_type, new_status, title, details, created_by_user_id)
         VALUES ($1, 'enquiry_created_manually', 'received', 'Enquiry created manually', $2, $3)`,
        [
          row.id,
          JSON.stringify({
            source,
            createdByName: actor?.fullName || "Admin",
            tripName: resolvedTripName || "Custom Package",
            destination: resolvedDestLabel || "Uttarakhand",
            departureDate: resolvedTravelDate
          }),
          createdByUserId
        ]
      ).catch(() => {});
    }

    // Admin Notification preparation
    const notifTitle = `New Enquiry #${row.enquiry_number}: ${resolvedTripName || resolvedDestLabel || "Himalayan Trip"}`;
    const notifMessage = `Enquiry from ${row.customer_name} (${row.customer_phone}) for ${row.requested_traveller_count} travellers on ${row.requested_travel_date || "flexible date"}.${row.message ? ` Notes: "${row.message}"` : ""}`;

    // In-app notification queued
    await query(
      `INSERT INTO notifications (type, channel, status, title, message, related_enquiry_id)
       VALUES ('enquiry', 'in_app', 'queued', $1, $2, $3)`,
      [notifTitle, notifMessage, row.id]
    ).catch(() => {});

    // WhatsApp notification queued (only marked queued; no fake provider send if unconfigured)
    const whatsappStatus = isWhatsAppProviderConfigured ? "queued" : "draft";
    await query(
      `INSERT INTO notifications (type, channel, status, recipient_phone, title, message, related_enquiry_id, provider)
       VALUES ('enquiry', 'whatsapp', $1, $2, $3, $4, $5, $6)`,
      [
        whatsappStatus,
        DEFAULT_ADMIN_WHATSAPP,
        notifTitle,
        notifMessage,
        row.id,
        env.WHATSAPP_PROVIDER || null
      ]
    ).catch(() => {});

    const whatsappText = encodeURIComponent(
      `🏔️ *NEW YATRIVO ENQUIRY #${row.enquiry_number}*\n\n` +
      `*Trip:* ${resolvedTripName || "Custom Himalayan Expedition"}\n` +
      `*Destination:* ${resolvedDestLabel || "Uttarakhand"}\n` +
      `*Travel Date:* ${row.requested_travel_date || "Flexible"}\n` +
      `*Travellers:* ${row.requested_traveller_count}\n` +
      `*Customer:* ${row.customer_name}\n` +
      `*Phone:* ${row.customer_phone}\n` +
      (row.customer_email ? `*Email:* ${row.customer_email}\n` : "") +
      (row.budget_label ? `*Price/Budget:* ${row.budget_label}\n` : "") +
      (row.message ? `*Notes:* ${row.message}\n` : "") +
      `\n_Source: ${source}_`
    );

    const adminWhatsAppUrl = `https://wa.me/${DEFAULT_ADMIN_WHATSAPP}?text=${whatsappText}`;

    return {
      id: row.id,
      enquiryNumber: row.enquiry_number,
      source: row.source,
      status: row.status,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      destinationId: row.destination_id,
      destinationLabel: row.destination_label,
      tripId: row.trip_id,
      tripName: resolvedTripName,
      tripInstanceId: row.trip_instance_id,
      requestedTravelDate: row.requested_travel_date,
      requestedTravellerCount: row.requested_traveller_count,
      budgetLabel: row.budget_label,
      message: row.message,
      submittedAt: row.submitted_at,
      adminWhatsAppUrl
    };
  },

  async findMany(filters: EnquiryFilters = {}): Promise<{ enquiries: EnquiryDto[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status && filters.status !== "all") {
      params.push(filters.status.toLowerCase());
      conditions.push(`LOWER(e.status::text) = $${params.length}`);
    }

    if (filters.assignedTo) {
      if (filters.assignedTo === "me" && filters.currentUserId) {
        params.push(filters.currentUserId);
        conditions.push(`e.assigned_to_user_id = $${params.length}`);
      } else if (filters.assignedTo === "unassigned") {
        conditions.push(`e.assigned_to_user_id IS NULL`);
      } else if (filters.assignedTo !== "all" && UUID_REGEX.test(filters.assignedTo)) {
        params.push(filters.assignedTo);
        conditions.push(`e.assigned_to_user_id = $${params.length}`);
      }
    }

    if (filters.search) {
      params.push(`%${filters.search.toLowerCase()}%`);
      const idx = params.length;
      conditions.push(
        `(LOWER(e.customer_name) LIKE $${idx} OR LOWER(e.customer_phone) LIKE $${idx} OR LOWER(COALESCE(e.customer_email, '')) LIKE $${idx} OR LOWER(e.enquiry_number) LIKE $${idx} OR LOWER(COALESCE(t.name, '')) LIKE $${idx})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRes = await query<{ count: string }>(
      `SELECT count(*)::text as count
       FROM enquiries e
       LEFT JOIN trips t ON t.id = e.trip_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || "0", 10);

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const dataParams = [...params, limit, offset];
    const res = await query<{
      id: string;
      enquiry_number: string;
      source: string;
      status: string;
      customer_name: string;
      customer_phone: string;
      customer_email: string | null;
      destination_id: string | null;
      destination_label: string | null;
      trip_id: string | null;
      trip_name: string | null;
      trip_instance_id: string | null;
      requested_travel_date: string | null;
      requested_traveller_count: number;
      budget_label: string | null;
      message: string | null;
      submitted_at: string;
      assigned_to_user_id: string | null;
      assigned_to_name: string | null;
      assigned_to_email: string | null;
      booking_id: string | null;
      booking_number: string | null;
    }>(
      `SELECT e.id, e.enquiry_number, e.source::text, e.status::text,
              e.customer_name, e.customer_phone, e.customer_email,
              e.destination_id, e.destination_label,
              e.trip_id, t.name as trip_name,
              e.trip_instance_id,
              e.requested_travel_date::text,
              e.requested_traveller_count,
              e.budget_label, e.message,
              e.submitted_at::text,
              e.assigned_to_user_id,
              u.full_name as assigned_to_name,
              u.email as assigned_to_email,
              b.id as booking_id,
              b.booking_number
       FROM enquiries e
       LEFT JOIN trips t ON t.id = e.trip_id
       LEFT JOIN users u ON u.id = e.assigned_to_user_id
       LEFT JOIN bookings b ON b.enquiry_id = e.id
       ${whereClause}
       ORDER BY e.submitted_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    const enquiries: EnquiryDto[] = res.rows.map((row) => ({
      id: row.id,
      enquiryNumber: row.enquiry_number,
      source: row.source,
      status: row.status,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      destinationId: row.destination_id,
      destinationLabel: row.destination_label,
      tripId: row.trip_id,
      tripName: row.trip_name,
      tripInstanceId: row.trip_instance_id,
      requestedTravelDate: row.requested_travel_date,
      requestedTravellerCount: row.requested_traveller_count,
      budgetLabel: row.budget_label,
      message: row.message,
      submittedAt: row.submitted_at,
      assignedToUserId: row.assigned_to_user_id,
      assignedToName: row.assigned_to_name,
      assignedToEmail: row.assigned_to_email,
      bookingId: row.booking_id,
      bookingNumber: row.booking_number
    }));

    return { enquiries, total };
  },

  async findById(idOrNumber: string): Promise<EnquiryDto | null> {
    const isUuid = UUID_REGEX.test(idOrNumber);
    const whereCond = isUuid ? "e.id = $1" : "LOWER(e.enquiry_number) = LOWER($1)";

    const res = await query<{
      id: string;
      enquiry_number: string;
      source: string;
      status: string;
      customer_name: string;
      customer_phone: string;
      customer_email: string | null;
      destination_id: string | null;
      destination_label: string | null;
      trip_id: string | null;
      trip_name: string | null;
      trip_instance_id: string | null;
      requested_travel_date: string | null;
      requested_traveller_count: number;
      budget_label: string | null;
      message: string | null;
      submitted_at: string;
      assigned_to_user_id: string | null;
      assigned_to_name: string | null;
      assigned_to_email: string | null;
      booking_id: string | null;
      booking_number: string | null;
    }>(
      `SELECT e.id, e.enquiry_number, e.source::text, e.status::text,
              e.customer_name, e.customer_phone, e.customer_email,
              e.destination_id, e.destination_label,
              e.trip_id, t.name as trip_name,
              e.trip_instance_id,
              e.requested_travel_date::text,
              e.requested_traveller_count,
              e.budget_label, e.message,
              e.submitted_at::text,
              e.assigned_to_user_id,
              u.full_name as assigned_to_name,
              u.email as assigned_to_email,
              b.id as booking_id,
              b.booking_number
       FROM enquiries e
       LEFT JOIN trips t ON t.id = e.trip_id
       LEFT JOIN users u ON u.id = e.assigned_to_user_id
       LEFT JOIN bookings b ON b.enquiry_id = e.id
       WHERE ${whereCond}
       LIMIT 1`,
      [idOrNumber]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    // Fetch notes
    const notesRes = await query<{
      id: string;
      enquiry_id: string;
      body: string;
      created_by_user_id: string | null;
      created_by_name: string | null;
      created_at: string;
    }>(
      `SELECT n.id, n.enquiry_id, n.body, n.created_by_user_id,
              COALESCE(u.full_name, u.email, 'Admin') as created_by_name,
              n.created_at::text
       FROM enquiry_notes n
       LEFT JOIN users u ON u.id = n.created_by_user_id
       WHERE n.enquiry_id = $1
       ORDER BY n.created_at ASC`,
      [row.id]
    );

    // Fetch real events
    const eventsRes = await query<{
      id: string;
      enquiry_id: string;
      event_type: string;
      old_status: string | null;
      new_status: string | null;
      title: string;
      details: Record<string, unknown> | null;
      created_by_user_id: string | null;
      created_by_name: string | null;
      created_at: string;
    }>(
      `SELECT ev.id, ev.enquiry_id, ev.event_type,
              ev.old_status::text, ev.new_status::text,
              ev.title, ev.details, ev.created_by_user_id,
              COALESCE(u.full_name, u.email, 'System') as created_by_name,
              ev.created_at::text
       FROM enquiry_events ev
       LEFT JOIN users u ON u.id = ev.created_by_user_id
       WHERE ev.enquiry_id = $1
       ORDER BY ev.created_at ASC`,
      [row.id]
    );

    return {
      id: row.id,
      enquiryNumber: row.enquiry_number,
      source: row.source,
      status: row.status,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      destinationId: row.destination_id,
      destinationLabel: row.destination_label,
      tripId: row.trip_id,
      tripName: row.trip_name,
      tripInstanceId: row.trip_instance_id,
      requestedTravelDate: row.requested_travel_date,
      requestedTravellerCount: row.requested_traveller_count,
      budgetLabel: row.budget_label,
      message: row.message,
      submittedAt: row.submitted_at,
      assignedToUserId: row.assigned_to_user_id,
      assignedToName: row.assigned_to_name,
      assignedToEmail: row.assigned_to_email,
      notes: notesRes.rows.map((n) => ({
        id: n.id,
        enquiryId: n.enquiry_id,
        body: n.body,
        createdByUserId: n.created_by_user_id,
        createdByName: n.created_by_name,
        createdAt: n.created_at
      })),
      events: eventsRes.rows.map((ev) => ({
        id: ev.id,
        enquiryId: ev.enquiry_id,
        eventType: ev.event_type,
        oldStatus: ev.old_status,
        newStatus: ev.new_status,
        title: ev.title,
        details: ev.details,
        createdByUserId: ev.created_by_user_id,
        createdByName: ev.created_by_name,
        createdAt: ev.created_at
      }))
    };
  },

  async updateStatus(
    id: string,
    newStatus: string,
    actor: { id: string; fullName: string | null; role: string }
  ): Promise<EnquiryDto> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new AppError(404, "NOT_FOUND", "Enquiry not found");
    }

    const oldStatus = existing.status;
    const normalizedNew = newStatus.toLowerCase();

    await query(
      `UPDATE enquiries
       SET status = $1, updated_at = now(), updated_by_user_id = $2
       WHERE id = $3`,
      [normalizedNew, actor.id, existing.id]
    );

    // Record timeline event
    await query(
      `INSERT INTO enquiry_events (enquiry_id, event_type, old_status, new_status, title, details, created_by_user_id)
       VALUES ($1, 'status_changed', $2, $3, 'Status changed', $4, $5)`,
      [
        existing.id,
        oldStatus,
        normalizedNew,
        JSON.stringify({
          oldStatus,
          newStatus: normalizedNew,
          changedByName: actor.fullName || "Admin"
        }),
        actor.id
      ]
    );

    const updated = await this.findById(existing.id);
    return updated!;
  },

  async assign(
    id: string,
    newAssigneeId: string | null,
    actor: { id: string; fullName: string | null; role: string }
  ): Promise<EnquiryDto> {
    // Permission check enforced server-side
    if (actor.role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN", "Only Super Admin can assign or reassign enquiries.");
    }

    const existing = await this.findById(id);
    if (!existing) {
      throw new AppError(404, "NOT_FOUND", "Enquiry not found");
    }

    const oldAssigneeId = existing.assignedToUserId;
    const oldAssigneeName = existing.assignedToName;

    let newAssigneeName: string | null = null;
    if (newAssigneeId) {
      const userRes = await query<{ full_name: string; email: string }>(
        `SELECT full_name, email FROM users WHERE id = $1 AND role IN ('admin', 'super_admin') LIMIT 1`,
        [newAssigneeId]
      );
      if (userRes.rows.length === 0) {
        throw new AppError(400, "BAD_REQUEST", "Selected user is not an active admin.");
      }
      newAssigneeName = userRes.rows[0].full_name || userRes.rows[0].email;
    }

    await query(
      `UPDATE enquiries
       SET assigned_to_user_id = $1, updated_at = now(), updated_by_user_id = $2
       WHERE id = $3`,
      [newAssigneeId, actor.id, existing.id]
    );

    // Record assignment timeline event
    if (oldAssigneeId && newAssigneeId && oldAssigneeId !== newAssigneeId) {
      // Reassignment
      await query(
        `INSERT INTO enquiry_events (enquiry_id, event_type, title, details, created_by_user_id)
         VALUES ($1, 'enquiry_reassigned', $2, $3, $4)`,
        [
          existing.id,
          `Reassigned: ${oldAssigneeName || "Admin"} → ${newAssigneeName}`,
          JSON.stringify({
            previousAssigneeId: oldAssigneeId,
            previousAssigneeName: oldAssigneeName,
            newAssigneeId,
            newAssigneeName,
            reassignedByName: actor.fullName || "Super Admin"
          }),
          actor.id
        ]
      );
    } else if (!oldAssigneeId && newAssigneeId) {
      // First assignment
      await query(
        `INSERT INTO enquiry_events (enquiry_id, event_type, title, details, created_by_user_id)
         VALUES ($1, 'enquiry_assigned', $2, $3, $4)`,
        [
          existing.id,
          `Assigned to ${newAssigneeName}`,
          JSON.stringify({
            assigneeId: newAssigneeId,
            assigneeName: newAssigneeName,
            assignedByName: actor.fullName || "Super Admin"
          }),
          actor.id
        ]
      );
    } else if (oldAssigneeId && !newAssigneeId) {
      // Unassigned
      await query(
        `INSERT INTO enquiry_events (enquiry_id, event_type, title, details, created_by_user_id)
         VALUES ($1, 'enquiry_unassigned', $2, $3, $4)`,
        [
          existing.id,
          `Unassigned from ${oldAssigneeName || "Admin"}`,
          JSON.stringify({
            previousAssigneeId: oldAssigneeId,
            unassignedByName: actor.fullName || "Super Admin"
          }),
          actor.id
        ]
      );
    }

    const updated = await this.findById(existing.id);
    return updated!;
  },

  async addNote(
    enquiryId: string,
    body: string,
    actor: { id: string; fullName: string | null; role: string }
  ): Promise<EnquiryNoteDto> {
    const existing = await this.findById(enquiryId);
    if (!existing) {
      throw new AppError(404, "NOT_FOUND", "Enquiry not found");
    }

    const insertRes = await query<{
      id: string;
      enquiry_id: string;
      body: string;
      created_by_user_id: string | null;
      created_at: string;
    }>(
      `INSERT INTO enquiry_notes (enquiry_id, body, created_by_user_id)
       VALUES ($1, $2, $3)
       RETURNING id, enquiry_id, body, created_by_user_id, created_at::text`,
      [existing.id, body.trim(), actor.id]
    );

    const note = insertRes.rows[0];

    // Record timeline event
    await query(
      `INSERT INTO enquiry_events (enquiry_id, event_type, title, details, created_by_user_id)
       VALUES ($1, 'note_added', 'Internal note added', $2, $3)`,
      [
        existing.id,
        JSON.stringify({
          noteSnippet: body.trim().slice(0, 100),
          addedByName: actor.fullName || "Admin"
        }),
        actor.id
      ]
    );

    return {
      id: note.id,
      enquiryId: note.enquiry_id,
      body: note.body,
      createdByUserId: note.created_by_user_id,
      createdByName: actor.fullName || "Admin",
      createdAt: note.created_at
    };
  },

  async deleteNote(
    enquiryId: string,
    noteId: string,
    actor: { id: string; fullName: string | null; role: string }
  ): Promise<void> {
    const noteRes = await query<{ id: string; enquiry_id: string; created_by_user_id: string | null }>(
      `SELECT id, enquiry_id, created_by_user_id FROM enquiry_notes WHERE id = $1 AND enquiry_id = $2`,
      [noteId, enquiryId]
    );

    if (noteRes.rows.length === 0) {
      throw new AppError(404, "NOT_FOUND", "Note not found");
    }

    const note = noteRes.rows[0];

    // Backend permission check: Author or Super Admin can delete
    const isAuthor = note.created_by_user_id === actor.id;
    const isSuperAdmin = actor.role === "super_admin";

    if (!isAuthor && !isSuperAdmin) {
      throw new AppError(403, "FORBIDDEN", "You do not have permission to delete this note.");
    }

    await query(`DELETE FROM enquiry_notes WHERE id = $1`, [noteId]);

    // Record timeline event
    await query(
      `INSERT INTO enquiry_events (enquiry_id, event_type, title, details, created_by_user_id)
       VALUES ($1, 'note_deleted', 'Internal note deleted', $2, $3)`,
      [
        enquiryId,
        JSON.stringify({
          deletedByName: actor.fullName || "Admin"
        }),
        actor.id
      ]
    );
  },

  async recordAction(
    enquiryId: string,
    actionType: "contact" | "quote",
    data: { method?: string; amount?: number; notes?: string },
    actor: { id: string; fullName: string | null; role: string }
  ): Promise<EnquiryDto> {
    const existing = await this.findById(enquiryId);
    if (!existing) {
      throw new AppError(404, "NOT_FOUND", "Enquiry not found");
    }

    if (actionType === "contact") {
      const methodLabel = data.method === "whatsapp" ? "WhatsApp" : "Phone Call";
      // If still received, transition to contacted
      if (existing.status.toLowerCase() === "received") {
        await query(
          `UPDATE enquiries SET status = 'contacted', updated_at = now(), updated_by_user_id = $1 WHERE id = $2`,
          [actor.id, existing.id]
        );
      }

      await query(
        `INSERT INTO enquiry_events (enquiry_id, event_type, title, details, created_by_user_id)
         VALUES ($1, 'customer_contacted', $2, $3, $4)`,
        [
          existing.id,
          `Customer contacted via ${methodLabel}`,
          JSON.stringify({
            method: data.method,
            notes: data.notes || null,
            contactedByName: actor.fullName || "Admin"
          }),
          actor.id
        ]
      );
    } else if (actionType === "quote") {
      // Transition to quoted
      await query(
        `UPDATE enquiries SET status = 'quoted', updated_at = now(), updated_by_user_id = $1 WHERE id = $2`,
        [actor.id, existing.id]
      );

      const title = data.amount && data.amount > 0
        ? `Quote provided: ₹${data.amount.toLocaleString("en-IN")}`
        : "Quote provided to customer";

      await query(
        `INSERT INTO enquiry_events (enquiry_id, event_type, old_status, new_status, title, details, created_by_user_id)
         VALUES ($1, 'quote_sent', $2, 'quoted', $3, $4, $5)`,
        [
          existing.id,
          existing.status.toLowerCase(),
          title,
          JSON.stringify({
            amount: data.amount,
            notes: data.notes || null,
            quotedByName: actor.fullName || "Admin"
          }),
          actor.id
        ]
      );
    }

    const updated = await this.findById(existing.id);
    return updated!;
  },

  async listAdmins(): Promise<EnquiryAdminDto[]> {
    const res = await query<{ id: string; full_name: string | null; email: string; role: "super_admin" | "admin" }>(
      `SELECT id, COALESCE(full_name, email) as full_name, email, role
       FROM users
       WHERE role IN ('admin', 'super_admin') AND status = 'active'
       ORDER BY full_name ASC`
    );

    return res.rows.map((r) => ({
      id: r.id,
      fullName: r.full_name || r.email,
      email: r.email,
      role: r.role
    }));
  }
};
