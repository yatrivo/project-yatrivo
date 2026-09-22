import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { TripInstance, Trip } from "@/data/trips";
import MediaPicker from "@/components/MediaPicker";
import type { AdminPage } from "./AdminLayout";

// ── helpers ────────────────────────────────────────────────────────────────

function statusColor(status: TripInstance["status"]) {
  if (status === "upcoming") return "bg-blue-100 text-blue-700";
  if (status === "completed") return "bg-green-100 text-green-700";
  return "bg-red-100 text-red-700";
}

// ── Edit Instance Modal ─────────────────────────────────────────────────────

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
          <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Edit Instance</h3>
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
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Price (₹)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Total Spots</label>
              <input type="number" value={spotsTotal} onChange={(e) => setSpotsTotal(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Spots Left</label>
              <input type="number" value={spotsLeft} onChange={(e) => setSpotsLeft(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none"
              placeholder="Any notes..." />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={handleSave} className="flex-1 bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold py-2.5 rounded-lg transition">Save Changes</button>
          <button onClick={onClose} className="px-4 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium rounded-lg hover:bg-[#f7f8f5] transition">Cancel</button>
        </div>
      </div>
    </div>
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
  const [photos, setPhotos] = useState<string[]>(instance.completedPhotos ?? ["", "", ""]);

  const handleSave = () => {
    const cleaned = photos.map((p) => p.trim()).filter(Boolean);
    onSave({ ...instance, status: "completed", spotsLeft: 0, completedPhotos: cleaned.length > 0 ? cleaned : undefined });
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
          <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Mark as Completed</h3>
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
              <MediaPicker value={url} onChange={(newUrl) => updatePhoto(i, newUrl)} className="flex-1" />
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700 mb-5">
          This will mark the trip as completed and set spots remaining to 0.
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition">Confirm Complete</button>
          <button onClick={onClose} className="px-4 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium rounded-lg hover:bg-[#f7f8f5] transition">Cancel</button>
        </div>
      </div>
    </div>
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Add Departure</h3>
          <button onClick={onClose} className="text-[#a0aec0] hover:text-[#0f2922] transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-[#718096] mb-4">{trip.name}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Departure Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Price (₹)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Total Spots</label>
              <input type="number" value={spotsTotal} onChange={(e) => setSpotsTotal(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Spots Left</label>
              <input type="number" value={spotsLeft} onChange={(e) => setSpotsLeft(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none"
              placeholder="Any notes..." />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={handleSave} disabled={!date} className="flex-1 bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-lg transition">Add Departure</button>
          <button onClick={onClose} className="px-4 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium rounded-lg hover:bg-[#f7f8f5] transition">Cancel</button>
        </div>
      </div>
    </div>
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
  const { enquiries } = useApp();
  const relatedEnquiries = enquiries.filter((e) => e.tripName === trip.name);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-[#0f2922] text-base" style={{ fontFamily: "var(--font-serif, serif)" }}>{trip.name}</h3>
            <p className="text-[#718096] text-xs mt-0.5">{trip.destination} · {trip.duration}</p>
          </div>
          <button onClick={onClose} className="text-[#a0aec0] hover:text-[#0f2922] transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
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
                    {h}
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

        {/* Action footer */}
        {instance.status === "upcoming" && (
          <div className="px-6 py-4 border-t border-[#e2e8f0] flex gap-2">
            <button onClick={() => onEdit(instance)} className="flex-1 border border-[#e2e8f0] text-[#0f2922] hover:bg-[#f7f8f5] text-sm font-medium py-2.5 rounded-lg transition">Edit</button>
            <button onClick={() => onComplete(instance)} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition">Mark Complete</button>
            <button onClick={() => onCancel(instance)} className="px-3 border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium py-2.5 rounded-lg transition">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Trip Card with inline instances ────────────────────────────────────────

interface TripCardProps {
  trip: Trip;
  instances: TripInstance[];
  onEditTrip: () => void;
  onDuplicateTrip: () => void;
  onDeleteTrip: () => void;
  onEditInstance: (inst: TripInstance) => void;
  onCompleteInstance: (inst: TripInstance) => void;
  onCancelInstance: (inst: TripInstance) => void;
  onAddInstance: (trip: Trip) => void;
  onViewInstance: (inst: TripInstance, trip: Trip) => void;
}

function TripCard({
  trip, instances, onEditTrip, onDuplicateTrip, onDeleteTrip,
  onEditInstance, onCompleteInstance, onCancelInstance, onAddInstance, onViewInstance
}: TripCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sortedInst = [...instances].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = instances.filter((i) => i.status === "upcoming").length;

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
      {/* Trip header */}
      <div className="relative">
        <img src={trip.image} alt={trip.name} className="w-full h-40 object-cover" />
        <span className={`absolute top-3 right-3 text-xs font-medium rounded-full px-2.5 py-1 ${trip.badge ? "bg-[#e8622a] text-white" : "bg-green-100 text-green-700"}`}>
          {trip.badge || "Active"}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[#0f2922] text-sm">{trip.name}</h3>
        <p className="text-[#718096] text-xs mt-1 capitalize">{trip.destination} · {trip.duration} · {trip.category}</p>
        <p className="text-[#e8622a] font-bold text-sm mt-1.5">₹{trip.price.toLocaleString("en-IN")}</p>
        <div className="flex gap-2 mt-3">
          <button onClick={onEditTrip} className="flex-1 border border-[#e2e8f0] text-[#4a5568] hover:border-[#0f2922] text-xs font-medium py-1.5 rounded-lg transition">Edit</button>
          <button onClick={onDuplicateTrip} className="flex-1 border border-[#e2e8f0] text-[#4a5568] hover:border-[#0f2922] text-xs font-medium py-1.5 rounded-lg transition">Duplicate</button>
          <button onClick={onDeleteTrip} className="border border-[#e2e8f0] text-red-500 hover:border-red-300 text-xs font-medium px-2.5 py-1.5 rounded-lg transition">Archive</button>
        </div>

        {/* Instances toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 flex items-center justify-between px-3 py-2 bg-[#f7f8f5] hover:bg-[#f0f4f1] rounded-lg transition text-xs font-medium text-[#4a5568]"
        >
          <span>
            {sortedInst.length} departure{sortedInst.length !== 1 ? "s" : ""}
            {upcoming > 0 && <span className="ml-1.5 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px]">{upcoming} upcoming</span>}
          </span>
          <svg className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Instances list */}
        {expanded && (
          <div className="mt-2 space-y-1.5">
            {sortedInst.length === 0 && (
              <p className="text-[#a0aec0] text-xs text-center py-3">No departures scheduled.</p>
            )}
            {sortedInst.map((inst) => (
              <div
                key={inst.id}
                className="border border-[#e2e8f0] rounded-lg px-3 py-2.5 hover:border-[#0f2922] cursor-pointer transition"
                onClick={() => onViewInstance(inst, trip)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-[#0f2922]">{inst.displayDate}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusColor(inst.status)}`}>
                    {inst.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-[#718096]">
                    <span>₹{inst.price.toLocaleString("en-IN")}</span>
                    <span>{inst.spotsLeft}/{inst.spotsTotal} spots</span>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onEditInstance(inst)} className="text-[#4a5568] hover:text-[#0f2922] transition text-[10px] border border-[#e2e8f0] hover:border-[#0f2922] px-1.5 py-0.5 rounded">Edit</button>
                    {inst.status === "upcoming" && (
                      <>
                        <button onClick={() => onCompleteInstance(inst)} className="text-green-600 hover:text-green-800 transition text-[10px] border border-green-200 hover:border-green-600 px-1.5 py-0.5 rounded">Complete</button>
                        <button onClick={() => onCancelInstance(inst)} className="text-red-500 hover:text-red-700 transition text-[10px] border border-red-200 hover:border-red-400 px-1.5 py-0.5 rounded">Cancel</button>
                      </>
                    )}
                  </div>
                </div>
                {/* Spot fill bar */}
                <div className="w-full bg-[#e2e8f0] rounded-full h-1 mt-2">
                  <div className="bg-[#e8622a] rounded-full h-1" style={{ width: `${Math.max(0, 100 - (inst.spotsLeft / inst.spotsTotal) * 100)}%` }} />
                </div>
              </div>
            ))}
            <button
              onClick={() => onAddInstance(trip)}
              className="w-full flex items-center justify-center gap-1.5 border border-dashed border-[#c3d1cb] hover:border-[#0f2922] text-[#718096] hover:text-[#0f2922] text-xs font-medium py-2 rounded-lg transition mt-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Departure
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

interface Props {
  setAdminPage: (p: AdminPage) => void;
}

export default function AdminTrips({ setAdminPage }: Props) {
  const { trips, setTrips, tripInstances, setTripInstances, showToast, destinations } = useApp();

  const [search, setSearch] = useState("");
  const [destFilter, setDestFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // Instance modals
  const [editingInstance, setEditingInstance] = useState<TripInstance | null>(null);
  const [editingTripName, setEditingTripName] = useState("");
  const [completingInstance, setCompletingInstance] = useState<TripInstance | null>(null);
  const [completingTripName, setCompletingTripName] = useState("");
  const [addingInstanceTrip, setAddingInstanceTrip] = useState<Trip | null>(null);
  const [detailInstance, setDetailInstance] = useState<TripInstance | null>(null);
  const [detailTrip, setDetailTrip] = useState<Trip | null>(null);

  const destOptions = ["All", ...destinations.map((d) => d.id)];

  const filtered = trips.filter((t) => {
    const q = search.toLowerCase();
    return (
      (destFilter === "All" || t.destination === destFilter) &&
      (t.name.toLowerCase().includes(q) || t.destination.toLowerCase().includes(q))
    );
  });

  const getInstances = (tripId: string) =>
    tripInstances.filter((inst) => inst.tripId === tripId);

  // Instance actions
  const handleSaveEdit = (updated: TripInstance) => {
    setTripInstances((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setEditingInstance(null);
    showToast("Trip instance updated.", "success");
  };

  const handleComplete = (updated: TripInstance) => {
    setTripInstances((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setCompletingInstance(null);
    showToast("Trip marked as completed.", "success");
    // Also close detail panel if open
    if (detailInstance?.id === updated.id) setDetailInstance(updated);
  };

  const handleCancel = (inst: TripInstance) => {
    setTripInstances((prev) => prev.map((i) => (i.id === inst.id ? { ...i, status: "cancelled" as const } : i)));
    showToast("Trip instance cancelled.", "info");
    if (detailInstance?.id === inst.id) setDetailInstance({ ...inst, status: "cancelled" });
  };

  const handleAddInstance = (newInst: TripInstance) => {
    setTripInstances((prev) => [...prev, newInst]);
    setAddingInstanceTrip(null);
    showToast("Departure added.", "success");
  };

  const handleDuplicateTrip = (trip: Trip) => {
    const copy: Trip = { ...trip, id: `${trip.id}-copy-${Date.now()}`, name: `${trip.name} (Copy)`, badge: "" };
    setTrips((prev) => [...prev, copy]);
    showToast("Trip duplicated.", "success");
  };

  const handleDeleteTrip = (tripId: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
    showToast("Trip archived.", "info");
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
          <p className="text-[#718096] text-sm mt-0.5">{trips.length} trips · {tripInstances.filter((i) => i.status === "upcoming").length} upcoming departures</p>
        </div>
        <button
          onClick={() => setAdminPage("trip-editor")}
          className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + Add New Trip
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trips..."
            className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm w-52 focus:outline-none focus:border-[#0f2922]"
          />
        </div>
        <select value={destFilter} onChange={(e) => setDestFilter(e.target.value)} className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none bg-white capitalize">
          {destOptions.map((d) => <option key={d} value={d} className="capitalize">{d === "All" ? "All Destinations" : d}</option>)}
        </select>
        <div className="ml-auto flex gap-1 bg-[#f7f8f5] rounded-lg p-1">
          <button onClick={() => setViewMode("card")} className={`p-1.5 rounded-md transition ${viewMode === "card" ? "bg-white shadow-sm text-[#0f2922]" : "text-[#a0aec0]"}`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3A1.5 1.5 0 0115 10.5v3A1.5 1.5 0 0113.5 15h-3A1.5 1.5 0 019 13.5v-3z"/></svg>
          </button>
          <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition ${viewMode === "table" ? "bg-white shadow-sm text-[#0f2922]" : "text-[#a0aec0]"}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
          </button>
        </div>
      </div>

      {viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              instances={getInstances(trip.id)}
              onEditTrip={() => setAdminPage("trip-editor")}
              onDuplicateTrip={() => handleDuplicateTrip(trip)}
              onDeleteTrip={() => handleDeleteTrip(trip.id)}
              onEditInstance={openEdit}
              onCompleteInstance={openComplete}
              onCancelInstance={handleCancel}
              onAddInstance={(t) => setAddingInstanceTrip(t)}
              onViewInstance={(inst, t) => { setDetailInstance(inst); setDetailTrip(t); }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase font-medium border-b border-[#e2e8f0]">
                <th className="px-4 py-3 text-left">Trip</th>
                <th className="px-4 py-3 text-left">Destination</th>
                <th className="px-4 py-3 text-left">Duration</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Departures</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1]">
              {filtered.map((trip) => {
                const insts = getInstances(trip.id);
                const upcoming = insts.filter((i) => i.status === "upcoming").length;
                return (
                  <tr key={trip.id} className="hover:bg-[#f7f8f5] transition">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <img src={trip.image} alt={trip.name} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-medium text-[#0f2922]">{trip.name}</span>
                    </td>
                    <td className="px-4 py-3 text-[#4a5568] capitalize">{trip.destination}</td>
                    <td className="px-4 py-3 text-[#718096]">{trip.duration}</td>
                    <td className="px-4 py-3 font-semibold text-[#e8622a]">₹{trip.price.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-[#4a5568] text-xs">
                      {insts.length} total
                      {upcoming > 0 && <span className="ml-1.5 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{upcoming} upcoming</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setAdminPage("trip-editor")} className="text-[#0f2922] hover:text-[#e8622a] text-xs font-medium transition">Edit</button>
                        <button onClick={() => handleDuplicateTrip(trip)} className="text-[#718096] hover:text-[#0f2922] text-xs font-medium transition">Duplicate</button>
                        <button onClick={() => handleDeleteTrip(trip.id)} className="text-red-500 hover:text-red-700 text-xs font-medium transition">Archive</button>
                        <button onClick={() => setAddingInstanceTrip(trip)} className="text-[#0f2922] hover:text-[#e8622a] text-xs font-medium transition">+ Departure</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
