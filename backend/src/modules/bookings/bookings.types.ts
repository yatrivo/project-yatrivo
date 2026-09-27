export type BookingStatus =
  | "draft"
  | "awaiting_traveller_details"
  | "details_received"
  | "confirmed"
  | "cancelled"
  | "completed";

export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";

export interface BookingTravellerDto {
  id: string;
  bookingId: string;
  fullName: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  documentType: string | null;
  idNumber: string | null;
  notes: string | null;
  sortOrder: number;
  source: string;
}

export interface BookingPaymentDto {
  id: string;
  bookingId: string;
  amountPaise: number;
  amountInRupees: number;
  currency: string;
  method: string;
  status: string;
  paidAt: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface BookingEventDto {
  id: string;
  bookingId: string;
  eventType: string;
  oldStatus: string | null;
  newStatus: string | null;
  title: string;
  details: Record<string, unknown> | null;
  actorType: string; // 'admin' | 'customer' | 'system'
  createdByName: string | null;
  createdAt: string;
}

export interface BookingDto {
  id: string;
  bookingNumber: string;
  enquiryId: string | null;
  enquiryNumber: string | null;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail: string | null;
  destinationId: string | null;
  destinationLabel: string | null;
  tripId: string | null;
  tripName: string | null;
  tripInstanceId: string | null;
  tripDateLabel: string | null;
  travellerCount: number;
  finalAmountPaise: number | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  bookingDate: string;
  completedAt: string | null;
  cancelledAt: string | null;
  detailsToken: string | null;
  detailsFormUrl: string | null;
  paymentNotes: string | null;
  internalNotes: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  travellers?: BookingTravellerDto[];
  payments?: BookingPaymentDto[];
  events?: BookingEventDto[];
}

export interface CreateBookingInput {
  enquiryId?: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail?: string;
  destinationId?: string;
  destinationLabel?: string;
  tripId?: string;
  tripName?: string;
  tripInstanceId?: string;
  tripDateLabel?: string;
  travellerCount: number;
  totalAmount?: number; // in Rupees
  paymentStatus?: PaymentStatus;
  paymentNotes?: string;
  internalNotes?: string;
  status?: BookingStatus;
  initialPayment?: {
    amount: number;
    method?: string;
    referenceNumber?: string;
    notes?: string;
  };
}

export interface SaveTravellerItem {
  id?: string;
  fullName: string;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  documentType?: string | null;
  idNumber?: string | null;
  notes?: string | null;
}

export interface BookingFilters {
  status?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}
