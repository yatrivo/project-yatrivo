import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { mediaApi, type MediaAsset } from "@/api/media";
import { useApp } from "@/context/AppContext";

export interface MediaContext {
  destinationId?: string | null;
  destinationSlug?: string | null;
  destinationName?: string | null;
  category?: "destinations" | "trips" | "reviews" | "homepage" | "general" | string;
  isReview?: boolean;
}

export interface MediaPickerProps {
  value: string;
  mediaId?: string | null;
  onChange: (url: string, mediaId?: string) => void;
  label?: string;
  description?: string;
  className?: string;
  context?: MediaContext;
  /** For backwards compatibility */
  defaultCategory?: string;
  aspectRatio?: "video" | "square" | "banner";
  compact?: boolean;
  disabled?: boolean;
}

const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All Types" },
  { id: "destinations", label: "Destinations" },
  { id: "trips", label: "Trips" },
  { id: "reviews", label: "Reviews" },
  { id: "homepage", label: "Homepage" },
  { id: "general", label: "General" }
];

export default function MediaPicker({
  value,
  mediaId,
  onChange,
  label,
  description,
  className = "",
  context,
  defaultCategory = "destinations",
  aspectRatio = "video",
  compact = false,
  disabled = false
}: MediaPickerProps) {
  const { showToast, destinations } = useApp();

  // Dialog and picker modes
  const [modalOpen, setModalOpen] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isUploadingDirect, setIsUploadingDirect] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Hidden native file input for direct 1-click upload
  const directFileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Media library browser state
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [destFilter, setDestFilter] = useState<string>("all");

  // Determine effective context
  const effectiveCategory = context?.category || (context?.isReview ? "reviews" : defaultCategory);
  const effectiveDestId = context?.destinationId || undefined;
  const effectiveDestSlug = context?.destinationSlug || undefined;
  const effectiveDestName =
    context?.destinationName ||
    (effectiveDestId ? destinations.find((d) => d.id === effectiveDestId || d.slug === effectiveDestId)?.name : undefined);

  // Initialize destination filter in modal to current context destination if available
  useEffect(() => {
    if (modalOpen) {
      if (effectiveDestId) {
        setDestFilter(effectiveDestId);
      } else if (effectiveDestSlug) {
        setDestFilter(effectiveDestSlug);
      } else {
        setDestFilter("all");
      }
    }
  }, [modalOpen, effectiveDestId, effectiveDestSlug]);

  // Load media whenever modal is opened or filters change
  useEffect(() => {
    if (!modalOpen) return;
    let isMounted = true;
    setIsLoadingMedia(true);

    mediaApi
      .list({
        category: catFilter !== "all" ? catFilter : undefined,
        destinationId: destFilter !== "all" ? destFilter : undefined,
        search: search.trim() || undefined,
        limit: 100
      })
      .then((res) => {
        if (isMounted) {
          setMediaList(Array.isArray(res.media) ? res.media : []);
        }
      })
      .catch((err) => {
        console.warn("Failed to load media assets:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingMedia(false);
      });

    return () => {
      isMounted = false;
    };
  }, [modalOpen, catFilter, destFilter, search]);

  // Handle direct file upload (zero questions / zero technical filters asked from user)
  const uploadFileDirectly = async (file: File) => {
    if (!file) return;
    setIsUploadingDirect(true);
    try {
      const asset = await mediaApi.upload(file, {
        category: effectiveCategory,
        destinationId: effectiveDestId,
        destinationSlug: effectiveDestSlug,
        isReview: context?.isReview || effectiveCategory === "reviews",
        label: file.name.replace(/\.[^/.]+$/, "")
      });

      onChange(asset.url, asset.id);
      showToast(
        effectiveDestName
          ? `Image uploaded to ${effectiveDestName} and selected.`
          : "Image uploaded and selected successfully.",
        "success"
      );
      if (modalOpen) setModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      showToast(msg, "error");
    } finally {
      setIsUploadingDirect(false);
    }
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadFileDirectly(file);
    }
    e.target.value = "";
  };

  // External URL handler
  const handleApplyUrl = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    try {
      const asset = await mediaApi.createExternal({
        url: trimmed,
        destinationId: effectiveDestId,
        category: effectiveCategory
      });
      onChange(asset.url, asset.id);
      setUrlMode(false);
      setUrlInput("");
      showToast("External image applied.", "success");
    } catch {
      onChange(trimmed);
      setUrlMode(false);
      setUrlInput("");
    }
  };

  const handleSelectExisting = (asset: MediaAsset, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onChange(asset.url, asset.id);
    setModalOpen(false);
  };

  // Aspect ratio styling
  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "banner"
      ? "aspect-[21/9]"
      : "aspect-[16/9]";

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label & Description */}
      {(label || description) && (
        <div>
          {label && (
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922]">
              {label}
            </label>
          )}
          {description && <p className="text-[11px] text-[#718096] mt-0.5">{description}</p>}
        </div>
      )}

      {/* Hidden file input for 1-click uploads */}
      <input
        ref={directFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleNativeFileChange}
        className="sr-only"
        disabled={disabled || isUploadingDirect}
      />

      {/* Main Preview & Action Area */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-3 shadow-2xs hover:border-[#cbd5e1] transition">
        {value ? (
          /* State 1: Image Selected */
          <div className="space-y-2.5">
            {/* Visual Preview */}
            <div
              className={`relative rounded-lg overflow-hidden border border-[#e2e8f0] bg-[#f7f8f5] group shadow-inner ${
                compact ? "h-32" : aspectClass
              }`}
            >
              <img
                src={value}
                alt="Selected asset"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = "0.3";
                }}
              />

              {/* Uploading indicator overlay */}
              {isUploadingDirect && (
                <div className="absolute inset-0 bg-[#0f2922]/80 backdrop-blur-2xs flex flex-col items-center justify-center text-white z-20">
                  <svg className="animate-spin h-7 w-7 text-[#e8622a] mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-xs font-semibold">Uploading to storage...</p>
                </div>
              )}

              {/* Remove button overlay */}
              {!disabled && !isUploadingDirect && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange("", undefined);
                  }}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition shadow-xs cursor-pointer z-10"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Context indicator badge if associated with destination */}
              {effectiveDestName && (
                <div className="absolute bottom-2 left-2 bg-[#0f2922]/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>🏔️</span>
                  <span>{effectiveDestName}</span>
                </div>
              )}
            </div>

            {/* Clean action buttons: [ Upload New ] [ Choose from Media Library ] */}
            {!disabled && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      directFileInputRef.current?.click();
                    }}
                    disabled={isUploadingDirect}
                    className="bg-[#e8622a] hover:bg-[#d4541f] disabled:opacity-50 text-white text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Upload New</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModalOpen(true);
                      setUrlMode(false);
                    }}
                    disabled={isUploadingDirect}
                    className="bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Media Library</span>
                  </button>
                </div>

                {/* Secondary Option: External URL */}
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setUrlMode((v) => !v);
                    }}
                    className="text-[11px] text-[#718096] hover:text-[#0f2922] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer transition"
                  >
                    <svg className="w-3 h-3 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>{urlMode ? "Hide External URL Input" : "Use External URL"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* State 2: No Image Selected (Clean compact dropzone + actions) */
          <div className="space-y-3">
            <div
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
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  void uploadFileDirectly(file);
                }
              }}
              onClick={() => {
                if (!disabled && !isUploadingDirect) {
                  directFileInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition select-none ${
                isDragging
                  ? "border-[#e8622a] bg-[#fff5f0]"
                  : "border-[#cbd5e1] hover:border-[#0f2922] bg-[#fafbfa]"
              }`}
            >
              {isUploadingDirect ? (
                <div className="flex flex-col items-center justify-center py-2 text-[#0f2922]">
                  <svg className="animate-spin h-6 w-6 text-[#e8622a] mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-xs font-semibold">Uploading to storage...</p>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-[#f0f9f4] text-[#0f2922] flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-[#0f2922]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-[#0f2922]">
                    Drag &amp; drop an image here, or click to upload
                  </p>
                  <p className="text-[11px] text-[#718096] mt-0.5">
                    {effectiveDestName
                      ? `Automatically saves to ${effectiveDestName} folder`
                      : "PNG, JPG, or WEBP up to 10MB"}
                  </p>
                </>
              )}
            </div>

            {/* The Two Primary Action Buttons */}
            {!disabled && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      directFileInputRef.current?.click();
                    }}
                    disabled={isUploadingDirect}
                    className="bg-[#e8622a] hover:bg-[#d4541f] disabled:opacity-50 text-white text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Upload New</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModalOpen(true);
                      setUrlMode(false);
                    }}
                    disabled={isUploadingDirect}
                    className="bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Choose from Media Library</span>
                  </button>
                </div>

                {/* Secondary Option: External URL */}
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setUrlMode((v) => !v);
                    }}
                    className="text-[11px] text-[#718096] hover:text-[#0f2922] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer transition"
                  >
                    <svg className="w-3 h-3 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>{urlMode ? "Hide External URL Input" : "Use External URL"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visually Secondary External URL Input Box */}
        {urlMode && (
          <div className="mt-2.5 pt-2.5 border-t border-[#e2e8f0] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#718096]">
              <span className="font-semibold text-[#0f2922]">External Image URL</span>
              <span className="text-[11px]">Unsplash, Cloudinary, etc.</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-xs text-[#0f2922] focus:outline-none focus:border-[#0f2922]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    void handleApplyUrl();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!urlInput.trim()}
                className="bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Central Media Library Selection Modal */}
      {modalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(false);
            }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl z-10 flex flex-col max-h-[85vh] overflow-hidden border border-[#e2e8f0]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">
                    CENTRAL MEDIA REPOSITORY
                  </div>
                  <h3 className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-serif, serif)" }}>
                    Select Image from Media Library
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick upload trigger right inside modal */}
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    disabled={isUploadingDirect}
                    className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>{isUploadingDirect ? "Uploading..." : "Upload New File"}</span>
                  </button>

                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    onChange={handleNativeFileChange}
                    className="sr-only"
                    disabled={isUploadingDirect}
                  />

                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="text-white/70 hover:text-white transition p-1 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Filter Row: Search & Destination & Type (For Browsing Only) */}
              <div className="p-4 bg-[#f7f8f5] border-b border-[#e2e8f0] space-y-3 shrink-0">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  {/* Search */}
                  <div className="relative flex-1">
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search images by name, label, or destination..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#e2e8f0] rounded-lg text-xs focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                    />
                  </div>

                  {/* Destination Filter */}
                  <select
                    value={destFilter}
                    onChange={(e) => setDestFilter(e.target.value)}
                    className="bg-white border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs text-[#0f2922] focus:outline-none focus:border-[#0f2922] cursor-pointer"
                  >
                    <option value="all">All Destinations</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Pills */}
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORY_TABS.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCatFilter(cat.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                        catFilter === cat.id
                          ? "bg-[#0f2922] text-white shadow-2xs"
                          : "bg-white text-[#4a5568] border border-[#e2e8f0] hover:bg-[#edf2f7]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gallery Grid */}
              <div className="overflow-y-auto flex-1 p-5">
                {isLoadingMedia ? (
                  <div className="flex flex-col items-center justify-center py-20 text-[#718096]">
                    <svg className="animate-spin h-7 w-7 text-[#0f2922] mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-xs">Loading media assets...</p>
                  </div>
                ) : mediaList.length === 0 ? (
                  <div className="text-center py-20 text-[#a0aec0] space-y-2">
                    <p className="text-sm font-semibold text-[#4a5568]">No images match your search or filter.</p>
                    <p className="text-xs">Use the "Upload New File" button above to upload an image directly.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {mediaList.map((img) => {
                      const isSelected = value === img.url || mediaId === img.id;
                      const formattedDate = img.createdAt
                        ? new Date(img.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })
                        : "";

                      return (
                        <div
                          key={img.id}
                          onClick={(e) => handleSelectExisting(img, e)}
                          className={`group relative rounded-xl overflow-hidden border-2 transition cursor-pointer bg-[#fafbfa] flex flex-col shadow-2xs hover:shadow-md ${
                            isSelected
                              ? "border-[#e8622a] ring-2 ring-[#e8622a]/30"
                              : "border-[#e2e8f0] hover:border-[#0f2922]"
                          }`}
                        >
                          {/* Image preview box */}
                          <div className="aspect-[4/3] w-full overflow-hidden bg-[#e2e8f0] relative">
                            <img
                              src={img.url}
                              alt={img.label ?? ""}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.opacity = "0.3";
                              }}
                            />
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-[#e8622a] text-white p-1 rounded-full shadow-sm">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Metadata Card Footer */}
                          <div className="p-2.5 flex-1 flex flex-col justify-between bg-white text-xs">
                            <div>
                              <p className="font-semibold text-[#0f2922] truncate text-[11px]" title={img.label || img.url}>
                                {img.label || "Untitled Asset"}
                              </p>
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-[#718096] flex-wrap">
                                {(img.categories && img.categories.length > 0 ? img.categories : [img.category]).map((c) => (
                                  <span key={c} className="capitalize bg-[#f7f8f5] px-1.5 py-0.5 rounded border border-[#e2e8f0] text-[9px] font-medium text-[#0f2922]">
                                    {c}
                                  </span>
                                ))}
                                {formattedDate && <span className="text-[10px] text-[#a0aec0]">• {formattedDate}</span>}
                              </div>
                            </div>

                            <button
                              type="button"
                              className="mt-2 w-full py-1 rounded bg-[#f7f8f5] group-hover:bg-[#0f2922] text-[#4a5568] group-hover:text-white text-[11px] font-semibold transition text-center"
                            >
                              {isSelected ? "Currently Selected" : "Select Image"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#f7f8f5] border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#718096] shrink-0">
                <span>{mediaList.length} assets available</span>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-1.5 border border-[#e2e8f0] rounded-lg text-[#4a5568] hover:bg-white transition cursor-pointer font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
