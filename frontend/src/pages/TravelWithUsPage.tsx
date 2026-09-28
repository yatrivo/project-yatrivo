import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

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
  { id: "1", label: "Alpine Trekking", img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop&auto=format" },
  { id: "2", label: "Mountain Camping", img: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=600&h=400&fit=crop&auto=format" },
  { id: "3", label: "River Rafting", img: "https://images.unsplash.com/photo-1541540720359-d9c4da8f55af?w=600&h=400&fit=crop&auto=format" },
  { id: "4", label: "Himalayan Temples", img: "https://images.unsplash.com/photo-1580281657702-257584239a55?w=600&h=400&fit=crop&auto=format" },
  { id: "5", label: "Snow Adventures", img: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600&h=400&fit=crop&auto=format" },
  { id: "6", label: "Sunrise Meditation", img: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&h=400&fit=crop&auto=format" },
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
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop&auto=format"
          alt="Himalayan landscape"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay-directional-side" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-4 text-contrast-subtle">JOIN THE MOVEMENT</div>
          <h1 className="text-white text-5xl sm:text-6xl md:text-7xl leading-[1.05] mb-6 max-w-2xl text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>
            Travel With<br />Yatrivo
          </h1>
          <p className="text-white/90 text-base sm:text-lg max-w-lg mb-10 leading-relaxed text-contrast-body">
            Small groups, authentic experiences, and deep connection with the Himalayas. No crowded buses, no rushed itineraries — just real adventure with like-minded explorers.
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
            <p className="text-[#4a5568] text-sm mt-3 max-w-xl mx-auto">Every detail is thoughtfully designed to give you a safe, immersive, and genuinely memorable Himalayan experience.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-[#f7f8f5] rounded-2xl p-6 border border-[#e2e8f0]">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-[#0f2922] font-semibold mb-2">{f.title}</h3>
                <p className="text-[#4a5568] text-sm leading-relaxed">{f.desc}</p>
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
                <img src={h.img} alt={h.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
            <p className="text-[#4a5568] text-sm mt-3 max-w-md mx-auto">Every month, a new group of adventurers discovers the Himalayas with Yatrivo. Here are some of our most recent completed trips.</p>
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
                  <div className="relative h-48 overflow-hidden">
                    <img src={coverImg} alt={destLabel} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 bg-[#0f2922]/80 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
                      {inst.spotsTotal} participants
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-[#e8622a] text-xs font-medium uppercase tracking-wide mb-1">{destLabel}</div>
                    <h3 className="text-[#0f2922] font-semibold mb-1 group-hover:text-[#e8622a] transition-colors" style={{ fontFamily: "var(--font-serif)" }}>{trip.name}</h3>
                    <div className="text-[#4a5568] text-xs">{inst.displayDate}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=600&fit=crop&auto=format" alt="Forest mountain path" className="absolute inset-0 w-full h-full object-cover" />
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
