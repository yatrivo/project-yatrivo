import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { reviewsApi, type DepartureOperational, type EnrolledTraveller, type ReviewItem, type ReviewRequestPreview } from "@/api/reviews";

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

function calculateReturnDate(startsOn: string, durationDays?: number | null): string {
  if (!startsOn) return "—";
  try {
    const d = new Date(startsOn);
    if (isNaN(d.getTime())) return "—";
    const daysToAdd = Math.max(1, (durationDays ?? 1) - 1);
    d.setDate(d.getDate() + daysToAdd);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function AdminDepartureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [dep, setDep] = useState<DepartureOperational | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // "Ask for Reviews" Modal state
  const [showAskModal, setShowAskModal] = useState(false);
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState(DEFAULT_WHATSAPP_TEMPLATE);
  const [previewBookingId, setPreviewBookingId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [createdRequests, setCreatedRequests] = useState<ReviewRequestPreview[] | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Photo lightbox modal
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

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
    return dep.enrolledTravellers.find((t) => t.bookingId === previewBookingId) || dep.enrolledTravellers[0] || null;
  }, [dep, previewBookingId]);

  const renderedPreviewMessage = useMemo(() => {
    if (!dep || !previewTraveller) return template;
    const siteUrl = window.location.origin;
    const dummyToken = previewTraveller.reviewToken || "rev_sample_token";
    const link = `${siteUrl}/review?token=${dummyToken}`;

    return template
      .replace(/\{\{customer_name\}\}/g, previewTraveller.primaryContactName)
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
    const eligible = dep.enrolledTravellers.filter((t) => t.reviewRequestStatus !== "submitted");
    if (selectedBookingIds.size === eligible.length) {
      setSelectedBookingIds(new Set());
    } else {
      setSelectedBookingIds(new Set(eligible.map((t) => t.bookingId)));
    }
  };

  const handleToggleBooking = (bookingId: string) => {
    setSelectedBookingIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookingId)) {
        next.delete(bookingId);
      } else {
        next.add(bookingId);
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
      setCreatedRequests(res.created);
      showToast(`Review request links generated for ${res.created.length} travellers!`, "success");
      // Refresh operational data to show new sent statuses
      const refreshed = await reviewsApi.getDepartureOperational(id);
      setDep(refreshed);
    } catch (err: any) {
      showToast(err?.message || "Failed to generate review requests.", "error");
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

  const returnDate = calculateReturnDate(dep.startsOn, dep.durationDays);

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

        {dep.status === "completed" && (
          <button
            onClick={() => {
              setCreatedRequests(null);
              setShowAskModal(true);
            }}
            className="inline-flex items-center gap-2 bg-[#e8622a] hover:bg-[#d0521c] text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm transition transform active:scale-98 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Ask for Reviews ({dep.summary.totalEligibleTravellers})
          </button>
        )}
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
                <div className="text-[10px] text-[#a0aec0] font-mono mt-0.5">{dep.startsOn?.split("T")[0]}</div>
              </div>
              <div className="bg-[#f7f8f5] p-3 rounded-xl">
                <div className="text-[11px] text-[#718096] uppercase font-semibold">Return Date</div>
                <div className="text-sm font-bold text-[#0f2922] mt-0.5">{returnDate}</div>
                <div className="text-[10px] text-[#a0aec0] mt-0.5">
                  {dep.durationDays ? `${dep.durationDays} Days / ${dep.durationNights || dep.durationDays - 1} Nights` : "Standard duration"}
                </div>
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
                <div className="text-[11px] text-[#718096] mt-0.5">Reviews Received</div>
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

      {/* Post-Trip Reviews Operational Section (if completed) */}
      {dep.status === "completed" && (
        <div className="bg-gradient-to-r from-[#0f2922]/5 via-white to-amber-50/30 rounded-2xl border border-[#0f2922]/15 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                  Post-Trip Review Operations
                </h2>
              </div>
              <p className="text-xs text-[#718096] mt-0.5">
                This departure has concluded. Engage enrolled travellers to gather reviews and publish customer stories.
              </p>
            </div>
            <button
              onClick={() => {
                setCreatedRequests(null);
                setShowAskModal(true);
              }}
              className="inline-flex items-center gap-2 bg-[#0f2922] hover:bg-[#1b4332] text-white px-4 py-2.5 rounded-xl font-medium text-xs shadow-sm transition cursor-pointer self-start md:self-auto"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Compose & Send Review Requests
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-3.5">
              <div className="text-xs text-[#718096] font-medium">Eligible Travellers</div>
              <div className="text-2xl font-bold text-[#0f2922] mt-1">{dep.summary.totalEligibleTravellers}</div>
              <div className="text-[10px] text-[#a0aec0] mt-0.5">Confirmed bookings</div>
            </div>
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-3.5">
              <div className="text-xs text-[#718096] font-medium">Requests Sent</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{dep.summary.reviewRequestsSent}</div>
              <div className="text-[10px] text-[#a0aec0] mt-0.5">
                {dep.summary.totalEligibleTravellers > 0
                  ? `${Math.round((dep.summary.reviewRequestsSent / dep.summary.totalEligibleTravellers) * 100)}% reach`
                  : "0%"}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-3.5">
              <div className="text-xs text-[#718096] font-medium">Reviews Received</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{dep.summary.reviewsReceived}</div>
              <div className="text-[10px] text-[#a0aec0] mt-0.5">{dep.summary.reviewsPublished} published</div>
            </div>
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-3.5">
              <div className="text-xs text-[#718096] font-medium">Pending Approval</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">{dep.summary.reviewsPendingApproval}</div>
              <div className="text-[10px] text-[#a0aec0] mt-0.5">Awaiting moderation</div>
            </div>
          </div>
        </div>
      )}

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
                    <tr key={traveller.bookingId} className="hover:bg-[#fafafa] transition">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-[#0f2922] text-sm">
                          {traveller.primaryContactName}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-xs font-medium text-[#0f2922]">{traveller.primaryContactPhone}</div>
                        {traveller.primaryContactEmail && (
                          <div className="text-[11px] text-[#718096]">{traveller.primaryContactEmail}</div>
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
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedBookingIds(new Set([traveller.bookingId]));
                                setPreviewBookingId(traveller.bookingId);
                                setCreatedRequests(null);
                                setShowAskModal(true);
                              }}
                              className="px-2.5 py-1 text-xs bg-[#0f2922] text-white rounded-lg hover:bg-[#1b4332] transition cursor-pointer"
                            >
                              Ask Review
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
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden border border-[#e2e8f0]">
            {/* Modal Header */}
            <div className="bg-[#0f2922] text-white px-6 py-4 flex items-center justify-between">
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
                className="text-white/70 hover:text-white p-1 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
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
                    const isSelected = selectedBookingIds.has(traveller.bookingId);
                    return (
                      <div
                        key={traveller.bookingId}
                        onClick={() => {
                          handleToggleBooking(traveller.bookingId);
                          setPreviewBookingId(traveller.bookingId);
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
                            <span className="font-bold text-[#0f2922]">{traveller.primaryContactName}</span>
                            <span className="text-[#718096] ml-2 font-mono">({traveller.bookingNumber})</span>
                            <span className="text-[#a0aec0] ml-2">📱 {traveller.primaryContactPhone}</span>
                          </div>
                        </div>

                        <div>
                          {traveller.reviewRequestStatus === "submitted" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Already Reviewed
                            </span>
                          ) : traveller.reviewRequestStatus === "sent" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Previously Sent
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
                          <option key={t.bookingId} value={t.bookingId}>
                            Preview for: {t.primaryContactName}
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

              {/* Step 4: Generated Review Requests Actions List (after sending) */}
              {createdRequests && (
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h4 className="text-sm font-bold text-emerald-900">
                        {createdRequests.length} Review Links Successfully Generated!
                      </h4>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Click "Open in WhatsApp" to launch WhatsApp Web or mobile app with the pre-filled message, or copy the link directly:
                  </p>

                  <div className="divide-y divide-emerald-100 max-h-48 overflow-y-auto">
                    {createdRequests.map((req) => {
                      const cleanPhone = req.customerPhone.replace(/\D/g, "");
                      const fullPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
                      const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(req.personalizedMessage)}`;

                      return (
                        <div key={req.bookingId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-[#0f2922]">{req.customerName}</span>
                            <span className="text-[#718096] ml-2">📱 {req.customerPhone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(req.reviewLink);
                                showToast(`Copied review link for ${req.customerName}`, "success");
                              }}
                              className="px-2.5 py-1 text-xs bg-white border border-emerald-300 rounded-lg text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                            >
                              Copy Link
                            </button>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-[#25D366] hover:bg-[#1ebc59] text-white font-medium rounded-lg shadow-xs transition"
                            >
                              Open in WhatsApp ↗
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#f7f8f5] px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAskModal(false)}
                className="px-4 py-2 border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#4a5568] hover:text-[#0f2922] hover:border-[#0f2922] transition cursor-pointer"
              >
                {createdRequests ? "Done / Close" : "Cancel"}
              </button>

              {!createdRequests && (
                <button
                  type="button"
                  disabled={isSending || selectedBookingIds.size === 0 || !isReviewLinkIncluded}
                  onClick={handleSendRequests}
                  className="inline-flex items-center gap-2 bg-[#e8622a] hover:bg-[#d0521c] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating Links...
                    </>
                  ) : (
                    <>
                      Generate & Send Requests ({selectedBookingIds.size})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PHOTO LIGHTBOX MODAL */}
      {activePhoto && (
        <div
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-pointer"
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
        </div>
      )}
    </div>
  );
}
