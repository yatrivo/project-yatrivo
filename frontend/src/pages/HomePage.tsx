import { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";

const Stars = () => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    ))}
  </div>
);

export default function HomePage() {
  const { navigate, homepageContent, tripInstances, trips, openEnquiryModal, reviews } = useApp();
  const { heroImages, heroTitle, heroSubtitle, carouselSlides, featuredReviewIds } = homepageContent;

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
        subtitle: slide.subtitle ?? (inst && trip ? `${inst.displayDate} · ₹${inst.price.toLocaleString("en-IN")}/person` : ""),
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

  const currentSlide = resolvedSlides[heroIdx] ?? resolvedSlides[0];

  return (
    <div>
      {/* Hero Carousel */}
      <section className="relative min-h-screen flex items-end pb-24 overflow-hidden">
        {resolvedSlides.map((slide, i) => (
          <img
            key={i}
            src={slide.imageUrl}
            alt={slide.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === heroIdx ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* Dot indicators */}
        {resolvedSlides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <h1 className="text-white text-5xl sm:text-6xl md:text-7xl leading-[1.05] mb-5 max-w-2xl" style={{ fontFamily: "var(--font-serif)" }}>
            {currentSlide.title.split(". ").map((part, i, arr) => (
              <span key={i}>{part}{i < arr.length - 1 ? "." : ""}{i < arr.length - 1 && <br />}</span>
            ))}
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-xl mb-2 leading-relaxed">
            {currentSlide.subtitle}
          </p>

          {/* Trip-specific info + CTA */}
          {currentSlide.tripId ? (
            <>
              {(currentSlide.price !== undefined || currentSlide.displayDate) && (
                <p className="text-white/90 text-sm mb-6">
                  {currentSlide.price !== undefined && `₹${currentSlide.price.toLocaleString("en-IN")}/person`}
                  {currentSlide.price !== undefined && currentSlide.displayDate && " · "}
                  {currentSlide.displayDate}
                </p>
              )}
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <button
                onClick={() => navigate("trip-detail", { tripId: currentSlide.tripId })}
                className="border border-white text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-white hover:text-[#0f2922] transition-all"
              >
                VIEW TRIP
              </button>
              <button
                onClick={() => openEnquiryModal(currentSlide.tripId!)}
                className="bg-[#e8622a] hover:bg-[#d45520] text-white px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
              >
                INQUIRE NOW →
              </button>
            </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate("trips")} className="border border-white text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-white hover:text-[#0f2922] transition-all">
                EXPLORE PACKAGES
              </button>
              <button onClick={() => navigate("plan")} className="bg-[#e8622a] hover:bg-[#d45520] text-white px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2 transition-colors">
                PLAN MY EXCURSION →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: "🗺️", title: "Handpicked Paths", desc: "Carefully charted trails away from tourist crowds." },
            { icon: "👥", title: "Youthful Vibe", desc: "Small groups, like-minded active adventurers." },
            { icon: "🏔️", title: "Himalayan Trust", desc: "Certified local guides & sustainable execution." },
          ].map((b) => (
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
            <button onClick={() => navigate("destinations")} className="border border-[#0f2922] text-[#0f2922] text-sm px-5 py-2 rounded-full hover:bg-[#0f2922] hover:text-white transition-all shrink-0">
              VIEW ALL DESTINATIONS
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { id: "chopta", name: "Chopta Valley", img: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=600&h=480&fit=crop&auto=format", tag: "ALPINE TREK" },
              { id: "auli", name: "Auli Slopes", img: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600&h=480&fit=crop&auto=format", tag: "SKI SEASON" },
              { id: "kedarnath", name: "Kedarnath", img: "https://images.unsplash.com/photo-1580281657702-257584239a55?w=600&h=480&fit=crop&auto=format", tag: "SPIRITUAL" },
            ].map((d) => (
              <div
                key={d.id}
                className="group relative rounded-2xl overflow-hidden h-72 cursor-pointer"
                onClick={() => navigate("destination-detail", { destId: d.id })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate("destination-detail", { destId: d.id })}
              >
                <img src={d.img} alt={d.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
<div className="absolute bottom-0 left-0 p-5">
                  <div className="text-[#e8622a] text-xs font-medium uppercase tracking-wider mb-1">{d.tag}</div>
                  <div className="text-white text-xl font-medium" style={{ fontFamily: "var(--font-serif)" }}>{d.name}</div>
                </div>
              </div>
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
              <h2 className="text-[#0f2922] text-3xl sm:text-4xl md:text-5xl font-bold mb-5" style={{ fontFamily: "var(--font-serif)" }}>The Mindful Adventure Movement</h2>
              <p className="text-[#4a5568] text-sm leading-relaxed mb-8">
                We started Yatrivo to bridge the gap between heavy commercial bus tours and risky, unguided expeditions. Our groups are small, food is sourced from local farms, and trails are chosen for deep natural connection.
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
              <button
                onClick={() => navigate("travel-with-us")}
                className="border border-[#0f2922] text-[#0f2922] text-sm px-6 py-2.5 rounded-full hover:bg-[#0f2922] hover:text-white transition-all font-medium"
              >
                Travel With Us →
              </button>
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
          <button onClick={() => navigate("plan")} className="bg-white text-[#0f2922] font-medium px-8 py-3.5 rounded-full hover:bg-[#f7f8f5] transition-colors text-sm tracking-wide">
            BOOK YOUR JOURNEY NOW
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
