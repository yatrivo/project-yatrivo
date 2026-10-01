import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { mediaApi, type MediaAsset, type MediaReferenceInfo } from "@/api/media";
import { useApp } from "@/context/AppContext";

const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All Media" },
  { id: "destinations", label: "Destinations" },
  { id: "trips", label: "Trips" },
  { id: "reviews", label: "Reviews" },
  { id: "homepage", label: "Homepage" },
  { id: "general", label: "General" }
];

function isSafeHttpUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

interface UploadModalProps {
  onClose: () => void;
  onUploaded: (asset: MediaAsset) => void;
  initialDestinationId?: string;
}

function SimpleUploadModal({ onClose, onUploaded, initialDestinationId }: UploadModalProps) {
  const { showToast, destinations } = useApp();
  const [tab, setTab] = useState<"file" | "url">("file");

  // Destination context (optional, simple dropdown only for assignment, no technical paths)
  const [selectedDestId, setSelectedDestId] = useState(
    initialDestinationId && initialDestinationId !== "all" ? initialDestinationId : ""
  );

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL state
  const [url, setUrl] = useState("");

  const processFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!label) setLabel(f.name.replace(/\.[^/.]+$/, ""));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = "";
  };

  const handleFileUpload = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!file) return;
    setIsUploading(true);

    try {
      const destObj = destinations.find((d) => d.id === selectedDestId);
      const category = destObj ? "destinations" : "general";

      const asset = await mediaApi.upload(file, {
        category,
        destinationId: destObj?.id,
        destinationSlug: destObj?.slug,
        label: label.trim() || file.name
      });

      showToast("Image uploaded to storage successfully.", "success");
      onUploaded(asset);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload file";
      showToast(msg, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlUpload = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!url.trim()) return;
    setIsUploading(true);
    try {
      const destObj = destinations.find((d) => d.id === selectedDestId);
      const asset = await mediaApi.createExternal({
        url: url.trim(),
        destinationId: destObj?.id,
        label: label.trim() || undefined,
        category: destObj ? "destinations" : "general"
      });
      showToast("External image registered successfully.", "success");
      onUploaded(asset);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register image URL";
      showToast(msg, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 flex flex-col overflow-hidden max-h-[90vh] border border-[#e2e8f0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">
              MEDIA STORAGE
            </div>
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Upload Image to Library
            </h3>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="text-white/70 hover:text-white transition p-1 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#e2e8f0] bg-[#f7f8f5]">
          <button
            type="button"
            onClick={() => setTab("file")}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 -mb-px transition cursor-pointer ${
              tab === "file" ? "border-[#e8622a] text-[#0f2922] bg-white" : "border-transparent text-[#718096]"
            }`}
          >
            Upload File from Device
          </button>
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 -mb-px transition cursor-pointer ${
              tab === "url" ? "border-[#e8622a] text-[#0f2922] bg-white" : "border-transparent text-[#718096]"
            }`}
          >
            Register External URL
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Destination assignment (optional & simple) */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
              Associate with Destination (optional)
            </label>
            <select
              value={selectedDestId}
              onChange={(e) => setSelectedDestId(e.target.value)}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs bg-white text-[#0f2922] focus:outline-none focus:border-[#0f2922] cursor-pointer"
            >
              <option value="">None / General Library</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {tab === "file" ? (
            <div>
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) processFile(f);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition select-none ${
                  isDragging
                    ? "border-[#e8622a] bg-[#fff5f0]"
                    : "border-[#cbd5e1] hover:border-[#0f2922] bg-[#fafbfa]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="sr-only"
                />

                {preview ? (
                  <div className="space-y-2 text-center">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg mx-auto border border-[#e2e8f0] shadow-sm"
                    />
                    <p className="text-xs font-semibold text-[#0f2922]">{file?.name}</p>
                    <p className="text-[11px] text-[#718096]">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}
                    </p>
                    <span className="inline-block text-xs text-[#e8622a] hover:underline font-medium">
                      Change selected file
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#f0f9f4] text-[#0f2922] flex items-center justify-center mb-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-[#0f2922]">Click or drop image file here</p>
                    <p className="text-xs text-[#718096] mt-0.5">PNG, JPG, or WEBP up to 10MB</p>
                  </>
                )}
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                Image URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs text-[#0f2922] focus:outline-none focus:border-[#0f2922]"
              />
            </div>
          )}

          {/* Optional Label */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
              Asset Name / Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Kedarnath Temple Valley Sunrise"
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs text-[#0f2922] focus:outline-none focus:border-[#0f2922]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 border border-[#e2e8f0] text-[#4a5568] text-xs font-semibold py-2.5 rounded-lg hover:bg-[#f7f8f5] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={tab === "file" ? handleFileUpload : handleUrlUpload}
              disabled={tab === "file" ? !file || isUploading : !url.trim() || isUploading}
              className="flex-1 bg-[#e8622a] hover:bg-[#d4541f] disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              {isUploading ? "Uploading..." : "Save Image"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminMedia() {
  const { showToast, destinations } = useApp();
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [catFilter, setCatFilter] = useState<string>("all");
  const [destFilter, setDestFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Inspector & detail drawer state
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [assetRefs, setAssetRefs] = useState<MediaReferenceInfo | null>(null);
  const [loadingRefs, setLoadingRefs] = useState(false);

  // Delete modal state
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const res = await mediaApi.list({
        category: catFilter !== "all" ? catFilter : undefined,
        destinationId: destFilter !== "all" ? destFilter : undefined,
        search: search.trim() || undefined,
        limit: 100
      });
      setMediaList(Array.isArray(res.media) ? res.media : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load media assets";
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMedia();
  }, [catFilter, destFilter, search]);

  // Load references when an asset is inspected
  const handleInspectAsset = async (asset: MediaAsset) => {
    setSelectedAsset(asset);
    setLoadingRefs(true);
    try {
      const refs = await mediaApi.getReferences(asset.id);
      setAssetRefs(refs);
    } catch {
      setAssetRefs({ totalReferences: 0, references: [] });
    } finally {
      setLoadingRefs(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;
    setIsDeleting(true);
    try {
      await mediaApi.delete(selectedAsset.id);
      showToast("Media asset deleted permanently from storage.", "success");
      setSelectedAsset(null);
      setConfirmDeleteOpen(false);
      await loadMedia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete media asset";
      showToast(msg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {uploadModalOpen && (
        <SimpleUploadModal
          onClose={() => setUploadModalOpen(false)}
          onUploaded={() => {
            void loadMedia();
          }}
          initialDestinationId={destFilter}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">
            CENTRAL ASSET REPOSITORY
          </div>
          <h1 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            Media Library
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Visual repository of all destination images, trip photos, review uploads, and system media.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setUploadModalOpen(true)}
          className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Upload Image</span>
        </button>
      </div>

      {/* Filter and Search Bar (Used ONLY for finding existing media) */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search images by title, filename, or destination..."
              className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
            />
          </div>

          {/* Destination Filter */}
          <select
            value={destFilter}
            onChange={(e) => setDestFilter(e.target.value)}
            className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs bg-white text-[#0f2922] focus:outline-none focus:border-[#0f2922] cursor-pointer"
          >
            <option value="all">All Destinations</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category / Type Pills */}
        <div className="flex gap-1.5 flex-wrap pt-1 border-t border-[#f0f4f1]">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCatFilter(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                catFilter === tab.id
                  ? "bg-[#0f2922] text-white shadow-2xs"
                  : "bg-[#f7f8f5] text-[#4a5568] hover:bg-[#edf2f7]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Gallery Cards (2 columns on lg) */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-16 text-center text-[#718096]">
              <svg className="animate-spin h-7 w-7 text-[#0f2922] mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-xs">Loading media library...</p>
            </div>
          ) : mediaList.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-16 text-center text-[#a0aec0] space-y-2">
              <p className="text-sm font-semibold text-[#4a5568]">No media assets found.</p>
              <p className="text-xs">Click "Upload Image" above to add images to the library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {mediaList.map((img) => {
                const isInspecting = selectedAsset?.id === img.id;
                const formattedDate = img.createdAt
                  ? new Date(img.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short"
                    })
                  : "";

                return (
                  <div
                    key={img.id}
                    onClick={() => void handleInspectAsset(img)}
                    className={`group bg-white rounded-xl border-2 overflow-hidden shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col ${
                      isInspecting
                        ? "border-[#e8622a] ring-2 ring-[#e8622a]/20"
                        : "border-[#e2e8f0] hover:border-[#0f2922]"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[4/3] bg-[#f7f8f5] overflow-hidden relative">
                      <img
                        src={img.url}
                        alt={img.label ?? ""}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.opacity = "0.3";
                        }}
                      />
                    </div>

                    {/* Card Body */}
                    <div className="p-3 text-xs flex-1 flex flex-col justify-between">
                      <p className="font-semibold text-[#0f2922] truncate text-[11px]" title={img.label || img.url}>
                        {img.label || "Untitled Image"}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-[#718096] mt-1.5 pt-1.5 border-t border-[#f0f4f1]">
                        <span>{formattedDate}</span>
                        <span className="text-[#e8622a] font-medium group-hover:underline">Inspect →</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Inspector / Asset Details Drawer */}
        <div className="space-y-4">
          {selectedAsset ? (
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5 space-y-4 sticky top-6">
              <div className="flex items-center justify-between">
                <span className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">
                  ASSET INSPECTOR
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAsset(null)}
                  className="text-[#718096] hover:text-[#0f2922] p-1 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Full Preview */}
              <div className="rounded-lg overflow-hidden border border-[#e2e8f0] bg-[#f7f8f5] aspect-video relative group">
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.label ?? ""}
                  className="w-full h-full object-cover"
                />
                {isSafeHttpUrl(selectedAsset.url) && (
                  <a
                    href={selectedAsset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-[10px] font-medium px-2 py-1 rounded transition flex items-center gap-1 shadow-xs"
                  >
                    <span>Open Full</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Metadata Details */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <h4 className="font-bold text-[#0f2922] text-sm break-all">
                    {selectedAsset.label || "Untitled Asset"}
                  </h4>
                </div>

                <div className="bg-[#f7f8f5] p-3 rounded-lg border border-[#e2e8f0] space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[#718096] shrink-0">Destinations:</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {selectedAsset.destinations && selectedAsset.destinations.length > 0 ? (
                        selectedAsset.destinations.map((d) => (
                          <span
                            key={d.id}
                            className="font-semibold text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200"
                          >
                            {d.name}
                          </span>
                        ))
                      ) : selectedAsset.destinationName ? (
                        <span className="font-semibold text-[#0f2922]">
                          {selectedAsset.destinationName}
                        </span>
                      ) : (
                        <span className="text-[#a0aec0]">General / Unassigned</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#718096]">Sections:</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {(selectedAsset.categories && selectedAsset.categories.length > 0 ? selectedAsset.categories : [selectedAsset.category]).map((c) => (
                        <span key={c} className="capitalize font-medium text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#e2e8f0] text-[#0f2922]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedAsset.createdAt && (
                    <div className="flex justify-between pt-1 border-t border-[#e2e8f0]">
                      <span className="text-[#718096]">Uploaded:</span>
                      <span className="text-[#0f2922]">
                        {new Date(selectedAsset.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Direct URL Copy Button */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedAsset.url);
                    showToast("Image URL copied to clipboard.", "success");
                  }}
                  className="w-full bg-[#f7f8f5] hover:bg-[#edf2f7] border border-[#e2e8f0] text-[#0f2922] text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-[#718096]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>Copy Image URL</span>
                </button>
              </div>

              {/* Active Entity References */}
              <div className="pt-2 border-t border-[#e2e8f0] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#0f2922]">Active References</span>
                  <span className="bg-[#f7f8f5] px-2 py-0.5 rounded-full text-[10px] font-bold text-[#718096]">
                    {loadingRefs ? "..." : `${assetRefs?.totalReferences || 0} items`}
                  </span>
                </div>

                {loadingRefs ? (
                  <p className="text-[11px] text-[#718096]">Checking where asset is used...</p>
                ) : !assetRefs || assetRefs.totalReferences === 0 ? (
                  <p className="text-[11px] text-[#a0aec0]">
                    Not currently linked as cover or gallery in destinations or trips.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {assetRefs.references.map((r, i) => (
                      <div
                        key={i}
                        className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-lg p-2 text-[11px] flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-[#0f2922]">{r.entityName || r.entityId}</span>
                          <span className="text-[#718096] block text-[10px] capitalize">
                            {r.entityType} ({r.relationship})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete Action (Protected if referenced) */}
              <div className="pt-3 border-t border-[#e2e8f0]">
                {confirmDeleteOpen ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2 text-xs">
                    <p className="font-semibold text-red-800">Permanently delete this image?</p>
                    <p className="text-red-700 text-[11px]">This will delete the file from storage and the database.</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteOpen(false)}
                        className="flex-1 bg-white border border-red-300 text-red-800 py-1.5 rounded text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAsset}
                        disabled={isDeleting}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {isDeleting ? "Deleting..." : "Confirm Delete"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (assetRefs && assetRefs.totalReferences > 0) {
                        showToast(
                          `Cannot delete: this image is currently in use by ${assetRefs.totalReferences} active entity.`,
                          "error"
                        );
                        return;
                      }
                      setConfirmDeleteOpen(true);
                    }}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 text-xs font-semibold py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Asset</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#f7f8f5] rounded-xl border border-dashed border-[#cbd5e1] p-10 text-center text-[#718096] text-xs space-y-2">
              <div className="w-10 h-10 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center mx-auto text-[#0f2922]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <p className="font-semibold text-[#0f2922]">No image selected</p>
              <p className="text-[11px] text-[#718096]">
                Click on any image card to inspect details, view references, or copy its URL.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
