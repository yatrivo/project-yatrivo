import { useApp } from "@/context/AppContext";
import type { AdminPage } from "./AdminLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const monthlyData = [
  { month: "Apr", enquiries: 18 },
  { month: "May", enquiries: 24 },
  { month: "Jun", enquiries: 31 },
  { month: "Jul", enquiries: 22 },
  { month: "Aug", enquiries: 27 },
  { month: "Sep", enquiries: 20 },
];

const STATUS_BADGE: Record<string, string> = {
  Received: "bg-blue-100 text-blue-700",
  Contacted: "bg-yellow-100 text-yellow-700",
  Quoted: "bg-purple-100 text-purple-700",
  Confirmed: "bg-green-100 text-green-700",
  Lost: "bg-red-100 text-red-700",
  Cancelled: "bg-gray-100 text-gray-600",
};

interface Props {
  setAdminPage: (p: AdminPage) => void;
}

export default function AdminDashboard({ setAdminPage }: Props) {
  const { enquiries, trips, tripInstances } = useApp();
  const recent = enquiries.slice(-5).reverse();

  const totalEnquiries = enquiries.length;
  const newReceived = enquiries.filter((e) => e.status === "Received").length;
  const confirmedBookings = enquiries.filter((e) => e.status === "Confirmed").length;
  const upcomingTrips = tripInstances.filter((i) => i.status === "upcoming").length;
  const completedTrips = tripInstances.filter((i) => i.status === "completed").length;

  const upcomingDepartures = tripInstances
    .filter((i) => i.status === "upcoming")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)
    .map((instance) => {
      const trip = trips.find((t) => t.id === instance.tripId);
      return { instance, trip };
    });

  const kpis = [
    { label: "Total Enquiries", value: totalEnquiries, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "New / Received", value: newReceived, color: "text-[#e8622a]", bg: "bg-orange-50" },
    { label: "Confirmed Bookings", value: confirmedBookings, color: "text-green-600", bg: "bg-green-50" },
    { label: "Upcoming Trips", value: upcomingTrips, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Completed Trips", value: completedTrips, color: "text-[#0f2922]", bg: "bg-[#f0f4f1]" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Dashboard</h2>
        <p className="text-[#718096] text-sm mt-1">Welcome back — here's what's happening.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
            <p className="text-xs text-[#718096] uppercase font-medium mb-1">{kpi.label}</p>
            <p className="text-3xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>{kpi.value}</p>
            <span className={`text-xs font-medium ${kpi.color} ${kpi.bg} rounded-full px-2 py-0.5 mt-2 inline-block`}>Live</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
          <h3 className="font-semibold text-[#0f2922] mb-4">Monthly Enquiries</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="enquiries" fill="#0f2922" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
          <h3 className="font-semibold text-[#0f2922] mb-4">Upcoming Departures</h3>
          {upcomingDepartures.length === 0 ? (
            <p className="text-[#a0aec0] text-sm py-8 text-center">No upcoming departures</p>
          ) : (
            <div className="space-y-3">
              {upcomingDepartures.map(({ instance, trip }) => (
                <div key={instance.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#f7f8f5]">
                  <div className="w-10 h-10 rounded-lg bg-[#0f2922] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0f2922] truncate">{trip?.name ?? "Unknown Trip"}</p>
                    <p className="text-xs text-[#718096]">{instance.displayDate}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-[#0f2922]">{instance.spotsLeft}/{instance.spotsTotal}</p>
                    <p className="text-xs text-[#a0aec0]">spots left</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Enquiries */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0]">
          <h3 className="font-semibold text-[#0f2922]">Recent Enquiries</h3>
          <button onClick={() => setAdminPage("enquiries")} className="text-[#e8622a] text-sm font-medium hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase font-medium">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Trip</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1]">
              {recent.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-[#a0aec0]">No enquiries yet</td></tr>
              ) : recent.map((e) => (
                <tr key={e.id} className="hover:bg-[#f7f8f5] transition">
                  <td className="px-5 py-3 font-medium text-[#0f2922]">{e.name}</td>
                  <td className="px-5 py-3 text-[#4a5568]">{e.tripName}</td>
                  <td className="px-5 py-3 text-[#718096]">{e.travelDate}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_BADGE[e.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-[#0f2922] mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Add Trip", icon: "🏔️", page: "trip-editor" as AdminPage },
            { label: "Add Destination", icon: "📍", page: "destinations" as AdminPage },
            { label: "View Enquiries", icon: "📋", page: "enquiries" as AdminPage },
            { label: "Manage Reviews", icon: "⭐", page: "reviews" as AdminPage },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => setAdminPage(action.page)}
              className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col items-center gap-2 hover:border-[#0f2922] hover:shadow-sm transition"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium text-[#0f2922]">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
