import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { reviewsApi, type ReviewItem } from "@/api/reviews";

const STATUS_BADGE: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  pending: "bg-amber-100 text-amber-800 border border-amber-200",
  hidden: "bg-gray-100 text-gray-700 border border-gray-200",
};

const TABS = ["All", "published", "pending", "hidden"] as const;
type TabValue = (typeof TABS)[number];

const RATING_OPTIONS = [0, 5, 4, 3, 2, 1];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const { showToast, destinations, trips } = useApp();
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabValue>("All");
  const [search, setSearch] = useState("");
  const [destFilter, setDestFilter] = useState("All");
  const [tripFilter, setTripFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState(0);

  // Selected review for details drawer
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedReview && !activePhoto) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedReview, activePhoto]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewsApi.list({ limit: 100 });
      const items = Array.isArray(res?.reviews)
        ? res.reviews
        : Array.isArray(res)
        ? (res as unknown as ReviewItem[])
        : [];
      setReviewsList(items);
    } catch (err: any) {
      showToast(err?.message || "Failed to load reviews from API", "error");
      setReviewsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "published" | "hidden") => {
    try {
      setModeratingId(id);
      await reviewsApi.updateStatus(id, newStatus);
      showToast(`Review marked as ${newStatus}.`, "success");
      setReviewsList((prev) =>
        (prev || []).map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      if (selectedReview && selectedReview.id === id) {
        setSelectedReview({ ...selectedReview, status: newStatus });
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to update review status", "error");
    } finally {
      setModeratingId(null);
    }
  };

  const safeList = Array.isArray(reviewsList) ? reviewsList : [];

  const filtered = safeList.filter((r) => {
    const matchTab = tab === "All" || r.status === tab;
    const matchDest =
      destFilter === "All" ||
      r.destinationId === destFilter ||
      r.destinationSlug === destFilter ||
      r.destinationName?.toLowerCase() === destFilter.toLowerCase();
    const matchTrip =
      tripFilter === "All" ||
      r.tripId === tripFilter ||
      r.tripSlug === tripFilter;
    const matchRating = ratingFilter === 0 || r.rating === ratingFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.reviewerName?.toLowerCase().includes(q) ||
      (r.tripName && r.tripName.toLowerCase().includes(q)) ||
      r.body?.toLowerCase().includes(q) ||
      (r.bookingNumber && r.bookingNumber.toLowerCase().includes(q));

    return matchTab && matchDest && matchTrip && matchRating && matchSearch;
  });

  const tabLabels: Record<TabValue, string> = {
    All: "All",
    published: "Published",
    pending: "Pending",
    hidden: "Hidden",
  };

  const tabCounts: Record<TabValue, number> = {
    All: safeList.length,
    published: safeList.filter((r) => r.status === "published").length,
    pending: safeList.filter((r) => r.status === "pending").length,
    hidden: safeList.filter((r) => r.status === "hidden").length,
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            Traveller Reviews
          </h2>
          <p className="text-[#718096] text-xs mt-0.5">
            Moderate post-trip feedback and photo submissions across all completed Yatrivo departures.
          </p>
        </div>
      </div>

      {/* Tabs + search + filters row */}
      <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between flex-wrap">
        <div className="flex gap-1 bg-[#f7f8f5] rounded-xl p-1 border border-[#e2e8f0]/60 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                tab === t ? "bg-white text-[#0f2922] shadow-xs" : "text-[#718096] hover:text-[#0f2922]"
              }`}
            >
              {tabLabels[t]}
              <span className={`ml-1.5 text-[11px] ${tab === t ? "text-[#e8622a] font-bold" : "text-[#a0aec0]"}`}>
                {tabCounts[t]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {/* Destination filter */}
          <select
            value={destFilter}
            onChange={(e) => setDestFilter(e.target.value)}
            className="border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#0f2922] bg-white capitalize font-medium"
          >
            <option value="All">All Destinations</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Trip filter */}
          <select
            value={tripFilter}
            onChange={(e) => setTripFilter(e.target.value)}
            className="border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#0f2922] bg-white font-medium max-w-[180px] truncate"
          >
            <option value="All">All Trips</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Rating filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(Number(e.target.value))}
            className="border border-[#e2e8f0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#0f2922] bg-white font-medium"
          >
            {RATING_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r === 0 ? "All Ratings" : `${r} Star${r !== 1 ? "s" : ""}`}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviews..."
              className="pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-xl text-xs w-44 focus:outline-none focus:border-[#0f2922]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-[#0f2922] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-[#718096]">Loading reviews...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase font-semibold border-b border-[#e2e8f0]">
                  <th className="px-4 py-3 text-left">Reviewer</th>
                  <th className="px-4 py-3 text-left">Rating</th>
                  <th className="px-4 py-3 text-left">Review</th>
                  <th className="px-4 py-3 text-left">Trip & Departure</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f8]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#a0aec0] text-sm">
                      No reviews found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedReview(r)}
                      className="hover:bg-[#fafafa] transition cursor-pointer"
                    >
                      <td className="px-4 py-3 font-semibold text-[#0f2922] whitespace-nowrap">
                        <div>{r.reviewerName}</div>
                        {r.bookingNumber && (
                          <div className="text-[10px] text-[#718096] font-mono mt-0.5">
                            {r.bookingNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Stars rating={r.rating} />
                      </td>
                      <td className="px-4 py-3 text-[#4a5568] max-w-xs">
                        <p className="line-clamp-2 text-xs leading-relaxed">{r.body}</p>
                        {r.photoUrls && r.photoUrls.length > 0 && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-[#718096] bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                            📷 {r.photoUrls.length} {r.photoUrls.length === 1 ? "photo" : "photos"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-semibold text-[#0f2922]">{r.tripName || "Trip"}</div>
                        <div className="text-[11px] text-[#718096] mt-0.5">
                          {r.departureDisplayDate ? (
                            r.tripInstanceId ? (
                              <Link
                                to={`/admin/departures/${r.tripInstanceId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-emerald-700 hover:underline font-medium"
                              >
                                🗓 {r.departureDisplayDate} ↗
                              </Link>
                            ) : (
                              `🗓 ${r.departureDisplayDate}`
                            )
                          ) : (
                            r.destinationName || "Uttarakhand"
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#718096] text-xs whitespace-nowrap">
                        {new Date(r.submittedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold rounded-full px-2.5 py-0.5 capitalize ${
                            STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {r.status === "pending" ? "Pending Approval" : r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReview(r)}
                            className="px-2.5 py-1 text-xs font-medium text-[#0f2922] border border-[#e2e8f0] hover:border-[#0f2922] rounded-lg transition cursor-pointer"
                          >
                            Details
                          </button>
                          {r.status !== "published" && (
                            <button
                              disabled={moderatingId === r.id}
                              onClick={() => handleUpdateStatus(r.id, "published")}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition cursor-pointer disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}
                          {r.status === "published" && (
                            <button
                              disabled={moderatingId === r.id}
                              onClick={() => handleUpdateStatus(r.id, "hidden")}
                              className="px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-100 rounded-lg transition cursor-pointer disabled:opacity-50"
                            >
                              Hide
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REVIEW DETAILS DRAWER / MODAL */}
      {selectedReview &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-contain">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedReview(null)} />
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] sm:max-h-[90vh] overflow-hidden flex flex-col border border-[#e2e8f0] z-10"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f7f8f5] shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                    Review Details
                  </h3>
                  <p className="text-xs text-[#718096] mt-0.5">Submitted by {selectedReview.reviewerName}</p>
                </div>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-400 hover:text-gray-700 p-1 rounded-lg transition cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                {/* Trip & Departure Badge */}
                <div className="bg-[#f7f8f5] p-3.5 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0f2922] text-sm">{selectedReview.tripName}</span>
                    <span
                      className={`text-xs font-semibold rounded-full px-2.5 py-0.5 capitalize ${
                        STATUS_BADGE[selectedReview.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {selectedReview.status === "pending" ? "Pending Approval" : selectedReview.status}
                    </span>
                  </div>
                  <div className="text-[#718096] flex items-center gap-3">
                    <span>Destination: <strong>{selectedReview.destinationName || "Uttarakhand"}</strong></span>
                    {selectedReview.departureDisplayDate && (
                      <span>Departure: <strong>{selectedReview.departureDisplayDate}</strong></span>
                    )}
                  </div>
                  {selectedReview.bookingNumber && (
                    <div className="text-[#718096] font-mono">Booking Ref: {selectedReview.bookingNumber}</div>
                  )}
                  {selectedReview.tripInstanceId && (
                    <div className="pt-1">
                      <Link
                        to={`/admin/departures/${selectedReview.tripInstanceId}`}
                        className="text-emerald-700 hover:underline font-semibold"
                      >
                        View Departure Page & Enrolled Travellers →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Rating & Reviewer info */}
                <div className="flex items-center justify-between border-b border-[#f0f4f8] pb-3">
                  <div className="flex items-center gap-2">
                    <Stars rating={selectedReview.rating} />
                    <span className="text-sm font-bold text-[#0f2922]">{selectedReview.rating} / 5 Stars</span>
                  </div>
                  <span className="text-xs text-[#a0aec0]">
                    Submitted on {new Date(selectedReview.submittedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                </div>

                {/* Review Text */}
                <div>
                  <label className="text-xs font-bold text-[#a0aec0] uppercase tracking-wider block mb-1">
                    Review Text
                  </label>
                  <div className="text-sm text-[#0f2922] bg-[#fcfcfc] border border-[#e2e8f0] p-4 rounded-xl whitespace-pre-line leading-relaxed">
                    {selectedReview.body}
                  </div>
                </div>

                {/* Photos */}
                {selectedReview.photoUrls && selectedReview.photoUrls.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-[#a0aec0] uppercase tracking-wider block mb-2">
                      Traveller Photos ({selectedReview.photoUrls.length})
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedReview.photoUrls.map((url, i) => (
                        <div
                          key={i}
                          onClick={() => setActivePhoto(url)}
                          className="aspect-square rounded-xl overflow-hidden border border-[#e2e8f0] cursor-pointer hover:opacity-90 transition shadow-xs"
                        >
                          <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions: strictly Approve/Publish and Hide, NO delete */}
              <div className="p-4 border-t border-[#e2e8f0] bg-[#f7f8f5] flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-2 border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#4a5568] hover:text-[#0f2922] transition cursor-pointer"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  {selectedReview.status !== "published" && (
                    <button
                      disabled={moderatingId === selectedReview.id}
                      onClick={() => handleUpdateStatus(selectedReview.id, "published")}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      Publish Review
                    </button>
                  )}
                  {selectedReview.status !== "hidden" && (
                    <button
                      disabled={moderatingId === selectedReview.id}
                      onClick={() => handleUpdateStatus(selectedReview.id, "hidden")}
                      className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      Hide Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* PHOTO LIGHTBOX */}
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
