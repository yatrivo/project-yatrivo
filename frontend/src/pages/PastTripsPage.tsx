import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const Stars = ({ count = 5 }: { count?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < count ? "#f59e0b" : "#e2e8f0"}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ))}
  </div>
);

export default function PastTripsPage() {
  const { tripInstances, trips, destinations } = useApp();

  const completedInstances = tripInstances
    .filter((inst) => inst.status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <SEO
        title="Past Himalayan Adventures & Expedition Archives"
        description="Explore the archives of Yatrivo's completed Himalayan departures, summit photos, trail stats, and explorer stories across Uttarakhand."
        keywords="past treks, himalayan expedition archives, yatrivo past trips, summit memories"
      />
      {/* Header */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=600&fit=crop&auto=format"
          alt="Himalayan mountains"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay-compact" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-3 text-contrast-subtle">MEMORIES MADE</div>
          <h1 className="text-white text-4xl sm:text-5xl md:text-6xl mb-5 text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>Our Past Adventures</h1>
          <p className="text-white/90 text-base max-w-2xl mx-auto leading-relaxed text-contrast-body">
            Every journey we lead becomes a story. Here's a look at the adventures, summits, and moments shared by our past groups. Each trip is proof that travelling with the right people changes everything.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-3 gap-6 text-center">
          {[
            { val: "15,000+", label: "Happy Explorers" },
            { val: "200+", label: "Trips Completed" },
            { val: "4.9 / 5", label: "Average Rating" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif)" }}>{s.val}</div>
              <div className="text-[#4a5568] text-xs sm:text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Past Trips Grid */}
      <section className="py-16 bg-[#f7f8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedInstances.map((inst) => {
              const trip = trips.find((t) => t.id === inst.tripId || (t.slug && t.slug === inst.tripId));
              if (!trip) return null;
              const destLabel = trip.destinations && trip.destinations.length > 0
                ? trip.destinations.map((d) => d.name).join(", ")
                : (destinations.find((d) => d.id === trip.destination || d.slug === trip.destination)?.name || (trip.destination && trip.destination.length > 30 ? "Uttarakhand" : trip.destination) || "Uttarakhand");
              const coverImg = inst.completedPhotos?.[0] ?? trip.image;
              return (
                <Link
                  key={inst.id}
                  to={`/past-trips/${inst.id}`}
                  className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden text-left hover:shadow-md transition-shadow w-full block group"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img src={coverImg} alt={trip.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 badge-glass-dark text-white text-xs font-medium px-3 py-1 rounded-full">
                      {inst.spotsTotal} participants
                    </div>
                    <div className="absolute inset-0 card-overlay-bottom" />
                    <div className="absolute bottom-0 left-0 p-4">
                      <div className="text-[#e8622a] text-xs font-semibold uppercase tracking-wide mb-0.5 text-contrast-subtle">{destLabel}</div>
                      <div className="text-white font-semibold text-sm leading-snug text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>{trip.name}</div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Stars count={5} />
                      <span className="text-[#4a5568] text-xs">{inst.displayDate}</span>
                    </div>
                    {inst.notes ? (
                      <p className="text-[#4a5568] text-sm leading-relaxed italic mb-3">"{inst.notes}"</p>
                    ) : (
                      <p className="text-[#4a5568] text-sm leading-relaxed mb-3">
                        {trip.shortDescription ||
                          (typeof trip.highlights?.[0] === "string"
                            ? trip.highlights[0]
                            : (trip.highlights?.[0] as any)?.value
                            ? `${(trip.highlights[0] as any).label}: ${(trip.highlights[0] as any).value}`
                            : trip.overview?.slice(0, 110) || "")}
                      </p>
                    )}
                    <div className="text-[#e8622a] text-xs font-medium group-hover:underline">VIEW TRIP DETAILS →</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">YOUR ADVENTURE AWAITS</div>
          <h2 className="text-[#0f2922] text-3xl sm:text-4xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>Be Part of Our Next Adventure</h2>
          <p className="text-[#4a5568] text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            Join the growing Yatrivo family of mindful explorers. Your story is waiting to be written in the Himalayas.
          </p>
          <Link
            to="/plan"
            className="inline-block bg-[#e8622a] hover:bg-[#d45520] text-white font-medium px-8 py-3.5 rounded-full transition-colors text-sm tracking-wide"
          >
            PLAN MY TRIP NOW
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
