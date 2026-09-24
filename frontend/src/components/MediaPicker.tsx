import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { mediaApi, type MediaAsset } from "@/api/media";
import { useApp } from "@/context/AppContext";

const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "destinations", label: "Destinations" },
  { id: "trips", label: "Trips" },
  { id: "completed_trips", label: "Completed Trips" },
  { id: "homepage", label: "Homepage" },
  { id: "general", label: "General" }
];

export interface MediaPickerProps {
  value: string;
  mediaId?: string | null;
  onChange: (url: string, mediaId?: string) => void;
  label?: string;
  className?: string;
  defaultCategory?: string;
}

export default function MediaPicker({
  value,
  mediaId,
  onChange,
  label,
  className,
  defaultCategory = "destinations"
}: MediaPickerProps) {
  const { showToast } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [uploadTab, setUploadTab] = useState<"gallery" | "upload">("upload");

  // Media library state
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  // Upload tab state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadCategory, setUploadCategory] = useState(defaultCategory);
  const [isUploading, setIsUploading] = useState(false);
  const [altTextInput, setAltTextInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load media when modal opens or category changes
  useEffect(() => {
    if (!modalOpen) return;
    let isMounted = true;
    setIsLoadingMedia(true);

    mediaApi
      .list({
        category: catFilter !== "all" ? catFilter : undefined,
        search: search.trim() || undefined
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
  }, [modalOpen, catFilter, search]);

  const handleSelectAsset = (asset: MediaAsset, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onChange(asset.url, asset.id);
    setModalOpen(false);
  };

  const processSelectedFile = (file: File) => {
    setUploadFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (!uploadLabel) {
      setUploadLabel(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
    e.target.value = "";
  };

  const handleUploadSubmit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      const asset = await mediaApi.upload(uploadFile, {
        category: uploadCategory,
        label: uploadLabel.trim() || uploadFile.name,
        altText: altTextInput.trim() || undefined
      });

      onChange(asset.url, asset.id);
      showToast("Image uploaded and selected successfully.", "success");
      setModalOpen(false);
      setUploadFile(null);
      setPreviewUrl(null);
      setUploadLabel("");
      setAltTextInput("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      showToast(msg, "error");
    } finally {
      setIsUploading(false);
    }
  };

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
        category: defaultCategory
      });
      onChange(asset.url, asset.id);
      setUrlMode(false);
      setUrlInput("");
      showToast("Image URL registered.", "success");
    } catch {
      // Fallback: still set raw URL even if external asset registration fails
      onChange(trimmed);
      setUrlMode(false);
      setUrlInput("");
    }
  };

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-[#4a5568] mb-1">{label}</label>}

      {/* Preview + Actions */}
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="shrink-0 w-20 h-20 rounded-lg border border-[#e2e8f0] overflow-hidden bg-[#f7f8f5] flex items-center justify-center relative group shadow-inner">
          {value ? (
            <img
              src={value}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=100&h=100&fit=crop";
              }}
            />
          ) : (
            <svg className="w-8 h-8 text-[#c4cdd8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        {/* Buttons */}
        <div className="flex-1 space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setUploadTab("upload");
                setModalOpen(true);
                setUrlMode(false);
              }}
              className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold px-2.5 py-2 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
              title="Upload an image from your device directly into storage"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Image
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setUploadTab("gallery");
                setModalOpen(true);
                setUrlMode(false);
              }}
              className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-xs font-semibold px-2.5 py-2 rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
              title="Select from existing media assets"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Media Library
            </button>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setUrlMode((v) => !v);
            }}
            className="w-full border border-[#e2e8f0] text-[#4a5568] hover:border-[#0f2922] text-xs font-medium px-3 py-1.5 rounded-lg transition text-center"
          >
            {urlMode ? "Cancel URL Input" : "Use External URL"}
          </button>
          {urlMode && (
            <div className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0f2922]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleApplyUrl();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="bg-[#e8622a] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition hover:bg-[#d4541f]"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gallery & Upload Modal (Portaled to document.body to avoid parent form conflicts) */}
      {modalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(false);
            }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
                  e.stopPropagation();
                }
              }}
            >
              {/* Header */}
              <div className="bg-[#0f2922] px-5 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-white font-semibold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>
                    Media Asset Manager
                  </h3>
                  <p className="text-[#a3bfb5] text-xs">Browse existing assets or upload a new file to storage</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setModalOpen(false);
                  }}
                  className="text-[#a3bfb5] hover:text-white transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs: Upload / Gallery */}
              <div className="flex gap-0 border-b border-[#e2e8f0] shrink-0 bg-[#f7f8f5]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setUploadTab("upload");
                  }}
                  className={`flex-1 py-3 text-sm font-semibold transition border-b-2 -mb-px flex items-center justify-center gap-1.5 ${
                    uploadTab === "upload"
                      ? "border-[#e8622a] text-[#0f2922] bg-white"
                      : "border-transparent text-[#718096] hover:text-[#0f2922]"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload File to Storage
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setUploadTab("gallery");
                  }}
                  className={`flex-1 py-3 text-sm font-semibold transition border-b-2 -mb-px flex items-center justify-center gap-1.5 ${
                    uploadTab === "gallery"
                      ? "border-[#e8622a] text-[#0f2922] bg-white"
                      : "border-transparent text-[#718096] hover:text-[#0f2922]"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Media Library ({mediaList.length})
                </button>
              </div>

              {uploadTab === "gallery" ? (
                <>
                  {/* Search + Category filter */}
                  <div className="p-4 space-y-3 shrink-0 border-b border-[#edf2f7]">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by label or URL..."
                      className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {CATEGORY_TABS.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCatFilter(cat.id);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            catFilter === cat.id ? "bg-[#0f2922] text-white" : "bg-[#f7f8f5] text-[#4a5568] hover:bg-[#e2e8f0]"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="overflow-y-auto flex-1 p-4">
                    {isLoadingMedia ? (
                      <div className="flex flex-col items-center justify-center py-16 text-[#718096]">
                        <svg className="animate-spin h-6 w-6 text-[#0f2922] mb-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-xs">Loading media assets...</p>
                      </div>
                    ) : mediaList.length === 0 ? (
                      <div className="text-center py-16 text-[#a0aec0] text-sm">
                        No media assets found. Switch to the Upload tab to add your first image.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {mediaList.map((img) => {
                          const isCurrent = value === img.url || mediaId === img.id;
                          return (
                            <button
                              key={img.id}
                              type="button"
                              onClick={(e) => handleSelectAsset(img, e)}
                              className={`group relative rounded-xl overflow-hidden border-2 transition aspect-square text-left bg-[#f8faf9] ${
                                isCurrent
                                  ? "border-[#e8622a] ring-2 ring-[#e8622a]/30"
                                  : "border-[#e2e8f0] hover:border-[#0f2922]"
                              }`}
                              title={img.label ?? img.url}
                            >
                              <img
                                src={img.url}
                                alt={img.label ?? ""}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=100&h=100&fit=crop";
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                              {isCurrent && (
                                <div className="absolute top-1.5 right-1.5 bg-[#e8622a] text-white p-0.5 rounded-full">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-1 truncate">
                                {img.label || img.category}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                  {/* File picker & dropzone */}
                  <div>
                    <label className="block text-sm font-semibold text-[#0f2922] mb-1">
                      Select Image File <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-[#718096] mb-3">
                      Supported formats: PNG, JPEG, WEBP, SVG (Max 10MB). Uploads directly to Neon S3 storage.
                    </p>

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
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          processSelectedFile(file);
                        }
                      }}
                      className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition select-none ${
                        isDragging
                          ? "border-[#e8622a] bg-[#fff5f0]"
                          : "border-[#cbd5e1] hover:border-[#0f2922] bg-[#fafbfa]"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                        onChange={handleFileChange}
                        className="sr-only"
                      />

                      {previewUrl ? (
                        <div className="space-y-2 text-center">
                          <img
                            src={previewUrl}
                            alt="Upload preview"
                            className="w-32 h-32 object-cover rounded-lg mx-auto border border-[#e2e8f0] shadow-sm"
                          />
                          <p className="text-xs font-semibold text-[#0f2922]">{uploadFile?.name}</p>
                          <p className="text-[11px] text-[#718096]">
                            {uploadFile ? `${(uploadFile.size / 1024 / 1024).toFixed(2)} MB` : ""}
                          </p>
                          <span className="inline-block text-xs text-[#e8622a] hover:underline font-medium">
                            Change file
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-[#f0f9f4] text-[#0f2922] flex items-center justify-center mb-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm font-semibold text-[#0f2922]">Click or drag &amp; drop image here</p>
                          <p className="text-xs text-[#718096] mt-0.5">PNG, JPG, or WEBP up to 10MB</p>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Label input */}
                  <div>
                    <label className="block text-xs font-medium text-[#4a5568] mb-1">Asset Label (optional)</label>
                    <input
                      type="text"
                      value={uploadLabel}
                      onChange={(e) => setUploadLabel(e.target.value)}
                      placeholder="e.g. Chopta Valley Ridge View"
                      className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    />
                  </div>

                  {/* Alt Text */}
                  <div>
                    <label className="block text-xs font-medium text-[#4a5568] mb-1">Alt Text (for accessibility)</label>
                    <input
                      type="text"
                      value={altTextInput}
                      onChange={(e) => setAltTextInput(e.target.value)}
                      placeholder="e.g. Snowy peaks over Chopta valley"
                      className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    />
                  </div>

                  {/* Category selector */}
                  <div>
                    <label className="block text-xs font-medium text-[#4a5568] mb-1">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]"
                    >
                      <option value="destinations">Destinations</option>
                      <option value="trips">Trips</option>
                      <option value="completed_trips">Completed Trips</option>
                      <option value="homepage">Homepage</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleUploadSubmit}
                    disabled={!uploadFile || isUploading}
                    className="w-full bg-[#e8622a] hover:bg-[#d4541f] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Uploading to Storage...
                      </>
                    ) : (
                      "Upload & Select Asset"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
