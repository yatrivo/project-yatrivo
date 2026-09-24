import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { AdminPage } from "./AdminLayout";
import MediaPicker from "@/components/MediaPicker";

type Section = "basic" | "itinerary" | "inclusions" | "pricing" | "gallery" | "seo";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "basic", label: "Basic Info" },
  { id: "itinerary", label: "Itinerary" },
  { id: "inclusions", label: "Inclusions / Exclusions" },
  { id: "pricing", label: "Pricing" },
  { id: "gallery", label: "Gallery" },
  { id: "seo", label: "SEO" },
];

interface Day { title: string; description: string; }
interface Addon { name: string; price: string; }

function GallerySection() {
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  const addSlot = () => setGalleryUrls((prev) => [...prev, ""]);
  const removeSlot = (i: number) => setGalleryUrls((prev) => prev.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, url: string) => setGalleryUrls((prev) => { const next = [...prev]; next[i] = url; return next; });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Gallery</h2>
      <p className="text-[#718096] text-sm">Add gallery images for this trip.</p>
      <div className="space-y-3">
        {galleryUrls.map((url, i) => (
          <div key={i} className="flex items-center gap-2">
            <MediaPicker
              value={url}
              onChange={(newUrl) => updateSlot(i, newUrl)}
              label={`Image ${i + 1}`}
              className="flex-1"
            />
            <button type="button" onClick={() => removeSlot(i)} className="text-red-500 hover:text-red-700 text-xs px-2 shrink-0 mt-5">✕</button>
          </div>
        ))}
        <button
          type="button"
          onClick={addSlot}
          className="w-full border-2 border-dashed border-[#e2e8f0] rounded-xl py-3 text-[#718096] hover:border-[#0f2922] hover:text-[#0f2922] text-sm transition"
        >
          + Add Image
        </button>
      </div>
    </div>
  );
}

import { useParams, useNavigate, Link } from "react-router-dom";

interface Props {
  setAdminPage?: (p: AdminPage) => void;
}

