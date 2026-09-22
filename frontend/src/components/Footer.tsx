import { useApp, type Page } from "@/context/AppContext";

export default function Footer() {
  const { navigate } = useApp();

  return (
    <footer style={{ background: "var(--forest)" }} className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {/* Brand */}
        <div>
          <div className="text-2xl font-bold tracking-widest mb-1" style={{ fontFamily: "var(--font-serif)" }}>YATRIVO</div>
          <div className="text-[#e8622a] text-[10px] tracking-widest uppercase font-medium mb-4">EXPLORE MORE. TRAVEL BETTER.</div>
          <p className="text-white/60 text-sm leading-relaxed">
            Uttarakhand's premium travel collective for mindful explorers. We design high-fidelity mountain retreats, spiritual pilgrimages, and raw alpine treks.
          </p>
        </div>

        {/* Popular Spots */}
        <div>
          <h4 className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-4">POPULAR SPOTS</h4>
          <ul className="space-y-2.5">
            {[
              { label: "Chopta", dest: "chopta" as const },
              { label: "Auli Snow Slopes", dest: "auli" as const },
              { label: "Kedarnath Shrine", dest: "kedarnath" as const },
              { label: "Rishikesh Ganga", dest: "rishikesh" as const },
              { label: "Mussoorie Hills", dest: "mussoorie" as const },
              { label: "Kanatal Woods", dest: "kanatal" as const },
            ].map((s) => (
              <li key={s.label}>
                <button
                  onClick={() => navigate("destination-detail", { destId: s.dest })}
                  className="text-white/70 hover:text-white text-sm transition-colors text-left"
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Connect */}
        <div>
          <h4 className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-4">CONNECT WITH US</h4>
          <div className="space-y-2.5 mb-4">
            {([
              { label: "Travel With Us", page: "travel-with-us" as Page },
              { label: "Past Trips", page: "past-trips" as Page },
              { label: "About Us", page: "about" as Page },
              { label: "Reviews", page: "reviews" as Page },
              { label: "FAQ & Contact", page: "faq" as Page },
            ] as { label: string; page: Page }[]).map((l) => (
              <div key={l.page}>
                <button
                  onClick={() => navigate(l.page)}
                  className="text-white/70 hover:text-white text-sm transition-colors text-left"
                >
                  {l.label}
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-3 text-sm text-white/70 mt-4">
            <p>Office: Rajpur Road, Dehradun,<br />Uttarakhand, 248001</p>
            <p><a href="mailto:hello@yatrivo.com" className="hover:text-white transition-colors">hello@yatrivo.com</a></p>
            <p><a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210</a></p>
          </div>
          <div className="flex items-center gap-3 mt-5">
            {[
              { label: "Instagram", path: "M16 2H8C4.686 2 2 4.686 2 8v8c0 3.314 2.686 6 6 6h8c3.314 0 6-2.686 6-6V8c0-3.314-2.686-6-6-6zm-4 13a5 5 0 110-10 5 5 0 010 10zm5.5-9.5a1 1 0 110-2 1 1 0 010 2z M12 9a3 3 0 100 6 3 3 0 000-6z" },
              { label: "YouTube", path: "M19.59 7a2.41 2.41 0 00-1.7-1.7C16.45 5 12 5 12 5s-4.45 0-5.89.3A2.41 2.41 0 004.41 7 25.54 25.54 0 004 12a25.54 25.54 0 00.41 5 2.41 2.41 0 001.7 1.7C7.55 19 12 19 12 19s4.45 0 5.89-.3a2.41 2.41 0 001.7-1.7A25.54 25.54 0 0020 12a25.54 25.54 0 00-.41-5zM10 15V9l5 3-5 3z" },
              { label: "Facebook", path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
              { label: "Twitter", path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
            ].map(({ label, path }) => (
              <a key={label} href="#" aria-label={label} className="w-8 h-8 rounded-full border border-white/20 hover:border-white/60 flex items-center justify-center transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white/70"><path d={path} /></svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <span>© 2026 Yatrivo Travel Brand. Designed with mindfulness in Dehradun.</span>
          <div className="flex gap-4">
            <button onClick={() => navigate("terms")} className="hover:text-white/70 transition-colors">Terms & Conditions</button>
            <button onClick={() => navigate("privacy")} className="hover:text-white/70 transition-colors">Privacy Policy</button>
            <button onClick={() => navigate("admin")} className="hover:text-white/70 transition-colors">Admin</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
