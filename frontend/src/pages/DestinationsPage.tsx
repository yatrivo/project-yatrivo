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
  const activeDestinations = destinations.filter((d) => d.status !== "archived");

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

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeDestinations.map((d, idx) => (
            <Link
              key={d.id}
              to={`/destinations/${d.slug || d.id}`}
              className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden hover:shadow-lg transition-all duration-300 group block w-full text-left cursor-pointer"
            >
              <div className="h-52 overflow-hidden relative">
                <ProgressiveImage
                  src={d.image}
                  alt={d.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  containerClassName="w-full h-full relative"
                  priority={idx < 3}
                />
                {d.season && (
                  <span className="absolute top-3 right-3 text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full badge-glass-dark text-white z-10">
                    {d.season}
                  </span>
                )}
                <div className="absolute inset-0 card-overlay-bottom pointer-events-none" />
                <div className="absolute bottom-0 left-0 p-4 z-10">
                  <div className="text-white font-semibold text-lg sm:text-xl leading-snug text-contrast-title drop-shadow-xs" style={{ fontFamily: "var(--font-serif)" }}>
                    {d.name}
                  </div>
                </div>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between border-t border-[#f0f4f2] bg-white">
                <span className="text-[#718096] text-xs font-medium truncate flex-1 pr-3 leading-tight">
                  {d.tagline || d.description || "Pristine Himalayan destination"}
                </span>
                <span className="text-[#e8622a] text-xs font-medium group-hover:underline shrink-0 leading-tight">
                  EXPLORE →
                </span>
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
