import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { DEFAULT_PRIVACY_SECTIONS, parseContentSections } from "@/data/contentSections";

export default function PrivacyPage() {
  const { privacyContent } = useApp();
  const sections = parseContentSections(privacyContent, DEFAULT_PRIVACY_SECTIONS);

  return (
    <div>
      <SEO
        title="Privacy Policy"
        description="Learn how Yatrivo collects, protects, and handles your personal information, booking details, and privacy."
      />
      <section className="bg-[#0f2922] text-white pt-8 pb-7 sm:pt-24 sm:pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-[#e8622a] text-[11px] sm:text-xs font-semibold uppercase tracking-widest mb-1.5 sm:mb-3">LEGAL</div>
          <h1 className="text-[26px] sm:text-5xl font-bold leading-tight" style={{ fontFamily: "var(--font-serif)" }}>Privacy Policy</h1>
          <p className="text-white/60 text-xs sm:text-sm mt-2 sm:mt-3">Last updated: September 2026</p>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-[#f7f8f5]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e2e8f0] p-4 sm:p-6 mb-4 sm:mb-6 flex items-start gap-3 sm:gap-4 shadow-xs">
            <span className="text-xl sm:text-2xl shrink-0">🔒</span>
            <p className="text-[#4a5568] text-[13.5px] sm:text-sm leading-relaxed">
              Your privacy matters to us. Yatrivo is committed to protecting your personal data and being transparent about how we use it. This policy explains exactly what we collect, why, and your rights over it.
            </p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#e2e8f0] divide-y divide-[#e2e8f0] overflow-hidden shadow-xs">
            {sections.map((s, idx) => (
              <div key={idx} className="p-4 sm:p-7">
                <h2 className="text-[#0f2922] font-semibold text-base sm:text-lg mb-2 sm:mb-3 leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
                  {s.title}
                </h2>
                <p className="text-[#4a5568] text-[13.5px] sm:text-sm leading-relaxed whitespace-pre-line">
                  {s.content}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-[#4a5568] text-[13px] sm:text-sm mb-2 sm:mb-4 leading-relaxed">
              Questions? Read our <Link to="/terms" className="text-[#e8622a] hover:underline">Terms & Conditions</Link> or email us at <a href="mailto:hello@yatrivo.com" className="text-[#e8622a] hover:underline">hello@yatrivo.com</a>.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
