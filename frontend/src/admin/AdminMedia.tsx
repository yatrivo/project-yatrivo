import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { GalleryImage } from "@/context/AppContext";

const CATEGORY_TABS: { id: GalleryImage["category"] | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "homepage", label: "Homepage" },
  { id: "destinations", label: "Destinations" },
  { id: "trips", label: "Trips" },
  { id: "completed-trips", label: "Completed Trips" },
  { id: "reviews", label: "Reviews" },
];

interface UploadModalProps {
  onClose: () => void;
}

function UploadModal({ onClose }: UploadModalProps) {
  const { addGalleryImage, showToast } = useApp();
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<GalleryImage["category"]>("general");

  const handleAdd = () => {
    if (!url.trim()) return;
    addGalleryImage({ url: url.trim(), label: label.trim() || undefined, category });
    showToast("Image added to gallery.", "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Add Image</h3>
          <button onClick={onClose} className="text-[#a0aec0] hover:text-[#0f2922] transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#4a5568] mb-1">Image URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
          />
        </div>

        {url && (
          <div className="w-full h-40 rounded-xl overflow-hidden border border-[#e2e8f0] bg-[#f7f8f5]">
            <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#4a5568] mb-1">Label (optional)</label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Chopta Valley sunset"
            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#4a5568] mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as GalleryImage["category"])}
            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]"
          >
            <option value="general">General</option>
            <option value="homepage">Homepage</option>
            <option value="destinations">Destinations</option>
            <option value="trips">Trips</option>
            <option value="completed-trips">Completed Trips</option>
            <option value="reviews">Reviews</option>
          </select>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium py-2.5 rounded-lg hover:bg-[#f7f8f5] transition">Cancel</button>
          <button
            onClick={handleAdd}
            disabled={!url.trim()}
            className="flex-1 bg-[#e8622a] hover:bg-[#d4541f] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition"
          >
            Add Image
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminMedia() {
  const { galleryImages, removeGalleryImage, showToast } = useApp();
  const [catFilter, setCatFilter] = useState<GalleryImage["category"] | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = galleryImages.filter((img) => {
    const matchCat = catFilter === "all" || img.category === catFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (img.label ?? "").toLowerCase().includes(q) || img.url.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
  };

  const handleBulkDelete = () => {
    selected.forEach((id) => removeGalleryImage(id));
    showToast(`${selected.size} image(s) deleted.`, "success");
    setSelected(new Set());
  };

  const handleDelete = (id: string) => {
    removeGalleryImage(id);
    setDeletingId(null);
    showToast("Image deleted.", "info");
  };

  return (
    <div className="p-6 space-y-5">
      {uploadModalOpen && <UploadModal onClose={() => setUploadModalOpen(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Media Library</h2>
          <p className="text-[#718096] text-sm mt-0.5">{galleryImages.length} images</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button onClick={handleBulkDelete} className="border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium px-4 py-2 rounded-lg transition">
              Delete ({selected.size})
            </button>
          )}
          <button
            onClick={() => setUploadModalOpen(true)}
            className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            + Upload
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1 bg-[#f7f8f5] rounded-lg p-1 flex-wrap">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setCatFilter(t.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${catFilter === t.id ? "bg-white text-[#0f2922] shadow-sm" : "text-[#718096] hover:text-[#0f2922]"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by label or URL..."
            className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm w-56 focus:outline-none focus:border-[#0f2922]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#a0aec0] text-sm bg-[#f7f8f5] rounded-2xl">No images found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`relative bg-white rounded-xl border overflow-hidden group cursor-pointer transition ${selected.has(item.id) ? "border-[#0f2922] ring-2 ring-[#0f2922]/20" : "border-[#e2e8f0] hover:border-[#0f2922]"}`}
              onClick={() => toggleSelect(item.id)}
            >
              {/* Checkbox */}
              <div className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${selected.has(item.id) ? "bg-[#0f2922] border-[#0f2922]" : "bg-white border-[#e2e8f0] opacity-0 group-hover:opacity-100"}`}>
                {selected.has(item.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
              </div>
              <img src={item.url} alt={item.label ?? ""} className="w-full h-24 object-cover" />
              <div className="p-2">
                <p className="text-xs font-medium text-[#0f2922] truncate">{item.label ?? "Untitled"}</p>
                <p className="text-xs text-[#a0aec0] capitalize">{item.category}</p>
              </div>
              {/* Actions overlay */}
              <div className="absolute bottom-8 right-0 left-0 flex gap-1 px-2 opacity-0 group-hover:opacity-100 transition z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard?.writeText(item.url).catch(() => {});
                    showToast("URL copied!", "success");
                  }}
                  className="flex-1 bg-[#0f2922] text-white text-xs py-1 rounded-md"
                >
                  Copy URL
                </button>
                {deletingId === item.id ? (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="bg-red-600 text-white text-xs px-2 py-1 rounded-md">Yes</button>
                    <button onClick={(e) => { e.stopPropagation(); setDeletingId(null); }} className="bg-gray-200 text-gray-600 text-xs px-1.5 py-1 rounded-md">No</button>
                  </>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingId(item.id); }}
                    className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-md"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
