import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";

type Filter = "all" | "treks" | "ski" | "spiritual";

const reviews = [
  {
    category: "ALPINE TREK",
    filter: ["all", "treks"],
    text: "The high-altitude winter snow slopes were gorgeous, but what made it truly magical was our crew and our local guides. We stayed in warm Hinoki timber cabins, drank organic hot tea, and sang traditional Pahadi folk songs around a real wood fireplace at basecamp. Highly recommend Yatrivo!",
    name: "Siddharth Verma",
    trip: "Chopta Tungnath Trek",
    date: "Feb 2026",
  },
  {
    category: "YOGA & GANGA",
    filter: ["all", "treks"],
    text: "Truly a soul-cleansing, mindful getaway. Our days balanced intense white-water rafting on pure Ganga rapids with serene sunrise meditation. Premium riverside glamping with certified guides who put local ecological respect first.",
    name: "Ananya Mehta",
    trip: "Rishikesh Yoga Rapids",
    date: "Jan 2026",
  },
  {
    category: "SKIING",
    filter: ["all", "ski"],
    text: "Most operators pack 30 people in a cramped bus. Yatrivo felt like a premium roadtrip with close friends. Certified instructors, top-tier ski gear, beautiful wooden lodges, and clear views of the peaks.",
    name: "Kabir Sen",
    trip: "Auli Ski Experience",
    date: "Jan 2026",
  },
  {
    category: "SACRED HIGH ALTITUDE",
    filter: ["all", "spiritual"],
    text: "A deeply spiritual experience handled with absolute professionalism. The medical assistance, oxy kits, and custom warm tents kept our young group safe and robust. The priority temple access helped avoid chaotic crowds.",
    name: "Riya Sharma",
    trip: "Kedarnath Sacred Pilgrimage",
    date: "Nov 2025",
  },
  {
    category: "WEEKEND HIDEOUT",
    filter: ["all", "treks"],
    text: "Stunning forest stays! Kanatal is quiet, and the wood-paneled stargazing shelters are spectacular. We could see the Milky Way clearly. Real organic food sourced from village farms. Outstanding work by Yatrivo.",
    name: "Devanshu Negi",
    trip: "Kanatal Stargazing Cabin",
    date: "Oct 2025",
  },
  {
    category: "OFFBEAT EXPLORATION",
    filter: ["all", "treks"],
    text: "Breathtaking waterfalls and ancient hill forts away from any commercial noise. Small-batch groups, Certified local guides, and lovely organic lunch in a rural village home. Loved the mindful energy.",
    name: "Preeti Joshi",
    trip: "Chakrata Tiger Falls Excursion",
    date: "Sept 2025",
  },
];

const Stars = () => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    ))}
  </div>
);

export default function ReviewsPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = reviews.filter((r) => r.filter.includes(filter));

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[45vh] min-h-[300px] flex items-end pb-12 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1920&h=800&fit=crop&auto=format"
          alt="Group of travelers around campfire in mountains"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay-directional" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-3 text-contrast-subtle">AUTHENTIC TESTIMONIALS</div>
          <h1 className="text-white text-4xl sm:text-5xl mb-4 text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>Wanderers Speak From Their Hearts</h1>
          <p className="text-white/90 text-sm sm:text-base max-w-xl leading-relaxed text-contrast-body">
            Over 15,000 active, youthful explorers have experienced the pristine Himalayas with our mindful travel collective. Read their honest, verified stories.
          </p>
        </div>
      </section>

      {/* Rating Summary */}
      <section className="py-10 bg-white border-b border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-12">
            <div className="shrink-0">
              <div className="text-6xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif)" }}>4.9</div>
              <Stars />
              <div className="text-[#4a5568] text-xs mt-1">OUT OF 5 STARS</div>
            </div>
            <div className="text-[#4a5568] text-sm leading-relaxed max-w-sm">
              Based on 1,450+ verified independent traveler reviews across Google, Trustpilot, and direct feedback.
            </div>
            <div className="sm:ml-auto flex flex-wrap items-center gap-2">
              <Link
                to="/reviews/new"
                className="bg-[#e8622a] hover:bg-[#d45520] text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                Write a Review
              </Link>
              {[
                { label: "All Reviews", val: "all" as Filter },
                { label: "High Treks", val: "treks" as Filter },
                { label: "Ski Season", val: "ski" as Filter },
                { label: "Spiritual", val: "spiritual" as Filter },
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
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-14 bg-[#f7f8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((r) => (
              <div key={r.name} className="bg-white rounded-2xl p-6 border border-[#e2e8f0] flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <Stars />
                  <span className="text-[#e8622a] text-[10px] uppercase tracking-wider font-medium">{r.category}</span>
                </div>
                <p className="text-[#4a5568] text-sm leading-relaxed italic flex-1 mb-5">"{r.text}"</p>
                <div className="border-t border-[#e2e8f0] pt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[#0f2922] font-medium text-sm">{r.name}</div>
                    <div className="text-[#e8622a] text-xs mt-0.5">{r.trip}</div>
                  </div>
                  <div className="text-[#4a5568] text-xs">{r.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Movement */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">THE COMMUNITY GROWS</div>
            <h2 className="text-[#0f2922] text-3xl sm:text-4xl mb-5" style={{ fontFamily: "var(--font-serif)" }}>Join the Mindful Travel Movement</h2>
            <p className="text-[#4a5568] text-sm leading-relaxed mb-7">
              Whether you want a high alpine trek, sunrise yoga over Ganga rapids, or cozy cabin stargazing, join a collective of thoughtful, active young wanderers who explore Uttarakhand with certified local guides and certified execution.
            </p>
            <Link
              to="/plan"
              className="inline-block bg-[#e8622a] hover:bg-[#d45520] text-white px-7 py-3 rounded-full text-sm font-medium transition-colors"
            >
              PLAN YOUR ADVENTURE
            </Link>
          </div>
          <div className="rounded-2xl overflow-hidden h-72">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&auto=format"
              alt="Mountain cabin under starry sky"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
