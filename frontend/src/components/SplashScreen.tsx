import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import logoImg from "@/imports/logo.png";

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  const { siteSettings } = useApp();
  const [phase, setPhase] = useState<"init" | "logo" | "tagline" | "fade">("init");

  useEffect(() => {
    const t0 = setTimeout(() => setPhase("logo"), 50);
    const t1 = setTimeout(() => setPhase("tagline"), 450);
    const t2 = setTimeout(() => setPhase("fade"), 1800);
    const t3 = setTimeout(() => onDone(), 2300);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const showBrand = phase !== "init";
  const showTagline = phase === "tagline" || phase === "fade";

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 transition-opacity duration-500"
      style={{
        background: "var(--forest)",
        opacity: phase === "fade" ? 0 : 1,
      }}
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 70%, #e8622a 0%, transparent 50%), radial-gradient(circle at 70% 30%, #1a6b4a 0%, transparent 50%)",
        }}
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Logo */}
        <div
          className="transition-all duration-700 mb-3.5 sm:mb-4"
          style={{
            opacity: showBrand ? 1 : 0,
            transform: showBrand ? "scale(1) translateY(0)" : "scale(0.8) translateY(10px)",
          }}
        >
          <img src={logoImg} alt="Yatrivo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
        </div>

        {/* Brand name */}
        <div
          className="transition-all duration-500 delay-75"
          style={{
            opacity: showBrand ? 1 : 0,
            transform: showBrand ? "translateY(0)" : "translateY(8px)",
          }}
        >
          <div
            className="text-white font-bold text-2xl sm:text-3xl tracking-[0.2em] uppercase leading-tight"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            YATRIVO
          </div>
        </div>

        {/* Tagline */}
        <div
          className="transition-all duration-500 mt-1.5 sm:mt-2"
          style={{
            opacity: showTagline ? 1 : 0,
            transform: showTagline ? "translateY(0)" : "translateY(6px)",
          }}
        >
          <div
            className="text-[#e8622a] text-[11px] sm:text-xs tracking-[0.15em] uppercase font-semibold leading-snug"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {siteSettings?.general?.tagline || "Explore More. Travel Better."}
          </div>
        </div>

        {/* Loading bar */}
        <div className="mt-6 sm:mt-7 w-28 sm:w-32 h-0.5 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#e8622a] rounded-full transition-all duration-1000 ease-out"
            style={{ width: phase === "init" ? "10%" : phase === "logo" ? "40%" : phase === "tagline" ? "85%" : "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
