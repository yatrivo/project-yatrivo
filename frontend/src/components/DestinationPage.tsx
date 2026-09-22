import { useState } from "react";
import imgRishikesh from "@/imports/DestCard/5d56f6223b9842e626890cbaec4c9659e258cbdb.png";

interface Package {
  id: number;
  name: string;
  duration: string;
  price: string;
  groupSize: string;
  difficulty: string;
  highlights: string[];
  image: string;
}

interface DestinationPageProps {
  onBack: () => void;
}

const galleryPhotos = [
  {
    url: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop&auto=format",
    alt: "Ganga river at dusk, Rishikesh",
  },
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1000&fit=crop&auto=format",
    alt: "Yoga session by the river",
  },
  {
    url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&h=600&fit=crop&auto=format",
    alt: "White water rafting on Ganga",
  },
  {
    url: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800&h=600&fit=crop&auto=format",
    alt: "Ganga Aarti ceremony at twilight",
  },
  {
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1000&fit=crop&auto=format",
    alt: "Lakshman Jhula suspension bridge",
  },
  {
    url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&auto=format",
    alt: "Meditation at riverside ashram",
  },
];

const packages: Package[] = [
  {
    id: 1,
    name: "Ganga Wellness Retreat",
    duration: "5 Days / 4 Nights",
    price: "₹18,500",
    groupSize: "Up to 8",
    difficulty: "Easy",
    highlights: ["Daily yoga & meditation", "Ganga Aarti ceremony", "Ayurvedic spa session"],
    image:
      "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&h=400&fit=crop&auto=format",
  },
  {
    id: 2,
    name: "Rishikesh Adventure Pack",
    duration: "4 Days / 3 Nights",
    price: "₹14,200",
    groupSize: "Up to 12",
    difficulty: "Moderate",
    highlights: ["White water rafting", "Cliff jumping at Shivpuri", "Bungee at Mohan Chatti"],
    image:
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop&auto=format",
  },
  {
    id: 3,
    name: "Himalayan Pilgrimage Trail",
    duration: "7 Days / 6 Nights",
    price: "₹26,900",
    groupSize: "Up to 6",
    difficulty: "Moderate",
    highlights: ["Char Dham yatra prep", "Haridwar kumbh ghats", "Forest trek to Neelkanth"],
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&auto=format",
  },
];

const highlights = [
  { icon: "🌊", label: "River Rafting", desc: "Grade 3–5 rapids on the Ganga" },
  { icon: "🧘", label: "Yoga Capital", desc: "200+ ashrams and yoga schools" },
  { icon: "🌅", label: "Ganga Aarti", desc: "Evening fire ceremony at Triveni Ghat" },
  { icon: "🏔️", label: "Gateway to Himalayas", desc: "Base for Char Dham & Kedarnath treks" },
];

