import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/context/AppContext";
import { tripsApi } from "@/api/trips";
import type { TripInstance, Trip } from "@/data/trips";
import MediaPicker from "@/components/MediaPicker";
import type { AdminPage } from "./AdminLayout";

// ── helpers ────────────────────────────────────────────────────────────────

function statusColor(status: TripInstance["status"]) {
  if (status === "upcoming") return "bg-blue-100 text-blue-700";
  if (status === "completed") return "bg-green-100 text-green-700";
  return "bg-red-100 text-red-700";
}

function getTripDestinationsLabel(trip: Trip, allDestinations?: { id: string; name: string; slug?: string }[]): string {
  if (trip.destinations && trip.destinations.length > 0) {
    return trip.destinations.map((d) => d.name).join(", ");
  }
  if (trip.destination) {
    if (allDestinations) {
      const found = allDestinations.find((d) => d.id === trip.destination || d.slug === trip.destination || d.name === trip.destination);
      if (found) return found.name;
    }
    // Never show raw UUID string
    if (trip.destination.length > 30 && trip.destination.includes("-")) {
      return "Uttarakhand";
    }
    return trip.destination;
  }
  return "Uttarakhand";
}

// ── Edit Instance Modal ─────────────────────────────────────────────────────

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
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">DEPARTURE SETTINGS</div>
            <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>Edit Instance</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 p-6 space-y-4">
          <p className="text-xs text-[#718096]">{tripName}</p>
          <div>
            <label className="block text-xs font-semibold text-[#4a5568] mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4a5568] mb-1">Price (₹)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4a5568] mb-1">Total Spots</label>
              <input type="number" value={spotsTotal} onChange={(e) => {
                setSpotsTotal(e.target.value);
                const newTotal = Number(e.target.value) || 0;
                setSpotsLeft(String(Math.max(0, newTotal - bookedSpots)));
              }}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4a5568] mb-1" title="Remaining capacity calculated from active bookings">
                Spots Left <span className="text-[10px] text-[#718096] font-normal">({bookedSpots} booked)</span>
              </label>
              <input type="number" value={spotsLeft} readOnly disabled
                className="w-full border border-[#e2e8f0] bg-[#f7f8f5] rounded-lg px-3 py-2 text-sm text-[#718096] cursor-not-allowed"
                title="Spots Left is automatically calculated as Total Spots minus active Booked Spots." />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4a5568] mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none text-[#0f2922]"
              placeholder="Any notes..." />
          </div>
        </div>

        <div className="bg-[#f7f8f5] px-6 py-3.5 border-t border-[#e2e8f0] flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] text-[#4a5568] hover:text-[#0f2922] hover:bg-white text-xs font-semibold rounded-lg transition cursor-pointer">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 bg-[#0f2922] hover:bg-[#1a3d31] text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs">Save Changes</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Complete Modal ──────────────────────────────────────────────────────────

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
  const [photos, setPhotos] = useState<string[]>(instance.completedPhotos ?? ["", "", ""]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSave = () => {
    const cleaned = photos.map((p) => p.trim()).filter(Boolean);
    onSave({ ...instance, status: "completed", spotsLeft: 0, completedPhotos: cleaned.length > 0 ? cleaned : undefined });
  };

  const updatePhoto = (i: number, val: string) => {
    const next = [...photos];
    next[i] = val;
    setPhotos(next);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]">
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">DEPARTURE STATUS</div>
            <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>Mark as Completed</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 p-6 space-y-4">
          <p className="text-xs text-[#718096]">{tripName} — {instance.displayDate}</p>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[#4a5568]">Completed Trip Photos (optional)</label>
            {photos.map((url, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-[#a0aec0] text-xs w-4 shrink-0 mt-1">{i + 1}.</span>
                <MediaPicker
                  value={url}
                  onChange={(newUrl) => updatePhoto(i, newUrl)}
                  className="flex-1"
                  context={{
                    destinationId: dest?.id,
                    destinationSlug: dest?.slug,
                    destinationName: dest?.name,
                    category: "completed_trips"
                  }}
                />
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700">
            This will mark the trip as completed and set spots remaining to 0.
          </div>
        </div>

        <div className="bg-[#f7f8f5] px-6 py-3.5 border-t border-[#e2e8f0] flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] text-[#4a5568] hover:text-[#0f2922] hover:bg-white text-xs font-semibold rounded-lg transition cursor-pointer">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs">Confirm Complete</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Add Instance Modal ──────────────────────────────────────────────────────

interface AddInstanceModalProps {
  trip: Trip;
  onSave: (inst: TripInstance) => void;
  onClose: () => void;
}

function AddInstanceModal({ trip, onSave, onClose }: AddInstanceModalProps) {
  const [date, setDate] = useState("");
  const [price, setPrice] = useState(String(trip.price));
  const [spotsTotal, setSpotsTotal] = useState("12");
  const [spotsLeft, setSpotsLeft] = useState("12");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSave = () => {
    if (!date) return;
    const d = new Date(date + "T00:00:00");
    const displayDate = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    onSave({
      id: `inst-${trip.id}-${Date.now()}`,
      tripId: trip.id,
      date,
      displayDate,
      price: Number(price) || trip.price,
      spotsTotal: Number(spotsTotal) || 12,
      spotsLeft: Number(spotsLeft) || 12,
      status: "upcoming",
      notes: notes.trim() || undefined,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 max-h-[88vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-[#e2e8f0]">
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">NEW DEPARTURE</div>
            <h3 className="text-white font-bold text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>Add Departure</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 p-6 space-y-4">
          <p className="text-xs text-[#718096]">{trip.name}</p>
          <div>
            <label className="block text-xs font-semibold text-[#4a5568] mb-1">Departure Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#4a5568] mb-1">Price (₹)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4a5568] mb-1">Total Spots</label>
              <input type="number" value={spotsTotal} onChange={(e) => setSpotsTotal(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4a5568] mb-1">Spots Left</label>
              <input type="number" value={spotsLeft} onChange={(e) => setSpotsLeft(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4a5568] mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none text-[#0f2922]"
              placeholder="Any notes..." />
          </div>
        </div>

        <div className="bg-[#f7f8f5] px-6 py-3.5 border-t border-[#e2e8f0] flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-[#e2e8f0] text-[#4a5568] hover:text-[#0f2922] hover:bg-white text-xs font-semibold rounded-lg transition cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={!date} className="px-5 py-2 bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs">Add Departure</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Trip Instance Detail Panel ──────────────────────────────────────────────

interface DetailPanelProps {
  instance: TripInstance;
  trip: Trip;
  onClose: () => void;
  onEdit: (inst: TripInstance) => void;
  onComplete: (inst: TripInstance) => void;
  onCancel: (inst: TripInstance) => void;
}

function TripInstanceDetailPanel({ instance, trip, onClose, onEdit, onComplete, onCancel }: DetailPanelProps) {
  const { enquiries, destinations } = useApp();
  const relatedEnquiries = enquiries.filter((e) => e.tripName === trip.name);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden overscroll-contain">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-white shrink-0">
          <div>
            <h3 className="font-bold text-[#0f2922] text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>{trip.name}</h3>
            <p className="text-[#718096] text-xs mt-0.5">{getTripDestinationsLabel(trip, destinations)} · {trip.duration}</p>
          </div>
          <button onClick={onClose} className="text-[#a0aec0] hover:text-[#0f2922] transition p-1 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6">
          {/* Instance summary */}
          <div className="bg-[#f7f8f5] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(instance.status)}`}>
                {instance.status}
              </span>
              <span className="text-[#718096] text-xs">{instance.displayDate}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[#a0aec0] text-xs">Price per person</p>
                <p className="font-bold text-[#0f2922] text-base">₹{instance.price.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-[#a0aec0] text-xs">Spots</p>
                <p className="font-bold text-[#0f2922] text-base">{instance.spotsLeft} / {instance.spotsTotal} left</p>
                <div className="w-full bg-[#e2e8f0] rounded-full h-1 mt-1">
                  <div className="bg-[#e8622a] rounded-full h-1" style={{ width: `${Math.max(0, 100 - (instance.spotsLeft / instance.spotsTotal) * 100)}%` }} />
                </div>
              </div>
            </div>
            {instance.notes && <p className="text-[#718096] text-xs italic">{instance.notes}</p>}
          </div>

          {/* Trip highlights */}
          {trip.highlights && trip.highlights.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#0f2922] mb-2">Highlights</h4>
              <ul className="space-y-1">
                {trip.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#4a5568]">
                    <span className="text-[#e8622a] mt-0.5 shrink-0">•</span>
                    {typeof h === "string" ? h : (h as any)?.value ? `${(h as any).label}: ${(h as any).value}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Completed photos */}
          {instance.completedPhotos && instance.completedPhotos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#0f2922] mb-2">Trip Photos</h4>
              <div className="grid grid-cols-3 gap-2">
                {instance.completedPhotos.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-full h-20 object-cover rounded-lg border border-[#e2e8f0]" />
                ))}
              </div>
            </div>
          )}

          {/* Related enquiries */}
          <div>
            <h4 className="text-sm font-semibold text-[#0f2922] mb-2">Related Enquiries
              <span className="ml-1.5 text-xs font-normal text-[#a0aec0]">({relatedEnquiries.length})</span>
            </h4>
            {relatedEnquiries.length === 0 ? (
              <p className="text-[#a0aec0] text-xs">No enquiries for this trip yet.</p>
            ) : (
              <div className="space-y-2">
                {relatedEnquiries.map((e) => (
                  <div key={e.id} className="bg-[#f7f8f5] rounded-lg px-3 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0f2922]">{e.name}</p>
                      <p className="text-xs text-[#718096]">{e.destination}</p>
                    </div>
                    <span className="text-xs text-[#a0aec0]">{e.travelDate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookings placeholder */}
          <div>
            <h4 className="text-sm font-semibold text-[#0f2922] mb-2">Bookings <span className="ml-1.5 text-xs font-normal text-[#a0aec0]">(coming soon)</span></h4>
            <p className="text-[#a0aec0] text-xs">Booking records will appear here once linked to this instance.</p>
          </div>
        </div>

        {/* Action footer - ALWAYS VISIBLE PINNED AT BOTTOM */}
        {instance.status === "upcoming" && (
          <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f7f8f5] flex gap-2 shrink-0">
            <button onClick={() => onEdit(instance)} className="flex-1 border border-[#e2e8f0] text-[#0f2922] hover:bg-white text-sm font-medium py-2.5 rounded-lg transition cursor-pointer">Edit</button>
            <button onClick={() => onComplete(instance)} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition cursor-pointer">Mark Complete</button>
            <button onClick={() => onCancel(instance)} className="px-3 border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium py-2.5 rounded-lg transition cursor-pointer">Cancel</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Confirm Modal ──────────────────────────────────────────────────────────

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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={isSubmitting ? undefined : onCancel} />
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
            className="flex-1 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium py-2.5 rounded-lg hover:bg-[#f7f8f5] transition disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className={`flex-1 text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${
              confirmVariant === "danger"
                ? "bg-[#e8622a] hover:bg-[#d4541f]"
                : "bg-[#0f2922] hover:bg-[#1a3f35]"
            }`}
          >
            {isSubmitting ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Trip Card ────────────────────────────────────────────────────────────────

interface TripCardProps {
  trip: Trip;
  instances: TripInstance[];
  onEditTrip: () => void;
  onArchiveTrip: () => void;
  onRestoreTrip: () => void;
}

function TripCard({ trip, instances, onEditTrip, onArchiveTrip, onRestoreTrip }: TripCardProps) {
  const { destinations } = useApp();
  const navigate = useNavigate();
  const upcoming = instances.filter((i) => i.status === "upcoming").length;
  const tripUrl = `/admin/trips/${trip.slug || trip.id}`;
  const isArchived = trip.status === "archived";
  const isDraft = trip.status === "draft";

  return (
    <div
      onClick={() => navigate(tripUrl)}
      className={`bg-white rounded-xl border ${
        isArchived ? "border-[#cbd5e1] opacity-80" : "border-[#e2e8f0]"
      } shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer flex flex-col justify-between group`}
    >
      <div>
        {/* Cover Image & Badges */}
        <div className="relative h-44 overflow-hidden">
          {trip.image ? (
            <img
              src={trip.image}
              alt={trip.name}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                isArchived ? "grayscale-[50%]" : ""
              }`}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0f2922] via-[#1a4a39] to-[#0f2922] flex items-center justify-center">
              <span className="text-white/20 text-3xl">🏔️</span>
            </div>
          )}
          {/* Status badge in top-left */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            {isArchived ? (
              <span className="bg-black/40 backdrop-blur-md text-gray-200 border border-white/15 text-[10px] font-medium rounded-full px-2 py-0.5">
                Archived
              </span>
            ) : isDraft ? (
              <span className="bg-black/40 backdrop-blur-md text-amber-300 border border-amber-400/25 text-[10px] font-medium rounded-full px-2 py-0.5">
                Draft
              </span>
            ) : (
              <span className="bg-black/40 backdrop-blur-md text-emerald-300 border border-emerald-400/25 text-[10px] font-medium rounded-full px-2 py-0.5">
                Published
              </span>
            )}
          </div>

          {/* Theme/Category tag in top-right */}
          {(trip.badge || trip.category) && (
            <span className="absolute top-2.5 right-2.5 text-[10px] font-medium tracking-wide uppercase rounded-full px-2 py-0.5 bg-black/40 backdrop-blur-md text-white/90 border border-white/15">
              {trip.badge || trip.category}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-[#0f2922] text-base group-hover:text-[#e8622a] transition-colors line-clamp-1" style={{ fontFamily: "var(--font-serif, serif)" }}>
              {trip.name}
            </h3>
            <p className="text-[#718096] text-xs mt-1 capitalize line-clamp-1">
              {getTripDestinationsLabel(trip, destinations)} · {trip.duration} · {trip.difficulty}
            </p>
          </div>

          <div className="flex items-center justify-between mt-3 pt-1">
            <span className="text-[#e8622a] font-bold text-base">
              ₹{trip.price.toLocaleString("en-IN")}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-black/[0.03] text-[#718096] border border-black/[0.06]">
              <span className={`w-1.5 h-1.5 rounded-full ${upcoming > 0 ? "bg-[#38a169]/70" : "bg-[#cbd5e1]"}`} />
              {upcoming > 0 ? `${upcoming} upcoming` : "No upcoming"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 pb-4 pt-1 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onEditTrip}
          className="flex-1 border border-[#e2e8f0] text-[#4a5568] hover:border-[#0f2922] hover:text-[#0f2922] text-xs font-semibold py-2 rounded-lg transition cursor-pointer"
        >
          Edit Trip
        </button>
        {isArchived ? (
          <button
            onClick={onRestoreTrip}
            className="border border-[#e2e8f0] text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 text-xs font-semibold px-3 py-2 rounded-lg transition cursor-pointer"
          >
            Restore
          </button>
        ) : (
          <button
            onClick={onArchiveTrip}
            className="border border-[#e2e8f0] text-red-500 hover:border-red-300 hover:bg-red-50 text-xs font-semibold px-3 py-2 rounded-lg transition cursor-pointer"
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
}

import { useNavigate, Link } from "react-router-dom";

// ── Main component ──────────────────────────────────────────────────────────

interface Props {
  setAdminPage?: (p: AdminPage) => void;
}

export default function AdminTrips({ setAdminPage }: Props = {}) {
  const navigate = useNavigate();
  const { trips, setTrips, tripInstances, setTripInstances, showToast, destinations, refreshTrips } = useApp();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // Archive & Restore confirmation dialog states
  const [archiveTarget, setArchiveTarget] = useState<Trip | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [unarchiveTarget, setUnarchiveTarget] = useState<Trip | null>(null);
  const [isUnarchiving, setIsUnarchiving] = useState(false);

  // Instance modals
  const [editingInstance, setEditingInstance] = useState<TripInstance | null>(null);
  const [editingTripName, setEditingTripName] = useState("");
  const [completingInstance, setCompletingInstance] = useState<TripInstance | null>(null);
  const [completingTripName, setCompletingTripName] = useState("");
  const [addingInstanceTrip, setAddingInstanceTrip] = useState<Trip | null>(null);
  const [detailInstance, setDetailInstance] = useState<TripInstance | null>(null);
  const [detailTrip, setDetailTrip] = useState<Trip | null>(null);

  const publishedCount = trips.filter((t) => t.status === "published" || t.status === "active").length;
  const draftCount = trips.filter((t) => t.status === "draft").length;
  const archivedCount = trips.filter((t) => t.status === "archived").length;

  const sortedAndFiltered = trips
    .filter((t) => {
      const q = search.trim().toLowerCase();
      const destNames = t.destinations ? t.destinations.map((d) => d.name.toLowerCase()).join(" ") : (t.destination || "").toLowerCase();
      const matchesSearch = !q || t.name.toLowerCase().includes(q) || destNames.includes(q);

      let matchesStatus = true;
      if (statusFilter === "published") matchesStatus = t.status === "published" || t.status === "active";
      if (statusFilter === "draft") matchesStatus = t.status === "draft";
      if (statusFilter === "archived") matchesStatus = t.status === "archived";

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aArchived = a.status === "archived" ? 1 : 0;
      const bArchived = b.status === "archived" ? 1 : 0;
      if (aArchived !== bArchived) {
        return aArchived - bArchived; // Active and Drafts first, Archived at the bottom!
      }
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

  const getInstances = (tripId: string) =>
    tripInstances.filter((inst) => inst.tripId === tripId);

  // Instance actions
  const handleSaveEdit = async (updated: TripInstance) => {
    try {
      await tripsApi.updateDeparture(updated.id, {
        date: updated.date,
        displayDate: updated.displayDate,
        price: updated.price,
        spotsTotal: updated.spotsTotal,
        notes: updated.notes
      });
      setTripInstances((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setEditingInstance(null);
      showToast("Trip departure updated.", "success");
    } catch {
      setTripInstances((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setEditingInstance(null);
      showToast("Trip departure updated locally.", "info");
    }
  };

  const handleComplete = async (updated: TripInstance) => {
    try {
      await tripsApi.updateDeparture(updated.id, { status: "completed" });
    } catch {
      // fallback
    }
    const completedInst = { ...updated, status: "completed" as const };
    setTripInstances((prev) => prev.map((i) => (i.id === updated.id ? completedInst : i)));
    setCompletingInstance(null);
    showToast("Trip marked as completed.", "success");
    if (detailInstance?.id === updated.id) setDetailInstance(completedInst);
  };

  const handleCancel = async (inst: TripInstance) => {
    try {
      await tripsApi.updateDeparture(inst.id, { status: "cancelled" });
    } catch {
      // fallback
    }
    const cancelledInst = { ...inst, status: "cancelled" as const };
    setTripInstances((prev) => prev.map((i) => (i.id === inst.id ? cancelledInst : i)));
    showToast("Trip departure cancelled.", "info");
    if (detailInstance?.id === inst.id) setDetailInstance(cancelledInst);
  };

  const handleAddInstance = async (newInst: TripInstance) => {
    if (addingInstanceTrip) {
      try {
        const created = await tripsApi.addDeparture(addingInstanceTrip.id, {
          date: newInst.date,
          displayDate: newInst.displayDate,
          price: newInst.price,
          spotsTotal: newInst.spotsTotal,
          notes: newInst.notes
        });
        setTripInstances((prev) => [...prev, created]);
        showToast("Departure added.", "success");
      } catch {
        setTripInstances((prev) => [...prev, newInst]);
        showToast("Departure added locally.", "info");
      }
    }
    setAddingInstanceTrip(null);
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      await tripsApi.archive(archiveTarget.id);
      await refreshTrips();
      showToast(`"${archiveTarget.name}" has been archived.`, "info");
      setArchiveTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to archive trip";
      showToast(msg, "error");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleConfirmUnarchive = async () => {
    if (!unarchiveTarget) return;
    setIsUnarchiving(true);
    try {
      await tripsApi.unarchive(unarchiveTarget.id);
      await refreshTrips();
      showToast(`"${unarchiveTarget.name}" restored to published.`, "success");
      setUnarchiveTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to restore trip";
      showToast(msg, "error");
    } finally {
      setIsUnarchiving(false);
    }
  };

  const openEdit = (inst: TripInstance) => {
    setEditingTripName(trips.find((t) => t.id === inst.tripId)?.name ?? "");
    setEditingInstance(inst);
  };

  const openComplete = (inst: TripInstance) => {
    setCompletingTripName(trips.find((t) => t.id === inst.tripId)?.name ?? "");
    setCompletingInstance(inst);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Trips</h2>
          <p className="text-[#718096] text-sm mt-0.5">
            {publishedCount} published · {draftCount} drafts · {archivedCount} archived · {tripInstances.filter((i) => i.status === "upcoming").length} upcoming departures
          </p>
        </div>
        <Link
          to="/admin/trips/new"
          onClick={() => setAdminPage?.("trip-editor")}
          className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition inline-flex items-center gap-1 shadow-sm"
        >
          + Add New Trip
        </Link>
      </div>

      {/* Filters and Status Tabs */}
      <div className="bg-white p-3 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="relative min-w-[200px]">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trips..."
              className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm w-full focus:outline-none focus:border-[#0f2922]"
            />
          </div>
        </div>

        {/* Quick status tabs matching Destinations */}
        <div className="flex bg-[#f7f8f5] p-1 rounded-lg border border-[#e2e8f0] text-xs font-medium">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              statusFilter === "all" ? "bg-white text-[#0f2922] shadow-sm font-semibold" : "text-[#718096] hover:text-[#0f2922]"
            }`}
          >
            All ({trips.length})
          </button>
          <button
            onClick={() => setStatusFilter("published")}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              statusFilter === "published" ? "bg-white text-emerald-800 shadow-sm font-semibold" : "text-[#718096] hover:text-[#0f2922]"
            }`}
          >
            Published ({publishedCount})
          </button>
          <button
            onClick={() => setStatusFilter("draft")}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              statusFilter === "draft" ? "bg-white text-amber-800 shadow-sm font-semibold" : "text-[#718096] hover:text-[#0f2922]"
            }`}
          >
            Drafts ({draftCount})
          </button>
          <button
            onClick={() => setStatusFilter("archived")}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              statusFilter === "archived" ? "bg-white text-gray-800 shadow-sm font-semibold" : "text-[#718096] hover:text-[#0f2922]"
            }`}
          >
            Archived ({archivedCount})
          </button>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-[#f7f8f5] rounded-lg p-1">
          <button onClick={() => setViewMode("card")} className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === "card" ? "bg-white shadow-sm text-[#0f2922]" : "text-[#a0aec0]"}`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3A1.5 1.5 0 0115 10.5v3A1.5 1.5 0 0113.5 15h-3A1.5 1.5 0 019 13.5v-3z"/></svg>
          </button>
          <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === "table" ? "bg-white shadow-sm text-[#0f2922]" : "text-[#a0aec0]"}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
          </button>
        </div>
      </div>

      {sortedAndFiltered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#cbd5e1] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#f0f9f4] text-[#0f2922] mx-auto flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            No trips found
          </h3>
          <p className="text-sm text-[#718096] mt-1 max-w-sm mx-auto">
            {statusFilter === "draft"
              ? "You don't have any drafted trips yet."
              : statusFilter === "archived"
              ? "No trips are currently archived."
              : "Try adjusting your search query or filters."}
          </p>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedAndFiltered.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              instances={getInstances(trip.id)}
              onEditTrip={() => {
                setAdminPage?.("trip-editor");
                navigate(`/admin/trips/${trip.id}/edit`);
              }}
              onArchiveTrip={() => setArchiveTarget(trip)}
              onRestoreTrip={() => setUnarchiveTarget(trip)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[840px]">
              <thead>
                <tr className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase font-medium border-b border-[#e2e8f0]">
                  <th className="px-4 py-3 text-left">Trip</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Destination</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">Duration</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">Price</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">Departures</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f1]">
                {sortedAndFiltered.map((trip) => {
                  const insts = getInstances(trip.id);
                  const upcoming = insts.filter((i) => i.status === "upcoming").length;
                  const tripUrl = `/admin/trips/${trip.slug || trip.id}`;
                  const isArchived = trip.status === "archived";
                  const isDraft = trip.status === "draft";
                  return (
                    <tr
                      key={trip.id}
                      onClick={() => navigate(tripUrl)}
                      className={`hover:bg-[#f7f8f5] transition cursor-pointer ${isArchived ? "opacity-75" : ""}`}
                    >
                      <td className="px-4 py-3 flex items-center gap-3">
                        <img src={trip.image} alt={trip.name} className={`w-10 h-10 rounded-lg object-cover shrink-0 ${isArchived ? "grayscale-[50%]" : ""}`} />
                        <span className="font-medium text-[#0f2922] hover:text-[#e8622a] transition-colors line-clamp-1">{trip.name}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isArchived ? (
                          <span className="bg-gray-100 text-gray-700 border border-gray-300 text-[11px] font-semibold rounded-full px-2 py-0.5">
                            Archived
                          </span>
                        ) : isDraft ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold rounded-full px-2 py-0.5">
                            Draft
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold rounded-full px-2 py-0.5">
                            Published
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#4a5568] capitalize">{getTripDestinationsLabel(trip, destinations)}</td>
                      <td className="px-4 py-3 text-[#718096] whitespace-nowrap">{trip.duration}</td>
                      <td className="px-4 py-3 font-semibold text-[#e8622a] whitespace-nowrap">₹{trip.price.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-[#4a5568] text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span>{insts.length} total</span>
                          {upcoming > 0 && (
                            <span className="inline-flex items-center whitespace-nowrap bg-black/[0.03] text-[#718096] border border-black/[0.06] px-2 py-0.5 rounded-full font-normal text-[11px]">
                              {upcoming} upcoming
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                          <Link
                            to={`/admin/trips/${trip.id}/edit`}
                            onClick={() => setAdminPage?.("trip-editor")}
                            className="text-[#0f2922] hover:text-[#e8622a] text-xs font-semibold transition"
                          >
                            Edit
                          </Link>
                          {isArchived ? (
                            <button
                              onClick={() => setUnarchiveTarget(trip)}
                              className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold transition cursor-pointer"
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              onClick={() => setArchiveTarget(trip)}
                              className="text-red-500 hover:text-red-700 text-xs font-semibold transition cursor-pointer"
                            >
                              Archive
                            </button>
                          )}
                          <button
                            onClick={() => setAddingInstanceTrip(trip)}
                            className="text-[#0f2922] hover:text-[#e8622a] text-xs font-medium transition px-2.5 py-1 border border-[#e2e8f0] rounded-lg hover:border-[#0f2922] bg-white shadow-xs inline-flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            + Departure
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modals for Archive and Restore */}
      <ConfirmModal
        isOpen={Boolean(archiveTarget)}
        title="Archive Trip"
        message={`Are you sure you want to archive "${archiveTarget?.name}"? It will no longer be visible to visitors on the website, but all past departures and records will be preserved.`}
        confirmLabel="Archive Trip"
        confirmVariant="danger"
        isSubmitting={isArchiving}
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />

      <ConfirmModal
        isOpen={Boolean(unarchiveTarget)}
        title="Restore Trip"
        message={`Are you sure you want to restore "${unarchiveTarget?.name}"? It will be moved back to Published status and made visible to visitors.`}
        confirmLabel="Restore Trip"
        confirmVariant="success"
        isSubmitting={isUnarchiving}
        onConfirm={handleConfirmUnarchive}
        onCancel={() => setUnarchiveTarget(null)}
      />

      {/* Modals */}
      {editingInstance && (
        <EditModal instance={editingInstance} tripName={editingTripName} onSave={handleSaveEdit} onClose={() => setEditingInstance(null)} />
      )}
      {completingInstance && (
        <CompleteModal instance={completingInstance} tripName={completingTripName} onSave={handleComplete} onClose={() => setCompletingInstance(null)} />
      )}
      {addingInstanceTrip && (
        <AddInstanceModal trip={addingInstanceTrip} onSave={handleAddInstance} onClose={() => setAddingInstanceTrip(null)} />
      )}
      {detailInstance && detailTrip && (
        <TripInstanceDetailPanel
          instance={detailInstance}
          trip={detailTrip}
          onClose={() => { setDetailInstance(null); setDetailTrip(null); }}
          onEdit={(inst) => { setDetailInstance(null); setDetailTrip(null); openEdit(inst); }}
          onComplete={(inst) => { setDetailInstance(null); setDetailTrip(null); openComplete(inst); }}
          onCancel={(inst) => { handleCancel(inst); setDetailInstance(null); setDetailTrip(null); }}
        />
      )}
    </div>
  );
}
