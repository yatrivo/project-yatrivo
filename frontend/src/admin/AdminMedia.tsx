import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { mediaApi, type MediaAsset, type MediaReferenceInfo } from "@/api/media";
import { galleryApi } from "@/api/gallery";
import { useApp } from "@/context/AppContext";

const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All Media" },
  { id: "gallery", label: "Public Gallery" },
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
  onUploaded: (asset?: MediaAsset | MediaAsset[]) => void;
  initialDestinationId?: string;
  defaultInGallery?: boolean;
}

function SimpleUploadModal({ onClose, onUploaded, initialDestinationId, defaultInGallery = false }: UploadModalProps) {
  const { showToast, destinations } = useApp();
  const [tab, setTab] = useState<"file" | "url">("file");

  // Destination context
  const [selectedDestId, setSelectedDestId] = useState(
    initialDestinationId && initialDestinationId !== "all" ? initialDestinationId : ""
  );

  // File upload state (Multiple files supported)
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fileTitles, setFileTitles] = useState<string[]>([]);
  const [label, setLabel] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showInGallery, setShowInGallery] = useState(defaultInGallery);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL state
  const [url, setUrl] = useState("");

  const addFiles = (newFiles: FileList | File[]) => {
    const valid = Array.from(newFiles).filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) return;
    setFiles((prev) => [...prev, ...valid]);
    const newPreviews = valid.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    const newTitles = valid.map((f) => f.name.replace(/\.[^/.]+$/, ""));
    setFileTitles((prev) => [...prev, ...newTitles]);
  };

  const removeFileAtIndex = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    setFileTitles((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateFileTitle = (idx: number, newTitle: string) => {
    setFileTitles((prev) => {
      const next = [...prev];
      next[idx] = newTitle;
      return next;
    });
  };

  const handleApplyLabelToAll = () => {
    if (!label.trim() || files.length === 0) return;
    setFileTitles(files.map((_, i) => (files.length > 1 ? `${label.trim()} (${i + 1})` : label.trim())));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleFileUpload = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (files.length === 0) return;
    setIsUploading(true);
    setUploadProgress({ completed: 0, total: files.length });

    try {
      const destObj = destinations.find((d) => d.id === selectedDestId);
      const category = destObj ? "destinations" : "general";

      const uploadedAssets = await mediaApi.uploadBatch(
        files,
        {
          category,
          destinationId: destObj?.id,
          destinationSlug: destObj?.slug,
          labels: fileTitles,
          label: label.trim() || undefined,
          showInGallery
        },
        (completed, total) => {
          setUploadProgress({ completed, total });
        }
      );

      showToast(`Uploaded ${uploadedAssets.length} image${uploadedAssets.length > 1 ? "s" : ""} to storage successfully.`, "success");
      onUploaded(uploadedAssets);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload file";
      showToast(msg, "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
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
        category: destObj ? "destinations" : "general",
        showInGallery
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
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 flex flex-col overflow-hidden max-h-[90vh] border border-[#e2e8f0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">
              MEDIA STORAGE
            </div>
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Upload Images to Library
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
            Upload Files from Device
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
            <p className="text-[11px] text-[#718096] mt-1">
              Selected destination will be assigned to all photos in this upload batch.
            </p>
          </div>

          {tab === "file" ? (
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922]">
                Image Files <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Multi-preview Grid with Individual Title Editing */}
              {previews.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#718096]">
                    <span>
                      {files.length} file{files.length > 1 ? "s" : ""} selected (you can customize each title below)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFiles([]);
                        setPreviews([]);
                        setFileTitles([]);
                      }}
                      className="text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto p-2 border border-[#e2e8f0] rounded-xl bg-[#fafbfa]">
                    {previews.map((p, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden border border-[#cbd5e1] bg-white p-1.5 flex flex-col justify-between group shadow-2xs">
                        <div className="relative aspect-video rounded overflow-hidden bg-gray-100">
                          <img src={p} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeFileAtIndex(idx)}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-0.5 shadow transition cursor-pointer"
                            title="Remove file"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={fileTitles[idx] || ""}
                          onChange={(e) => updateFileTitle(idx, e.target.value)}
                          placeholder="Image title..."
                          className="mt-1.5 w-full text-[10px] px-1.5 py-0.5 border border-[#e2e8f0] rounded focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                          title="Custom title for this specific image"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    addFiles(e.dataTransfer.files);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition ${
                  isDragging
                    ? "border-[#e8622a] bg-[#fffaf8]"
                    : "border-[#cbd5e1] hover:border-[#0f2922] bg-[#f7f8f5]"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#f0f9f4] text-[#0f2922] flex items-center justify-center mb-1.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-[#0f2922]">Click or drop multiple images here</p>
                <p className="text-[10px] text-[#718096] mt-0.5">Select multiple PNG, JPG, or WEBP up to 10MB each</p>
              </div>
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

          {/* Optional Common Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922]">
                {files.length > 1 ? "Common Title / Base Prefix (optional)" : "Asset Name / Label (optional)"}
              </label>
              {files.length > 1 && label.trim() && (
                <button
                  type="button"
                  onClick={handleApplyLabelToAll}
                  className="text-[11px] text-[#e8622a] hover:underline font-semibold cursor-pointer"
                >
                  Apply to all files
                </button>
              )}
            </div>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={files.length > 1 ? "e.g. Kedarnath Valley View (auto-numbers 1, 2, ...)" : "e.g. Kedarnath Temple Valley Sunrise"}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs text-[#0f2922] focus:outline-none focus:border-[#0f2922]"
            />
            <p className="text-[11px] text-[#718096] mt-1">
              {files.length > 1
                ? "Applies this base title to all photos, or edit individual titles in the list above. Leave blank to keep original filenames."
                : "Leave blank to automatically use the file name."}
            </p>
          </div>

          {/* Public Gallery toggle checkbox */}
          <div className="flex items-center gap-2.5 bg-[#f0f9f4] p-3 rounded-xl border border-[#bbf7d0]">
            <input
              type="checkbox"
              id="upload-show-in-gallery"
              checked={showInGallery}
              onChange={(e) => setShowInGallery(e.target.checked)}
              className="rounded text-[#e8622a] focus:ring-[#e8622a] h-4 w-4 cursor-pointer"
            />
            <label htmlFor="upload-show-in-gallery" className="text-xs text-[#0f2922] font-semibold cursor-pointer select-none">
              Include in Public Gallery (shows on website's /gallery page)
            </label>
          </div>

          {/* Upload Progress */}
          {isUploading && uploadProgress && (
            <div className="p-3 bg-[#f0f9f4] border border-[#bbf7d0] rounded-xl flex items-center gap-2.5 text-xs text-[#0f2922]">
              <svg className="animate-spin h-4 w-4 text-[#e8622a] shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Uploading {uploadProgress.completed} of {uploadProgress.total} images...</span>
            </div>
          )}

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
              disabled={tab === "file" ? files.length === 0 || isUploading : !url.trim() || isUploading}
              className="flex-1 bg-[#e8622a] hover:bg-[#d4541f] disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              {isUploading
                ? "Uploading..."
                : tab === "file" && files.length > 1
                ? `Save ${files.length} Images`
                : "Save Image"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface AddToGalleryModalProps {
  onClose: () => void;
  onAdded: () => void;
}

function AddToGalleryModal({ onClose, onAdded }: AddToGalleryModalProps) {
  const { showToast, destinations } = useApp();
  const [modalTab, setModalTab] = useState<"library" | "upload">("library");

  // Library Tab State (Multiple selection enabled)
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [destSelect, setDestSelect] = useState("all");
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [addProgress, setAddProgress] = useState<{ completed: number; total: number } | null>(null);

  // Upload Tab State (Multiple file uploads enabled)
  const [uploadType, setUploadType] = useState<"file" | "url">("file");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadFileTitles, setUploadFileTitles] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [externalUrl, setExternalUrl] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [selectedDestId, setSelectedDestId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    if (modalTab === "library") {
      setLoading(true);
      mediaApi
        .list({
          search: searchQuery.trim() || undefined,
          destinationId: destSelect !== "all" ? destSelect : undefined,
          limit: 100
        })
        .then((res) => {
          if (active) {
            setItems((res.media || []).filter((m) => !m.inGallery));
          }
        })
        .catch(() => {
          if (active) showToast("Failed to load library items", "error");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [modalTab, searchQuery, destSelect]);

  const toggleSelectAsset = (id: string) => {
    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedMediaIds(new Set(items.map((m) => m.id)));
  };

  const deselectAll = () => {
    setSelectedMediaIds(new Set());
  };

  const handleAddSelectedFromLibrary = async () => {
    if (selectedMediaIds.size === 0) return;
    setIsAddingBatch(true);
    setAddProgress({ completed: 0, total: selectedMediaIds.size });

    try {
      const idsArray = Array.from(selectedMediaIds);
      await galleryApi.addBatch(idsArray, (completed, total) => {
        setAddProgress({ completed, total });
      });
      showToast(`Added ${idsArray.length} image${idsArray.length > 1 ? "s" : ""} to Public Gallery!`, "success");
      onAdded();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add items to gallery";
      showToast(msg, "error");
    } finally {
      setIsAddingBatch(false);
      setAddProgress(null);
    }
  };

  const addUploadFiles = (newFiles: FileList | File[]) => {
    const valid = Array.from(newFiles).filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) {
      showToast("Please select valid image files (PNG, JPG, WebP)", "error");
      return;
    }
    setUploadFiles((prev) => [...prev, ...valid]);
    const newPreviews = valid.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    const newTitles = valid.map((f) => f.name.replace(/\.[^/.]+$/, ""));
    setUploadFileTitles((prev) => [...prev, ...newTitles]);
  };

  const removeUploadFileAtIndex = (idx: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    setUploadFileTitles((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateUploadFileTitle = (idx: number, newTitle: string) => {
    setUploadFileTitles((prev) => {
      const next = [...prev];
      next[idx] = newTitle;
      return next;
    });
  };

  const handleApplyTitleToAll = () => {
    if (!titleInput.trim() || uploadFiles.length === 0) return;
    setUploadFileTitles(uploadFiles.map((_, i) => (uploadFiles.length > 1 ? `${titleInput.trim()} (${i + 1})` : titleInput.trim())));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const destObj = destinations.find((d) => d.id === selectedDestId);
      if (uploadType === "file") {
        if (uploadFiles.length === 0) {
          showToast("Please choose image files to upload", "error");
          setIsUploading(false);
          return;
        }

        setUploadProgress({ completed: 0, total: uploadFiles.length });
        await mediaApi.uploadBatch(
          uploadFiles,
          {
            category: destObj ? "destinations" : "general",
            destinationId: destObj?.id,
            destinationSlug: destObj?.slug,
            labels: uploadFileTitles,
            label: titleInput.trim() || undefined,
            showInGallery: true
          },
          (completed, total) => {
            setUploadProgress({ completed, total });
          }
        );
        showToast(`Uploaded ${uploadFiles.length} image${uploadFiles.length > 1 ? "s" : ""} directly to Public Gallery!`, "success");
      } else {
        if (!externalUrl.trim()) {
          showToast("Please enter an image URL", "error");
          setIsUploading(false);
          return;
        }
        await mediaApi.createExternal({
          url: externalUrl.trim(),
          category: destObj ? "destinations" : "general",
          destinationId: destObj?.id,
          label: titleInput.trim() || undefined,
          showInGallery: true
        });
        showToast("New image registered and added to Public Gallery!", "success");
      }
      onAdded();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      showToast(msg, "error");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl z-10 flex flex-col overflow-hidden max-h-[88vh] border border-[#e2e8f0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">
              PUBLIC GALLERY
            </div>
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Add Images to Public Gallery
            </h3>
            <p className="text-white/70 text-xs mt-0.5">
              Select multiple photos from library or upload multiple files directly from your device.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white transition p-1 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher: Choose from Library vs Upload New Media */}
        <div className="flex border-b border-[#e2e8f0] bg-[#f7f8f5] shrink-0">
          <button
            type="button"
            onClick={() => setModalTab("library")}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 -mb-px transition cursor-pointer flex items-center justify-center gap-1.5 ${
              modalTab === "library"
                ? "border-[#e8622a] text-[#0f2922] bg-white"
                : "border-transparent text-[#718096] hover:text-[#0f2922]"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Choose Multiple from Library</span>
          </button>
          <button
            type="button"
            onClick={() => setModalTab("upload")}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 -mb-px transition cursor-pointer flex items-center justify-center gap-1.5 ${
              modalTab === "upload"
                ? "border-[#e8622a] text-[#0f2922] bg-white"
                : "border-transparent text-[#718096] hover:text-[#0f2922]"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Upload Multiple from Device</span>
          </button>
        </div>

        {modalTab === "library" ? (
          <>
            {/* Search & Destination filter with Select All controls */}
            <div className="p-3.5 border-b border-[#e2e8f0] bg-[#f7f8f5] space-y-2.5 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search library images..."
                  className="flex-1 bg-white border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-xs text-[#0f2922] focus:outline-none focus:border-[#0f2922]"
                />
                <select
                  value={destSelect}
                  onChange={(e) => setDestSelect(e.target.value)}
                  className="bg-white border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs text-[#0f2922] focus:outline-none focus:border-[#0f2922]"
                >
                  <option value="all">All Destinations</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#0f2922]">
                    Selected: {selectedMediaIds.size} of {items.length} available
                  </span>
                  {items.length > 0 && (
                    <>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={selectAllVisible}
                        className="text-[#0f2922] hover:underline font-semibold cursor-pointer"
                      >
                        Select All
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={deselectAll}
                        className="text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>

                {isAddingBatch && addProgress && (
                  <div className="text-[#e8622a] font-semibold flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5 text-[#e8622a]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Adding {addProgress.completed} of {addProgress.total}...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Image Grid with Checkboxes */}
            <div className="p-4 overflow-y-auto flex-1">
              {loading ? (
                <div className="py-12 text-center text-xs text-[#718096]">Loading available images...</div>
              ) : items.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#a0aec0]">
                  No available images found. All images matching filter are already in the gallery or none found.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {items.map((m) => {
                    const isSelected = selectedMediaIds.has(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleSelectAsset(m.id)}
                        className={`group relative rounded-xl border-2 overflow-hidden transition cursor-pointer flex flex-col select-none ${
                          isSelected
                            ? "border-[#e8622a] ring-2 ring-[#e8622a]/30 bg-[#fffaf8] shadow-md"
                            : "border-[#e2e8f0] hover:border-[#0f2922] bg-[#f7f8f5]"
                        }`}
                      >
                        <div className="aspect-square bg-gray-100 overflow-hidden relative">
                          <img
                            src={m.thumbnailUrl || m.url}
                            alt={m.label || ""}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded capitalize">
                            {m.category}
                          </span>

                          {/* Checkbox badge */}
                          <div className="absolute top-1.5 right-1.5">
                            {isSelected ? (
                              <div className="bg-[#e8622a] text-white p-1 rounded-full shadow-md">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-white/90 bg-black/30 shadow-xs flex items-center justify-center group-hover:border-white" />
                            )}
                          </div>
                        </div>

                        <div className="p-2 text-[11px] truncate font-medium text-[#0f2922] bg-white flex items-center justify-between">
                          <span className="truncate">{m.label || "Untitled"}</span>
                          {isSelected && <span className="text-[#e8622a] font-bold text-[10px] ml-1">✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with Bulk Add Button */}
            <div className="p-3.5 bg-[#f7f8f5] border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#718096] shrink-0">
              <span>{selectedMediaIds.size} images selected</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isAddingBatch}
                  className="px-4 py-2 border border-[#e2e8f0] text-[#718096] hover:bg-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSelectedFromLibrary}
                  disabled={selectedMediaIds.size === 0 || isAddingBatch}
                  className="bg-[#0f2922] hover:bg-[#1a4a39] disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-[#38d39f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>
                    {isAddingBatch
                      ? "Adding to Gallery..."
                      : selectedMediaIds.size > 0
                      ? `Add ${selectedMediaIds.size} Selected to Gallery`
                      : "Add to Gallery"}
                  </span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Upload Multiple New Media Tab */
          <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="flex border-b border-[#e2e8f0] bg-[#f7f8f5] rounded-lg overflow-hidden p-1 gap-1">
              <button
                type="button"
                onClick={() => setUploadType("file")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  uploadType === "file" ? "bg-white text-[#0f2922] shadow-2xs" : "text-[#718096]"
                }`}
              >
                Upload Files from Device
              </button>
              <button
                type="button"
                onClick={() => setUploadType("url")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                  uploadType === "url" ? "bg-white text-[#0f2922] shadow-2xs" : "text-[#718096]"
                }`}
              >
                External URL
              </button>
            </div>

            {uploadType === "file" ? (
              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922]">
                  Image Files <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      addUploadFiles(e.target.files);
                    }
                    e.target.value = "";
                  }}
                  className="hidden"
                />

                {/* Previews Grid with Individual Title Editing */}
                {previews.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#718096]">
                      <span>
                        {uploadFiles.length} file{uploadFiles.length > 1 ? "s" : ""} selected for public gallery (customize individual titles below)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadFiles([]);
                          setPreviews([]);
                          setUploadFileTitles([]);
                        }}
                        className="text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto p-2 border border-[#e2e8f0] rounded-xl bg-[#fafbfa]">
                      {previews.map((p, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border border-[#cbd5e1] bg-white p-1.5 flex flex-col justify-between group shadow-2xs">
                          <div className="relative aspect-video rounded overflow-hidden bg-gray-100">
                            <img src={p} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeUploadFileAtIndex(idx)}
                              className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-0.5 shadow transition cursor-pointer"
                              title="Remove file"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <input
                            type="text"
                            value={uploadFileTitles[idx] || ""}
                            onChange={(e) => updateUploadFileTitle(idx, e.target.value)}
                            placeholder="Public title..."
                            className="mt-1.5 w-full text-[10px] px-1.5 py-0.5 border border-[#e2e8f0] rounded focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                            title="Public title for this specific image"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      addUploadFiles(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition ${
                    isDragging
                      ? "border-[#e8622a] bg-[#fffaf8]"
                      : "border-[#cbd5e1] hover:border-[#0f2922] bg-[#f7f8f5]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#f0f9f4] text-[#0f2922] flex items-center justify-center mb-1.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-[#0f2922]">Click or drop multiple images here</p>
                  <p className="text-[10px] text-[#718096] mt-0.5">Select multiple PNG, JPG, WebP up to 10MB each</p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                  Image URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs bg-white text-[#0f2922] focus:outline-none focus:border-[#0f2922]"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922]">
                  {uploadFiles.length > 1 ? "Common Title / Base Prefix (Optional)" : "Public Title (Optional)"}
                </label>
                {uploadFiles.length > 1 && titleInput.trim() && (
                  <button
                    type="button"
                    onClick={handleApplyTitleToAll}
                    className="text-[11px] text-[#e8622a] hover:underline font-semibold cursor-pointer"
                  >
                    Apply to all files
                  </button>
                )}
              </div>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder={uploadFiles.length > 1 ? "e.g. Kedarnath Valley View (auto-numbers 1, 2, ...)" : "e.g. Kedarnath Valley View"}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs bg-white text-[#0f2922] focus:outline-none focus:border-[#0f2922]"
              />
              <p className="text-[11px] text-[#718096] mt-1">
                {uploadFiles.length > 1
                  ? "Applies this base title to all photos, or edit individual titles in the list above. Leave blank to keep original filenames."
                  : "Displayed as the title in the public gallery. Leave blank to keep filename."}
              </p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                Associate with Destination (Optional)
              </label>
              <select
                value={selectedDestId}
                onChange={(e) => setSelectedDestId(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs bg-white text-[#0f2922] focus:outline-none focus:border-[#0f2922] cursor-pointer"
              >
                <option value="">None / Pure Gallery Photo</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#718096] mt-1">
                Selected destination will be associated with all images in this upload batch.
              </p>
            </div>

            <div className="bg-[#f0f9f4] border border-[#bbf7d0] rounded-lg p-2.5 text-[11px] text-[#0f2922] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#38d39f] shrink-0" />
              <span>These media assets will belong to <strong>Public Gallery</strong> and display immediately on the public website.</span>
            </div>

            {/* Upload progress */}
            {isUploading && uploadProgress && (
              <div className="p-3 bg-[#f0f9f4] border border-[#bbf7d0] rounded-xl flex items-center gap-2.5 text-xs text-[#0f2922]">
                <svg className="animate-spin h-4 w-4 text-[#e8622a] shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Uploading and adding {uploadProgress.completed} of {uploadProgress.total} images to Gallery...</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 border border-[#e2e8f0] text-[#718096] hover:bg-[#f7f8f5] rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadType === "file" ? uploadFiles.length === 0 || isUploading : !externalUrl.trim() || isUploading}
                className="bg-[#0f2922] hover:bg-[#1a4a39] text-white px-5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isUploading
                  ? "Uploading..."
                  : uploadType === "file" && uploadFiles.length > 1
                  ? `Upload & Add ${uploadFiles.length} Images`
                  : "Upload & Add to Gallery"}
              </button>
            </div>
          </form>
        )}
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
  const [addExistingModalOpen, setAddExistingModalOpen] = useState(false);

  // Inspector & detail drawer state
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [assetRefs, setAssetRefs] = useState<MediaReferenceInfo | null>(null);
  const [loadingRefs, setLoadingRefs] = useState(false);

  // Gallery settings editing state
  const [galleryOrderInput, setGalleryOrderInput] = useState<number>(1);
  const [galleryTitleInput, setGalleryTitleInput] = useState<string>("");
  const [galleryCaptionInput, setGalleryCaptionInput] = useState<string>("");
  const [isTogglingGallery, setIsTogglingGallery] = useState(false);
  const [isSavingGallerySettings, setIsSavingGallerySettings] = useState(false);
  const [isEditingGalleryDetails, setIsEditingGalleryDetails] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Total items currently in public gallery
  const galleryItemsCount = useMemo(
    () => mediaList.filter((m) => m.inGallery).length,
    [mediaList]
  );

  // Delete modal state
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const loadMedia = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await mediaApi.list({
        category: catFilter !== "all" ? catFilter : undefined,
        destinationId: destFilter !== "all" ? destFilter : undefined,
        search: search.trim() || undefined,
        limit: 100
      });
      const freshList = Array.isArray(res.media) ? res.media : [];
      setMediaList(freshList);
      setSelectedAsset((prev) => (prev ? freshList.find((m) => m.id === prev.id) || prev : null));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load media assets";
      showToast(msg, "error");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMedia(false);
  }, [catFilter, destFilter, search]);

  // Load references & initialize gallery fields when an asset is inspected
  const handleInspectAsset = async (asset: MediaAsset) => {
    setSelectedAsset(asset);
    setIsEditingGalleryDetails(false);
    setGalleryOrderInput(asset.gallerySortOrder ?? 1);
    setGalleryTitleInput(asset.galleryCustomTitle ?? "");
    setGalleryCaptionInput(asset.galleryCaption ?? "");
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

  const handleToggleGalleryMembership = async () => {
    if (!selectedAsset) return;
    setIsTogglingGallery(true);
    try {
      if (selectedAsset.inGallery) {
        await galleryApi.remove(selectedAsset.galleryItemId || selectedAsset.id);
        showToast("Removed from Public Gallery.", "success");
        const updated: MediaAsset = {
          ...selectedAsset,
          inGallery: false,
          galleryItemId: null,
          gallerySortOrder: null,
          galleryCustomTitle: null,
          galleryCaption: null
        };
        setSelectedAsset(updated);
        setIsEditingGalleryDetails(false);
        if (catFilter === "gallery") {
          setMediaList((prev) => prev.filter((m) => m.id !== updated.id));
        } else {
          setMediaList((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
        void loadMedia(true);
        const refs = await mediaApi.getReferences(updated.id);
        setAssetRefs(refs);
      } else {
        const maxOrder = mediaList.reduce((max, m) => Math.max(max, m.gallerySortOrder || 0), 0);
        const added = await galleryApi.add({
          mediaId: selectedAsset.id,
          sortOrder: maxOrder + 1,
          customTitle: galleryTitleInput.trim() || undefined
        });
        showToast("Added to Public Gallery.", "success");
        const updated: MediaAsset = {
          ...selectedAsset,
          inGallery: true,
          galleryItemId: added.id,
          gallerySortOrder: added.sortOrder,
          galleryCustomTitle: added.customTitle,
          galleryCaption: added.caption
        };
        setSelectedAsset(updated);
        setIsEditingGalleryDetails(false);
        setMediaList((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        void loadMedia(true);
        const refs = await mediaApi.getReferences(updated.id);
        setAssetRefs(refs);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle gallery membership";
      showToast(msg, "error");
    } finally {
      setIsTogglingGallery(false);
    }
  };

  const handleSaveGallerySettings = async () => {
    if (!selectedAsset || !selectedAsset.inGallery) return;
    setIsSavingGallerySettings(true);
    try {
      const targetPos = Math.max(1, Math.min(Number(galleryOrderInput) || 1, Math.max(1, galleryItemsCount)));
      await galleryApi.update(selectedAsset.galleryItemId || selectedAsset.id, {
        sortOrder: targetPos,
        customTitle: galleryTitleInput.trim() || null
      });
      showToast("Gallery settings updated successfully.", "success");
      setIsEditingGalleryDetails(false);
      // Silently update media list in-place without unmounting or shifting UI
      await loadMedia(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update gallery settings";
      showToast(msg, "error");
    } finally {
      setIsSavingGallerySettings(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;
    setIsDeleting(true);
    try {
      const deletedId = selectedAsset.id;
      await mediaApi.delete(deletedId);
      showToast("Media asset deleted permanently from storage.", "success");
      setMediaList((prev) => prev.filter((m) => m.id !== deletedId));
      setSelectedAsset(null);
      setConfirmDeleteOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete media asset";
      showToast(msg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-6">
      {uploadModalOpen && (
        <SimpleUploadModal
          onClose={() => setUploadModalOpen(false)}
          onUploaded={() => {
            void loadMedia(true);
          }}
          initialDestinationId={destFilter}
          defaultInGallery={catFilter === "gallery"}
        />
      )}

      {addExistingModalOpen && (
        <AddToGalleryModal
          onClose={() => setAddExistingModalOpen(false)}
          onAdded={() => {
            void loadMedia(true);
          }}
        />
      )}

      {/* Public Gallery Lightbox Preview Modal */}
      {previewModalOpen && selectedAsset && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs"
          onClick={() => setPreviewModalOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#0a1813] text-white rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10 bg-[#0f2922]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38d39f]" />
                <span className="text-xs uppercase font-bold tracking-widest text-[#e8622a]">
                  Public Gallery Preview
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="text-white/70 hover:text-white p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] bg-black/90 flex items-center justify-center p-2">
              <img
                src={selectedAsset.viewerUrl || selectedAsset.mediumUrl || selectedAsset.url}
                alt={galleryTitleInput || selectedAsset.label || ""}
                decoding="async"
                className="max-h-[55vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="p-4 bg-[#0f2922] text-center">
              <h4 className="font-bold text-base text-white" style={{ fontFamily: "var(--font-serif, serif)" }}>
                {galleryTitleInput.trim() || selectedAsset.label || "Untitled Moment"}
              </h4>
            </div>
          </div>
        </div>,
        document.body
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
            Visual repository of all destination images, trip photos, review uploads, public gallery, and system media.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {catFilter === "gallery" ? (
            <button
              type="button"
              onClick={() => setAddExistingModalOpen(true)}
              className="bg-[#0f2922] hover:bg-[#1a4a39] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#38d39f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add to Public Gallery</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Upload Image</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
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
              className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                catFilter === tab.id
                  ? "bg-[#0f2922] text-white shadow-2xs"
                  : "bg-[#f7f8f5] text-[#4a5568] hover:bg-[#edf2f7]"
              }`}
            >
              {tab.id === "gallery" && (
                <span className={`w-1.5 h-1.5 rounded-full ${catFilter === tab.id ? "bg-[#38d39f]" : "bg-[#e8622a]"}`} />
              )}
              <span>{tab.label}</span>
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
              <p className="text-sm font-semibold text-[#4a5568]">
                {catFilter === "gallery" ? "No images currently in Public Gallery." : "No media assets found."}
              </p>
              <p className="text-xs">
                {catFilter === "gallery"
                  ? "Select existing images from the library or click 'Add From Library' above to show images on /gallery."
                  : "Click 'Upload Image' above to add images to the library."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    {/* Thumbnail with status tags */}
                    <div
                      className="aspect-[4/3] bg-[#f7f8f5] overflow-hidden relative bg-cover bg-center"
                      style={
                        img.placeholder
                          ? { backgroundImage: `url(${img.placeholder})` }
                          : undefined
                      }
                    >
                      <img
                        src={img.thumbnailUrl || img.url}
                        alt={img.label ?? ""}
                        loading="lazy"
                        decoding="async"
                        width={img.width || 400}
                        height={img.height || 300}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.opacity = "0.3";
                        }}
                      />

                      {/* Public Gallery Status Pill */}
                      {img.inGallery ? (
                        <span className="absolute top-2 left-2 bg-[#0f2922]/90 text-[#38d39f] border border-[#38d39f]/40 text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 backdrop-blur-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38d39f] animate-pulse" />
                          Public Gallery
                        </span>
                      ) : (
                        <span className="absolute top-2 left-2 bg-black/45 text-white/70 text-[9px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded backdrop-blur-xs">
                          Not in Gallery
                        </span>
                      )}

                      {/* Original Category Tag */}
                      <span className="absolute top-2 right-2 bg-black/60 text-white text-[9px] font-medium capitalize px-1.5 py-0.5 rounded backdrop-blur-xs">
                        {img.category}
                      </span>

                      {/* Gallery Display Order Badge */}
                      {img.inGallery && (
                        <span className="absolute bottom-2 left-2 bg-[#0f2922]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#38d39f]/40 backdrop-blur-xs flex items-center gap-1 shadow-xs">
                          <span className="text-[#38d39f]">Order #</span>
                          {img.gallerySortOrder ?? 1}
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-3 text-xs flex-1 flex flex-col justify-between">
                      <div>
                        <p className="font-semibold text-[#0f2922] truncate text-[11px]" title={img.label || img.url}>
                          {img.label || "Untitled Image"}
                        </p>
                        {img.inGallery && img.galleryCustomTitle && (
                          <p className="text-[10px] text-[#e8622a] font-medium truncate mt-0.5" title={img.galleryCustomTitle}>
                            Title: {img.galleryCustomTitle}
                          </p>
                        )}
                      </div>

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
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-2xs p-5 space-y-4 sticky top-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
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
                  src={selectedAsset.viewerUrl || selectedAsset.mediumUrl || selectedAsset.url}
                  alt={selectedAsset.label ?? ""}
                  decoding="async"
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

              {/* Public Gallery Membership & Customization Controls */}
              <div className="bg-[#f0f9f4] p-3.5 rounded-xl border border-[#bbf7d0] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#0f2922] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${selectedAsset.inGallery ? "bg-[#38d39f]" : "bg-gray-400"}`} />
                      <span>Show in Public Gallery</span>
                    </div>
                    <div className="text-[10px] text-[#4a5568] mt-0.5">
                      {selectedAsset.inGallery
                        ? "Active on website's /gallery page"
                        : "Hidden from public website gallery"}
                    </div>
                  </div>
                  {/* Toggle Button */}
                  <button
                    type="button"
                    disabled={isTogglingGallery}
                    onClick={handleToggleGalleryMembership}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      selectedAsset.inGallery ? "bg-[#e8622a]" : "bg-[#cbd5e1]"
                    }`}
                    role="switch"
                    aria-checked={Boolean(selectedAsset.inGallery)}
                    title={selectedAsset.inGallery ? "Remove from Public Gallery" : "Include in Public Gallery"}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        selectedAsset.inGallery ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Gallery Customization Details when active */}
                {selectedAsset.inGallery && (
                  <div className="pt-2 border-t border-[#bbf7d0]/70 space-y-2 text-xs">
                    {!isEditingGalleryDetails ? (
                      /* Default View Mode: Clean summary without inputs or save buttons */
                      <div className="space-y-2">
                        <div className="bg-white/90 rounded-lg p-2.5 border border-[#bbf7d0] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-[#718096]">Public Title</span>
                            <span className="font-semibold text-xs text-[#0f2922] truncate max-w-[150px]" title={selectedAsset.galleryCustomTitle || selectedAsset.label || "Default Title"}>
                              {selectedAsset.galleryCustomTitle || selectedAsset.label || "Default Title"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-[#718096]">Display Position</span>
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#0f2922] text-[#38d39f]">
                                #{selectedAsset.gallerySortOrder ?? 1}
                              </span>
                              <span className="text-[10px] text-[#718096]">(Higher = Top)</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setGalleryOrderInput(selectedAsset.gallerySortOrder ?? 1);
                              setGalleryTitleInput(selectedAsset.galleryCustomTitle ?? "");
                              setIsEditingGalleryDetails(true);
                            }}
                            className="flex-1 bg-[#0f2922] hover:bg-[#1a4a39] text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>Edit Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewModalOpen(true)}
                            className="bg-white hover:bg-[#f7f8f5] border border-[#cbd5e1] text-[#0f2922] text-xs font-semibold py-1.5 px-3 rounded-lg transition cursor-pointer"
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Active Edit Mode: Inputs with Save Changes & Cancel */
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[#0f2922] mb-0.5">
                            Public Title (Optional Override)
                          </label>
                          <input
                            type="text"
                            value={galleryTitleInput}
                            onChange={(e) => setGalleryTitleInput(e.target.value)}
                            placeholder={selectedAsset.label || "Mountain Sunrise"}
                            className="w-full bg-white border border-[#cbd5e1] rounded-lg px-2.5 py-1 text-xs text-[#0f2922] focus:outline-none focus:border-[#0f2922]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[#0f2922] mb-1">
                            Gallery Display Position (Order #)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max={Math.max(1, galleryItemsCount)}
                              value={galleryOrderInput}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") return;
                                const parsed = parseInt(raw, 10);
                                if (isNaN(parsed)) return;
                                const maxAllowed = Math.max(1, galleryItemsCount);
                                setGalleryOrderInput(Math.max(1, Math.min(parsed, maxAllowed)));
                              }}
                              onBlur={() => {
                                const maxAllowed = Math.max(1, galleryItemsCount);
                                setGalleryOrderInput((prev) => Math.max(1, Math.min(prev || 1, maxAllowed)));
                              }}
                              className="w-24 bg-white border border-[#cbd5e1] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0f2922] focus:outline-none focus:border-[#0f2922] shadow-2xs"
                            />
                            <span className="text-[10px] text-[#718096]">
                              1 to {galleryItemsCount} (Higher number = displays above / on top)
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleSaveGallerySettings}
                            disabled={isSavingGallerySettings}
                            className="flex-1 bg-[#0f2922] hover:bg-[#1a4a39] text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition cursor-pointer disabled:opacity-50"
                          >
                            {isSavingGallerySettings ? "Saving..." : "Save Changes"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingGalleryDetails(false)}
                            className="bg-white hover:bg-[#f7f8f5] border border-[#cbd5e1] text-[#718096] text-xs font-semibold py-1.5 px-3 rounded-lg transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
                    <span className="text-[#718096]">Original Category:</span>
                    <span className="capitalize font-semibold text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#e2e8f0] text-[#0f2922]">
                      {selectedAsset.category}
                    </span>
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
                    Not currently linked as cover, gallery, or slide.
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
                        const inGalleryRef = assetRefs.references.some((r) => r.entityType === "gallery");
                        const msg = inGalleryRef
                          ? `Cannot delete: this image is currently in use by ${assetRefs.totalReferences} active entity (including Public Gallery). Remove it from the Gallery first.`
                          : `Cannot delete: this image is currently in use by ${assetRefs.totalReferences} active entity.`;
                        showToast(msg, "error");
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
                Click on any image card to inspect details, manage Public Gallery membership, or copy its URL.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
