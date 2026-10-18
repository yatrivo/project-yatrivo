import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import type { FaqItem, CarouselSlide } from "@/context/AppContext";
import MediaPicker from "@/components/MediaPicker";
import { contentApi } from "@/api/content";
import type { CarouselSlideApi, WhyUsPointApi } from "@/api/content";
import { siteAssetsApi, type SiteAssetApi, DEFAULT_SITE_ASSET_SLOTS } from "@/api/siteAssets";
import {
  type ContentSection,
  type AboutPageData,
  type AboutEcosystemPoint,
  DEFAULT_TERMS_SECTIONS,
  DEFAULT_PRIVACY_SECTIONS,
  DEFAULT_ABOUT_DATA,
  parseContentSections,
  serializeContentSections,
  parseAboutData,
  serializeAboutData,
} from "@/data/contentSections";


type ContentTab = "hero" | "featured" | "why-us" | "faq" | "about" | "terms-privacy" | "site-assets";

const TABS: { id: ContentTab; label: string }[] = [
  { id: "hero", label: "Hero" },
  { id: "featured", label: "Featured Destinations" },
  { id: "why-us", label: "Why Choose Us" },
  { id: "faq", label: "FAQ" },
  { id: "about", label: "About Us" },
  { id: "terms-privacy", label: "Terms & Privacy" },
  { id: "site-assets", label: "Site Assets" },
];

