import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import type { TripInstance } from "@/context/AppContext";
import { tripsApi } from "@/api/trips";
import MediaPicker from "@/components/MediaPicker";

function statusColor(status: TripInstance["status"]) {
  if (status === "upcoming") return "bg-blue-100 text-blue-700";
  if (status === "completed") return "bg-green-100 text-green-700";
  return "bg-red-100 text-red-700";
}

interface EditModalProps {
  instance: TripInstance;
  tripName: string;
  onSave: (updated: TripInstance) => void;
  onClose: () => void;
}

function EditModal({ instance, tripName, onSave, onClose }: EditModalProps) {
  const bookedSpots = Math.max(0, instance.spotsTotal - instance.spotsLeft);
  const [price, setPrice] = useState(String(instance.price));
  const [spotsTotal, setSpotsTotal] = useState(String(instance.spotsTotal));
  const [spotsLeft, setSpotsLeft] = useState(String(instance.spotsLeft));
  const [date, setDate] = useState(instance.date);
  const [notes, setNotes] = useState(instance.notes ?? "");

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSave = () => {
    // Derive displayDate from date
    const d = new Date(date + "T00:00:00");
    const displayDate = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    onSave({
      ...instance,
      date,
      displayDate,
      price: Number(price) || instance.price,
      spotsTotal: Number(spotsTotal) || instance.spotsTotal,
      spotsLeft: Number(spotsLeft) || instance.spotsLeft,
      notes: notes.trim() || undefined,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]">
        {/* Header */}
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">DEPARTURE SETTINGS</div>
            <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Edit Instance
            </h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 min-h-0 p-6 space-y-4">
          <p className="text-xs text-[#718096]">{tripName}</p>
          <div>
            <label className="block text-xs font-semibold text-[#4a5568] mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4a5568] mb-1">Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4a5568] mb-1">Total Spots</label>
              <input
                type="number"
                value={spotsTotal}
                onChange={(e) => {
                  setSpotsTotal(e.target.value);
                  const newTotal = Number(e.target.value) || 0;
                  setSpotsLeft(String(Math.max(0, newTotal - bookedSpots)));
                }}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4a5568] mb-1" title="Remaining capacity calculated from active bookings">
                Spots Left <span className="text-[10px] text-[#718096] font-normal">({bookedSpots} booked)</span>
              </label>
              <input
                type="number"
                value={spotsLeft}
                readOnly
                disabled
                className="w-full border border-[#e2e8f0] bg-[#f7f8f5] rounded-lg px-3 py-2 text-sm text-[#718096] cursor-not-allowed"
                title="Spots Left is automatically calculated as Total Spots minus active Booked Spots."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4a5568] mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922] resize-none"
              placeholder="Any notes..."
            />
          </div>
        </div>

        {/* Sticky Pinned Footer - ALWAYS VISIBLE */}
        <div className="bg-[#f7f8f5] px-6 py-3.5 border-t border-[#e2e8f0] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#e2e8f0] text-[#4a5568] hover:text-[#0f2922] hover:bg-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-[#0f2922] hover:bg-[#1a3d31] text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface CompleteModalProps {
  instance: TripInstance;
  tripName: string;
  onSave: (updated: TripInstance) => void;
  onClose: () => void;
}

