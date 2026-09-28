import { Request, Response } from "express";
import { z } from "zod";
import { bookingsRepository } from "./bookings.repository";
import { AppError } from "../../errors/AppError";
import { recordAuditLog } from "../audit/audit.service";

const createBookingSchema = z.object({
  enquiryId: z.string().optional().or(z.literal("")),
  primaryContactName: z.string().trim().min(1, "Primary contact name is required").max(255),
  primaryContactPhone: z.string().trim().min(7, "Valid phone number is required").max(30),
  primaryContactEmail: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  destinationId: z.string().optional().or(z.literal("")),
  destinationLabel: z.string().optional().or(z.literal("")),
  tripId: z.string().optional().or(z.literal("")),
  tripName: z.string().optional().or(z.literal("")),
  tripInstanceId: z.string().optional().or(z.literal("")),
  tripDateLabel: z.string().optional().or(z.literal("")),
  travellerCount: z.coerce.number().int().min(1).default(1),
  totalAmount: z.coerce.number().min(0).optional(),
  paymentStatus: z.enum(["unpaid", "partial", "paid", "refunded"]).optional().default("unpaid"),
  paymentNotes: z.string().optional().or(z.literal("")),
  internalNotes: z.string().optional().or(z.literal("")),
  status: z.enum([
    "draft",
    "awaiting_traveller_details",
    "details_received",
    "confirmed",
    "cancelled",
    "completed"
  ]).optional().default("awaiting_traveller_details"),
  initialPayment: z.object({
    amount: z.coerce.number().min(0),
    method: z.string().optional().default("upi"),
    referenceNumber: z.string().optional(),
    notes: z.string().optional()
  }).optional()
});

const updateStatusSchema = z.object({
  status: z.enum([
    "draft",
    "awaiting_traveller_details",
    "details_received",
    "confirmed",
    "cancelled",
    "completed"
  ])
});

const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive("Payment amount must be greater than 0"),
  method: z.enum(["cash", "upi", "bank_transfer", "card", "payment_gateway", "other"]).default("upi"),
  referenceNumber: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal(""))
});

const saveTravellersSchema = z.object({
  travellers: z.array(z.object({
    id: z.string().optional(),
    fullName: z.string().trim().min(1, "Full name is required"),
    age: z.coerce.number().int().min(0).max(120).nullable().optional(),
    gender: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    documentType: z.string().optional().nullable(),
    idNumber: z.string().optional().nullable(),
    notes: z.string().optional().nullable()
  }))
});

