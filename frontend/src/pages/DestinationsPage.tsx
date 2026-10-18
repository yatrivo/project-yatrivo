import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import ProgressiveImage from "@/components/ProgressiveImage";

const seasons = [
  { label: "WINTER (Dec – Feb)", desc: "Skiing in Auli, snowy campsites in Kanatal." },
  { label: "SPRING (March – May)", desc: "Rhododendron treks in Chopta, Ganga rapids." },
  { label: "SUMMER (June – Aug)", desc: "Cool waterfalls of Chakrata, Mussoorie retreats." },
  { label: "AUTUMN (Sept – Nov)", desc: "Sacred temple pilgrimages, crystal-clear Himalayan views." },
];

export default function DestinationsPage() {
  const { destinations } = useApp();

  const activeDestinations = useMemo(
    () => destinations.filter((d) => d.status !== "archived"),
    [destinations]
  );

  return (
    <div>
      <SEO
        title="Uttarakhand Destinations & Valleys"
        description="From the sacred rapids of Ganga in Rishikesh to the snow-laden slopes of Auli and high alpine quiet of Chopta, discover pristine Uttarakhand destinations with Yatrivo."
        keywords="Uttarakhand destinations, Chopta, Auli, Kedarnath, Rishikesh, Mussoorie, Kanatal, Chakrata, travel Uttarakhand"
      />

      {/* Header */}
      <section className="pt-6 sm:pt-14 pb-5 sm:pb-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-[#e8622a] text-[11px] sm:text-xs uppercase tracking-widest font-semibold mb-1.5 sm:mb-3">
          EXPLORE THE SACRED STATE
        </div>
        <h1
          className="text-[#0f2922] text-[26px] sm:text-4xl md:text-5xl font-normal leading-[1.15] sm:leading-tight mb-2 sm:mb-4"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Our Curated Havens in Uttarakhand
        </h1>
        <p className="text-[#4a5568] text-[13.5px] sm:text-base max-w-2xl leading-relaxed">
          From the sacred rapids of Ganga in Rishikesh to the snow-laden slopes of Auli and high alpine quiet of Chopta, discover pristine landscapes curated specifically for active, youthful souls.
        </p>
      </section>

      {/* Destination Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 sm:pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {activeDestinations.map((d, idx) => (
            <Link
              key={d.id}
              to={`/destinations/${d.slug || d.id}`}
              className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden hover:shadow-lg transition-all duration-300 group block w-full min-w-0 text-left cursor-pointer"
            >
              <div className="aspect-[16/10] sm:aspect-auto sm:h-52 overflow-hidden relative bg-[#f7f8f5]">
                <ProgressiveImage
                  src={d.image}
                  alt={d.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  containerClassName="w-full h-full relative"
                  priority={idx < 3}
                />
                {d.season && (
                  <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 max-w-[calc(100%-1.5rem)] truncate text-[9.5px] sm:text-[10px] font-semibold tracking-wide uppercase px-2 sm:px-2.5 py-0.5 rounded-full badge-glass-dark text-white z-10 pointer-events-none">
                    {d.season}
                  </span>
                )}
                <div className="absolute inset-0 card-overlay-bottom pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-10">
                  <div
                    className="text-white font-semibold text-[17px] sm:text-xl leading-snug text-contrast-title drop-shadow-xs truncate"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {d.name}
                  </div>
                </div>
              </div>
              <div className="px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-2.5 min-w-0 border-t border-[#f0f4f2] bg-white">
                <span className="text-[#718096] text-xs font-medium min-w-0 truncate flex-1 leading-normal sm:leading-tight">
                  {d.tagline || d.description || "Pristine Himalayan destination"}
                </span>
                <span className="text-[#e8622a] text-xs font-semibold group-hover:underline shrink-0 whitespace-nowrap leading-tight">
                  EXPLORE →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Seasonal Calendar */}
      <section style={{ background: "var(--forest)" }} className="py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 items-center">
          <div>
            <div className="text-[#e8622a] text-[11px] sm:text-xs uppercase tracking-widest font-semibold mb-2 sm:mb-3">
              SEASONAL HIMALAYAN CALENDAR
            </div>
            <h2
              className="text-white text-xl sm:text-3xl md:text-4xl mb-3 sm:mb-5 font-normal leading-tight"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              When is the mountains' heartbeat strongest?
            </h2>
            <p className="text-white/70 text-[13.5px] sm:text-sm leading-relaxed mb-5 sm:mb-7">
              Uttarakhand alters dramatically with seasons. Winter brings powder snow to Auli, Spring dresses Chopta in deep rhododendron pink, Monsoon cleanses Rishikesh, and Autumn unlocks the clearest high-altitude stargazing. Let us guide you on the perfect timing.
            </p>
            <Link
              to="/faq"
              className="text-white border-b border-white/40 text-xs sm:text-sm pb-0.5 hover:border-white transition-colors inline-block font-medium tracking-wide"
            >
              READ OUR WEATHER GUIDE →
            </Link>
          </div>
          <div className="space-y-2.5 sm:space-y-3">
            {seasons.map((s) => (
              <div key={s.label} className="bg-white/10 hover:bg-white/15 transition-colors rounded-xl px-4 py-3 sm:px-5 sm:py-4">
                <div className="text-white font-medium text-xs sm:text-sm mb-0.5">{s.label}</div>
                <div className="text-white/60 text-xs sm:text-sm leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
