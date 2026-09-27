import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import type { AdminPage } from "./AdminLayout";
import {
  bookingsApi,
  type BookingResponse,
  type BookingStatus,
  type BookingTraveller,
  type BookingPayment,
  type BookingEvent,
  type SaveTravellerPayload
} from "@/api/bookings";

interface Props {
  setAdminPage?: (p: AdminPage) => void;
}

const BOOKING_STATUSES: { value: BookingStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "awaiting_traveller_details", label: "Awaiting Traveller Details" },
  { value: "details_received", label: "Details Received" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" }
];

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border border-gray-300",
  awaiting_traveller_details: "bg-amber-50 text-amber-800 border border-amber-200",
  details_received: "bg-blue-50 text-blue-700 border border-blue-200",
  confirmed: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
  completed: "bg-purple-50 text-purple-700 border border-purple-200"
};

const PAYMENT_BADGE: Record<string, string> = {
  unpaid: "bg-red-50 text-red-700 border border-red-200",
  partial: "bg-yellow-50 text-yellow-800 border border-yellow-200",
  paid: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  refunded: "bg-gray-100 text-gray-700 border border-gray-300"
};

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return dateStr;
  }
}

function getEventIcon(type: string): string {
  switch (type) {
    case "booking_created":
      return "📋";
    case "booking_converted_from_enquiry":
      return "🔄";
    case "traveller_details_submitted":
      return "👤";
    case "traveller_details_updated":
      return "✏️";
    case "booking_status_changed":
      return "⚡";
    case "payment_recorded":
      return "💰";
    case "booking_confirmed":
      return "✅";
    case "booking_cancelled":
      return "❌";
    case "booking_completed":
      return "🎉";
    default:
      return "📌";
  }
}