export const bookingsController = {
  async create(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const parseResult = createBookingSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid booking data",
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const data = parseResult.data;
    const actor = {
      id: req.user.id,
      fullName: req.user.fullName || null,
      role: req.user.role
    };

    const booking = await bookingsRepository.create(
      {
        enquiryId: data.enquiryId || undefined,
        primaryContactName: data.primaryContactName,
        primaryContactPhone: data.primaryContactPhone,
        primaryContactEmail: data.primaryContactEmail || undefined,
        destinationId: data.destinationId || undefined,
        destinationLabel: data.destinationLabel || undefined,
        tripId: data.tripId || undefined,
        tripName: data.tripName || undefined,
        tripInstanceId: data.tripInstanceId || undefined,
        tripDateLabel: data.tripDateLabel || undefined,
        travellerCount: data.travellerCount,
        totalAmount: data.totalAmount,
        paymentStatus: data.paymentStatus,
        paymentNotes: data.paymentNotes || undefined,
        internalNotes: data.internalNotes || undefined,
        status: data.status,
        initialPayment: data.initialPayment
      },
      actor
    );

    res.status(201).json({
      success: true,
      booking
    });

    await recordAuditLog({
      req,
      action: "Created Booking",
      entityType: "booking",
      entityId: booking.id,
      details: `Booking #${booking.bookingNumber || booking.id.slice(0, 8)} created for ${data.primaryContactName} (${data.tripName || data.destinationLabel || "Trip"}) – ${data.travellerCount} traveller(s)`,
      afterData: { bookingNumber: booking.bookingNumber, status: booking.status, totalAmount: data.totalAmount }
    });
  },

  async list(req: Request, res: Response): Promise<void> {
    const { status, paymentStatus, search, page, limit } = req.query;

    const result = await bookingsRepository.findMany({
      status: typeof status === "string" ? status : undefined,
      paymentStatus: typeof paymentStatus === "string" ? paymentStatus : undefined,
      search: typeof search === "string" ? search : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 50
    });

    res.status(200).json(result);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const booking = await bookingsRepository.findById(id);
    if (!booking) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    res.status(200).json({ booking });
  },

  async getByDetailsToken(req: Request, res: Response): Promise<void> {
    const token = String(req.params.token);
    const booking = await bookingsRepository.findByDetailsToken(token);
    if (!booking) {
      res.status(404).json({ message: "Booking link is invalid or has expired." });
      return;
    }

    // Customer safe view (omit internal notes)
    const customerSafeBooking = {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      primaryContactName: booking.primaryContactName,
      primaryContactPhone: booking.primaryContactPhone,
      primaryContactEmail: booking.primaryContactEmail,
      destinationLabel: booking.destinationLabel,
      tripName: booking.tripName,
      tripDateLabel: booking.tripDateLabel,
      travellerCount: booking.travellerCount,
      status: booking.status,
      travellers: booking.travellers || []
    };

    res.status(200).json({ booking: customerSafeBooking });
  },

  async saveTravellersCustomer(req: Request, res: Response): Promise<void> {
    const token = String(req.params.token);
    const booking = await bookingsRepository.findByDetailsToken(token);
    if (!booking) {
      res.status(404).json({ message: "Booking not found or link has expired." });
      return;
    }

    const parseResult = saveTravellersSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid traveller details",
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const updated = await bookingsRepository.saveTravellers(
      booking.id,
      parseResult.data.travellers,
      { type: "customer" }
    );

    res.status(200).json({
      success: true,
      message: "Traveller details submitted successfully.",
      booking: updated
    });

    await recordAuditLog({
      req,
      actorNameSnapshot: `Customer: ${booking.primaryContactName}`,
      action: "Submitted Traveller Details",
      entityType: "booking",
      entityId: booking.id,
      details: `${parseResult.data.travellers.length} traveller details submitted for Booking #${booking.bookingNumber || booking.id.slice(0, 8)}`,
      afterData: { travellerCount: parseResult.data.travellers.length }
    });
  },

  async saveTravellersAdmin(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const id = String(req.params.id);
    const parseResult = saveTravellersSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid traveller details",
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const updated = await bookingsRepository.saveTravellers(
      id,
      parseResult.data.travellers,
      {
        type: "admin",
        userId: req.user.id,
        name: req.user.fullName || "Admin"
      }
    );

    res.status(200).json({
      success: true,
      message: "Traveller details updated successfully.",
      booking: updated
    });

    await recordAuditLog({
      req,
      action: "Updated Travellers",
      entityType: "booking",
      entityId: updated.id,
      details: `Updated ${parseResult.data.travellers.length} traveller details for Booking #${updated.bookingNumber || id.slice(0, 8)}`,
      afterData: { travellerCount: parseResult.data.travellers.length }
    });
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

    const updated = await bookingsRepository.updateStatus(
      id,
      parseResult.data.status,
      {
        id: req.user.id,
        fullName: req.user.fullName || null,
        role: req.user.role
      }
    );

    res.status(200).json({
      success: true,
      booking: updated
    });

    await recordAuditLog({
      req,
      action: "Updated Booking Status",
      entityType: "booking",
      entityId: updated.id,
      details: `Booking #${updated.bookingNumber || id.slice(0, 8)} status set to "${parseResult.data.status}"`,
      afterData: { status: parseResult.data.status }
    });
  },

  async recordPayment(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication required");
    }

    const id = String(req.params.id);
    const parseResult = recordPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid payment data",
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const data = parseResult.data;
    const updated = await bookingsRepository.recordPayment(
      id,
      {
        amount: data.amount,
        method: data.method,
        referenceNumber: data.referenceNumber || undefined,
        notes: data.notes || undefined
      },
      {
        id: req.user.id,
        fullName: req.user.fullName || null,
        role: req.user.role
      }
    );

    res.status(200).json({
      success: true,
      booking: updated
    });

    await recordAuditLog({
      req,
      action: "Recorded Payment",
      entityType: "booking",
      entityId: updated.id,
      details: `Payment of ₹${data.amount.toLocaleString("en-IN")} recorded for Booking #${updated.bookingNumber || id.slice(0, 8)} via ${data.method}`,
      afterData: { amount: data.amount, method: data.method, paymentStatus: updated.paymentStatus }
    });
  }
};
