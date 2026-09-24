import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";

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
  const { navigate, trips, destinations } = useApp();
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = trips.filter((t) =>
    filter === "all" ? true : t.destination === filter
  );

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
    { label: "All Packages", val: "all" },
    ...destinations.map((d) => ({ label: d.name, val: d.id })),
  ];

  return (
    <div>
      {/* Header */}
      <section className="pt-14 pb-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">CHOOSE YOUR EXPEDITION</div>
        <h1 className="text-[#0f2922] text-4xl sm:text-5xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>Curated Himalayan Experiences</h1>
        <p className="text-[#4a5568] text-sm sm:text-base max-w-xl leading-relaxed">
          No crowded buses, no rushed tourist traps. Enjoy small active explorer groups, pristine wood cabins, and deep connection with nature.
        </p>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((f) => (
              <button
                key={f.val}
                onClick={() => setFilter(f.val)}
                className={`px-4 py-1.5 rounded-full text-sm transition-all border ${
                  filter === f.val
                    ? "bg-[#0f2922] text-white border-[#0f2922]"
                    : "border-[#e2e8f0] text-[#4a5568] hover:border-[#0f2922] hover:text-[#0f2922]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* Sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-1.5 text-sm text-[#4a5568] hover:text-[#0f2922] transition-colors"
            >
              Sort: <span className="text-[#0f2922] font-medium">{sortLabels[sort]} ↓</span>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e2e8f0] rounded-xl shadow-lg py-1 z-20">
                {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => { setSort(key); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sort === key ? "text-[#0f2922] font-medium bg-[#f7f8f5]" : "text-[#4a5568] hover:bg-[#f7f8f5]"}`}
                  >
                    {sortLabels[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((trip) => (
            <div key={trip.id} className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
              <Link to={`/trips/${trip.id}`} className="relative h-52 overflow-hidden block">
                <img
                  src={trip.image}
                  alt={trip.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className={`absolute top-3 left-3 ${BADGE_COLORS[trip.id] ?? "bg-[#e8622a]"} text-white text-xs font-semibold px-3 py-1 rounded-full`}>
                  {trip.badge}
                </span>
              </Link>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between text-xs text-[#4a5568] mb-2">
                  <span className="text-[#e8622a] font-medium uppercase tracking-wide">{trip.category}</span>
                  <span>{trip.duration}</span>
                </div>
                <h3 className="text-[#0f2922] text-xl mb-2 hover:text-[#e8622a] transition-colors" style={{ fontFamily: "var(--font-serif)" }}>
                  <Link to={`/trips/${trip.id}`}>{trip.name}</Link>
                </h3>
                <p className="text-[#4a5568] text-sm leading-relaxed flex-1">{trip.highlights[0]}</p>
                <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#4a5568] uppercase tracking-wider mb-0.5">STARTING PRICE</div>
                    <div className="text-[#0f2922] text-xl font-semibold" style={{ fontFamily: "var(--font-serif)" }}>₹{trip.price.toLocaleString("en-IN")}</div>
                  </div>
                  <Link
                    to={`/trips/${trip.id}`}
                    className="bg-[#0f2922] hover:bg-[#1a4a39] text-white text-sm font-medium px-5 py-2 rounded-full transition-colors"
                  >
                    ENQUIRE
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        {sorted.length === 0 && (
          <div className="text-center py-20 text-[#4a5568]">No packages found for this category.</div>
        )}
      </div>

      <Footer />
    </div>
  );
}
