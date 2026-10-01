import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import SiteImage from "@/components/SiteImage";
import { SITE_ASSET_KEYS } from "@/api/siteAssets";
import { parseAboutData } from "@/data/contentSections";

export default function AboutPage() {
  const { aboutContent } = useApp();
  const about = parseAboutData(aboutContent);

  return (
    <div>
      <SEO
        title="About Our Collective"
        description="Learn about Yatrivo — our philosophy of mindful mountain travel, local mountain guides, and community conservation across Uttarakhand."
      />
      {/* Hero with generous top spacing below floating header */}
      <section className="relative min-h-[520px] sm:min-h-[580px] flex items-end pb-16 pt-36 sm:pt-44 overflow-hidden">
        <SiteImage
          assetKey={SITE_ASSET_KEYS.ABOUT_HERO}
          alt="Hikers on Himalayan trail"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay-directional" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-3 text-contrast-subtle">
            {about.heroBadge}
          </div>
          <h1 className="text-white text-4xl sm:text-5xl md:text-6xl mb-4 text-contrast-title whitespace-pre-line" style={{ fontFamily: "var(--font-serif)" }}>
            {about.heroTitle}
          </h1>
          <p className="text-white/90 text-sm sm:text-base max-w-xl leading-relaxed text-contrast-body">
            {about.heroDescription}
          </p>
        </div>
      </section>

      {/* The Promise (Stacked layout: heading on top, text below) */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#f1f3f5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8">
            <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-2">
              {about.promiseBadge}
            </div>
            <h2 className="text-[#0f2922] text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
              {about.promiseHeading}
            </h2>
          </div>
          <div className="text-[#4a5568] text-base sm:text-lg leading-relaxed whitespace-pre-line space-y-4">
            {about.promiseText}
          </div>
        </div>
      </section>

      {/* Deep Roots / Ecosystem */}
      <section style={{ background: "var(--forest)" }} className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden h-72 md:h-88 relative shadow-lg">
            <SiteImage
              assetKey={SITE_ASSET_KEYS.ABOUT_DEEP_ROOTS}
              alt="Local Uttarakhand community members"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-3">
              {about.ecosystemBadge}
            </div>
            <h2 className="text-white text-3xl sm:text-4xl mb-7" style={{ fontFamily: "var(--font-serif)" }}>
              {about.ecosystemHeading}
            </h2>
            <div className="space-y-6">
              {about.ecosystemPoints.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="text-2xl shrink-0">{item.icon}</div>
                  <div>
                    <div className="text-white font-semibold text-base mb-1">{item.title}</div>
                    <div className="text-white/70 text-sm sm:text-base leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <SiteImage
          assetKey={SITE_ASSET_KEYS.ABOUT_CTA_BG}
          alt="Forest light through trees"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0f2922]/85" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-white text-4xl sm:text-5xl mb-4 text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>
            {about.ctaHeading}
          </h2>
          <p className="text-white/85 text-base mb-8 text-contrast-body">
            {about.ctaDescription}
          </p>
          <Link
            to="/plan"
            className="inline-block bg-white text-[#0f2922] font-semibold px-8 py-3.5 rounded-full hover:bg-[#f7f8f5] transition-colors text-sm tracking-wide shadow-[0_3px_12px_rgba(0,0,0,0.3)]"
          >
            START PLANNING NOW
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

