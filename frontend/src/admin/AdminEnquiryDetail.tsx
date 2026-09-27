import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import type { AdminPage } from "./AdminLayout";
import {
  enquiriesApi,
  type EnquiryResponse,
  type EnquiryNote,
  type EnquiryEvent,
  type EnquiryAdmin
} from "@/api/enquiries";
import { bookingsApi } from "@/api/bookings";

interface Props {
  setAdminPage?: (p: AdminPage) => void;
}

const CRM_STATUSES = [
  { value: "received", label: "Received (New)" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "in_discussion", label: "In Discussion" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" }
] as const;

const STATUS_BADGE: Record<string, string> = {
  received: "bg-blue-50 text-blue-700 border border-blue-200",
  contacted: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  quoted: "bg-purple-50 text-purple-700 border border-purple-200",
  in_discussion: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  converted: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  closed: "bg-gray-100 text-gray-700 border border-gray-300",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
  lost: "bg-red-50 text-red-600 border border-red-200"
};

function formatEventDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
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
    case "enquiry_received":
      return "📩";
    case "enquiry_created_manually":
      return "📝";
    case "enquiry_assigned":
    case "enquiry_reassigned":
    case "enquiry_unassigned":
      return "👤";
    case "status_changed":
      return "⚡";
    case "customer_contacted":
      return "📞";
    case "quote_sent":
      return "💰";
    case "note_added":
      return "💬";
    case "note_deleted":
      return "🗑️";
    default:
      return "📌";
  }
}

