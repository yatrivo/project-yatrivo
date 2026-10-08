import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { reviewsApi, type DepartureOperational, type EnrolledTraveller, type ReviewItem } from "@/api/reviews";
import { tripsApi } from "@/api/trips";
import MediaPicker from "@/components/MediaPicker";

const DEFAULT_WHATSAPP_TEMPLATE = `Hi {{customer_name}}, hope you had an unforgettable experience on the {{trip_name}} trip to {{destination}}! 🌄

We would love to hear your feedback and see your favourite photos. Please take a minute to leave us a review here:
{{review_link}}

Thank you for choosing Yatrivo! Safe travels! ✨`;

const TEMPLATE_VARIABLES = [
  { tag: "{{customer_name}}", label: "Customer Name", desc: "e.g. Ramesh Sharma" },
  { tag: "{{destination}}", label: "Destination", desc: "e.g. Uttarakhand" },
  { tag: "{{trip_name}}", label: "Trip Name", desc: "e.g. Chopta Tungnath Trek" },
  { tag: "{{package_name}}", label: "Package Name", desc: "Trip duration/package" },
  { tag: "{{trip_date}}", label: "Trip Date", desc: "e.g. 15 July 2026" },
  { tag: "{{passenger_count}}", label: "Pax Count", desc: "e.g. 2 travellers" },
  { tag: "{{booking_number}}", label: "Booking Number", desc: "e.g. BOOK-2026-67504" },
  { tag: "{{inquiry_number}}", label: "Inquiry Number", desc: "e.g. ENQ-0012" },
  { tag: "{{review_link}}", label: "Review Link (Required)", desc: "Unique secure review form URL" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" title={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-4 h-4 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function calculateReturnDate(startsOn: string, durationDays?: number | null, durationLabel?: string | null): string {
  if (!startsOn) return "—";
  try {
    // Parse startsOn safely without timezone shift
    const parts = startsOn.split("T")[0].split("-");
    let year: number, month: number, day: number;
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      const parsed = new Date(startsOn);
      if (isNaN(parsed.getTime())) return "—";
      year = parsed.getFullYear();
      month = parsed.getMonth();
      day = parsed.getDate();
    }

    // Always prioritize the explicit duration from durationLabel (e.g. "3 Days / 2 Nights" -> 3)
    let days: number | null = null;
    if (durationLabel) {
      const match = durationLabel.match(/(\d+)\s*(?:d|day|days)/i);
      if (match) {
        days = parseInt(match[1], 10);
      }
    }
    if (!days && durationDays) {
      days = durationDays;
    }

    // A N-day trip starting on Day D ends on Day D + (N - 1).
    // e.g. 3-day trip starting Oct 2 ends on Oct 2 + (3 - 1) = Oct 4.
    const numDays = Math.max(1, days ?? 1);
    const returnDateObj = new Date(year, month, day + (numDays - 1));

    return returnDateObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function AdminDepartureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast, destinations, refreshTrips } = useApp();

  const [dep, setDep] = useState<DepartureOperational | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // "Manage Photos & Notes" Modal state
  const [showEditPhotosModal, setShowEditPhotosModal] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [isSavingPhotos, setIsSavingPhotos] = useState(false);

  // "Ask for Reviews" Modal state
  const [showAskModal, setShowAskModal] = useState(false);
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState(DEFAULT_WHATSAPP_TEMPLATE);
  const [previewBookingId, setPreviewBookingId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Photo lightbox modal
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  const dest = useMemo(() => {
    if (!dep || !destinations) return undefined;
    return destinations.find((d) => d.name === dep.destinationName || d.slug === dep.destinationSlug || d.id === dep.destinationSlug);
  }, [dep, destinations]);

  useEffect(() => {
    if (!showAskModal && !activePhoto && !showEditPhotosModal) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showAskModal, activePhoto, showEditPhotosModal]);

  const openEditPhotosModal = () => {
    if (!dep) return;
    setEditNotes(dep.notes || "");
    setEditPhotos(dep.completedPhotos && dep.completedPhotos.length > 0 ? [...dep.completedPhotos] : [""]);
    setShowEditPhotosModal(true);
  };

  const handleUpdatePhoto = (idx: number, val: string) => {
    setEditPhotos((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleAddPhotoSlot = () => {
    if (editPhotos.length < 12) {
      setEditPhotos((prev) => [...prev, ""]);
    }
  };

  const handleRemovePhotoSlot = (idx: number) => {
    setEditPhotos((prev) => {
      if (prev.length <= 1) return [""];
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSavePhotosAndNotes = async (andMarkComplete = false) => {
    if (!dep) return;
    try {
      setIsSavingPhotos(true);
      const cleaned = editPhotos.map((p) => p.trim()).filter(Boolean);
      const trimmedNotes = editNotes.trim() || null;
      const payload: { notes: string | null; completedPhotos: string[]; status?: "completed" } = {
        notes: trimmedNotes,
        completedPhotos: cleaned,
      };
      if (andMarkComplete) {
        payload.status = "completed";
      }

      await tripsApi.updateDeparture(dep.id, payload);
      setDep((prev) => (prev ? {
        ...prev,
        status: payload.status || prev.status,
        notes: trimmedNotes,
        completedPhotos: cleaned,
      } : null));
      await refreshTrips?.({ bypassCache: true });
      setShowEditPhotosModal(false);
      showToast(andMarkComplete ? "Departure marked as completed with photos & notes!" : "Photos and notes updated successfully!", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update departure";
      showToast(msg, "error");
    } finally {
      setIsSavingPhotos(false);
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!dep) return;
    if (!window.confirm("Are you sure you want to remove this completed trip photo?")) return;
    try {
      const remaining = (dep.completedPhotos || []).filter((p) => p !== photoUrl);
      await tripsApi.updateDeparture(dep.id, {
        completedPhotos: remaining,
      });
      setDep((prev) => (prev ? { ...prev, completedPhotos: remaining } : null));
      await refreshTrips?.({ bypassCache: true });
      showToast("Photo removed.", "info");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove photo";
      showToast(msg, "error");
    }
  };

  const fetchDepartureData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await reviewsApi.getDepartureOperational(id);
      setDep(data);

      // Pre-select travellers who have not submitted reviews yet
      const eligibleIds = data.enrolledTravellers
        .filter((t) => t.reviewRequestStatus !== "submitted")
        .map((t) => t.bookingId);
      setSelectedBookingIds(new Set(eligibleIds));
      if (eligibleIds.length > 0) {
        setPreviewBookingId(eligibleIds[0]);
      } else if (data.enrolledTravellers.length > 0) {
        setPreviewBookingId(data.enrolledTravellers[0].bookingId);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load departure details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartureData();
  }, [id]);

  // Insert variable tag into template at cursor position
  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setTemplate((prev) => prev + " " + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = template.substring(0, start) + tag + template.substring(end);
    setTemplate(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  // Preview replacement computation
  const previewTraveller = useMemo(() => {
    if (!dep) return null;
    return (
      dep.enrolledTravellers.find((t) => t.id === previewBookingId || t.bookingId === previewBookingId) ||
      dep.enrolledTravellers[0] ||
      null
    );
  }, [dep, previewBookingId]);

  const renderedPreviewMessage = useMemo(() => {
    if (!dep || !previewTraveller) return template;
    const token = previewTraveller.reviewToken || "TOKEN";
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${siteUrl}/review?token=${token}`;

    return template
      .replace(/\{\{customer_name\}\}/g, previewTraveller.passengerName || previewTraveller.primaryContactName)
      .replace(/\{\{destination\}\}/g, dep.destinationName)
      .replace(/\{\{trip_name\}\}/g, dep.tripName)
      .replace(/\{\{package_name\}\}/g, dep.durationLabel || `${dep.durationDays || 3} Days Trip`)
      .replace(/\{\{trip_date\}\}/g, dep.displayDate)
      .replace(/\{\{passenger_count\}\}/g, `${previewTraveller.passengerCount} ${previewTraveller.passengerCount === 1 ? "passenger" : "passengers"}`)
      .replace(/\{\{booking_number\}\}/g, previewTraveller.bookingNumber)
      .replace(/\{\{inquiry_number\}\}/g, previewTraveller.enquiryNumber || previewTraveller.bookingNumber)
      .replace(/\{\{review_link\}\}/g, link);
  }, [template, dep, previewTraveller]);

  const isReviewLinkIncluded = template.includes("{{review_link}}");

  const handleToggleSelectAll = () => {
    if (!dep) return;
    if (selectedBookingIds.size === dep.enrolledTravellers.length) {
      setSelectedBookingIds(new Set());
    } else {
      setSelectedBookingIds(new Set(dep.enrolledTravellers.map((t) => t.id)));
    }
  };

  const handleToggleBooking = (travellerId: string) => {
    setSelectedBookingIds((prev) => {
      const next = new Set(prev);
      if (next.has(travellerId)) {
        next.delete(travellerId);
      } else {
        next.add(travellerId);
      }
      return next;
    });
  };

  const handleSendRequests = async () => {
    if (!id || !dep) return;
    if (selectedBookingIds.size === 0) {
      showToast("Please select at least one traveller.", "error");
      return;
    }
    if (!isReviewLinkIncluded) {
      showToast("Template must include {{review_link}} tag.", "error");
      return;
    }

    try {
      setIsSending(true);
      const res = await reviewsApi.createReviewRequests({
        tripInstanceId: id,
        bookingIds: Array.from(selectedBookingIds),
        template
      });
      setShowAskModal(false);
      showToast(`Review requests successfully sent via WhatsApp to ${res.created.length} travellers!`, "success");
      // Refresh operational data to show new sent statuses
      const refreshed = await reviewsApi.getDepartureOperational(id);
      setDep(refreshed);
    } catch (err: any) {
      showToast(err?.message || "Failed to send review requests via WhatsApp.", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateReviewStatus = async (reviewId: string, newStatus: "published" | "hidden") => {
    try {
      setModeratingId(reviewId);
      await reviewsApi.updateStatus(reviewId, newStatus);
      showToast(`Review marked as ${newStatus}.`, "success");
      // Update local state
      if (dep) {
        const updatedReviews = dep.reviews.map((r) =>
          r.id === reviewId ? { ...r, status: newStatus } : r
        );
        const pendingCount = updatedReviews.filter((r) => r.status === "pending").length;
        const publishedCount = updatedReviews.filter((r) => r.status === "published").length;
        setDep({
          ...dep,
          reviews: updatedReviews,
          summary: {
            ...dep.summary,
            reviewsPendingApproval: pendingCount,
            reviewsPublished: publishedCount
          }
        });
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to update review status.", "error");
    } finally {
      setModeratingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#0f2922] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-[#718096]">Loading departure details...</p>
      </div>
    );
  }

  if (error || !dep) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-semibold mb-2">{error || "Departure not found."}</p>
          <button
            onClick={() => navigate("/admin/trip-instances")}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0f2922] text-white rounded-lg text-sm font-medium hover:bg-[#1b4332] transition"
          >
            ← Back to Departures
          </button>
        </div>
      </div>
    );
  }

  const returnDate = calculateReturnDate(dep.startsOn, dep.durationDays, dep.durationLabel);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/trip-instances"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#718096] hover:text-[#0f2922] transition mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Departures
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
              {dep.tripName}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                dep.status === "completed"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : dep.status === "upcoming"
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              ● {dep.status}
            </span>
          </div>
          <p className="text-xs text-[#a0aec0] mt-1 font-mono">Departure ID: {dep.id}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={openEditPhotosModal}
            className="inline-flex items-center gap-1.5 border border-[#e2e8f0] bg-white hover:bg-[#f7f8f5] text-[#0f2922] px-4 py-2.5 rounded-xl font-medium text-sm shadow-2xs transition cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#e8622a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {dep.status === "completed" ? "Edit Photos & Notes" : "Complete Trip & Add Photos"}
          </button>

          <button
            onClick={() => {
              setSelectedBookingIds(new Set(dep.enrolledTravellers.map((t) => t.id)));
              setPreviewBookingId(dep.enrolledTravellers[0]?.id || "");
              setShowAskModal(true);
            }}
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebc59] text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm transition transform active:scale-98 cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
            Send WhatsApp Review Requests
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: Trip & Destination Info */}
          <div className="space-y-3 lg:border-r border-[#f0f4f8] lg:pr-6">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#0f2922]/5 text-[#0f2922] font-semibold text-xs uppercase tracking-wide">
                {dep.destinationName}
              </span>
              {dep.durationLabel && (
                <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold text-xs">
                  {dep.durationLabel}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-[#0f2922] leading-snug">
              {dep.tripName}
            </h3>

            {dep.tripDescription && (
              <p className="text-xs text-[#718096] line-clamp-3 leading-relaxed">
                {dep.tripDescription}
              </p>
            )}

            <div className="pt-2 text-xs text-[#4a5568] space-y-1">
              {dep.startingPoint && (
                <div><span className="font-semibold text-[#0f2922]">Pickup / Starting:</span> {dep.startingPoint}</div>
              )}
              {dep.notes && (
                <div><span className="font-semibold text-[#0f2922]">Instance Notes:</span> {dep.notes}</div>
              )}
            </div>
          </div>

          {/* Col 2: Dates & Duration */}
          <div className="space-y-4 lg:border-r border-[#f0f4f8] lg:pr-6">
            <h4 className="text-xs font-bold text-[#a0aec0] uppercase tracking-wider">Schedule & Duration</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f7f8f5] p-3 rounded-xl">
                <div className="text-[11px] text-[#718096] uppercase font-semibold">Departure Date</div>
                <div className="text-sm font-bold text-[#0f2922] mt-0.5">{dep.displayDate}</div>
              </div>
              <div className="bg-[#f7f8f5] p-3 rounded-xl">
                <div className="text-[11px] text-[#718096] uppercase font-semibold">Return Date</div>
                <div className="text-sm font-bold text-[#0f2922] mt-0.5">{returnDate}</div>
              </div>
            </div>

            <div className="bg-[#f7f8f5] p-3 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#718096] uppercase font-semibold">Pricing per Pax</div>
                <div className="text-base font-bold text-[#0f2922]">₹{dep.price.toLocaleString("en-IN")}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#718096] uppercase font-semibold">Capacity</div>
                <div className="text-sm font-bold text-[#0f2922]">
                  {dep.spotsTotal - dep.spotsLeft} booked / {dep.spotsTotal} total
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: Operational Quick Stats */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#a0aec0] uppercase tracking-wider">Operational Summary</h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="border border-[#e2e8f0] p-3 rounded-xl">
                <div className="text-xl font-bold text-[#0f2922]">{dep.enrolledTravellers.length}</div>
                <div className="text-[11px] text-[#718096] mt-0.5">Enrolled Bookings</div>
              </div>
              <div className="border border-[#e2e8f0] p-3 rounded-xl">
                <div className="text-xl font-bold text-[#0f2922]">
                  {dep.enrolledTravellers.reduce((sum, t) => sum + t.passengerCount, 0)}
                </div>
                <div className="text-[11px] text-[#718096] mt-0.5">Total Passengers</div>
              </div>
              <div className="border border-[#e2e8f0] p-3 rounded-xl">
                <div className="text-xl font-bold text-amber-600">{dep.summary.reviewRequestsSent}</div>
                <div className="text-[11px] text-[#718096] mt-0.5">Requests Sent</div>
              </div>
              <div className="border border-[#e2e8f0] p-3 rounded-xl">
                <div className="text-xl font-bold text-emerald-600">{dep.summary.reviewsReceived}</div>
                <div className="text-[11px] text-[#718096] mt-0.5">
                  {dep.summary.reviewsPendingApproval > 0
                    ? `${dep.summary.reviewsPendingApproval} Pending Approval`
                    : `${dep.summary.reviewsPublished} Published`}
                </div>
              </div>
            </div>

            {dep.summary.averageRating !== null && (
              <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-amber-900">Average Rating</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-lg font-bold text-amber-900">{dep.summary.averageRating}</span>
                    <Stars rating={Math.round(dep.summary.averageRating)} />
                  </div>
                </div>
                <span className="text-xs text-amber-800/80 font-medium">
                  {dep.summary.reviewsReceived} {dep.summary.reviewsReceived === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completed Trip Photos & Operational Notes Card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[#f0f4f8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f2922]/5 flex items-center justify-center text-[#0f2922]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                  Trip Completion & Photos
                </h3>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                    dep.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : dep.status === "cancelled"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {dep.status}
                </span>
              </div>
              <p className="text-xs text-[#718096] mt-0.5">
                Official photos from this completed batch and operational post-trip notes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openEditPhotosModal}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-[#0f2922] hover:bg-[#1a3d31] text-white transition cursor-pointer shadow-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {dep.status === "completed" ? "Manage Photos & Notes" : "Complete Trip & Add Photos"}
          </button>
        </div>

        {/* Notes display */}
        <div className="bg-[#f7f8f5] rounded-xl p-4 border border-[#e2e8f0]/70">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#4a5568] uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#718096]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Completion Notes
            </span>
            <button
              type="button"
              onClick={openEditPhotosModal}
              className="text-[11px] text-[#e8622a] hover:text-[#c44f1c] font-semibold cursor-pointer"
            >
              {dep.notes ? "Edit Note" : "+ Add Note"}
            </button>
          </div>
          {dep.notes ? (
            <p className="text-xs text-[#0f2922] whitespace-pre-wrap leading-relaxed">
              {dep.notes}
            </p>
          ) : (
            <p className="text-xs text-[#a0aec0] italic">
              No completion or operational notes recorded yet for this departure.
            </p>
          )}
        </div>

        {/* Photos grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4a5568] uppercase tracking-wider">
              Completed Trip Photos ({dep.completedPhotos?.length || 0})
            </span>
            {dep.completedPhotos && dep.completedPhotos.length > 0 && (
              <span className="text-[11px] text-[#718096]">
                Click photo to preview or hover to remove
              </span>
            )}
          </div>

          {dep.completedPhotos && dep.completedPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {dep.completedPhotos.map((photoUrl, idx) => (
                <div
                  key={`${photoUrl}-${idx}`}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-[#e2e8f0] bg-[#f7f8f5] shadow-2xs hover:shadow-md transition"
                >
                  <img
                    src={photoUrl}
                    alt={`Trip batch photo ${idx + 1}`}
                    onClick={() => setActivePhoto(photoUrl)}
                    className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhoto(photoUrl);
                      }}
                      className="pointer-events-auto p-1.5 bg-white/90 hover:bg-white text-[#0f2922] rounded-lg shadow-sm transition cursor-pointer"
                      title="Enlarge photo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photoUrl);
                      }}
                      className="pointer-events-auto p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition cursor-pointer"
                      title="Delete photo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* Add more button card */}
              <button
                type="button"
                onClick={openEditPhotosModal}
                className="aspect-square rounded-xl border-2 border-dashed border-[#cbd5e1] hover:border-[#0f2922] bg-[#f7f8f5]/60 hover:bg-[#f7f8f5] flex flex-col items-center justify-center gap-1.5 text-[#718096] hover:text-[#0f2922] transition cursor-pointer"
                title="Add more photos"
              >
                <div className="w-8 h-8 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#718096]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold">Add More</span>
              </button>
            </div>
          ) : (
            <div className="border border-dashed border-[#e2e8f0] rounded-xl p-6 text-center bg-[#fafbfc]">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-[#4a5568]">No completed trip photos uploaded yet</p>
              <p className="text-[11px] text-[#a0aec0] mt-0.5 max-w-sm mx-auto">
                Upload real photos taken during this departure to showcase on the platform and store in memory.
              </p>
              <button
                type="button"
                onClick={openEditPhotosModal}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f7f8f5] text-[#0f2922] transition cursor-pointer"
              >
                + Add Photos & Notes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enrolled Travellers Table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Enrolled Travellers ({dep.enrolledTravellers.length})
            </h3>
            <p className="text-xs text-[#718096] mt-0.5">
              Travellers and booking contacts enrolled in this departure.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f8f5] border-b border-[#e2e8f0]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4a5568] uppercase tracking-wider">
                  Contact / Traveller
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4a5568] uppercase tracking-wider">
                  Phone / Email
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-[#4a5568] uppercase tracking-wider">
                  Pax
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4a5568] uppercase tracking-wider">
                  Booking & Inquiry Ref
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4a5568] uppercase tracking-wider">
                  Booking Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4a5568] uppercase tracking-wider">
                  Review Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#4a5568] uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f8]">
              {dep.enrolledTravellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#a0aec0] text-sm">
                    No enrolled bookings found for this departure.
                  </td>
                </tr>
              ) : (
                dep.enrolledTravellers.map((traveller) => {
                  const reviewUrl = traveller.reviewToken
                    ? `${window.location.origin}/review?token=${traveller.reviewToken}`
                    : null;

                  return (
                    <tr key={traveller.id} className="hover:bg-[#fafafa] transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#0f2922] text-sm">
                            {traveller.passengerName || traveller.primaryContactName}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              traveller.isPrimaryContact
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {traveller.isPrimaryContact ? "Primary Booker" : "Passenger"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-xs font-medium text-[#0f2922]">{traveller.passengerPhone || traveller.primaryContactPhone}</div>
                        {(traveller.passengerEmail || traveller.primaryContactEmail) && (
                          <div className="text-[11px] text-[#718096]">{traveller.passengerEmail || traveller.primaryContactEmail}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#f0f4f8] text-[#0f2922]">
                          {traveller.passengerCount}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs">
                        <Link
                          to={`/admin/bookings/${traveller.bookingId}`}
                          className="font-medium text-[#0f2922] hover:underline"
                        >
                          {traveller.bookingNumber}
                        </Link>
                        {traveller.enquiryNumber && (
                          <div className="text-[10px] text-[#718096] mt-0.5">Enq: {traveller.enquiryNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {traveller.bookingStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {traveller.reviewRequestStatus === "submitted" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Submitted {traveller.reviewRating ? `(${traveller.reviewRating}★)` : ""}
                          </span>
                        ) : traveller.reviewRequestStatus === "sent" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            ● Sent Link
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Not Requested
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {reviewUrl ? (
                            <>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(reviewUrl);
                                  showToast("Review link copied to clipboard!", "success");
                                }}
                                className="px-2 py-1 text-xs border border-[#e2e8f0] rounded-lg text-[#4a5568] hover:text-[#0f2922] hover:border-[#0f2922] transition cursor-pointer"
                                title="Copy unique review form link"
                              >
                                Copy Link
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBookingIds(new Set([traveller.id]));
                                  setPreviewBookingId(traveller.id);
                                  setShowAskModal(true);
                                }}
                                className="px-2.5 py-1 text-xs bg-[#25D366] text-white rounded-lg hover:bg-[#1ebc59] transition cursor-pointer"
                                title="Resend review request via WhatsApp"
                              >
                                Resend
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedBookingIds(new Set([traveller.id]));
                                setPreviewBookingId(traveller.id);
                                setShowAskModal(true);
                              }}
                              className="px-2.5 py-1 text-xs bg-[#25D366] text-white rounded-lg hover:bg-[#1ebc59] transition cursor-pointer"
                            >
                              Send WhatsApp
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reviews Received for this Departure Section */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Departure Reviews ({dep.reviews.length})
            </h3>
            <p className="text-xs text-[#718096] mt-0.5">
              Traveller reviews received for this specific departure. Moderate reviews to display them on the website.
            </p>
          </div>
          {dep.summary.averageRating !== null && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#0f2922]">{dep.summary.averageRating}</span>
              <Stars rating={Math.round(dep.summary.averageRating)} />
            </div>
          )}
        </div>

        {dep.reviews.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f7f8f5] flex items-center justify-center mx-auto mb-3 text-[#a0aec0]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#0f2922]">No reviews submitted yet</p>
            <p className="text-xs text-[#718096] max-w-sm mx-auto mt-1">
              Send review requests to enrolled travellers using the "Ask for Reviews" button above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0f4f8]">
            {dep.reviews.map((rev) => (
              <div key={rev.id} className="p-5 hover:bg-[#fafafa] transition">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#0f2922] text-sm">{rev.reviewerName}</span>
                      <Stars rating={rev.rating} />
                      <span className="text-xs text-[#a0aec0]">
                        • {new Date(rev.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {rev.bookingNumber && (
                      <div className="text-[11px] text-[#718096] mt-0.5 font-mono">
                        Booking: {rev.bookingNumber}
                      </div>
                    )}
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        rev.status === "published"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : rev.status === "pending"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      }`}
                    >
                      {rev.status === "pending" ? "Pending Moderation" : rev.status}
                    </span>

                    {/* Moderation Controls: strictly Publish and Hide, NO delete */}
                    {rev.status === "pending" && (
                      <>
                        <button
                          disabled={moderatingId === rev.id}
                          onClick={() => handleUpdateReviewStatus(rev.id, "published")}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50"
                        >
                          Approve / Publish
                        </button>
                        <button
                          disabled={moderatingId === rev.id}
                          onClick={() => handleUpdateReviewStatus(rev.id, "hidden")}
                          className="px-2.5 py-1 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50"
                        >
                          Hide
                        </button>
                      </>
                    )}

                    {rev.status === "published" && (
                      <button
                        disabled={moderatingId === rev.id}
                        onClick={() => handleUpdateReviewStatus(rev.id, "hidden")}
                        className="px-2.5 py-1 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50"
                      >
                        Hide Review
                      </button>
                    )}

                    {rev.status === "hidden" && (
                      <button
                        disabled={moderatingId === rev.id}
                        onClick={() => handleUpdateReviewStatus(rev.id, "published")}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-xs text-[#4a5568] leading-relaxed mb-3 whitespace-pre-line">
                  {rev.body}
                </p>

                {/* Uploaded Photos Gallery */}
                {rev.photoUrls && rev.photoUrls.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {rev.photoUrls.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhoto(url)}
                        className="w-16 h-16 rounded-xl overflow-hidden border border-[#e2e8f0] hover:ring-2 hover:ring-[#0f2922] transition cursor-pointer"
                      >
                        <img src={url} alt="Review photo" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* "ASK FOR REVIEWS" WORKFLOW MODAL */}
      {showAskModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-contain">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowAskModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl z-10 max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]">
              {/* Modal Header */}
              <div className="bg-[#0f2922] text-white px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif, serif)" }}>
                    Ask for Post-Trip Reviews
                  </h3>
                  <p className="text-xs text-white/70 mt-0.5">
                    Send personalized WhatsApp review requests with individual secure links for {dep.tripName} ({dep.displayDate}).
                  </p>
                </div>
                <button
                  onClick={() => setShowAskModal(false)}
                  className="text-white/70 hover:text-white p-1 rounded-lg transition cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
                {/* Step 1: Select Eligible Travellers */}
                <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#0f2922] uppercase tracking-wider">
                    1. Select Travellers ({selectedBookingIds.size} of {dep.enrolledTravellers.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-xs font-semibold text-[#e8622a] hover:underline"
                  >
                    {selectedBookingIds.size === dep.enrolledTravellers.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="border border-[#e2e8f0] rounded-xl overflow-hidden divide-y divide-[#f0f4f8] max-h-48 overflow-y-auto">
                  {dep.enrolledTravellers.map((traveller) => {
                    const isSelected = selectedBookingIds.has(traveller.id);
                    return (
                      <div
                        key={traveller.id}
                        onClick={() => {
                          handleToggleBooking(traveller.id);
                          setPreviewBookingId(traveller.id);
                        }}
                        className={`px-4 py-2.5 flex items-center justify-between text-xs cursor-pointer transition ${
                          isSelected ? "bg-[#0f2922]/5" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div
                            className="w-4 h-4 text-[#0f2922] rounded border-gray-300 focus:ring-[#0f2922]"
                          />
                          <div>
                            <span className="font-bold text-[#0f2922]">
                              {traveller.passengerName || traveller.primaryContactName}
                            </span>
                            <span
                              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ml-2 ${
                                traveller.isPrimaryContact
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {traveller.isPrimaryContact ? "Primary Booker" : "Passenger"}
                            </span>
                            <span className="text-[#718096] ml-2 font-mono">({traveller.bookingNumber})</span>
                            <span className="text-[#a0aec0] ml-2">📱 {traveller.passengerPhone || traveller.primaryContactPhone}</span>
                          </div>
                        </div>

                        <div>
                          {traveller.reviewRequestStatus === "submitted" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Reviewed (Will Regenerate)
                            </span>
                          ) : traveller.reviewRequestStatus === "sent" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Active Link (Can Resend)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                              Not Sent Yet
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Customizable WhatsApp Template & Placeholder Tags */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#0f2922] uppercase tracking-wider">
                      2. WhatsApp Message Template
                    </label>
                    <button
                      type="button"
                      onClick={() => setTemplate(DEFAULT_WHATSAPP_TEMPLATE)}
                      className="text-[11px] text-[#718096] hover:text-[#0f2922] underline"
                    >
                      Reset default
                    </button>
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    rows={8}
                    className="w-full text-xs font-mono p-3 border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#0f2922] leading-relaxed resize-none"
                    placeholder="Enter WhatsApp template message..."
                  />

                  {/* Warning if review_link is missing */}
                  {!isReviewLinkIncluded && (
                    <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>
                        <strong>Validation Error:</strong> <code className="bg-red-100 px-1 py-0.5 rounded">{"{{review_link}}"}</code> placeholder is required so the traveller can access the review form.
                      </span>
                    </div>
                  )}

                  {/* Variable insertion buttons */}
                  <div className="mt-3">
                    <div className="text-[11px] font-semibold text-[#718096] mb-1.5">Insert Placeholders:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {TEMPLATE_VARIABLES.map((v) => (
                        <button
                          key={v.tag}
                          type="button"
                          onClick={() => handleInsertTag(v.tag)}
                          className={`px-2 py-1 rounded-md text-[11px] font-mono transition cursor-pointer ${
                            v.tag === "{{review_link}}"
                              ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold hover:bg-amber-200"
                              : "bg-[#f0f4f8] text-[#0f2922] hover:bg-[#e2e8f0]"
                          }`}
                          title={v.desc}
                        >
                          + {v.tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 3: Live Personalized Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#0f2922] uppercase tracking-wider">
                      3. Live WhatsApp Preview
                    </label>
                    {dep.enrolledTravellers.length > 1 && (
                      <select
                        value={previewBookingId}
                        onChange={(e) => setPreviewBookingId(e.target.value)}
                        className="text-xs border border-[#e2e8f0] rounded-lg px-2 py-1 bg-white focus:outline-none"
                      >
                        {dep.enrolledTravellers.map((t) => (
                          <option key={t.id} value={t.id}>
                            Preview for: {t.passengerName || t.primaryContactName} ({t.isPrimaryContact ? "Booker" : "Passenger"})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Simulated WhatsApp Chat Bubble */}
                  <div className="bg-[#e5ddd5] p-4 rounded-2xl border border-[#d1d7db] min-h-[240px] flex flex-col justify-end relative shadow-inner">
                    <div className="bg-[#dcf8c6] p-3.5 rounded-2xl rounded-tr-xs shadow-sm max-w-[92%] ml-auto text-xs text-[#111b21] leading-relaxed whitespace-pre-wrap relative font-sans">
                      {renderedPreviewMessage}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#667781]">
                        <span>Just now</span>
                        <svg className="w-3.5 h-3.5 text-[#53bdeb]" viewBox="0 0 16 15" fill="none">
                          <path d="M15.01 3.316l-7.79 7.79-3.79-3.79" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M11.51 3.316l-7.79 7.79-2.29-2.29" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-[#718096]">
                    ✨ Each recipient receives their own authenticated link. No customer login is needed to leave a review.
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-[#f7f8f5] px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowAskModal(false)}
                className="px-4 py-2 border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#4a5568] hover:text-[#0f2922] hover:border-[#0f2922] transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSending || selectedBookingIds.size === 0 || !isReviewLinkIncluded}
                onClick={handleSendRequests}
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebc59] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending via WhatsApp...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                    </svg>
                    Send WhatsApp Requests ({selectedBookingIds.size})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MANAGE PHOTOS & NOTES MODAL */}
      {showEditPhotosModal &&
        dep &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-contain">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowEditPhotosModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]">
              {/* Header */}
              <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">
                    {dep.status === "completed" ? "TRIP OPERATIONAL DETAILS" : "MARK DEPARTURE AS COMPLETED"}
                  </div>
                  <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>
                    {dep.status === "completed" ? "Edit Completed Photos & Notes" : "Complete Trip & Add Photos"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditPhotosModal(false)}
                  className="text-white/70 hover:text-white transition p-1 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1 min-h-0 p-6 space-y-5">
                <div>
                  <div className="text-xs font-semibold text-[#0f2922]">{dep.tripName}</div>
                  <div className="text-[11px] text-[#718096] mt-0.5">
                    Departure: {dep.displayDate} • Destination: {dep.destinationName}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4a5568] mb-1">
                    Trip Completion Notes (optional)
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922] resize-none"
                    placeholder="e.g. Batch completed smoothly. Weather was pleasant, summit achieved by all travellers..."
                  />
                  <p className="text-[11px] text-[#a0aec0] mt-1">
                    Internal operational summary and notes about this departure.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-semibold text-[#4a5568]">
                        Completed Trip Photos (optional)
                      </label>
                      <p className="text-[11px] text-[#a0aec0]">
                        Select or upload batch photos. Maximum 12 photos.
                      </p>
                    </div>
                    {editPhotos.length < 12 && (
                      <button
                        type="button"
                        onClick={handleAddPhotoSlot}
                        className="text-xs text-[#e8622a] hover:text-[#c44f1c] font-semibold cursor-pointer"
                      >
                        + Add photo slot
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {editPhotos.map((url, i) => (
                      <div key={i} className="flex gap-2 items-center bg-[#f7f8f5] p-2 rounded-xl border border-[#e2e8f0]">
                        <span className="text-[#a0aec0] text-xs w-4 shrink-0 font-mono text-center">{i + 1}</span>
                        <MediaPicker
                          value={url}
                          onChange={(newUrl) => handleUpdatePhoto(i, newUrl)}
                          className="flex-1"
                          context={{
                            destinationId: dest?.id,
                            destinationSlug: dest?.slug,
                            destinationName: dest?.name,
                            category: "completed_trips",
                          }}
                        />
                        {editPhotos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhotoSlot(i)}
                            className="text-[#a0aec0] hover:text-red-500 p-1.5 transition cursor-pointer"
                            title="Remove photo slot"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-[#f7f8f5] px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditPhotosModal(false)}
                  disabled={isSavingPhotos}
                  className="px-4 py-2 border border-[#e2e8f0] text-[#4a5568] hover:text-[#0f2922] hover:bg-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {dep.status !== "completed" && (
                    <button
                      type="button"
                      disabled={isSavingPhotos}
                      onClick={() => handleSavePhotosAndNotes(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {isSavingPhotos ? "Saving..." : "Save & Complete Trip"}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isSavingPhotos}
                    onClick={() => handleSavePhotosAndNotes(false)}
                    className="px-5 py-2 bg-[#0f2922] hover:bg-[#1a3d31] text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isSavingPhotos ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* PHOTO LIGHTBOX MODAL */}
      {activePhoto &&
        createPortal(
          <div
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-pointer"
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
              <img src={activePhoto} alt="Review attachment" className="w-full h-full object-contain max-h-[85vh] rounded-2xl" />
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
