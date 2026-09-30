import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import type { AdminPage } from "./AdminLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  dashboardApi,
  type DashboardSummaryData,
} from "@/api/dashboard";

const STATUS_BADGE: Record<string, string> = {
  Received: "bg-blue-100 text-blue-700",
  Contacted: "bg-yellow-100 text-yellow-700",
  Quoted: "bg-purple-100 text-purple-700",
  In_Discussion: "bg-indigo-100 text-indigo-700",
  Converted: "bg-teal-100 text-teal-700",
  Confirmed: "bg-green-100 text-green-700",
  Lost: "bg-red-100 text-red-700",
  Cancelled: "bg-gray-100 text-gray-600",
  Closed: "bg-gray-100 text-gray-600",
};

interface Props {
  setAdminPage?: (p: AdminPage) => void;
}

export default function AdminDashboard({ setAdminPage }: Props = {}) {
  const { enquiries: fallbackEnquiries, trips: fallbackTrips, tripInstances: fallbackInstances } = useApp();

  const [dashboardData, setDashboardData] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await dashboardApi.getSummary();
      setDashboardData(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard data";
      console.warn("Could not fetch dashboard summary from backend:", message);
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived KPI metrics (prefer backend, fallback to client context)
  const totalEnquiries = dashboardData
    ? dashboardData.stats.totalEnquiries
    : fallbackEnquiries.length;

  const newReceived = dashboardData
    ? dashboardData.stats.newReceivedEnquiries
    : fallbackEnquiries.filter((e) => e.status === "Received").length;

  const confirmedBookings = dashboardData
    ? dashboardData.stats.confirmedBookings
    : fallbackEnquiries.filter((e) => e.status === "Confirmed").length;

  const upcomingTrips = dashboardData
    ? dashboardData.stats.upcomingTrips
    : fallbackInstances.filter((i) => i.status === "upcoming").length;

  const completedTrips = dashboardData
    ? dashboardData.stats.completedTrips
    : fallbackInstances.filter((i) => i.status === "completed").length;

  const kpis = [
    { label: "Total Enquiries", value: totalEnquiries, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "New / Received", value: newReceived, color: "text-[#e8622a]", bg: "bg-orange-50" },
    { label: "Confirmed Bookings", value: confirmedBookings, color: "text-green-600", bg: "bg-green-50" },
    { label: "Upcoming Trips", value: upcomingTrips, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Completed Trips", value: completedTrips, color: "text-[#0f2922]", bg: "bg-[#f0f4f1]" },
  ];

  // Derived Monthly trends (live database aggregate or default 6-month empty window)
  const monthlyTrends = dashboardData?.monthlyTrends && dashboardData.monthlyTrends.length > 0
    ? dashboardData.monthlyTrends
    : [
        { month: "Sep", enquiries: 0 },
        { month: "Oct", enquiries: 0 },
        { month: "Nov", enquiries: 0 },
        { month: "Dec", enquiries: 0 },
        { month: "Jan", enquiries: 0 },
        { month: "Feb", enquiries: 0 },
      ];

  // Derived Upcoming Departures
  const upcomingDepartures = dashboardData
    ? dashboardData.upcomingDepartures.map((d) => ({
        id: d.id,
        tripName: d.tripName,
        tripImage: d.tripImage,
        displayDate: d.displayDate,
        spotsLeft: d.spotsLeft,
      }))
    : fallbackInstances
        .filter((i) => i.status === "upcoming")
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4)
        .map((instance) => {
          const trip = fallbackTrips.find((t) => t.id === instance.tripId || (t.slug && t.slug === instance.tripId));
          return {
            id: instance.id,
            tripName: trip?.name ?? (instance.tripId && instance.tripId.length > 30 ? "Himalayan Journey" : instance.tripId),
            tripImage: trip?.image || null,
            displayDate: instance.displayDate,
            spotsLeft: instance.spotsLeft,
          };
        });

  // Derived Recent Enquiries
  const recentEnquiries = dashboardData
    ? dashboardData.recentEnquiries.map((e) => ({
        id: e.id,
        name: e.customerName,
        tripName: e.tripName,
        travelDate: e.travelDate,
        status: e.status,
      }))
    : fallbackEnquiries.slice(-5).reverse().map((e) => ({
        id: e.id,
        name: e.name,
        tripName: e.tripName,
        travelDate: e.travelDate,
        status: e.status,
      }));

  return (
    <div className="p-6 space-y-6">
      {/* Title & Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            Dashboard
          </h2>
          <p className="text-[#718096] text-sm mt-0.5">Welcome back — here is your real-time operational overview.</p>
        </div>
        <button
          onClick={() => void fetchDashboardData(true)}
          disabled={loading || refreshing}
          className="text-xs font-semibold text-[#0f2922] hover:bg-[#f0f4f1] border border-[#e2e8f0] px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Refresh dashboard metrics"
        >
          <svg
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#e8622a]" : "text-[#718096]"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>Could not connect to live backend metrics ({error}). Displaying local cached data.</span>
          </div>
          <button
            onClick={() => void fetchDashboardData(false)}
            className="text-xs font-semibold text-[#e8622a] hover:underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm transition hover:shadow">
            <span className="text-xs text-[#718096] block mb-1">{kpi.label}</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${kpi.color}`}>
                {loading && !dashboardData ? (
                  <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" />
                ) : (
                  kpi.value
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Upcoming Departures */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enquiry Trends */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-[#0f2922]">Enquiry Trends</h3>
            <span className="text-[11px] font-medium text-[#718096] bg-[#f7f8f5] px-2 py-0.5 rounded-full border border-[#e2e8f0]">
              {monthlyTrends.length > 0
                ? `${monthlyTrends[0].month} – ${monthlyTrends[monthlyTrends.length - 1].month}`
                : "6-Month Trend"}
            </span>
          </div>
          <p className="text-xs text-[#718096] mb-4">Monthly customer inquiries received across all channels</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f1" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#718096" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#718096" }} />
                <Tooltip
                  formatter={(value: any) => [`${value} Enquiries`, "Inquiries"]}
                  contentStyle={{ backgroundColor: "#0f2922", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="enquiries" fill="#0f2922" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Departures */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#0f2922]">Upcoming Departures</h3>
            <Link
              to="/admin/trip-instances"
              onClick={() => setAdminPage?.("trip-instances")}
              className="text-[#e8622a] text-xs font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3 flex-1">
            {upcomingDepartures.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <span className="text-2xl mb-1">🏔️</span>
                <p className="text-xs text-[#a0aec0]">No upcoming departures scheduled</p>
              </div>
            ) : (
              upcomingDepartures.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#f7f8f5] hover:bg-[#f0f4f1] transition">
                  {item.tripImage ? (
                    <img src={item.tripImage} alt={item.tripName} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#0f2922] text-white flex items-center justify-center font-serif text-xs shrink-0">
                      Y
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#0f2922] truncate">{item.tripName}</div>
                    <div className="text-[11px] text-[#718096]">{item.displayDate}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.spotsLeft <= 3 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}>
                      {item.spotsLeft} left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Enquiries */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0]">
          <div>
            <h3 className="font-semibold text-[#0f2922]">Recent Enquiries</h3>
            <p className="text-xs text-[#718096] mt-0.5">Latest customer submissions received</p>
          </div>
          <Link
            to="/admin/enquiries"
            onClick={() => setAdminPage?.("enquiries")}
            className="text-[#e8622a] text-sm font-medium hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase font-medium">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Trip</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1]">
              {recentEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#a0aec0]">
                    No enquiries recorded yet
                  </td>
                </tr>
              ) : (
                recentEnquiries.map((e) => (
                  <tr key={e.id} className="hover:bg-[#f7f8f5] transition">
                    <td className="px-5 py-3 font-medium text-[#0f2922]">
                      <Link to={`/admin/enquiries/${e.id}`} className="hover:text-[#e8622a] transition">
                        {e.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[#4a5568]">{e.tripName}</td>
                    <td className="px-5 py-3 text-[#718096]">{e.travelDate}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_BADGE[e.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/admin/enquiries/${e.id}`}
                        className="text-[#e8622a] hover:underline text-xs font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-[#0f2922] mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Add Trip", icon: "🏔️", path: "/admin/trips/new", page: "trip-editor" as AdminPage },
            { label: "Add Destination", icon: "📍", path: "/admin/destinations", page: "destinations" as AdminPage },
            { label: "View Enquiries", icon: "📋", path: "/admin/enquiries", page: "enquiries" as AdminPage },
            { label: "Manage Departures", icon: "📅", path: "/admin/trip-instances", page: "trip-instances" as AdminPage },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.path}
              onClick={() => setAdminPage?.(action.page)}
              className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col items-center gap-2 hover:border-[#0f2922] hover:shadow-sm transition"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium text-[#0f2922]">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
