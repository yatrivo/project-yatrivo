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
      <section className="pt-14 pb-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">CHOOSE YOUR EXPEDITION</div>
        <h1 className="page-heading text-[#0f2922] mb-4">Curated Himalayan Experiences</h1>
        <p className="text-[#4a5568] text-sm sm:text-base max-w-xl leading-relaxed">
          No crowded buses, no rushed tourist traps. Enjoy small active explorer groups, pristine wood cabins, and deep connection with nature.
        </p>
      </section>

      {/* Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedTrips.map((trip) => {
            const upcomingCount = tripInstances.filter(
              (inst) => inst.tripId === trip.id && inst.status === "upcoming"
            ).length;

            return (
              <div key={trip.id} className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden hover:shadow-lg transition-shadow group flex flex-col justify-between">
                <div>
                  <Link to={`/trips/${trip.slug || trip.id}`} className="relative h-52 overflow-hidden block">
                    <img
                      src={trip.image}
                      alt={trip.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {(trip.badge || trip.category) && (
                      <span className="absolute top-3 left-3 text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full badge-glass-dark text-white">
                        {trip.badge || trip.category}
                      </span>
                    )}
                  </Link>
                  <div className="px-3.5 pt-2.5 pb-2">
                    <div className="flex items-center justify-between text-xs text-[#718096] mb-1">
                      <span className="text-[#e8622a] font-medium uppercase tracking-wider text-[10px] sm:text-[11px]">{trip.category}</span>
                      <span className="text-[11px] sm:text-xs">{trip.duration}</span>
                    </div>
                    <h3 className="text-[#0f2922] text-base sm:text-lg font-semibold mb-1 hover:text-[#e8622a] transition-colors line-clamp-1" style={{ fontFamily: "var(--font-serif)" }}>
                      <Link to={`/trips/${trip.slug || trip.id}`}>{trip.name}</Link>
                    </h3>
                    <p className="text-[#718096] text-[11px] sm:text-xs leading-snug line-clamp-1">
                      {trip.shortDescription || trip.overview || ""}
                    </p>
                  </div>
                </div>

                <div className="px-3.5 py-2.5 border-t border-[#e2e8f0] flex items-center justify-between mt-auto">
                  <div>
                    <div className="text-[9px] sm:text-[10px] text-[#718096] uppercase tracking-wider">STARTING PRICE</div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-[#0f2922] text-base sm:text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                        ₹{trip.price.toLocaleString("en-IN")}
                      </span>
                      {upcomingCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-normal px-2 py-0.5 rounded-full bg-black/[0.03] text-[#718096] border border-black/[0.06]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38a169]/70" />
                          {upcomingCount} upcoming
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/trips/${trip.slug || trip.id}`}
                    className="bg-[#0f2922] hover:bg-[#1a4a39] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
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
