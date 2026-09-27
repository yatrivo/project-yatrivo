import { useState } from "react";
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
  const [price, setPrice] = useState(String(instance.price));
  const [spotsTotal, setSpotsTotal] = useState(String(instance.spotsTotal));
  const [spotsLeft, setSpotsLeft] = useState(String(instance.spotsLeft));
  const [date, setDate] = useState(instance.date);
  const [notes, setNotes] = useState(instance.notes ?? "");

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            Edit Instance
          </h3>
          <button onClick={onClose} className="text-[#a0aec0] hover:text-[#0f2922] transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-[#718096] mb-4">{tripName}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Total Spots</label>
              <input
                type="number"
                value={spotsTotal}
                onChange={(e) => setSpotsTotal(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Spots Left</label>
              <input
                type="number"
                value={spotsLeft}
                onChange={(e) => setSpotsLeft(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none"
              placeholder="Any notes..."
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={handleSave}
            className="flex-1 bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold py-2.5 rounded-lg transition"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-4 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium rounded-lg hover:bg-[#f7f8f5] transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface CompleteModalProps {
  instance: TripInstance;
  tripName: string;
  onSave: (updated: TripInstance) => void;
  onClose: () => void;
}

function CompleteModal({ instance, tripName, onSave, onClose }: CompleteModalProps) {
  const [photos, setPhotos] = useState<string[]>(instance.completedPhotos ?? ["", "", ""]);

  const handleSave = () => {
    const cleaned = photos.map((p) => p.trim()).filter(Boolean);
    onSave({
      ...instance,
      status: "completed",
      spotsLeft: 0,
      completedPhotos: cleaned.length > 0 ? cleaned : undefined,
    });
  };

  const updatePhoto = (i: number, val: string) => {
    const next = [...photos];
    next[i] = val;
    setPhotos(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            Mark as Completed
          </h3>
          <button onClick={onClose} className="text-[#a0aec0] hover:text-[#0f2922] transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-[#718096] mb-4">{tripName} — {instance.displayDate}</p>

        <div className="space-y-3 mb-5">
          <label className="block text-xs font-medium text-[#4a5568]">Completed Trip Photos (optional)</label>
          {photos.map((url, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-[#a0aec0] text-xs w-4 shrink-0 mt-1">{i + 1}.</span>
              <MediaPicker
                value={url}
                onChange={(newUrl) => updatePhoto(i, newUrl)}
                className="flex-1"
              />
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700 mb-5">
          This will mark the trip as completed and set spots remaining to 0.
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition"
          >
            Confirm Complete
          </button>
          <button
            onClick={onClose}
            className="px-4 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium rounded-lg hover:bg-[#f7f8f5] transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTripInstances() {
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
    setTripInstances(tripInstances.map((inst) => (inst.id === updated.id ? updated : inst)));
    setEditingInstance(null);
    try {
      await tripsApi.updateDeparture(updated.id, {
        date: updated.date,
        displayDate: updated.displayDate,
        price: updated.price,
        spotsTotal: updated.spotsTotal,
        notes: updated.notes,
        status: updated.status,
      });
      await refreshTrips();
      showToast("Trip departure updated.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update departure";
      showToast(msg, "error");
    }
  };

  const handleComplete = async (updated: TripInstance) => {
    setTripInstances(tripInstances.map((inst) => (inst.id === updated.id ? { ...inst, status: "completed" as const } : inst)));
    setCompletingInstance(null);
    try {
      await tripsApi.updateDeparture(updated.id, {
        status: "completed",
        notes: updated.notes,
      });
      await refreshTrips();
      showToast("Trip marked as completed.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to complete departure";
      showToast(msg, "error");
    }
  };

  const handleCancel = async (inst: TripInstance) => {
    if (!window.confirm(`Are you sure you want to cancel the departure on ${inst.displayDate || inst.date}? It will be moved to cancelled departures.`)) {
      return;
    }
    setTripInstances(
      tripInstances.map((i) => (i.id === inst.id ? { ...i, status: "cancelled" as const } : i))
    );
    try {
      await tripsApi.updateDeparture(inst.id, {
        status: "cancelled",
      });
      await refreshTrips();
      showToast("Trip departure cancelled.", "info");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel departure";
      showToast(msg, "error");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
                  <tr key={inst.id} className="hover:bg-[#fafafa] transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#0f2922] text-sm leading-tight">{tripName}</div>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {inst.status === "upcoming" ? (
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
                        ) : (
                          <span className="text-[#a0aec0] text-xs">—</span>
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
