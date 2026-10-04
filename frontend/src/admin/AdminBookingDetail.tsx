import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
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
  draft: "bg-gray-100 text-gray-600",
  awaiting_traveller_details: "bg-yellow-50 text-yellow-700",
  details_received: "bg-blue-50 text-blue-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
  completed: "bg-purple-50 text-purple-700"
};

const PAYMENT_BADGE: Record<string, string> = {
  unpaid: "bg-red-50 text-red-600",
  partial: "bg-yellow-50 text-yellow-700",
  paid: "bg-emerald-50 text-emerald-700",
  refunded: "bg-gray-100 text-gray-600"
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
  const { showToast, tripInstances, trips } = useApp();

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
  const [isEditingTravellers, setIsEditingTravellers] = useState(false);
  const [travellersForm, setTravellersForm] = useState<SaveTravellerPayload[]>([]);
  const [editTravellerCount, setEditTravellerCount] = useState<number>(1);
  const [editTotalAmount, setEditTotalAmount] = useState<string>("");
  const [isSavingTravellers, setIsSavingTravellers] = useState(false);

  // Quick Edit Booking Modal (Headcount, Departure Date & Price)
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [quickEditCount, setQuickEditCount] = useState<number>(1);
  const [quickEditAmount, setQuickEditAmount] = useState<string>("");
  const [quickEditNotes, setQuickEditNotes] = useState<string>("");
  const [quickEditDepartureId, setQuickEditDepartureId] = useState<string>("");
  const [quickEditCustomDate, setQuickEditCustomDate] = useState<string>("");
  const [isSavingQuickEdit, setIsSavingQuickEdit] = useState(false);

  useEffect(() => {
    if (!payModalOpen && !isQuickEditOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [payModalOpen, isQuickEditOpen]);

  const fetchBooking = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await bookingsApi.getById(id);
      setBooking(data);
      setEditTravellerCount(data.travellerCount || 1);
      setEditTotalAmount(String(data.totalAmount || ""));

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

  // Match existing departure or upcoming departures for this trip
  const matchedDeparture = useMemo(() => {
    if (!booking) return null;
    if (booking.tripInstanceId) {
      return tripInstances.find((ti) => ti.id === booking.tripInstanceId) || null;
    }
    return null;
  }, [booking, tripInstances]);

  const displayDepartureDate = useMemo(() => {
    if (booking?.tripDateLabel?.trim()) return booking.tripDateLabel;
    if (matchedDeparture?.displayDate) return matchedDeparture.displayDate;
    if (matchedDeparture?.date) return matchedDeparture.date;
    return "Not scheduled";
  }, [booking?.tripDateLabel, matchedDeparture]);

  // Available departures for this trip package
  const tripDepartures = useMemo(() => {
    if (!booking) return [];
    return tripInstances
      .filter((ti) => {
        const matchesTrip =
          (booking.tripId && ti.tripId === booking.tripId) ||
          (booking.tripName && ti.tripTitle?.toLowerCase() === booking.tripName?.toLowerCase());
        return matchesTrip;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [booking, tripInstances]);

  // Quick edit booking details (Headcount, Departure Date & Price during negotiation)
  const handleOpenQuickEdit = () => {
    if (!booking) return;
    setQuickEditCount(booking.travellerCount || 1);
    setQuickEditAmount(String(booking.totalAmount || ""));
    setQuickEditNotes(booking.internalNotes || "");
    setQuickEditDepartureId(booking.tripInstanceId || "");
    setQuickEditCustomDate(booking.tripDateLabel || "");
    setIsQuickEditOpen(true);
  };

  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setIsSavingQuickEdit(true);
    try {
      const amountNum = quickEditAmount ? parseInt(quickEditAmount.replace(/\D/g, ""), 10) : undefined;
      const selectedDep = tripDepartures.find((d) => d.id === quickEditDepartureId);
      const chosenDateLabel =
        selectedDep?.displayDate ||
        selectedDep?.date ||
        (quickEditCustomDate.trim() ? quickEditCustomDate.trim() : undefined);

      await bookingsApi.updateBooking(booking.id, {
        travellerCount: quickEditCount,
        totalAmount: amountNum,
        tripInstanceId: quickEditDepartureId || undefined,
        tripDateLabel: chosenDateLabel,
        internalNotes: quickEditNotes.trim() || undefined
      });
      showToast(`Booking updated: ${quickEditCount} travellers reserved.`, "success");
      setIsQuickEditOpen(false);
      void fetchBooking();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update booking", "error");
    } finally {
      setIsSavingQuickEdit(false);
    }
  };

  // Stepper / change for traveller count in detailed edit mode
  const handleTravellerCountChange = (newCount: number) => {
    const validCount = Math.max(1, Math.min(50, newCount));
    setEditTravellerCount(validCount);

    setTravellersForm((prev) => {
      if (validCount > prev.length) {
        const added: SaveTravellerPayload[] = [];
        for (let i = prev.length; i < validCount; i++) {
          added.push({
            fullName: "",
            gender: "Male",
            age: null,
            phone: "",
            email: "",
            documentType: "Aadhaar Card",
            idNumber: "",
            notes: ""
          });
        }
        return [...prev, ...added];
      } else if (validCount < prev.length) {
        return prev.slice(0, validCount);
      }
      return prev;
    });
  };

  const handleAddSlot = () => {
    setTravellersForm((prev) => {
      const next = [
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
      ];
      setEditTravellerCount(next.length);
      return next;
    });
  };

  const handleRemoveSlot = (index: number) => {
    setTravellersForm((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      setEditTravellerCount(next.length);
      return next;
    });
  };

  // Cancel edit travellers and revert form to saved booking state
  const handleCancelEditTravellers = () => {
    if (!booking) return;
    const existing = booking.travellers || [];
    const count = Math.max(booking.travellerCount || 1, existing.length);
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
        rows.push({
          fullName: i === 0 ? booking.primaryContactName : "",
          gender: "Male",
          age: null,
          phone: i === 0 ? booking.primaryContactPhone : "",
          email: i === 0 ? booking.primaryContactEmail || "" : "",
          documentType: "Aadhaar Card",
          idNumber: "",
          notes: ""
        });
      }
    }
    setTravellersForm(rows);
    setEditTravellerCount(booking.travellerCount || 1);
    setEditTotalAmount(String(booking.totalAmount || ""));
    setIsEditingTravellers(false);
  };

  // Handle traveller details saving by admin
  const handleSaveTravellers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    setIsSavingTravellers(true);
    try {
      const totalAmountNum = editTotalAmount ? parseInt(editTotalAmount.replace(/\D/g, ""), 10) : undefined;
      await bookingsApi.saveTravellersAdmin(booking.id, travellersForm, {
        travellerCount: editTravellerCount,
        totalAmount: totalAmountNum
      });
      showToast("Traveller headcount and details saved successfully.", "success");
      setIsEditingTravellers(false);
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
      {payModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-contain">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setPayModalOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]">
              <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">FINANCIAL TRANSACTION</div>
                  <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>
                    Record Payment
                  </h3>
                </div>
                <button
                  onClick={() => setPayModalOpen(false)}
                  className="text-white/70 hover:text-white transition p-1 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="overflow-y-auto flex-1 min-h-0 p-6 space-y-4 text-xs">
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
                </div>

                <div className="bg-[#f7f8f5] px-6 py-3.5 border-t border-[#e2e8f0] flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPayModalOpen(false)}
                    className="px-4 py-2 border border-[#e2e8f0] text-[#4a5568] hover:text-[#0f2922] hover:bg-white rounded-lg transition cursor-pointer font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRecordingPay}
                    className="px-5 py-2 bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white rounded-lg transition cursor-pointer font-semibold text-xs shadow-xs"
                  >
                    {isRecordingPay ? "Recording..." : "Record Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Quick Edit Booking (Headcount & Pricing) Modal */}
      {isQuickEditOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-contain">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsQuickEditOpen(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]">
              <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">NEGOTIATION & PAX AMENDMENT</div>
                  <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>
                    Edit Headcount & Price
                  </h3>
                </div>
                <button
                  onClick={() => setIsQuickEditOpen(false)}
                  className="text-white/70 hover:text-white transition p-1 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSaveQuickEdit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="overflow-y-auto flex-1 min-h-0 p-6 space-y-4 text-xs">
                  <div className="bg-[#f0f7f4] border border-[#c6e2d6] rounded-xl p-3.5 space-y-1 text-[#0f2922]">
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{booking.tripName || "Trip Package"}</span>
                    </div>
                    <p className="text-[11px] text-[#4a5568]">
                      Destination: <strong className="text-[#0f2922]">{booking.destinationLabel || "Uttarakhand"}</strong>
                    </p>
                  </div>

                  {/* Scheduled Departure Date Selection */}
                  <div>
                    <label className="block text-[#4a5568] font-semibold mb-1">
                      Scheduled Departure Date
                    </label>
                    <select
                      value={quickEditDepartureId}
                      onChange={(e) => {
                        const depId = e.target.value;
                        setQuickEditDepartureId(depId);
                        const dep = tripDepartures.find((d) => d.id === depId);
                        if (dep) {
                          setQuickEditCustomDate(dep.displayDate || dep.date);
                        }
                      }}
                      className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#0f2922] text-[#0f2922] mb-1.5"
                    >
                      <option value="">
                        {tripDepartures.length === 0
                          ? "No upcoming scheduled batches"
                          : "Choose from scheduled departures..."}
                      </option>
                      {tripDepartures.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.displayDate || d.date} ({d.batchType || "Batch"} • ₹{d.effectivePrice?.toLocaleString("en-IN") || d.basePrice?.toLocaleString("en-IN")})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={quickEditCustomDate}
                      onChange={(e) => setQuickEditCustomDate(e.target.value)}
                      placeholder="e.g. 15 Jul - 20 Jul 2026 or Custom Date"
                      className="w-full border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                    />
                    <span className="text-[10px] text-[#a0aec0] block mt-0.5">
                      Select an existing batch or type a customized departure date label.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[#4a5568] font-semibold mb-1">
                      Number of Travellers (Seats) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-[#e2e8f0] rounded-lg overflow-hidden bg-white shadow-2xs">
                        <button
                          type="button"
                          disabled={quickEditCount <= 1}
                          onClick={() => setQuickEditCount((prev) => Math.max(1, prev - 1))}
                          className="px-3 py-2 text-sm font-bold text-[#0f2922] hover:bg-[#f7f8f5] disabled:opacity-30 transition cursor-pointer"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={quickEditCount}
                          onChange={(e) => setQuickEditCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
                          className="w-14 text-center text-xs font-bold text-[#0f2922] focus:outline-none border-x border-[#e2e8f0] py-2"
                        />
                        <button
                          type="button"
                          max={50}
                          onClick={() => setQuickEditCount((prev) => Math.min(50, prev + 1))}
                          className="px-3 py-2 text-sm font-bold text-[#0f2922] hover:bg-[#f7f8f5] transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[11px] text-[#718096]">
                        {quickEditCount} {quickEditCount === 1 ? "seat" : "seats"} reserved on departure.
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#4a5568] font-semibold mb-1">
                      Total Negotiated Package Price (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#718096]">₹</span>
                      <input
                        type="text"
                        value={quickEditAmount}
                        onChange={(e) => setQuickEditAmount(e.target.value)}
                        placeholder="e.g. 24,000"
                        className="w-full pl-7 pr-3 py-2 text-xs font-semibold border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                      />
                    </div>
                    <span className="text-[10px] text-[#a0aec0] block mt-1">
                      Total paid so far: ₹{booking.paidAmount.toLocaleString("en-IN")} • Balance due updates automatically.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[#4a5568] font-semibold mb-1">Internal Notes (Optional)</label>
                    <textarea
                      rows={2}
                      value={quickEditNotes}
                      onChange={(e) => setQuickEditNotes(e.target.value)}
                      placeholder="e.g. Negotiated group discount on phone call."
                      className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922] resize-none"
                    />
                  </div>
                </div>

                <div className="bg-[#f7f8f5] px-6 py-3.5 border-t border-[#e2e8f0] flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsQuickEditOpen(false)}
                    className="px-4 py-2 border border-[#e2e8f0] text-[#4a5568] hover:text-[#0f2922] hover:bg-white rounded-lg transition cursor-pointer font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingQuickEdit}
                    className="px-5 py-2 bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white rounded-lg transition cursor-pointer font-semibold text-xs shadow-xs"
                  >
                    {isSavingQuickEdit ? "Saving..." : "Update Booking"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
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
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-2xs">
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
          Destination: <span className="font-semibold text-[#0f2922]">{booking.destinationLabel || "Uttarakhand"}</span> • Scheduled Departure:{" "}
          <span className="font-semibold text-[#0f2922]">
            {displayDepartureDate}
          </span>
          <button
            type="button"
            onClick={handleOpenQuickEdit}
            className="ml-2 text-[11px] font-semibold text-[#e8622a] hover:underline cursor-pointer"
            title="Edit departure date or batch"
          >
            (Change)
          </button>
        </p>
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
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#0f2922]">{displayDepartureDate}</span>
                      <button
                        type="button"
                        onClick={handleOpenQuickEdit}
                        className="text-[11px] font-semibold text-[#e8622a] hover:underline cursor-pointer"
                        title="Edit departure date or batch"
                      >
                        (Edit)
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[#718096] block text-[11px]">Travellers</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#0f2922] text-sm">{booking.travellerCount}</span>
                      <button
                        type="button"
                        onClick={handleOpenQuickEdit}
                        className="text-[11px] font-semibold text-[#e8622a] hover:underline cursor-pointer"
                        title="Edit number of travellers & pricing"
                      >
                        (Edit)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Traveller Details Section */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#e2e8f0] pb-3">
              <div>
                <h3 className="font-bold text-[#0f2922] text-sm">
                  Traveller Details ({isEditingTravellers ? editTravellerCount : (booking.travellers?.filter(t => t.fullName?.trim()).length || booking.travellerCount)})
                </h3>
                <p className="text-[#718096] text-xs">
                  {isEditingTravellers
                    ? "Editing traveller manifest and headcount. Click Save when finished."
                    : "Verified traveller manifests and passenger information."}
                </p>
              </div>

              {!isEditingTravellers ? (
                <button
                  type="button"
                  onClick={() => setIsEditingTravellers(true)}
                  className="text-xs font-semibold text-[#0f2922] hover:text-[#e8622a] border border-[#e2e8f0] px-3.5 py-1.5 rounded-lg hover:bg-[#f7f8f5] transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-[#718096]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Travellers</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditTravellers}
                    className="text-xs font-medium text-[#718096] hover:text-[#0f2922] border border-[#e2e8f0] px-3 py-1.5 rounded-lg hover:bg-[#f7f8f5] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="text-xs font-semibold text-[#0f2922] hover:text-[#e8622a] border border-[#e2e8f0] px-3 py-1.5 rounded-lg hover:bg-[#f7f8f5] transition cursor-pointer"
                  >
                    + Add Slot
                  </button>
                </div>
              )}
            </div>

            {!isEditingTravellers ? (
              // View Mode (Default)
              (() => {
                const filled = (booking.travellers || []).filter((t) => t.fullName && t.fullName.trim().length > 0);
                if (filled.length === 0) {
                  return (
                    <div className="bg-[#f7f8f5] rounded-xl p-8 text-center border border-dashed border-[#cbd5e1] space-y-3">
                      <div className="w-10 h-10 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center mx-auto text-[#718096]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#0f2922]">No traveller details submitted yet</p>
                        <p className="text-[11px] text-[#718096] mt-0.5 max-w-sm mx-auto">
                          {booking.travellerCount} traveller {booking.travellerCount === 1 ? "seat is" : "seats are"} reserved. Share the customer link or click below to enter details manually.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingTravellers(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0f2922] hover:bg-[#1a3d31] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                      >
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Enter Details</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filled.map((t, idx) => (
                      <div
                        key={t.id || idx}
                        className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-xl p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-[#0f2922]">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-white border border-[#e2e8f0] text-[#0f2922] flex items-center justify-center text-[10px] font-semibold">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-[#0f2922]">{t.fullName}</span>
                            {idx === 0 && (
                              <span className="text-[10px] font-medium text-[#718096] bg-white px-2 py-0.5 rounded-full border border-[#e2e8f0]">
                                Primary Contact
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#718096] font-normal">
                            {t.gender || "Gender unspecified"}{t.age ? ` • ${t.age} yrs` : ""}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-2 border-t border-[#e2e8f0]">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-[#718096] block font-medium">Phone / WhatsApp</span>
                            <span className="text-[#0f2922] font-mono">{t.phone || "—"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-[#718096] block font-medium">ID Document</span>
                            <span className="text-[#0f2922]">
                              {t.documentType ? `${t.documentType}: ` : ""}
                              <span className="font-mono">{t.idNumber || "—"}</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-[#718096] block font-medium">Diet / Health / Notes</span>
                            <span className="text-[#0f2922]">{t.notes || "None"}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {booking.travellerCount > filled.length && (
                      <div className="bg-[#f7f8f5]/60 border border-dashed border-[#e2e8f0] rounded-xl p-3.5 flex items-center justify-between text-xs text-[#718096]">
                        <span>
                          {booking.travellerCount - filled.length} more {booking.travellerCount - filled.length === 1 ? "seat" : "seats"} awaiting details.
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingTravellers(true)}
                          className="text-xs font-semibold text-[#0f2922] hover:text-[#e8622a] underline cursor-pointer"
                        >
                          Fill remaining slots →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              // Edit Mode Form
              <form onSubmit={handleSaveTravellers} className="space-y-4">
                {/* Headcount & Negotiation Pricing Bar */}
                <div className="bg-[#f0f7f4] border border-[#c6e2d6] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0f2922] uppercase tracking-wider">Number of Travellers</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                        {editTravellerCount} {editTravellerCount === 1 ? "Pax" : "Pax"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#4a5568]">
                      Adjust headcount during customer negotiation. Detail slots expand or trim automatically.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Stepper controls */}
                    <div className="flex items-center border border-[#c6e2d6] rounded-lg overflow-hidden bg-white shadow-2xs">
                      <button
                        type="button"
                        disabled={editTravellerCount <= 1}
                        onClick={() => handleTravellerCountChange(editTravellerCount - 1)}
                        className="px-3 py-1.5 text-sm font-bold text-[#0f2922] hover:bg-[#e6f2ec] disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Decrease travellers"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={editTravellerCount}
                        onChange={(e) => handleTravellerCountChange(parseInt(e.target.value, 10) || 1)}
                        className="w-12 text-center text-xs font-bold text-[#0f2922] focus:outline-none border-x border-[#c6e2d6] py-1.5"
                      />
                      <button
                        type="button"
                        onClick={() => handleTravellerCountChange(editTravellerCount + 1)}
                        className="px-3 py-1.5 text-sm font-bold text-[#0f2922] hover:bg-[#e6f2ec] transition cursor-pointer"
                        title="Increase travellers"
                      >
                        +
                      </button>
                    </div>

                    {/* Total Negotiated Amount */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#0f2922]">Total Price:</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#718096]">₹</span>
                        <input
                          type="text"
                          value={editTotalAmount}
                          onChange={(e) => setEditTotalAmount(e.target.value)}
                          placeholder="e.g. 19,998"
                          className="w-28 pl-6 pr-2.5 py-1.5 text-xs font-bold bg-white border border-[#c6e2d6] rounded-lg text-[#0f2922] focus:outline-none focus:border-[#0f2922]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {travellersForm.map((t, index) => (
                  <div
                    key={index}
                    className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-[#0f2922]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white border border-[#e2e8f0] text-[#0f2922] flex items-center justify-center text-[10px] font-semibold">
                          {index + 1}
                        </span>
                        <span>Traveller {index + 1} {index === 0 && "(Primary Contact)"}</span>
                      </div>
                      {travellersForm.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(index)}
                          className="text-[#a0aec0] hover:text-red-600 transition text-[11px] font-normal cursor-pointer"
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

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEditTravellers}
                    className="border border-[#e2e8f0] text-[#4a5568] hover:bg-[#f7f8f5] text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTravellers}
                    className="bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition cursor-pointer shadow-xs"
                  >
                    {isSavingTravellers ? "Saving..." : "Save Travellers & Headcount"}
                  </button>
                </div>
              </form>
            )}
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
                <span className="text-base font-bold text-[#0f2922]">₹{booking.paidAmount.toLocaleString("en-IN")}</span>
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
                        <td className="py-2 font-semibold text-[#0f2922]">₹{p.amountInRupees.toLocaleString("en-IN")}</td>
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
          {/* Status Lifecycle Controls Box (Green & Orange Theme) */}
          <div className="bg-[#0f2922] text-white rounded-xl p-5 shadow-md space-y-4 border border-[#1a3d31]">
            <div>
              <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">
                MANAGEMENT & ACTIONS
              </div>
              <h3 className="text-white font-bold text-base mt-0.5" style={{ fontFamily: "var(--font-serif, serif)" }}>
                Booking Controls
              </h3>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-white/70 text-xs font-medium mb-1.5">
                Booking Status
              </label>
              <select
                value={booking.status}
                onChange={(e) => void handleStatusChange(e.target.value as BookingStatus)}
                className="w-full bg-[#1a3d31] text-white border border-[#2d5a47] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#e8622a] cursor-pointer"
              >
                {BOOKING_STATUSES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#0f2922] text-white">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions in Side Panel */}
            <div className="border-t border-[#1a3d31] pt-3.5 space-y-2">
              {/* Record Payment Button (Primary warm orange) */}
              <button
                type="button"
                onClick={() => setPayModalOpen(true)}
                className="w-full bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold py-2.5 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Record Payment</span>
              </button>

              {/* Confirm Booking button if not confirmed */}
              {booking.status !== "confirmed" && booking.status !== "completed" && (
                <button
                  type="button"
                  onClick={() => void handleStatusChange("confirmed")}
                  className="w-full bg-[#1a3d31] hover:bg-[#235342] text-emerald-300 border border-emerald-500/30 text-xs font-semibold py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Confirm Booking</span>
                </button>
              )}

              {/* Quick Edit Headcount & Price Button */}
              <button
                type="button"
                onClick={handleOpenQuickEdit}
                className="w-full bg-[#1a3d31] hover:bg-[#235342] text-white border border-[#2d5a47] text-xs font-medium py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-[#e8622a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Edit Headcount / Price</span>
              </button>

              {/* Edit Travellers Button */}
              {!isEditingTravellers ? (
                <button
                  type="button"
                  onClick={() => setIsEditingTravellers(true)}
                  className="w-full bg-[#1a3d31] hover:bg-[#235342] text-white border border-[#2d5a47] text-xs font-medium py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Traveller Details</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancelEditTravellers}
                  className="w-full bg-[#1a3d31] hover:bg-[#235342] text-[#e8622a] border border-[#e8622a]/40 text-xs font-medium py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Cancel Traveller Edit</span>
                </button>
              )}

              {/* Copy Traveller Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full bg-[#1a3d31] hover:bg-[#235342] text-white border border-[#2d5a47] text-xs font-medium py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>Copy Traveller Link</span>
              </button>

              {/* Send Details via WhatsApp */}
              <button
                type="button"
                onClick={handleSendWhatsAppForm}
                className="w-full bg-[#1a3d31] hover:bg-[#235342] text-white border border-[#2d5a47] text-xs font-medium py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>Send Details via WhatsApp</span>
              </button>

              {/* Call Primary Customer */}
              <a
                href={`tel:${booking.primaryContactPhone.replace(/\s+/g, "")}`}
                className="w-full bg-[#1a3d31] hover:bg-[#235342] text-white/80 hover:text-white border border-[#2d5a47] text-xs font-medium py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
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
