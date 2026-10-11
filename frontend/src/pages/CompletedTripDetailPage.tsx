import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import type { PublicGalleryItem } from "@/api/gallery";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
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

export default function CompletedTripDetailPage() {
  const { instanceId } = useParams<{ instanceId: string }>();
  const { pageParams, openEnquiryModal, tripInstances, trips, destinations, reviews } = useApp();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  const displayedReviews = relevantReviews.slice(0, 3);

  const galleryLightboxItems: PublicGalleryItem[] = useMemo(
    () =>
      (instance.completedPhotos || []).map((url, idx) => ({
        id: `${instance.id}-photo-${idx}`,
        title: `${trip.name} (${instance.displayDate}) — Photo ${idx + 1}`,
        imageUrl: url,
        thumbnailUrl: url,
        viewerUrl: url,
        originalUrl: url,
        placeholder: null,
        width: null,
        height: null,
        altText: `${trip.name} photo ${idx + 1}`,
        category: destination.name || "Past Trip",
        featured: false,
        displayOrder: idx + 1,
        createdAt: new Date().toISOString(),
      })),
    [instance.id, instance.displayDate, instance.completedPhotos, trip.name, destination.name]
  );

  return (
    <div>
      <SEO
        title={`${trip.name} Expedition Recap (${instance.date})`}
        description={`Read the expedition recap, memories, reviews, and highlights from Yatrivo's ${trip.name} journey in ${destination.name}.`}
        image={trip.image}
      />
      {/* Hero */}
      <section className="relative h-[44vh] sm:h-[52vh] md:h-[84vh] min-h-[300px] sm:min-h-[360px] md:min-h-[580px] max-h-[840px] flex items-end pb-6 sm:pb-8 md:pb-12 overflow-hidden">
        <img
          src={trip.image}
          alt={trip.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay-directional" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <Link
            to="/past-trips"
            className="inline-flex items-center gap-2 text-white/85 hover:text-white text-xs sm:text-sm mb-3 sm:mb-5 transition-colors text-contrast-subtle font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Past Trips
          </Link>
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-1.5 sm:mb-2 text-contrast-subtle">{destination.name}</div>
          <h1 className="text-white text-3xl sm:text-5xl md:text-6xl mb-2.5 sm:mb-3 text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>{trip.name}</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="badge-glass-dark text-white text-xs sm:text-sm px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full">{instance.displayDate}</span>
            <span className="bg-[#e8622a] text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full btn-primary-elevated">₹{instance.price.toLocaleString("en-IN")} / person</span>
            <span className="badge-glass-dark text-white text-xs sm:text-sm px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full">{instance.spotsTotal} participants</span>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14">

        {/* Photo Gallery */}
        {instance.completedPhotos && instance.completedPhotos.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-5 gap-2">
              <div>
                <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-1">MEMORIES</div>
                <h2 className="text-[#0f2922] text-2xl" style={{ fontFamily: "var(--font-serif)" }}>Trip Gallery</h2>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#e8622a] hover:text-[#d45520] transition-colors cursor-pointer shrink-0"
              >
                <span>View All ({instance.completedPhotos.length})</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
            <div className={`grid ${instance.completedPhotos.length === 2 ? "grid-cols-2" : "grid-cols-3"} gap-2 sm:gap-4`}>
              {instance.completedPhotos.slice(0, 3).map((photo, i) => {
                const remaining = instance.completedPhotos!.length - 3;
                const isLastVisible = i === 2 && remaining > 0;
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
                    className="group relative aspect-[4/3] sm:h-48 sm:aspect-auto rounded-xl sm:rounded-2xl overflow-hidden bg-[#f7f8f5] border border-[#e2e8f0] shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer"
                  >
                    <img
                      src={photo}
                      alt={`Trip photo ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    {isLastVisible ? (
                      <div className="absolute inset-0 bg-black/55 hover:bg-black/65 transition-colors flex flex-col items-center justify-center text-white p-2 text-center">
                        <span className="text-sm sm:text-lg font-bold">+{remaining}</span>
                        <span className="text-[10px] sm:text-xs font-medium inline-flex items-center gap-1 mt-0.5">
                          View All
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                    )}
                  </div>
                );
              })}
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
        <section id="reviews">
          <div className="flex items-end justify-between gap-3 mb-6">
            <div>
              <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-1">WHAT TRAVELLERS SAY</div>
              <h2 className="text-[#0f2922] text-2xl" style={{ fontFamily: "var(--font-serif)" }}>{reviewsHeading}</h2>
            </div>
            {relevantReviews.length > 0 && (
              <Link
                to={`/destinations/${destination.slug || destination.id}/reviews`}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#e8622a] hover:text-[#d45520] transition-colors shrink-0"
              >
                <span>Show All ({relevantReviews.length})</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}
          </div>
          {relevantReviews.length > 0 ? (
            <>
              <div className="space-y-4">
                {displayedReviews.map((review) => (
                  <Link
                    key={review.id}
                    to={`/destinations/${destination.slug || destination.id}/reviews#review-${review.id}`}
                    className="group block bg-white border border-[#e2e8f0] hover:border-[#0f2922]/30 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-[#0f2922] rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {review.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <div>
                            <span className="text-[#0f2922] font-medium text-sm group-hover:text-[#e8622a] transition-colors">{review.name}</span>
                            <span className="text-[#4a5568] text-xs ml-2">· {review.tripName}</span>
                          </div>
                          <span className="text-[#4a5568] text-xs shrink-0">
                            {review.date ? (isNaN(Date.parse(review.date)) ? review.date : new Date(review.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })) : "Recent"}
                          </span>
                        </div>
                        <StarRating rating={review.rating} />
                        <p className="text-[#4a5568] text-sm leading-relaxed mt-2 italic line-clamp-3 sm:line-clamp-4">"{review.text}"</p>
                        {review.photos && review.photos.length > 0 && (
                          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#f1f5f9]">
                            {review.photos.slice(0, 3).map((photoUrl, pIdx) => {
                              const extraPhotos = review.photos!.length - 3;
                              const isLastThumb = pIdx === 2 && extraPhotos > 0;
                              return (
                                <div
                                  key={pIdx}
                                  className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-[#e2e8f0] shrink-0 bg-[#f7f8f5]"
                                >
                                  <img
                                    src={photoUrl}
                                    alt={`${review.name} trip photo ${pIdx + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                  {isLastThumb && (
                                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-xs font-semibold">
                                      +{extraPhotos}
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
              <div className="mt-5 flex justify-center sm:justify-start">
                <Link
                  to={`/destinations/${destination.slug || destination.id}/reviews`}
                  className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-[#0f2922] border border-[#0f2922] px-5 py-2.5 rounded-full hover:bg-[#0f2922] hover:text-white transition-all w-full sm:w-auto"
                >
                  <span>Show All Reviews ({relevantReviews.length})</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
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

      {/* Gallery Lightbox */}
      {lightboxIndex !== null && galleryLightboxItems.length > 0 && (
        <GalleryLightbox
          items={galleryLightboxItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <Footer />
    </div>
  );
}
