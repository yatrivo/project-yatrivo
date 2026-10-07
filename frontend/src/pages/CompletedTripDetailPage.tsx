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
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

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

  const instanceReviews = reviews.filter(
    (r) => r.status === "published" && r.tripInstanceId === instance.id
  );
  const tripReviews = reviews.filter(
    (r) => r.status === "published" && (r.tripId === trip.id || (trip.slug && r.tripId === trip.slug))
  );
  const destReviews = reviews.filter(
    (r) =>
      r.status === "published" &&
      (r.destinationId === destination.id ||
        (destination.slug && r.destinationSlug === destination.slug) ||
        r.destination === destination.name ||
        r.destination === destination.id)
  );

  const relevantReviews =
    instanceReviews.length > 0
      ? instanceReviews
      : tripReviews.length > 0
      ? tripReviews
      : destReviews;

  const reviewsHeading =
    instanceReviews.length > 0
      ? `Reviews from This Departure (${instance.displayDate})`
      : tripReviews.length > 0
      ? `Reviews for ${trip.name}`
      : `Reviews for ${destination.name}`;

  const displayedReviews = showAllReviews ? relevantReviews : relevantReviews.slice(0, 4);

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {instance.completedPhotos.map((photo, i) => (
                <div
                  key={i}
                  onClick={() => setLightboxPhoto(photo)}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#f7f8f5] border border-[#e2e8f0] shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <img
                    src={photo}
                    alt={`Trip photo ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                      </svg>
                      View Full Photo
                    </span>
                  </div>
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
        <section>
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-2">WHAT TRAVELLERS SAY</div>
          <h2 className="text-[#0f2922] text-2xl mb-6" style={{ fontFamily: "var(--font-serif)" }}>{reviewsHeading}</h2>
          {relevantReviews.length > 0 ? (
            <>
              <div className="space-y-4">
                {displayedReviews.map((review) => (
                  <div key={review.id} className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-xs">
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
                          <span className="text-[#4a5568] text-xs shrink-0">
                            {review.date ? (isNaN(Date.parse(review.date)) ? review.date : new Date(review.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })) : "Recent"}
                          </span>
                        </div>
                        <StarRating rating={review.rating} />
                        <p className="text-[#4a5568] text-sm leading-relaxed mt-2 italic">"{review.text}"</p>
                        {review.photos && review.photos.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-[#f1f5f9]">
                            {review.photos.map((photoUrl, pIdx) => (
                              <a
                                key={pIdx}
                                href={photoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#e2e8f0] hover:opacity-90 transition-opacity"
                              >
                                <img
                                  src={photoUrl}
                                  alt={`${review.name} trip photo ${pIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {relevantReviews.length > 4 && !showAllReviews && (
                <button
                  onClick={() => setShowAllReviews(true)}
                  className="mt-4 text-sm text-[#0f2922] border border-[#0f2922] px-5 py-2 rounded-full hover:bg-[#0f2922] hover:text-white transition-all cursor-pointer"
                >
                  View All {relevantReviews.length} Reviews
                </button>
              )}
            </>
          ) : (
            <div className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-2xl p-6 text-center text-sm text-[#718096]">
              <p className="mb-1 text-[#0f2922] font-medium">No reviews published for this expedition yet.</p>
              <p className="text-xs">Once verified by our team, traveller reviews and expedition memories will be featured here.</p>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="bg-[#0f2922] rounded-3xl p-8 sm:p-10 text-center">
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-2">MISSED THIS DEPARTURE?</div>
          <h2 className="text-white text-2xl sm:text-3xl mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            Experience this journey for yourself
          </h2>
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

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-11 right-0 text-white/80 hover:text-white p-1.5 transition cursor-pointer"
              title="Close image"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={lightboxPhoto}
              alt="Trip gallery preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
