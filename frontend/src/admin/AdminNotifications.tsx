import { useState } from "react";
import { useApp } from "@/context/AppContext";

const NOTIFICATIONS = [
  { id: "1", title: "New Enquiry Received", type: "Enquiry", audience: "Admin Team", date: "Sep 14, 2026", status: "Sent" },
  { id: "2", title: "Booking Confirmed - BK001", type: "Booking", audience: "Customer", date: "Sep 13, 2026", status: "Sent" },
  { id: "3", title: "Trip Published: Auli Ski", type: "System", audience: "All Users", date: "Sep 12, 2026", status: "Sent" },
  { id: "4", title: "Follow-up Reminder", type: "Enquiry", audience: "Rohit Sharma", date: "Sep 11, 2026", status: "Sent" },
  { id: "5", title: "Cancellation Alert - BK006", type: "Booking", audience: "Admin Team", date: "Sep 10, 2026", status: "Sent" },
  { id: "6", title: "New Review Flagged", type: "System", audience: "Admin Team", date: "Sep 09, 2026", status: "Sent" },
  { id: "7", title: "Weekly Enquiry Summary", type: "System", audience: "All Admins", date: "Sep 08, 2026", status: "Sent" },
  { id: "8", title: "Upcoming Trip Reminder", type: "Booking", audience: "Customer", date: "Sep 07, 2026", status: "Draft" },
];

const TABS = ["All", "Enquiry", "Booking", "System"];

const TYPE_BADGE: Record<string, string> = {
  Enquiry: "bg-blue-100 text-blue-700",
  Booking: "bg-green-100 text-green-700",
  System: "bg-purple-100 text-purple-700",
};

interface ModalProps { onClose: () => void; }

function SendModal({ onClose }: ModalProps) {
  const { showToast } = useApp();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Enquiry");
  const [audience, setAudience] = useState("Admin Team");
  const [message, setMessage] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#0f2922] text-lg" style={{ fontFamily: "var(--font-serif, serif)" }}>Send Notification</h3>
          <button onClick={onClose} className="text-[#a0aec0] hover:text-[#4a5568]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#4a5568] mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                {["Enquiry", "Booking", "System"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-1">Audience</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
                {["Admin Team", "All Users", "Customer", "All Admins"].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a5568] mb-1">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 border border-[#e2e8f0] text-[#4a5568] py-2 rounded-lg text-sm hover:bg-[#f7f8f5] transition">Cancel</button>
            <button onClick={() => { showToast("Notification sent!", "success"); onClose(); }} className="flex-1 bg-[#e8622a] hover:bg-[#d4541f] text-white py-2 rounded-lg text-sm font-semibold transition">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminNotifications() {
  const [tab, setTab] = useState("All");
  const [showModal, setShowModal] = useState(false);

  const filtered = NOTIFICATIONS.filter((n) => tab === "All" || n.type === tab);

  return (
    <div className="p-6 space-y-5">
      {showModal && <SendModal onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Notifications</h2>
          <p className="text-[#718096] text-sm mt-0.5">{NOTIFICATIONS.length} notifications</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
          + Send Notification
        </button>
      </div>

      <div className="flex gap-1 bg-[#f7f8f5] rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${tab === t ? "bg-white text-[#0f2922] shadow-sm" : "text-[#718096] hover:text-[#0f2922]"}`}>{t}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase font-medium border-b border-[#e2e8f0]">
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Audience</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f1]">
            {filtered.map((n) => (
              <tr key={n.id} className="hover:bg-[#f7f8f5] transition">
                <td className="px-4 py-3 font-medium text-[#0f2922]">{n.title}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${TYPE_BADGE[n.type] ?? "bg-gray-100 text-gray-600"}`}>{n.type}</span>
                </td>
                <td className="px-4 py-3 text-[#4a5568]">{n.audience}</td>
                <td className="px-4 py-3 text-[#718096]">{n.date}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${n.status === "Sent" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{n.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
