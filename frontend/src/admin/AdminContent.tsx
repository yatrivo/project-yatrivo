import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import type { FaqItem, CarouselSlide } from "@/context/AppContext";
import MediaPicker from "@/components/MediaPicker";
import { contentApi } from "@/api/content";
import type { CarouselSlideApi, WhyUsPointApi } from "@/api/content";
import {
  type ContentSection,
  DEFAULT_TERMS_SECTIONS,
  DEFAULT_PRIVACY_SECTIONS,
  DEFAULT_ABOUT_SECTIONS,
  parseContentSections,
  serializeContentSections,
} from "@/data/contentSections";

type ContentTab = "hero" | "featured" | "why-us" | "featured-reviews" | "faq" | "about" | "terms-privacy";

const TABS: { id: ContentTab; label: string }[] = [
  { id: "hero", label: "Hero" },
  { id: "featured", label: "Featured Destinations" },
  { id: "why-us", label: "Why Choose Us" },
  { id: "featured-reviews", label: "Featured Reviews" },
  { id: "faq", label: "FAQ" },
  { id: "about", label: "About Us" },
  { id: "terms-privacy", label: "Terms & Privacy" },
];

// ---- Hero Tab ----
type AddSlideMode = null | "trip" | "static";

function HeroTab() {
  const { homepageContent, setHomepageContent, showToast, tripInstances, trips, refreshContent } = useApp();
  const [heroTitle, setHeroTitle] = useState(homepageContent.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(homepageContent.heroSubtitle);
  const [slides, setSlides] = useState<CarouselSlide[]>(
    homepageContent.carouselSlides ?? homepageContent.heroImages.map((url) => ({ type: "static" as const, imageUrl: url, title: homepageContent.heroTitle, subtitle: homepageContent.heroSubtitle }))
  );
  const [addMode, setAddMode] = useState<AddSlideMode>(null);
  const [saving, setSaving] = useState(false);
  // Add trip slide form
  const [addTripInstanceId, setAddTripInstanceId] = useState("");
  const [addTripTitle, setAddTripTitle] = useState("");
  const [addTripSubtitle, setAddTripSubtitle] = useState("");
  // Add static slide form
  const [addStaticUrl, setAddStaticUrl] = useState("");
  const [addStaticTitle, setAddStaticTitle] = useState("");
  const [addStaticSubtitle, setAddStaticSubtitle] = useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      // Map slides to API format
      const apiSlides: CarouselSlideApi[] = slides.map((slide, i) => {
        if (slide.type === "trip") {
          return {
            slideType: "trip" as const,
            tripInstanceId: slide.tripInstanceId,
            titleOverride: slide.title || undefined,
            subtitleOverride: slide.subtitle || undefined,
            sortOrder: i,
            isActive: true,
          };
        }
        return {
          slideType: "static" as const,
          imageUrl: slide.imageUrl,
          titleOverride: slide.title,
          subtitleOverride: slide.subtitle,
          sortOrder: i,
          isActive: true,
        };
      });

      await contentApi.updateHomepageConfig({
        heroTitle,
        heroSubtitle,
        whyUsTitle: homepageContent.whyUsTitle,
        whyUsDescription: homepageContent.whyUsDesc,
        slides: apiSlides,
        featuredDestinationIds: homepageContent.featuredDestIds,
        featuredReviewIds: homepageContent.featuredReviewIds,
        whyUsPoints: homepageContent.whyUsPoints.map((p, i) => ({
          icon: p.icon,
          title: p.title,
          description: p.desc,
          sortOrder: i,
        })),
      });

      setHomepageContent({ ...homepageContent, heroTitle, heroSubtitle, carouselSlides: slides });
      await refreshContent();
      showToast("Hero content saved.", "success");
    } catch (err) {
      console.error("Failed to save hero content:", err);
      showToast("Failed to save hero content.", "error");
    } finally {
      setSaving(false);
    }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...slides];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSlides(next);
  };

  const remove = (idx: number) => setSlides(slides.filter((_, i) => i !== idx));

  const handleAddTrip = () => {
    if (!addTripInstanceId) return;
    const newSlide: CarouselSlide = {
      type: "trip",
      tripInstanceId: addTripInstanceId,
      title: addTripTitle.trim() || undefined,
      subtitle: addTripSubtitle.trim() || undefined,
    };
    setSlides([...slides, newSlide]);
    setAddMode(null);
    setAddTripInstanceId("");
    setAddTripTitle("");
    setAddTripSubtitle("");
  };

  const handleAddStatic = () => {
    if (!addStaticUrl.trim() || !addStaticTitle.trim()) return;
    const newSlide: CarouselSlide = {
      type: "static",
      imageUrl: addStaticUrl.trim(),
      title: addStaticTitle.trim(),
      subtitle: addStaticSubtitle.trim(),
    };
    setSlides([...slides, newSlide]);
    setAddMode(null);
    setAddStaticUrl("");
    setAddStaticTitle("");
    setAddStaticSubtitle("");
  };

  const getSlidePreviewLabel = (slide: CarouselSlide): string => {
    if (slide.type === "trip") {
      const inst = tripInstances.find((ti) => ti.id === slide.tripInstanceId);
      const trip = inst ? trips.find((t) => t.id === inst.tripId) : null;
      return slide.title ?? trip?.name ?? slide.tripInstanceId;
    }
    return slide.title;
  };

  const getSlideSubLabel = (slide: CarouselSlide): string => {
    if (slide.type === "trip") {
      const inst = tripInstances.find((ti) => ti.id === slide.tripInstanceId);
      if (inst) {
        const trip = trips.find((t) => t.id === inst.tripId);
        return `${trip?.name ?? inst.tripId} — ${inst.displayDate} — ₹${inst.price.toLocaleString("en-IN")}`;
      }
      return slide.tripInstanceId;
    }
    return slide.imageUrl.substring(0, 60) + (slide.imageUrl.length > 60 ? "..." : "");
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Hero Section</h3>
      <div>
        <label className="block text-sm font-medium text-[#4a5568] mb-1">Default Hero Title</label>
        <input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#4a5568] mb-1">Default Hero Subtitle</label>
        <textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={3} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none" />
      </div>

      {/* Carousel Slides */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-[#4a5568]">Carousel Slides</label>
          {addMode === null && (
            <button
              onClick={() => setAddMode("trip")}
              className="text-[#e8622a] text-xs font-medium hover:underline"
            >
              + Add Slide
            </button>
          )}
        </div>

        {/* Slides list */}
        <div className="space-y-2 mb-3">
          {slides.length === 0 && (
            <p className="text-[#a0aec0] text-sm text-center py-4 bg-[#f7f8f5] rounded-xl">No slides yet. Add a trip or static slide.</p>
          )}
          {slides.map((slide, i) => (
            <div key={i} className="bg-white border border-[#e2e8f0] rounded-xl p-3 flex items-start gap-3">
              {/* Type badge */}
              <span className={`mt-0.5 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${slide.type === "trip" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                {slide.type === "trip" ? "TRIP" : "STATIC"}
              </span>
              {/* Preview image */}
              {slide.type === "static" && (
                <img src={slide.imageUrl} alt="" className="w-12 h-9 object-cover rounded shrink-0" />
              )}
              {slide.type === "trip" && (() => {
                const inst = tripInstances.find((ti) => ti.id === slide.tripInstanceId);
                const trip = inst ? trips.find((t) => t.id === inst.tripId) : null;
                return trip ? <img src={trip.image} alt="" className="w-12 h-9 object-cover rounded shrink-0" /> : null;
              })()}
              <div className="flex-1 min-w-0">
                <div className="text-[#0f2922] text-sm font-medium truncate">{getSlidePreviewLabel(slide)}</div>
                <div className="text-[#a0aec0] text-xs truncate">{getSlideSubLabel(slide)}</div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-[#a0aec0] hover:text-[#0f2922] disabled:opacity-30">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
                </button>
                <button onClick={() => move(i, 1)} disabled={i === slides.length - 1} className="p-1 text-[#a0aec0] hover:text-[#0f2922] disabled:opacity-30">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>
                <button onClick={() => remove(i)} className="p-1 text-red-400 hover:text-red-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add slide form */}
        {addMode !== null && (
          <div className="bg-[#f7f8f5] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-[#0f2922]">New Slide</span>
              <div className="flex gap-1 bg-white rounded-lg p-0.5 border border-[#e2e8f0]">
                <button
                  onClick={() => setAddMode("trip")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition ${addMode === "trip" ? "bg-[#0f2922] text-white" : "text-[#718096] hover:text-[#0f2922]"}`}
                >
                  Trip
                </button>
                <button
                  onClick={() => setAddMode("static")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition ${addMode === "static" ? "bg-[#0f2922] text-white" : "text-[#718096] hover:text-[#0f2922]"}`}
                >
                  Static
                </button>
              </div>
              <button onClick={() => setAddMode(null)} className="ml-auto text-[#a0aec0] hover:text-[#0f2922] text-xs">Cancel</button>
            </div>

            {addMode === "trip" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#4a5568] mb-1">Trip Instance</label>
                  <select
                    value={addTripInstanceId}
                    onChange={(e) => setAddTripInstanceId(e.target.value)}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] bg-white"
                  >
                    <option value="">Select a trip instance...</option>
                    {tripInstances.filter((ti) => ti.status === "upcoming").map((ti) => {
                      const trip = trips.find((t) => t.id === ti.tripId);
                      return (
                        <option key={ti.id} value={ti.id}>
                          {trip?.name ?? ti.tripId} — {ti.displayDate} — ₹{ti.price.toLocaleString("en-IN")}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4a5568] mb-1">Override Title (optional)</label>
                  <input value={addTripTitle} onChange={(e) => setAddTripTitle(e.target.value)} placeholder="Defaults to trip name" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4a5568] mb-1">Override Subtitle (optional)</label>
                  <input value={addTripSubtitle} onChange={(e) => setAddTripSubtitle(e.target.value)} placeholder="Defaults to trip date + price" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
                </div>
                <button
                  onClick={handleAddTrip}
                  disabled={!addTripInstanceId}
                  className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50"
                >
                  Add Trip Slide
                </button>
              </>
            )}

            {addMode === "static" && (
              <>
                <MediaPicker
                  label="Image"
                  value={addStaticUrl}
                  onChange={setAddStaticUrl}
                  context={{ category: "homepage" }}
                />
                <div>
                  <label className="block text-xs font-medium text-[#4a5568] mb-1">Title</label>
                  <input value={addStaticTitle} onChange={(e) => setAddStaticTitle(e.target.value)} placeholder="Slide title..." className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4a5568] mb-1">Subtitle</label>
                  <input value={addStaticSubtitle} onChange={(e) => setAddStaticSubtitle(e.target.value)} placeholder="Slide subtitle..." className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
                </div>
                <button
                  onClick={handleAddStatic}
                  disabled={!addStaticUrl.trim() || !addStaticTitle.trim()}
                  className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50"
                >
                  Add Static Slide
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={saving} className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-60">
        {saving ? "Saving..." : "Save Hero"}
      </button>
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
        heroTitle: homepageContent.heroTitle,
        heroSubtitle: homepageContent.heroSubtitle,
        whyUsTitle: homepageContent.whyUsTitle,
        whyUsDescription: homepageContent.whyUsDesc,
        slides: (homepageContent.carouselSlides || []).map((s, i) => {
          if (s.type === "trip") {
            return { slideType: "trip" as const, tripInstanceId: s.tripInstanceId, titleOverride: s.title, subtitleOverride: s.subtitle, sortOrder: i, isActive: true };
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
        heroTitle: homepageContent.heroTitle,
        heroSubtitle: homepageContent.heroSubtitle,
        whyUsTitle,
        whyUsDescription: whyUsDesc,
        slides: (homepageContent.carouselSlides || []).map((s, i) => {
          if (s.type === "trip") {
            return { slideType: "trip" as const, tripInstanceId: s.tripInstanceId, titleOverride: s.title, subtitleOverride: s.subtitle, sortOrder: i, isActive: true };
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
  const [sections, setSections] = useState<ContentSection[]>(() =>
    parseContentSections(aboutContent, DEFAULT_ABOUT_SECTIONS)
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const serialized = serializeContentSections(sections);
      await contentApi.updateContentPage("about", {
        title: "About Us",
        body: serialized,
        status: "published",
      });
      setAboutContent(serialized);
      showToast("About Us story sections saved.", "success");
    } catch (err) {
      console.error("Failed to save About Us:", err);
      showToast("Failed to save About Us.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionListEditor
      title="About Us Story Tiles"
      helpText="Each tile is rendered as a distinct narrative card on the public /about page."
      sections={sections}
      onChange={setSections}
      onSave={handleSave}
      saving={saving}
      saveButtonText="Save About Us"
      onResetDefaults={() => setSections(DEFAULT_ABOUT_SECTIONS)}
    />
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
        <div className="max-w-2xl mx-auto p-6">
          {activeTab === "hero" && <HeroTab />}
          {activeTab === "featured" && <FeaturedTab />}
          {activeTab === "why-us" && <WhyUsTab />}
          {activeTab === "featured-reviews" && <FeaturedReviewsTab />}
          {activeTab === "faq" && <FAQTab />}
          {activeTab === "about" && <AboutTab />}
          {activeTab === "terms-privacy" && <TermsPrivacyTab />}
        </div>
      </div>
    </div>
  );
}
