import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { mediaApi, type MediaAsset } from "@/api/media";
import { useApp } from "@/context/AppContext";
import type { MediaContext } from "./MediaPicker";

export interface MultiMediaPickerProps {
  values: string[];
  mediaIds?: (string | undefined)[];
  onChange: (urls: string[], mediaIds?: (string | undefined)[]) => void;
  maxImages?: number;
  label?: string;
  description?: string;
  className?: string;
  context?: MediaContext;
  disabled?: boolean;
  compact?: boolean;
}

const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All Types" },
  { id: "destinations", label: "Destinations" },
  { id: "trips", label: "Trips" },
  { id: "reviews", label: "Reviews" },
  { id: "homepage", label: "Homepage" },
  { id: "general", label: "General" }
];

export default function MultiMediaPicker({
  values = [],
  mediaIds = [],
  onChange,
  maxImages,
  label,
  description,
  className = "",
  context,
  disabled = false,
  compact = false
}: MultiMediaPickerProps) {
  const { showToast, destinations } = useApp();

  // Modal & Selection State
  const [modalOpen, setModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Hidden native file input for direct multiple upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Modal Library State
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [destFilter, setDestFilter] = useState<string>("all");

  // Selected items inside the modal (Array of MediaAsset)
  const [selectedInModal, setSelectedInModal] = useState<MediaAsset[]>([]);

  // Effective context
  const effectiveCategory = context?.category || (context?.isReview ? "reviews" : "destinations");
  const effectiveDestId = context?.destinationId || undefined;
  const effectiveDestSlug = context?.destinationSlug || undefined;
  const effectiveDestName =
    context?.destinationName ||
    (effectiveDestId ? destinations.find((d) => d.id === effectiveDestId || d.slug === effectiveDestId)?.name : undefined);

  const currentCount = values.length;
  const isAtMax = maxImages !== undefined && currentCount >= maxImages;
  const remainingSlots = maxImages !== undefined ? Math.max(0, maxImages - currentCount) : Infinity;

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
      setSelectedInModal([]);
    }
  }, [modalOpen, effectiveDestId, effectiveDestSlug]);

  // Load media library assets
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

  // Handle direct file uploads (multiple files supported)
  const handleDirectUploadFiles = async (fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (rawFiles.length === 0) {
      showToast("Please choose valid image files (PNG, JPG, WEBP, GIF)", "error");
      return;
    }

    let filesToUpload = rawFiles;
    if (maxImages !== undefined && rawFiles.length > remainingSlots) {
      filesToUpload = rawFiles.slice(0, remainingSlots);
      showToast(
        `Field allows only up to ${maxImages} images (${currentCount} existing). Uploading first ${remainingSlots} files.`,
        "info"
      );
    }

    if (filesToUpload.length === 0) {
      showToast(`Maximum capacity of ${maxImages} images reached.`, "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress({ completed: 0, total: filesToUpload.length });

    try {
      const uploadedAssets = await mediaApi.uploadBatch(
        filesToUpload,
        {
          category: effectiveCategory,
          destinationId: effectiveDestId,
          destinationSlug: effectiveDestSlug,
          isReview: context?.isReview || effectiveCategory === "reviews"
        },
        (completed, total) => {
          setUploadProgress({ completed, total });
        }
      );

      const newUrls = uploadedAssets.map((a) => a.url);
      const newIds = uploadedAssets.map((a) => a.id);

      onChange([...values, ...newUrls], [...(mediaIds || []), ...newIds]);
      showToast(
        `Uploaded and added ${uploadedAssets.length} image${uploadedAssets.length > 1 ? "s" : ""} successfully.`,
        "success"
      );
      if (modalOpen) setModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload images";
      showToast(msg, "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleDirectUploadFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updatedValues = values.filter((_, idx) => idx !== indexToRemove);
    const updatedIds = mediaIds ? mediaIds.filter((_, idx) => idx !== indexToRemove) : undefined;
    onChange(updatedValues, updatedIds);
  };

  const handleMoveImage = (fromIndex: number, direction: "left" | "right") => {
    const toIndex = direction === "left" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= values.length) return;

    const newValues = [...values];
    const [movedVal] = newValues.splice(fromIndex, 1);
    newValues.splice(toIndex, 0, movedVal);

    let newIds: (string | undefined)[] | undefined = undefined;
    if (mediaIds && mediaIds.length > 0) {
      newIds = [...mediaIds];
      const [movedId] = newIds.splice(fromIndex, 1);
      newIds.splice(toIndex, 0, movedId);
    }

    onChange(newValues, newIds);
  };

  // Toggle selection inside modal
  const handleToggleModalAsset = (asset: MediaAsset) => {
    const isAlreadySelected = selectedInModal.some((s) => s.id === asset.id || s.url === asset.url);
    if (isAlreadySelected) {
      setSelectedInModal((prev) => prev.filter((s) => s.id !== asset.id && s.url !== asset.url));
    } else {
      if (selectedInModal.length >= remainingSlots) {
        showToast(
          `Maximum ${maxImages} images allowed (${currentCount} already added + ${selectedInModal.length} selected). Cannot select more.`,
          "error"
        );
        return;
      }
      setSelectedInModal((prev) => [...prev, asset]);
    }
  };

  const handleConfirmModalSelection = () => {
    if (selectedInModal.length === 0) return;
    const newUrls = selectedInModal.map((a) => a.url);
    const newIds = selectedInModal.map((a) => a.id);
    onChange([...values, ...newUrls], [...(mediaIds || []), ...newIds]);
    showToast(`Added ${selectedInModal.length} image${selectedInModal.length > 1 ? "s" : ""} from library.`, "success");
    setModalOpen(false);
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header with Title and Counter */}
      <div className="flex items-center justify-between">
        <div>
          {label && (
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922]">
              {label}
            </label>
          )}
          {description && <p className="text-[11px] text-[#718096] mt-0.5">{description}</p>}
        </div>

        {maxImages !== undefined && (
          <div
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border transition ${
              isAtMax
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-[#f0f9f4] text-[#0f2922] border-[#bbf7d0]"
            }`}
          >
            {currentCount} / {maxImages} images
          </div>
        )}
      </div>

      {/* Hidden file input for 1-click multiple uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleNativeFileChange}
        className="sr-only"
        disabled={disabled || isUploading || isAtMax}
      />

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-3.5 shadow-2xs space-y-3">
        {/* Existing Images Grid */}
        {values.length > 0 && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {values.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="group relative rounded-xl overflow-hidden border border-[#e2e8f0] bg-[#f7f8f5] shadow-inner aspect-[4/3] flex flex-col justify-between"
                >
                  <img
                    src={url}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "0.3";
                    }}
                  />

                  {/* Top Bar: Index badge & Remove button */}
                  <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between z-10 pointer-events-none">
                    <span className="bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-auto">
                      #{idx + 1}
                    </span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveImage(idx);
                        }}
                        className="bg-black/60 hover:bg-rose-600 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition shadow-xs cursor-pointer pointer-events-auto"
                        title="Remove image"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Bottom Bar: Reordering controls */}
                  {!disabled && values.length > 1 && (
                    <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition z-10">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMoveImage(idx, "left");
                          }}
                          className="bg-black/70 hover:bg-[#0f2922] text-white p-1 rounded shadow cursor-pointer text-[10px]"
                          title="Move earlier"
                        >
                          ◀
                        </button>
                      )}
                      {idx < values.length - 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMoveImage(idx, "right");
                          }}
                          className="bg-black/70 hover:bg-[#0f2922] text-white p-1 rounded shadow cursor-pointer text-[10px]"
                          title="Move later"
                        >
                          ▶
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploading Progress Overlay/Banner */}
        {isUploading && (
          <div className="p-3.5 bg-[#f0f9f4] border border-[#bbf7d0] rounded-xl space-y-2 text-xs text-[#0f2922]">
            <div className="flex items-center justify-between font-semibold">
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-[#e8622a] shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>
                  Uploading & processing {uploadProgress ? `${uploadProgress.completed} of ${uploadProgress.total}` : ""} images...
                </span>
              </div>
              {uploadProgress && uploadProgress.total > 0 && (
                <span className="text-[#e8622a] font-bold">
                  {Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%
                </span>
              )}
            </div>
            {uploadProgress && uploadProgress.total > 0 && (
              <div className="w-full bg-[#dcfce7] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#38d39f] h-full transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%` }}
                />
              </div>
            )}
            <p className="text-[10px] text-[#718096]">
              Generating 4 multi-resolution WebP variants and saving to cloud storage.
            </p>
          </div>
        )}

        {/* Add Actions Area (when capacity remains) */}
        {!disabled && !isAtMax && (
          <div className="space-y-2.5">
            {/* Drag & drop box */}
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
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  void handleDirectUploadFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => {
                if (!isUploading) fileInputRef.current?.click();
              }}
              className={`border-2 border-dashed rounded-xl ${
                compact ? "p-3.5" : "p-4"
              } flex flex-col items-center justify-center text-center cursor-pointer transition select-none ${
                isDragging
                  ? "border-[#e8622a] bg-[#fff5f0]"
                  : "border-[#cbd5e1] hover:border-[#0f2922] bg-[#fafbfa]"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#f0f9f4] text-[#0f2922] flex items-center justify-center mb-1.5">
                <svg className="w-4 h-4 text-[#0f2922]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-[#0f2922]">
                Drag &amp; drop multiple images here, or click to upload
              </p>
              <p className="text-[10px] text-[#718096] mt-0.5">
                {maxImages !== undefined
                  ? `Select up to ${remainingSlots} more image${remainingSlots > 1 ? "s" : ""} (PNG, JPG, WEBP)`
                  : "Select multiple image files at once (PNG, JPG, WEBP)"}
              </p>
            </div>

            {/* Action buttons: [ Upload Multiple from Device ] [ Choose from Media Library ] */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
                className="bg-[#e8622a] hover:bg-[#d4541f] disabled:opacity-50 text-white text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Upload from Device</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setModalOpen(true);
                }}
                disabled={isUploading}
                className="bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white text-xs font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Choose from Library</span>
              </button>
            </div>
          </div>
        )}

        {/* Max Limit Reached Notification */}
        {isAtMax && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800 flex items-center justify-between">
            <span className="font-medium">
              Maximum capacity of {maxImages} images reached. Remove an image above to add a different one.
            </span>
          </div>
        )}
      </div>

      {/* Central Media Library Multiple Selection Modal */}
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
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl z-10 flex flex-col max-h-[88vh] overflow-hidden border border-[#e2e8f0]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">
                    CENTRAL MEDIA REPOSITORY
                  </div>
                  <h3 className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-serif, serif)" }}>
                    Select Multiple Images from Library
                  </h3>
                  <p className="text-white/70 text-xs mt-0.5">
                    {maxImages !== undefined
                      ? `You can select up to ${remainingSlots} more image${remainingSlots > 1 ? "s" : ""} (${currentCount} already added)`
                      : "Click to select multiple images to add to this field"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Upload new directly from within modal */}
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Upload New Files</span>
                  </button>

                  <input
                    ref={modalFileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleNativeFileChange}
                    className="sr-only"
                    disabled={isUploading}
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

              {/* Filter Bar */}
              <div className="p-4 bg-[#f7f8f5] border-b border-[#e2e8f0] space-y-3 shrink-0">
                <div className="flex flex-col sm:flex-row gap-2.5">
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

                <div className="flex items-center justify-between flex-wrap gap-2">
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

                  {/* Selection counter & bulk actions */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-[#0f2922]">
                      Selected: {selectedInModal.length}{" "}
                      {maxImages !== undefined ? `/ ${remainingSlots} max` : ""}
                    </span>
                    {selectedInModal.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedInModal([])}
                        className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
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
                    <p className="text-xs">Use the "Upload New Files" button above to upload images directly.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {mediaList.map((img) => {
                      const isAlreadyInField = values.includes(img.url) || (mediaIds && mediaIds.includes(img.id));
                      const isSelectedInModal = selectedInModal.some((s) => s.id === img.id || s.url === img.url);
                      const isSelectionDisabled = !isSelectedInModal && selectedInModal.length >= remainingSlots;

                      return (
                        <div
                          key={img.id}
                          onClick={() => {
                            if (isAlreadyInField) return;
                            handleToggleModalAsset(img);
                          }}
                          className={`group relative rounded-xl overflow-hidden border-2 transition flex flex-col shadow-2xs select-none ${
                            isAlreadyInField
                              ? "opacity-50 border-gray-200 cursor-not-allowed bg-gray-50"
                              : isSelectedInModal
                              ? "border-[#e8622a] ring-2 ring-[#e8622a]/30 cursor-pointer bg-[#fffaf8]"
                              : isSelectionDisabled
                              ? "border-[#e2e8f0] opacity-60 cursor-not-allowed bg-[#fafbfa]"
                              : "border-[#e2e8f0] hover:border-[#0f2922] cursor-pointer bg-[#fafbfa] hover:shadow-md"
                          }`}
                        >
                          {/* Image preview box */}
                          <div className="aspect-[4/3] w-full overflow-hidden bg-[#e2e8f0] relative">
                            <img
                              src={img.thumbnailUrl || img.url}
                              alt={img.label ?? ""}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.opacity = "0.3";
                              }}
                            />

                            {/* Checkbox indicator */}
                            <div className="absolute top-2 right-2">
                              {isAlreadyInField ? (
                                <span className="bg-gray-800/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                                  Already Added
                                </span>
                              ) : isSelectedInModal ? (
                                <div className="bg-[#e8622a] text-white p-1 rounded-full shadow-md">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : (
                                <div
                                  className={`w-5 h-5 rounded-full border-2 bg-white/80 shadow-xs flex items-center justify-center ${
                                    isSelectionDisabled ? "border-gray-300" : "border-gray-400 group-hover:border-[#0f2922]"
                                  }`}
                                />
                              )}
                            </div>
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
                              </div>
                            </div>

                            <div className="mt-2 text-[11px] font-semibold text-center py-1 rounded transition">
                              {isAlreadyInField ? (
                                <span className="text-gray-400">Already in Field</span>
                              ) : isSelectedInModal ? (
                                <span className="text-[#e8622a]">✓ Selected</span>
                              ) : isSelectionDisabled ? (
                                <span className="text-gray-400">Limit Reached</span>
                              ) : (
                                <span className="text-[#0f2922] group-hover:underline">+ Click to Select</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#f7f8f5] border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#718096] shrink-0">
                <span>
                  {selectedInModal.length} selected{" "}
                  {maxImages !== undefined ? `(up to ${remainingSlots} allowed)` : ""}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-[#4a5568] hover:bg-white transition cursor-pointer font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmModalSelection}
                    disabled={selectedInModal.length === 0}
                    className="px-5 py-2 bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white rounded-lg transition cursor-pointer font-semibold shadow-xs"
                  >
                    Add {selectedInModal.length > 0 ? `${selectedInModal.length} ` : ""}Selected Images
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