export default function DestinationPage({ onBack }: DestinationPageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "gallery" | "packages">("overview");

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: '"DM Sans:Regular", sans-serif' }}>
      {/* Sticky Nav */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#e2e8f0]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#0f2922] hover:text-[#1a4a39] transition-colors text-sm font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
          <div className="w-px h-5 bg-[#e2e8f0]" />
          <span className="text-[#0f2922] text-sm" style={{ fontFamily: '"Instrument Serif:Regular", serif' }}>
            Rishikesh Ganga
          </span>
          <div className="ml-auto">
            <button className="bg-[#e8622a] hover:bg-[#d45520] text-white text-sm px-4 py-1.5 rounded-full transition-colors">
              Book Now
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative h-[52vh] min-h-[320px] overflow-hidden">
        <img
          src={imgRishikesh}
          alt="Rishikesh Ganga river view"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f2922]/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#e8622a] text-white text-xs px-3 py-1 rounded-full font-medium">Spiritual</span>
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">Adventure</span>
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">Wellness</span>
          </div>
          <h1
            className="text-white text-4xl md:text-5xl leading-tight mb-1"
            style={{ fontFamily: '"Instrument Serif:Regular", serif' }}
          >
            Rishikesh Ganga
          </h1>
          <p className="text-white/80 text-sm md:text-base" style={{ fontVariationSettings: '"opsz" 14' }}>
            Holy river & yoga capital · Uttarakhand, India
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-[#0f2922] text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 grid grid-cols-4 gap-4 text-center">
          {[
            { value: "4.9", label: "Rating" },
            { value: "12°C – 38°C", label: "Temperature" },
            { value: "Oct – Mar", label: "Best Season" },
            { value: "~5 hrs", label: "From Delhi" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-lg font-semibold" style={{ fontFamily: '"Instrument Serif:Regular", serif' }}>
                {stat.value}
              </div>
              <div className="text-white/60 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#e2e8f0] sticky top-14 z-30 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex gap-0">
          {(["overview", "gallery", "packages"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-[#e8622a] text-[#0f2922] font-medium"
                  : "border-transparent text-[#4a5568] hover:text-[#0f2922]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-10">
            {/* About */}
            <section>
              <h2
                className="text-[#0f2922] text-2xl mb-4"
                style={{ fontFamily: '"Instrument Serif:Regular", serif' }}
              >
                About Rishikesh
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-3">
                  <p className="text-[#4a5568] text-sm leading-relaxed" style={{ fontVariationSettings: '"opsz" 14' }}>
                    Nestled in the foothills of the Himalayas along the sacred Ganga, Rishikesh is
                    one of India's most spiritually significant towns. Known as the yoga capital of
                    the world, it draws seekers from across the globe to its ancient ashrams, serene
                    riverbanks, and powerful meditation centres.
                  </p>
                  <p className="text-[#4a5568] text-sm leading-relaxed" style={{ fontVariationSettings: '"opsz" 14' }}>
                    Beyond spirituality, the town offers thrilling adventure — white water rafting
                    through Grade 4 rapids, bungee jumping over gorges, cliff diving, and forest
                    treks to hidden waterfalls. The Ganga Aarti at Triveni Ghat, performed every
                    evening at dusk, is a ceremony that leaves even the most seasoned traveller
                    deeply moved.
                  </p>
                  <p className="text-[#4a5568] text-sm leading-relaxed" style={{ fontVariationSettings: '"opsz" 14' }}>
                    Rishikesh also serves as the gateway to the Char Dham yatra — the sacred
                    pilgrimage to Badrinath, Kedarnath, Gangotri, and Yamunotri — making it a
                    natural stopover for devotees and trekkers heading deeper into the Himalayas.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="bg-[#f7f8f5] rounded-xl p-4 space-y-3">
                    <h3 className="text-[#0f2922] text-sm font-medium">At a glance</h3>
                    {[
                      { label: "State", value: "Uttarakhand" },
                      { label: "Altitude", value: "372 m (1,220 ft)" },
                      { label: "Language", value: "Hindi, Garhwali" },
                      { label: "Nearest Airport", value: "Jolly Grant (35 km)" },
                      { label: "Nearest Railway", value: "Haridwar (24 km)" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between text-xs border-b border-[#e2e8f0] pb-2 last:border-0 last:pb-0">
                        <span className="text-[#4a5568]">{item.label}</span>
                        <span className="text-[#0f2922] font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Highlights */}
            <section>
              <h2
                className="text-[#0f2922] text-2xl mb-5"
                style={{ fontFamily: '"Instrument Serif:Regular", serif' }}
              >
                What to Experience
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {highlights.map((h) => (
                  <div
                    key={h.label}
                    className="border border-[#e2e8f0] rounded-xl p-4 hover:border-[#0f2922]/30 hover:shadow-sm transition-all"
                  >
                    <div className="text-2xl mb-2">{h.icon}</div>
                    <div className="text-[#0f2922] text-sm font-medium mb-1">{h.label}</div>
                    <div className="text-[#4a5568] text-xs leading-relaxed">{h.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Gallery preview */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2
                  className="text-[#0f2922] text-2xl"
                  style={{ fontFamily: '"Instrument Serif:Regular", serif' }}
                >
                  Photo Gallery
                </h2>
                <button
                  onClick={() => setActiveTab("gallery")}
                  className="text-[#e8622a] text-sm hover:underline"
                >
                  View all →
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 h-64">
                <div className="row-span-2 rounded-xl overflow-hidden">
                  <img
                    src={imgRishikesh}
                    alt="Rishikesh Ganga"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                    onClick={() => { setActiveTab("gallery"); }}
                  />
                </div>
                {galleryPhotos.slice(0, 4).map((photo, i) => (
                  <div key={i} className="rounded-xl overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.alt}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                      onClick={() => { setActiveTab("gallery"); }}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Packages preview */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2
                  className="text-[#0f2922] text-2xl"
                  style={{ fontFamily: '"Instrument Serif:Regular", serif' }}
                >
                  Related Packages
                </h2>
                <button
                  onClick={() => setActiveTab("packages")}
                  className="text-[#e8622a] text-sm hover:underline"
                >
                  See all →
                </button>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === "gallery" && (
          <div>
            <h2
              className="text-[#0f2922] text-2xl mb-6"
              style={{ fontFamily: '"Instrument Serif:Regular", serif' }}
            >
              Photo Gallery
            </h2>
            <div className="columns-2 md:columns-3 gap-3 space-y-3">
              <div
                className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => setLightboxIndex(0)}
              >
                <img
                  src={imgRishikesh}
                  alt="Rishikesh Ganga"
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              {galleryPhotos.map((photo, i) => (
                <div
                  key={i}
                  className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => setLightboxIndex(i + 1)}
                >
                  <img
                    src={photo.url}
                    alt={photo.alt}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Packages Tab */}
        {activeTab === "packages" && (
          <div>
            <h2
              className="text-[#0f2922] text-2xl mb-2"
              style={{ fontFamily: '"Instrument Serif:Regular", serif' }}
            >
              Curated Packages for Rishikesh
            </h2>
            <p className="text-[#4a5568] text-sm mb-7" style={{ fontVariationSettings: '"opsz" 14' }}>
              Handpicked itineraries for every kind of traveller.
            </p>
            <div className="space-y-5">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="border border-[#e2e8f0] rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col md:flex-row"
                >
                  <div className="md:w-56 h-44 md:h-auto shrink-0">
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3
                          className="text-[#0f2922] text-lg"
                          style={{ fontFamily: '"Instrument Serif:Regular", serif' }}
                        >
                          {pkg.name}
                        </h3>
                        <span className="text-[#e8622a] font-semibold text-lg shrink-0">{pkg.price}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-[#4a5568] mb-4" style={{ fontVariationSettings: '"opsz" 14' }}>
                        <span>⏱ {pkg.duration}</span>
                        <span>👥 {pkg.groupSize}</span>
                        <span>🥾 {pkg.difficulty}</span>
                      </div>
                      <ul className="space-y-1">
                        {pkg.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-2 text-sm text-[#4a5568]" style={{ fontVariationSettings: '"opsz" 14' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0f2922]/40 shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button className="bg-[#0f2922] hover:bg-[#1a4a39] text-white text-sm px-5 py-2 rounded-full transition-colors">
                        View Details
                      </button>
                      <button className="border border-[#e8622a] text-[#e8622a] hover:bg-[#e8622a] hover:text-white text-sm px-5 py-2 rounded-full transition-colors">
                        Book Package
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightboxIndex(null)}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxIndex === 0 ? imgRishikesh : galleryPhotos[lightboxIndex - 1]?.url}
            alt=""
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 flex gap-3">
            <button
              className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors disabled:opacity-30"
              disabled={lightboxIndex === 0}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i ?? 1) - 1); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors disabled:opacity-30"
              disabled={lightboxIndex === galleryPhotos.length}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i ?? 0) + 1); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PackageCard({ pkg }: { pkg: Package }) {
  return (
    <div className="border border-[#e2e8f0] rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
      <div className="h-40 overflow-hidden">
        <img
          src={pkg.image}
          alt={pkg.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className="text-[#0f2922] text-base leading-tight"
            style={{ fontFamily: '"Instrument Serif:Regular", serif' }}
          >
            {pkg.name}
          </h3>
          <span className="text-[#e8622a] font-semibold text-sm shrink-0">{pkg.price}</span>
        </div>
        <div className="flex gap-3 text-xs text-[#4a5568] mb-3" style={{ fontVariationSettings: '"opsz" 14' }}>
          <span>{pkg.duration}</span>
          <span>·</span>
          <span>{pkg.difficulty}</span>
        </div>
        <button className="w-full bg-[#0f2922] hover:bg-[#1a4a39] text-white text-sm py-2 rounded-full transition-colors">
          View Package
        </button>
      </div>
    </div>
  );
}
