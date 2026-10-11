import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { galleryApi, type PublicGalleryItem } from "@/api/gallery";
import GalleryLightbox from "@/components/GalleryLightbox";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

export default function GalleryPage() {
  const [items, setItems] = useState<PublicGalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const loadGallery = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await galleryApi.getPublic();
      setItems(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to load gallery";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadGallery();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf7]">
      <SEO
        title="Moments from the Mountains — Yatrivo Travel Gallery"
        description="Explore the places, people and memories that make Uttarakhand unforgettable. Real travel moments curated by Yatrivo."
        keywords="Uttarakhand photos, Himalayas travel gallery, Kedarnath pictures, Chopta photos, Yatrivo moments, travel Uttarakhand"
      />

      {/* Hero Header Section */}
      <section className="pt-14 pb-5 sm:pt-20 sm:pb-12 max-w-7xl mx-auto px-3 sm:px-6 w-full text-center sm:text-left">
        <div className="inline-block text-[#e8622a] text-[10px] sm:text-xs uppercase tracking-widest font-semibold mb-2 sm:mb-3 bg-[#e8622a]/10 px-3 py-1 rounded-full">
          CURATED TRAVEL MOMENTS
        </div>
        <h1
          className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#0f2922] mb-2 sm:mb-4 tracking-tight"
          style={{ fontFamily: "var(--font-serif, serif)" }}
        >
          Moments from the Mountains
        </h1>
        <p className="text-[#4a5568] text-xs sm:text-base md:text-lg max-w-2xl leading-relaxed">
          Explore the places, people and memories that make Uttarakhand unforgettable.
        </p>
      </section>

      {/* Main Gallery Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pb-16 sm:pb-20 flex-1 w-full">
        {isLoading ? (
          <>
            {/* Mobile Skeletons */}
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-[#e2e8f0] animate-pulse" />
              ))}
            </div>

            {/* Desktop Skeletons */}
            <div className="hidden sm:block sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
              {[180, 240, 200, 280, 220, 190, 260, 210].map((height, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden break-inside-avoid animate-pulse"
                  style={{ height: `${height}px` }}
                >
                  <div className="w-full h-full bg-[#edf2f7]" />
                </div>
              ))}
            </div>
          </>
        ) : error ? (
          /* Error State */
          <div className="bg-white rounded-2xl border border-red-200 p-8 sm:p-12 text-center max-w-md mx-auto my-12 space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h3 className="text-base font-bold text-[#0f2922]">Unable to load moments</h3>
            <p className="text-xs text-[#718096]">{error}</p>
            <button
              type="button"
              onClick={loadGallery}
              className="bg-[#0f2922] hover:bg-[#1a4a39] text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : items.length === 0 ? (
          /* Clean Empty State */
          <div className="bg-white rounded-3xl border border-[#e2e8f0] p-8 sm:p-20 text-center max-w-xl mx-auto my-8 space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#f0f9f4] text-[#0f2922] flex items-center justify-center mx-auto shadow-2xs">
              <svg className="w-8 h-8 text-[#0f2922]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3
              className="text-xl sm:text-2xl font-bold text-[#0f2922]"
              style={{ fontFamily: "var(--font-serif, serif)" }}
            >
              Mountain Moments Await
            </h3>
            <p className="text-xs sm:text-sm text-[#4a5568] max-w-md mx-auto leading-relaxed">
              Our travel memories are currently being curated by our expedition leaders. In the meantime, discover our upcoming journeys!
            </p>
            <div className="pt-2">
              <Link
                to="/trips"
                className="inline-flex items-center gap-1.5 bg-[#0f2922] hover:bg-[#1a4a39] text-white text-xs sm:text-sm font-semibold px-6 py-3 rounded-full transition-all shadow-sm"
              >
                <span>Browse Upcoming Trips</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Phone Gallery Grid View (< sm): Pure Images, No Text, No Cards */}
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxIndex(idx)}
                  className="relative aspect-square overflow-hidden rounded-xl bg-[#edf2f7] active:scale-[0.98] transition cursor-pointer shadow-2xs group"
                >
                  <img
                    src={item.url}
                    alt={item.altText || item.title || "Mountain Moment"}
                    loading="lazy"
                    className="w-full h-full object-cover group-active:opacity-90 transition-opacity"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "0.3";
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Desktop Masonry Grid (sm and up) */}
            <div className="hidden sm:block sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxIndex(idx)}
                  className="group relative bg-white rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-xs hover:shadow-xl transition-all duration-300 break-inside-avoid cursor-pointer transform hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden bg-[#f7f8f5]">
                    <img
                      src={item.url}
                      alt={item.altText || item.title || "Mountain Moment"}
                      loading="lazy"
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = "0.3";
                      }}
                    />

                    {/* Subtle Hover Overlay on Desktop (pure preview, no text on image) */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs text-[#1e293b] flex items-center justify-center shadow-md transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Lightbox Viewer */}
      {lightboxIndex !== null && (
        <GalleryLightbox
          items={items}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
