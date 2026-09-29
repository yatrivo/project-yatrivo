import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";

function formatSocialUrl(url?: string, platform?: "instagram" | "youtube" | "facebook" | "twitter"): string {
  if (!url) return "#";
  const trimmed = url.trim();
  if (!trimmed) return "#";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("@")) {
    const handle = trimmed.slice(1);
    if (platform === "instagram") return `https://instagram.com/${handle}`;
    if (platform === "twitter") return `https://twitter.com/${handle}`;
    if (platform === "youtube") return `https://youtube.com/@${handle}`;
    if (platform === "facebook") return `https://facebook.com/${handle}`;
  }
  return `https://${trimmed}`;
}

export default function Footer() {
  const { siteSettings } = useApp();

  const tagline = siteSettings?.general?.tagline || "EXPLORE MORE. TRAVEL BETTER.";
  const siteDescription =
    siteSettings?.general?.siteDescription ||
    "Uttarakhand's premium travel collective for mindful explorers. We design high-fidelity mountain retreats, spiritual pilgrimages, and raw alpine treks.";
  const address = siteSettings?.contact?.address || "Rajpur Road, Dehradun,\nUttarakhand, 248001";
  const contactEmail = siteSettings?.contact?.contactEmail || "hello@yatrivo.com";
  const phone = siteSettings?.contact?.phone || "+91 98765 43210";
  const whatsapp = siteSettings?.contact?.whatsapp;

  const socialLinks = [
    {
      label: "Instagram",
      href: formatSocialUrl(siteSettings?.social?.instagram || "https://instagram.com/yatrivo", "instagram"),
      path: "M16 2H8C4.686 2 2 4.686 2 8v8c0 3.314 2.686 6 6 6h8c3.314 0 6-2.686 6-6V8c0-3.314-2.686-6-6-6zm-4 13a5 5 0 110-10 5 5 0 010 10zm5.5-9.5a1 1 0 110-2 1 1 0 010 2z M12 9a3 3 0 100 6 3 3 0 000-6z"
    },
    {
      label: "YouTube",
      href: formatSocialUrl(siteSettings?.social?.youtube || "https://youtube.com/@yatrivo", "youtube"),
      path: "M19.59 7a2.41 2.41 0 00-1.7-1.7C16.45 5 12 5 12 5s-4.45 0-5.89.3A2.41 2.41 0 004.41 7 25.54 25.54 0 004 12a25.54 25.54 0 00.41 5 2.41 2.41 0 001.7 1.7C7.55 19 12 19 12 19s4.45 0 5.89-.3a2.41 2.41 0 001.7-1.7A25.54 25.54 0 0020 12a25.54 25.54 0 00-.41-5zM10 15V9l5 3-5 3z"
    },
    {
      label: "Facebook",
      href: formatSocialUrl(siteSettings?.social?.facebook || "https://facebook.com/yatrivo", "facebook"),
      path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
    },
    {
      label: "Twitter",
      href: formatSocialUrl(siteSettings?.social?.twitter || "https://twitter.com/yatrivo", "twitter"),
      path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"
    },
  ];

  return (
    <footer style={{ background: "var(--forest)" }} className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {/* Brand */}
        <div>
          <Link to="/" className="inline-block text-2xl font-bold tracking-widest mb-1 hover:text-[#e8622a] transition-colors" style={{ fontFamily: "var(--font-serif)" }}>
            YATRIVO
          </Link>
          <div className="text-[#f7f8f5]/85 text-xs sm:text-[13px] font-medium tracking-[0.09em] uppercase mb-4" style={{ fontFamily: "var(--font-sans)" }}>{tagline}</div>
          <p className="text-white/60 text-sm leading-relaxed">
            {siteDescription}
          </p>
        </div>

        {/* Popular Spots */}
        <div>
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-4">POPULAR SPOTS</div>
          <ul className="space-y-2.5">
            {[
              { label: "Chopta", dest: "chopta" },
              { label: "Auli Snow Slopes", dest: "auli" },
              { label: "Kedarnath Shrine", dest: "kedarnath" },
              { label: "Rishikesh Ganga", dest: "rishikesh" },
              { label: "Mussoorie Hills", dest: "mussoorie" },
              { label: "Kanatal Woods", dest: "kanatal" },
            ].map((s) => (
              <li key={s.label}>
                <Link
                  to={`/destinations/${s.dest}`}
                  className="text-white/70 hover:text-white text-sm transition-colors block text-left"
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Connect */}
        <div>
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-4">CONNECT WITH US</div>
          <div className="space-y-2.5 mb-4">
            {[
              { label: "Travel With Us", path: "/travel-with-us" },
              { label: "Past Trips", path: "/past-trips" },
              { label: "About Us", path: "/about" },
              { label: "Reviews", path: "/reviews" },
              { label: "FAQ & Contact", path: "/faq" },
            ].map((l) => (
              <div key={l.path}>
                <Link
                  to={l.path}
                  className="text-white/70 hover:text-white text-sm transition-colors block text-left"
                >
                  {l.label}
                </Link>
              </div>
            ))}
          </div>
          <div className="space-y-3 text-sm text-white/70 mt-4">
            <p className="whitespace-pre-line">{address}</p>
            <p>
              <a href={`mailto:${contactEmail}`} className="hover:text-white transition-colors">
                {contactEmail}
              </a>
            </p>
            <p>
              <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-white transition-colors">
                {phone}
              </a>
            </p>
            {whatsapp && (
              <p>
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="text-[#25D366] font-medium">WhatsApp:</span> {whatsapp}
                </a>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 mt-5">
            {socialLinks.map(({ label, href, path }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="w-8 h-8 rounded-full border border-white/20 hover:border-white/60 hover:text-white flex items-center justify-center transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white/70 hover:text-white transition-colors"><path d={path} /></svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <span>© 2026 Yatrivo Travel Brand. Designed with mindfulness in Dehradun.</span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-white/70 transition-colors">Terms & Conditions</Link>
            <Link to="/privacy" className="hover:text-white/70 transition-colors">Privacy Policy</Link>
            <Link to="/admin" className="hover:text-white/70 transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
