import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import type { Enquiry } from "@/context/AppContext";
import type { AdminPage } from "./AdminLayout";
import { enquiriesApi } from "@/api/enquiries";

const MANUAL_SOURCES = [
  { label: "Phone Call", value: "phone" },
  { label: "WhatsApp Chat", value: "whatsapp" },
  { label: "In-Person / Walk-in", value: "walk_in" },
  { label: "Other Offline", value: "other" }
] as const;

type ManualSourceValue = typeof MANUAL_SOURCES[number]["value"];

interface AddInquiryModalProps {
  onClose: () => void;
  onAdded?: () => void;
}

function AddInquiryModal({ onClose, onAdded }: AddInquiryModalProps) {
  const { destinations, trips, tripInstances, showToast, refreshEnquiries } = useApp();
  const [source, setSource] = useState<ManualSourceValue>("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [tripId, setTripId] = useState("");
  const [departureId, setDepartureId] = useState("");
  const [travellers, setTravellers] = useState(2);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!name.trim()) errs.push("Customer name is required.");
    if (!phone.trim()) errs.push("Customer phone number is required.");
    setErrors(errs);
    if (errs.length > 0) return;

    setIsSubmitting(true);
    try {
      await enquiriesApi.create({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        destinationId: selectedDest?.id,
        destinationLabel: selectedDest?.name || undefined,
        tripId: selectedTrip?.id,
        tripName: selectedTrip?.name || undefined,
        tripInstanceId: selectedDeparture?.id,
        requestedTravelDate: selectedDeparture?.startsOn || selectedDeparture?.date || undefined,
        requestedTravellerCount: travellers,
        budgetLabel: selectedDeparture ? `₹${selectedDeparture.price.toLocaleString("en-IN")} / person` : undefined,
        message: message.trim() || undefined,
        source
      });

      showToast(`Manual enquiry created for ${name.trim()}.`, "success");
      await refreshEnquiries();
      onAdded?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record manual enquiry";
      setErrors([msg]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-contain">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]">
        {/* Header */}
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">
              OFFLINE / MANUAL ENTRY
            </div>
            <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Add Manual Enquiry
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
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-y-auto flex-1 min-h-0 p-6 space-y-4">
            <p className="text-[#718096] text-xs">
              Manually log an enquiry received via direct phone call, WhatsApp chat, or walk-in customer. It maps directly into the official enquiries CRM with timeline tracking.
            </p>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-xs space-y-1">
              {errors.map((e, i) => (
                <p key={i}>• {e}</p>
              ))}
            </div>
          )}

          {/* Source Selection */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
              Enquiry Source <span className="text-red-500">*</span>
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as ManualSourceValue)}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
            >
              {MANUAL_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
              Email Address <span className="text-[#718096] text-[10px] normal-case">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
            />
          </div>

          {/* Flow: Destination -> Trip/Package -> Available Departure -> Travellers */}
          <div className="border-t border-[#e2e8f0] pt-3 space-y-3">
            <div className="text-[11px] font-semibold text-[#e8622a] uppercase tracking-wider">
              Package & Departure Details
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f2922] mb-1">
                1. Select Destination
              </label>
              <select
                value={destinationId}
                onChange={(e) => {
                  setDestinationId(e.target.value);
                  setTripId("");
                  setDepartureId("");
                }}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
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
              <label className="block text-xs font-semibold text-[#0f2922] mb-1">
                2. Select Trip / Package
              </label>
              <select
                value={tripId}
                disabled={filteredTrips.length === 0}
                onChange={(e) => {
                  setTripId(e.target.value);
                  setDepartureId("");
                }}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922] text-[#0f2922] disabled:bg-gray-50"
              >
                <option value="">Select package...</option>
                {filteredTrips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (from ₹{t.price?.toLocaleString("en-IN") || "9,999"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f2922] mb-1">
                3. Available Departure
              </label>
              {tripId && availableDepartures.length === 0 ? (
                <div className="bg-[#f7f8f5] border border-dashed border-[#cbd5e1] rounded-lg p-2.5 text-xs text-[#718096]">
                  No upcoming departures scheduled for this package. Mention requested custom dates in notes below.
                </div>
              ) : (
                <select
                  value={departureId}
                  disabled={!tripId || availableDepartures.length === 0}
                  onChange={(e) => setDepartureId(e.target.value)}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922] text-[#0f2922] disabled:bg-gray-50"
                >
                  <option value="">Select scheduled departure...</option>
                  {availableDepartures.map((ti) => (
                    <option key={ti.id} value={ti.id}>
                      {ti.displayDate || ti.date} — ₹{ti.price.toLocaleString("en-IN")} ({ti.spotsLeft} spots left)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f2922] mb-1">
                4. Number of Travellers
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={travellers}
                onChange={(e) => setTravellers(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
              Message / Notes
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Record customer's inquiry details, custom date requests, or offline context..."
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922] resize-none"
            />
          </div>

          </div>

          {/* Sticky Pinned Footer - ALWAYS VISIBLE */}
          <div className="bg-[#f7f8f5] px-6 py-3.5 border-t border-[#e2e8f0] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[#e2e8f0] text-[#4a5568] hover:text-[#0f2922] hover:bg-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#e8622a] hover:bg-[#d4541f] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? "Recording..." : "Record Enquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

const STATUS_BADGE: Record<string, string> = {
  Received: "bg-blue-50 text-blue-700 border border-blue-200",
  Contacted: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  Quoted: "bg-purple-50 text-purple-700 border border-purple-200",
  "In Discussion": "bg-indigo-50 text-indigo-700 border border-indigo-200",
  Converted: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Closed: "bg-gray-100 text-gray-700 border border-gray-300",
  Cancelled: "bg-red-50 text-red-700 border border-red-200",
  Lost: "bg-red-50 text-red-600 border border-red-200"
};

const STATUS_TABS = ["All", "Received", "Contacted", "Quoted", "In Discussion", "Converted", "Closed"] as const;

interface Props {
  setAdminPage?: (p: AdminPage) => void;
  setSelectedEnquiry?: (e: Enquiry) => void;
}

export default function AdminEnquiries({ setAdminPage, setSelectedEnquiry }: Props = {}) {
  const navigate = useNavigate();
  const { enquiries, adminUser, adminRole, refreshEnquiries } = useApp();
  const isSuperAdmin = adminRole === "superAdmin" || adminUser?.role === "super_admin";
  const currentUserId = adminUser?.id;

  // Count enquiries assigned to the current admin
  const assignedToMeCount = useMemo(() => {
    if (!currentUserId) return 0;
    return enquiries.filter((e) => e.assignedToUserId === currentUserId).length;
  }, [enquiries, currentUserId]);

  // View state: for regular admins, default to "my" if they have any, otherwise "all"
  const [viewFilter, setViewFilter] = useState<"all" | "my" | "unassigned">(() => {
    if (isSuperAdmin) return "all";
    return assignedToMeCount > 0 ? "my" : "all";
  });

  // Automatically adapt view if regular admin has 0 assigned
  useEffect(() => {
    if (!isSuperAdmin && viewFilter === "my" && assignedToMeCount === 0) {
      setViewFilter("all");
    }
  }, [isSuperAdmin, assignedToMeCount, viewFilter]);

  const [statusTab, setStatusTab] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const PER_PAGE = 10;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshEnquiries();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Filter pipeline
  const filtered = useMemo(() => {
    return enquiries.filter((e) => {
      // 1. Logical Assignment view
      if (!isSuperAdmin) {
        if (viewFilter === "my" && e.assignedToUserId !== currentUserId) {
          return false;
        }
      } else {
        if (viewFilter === "my" && e.assignedToUserId !== currentUserId) return false;
        if (viewFilter === "unassigned" && e.assignedToUserId) return false;
      }

      // 2. Status tab
      if (statusTab !== "All") {
        if (statusTab === "Converted") {
          if (e.status !== "Converted" && e.status !== "Confirmed") return false;
        } else if (e.status !== statusTab) {
          return false;
        }
      }

      // 3. Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = e.name.toLowerCase().includes(q);
        const matchesPhone = e.phone.toLowerCase().includes(q);
        const matchesEmail = (e.email || "").toLowerCase().includes(q);
        const matchesNumber = (e.enquiryNumber || e.id).toLowerCase().includes(q);
        const matchesTrip = e.tripName.toLowerCase().includes(q);
        const matchesAssignee = (e.assignedToName || "").toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesNumber && !matchesTrip && !matchesAssignee) {
          return false;
        }
      }

      return true;
    });
  }, [enquiries, isSuperAdmin, viewFilter, currentUserId, statusTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleRowClick = (e: Enquiry) => {
    setSelectedEnquiry?.(e);
    setAdminPage?.("enquiry-detail");
    navigate(`/admin/enquiries/${e.id}`);
  };

  return (
    <div className="p-6 space-y-5">
      {addModalOpen && (
        <AddInquiryModal
          onClose={() => setAddModalOpen(false)}
          onAdded={() => {
            void refreshEnquiries();
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Enquiries CRM
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#f7f8f5] text-[#0f2922] border border-[#e2e8f0]">
              {enquiries.length} total
            </span>
          </div>
          <p className="text-[#718096] text-xs mt-0.5">
            {isSuperAdmin
              ? "Super Admin View • Monitor all incoming enquiries, assign team members, and oversee CRM progress."
              : `Admin View • ${assignedToMeCount} assigned to you • Handle customer interactions and update statuses.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="p-2 border border-[#e2e8f0] text-[#718096] hover:text-[#0f2922] hover:bg-[#f7f8f5] rounded-lg transition cursor-pointer disabled:opacity-70"
            title="Refresh from database"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isRefreshing ? "animate-spin text-[#0f2922]" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Manual Enquiry</span>
          </button>
        </div>
      </div>

      {/* Logical Assignment Views & Filters */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-[#f7f8f5] rounded-lg border border-[#e2e8f0] text-xs font-semibold">
            {!isSuperAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setViewFilter("my");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    viewFilter === "my"
                      ? "bg-white text-[#0f2922] shadow-2xs font-bold"
                      : "text-[#718096] hover:text-[#0f2922]"
                  }`}
                >
                  <span>Assigned to me</span>
                  <span className="bg-[#0f2922] text-white text-[10px] px-1.5 py-0.2 rounded-full">
                    {assignedToMeCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewFilter("all");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    viewFilter === "all"
                      ? "bg-white text-[#0f2922] shadow-2xs font-bold"
                      : "text-[#718096] hover:text-[#0f2922]"
                  }`}
                >
                  All enquiries
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setViewFilter("all");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    viewFilter === "all"
                      ? "bg-white text-[#0f2922] shadow-2xs font-bold"
                      : "text-[#718096] hover:text-[#0f2922]"
                  }`}
                >
                  All Enquiries
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewFilter("unassigned");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    viewFilter === "unassigned"
                      ? "bg-white text-[#0f2922] shadow-2xs font-bold"
                      : "text-[#718096] hover:text-[#0f2922]"
                  }`}
                >
                  Unassigned
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewFilter("my");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    viewFilter === "my"
                      ? "bg-white text-[#0f2922] shadow-2xs font-bold"
                      : "text-[#718096] hover:text-[#0f2922]"
                  }`}
                >
                  <span>My Enquiries</span>
                  <span className="bg-[#0f2922] text-white text-[10px] px-1.5 py-0.2 rounded-full">
                    {assignedToMeCount}
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Search Bar */}
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
              placeholder="Search customer, phone, trip..."
              className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-xs w-full focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
            />
          </div>
        </div>

        {/* Status Tab Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 border-t border-[#f0f4f1] pt-2.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setStatusTab(t);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                statusTab === t
                  ? "bg-[#0f2922] text-white"
                  : "bg-[#f7f8f5] text-[#718096] hover:text-[#0f2922]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* CRM Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f7f8f5] text-[#4a5568] uppercase font-semibold border-b border-[#e2e8f0]">
                <th className="px-4 py-3 text-left">Enquiry #</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Package & Destination</th>
                <th className="px-4 py-3 text-left">Departure</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Assigned To</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#a0aec0]">
                    <div className="max-w-xs mx-auto space-y-1">
                      <p className="font-semibold text-sm text-[#4a5568]">No enquiries found</p>
                      <p className="text-xs">
                        {viewFilter === "my"
                          ? "You currently have no enquiries assigned to you."
                          : "Try adjusting your filters or search keywords."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-[#f7f8f5] cursor-pointer transition"
                    onClick={() => handleRowClick(e)}
                  >
                    {/* Enquiry # and Source Badge */}
                    <td className="px-4 py-3 font-mono font-semibold text-[#0f2922]">
                      <div>{e.enquiryNumber || e.id}</div>
                      {e.source && (
                        <span className="text-[10px] font-normal text-[#718096] capitalize">
                          via {e.source.replace("_", " ")}
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#0f2922]">{e.name}</div>
                      <div className="text-[#718096] font-mono text-[11px]">{e.phone}</div>
                    </td>

                    {/* Package & Destination */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="font-medium text-[#0f2922] truncate">{e.tripName}</div>
                      <div className="text-[11px] text-[#718096] truncate">{e.destination}</div>
                    </td>

                    {/* Departure */}
                    <td className="px-4 py-3">
                      <div className="text-[#0f2922] font-medium">{e.travelDate}</div>
                      <div className="text-[11px] text-[#718096]">
                        {e.travellers} {parseInt(e.travellers) === 1 ? "traveller" : "travellers"}
                      </div>
                    </td>

                    {/* Submitted At */}
                    <td className="px-4 py-3 text-[#718096] whitespace-nowrap">
                      {new Date(e.submittedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${STATUS_BADGE[e.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {e.status}
                      </span>
                      {e.bookingId && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setAdminPage?.("bookings");
                              navigate(`/admin/bookings/${e.bookingId}`);
                            }}
                            className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Booking #{e.bookingNumber || e.bookingId.slice(0, 8)}</span>
                            <span>→</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Assigned To Badge */}
                    <td className="px-4 py-3">
                      {e.assignedToName ? (
                        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{e.assignedToName}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#a0aec0] italic">Unassigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right" onClick={(ev) => ev.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        {e.bookingId && (
                          <button
                            onClick={() => {
                              setAdminPage?.("bookings");
                              navigate(`/admin/bookings/${e.bookingId}`);
                            }}
                            className="px-2 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                            title="Open linked booking"
                          >
                            <span>Booking</span>
                            <span>→</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleRowClick(e)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#0f2922] bg-[#f7f8f5] hover:bg-[#e2e8f0] rounded-md transition cursor-pointer"
                          title="Open CRM detail"
                        >
                          View CRM
                        </button>
                        <a
                          href={`https://wa.me/${e.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-emerald-600 hover:text-emerald-700 transition"
                          title="Chat on WhatsApp"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </a>
                      </div>
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
