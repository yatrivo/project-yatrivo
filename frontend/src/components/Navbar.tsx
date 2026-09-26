import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logoImg from "@/imports/logo.png";

const navLinks: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Destinations", href: "/destinations" },
  { label: "Trips", href: "/trips" },
  { label: "Travel With Us", href: "/travel-with-us" },
  { label: "Past Trips", href: "/past-trips" },
];

export default function Navbar() {
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
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/profile";

  const atTop = scrollY < 60;
  const transparent = isHeroPage && atTop;

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setScrollY(current);
      if (current > lastScrollY && current > 120) {
        setHidden(true);
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
    ? "bg-transparent"
    : "bg-white/95 backdrop-blur-md border-b border-[#e2e8f0]";

  const textColor = transparent && !isNonHeroPage ? "text-white" : "text-[#0f2922]";
  const mutedColor = transparent && !isNonHeroPage ? "text-white/80" : "text-[#4a5568]";

  return (
    <>
      <header
        className={`${isNonHeroPage ? "sticky" : "fixed"} top-0 left-0 right-0 z-50 transition-all duration-300 ${isNonHeroPage ? "bg-white border-b border-[#e2e8f0]" : navBg} ${
          hidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logoImg} alt="Yatrivo" className="h-9 w-9 object-contain" />
            <div className="block text-left leading-tight">
              <div
                className={`${textColor} font-bold text-sm tracking-widest transition-colors`}
                style={{
                  fontFamily: "var(--font-serif)",
                  textShadow: transparent && !hidden ? "0 1px 3px rgba(0,0,0,0.4)" : "none",
                }}
              >
                YATRIVO
              </div>
              <div
                className="text-[#e8622a] text-[9px] tracking-widest uppercase font-medium"
                style={{
                  textShadow: transparent && !hidden ? "0 1px 3px rgba(0,0,0,0.4)" : "none",
                }}
              >
                EXPLORE MORE. TRAVEL BETTER.
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
                  style={{ textShadow: transparent && !hidden ? "0 1px 3px rgba(0,0,0,0.5)" : "none" }}
                  className={`relative px-3 py-1.5 text-sm font-medium transition-colors ${
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
          <div className="flex items-center gap-2 sm:gap-3">

            <Link
              to="/plan"
              className={`hidden sm:inline-flex items-center text-sm font-medium px-4 py-2 rounded-full transition-all ${
                transparent
                  ? "bg-white text-[#0f2922] hover:bg-white/90"
                  : "bg-[#0f2922] hover:bg-[#1a4a39] text-white"
              }`}
            >
              PLAN MY TRIP
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`lg:hidden p-2 ${textColor}`}
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-[#e2e8f0] bg-white shadow-xl">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.map((link) => {
                const isMatch = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isMatch ? "bg-[#f7f8f5] text-[#0f2922] font-semibold" : "text-[#4a5568] hover:bg-[#f7f8f5]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {/* Profile & Saved Trips hidden for now */}
              <div className="mt-2 pt-2 border-t border-[#e2e8f0]">
                <Link
                  to="/plan"
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-center bg-[#0f2922] text-white text-sm py-2.5 rounded-full block"
                >
                  Plan My Trip
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Spacer for fixed hero pages that aren't transparent (e.g. mid-scroll) */}
      {!isHeroPage && !isNonHeroPage && <div className="h-16" />}
    </>
  );
}
