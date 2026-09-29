import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

type SortKey = "default" | "price-asc" | "price-desc" | "duration";

const BADGE_COLORS: Record<string, string> = {
  "chopta-trek": "bg-[#e8622a]",
  "auli-ski": "bg-[#2563eb]",
  "rishikesh-rafting": "bg-[#16a34a]",
  "kedarnath-yatra": "bg-[#7c3aed]",
  "kanatal-camp": "bg-[#b45309]",
  "chakrata-nature": "bg-[#b45309]",
};

export default function TripsPage() {
  const { navigate, trips, destinations, tripInstances } = useApp();
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = trips.filter((t) => {
    // Hide drafts and archived trips from visitors
    if (t.status === "draft" || t.status === "archived") return false;
    if (filter === "all") return true;
    if (t.destination === filter) return true;
    if (t.destinations && t.destinations.some((d) => d.id === filter || d.slug === filter)) return true;
    return false;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "duration") {
      const daysA = parseInt(a.duration);
      const daysB = parseInt(b.duration);
      return daysA - daysB;
    }
    return 0;
  });

  const sortLabels: Record<SortKey, string> = {
    default: "Default",
    "price-asc": "Price: Low → High",
    "price-desc": "Price: High → Low",
    duration: "Duration",
  };

  const filterTabs = [
    { label: "All Destinations", val: "all" },
    ...destinations.map((d) => ({ label: d.name, val: d.id })),
  ];

  const activeDestinationLabel = filterTabs.find((f) => f.val === filter)?.label || "All Destinations";

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

      {/* Filters & Sorting */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-[#e2e8f0]/60">
          {/* Destination Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className="flex items-center gap-2 bg-white border border-[#e2e8f0] px-3.5 py-2 rounded-xl text-sm text-[#4a5568] hover:border-[#0f2922] transition-colors shadow-2xs cursor-pointer"
              >
                <span className="text-xs text-[#718096]">Destination:</span>
                <span className="text-[#0f2922] font-semibold">{activeDestinationLabel}</span>
                <svg className={`w-3.5 h-3.5 text-[#718096] transition-transform ${filterOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {filterOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 max-h-72 overflow-y-auto bg-white border border-[#e2e8f0] rounded-xl shadow-lg py-1 z-30">
                  {filterTabs.map((f, idx) => (
                    <button
                      key={f.val}
                      onClick={() => { setFilter(f.val); setFilterOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between cursor-pointer ${
                        idx === 1 ? "border-t border-[#f0f4f1] mt-1 pt-2" : ""
                      } ${
                        filter === f.val ? "text-[#0f2922] font-semibold bg-[#f7f8f5]" : "text-[#4a5568] hover:bg-[#f7f8f5]"
                      }`}
                    >
                      <span>{f.label}</span>
                      {filter === f.val && <span className="text-[#0f2922]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="text-xs text-[#718096] hover:text-[#e8622a] underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Right side: Count & Sort */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#718096] hidden sm:inline">
              Showing {sorted.length} trip{sorted.length !== 1 ? "s" : ""}
            </span>
            <div className="relative shrink-0" ref={sortRef}>
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-2 bg-white border border-[#e2e8f0] px-3.5 py-2 rounded-xl text-sm text-[#4a5568] hover:border-[#0f2922] transition-colors shadow-2xs cursor-pointer"
              >
                <span className="text-xs text-[#718096]">Sort:</span>
                <span className="text-[#0f2922] font-semibold">{sortLabels[sort]}</span>
                <svg className={`w-3.5 h-3.5 text-[#718096] transition-transform ${sortOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e2e8f0] rounded-xl shadow-lg py-1 z-30">
                  {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setSort(key); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer ${
                        sort === key ? "text-[#0f2922] font-semibold bg-[#f7f8f5]" : "text-[#4a5568] hover:bg-[#f7f8f5]"
                      }`}
                    >
                      <span>{sortLabels[key]}</span>
                      {sort === key && <span className="text-[#0f2922]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((trip) => {
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
                  <div className="p-5 pb-3">
                    <div className="flex items-center justify-between text-xs text-[#718096] mb-1.5">
                      <span className="text-[#e8622a] font-medium uppercase tracking-wider text-[11px]">{trip.category}</span>
                      <span>{trip.duration}</span>
                    </div>
                    <h3 className="text-[#0f2922] text-lg font-semibold mb-1.5 hover:text-[#e8622a] transition-colors line-clamp-1" style={{ fontFamily: "var(--font-serif)" }}>
                      <Link to={`/trips/${trip.slug || trip.id}`}>{trip.name}</Link>
                    </h3>
                    <p className="text-[#718096] text-xs leading-relaxed line-clamp-2 h-9 overflow-hidden">
                      {trip.shortDescription || trip.overview || ""}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-3 border-t border-[#e2e8f0] flex items-center justify-between mt-auto">
                  <div>
                    <div className="text-[10px] text-[#718096] uppercase tracking-wider mb-0.5">STARTING PRICE</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#0f2922] text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                        ₹{trip.price.toLocaleString("en-IN")}
                      </span>
                      {upcomingCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-normal px-2 py-0.5 rounded-full bg-black/[0.03] text-[#718096] border border-black/[0.06]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38a169]/70" />
                          {upcomingCount} upcoming
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/trips/${trip.slug || trip.id}`}
                    className="bg-[#0f2922] hover:bg-[#1a4a39] text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
                  >
                    ENQUIRE
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        {sorted.length === 0 && (
          <div className="text-center py-20 text-[#4a5568]">No packages found for this category.</div>
        )}
      </div>

      <Footer />
    </div>
  );
}
