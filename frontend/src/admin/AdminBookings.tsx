import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import type { AdminPage } from "./AdminLayout";
import { bookingsApi, type BookingResponse, type BookingStatus, type PaymentStatus } from "@/api/bookings";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border border-gray-300",
  awaiting_traveller_details: "bg-amber-50 text-amber-800 border border-amber-200",
  details_received: "bg-blue-50 text-blue-700 border border-blue-200",
  confirmed: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
  completed: "bg-purple-50 text-purple-700 border border-purple-200"
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  awaiting_traveller_details: "Awaiting Details",
  details_received: "Details Received",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed"
};

const PAYMENT_BADGE: Record<string, string> = {
  unpaid: "bg-red-50 text-red-700 border border-red-200",
  partial: "bg-yellow-50 text-yellow-800 border border-yellow-200",
  paid: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  refunded: "bg-gray-100 text-gray-700 border border-gray-300"
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  partial: "Partially Paid",
  paid: "Paid",
  refunded: "Refunded"
};

const STATUS_TABS = [
  { value: "all", label: "All Bookings" },
  { value: "awaiting_traveller_details", label: "Awaiting Details" },
  { value: "details_received", label: "Details Received" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" }
] as const;

interface AddBookingModalProps {
  onClose: () => void;
  onCreated: (booking: BookingResponse) => void;
}

function AddBookingModal({ onClose, onCreated }: AddBookingModalProps) {
  const { destinations, trips, tripInstances, showToast } = useApp();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [tripId, setTripId] = useState("");
  const [departureId, setDepartureId] = useState("");
  const [travellers, setTravellers] = useState(2);
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Filter trips for selected destination
  const filteredTrips = useMemo(() => {
    if (!destinationId) return trips;
    return trips.filter((t) => {
      const destMatch = t.destination === destinationId;
      const arrayMatch = Array.isArray(t.destinations) && t.destinations.includes(destinationId);
      return destMatch || arrayMatch;
    });
  }, [trips, destinationId]);

  // Filter available upcoming departures for selected trip
  const availableDepartures = useMemo(() => {
    if (!tripId) return [];
    return tripInstances.filter((ti) => ti.tripId === tripId && ti.status === "upcoming");
  }, [tripInstances, tripId]);

  const selectedTrip = trips.find((t) => t.id === tripId);
  const selectedDest = destinations.find((d) => d.id === destinationId);
  const selectedDeparture = availableDepartures.find((d) => d.id === departureId);

  // Auto-fill price suggestion when departure is chosen
  useEffect(() => {
    if (selectedDeparture && selectedDeparture.price) {
      setTotalAmount(String(selectedDeparture.price * travellers));
    }
  }, [selectedDeparture, travellers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!name.trim()) errs.push("Customer name is required.");
    if (!phone.trim()) errs.push("Customer phone number is required.");
    setErrors(errs);
    if (errs.length > 0) return;

    setIsSubmitting(true);
    try {
      const totalAmountNum = totalAmount ? parseInt(totalAmount.replace(/\D/g, ""), 10) : undefined;
      const res = await bookingsApi.create({
        primaryContactName: name.trim(),
        primaryContactPhone: phone.trim(),
        primaryContactEmail: email.trim() || undefined,
        destinationId: selectedDest?.id,
        destinationLabel: selectedDest?.name || undefined,
        tripId: selectedTrip?.id,
        tripName: selectedTrip?.name || undefined,
        tripInstanceId: selectedDeparture?.id,
        tripDateLabel: selectedDeparture?.displayDate || selectedDeparture?.date || undefined,
        travellerCount: travellers,
        totalAmount: totalAmountNum,
        paymentStatus,
        internalNotes: notes.trim() || undefined,
        status: "awaiting_traveller_details"
      });

      showToast(`Booking #${res.booking.bookingNumber} created successfully.`, "success");
      onCreated(res.booking);
    } catch (err: unknown) {
      setErrors([err instanceof Error ? err.message : "Failed to create booking"]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[92vh] flex flex-col overflow-hidden border border-[#e2e8f0]">
        {/* Header */}
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">
              OFFICIAL BOOKING ENTRY
            </div>
            <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Add New Booking
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition p-1 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4 text-xs">
          <p className="text-[#718096]">
            Create a booking directly for offline, WhatsApp, or phone clients. Traveller details can be filled now or submitted by the customer later via their secure link.
          </p>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 space-y-1">
              {errors.map((e, i) => (
                <p key={i}>• {e}</p>
              ))}
            </div>
          )}

          {/* Customer Info */}
          <div>
            <div className="font-semibold text-[#0f2922] uppercase tracking-wider text-[11px] mb-2">
              Primary Customer
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#4a5568] font-semibold mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Siddharth Verma"
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                />
              </div>
              <div>
                <label className="block text-[#4a5568] font-semibold mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                />
              </div>
            </div>
            <div className="mt-2.5">
              <label className="block text-[#4a5568] font-semibold mb-1">
                Email Address <span className="text-[#a0aec0] font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="siddharth@example.com"
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
              />
            </div>
          </div>

          {/* Trip Hierarchy */}
          <div className="border-t border-[#e2e8f0] pt-3.5 space-y-3">
            <div className="font-semibold text-[#0f2922] uppercase tracking-wider text-[11px]">
              Trip & Departure Selection
            </div>

            <div>
              <label className="block text-[#4a5568] font-semibold mb-1">1. Destination</label>
              <select
                value={destinationId}
                onChange={(e) => {
                  setDestinationId(e.target.value);
                  setTripId("");
                  setDepartureId("");
                }}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
              >
                <option value="">Select destination...</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#4a5568] font-semibold mb-1">2. Trip / Package</label>
              <select
                value={tripId}
                disabled={filteredTrips.length === 0}
                onChange={(e) => {
                  setTripId(e.target.value);
                  setDepartureId("");
                }}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#0f2922] text-[#0f2922] disabled:bg-gray-50"
              >
                <option value="">Select package...</option>
                {filteredTrips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#4a5568] font-semibold mb-1">3. Scheduled Departure</label>
              <select
                value={departureId}
                disabled={!tripId || availableDepartures.length === 0}
                onChange={(e) => setDepartureId(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#0f2922] text-[#0f2922] disabled:bg-gray-50"
              >
                <option value="">Select departure...</option>
                {availableDepartures.map((ti) => (
                  <option key={ti.id} value={ti.id}>
                    {ti.displayDate || ti.date} — ₹{ti.price.toLocaleString("en-IN")} ({ti.spotsLeft} spots left)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#4a5568] font-semibold mb-1">4. Number of Travellers</label>
              <input
                type="number"
                min="1"
                max="50"
                value={travellers}
                onChange={(e) => setTravellers(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
              />
            </div>
          </div>

          {/* Pricing & Notes */}
          <div className="border-t border-[#e2e8f0] pt-3.5 space-y-3">
            <div className="font-semibold text-[#0f2922] uppercase tracking-wider text-[11px]">
              Financials & Status
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#4a5568] font-semibold mb-1">Total Amount (₹)</label>
                <input
                  type="text"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="e.g. 35,000"
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                />
              </div>

              <div>
                <label className="block text-[#4a5568] font-semibold mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partially Paid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#4a5568] font-semibold mb-1">Internal Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any special booking context or requests..."
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-3 border-t border-[#e2e8f0]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#e2e8f0] text-[#4a5568] py-2.5 rounded-lg hover:bg-[#f7f8f5] transition cursor-pointer font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white py-2.5 rounded-lg transition cursor-pointer font-semibold shadow-xs"
            >
              {isSubmitting ? "Creating Booking..." : "Create Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Props {
  setAdminPage?: (p: AdminPage) => void;
}

export default function AdminBookings({ setAdminPage }: Props = {}) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const PER_PAGE = 10;

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingsApi.list();
      setBookings(data.bookings || []);
    } catch (err) {
      console.warn("Failed to load bookings from API:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  // Filtering
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const mName = b.primaryContactName.toLowerCase().includes(q);
        const mPhone = b.primaryContactPhone.toLowerCase().includes(q);
        const mEmail = (b.primaryContactEmail || "").toLowerCase().includes(q);
        const mNumber = b.bookingNumber.toLowerCase().includes(q);
        const mTrip = (b.tripName || "").toLowerCase().includes(q);
        if (!mName && !mPhone && !mEmail && !mNumber && !mTrip) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleRowClick = (bookingId: string) => {
    setAdminPage?.("bookings");
    navigate(`/admin/bookings/${bookingId}`);
  };

  return (
    <div className="p-6 space-y-5">
      {addModalOpen && (
        <AddBookingModal
          onClose={() => setAddModalOpen(false)}
          onCreated={(newBooking) => {
            setAddModalOpen(false);
            setAdminPage?.("bookings");
            navigate(`/admin/bookings/${newBooking.id}`);
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Bookings
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {bookings.length} total
            </span>
          </div>
          <p className="text-[#718096] text-xs mt-0.5">
            Active travellers, group batches, traveller documentation, and payment status tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void loadBookings()}
            className="p-2 border border-[#e2e8f0] text-[#718096] hover:text-[#0f2922] hover:bg-[#f7f8f5] rounded-lg transition cursor-pointer"
            title="Refresh bookings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Booking</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setStatusFilter(t.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === t.value
                    ? "bg-[#0f2922] text-white shadow-2xs"
                    : "bg-[#f7f8f5] text-[#718096] hover:text-[#0f2922]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search customer, phone, package..."
              className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-xs w-full focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f7f8f5] text-[#4a5568] uppercase font-semibold border-b border-[#e2e8f0]">
                <th className="px-4 py-3 text-left">Booking ID</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Package & Destination</th>
                <th className="px-4 py-3 text-left">Departure</th>
                <th className="px-4 py-3 text-left">Travellers</th>
                <th className="px-4 py-3 text-left">Booking Status</th>
                <th className="px-4 py-3 text-left">Payment Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Remaining</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1]">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-[#718096]">
                    <div className="w-5 h-5 border-2 border-[#0f2922] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-xs">Loading bookings...</span>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-[#a0aec0]">
                    <div className="max-w-xs mx-auto space-y-1">
                      <p className="font-semibold text-sm text-[#4a5568]">No bookings found</p>
                      <p className="text-xs">Create a new booking or convert one from an enquiry.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => handleRowClick(b.id)}
                    className="hover:bg-[#f7f8f5] cursor-pointer transition"
                  >
                    {/* Booking ID */}
                    <td className="px-4 py-3 font-mono font-bold text-[#0f2922]">
                      <div>{b.bookingNumber}</div>
                      {b.enquiryNumber && (
                        <span className="text-[10px] text-[#718096] font-normal">
                          from #{b.enquiryNumber}
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#0f2922]">{b.primaryContactName}</div>
                      <div className="text-[#718096] font-mono text-[11px]">{b.primaryContactPhone}</div>
                    </td>

                    {/* Package */}
                    <td className="px-4 py-3 max-w-[180px]">
                      <div className="font-semibold text-[#0f2922] truncate">{b.tripName || "Custom Package"}</div>
                      <div className="text-[#718096] text-[11px] truncate">{b.destinationLabel || "Uttarakhand"}</div>
                    </td>

                    {/* Departure Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-[#0f2922] font-medium">
                      {b.tripDateLabel || "Scheduled Date"}
                    </td>

                    {/* Travellers count */}
                    <td className="px-4 py-3">
                      <span className="bg-[#f7f8f5] border border-[#e2e8f0] px-2 py-0.5 rounded-md font-semibold text-[#0f2922]">
                        {b.travellerCount} {b.travellerCount === 1 ? "traveller" : "travellers"}
                      </span>
                    </td>

                    {/* Booking Status */}
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${STATUS_BADGE[b.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {STATUS_LABELS[b.status] || b.status}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${PAYMENT_BADGE[b.paymentStatus] ?? "bg-gray-100 text-gray-700"}`}>
                        {PAYMENT_LABELS[b.paymentStatus] || b.paymentStatus}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 text-right font-bold text-[#0f2922]">
                      ₹{b.totalAmount.toLocaleString("en-IN")}
                    </td>

                    {/* Paid */}
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      ₹{b.paidAmount.toLocaleString("en-IN")}
                    </td>

                    {/* Remaining */}
                    <td className="px-4 py-3 text-right font-bold text-[#e8622a]">
                      ₹{b.remainingAmount.toLocaleString("en-IN")}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRowClick(b.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#0f2922] bg-[#f7f8f5] hover:bg-[#e2e8f0] rounded-md transition cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0] text-xs text-[#718096]">
          <span>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-md text-xs font-semibold transition cursor-pointer ${
                  p === page ? "bg-[#0f2922] text-white" : "hover:bg-[#f7f8f5] text-[#4a5568]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
