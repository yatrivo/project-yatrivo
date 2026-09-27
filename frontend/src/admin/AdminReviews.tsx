import { useState } from "react";
import { useApp } from "@/context/AppContext";

const STATUS_BADGE: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  hidden: "bg-gray-100 text-gray-600",
};

const TABS = ["All", "published", "pending", "hidden"] as const;
type TabValue = (typeof TABS)[number];

const RATING_OPTIONS = [0, 5, 4, 3, 2, 1];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const { reviews, setReviews, showToast, destinations } = useApp();
  const [tab, setTab] = useState<TabValue>("All");
  const [search, setSearch] = useState("");
  const [destFilter, setDestFilter] = useState("All");
  const [ratingFilter, setRatingFilter] = useState(0);

  const filtered = reviews.filter((r) => {
    const matchTab = tab === "All" || r.status === tab;
    const destObj = destinations.find((d) => d.id === destFilter || d.slug === destFilter);
    const matchDest =
      destFilter === "All" ||
      r.destination === destFilter ||
      (destObj && (r.destination === destObj.name || r.destination === destObj.id));
    const matchRating = ratingFilter === 0 || r.rating === ratingFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.tripName.toLowerCase().includes(q) || r.text?.toLowerCase().includes(q);
    return matchTab && matchDest && matchRating && matchSearch;
  });

  const updateStatus = (id: string, status: "published" | "hidden" | "pending") => {
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  };

  const deleteReview = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    showToast("Review deleted.", "error");
  };

  const tabLabels: Record<TabValue, string> = {
    All: "All",
    published: "Published",
    pending: "Pending",
    hidden: "Hidden",
  };

  const tabCounts: Record<TabValue, number> = {
    All: reviews.length,
    published: reviews.filter((r) => r.status === "published").length,
    pending: reviews.filter((r) => r.status === "pending").length,
    hidden: reviews.filter((r) => r.status === "hidden").length,
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Reviews</h2>
          <p className="text-[#718096] text-sm mt-0.5">{reviews.length} total reviews</p>
        </div>
      </div>

      {/* Tabs + search row */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex gap-1 bg-[#f7f8f5] rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition whitespace-nowrap ${tab === t ? "bg-white text-[#0f2922] shadow-sm" : "text-[#718096] hover:text-[#0f2922]"}`}
            >
              {tabLabels[t]}
              <span className={`ml-1.5 text-xs ${tab === t ? "text-[#718096]" : "text-[#a0aec0]"}`}>{tabCounts[t]}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap sm:ml-auto">
          {/* Destination filter */}
          <select
            value={destFilter}
            onChange={(e) => setDestFilter(e.target.value)}
            className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none bg-white capitalize"
          >
            <option value="All">All Destinations</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id} className="capitalize">{d.name}</option>
            ))}
          </select>
          {/* Rating filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(Number(e.target.value))}
            className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
          >
            {RATING_OPTIONS.map((r) => (
              <option key={r} value={r}>{r === 0 ? "All Ratings" : `${r} Star${r !== 1 ? "s" : ""}`}</option>
            ))}
          </select>
          {/* Search */}
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviews..."
              className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm w-48 focus:outline-none focus:border-[#0f2922]"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase font-medium border-b border-[#e2e8f0]">
                <th className="px-4 py-3 text-left">Reviewer</th>
                <th className="px-4 py-3 text-left">Rating</th>
                <th className="px-4 py-3 text-left">Review</th>
                <th className="px-4 py-3 text-left">Trip</th>
                <th className="px-4 py-3 text-left">Destination</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1]">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[#f7f8f5] transition">
                  <td className="px-4 py-3 font-medium text-[#0f2922]">{r.name}</td>
                  <td className="px-4 py-3"><Stars rating={r.rating} /></td>
                  <td className="px-4 py-3 text-[#718096] max-w-[240px]">
                    <p className="line-clamp-2">{r.text}</p>
                    {r.photos && r.photos.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5">
                        {r.photos.map((photoUrl, pIdx) => (
                          <a
                            key={pIdx}
                            href={photoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block w-8 h-8 rounded border border-[#e2e8f0] overflow-hidden hover:opacity-80 transition"
                            title="View customer photo"
                          >
                            <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#4a5568] text-xs">{r.tripName}</td>
                  <td className="px-4 py-3 text-[#718096] text-xs capitalize">
                    {destinations.find((d) => d.id === r.destination || d.slug === r.destination)?.name || (r.destination && r.destination.length > 30 ? "Uttarakhand" : r.destination)}
                  </td>
                  <td className="px-4 py-3 text-[#718096] text-xs">{r.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium rounded-full px-2.5 py-1 capitalize ${STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {r.status !== "published" && (
                        <button
                          onClick={() => { updateStatus(r.id, "published"); showToast("Review published.", "success"); }}
                          className="text-green-600 hover:underline text-xs"
                        >
                          Approve
                        </button>
                      )}
                      {r.status === "published" && (
                        <button
                          onClick={() => { updateStatus(r.id, "hidden"); showToast("Review hidden.", "info"); }}
                          className="text-[#718096] hover:underline text-xs"
                        >
                          Hide
                        </button>
                      )}
                      {r.status !== "hidden" && r.status !== "published" && (
                        <button
                          onClick={() => { updateStatus(r.id, "hidden"); showToast("Review rejected.", "info"); }}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Reject
                        </button>
                      )}
                      <button onClick={() => deleteReview(r.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[#a0aec0]">No reviews found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
