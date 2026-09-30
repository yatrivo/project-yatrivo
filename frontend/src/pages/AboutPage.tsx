import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import SiteImage from "@/components/SiteImage";
import { SITE_ASSET_KEYS } from "@/api/siteAssets";
import { DEFAULT_ABOUT_SECTIONS, parseContentSections } from "@/data/contentSections";

export default function AboutPage() {
  const { aboutContent } = useApp();
  const aboutSections = aboutContent && aboutContent.trim().length > 0 
    ? parseContentSections(aboutContent, DEFAULT_ABOUT_SECTIONS)
    : null;

  return (
    <div>
      <SEO
        title="About Our Collective"
        description="Learn about Yatrivo — our philosophy of mindful mountain travel, local mountain guides, and community conservation across Uttarakhand."
      />
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[340px] flex items-end pb-12 overflow-hidden">
        <SiteImage
          assetKey={SITE_ASSET_KEYS.ABOUT_HERO}
          alt="Hikers on Himalayan trail"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay-directional" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-3 text-contrast-subtle">OUR STORY & MANIFESTO</div>
          <h1 className="text-white text-4xl sm:text-5xl md:text-6xl mb-4 text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>We are Yatrivo.<br />Born in Dehradun.</h1>
          <p className="text-white/90 text-sm sm:text-base max-w-xl leading-relaxed text-contrast-body">
            We are Uttarakhand's premium travel collective. We started to bridge the gap between heavy commercial bus tours and high-risk, unguided exploration.
          </p>
        </div>
      </section>

      {/* Admin-editable narrative tiles */}
      {aboutSections && aboutSections.length > 0 && (
        <section className="py-14 bg-[#f7f8f5] border-b border-[#e2e8f0]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
            {aboutSections.map((sec, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e2e8f0] p-7 shadow-xs">
                <h3 className="text-[#0f2922] text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-serif)" }}>
                  {sec.title}
                </h3>
                <p className="text-[#4a5568] text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* The Promise */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">THE YATRIVO PROMISE</div>
            <h2 className="text-[#0f2922] text-3xl sm:text-4xl" style={{ fontFamily: "var(--font-serif)" }}>Explore More. Travel Better.</h2>
          </div>
          <div className="space-y-4 text-[#4a5568] text-sm leading-relaxed">
            <p>
              Uttarakhand is more than just tourism checklists; it is a sacred, living ecosystem. We believe that true travel requires stepping away from crowded, noisy buses, slowing down the pace, and experiencing the pristine high alpine valleys with certified mountain guides.
            </p>
            <p>
              Every route we design is handpicked. Every wood cabin we choose has a warm local soul. We buy food from nearby organic family farms, hire licensed local guides, and execute every trip with deep environmental respect.
            </p>
          </div>
        </div>
      </section>

      {/* Deep Roots */}
      <section style={{ background: "var(--forest)" }} className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden h-72 md:h-80 relative">
            <SiteImage
              assetKey={SITE_ASSET_KEYS.ABOUT_DEEP_ROOTS}
              alt="Local Uttarakhand community members"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">OUR ECOSYSTEM STRAP</div>
            <h2 className="text-white text-3xl sm:text-4xl mb-7" style={{ fontFamily: "var(--font-serif)" }}>Deep Roots in Uttarakhand</h2>
            <div className="space-y-5">
              {[
                { icon: "🛡️", title: "100% Certified Local Safety", desc: "All guides are certified by high-altitude institutes and trained in wilderness medicine." },
                { icon: "🤝", title: "Support for Rural Communities", desc: "We hire local potters, purchase from women-led farm cooperatives, and keep capital inside the hills." },
                { icon: "🌿", title: "Carbon-Offset Treks", desc: "Zero trace plastic usage, solar campsites, and absolute preservation of sensitive mountain meadows." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="text-2xl shrink-0">{item.icon}</div>
                  <div>
                    <div className="text-white font-medium text-sm mb-1">{item.title}</div>
                    <div className="text-white/60 text-sm leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-[#0f2922] text-3xl sm:text-4xl text-center mb-12" style={{ fontFamily: "var(--font-serif)" }}>
            Empowering the Himalayas, Year on Year
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: "15K+", label: "EXPLORERS GUIDED" },
              { val: "45+", label: "VILLAGE COOPERATIVES PAID" },
              { val: "100%", label: "CERTIFIED MOUNTAIN EXPERTS" },
              { val: "₹3.2M+", label: "LOCAL ECONOMY INJECTED" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-4xl sm:text-5xl font-bold text-[#0f2922] mb-2" style={{ fontFamily: "var(--font-serif)" }}>{s.val}</div>
                <div className="text-[#4a5568] text-xs uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
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
          <h2 className="text-white text-4xl sm:text-5xl mb-4 text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>Let's Plan Your Mountain Excursion</h2>
          <p className="text-white/85 text-base mb-8 text-contrast-body">
            Step off the tourist trail. Explore Uttarakhand with local safety, certified guides, and small youthful groups.
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
