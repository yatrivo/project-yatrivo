import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Destination } from "@/data/destinations";
import MediaPicker from "@/components/MediaPicker";

interface DestFormData {
  name: string;
  tagline: string;
  description: string;
  category: "high-altitude" | "spiritual" | "weekend";
  season: string;
  bestTime: string;
  elevation: string;
  image: string;
  gallery: string[];
  highlights: string[];
  activities: string[];
}

const EMPTY_FORM: DestFormData = {
  name: "", tagline: "", description: "", category: "weekend", season: "",
  bestTime: "", elevation: "", image: "", gallery: [], highlights: [], activities: [],
};

function destToForm(d: Destination): DestFormData {
  return {
    name: d.name,
    tagline: d.tagline,
    description: d.description,
    category: d.category,
    season: d.season,
    bestTime: d.bestTime,
    elevation: d.elevation ?? "",
    image: d.image,
    gallery: d.gallery ?? [],
    highlights: d.highlights ?? [],
    activities: d.activities ?? [],
  };
}

function DestinationModal({
  initial,
  title,
  onClose,
  onSave,
}: {
  initial: DestFormData;
  title: string;
  onClose: () => void;
  onSave: (form: DestFormData) => void;
}) {
  const [form, setForm] = useState<DestFormData>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [newGallery, setNewGallery] = useState("");
  const [newHighlight, setNewHighlight] = useState("");
  const [newActivity, setNewActivity] = useState("");

  const set = <K extends keyof DestFormData>(field: K, value: DestFormData[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!form.name.trim()) errs.push("Name is required.");
    if (!form.image.trim()) errs.push("Main image URL is required.");
    setErrors(errs);
    if (errs.length > 0) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-white font-semibold" style={{ fontFamily: "var(--font-serif, serif)" }}>{title}</h3>
          <button onClick={onClose} className="text-[#a3bfb5] hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-red-600 text-sm space-y-1">
              {errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Name <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Tagline</label>
              <input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value as DestFormData["category"])} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                <option value="high-altitude">High Altitude</option>
                <option value="spiritual">Spiritual</option>
                <option value="weekend">Weekend</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Elevation</label>
              <input value={form.elevation} onChange={(e) => set("elevation", e.target.value)} placeholder="e.g. 2,680 m" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Season</label>
              <input value={form.season} onChange={(e) => set("season", e.target.value)} placeholder="e.g. Oct – Mar" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Best Time</label>
              <input value={form.bestTime} onChange={(e) => set("bestTime", e.target.value)} placeholder="e.g. November" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
          </div>

          <MediaPicker
            label="Main Image *"
            value={form.image}
            onChange={(url) => set("image", url)}
          />

          {/* Gallery */}
          <div>
            <label className="block text-sm font-medium text-[#4a5568] mb-2">Gallery Images (max 4)</label>
            <div className="space-y-2">
              {form.gallery.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <MediaPicker
                    value={url}
                    onChange={(newUrl) => { const g = [...form.gallery]; g[i] = newUrl; set("gallery", g); }}
                    className="flex-1"
                  />
                  <button type="button" onClick={() => set("gallery", form.gallery.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 text-xs px-2 shrink-0">✕</button>
                </div>
              ))}
              {form.gallery.length < 4 && (
                <div>
                  <MediaPicker
                    value={newGallery}
                    onChange={(url) => { if (url) { set("gallery", [...form.gallery, url]); setNewGallery(""); } else { setNewGallery(url); } }}
                    label="Add gallery image"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Highlights */}
          <div>
            <label className="block text-sm font-medium text-[#4a5568] mb-2">Highlights</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.highlights.map((h, i) => (
                <span key={i} className="bg-[#f0f9f4] text-[#0f2922] text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  {h}
                  <button type="button" onClick={() => set("highlights", form.highlights.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newHighlight} onChange={(e) => setNewHighlight(e.target.value)} placeholder="Add highlight..." className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newHighlight.trim()) { set("highlights", [...form.highlights, newHighlight.trim()]); setNewHighlight(""); } } }} />
              <button type="button" onClick={() => { if (newHighlight.trim()) { set("highlights", [...form.highlights, newHighlight.trim()]); setNewHighlight(""); } }} className="bg-[#0f2922] text-white text-xs px-3 rounded-lg">Add</button>
            </div>
          </div>

          {/* Activities */}
          <div>
            <label className="block text-sm font-medium text-[#4a5568] mb-2">Activities</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.activities.map((a, i) => (
                <span key={i} className="bg-[#fff3ee] text-[#e8622a] text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  {a}
                  <button type="button" onClick={() => set("activities", form.activities.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newActivity} onChange={(e) => setNewActivity(e.target.value)} placeholder="e.g. Trekking" className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newActivity.trim()) { set("activities", [...form.activities, newActivity.trim()]); setNewActivity(""); } } }} />
              <button type="button" onClick={() => { if (newActivity.trim()) { set("activities", [...form.activities, newActivity.trim()]); setNewActivity(""); } }} className="bg-[#0f2922] text-white text-xs px-3 rounded-lg">Add</button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium py-2.5 rounded-lg hover:bg-[#f7f8f5] transition">Cancel</button>
            <button type="submit" className="flex-1 bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold py-2.5 rounded-lg transition">Save Destination</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDestinations() {
  const { destinations, setDestinations, showToast } = useApp();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingDest, setEditingDest] = useState<Destination | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = destinations.filter((d) => {
    const q = search.toLowerCase();
    return (
      (categoryFilter === "All" || d.category === categoryFilter) &&
      d.name.toLowerCase().includes(q)
    );
  });

  const handleAdd = (form: DestFormData) => {
    const newDest: Destination = {
      id: String(Date.now()),
      name: form.name,
      tagline: form.tagline,
      description: form.description,
      category: form.category,
      season: form.season,
      bestTime: form.bestTime,
      elevation: form.elevation || undefined,
      image: form.image,
      gallery: form.gallery,
      highlights: form.highlights,
      activities: form.activities,
    };
    setDestinations((prev) => [newDest, ...prev]);
    setModalMode(null);
    showToast(`${newDest.name} added successfully.`, "success");
  };

  const handleEdit = (form: DestFormData) => {
    if (!editingDest) return;
    setDestinations((prev) =>
      prev.map((d) =>
        d.id === editingDest.id
          ? {
              ...d,
              name: form.name,
              tagline: form.tagline,
              description: form.description,
              category: form.category,
              season: form.season,
              bestTime: form.bestTime,
              elevation: form.elevation || undefined,
              image: form.image,
              gallery: form.gallery,
              highlights: form.highlights,
              activities: form.activities,
            }
          : d
      )
    );
    setModalMode(null);
    setEditingDest(null);
    showToast(`${form.name} updated.`, "success");
  };

  const handleDelete = (id: string) => {
    const dest = destinations.find((d) => d.id === id);
    setDestinations((prev) => prev.filter((d) => d.id !== id));
    setDeletingId(null);
    showToast(`${dest?.name ?? "Destination"} deleted.`, "error");
  };

  return (
    <div className="p-6 space-y-5">
      {modalMode === "add" && (
        <DestinationModal
          title="Add Destination"
          initial={EMPTY_FORM}
          onClose={() => setModalMode(null)}
          onSave={handleAdd}
        />
      )}
      {modalMode === "edit" && editingDest && (
        <DestinationModal
          title={`Edit — ${editingDest.name}`}
          initial={destToForm(editingDest)}
          onClose={() => { setModalMode(null); setEditingDest(null); }}
          onSave={handleEdit}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Destinations</h2>
          <p className="text-[#718096] text-sm mt-0.5">{destinations.length} destinations</p>
        </div>
        <button
          onClick={() => setModalMode("add")}
          className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + Add Destination
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search destinations..."
            className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm w-52 focus:outline-none focus:border-[#0f2922]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
        >
          {["All", "high-altitude", "spiritual", "weekend"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((dest) => (
          <div key={dest.id} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden hover:shadow-md transition">
            <div className="relative">
              <img src={dest.image} alt={dest.name} className="w-full h-40 object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=200&fit=crop"; }} />
              <span className="absolute top-3 right-3 text-xs font-medium rounded-full px-2.5 py-1 bg-blue-100 text-blue-700 capitalize">{dest.category}</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-[#0f2922]">{dest.name}</h3>
              <p className="text-[#718096] text-xs mt-0.5 truncate">{dest.tagline}</p>
              <p className="text-[#4a5568] text-xs mt-1">{dest.activities.length} activities</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setEditingDest(dest); setModalMode("edit"); }}
                  className="flex-1 border border-[#e2e8f0] text-[#4a5568] hover:border-[#0f2922] text-xs font-medium py-1.5 rounded-lg transition"
                >
                  Edit
                </button>
                {deletingId === dest.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(dest.id)} className="border border-red-300 text-red-600 text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-red-50 transition">Confirm</button>
                    <button onClick={() => setDeletingId(null)} className="border border-[#e2e8f0] text-[#4a5568] text-xs font-medium px-2 py-1.5 rounded-lg transition">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(dest.id)}
                    className="border border-[#e2e8f0] text-red-500 hover:border-red-300 text-xs font-medium px-3 py-1.5 rounded-lg transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
