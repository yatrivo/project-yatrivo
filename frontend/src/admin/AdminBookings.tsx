import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Booking, Traveller } from "@/context/AppContext";

const STATUS_BADGE: Record<string, string> = {
  Confirmed: "bg-green-100 text-green-700",
  Completed: "bg-blue-100 text-blue-700",
  Cancelled: "bg-red-100 text-red-700",
};

const PAYMENT_BADGE: Record<string, string> = {
  Unpaid: "bg-red-100 text-red-700",
  Partial: "bg-yellow-100 text-yellow-700",
  Paid: "bg-green-100 text-green-700",
};

const TABS = ["All", "Confirmed", "Completed", "Cancelled"];

// ─── BookingDetailModal ─────────────────────────────────────────────────────

function BookingDetailModal({ booking, onClose, onSave }: {
  booking: Booking;
  onClose: () => void;
  onSave: (updated: Booking) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Booking>({ ...booking });

  const updateTraveller = (i: number, field: keyof Traveller, val: string) => {
    setForm((prev) => ({
      ...prev,
      travellers: prev.travellers.map((t, idx) => idx === i ? { ...t, [field]: val } : t),
    }));
  };

  const handleSave = () => {
    onSave(form);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl z-10 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[#0f2922] px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-white font-semibold" style={{ fontFamily: "var(--font-serif, serif)" }}>Booking #{form.id}</h3>
            <span className={`text-xs font-medium rounded-full px-2 py-0.5 mt-1 inline-block ${STATUS_BADGE[form.status] ?? "bg-gray-100 text-gray-600"}`}>{form.status}</span>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-[#a3bfb5] hover:text-white text-xs border border-[#2d5a48] px-3 py-1 rounded-lg transition">Edit</button>
            )}
            <button onClick={onClose} className="text-[#a3bfb5] hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {!editing ? (
            <>
              <Section title="Customer">
                <Row label="Name" value={form.customerName} />
                <Row label="Phone" value={form.customerPhone} />
                {form.customerEmail && <Row label="Email" value={form.customerEmail} />}
              </Section>
              <Section title="Trip">
                <Row label="Trip" value={form.tripName} />
                <Row label="Destination" value={form.destination} />
                <Row label="Date" value={form.tripDate} />
                <Row label="Booked On" value={form.bookingDate} />
              </Section>
              <Section title="Payment">
                <Row label="Amount" value={form.totalAmount} />
                <Row label="Payment" value={form.paymentStatus} />
                <Row label="Status" value={form.status} />
              </Section>
              <Section title="Travellers">
                {form.travellers.map((t, i) => (
                  <div key={i} className="text-sm text-[#0f2922]">{i + 1}. {t.name} — {t.age}y, {t.gender}</div>
                ))}
              </Section>
              {form.notes && (
                <Section title="Notes">
                  <p className="text-sm text-[#4a5568]">{form.notes}</p>
                </Section>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-[#0f2922] uppercase tracking-wide">Customer</h4>
              <div className="grid grid-cols-2 gap-3">
                <EditField label="Name" value={form.customerName} onChange={(v) => setForm({ ...form, customerName: v })} />
                <EditField label="Phone" value={form.customerPhone} onChange={(v) => setForm({ ...form, customerPhone: v })} />
                <EditField label="Email" value={form.customerEmail ?? ""} onChange={(v) => setForm({ ...form, customerEmail: v })} />
              </div>
              <h4 className="text-xs font-semibold text-[#0f2922] uppercase tracking-wide">Trip</h4>
              <div className="grid grid-cols-2 gap-3">
                <EditField label="Trip Name" value={form.tripName} onChange={(v) => setForm({ ...form, tripName: v })} />
                <EditField label="Destination" value={form.destination} onChange={(v) => setForm({ ...form, destination: v })} />
                <EditField label="Date" value={form.tripDate} onChange={(v) => setForm({ ...form, tripDate: v })} />
                <EditField label="Total Amount" value={form.totalAmount} onChange={(v) => setForm({ ...form, totalAmount: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#4a5568] mb-1">Payment Status</label>
                  <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as Booking["paymentStatus"] })} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]">
                    <option>Unpaid</option><option>Partial</option><option>Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#4a5568] mb-1">Booking Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Booking["status"] })} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]">
                    <option>Confirmed</option><option>Completed</option><option>Cancelled</option>
                  </select>
                </div>
              </div>
              <h4 className="text-xs font-semibold text-[#0f2922] uppercase tracking-wide">Travellers</h4>
              {form.travellers.map((t, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <EditField label={`Traveller ${i + 1} Name`} value={t.name} onChange={(v) => updateTraveller(i, "name", v)} />
                  <EditField label="Age" value={t.age} onChange={(v) => updateTraveller(i, "age", v)} />
                  <div>
                    <label className="block text-xs text-[#4a5568] mb-1">Gender</label>
                    <select value={t.gender} onChange={(e) => updateTraveller(i, "gender", e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]">
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs text-[#4a5568] mb-1">Notes</label>
                <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none" />
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 px-6 pb-5 pt-4 border-t border-[#e2e8f0] flex gap-3">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="flex-1 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium py-2.5 rounded-lg hover:bg-[#f7f8f5] transition">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold py-2.5 rounded-lg transition">Save</button>
            </>
          ) : (
            <button onClick={onClose} className="w-full bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-semibold py-2.5 rounded-lg transition">Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[#a0aec0] text-xs uppercase tracking-wide mb-2 font-medium">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[#a0aec0] text-xs w-24 shrink-0 pt-0.5 uppercase tracking-wide">{label}</span>
      <span className="text-[#0f2922] text-sm font-medium">{value}</span>
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-[#4a5568] mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
    </div>
  );
}

// ─── AddBookingModal ─────────────────────────────────────────────────────────

function AddBookingModal({ onClose }: { onClose: () => void }) {
  const { addBooking, showToast, destinations, trips, tripInstances } = useApp();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [destName, setDestName] = useState("");
  const [selectedTripId, setSelectedTripId] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [travellerCount, setTravellerCount] = useState(1);
  const [travellersData, setTravellersData] = useState<Traveller[]>([{ name: "", age: "", gender: "Male" }]);
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"Unpaid" | "Partial" | "Paid">("Unpaid");
  const [bookingStatus, setBookingStatus] = useState<"Confirmed" | "Completed" | "Cancelled">("Confirmed");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const filteredTrips = trips.filter((t) => !destName || destinations.find((d) => d.name === destName && d.id === t.destination) || t.destination === destName);
  const filteredInstances = tripInstances.filter((ti) => ti.tripId === selectedTripId && ti.status === "upcoming");

  const handleCountChange = (count: number) => {
    setTravellerCount(count);
    setTravellersData((prev) => {
      if (count > prev.length) {
        return [...prev, ...Array.from({ length: count - prev.length }, () => ({ name: "", age: "", gender: "Male" }))];
      }
      return prev.slice(0, count);
    });
  };

  const updateTraveller = (i: number, field: keyof Traveller, val: string) => {
    setTravellersData((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!customerName.trim()) errs.push("Customer name is required.");
    if (!customerPhone.trim()) errs.push("Phone is required.");
    setErrors(errs);
    if (errs.length > 0) return;

    const selectedTrip = trips.find((t) => t.id === selectedTripId);
    addBooking({
      id: "BK" + Date.now(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      destination: destName || "—",
      tripName: selectedTrip?.name ?? "—",
      tripDate: tripDate || "—",
      travellers: travellersData,
      totalAmount: totalAmount || "—",
      paymentStatus,
      status: bookingStatus,
      bookingDate: new Date().toISOString().slice(0, 10),
      notes: notes.trim() || undefined,
    });
    showToast("Booking added!", "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[#0f2922] px-5 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-white font-semibold text-sm" style={{ fontFamily: "var(--font-serif, serif)" }}>Add Booking</h3>
          <button onClick={onClose} className="text-[#a3bfb5] hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-5">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-red-600 text-sm space-y-1">
              {errors.map((err, i) => <p key={i}>{err}</p>)}
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-[#0f2922] uppercase tracking-wide mb-3">Primary Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Name <span className="text-red-500">*</span></label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Phone <span className="text-red-500">*</span></label>
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Email (optional)</label>
                <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@example.com" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#0f2922] uppercase tracking-wide mb-3">Trip Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Destination</label>
                <select value={destName} onChange={(e) => { setDestName(e.target.value); setSelectedTripId(""); }} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]">
                  <option value="">Select destination...</option>
                  {destinations.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Trip</label>
                <select value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]">
                  <option value="">Select trip...</option>
                  {filteredTrips.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Trip Date</label>
                {filteredInstances.length > 0 ? (
                  <select value={tripDate} onChange={(e) => setTripDate(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]">
                    <option value="">Select date...</option>
                    {filteredInstances.map((ti) => <option key={ti.id} value={ti.displayDate}>{ti.displayDate}</option>)}
                  </select>
                ) : (
                  <input value={tripDate} onChange={(e) => setTripDate(e.target.value)} placeholder="e.g. Oct 15, 2026" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Number of Travellers</label>
                <input type="number" min="1" max="50" value={travellerCount} onChange={(e) => handleCountChange(parseInt(e.target.value) || 1)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#0f2922] uppercase tracking-wide mb-3">Travellers</h4>
            <div className="space-y-2">
              {travellersData.map((t, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-[#718096] mb-1">Name</label>
                    <input value={t.name} onChange={(e) => updateTraveller(i, "name", e.target.value)} placeholder={`Traveller ${i + 1}`} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#718096] mb-1">Age</label>
                    <input value={t.age} onChange={(e) => updateTraveller(i, "age", e.target.value)} placeholder="Age" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#718096] mb-1">Gender</label>
                    <select value={t.gender} onChange={(e) => updateTraveller(i, "gender", e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]">
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#0f2922] uppercase tracking-wide mb-3">Payment & Status</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Total Amount</label>
                <input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="₹0" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Payment Status</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as "Unpaid" | "Partial" | "Paid")} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]">
                  <option>Unpaid</option><option>Partial</option><option>Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Booking Status</label>
                <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value as "Confirmed" | "Completed" | "Cancelled")} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]">
                  <option>Confirmed</option><option>Completed</option><option>Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any additional notes..." className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium py-2.5 rounded-lg hover:bg-[#f7f8f5] transition">Cancel</button>
            <button type="submit" className="flex-1 bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold py-2.5 rounded-lg transition">Add Booking</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── AdminBookings (main) ────────────────────────────────────────────────────

export default function AdminBookings() {
  const { bookings, setBookings, showToast, trips, destinations } = useApp();
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [filterTrip, setFilterTrip] = useState("");
  const [filterDest, setFilterDest] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [page, setPage] = useState(1);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const PER_PAGE = 8;

  const filtered = bookings.filter((b) => {
    const matchTab = tab === "All" || b.status === tab;
    const q = search.toLowerCase();
    const matchSearch = b.customerName.toLowerCase().includes(q) || b.tripName.toLowerCase().includes(q);
    const matchTrip = !filterTrip || b.tripName === filterTrip;
    const matchDest = !filterDest || b.destination.toLowerCase().includes(filterDest.toLowerCase());
    const matchPayment = !filterPayment || b.paymentStatus === filterPayment;
    return matchTab && matchSearch && matchTrip && matchDest && matchPayment;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExport = () => {
    const headers = ["ID", "Customer", "Phone", "Trip", "Destination", "Date", "Travellers", "Amount", "Payment", "Status", "Booked On"];
    const rows = filtered.map((b) => [
      b.id, b.customerName, b.customerPhone, b.tripName, b.destination,
      b.tripDate, String(b.travellers.length), b.totalAmount,
      b.paymentStatus, b.status, b.bookingDate,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported!", "success");
  };

  const handleSaveBooking = (updated: Booking) => {
    setBookings((prev) => prev.map((b) => b.id === updated.id ? updated : b));
    setViewBooking(updated);
    showToast("Booking updated.", "success");
  };

  return (
    <div className="p-6 space-y-5">
      {viewBooking && (
        <BookingDetailModal booking={viewBooking} onClose={() => setViewBooking(null)} onSave={handleSaveBooking} />
      )}
      {addModalOpen && <AddBookingModal onClose={() => setAddModalOpen(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Bookings</h2>
          <p className="text-[#718096] text-sm mt-0.5">{bookings.length} total bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="border border-[#0f2922] text-[#0f2922] hover:bg-[#f7f8f5] text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Export
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add Booking
          </button>
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex gap-1 bg-[#f7f8f5] rounded-lg p-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${tab === t ? "bg-white text-[#0f2922] shadow-sm" : "text-[#718096] hover:text-[#0f2922]"}`}>{t}</button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or trip..." className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm w-60 focus:outline-none focus:border-[#0f2922]" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterTrip} onChange={(e) => { setFilterTrip(e.target.value); setPage(1); }} className="border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0f2922] text-[#4a5568]">
            <option value="">All Trips</option>
            {trips.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
          <select value={filterDest} onChange={(e) => { setFilterDest(e.target.value); setPage(1); }} className="border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0f2922] text-[#4a5568]">
            <option value="">All Destinations</option>
            {destinations.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <select value={filterPayment} onChange={(e) => { setFilterPayment(e.target.value); setPage(1); }} className="border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0f2922] text-[#4a5568]">
            <option value="">All Payments</option>
            <option>Unpaid</option>
            <option>Partial</option>
            <option>Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase font-medium border-b border-[#e2e8f0]">
                <th className="px-4 py-3 text-left">Booking ID</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Trip</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Travellers</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1]">
              {paginated.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-[#a0aec0]">No bookings found</td></tr>
              ) : paginated.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-[#f7f8f5] cursor-pointer transition"
                  onClick={() => setViewBooking(b)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-[#718096]">{b.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0f2922]">{b.customerName}</p>
                    <p className="text-xs text-[#718096]">{b.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-[#4a5568] max-w-[130px] truncate">{b.tripName}</td>
                  <td className="px-4 py-3 text-[#718096] text-xs">{b.tripDate}</td>
                  <td className="px-4 py-3 text-[#4a5568]">{b.travellers.length}</td>
                  <td className="px-4 py-3 font-semibold text-[#0f2922]">{b.totalAmount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${PAYMENT_BADGE[b.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>{b.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_BADGE[b.status] ?? "bg-gray-100 text-gray-600"}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3" onClick={(ev) => ev.stopPropagation()}>
                    <button onClick={() => setViewBooking(b)} className="text-[#e8622a] hover:underline text-xs font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0] text-sm text-[#718096]">
          <span>Showing {filtered.length === 0 ? 0 : Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition ${p === page ? "bg-[#0f2922] text-white" : "hover:bg-[#f7f8f5] text-[#4a5568]"}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
