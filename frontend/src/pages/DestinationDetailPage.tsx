import { useState } from "react";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < rating ? "#f59e0b" : "#e2e8f0"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

export default function DestinationDetailPage() {
  const { pageParams, navigate, openEnquiryModal, destinations, trips, tripInstances, reviews } = useApp();
  const destId = pageParams.destId || "chopta";
  const dest = destinations.find((d) => d.id === destId) || destinations[0];
  const destTrips = trips.filter((t) => t.destination === destId);
  const destReviews = reviews.filter((r) => r.destination === destId && r.status === "published");

  // Upcoming trip instances for this destination, sorted by date
  const upcomingInstances = tripInstances
    .filter((inst) => inst.status === "upcoming" && destTrips.some((t) => t.id === inst.tripId))
    .sort((a, b) => a.date.localeCompare(b.date));

  const [activeGalleryImg, setActiveGalleryImg] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const allImages = dest ? [dest.gallery[0] ?? dest.image, ...dest.gallery.slice(1)] : [];
  const displayedReviews = showAllReviews ? destReviews : destReviews.slice(0, 3);

  if (!dest) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#4a5568]">
        Destination not found.
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <img src={allImages[activeGalleryImg] ?? dest.image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-2">Uttarakhand, India</p>
              <h1 className="text-white text-4xl sm:text-5xl md:text-6xl mb-2" style={{ fontFamily: "var(--font-serif)" }}>{dest.name}</h1>
              <p className="text-white/80 text-base">{dest.tagline} · Best: {dest.season}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-[#e8622a] hover:bg-[#d45520] text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
              >
                Explore Packages
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Thumbs */}
      <div className="bg-[#0f2922]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto">
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveGalleryImg(i)}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === activeGalleryImg ? "border-[#e8622a]" : "border-transparent opacity-60 hover:opacity-90"}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* About */}
            <section>
              <h2 className="text-[#0f2922] text-2xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>About {dest.name}</h2>
              <p className="text-[#4a5568] text-sm leading-relaxed">{dest.description}</p>
            </section>

            {/* Highlights */}
            <section>
              <h2 className="text-[#0f2922] text-2xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>Why Visit</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dest.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-3 border border-[#e2e8f0] rounded-xl p-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2.5" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="text-[#4a5568] text-sm">{h}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Activities */}
            <section>
              <h2 className="text-[#0f2922] text-2xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>Activities & Experiences</h2>
              <div className="flex flex-wrap gap-2">
                {dest.activities.map((a) => (
                  <span key={a} className="bg-[#f7f8f5] border border-[#e2e8f0] text-[#0f2922] text-sm px-4 py-2 rounded-full">{a}</span>
                ))}
              </div>
            </section>

            {/* Packages */}
            <section id="packages">
              <h2 className="text-[#0f2922] text-2xl mb-5" style={{ fontFamily: "var(--font-serif)" }}>Upcoming Departures</h2>
              {upcomingInstances.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {upcomingInstances.map((inst) => {
                    const trip = trips.find((t) => t.id === inst.tripId);
                    if (!trip) return null;
                    const spotsPercent = Math.round((inst.spotsLeft / inst.spotsTotal) * 100);
                    const spotsLow = inst.spotsLeft <= 3;
                    return (
                      <div key={inst.id} className="border border-[#e2e8f0] rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-40 overflow-hidden relative">
                          <img src={trip.image} alt={trip.name} className="w-full h-full object-cover" />
                          <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${spotsLow ? "bg-red-500 text-white" : "bg-[#0f2922]/80 text-white backdrop-blur-sm"}`}>
                            {inst.spotsLeft} spots left
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="text-[#0f2922] font-medium mb-1" style={{ fontFamily: "var(--font-serif)" }}>{trip.name}</div>
                          <div className="flex items-center justify-between text-sm mb-3">
                            <span className="text-[#4a5568]">{inst.displayDate}</span>
                            <span className="text-[#e8622a] font-semibold">₹{inst.price.toLocaleString("en-IN")} / person</span>
                          </div>
                          <div className="w-full bg-[#e2e8f0] rounded-full h-1 mb-3">
                            <div className="bg-[#e8622a] h-1 rounded-full transition-all" style={{ width: `${100 - spotsPercent}%` }} />
                          </div>
                          <button
                            onClick={() => navigate("trip-detail", { tripId: inst.tripId })}
                            className="w-full bg-[#0f2922] hover:bg-[#1a4a39] text-white text-sm py-2.5 rounded-full font-medium transition-colors"
                          >
                            VIEW TRIP
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#f7f8f5] rounded-2xl p-8 text-center">
                  <p className="text-[#4a5568] text-sm mb-4">No upcoming trips scheduled. Check back soon.</p>
                  <button onClick={() => navigate("trips")} className="bg-[#0f2922] text-white text-sm px-6 py-2.5 rounded-full hover:bg-[#1a4a39] transition-colors">
                    Browse All Trips
                  </button>
                </div>
              )}
            </section>

            {/* Reviews */}
            {destReviews.length > 0 && (
              <section>
                <h2 className="text-[#0f2922] text-2xl mb-5" style={{ fontFamily: "var(--font-serif)" }}>Traveller Reviews</h2>
                <div className="space-y-4">
                  {displayedReviews.map((review) => (
                    <div key={review.id} className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-[#0f2922] rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                          {review.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                            <div>
                              <span className="text-[#0f2922] font-medium text-sm">{review.name}</span>
                              <span className="text-[#4a5568] text-xs ml-2">· {review.tripName}</span>
                            </div>
                            <span className="text-[#4a5568] text-xs shrink-0">{new Date(review.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                          </div>
                          <StarRating rating={review.rating} />
                          <p className="text-[#4a5568] text-sm leading-relaxed mt-2 italic">"{review.text}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {destReviews.length > 3 && !showAllReviews && (
                  <button
                    onClick={() => setShowAllReviews(true)}
                    className="mt-4 text-sm text-[#0f2922] border border-[#0f2922] px-5 py-2 rounded-full hover:bg-[#0f2922] hover:text-white transition-all"
                  >
                    View All {destReviews.length} Reviews
                  </button>
                )}
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div style={{ background: "var(--forest)" }} className="rounded-2xl p-6 text-white sticky top-24">
              <div className="text-[#e8622a] text-[10px] uppercase tracking-widest mb-3">PLAN YOUR VISIT</div>
              <h3 className="text-white text-xl mb-5" style={{ fontFamily: "var(--font-serif)" }}>Interested in {dest.name}?</h3>
              <div className="space-y-3 text-sm mb-6">
                {[
                  { label: "Best Season", val: dest.season },
                  { label: "Region", val: "Uttarakhand, India" },
                  { label: "Packages Available", val: `${destTrips.length || "Custom"} curated trips` },
                  ...(dest.elevation ? [{ label: "Elevation", val: dest.elevation }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex justify-between border-b border-white/10 pb-3">
                    <span className="text-white/60">{row.label}</span>
                    <span className="text-white font-medium">{row.val}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => destTrips[0] ? openEnquiryModal(destTrips[0].id) : navigate("plan")}
                className="w-full bg-[#e8622a] hover:bg-[#d45520] text-white py-3 rounded-full text-sm font-semibold transition-colors mb-3"
              >
                Enquire About {dest.name}
              </button>
              <button onClick={() => navigate("plan")} className="w-full border border-white/30 text-white py-3 rounded-full text-sm transition-colors hover:bg-white/10">
                Plan a Custom Trip
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
