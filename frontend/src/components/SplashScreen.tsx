import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import logoImg from "@/imports/logo.png";

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  const { siteSettings } = useApp();
  const [phase, setPhase] = useState<"logo" | "tagline" | "fade">("logo");


  useEffect(() => {
    const t1 = setTimeout(() => setPhase("tagline"), 600);
    const t2 = setTimeout(() => setPhase("fade"), 1800);
    const t3 = setTimeout(() => onDone(), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500"
      style={{
        background: "var(--forest)",
        opacity: phase === "fade" ? 0 : 1,
      }}
    >
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at 30% 70%, #e8622a 0%, transparent 50%), radial-gradient(circle at 70% 30%, #1a6b4a 0%, transparent 50%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-5">
        {/* Logo */}
        <div
          className="transition-all duration-700"
          style={{
            opacity: phase === "logo" ? 0 : 1,
            transform: phase === "logo" ? "scale(0.7) translateY(12px)" : "scale(1) translateY(0)",
          }}
        >
          <img src={logoImg} alt="Yatrivo" className="w-20 h-20 object-contain" />
        </div>

        {/* Brand name */}
        <div
          className="transition-all duration-500 delay-100"
          style={{
            opacity: phase === "logo" ? 0 : 1,
            transform: phase === "logo" ? "translateY(8px)" : "translateY(0)",
          }}
        >
          <div className="text-white text-4xl tracking-[0.2em] uppercase" style={{ fontFamily: "var(--font-serif)" }}>
            YATRIVO
          </div>
        </div>

        {/* Tagline */}
        <div
          className="transition-all duration-500 delay-200"
          style={{
            opacity: phase === "tagline" || phase === "fade" ? 1 : 0,
            transform: phase === "logo" ? "translateY(8px)" : "translateY(0)",
          }}
        >
          <div className="text-[#f7f8f5]/90 text-xs sm:text-sm tracking-[0.1em] uppercase font-medium" style={{ fontFamily: "var(--font-sans)" }}>
            {siteSettings?.general?.tagline || "Explore More. Travel Better."}
          </div>
        </div>


        {/* Loading bar */}
        <div className="mt-4 w-32 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#e8622a] rounded-full transition-all duration-1200 ease-out"
            style={{ width: phase === "logo" ? "20%" : phase === "tagline" ? "75%" : "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
