import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { auditApi, type AuditLogItem } from "@/api/audit";

const PER_PAGE = 15;

const ENTITY_OPTIONS = [
  { value: "all", label: "All Activities" },
  { value: "booking", label: "Bookings" },
  { value: "enquiry", label: "Enquiries" },
  { value: "trip", label: "Trips" },
  { value: "trip_instance", label: "Departures" },
  { value: "destination", label: "Destinations" },
  { value: "review", label: "Reviews" },
  { value: "content", label: "Homepage & Content" },
  { value: "faq", label: "FAQs" },
  { value: "content_page", label: "Legal Pages" },
  { value: "setting", label: "Settings" },
  { value: "media", label: "Media" },
  { value: "auth", label: "Admin Logins & Access" }
];

function getActionBadgeStyle(action: string): string {
  const act = action.toLowerCase();
  if (act.includes("created") || act.includes("published") || act.includes("confirmed") || act.includes("restored") || act.includes("login")) {
    return "bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]";
  }
  if (act.includes("updated") || act.includes("assigned") || act.includes("reorder") || act.includes("submitted")) {
    return "bg-[#e3f2fd] text-[#1565c0] border border-[#bbdefb]";
  }
  if (act.includes("enquiry") || act.includes("payment") || act.includes("note") || act.includes("requests")) {
    return "bg-[#fff8e1] text-[#f57f17] border border-[#ffe082]";
  }
  if (act.includes("deleted") || act.includes("archived") || act.includes("failed") || act.includes("forbidden") || act.includes("logout")) {
    return "bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]";
  }
  return "bg-[#f0f9f4] text-[#0f2922] border border-[#d8ebe3]";
}

