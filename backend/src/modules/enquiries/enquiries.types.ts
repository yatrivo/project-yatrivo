export interface EnquiryNoteDto {
  id: string;
  enquiryId: string;
  body: string;
  createdByUserId: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface EnquiryEventDto {
  id: string;
  enquiryId: string;
  eventType: string;
  oldStatus: string | null;
  newStatus: string | null;
  title: string;
  details: Record<string, unknown> | null;
  createdByUserId: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface EnquiryAdminDto {
  id: string;
  fullName: string;
  email: string;
  role: "super_admin" | "admin";
}

export interface CreateEnquiryInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tripId?: string;
  tripName?: string;
  tripInstanceId?: string;
  destinationId?: string;
  destinationLabel?: string;
  requestedTravelDate?: string;
  requestedTravellerCount: number;
  budgetLabel?: string;
  message?: string;
  source?: "website" | "whatsapp" | "phone" | "walk_in" | "instagram" | "google" | "admin" | "other";
  createdByUserId?: string;
}

export interface EnquiryDto {
  id: string;
  enquiryNumber: string;
  source: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  destinationId?: string | null;
  destinationLabel?: string | null;
  tripId?: string | null;
  tripName?: string | null;
  tripInstanceId?: string | null;
  requestedTravelDate?: string | null;
  requestedTravellerCount: number;
  budgetLabel?: string | null;
  message?: string | null;
  submittedAt: string;
  assignedToUserId?: string | null;
  assignedToName?: string | null;
  assignedToEmail?: string | null;
  bookingId?: string | null;
  bookingNumber?: string | null;
  adminWhatsAppUrl?: string;
  notes?: EnquiryNoteDto[];
  events?: EnquiryEventDto[];
}

export interface EnquiryFilters {
  status?: string;
  assignedTo?: string; // 'me', 'unassigned', 'all', or a specific user uuid
  search?: string;
  page?: number;
  limit?: number;
  currentUserId?: string;
}
