import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import logoImg from "@/imports/logo.png";

const navLinks: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Destinations", href: "/destinations" },
  { label: "Trips", href: "/trips" },
  { label: "Gallery", href: "/gallery" },
  { label: "Travel With Us", href: "/travel-with-us" },
  { label: "Past Trips", href: "/past-trips" },
];

export default function Navbar() {
  const { siteSettings } = useApp();
  const location = useLocation();
  const pathname = location.pathname;


  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isHeroPage =
    pathname === "/" ||
    (pathname.startsWith("/trips/") && pathname !== "/trips") ||
    pathname === "/plan" ||
    pathname === "/plan-trip" ||
    pathname === "/about" ||
    pathname === "/reviews" ||
    pathname.startsWith("/reviews/") ||
    pathname === "/review" ||
    pathname === "/faq" ||
    pathname === "/contact" ||
    (pathname.startsWith("/destinations/") && pathname !== "/destinations") ||
    pathname === "/travel-with-us" ||
    pathname.startsWith("/past-trips");

  const isNonHeroPage =
    pathname === "/destinations" ||
    pathname === "/trips" ||
    pathname === "/gallery" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/profile";

  const isTripDetailPage =
    pathname.startsWith("/trips/") && pathname !== "/trips" && pathname !== "/trips/";

  const atTop = scrollY < 60;
  const transparent = isHeroPage && atTop && !menuOpen;

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setScrollY(current);
      if (current > lastScrollY && current > 120) {
        setHidden(true);
        setMenuOpen(false);
      } else {
        setHidden(false);
      }
      setLastScrollY(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Reset scroll and menu state on route change
  useEffect(() => {
    setScrollY(0);
    setLastScrollY(0);
    setHidden(false);
    setMenuOpen(false);
  }, [pathname]);

  const navBg = transparent
    ? "bg-gradient-to-b from-black/80 via-black/45 to-transparent pb-4"
    : "bg-white/95 backdrop-blur-md border-b border-[#e2e8f0]";

  const textColor = transparent && !isNonHeroPage ? "text-white" : "text-[#0f2922]";
  const mutedColor = transparent && !isNonHeroPage ? "text-white/85" : "text-[#4a5568]";

  return (
    <>
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px] lg:hidden transition-opacity"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <header
        className={`${isTripDetailPage ? "hidden md:block" : ""} ${isNonHeroPage ? "sticky" : "fixed"} top-0 left-0 right-0 z-50 transition-all duration-300 ${isNonHeroPage ? "bg-white border-b border-[#e2e8f0]" : navBg} ${
          hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link
            to="/"
            className={`items-center gap-2 sm:gap-2.5 min-w-0 shrink sm:shrink-0 ${
              pathname === "/" && !menuOpen ? "hidden md:flex" : "flex"
            }`}
          >
            <img src={logoImg} alt="Yatrivo" className={`h-8 w-8 sm:h-9 sm:w-9 shrink-0 object-contain ${transparent ? "drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]" : ""}`} />
            <div className="block text-left leading-tight min-w-0">
              <div
                className={`${textColor} font-bold text-[15px] sm:text-[17px] tracking-[0.16em] transition-colors ${transparent && !hidden ? "text-contrast-title" : ""}`}
                style={{
                  fontFamily: "var(--font-serif)",
                }}
              >
                YATRIVO
              </div>
              <div
                className={`transition-colors text-[8.5px] sm:text-[10px] md:text-[11px] font-medium tracking-[0.06em] sm:tracking-[0.09em] uppercase leading-[1.3] truncate sm:whitespace-nowrap ${
                  transparent ? "brand-tagline-light" : "brand-tagline-dark"
                }`}
              >
                {siteSettings?.general?.tagline || "EXPLORE MORE. TRAVEL BETTER."}
              </div>
            </div>
          </Link>


          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isMatch = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <NavLink
                  key={link.href}
                  to={link.href}
                  className={`relative px-3 py-1.5 text-sm font-medium transition-colors ${transparent && !hidden ? "text-contrast-subtle" : ""} ${
                    isMatch ? `${textColor} font-semibold` : `${mutedColor} hover:${textColor}`
                  }`}
                >
                  {link.label}
                  {isMatch && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#e8622a] rounded-full" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto md:ml-0 shrink-0">

            <Link
              to="/plan"
              className={`hidden sm:inline-flex items-center text-sm font-medium px-4 py-2 rounded-full transition-all ${
                transparent
                  ? "bg-white text-[#0f2922] hover:bg-white/90 shadow-[0_2px_10px_rgba(0,0,0,0.3)] font-semibold"
                  : "bg-[#0f2922] hover:bg-[#1a4a39] text-white"
              }`}
            >
              PLAN MY TRIP
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`lg:hidden w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${textColor} ${
                transparent
                  ? "drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
                  : menuOpen
                  ? "bg-[#f0f4f2] text-[#0f2922]"
                  : "hover:bg-[#f7f8f5]"
              }`}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 12h16M4 6.5h16M4 17.5h16"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-[#e2e8f0] bg-white rounded-b-2xl shadow-[0_16px_36px_rgba(15,41,34,0.16)] max-h-[calc(100dvh-3.5rem)] overflow-y-auto">
            <div className="max-w-7xl mx-auto px-3.5 py-2.5 flex flex-col gap-0.5">
              {navLinks.map((link) => {
                const isMatch = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] sm:text-sm transition-colors ${
                      isMatch
                        ? "bg-[#f2f6f4] text-[#0f2922] font-semibold"
                        : "text-[#4a5568] font-medium hover:bg-[#f7f8f5] hover:text-[#0f2922]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          isMatch ? "bg-[#e8622a]" : "bg-transparent"
                        }`}
                      />
                      {link.label}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={isMatch ? "text-[#e8622a]" : "text-[#cbd5e1]"}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                );
              })}
              {/* Profile & Saved Trips hidden for now */}
              <div className="mt-1.5 pt-2.5 pb-1 px-1 border-t border-[#e2e8f0]">
                <Link
                  to="/plan"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#0f2922] hover:bg-[#1a3d31] text-white text-xs font-semibold uppercase tracking-wider py-2.5 rounded-full shadow-xs transition"
                >
                  <span>Plan My Trip</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Spacer for fixed hero pages that aren't transparent (e.g. mid-scroll) */}
      {!isHeroPage && !isNonHeroPage && <div className="h-14 sm:h-16" />}
    </>
  );
}
