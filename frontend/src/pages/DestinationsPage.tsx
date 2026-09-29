import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { UTTARAKHAND_EXPERIENCE_TAGS } from "@/data/destinations";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

type SortKey = "recommended" | "name" | "popularity";

const seasons = [
  { label: "WINTER (Dec – Feb)", desc: "Skiing in Auli, snowy campsites in Kanatal." },
  { label: "SPRING (March – May)", desc: "Rhododendron treks in Chopta, Ganga rapids." },
  { label: "SUMMER (June – Aug)", desc: "Cool waterfalls of Chakrata, Mussoorie retreats." },
  { label: "AUTUMN (Sept – Nov)", desc: "Sacred temple pilgrimages, crystal-clear Himalayan views." },
];

export default function DestinationsPage() {
  const { navigate, destinations } = useApp();
  const [filter, setFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

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

  const filtered = destinations.filter((d) => {
    if (filter === "all") return true;
    return d.experienceTags?.includes(filter) || d.category === filter;
  });

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
      <SEO
        title="Uttarakhand Destinations & Valleys"
        description="From the sacred rapids of Ganga in Rishikesh to the snow-laden slopes of Auli and high alpine quiet of Chopta, discover pristine Uttarakhand destinations with Yatrivo."
        keywords="Uttarakhand destinations, Chopta, Auli, Kedarnath, Rishikesh, Mussoorie, Kanatal, Chakrata, travel Uttarakhand"
      />
      {/* Header */}
      <section className="pt-14 pb-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">EXPLORE THE SACRED STATE</div>
        <h1 className="page-heading text-[#0f2922] mb-4">Our Curated Havens in Uttarakhand</h1>
        <p className="text-[#4a5568] text-sm sm:text-base max-w-2xl leading-relaxed">
          From the sacred rapids of Ganga in Rishikesh to the snow-laden slopes of Auli and high alpine quiet of Chopta, discover pristine landscapes curated specifically for active, youthful souls.
        </p>
      </section>

      {/* Filters & Sorting */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-[#e2e8f0]/60">
          {/* Experience Filter Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className="flex items-center gap-2 bg-white border border-[#e2e8f0] px-3.5 py-2 rounded-xl text-sm text-[#4a5568] hover:border-[#0f2922] transition-colors shadow-2xs cursor-pointer"
              >
                <span className="text-xs text-[#718096]">Experience:</span>
                <span className="text-[#0f2922] font-semibold">{filter === "all" ? "All Experiences" : filter}</span>
                <svg className={`w-3.5 h-3.5 text-[#718096] transition-transform ${filterOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {filterOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 max-h-72 overflow-y-auto bg-white border border-[#e2e8f0] rounded-xl shadow-lg py-1 z-30">
                  <button
                    onClick={() => { setFilter("all"); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between cursor-pointer ${
                      filter === "all" ? "text-[#0f2922] font-semibold bg-[#f7f8f5]" : "text-[#4a5568] hover:bg-[#f7f8f5]"
                    }`}
                  >
                    <span>All Experiences</span>
                    {filter === "all" && <span className="text-[#0f2922]">✓</span>}
                  </button>
                  <div className="h-px bg-[#f0f4f1] my-1" />
                  {UTTARAKHAND_EXPERIENCE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => { setFilter(tag); setFilterOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between cursor-pointer ${
                        filter === tag ? "text-[#0f2922] font-semibold bg-[#f7f8f5]" : "text-[#4a5568] hover:bg-[#f7f8f5]"
                      }`}
                    >
                      <span>{tag}</span>
                      {filter === tag && <span className="text-[#0f2922]">✓</span>}
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
              Showing {sorted.length} destination{sorted.length !== 1 ? "s" : ""}
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
                <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-[#e2e8f0] rounded-xl shadow-lg py-1 z-30">
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

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((d) => (
            <Link
              key={d.id}
              to={`/destinations/${d.slug || d.id}`}
              className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden hover:shadow-lg transition-shadow group flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="h-52 overflow-hidden relative">
                  <img src={d.image} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {d.season && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full badge-glass-dark text-white">
                      {d.season}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-[#0f2922] text-xl line-clamp-1 mb-1.5" style={{ fontFamily: "var(--font-serif)" }}>
                    {d.name}
                  </h3>
                  <p className="text-[#718096] text-sm leading-relaxed line-clamp-2">
                    {d.tagline || d.description}
                  </p>
                </div>
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