export default function AdminBookingDetail({ setAdminPage }: Props = {}) {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useApp();

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Record Payment Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("upi");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [isRecordingPay, setIsRecordingPay] = useState(false);

  // Traveller Details Editing
  const [travellersForm, setTravellersForm] = useState<SaveTravellerPayload[]>([]);
  const [isSavingTravellers, setIsSavingTravellers] = useState(false);

  const fetchBooking = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await bookingsApi.getById(id);
      setBooking(data);

      // Populate travellers form
      const existing = data.travellers || [];
      const count = Math.max(data.travellerCount || 1, existing.length);
      const rows: SaveTravellerPayload[] = [];

      for (let i = 0; i < count; i++) {
        if (existing[i]) {
          rows.push({
            id: existing[i].id,
            fullName: existing[i].fullName,
            gender: existing[i].gender,
            age: existing[i].age,
            phone: existing[i].phone,
            email: existing[i].email,
            documentType: existing[i].documentType,
            idNumber: existing[i].idNumber,
            notes: existing[i].notes
          });
        } else {
          // If first traveller slot is empty, prefill primary customer
          rows.push({
            fullName: i === 0 ? data.primaryContactName : "",
            gender: "Male",
            age: null,
            phone: i === 0 ? data.primaryContactPhone : "",
            email: i === 0 ? data.primaryContactEmail || "" : "",
            documentType: "Aadhaar Card",
            idNumber: "",
            notes: ""
          });
        }
      }
      setTravellersForm(rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchBooking();
  }, [fetchBooking]);

  // Handle status update
  const handleStatusChange = async (newStatus: BookingStatus) => {
    if (!booking) return;
    try {
      const updated = await bookingsApi.updateStatus(booking.id, newStatus);
      setBooking((prev) => (prev ? { ...prev, status: updated.status } : null));
      showToast(`Booking status updated to ${newStatus}.`, "success");
      void fetchBooking();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update status", "error");
    }
  };

  // Handle traveller details saving by admin
  const handleSaveTravellers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setIsSavingTravellers(true);
    try {
      await bookingsApi.saveTravellersAdmin(booking.id, travellersForm);
      showToast("Traveller details saved successfully.", "success");
      void fetchBooking();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to save travellers", "error");
    } finally {
      setIsSavingTravellers(false);
    }
  };

  const updateTravellerField = (index: number, field: keyof SaveTravellerPayload, val: unknown) => {
    setTravellersForm((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  // Handle recording payment
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    const amountNum = parseInt(payAmount.replace(/\D/g, ""), 10);
    if (!amountNum || amountNum <= 0) {
      showToast("Please enter a valid payment amount.", "error");
      return;
    }

    setIsRecordingPay(true);
    try {
      await bookingsApi.recordPayment(booking.id, {
        amount: amountNum,
        method: payMethod,
        referenceNumber: payRef.trim() || undefined,
        notes: payNotes.trim() || undefined
      });
      showToast(`Payment of ₹${amountNum.toLocaleString("en-IN")} recorded.`, "success");
      setPayModalOpen(false);
      setPayAmount("");
      setPayRef("");
      setPayNotes("");
      void fetchBooking();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to record payment", "error");
    } finally {
      setIsRecordingPay(false);
    }
  };

  // Helper for customer link
  const getCustomerLink = () => {
    if (!booking?.detailsToken) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/booking-details/${booking.detailsToken}`;
  };

  const handleCopyLink = () => {
    const link = getCustomerLink();
    if (link && navigator.clipboard) {
      navigator.clipboard.writeText(link);
      showToast("Customer booking-details link copied to clipboard!", "success");
    }
  };

  const handleSendWhatsAppForm = () => {
    if (!booking) return;
    const link = getCustomerLink();
    const text = encodeURIComponent(
      `Hi ${booking.primaryContactName}! 🏔️\n\n` +
      `Your booking for *${booking.tripName || "Himalayan Expedition"}* (${booking.tripDateLabel || "Scheduled Date"}) is confirmed with Yatrivo!\n\n` +
      `Please fill in the traveller details for your ${booking.travellerCount} ${booking.travellerCount === 1 ? "traveller" : "travellers"} using your secure booking link below:\n\n` +
      `${link}\n\n` +
      `Thank you,\nTeam Yatrivo`
    );
    const url = `https://wa.me/${booking.primaryContactPhone.replace(/\D/g, "")}?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[#718096]">
        <div className="w-6 h-6 border-2 border-[#0f2922] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-8 text-center text-[#718096]">
        <p className="text-base text-red-600 mb-2 font-semibold">Booking not found or could not be loaded.</p>
        <p className="text-xs mb-4">{error}</p>
        <Link
          to="/admin/bookings"
          onClick={() => setAdminPage?.("bookings")}
          className="inline-block bg-[#0f2922] text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-[#1a4a39] transition cursor-pointer"
        >
          ← Back to Bookings
        </Link>
      </div>
    );
  }

  const events = booking.events || [];
  const payments = booking.payments || [];

  return (
    <div className="p-6 space-y-6">
      {/* Record Payment Modal */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setPayModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-[#e2e8f0]">
            <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">FINANCIAL TRANSACTION</div>
                <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>
                  Record Payment
                </h3>
              </div>
              <button
                onClick={() => setPayModalOpen(false)}
                className="text-white/60 hover:text-white transition p-1 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-[#f7f8f5] p-3 rounded-lg border border-[#e2e8f0] flex justify-between">
                <div>
                  <span className="text-[#718096] block text-[11px]">Total Package</span>
                  <span className="font-bold text-[#0f2922]">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[#718096] block text-[11px]">Already Paid</span>
                  <span className="font-semibold text-emerald-700">₹{booking.paidAmount.toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-[#718096] block text-[11px]">Remaining</span>
                  <span className="font-bold text-[#e8622a]">₹{booking.remainingAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                  Amount Received (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 15,000"
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                    Method
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                  >
                    <option value="upi">UPI / GPay / PhonePe</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card / POS</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                    Reference / UTR
                  </label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="UTR / Txn ID"
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                  Payment Notes
                </label>
                <textarea
                  rows={2}
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Advance payment, bank slip verified, etc..."
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922] resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="flex-1 border border-[#e2e8f0] text-[#4a5568] py-2 rounded-lg hover:bg-[#f7f8f5] transition cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingPay}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white py-2 rounded-lg transition cursor-pointer font-semibold shadow-xs"
                >
                  {isRecordingPay ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/admin/bookings"
          onClick={() => setAdminPage?.("bookings")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#718096] hover:text-[#0f2922] transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Bookings</span>
        </Link>

        {booking.enquiryId && (
          <Link
            to={`/admin/enquiries/${booking.enquiryId}`}
            className="text-xs text-[#e8622a] hover:underline font-semibold"
          >
            ← View Original Enquiry #{booking.enquiryNumber || booking.enquiryId}
          </Link>
        )}
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs font-bold text-[#0f2922] bg-[#f7f8f5] px-2.5 py-0.5 rounded-md border border-[#e2e8f0]">
              {booking.bookingNumber}
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[booking.status] ?? "bg-gray-100 text-gray-700"}`}>
              {booking.status.replace(/_/g, " ")}
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${PAYMENT_BADGE[booking.paymentStatus] ?? "bg-gray-100 text-gray-700"}`}>
              Payment: {booking.paymentStatus}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            {booking.tripName || "Himalayan Expedition"}
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Destination: <span className="font-semibold text-[#0f2922]">{booking.destinationLabel || "Uttarakhand"}</span> • Scheduled Departure: <span className="font-semibold text-[#0f2922]">{booking.tripDateLabel}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Send details form on WhatsApp */}
          <button
            type="button"
            onClick={handleSendWhatsAppForm}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            title="Send prefilled WhatsApp message with secure customer link"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>Send Details Form</span>
          </button>

          {/* Copy link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#f7f8f5] hover:bg-[#e2e8f0] text-[#0f2922] text-xs font-semibold transition cursor-pointer border border-[#e2e8f0]"
            title="Copy secure link for customer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>Copy Link</span>
          </button>

          {/* Record payment */}
          <button
            type="button"
            onClick={() => setPayModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <span>Record Payment</span>
          </button>

          {/* Confirm Booking if not confirmed */}
          {booking.status !== "confirmed" && booking.status !== "completed" && (
            <button
              type="button"
              onClick={() => void handleStatusChange("confirmed")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Confirm Booking</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer, Trip, Traveller Details, Payments, Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Trip Details Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5">
              <h3 className="font-bold text-[#0f2922] text-sm mb-3.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#e8622a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Primary Customer
              </h3>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[#718096] block text-[11px]">Name</span>
                  <span className="font-semibold text-[#0f2922] text-sm">{booking.primaryContactName}</span>
                </div>
                <div>
                  <span className="text-[#718096] block text-[11px]">Phone / WhatsApp</span>
                  <span className="font-mono font-medium text-[#0f2922]">{booking.primaryContactPhone}</span>
                </div>
                <div>
                  <span className="text-[#718096] block text-[11px]">Email</span>
                  <span className="text-[#0f2922]">{booking.primaryContactEmail || "Not provided"}</span>
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5">
              <h3 className="font-bold text-[#0f2922] text-sm mb-3.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#e8622a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Trip & Departure
              </h3>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[#718096] block text-[11px]">Package</span>
                  <span className="font-semibold text-[#0f2922]">{booking.tripName || "Custom Himalayan Trip"}</span>
                </div>
                <div>
                  <span className="text-[#718096] block text-[11px]">Destination</span>
                  <span className="font-semibold text-[#0f2922]">{booking.destinationLabel || "Uttarakhand"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[#718096] block text-[11px]">Departure Date</span>
                    <span className="font-semibold text-[#0f2922]">{booking.tripDateLabel}</span>
                  </div>
                  <div>
                    <span className="text-[#718096] block text-[11px]">Travellers</span>
                    <span className="font-bold text-[#0f2922]">{booking.travellerCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secure Link Notification Card */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🔗</span>
                <span className="font-bold text-emerald-900">Secure Customer Traveller Details Link</span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer"
              >
                Copy Link
              </button>
            </div>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              Customers can fill their group details directly without logging in. Once submitted, this booking will automatically advance to <span className="font-bold">Details Received</span>.
            </p>
            <div className="bg-white/80 p-2 rounded border border-emerald-300 font-mono text-[11px] text-emerald-900 truncate">
              {getCustomerLink()}
            </div>
          </div>

          {/* Dedicated Traveller Details Section */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#e2e8f0] pb-3">
              <div>
                <h3 className="font-bold text-[#0f2922] text-sm">
                  Traveller Details ({travellersForm.length})
                </h3>
                <p className="text-[#718096] text-xs">
                  Enter details for each traveller. Can be updated by admin or submitted by customer.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTravellersForm((prev) => [
                    ...prev,
                    {
                      fullName: "",
                      gender: "Male",
                      age: null,
                      phone: "",
                      email: "",
                      documentType: "Aadhaar Card",
                      idNumber: "",
                      notes: ""
                    }
                  ]);
                }}
                className="text-xs font-semibold text-[#0f2922] hover:text-[#e8622a] border border-[#e2e8f0] px-3 py-1.5 rounded-lg hover:bg-[#f7f8f5] transition cursor-pointer"
              >
                + Add Another Traveller Slot
              </button>
            </div>

            <form onSubmit={handleSaveTravellers} className="space-y-4">
              {travellersForm.map((t, index) => (
                <div
                  key={index}
                  className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#0f2922]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#0f2922] text-white flex items-center justify-center text-[10px]">
                        {index + 1}
                      </span>
                      <span>Traveller {index + 1} {index === 0 && "(Primary Contact)"}</span>
                    </div>
                    {travellersForm.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setTravellersForm((prev) => prev.filter((_, i) => i !== index));
                        }}
                        className="text-[#a0aec0] hover:text-red-600 transition text-[11px] font-normal"
                      >
                        Remove Slot
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[#4a5568] font-semibold mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={t.fullName}
                        onChange={(e) => updateTravellerField(index, "fullName", e.target.value)}
                        placeholder="Full Name"
                        className="w-full bg-white border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#4a5568] font-semibold mb-1">Gender</label>
                      <select
                        value={t.gender || "Male"}
                        onChange={(e) => updateTravellerField(index, "gender", e.target.value)}
                        className="w-full bg-white border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#4a5568] font-semibold mb-1">Age</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={t.age ?? ""}
                        onChange={(e) => updateTravellerField(index, "age", e.target.value ? parseInt(e.target.value, 10) : null)}
                        placeholder="Age"
                        className="w-full bg-white border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[#4a5568] font-semibold mb-1">Phone / WhatsApp</label>
                      <input
                        value={t.phone ?? ""}
                        onChange={(e) => updateTravellerField(index, "phone", e.target.value)}
                        placeholder="+91..."
                        className="w-full bg-white border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#4a5568] font-semibold mb-1">ID Document Type</label>
                      <select
                        value={t.documentType || "Aadhaar Card"}
                        onChange={(e) => updateTravellerField(index, "documentType", e.target.value)}
                        className="w-full bg-white border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                      >
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Other">Other ID</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[#4a5568] font-semibold mb-1">ID Document Number</label>
                      <input
                        value={t.idNumber ?? ""}
                        onChange={(e) => updateTravellerField(index, "idNumber", e.target.value)}
                        placeholder="e.g. 12-digit Aadhaar / Passport #"
                        className="w-full bg-white border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#4a5568] font-semibold mb-1">Diet / Health / Notes</label>
                      <input
                        value={t.notes ?? ""}
                        onChange={(e) => updateTravellerField(index, "notes", e.target.value)}
                        placeholder="Dietary preference, medical notes, etc."
                        className="w-full bg-white border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingTravellers}
                  className="bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition cursor-pointer shadow-xs"
                >
                  {isSavingTravellers ? "Saving Travellers..." : "Save All Travellers"}
                </button>
              </div>
            </form>
          </div>

          {/* Payment & Transactions Section */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-[#0f2922] text-sm">Payment History</h3>
                <p className="text-[#718096] text-xs">
                  Financial records and transaction installments for this booking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayModalOpen(true)}
                className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
              >
                + Record Payment
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-3 gap-3 bg-[#f7f8f5] p-3.5 rounded-xl border border-[#e2e8f0] text-center">
              <div>
                <span className="text-[11px] text-[#718096] block uppercase tracking-wider font-semibold">Total Price</span>
                <span className="text-base font-bold text-[#0f2922]">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#718096] block uppercase tracking-wider font-semibold">Total Paid</span>
                <span className="text-base font-bold text-emerald-700">₹{booking.paidAmount.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#718096] block uppercase tracking-wider font-semibold">Balance Due</span>
                <span className="text-base font-bold text-[#e8622a]">₹{booking.remainingAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Payment Transactions Table */}
            {payments.length === 0 ? (
              <div className="bg-[#f7f8f5] rounded-lg p-5 text-center text-xs text-[#a0aec0] border border-dashed border-[#cbd5e1]">
                No payment installments recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] text-[#718096] font-semibold text-left">
                      <th className="py-2">Date</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Method</th>
                      <th className="py-2">Ref / UTR</th>
                      <th className="py-2">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f4f1]">
                    {payments.map((p: BookingPayment) => (
                      <tr key={p.id}>
                        <td className="py-2 font-mono text-[#718096]">{p.paidAt ? formatDateTime(p.paidAt) : formatDateTime(p.createdAt)}</td>
                        <td className="py-2 font-bold text-emerald-800">₹{p.amountInRupees.toLocaleString("en-IN")}</td>
                        <td className="py-2 capitalize font-medium">{p.method.replace("_", " ")}</td>
                        <td className="py-2 font-mono text-[11px] text-[#718096]">{p.referenceNumber || "—"}</td>
                        <td className="py-2 text-[#718096]">{p.createdByName || "Admin"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5 space-y-4">
            <div>
              <h3 className="font-bold text-[#0f2922] text-sm">Booking Activity Timeline</h3>
              <p className="text-[#718096] text-xs">
                Real chronological audit trail of all actions, traveller submissions, payments, and status changes.
              </p>
            </div>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-[#e2e8f0]">
              {events.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#a0aec0]">No timeline events recorded yet.</div>
              ) : (
                events.map((ev: BookingEvent) => (
                  <div key={ev.id} className="relative flex items-start gap-3.5 pl-1">
                    <div className="w-7 h-7 rounded-full bg-white border border-[#e2e8f0] shadow-2xs flex items-center justify-center text-sm shrink-0 z-10">
                      {getEventIcon(ev.eventType)}
                    </div>
                    <div className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-xl p-3 flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-bold text-[#0f2922]">{ev.title}</span>
                        <span className="text-[11px] text-[#a0aec0] font-mono">{formatDateTime(ev.createdAt)}</span>
                      </div>

                      {ev.details && typeof ev.details === "object" && (
                        <div className="text-[#4a5568] space-y-0.5 text-[11px]">
                          {Boolean(ev.details.createdByName) && (
                            <div>Created by: <span className="font-semibold">{String(ev.details.createdByName)}</span></div>
                          )}
                          {Boolean(ev.details.changedByName) && (
                            <div>Updated by: <span className="font-semibold">{String(ev.details.changedByName)}</span></div>
                          )}
                          {Boolean(ev.details.recordedByName) && (
                            <div>Payment recorded by: <span className="font-semibold">{String(ev.details.recordedByName)}</span></div>
                          )}
                          {Boolean(ev.details.enquiryNumber) && (
                            <div>Original Enquiry: <span className="font-semibold font-mono">#{String(ev.details.enquiryNumber)}</span></div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Lifecycle Controls & Management */}
        <div className="space-y-5">
          {/* Status Lifecycle Controls Box */}
          <div className="bg-[#0f2922] rounded-xl p-5 text-white shadow-2xs space-y-4">
            <div>
              <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">MANAGEMENT</div>
              <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>
                Booking Controls
              </h3>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-[#a3bfb5] text-xs font-semibold uppercase tracking-wider mb-1.5">
                Booking Status
              </label>
              <select
                value={booking.status}
                onChange={(e) => void handleStatusChange(e.target.value as BookingStatus)}
                className="w-full bg-[#1a3d31] text-white border border-[#2d5a48] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#e8622a] cursor-pointer"
              >
                {BOOKING_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-[#1a3d31] pt-3.5 space-y-2">
              <button
                type="button"
                onClick={handleSendWhatsAppForm}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold py-2.5 px-3 rounded-lg transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>Send Details via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setPayModalOpen(true)}
                className="w-full bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold py-2.5 px-3 rounded-lg transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Record Payment</span>
              </button>

              <a
                href={`tel:${booking.primaryContactPhone.replace(/\s+/g, "")}`}
                className="w-full bg-[#1a3d31] hover:bg-[#255243] text-white text-xs font-semibold py-2.5 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Call Primary Customer</span>
              </a>
            </div>
          </div>

          {/* Internal Notes card */}
          {booking.internalNotes && (
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5 space-y-2 text-xs">
              <h4 className="font-bold text-[#0f2922] uppercase tracking-wider text-[11px]">
                Booking Internal Notes
              </h4>
              <p className="text-[#4a5568] bg-[#f7f8f5] p-3 rounded-lg border border-[#e2e8f0] leading-relaxed whitespace-pre-wrap">
                {booking.internalNotes}
              </p>
            </div>
          )}

          {/* System Metadata Card */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5 space-y-3 text-xs">
            <h4 className="font-bold text-[#0f2922] uppercase tracking-wider text-[11px]">
              System Metadata
            </h4>
            <div className="space-y-2 border-y border-[#e2e8f0] py-2.5 text-[#718096]">
              <div className="flex justify-between">
                <span>Booking Number:</span>
                <span className="font-mono font-semibold text-[#0f2922]">{booking.bookingNumber}</span>
              </div>
              {booking.enquiryNumber && (
                <div className="flex justify-between">
                  <span>From Enquiry:</span>
                  <span className="font-mono font-semibold text-[#e8622a]">#{booking.enquiryNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Booked Date:</span>
                <span className="text-[#0f2922]">{booking.bookingDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Created By:</span>
                <span className="text-[#0f2922] font-semibold">{booking.createdByName || "Admin"}</span>
              </div>
            </div>
            <p className="text-[11px] text-[#a0aec0] leading-relaxed">
              Every status change and payment installment is auditable and tracked in PostgreSQL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
