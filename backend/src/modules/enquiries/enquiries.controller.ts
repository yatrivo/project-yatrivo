import { Request, Response } from "express";
import { z } from "zod";
import { enquiriesRepository } from "./enquiries.repository";
import { AppError } from "../../errors/AppError";
import { recordAuditLog } from "../audit/audit.service";

const createEnquirySchema = z.object({
  customerName: z.string().trim().min(1, "Name is required").max(255),
  customerPhone: z.string().trim().min(7, "Valid phone number is required").max(30),
  customerEmail: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  tripId: z.string().optional().or(z.literal("")),
  tripName: z.string().optional().or(z.literal("")),
  tripInstanceId: z.string().optional().or(z.literal("")),
  destinationId: z.string().optional().or(z.literal("")),
  destinationLabel: z.string().optional().or(z.literal("")),
  requestedTravelDate: z.string().optional().or(z.literal("")),
  requestedTravellerCount: z.coerce.number().int().min(1).default(1),
  budgetLabel: z.string().optional().or(z.literal("")),
  message: z.string().optional().or(z.literal("")),
  source: z.enum(["website", "whatsapp", "phone", "walk_in", "instagram", "google", "admin", "other"]).optional().default("website")
});

const updateStatusSchema = z.object({
  status: z.enum([
    "received",
    "contacted",
    "quoted",
    "in_discussion",
    "converted",
    "confirmed",
    "closed",
    "cancelled",
    "lost"
  ])
});

const assignSchema = z.object({
  assignedToUserId: z.string().uuid().nullable().optional().or(z.literal(""))
});

const addNoteSchema = z.object({
  body: z.string().trim().min(1, "Note content cannot be empty")
});

const actionSchema = z.object({
  action: z.enum(["contact", "quote"]),
  method: z.enum(["phone", "whatsapp"]).optional(),
  amount: z.coerce.number().min(0).optional(),
  notes: z.string().optional()
});

export const enquiryQuerySchema = z.object({
  status: z.string().trim().optional(),
  assignedTo: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).optional()
});

