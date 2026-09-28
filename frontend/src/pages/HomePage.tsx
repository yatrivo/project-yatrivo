import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";
import logoImg from "@/imports/logo.png";

const Stars = () => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    ))}
  </div>
);

export default function HomePage() {
  const { navigate, homepageContent, tripInstances, trips, openEnquiryModal, reviews, destinations, siteSettings } = useApp();
  const { heroImages, heroTitle, heroSubtitle, carouselSlides, featuredReviewIds, featuredDestIds, whyUsTitle, whyUsDesc } = homepageContent;

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
      const ordered = featuredReviewIds
        .map((id) => publishedReviews.find((r) => r.id === id))
        .filter(Boolean) as typeof publishedReviews;
      return ordered.length > 0 ? ordered : publishedReviews.slice(0, 3);
    }
    return publishedReviews.slice(0, 3);
  })();

  // Build resolved slides for the carousel
  const resolvedSlides = (() => {
    const raw = (carouselSlides && carouselSlides.length > 0) ? carouselSlides : heroImages.map((url) => ({ type: "static" as const, imageUrl: url, title: heroTitle, subtitle: heroSubtitle }));
    return raw.map((slide) => {
      if (slide.type === "static") {
        return { imageUrl: slide.imageUrl, title: slide.title, subtitle: slide.subtitle, tripId: undefined as string | undefined, tripInstanceId: undefined as string | undefined, price: undefined as number | undefined, displayDate: undefined as string | undefined };
      }
      const inst = tripInstances.find((ti) => ti.id === slide.tripInstanceId);
      const trip = inst ? trips.find((t) => t.id === inst.tripId) : null;
      return {
        imageUrl: trip?.image ?? heroImages[0],
        title: slide.title ?? trip?.name ?? "Upcoming Trip",
        subtitle: slide.subtitle ?? (trip?.subtitle || ""),
        tripId: trip?.id,
        tripInstanceId: slide.tripInstanceId,
        price: inst?.price,
        displayDate: inst?.displayDate,
      };
    });
  })();

  const [heroIdx, setHeroIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (resolvedSlides.length > 1) {
      timerRef.current = setInterval(() => {
        setHeroIdx((i) => (i + 1) % resolvedSlides.length);
      }, 5000);
    }
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSlides.length]);

  const goTo = (idx: number) => {
    setHeroIdx(idx);
    resetTimer();
  };

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 45;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      goTo((heroIdx + 1) % resolvedSlides.length);
    } else if (isRightSwipe) {
      goTo((heroIdx - 1 + resolvedSlides.length) % resolvedSlides.length);
    }
  };

  return (
    <div>
      {/* Hero Carousel with Smooth Sliding Track */}
      <section
        className="relative h-[82vh] md:h-[84vh] min-h-[500px] md:min-h-[580px] max-h-[840px] overflow-hidden touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Mobile-Only Center-Top Brand & Tagline */}
        <div className="md:hidden absolute top-16 inset-x-0 z-30 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
          <img
            src={logoImg}
            alt="Yatrivo"
            className="h-12 w-12 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] mb-1.5"
          />
          <div
            className="text-white font-bold text-base tracking-[0.25em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            YATRIVO
          </div>
          <div className="text-[#e8622a] text-[9px] tracking-[0.2em] uppercase font-semibold mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
            {siteSettings?.general?.tagline || "EXPLORE MORE. TRAVEL BETTER."}
          </div>
        </div>

        {/* Sliding Track containing all slides */}
        <div
          className="flex h-full w-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${heroIdx * 100}%)` }}
        >
          {resolvedSlides.map((slide, i) => (
            <div
              key={i}
              className="relative w-full h-full shrink-0 flex items-end pb-8 md:pb-14 overflow-hidden"
            >
              {/* Background image */}
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Shading gradients: gentle top vignette on mobile for logo contrast, dark bottom for text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40 md:to-transparent pointer-events-none" />

              {/* Slide text & buttons */}
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full z-10">
                <h1
                  className="text-white text-2xl sm:text-5xl md:text-7xl leading-[1.15] sm:leading-[1.05] mb-2 sm:mb-5 max-w-2xl font-normal"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {slide.title.split(". ").map((part, pIdx, arr) => (
                    <span key={pIdx}>
                      {part}
                      {pIdx < arr.length - 1 ? "." : ""}
                      {pIdx < arr.length - 1 && <br />}
                    </span>
                  ))}
                </h1>

                {slide.subtitle ? (
                  <p className="text-white/80 text-xs sm:text-base md:text-lg max-w-xl mb-2 sm:mb-4 leading-relaxed">
                    {slide.subtitle}
                  </p>
                ) : null}

                {/* Trip-specific info */}
                {slide.tripId ? (
                  <>
                    {(slide.price !== undefined || slide.displayDate) && (
                      <p className="text-white/90 text-xs sm:text-sm mb-3 sm:mb-6 font-medium">
                        {slide.price !== undefined && `₹${slide.price.toLocaleString("en-IN")}/person`}
                        {slide.price !== undefined && slide.displayDate && " · "}
                        {slide.displayDate}
                      </p>
                    )}
                  </>
                ) : null}

                {/* Symmetrical Uniform Buttons (Identical dimensions across static & dynamic slides) */}
                <div className="flex items-center gap-2.5 sm:gap-3 mb-1">
                  <Link
                    to={slide.tripId ? `/trips/${slide.tripId}` : "/trips"}
                    className="w-36 sm:w-44 h-10 sm:h-12 border border-white text-white rounded-full text-xs sm:text-sm font-medium hover:bg-white hover:text-[#0f2922] transition-all flex items-center justify-center text-center shrink-0 tracking-wide"
                  >
                    {slide.tripId ? "VIEW TRIP" : "EXPLORE TRIPS"}
                  </Link>

                  {slide.tripId ? (
                    <button
                      onClick={() => openEnquiryModal(slide.tripId!)}
                      className="w-36 sm:w-44 h-10 sm:h-12 bg-[#e8622a] hover:bg-[#d45520] text-white rounded-full text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors cursor-pointer shrink-0 tracking-wide"
                    >
                      INQUIRE NOW →
                    </button>
                  ) : (
                    <Link
                      to="/plan"
                      className="w-36 sm:w-44 h-10 sm:h-12 bg-[#e8622a] hover:bg-[#d45520] text-white rounded-full text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors shrink-0 tracking-wide"
                    >
                      PLAN MY TRIP →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        {resolvedSlides.length > 1 && (
          <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
            {resolvedSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === heroIdx ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {homepageContent.whyUsPoints.slice(0, 3).map((b) => (
            <div key={b.title} className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{b.icon}</span>
              <div>
                <div className="text-[#0f2922] font-medium text-sm">{b.title}</div>
                <div className="text-[#4a5568] text-sm mt-0.5">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Destinations */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-2">CURATED HIMALAYAN WONDERS</div>
              <h2 className="text-[#0f2922] text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>Destinations that Stir the Soul</h2>
            </div>
            <Link to="/destinations" className="border border-[#0f2922] text-[#0f2922] text-sm px-5 py-2 rounded-full hover:bg-[#0f2922] hover:text-white transition-all shrink-0 inline-block">
              VIEW ALL DESTINATIONS
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {featuredDestinations.map((d) => (
              <Link
                key={d.id}
                to={`/destinations/${d.slug || d.id}`}
                className="group relative rounded-2xl overflow-hidden h-72 block cursor-pointer"
              >
                <img src={d.image} alt={d.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <div className="text-[#e8622a] text-xs font-medium uppercase tracking-wider mb-1">
                    {d.category?.toUpperCase() || d.experienceTags?.[0]?.toUpperCase() || "HIMALAYAN DESTINATION"}
                  </div>
                  <div className="text-white text-xl font-medium" style={{ fontFamily: "var(--font-serif)" }}>{d.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Mindful Adventure Movement */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden h-80 md:h-96">
              <img src="https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&h=600&fit=crop&auto=format" alt="Travelers around campfire" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">WHY TRAVELERS LOVE US</div>
              <h2 className="text-[#0f2922] text-3xl sm:text-4xl md:text-5xl font-bold mb-5" style={{ fontFamily: "var(--font-serif)" }}>
                {whyUsTitle || "The Mindful Adventure Movement"}
              </h2>
              <p className="text-[#4a5568] text-sm leading-relaxed mb-8">
                {whyUsDesc || "We started Yatrivo to bridge the gap between heavy commercial bus tours and risky, unguided expeditions. Our groups are small, food is sourced from local farms, and trails are chosen for deep natural connection."}
              </p>
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[
                  { val: "15,000+", label: "Happy Explorers" },
                  { val: "4.9 / 5", label: "Google & Trustpilot" },
                  { val: "100%", label: "Himalayan Sourced" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif)" }}>{s.val}</div>
                    <div className="text-[#4a5568] text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              <Link
                to="/travel-with-us"
                className="border border-[#0f2922] text-[#0f2922] text-sm px-6 py-2.5 rounded-full hover:bg-[#0f2922] hover:text-white transition-all font-medium inline-block"
              >
                Travel With Us →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-[#f7f8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-[#0f2922] text-3xl sm:text-4xl text-center mb-10" style={{ fontFamily: "var(--font-serif)" }}>Wanderers Speak From Their Hearts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {featuredReviews.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-6 border border-[#e2e8f0]">
                <Stars />
                <p className="text-[#4a5568] text-sm leading-relaxed mt-4 mb-5 italic">"{r.text}"</p>
                <div className="text-[#0f2922] font-medium text-sm">{r.name}</div>
                <div className="text-[#e8622a] text-xs mt-0.5">{r.tripName}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-24 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=600&fit=crop&auto=format" alt="Forest mountain path" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#0f2922]/80" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-white text-4xl sm:text-5xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>Ready to Travel Better?</h2>
          <p className="text-white/70 text-base mb-8">Join the next departure. Small groups, immersive experiences, and memories that last a lifetime.</p>
          <Link
            to="/plan"
            className="bg-white text-[#0f2922] font-medium px-8 py-3.5 rounded-full hover:bg-[#f7f8f5] transition-colors text-sm tracking-wide inline-block"
          >
            BOOK YOUR JOURNEY NOW
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
