import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

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

export default function CompletedTripDetailPage() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const { pageParams, openEnquiryModal, tripInstances, trips, destinations, reviews } = useApp();
  const [showAllReviews, setShowAllReviews] = useState(false);

  const currentId = instanceId || pageParams.tripInstanceId;
  const instance = tripInstances.find((i) => i.id === currentId);
  const trip = instance ? trips.find((t) => t.id === instance.tripId || (t.slug && t.slug === instance.tripId)) : null;
  const destination = trip
    ? (destinations.find((d) => d.id === trip.destination || d.slug === trip.destination) ||
       (trip.destinations && trip.destinations.length > 0
         ? (destinations.find((d) => d.id === trip.destinations![0].id || d.slug === trip.destinations![0].slug) || {
             id: trip.destinations![0].id,
             name: trip.destinations![0].name,
             slug: trip.destinations![0].slug || trip.destinations![0].id,
             image: trip.destinations![0].image || trip.image,
             tagline: "Himalayan Destination",
             description: "",
             badge: "POPULAR",
             season: "All Year",
             altitude: "2,500m",
             highlights: [],
           })
         : destinations[0]))
    : null;

  if (!instance || !trip || !destination) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-[#4a5568]">
        <SEO title="Trip Not Found" noindex={true} />
        <p className="text-lg">Trip not found.</p>
        <Link
          to="/past-trips"
          className="bg-[#0f2922] text-white px-6 py-2.5 rounded-full text-sm hover:bg-[#1a4a39] transition-colors"
        >
          Back to Past Trips
        </Link>
      </div>
    );
  }

  const destReviews = reviews.filter(
    (r) => r.destination === destination.id && r.status === "published"
  );
  const displayedReviews = showAllReviews ? destReviews : destReviews.slice(0, 4);

  return (
    <div>
      <SEO
        title={`${trip.name} Expedition Recap (${instance.date})`}
        description={`Read the expedition recap, memories, reviews, and highlights from Yatrivo's ${trip.name} journey in ${destination.name}.`}
        image={trip.image}
      />
      {/* Hero */}
      <section className="relative h-[65vh] min-h-[420px] flex items-end pb-10 overflow-hidden">
        <img
          src={trip.image}
          alt={trip.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay-directional" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <Link
            to="/past-trips"
            className="inline-flex items-center gap-2 text-white/85 hover:text-white text-sm mb-6 transition-colors text-contrast-subtle font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Past Trips
          </Link>
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-2 text-contrast-subtle">{destination.name}</div>
          <h1 className="text-white text-4xl sm:text-5xl md:text-6xl mb-3 text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>{trip.name}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="badge-glass-dark text-white text-sm px-4 py-1.5 rounded-full">{instance.displayDate}</span>
            <span className="bg-[#e8622a] text-white text-sm font-semibold px-4 py-1.5 rounded-full btn-primary-elevated">₹{instance.price.toLocaleString("en-IN")} / person</span>
            <span className="badge-glass-dark text-white text-sm px-4 py-1.5 rounded-full">{instance.spotsTotal} participants</span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14">

        {/* Photo Gallery */}
        {instance.completedPhotos && instance.completedPhotos.length > 0 && (
          <section>
            <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-2">MEMORIES</div>
            <h2 className="text-[#0f2922] text-2xl mb-6" style={{ fontFamily: "var(--font-serif)" }}>Trip Gallery</h2>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {instance.completedPhotos.map((photo, i) => (
                <div key={i} className="break-inside-avoid rounded-2xl overflow-hidden">
                  <img src={photo} alt={`Trip photo ${i + 1}`} className="w-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trip Info */}
        <section>
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-2">TRIP DETAILS</div>
          <h2 className="text-[#0f2922] text-2xl mb-6" style={{ fontFamily: "var(--font-serif)" }}>About This Trip</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                { label: "Duration", val: trip.duration },
                { label: "Date", val: instance.displayDate },
                { label: "Participants", val: `${instance.spotsTotal} explorers` },
                { label: "Difficulty", val: trip.difficulty },
              ].map((row) => (
                <div key={row.label} className="flex justify-between border-b border-[#e2e8f0] pb-3 text-sm">
                  <span className="text-[#4a5568]">{row.label}</span>
                  <span className="text-[#0f2922] font-medium">{row.val}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[#0f2922] font-medium text-sm mb-3">Trip Highlights</div>
              <ul className="space-y-2">
                {trip.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#4a5568]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2.5" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {typeof h === "string" ? h : (h as any)?.value ? `${(h as any).label}: ${(h as any).value}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {instance.notes && (
            <div className="mt-5 bg-[#f7f8f5] rounded-xl p-4 text-sm text-[#4a5568] border border-[#e2e8f0]">
              <span className="font-medium text-[#0f2922]">Trip Notes: </span>{instance.notes}
            </div>
          )}
        </section>

        {/* Reviews */}
        {destReviews.length > 0 && (
          <section>
            <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-2">WHAT TRAVELLERS SAY</div>
            <h2 className="text-[#0f2922] text-2xl mb-6" style={{ fontFamily: "var(--font-serif)" }}>Reviews for {destination.name}</h2>
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
            {destReviews.length > 4 && !showAllReviews && (
              <button
                onClick={() => setShowAllReviews(true)}
                className="mt-4 text-sm text-[#0f2922] border border-[#0f2922] px-5 py-2 rounded-full hover:bg-[#0f2922] hover:text-white transition-all"
              >
                View All {destReviews.length} Reviews
              </button>
            )}
          </section>
        )}

        {/* CTA */}
        <section className="bg-[#0f2922] rounded-3xl p-8 sm:p-10 text-center">
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">INTERESTED?</div>
          <h2 className="text-white text-2xl sm:text-3xl mb-3" style={{ fontFamily: "var(--font-serif)" }}>Interested in this trip?</h2>
          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto text-center">
            We run similar departures regularly. Get in touch and our team will share the next available dates and pricing.
          </p>
          <button
            onClick={() => openEnquiryModal(trip.id)}
            className="bg-[#e8622a] hover:bg-[#d45520] text-white font-medium px-8 py-3.5 rounded-full transition-colors text-sm"
          >
            INQUIRE ABOUT SIMILAR TRIPS
          </button>
        </section>
      </div>

      <Footer />
    </div>
  );
}
