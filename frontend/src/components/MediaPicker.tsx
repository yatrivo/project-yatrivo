import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { GalleryImage } from "@/context/AppContext";

const CATEGORY_TABS: { id: GalleryImage["category"] | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "destinations", label: "Destinations" },
  { id: "trips", label: "Trips" },
  { id: "completed-trips", label: "Completed Trips" },
  { id: "homepage", label: "Homepage" },
];

export interface MediaPickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export default function MediaPicker({ value, onChange, label, className }: MediaPickerProps) {
  const { galleryImages, addGalleryImage } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<GalleryImage["category"] | "all">("all");
  const [uploadTab, setUploadTab] = useState<"gallery" | "upload">("gallery");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadLabel, setUploadLabel] = useState("");

  const filtered = galleryImages.filter((img) => {
    const matchCat = catFilter === "all" || img.category === catFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (img.label ?? "").toLowerCase().includes(q) || img.url.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleSelect = (url: string) => {
    onChange(url);
    setModalOpen(false);
    setSearch("");
    setCatFilter("all");
    setUploadTab("gallery");
  };

  const handleAddToGallery = () => {
    const trimmed = uploadUrl.trim();
    if (!trimmed) return;
    addGalleryImage({ url: trimmed, category: "general", label: uploadLabel.trim() || undefined });
    onChange(trimmed);
    setUploadUrl("");
    setUploadLabel("");
    setModalOpen(false);
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrlMode(false);
    setUrlInput("");
  };

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-[#4a5568] mb-1">{label}</label>}

      {/* Preview + Actions */}
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="shrink-0 w-20 h-20 rounded-lg border border-[#e2e8f0] overflow-hidden bg-[#f7f8f5] flex items-center justify-center">
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <svg className="w-8 h-8 text-[#c4cdd8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        {/* Buttons */}
        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => { setModalOpen(true); setUrlMode(false); }}
            className="w-full bg-[#0f2922] hover:bg-[#1a3d31] text-white text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Choose from Gallery
          </button>
          <button
            type="button"
            onClick={() => setUrlMode((v) => !v)}
            className="w-full border border-[#e2e8f0] text-[#4a5568] hover:border-[#0f2922] text-xs font-medium px-3 py-2 rounded-lg transition"
          >
            Use URL
          </button>
          {urlMode && (
            <div className="flex gap-1.5">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 border border-[#e2e8f0] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#0f2922]"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyUrl(); } }}
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="bg-[#e8622a] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition hover:bg-[#d4541f]"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-[#0f2922] px-5 py-4 rounded-t-2xl flex items-center justify-between shrink-0">
              <h3 className="text-white font-semibold text-sm" style={{ fontFamily: "var(--font-serif, serif)" }}>Media Gallery</h3>
              <button onClick={() => setModalOpen(false)} className="text-[#a3bfb5] hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs: Gallery / Upload */}
            <div className="flex gap-0 border-b border-[#e2e8f0] shrink-0">
              {(["gallery", "upload"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setUploadTab(t)}
                  className={`flex-1 py-2.5 text-sm font-medium transition capitalize border-b-2 -mb-px ${uploadTab === t ? "border-[#e8622a] text-[#0f2922]" : "border-transparent text-[#718096] hover:text-[#0f2922]"}`}
                >
                  {t === "gallery" ? "Gallery" : "Upload New"}
                </button>
              ))}
            </div>

            {uploadTab === "gallery" ? (
              <>
                {/* Search + Category filter */}
                <div className="p-4 space-y-3 shrink-0">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search images..."
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {CATEGORY_TABS.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCatFilter(cat.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${catFilter === cat.id ? "bg-[#0f2922] text-white" : "bg-[#f7f8f5] text-[#4a5568] hover:bg-[#e2e8f0]"}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid */}
                <div className="overflow-y-auto flex-1 px-4 pb-4">
                  {filtered.length === 0 ? (
                    <div className="text-center py-12 text-[#a0aec0] text-sm">No images found.</div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {filtered.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => handleSelect(img.url)}
                          className="group relative rounded-xl overflow-hidden border-2 border-[#e2e8f0] hover:border-[#e8622a] transition aspect-square"
                          title={img.label ?? img.url}
                        >
                          <img src={img.url} alt={img.label ?? ""} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                          {img.label && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-1 truncate">
                              {img.label}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-6 space-y-4 flex-1">
                <p className="text-[#718096] text-sm">Add a new image by URL. It will be saved to the gallery and selected.</p>
                <div>
                  <label className="block text-xs font-medium text-[#4a5568] mb-1">Image URL</label>
                  <input
                    type="text"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
                  />
                </div>
                {uploadUrl && (
                  <div className="w-full h-40 rounded-xl overflow-hidden border border-[#e2e8f0] bg-[#f7f8f5]">
                    <img src={uploadUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-[#4a5568] mb-1">Label (optional)</label>
                  <input
                    type="text"
                    value={uploadLabel}
                    onChange={(e) => setUploadLabel(e.target.value)}
                    placeholder="e.g. Chopta Valley"
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddToGallery}
                  disabled={!uploadUrl.trim()}
                  className="w-full bg-[#e8622a] hover:bg-[#d4541f] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition"
                >
                  Add to Gallery &amp; Select
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
