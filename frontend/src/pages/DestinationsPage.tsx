import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";

type Filter = "all" | "high-altitude" | "spiritual" | "weekend";
type SortKey = "recommended" | "name" | "popularity";

const seasons = [
  { label: "WINTER (Dec – Feb)", desc: "Skiing in Auli, snowy campsites in Kanatal." },
  { label: "SPRING (March – May)", desc: "Rhododendron treks in Chopta, Ganga rapids." },
  { label: "SUMMER (June – Aug)", desc: "Cool waterfalls of Chakrata, Mussoorie retreats." },
  { label: "AUTUMN (Sept – Nov)", desc: "Sacred temple pilgrimages, crystal-clear Himalayan views." },
];

export default function DestinationsPage() {
  const { navigate, destinations } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("recommended");
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

  const filtered = destinations.filter((d) =>
    filter === "all" ? true : d.category === filter
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    return 0; // "recommended" and "popularity" keep original order
  });

  const sortLabels: Record<SortKey, string> = {
    recommended: "Recommended",
    name: "Name A–Z",
    popularity: "Popularity",
  };

  return (
    <div>
      {/* Header */}
      <section className="pt-14 pb-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">EXPLORE THE SACRED STATE</div>
        <h1 className="text-[#0f2922] text-4xl sm:text-5xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>Our Curated Havens in Uttarakhand</h1>
        <p className="text-[#4a5568] text-sm sm:text-base max-w-2xl leading-relaxed">
          From the sacred rapids of Ganga in Rishikesh to the snow-laden slopes of Auli and high alpine quiet of Chopta, discover pristine landscapes curated specifically for active, youthful souls.
        </p>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "All Regions", val: "all" as Filter },
              { label: "High Altitude Treks", val: "high-altitude" as Filter },
              { label: "Spiritual", val: "spiritual" as Filter },
              { label: "Weekend Hideouts", val: "weekend" as Filter },
            ].map((f) => (
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
              Sort by: <span className="text-[#0f2922] font-medium">{sortLabels[sort]} ↓</span>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-[#e2e8f0] rounded-xl shadow-lg py-1 z-20">
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

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((d) => (
            <Link
              key={d.id}
              to={`/destinations/${d.id}`}
              className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden hover:shadow-lg transition-shadow group block cursor-pointer"
            >
              <div className="h-52 overflow-hidden">
                <img src={d.image} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-[#0f2922] text-xl" style={{ fontFamily: "var(--font-serif)" }}>{d.name}</h3>
                  <span className="text-[#e8622a] text-xs font-medium shrink-0 mt-1">{d.season}</span>
                </div>
                <p className="text-[#4a5568] text-sm">{d.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Seasonal Calendar */}
      <section style={{ background: "var(--forest)" }} className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">SEASONAL HIMALAYAN CALENDAR</div>
            <h2 className="text-white text-3xl sm:text-4xl mb-5" style={{ fontFamily: "var(--font-serif)" }}>When is the mountains' heartbeat strongest?</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-7">
              Uttarakhand alters dramatically with seasons. Winter brings powder snow to Auli, Spring dresses Chopta in deep rhododendron pink, Monsoon cleanses Rishikesh, and Autumn unlocks the clearest high-altitude stargazing. Let us guide you on the perfect timing.
            </p>
            <Link
              to="/faq"
              className="text-white border-b border-white/40 text-sm pb-0.5 hover:border-white transition-colors inline-block"
            >
              READ OUR WEATHER GUIDE
            </Link>
          </div>
          <div className="space-y-3">
            {seasons.map((s) => (
              <div key={s.label} className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl px-5 py-4">
                <div className="text-white font-medium text-sm mb-0.5">{s.label}</div>
                <div className="text-white/60 text-sm">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