export default function AdminAuditLogs() {
  const { adminRole } = useApp();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Details drawer modal state
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditApi.getLogs({
        search: search.trim() || undefined,
        entityType: entityType !== "all" ? entityType : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        limit: PER_PAGE
      });
      setLogs(res.data);
      setTotal(res.total);
      setTotalPages(Math.max(1, res.totalPages));
    } catch (err: any) {
      console.error("Failed to load audit logs:", err);
      setError(err.message || "Failed to load audit logs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, entityType, fromDate, toDate, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Access check
  if (adminRole !== "superAdmin") {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-[#f0f4f1] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#a3bfb5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Access Restricted</h3>
        <p className="text-[#718096] text-sm max-w-sm">
          System Audit Logs record critical business operations and are restricted to Super Administrator privileges.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            System Audit Logs
          </h2>
          <p className="text-[#718096] text-sm mt-0.5">
            Immutable, database-backed record of admin operations, customer enquiries, bookings, and platform activities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e8f5e9] text-[#2e7d32]">
            {total} Total Logged Events
          </span>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e2e8f0] bg-white hover:bg-[#f7f8f5] text-[#0f2922] rounded-lg text-sm transition shadow-2xs font-medium cursor-pointer disabled:opacity-50"
            title="Refresh logs"
          >
            <svg className={`w-4 h-4 text-[#718096] ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-2xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by user, action, details..."
            className="w-full pl-9 pr-8 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-hidden focus:border-[#0f2922] focus:ring-1 focus:ring-[#0f2922]"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Entity Type Filter */}
        <div className="flex items-center gap-1.5">
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            className="border border-[#e2e8f0] bg-white rounded-lg px-3 py-2 text-sm text-[#0f2922] focus:outline-hidden focus:border-[#0f2922]"
          >
            {ENTITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#718096]">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs text-[#0f2922] focus:outline-hidden focus:border-[#0f2922]"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#718096]">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs text-[#0f2922] focus:outline-hidden focus:border-[#0f2922]"
          />
        </div>

        {/* Reset filters */}
        {(search || entityType !== "all" || fromDate || toDate) && (
          <button
            onClick={() => {
              setSearch("");
              setEntityType("all");
              setFromDate("");
              setToDate("");
              setPage(1);
            }}
            className="text-xs font-medium text-[#e8622a] hover:underline px-2 py-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchLogs} className="text-xs underline font-semibold cursor-pointer">Retry</button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase font-semibold border-b border-[#e2e8f0]">
                <th className="px-5 py-3.5">Actor / User</th>
                <th className="px-4 py-3.5">Action</th>
                <th className="px-4 py-3.5">Entity</th>
                <th className="px-5 py-3.5">Details</th>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-4 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1]">
              {loading && logs.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-gray-200 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-48 bg-gray-200 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-28 bg-gray-200 rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                    <td className="px-4 py-4 text-right"><div className="h-4 w-10 bg-gray-200 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-[#718096]">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#f0f4f1] flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-[#a3bfb5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="font-medium text-[#0f2922]">No audit logs found</p>
                      <p className="text-xs text-gray-500 mt-1">Try adjusting your search terms or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-[#fbfcfb] transition cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 font-medium text-[#0f2922] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0f2922] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {log.user.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[140px]" title={log.user}>
                          {log.user}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getActionBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#718096] capitalize whitespace-nowrap">
                      {log.entityType ? log.entityType.replace(/_/g, " ") : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#4a5568] max-w-sm truncate text-xs" title={log.details}>
                      {log.details || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-[#718096] text-xs whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-[#718096] whitespace-nowrap">
                      {log.ip}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span className="text-xs font-medium text-[#0f2922] group-hover:text-[#e8622a] transition flex items-center justify-end gap-1">
                        View
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-[#e2e8f0] text-sm text-[#718096] gap-3">
          <span className="text-xs">
            Showing {total === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total} events
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-2.5 py-1.5 border border-[#e2e8f0] rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-[#f7f8f5] transition cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs px-2 text-[#0f2922] font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-2.5 py-1.5 border border-[#e2e8f0] rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-[#f7f8f5] transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Details Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getActionBadgeStyle(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
                <h3 className="text-lg font-bold text-[#0f2922]">
                  Audit Event Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#718096] uppercase tracking-wider block">Actor / User</label>
                  <p className="mt-1 font-medium text-[#0f2922]">{selectedLog.user}</p>
                  {selectedLog.userId && (
                    <p className="text-[11px] font-mono text-gray-400 mt-0.5">{selectedLog.userId}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#718096] uppercase tracking-wider block">Timestamp</label>
                  <p className="mt-1 font-medium text-[#0f2922]">{selectedLog.date}</p>
                  <p className="text-[11px] font-mono text-gray-400 mt-0.5">{selectedLog.createdAt}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#718096] uppercase tracking-wider block">IP Address</label>
                  <p className="mt-1 font-mono text-xs text-[#0f2922]">{selectedLog.ip}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#718096] uppercase tracking-wider block">Entity Scope</label>
                  <p className="mt-1 font-medium text-[#0f2922] capitalize">
                    {selectedLog.entityType ? selectedLog.entityType.replace(/_/g, " ") : "Platform"}
                  </p>
                  {selectedLog.entityId && (
                    <p className="text-[11px] font-mono text-gray-400 mt-0.5">ID: {selectedLog.entityId}</p>
                  )}
                </div>
              </div>

              {/* Details text */}
              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wider block">Description / Details</label>
                <div className="mt-1.5 p-3 rounded-lg bg-[#f7f8f5] border border-[#e2e8f0] text-sm text-[#0f2922] leading-relaxed">
                  {selectedLog.details || "No additional text details recorded."}
                </div>
              </div>

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div>
                  <label className="text-xs font-semibold text-[#718096] uppercase tracking-wider block">User Agent</label>
                  <p className="mt-1 text-xs font-mono text-[#718096] break-all bg-gray-50 p-2 rounded border border-gray-100">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}

              {/* Payload Data (After Data / Changes) */}
              {selectedLog.afterData && (
                <div>
                  <label className="text-xs font-semibold text-[#718096] uppercase tracking-wider block">Context / Payload Data</label>
                  <pre className="mt-1.5 p-3 rounded-lg bg-[#0f2922] text-[#a3bfb5] text-xs font-mono overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.afterData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-3 border-t border-[#e2e8f0] flex justify-end bg-gray-50">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#0f2922] text-white text-xs font-medium rounded-lg hover:bg-[#1a3d31] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
