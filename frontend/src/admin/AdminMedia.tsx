import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { mediaApi, type MediaAsset, type MediaReferenceInfo } from "@/api/media";
import { useApp } from "@/context/AppContext";

const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "destinations", label: "Destinations" },
  { id: "trips", label: "Trips" },
  { id: "completed_trips", label: "Completed Trips" },
  { id: "homepage", label: "Homepage" },
  { id: "general", label: "General" },
];

interface UploadModalProps {
  onClose: () => void;
  onUploaded: (asset: MediaAsset) => void;
}

function UploadModal({ onClose, onUploaded }: UploadModalProps) {
  const { showToast } = useApp();
  const [tab, setTab] = useState<"file" | "url">("file");

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [altText, setAltText] = useState("");
  const [category, setCategory] = useState("general");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL upload state
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
      const asset = await mediaApi.upload(file, {
        category,
        label: label.trim() || file.name,
        altText: altText.trim() || undefined
      });
      showToast("File uploaded to storage successfully.", "success");
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
      const asset = await mediaApi.createExternal({
        url: url.trim(),
        label: label.trim() || undefined,
        altText: altText.trim() || undefined,
        category
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
            e.stopPropagation();
          }
        }}
      >
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-serif, serif)" }}>
            Add Media Asset
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="text-[#a3bfb5] hover:text-white transition"
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setTab("file");
            }}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 -mb-px transition ${
              tab === "file" ? "border-[#e8622a] text-[#0f2922] bg-white" : "border-transparent text-[#718096]"
            }`}
          >
            Upload File to Storage
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setTab("url");
            }}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 -mb-px transition ${
              tab === "url" ? "border-[#e8622a] text-[#0f2922] bg-white" : "border-transparent text-[#718096]"
            }`}
          >
            Register External URL
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {tab === "file" ? (
            <div>
              <label className="block text-xs font-semibold text-[#0f2922] mb-1">Image File *</label>
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
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition select-none ${
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

                {preview ? (
                  <div className="space-y-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <img src={preview} alt="Preview" className="w-28 h-28 object-cover rounded-lg mx-auto shadow-sm" />
                    <p className="text-xs font-medium text-[#0f2922]">{file?.name}</p>
                    <p className="text-[11px] text-[#718096]">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="text-xs text-[#e8622a] hover:underline font-medium"
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-[#a0aec0] mb-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs font-semibold text-[#0f2922] pointer-events-none">Click or drag &amp; drop an image</p>
                    <p className="text-[11px] text-[#718096] pointer-events-none">JPEG, PNG, WEBP up to 10MB</p>
                  </>
                )}
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">External Image URL *</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUrlUpload();
                  }
                }}
              />
              {url && (
                <div className="mt-2 w-full h-32 rounded-lg overflow-hidden border border-[#e2e8f0] bg-[#f7f8f5]">
                  <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Label (optional)</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Chopta Valley sunset"
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Alt Text (optional)</label>
            <input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="e.g. View of snow peaks from Tungnath"
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]"
            >
              <option value="destinations">Destinations</option>
              <option value="trips">Trips</option>
              <option value="completed_trips">Completed Trips</option>
              <option value="homepage">Homepage</option>
              <option value="general">General</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              disabled={isUploading}
              className="flex-1 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium py-2.5 rounded-lg hover:bg-[#f7f8f5] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={tab === "file" ? handleFileUpload : handleUrlUpload}
              disabled={tab === "file" ? !file || isUploading : !url.trim() || isUploading}
              className="flex-1 bg-[#e8622a] hover:bg-[#d4541f] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                "Save Asset"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminMedia() {
  const { showToast } = useApp();
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [catFilter, setCatFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [deleteRefInfo, setDeleteRefInfo] = useState<MediaReferenceInfo | null>(null);
  const [isCheckingRefs, setIsCheckingRefs] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const res = await mediaApi.list({
        category: catFilter !== "all" ? catFilter : undefined,
        search: search.trim() || undefined
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
  }, [catFilter, search]);

  const initiateDelete = async (asset: MediaAsset) => {
    setDeleteTarget(asset);
    setIsCheckingRefs(true);
    try {
      const refs = await mediaApi.getReferences(asset.id);
      setDeleteRefInfo(refs);
    } catch {
      setDeleteRefInfo({ totalReferences: 0, references: [] });
    } finally {
      setIsCheckingRefs(false);
    }
  };

  const handleConfirmDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await mediaApi.delete(deleteTarget.id);
      showToast("Media asset deleted permanently from storage.", "success");
      setDeleteTarget(null);
      setDeleteRefInfo(null);
      await loadMedia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete media asset";
      showToast(msg, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {uploadModalOpen && (
        <UploadModal
          onClose={() => setUploadModalOpen(false)}
          onUploaded={() => {
            void loadMedia();
          }}
        />
      )}

      {/* Delete / Reference Dialog (Portaled to document.body) */}
      {deleteTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => {
              e.stopPropagation();
              if (!isDeleting) setDeleteTarget(null);
            }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-lg text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                {deleteRefInfo && deleteRefInfo.totalReferences > 0 ? "Cannot Delete Media Asset" : "Delete Media Asset"}
              </h3>

              {isCheckingRefs ? (
                <p className="text-sm text-[#718096]">Checking active entity references...</p>
              ) : deleteRefInfo && deleteRefInfo.totalReferences > 0 ? (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 leading-relaxed">
                    <p className="font-semibold mb-1">
                      This asset is currently in use by {deleteRefInfo.totalReferences} active entity / entities:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {deleteRefInfo.references.map((r, i) => (
                        <li key={i}>
                          <span className="capitalize font-medium">{r.entityType}</span>: {r.entityName || r.entityId} ({r.relationship})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-[#718096]">
                    To prevent breaking active trips or destinations, you must remove or replace this image on those items before it can be deleted from storage.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTarget(null);
                    }}
                    className="w-full bg-[#0f2922] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-[#1a3f35] transition"
                  >
                    Understood
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[#4a5568]">
                    Are you sure you want to permanently delete <strong>{deleteTarget.label || deleteTarget.id}</strong>?
                  </p>
                  {deleteTarget.storageKey && (
                    <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                      This will permanently remove the file object from the Neon S3 storage bucket.
                    </p>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget(null);
                      }}
                      className="flex-1 border border-[#e2e8f0] text-sm text-[#4a5568] py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleConfirmDelete}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-lg transition disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Permanently Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            Media Library
          </h2>
          <p className="text-[#718096] text-sm mt-0.5">{mediaList.length} media assets registered</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setUploadModalOpen(true);
          }}
          className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload Asset
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center justify-between bg-white p-3 rounded-xl border border-[#e2e8f0]">
        <div className="flex gap-1 bg-[#f7f8f5] rounded-lg p-1 flex-wrap">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCatFilter(t.id);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                catFilter === t.id ? "bg-white text-[#0f2922] shadow-sm" : "text-[#718096] hover:text-[#0f2922]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by label or URL..."
            className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm w-60 focus:outline-none focus:border-[#0f2922]"
          />
        </div>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-[#a0aec0] text-sm">Loading media assets...</div>
      ) : mediaList.length === 0 ? (
        <div className="text-center py-20 text-[#a0aec0] text-sm bg-white rounded-2xl border border-dashed border-[#cbd5e1]">
          No media assets found.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mediaList.map((item) => (
            <div
              key={item.id}
              className="relative bg-white rounded-xl border border-[#e2e8f0] hover:border-[#0f2922] overflow-hidden group transition flex flex-col justify-between shadow-sm"
            >
              <div className="relative aspect-square bg-[#f8faf9]">
                <img
                  src={item.url}
                  alt={item.label ?? ""}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=100&h=100&fit=crop";
                  }}
                />
                {item.storageKey && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-semibold bg-emerald-800/80 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                    S3 Storage
                  </span>
                )}
                {item.externalUrl && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-semibold bg-blue-800/80 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                    External
                  </span>
                )}
              </div>

              <div className="p-2.5">
                <p className="text-xs font-semibold text-[#0f2922] truncate" title={item.label ?? "Untitled"}>
                  {item.label ?? "Untitled"}
                </p>
                <p className="text-[10px] text-[#718096] capitalize mt-0.5">{item.category}</p>

                <div className="flex gap-1.5 mt-2.5 pt-2 border-t border-[#edf2f7]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(item.url).catch(() => {});
                      }
                      showToast("URL copied to clipboard!", "success");
                    }}
                    className="flex-1 bg-[#f0f9f4] hover:bg-[#e0f2e9] text-[#0f2922] text-[11px] font-semibold py-1 rounded transition text-center"
                  >
                    Copy URL
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      initiateDelete(item);
                    }}
                    className="border border-red-200 hover:bg-red-50 text-red-600 text-[11px] font-semibold px-2 py-1 rounded transition"
                    title="Delete media asset"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
