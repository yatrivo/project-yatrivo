import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import BackLink from "@/components/BackLink";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import SiteImage from "@/components/SiteImage";
import ProgressiveImage from "@/components/ProgressiveImage";
import { SITE_ASSET_KEYS } from "@/api/siteAssets";
import { Review } from "@/data/reviews";

function StarRating({ rating = 5, size = 14 }: { rating?: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < rating ? "#f59e0b" : "#e2e8f0"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { reviews, destinations, trips } = useApp();

  const initialDestFilter = slug || searchParams.get("destination") || "all";
  const [selectedDestSlug, setSelectedDestSlug] = useState<string>(initialDestFilter);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    const nextFilter = slug || searchParams.get("destination") || "all";
    setSelectedDestSlug(nextFilter);
  }, [slug, searchParams]);

  const publishedReviews = useMemo(
    () => reviews.filter((r) => r.status === "published"),
    [reviews]
  );

  const norm = (s?: string) => (s || "").trim().toLowerCase();

  // Helper to resolve which destination a review belongs to
  const resolveReviewDestination = (r: Review) => {
    const directDest = destinations.find(
      (d) =>
        (r.destinationId && d.id === r.destinationId) ||
        (r.destinationSlug && (norm(d.slug) === norm(r.destinationSlug) || norm(d.id) === norm(r.destinationSlug))) ||
        (r.destination &&
          (norm(d.id) === norm(r.destination) ||
            norm(d.slug) === norm(r.destination) ||
            norm(d.name) === norm(r.destination) ||
            (norm(r.destination).length >= 3 &&
              (norm(d.name).includes(norm(r.destination)) || norm(r.destination).includes(norm(d.name))))))
    );
    if (directDest) return directDest;

    const matchedTrip = trips.find(
      (t) =>
        (r.tripId && (t.id === r.tripId || t.slug === r.tripId)) ||
        (r.tripName && norm(t.name) === norm(r.tripName))
    );
    if (matchedTrip) {
      if (matchedTrip.destinations && matchedTrip.destinations.length > 0) {
        const first = matchedTrip.destinations[0];
        const found = destinations.find((d) => d.id === first.id || (first.slug && d.slug === first.slug));
        if (found) return found;
      }
      const tripDest = destinations.find(
        (d) =>
          (matchedTrip.destinationId && d.id === matchedTrip.destinationId) ||
          (matchedTrip.destination &&
            (norm(d.id) === norm(matchedTrip.destination) ||
              norm(d.slug) === norm(matchedTrip.destination) ||
              norm(d.name) === norm(matchedTrip.destination)))
      );
      if (tripDest) return tripDest;
    }
    return undefined;
  };

  const activeDest = useMemo(() => {
    if (!selectedDestSlug || selectedDestSlug === "all") return undefined;
    return destinations.find(
      (d) =>
        norm(d.id) === norm(selectedDestSlug) ||
        norm(d.slug) === norm(selectedDestSlug) ||
        norm(d.name) === norm(selectedDestSlug)
    );
  }, [destinations, selectedDestSlug]);

  const filteredReviews = useMemo(() => {
    if (!selectedDestSlug || selectedDestSlug === "all") return publishedReviews;
    return publishedReviews.filter((r) => {
      const resolved = resolveReviewDestination(r);
      if (activeDest && resolved) {
        return resolved.id === activeDest.id;
      }
      const target = norm(selectedDestSlug);
      return (
        norm(r.destination) === target ||
        norm(r.destinationSlug) === target ||
        norm(r.destinationId) === target ||
        (target.length >= 3 && norm(r.destination).includes(target))
      );
    });
  }, [publishedReviews, selectedDestSlug, activeDest, destinations, trips]);

  // Destinations that have at least one published review
  const destinationsWithReviews = useMemo(() => {
    const map = new Map<string, { id: string; slug: string; name: string; count: number }>();
    for (const r of publishedReviews) {
      const d = resolveReviewDestination(r);
      if (d) {
        const key = d.id;
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(key, { id: d.id, slug: d.slug || d.id, name: d.name, count: 1 });
        }
      }
    }
    return Array.from(map.values());
  }, [publishedReviews, destinations, trips]);

  const averageRating = useMemo(() => {
    const list = filteredReviews.length > 0 ? filteredReviews : publishedReviews;
    if (list.length === 0) return "4.9";
    const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    return (sum / list.length).toFixed(1);
  }, [filteredReviews, publishedReviews]);

  // Scroll to specific review card if hash is #review-<id>
  useEffect(() => {
    if (location.hash.startsWith("#review-")) {
      const elId = location.hash.slice(1);
      const timer = setTimeout(() => {
        const el = document.getElementById(elId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.hash, filteredReviews.length]);

  const handleSelectDest = (destSlugValue: string) => {
    setSelectedDestSlug(destSlugValue);
    if (!slug) {
      if (destSlugValue === "all") {
        setSearchParams({});
      } else {
        setSearchParams({ destination: destSlugValue });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8f5] flex flex-col">
      <SEO
        title={activeDest ? `${activeDest.name} Traveller Reviews` : "Traveler Stories & Reviews"}
        description={
          activeDest
            ? `Read authentic verified traveller reviews and stories from explorers who visited ${activeDest.name} with Yatrivo.`
            : "Read authentic verified reviews and traveler stories from adventurers who explored Uttarakhand's peaks, sacred trails, and rivers with Yatrivo."
        }
        keywords="yatrivo reviews, uttarakhand trek reviews, traveler testimonials, chopta tungnath review, kedarnath tour reviews"
      />

      {/* Hero */}
      <section className="relative h-[44vh] sm:h-[52vh] md:h-[84vh] min-h-[320px] sm:min-h-[360px] md:min-h-[580px] max-h-[840px] flex items-end pt-20 sm:pt-0 pb-5 sm:pb-10 md:pb-12 overflow-hidden">
        {activeDest?.image ? (
          <ProgressiveImage
            src={activeDest.image}
            alt={activeDest.name}
            className="w-full h-full object-cover"
            containerClassName="absolute inset-0 w-full h-full"
            priority={true}
          />
        ) : (
          <SiteImage
            assetKey={SITE_ASSET_KEYS.REVIEWS_HERO}
            alt="Group of travelers around campfire in mountains"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 hero-overlay-directional" />
        <div className="sm:hidden absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-black/70 via-black/35 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          {activeDest && (
            <BackLink
              to={`/destinations/${activeDest.slug || activeDest.id}#reviews`}
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-sm text-white/95 sm:text-white/90 hover:text-white bg-black/40 sm:bg-black/35 backdrop-blur-sm px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full mb-2.5 sm:mb-4 transition-colors"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to {activeDest.name}
            </BackLink>
          )}
          <div className="text-[#e8622a] text-[11px] sm:text-xs uppercase tracking-widest font-semibold mb-1 sm:mb-2 text-contrast-subtle">
            {activeDest ? `${activeDest.name} · VERIFIED REVIEWS` : "AUTHENTIC TESTIMONIALS"}
          </div>
          <h1
            className="text-white text-[26px] sm:text-5xl leading-[1.12] sm:leading-none mb-1.5 sm:mb-2.5 text-contrast-title"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {activeDest ? `${activeDest.name} Traveller Reviews` : "Wanderers Speak From Their Hearts"}
          </h1>
          <p className="text-white/95 sm:text-white/90 text-[13px] sm:text-base max-w-xl leading-snug sm:leading-relaxed text-contrast-body max-sm:mb-0">
            {activeDest
              ? `Honest, unfiltered experiences from travellers who explored ${activeDest.name} with our local guides.`
              : "Read honest, verified stories from explorers who have experienced the pristine Himalayas with our mindful travel collective."}
          </p>
        </div>
      </section>

      {/* Rating Summary & Destination Filters */}
      <section className="py-3.5 sm:py-8 bg-white border-b border-[#e2e8f0] sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-[28px] sm:text-4xl font-bold text-[#0f2922] leading-none" style={{ fontFamily: "var(--font-serif)" }}>
                  {averageRating}
                </span>
                <span className="text-xs text-[#718096]">/ 5</span>
              </div>
              <div>
                <StarRating rating={Math.round(Number(averageRating))} size={15} />
                <div className="text-[#4a5568] text-[11.5px] sm:text-xs leading-tight sm:leading-normal mt-0.5">
                  {filteredReviews.length} {filteredReviews.length === 1 ? "verified review" : "verified reviews"}
                  {activeDest ? ` for ${activeDest.name}` : ""}
                </div>
              </div>
            </div>

            {/* Mobile-friendly horizontal scrollable filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {slug ? (
                <>
                  <BackLink
                    to={`/destinations/${activeDest?.slug || slug}#reviews`}
                    className="shrink-0 px-3 sm:px-4 py-1.5 rounded-full text-[11.5px] sm:text-sm font-medium border border-[#e2e8f0] text-[#4a5568] hover:border-[#0f2922] hover:text-[#0f2922] transition-all"
                  >
                    ← {activeDest?.name || "Destination"} Page
                  </BackLink>
                  <Link
                    to="/reviews"
                    className="shrink-0 px-3 sm:px-4 py-1.5 rounded-full text-[11.5px] sm:text-sm font-medium bg-[#0f2922] text-white border border-[#0f2922] transition-all"
                  >
                    View All Destinations ({publishedReviews.length})
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSelectDest("all")}
                    className={`shrink-0 px-3 sm:px-4 py-1.5 rounded-full text-[11.5px] sm:text-sm font-medium transition-all border cursor-pointer ${
                      selectedDestSlug === "all"
                        ? "bg-[#0f2922] text-white border-[#0f2922]"
                        : "border-[#e2e8f0] text-[#4a5568] hover:border-[#0f2922] hover:text-[#0f2922]"
                    }`}
                  >
                    All Destinations ({publishedReviews.length})
                  </button>
                  {destinationsWithReviews.map((d) => {
                    const isSelected =
                      norm(selectedDestSlug) === norm(d.slug) || norm(selectedDestSlug) === norm(d.id);
                    return (
                      <button
                        key={d.id}
                        onClick={() => handleSelectDest(d.slug)}
                        className={`shrink-0 px-3 sm:px-4 py-1.5 rounded-full text-[11.5px] sm:text-sm font-medium transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-[#0f2922] text-white border-[#0f2922]"
                            : "border-[#e2e8f0] text-[#4a5568] hover:border-[#0f2922] hover:text-[#0f2922]"
                        }`}
                      >
                        {d.name} ({d.count})
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Full Reviews List */}
      <section className="py-6 sm:py-12 flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {filteredReviews.length > 0 ? (
            <div className="space-y-3.5 sm:space-y-5">
              {filteredReviews.map((r) => {
                const reviewDest = resolveReviewDestination(r);
                const formattedDate =
                  r.date && !isNaN(new Date(r.date).getTime())
                    ? new Date(r.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : r.date;

                return (
                  <article
                    key={r.id}
                    id={`review-${r.id}`}
                    className="bg-white rounded-2xl p-4 sm:p-7 border border-[#e2e8f0] shadow-2xs transition-all scroll-mt-28"
                  >
                    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 sm:flex sm:items-start sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0f2922] rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-base shrink-0">
                        {r.avatar || r.name?.slice(0, 2).toUpperCase() || "TR"}
                      </div>
                      <div className="contents sm:block sm:flex-1 sm:min-w-0">
                        <div className="min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 mb-0.5 sm:mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <h3 className="text-[#0f2922] font-semibold text-[15px] sm:text-base leading-snug mb-0">{r.name}</h3>
                              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] leading-tight text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-full font-medium shrink-0">
                                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                Verified Traveller
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-0.5 sm:mt-1 text-[11.5px] sm:text-xs leading-snug">
                              {r.tripName && (
                                <span className="text-[#e8622a] font-medium">{r.tripName}</span>
                              )}
                              {reviewDest && (
                                <>
                                  <span className="text-[#cbd5e1]">·</span>
                                  <Link
                                    to={`/destinations/${reviewDest.slug || reviewDest.id}`}
                                    className="text-[#4a5568] hover:text-[#0f2922] underline underline-offset-2 transition-colors"
                                  >
                                    {reviewDest.name}
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 mt-1 sm:mt-0">
                            <StarRating rating={r.rating} size={14} />
                            <span className="text-[#718096] text-[11px] sm:text-xs leading-tight">{formattedDate}</span>
                          </div>
                        </div>

                        <p className="col-span-2 text-[#2d3748] text-[13.5px] sm:text-[15px] leading-[1.5] sm:leading-relaxed mt-2.5 sm:mt-3 max-sm:mb-0 whitespace-pre-line">
                          "{r.text}"
                        </p>

                        {r.photos && r.photos.length > 0 && (
                          <div className="col-span-2 flex flex-wrap gap-2 sm:gap-2.5 mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-[#f1f5f9]">
                            {r.photos.map((photo, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setLightboxImg(photo)}
                                className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-[#e2e8f0] hover:opacity-90 transition cursor-pointer shrink-0"
                              >
                                <img
                                  src={photo}
                                  alt={`${r.name} review photo ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 sm:p-12 text-center border border-[#e2e8f0]">
              <p className="text-[#4a5568] text-sm sm:text-base mb-4">
                No reviews found for this selection yet.
              </p>
              <Link
                to="/reviews"
                onClick={() => handleSelectDest("all")}
                className="inline-block bg-[#0f2922] text-white text-xs sm:text-sm px-5 sm:px-6 py-2.5 rounded-full hover:bg-[#1a4a39] transition-colors"
              >
                View All Reviews
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox for review photos */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition cursor-pointer"
            aria-label="Close photo preview"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxImg}
            alt="Review photo full view"
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* CTA */}
      <section className="py-8 sm:py-16 bg-white border-t border-[#e2e8f0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-[#e8622a] text-[11px] sm:text-xs uppercase tracking-widest font-medium mb-1.5 sm:mb-2">THE COMMUNITY GROWS</div>
          <h2 className="text-[#0f2922] text-[22px] sm:text-4xl font-normal sm:font-light leading-snug sm:leading-tight mb-2.5 sm:mb-4" style={{ fontFamily: "var(--font-serif)" }}>
            Ready to Create Your Own Story?
          </h2>
          <p className="text-[#4a5568] text-[13.5px] sm:text-sm leading-relaxed mb-5 sm:mb-6 max-w-xl mx-auto">
            Explore Uttarakhand's valleys, alpine meadows, and sacred trails with small groups and certified local guides.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 flex-wrap">
            {activeDest ? (
              <Link
                to={`/destinations/${activeDest.slug || activeDest.id}`}
                className="w-full sm:w-auto max-w-[260px] sm:max-w-none inline-block bg-[#0f2922] hover:bg-[#1a4a39] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-colors"
              >
                Explore {activeDest.name} Packages
              </Link>
            ) : null}
            <Link
              to="/plan"
              className="w-full sm:w-auto max-w-[260px] sm:max-w-none inline-block bg-[#e8622a] hover:bg-[#d45520] text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-colors"
            >
              PLAN YOUR ADVENTURE
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
