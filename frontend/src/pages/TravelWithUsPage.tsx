import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import SiteImage from "@/components/SiteImage";
import { SITE_ASSET_KEYS } from "@/api/siteAssets";

const features = [
  {
    icon: "🗺️",
    title: "Certified Local Guides",
    desc: "Every trek is led by NIM-certified mountain guides with Wilderness First Aid qualifications. Your safety and experience are our top priorities.",
  },
  {
    icon: "👥",
    title: "Small Groups (Max 12)",
    desc: "We keep groups intimate — maximum 12 explorers per departure. This means personal attention, genuine bonds, and zero crowding at viewpoints.",
  },
  {
    icon: "🌿",
    title: "Organic Local Food",
    desc: "All meals are sourced from local Himalayan farms. Expect fresh produce, pahadi dal, and wood-fire cooking that connects you to the land.",
  },
  {
    icon: "♻️",
    title: "Zero-Trace Trekking",
    desc: "We follow strict leave-no-trace principles. All waste is packed out, single-use plastics are banned, and we offset every trip.",
  },
];

const highlights = [
  { id: "1", label: "Alpine Trekking", assetKey: SITE_ASSET_KEYS.ACTIVITY_ALPINE_TREKKING },
  { id: "2", label: "Mountain Camping", assetKey: SITE_ASSET_KEYS.ACTIVITY_MOUNTAIN_CAMPING },
  { id: "3", label: "River Rafting", assetKey: SITE_ASSET_KEYS.ACTIVITY_RIVER_RAFTING },
  { id: "4", label: "Himalayan Temples", assetKey: SITE_ASSET_KEYS.ACTIVITY_HIMALAYAN_TEMPLES },
  { id: "5", label: "Snow Adventures", assetKey: SITE_ASSET_KEYS.ACTIVITY_SNOW_ADVENTURES },
  { id: "6", label: "Sunrise Meditation", assetKey: SITE_ASSET_KEYS.ACTIVITY_SUNRISE_MEDITATION },
];

export default function TravelWithUsPage() {
  const { tripInstances, trips, destinations } = useApp();

  const recentCompleted = tripInstances
    .filter((inst) => inst.status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <div>
      <SEO
        title="Travel With Yatrivo — Mindful Himalayan Travel Collective"
        description="Small batches (max 12), certified NIM guides, organic mountain meals, and zero-trace trekking. Discover why mindful explorers travel with Yatrivo."
        keywords="travel with yatrivo, small group himalayan tours, mindful travel collective, ethical trekking uttarakhand"
      />
      {/* Hero */}
      <section className="relative min-h-[75vh] flex items-center overflow-hidden">
        <SiteImage
          assetKey={SITE_ASSET_KEYS.TRAVEL_WITH_US_HERO}
          alt="Himalayan landscape"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay-directional-side" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 w-full">
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-4 text-contrast-subtle">JOIN THE MOVEMENT</div>
          <h1 className="text-white text-5xl sm:text-6xl md:text-7xl leading-[1.05] mb-5 max-w-2xl text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>
            Travel With<br />Yatrivo
          </h1>
          <p className="text-white/90 text-sm sm:text-base max-w-md mb-8 leading-relaxed text-contrast-body">
            Small groups, authentic experiences, and deep connection with the Himalayas.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/trips"
              className="btn-glass-outline text-white px-7 py-3.5 rounded-full text-sm font-medium transition-all shrink-0"
            >
              EXPLORE TRIPS
            </Link>
            <Link
              to="/plan"
              className="bg-[#e8622a] hover:bg-[#d45520] text-white px-7 py-3.5 rounded-full text-sm font-medium transition-colors btn-primary-elevated shrink-0"
            >
              PLAN MY TRIP →
            </Link>
          </div>
        </div>
      </section>

      {/* Why Yatrivo */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">WHY CHOOSE US</div>
            <h2 className="text-[#0f2922] text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>The Yatrivo Difference</h2>
            <p className="text-[#4a5568] text-sm mt-3 max-w-xl mx-auto text-center">Every detail is thoughtfully designed to give you a safe, immersive, and genuinely memorable Himalayan experience.</p>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-[#f7f8f5] rounded-xl p-4 sm:p-5 border border-[#e2e8f0]">
                <div className="text-2xl mb-2.5">{f.icon}</div>
                <h3 className="text-[#0f2922] text-sm sm:text-[15px] font-semibold mb-1.5">{f.title}</h3>
                <p className="text-[#4a5568] text-xs sm:text-[13px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Grid */}
      <section className="py-20 bg-[#f7f8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">WHAT AWAITS YOU</div>
            <h2 className="text-[#0f2922] text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>Himalayan Experiences</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {highlights.map((h) => (
              <Link key={h.id} to="/trips" className="relative rounded-2xl overflow-hidden h-52 group block">
                <SiteImage
                  assetKey={h.assetKey}
                  alt={h.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 card-overlay-bottom" />
                <div className="absolute bottom-0 left-0 p-4">
                  <div className="text-white font-medium text-sm text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>{h.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Completed Trips */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">RECENT DEPARTURES</div>
            <h2 className="text-[#0f2922] text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>Join Thousands of Mindful Explorers</h2>
            <p className="text-[#4a5568] text-sm mt-3 max-w-md mx-auto text-center">Every month, a new group of adventurers discovers the Himalayas with Yatrivo. Here are some of our most recent completed trips.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {recentCompleted.map((inst) => {
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
                      <div className="text-white font-semibold text-base sm:text-lg leading-snug text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>{trip.name}</div>
                    </div>
                  </div>
                  <div className="px-4 py-3.5 flex items-center justify-between border-t border-[#f0f4f2]">
                    <span className="text-[#718096] text-xs font-medium">{inst.displayDate}</span>
                    <span className="text-[#e8622a] text-xs font-medium group-hover:underline">VIEW TRIP DETAILS →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <SiteImage
          assetKey={SITE_ASSET_KEYS.TRAVEL_WITH_US_CTA_BG}
          alt="Forest mountain path"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0f2922]/80" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-white text-4xl sm:text-5xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>Ready to Explore?</h2>
          <p className="text-white/70 text-base mb-8">Tell us your dream Himalayan experience and our team will design the perfect itinerary for you.</p>
          <Link
            to="/plan"
            className="inline-block bg-white text-[#0f2922] font-medium px-8 py-3.5 rounded-full hover:bg-[#f7f8f5] transition-colors text-sm tracking-wide"
          >
            PLAN MY TRIP NOW
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
