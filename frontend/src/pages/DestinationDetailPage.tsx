import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { DestinationModal, destToForm, DestFormData } from "@/admin/AdminDestinations";
import { destinationsApi } from "@/api/destinations";
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

interface DestinationDetailPageProps {
  adminMode?: boolean;
}

export default function DestinationDetailPage({ adminMode }: DestinationDetailPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const isAdmin = Boolean(adminMode || location.pathname.startsWith("/admin/"));
  const { pageParams, openEnquiryModal, destinations, refreshDestinations, showToast, trips, tripInstances, reviews } = useApp();
  const destId = slug || pageParams.destId || "chopta";
  const dest = destinations.find((d) => d.id.toLowerCase() === destId.toLowerCase() || (d.slug && d.slug.toLowerCase() === destId.toLowerCase())) || destinations.find((d) => d.id === "chopta") || destinations[0];
  const destTrips = trips.filter(
    (t) =>
      (!isAdmin ? t.status !== "draft" && t.status !== "archived" : true) &&
      ((t.destinations && t.destinations.some((d) => d.id === destId || d.slug === destId || (dest && (d.id === dest.id || d.slug === dest.slug)))) ||
      t.destination === destId ||
      (dest && (t.destination === dest.id || t.destination === dest.slug)))
  );
  const destReviews = reviews.filter((r) => (r.destination === destId || (dest && (r.destination === dest.id || r.destination === dest.slug))) && r.status === "published");

  // Upcoming trip instances for this destination, sorted by date
  const upcomingInstances = tripInstances
    .filter((inst) => inst.status === "upcoming" && destTrips.some((t) => t.id === inst.tripId))
    .sort((a, b) => a.date.localeCompare(b.date));

  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const displayedReviews = showAllReviews ? destReviews : destReviews.slice(0, 3);

  const handleSave = async (form: DestFormData) => {
    if (!dest) return;
    setIsSaving(true);
    try {
      await destinationsApi.update(dest.id, {
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        category: form.category,
        season: form.season,
        bestTime: form.bestTime,
        elevation: form.elevation || undefined,
        image: form.image,
        coverMediaId: form.coverMediaId,
        gallery: form.gallery,
        galleryMediaIds: form.galleryMediaIds,
        highlights: form.highlights,
        activities: form.activities,
        experienceTags: form.experienceTags,
      });
      await refreshDestinations();
      setIsEditing(false);
      showToast(`${form.name} updated successfully.`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update destination";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!dest) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#4a5568]">
        Destination not found.
      </div>
    );
  }

  return (
    <div>
      {/* Admin Mode Bar */}
      {isAdmin && (
        <div className="bg-[#0f2922] text-white px-4 sm:px-6 py-3 border-b border-white/10 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/destinations"
              className="inline-flex items-center gap-1.5 text-xs text-[#a3bfb5] hover:text-white transition font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Destinations
            </Link>
            <span className="text-white/20">|</span>
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-semibold px-2 py-0.5 rounded">
              Admin Preview Mode
            </span>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Destination
          </button>
        </div>
      )}

      {/* Hero with Single Cover Image */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <img
          src={dest.image}
          alt={dest.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay-directional" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-2 text-contrast-subtle">Uttarakhand, India</p>
              <h1 className="text-white text-4xl sm:text-5xl md:text-6xl mb-2 text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>{dest.name}</h1>
              <p className="text-white/90 text-base text-contrast-body">{dest.tagline} · Best: {dest.season}</p>
              {dest.experienceTags && dest.experienceTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {dest.experienceTags.map((tag) => (
                    <span key={tag} className="text-xs badge-glass-dark text-white px-3 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {!isAdmin && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}
                  className="bg-[#e8622a] hover:bg-[#d45520] text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer btn-primary-elevated"
                >
                  Explore Packages
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

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
                          <span className={`absolute top-2.5 right-2.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            spotsLow
                              ? "bg-red-950/40 text-red-200 border border-red-400/30 backdrop-blur-md"
                              : "bg-black/40 text-white/90 border border-white/15 backdrop-blur-md"
                          }`}>
                            {inst.spotsLeft} spots left
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="text-[#0f2922] font-medium mb-1 line-clamp-1" style={{ fontFamily: "var(--font-serif)" }}>{trip.name}</div>
                          <div className="flex items-center justify-between text-sm mb-3">
                            <span className="text-[#4a5568]">{inst.displayDate}</span>
                            <span className="text-[#e8622a] font-semibold">₹{inst.price.toLocaleString("en-IN")} / person</span>
                          </div>
                          <div className="w-full bg-[#e2e8f0] rounded-full h-1 mb-3">
                            <div className="bg-[#e8622a] h-1 rounded-full transition-all" style={{ width: `${100 - spotsPercent}%` }} />
                          </div>
                          <Link
                            to={isAdmin ? `/admin/trips/${trip.slug || trip.id}` : `/trips/${trip.slug || trip.id}`}
                            className="w-full bg-[#0f2922] hover:bg-[#1a4a39] text-white text-sm py-2.5 rounded-full font-medium transition-colors block text-center"
                          >
                            {isAdmin ? "MANAGE TRIP" : "VIEW TRIP"}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#f7f8f5] rounded-2xl p-8 text-center">
                  <p className="text-[#4a5568] text-sm mb-4">No upcoming trips scheduled. Check back soon.</p>
                  <Link to={isAdmin ? "/admin/trips" : "/trips"} className="bg-[#0f2922] text-white text-sm px-6 py-2.5 rounded-full hover:bg-[#1a4a39] transition-colors inline-block">
                    {isAdmin ? "View All Trips" : "Browse All Trips"}
                  </Link>
                </div>
              )}
            </section>

            {/* Photo Gallery (Separate from Cover Image) */}
            {dest.gallery && dest.gallery.length > 0 && (
              <section id="gallery">
                <h2 className="text-[#0f2922] text-2xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>Photo Gallery</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dest.gallery.map((img, i) => (
                    <div key={i} className="h-56 rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-sm hover:shadow-md transition group">
                      <img
                        src={img}
                        alt={`${dest.name} Gallery ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

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
                    className="mt-4 text-sm text-[#0f2922] border border-[#0f2922] px-5 py-2 rounded-full hover:bg-[#0f2922] hover:text-white transition-all cursor-pointer"
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
              <div className="text-[#e8622a] text-[10px] uppercase tracking-widest mb-3">
                {isAdmin ? "DESTINATION DETAILS" : "PLAN YOUR VISIT"}
              </div>
              <h3 className="text-white text-xl mb-5" style={{ fontFamily: "var(--font-serif)" }}>
                {isAdmin ? `${dest.name} Overview` : `Interested in ${dest.name}?`}
              </h3>
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
              {isAdmin ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-[#e8622a] hover:bg-[#d45520] text-white py-3 rounded-full text-sm font-semibold transition-colors mb-3 cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Destination
                </button>
              ) : (
                <>
                  <button
                    onClick={() => destTrips[0] ? openEnquiryModal(destTrips[0].id) : navigate("plan")}
                    className="w-full bg-[#e8622a] hover:bg-[#d45520] text-white py-3 rounded-full text-sm font-semibold transition-colors mb-3 cursor-pointer"
                  >
                    Enquire About {dest.name}
                  </button>
                  <Link to="/plan" className="w-full border border-white/30 text-white py-3 rounded-full text-sm transition-colors hover:bg-white/10 text-center block">
                    Plan a Custom Trip
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal for Admin Mode */}
      {isAdmin && isEditing && (
        <DestinationModal
          title={`Edit — ${dest.name}`}
          initial={destToForm(dest)}
          isSaving={isSaving}
          onClose={() => setIsEditing(false)}
          onSave={handleSave}
        />
      )}

      {!isAdmin && <Footer />}
    </div>
  );
}
