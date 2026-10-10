import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { DestinationModal, destToForm, DestFormData } from "@/admin/AdminDestinations";
import { destinationsApi } from "@/api/destinations";
import { clientCache } from "@/utils/clientCache";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import ProgressiveImage from "@/components/ProgressiveImage";

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
  const destTrips = trips.filter((t) => {
    if (!isAdmin && (t.status === "draft" || t.status === "archived")) return false;
    const norm = (s?: string) => (s || "").trim().toLowerCase();
    const destTargets = [
      norm(destId),
      norm(dest?.id),
      norm(dest?.slug),
      norm(dest?.name),
    ].filter(Boolean);

    // 1. Check destinations array
    if (t.destinations && Array.isArray(t.destinations)) {
      if (
        t.destinations.some(
          (d) =>
            destTargets.includes(norm(d.id)) ||
            destTargets.includes(norm(d.slug)) ||
            destTargets.includes(norm(d.name))
        )
      ) {
        return true;
      }
    }

    // 2. Check destinationId
    if (t.destinationId && destTargets.includes(norm(t.destinationId))) {
      return true;
    }

    // 3. Check destination string
    if (t.destination) {
      const tripDest = norm(t.destination);
      if (destTargets.includes(tripDest)) return true;
      if (destTargets.some((target) => target.length >= 3 && (tripDest.includes(target) || target.includes(tripDest)))) {
        return true;
      }
    }

    return false;
  });
  const destReviews = reviews.filter(
    (r) =>
      r.status === "published" &&
      (r.destination === destId ||
        (dest && r.destinationId === dest.id) ||
        (dest?.slug && r.destinationSlug === dest.slug) ||
        (dest && r.destination === dest.name) ||
        (dest && (r.destination === dest.id || r.destination === dest.slug)))
  );

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
      clientCache.invalidate("destinations:active");
      clientCache.invalidate("homepage:content");
      await refreshDestinations({ bypassCache: true });
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
      <SEO
        title={dest?.seoTitle || dest?.name}
        description={dest?.seoDescription || dest?.description || dest?.tagline}
        image={dest?.heroImage}
        keywords={`${dest?.name}, Uttarakhand, ${dest?.category || "valley"}, treks`}
        noindex={isAdmin}
      />
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
        <ProgressiveImage
          src={dest.image}
          alt={dest.name}
          className="w-full h-full object-cover"
          containerClassName="absolute inset-0 w-full h-full"
          priority={true}
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
              <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
                <div>
                  <h2 className="text-[#0f2922] text-2xl" style={{ fontFamily: "var(--font-serif)" }}>Related Packages</h2>
                  <p className="text-[#718096] text-sm mt-1">
                    Handcrafted treks, expeditions, and itineraries in {dest.name}
                  </p>
                </div>
                {destTrips.length > 0 && (
                  <span className="text-xs text-[#718096]">
                    {destTrips.length} {destTrips.length === 1 ? "package" : "packages"} available
                  </span>
                )}
              </div>

              {destTrips.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-5">
                  {destTrips.map((trip) => {
                    const tripUpcoming = tripInstances
                      .filter((inst) => inst.status === "upcoming" && (inst.tripId === trip.id || (trip.slug && inst.tripId === trip.slug)))
                      .sort((a, b) => a.date.localeCompare(b.date));
                    const nearestInstance = tripUpcoming[0];

                    return (
                      <div key={trip.id} className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden hover:shadow-lg transition-shadow group flex flex-col justify-between">
                        <div>
                          <Link to={isAdmin ? `/admin/trips/${trip.slug || trip.id}` : `/trips/${trip.slug || trip.id}`} className="relative h-48 overflow-hidden block">
                            <ProgressiveImage
                              src={trip.image}
                              alt={trip.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              containerClassName="w-full h-full relative"
                              priority={false}
                            />
                            {(trip.badge || trip.category) && (
                              <span className="absolute top-3 left-3 text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full badge-glass-dark text-white z-10">
                                {trip.badge || trip.category}
                              </span>
                            )}
                            {trip.duration && (
                              <span className="absolute bottom-3 right-3 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm z-10">
                                {trip.duration}
                              </span>
                            )}
                          </Link>
                          <div className="p-4">
                            <div className="flex items-center justify-between text-xs text-[#718096] mb-1.5">
                              <span className="text-[#e8622a] font-medium uppercase tracking-wider text-[10px] sm:text-[11px]">{trip.category}</span>
                              {trip.difficulty && (
                                <span className="text-[11px] text-[#718096]">{trip.difficulty}</span>
                              )}
                            </div>
                            <h3 className="text-[#0f2922] text-lg font-semibold mb-1.5 hover:text-[#e8622a] transition-colors line-clamp-1" style={{ fontFamily: "var(--font-serif)" }}>
                              <Link to={isAdmin ? `/admin/trips/${trip.slug || trip.id}` : `/trips/${trip.slug || trip.id}`}>{trip.name}</Link>
                            </h3>
                            <p className="text-[#718096] text-xs leading-relaxed line-clamp-2 mb-3">
                              {trip.shortDescription || trip.overview || "Experience handcrafted trails, local culture, and pristine views."}
                            </p>

                            {/* Departure status indicator */}
                            <div className="pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
                              {tripUpcoming.length > 0 ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {tripUpcoming.length} upcoming {tripUpcoming.length === 1 ? "departure" : "departures"}
                                  {nearestInstance?.displayDate && (
                                    <span className="text-emerald-600/80 hidden sm:inline">· Next: {nearestInstance.displayDate}</span>
                                  )}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#4a5568] bg-[#f7f8f5] border border-[#e2e8f0] px-2.5 py-1 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#a0aec0]" />
                                  Flexible dates · On demand
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="px-4 py-3 border-t border-[#e2e8f0] bg-[#fafafa] flex items-center justify-between mt-auto">
                          <div>
                            <div className="text-[10px] text-[#718096] uppercase tracking-wider font-medium">STARTING PRICE</div>
                            <div className="text-[#0f2922] text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                              ₹{trip.price.toLocaleString("en-IN")}
                              <span className="text-xs font-normal text-[#718096]"> / person</span>
                            </div>
                          </div>
                          <Link
                            to={isAdmin ? `/admin/trips/${trip.slug || trip.id}` : `/trips/${trip.slug || trip.id}`}
                            className="bg-[#0f2922] hover:bg-[#1a4a39] text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
                          >
                            {isAdmin ? "MANAGE TRIP" : "VIEW PACKAGE"}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#f7f8f5] rounded-2xl p-8 text-center border border-[#e2e8f0]">
                  <p className="text-[#4a5568] text-sm mb-4">No packages currently listed for {dest.name}.</p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Link to={isAdmin ? "/admin/trips" : "/trips"} className="bg-[#0f2922] text-white text-sm px-6 py-2.5 rounded-full hover:bg-[#1a4a39] transition-colors inline-block">
                      {isAdmin ? "View All Trips" : "Browse All Trips"}
                    </Link>
                    {!isAdmin && (
                      <button
                        onClick={() => openEnquiryModal(destTrips[0]?.id || dest.slug || dest.id)}
                        className="bg-[#e8622a] text-white text-sm px-6 py-2.5 rounded-full hover:bg-[#d45520] transition-colors inline-block cursor-pointer font-medium"
                      >
                        Plan Custom Trip
                      </button>
                    )}
                  </div>
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
                      <ProgressiveImage
                        src={img}
                        alt={`${dest.name} Gallery ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        containerClassName="w-full h-full relative"
                        priority={false}
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
                    onClick={() => openEnquiryModal(destTrips[0]?.id || dest.slug || dest.id)}
                    className="w-full bg-[#e8622a] hover:bg-[#d45520] text-white py-3 rounded-full text-sm font-semibold transition-colors mb-3 cursor-pointer"
                  >
                    Enquire About {dest.name}
                  </button>
                  <Link to={`/plan?destination=${encodeURIComponent(dest.slug || dest.id)}`} className="w-full border border-white/30 text-white py-3 rounded-full text-sm transition-colors hover:bg-white/10 text-center block">
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
