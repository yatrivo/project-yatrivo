import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { FaqItem, CarouselSlide } from "@/context/AppContext";
import MediaPicker from "@/components/MediaPicker";

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
  const { homepageContent, setHomepageContent, showToast, tripInstances, trips } = useApp();
  const [heroTitle, setHeroTitle] = useState(homepageContent.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(homepageContent.heroSubtitle);
  const [slides, setSlides] = useState<CarouselSlide[]>(
    homepageContent.carouselSlides ?? homepageContent.heroImages.map((url) => ({ type: "static" as const, imageUrl: url, title: homepageContent.heroTitle, subtitle: homepageContent.heroSubtitle }))
  );
  const [addMode, setAddMode] = useState<AddSlideMode>(null);
  // Add trip slide form
  const [addTripInstanceId, setAddTripInstanceId] = useState("");
  const [addTripTitle, setAddTripTitle] = useState("");
  const [addTripSubtitle, setAddTripSubtitle] = useState("");
  // Add static slide form
  const [addStaticUrl, setAddStaticUrl] = useState("");
  const [addStaticTitle, setAddStaticTitle] = useState("");
  const [addStaticSubtitle, setAddStaticSubtitle] = useState("");

  const handleSave = () => {
    setHomepageContent({ ...homepageContent, heroTitle, heroSubtitle, carouselSlides: slides });
    showToast("Hero content saved.", "success");
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

      <button onClick={handleSave} className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">Save Hero</button>
    </div>
  );
}

// ---- Featured Destinations Tab ----
function FeaturedTab() {
  const { homepageContent, setHomepageContent, destinations, showToast } = useApp();
  const [selected, setSelected] = useState<string[]>(homepageContent.featuredDestIds);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else if (selected.length < 3) {
      setSelected([...selected, id]);
    }
  };

  const handleSave = () => {
    setHomepageContent({ ...homepageContent, featuredDestIds: selected });
    showToast("Featured destinations saved.", "success");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Featured Destinations</h3>
          <p className="text-[#718096] text-sm">Select up to 3 destinations to feature on the homepage.</p>
        </div>
        <button onClick={handleSave} className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-5 py-2 rounded-lg transition">Save</button>
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
  const { homepageContent, setHomepageContent, showToast } = useApp();
  const [whyUsTitle, setWhyUsTitle] = useState(homepageContent.whyUsTitle);
  const [whyUsDesc, setWhyUsDesc] = useState(homepageContent.whyUsDesc);
  const [points, setPoints] = useState(homepageContent.whyUsPoints);

  const handleSave = () => {
    setHomepageContent({ ...homepageContent, whyUsTitle, whyUsDesc, whyUsPoints: points });
    showToast("Why Choose Us saved.", "success");
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
      <button onClick={handleSave} className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">Save</button>
    </div>
  );
}

// ---- FAQ Tab ----
function FAQTab() {
  const { faqItems, setFaqItems, showToast } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setEditQ(item.question);
    setEditA(item.answer);
  };

  const saveEdit = (id: string) => {
    setFaqItems(faqItems.map((f) => f.id === id ? { ...f, question: editQ, answer: editA } : f));
    setEditingId(null);
    showToast("FAQ updated.", "success");
  };

  const addFaq = () => {
    if (!newQ.trim() || !newA.trim()) return;
    const newItem: FaqItem = { id: `faq-${Date.now()}`, question: newQ.trim(), answer: newA.trim() };
    setFaqItems([...faqItems, newItem]);
    setNewQ("");
    setNewA("");
    showToast("FAQ added.", "success");
  };

  const deleteFaq = (id: string) => {
    setFaqItems(faqItems.filter((f) => f.id !== id));
    setConfirmDeleteId(null);
    showToast("FAQ deleted.", "info");
  };

  const move = (index: number, direction: -1 | 1) => {
    const newItems = [...faqItems];
    const target = index + direction;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setFaqItems(newItems);
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
                  <button onClick={() => saveEdit(item.id)} className="bg-[#0f2922] text-white text-xs font-semibold px-4 py-2 rounded-lg">Save</button>
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
          disabled={!newQ.trim() || !newA.trim()}
          className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50"
        >
          + Add FAQ
        </button>
      </div>
    </div>
  );
}

