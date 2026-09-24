import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { Enquiry, Traveller } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";
import type { AdminPage } from "./AdminLayout";

interface Props {
  enquiry?: Enquiry | null;
  setAdminPage?: (p: AdminPage) => void;
}

const STATUSES = ["Received", "Contacted", "Quoted", "Confirmed", "Lost", "Cancelled"] as const;
const TEAM = ["Unassigned", "Rohit Sharma", "Priya Kapoor", "Arjun Negi"];

const TIMELINE = [
  { event: "Enquiry Received", time: "2 days ago", icon: "📩" },
  { event: "Contacted by phone", time: "1 day ago", icon: "📞" },
  { event: "Quote sent via email", time: "5 hours ago", icon: "📧" },
];

interface CreateBookingModalProps {
  enquiry: Enquiry;
  onClose: () => void;
}

function CreateBookingModal({ enquiry, onClose }: CreateBookingModalProps) {
  const { addBooking, showToast } = useApp();

  const initialCount = parseInt(enquiry.travellers) || 1;
  const [customerName, setCustomerName] = useState(enquiry.name);
  const [customerPhone, setCustomerPhone] = useState(enquiry.phone);
  const [customerEmail, setCustomerEmail] = useState(enquiry.email ?? "");
  const [destination, setDestination] = useState(enquiry.destination);
  const [tripName, setTripName] = useState(enquiry.tripName);
  const [tripDate, setTripDate] = useState(enquiry.travelDate);
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"Unpaid" | "Partial" | "Paid">("Unpaid");
  const [bookingStatus, setBookingStatus] = useState<"Confirmed" | "Completed" | "Cancelled">("Confirmed");
  const [notes, setNotes] = useState("");

  const [travellersData, setTravellersData] = useState<Traveller[]>(
    Array.from({ length: initialCount }, (_, i) => ({
      name: i === 0 ? enquiry.name : "",
      age: "",
      gender: "Male",
    }))
  );

  const updateTraveller = (index: number, field: keyof Traveller, value: string) => {
    setTravellersData((prev) => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const handleSave = () => {
    addBooking({
      id: "BK" + Date.now(),
      enquiryId: enquiry.id,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      destination,
      tripName,
      tripDate,
      travellers: travellersData,
      totalAmount,
      paymentStatus,
      status: bookingStatus,
      bookingDate: new Date().toISOString().slice(0, 10),
      notes: notes || undefined,
    });
    showToast("Booking created!", "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[#0f2922] px-5 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-white font-semibold text-sm" style={{ fontFamily: "var(--font-serif, serif)" }}>Create Booking from Enquiry #{enquiry.id}</h3>
          <button onClick={onClose} className="text-[#a3bfb5] hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Primary Contact */}
          <div>
            <h4 className="text-xs font-semibold text-[#0f2922] uppercase tracking-wide mb-3">Primary Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Name</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Phone</label>
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Email</label>
                <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="optional" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div>
            <h4 className="text-xs font-semibold text-[#0f2922] uppercase tracking-wide mb-3">Booking Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Destination</label>
                <input value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Trip Name</label>
                <input value={tripName} onChange={(e) => setTripName(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Trip Date</label>
                <input value={tripDate} onChange={(e) => setTripDate(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Final Amount</label>
                <input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="₹0" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Payment Status</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as "Unpaid" | "Partial" | "Paid")} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]">
                  <option>Unpaid</option>
                  <option>Partial</option>
                  <option>Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5568] mb-1">Booking Status</label>
                <select value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value as "Confirmed" | "Completed" | "Cancelled")} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]">
                  <option>Confirmed</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Travellers */}
          <div>
            <h4 className="text-xs font-semibold text-[#0f2922] uppercase tracking-wide mb-3">Travellers ({travellersData.length})</h4>
            <div className="space-y-2">
              {travellersData.map((t, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 items-end">
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
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any additional notes..." className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none" />
          </div>
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-[#e2e8f0] flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium py-2.5 rounded-lg hover:bg-[#f7f8f5] transition">Cancel</button>
          <button onClick={handleSave} className="flex-1 bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold py-2.5 rounded-lg transition">Create Booking</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminEnquiryDetail({ enquiry: propEnquiry, setAdminPage }: Props = {}) {
  const { id } = useParams<{ id: string }>();
  const { enquiries, showToast } = useApp();
  const enquiry = propEnquiry || enquiries.find((e) => e.id === id);

  const [status, setStatus] = useState<string>(enquiry?.status ?? "Received");
  const [assignee, setAssignee] = useState(TEAM[0]);
  const [originalStatus] = useState<string>(enquiry?.status ?? "Received");
  const [originalAssignee] = useState(TEAM[0]);
  const [hasChanges, setHasChanges] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [createBookingOpen, setCreateBookingOpen] = useState(false);

  if (!enquiry) {
    return (
      <div className="p-8 text-center text-[#718096]">
        <p className="text-base mb-3">Enquiry {id ? `"${id}"` : ""} not found.</p>
        <Link
          to="/admin/enquiries"
          onClick={() => setAdminPage?.("enquiries")}
          className="inline-block bg-[#0f2922] text-white px-5 py-2 rounded-lg text-sm hover:bg-[#1a4a39] transition"
        >
          ← Back to Enquiries
        </Link>
      </div>
    );
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setHasChanges(newStatus !== originalStatus || assignee !== originalAssignee);
  };

  const handleAssigneeChange = (newAssignee: string) => {
    setAssignee(newAssignee);
    setHasChanges(status !== originalStatus || newAssignee !== originalAssignee);
  };

  const handleSaveChanges = () => {
    showToast("Changes saved", "success");
    setHasChanges(false);
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    setNotes([...notes, note.trim()]);
    setNote("");
    showToast("Note added.", "success");
  };

  return (
    <div className="p-6 space-y-6">
      {createBookingOpen && (
        <CreateBookingModal enquiry={enquiry} onClose={() => setCreateBookingOpen(false)} />
      )}

      {/* Back */}
      <Link
        to="/admin/enquiries"
        onClick={() => setAdminPage?.("enquiries")}
        className="inline-flex items-center gap-2 text-[#718096] hover:text-[#0f2922] transition text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Enquiries
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
          Enquiry #{enquiry.id}
        </h2>
        <p className="text-[#718096] text-sm mt-0.5">Received on {new Date(enquiry.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer + Trip Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
            <h3 className="font-semibold text-[#0f2922] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e8622a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Customer Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#a0aec0] text-xs uppercase mb-1">Full Name</p>
                <p className="font-medium text-[#0f2922]">{enquiry.name}</p>
              </div>
              <div>
                <p className="text-[#a0aec0] text-xs uppercase mb-1">Phone</p>
                <p className="font-medium text-[#0f2922]">{enquiry.phone}</p>
              </div>
              <div>
                <p className="text-[#a0aec0] text-xs uppercase mb-1">Email</p>
                <p className="font-medium text-[#0f2922]">{enquiry.email || "—"}</p>
              </div>
              <div>
                <p className="text-[#a0aec0] text-xs uppercase mb-1">Pickup City</p>
                <p className="font-medium text-[#0f2922]">{enquiry.pickupCity || "—"}</p>
              </div>
            </div>
          </div>

          {/* Trip Info */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
            <h3 className="font-semibold text-[#0f2922] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e8622a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21"/>
              </svg>
              Trip Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[#a0aec0] text-xs uppercase mb-1">Trip</p>
                <p className="font-medium text-[#0f2922]">{enquiry.tripName}</p>
              </div>
              <div>
                <p className="text-[#a0aec0] text-xs uppercase mb-1">Travel Date</p>
                <p className="font-medium text-[#0f2922]">{enquiry.travelDate}</p>
              </div>
              <div>
                <p className="text-[#a0aec0] text-xs uppercase mb-1">Travellers</p>
                <p className="font-medium text-[#0f2922]">{enquiry.travellers}</p>
              </div>
              <div>
                <p className="text-[#a0aec0] text-xs uppercase mb-1">Destination</p>
                <p className="font-medium text-[#0f2922]">{enquiry.destination}</p>
              </div>
              {enquiry.message && (
                <div className="col-span-2">
                  <p className="text-[#a0aec0] text-xs uppercase mb-1">Message</p>
                  <p className="text-[#4a5568] bg-[#f7f8f5] rounded-lg p-3">{enquiry.message}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
            <h3 className="font-semibold text-[#0f2922] mb-4">Internal Notes</h3>
            <div className="space-y-2 mb-4">
              {notes.length === 0 ? (
                <p className="text-[#a0aec0] text-sm">No notes yet.</p>
              ) : notes.map((n, i) => (
                <div key={i} className="bg-[#f7f8f5] rounded-lg p-3 text-sm text-[#4a5568]">
                  <span className="font-semibold text-[#0f2922]">Admin: </span>{n}
                </div>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={3}
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none"
            />
            <button
              onClick={handleAddNote}
              className="mt-2 bg-[#0f2922] hover:bg-[#1a3d31] text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Add Note
            </button>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
            <h3 className="font-semibold text-[#0f2922] mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {TIMELINE.map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#f7f8f5] rounded-full flex items-center justify-center text-base shrink-0">{t.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-[#0f2922]">{t.event}</p>
                    <p className="text-xs text-[#a0aec0]">{t.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Status + Actions */}
        <div className="space-y-4">
          <div className="bg-[#0f2922] rounded-xl p-5 text-white space-y-4">
            <h3 className="font-semibold text-white mb-2">CRM Actions</h3>

            <div>
              <label className="block text-[#7aab95] text-xs uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full bg-[#1a3d31] text-white border border-[#2d5a48] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e8622a]"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[#7aab95] text-xs uppercase mb-1">Assign Team Member</label>
              <select
                value={assignee}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full bg-[#1a3d31] text-white border border-[#2d5a48] rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {TEAM.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {hasChanges && (
              <button
                onClick={handleSaveChanges}
                className="w-full bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold py-2 rounded-lg transition"
              >
                Save Changes
              </button>
            )}

            <div className="border-t border-[#1a3d31] pt-4 space-y-2">
              <button
                onClick={() => setCreateBookingOpen(true)}
                className="flex items-center gap-2 w-full bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold py-2.5 px-3 rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Create Booking
              </button>
              <a
                href={`https://wa.me/${enquiry.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp Customer
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
