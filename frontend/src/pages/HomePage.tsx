import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useApp, type CarouselSlide } from "@/context/AppContext";
import type { TripInstance } from "@/data/trips";
import Footer from "@/components/Footer";
import SiteImage from "@/components/SiteImage";
import ProgressiveImage from "@/components/ProgressiveImage";
import { SITE_ASSET_KEYS } from "@/api/siteAssets";
import logoImg from "@/imports/logo.png";

const Stars = ({ rating = 5 }: { rating?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < rating ? "#f59e0b" : "#e2e8f0"}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ))}
  </div>
);

export default function HomePage() {
  const { navigate, homepageContent, tripInstances, trips, openEnquiryModal, reviews, destinations, siteSettings } = useApp();
  const {
    heroImages = [],
    carouselSlides = [],
    featuredReviewIds = [],
    featuredDestIds = [],
    whyUsTitle = "",
    whyUsDesc = "",
    heroTitle = "",
    heroSubtitle = "",
  } = homepageContent || {};

  // Featured destinations from context
  const featuredDestinations = (() => {
    if (featuredDestIds && featuredDestIds.length > 0) {
      const list = featuredDestIds
        .map((id) => destinations.find((d) => d.id === id || d.slug === id))
        .filter(Boolean) as typeof destinations;
      if (list.length > 0) return list;
    }
    return destinations.slice(0, 3);
  })();

  // Featured reviews from context
  const publishedReviews = reviews.filter((r) => r.status === "published");
  const featuredReviews = (() => {
    if (featuredReviewIds && featuredReviewIds.length > 0) {
      return featuredReviewIds
        .map((id) => publishedReviews.find((r) => r.id === id))
        .filter(Boolean) as typeof publishedReviews;
    }
    return [];
  })();

  // Build resolved slides for fallback metadata and images
  const resolvedSlides = (() => {
    const raw = (carouselSlides && carouselSlides.length > 0)
      ? carouselSlides
      : (heroImages && heroImages.length > 0 ? heroImages.map((url) => ({ type: "static" as const, imageUrl: url, title: "", subtitle: "" })) : []);

    const resolveTripFromSlide = (slide: CarouselSlide) => {
      if (slide.type !== "trip") return null;

      if (slide.tripId) {
        const match = trips.find((t) => t.id === slide.tripId || t.slug === slide.tripId);
        if (match) return match;
      }

      if (slide.tripInstanceId) {
        const match = trips.find((t) => t.id === slide.tripInstanceId || t.slug === slide.tripInstanceId);
        if (match) return match;

        const directInstance = tripInstances.find((ti) => ti.id === slide.tripInstanceId);
        if (directInstance) {
          return trips.find((trip) => trip.id === directInstance.tripId) ?? null;
        }

        return trips.find((trip) =>
          trip.departures?.some((departure) => departure.id === slide.tripInstanceId)
        ) ?? null;
      }

      return null;
    };

    const mapped = raw.map((slide) => {
      if (slide.type === "static") {
        return {
          imageUrl: slide.imageUrl || "",
          title: slide.title || "",
          subtitle: slide.subtitle || "",
          tripId: undefined as string | undefined,
        };
      }

      const trip = resolveTripFromSlide(slide);
      const imageUrl = slide.imageUrl || trip?.image || heroImages[0] || "";

      return {
        imageUrl,
        title: slide.title || trip?.name || "Trip unavailable",
        subtitle: slide.subtitle || trip?.shortDescription || trip?.overview || "",
        tripId: trip?.id || slide.tripId || slide.tripInstanceId,
      };
    });

    if (mapped.length > 0) return mapped;

    return [];
  })();

  // 1. Stationary Hero Background Image & Meta
  const heroBgImage =
    homepageContent?.heroImages?.[0] ||
    resolvedSlides[0]?.imageUrl ||
    "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/fb19581e-dca3-4cdb-b122-c193099be3a1-wp6584296.jpg";

  const rawHeadline = homepageContent?.heroTitle?.trim();
  const heroHeadline =
    rawHeadline && rawHeadline !== "Jai Ho!" && rawHeadline !== "Live Deeply. Travel Boldly."
      ? rawHeadline
      : (siteSettings?.general?.tagline || "Explore More. Travel Better.");

  const heroSubtext =
    homepageContent?.heroSubtitle ||
    resolvedSlides[0]?.subtitle ||
    "Curated journeys. Local experiences. Unforgettable landscapes.";

  // 2. Determine eligible upcoming departures from existing data
  const upcomingDepartures = useMemo(() => {
    const allInstances: TripInstance[] = [...tripInstances];
    trips.forEach((t) => {
      (t.departures || []).forEach((d) => {
        if (!allInstances.some((inst) => inst.id === d.id)) {
          allInstances.push({ ...d, tripId: d.tripId || t.id });
        }
      });
    });

    const upcoming = allInstances.filter((inst) => inst.status === "upcoming");
    upcoming.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

    return upcoming
      .map((inst, index) => {
        const trip = trips.find(
          (t) => t.id === inst.tripId || (t.slug && t.slug === inst.tripId)
        );
        if (!trip) return null;
        return {
          id: inst.id,
          tripId: trip.slug || trip.id,
          rawTripId: trip.id,
          name: trip.name,
          image: trip.image,
          duration: trip.duration,
          category: trip.category,
          date: inst.date,
          displayDate: inst.displayDate || inst.date,
          price: inst.price > 0 ? inst.price : trip.price,
          spotsLeft: inst.spotsLeft,
          spotsTotal: inst.spotsTotal,
          isNextDeparture: index === 0,
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        tripId: string;
        rawTripId: string;
        name: string;
        image: string;
        duration: string;
        category: string;
        date: string;
        displayDate: string;
        price: number;
        spotsLeft: number;
        spotsTotal: number;
        isNextDeparture: boolean;
      }>;
  }, [trips, tripInstances]);

  // 3. Compact Departure Carousel state & continuous seamless circular transitions
  // We clone last item at beginning and first item at end to achieve true infinite loop in the same direction
  const totalSlides = upcomingDepartures.length;
  // currentTrackIdx: 1 represents the first real slide (index 0 in upcomingDepartures)
  // 0 is clone of last, totalSlides + 1 is clone of first
  const [currentTrackIdx, setCurrentTrackIdx] = useState(1);
  const [enableTransition, setEnableTransition] = useState(true);
  const depTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isNavigatingRef = useRef(false);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active departure index (0 to totalSlides - 1)
  const activeDepIdx = totalSlides > 0 ? (currentTrackIdx - 1 + totalSlides) % totalSlides : 0;

  const markNavigating = () => {
    isNavigatingRef.current = true;
    if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    unlockTimerRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
    }, 650);
  };

  // Handle seamless infinite jump on transition end without visual jump
  const handleTransitionEnd = () => {
    isNavigatingRef.current = false;
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
    if (totalSlides <= 1) return;
    if (currentTrackIdx === 0) {
      setEnableTransition(false);
      setCurrentTrackIdx(totalSlides);
    } else if (currentTrackIdx === totalSlides + 1) {
      setEnableTransition(false);
      setCurrentTrackIdx(1);
    }
  };

  // Re-enable transition on the next animation frame after an instant reset
  useEffect(() => {
    if (!enableTransition) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setEnableTransition(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [enableTransition]);

  // Autoplay timer function that always keeps sliding forward
  const startAutoplay = useCallback(() => {
    if (depTimerRef.current) {
      clearInterval(depTimerRef.current);
      depTimerRef.current = null;
    }
    if (totalSlides > 1) {
      depTimerRef.current = setInterval(() => {
        if (!isNavigatingRef.current) {
          markNavigating();
          setEnableTransition(true);
          setCurrentTrackIdx((prev) => prev + 1);
        }
      }, 5000);
    }
  }, [totalSlides]);

  const nextDep = () => {
    if (totalSlides <= 1 || isNavigatingRef.current) return;
    markNavigating();
    setEnableTransition(true);
    setCurrentTrackIdx((prev) => prev + 1);
    startAutoplay();
  };

  const prevDep = () => {
    if (totalSlides <= 1 || isNavigatingRef.current) return;
    markNavigating();
    setEnableTransition(true);
    setCurrentTrackIdx((prev) => prev - 1);
    startAutoplay();
  };

  const goToDep = (targetRealIdx: number) => {
    if (totalSlides <= 1 || isNavigatingRef.current) return;
    markNavigating();
    setEnableTransition(true);
    setCurrentTrackIdx(targetRealIdx + 1);
    startAutoplay();
  };

  useEffect(() => {
    startAutoplay();
    return () => {
      if (depTimerRef.current) {
        clearInterval(depTimerRef.current);
        depTimerRef.current = null;
      }
      if (unlockTimerRef.current) {
        clearTimeout(unlockTimerRef.current);
        unlockTimerRef.current = null;
      }
    };
  }, [startAutoplay]);

  // Scoped touch swiping specifically for the departure card carousel
  const [cardTouchStart, setCardTouchStart] = useState<number | null>(null);
  const [cardTouchEnd, setCardTouchEnd] = useState<number | null>(null);

  const onCardTouchStart = (e: React.TouchEvent) => {
    // Temporarily pause the timer while finger is actively swiping
    if (depTimerRef.current) {
      clearInterval(depTimerRef.current);
      depTimerRef.current = null;
    }
    setCardTouchEnd(null);
    setCardTouchStart(e.targetTouches[0].clientX);
  };

  const onCardTouchMove = (e: React.TouchEvent) => {
    setCardTouchEnd(e.targetTouches[0].clientX);
  };

  const onCardTouchEnd = () => {
    if (!cardTouchStart || !cardTouchEnd) {
      startAutoplay();
      return;
    }
    const distance = cardTouchStart - cardTouchEnd;
    if (distance > 35) {
      nextDep();
    } else if (distance < -35) {
      prevDep();
    } else {
      startAutoplay();
    }
    setCardTouchStart(null);
    setCardTouchEnd(null);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[86vh] sm:h-[84vh] min-h-[560px] md:min-h-[580px] max-h-[840px] overflow-hidden">
        {/* Stationary Hero Background Image */}
        {heroBgImage ? (
          <img
            src={heroBgImage}
            alt="Yatrivo"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#071712] via-[#0f2922] to-[#071712]" />
        )}

        {/* Shading gradients: directional overlay ensuring top scrim for brand & bottom gradient for text */}
        <div className="absolute inset-0 hero-overlay-directional pointer-events-none" />

        {/* Mobile-Only Center-Top Brand */}
        <div className="md:hidden absolute top-12 sm:top-14 inset-x-0 z-30 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
          <img
            src={logoImg}
            alt="Yatrivo"
            className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] mb-1.5"
          />
          <div
            className="text-white font-bold text-xl sm:text-2xl tracking-[0.24em] text-contrast-title"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            YATRIVO
          </div>
        </div>

        {/* Stationary Hero Content & Integrated Upcoming Departure Carousel */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 w-full z-10 flex flex-col justify-end pb-4 sm:pb-9 md:pb-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 lg:gap-8">
            {/* Left: Stationary Main Headline, Supporting Text & Existing CTAs */}
            <div className="max-w-xl">
              <div className="hidden md:block text-[#e8622a] text-[11px] sm:text-xs uppercase tracking-widest font-semibold mb-1.5 sm:mb-2">
                EXPLORE UTTARAKHAND
              </div>
              <h1
                className="text-white text-[30px] sm:text-[34px] md:text-4xl lg:text-[44px] leading-[1.12] mb-2 sm:mb-2.5 font-normal text-contrast-title"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {heroHeadline.split(". ").map((part, pIdx, arr) => (
                  <span key={pIdx}>
                    {part}
                    {pIdx < arr.length - 1 ? "." : ""}
                    {pIdx < arr.length - 1 && <br />}
                  </span>
                ))}
              </h1>

              {heroSubtext && (
                <p className="text-white/90 text-[13px] sm:text-sm md:text-[15px] max-w-lg mb-3.5 sm:mb-4 leading-snug sm:leading-relaxed text-contrast-body line-clamp-2">
                  {heroSubtext}
                </p>
              )}

              {/* Symmetrical Uniform Buttons - Stable and Stationary */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Link
                  to="/trips"
                  className="w-32 sm:w-36 h-9 sm:h-10 btn-glass-outline text-white rounded-full text-xs font-medium transition-all flex items-center justify-center text-center shrink-0 tracking-wide"
                >
                  EXPLORE TRIPS
                </Link>
                <Link
                  to="/plan"
                  className="w-32 sm:w-36 h-9 sm:h-10 bg-[#e8622a] hover:bg-[#d45520] text-white rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shrink-0 tracking-wide btn-primary-elevated"
                >
                  PLAN MY TRIP →
                </Link>
              </div>
            </div>

            {/* Right: Compact Upcoming-Departure Carousel Card */}
            {upcomingDepartures.length > 0 && (
              <div className="w-full max-w-sm sm:max-w-md lg:max-w-[340px] xl:max-w-[360px] shrink-0">
                {/* Horizontal Sliding Track of Departure Cards */}
                <div
                  className="overflow-hidden touch-pan-y"
                  onTouchStart={onCardTouchStart}
                  onTouchMove={onCardTouchMove}
                  onTouchEnd={onCardTouchEnd}
                >
                  <div
                    className="flex will-change-transform"
                    style={{
                      transform: `translate3d(-${currentTrackIdx * 100}%, 0, 0)`,
                      transition: enableTransition
                        ? "transform 600ms cubic-bezier(0.25, 1, 0.5, 1)"
                        : "none",
                    }}
                    onTransitionEnd={handleTransitionEnd}
                  >
                    {/* Cloned slides array: [last, ...all, first] */}
                    {(totalSlides > 1
                      ? [upcomingDepartures[totalSlides - 1], ...upcomingDepartures, upcomingDepartures[0]]
                      : upcomingDepartures
                    ).map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="w-full shrink-0"
                      >
                        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-white/40 shadow-lg text-[#0f2922]">
                          {/* Top indicator row: subtle NEXT DEPARTURE label without extra clutter */}
                          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#e2e8f0]/60">
                            {item.isNextDeparture ? (
                              <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-[#e8622a] bg-[#e8622a]/10 px-2 py-0.5 rounded-full border border-[#e8622a]/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#e8622a] animate-pulse" />
                                NEXT DEPARTURE
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#718096]">
                                UPCOMING TRIP
                              </span>
                            )}
                            <span className="text-[10px] text-[#718096] font-medium truncate">
                              {item.duration || item.category}
                            </span>
                          </div>

                          {/* Horizontal Compact Composition: Thumbnail + Details + Action */}
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <Link to={`/trips/${item.tripId}`} className="shrink-0 block overflow-hidden rounded-xl">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-14 h-14 sm:w-16 sm:h-16 object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </Link>

                            <div className="min-w-0 flex-1">
                              <h4
                                className="text-[#0f2922] font-semibold text-xs sm:text-[13.5px] leading-tight truncate hover:text-[#e8622a] transition-colors mb-0.5"
                                style={{ fontFamily: "var(--font-serif)" }}
                              >
                                <Link to={`/trips/${item.tripId}`}>{item.name}</Link>
                              </h4>
                              <div className="flex items-center gap-1 text-[11px] text-[#4a5568]">
                                <svg className="w-3 h-3 text-[#e8622a] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="truncate">{item.displayDate}</span>
                              </div>
                              <div
                                className="text-[#0f2922] font-bold text-xs sm:text-sm mt-0.5 leading-none"
                                style={{ fontFamily: "var(--font-serif)" }}
                              >
                                ₹{item.price.toLocaleString("en-IN")}
                                <span className="text-[9.5px] font-normal text-[#718096]"> / person</span>
                              </div>
                            </div>

                            <Link
                              to={`/trips/${item.tripId}`}
                              className="w-8 h-8 rounded-full bg-[#0f2922] hover:bg-[#e8622a] text-white flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
                              aria-label={`View details for ${item.name}`}
                              title={`View ${item.name}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subtle Pagination Indicators & Controls */}
                {upcomingDepartures.length > 1 && (
                  <div className="flex items-center justify-center md:justify-between mt-2.5 md:mt-2 px-1">
                    <div className="flex items-center gap-1.5">
                      {upcomingDepartures.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => goToDep(i)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            i === activeDepIdx ? "w-4 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                          }`}
                          aria-label={`Go to departure slide ${i + 1}`}
                        />
                      ))}
                    </div>
                    <div className="hidden md:flex items-center gap-1">
                      <button
                        onClick={prevDep}
                        className="w-5 h-5 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                        aria-label="Previous departure"
                      >
                        ‹
                      </button>
                      <button
                        onClick={nextDep}
                        className="w-5 h-5 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                        aria-label="Next departure"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 grid grid-cols-1 sm:grid-cols-3 gap-[22px] sm:gap-6">
          {(homepageContent?.whyUsPoints || []).slice(0, 3).map((b) => (
            <div key={b.title} className="flex items-start gap-3">
              <span className="text-xl sm:text-2xl mt-0.5 shrink-0">{b.icon}</span>
              <div>
                <div className="text-[#0f2922] font-medium text-sm leading-snug sm:leading-[1.6]">{b.title}</div>
                <div className="text-[#4a5568] text-xs sm:text-sm leading-snug sm:leading-[1.6] mt-0.5">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Destinations */}
      <section className="pt-8 sm:pt-12 md:pt-16 pb-6 sm:pb-8 md:pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-5 sm:mb-8 flex-wrap gap-3 sm:gap-4">
            <div>
              <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-1.5 sm:mb-2">CURATED HIMALAYAN WONDERS</div>
              <h2 className="section-heading text-[#0f2922] max-sm:mb-0">Destinations that Stir the Soul</h2>
            </div>
            <Link to="/destinations" className="border border-[#0f2922] bg-[#0f2922] text-white md:bg-transparent md:text-[#0f2922] text-xs sm:text-sm px-4 sm:px-5 py-1.5 sm:py-2 rounded-full md:hover:bg-[#0f2922] md:hover:text-white transition-all shrink-0 inline-block">
              VIEW ALL DESTINATIONS →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
            {featuredDestinations.map((d) => (
              <Link
                key={d.id}
                to={`/destinations/${d.slug || d.id}`}
                className="group relative rounded-2xl overflow-hidden h-48 sm:h-72 block cursor-pointer"
              >
                <ProgressiveImage
                  src={d.image}
                  alt={d.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  containerClassName="absolute inset-0 w-full h-full"
                  priority={false}
                />
                <div className="absolute inset-0 card-overlay-bottom" />
                <div className="absolute bottom-0 left-0 p-4 sm:p-5">
                  <div className="text-white text-lg sm:text-2xl font-semibold leading-tight text-contrast-title drop-shadow-xs" style={{ fontFamily: "var(--font-serif)" }}>
                    {d.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Mindful Adventure Movement */}
      <section className="pt-4 sm:pt-6 md:pt-16 pb-8 sm:pb-12 md:pb-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="hidden md:block md:col-span-5 rounded-2xl overflow-hidden h-64 lg:h-72 relative shadow-xs">
              <SiteImage
                assetKey={SITE_ASSET_KEYS.HOME_WHY_US_IMAGE}
                alt="Travelers around campfire"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:col-span-7">
              <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-3 sm:mb-2.5">WHY TRAVELERS LOVE US</div>
              <h2 className="section-heading text-[#0f2922] mb-3.5 sm:mb-4">
                {whyUsTitle || "The Mindful Adventure Movement"}
              </h2>
              <p className="text-[#4a5568] text-sm sm:text-[15px] leading-relaxed mb-6 sm:mb-7 max-w-xl">
                {whyUsDesc || "We started Yatrivo to bridge the gap between heavy commercial bus tours and risky, unguided expeditions. Our groups are small, food is sourced from local farms, and trails are chosen for deep natural connection."}
              </p>
              <Link
                to="/travel-with-us"
                className="border border-[#0f2922] bg-[#0f2922] text-white md:bg-transparent md:text-[#0f2922] text-xs sm:text-sm px-5 sm:px-6 py-2 sm:py-2.5 rounded-full md:hover:bg-[#0f2922] md:hover:text-white transition-all font-medium inline-block"
              >
                Travel With Us →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {featuredReviews.length > 0 && (
        <section className="py-10 sm:py-16 bg-[#f7f8f5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="section-heading text-[#0f2922] text-center mb-6 sm:mb-10">Wanderers Speak From Their Hearts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
              {featuredReviews.map((r) => {
                const norm = (s?: string) => (s || "").trim().toLowerCase();
                const matchedDest = destinations.find(
                  (d) =>
                    (r.destinationId && d.id === r.destinationId) ||
                    (r.destinationSlug && (d.slug === r.destinationSlug || d.id === r.destinationSlug)) ||
                    (r.destination &&
                      (norm(d.id) === norm(r.destination) ||
                        norm(d.slug) === norm(r.destination) ||
                        norm(d.name) === norm(r.destination) ||
                        (norm(r.destination).length >= 3 &&
                          (norm(d.name).includes(norm(r.destination)) || norm(r.destination).includes(norm(d.name))))))
                );
                let targetDestSlug = matchedDest ? matchedDest.slug || matchedDest.id : r.destinationSlug || "";
                if (!targetDestSlug) {
                  const matchedTrip = trips.find(
                    (t) =>
                      (r.tripId && (t.id === r.tripId || t.slug === r.tripId)) ||
                      (r.tripName && norm(t.name) === norm(r.tripName))
                  );
                  if (matchedTrip) {
                    if (matchedTrip.destinations && matchedTrip.destinations.length > 0) {
                      targetDestSlug = matchedTrip.destinations[0].slug || matchedTrip.destinations[0].id;
                    } else {
                      const tripDest = destinations.find(
                        (d) =>
                          (matchedTrip.destinationId && d.id === matchedTrip.destinationId) ||
                          (matchedTrip.destination &&
                            (norm(d.id) === norm(matchedTrip.destination) ||
                              norm(d.slug) === norm(matchedTrip.destination) ||
                              norm(d.name) === norm(matchedTrip.destination)))
                      );
                      if (tripDest) targetDestSlug = tripDest.slug || tripDest.id;
                    }
                  }
                }
                const targetUrl = targetDestSlug ? `/destinations/${targetDestSlug}#reviews` : "/reviews";

                return (
                  <Link
                    key={r.id}
                    to={targetUrl}
                    className="bg-white rounded-2xl p-4 sm:p-6 border border-[#e2e8f0] hover:border-[#0f2922]/30 hover:shadow-md transition-all flex flex-col justify-between h-full group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Stars rating={r.rating} />
                        <span className="text-[11px] text-[#718096] group-hover:text-[#e8622a] transition-colors inline-flex items-center gap-1 font-medium">
                          Read more
                          <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                      <p className="text-[#4a5568] text-[13px] sm:text-sm leading-relaxed mt-2.5 sm:mt-3.5 mb-3.5 sm:mb-5 italic line-clamp-3 sm:line-clamp-4">
                        "{r.text}"
                      </p>
                    </div>
                    <div className="pt-2.5 sm:pt-3 border-t border-[#f1f5f9] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[#0f2922] font-medium text-sm truncate leading-snug sm:leading-[1.6]">{r.name}</div>
                        <div className="text-[#e8622a] text-xs mt-0.5 truncate leading-snug sm:leading-[1.6]">{r.tripName}</div>
                      </div>
                      {matchedDest && (
                        <span className="text-[11px] bg-[#f7f8f5] border border-[#e2e8f0] text-[#0f2922] px-2.5 py-1 rounded-full shrink-0 font-medium group-hover:bg-[#0f2922] group-hover:text-white transition-colors">
                          {matchedDest.name}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="relative py-12 sm:py-24 overflow-hidden">
        <SiteImage
          assetKey={SITE_ASSET_KEYS.HOME_CTA_BG}
          alt="Forest mountain path"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0f2922]/80" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <h2 className="section-heading text-white mb-2.5 sm:mb-4">Ready to Travel Better?</h2>
          <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-5 sm:mb-8">Join the next departure. Small groups, immersive experiences, and memories that last a lifetime.</p>
          <Link
            to="/plan"
            className="bg-white text-[#0f2922] font-medium px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full hover:bg-[#f7f8f5] transition-colors text-xs sm:text-sm tracking-wide inline-block"
          >
            BOOK YOUR JOURNEY NOW
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