function CompleteModal({ instance, tripName, onSave, onClose }: CompleteModalProps) {
  const { trips, destinations } = useApp();
  const trip = trips.find((t) => t.id === instance.tripId);
  const dest = destinations.find((d) => d.id === trip?.destination || d.slug === trip?.destination || d.name === trip?.destination);
  const [notes, setNotes] = useState(instance.notes ?? "");
  const [photos, setPhotos] = useState<string[]>(() => {
    if (instance.completedPhotos && instance.completedPhotos.length > 0) {
      return [...instance.completedPhotos];
    }
    return [];
  });

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSave = () => {
    const cleaned = photos.map((p) => p.trim()).filter(Boolean);
    onSave({
      ...instance,
      status: "completed",
      spotsLeft: 0,
      notes: notes.trim() || undefined,
      completedPhotos: cleaned.length > 0 ? cleaned : undefined,
    });
  };

  const handleAddPhoto = (newUrl: string) => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    setPhotos((prev) => {
      if (prev.length >= 12 || prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
  };

  const removePhotoSlot = (i: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  };

  const isAlreadyCompleted = instance.status === "completed";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl z-10 max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]">
        {/* Header */}
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">DEPARTURE STATUS</div>
            <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>
              {isAlreadyCompleted ? "Edit Completed Departure" : "Mark as Completed"}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 min-h-0 p-6 space-y-5">
          <div className="bg-[#f7f8f5] rounded-xl px-4 py-3 border border-[#e2e8f0]/80 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#0f2922]">{tripName}</div>
              <div className="text-[11px] text-[#718096] mt-0.5">Departure: {instance.displayDate}</div>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                isAlreadyCompleted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {instance.status}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0f2922] mb-1.5">
              Trip Completion Notes <span className="text-[#a0aec0] font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922] resize-none bg-white"
              placeholder="e.g. Batch completed smoothly. Clear skies, summit achieved by all passengers..."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-[#0f2922]">
                  Completed Trip Photos <span className="text-[#a0aec0] font-normal">({photos.length}/12)</span>
                </label>
                <p className="text-[11px] text-[#718096]">
                  Upload new photos or choose from your Media Library (up to 12 photos).
                </p>
              </div>
              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPhotos([])}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-[#f7f8f5] p-3 rounded-xl border border-[#e2e8f0]">
                {photos.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-[#e2e8f0] bg-white shadow-2xs"
                  >
                    <img
                      src={url}
                      alt={`Selected trip photo ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute top-1.5 left-1.5 bg-black/65 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      #{i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePhotoSlot(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-sm transition cursor-pointer"
                      title="Remove photo"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {photos.length < 12 ? (
              <div className="bg-[#f7f8f5]/70 p-3.5 rounded-xl border border-dashed border-[#cbd5e1]">
                <div className="text-[11px] font-semibold text-[#4a5568] mb-2">
                  {photos.length === 0 ? "Add your first trip photo:" : "Add another photo:"}
                </div>
                <MediaPicker
                  value=""
                  onChange={handleAddPhoto}
                  compact
                  context={{
                    destinationId: dest?.id,
                    destinationSlug: dest?.slug,
                    destinationName: dest?.name,
                    category: "completed_trips"
                  }}
                />
              </div>
            ) : (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center">
                Maximum of 12 photos reached. Remove a photo above to add a different one.
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs text-amber-800">
            {isAlreadyCompleted
              ? "Update notes and photos for this completed departure."
              : "This will mark the trip as completed and set spots remaining to 0."}
          </div>
        </div>

        {/* Sticky Pinned Footer - ALWAYS VISIBLE */}
        <div className="bg-[#f7f8f5] px-6 py-3.5 border-t border-[#e2e8f0] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#e2e8f0] text-[#4a5568] hover:text-[#0f2922] hover:bg-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-xs"
          >
            {isAlreadyCompleted ? "Save Changes" : "Confirm Complete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminTripInstances() {
  const navigate = useNavigate();
  const { trips, tripInstances, setTripInstances, showToast, refreshTrips } = useApp();

  const [editingInstance, setEditingInstance] = useState<TripInstance | null>(null);
  const [completingInstance, setCompletingInstance] = useState<TripInstance | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | TripInstance["status"]>("all");

  const getTripName = (tripId: string) => {
    const found = trips.find((t) => t.id === tripId || (t.slug && t.slug === tripId));
    if (found) return found.name;
    if (tripId && tripId.length > 30 && tripId.includes("-")) {
      return "Himalayan Expedition";
    }
    return tripId;
  };

  const filtered = tripInstances.filter(
    (inst) => filterStatus === "all" || inst.status === filterStatus
  );

  // Sort: upcoming first by date, then completed, then cancelled
  const sorted = [...filtered].sort((a, b) => {
    const order = { upcoming: 0, completed: 1, cancelled: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return a.date.localeCompare(b.date);
  });

  const handleSaveEdit = async (updated: TripInstance) => {
    const prevInstances = tripInstances;
    setTripInstances(tripInstances.map((inst) => (inst.id === updated.id ? updated : inst)));
    setEditingInstance(null);
    try {
      await tripsApi.updateDeparture(updated.id, {
        date: updated.date,
        displayDate: updated.displayDate,
        price: updated.price,
        spotsTotal: updated.spotsTotal,
        notes: updated.notes?.trim() || null,
        status: updated.status,
      });
      await refreshTrips({ bypassCache: true });
      showToast("Trip departure updated.", "success");
    } catch (err: unknown) {
      setTripInstances(prevInstances);
      const msg = err instanceof Error ? err.message : "Failed to update departure";
      showToast(msg, "error");
    }
  };

  const handleComplete = async (updated: TripInstance) => {
    const prevInstances = tripInstances;
    setTripInstances(tripInstances.map((inst) => (inst.id === updated.id ? { ...inst, status: "completed" as const, completedPhotos: updated.completedPhotos } : inst)));
    setCompletingInstance(null);
    try {
      await tripsApi.updateDeparture(updated.id, {
        status: "completed",
        notes: updated.notes?.trim() || null,
        completedPhotos: updated.completedPhotos && updated.completedPhotos.length > 0 ? updated.completedPhotos : [],
      });
      await refreshTrips({ bypassCache: true });
      showToast("Trip marked as completed.", "success");
    } catch (err: unknown) {
      setTripInstances(prevInstances);
      const msg = err instanceof Error ? err.message : "Failed to complete departure";
      showToast(msg, "error");
    }
  };

  const handleCancel = async (inst: TripInstance) => {
    if (!window.confirm(`Are you sure you want to cancel the departure on ${inst.displayDate || inst.date}? It will be moved to cancelled departures.`)) {
      return;
    }
    const prevInstances = tripInstances;
    setTripInstances(
      tripInstances.map((i) => (i.id === inst.id ? { ...i, status: "cancelled" as const } : i))
    );
    try {
      await tripsApi.updateDeparture(inst.id, {
        status: "cancelled",
      });
      await refreshTrips({ bypassCache: true });
      showToast("Trip departure cancelled.", "info");
    } catch (err: unknown) {
      setTripInstances(prevInstances);
      const msg = err instanceof Error ? err.message : "Failed to cancel departure";
      showToast(msg, "error");
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            Trip Instances
          </h2>
          <p className="text-[#718096] text-sm mt-1">Manage scheduled trip departures with dates, pricing, and availability.</p>
        </div>
        {/* Filter */}
        <div className="flex gap-1 bg-[#f7f8f5] rounded-lg p-1">
          {(["all", "upcoming", "completed", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition capitalize ${
                filterStatus === s ? "bg-white text-[#0f2922] shadow-sm" : "text-[#718096] hover:text-[#0f2922]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Upcoming", count: tripInstances.filter((i) => i.status === "upcoming").length, color: "text-blue-600" },
          { label: "Completed", count: tripInstances.filter((i) => i.status === "completed").length, color: "text-green-600" },
          { label: "Cancelled", count: tripInstances.filter((i) => i.status === "cancelled").length, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e2e8f0] p-4">
            <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "var(--font-serif, serif)" }}>{s.count}</div>
            <div className="text-[#718096] text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f8f5] border-b border-[#e2e8f0]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4a5568] uppercase tracking-wider">Trip</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4a5568] uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4a5568] uppercase tracking-wider">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4a5568] uppercase tracking-wider">Spots</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#4a5568] uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#4a5568] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f8]">
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#a0aec0] text-sm">No trip instances found.</td>
                </tr>
              )}
              {sorted.map((inst) => {
                const tripName = getTripName(inst.tripId);
                return (
                  <tr
                    key={inst.id}
                    onClick={() => navigate(`/admin/departures/${inst.id}`)}
                    className="hover:bg-[#fafafa] transition cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/departures/${inst.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-[#0f2922] hover:text-[#e8622a] text-sm leading-tight transition"
                      >
                        {tripName}
                      </Link>
                      {inst.notes && (
                        <div className="text-[#a0aec0] text-xs mt-0.5 truncate max-w-[200px]" title={inst.notes}>{inst.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#4a5568] whitespace-nowrap">{inst.displayDate}</td>
                    <td className="px-4 py-3 text-[#0f2922] font-medium whitespace-nowrap">₹{inst.price.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[#0f2922] font-semibold">{inst.spotsLeft}</span>
                        <span className="text-[#a0aec0]">/</span>
                        <span className="text-[#4a5568]">{inst.spotsTotal}</span>
                      </div>
                      <div className="w-full bg-[#e2e8f0] rounded-full h-1 mt-1">
                        <div
                          className="bg-[#e8622a] rounded-full h-1 transition-all"
                          style={{ width: `${Math.max(0, 100 - (inst.spotsLeft / inst.spotsTotal) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(inst.status)}`}>
                        {inst.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/departures/${inst.id}`}
                          className="text-[#0f2922] hover:text-[#e8622a] font-medium transition text-xs border border-[#e2e8f0] hover:border-[#0f2922] px-2.5 py-1 rounded-lg cursor-pointer"
                        >
                          {inst.status === "completed" ? "Reviews / Details" : "Details"}
                        </Link>
                        {inst.status === "upcoming" && (
                          <>
                            <button
                              onClick={() => setEditingInstance(inst)}
                              className="text-[#4a5568] hover:text-[#0f2922] transition text-xs border border-[#e2e8f0] hover:border-[#0f2922] px-2.5 py-1 rounded-lg cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setCompletingInstance(inst)}
                              className="text-green-600 hover:text-green-800 transition text-xs border border-green-200 hover:border-green-600 px-2.5 py-1 rounded-lg cursor-pointer"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleCancel(inst)}
                              className="text-red-500 hover:text-red-700 transition text-xs border border-red-200 hover:border-red-500 px-2.5 py-1 rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {inst.status === "completed" && (
                          <button
                            onClick={() => setCompletingInstance(inst)}
                            className="text-[#0f2922] hover:text-[#e8622a] transition text-xs border border-[#e2e8f0] hover:border-[#0f2922] px-2.5 py-1 rounded-lg cursor-pointer"
                            title="Edit completed departure photos and notes"
                          >
                            Photos & Notes
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {editingInstance && (
        <EditModal
          instance={editingInstance}
          tripName={getTripName(editingInstance.tripId)}
          onSave={handleSaveEdit}
          onClose={() => setEditingInstance(null)}
        />
      )}
      {completingInstance && (
        <CompleteModal
          instance={completingInstance}
          tripName={getTripName(completingInstance.tripId)}
          onSave={handleComplete}
          onClose={() => setCompletingInstance(null)}
        />
      )}
    </div>
  );
}