export const enquiriesController = {
  async create(req: Request, res: Response): Promise<void> {
    const parseResult = createEnquirySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid enquiry submission data",
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const data = parseResult.data;
    const actor = req.user
      ? { id: req.user.id, fullName: req.user.fullName || null, role: req.user.role }
      : undefined;

    // Duplicate submission cooldown: prevent rapid duplicate submissions for anonymous users
    if (!actor && data.customerPhone) {
      const isDuplicate = await enquiriesRepository.findRecentDuplicate({
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || undefined,
        tripId: data.tripId || undefined,
        destinationId: data.destinationId || undefined,
        destinationLabel: data.destinationLabel || undefined,
        cooldownMinutes: 5
      });

      if (isDuplicate) {
        throw new AppError(
          429,
          "DUPLICATE_ENQUIRY",
          "An enquiry with this contact information was recently received. Please wait a few minutes before submitting another request."
        );
      }
    }

    const enquiry = await enquiriesRepository.create(
      {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || undefined,
        tripId: data.tripId || undefined,
        tripName: data.tripName || undefined,
        tripInstanceId: data.tripInstanceId || undefined,
        destinationId: data.destinationId || undefined,
        destinationLabel: data.destinationLabel || undefined,
        requestedTravelDate: data.requestedTravelDate || undefined,
        requestedTravellerCount: data.requestedTravellerCount,
        budgetLabel: data.budgetLabel || undefined,
        message: data.message || undefined,
        source: data.source
      },
      actor
    );

    res.status(201).json({
      success: true,
      enquiry
    });

    await recordAuditLog({
      req,
      actorUserId: actor?.id || null,
      actorNameSnapshot: actor?.fullName || (data.customerName ? `Customer: ${data.customerName}` : "Website Visitor"),
      action: actor ? "Created Enquiry" : "Received Enquiry",
      entityType: "enquiry",
      entityId: enquiry.id,
      details: `Enquiry #${enquiry.enquiryNumber || enquiry.id.slice(0, 8)} received from ${data.customerName} (${data.customerPhone}) for ${data.tripName || data.destinationLabel || "Custom Trip"}`,
      afterData: { enquiryNumber: enquiry.enquiryNumber, status: enquiry.status, source: data.source }
    });
  },

  async list(req: Request, res: Response): Promise<void> {
    const { status, assignedTo, search, page, limit } = req.query as unknown as z.infer<typeof enquiryQuerySchema>;

    const result = await enquiriesRepository.findMany({
      status: typeof status === "string" ? status : undefined,
      assignedTo: typeof assignedTo === "string" ? assignedTo : undefined,
      search: typeof search === "string" ? search : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? Math.min(Math.max(1, parseInt(String(limit), 10)), 100) : 50,
      currentUserId: req.user?.id
    });

    res.status(200).json(result);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const enquiry = await enquiriesRepository.findById(id);
    if (!enquiry) {
      res.status(404).json({ message: "Enquiry not found" });
      return;
    }

    res.status(200).json({ enquiry });
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const id = String(req.params.id);
    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid status value",
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const updated = await enquiriesRepository.updateStatus(
      id,
      parseResult.data.status,
      {
        id: req.user.id,
        fullName: req.user.fullName || null,
        role: req.user.role
      }
    );

    res.status(200).json({ success: true, enquiry: updated });

    await recordAuditLog({
      req,
      action: "Updated Enquiry Status",
      entityType: "enquiry",
      entityId: updated.id,
      details: `Enquiry #${updated.enquiryNumber || id.slice(0, 8)} status set to "${parseResult.data.status}"`,
      afterData: { status: parseResult.data.status }
    });
  },

  async assign(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    if (req.user.role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN", "Only Super Admin can assign or reassign enquiries.");
    }

    const id = String(req.params.id);
    const parseResult = assignSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid assignment data",
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const assignedToUserId = parseResult.data.assignedToUserId || null;
    const updated = await enquiriesRepository.assign(
      id,
      assignedToUserId,
      {
        id: req.user.id,
        fullName: req.user.fullName || null,
        role: req.user.role
      }
    );

    res.status(200).json({ success: true, enquiry: updated });

    await recordAuditLog({
      req,
      action: "Assigned Enquiry",
      entityType: "enquiry",
      entityId: updated.id,
      details: `Enquiry #${updated.enquiryNumber || id.slice(0, 8)} ${assignedToUserId ? "assigned to staff" : "unassigned"}`,
      afterData: { assignedToUserId }
    });
  },

  async addNote(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const id = String(req.params.id);
    const parseResult = addNoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid note body",
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const note = await enquiriesRepository.addNote(
      id,
      parseResult.data.body,
      {
        id: req.user.id,
        fullName: req.user.fullName || null,
        role: req.user.role
      }
    );

    res.status(201).json({ success: true, note });

    await recordAuditLog({
      req,
      action: "Added Enquiry Note",
      entityType: "enquiry",
      entityId: id,
      details: `Internal note added to Enquiry #${id.slice(0, 8)}`
    });
  },

  async deleteNote(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const id = String(req.params.id);
    const noteId = String(req.params.noteId);
    await enquiriesRepository.deleteNote(
      id,
      noteId,
      {
        id: req.user.id,
        fullName: req.user.fullName || null,
        role: req.user.role
      }
    );

    res.status(200).json({ success: true, message: "Note deleted" });

    await recordAuditLog({
      req,
      action: "Deleted Enquiry Note",
      entityType: "enquiry",
      entityId: id,
      details: `Internal note removed from Enquiry #${id.slice(0, 8)}`
    });
  },

  async recordAction(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const id = String(req.params.id);
    const parseResult = actionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid action data",
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const { action, method, amount, notes } = parseResult.data;
    const updated = await enquiriesRepository.recordAction(
      id,
      action,
      { method, amount, notes },
      {
        id: req.user.id,
        fullName: req.user.fullName || null,
        role: req.user.role
      }
    );

    res.status(200).json({ success: true, enquiry: updated });

    await recordAuditLog({
      req,
      action: `Enquiry Action: ${action}`,
      entityType: "enquiry",
      entityId: id,
      details: `Action "${action}" recorded via ${method || "direct"} for Enquiry #${updated.enquiryNumber || id.slice(0, 8)}`,
      afterData: { action, method, amount, notes }
    });
  },

  async listAdmins(req: Request, res: Response): Promise<void> {
    const admins = await enquiriesRepository.listAdmins();
    res.status(200).json({ admins });
  }
};