// ---- Hero Tab ----
function HeroTab() {
  const { homepageContent, setHomepageContent, showToast, tripInstances, trips, refreshContent, refreshTrips, siteSettings } = useApp();

  const [heroImage, setHeroImage] = useState<string>(() => {
    return (
      homepageContent.heroImages?.[0] ||
      homepageContent.carouselSlides?.[0]?.imageUrl ||
      "https://br-orange-sun-b3bidgrg.storage.c-4.ap-southeast-1.aws.neon.tech/yatrivo-media/destinations/images/fb19581e-dca3-4cdb-b122-c193099be3a1-wp6584296.jpg"
    );
  });

  const [heroTitle, setHeroTitle] = useState<string>(() => {
    return homepageContent.heroTitle &&
      homepageContent.heroTitle !== "Jai Ho!" &&
      homepageContent.heroTitle !== "Live Deeply. Travel Boldly."
      ? homepageContent.heroTitle
      : (siteSettings?.general?.tagline || "Explore More. Travel Better.");
  });

  const [heroSubtitle, setHeroSubtitle] = useState<string>(() => {
    return (
      homepageContent.heroSubtitle ||
      homepageContent.carouselSlides?.[0]?.subtitle ||
      "Curated journeys. Local experiences. Unforgettable landscapes."
    );
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (trips.length === 0) {
      void refreshTrips({ bypassCache: true });
    }
  }, [refreshTrips, trips.length]);

  // Keep in sync if homepageContent updates from background refresh
  useEffect(() => {
    const img = homepageContent.heroImages?.[0] || homepageContent.carouselSlides?.[0]?.imageUrl;
    if (img) setHeroImage(img);

    if (
      homepageContent.heroTitle &&
      homepageContent.heroTitle !== "Jai Ho!" &&
      homepageContent.heroTitle !== "Live Deeply. Travel Boldly."
    ) {
      setHeroTitle(homepageContent.heroTitle);
    } else if (
      homepageContent.carouselSlides?.[0]?.title &&
      homepageContent.carouselSlides[0].title !== "Live Deeply. Travel Boldly."
    ) {
      setHeroTitle(homepageContent.carouselSlides[0].title);
    } else {
      setHeroTitle(siteSettings?.general?.tagline || "Explore More. Travel Better.");
    }

    if (homepageContent.heroSubtitle) {
      setHeroSubtitle(homepageContent.heroSubtitle);
    } else if (homepageContent.carouselSlides?.[0]?.subtitle) {
      setHeroSubtitle(homepageContent.carouselSlides[0].subtitle);
    }
  }, [homepageContent]);

  // Determine currently eligible upcoming departures for admin awareness
  const upcomingDepartures = useMemo(() => {
    const allInstances: { id: string; tripId: string; date: string; seatsLeft?: number; price?: number; status: string; tripName: string }[] = [];

    (tripInstances || []).forEach((inst) => {
      if (inst && inst.status === "upcoming") {
        const trip = (trips || []).find((t) => t.id === inst.tripId || (t.departures && t.departures.some((d) => d.id === inst.id)));
        allInstances.push({
          id: inst.id,
          tripId: inst.tripId,
          date: inst.date || "",
          seatsLeft: inst.seatsLeft,
          price: inst.price || trip?.price,
          status: inst.status,
          tripName: trip?.name || "Himalayan Expedition",
        });
      }
    });

    (trips || []).forEach((t) => {
      (t.departures || []).forEach((d) => {
        if (d && d.status === "upcoming" && !allInstances.some((inst) => inst.id === d.id)) {
          allInstances.push({
            id: d.id,
            tripId: d.tripId || t.id,
            date: d.date || "",
            seatsLeft: d.seatsLeft,
            price: d.price || t.price,
            status: d.status,
            tripName: t.name,
          });
        }
      });
    });

    allInstances.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    return allInstances;
  }, [tripInstances, trips]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const trimmedTitle = heroTitle.trim();
      const trimmedSubtitle = heroSubtitle.trim();
      const trimmedImage = heroImage.trim();

      const singleSlide: CarouselSlideApi = {
        slideType: "static",
        imageUrl: trimmedImage,
        titleOverride: trimmedTitle,
        subtitleOverride: trimmedSubtitle,
        sortOrder: 0,
        isActive: true,
      };

      await contentApi.updateHomepageConfig({
        heroTitle: trimmedTitle || null,
        heroSubtitle: trimmedSubtitle || null,
        whyUsTitle: homepageContent.whyUsTitle,
        whyUsDescription: homepageContent.whyUsDesc,
        slides: [singleSlide],
        featuredDestinationIds: homepageContent.featuredDestIds,
        featuredReviewIds: homepageContent.featuredReviewIds,
        whyUsPoints: homepageContent.whyUsPoints.map((p, i) => ({
          icon: p.icon,
          title: p.title,
          description: p.desc,
          sortOrder: i,
        })),
      });

      setHomepageContent({
        ...homepageContent,
        heroTitle: trimmedTitle,
        heroSubtitle: trimmedSubtitle,
        heroImages: [trimmedImage],
        carouselSlides: [
          {
            type: "static",
            imageUrl: trimmedImage,
            title: trimmedTitle,
            subtitle: trimmedSubtitle,
          },
        ],
      });

      await refreshContent({ bypassCache: true });
      showToast("Hero section updated successfully.", "success");
    } catch (err) {
      console.error("Failed to save hero content:", err);
      showToast("Failed to save hero content.", "error");
    } finally {
      setSaving(false);
    }
  };

  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
          Hero Section
        </h3>
        <p className="text-sm text-[#718096] mt-1">
          Configure the public homepage hero banner, main headline, and subtext. Upcoming departure cards are automatically fed from your active scheduled batches.
        </p>
      </div>

      {/* Main Hero Background & Text Content */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
        <h4 className="text-sm font-bold uppercase tracking-wider text-[#0f2922]">
          Hero Banner & Copy
        </h4>

        {/* Brand Tagline vs Hero Promotional Copy Notice */}
        <div className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-xl p-3.5 flex items-start gap-3 text-xs text-[#4a5568]">
          <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="leading-relaxed">
            <span className="font-semibold text-[#0f2922]">Brand Tagline vs. Hero Copy: </span>
            The headline and supporting text below are promotional content specific to this hero section. The official brand tagline (<span className="font-semibold text-[#e8622a]">"{siteSettings?.general?.tagline || "Explore More. Travel Better."}"</span>) is managed centrally in <Link to="/admin/settings" className="underline font-semibold text-[#0f2922] hover:text-[#e8622a]">Settings → General</Link> and displayed in the website branding and hero eyebrow.
          </div>
        </div>

        {/* Hero Background Image */}
        <div className="space-y-2">
          <MediaPicker
            label="Hero Background Image"
            value={heroImage}
            onChange={setHeroImage}
            context={{ category: "homepage" }}
          />
          {heroImage && (
            <div className="relative mt-2 rounded-2xl overflow-hidden border border-[#e2e8f0] bg-slate-950 aspect-[16/9] sm:aspect-[21/9] max-h-64 group shadow-md">
              <img
                src={heroImage}
                alt="Hero banner preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20 flex flex-col justify-end p-4 sm:p-5 text-white">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-widest font-semibold text-[#e8622a] mb-1">
                  EXPLORE UTTARAKHAND
                </div>
                <div
                  className="font-serif text-lg sm:text-2xl font-normal text-white leading-tight mb-1.5"
                  style={{ fontFamily: "var(--font-serif, serif)" }}
                >
                  {(heroTitle || "Explore More. Travel Better.").split(". ").map((part, pIdx, arr) => (
                    <span key={pIdx}>
                      {part}{pIdx < arr.length - 1 ? "." : ""}
                      {pIdx < arr.length - 1 && <br />}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] sm:text-xs text-white/90 line-clamp-2 max-w-md leading-relaxed mb-3">
                  {heroSubtitle || "Curated journeys. Local experiences. Unforgettable landscapes."}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] uppercase tracking-wider font-medium px-3 py-1 rounded-full border border-white/70 text-white bg-black/20 backdrop-blur-xs">
                    EXPLORE TRIPS
                  </span>
                  <span className="text-[9.5px] uppercase tracking-wider font-medium px-3 py-1 rounded-full bg-[#e8622a] text-white">
                    PLAN MY TRIP →
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hero Headline */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a5568] mb-1.5">
            Main Headline
          </label>
          <input
            type="text"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            placeholder="e.g. Find Your Next Mountain Story"
            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f2922] focus:ring-1 focus:ring-[#0f2922]"
          />
          <p className="text-xs text-[#a0aec0] mt-1">
            Displayed prominently in large serif font over the hero background.
          </p>
        </div>

        {/* Hero Subtitle */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a5568] mb-1.5">
            Supporting Subtext
          </label>
          <textarea
            rows={2}
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            placeholder="e.g. Curated journeys. Local experiences. Unforgettable landscapes."
            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f2922] focus:ring-1 focus:ring-[#0f2922] resize-y"
          />
          <p className="text-xs text-[#a0aec0] mt-1">
            Short, evocative description displayed right beneath the headline.
          </p>
        </div>

        {/* Call to Action Buttons */}
        <div className="pt-2 border-t border-[#e2e8f0]">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a5568] mb-2">
            Call-to-Action Buttons
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#0f2922]">Primary Action</span>
                <p className="text-[11px] text-[#718096]">Links to: /trips</p>
              </div>
              <span className="text-xs font-medium px-3 py-1 rounded-full border border-[#0f2922]/20 text-[#0f2922] bg-white">
                EXPLORE TRIPS
              </span>
            </div>
            <div className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#0f2922]">Secondary Action</span>
                <p className="text-[11px] text-[#718096]">Links to: /plan</p>
              </div>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#e8622a] text-white">
                PLAN MY TRIP →
              </span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition shadow-sm disabled:opacity-60 flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving Hero...
              </>
            ) : (
              "Save Hero Changes"
            )}
          </button>
        </div>
      </div>

      {/* Upcoming & Next Departures Explanation & Status */}
      <div className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e8622a]/10 text-[#e8622a] flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0f2922]">
                Upcoming Departures & Next Departure
              </h4>
              <p className="text-xs text-[#718096]">
                Automatically synced in real-time from scheduled batches
              </p>
            </div>
          </div>

          <Link
            to="/admin/trips"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e8622a] hover:text-[#d4541f] bg-white border border-[#e2e8f0] hover:border-[#e8622a]/40 px-3.5 py-2 rounded-lg transition shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <span>Manage Trips & Departures</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        <p className="text-xs text-[#4a5568] leading-relaxed">
          The hero carousel cards are generated dynamically. The earliest scheduled departure across all published trips is tagged with <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">NEXT DEPARTURE</span>, while subsequent upcoming departures are tagged with <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">UPCOMING TRIP</span>. To add or change these cards, manage departures under your Trips packages.
        </p>

        {/* Live list of detected departures */}
        <div className="space-y-2 pt-1">
          <div className="text-xs font-semibold text-[#718096] uppercase tracking-wider">
            Active Queue ({upcomingDepartures.length})
          </div>

          {upcomingDepartures.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-[#cbd5e1] p-4 text-center">
              <p className="text-xs text-[#718096]">
                No upcoming departures currently scheduled. Go to <Link to="/admin/trips" className="text-[#e8622a] underline font-medium">Trips</Link> and add upcoming batch dates to display them on the homepage hero.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {upcomingDepartures.map((dep, idx) => (
                <div
                  key={dep.id}
                  className="bg-white border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        idx === 0
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}
                    >
                      {idx === 0 ? "NEXT DEPARTURE" : "UPCOMING"}
                    </span>
                    <span className="font-semibold text-[#0f2922] truncate">
                      {dep.tripName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-[#718096]">
                    <span className="font-medium text-[#4a5568]">
                      {formatDateLabel(dep.date)}
                    </span>
                    {typeof dep.seatsLeft === "number" && (
                      <span className="hidden sm:inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]">
                        {dep.seatsLeft} seats left
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Featured Destinations Tab ----
function FeaturedTab() {
  const { homepageContent, setHomepageContent, destinations, showToast, refreshContent } = useApp();
  const [selected, setSelected] = useState<string[]>(homepageContent.featuredDestIds);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else if (selected.length < 3) {
      setSelected([...selected, id]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await contentApi.updateHomepageConfig({
        whyUsTitle: homepageContent.whyUsTitle,
        whyUsDescription: homepageContent.whyUsDesc,
        slides: (homepageContent.carouselSlides || []).map((s, i) => {
          if (s.type === "trip") {
            return {
              slideType: "trip" as const,
              tripId: s.tripId || s.tripInstanceId,
              tripInstanceId: s.tripInstanceId,
              titleOverride: s.title,
              subtitleOverride: s.subtitle,
              sortOrder: i,
              isActive: true,
            };
          }
          return { slideType: "static" as const, imageUrl: s.imageUrl, titleOverride: s.title, subtitleOverride: s.subtitle, sortOrder: i, isActive: true };
        }),
        featuredDestinationIds: selected,
        featuredReviewIds: homepageContent.featuredReviewIds,
        whyUsPoints: homepageContent.whyUsPoints.map((p, i) => ({ icon: p.icon, title: p.title, description: p.desc, sortOrder: i })),
      });
      setHomepageContent({ ...homepageContent, featuredDestIds: selected });
      await refreshContent();
      showToast("Featured destinations saved.", "success");
    } catch (err) {
      console.error("Failed to save featured destinations:", err);
      showToast("Failed to save featured destinations.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Featured Destinations</h3>
          <p className="text-[#718096] text-sm">Select up to 3 destinations to feature on the homepage.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-60">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {destinations.map((d) => {
          const isSelected = selected.includes(d.id);
          return (
            <button
              key={d.id}
              onClick={() => toggle(d.id)}
              disabled={!isSelected && selected.length >= 3}
              className={`relative rounded-xl overflow-hidden border-2 transition ${isSelected ? "border-[#e8622a]" : "border-[#e2e8f0] opacity-70 hover:opacity-100"} ${!isSelected && selected.length >= 3 ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <img src={d.image} alt={d.name} className="w-full h-24 object-cover" />
              <div className="p-2 text-left">
                <div className="text-[#0f2922] text-xs font-semibold">{d.name}</div>
              </div>
              {isSelected && (
                <div className="absolute top-2 left-2 w-5 h-5 bg-[#e8622a] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- Why Choose Us Tab ----
function WhyUsTab() {
  const { homepageContent, setHomepageContent, showToast, refreshContent } = useApp();
  const [whyUsTitle, setWhyUsTitle] = useState(homepageContent.whyUsTitle);
  const [whyUsDesc, setWhyUsDesc] = useState(homepageContent.whyUsDesc);
  const [points, setPoints] = useState(homepageContent.whyUsPoints);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await contentApi.updateHomepageConfig({
        whyUsTitle,
        whyUsDescription: whyUsDesc,
        slides: (homepageContent.carouselSlides || []).map((s, i) => {
          if (s.type === "trip") {
            return {
              slideType: "trip" as const,
              tripId: s.tripId || s.tripInstanceId,
              tripInstanceId: s.tripInstanceId,
              titleOverride: s.title,
              subtitleOverride: s.subtitle,
              sortOrder: i,
              isActive: true,
            };
          }
          return { slideType: "static" as const, imageUrl: s.imageUrl, titleOverride: s.title, subtitleOverride: s.subtitle, sortOrder: i, isActive: true };
        }),
        featuredDestinationIds: homepageContent.featuredDestIds,
        featuredReviewIds: homepageContent.featuredReviewIds,
        whyUsPoints: points.map((p, i) => ({ icon: p.icon, title: p.title, description: p.desc, sortOrder: i })),
      });
      setHomepageContent({ ...homepageContent, whyUsTitle, whyUsDesc, whyUsPoints: points });
      await refreshContent();
      showToast("Why Choose Us saved.", "success");
    } catch (err) {
      console.error("Failed to save Why Choose Us:", err);
      showToast("Failed to save Why Choose Us.", "error");
    } finally {
      setSaving(false);
    }
  };

  const updatePoint = (i: number, field: "icon" | "title" | "desc", value: string) => {
    const updated = [...points];
    updated[i] = { ...updated[i], [field]: value };
    setPoints(updated);
  };

  const addPoint = () => setPoints([...points, { icon: "✨", title: "", desc: "" }]);
  const removePoint = (i: number) => setPoints(points.filter((_, j) => j !== i));

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Why Choose Us</h3>
      <div>
        <label className="block text-sm font-medium text-[#4a5568] mb-1">Section Title</label>
        <input value={whyUsTitle} onChange={(e) => setWhyUsTitle(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#4a5568] mb-1">Section Description</label>
        <textarea value={whyUsDesc} onChange={(e) => setWhyUsDesc(e.target.value)} rows={3} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#4a5568]">Points</label>
          <button onClick={addPoint} className="text-[#e8622a] text-xs font-medium hover:underline">+ Add Point</button>
        </div>
        {points.map((p, i) => (
          <div key={i} className="bg-[#f7f8f5] rounded-xl p-4 space-y-2">
            <div className="flex gap-2">
              <input value={p.icon} onChange={(e) => updatePoint(i, "icon", e.target.value)} className="w-14 border border-[#e2e8f0] rounded-lg px-2 py-2 text-sm focus:outline-none text-center" placeholder="🏔️" />
              <input value={p.title} onChange={(e) => updatePoint(i, "title", e.target.value)} placeholder="Point title" className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
              <button onClick={() => removePoint(i)} className="text-red-500 hover:text-red-700 text-xs px-2">✕</button>
            </div>
            <textarea value={p.desc} onChange={(e) => updatePoint(i, "desc", e.target.value)} placeholder="Description..." rows={2} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none" />
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving} className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-60">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

// ---- FAQ Tab ----
function FAQTab() {
  const { faqItems, setFaqItems, showToast, refreshContent } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setEditQ(item.question);
    setEditA(item.answer);
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await contentApi.updateFaq(id, { question: editQ, answer: editA });
      setFaqItems(faqItems.map((f) => f.id === id ? { ...f, question: editQ, answer: editA } : f));
      setEditingId(null);
      showToast("FAQ updated.", "success");
    } catch (err) {
      console.error("Failed to update FAQ:", err);
      showToast("Failed to update FAQ.", "error");
    } finally {
      setSaving(false);
    }
  };

  const addFaq = async () => {
    if (!newQ.trim() || !newA.trim()) return;
    setSaving(true);
    try {
      const created = await contentApi.createFaq({ question: newQ.trim(), answer: newA.trim() });
      setFaqItems([...faqItems, { id: created.id, question: created.question, answer: created.answer }]);
      setNewQ("");
      setNewA("");
      showToast("FAQ added.", "success");
    } catch (err) {
      console.error("Failed to add FAQ:", err);
      showToast("Failed to add FAQ.", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteFaq = async (id: string) => {
    try {
      await contentApi.deleteFaq(id);
      setFaqItems(faqItems.filter((f) => f.id !== id));
      setConfirmDeleteId(null);
      showToast("FAQ deleted.", "info");
    } catch (err) {
      console.error("Failed to delete FAQ:", err);
      showToast("Failed to delete FAQ.", "error");
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const newItems = [...faqItems];
    const target = index + direction;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setFaqItems(newItems);
    // Persist reorder
    try {
      await contentApi.reorderFaqs(newItems.map((f) => f.id));
    } catch (err) {
      console.warn("Failed to persist FAQ reorder:", err);
    }
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>FAQ Items</h3>

      <div className="space-y-3">
        {faqItems.map((item, idx) => (
          <div key={item.id} className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            {editingId === item.id ? (
              <div className="p-4 space-y-3">
                <input value={editQ} onChange={(e) => setEditQ(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] font-medium" />
                <textarea value={editA} onChange={(e) => setEditA(e.target.value)} rows={3} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none text-[#4a5568]" />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(item.id)} disabled={saving} className="bg-[#0f2922] text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-60">
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)} className="border border-[#e2e8f0] text-[#4a5568] text-xs font-medium px-4 py-2 rounded-lg">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-[#0f2922] font-medium text-sm">{item.question}</p>
                    <p className="text-[#718096] text-xs mt-1 leading-relaxed">{item.answer}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 text-[#a0aec0] hover:text-[#0f2922] disabled:opacity-30">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
                    </button>
                    <button onClick={() => move(idx, 1)} disabled={idx === faqItems.length - 1} className="p-1 text-[#a0aec0] hover:text-[#0f2922] disabled:opacity-30">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    </button>
                    <button onClick={() => startEdit(item)} className="p-1 text-[#718096] hover:text-[#0f2922]">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    {confirmDeleteId === item.id ? (
                      <>
                        <button onClick={() => deleteFaq(item.id)} className="text-red-600 text-xs font-medium px-1.5 py-0.5 rounded bg-red-50">Del</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-[#718096] text-xs px-1">✕</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(item.id)} className="p-1 text-red-400 hover:text-red-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new FAQ */}
      <div className="bg-[#f7f8f5] rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-semibold text-[#0f2922]">Add New FAQ</h4>
        <input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Question..." className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
        <textarea value={newA} onChange={(e) => setNewA(e.target.value)} placeholder="Answer..." rows={3} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none" />
        <button
          onClick={addFaq}
          disabled={!newQ.trim() || !newA.trim() || saving}
          className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50"
        >
          {saving ? "Adding..." : "+ Add FAQ"}
        </button>
      </div>
    </div>
  );
}

// ---- Multi-Tile Section List Editor (for Terms, Privacy, About) ----
function SectionListEditor({
  title,
  sections,
  onChange,
  onSave,
  saving,
  saveButtonText,
  helpText,
  onResetDefaults,
}: {
  title: string;
  sections: ContentSection[];
  onChange: (sections: ContentSection[]) => void;
  onSave: () => void;
  saving: boolean;
  saveButtonText: string;
  helpText?: string;
  onResetDefaults?: () => void;
}) {
  const updateSection = (idx: number, field: "title" | "content", val: string) => {
    const next = [...sections];
    next[idx] = { ...next[idx], [field]: val };
    onChange(next);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const remove = (idx: number) => {
    onChange(sections.filter((_, i) => i !== idx));
  };

  const add = () => {
    onChange([...sections, { title: "", content: "" }]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            {title}
          </h3>
          {helpText && <p className="text-[#718096] text-xs mt-0.5">{helpText}</p>}
        </div>
        <div className="flex items-center gap-2">
          {onResetDefaults && (
            <button
              type="button"
              onClick={onResetDefaults}
              className="text-[#718096] hover:text-[#0f2922] text-xs underline font-medium cursor-pointer"
            >
              Reset to Defaults
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving..." : saveButtonText}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sections.length === 0 && (
          <p className="text-[#a0aec0] text-sm text-center py-8 bg-[#f7f8f5] rounded-xl">
            No section tiles defined. Click &ldquo;+ Add Section Tile&rdquo; or &ldquo;Reset to Defaults&rdquo;.
          </p>
        )}
        {sections.map((sec, idx) => (
          <div key={idx} className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#e8622a] uppercase tracking-wider">
                Tile #{idx + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="p-1 text-[#a0aec0] hover:text-[#0f2922] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  title="Move Up"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === sections.length - 1}
                  className="p-1 text-[#a0aec0] hover:text-[#0f2922] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  title="Move Down"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="p-1 text-red-400 hover:text-red-600 cursor-pointer"
                  title="Remove Section Tile"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4a5568] mb-1">Tile Title</label>
              <input
                value={sec.title}
                onChange={(e) => updateSection(idx, "title", e.target.value)}
                placeholder="e.g. 1. Acceptance of Terms"
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm font-medium text-[#0f2922] focus:outline-none focus:border-[#0f2922]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4a5568] mb-1">Tile Content</label>
              <textarea
                value={sec.content}
                onChange={(e) => updateSection(idx, "content", e.target.value)}
                placeholder="Detailed copy for this section tile..."
                rows={4}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm text-[#4a5568] leading-relaxed focus:outline-none focus:border-[#0f2922] resize-y"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={add}
          className="text-[#e8622a] hover:text-[#d4541f] text-sm font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <span className="text-base leading-none">+</span> Add Section Tile
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-60 cursor-pointer"
        >
          {saving ? "Saving..." : saveButtonText}
        </button>
      </div>
    </div>
  );
}

// ---- About Tab ----
function AboutTab() {
  const { aboutContent, setAboutContent, showToast } = useApp();
  const [data, setData] = useState<AboutPageData>(() => parseAboutData(aboutContent));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setData(parseAboutData(aboutContent));
  }, [aboutContent]);

  const updateField = <K extends keyof AboutPageData>(field: K, value: AboutPageData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateEcosystemPoint = (index: number, key: keyof AboutEcosystemPoint, val: string) => {
    const updated = [...data.ecosystemPoints];
    updated[index] = { ...updated[index], [key]: val };
    setData((prev) => ({ ...prev, ecosystemPoints: updated }));
  };

  const addEcosystemPoint = () => {
    setData((prev) => ({
      ...prev,
      ecosystemPoints: [...prev.ecosystemPoints, { icon: "✨", title: "", desc: "" }],
    }));
  };

  const removeEcosystemPoint = (index: number) => {
    setData((prev) => ({
      ...prev,
      ecosystemPoints: prev.ecosystemPoints.filter((_, i) => i !== index),
    }));
  };

  const moveEcosystemPoint = (index: number, direction: -1 | 1) => {
    const updated = [...data.ecosystemPoints];
    const target = index + direction;
    if (target < 0 || target >= updated.length) return;
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setData((prev) => ({ ...prev, ecosystemPoints: updated }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const serialized = serializeAboutData(data);
      await contentApi.updateContentPage("about", {
        title: "About Us",
        body: serialized,
        status: "published",
      });
      setAboutContent(serialized);
      showToast("About Us content saved successfully.", "success");
    } catch (err) {
      console.error("Failed to save About Us:", err);
      showToast("Failed to save About Us.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setData(DEFAULT_ABOUT_DATA);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            About Us Page Content
          </h3>
          <p className="text-[#718096] text-xs mt-0.5">
            Configure copy for the public /about page. Changes appear immediately on the site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-[#718096] hover:text-[#0f2922] text-xs underline font-medium cursor-pointer"
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Saving..." : "Save About Us"}
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-[#f7f8f5] rounded-xl p-5 space-y-4 border border-[#e2e8f0]">
        <div className="border-b border-[#e2e8f0] pb-2">
          <span className="text-xs font-bold text-[#e8622a] uppercase tracking-wider">Hero Banner</span>
          <h4 className="text-sm font-semibold text-[#0f2922]">Top Header Headline & Description</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#4a5568] mb-1">Hero Tagline</label>
            <input
              value={data.heroBadge}
              onChange={(e) => updateField("heroBadge", e.target.value)}
              placeholder="e.g. OUR STORY & MANIFESTO"
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4a5568] mb-1">Hero Title</label>
            <input
              value={data.heroTitle}
              onChange={(e) => updateField("heroTitle", e.target.value)}
              placeholder="e.g. We are Yatrivo. Born in Dehradun."
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#4a5568] mb-1">Hero Description</label>
          <textarea
            value={data.heroDescription}
            onChange={(e) => updateField("heroDescription", e.target.value)}
            rows={2}
            placeholder="Short intro paragraph below title..."
            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white leading-relaxed focus:outline-none focus:border-[#0f2922] resize-y"
          />
        </div>
      </div>

      {/* The Promise Section (Primary - Screenshot 2) */}
      <div className="bg-[#f7f8f5] rounded-xl p-5 space-y-4 border border-[#e2e8f0]">
        <div className="border-b border-[#e2e8f0] pb-2">
          <span className="text-xs font-bold text-[#e8622a] uppercase tracking-wider">The Yatrivo Promise Section</span>
          <h4 className="text-sm font-semibold text-[#0f2922]">Brand Manifesto & Promise Copy</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#4a5568] mb-1">Tagline / Badge</label>
            <input
              value={data.promiseBadge}
              onChange={(e) => updateField("promiseBadge", e.target.value)}
              placeholder="e.g. THE YATRIVO PROMISE"
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4a5568] mb-1">Heading</label>
            <input
              value={data.promiseHeading}
              onChange={(e) => updateField("promiseHeading", e.target.value)}
              placeholder="e.g. Explore More. Travel Better."
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#4a5568] mb-1">Story & Promise Content (Paragraphs)</label>
          <textarea
            value={data.promiseText}
            onChange={(e) => updateField("promiseText", e.target.value)}
            rows={5}
            placeholder="Write the promise description paragraphs..."
            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white leading-relaxed focus:outline-none focus:border-[#0f2922] resize-y"
          />
        </div>
      </div>

      {/* Ecosystem Section */}
      <div className="bg-[#f7f8f5] rounded-xl p-5 space-y-4 border border-[#e2e8f0]">
        <div className="border-b border-[#e2e8f0] pb-2">
          <span className="text-xs font-bold text-[#e8622a] uppercase tracking-wider">Ecosystem & Deep Roots</span>
          <h4 className="text-sm font-semibold text-[#0f2922]">Pillars & Values</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#4a5568] mb-1">Section Tagline</label>
            <input
              value={data.ecosystemBadge}
              onChange={(e) => updateField("ecosystemBadge", e.target.value)}
              placeholder="e.g. OUR ECOSYSTEM STRAP"
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4a5568] mb-1">Section Title</label>
            <input
              value={data.ecosystemHeading}
              onChange={(e) => updateField("ecosystemHeading", e.target.value)}
              placeholder="e.g. Deep Roots in Uttarakhand"
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#4a5568]">Values & Points</label>
            <button
              type="button"
              onClick={addEcosystemPoint}
              className="text-[#e8622a] hover:text-[#d4541f] text-xs font-medium cursor-pointer"
            >
              + Add Point
            </button>
          </div>

          {data.ecosystemPoints.map((item, idx) => (
            <div key={idx} className="bg-white rounded-lg p-3 border border-[#e2e8f0] space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={item.icon}
                  onChange={(e) => updateEcosystemPoint(idx, "icon", e.target.value)}
                  placeholder="🛡️"
                  className="w-12 text-center border border-[#e2e8f0] rounded px-2 py-1 text-sm focus:outline-none"
                />
                <input
                  value={item.title}
                  onChange={(e) => updateEcosystemPoint(idx, "title", e.target.value)}
                  placeholder="Point Title (e.g. 100% Certified Local Safety)"
                  className="flex-1 border border-[#e2e8f0] rounded px-2.5 py-1 text-sm font-medium text-[#0f2922] focus:outline-none focus:border-[#0f2922]"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveEcosystemPoint(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 text-[#a0aec0] hover:text-[#0f2922] disabled:opacity-30 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveEcosystemPoint(idx, 1)}
                    disabled={idx === data.ecosystemPoints.length - 1}
                    className="p-1 text-[#a0aec0] hover:text-[#0f2922] disabled:opacity-30 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEcosystemPoint(idx)}
                    className="p-1 text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
              <textarea
                value={item.desc}
                onChange={(e) => updateEcosystemPoint(idx, "desc", e.target.value)}
                placeholder="Description of this value..."
                rows={2}
                className="w-full border border-[#e2e8f0] rounded px-2.5 py-1 text-xs text-[#4a5568] focus:outline-none focus:border-[#0f2922] resize-y"
              />
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#f7f8f5] rounded-xl p-5 space-y-4 border border-[#e2e8f0]">
        <div className="border-b border-[#e2e8f0] pb-2">
          <span className="text-xs font-bold text-[#e8622a] uppercase tracking-wider">Bottom CTA Banner</span>
          <h4 className="text-sm font-semibold text-[#0f2922]">Call to Action Copy</h4>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#4a5568] mb-1">CTA Heading</label>
          <input
            value={data.ctaHeading}
            onChange={(e) => updateField("ctaHeading", e.target.value)}
            placeholder="e.g. Let's Plan Your Mountain Excursion"
            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#4a5568] mb-1">CTA Description</label>
          <textarea
            value={data.ctaDescription}
            onChange={(e) => updateField("ctaDescription", e.target.value)}
            rows={2}
            placeholder="Description text above planning button..."
            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white leading-relaxed focus:outline-none focus:border-[#0f2922] resize-y"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-60 cursor-pointer"
        >
          {saving ? "Saving..." : "Save About Us"}
        </button>
      </div>
    </div>
  );
}

// ---- Terms & Privacy Tab ----
function TermsPrivacyTab() {
  const { termsContent, setTermsContent, privacyContent, setPrivacyContent, showToast } = useApp();
  const [termsSections, setTermsSections] = useState<ContentSection[]>(() =>
    parseContentSections(termsContent, DEFAULT_TERMS_SECTIONS)
  );
  const [privacySections, setPrivacySections] = useState<ContentSection[]>(() =>
    parseContentSections(privacyContent, DEFAULT_PRIVACY_SECTIONS)
  );
  const [activeSection, setActiveSection] = useState<"terms" | "privacy">("terms");
  const [saving, setSaving] = useState(false);

  const handleSaveTerms = async () => {
    setSaving(true);
    try {
      const serialized = serializeContentSections(termsSections);
      await contentApi.updateContentPage("terms", {
        title: "Terms & Conditions",
        body: serialized,
        status: "published",
      });
      setTermsContent(serialized);
      showToast("Terms & Conditions saved.", "success");
    } catch (err) {
      console.error("Failed to save Terms:", err);
      showToast("Failed to save Terms.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      const serialized = serializeContentSections(privacySections);
      await contentApi.updateContentPage("privacy", {
        title: "Privacy Policy",
        body: serialized,
        status: "published",
      });
      setPrivacyContent(serialized);
      showToast("Privacy Policy saved.", "success");
    } catch (err) {
      console.error("Failed to save Privacy Policy:", err);
      showToast("Failed to save Privacy Policy.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-[#f7f8f5] rounded-lg p-1 w-fit border border-[#e2e8f0]">
        <button
          type="button"
          onClick={() => setActiveSection("terms")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
            activeSection === "terms" ? "bg-white text-[#0f2922] shadow-xs" : "text-[#718096] hover:text-[#0f2922]"
          }`}
        >
          Terms & Conditions ({termsSections.length} tiles)
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("privacy")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
            activeSection === "privacy" ? "bg-white text-[#0f2922] shadow-xs" : "text-[#718096] hover:text-[#0f2922]"
          }`}
        >
          Privacy Policy ({privacySections.length} tiles)
        </button>
      </div>

      {activeSection === "terms" ? (
        <SectionListEditor
          title="Terms & Conditions Clauses"
          helpText="Each tile corresponds to an individual legal clause on the public /terms page."
          sections={termsSections}
          onChange={setTermsSections}
          onSave={handleSaveTerms}
          saving={saving}
          saveButtonText="Save Terms"
          onResetDefaults={() => setTermsSections(DEFAULT_TERMS_SECTIONS)}
        />
      ) : (
        <SectionListEditor
          title="Privacy Policy Clauses"
          helpText="Each tile corresponds to an individual data protection clause on the public /privacy page."
          sections={privacySections}
          onChange={setPrivacySections}
          onSave={handleSavePrivacy}
          saving={saving}
          saveButtonText="Save Privacy Policy"
          onResetDefaults={() => setPrivacySections(DEFAULT_PRIVACY_SECTIONS)}
        />
      )}
    </div>
  );
}

// ---- Featured Reviews Tab ----
function FeaturedReviewsTab() {
  const { reviews, homepageContent, updateFeaturedReviewIds, showToast } = useApp();
  const selectedIds = homepageContent.featuredReviewIds ?? [];
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Map the selected IDs to review objects
  const featuredReviews = selectedIds.map((id) => {
    const found = reviews.find((r) => r.id === id);
    return found || {
      id,
      name: "Verified Traveler",
      tripName: "Himalayan Expedition",
      destination: "Uttarakhand",
      rating: 5 as const,
      text: "Authentic experience guided with deep local care.",
      date: "Recent",
      status: "published" as const,
    };
  });

  const handleRemove = async (id: string) => {
    try {
      setRemovingId(id);
      const nextIds = selectedIds.filter((x) => x !== id);
      await updateFeaturedReviewIds(nextIds);
      showToast("Review removed from homepage.", "info");
    } catch (err) {
      console.error("Failed to remove review:", err);
      showToast("Failed to remove review.", "error");
    } finally {
      setRemovingId(null);
    }
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[idx], next[target]] = [next[target], next[idx]];
    await updateFeaturedReviewIds(next);
    showToast("Homepage review order updated.", "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Featured Reviews on Homepage
            </h3>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                selectedIds.length === 3
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : selectedIds.length > 0
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-gray-100 text-gray-700 border border-gray-200"
              }`}
            >
              {selectedIds.length} / 3 active
            </span>
          </div>
          <p className="text-[#718096] text-xs mt-1 leading-relaxed max-w-md">
            These top 3 reviews are prominently displayed on your public homepage in the &ldquo;Wanderers Speak From Their Hearts&rdquo; section.
          </p>
        </div>

        <Link
          to="/admin/reviews"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0f2922] hover:bg-[#1a3d31] text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
        >
          <span>Manage All Reviews</span>
          <span>→</span>
        </Link>
      </div>

      {/* Featured Reviews List */}
      <div className="space-y-3">
        {featuredReviews.length === 0 ? (
          <div className="bg-[#f7f8f5] border border-dashed border-[#cbd5e1] rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-xs mx-auto border border-[#e2e8f0]">
              ★
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0f2922]">No Reviews Featured on Homepage Yet</h4>
              <p className="text-xs text-[#718096] max-w-md mx-auto mt-1">
                You can feature up to 3 published customer testimonials on your homepage. Go to the Reviews manager, click the three-dots (&middot;&middot;&middot;) on any review, and choose &ldquo;Feature on Homepage&rdquo;.
              </p>
            </div>
            <Link
              to="/admin/reviews"
              className="inline-flex items-center gap-2 bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-xs cursor-pointer"
            >
              Browse Reviews to Feature →
            </Link>
          </div>
        ) : (
          featuredReviews.map((r, idx) => (
            <div
              key={r.id}
              className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-2xs hover:border-[#cbd5e1] transition flex items-start gap-3.5"
            >
              {/* Order index pill */}
              <div className="w-7 h-7 rounded-lg bg-[#f0f9f4] border border-[#d1fae5] text-[#0f2922] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                #{idx + 1}
              </div>

              {/* Review content summary */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-sm text-[#0f2922]">{r.name}</span>
                  <span className="text-xs text-[#718096] bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                    {r.tripName}
                  </span>
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <svg key={i} className="w-3 h-3 text-[#e8622a]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </span>
                </div>
                <p className="text-xs text-[#4a5568] italic leading-relaxed line-clamp-2">
                  &ldquo;{r.text}&rdquo;
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleMove(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 text-[#a0aec0] hover:text-[#0f2922] disabled:opacity-30 rounded hover:bg-gray-100 transition cursor-pointer disabled:cursor-not-allowed"
                  title="Move Up"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 1)}
                  disabled={idx === featuredReviews.length - 1}
                  className="p-1.5 text-[#a0aec0] hover:text-[#0f2922] disabled:opacity-30 rounded hover:bg-gray-100 transition cursor-pointer disabled:cursor-not-allowed"
                  title="Move Down"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={removingId === r.id}
                  onClick={() => handleRemove(r.id)}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer disabled:opacity-50 ml-1"
                  title="Remove from Homepage"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Helpful Instructions Card */}
      <div className="bg-[#f0f9f4] border border-[#d1fae5] rounded-xl p-4 flex items-start gap-3">
        <span className="text-emerald-700 text-lg">💡</span>
        <div className="text-xs text-[#0f2922] leading-relaxed">
          <strong>How to feature new reviews on the homepage:</strong> Navigate to the{" "}
          <Link to="/admin/reviews" className="underline font-bold text-emerald-800">
            Reviews Manager
          </Link>
          , click the three-dots (&middot;&middot;&middot;) action menu on any published customer review, and select{" "}
          <strong>&ldquo;Feature on Homepage&rdquo;</strong>.
        </div>
      </div>
    </div>
  );
}

// ---- Site Assets Tab ----
function SiteAssetsTab() {
  const { siteAssets, refreshSiteAssets, showToast } = useApp();
  const [assetsList, setAssetsList] = useState<SiteAssetApi[]>(() => DEFAULT_SITE_ASSET_SLOTS);
  const [loading, setLoading] = useState(false);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [wipingAll, setWipingAll] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const list = await siteAssetsApi.adminListAll();
      const merged = DEFAULT_SITE_ASSET_SLOTS.map((slot) => {
        const found = (list || []).find((a) => a.assetKey === slot.assetKey);
        return found || slot;
      });
      setAssetsList(merged);
    } catch {
      // Fallback: merge with AppContext state
      const merged = DEFAULT_SITE_ASSET_SLOTS.map((slot) => {
        const fromCtx = siteAssets[slot.assetKey];
        return fromCtx || slot;
      });
      setAssetsList(merged);
    } finally {
      setLoading(false);
    }
  }, [siteAssets]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const handleUpdateImage = async (assetKey: string, newUrl: string) => {
    setSavingKey(assetKey);
    try {
      await siteAssetsApi.updateUrl(assetKey, newUrl);
      setAssetsList((prev) =>
        prev.map((a) => (a.assetKey === assetKey ? { ...a, imageUrl: newUrl } : a))
      );
      await refreshSiteAssets();
      showToast(newUrl ? `Updated image for ${assetKey}` : `Cleared image for ${assetKey}`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update image";
      showToast(msg, "error");
    } finally {
      setSavingKey(null);
    }
  };

  const handleClearImage = async (assetKey: string) => {
    setSavingKey(assetKey);
    try {
      await siteAssetsApi.clearAsset(assetKey);
      setAssetsList((prev) =>
        prev.map((a) =>
          a.assetKey === assetKey
            ? { ...a, imageUrl: null, storageKey: null, storageBucket: null }
            : a
        )
      );
      await refreshSiteAssets();
      showToast(`Wiped image for ${assetKey}. Slot is now clean.`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to wipe image";
      showToast(msg, "error");
    } finally {
      setSavingKey(null);
    }
  };

  const handleWipeAllExternal = async () => {
    if (!window.confirm("Are you sure you want to wipe all external placeholder images from the system? Any slot pointing to an external URL will be reset to clean.")) {
      return;
    }
    setWipingAll(true);
    try {
      const res = await siteAssetsApi.wipeAllExternal();
      await loadAssets();
      await refreshSiteAssets();
      showToast(`Successfully wiped ${res.count} external image placeholders!`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to wipe external images";
      showToast(msg, "error");
    } finally {
      setWipingAll(false);
    }
  };

  const groups = [
    { id: "all", label: "All Groups" },
    { id: "about", label: "About Us" },
    { id: "homepage", label: "Homepage" },
    { id: "activities", label: "Activities" },
    { id: "pages", label: "Other Pages" },
  ];

  const filteredAssets = groupFilter === "all"
    ? assetsList
    : assetsList.filter((a) => a.groupName === groupFilter);

  // Statistics
  const externalCount = assetsList.filter((a) => a.imageUrl && !a.storageKey && !a.imageUrl.includes("yatrivo-media")).length;
  const s3Count = assetsList.filter((a) => a.imageUrl && (a.storageKey || a.imageUrl.includes("yatrivo-media"))).length;
  const cleanCount = assetsList.filter((a) => !a.imageUrl).length;

  return (
    <div className="space-y-6">
      {/* Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e8f0] pb-4">
        <div>
          <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            Site Assets & Static Images
          </h3>
          <p className="text-xs text-[#718096] mt-0.5">
            Manage page-specific banners, hero backgrounds, and static activity cards across the site.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {externalCount > 0 && (
            <button
              type="button"
              onClick={() => void handleWipeAllExternal()}
              disabled={wipingAll}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              title="Wipe all external Unsplash URLs across the entire site"
            >
              <span>🗑️</span>
              <span>{wipingAll ? "Wiping..." : `Wipe All External (${externalCount})`}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => void loadAssets()}
            disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-[#4a5568] hover:bg-[#f7f8f5] transition cursor-pointer"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Storage Status Banner */}
      <div className="grid grid-cols-3 gap-3 bg-[#f7f8f5] border border-[#e2e8f0] rounded-xl p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <div className="font-bold text-[#0f2922]">{s3Count} Uploaded to S3</div>
            <div className="text-[10px] text-[#718096]">Permanently stored</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <div>
            <div className="font-bold text-[#0f2922]">{externalCount} External Placeholders</div>
            <div className="text-[10px] text-[#718096]">Unsplash / external</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0" />
          <div>
            <div className="font-bold text-[#0f2922]">{cleanCount} Clean Slots</div>
            <div className="text-[10px] text-[#718096]">Brand gradient fallback</div>
          </div>
        </div>
      </div>

      {/* Group filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroupFilter(g.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
              groupFilter === g.id
                ? "bg-[#0f2922] text-white shadow-2xs"
                : "bg-white text-[#4a5568] border border-[#e2e8f0] hover:bg-[#edf2f7]"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {loading && assetsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#718096]">
          <div className="w-6 h-6 border-2 border-[#0f2922] border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs">Loading site assets...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssets.map((asset) => {
            const isExternal = Boolean(asset.imageUrl && !asset.storageKey && !asset.imageUrl.includes("yatrivo-media"));
            const isS3 = Boolean(asset.imageUrl && (asset.storageKey || asset.imageUrl.includes("yatrivo-media")));
            const isClean = !asset.imageUrl;

            return (
              <div
                key={asset.assetKey}
                className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-2xs hover:border-[#cbd5e1] transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-[#0f2922]">{asset.label}</span>
                      <span className="text-[10px] font-mono uppercase bg-[#f0f9f4] text-[#0f2922] border border-[#d1fae5] px-2 py-0.5 rounded font-bold">
                        {asset.assetKey}
                      </span>
                      {isS3 && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          S3 Storage
                        </span>
                      )}
                      {isExternal && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          External URL
                        </span>
                      )}
                      {isClean && (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                          No Image Set (Clean)
                        </span>
                      )}
                    </div>
                    {asset.description && (
                      <p className="text-xs text-[#718096]">{asset.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {savingKey === asset.assetKey && (
                      <span className="text-xs text-[#e8622a] font-semibold animate-pulse">
                        Saving...
                      </span>
                    )}
                    {asset.imageUrl && (
                      <button
                        type="button"
                        onClick={() => void handleClearImage(asset.assetKey)}
                        disabled={savingKey === asset.assetKey}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold px-2.5 py-1 rounded border border-red-200 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                        title="Completely remove this image"
                      >
                        Wipe Image
                      </button>
                    )}
                  </div>
                </div>

                {/* MediaPicker integration */}
                <MediaPicker
                  value={asset.imageUrl || ""}
                  onChange={(url) => void handleUpdateImage(asset.assetKey, url)}
                  context={{ category: "general" }}
                  aspectRatio={
                    asset.assetKey.includes("HERO") || asset.assetKey.includes("BG")
                      ? "banner"
                      : "video"
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Main Component ----
export default function AdminContent() {
  const [activeTab, setActiveTab] = useState<ContentTab>("hero");

  return (
    <div className="flex h-full">
      {/* Left nav */}
      <div className="w-52 shrink-0 bg-white border-r border-[#e2e8f0] py-4 px-2 space-y-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition relative ${
              activeTab === t.id ? "bg-[#f0f9f4] text-[#0f2922]" : "text-[#718096] hover:bg-[#f7f8f5]"
            }`}
          >
            {activeTab === t.id && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#e8622a] rounded-r" />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {activeTab === "hero" && <HeroTab />}
          {activeTab === "featured" && <FeaturedTab />}
          {activeTab === "why-us" && <WhyUsTab />}
          {activeTab === "faq" && <FAQTab />}
          {activeTab === "about" && <AboutTab />}
          {activeTab === "terms-privacy" && <TermsPrivacyTab />}
          {activeTab === "site-assets" && <SiteAssetsTab />}
        </div>
      </div>
    </div>
  );
}
