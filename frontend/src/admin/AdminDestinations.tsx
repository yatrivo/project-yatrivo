import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Destination, UTTARAKHAND_EXPERIENCE_TAGS } from "@/data/destinations";
import { destinationsApi } from "@/api/destinations";
import MediaPicker from "@/components/MediaPicker";
import { clientCache } from "@/utils/clientCache";

export interface DestFormData {
  name: string;
  tagline: string;
  description: string;
  category: "high-altitude" | "spiritual" | "weekend";
  experienceTags: string[];
  season: string;
  bestTime: string;
  elevation: string;
  image: string;
  coverMediaId?: string | null;
  gallery: string[];
  galleryMediaIds?: string[];
  highlights: string[];
  activities: string[];
}

export const EMPTY_FORM: DestFormData = {
  name: "",
  tagline: "",
  description: "",
  category: "weekend",
  experienceTags: [],
  season: "",
  bestTime: "",
  elevation: "",
  image: "",
  coverMediaId: null,
  gallery: [],
  galleryMediaIds: [],
  highlights: [],
  activities: [],
};

export function destToForm(d: Destination): DestFormData {
  return {
    name: d.name,
    tagline: d.tagline || "",
    description: d.description || "",
    category: (d.category as DestFormData["category"]) || "weekend",
    experienceTags: d.experienceTags ? [...d.experienceTags] : [],
    season: d.season || "",
    bestTime: d.bestTime || "",
    elevation: d.elevation ?? "",
    image: d.image || "",
    coverMediaId: d.coverMediaId || null,
    gallery: d.gallery ?? [],
    galleryMediaIds: d.galleryMedia?.map((m) => m.mediaId) || [],
    highlights: d.highlights ?? [],
    activities: d.activities ?? [],
  };
}