export default function AdminEnquiryDetail({ setAdminPage }: Props = {}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { adminUser, adminRole, showToast, refreshEnquiries } = useApp();
  const isSuperAdmin = adminRole === "superAdmin" || adminUser?.role === "super_admin";

  const [enquiry, setEnquiry] = useState<EnquiryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admins list for Super Admin assignment
  const [adminList, setAdminList] = useState<EnquiryAdmin[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Note form
  const [noteText, setNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Quote action modal
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [isQuoting, setIsQuoting] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await enquiriesApi.getById(id);
      setEnquiry(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load enquiry details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  // Load admins list for assignment
  useEffect(() => {
    if (isSuperAdmin) {
      enquiriesApi.listAdmins().then(setAdminList).catch(() => {});
    }
  }, [isSuperAdmin]);

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!enquiry) return;
    try {
      const updated = await enquiriesApi.updateStatus(enquiry.id, newStatus);
      setEnquiry((prev) => (prev ? { ...prev, status: updated.status } : null));
      showToast(`Status updated to ${newStatus}.`, "success");
      void fetchDetails();
      void refreshEnquiries();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update status", "error");
    }
  };

  // Handle assignment (Super Admin only)
  const handleAssignChange = async (newAssigneeId: string) => {
    if (!enquiry || !isSuperAdmin) return;
    setIsAssigning(true);
    try {
      const assignedId = newAssigneeId === "unassigned" ? null : newAssigneeId;
      const updated = await enquiriesApi.assign(enquiry.id, assignedId);
      setEnquiry((prev) => (prev ? {
        ...prev,
        assignedToUserId: updated.assignedToUserId,
        assignedToName: updated.assignedToName,
        assignedToEmail: updated.assignedToEmail
      } : null));
      showToast("Assignment updated successfully.", "success");
      void fetchDetails();
      void refreshEnquiries();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to update assignment", "error");
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle adding internal note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiry || !noteText.trim()) return;

    setIsAddingNote(true);
    try {
      await enquiriesApi.addNote(enquiry.id, noteText.trim());
      setNoteText("");
      showToast("Internal note recorded.", "success");
      void fetchDetails();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to add note", "error");
    } finally {
      setIsAddingNote(false);
    }
  };

  // Handle deleting internal note (Author or Super Admin)
  const handleDeleteNote = async (noteId: string) => {
    if (!enquiry) return;
    try {
      await enquiriesApi.deleteNote(enquiry.id, noteId);
      showToast("Note deleted.", "info");
      void fetchDetails();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to delete note", "error");
    }
  };

  // Record contact action
  const handleContactAction = async (method: "phone" | "whatsapp") => {
    if (!enquiry) return;
    try {
      await enquiriesApi.recordAction(enquiry.id, "contact", { method });
      showToast(`Logged contact via ${method === "whatsapp" ? "WhatsApp" : "Phone"}.`, "success");
      void fetchDetails();
      void refreshEnquiries();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to log action", "error");
    }
  };

  // Record quote action
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiry) return;
    setIsQuoting(true);
    try {
      const amountNum = quoteAmount ? parseInt(quoteAmount.replace(/\D/g, ""), 10) : undefined;
      await enquiriesApi.recordAction(enquiry.id, "quote", {
        amount: amountNum,
        notes: quoteNotes.trim() || undefined
      });
      showToast("Quote recorded and timeline updated.", "success");
      setQuoteModalOpen(false);
      setQuoteAmount("");
      setQuoteNotes("");
      void fetchDetails();
      void refreshEnquiries();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to record quote", "error");
    } finally {
      setIsQuoting(false);
    }
  };

  // Convert Enquiry to Official Booking
  const handleConvertToBooking = async () => {
    if (!enquiry) return;
    setIsConverting(true);
    try {
      let totalAmount: number | undefined = undefined;
      if (enquiry.budgetLabel) {
        const matches = enquiry.budgetLabel.match(/₹([0-9,]+)/);
        if (matches && matches[1]) {
          totalAmount = parseInt(matches[1].replace(/,/g, ""), 10);
        }
      }

      const res = await bookingsApi.create({
        enquiryId: enquiry.id,
        primaryContactName: enquiry.customerName,
        primaryContactPhone: enquiry.customerPhone,
        primaryContactEmail: enquiry.customerEmail || undefined,
        destinationId: enquiry.destinationId || undefined,
        destinationLabel: enquiry.destinationLabel || undefined,
        tripId: enquiry.tripId || undefined,
        tripName: enquiry.tripName || undefined,
        tripInstanceId: enquiry.tripInstanceId || undefined,
        tripDateLabel: enquiry.requestedTravelDate || undefined,
        travellerCount: enquiry.requestedTravellerCount || 1,
        totalAmount,
        status: "awaiting_traveller_details"
      });

      showToast(`Enquiry converted to Booking #${res.booking.bookingNumber}!`, "success");
      await refreshEnquiries();
      setAdminPage?.("bookings");
      navigate(`/admin/bookings/${res.booking.id}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to convert enquiry to booking", "error");
    } finally {
      setIsConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[#718096]">
        <div className="w-6 h-6 border-2 border-[#0f2922] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading enquiry CRM details...</p>
      </div>
    );
  }

  if (error || !enquiry) {
    return (
      <div className="p-8 text-center text-[#718096]">
        <p className="text-base text-red-600 mb-2 font-semibold">Enquiry not found or could not be loaded.</p>
        <p className="text-xs mb-4">{error}</p>
        <Link
          to="/admin/enquiries"
          onClick={() => setAdminPage?.("enquiries")}
          className="inline-block bg-[#0f2922] text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-[#1a4a39] transition cursor-pointer"
        >
          ← Back to Enquiries
        </Link>
      </div>
    );
  }

  const rawStatus = (enquiry.status || "received").toLowerCase();
  const notes = enquiry.notes || [];
  const events = enquiry.events || [];

  return (
    <div className="p-6 space-y-6">
      {/* Quote Action Modal */}
      {quoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setQuoteModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-[#e2e8f0]">
            <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">CRM ACTION</div>
                <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>
                  Record Quote for Customer
                </h3>
              </div>
              <button
                onClick={() => setQuoteModalOpen(false)}
                className="text-white/60 hover:text-white transition p-1 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="p-6 space-y-4 text-xs">
              <p className="text-[#718096]">
                Mark this enquiry as Quoted and record the offered package rate for CRM audit tracking.
              </p>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                  Quoted Package Amount (₹)
                </label>
                <input
                  type="text"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  placeholder="e.g. 14,500"
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                  Quotation Notes / Terms
                </label>
                <textarea
                  rows={3}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Includes homestay, meals, guide. Valid for 3 days..."
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922] resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(false)}
                  className="flex-1 border border-[#e2e8f0] text-[#4a5568] py-2 rounded-lg hover:bg-[#f7f8f5] transition cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isQuoting}
                  className="flex-1 bg-[#e8622a] hover:bg-[#d4541f] disabled:opacity-50 text-white py-2 rounded-lg transition cursor-pointer font-semibold shadow-xs"
                >
                  {isQuoting ? "Saving..." : "Save Quote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/admin/enquiries"
          onClick={() => setAdminPage?.("enquiries")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#718096] hover:text-[#0f2922] transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Enquiries</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#718096]">Enquiry ID:</span>
          <span className="font-mono text-xs font-bold text-[#0f2922] bg-[#f7f8f5] px-2.5 py-1 rounded-md border border-[#e2e8f0]">
            {enquiry.enquiryNumber}
          </span>
        </div>
      </div>

      {/* Title & Quick Stats */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${STATUS_BADGE[rawStatus] ?? "bg-gray-100 text-gray-700"}`}>
              {rawStatus.replace("_", " ")}
            </span>
            <span className="text-[#a0aec0] text-xs">•</span>
            <span className="text-xs text-[#718096] capitalize">Source: {enquiry.source.replace("_", " ")}</span>
            <span className="text-[#a0aec0] text-xs">•</span>
            <span className="text-xs text-[#718096]">
              Submitted on {new Date(enquiry.submittedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric"
              })}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            {enquiry.customerName}
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Interested in: <span className="font-semibold text-[#0f2922]">{enquiry.tripName || "Custom Himalayan Trip"}</span> ({enquiry.destinationLabel || "Uttarakhand"})
          </p>
        </div>

        {/* Quick Contact Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`tel:${enquiry.customerPhone.replace(/\s+/g, "")}`}
            onClick={() => void handleContactAction("phone")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0f2922] hover:bg-[#1a3d31] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Call Customer</span>
          </a>

          <a
            href={`https://wa.me/${enquiry.customerPhone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => void handleContactAction("whatsapp")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>WhatsApp Customer</span>
          </a>

          <button
            onClick={() => setQuoteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <span>Provide Quote</span>
          </button>

          <button
            onClick={() => void handleConvertToBooking()}
            disabled={isConverting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{isConverting ? "Converting..." : "Convert to Booking"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Details, Package Details, Notes, and Real Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Trip Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5">
              <h3 className="font-bold text-[#0f2922] text-sm mb-3.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#e8622a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Customer Details
              </h3>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[#718096] block text-[11px]">Full Name</span>
                  <span className="font-semibold text-[#0f2922] text-sm">{enquiry.customerName}</span>
                </div>
                <div>
                  <span className="text-[#718096] block text-[11px]">Phone / WhatsApp</span>
                  <span className="font-mono font-medium text-[#0f2922]">{enquiry.customerPhone}</span>
                </div>
                <div>
                  <span className="text-[#718096] block text-[11px]">Email</span>
                  <span className="text-[#0f2922]">{enquiry.customerEmail || "Not provided"}</span>
                </div>
              </div>
            </div>

            {/* Trip & Departure Details */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5">
              <h3 className="font-bold text-[#0f2922] text-sm mb-3.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#e8622a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Package & Departure
              </h3>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[#718096] block text-[11px]">Package</span>
                  <span className="font-semibold text-[#0f2922]">{enquiry.tripName || "Custom Himalayan Package"}</span>
                </div>
                <div>
                  <span className="text-[#718096] block text-[11px]">Departure Date</span>
                  <span className="font-semibold text-[#0f2922]">
                    {enquiry.requestedTravelDate || "Flexible / Not selected"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[#718096] block text-[11px]">Travellers</span>
                    <span className="font-semibold text-[#0f2922]">
                      {enquiry.requestedTravellerCount} {enquiry.requestedTravellerCount === 1 ? "person" : "people"}
                    </span>
                  </div>
                  {enquiry.budgetLabel && (
                    <div className="text-right">
                      <span className="text-[#718096] block text-[11px]">Estimate / Base</span>
                      <span className="font-bold text-[#e8622a]">{enquiry.budgetLabel}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Customer Message / Notes (if submitted) */}
          {enquiry.message && (
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5">
              <div className="text-xs uppercase tracking-wider font-semibold text-[#718096] mb-1.5">
                Customer Message / Offline Notes
              </div>
              <div className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-lg p-3.5 text-xs text-[#0f2922] leading-relaxed whitespace-pre-wrap">
                {enquiry.message}
              </div>
            </div>
          )}

          {/* Internal Notes Section */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#0f2922] text-sm">Internal Admin Notes</h3>
                <p className="text-[#718096] text-xs">
                  Private CRM notes visible only to the internal team. Not visible to the customer.
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {notes.length} {notes.length === 1 ? "note" : "notes"}
              </span>
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              {notes.length === 0 ? (
                <div className="bg-[#f7f8f5] rounded-lg p-6 text-center text-xs text-[#a0aec0] border border-dashed border-[#cbd5e1]">
                  No internal notes recorded yet. Add one below to track calls, customer preferences, or custom pricing.
                </div>
              ) : (
                notes.map((n: EnquiryNote) => {
                  const canDelete = isSuperAdmin || n.createdByUserId === adminUser?.id;
                  return (
                    <div
                      key={n.id}
                      className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-xl p-3.5 space-y-1.5 transition"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0f2922]">{n.createdByName || "Admin"}</span>
                          <span className="text-[#a0aec0]">•</span>
                          <span className="text-[#718096]">{formatEventDate(n.createdAt)}</span>
                        </div>
                        {canDelete && (
                          <button
                            onClick={() => void handleDeleteNote(n.id)}
                            className="text-[#a0aec0] hover:text-red-600 transition p-1 cursor-pointer"
                            title="Delete note"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-[#2d3748] leading-relaxed whitespace-pre-wrap">{n.body}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Note Input */}
            <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-[#e2e8f0]">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write an internal note..."
                rows={2}
                className="w-full border border-[#e2e8f0] rounded-lg p-3 text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922] resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isAddingNote || !noteText.trim()}
                  className="bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer shadow-xs"
                >
                  {isAddingNote ? "Adding Note..." : "Add Note"}
                </button>
              </div>
            </form>
          </div>

          {/* Real Activity Timeline */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5 space-y-4">
            <div>
              <h3 className="font-bold text-[#0f2922] text-sm">Real Activity Timeline</h3>
              <p className="text-[#718096] text-xs">
                Audit trail of system events, assignments, status transitions, and customer interactions recorded in the database.
              </p>
            </div>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-[#e2e8f0]">
              {events.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#a0aec0]">No timeline events recorded yet.</div>
              ) : (
                events.map((ev: EnquiryEvent) => (
                  <div key={ev.id} className="relative flex items-start gap-3.5 pl-1">
                    <div className="w-7 h-7 rounded-full bg-white border border-[#e2e8f0] shadow-2xs flex items-center justify-center text-sm shrink-0 z-10">
                      {getEventIcon(ev.eventType)}
                    </div>
                    <div className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-xl p-3 flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-bold text-[#0f2922]">{ev.title}</span>
                        <span className="text-[11px] text-[#a0aec0] font-mono">{formatEventDate(ev.createdAt)}</span>
                      </div>

                      {ev.details && typeof ev.details === "object" && (
                        <div className="text-[#4a5568] space-y-0.5 text-[11px]">
                          {Boolean(ev.details.changedByName) && (
                            <div>Updated by: <span className="font-semibold">{String(ev.details.changedByName)}</span></div>
                          )}
                          {Boolean(ev.details.assignedByName) && (
                            <div>Assigned by: <span className="font-semibold">{String(ev.details.assignedByName)}</span></div>
                          )}
                          {Boolean(ev.details.reassignedByName) && (
                            <div>Reassigned by: <span className="font-semibold">{String(ev.details.reassignedByName)}</span></div>
                          )}
                          {Boolean(ev.details.contactedByName) && (
                            <div>Contacted by: <span className="font-semibold">{String(ev.details.contactedByName)}</span></div>
                          )}
                          {Boolean(ev.details.quotedByName) && (
                            <div>Quoted by: <span className="font-semibold">{String(ev.details.quotedByName)}</span></div>
                          )}
                          {Boolean(ev.details.amount) && (
                            <div className="font-semibold text-[#e8622a]">
                              Quoted Amount: ₹{Number(ev.details.amount).toLocaleString("en-IN")}
                            </div>
                          )}
                          {Boolean(ev.details.notes) && (
                            <div className="italic text-[#718096]">“{String(ev.details.notes)}”</div>
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

        {/* Right Column: CRM Controls (Status, Assignment, Actions) */}
        <div className="space-y-5">
          {/* CRM Controls Box */}
          <div className="bg-[#0f2922] rounded-xl p-5 text-white shadow-2xs space-y-4">
            <div>
              <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">MANAGEMENT</div>
              <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>
                Enquiry Controls
              </h3>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-[#a3bfb5] text-xs font-semibold uppercase tracking-wider mb-1.5">
                Current Status
              </label>
              <select
                value={rawStatus}
                onChange={(e) => void handleStatusChange(e.target.value)}
                className="w-full bg-[#1a3d31] text-white border border-[#2d5a48] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#e8622a] cursor-pointer"
              >
                {CRM_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Assignment */}
            <div>
              <label className="block text-[#a3bfb5] text-xs font-semibold uppercase tracking-wider mb-1.5">
                Assigned Team Member
              </label>

              {isSuperAdmin ? (
                <select
                  value={enquiry.assignedToUserId || "unassigned"}
                  disabled={isAssigning}
                  onChange={(e) => void handleAssignChange(e.target.value)}
                  className="w-full bg-[#1a3d31] text-white border border-[#2d5a48] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#e8622a] cursor-pointer disabled:opacity-50"
                >
                  <option value="unassigned">— Unassigned —</option>
                  {adminList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} ({a.role === "super_admin" ? "Super Admin" : "Admin"})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="bg-[#1a3d31] border border-[#2d5a48] rounded-lg p-2.5 text-xs text-white flex items-center justify-between">
                  <span>{enquiry.assignedToName || "Unassigned"}</span>
                  <span className="text-[10px] text-[#7aab95] italic">Super Admin assigns</span>
                </div>
              )}
            </div>

            {/* Quick Actions List */}
            <div className="border-t border-[#1a3d31] pt-3.5 space-y-2">
              <button
                type="button"
                onClick={() => void handleConvertToBooking()}
                disabled={isConverting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold py-2.5 px-3 rounded-lg transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{isConverting ? "Converting..." : "Convert to Booking"}</span>
              </button>

              <button
                type="button"
                onClick={() => setQuoteModalOpen(true)}
                className="w-full bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold py-2.5 px-3 rounded-lg transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Record Quote Amount</span>
              </button>

              <a
                href={`https://wa.me/${enquiry.customerPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => void handleContactAction("whatsapp")}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-semibold py-2.5 px-3 rounded-lg transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Summary / Metadata Card */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5 space-y-3 text-xs">
            <h4 className="font-bold text-[#0f2922] uppercase tracking-wider text-[11px]">System Metadata</h4>
            <div className="space-y-2 border-y border-[#e2e8f0] py-2.5 text-[#718096]">
              <div className="flex justify-between">
                <span>Enquiry Number:</span>
                <span className="font-mono font-semibold text-[#0f2922]">{enquiry.enquiryNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Lead Source:</span>
                <span className="font-semibold text-[#0f2922] capitalize">{enquiry.source.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span>Database ID:</span>
                <span className="font-mono text-[10px] text-[#a0aec0] truncate max-w-[140px]">{enquiry.id}</span>
              </div>
            </div>
            <p className="text-[11px] text-[#a0aec0] leading-relaxed">
              Every change made to this enquiry is captured with admin actor snapshots and timestamped in the activity audit timeline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
