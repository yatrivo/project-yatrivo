import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { DestinationModal, destToForm, DestFormData } from "@/admin/AdminDestinations";
import { destinationsApi } from "@/api/destinations";
import type { PublicGalleryItem } from "@/api/gallery";
import { clientCache } from "@/utils/clientCache";
import BackLink from "@/components/BackLink";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import ProgressiveImage from "@/components/ProgressiveImage";
import GalleryLightbox from "@/components/GalleryLightbox";

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
  const destReviews = reviews.filter((r) => {
    if (r.status !== "published") return false;
    const norm = (s?: string) => (s || "").trim().toLowerCase();
    const rDest = norm(r.destination);
    const targets = [norm(destId), norm(dest?.id), norm(dest?.slug), norm(dest?.name)].filter(Boolean);

    if (dest && r.destinationId === dest.id) return true;
    if (dest?.slug && norm(r.destinationSlug) === norm(dest.slug)) return true;
    if (rDest && targets.includes(rDest)) return true;
    if (rDest && targets.some((t) => t.length >= 3 && (rDest.includes(t) || t.includes(rDest)))) return true;
    if (
      destTrips.some(
        (t) =>
          (r.tripId && (t.id === r.tripId || t.slug === r.tripId)) ||
          (r.tripName && norm(t.name) === norm(r.tripName))
      )
    ) {
      return true;
    }
    return false;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const displayedReviews = destReviews.slice(0, 3);

  const galleryLightboxItems: PublicGalleryItem[] = useMemo(
    () =>
      (dest?.gallery || []).map((url, idx) => ({
        id: `${dest?.id || "dest"}-gallery-${idx}`,
        title: `${dest?.name || "Destination"} — Photo ${idx + 1}`,
        imageUrl: url,
        thumbnailUrl: url,
        viewerUrl: url,
        originalUrl: url,
        placeholder: null,
        width: null,
        height: null,
        altText: `${dest?.name || "Destination"} Gallery ${idx + 1}`,
        category: dest?.category || "Destination",
        featured: false,
        displayOrder: idx + 1,
        createdAt: new Date().toISOString(),
      })),
    [dest?.id, dest?.name, dest?.category, dest?.gallery]
  );

  useEffect(() => {
    if (location.hash === "#reviews") {
      const timer = setTimeout(() => {
        document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash, dest?.id]);

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
            <BackLink
              to="/admin/destinations"
              className="inline-flex items-center gap-1.5 text-xs text-[#a3bfb5] hover:text-white transition font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Destinations
            </BackLink>
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
      <section className="relative flex items-end h-[60vh] sm:h-[72vh] md:h-[84vh] min-h-[420px] sm:min-h-[480px] md:min-h-[580px] max-h-[840px] overflow-hidden">
        <ProgressiveImage
          src={dest.image}
          alt={dest.name}
          className="w-full h-full object-cover object-center"
          containerClassName="absolute inset-0 w-full h-full"
          priority={true}
        />
        <div className="absolute inset-0 hero-overlay-directional pointer-events-none" />
        <div className="sm:hidden absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
        <div className="relative z-10 w-full sm:absolute sm:bottom-0 sm:left-0 sm:right-0 max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-0 pb-5 sm:pb-8 md:pb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 sm:gap-4 flex-wrap">
            <div className="max-w-2xl">
              <p className="text-[#e8622a] text-[11px] sm:text-xs uppercase tracking-widest font-semibold mb-1 sm:mb-2 text-contrast-subtle">
                Uttarakhand, India
              </p>
              <h1
                className="text-white text-[28px] sm:text-5xl md:text-6xl leading-[1.1] sm:leading-none mb-1.5 sm:mb-2 text-contrast-title drop-shadow-xs"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {dest.name}
              </h1>
              <p className="text-white/95 sm:text-white/90 text-xs sm:text-base leading-snug sm:leading-normal text-contrast-body">
                {dest.tagline} · Best: {dest.season}
              </p>
              {dest.experienceTags && dest.experienceTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2.5 sm:mt-3">
                  {dest.experienceTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] sm:text-xs badge-glass-dark text-white/95 sm:text-white px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium leading-tight whitespace-nowrap shadow-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {!isAdmin && (
              <div className="w-full sm:w-auto flex items-center shrink-0 mt-1 sm:mt-0">
                <button
                  onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}
                  className="w-full sm:w-auto text-center bg-[#e8622a] hover:bg-[#d45520] active:scale-95 text-white px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer btn-primary-elevated shadow-md"
                >
                  Explore Packages ↓
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-7 sm:space-y-10">
            {/* About */}
            <section>
              <h2 className="text-[#0f2922] text-xl sm:text-2xl font-normal mb-2 sm:mb-3 leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
                About {dest.name}
              </h2>
              <p className="text-[#4a5568] text-[13.5px] sm:text-[15px] leading-relaxed max-w-2xl">
                {dest.description}
              </p>
            </section>

            {/* Highlights */}
            <section>
              <h2 className="text-[#0f2922] text-xl sm:text-2xl font-normal mb-2.5 sm:mb-4 leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
                Why Visit
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {dest.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-2.5 sm:gap-3 border border-[#e2e8f0] bg-white rounded-xl p-3 sm:p-4 shadow-2xs">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2.5" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="text-[#4a5568] text-[13px] sm:text-sm leading-snug sm:leading-[1.6]">{h}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Activities */}
            <section>
              <h2 className="text-[#0f2922] text-xl sm:text-2xl font-normal mb-2 sm:mb-3 leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
                Activities & Experiences
              </h2>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {dest.activities.map((a) => (
                  <span key={a} className="bg-[#f7f8f5] border border-[#e2e8f0] text-[#0f2922] text-[11px] sm:text-xs leading-tight font-medium px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full max-w-full">
                    {a}
                  </span>
                ))}
              </div>
            </section>

            {/* Packages */}
            <section id="packages">
              <div className="flex items-center sm:items-end justify-between mb-3.5 sm:mb-5 gap-2">
                <div>
                  <h2 className="text-[#0f2922] text-xl sm:text-2xl font-normal mb-0 leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
                    Related Packages
                  </h2>
                  <p className="hidden sm:block text-[#718096] text-sm mt-1">
                    Handcrafted treks, expeditions, and itineraries in {dest.name}
                  </p>
                </div>
                {destTrips.length > 0 && (
                  <span className="text-xs text-[#718096] shrink-0 font-medium">
                    {destTrips.length} {destTrips.length === 1 ? "package" : "packages"} available
                  </span>
                )}
              </div>

              {destTrips.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  {destTrips.map((trip) => (
                    <div key={trip.id} className="h-full bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden hover:shadow-lg transition-all group flex flex-col justify-between min-w-0 shadow-xs">
                      <div className="flex-1 flex flex-col">
                        <div className="relative aspect-[16/9] sm:aspect-[16/9.5] w-full overflow-hidden block bg-[#f7f8f5]">
                          <Link to={isAdmin ? `/admin/trips/${trip.slug || trip.id}` : `/trips/${trip.slug || trip.id}`} className="block w-full h-full">
                            <ProgressiveImage
                              src={trip.image}
                              alt={trip.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              containerClassName="w-full h-full relative"
                              priority={false}
                            />
                          </Link>
                          {(trip.badge || trip.category) && (
                            <span className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 text-[9.5px] sm:text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full badge-glass-dark text-white z-10 pointer-events-none">
                              {trip.badge || trip.category}
                            </span>
                          )}
                          {trip.duration && (
                            <span className="absolute bottom-2 sm:bottom-2.5 right-2 sm:right-2.5 text-[9.5px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs z-10 pointer-events-none">
                              {trip.duration}
                            </span>
                          )}
                        </div>
                        <div className="px-3.5 pt-2.5 pb-2 sm:px-4 sm:pt-3 sm:pb-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2 text-xs text-[#718096] mb-1">
                              <span className="text-[#e8622a] font-medium uppercase tracking-wider text-[10px] sm:text-[11px] leading-tight">
                                {trip.category}
                              </span>
                              {trip.difficulty && (
                                <span className="text-[10px] sm:text-[11px] text-[#718096] leading-tight">
                                  {trip.difficulty}
                                </span>
                              )}
                            </div>
                            <h3 className="text-[#0f2922] text-[15px] sm:text-[16.5px] leading-snug font-semibold hover:text-[#e8622a] transition-colors line-clamp-2" style={{ fontFamily: "var(--font-serif)" }}>
                              <Link to={isAdmin ? `/admin/trips/${trip.slug || trip.id}` : `/trips/${trip.slug || trip.id}`}>{trip.name}</Link>
                            </h3>
                          </div>
                        </div>
                      </div>

                      <div className="px-3.5 py-2.5 sm:px-4 sm:py-2.5 border-t border-[#f1f5f9] bg-[#fafafa]/80 flex items-center justify-between gap-2 mt-auto">
                        <div className="min-w-0">
                          <div className="text-[8.5px] sm:text-[9.5px] text-[#718096] uppercase tracking-wider font-medium leading-tight mb-0.5">STARTING PRICE</div>
                          <div className="text-[#0f2922] text-[15px] sm:text-base font-bold leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
                            ₹{trip.price.toLocaleString("en-IN")}
                            <span className="text-[10px] sm:text-[11px] font-normal text-[#718096]"> / person</span>
                          </div>
                        </div>
                        <Link
                          to={isAdmin ? `/admin/trips/${trip.slug || trip.id}` : `/trips/${trip.slug || trip.id}`}
                          className="bg-[#0f2922] hover:bg-[#1a4a39] active:scale-95 text-white text-[11px] sm:text-xs font-semibold px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all cursor-pointer shrink-0 whitespace-nowrap"
                        >
                          {isAdmin ? "MANAGE TRIP" : "VIEW PACKAGE"}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#f7f8f5] rounded-2xl p-6 sm:p-8 text-center border border-[#e2e8f0]">
                  <p className="text-[#4a5568] text-[13.5px] sm:text-sm mb-4">No packages currently listed for {dest.name}.</p>
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
                <div className="flex items-center justify-between mb-3.5 sm:mb-4 gap-2">
                  <h2 className="text-[#0f2922] text-[22px] sm:text-2xl font-normal sm:font-light mb-0" style={{ fontFamily: "var(--font-serif)" }}>Photo Gallery</h2>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(0)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#e8622a] hover:text-[#d45520] transition-colors cursor-pointer shrink-0"
                  >
                    <span>View All ({dest.gallery.length})</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
                <div className={`grid grid-cols-2 ${dest.gallery.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-2.5 sm:gap-4`}>
                  {dest.gallery.slice(0, 3).map((img, i) => {
                    const remainingDesktop = dest.gallery.length - 3;
                    const remainingMobile = dest.gallery.length - 2;
                    const isLastDesktop = i === 2 && remainingDesktop > 0;
                    const isLastMobile = i === 1 && remainingMobile > 0;
                    return (
                      <div
                        key={i}
                        role="button"
                        tabIndex={0}
                        onClick={() => setLightboxIndex(i)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setLightboxIndex(i);
                          }
                        }}
                        className={`${i === 2 ? "hidden sm:block " : ""}relative aspect-[4/3] sm:h-48 sm:aspect-auto rounded-xl sm:rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-xs hover:shadow-md transition group cursor-pointer bg-[#f7f8f5]`}
                      >
                        <ProgressiveImage
                          src={img}
                          alt={`${dest.name} Gallery ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          containerClassName="w-full h-full relative"
                          priority={false}
                        />
                        {isLastMobile && (
                          <div className="sm:hidden absolute inset-0 bg-black/50 hover:bg-black/60 transition-colors flex flex-col items-center justify-center text-white p-2 text-center">
                            <span className="text-lg font-bold leading-none">+{remainingMobile}</span>
                            <span className="text-[11px] font-medium mt-1">Photos</span>
                          </div>
                        )}
                        {isLastDesktop ? (
                          <div className="hidden sm:flex absolute inset-0 bg-black/55 hover:bg-black/65 transition-colors flex-col items-center justify-center text-white p-2 text-center">
                            <span className="text-sm sm:text-lg font-bold">+{remainingDesktop}</span>
                            <span className="text-[10px] sm:text-xs font-medium inline-flex items-center gap-1 mt-0.5">
                              View All
                              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </div>
                        ) : (
                          <div className={`${isLastMobile ? "hidden sm:block " : ""}absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Reviews */}
            {destReviews.length > 0 && (
              <section id="reviews" className="scroll-mt-24">
                <div className="flex items-center sm:items-end justify-between mb-3.5 sm:mb-5 gap-2">
                  <div>
                    <h2 className="text-[#0f2922] text-[22px] sm:text-2xl font-normal sm:font-light mb-0" style={{ fontFamily: "var(--font-serif)" }}>Traveller Reviews</h2>
                    <p className="hidden sm:block text-[#718096] text-sm mt-1">
                      Verified stories from explorers who visited {dest.name}
                    </p>
                  </div>
                  <Link
                    to={`/destinations/${dest.slug || dest.id}/reviews`}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#e8622a] hover:text-[#d45520] transition-colors shrink-0"
                  >
                    <span>Show All ({destReviews.length})</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
                <div className="space-y-3 sm:space-y-3.5">
                  {displayedReviews.map((review) => (
                    <Link
                      key={review.id}
                      to={`/destinations/${dest.slug || dest.id}/reviews#review-${review.id}`}
                      className="block bg-white border border-[#e2e8f0] hover:border-[#0f2922]/30 hover:shadow-sm rounded-2xl p-3.5 sm:p-5 transition-all group"
                    >
                      <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-2.5 sm:flex sm:items-start sm:gap-4">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#0f2922] rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm shrink-0">
                          {review.avatar || review.name?.slice(0, 2).toUpperCase() || "TR"}
                        </div>
                        <div className="contents sm:block sm:flex-1 sm:min-w-0">
                          <div className="min-w-0">
                            <div className="flex items-start sm:items-center justify-between gap-2 mb-1 sm:flex-wrap">
                              <div className="min-w-0 flex-1 sm:flex-initial">
                                <span className="block sm:inline text-[#0f2922] font-semibold sm:font-medium text-sm leading-tight sm:leading-normal truncate">{review.name}</span>
                                {review.tripName && (
                                  <span className="block sm:inline text-[#4a5568] text-[11px] sm:text-xs leading-tight sm:leading-normal truncate sm:ml-1.5 mt-0.5 sm:mt-0">
                                    <span className="hidden sm:inline">· </span>{review.tripName}
                                  </span>
                                )}
                              </div>
                              <span className="text-[#718096] text-[11px] sm:text-xs leading-tight sm:leading-normal shrink-0">
                                {review.date && !isNaN(new Date(review.date).getTime())
                                  ? new Date(review.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                                  : review.date}
                              </span>
                            </div>
                            <StarRating rating={review.rating} />
                          </div>
                          <p className="col-span-2 text-[#4a5568] text-[13.5px] sm:text-sm leading-[1.5] sm:leading-relaxed mt-2 italic line-clamp-4 max-sm:mb-0">
                            "{review.text}"
                          </p>
                          {review.photos && review.photos.length > 0 && (
                            <div className="col-span-2 flex items-center gap-2 sm:gap-2.5 mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-[#f1f5f9] overflow-hidden">
                              {review.photos.slice(0, 3).map((photo, idx) => {
                                const remaining = review.photos!.length - 3;
                                const showMoreBadge = idx === 2 && remaining > 0;
                                return (
                                  <div
                                    key={idx}
                                    className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#e2e8f0] shrink-0 bg-[#f7f8f5]"
                                  >
                                    <img
                                      src={photo}
                                      alt={`${review.name} review photo ${idx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                    />
                                    {showMoreBadge && (
                                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-xs font-semibold">
                                        +{remaining}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-3.5 sm:mt-5">
                  <Link
                    to={`/destinations/${dest.slug || dest.id}/reviews`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-[#0f2922] border border-[#0f2922] px-5 sm:px-6 py-2 sm:py-2.5 rounded-full hover:bg-[#0f2922] hover:text-white transition-all cursor-pointer"
                  >
                    Show All Reviews ({destReviews.length})
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-5">
            <div style={{ background: "var(--forest)" }} className="rounded-2xl p-4 sm:p-6 text-white sticky top-24">
              <div className="text-[#e8622a] text-[10px] uppercase tracking-widest leading-tight mb-1 sm:mb-3">
                {isAdmin ? "DESTINATION DETAILS" : "PLAN YOUR VISIT"}
              </div>
              <h3 className="text-white text-[17px] sm:text-xl font-normal sm:font-light leading-snug mb-3 sm:mb-5" style={{ fontFamily: "var(--font-serif)" }}>
                {isAdmin ? `${dest.name} Overview` : `Interested in ${dest.name}?`}
              </h3>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm mb-3.5 sm:mb-6">
                {[
                  { label: "Best Season", val: dest.season },
                  { label: "Region", val: "Uttarakhand, India" },
                  { label: "Packages Available", val: `${destTrips.length || "Custom"} curated trips` },
                  ...(dest.elevation ? [{ label: "Elevation", val: dest.elevation }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center gap-2 border-b border-white/10 pb-2 sm:pb-3 leading-snug">
                    <span className="text-white/60 leading-snug">{row.label}</span>
                    <span className="text-white font-medium text-right leading-snug">{row.val}</span>
                  </div>
                ))}
              </div>
              {isAdmin ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-[#e8622a] hover:bg-[#d45520] text-white py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-colors mb-2 sm:mb-3 cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Destination
                </button>
              ) : (
                <>
                  <button
                    onClick={() => openEnquiryModal(destTrips[0]?.id || dest.slug || dest.id)}
                    className="w-full bg-[#e8622a] hover:bg-[#d45520] active:scale-95 text-white py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold leading-snug transition-all mb-2 sm:mb-2.5 cursor-pointer text-center block"
                  >
                    Enquire About {dest.name}
                  </button>
                  <Link
                    to={`/plan?destination=${encodeURIComponent(dest.slug || dest.id)}`}
                    className="w-full border border-white/30 text-white py-2.5 sm:py-3 rounded-full text-xs sm:text-sm leading-snug transition-all hover:bg-white/10 active:scale-95 text-center block"
                  >
                    Plan a Custom Trip
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Lightbox */}
      {lightboxIndex !== null && galleryLightboxItems.length > 0 && (
        <GalleryLightbox
          items={galleryLightboxItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

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
