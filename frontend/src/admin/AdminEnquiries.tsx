import { useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Enquiry } from "@/context/AppContext";
import type { AdminPage } from "./AdminLayout";

const SOURCES = ["Website", "WhatsApp", "Phone", "Walk-in"] as const;
type Source = typeof SOURCES[number];

let manualEnqIdCounter = 1000;

interface AddInquiryModalProps {
  onClose: () => void;
}

function AddInquiryModal({ onClose }: AddInquiryModalProps) {
  const { addEnquiry, showToast, destinations, trips, tripInstances } = useApp();
  const [source, setSource] = useState<Source>("Phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [destName, setDestName] = useState("");
  const [tripId, setTripId] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [travellers, setTravellers] = useState("2");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const filteredTrips = trips.filter((t) => !destName || t.destination === destName || destinations.find((d) => d.name === destName && d.id === t.destination));
  const filteredInstances = tripInstances.filter((ti) => ti.tripId === tripId && ti.status === "upcoming");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!name.trim()) errs.push("Name is required.");
    if (!phone.trim()) errs.push("Phone is required.");
    setErrors(errs);
    if (errs.length > 0) return;

    const selectedTrip = trips.find((t) => t.id === tripId);
    const enquiry: Enquiry = {
      id: `ENQ-M${++manualEnqIdCounter}`,
      tripName: selectedTrip?.name ?? "—",
      destination: destName || "—",
      travelDate: travelDate || "—",
      travellers,
      submittedAt: new Date().toISOString().slice(0, 10),
      status: "Received",
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      pickupCity: "—",
      message: message.trim(),
    };
    addEnquiry(enquiry);
    showToast(`Manual inquiry added for ${enquiry.name}.`, "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-[#0f2922] px-5 py-4 flex items-center justify-between shrink-0">
          <h3 className="text-white font-semibold text-sm" style={{ fontFamily: "var(--font-serif, serif)" }}>Add Manual Inquiry</h3>
          <button onClick={onClose} className="text-[#a3bfb5] hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          <p className="text-[#718096] text-xs">Record an offline/WhatsApp/phone inquiry that didn't come through the website.</p>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-red-600 text-sm space-y-1">
              {errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Source</label>
            <select value={source} onChange={(e) => setSource(e.target.value as Source)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]">
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Name <span className="text-red-500">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Phone <span className="text-red-500">*</span></label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Email (optional)</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Destination</label>
            <select value={destName} onChange={(e) => { setDestName(e.target.value); setTripId(""); }} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]">
              <option value="">Select destination...</option>
              {destinations.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Trip</label>
            <select value={tripId} onChange={(e) => setTripId(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#0f2922]">
              <option value="">Select trip...</option>
              {filteredTrips.map((t) => {
                const instances = tripInstances.filter((ti) => ti.tripId === t.id && ti.status === "upcoming");
                if (instances.length > 0) {
                  return instances.map((ti) => (
                    <option key={ti.id} value={t.id}>{t.name} — {ti.displayDate}</option>
                  ));
                }
                return <option key={t.id} value={t.id}>{t.name}</option>;
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Travel Date</label>
              <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Number of Travellers</label>
              <input type="number" min="1" max="50" value={travellers} onChange={(e) => setTravellers(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Message / Notes</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Any notes or special requirements..." className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium py-2.5 rounded-lg hover:bg-[#f7f8f5] transition">Cancel</button>
            <button type="submit" className="flex-1 bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold py-2.5 rounded-lg transition">Add Inquiry</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  Received: "bg-blue-100 text-blue-700",
  Contacted: "bg-yellow-100 text-yellow-700",
  Quoted: "bg-purple-100 text-purple-700",
  Confirmed: "bg-green-100 text-green-700",
  Lost: "bg-red-100 text-red-700",
  Cancelled: "bg-gray-100 text-gray-600",
};

const TABS = ["All", "Received", "Contacted", "Quoted", "Confirmed"] as const;

interface Props {
  setAdminPage: (p: AdminPage) => void;
  setSelectedEnquiry: (e: Enquiry) => void;
}

export default function AdminEnquiries({ setAdminPage, setSelectedEnquiry }: Props) {
  const { enquiries } = useApp();
  const [tab, setTab] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const PER_PAGE = 8;

  const filtered = enquiries.filter((e) => {
    const matchTab = tab === "All" || e.status === tab;
    const q = search.toLowerCase();
    const matchSearch = e.name.toLowerCase().includes(q) || e.tripName.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleRowClick = (e: Enquiry) => {
    setSelectedEnquiry(e);
    setAdminPage("enquiry-detail");
  };

  return (
    <div className="p-6 space-y-5">
      {addModalOpen && <AddInquiryModal onClose={() => setAddModalOpen(false)} />}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Enquiries</h2>
          <p className="text-[#718096] text-sm mt-0.5">{enquiries.length} total enquiries</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add Inquiry
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 bg-[#f7f8f5] rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${tab === t ? "bg-white text-[#0f2922] shadow-sm" : "text-[#718096] hover:text-[#0f2922]"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or trip..."
            className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm w-64 focus:outline-none focus:border-[#0f2922]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase font-medium border-b border-[#e2e8f0]">
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Trip</th>
                <th className="px-4 py-3 text-left">Travel Date</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1]">
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[#a0aec0]">No enquiries found</td></tr>
              ) : paginated.map((e) => (
                <tr
                  key={e.id}
                  className="hover:bg-[#f7f8f5] cursor-pointer transition"
                  onClick={() => handleRowClick(e)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-[#718096]">#{e.id}</td>
                  <td className="px-4 py-3 font-medium text-[#0f2922]">{e.name}</td>
                  <td className="px-4 py-3 text-[#4a5568]">{e.phone}</td>
                  <td className="px-4 py-3 text-[#4a5568] max-w-[140px] truncate">{e.tripName}</td>
                  <td className="px-4 py-3 text-[#718096]">{e.travelDate}</td>
                  <td className="px-4 py-3 text-[#718096] text-xs">{new Date(e.submittedAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_BADGE[e.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(ev) => ev.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRowClick(e)}
                        className="text-[#0f2922] hover:text-[#e8622a] transition"
                        title="View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </button>
                      <a
                        href={`https://wa.me/${e.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-600 hover:text-green-700 transition"
                        title="WhatsApp"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0] text-sm text-[#718096]">
          <span>Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition ${p === page ? "bg-[#0f2922] text-white" : "hover:bg-[#f7f8f5] text-[#4a5568]"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
