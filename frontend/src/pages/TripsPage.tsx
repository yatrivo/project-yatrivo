import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

export default function TripsPage() {
  const { trips, tripInstances } = useApp();

  const publishedTrips = trips.filter(
    (t) => t.status !== "draft" && t.status !== "archived"
  );

  return (
    <div>
      <SEO
        title="Curated Himalayan Treks & Expeditions"
        description="Explore our handcrafted high-altitude treks, sacred pilgrimages, and mountain expeditions across Uttarakhand with Yatrivo."
        keywords="Uttarakhand treks, Himalayan expeditions, Chopta Tungnath, Kedarnath trek, Auli trip, Chandrashila, adventure travel India"
      />
      {/* Header */}
      <section className="pt-10 sm:pt-14 pb-6 sm:pb-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-2.5 sm:mb-3">CHOOSE YOUR EXPEDITION</div>
        <h1 className="page-heading text-[#0f2922] max-sm:text-[29px] max-sm:leading-[1.12] mb-3 sm:mb-4">Curated Himalayan Experiences</h1>
        <p className="text-[#4a5568] text-[15px] sm:text-base max-w-xl leading-[1.5] sm:leading-relaxed max-sm:mb-0">
          No crowded buses, no rushed tourist traps. Enjoy small active explorer groups, pristine wood cabins, and deep connection with nature.
        </p>
      </section>

      {/* Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {publishedTrips.map((trip) => {
            const upcomingCount = tripInstances.filter(
              (inst) => inst.tripId === trip.id && inst.status === "upcoming"
            ).length;

            return (
              <div key={trip.id} className="h-full bg-white rounded-xl sm:rounded-2xl border border-[#e2e8f0] overflow-hidden hover:shadow-lg transition-all group flex flex-col justify-between min-w-0">
                <div className="flex-1 flex flex-col">
                  {/* Aspect Ratio Controlled Image - Compact & proportional */}
                  <div className="relative aspect-[16/9] sm:aspect-[16/9.5] w-full overflow-hidden block bg-[#f7f8f5]">
                    <Link to={`/trips/${trip.slug || trip.id}`} className="block w-full h-full">
                      <img
                        src={trip.image}
                        alt={trip.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </Link>

                    {/* Badge */}
                    {(trip.badge || trip.category) && (
                      <span className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 text-[9.5px] sm:text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full badge-glass-dark text-white z-10 pointer-events-none">
                        {trip.badge || trip.category}
                      </span>
                    )}
                  </div>

                  {/* Card Content with Tight, Clean Alignment */}
                  <div className="px-3.5 pt-2.5 pb-2 sm:px-4 sm:pt-3 sm:pb-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#718096] mb-1">
                        <span className="text-[#e8622a] font-medium uppercase tracking-wider text-[10px] sm:text-[11px] truncate">
                          {trip.category}
                        </span>
                        <span className="text-[10.5px] sm:text-xs shrink-0 font-medium text-[#718096]">
                          {trip.duration}
                        </span>
                      </div>
                      <h3
                        className="text-[#0f2922] text-[15px] sm:text-[16.5px] font-semibold leading-snug hover:text-[#e8622a] transition-colors line-clamp-2"
                        style={{ fontFamily: "var(--font-serif)" }}
                      >
                        <Link to={`/trips/${trip.slug || trip.id}`}>{trip.name}</Link>
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Starting Price & Primary Action */}
                <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 border-t border-[#f1f5f9] bg-[#fafafa]/80 flex items-center justify-between gap-2 mt-auto">
                  <div className="min-w-0">
                    <div className="text-[8.5px] sm:text-[9.5px] text-[#718096] uppercase tracking-wider leading-tight mb-0.5 font-medium">
                      STARTING PRICE
                    </div>
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="text-[#0f2922] text-[15px] sm:text-base font-bold leading-none" style={{ fontFamily: "var(--font-serif)" }}>
                        ₹{trip.price.toLocaleString("en-IN")}
                      </span>
                      {upcomingCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[8.5px] sm:text-[9.5px] font-normal px-1.5 py-0.5 rounded-full bg-black/[0.03] text-[#718096] border border-black/[0.06] shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38a169]/70" />
                          {upcomingCount} upcoming
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/trips/${trip.slug || trip.id}`}
                    className="bg-[#0f2922] hover:bg-[#1a4a39] text-white text-[11px] sm:text-xs font-semibold px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full transition-colors cursor-pointer shrink-0"
                  >
                    ENQUIRE
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        {publishedTrips.length === 0 && (
          <div className="text-center py-20 text-[#4a5568]">No packages found.</div>
        )}
      </div>

      <Footer />
    </div>
  );
}