export default function AdminTripEditor({ setAdminPage }: Props = {}) {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast, trips } = useApp();

  const existingTrip = id ? trips.find((t) => t.id === id) : null;
  const [activeSection, setActiveSection] = useState<Section>("basic");

  // Basic Info
  const [tripName, setTripName] = useState(existingTrip?.name ?? "");
  const [tripImage, setTripImage] = useState(existingTrip?.image ?? "");
  const [destination, setDestination] = useState(existingTrip?.destination ?? "Rishikesh");
  const [duration, setDuration] = useState(existingTrip?.duration ?? "3 Days");
  const [difficulty, setDifficulty] = useState(existingTrip?.difficulty ?? "Easy");
  const [shortDesc, setShortDesc] = useState(existingTrip?.highlights?.[0] ?? "");
  const [highlights, setHighlights] = useState(existingTrip?.highlights ?? ["", ""]);

  // Itinerary
  const [days, setDays] = useState<Day[]>([{ title: "", description: "" }]);

  // Inclusions
  const [inclusions, setInclusions] = useState(existingTrip?.inclusions ?? ["Accommodation", "Meals", "Transport"]);
  const [exclusions, setExclusions] = useState(existingTrip?.exclusions ?? ["Airfare", "Personal expenses"]);

  // Pricing
  const [price, setPrice] = useState(existingTrip ? String(existingTrip.price) : "");
  const [priceNotes, setPriceNotes] = useState("");
  const [addons, setAddons] = useState<Addon[]>([{ name: "", price: "" }]);

  // SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [slug, setSlug] = useState(existingTrip?.id ?? "");

  const addDay = () => setDays([...days, { title: "", description: "" }]);
  const removeDay = (i: number) => setDays(days.filter((_, idx) => idx !== i));
  const moveDay = (i: number, dir: -1 | 1) => {
    const d = [...days];
    const j = i + dir;
    if (j < 0 || j >= d.length) return;
    [d[i], d[j]] = [d[j], d[i]];
    setDays(d);
  };

  const handleSave = (publish: boolean) => {
    showToast(publish ? "Trip published!" : "Draft saved!", "success");
    setAdminPage?.("trips");
    navigate("/admin/trips");
  };

  return (
    <div className="flex h-full">
      {/* Left section nav */}
      <div className="w-44 shrink-0 bg-white border-r border-[#e2e8f0] py-4">
        <div className="px-4 mb-4">
          <Link
            to="/admin/trips"
            onClick={() => setAdminPage?.("trips")}
            className="inline-flex items-center gap-1.5 text-[#718096] hover:text-[#0f2922] text-xs transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back to Trips
          </Link>
          <h3 className="font-semibold text-[#0f2922] text-sm mt-3">
            {existingTrip ? "Edit Trip" : "New Trip"}
          </h3>
        </div>
        <nav className="space-y-0.5 px-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition relative ${
                activeSection === s.id ? "bg-[#f0f9f4] text-[#0f2922]" : "text-[#718096] hover:bg-[#f7f8f5]"
              }`}
            >
              {activeSection === s.id && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#e8622a] rounded-r" />}
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main form */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {activeSection === "basic" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Basic Info</h2>
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">Trip Name</label>
                <input value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder="e.g. Chopta Tungnath Trek" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
              </div>
              <MediaPicker
                label="Trip Cover Image"
                value={tripImage}
                onChange={setTripImage}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-1">Destination</label>
                  <select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                    {["Rishikesh", "Chopta", "Auli", "Kedarnath", "Mussoorie", "Chakrata", "Kanatal"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-1">Duration</label>
                  <input value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">Difficulty</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                  {["Easy", "Moderate", "Challenging", "Expert"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">Short Description</label>
                <textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={3} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" placeholder="Brief trip description..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-2">Highlights</label>
                <div className="space-y-2">
                  {highlights.map((h, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={h}
                        onChange={(e) => { const arr = [...highlights]; arr[i] = e.target.value; setHighlights(arr); }}
                        className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none"
                        placeholder={`Highlight ${i + 1}`}
                      />
                      <button onClick={() => setHighlights(highlights.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 px-2">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setHighlights([...highlights, ""])} className="text-[#0f2922] text-sm hover:underline">+ Add Highlight</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "itinerary" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Itinerary</h2>
              {days.map((day, i) => (
                <div key={i} className="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#0f2922]">Day {i + 1}</span>
                    <div className="flex gap-1">
                      <button onClick={() => moveDay(i, -1)} disabled={i === 0} className="p-1 text-[#a0aec0] hover:text-[#0f2922] disabled:opacity-30">↑</button>
                      <button onClick={() => moveDay(i, 1)} disabled={i === days.length - 1} className="p-1 text-[#a0aec0] hover:text-[#0f2922] disabled:opacity-30">↓</button>
                      <button onClick={() => removeDay(i)} className="p-1 text-red-400 hover:text-red-600">✕</button>
                    </div>
                  </div>
                  <input
                    value={day.title}
                    onChange={(e) => { const d = [...days]; d[i].title = e.target.value; setDays(d); }}
                    placeholder="Day title..."
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                  <textarea
                    value={day.description}
                    onChange={(e) => { const d = [...days]; d[i].description = e.target.value; setDays(d); }}
                    placeholder="Day description..."
                    rows={2}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  />
                </div>
              ))}
              <button onClick={addDay} className="w-full border-2 border-dashed border-[#e2e8f0] rounded-xl py-3 text-[#718096] hover:border-[#0f2922] hover:text-[#0f2922] text-sm transition">
                + Add Day
              </button>
            </div>
          )}

          {activeSection === "inclusions" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Inclusions / Exclusions</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-green-700 mb-2">Inclusions</h3>
                  <div className="space-y-2">
                    {inclusions.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={item}
                          onChange={(e) => { const arr = [...inclusions]; arr[i] = e.target.value; setInclusions(arr); }}
                          className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                        />
                        <button onClick={() => setInclusions(inclusions.filter((_, idx) => idx !== i))} className="text-red-400">✕</button>
                      </div>
                    ))}
                    <button onClick={() => setInclusions([...inclusions, ""])} className="text-green-600 text-xs hover:underline">+ Add</button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-600 mb-2">Exclusions</h3>
                  <div className="space-y-2">
                    {exclusions.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={item}
                          onChange={(e) => { const arr = [...exclusions]; arr[i] = e.target.value; setExclusions(arr); }}
                          className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                        />
                        <button onClick={() => setExclusions(exclusions.filter((_, idx) => idx !== i))} className="text-red-400">✕</button>
                      </div>
                    ))}
                    <button onClick={() => setExclusions([...exclusions, ""])} className="text-red-500 text-xs hover:underline">+ Add</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "pricing" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Pricing</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-1">Starting Price (₹)</label>
                  <input value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="e.g. 8500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">Pricing Notes</label>
                <textarea value={priceNotes} onChange={(e) => setPriceNotes(e.target.value)} rows={2} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4a5568] mb-2">Add-ons</label>
                {addons.map((addon, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={addon.name} onChange={(e) => { const a = [...addons]; a[i].name = e.target.value; setAddons(a); }} placeholder="Add-on name" className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                    <input value={addon.price} onChange={(e) => { const a = [...addons]; a[i].price = e.target.value; setAddons(a); }} placeholder="Price" className="w-24 border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                    <button onClick={() => setAddons(addons.filter((_, idx) => idx !== i))} className="text-red-400">✕</button>
                  </div>
                ))}
                <button onClick={() => setAddons([...addons, { name: "", price: "" }])} className="text-[#0f2922] text-sm hover:underline">+ Add</button>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#4a5568] mb-2">Cancellation Policy</label>
                <table className="w-full text-sm border border-[#e2e8f0] rounded-xl overflow-hidden">
                  <thead className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">Days Before</th>
                      <th className="px-3 py-2 text-left">Refund %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[["30+ days", "100%"], ["15-29 days", "50%"], ["< 15 days", "0%"]].map(([days, refund], i) => (
                      <tr key={i} className="border-t border-[#e2e8f0]">
                        <td className="px-3 py-2">{days}</td>
                        <td className="px-3 py-2">{refund}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === "gallery" && (
            <GallerySection />
          )}

          {activeSection === "seo" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>SEO</h2>
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">Meta Title</label>
                <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none" />
                <p className="text-xs text-[#a0aec0] mt-1">{metaTitle.length}/60 chars</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">Meta Description</label>
                <textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={3} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
                <p className="text-xs text-[#a0aec0] mt-1">{metaDesc.length}/160 chars</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">URL Slug</label>
                <div className="flex items-center border border-[#e2e8f0] rounded-lg overflow-hidden focus-within:border-[#0f2922]">
                  <span className="px-3 py-2 text-sm text-[#a0aec0] bg-[#f7f8f5] border-r border-[#e2e8f0]">yatrivo.com/trips/</span>
                  <input value={slug} onChange={(e) => setSlug(e.target.value)} className="flex-1 px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="sticky bottom-0 bg-white border-t border-[#e2e8f0] px-6 py-4 flex gap-3">
          <button
            onClick={() => handleSave(false)}
            className="border border-[#0f2922] text-[#0f2922] hover:bg-[#f7f8f5] text-sm font-semibold px-6 py-2.5 rounded-lg transition"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition"
          >
            Publish Trip
          </button>
        </div>
      </div>
    </div>
  );
}
