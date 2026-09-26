import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { tripsApi } from "@/api/trips";
import type { Trip, TripDestination } from "@/data/trips";
import Footer from "@/components/Footer";
import SaveButton from "@/components/SaveButton";

interface DayItem { day: string; title: string; desc: string; open: boolean }

export default function TripDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { pageParams, openEnquiryModal, trips, destinations, tripInstances } = useApp();

  const currentSlug = slug || pageParams.tripId || "chopta-trek";
  const initialTrip = trips.find(
    (t) => t.id.toLowerCase() === currentSlug.toLowerCase() || (t.slug && t.slug.toLowerCase() === currentSlug.toLowerCase())
  ) || trips[0];

  const [trip, setTrip] = useState<Trip | null>(initialTrip || null);
  const [loading, setLoading] = useState(false);

  // Fetch full trip from API to ensure fresh multidestination and departure data
  useEffect(() => {
    let isMounted = true;
    async function fetchTrip() {
      try {
        setLoading(true);
        const data = await tripsApi.getOne(currentSlug);
        if (isMounted && data) {
          setTrip(data);
        }
      } catch (err) {
        // Fallback to local trip
        if (isMounted && initialTrip) {
          setTrip(initialTrip);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void fetchTrip();
    return () => { isMounted = false; };
  }, [currentSlug, initialTrip]);

  const activeTrip = trip || initialTrip;
  const tripId = activeTrip?.id ?? currentSlug;

  // Resolve destinations
  const tripDestinations: TripDestination[] = (() => {
    if (activeTrip?.destinations && activeTrip.destinations.length > 0) {
      return activeTrip.destinations;
    }
    if (activeTrip?.destination) {
      const d = destinations.find(
        (dest) => dest.id === activeTrip.destination || dest.slug === activeTrip.destination || dest.name === activeTrip.destination
      );
      if (d) {
        return [{ id: d.id, name: d.name, slug: d.slug, image: d.image, isPrimary: true }];
      }
      return [{ id: activeTrip.destination, name: activeTrip.destination, slug: activeTrip.destination, isPrimary: true }];
    }
    return [];
  })();

  // Resolve upcoming departures
  const upcomingDepartures = (() => {
    if (activeTrip?.departures && activeTrip.departures.length > 0) {
      return activeTrip.departures
        .filter((d) => d.status === "upcoming")
        .sort((a, b) => a.date.localeCompare(b.date));
    }
    return tripInstances
      .filter((inst) => inst.tripId === tripId && inst.status === "upcoming")
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  const [itinerary, setItinerary] = useState<DayItem[]>([
    { day: "Day 1", title: "Dehradun to Chopta Basecamp", desc: "Scenic mountain drive via Devprayag where Alaknanda meets Bhagirathi. Arrive at our pine-wood meadow cabins. Welcome dinner with local Pahadi cuisine. Evening orientation walk.", open: true },
    { day: "Day 2", title: "Trek to Tungnath Temple & Summit", desc: "Mindful morning ascent through dense rhododendron forests to the ancient Tungnath shrine (3,680m), pushing to Chandrashila peak (4,130m) for a 360° panoramic view of Nanda Devi, Trishul, Bandarpoonch.", open: false },
    { day: "Day 3", title: "Deoria Tal Lake Exploration", desc: "Short scenic trek to pristine alpine Deoria Tal lake — perfectly reflecting Chaukhamba mountains. Evening stargazing session with a local astronomy guide. Campfire and folk music.", open: false },
    { day: "Day 4", title: "Sunrise Devotion & Return Drive", desc: "Final organic breakfast. Checkout. Scenic drive back to Dehradun with planned stops at roadside tea stalls overlooking river valleys.", open: false },
  ]);

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleDay = (i: number) => {
    setItinerary((prev) => prev.map((d, idx) => ({ ...d, open: idx === i ? !d.open : d.open })));
  };

  const faqs = [
    { q: "What fitness level is required?", a: "A moderate fitness level with basic walking ability. No prior trekking experience is required for Chopta." },
    { q: "What should I pack?", a: "Warm layers, waterproof jacket, trekking shoes, sunscreen, sunglasses, and personal medicines. We'll send a full packing list on booking." },
    { q: "Is altitude sickness a risk?", a: "Chopta sits at ~2,680m base and Chandrashila at 4,130m. We schedule slow acclimatization. Our guides carry oxygen cylinders as precaution." },
    { q: "Are meals included?", a: "Yes — all meals from Day 1 dinner to Day 4 breakfast. Vegetarian and non-vegetarian options available. Organic where possible." },
  ];

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero with Single Cover Image (No Gallery Thumbs Carousel Overlay) */}
      <section className="relative h-[55vh] min-h-[380px] overflow-hidden">
        <img
          src={activeTrip?.image || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=800&fit=crop&auto=format"}
          alt={activeTrip?.name ?? "Trip"}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="relative h-full flex items-end pb-8 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between w-full gap-4 flex-wrap">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                <Link to="/trips" className="text-[#e8622a] hover:underline uppercase tracking-wide font-medium">
                  {activeTrip?.category ?? "EXPERIENCE"}
                </Link>
                <span className="text-white/40">·</span>
                <span className="text-white/70 uppercase tracking-wide">{activeTrip?.badge ?? "ADVENTURE"}</span>
                {tripDestinations.map((d) => (
                  <span key={d.id} className="flex items-center gap-1.5">
                    <span className="text-white/40">·</span>
                    <Link
                      to={`/destinations/${d.slug || d.id}`}
                      className="text-white/80 hover:text-white uppercase tracking-wide transition-colors font-medium"
                    >
                      {d.name}
                    </Link>
                  </span>
                ))}
              </div>
              <h1 className="text-white text-4xl sm:text-5xl mb-3" style={{ fontFamily: "var(--font-serif)" }}>
                {activeTrip?.name ?? "Himalayan Adventure"}
              </h1>
              <div className="flex flex-wrap gap-5 text-white/80 text-sm">
                <span>{activeTrip?.duration ?? "4 Days / 3 Nights"}</span>
                <span>Difficulty: {activeTrip?.difficulty ?? "Moderate"}</span>
                {activeTrip?.startingPoint && <span>Starts from: {activeTrip.startingPoint}</span>}
              </div>
            </div>
            <SaveButton id={tripId} className="w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full text-white" size={20} />
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Overview */}
            <section>
              <h2 className="text-[#0f2922] text-2xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>
                {activeTrip?.shortDescription || "Trek the Sacred Mountain Ridge"}
              </h2>
              <p className="text-[#4a5568] text-sm leading-relaxed mb-4">
                {activeTrip?.overview ||
                  "Widely known as the 'Mini Switzerland of India', Chopta is a gorgeous pristine pine forest and meadow valley. Our itinerary is designed with unhurried acclimatization, beautiful wooden cabin stays, and authentic local Pahadi dining."}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: "📍", label: "Starting Point", val: activeTrip?.startingPoint || "Dehradun" },
                  { icon: "👥", label: "Group Size", val: "Max 12" },
                  { icon: "🏕️", label: "Stay Style", val: "Timber Cabins" },
                  { icon: "🍽️", label: "Meals", val: "All Included" },
                ].map((q) => (
                  <div key={q.label} className="bg-[#f7f8f5] rounded-xl p-3 text-center">
                    <div className="text-xl mb-1">{q.icon}</div>
                    <div className="text-[#4a5568] text-xs mb-0.5">{q.label}</div>
                    <div className="text-[#0f2922] text-sm font-medium">{q.val}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* DEDICATED SECTION: Destinations on this Trip (Requirement 2) */}
            {tripDestinations.length > 0 && (
              <section id="destinations" className="border-t border-[#e2e8f0] pt-10">
                <div className="mb-6">
                  <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-1">
                    ITINERARY DESTINATIONS
                  </div>
                  <h2 className="text-[#0f2922] text-2xl" style={{ fontFamily: "var(--font-serif)" }}>
                    Destinations on this Journey
                  </h2>
                  <p className="text-[#4a5568] text-sm mt-1">
                    This trip covers {tripDestinations.length} curated {tripDestinations.length === 1 ? "destination" : "destinations"} in Uttarakhand.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {tripDestinations.map((td) => {
                    const fullDest = destinations.find((d) => d.id === td.id || d.slug === td.slug);
                    const destImg = td.image || fullDest?.image || "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=600&h=400&fit=crop&auto=format";
                    const destTagline = fullDest?.tagline || fullDest?.season || "Explore Uttarakhand";

                    return (
                      <Link
                        key={td.id}
                        to={`/destinations/${td.slug || td.id}`}
                        className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden hover:shadow-lg transition-all group flex flex-col cursor-pointer"
                      >
                        <div className="h-48 overflow-hidden relative">
                          <img
                            src={destImg}
                            alt={td.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {td.isPrimary && (
                            <span className="absolute top-3 left-3 bg-[#e8622a] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                              PRIMARY DESTINATION
                            </span>
                          )}
                          {fullDest?.season && (
                            <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
                              {fullDest.season}
                            </span>
                          )}
                        </div>
                        <div className="p-5 flex flex-col flex-1 justify-between">
                          <div>
                            <h3 className="text-[#0f2922] text-xl mb-1 group-hover:text-[#e8622a] transition-colors" style={{ fontFamily: "var(--font-serif)" }}>
                              {td.name}
                            </h3>
                            <p className="text-[#4a5568] text-xs leading-relaxed line-clamp-2">
                              {destTagline}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-[#f0f4f1] flex items-center justify-between text-xs text-[#0f2922] font-semibold group-hover:text-[#e8622a] transition-colors">
                            <span>View Destination Guide</span>
                            <span>→</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Highlights */}
            {activeTrip?.highlights && activeTrip.highlights.length > 0 && (
              <section className="border-t border-[#e2e8f0] pt-10">
                <h2 className="text-[#0f2922] text-2xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>Journey Highlights</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {activeTrip.highlights.map((h, i) => (
                    <div key={i} className="border border-[#e2e8f0] rounded-xl p-4 flex items-start gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2.5" className="shrink-0 mt-0.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <div className="text-[#4a5568] text-sm leading-relaxed">{h}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Itinerary */}
            <section className="border-t border-[#e2e8f0] pt-10">
              <h2 className="text-[#0f2922] text-2xl mb-5" style={{ fontFamily: "var(--font-serif)" }}>The Mindful Itinerary</h2>
              <div className="space-y-2">
                {itinerary.map((d, i) => (
                  <div key={i} className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                    <button onClick={() => toggleDay(i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#f7f8f5] transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <span className="bg-[#0f2922] text-white text-xs font-medium px-3 py-1 rounded-full shrink-0">{d.day}</span>
                        <span className="text-[#0f2922] font-medium text-sm">{d.title}</span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2" className={`shrink-0 transition-transform ${d.open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    {d.open && <div className="px-5 pb-4 text-[#4a5568] text-sm leading-relaxed border-t border-[#e2e8f0] pt-3">{d.desc}</div>}
                  </div>
                ))}
              </div>
            </section>

            {/* Inclusions */}
            <section className="grid sm:grid-cols-2 gap-5 border-t border-[#e2e8f0] pt-10">
              <div className="border border-[#e2e8f0] rounded-xl p-5">
                <h3 className="text-[#0f2922] font-semibold text-sm uppercase tracking-wide mb-4">WHAT'S INCLUDED</h3>
                <ul className="space-y-2">
                  {(activeTrip?.inclusions && activeTrip.inclusions.length > 0
                    ? activeTrip.inclusions
                    : ["Acclimatized Hinoki timber cabin stays", "All high-quality mountain meals", "Medical assistance & oxygen kits", "Certified high-altitude trek leaders", "Inner line permits & state taxes"]
                  ).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#4a5568]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border border-[#e2e8f0] rounded-xl p-5">
                <h3 className="text-[#0f2922] font-semibold text-sm uppercase tracking-wide mb-4">NOT INCLUDED</h3>
                <ul className="space-y-2">
                  {(activeTrip?.exclusions && activeTrip.exclusions.length > 0
                    ? activeTrip.exclusions
                    : ["Personal trekking gear & boots", "Insurance & evacuation expenses", "Trail snacks & personal beverages", "Tips for local porters", "Anything outside the itinerary"]
                  ).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#4a5568]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" className="shrink-0 mt-0.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* DEDICATED SECTION: Photo Gallery (Requirement 3) */}
            {activeTrip?.gallery && activeTrip.gallery.length > 0 && (
              <section id="gallery" className="border-t border-[#e2e8f0] pt-10">
                <div className="mb-5">
                  <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-1">
                    CAPTURED MOMENTS
                  </div>
                  <h2 className="text-[#0f2922] text-2xl" style={{ fontFamily: "var(--font-serif)" }}>
                    Photo Gallery
                  </h2>
                  <p className="text-[#4a5568] text-sm mt-1">
                    Visual impressions from this route, scenic trails, and camp stays.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeTrip.gallery.map((img, i) => (
                    <div
                      key={i}
                      className="h-56 rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-sm hover:shadow-md transition group"
                    >
                      <img
                        src={img}
                        alt={`${activeTrip.name} photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Cancellation */}
            <section className="border-t border-[#e2e8f0] pt-10">
              <h2 className="text-[#0f2922] text-xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>Cancellation Policy</h2>
              <div className="border border-[#e2e8f0] rounded-xl overflow-hidden p-5 text-sm text-[#4a5568] leading-relaxed">
                {activeTrip?.cancellationPolicy ||
                  "Full refund if cancelled 15+ days before departure. 50% refund for 7–14 days. No refund under 7 days."}
              </div>
            </section>

            {/* FAQ */}
            <section className="border-t border-[#e2e8f0] pt-10">
              <h2 className="text-[#0f2922] text-xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>Trip FAQs</h2>
              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div key={i} className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                    <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[#f7f8f5] transition-colors">
                      <span className="text-[#0f2922] text-sm font-medium">{faq.q}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2" className={`shrink-0 transition-transform ${faqOpen === i ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    {faqOpen === i && <div className="px-5 pb-4 text-[#4a5568] text-sm leading-relaxed border-t border-[#e2e8f0] pt-3">{faq.a}</div>}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Booking & Departures Card */}
          <div>
            <div className="sticky top-24 space-y-4">
              <div style={{ background: "var(--forest)" }} className="rounded-2xl p-6 text-white">
                <div className="text-[#e8622a] text-[10px] uppercase tracking-widest mb-2 font-bold">STARTING PRICE</div>
                <div className="text-4xl font-bold mb-0.5" style={{ fontFamily: "var(--font-serif)" }}>
                  {activeTrip?.price ? `₹${activeTrip.price.toLocaleString("en-IN")}` : "₹9,999"}
                </div>
                <div className="text-white/60 text-xs mb-6">per person · {activeTrip?.duration ?? "4 Days / 3 Nights"}</div>
                <button
                  onClick={() => openEnquiryModal(tripId)}
                  className="w-full flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white py-3.5 rounded-full text-sm font-semibold transition-colors mb-3 shadow-md"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp to Enquire
                </button>
                <button onClick={() => openEnquiryModal(tripId)} className="w-full border border-white/30 hover:bg-white/10 text-white py-3 rounded-full text-sm transition-colors">
                  Submit Enquiry
                </button>
                <p className="text-white/40 text-xs text-center mt-3">No account required. We'll respond within 2 hours.</p>
              </div>

              {/* Upcoming Departures Card */}
              {upcomingDepartures.length > 0 && (
                <div className="border border-[#e2e8f0] rounded-2xl p-5 bg-white">
                  <div className="text-[#e8622a] text-xs uppercase tracking-wider font-semibold mb-3">
                    SCHEDULED DEPARTURES
                  </div>
                  <div className="space-y-2.5">
                    {upcomingDepartures.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-[#e2e8f0] hover:border-[#0f2922] transition-colors"
                      >
                        <div>
                          <div className="text-sm font-semibold text-[#0f2922]">{d.displayDate}</div>
                          <div className="text-[11px] text-[#718096]">
                            {d.spotsLeft} {d.spotsLeft === 1 ? "spot" : "spots"} remaining
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-[#e8622a]">
                            ₹{d.price.toLocaleString("en-IN")}
                          </div>
                          <button
                            onClick={() => openEnquiryModal(tripId)}
                            className="text-[11px] text-[#0f2922] hover:text-[#e8622a] font-medium underline"
                          >
                            Book this date
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border border-[#e2e8f0] rounded-2xl p-5 bg-white">
                <div className="text-[#e8622a] text-xs uppercase tracking-wider font-medium mb-3">SHARE THIS TRIP</div>
                <div className="flex gap-2">
                  {["Copy Link", "WhatsApp", "Twitter"].map((s) => (
                    <button key={s} onClick={() => { navigator.clipboard?.writeText(window.location.href); }} className="flex-1 border border-[#e2e8f0] text-[#4a5568] text-xs py-2 rounded-lg hover:border-[#0f2922] hover:text-[#0f2922] transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-[#e2e8f0] px-4 py-3 flex gap-3">
        <button
          onClick={() => openEnquiryModal(tripId)}
          className="flex-1 flex items-center justify-center gap-2 bg-[#16a34a] text-white py-3 rounded-full text-sm font-semibold"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp to Enquire
        </button>
        <div className="text-right shrink-0">
          <div className="text-[#0f2922] font-bold text-lg" style={{ fontFamily: "var(--font-serif)" }}>
            {activeTrip?.price ? `₹${activeTrip.price.toLocaleString("en-IN")}` : "₹9,999"}
          </div>
          <div className="text-[#4a5568] text-xs">per person</div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