// ---- About Tab ----
function AboutTab() {
  const { aboutContent, setAboutContent, showToast } = useApp();
  const [content, setContent] = useState(aboutContent);

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>About Us</h3>
      <p className="text-[#718096] text-sm">This content overrides the default About page content when set.</p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={16}
        placeholder="Enter about page content..."
        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none font-mono"
      />
      <button
        onClick={() => { setAboutContent(content); showToast("About Us saved.", "success"); }}
        className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition"
      >
        Save About Us
      </button>
    </div>
  );
}

// ---- Terms & Privacy Tab ----
function TermsPrivacyTab() {
  const { termsContent, setTermsContent, privacyContent, setPrivacyContent, showToast } = useApp();
  const [terms, setTerms] = useState(termsContent);
  const [privacy, setPrivacy] = useState(privacyContent);
  const [activeSection, setActiveSection] = useState<"terms" | "privacy">("terms");

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Terms & Privacy</h3>
      <div className="flex gap-1 bg-[#f7f8f5] rounded-lg p-1 w-fit">
        {(["terms", "privacy"] as const).map((s) => (
          <button key={s} onClick={() => setActiveSection(s)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition capitalize ${activeSection === s ? "bg-white text-[#0f2922] shadow-sm" : "text-[#718096] hover:text-[#0f2922]"}`}>
            {s === "terms" ? "Terms & Conditions" : "Privacy Policy"}
          </button>
        ))}
      </div>

      {activeSection === "terms" ? (
        <>
          <p className="text-[#718096] text-sm">Overrides default Terms & Conditions when set.</p>
          <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={16} placeholder="Enter terms content..." className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none font-mono" />
          <button onClick={() => { setTermsContent(terms); showToast("Terms saved.", "success"); }} className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">Save Terms</button>
        </>
      ) : (
        <>
          <p className="text-[#718096] text-sm">Overrides default Privacy Policy when set.</p>
          <textarea value={privacy} onChange={(e) => setPrivacy(e.target.value)} rows={16} placeholder="Enter privacy policy content..." className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none font-mono" />
          <button onClick={() => { setPrivacyContent(privacy); showToast("Privacy Policy saved.", "success"); }} className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">Save Privacy Policy</button>
        </>
      )}
    </div>
  );
}

// ---- Featured Reviews Tab ----
function FeaturedReviewsTab() {
  const { reviews, homepageContent, setHomepageContent, showToast } = useApp();
  const publishedReviews = reviews.filter((r) => r.status === "published");
  const [selectedIds, setSelectedIds] = useState<string[]>(homepageContent.featuredReviewIds ?? []);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else if (selectedIds.length >= 3) {
      showToast("Maximum 3 featured reviews allowed.", "error");
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSave = () => {
    setHomepageContent({ ...homepageContent, featuredReviewIds: selectedIds });
    showToast("Featured reviews saved.", "success");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Featured Reviews</h3>
          <p className="text-[#718096] text-sm">Select up to 3 published reviews to feature on the homepage.</p>
        </div>
        <button onClick={handleSave} className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold px-5 py-2 rounded-lg transition">Save</button>
      </div>

      {selectedIds.length >= 3 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700 text-xs">
          Maximum 3 reviews selected. Uncheck one to select a different review.
        </div>
      )}

      <div className="space-y-3">
        {publishedReviews.length === 0 && (
          <p className="text-[#a0aec0] text-sm text-center py-8 bg-[#f7f8f5] rounded-xl">No published reviews found.</p>
        )}
        {publishedReviews.map((r) => {
          const isSelected = selectedIds.includes(r.id);
          return (
            <label
              key={r.id}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${isSelected ? "border-[#e8622a] bg-[#fff8f5]" : "border-[#e2e8f0] hover:border-[#0f2922]/30 bg-white"}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(r.id)}
                className="mt-0.5 accent-[#e8622a]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#0f2922] text-sm">{r.name}</span>
                  <span className="text-[#718096] text-xs">{r.tripName}</span>
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <svg key={i} className="w-3 h-3 text-[#e8622a]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </span>
                </div>
                <p className="text-[#4a5568] text-xs mt-1 leading-relaxed line-clamp-2">{r.text.slice(0, 100)}{r.text.length > 100 ? "…" : ""}</p>
              </div>
            </label>
          );
        })}
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
