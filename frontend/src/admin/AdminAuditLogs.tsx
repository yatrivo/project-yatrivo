import { useState } from "react";
import { useApp } from "@/context/AppContext";

const AUDIT_LOGS = [
  { id: "1", user: "Rohit Sharma", action: "Updated Trip", details: "Chopta Tungnath Trek – price changed", date: "Sep 14, 2026 10:32 AM", ip: "192.168.1.42" },
  { id: "2", user: "Priya Kapoor", action: "Published Destination", details: "Rishikesh – status set to Published", date: "Sep 14, 2026 09:15 AM", ip: "192.168.1.18" },
  { id: "3", user: "Arjun Negi", action: "Status Changed", details: "Enquiry #ENQ105 → Contacted", date: "Sep 13, 2026 05:44 PM", ip: "10.0.0.5" },
  { id: "4", user: "Rohit Sharma", action: "Added User", details: "kavita@example.com added as Customer", date: "Sep 13, 2026 03:20 PM", ip: "192.168.1.42" },
  { id: "5", user: "Priya Kapoor", action: "Deleted Media", details: "Removed 3 images from media library", date: "Sep 12, 2026 02:00 PM", ip: "192.168.1.18" },
  { id: "6", user: "Arjun Negi", action: "Updated Settings", details: "Cancellation policy row 2 updated", date: "Sep 12, 2026 11:10 AM", ip: "10.0.0.5" },
  { id: "7", user: "Rohit Sharma", action: "Flagged Review", details: "Review ID #6 flagged for moderation", date: "Sep 11, 2026 04:55 PM", ip: "192.168.1.42" },
  { id: "8", user: "Priya Kapoor", action: "Created Trip", details: "Kanatal Weekend Escape – saved as Draft", date: "Sep 11, 2026 01:30 PM", ip: "192.168.1.18" },
  { id: "9", user: "Arjun Negi", action: "Sent Notification", details: "Weekly summary sent to Admin Team", date: "Sep 10, 2026 09:00 AM", ip: "10.0.0.5" },
  { id: "10", user: "Rohit Sharma", action: "Status Changed", details: "Enquiry #ENQ099 → Confirmed", date: "Sep 09, 2026 06:12 PM", ip: "192.168.1.42" },
  { id: "11", user: "Priya Kapoor", action: "Published Trip", details: "Auli Ski Adventure – set to Published", date: "Sep 09, 2026 02:45 PM", ip: "192.168.1.18" },
  { id: "12", user: "Arjun Negi", action: "Deactivated User", details: "simran@example.com deactivated", date: "Sep 08, 2026 10:20 AM", ip: "10.0.0.5" },
  { id: "13", user: "Rohit Sharma", action: "Updated Destination", details: "Kedarnath – description updated", date: "Sep 07, 2026 04:00 PM", ip: "192.168.1.42" },
  { id: "14", user: "Priya Kapoor", action: "Added User", details: "arjun@yatrivo.com added as Admin", date: "Sep 06, 2026 11:55 AM", ip: "192.168.1.18" },
  { id: "15", user: "Arjun Negi", action: "Exported Data", details: "Bookings list exported to CSV", date: "Sep 05, 2026 03:30 PM", ip: "10.0.0.5" },
];

const PER_PAGE = 8;

export default function AdminAuditLogs() {
  const { adminRole } = useApp();
  const [search, setSearch] = useState("");

  if (adminRole !== "superAdmin") {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-[#f0f4f1] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#a3bfb5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#0f2922] mb-2" style={{ fontFamily: "var(--font-serif, serif)" }}>Access Restricted</h3>
        <p className="text-[#718096] text-sm">Audit Logs are restricted to Super Admin only.</p>
      </div>
    );
  }
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const filtered = AUDIT_LOGS.filter((log) => {
    const q = search.toLowerCase();
    return log.user.toLowerCase().includes(q) || log.action.toLowerCase().includes(q) || log.details.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Audit Logs</h2>
        <p className="text-[#718096] text-sm mt-0.5">{AUDIT_LOGS.length} log entries</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search logs..."
            className="pl-9 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm w-56 focus:outline-none focus:border-[#0f2922]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#718096]">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#718096]">To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase font-medium border-b border-[#e2e8f0]">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Details</th>
                <th className="px-4 py-3 text-left">Date & Time</th>
                <th className="px-4 py-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1]">
              {paginated.map((log) => (
                <tr key={log.id} className="hover:bg-[#f7f8f5] transition">
                  <td className="px-4 py-3 font-medium text-[#0f2922]">{log.user}</td>
                  <td className="px-4 py-3">
                    <span className="bg-[#f0f9f4] text-[#0f2922] text-xs font-medium px-2.5 py-1 rounded-full">{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-[#4a5568] max-w-[240px] truncate">{log.details}</td>
                  <td className="px-4 py-3 text-[#718096] text-xs whitespace-nowrap">{log.date}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#a0aec0]">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0] text-sm text-[#718096]">
          <span>Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
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