export function DestinationModal({
  initial,
  title,
  onClose,
  onSave,
  isSaving,
}: {
  initial: DestFormData;
  title: string;
  onClose: () => void;
  onSave: (form: DestFormData) => Promise<void>;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<DestFormData>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [newGallery, setNewGallery] = useState("");
  const [newHighlight, setNewHighlight] = useState("");
  const [newActivity, setNewActivity] = useState("");

  const set = <K extends keyof DestFormData>(field: K, value: DestFormData[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!form.name.trim()) errs.push("Name is required.");
    if (!form.image.trim()) errs.push("Main image URL is required.");
    setErrors(errs);
    if (errs.length > 0) return;
    await onSave(form);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={isSaving ? undefined : onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]"
      >
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-white font-semibold" style={{ fontFamily: "var(--font-serif, serif)" }}>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-[#a3bfb5] hover:text-white transition disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0 p-6 space-y-4">
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-red-600 text-sm space-y-1">
                {errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#4a5568] mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Chopta Valley"
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Tagline</label>
              <input
                value={form.tagline}
                onChange={(e) => set("tagline", e.target.value)}
                placeholder="e.g. Alpine meadows & dense forest"
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                placeholder="Brief summary of the destination..."
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Elevation</label>
              <input
                value={form.elevation}
                onChange={(e) => set("elevation", e.target.value)}
                placeholder="e.g. 2,680 m"
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Season</label>
              <input
                value={form.season}
                onChange={(e) => set("season", e.target.value)}
                placeholder="e.g. Oct – Mar"
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Best Time</label>
              <input
                value={form.bestTime}
                onChange={(e) => set("bestTime", e.target.value)}
                placeholder="e.g. November"
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              />
            </div>

            {/* Uttarakhand Travel-Interest Tags */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#4a5568] mb-1">
                Travel Interest / Experience Tags
              </label>
              <p className="text-xs text-[#718096] mb-2">
                Select Uttarakhand travel interests that describe this destination.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {UTTARAKHAND_EXPERIENCE_TAGS.map((tag) => {
                  const isSelected = form.experienceTags?.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const current = form.experienceTags || [];
                        const next = isSelected
                          ? current.filter((t) => t !== tag)
                          : [...current, tag];
                        set("experienceTags", next);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${
                        isSelected
                          ? "bg-[#0f2922] text-white border-[#0f2922] font-medium shadow-xs"
                          : "border-[#e2e8f0] text-[#4a5568] hover:border-[#0f2922] bg-[#f7f8f5]"
                      }`}
                    >
                      {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <MediaPicker
            label="Main Image *"
            value={form.image}
            mediaId={form.coverMediaId}
            onChange={(url, id) => {
              set("image", url);
              if (id) set("coverMediaId", id);
            }}
            context={{
              destinationId: form.id,
              destinationSlug: form.slug,
              destinationName: form.name,
              category: "destinations"
            }}
          />

          {/* Gallery */}
          <div>
            <label className="block text-sm font-medium text-[#4a5568] mb-2">Gallery Images (max 4)</label>
            <div className="space-y-2">
              {form.gallery.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <MediaPicker
                    value={url}
                    mediaId={form.galleryMediaIds?.[i]}
                    onChange={(newUrl, newId) => {
                      const g = [...form.gallery];
                      g[i] = newUrl;
                      set("gallery", g);
                      if (newId) {
                        const gm = [...(form.galleryMediaIds || [])];
                        gm[i] = newId;
                        set("galleryMediaIds", gm);
                      }
                    }}
                    className="flex-1"
                    context={{
                      destinationId: form.id,
                      destinationSlug: form.slug,
                      destinationName: form.name,
                      category: "destinations"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      set("gallery", form.gallery.filter((_, j) => j !== i));
                      if (form.galleryMediaIds) {
                        set("galleryMediaIds", form.galleryMediaIds.filter((_, j) => j !== i));
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs px-2 shrink-0"
                    title="Remove image from destination (retained in media library)"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {form.gallery.length < 4 && (
                <div>
                  <MediaPicker
                    value={newGallery}
                    onChange={(url, newId) => {
                      if (url) {
                        set("gallery", [...form.gallery, url]);
                        if (newId) {
                          set("galleryMediaIds", [...(form.galleryMediaIds || []), newId]);
                        }
                        setNewGallery("");
                      }
                    }}
                    label="Add gallery image"
                    context={{
                      destinationId: form.id,
                      destinationSlug: form.slug,
                      destinationName: form.name,
                      category: "destinations"
                    }}
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
                <span key={i} className="bg-[#f0f9f4] text-[#0f2922] text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-[#c3dfd3]">
                  {h}
                  <button
                    type="button"
                    onClick={() => set("highlights", form.highlights.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                placeholder="Add highlight and press Enter..."
                className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newHighlight.trim()) {
                      set("highlights", [...form.highlights, newHighlight.trim()]);
                      setNewHighlight("");
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newHighlight.trim()) {
                    set("highlights", [...form.highlights, newHighlight.trim()]);
                    setNewHighlight("");
                  }
                }}
                className="bg-[#0f2922] text-white text-xs px-3 rounded-lg hover:bg-[#1a3f35] transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Activities */}
          <div>
            <label className="block text-sm font-medium text-[#4a5568] mb-2">Activities</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.activities.map((a, i) => (
                <span key={i} className="bg-[#fff3ee] text-[#e8622a] text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-[#ffd5c2]">
                  {a}
                  <button
                    type="button"
                    onClick={() => set("activities", form.activities.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="e.g. Trekking, Stargazing..."
                className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newActivity.trim()) {
                      set("activities", [...form.activities, newActivity.trim()]);
                      setNewActivity("");
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newActivity.trim()) {
                    set("activities", [...form.activities, newActivity.trim()]);
                    setNewActivity("");
                  }
                }}
                className="bg-[#0f2922] text-white text-xs px-3 rounded-lg hover:bg-[#1a3f35] transition"
              >
                Add
              </button>
            </div>
          </div>

          </div>

          {/* Sticky Pinned Footer - ALWAYS VISIBLE */}
          <div className="bg-[#f7f8f5] px-6 py-3.5 border-t border-[#e2e8f0] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-5 py-2.5 border border-[#e2e8f0] text-[#4a5568] text-sm font-semibold rounded-lg hover:bg-white transition disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Destination"
              )}
            </button>
          </div>
        </form>
      </div>,
    document.body
  );
}

/**
 * Confirmation modal for Archive and Unarchive actions
 */
function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmVariant = "danger",
  isSubmitting,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "success";
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={isSubmitting ? undefined : onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6 space-y-4 border border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              confirmVariant === "danger" ? "bg-amber-100 text-amber-600" : "bg-green-100 text-[#0f2922]"
            }`}
          >
            {confirmVariant === "danger" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
              {title}
            </h3>
          </div>
        </div>

        <p className="text-[#4a5568] text-sm leading-relaxed">{message}</p>

        <div className="flex gap-3 pt-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="flex-1 border border-[#e2e8f0] text-[#4a5568] text-sm font-semibold py-2.5 rounded-lg hover:bg-[#f7f8f5] transition disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className={`flex-1 text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              confirmVariant === "danger"
                ? "bg-[#e8622a] hover:bg-[#d4541f]"
                : "bg-[#0f2922] hover:bg-[#1a3f35]"
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminDestinations() {
  const navigate = useNavigate();
  const { destinations, refreshDestinations, showToast } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingDest, setEditingDest] = useState<Destination | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Archive confirmation dialog state
  const [archiveTarget, setArchiveTarget] = useState<Destination | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Unarchive confirmation dialog state
  const [unarchiveTarget, setUnarchiveTarget] = useState<Destination | null>(null);
  const [isUnarchiving, setIsUnarchiving] = useState(false);

  // Sort and filter destinations:
  // Archived destinations ALWAYS appear at the bottom!
  const sortedAndFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return destinations
      .filter((d) => {
        const matchesSearch =
          !q ||
          d.name.toLowerCase().includes(q) ||
          (d.tagline && d.tagline.toLowerCase().includes(q)) ||
          (d.description && d.description.toLowerCase().includes(q));

        const isArchived = d.status === "archived";
        let matchesStatus = true;
        if (statusFilter === "active") matchesStatus = !isArchived;
        if (statusFilter === "archived") matchesStatus = isArchived;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aArchived = a.status === "archived" ? 1 : 0;
        const bArchived = b.status === "archived" ? 1 : 0;
        if (aArchived !== bArchived) {
          return aArchived - bArchived; // Active (0) first, Archived (1) at the bottom
        }
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
  }, [destinations, search, statusFilter]);

  const activeCount = useMemo(
    () => destinations.filter((d) => d.status !== "archived").length,
    [destinations]
  );
  const archivedCount = useMemo(
    () => destinations.filter((d) => d.status === "archived").length,
    [destinations]
  );

  const handleCreate = async (form: DestFormData) => {
    setIsSaving(true);
    try {
      const created = await destinationsApi.create({
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        category: form.category || "weekend",
        season: form.season,
        bestTime: form.bestTime,
        elevation: form.elevation || undefined,
        image: form.image,
        coverMediaId: form.coverMediaId || undefined,
        gallery: form.gallery,
        galleryMediaIds: form.galleryMediaIds && form.galleryMediaIds.length > 0 ? form.galleryMediaIds : undefined,
        highlights: form.highlights,
        activities: form.activities,
        experienceTags: form.experienceTags,
      });

      clientCache.invalidate("destinations:active");
      clientCache.invalidate("homepage:content");
      await refreshDestinations({ bypassCache: true });
      setModalMode(null);
      showToast(`${created.name} added successfully.`, "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create destination";
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (form: DestFormData) => {
    if (!editingDest) return;
    setIsSaving(true);
    try {
      const updated = await destinationsApi.update(editingDest.id, {
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        category: form.category || "weekend",
        season: form.season,
        bestTime: form.bestTime,
        elevation: form.elevation || undefined,
        image: form.image,
        coverMediaId: form.coverMediaId,
        gallery: form.gallery,
        galleryMediaIds: form.galleryMediaIds,
        highlights: form.highlights,
        activities: form.activities,
        experienceTags: form.experienceTags,
      });

      clientCache.invalidate("destinations:active");
      clientCache.invalidate("homepage:content");
      await refreshDestinations({ bypassCache: true });
      setModalMode(null);
      setEditingDest(null);
      showToast(`${updated.name} updated successfully.`, "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update destination";
      showToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      await destinationsApi.archive(archiveTarget.id);
      clientCache.invalidate("destinations:active");
      clientCache.invalidate("homepage:content");
      await refreshDestinations({ bypassCache: true });
      showToast(`${archiveTarget.name} has been archived.`, "info");
      setArchiveTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to archive destination";
      showToast(message, "error");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleConfirmUnarchive = async () => {
    if (!unarchiveTarget) return;
    setIsUnarchiving(true);
    try {
      await destinationsApi.unarchive(unarchiveTarget.id);
      clientCache.invalidate("destinations:active");
      clientCache.invalidate("homepage:content");
      await refreshDestinations({ bypassCache: true });
      showToast(`${unarchiveTarget.name} restored to active.`, "success");
      setUnarchiveTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to restore destination";
      showToast(message, "error");
    } finally {
      setIsUnarchiving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {modalMode === "add" && (
        <DestinationModal
          title="Add Destination"
          initial={EMPTY_FORM}
          isSaving={isSaving}
          onClose={() => setModalMode(null)}
          onSave={handleCreate}
        />
      )}

      {modalMode === "edit" && editingDest && (
        <DestinationModal
          title={`Edit — ${editingDest.name}`}
          initial={destToForm(editingDest)}
          isSaving={isSaving}
          onClose={() => {
            setModalMode(null);
            setEditingDest(null);
          }}
          onSave={handleUpdate}
        />
      )}

      {/* Archive confirmation dialog */}
      <ConfirmModal
        isOpen={Boolean(archiveTarget)}
        title="Archive Destination"
        message="Are you sure you want to archive this destination? It will no longer be available for new trips/packages, but existing records will be preserved."
        confirmLabel="Archive Destination"
        confirmVariant="danger"
        isSubmitting={isArchiving}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />

      {/* Unarchive confirmation dialog */}
      <ConfirmModal
        isOpen={Boolean(unarchiveTarget)}
        title="Restore Destination"
        message="Are you sure you want to restore this destination?"
        confirmLabel="Restore Destination"
        confirmVariant="success"
        isSubmitting={isUnarchiving}
        onConfirm={handleConfirmUnarchive}
        onCancel={() => setUnarchiveTarget(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            Destinations
          </h2>
          <div className="flex items-center gap-3 text-sm text-[#718096] mt-1">
            <span>{destinations.length} total</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">{activeCount} active</span>
            {archivedCount > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-700 font-medium">{archivedCount} archived</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => setModalMode("add")}
          className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-sm flex items-center justify-center gap-1.5 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Destination
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-3 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destinations..."
              className="w-full pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#0f2922]"
            />
          </div>
        </div>

        {/* Status quick tabs */}
        <div className="flex bg-[#f7f8f5] p-1 rounded-lg border border-[#e2e8f0] text-xs font-medium">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-md transition ${
              statusFilter === "all" ? "bg-white text-[#0f2922] shadow-sm font-semibold" : "text-[#718096] hover:text-[#0f2922]"
            }`}
          >
            All ({destinations.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-md transition ${
              statusFilter === "active" ? "bg-white text-emerald-800 shadow-sm font-semibold" : "text-[#718096] hover:text-[#0f2922]"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter("archived")}
            className={`px-3 py-1.5 rounded-md transition ${
              statusFilter === "archived" ? "bg-white text-amber-800 shadow-sm font-semibold" : "text-[#718096] hover:text-[#0f2922]"
            }`}
          >
            Archived ({archivedCount})
          </button>
        </div>
      </div>

      {/* Destinations Grid */}
      {sortedAndFiltered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#cbd5e1] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#f0f9f4] text-[#0f2922] mx-auto flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">No destinations found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {search || tagFilter !== "All" || statusFilter !== "all"
              ? "Try adjusting your filters or search keywords."
              : "Get started by adding your first destination."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sortedAndFiltered.map((dest) => {
            const isArchived = dest.status === "archived";

            return (
              <div
                key={dest.id}
                onClick={() => navigate(`/admin/destinations/${dest.slug || dest.id}`)}
                className={`rounded-xl border shadow-sm overflow-hidden flex flex-col transition cursor-pointer group ${
                  isArchived
                    ? "bg-[#fafbfa] border-dashed border-gray-300 opacity-70 hover:opacity-95"
                    : "bg-white border-[#e2e8f0] hover:shadow-md"
                }`}
              >
                {/* Image and Badges */}
                <div className="relative">
                  {dest.image ? (
                    <img
                      src={dest.image}
                      alt={dest.name}
                      className={`w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300 ${isArchived ? "grayscale-[0.4]" : ""}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-[#0f2922] via-[#1a4a39] to-[#0f2922] flex items-center justify-center">
                      <span className="text-white/20 text-3xl">🏔️</span>
                    </div>
                  )}

                  {/* Primary Experience Tag Pill */}
                  {dest.experienceTags && dest.experienceTags.length > 0 && (
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-medium tracking-wide rounded-full px-2 py-0.5 bg-black/40 backdrop-blur-md text-white/90 border border-white/15">
                      {dest.experienceTags[0]}
                    </span>
                  )}

                  {/* Status Pill */}
                  <div className="absolute top-2.5 right-2.5">
                    {isArchived ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 bg-black/40 backdrop-blur-md text-gray-200 border border-white/15">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Archived
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 bg-black/40 backdrop-blur-md text-emerald-300 border border-emerald-400/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                        Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`font-semibold text-base group-hover:text-[#e8622a] transition-colors line-clamp-1 ${isArchived ? "text-[#4a5568]" : "text-[#0f2922]"}`}
                        style={{ fontFamily: "var(--font-serif, serif)" }}
                      >
                        {dest.name}
                      </h3>
                      {dest.elevation && (
                        <span className="text-[10px] text-[#718096] bg-black/[0.04] border border-black/[0.06] px-1.5 py-0.5 rounded shrink-0">
                          {dest.elevation}
                        </span>
                      )}
                    </div>

                    <p className="text-[#718096] text-xs mt-1 line-clamp-1">{dest.tagline || dest.description}</p>

                    <div className="flex items-center gap-3 text-[#718096] text-xs mt-2.5">
                      <span>{dest.activities?.length || 0} activities</span>
                      <span>•</span>
                      <span>{dest.highlights?.length || 0} highlights</span>
                    </div>

                    {isArchived && (
                      <div className="mt-3 bg-amber-50/80 border border-amber-200/60 rounded-md px-2.5 py-1.5 text-[11px] text-amber-800 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Retained for historical records. Unavailable for new trips.</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-[#edf2f7]" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setEditingDest(dest);
                        setModalMode("edit");
                      }}
                      className="flex-1 border border-[#e2e8f0] text-[#4a5568] hover:border-[#0f2922] hover:text-[#0f2922] text-xs font-semibold py-2 rounded-lg transition cursor-pointer"
                    >
                      Edit
                    </button>

                    {isArchived ? (
                      <button
                        onClick={() => setUnarchiveTarget(dest)}
                        className="flex-1 border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-1"
                        title="Restore this destination to active"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Unarchive
                      </button>
                    ) : (
                      <button
                        onClick={() => setArchiveTarget(dest)}
                        className="flex-1 border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-700 text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-1"
                        title="Archive this destination"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
