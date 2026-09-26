import { Link } from "react-router-dom";
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
  setAdminPage?: (p: AdminPage) => void;
}

export default function AdminDashboard({ setAdminPage }: Props = {}) {
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
      const trip = trips.find((t) => t.id === instance.tripId || (t.slug && t.slug === instance.tripId));
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
            <span className="text-xs text-[#718096] block mb-1">{kpi.label}</span>
            <span className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Chart + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enquiry Trends */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm">
          <h3 className="font-semibold text-[#0f2922] mb-1">Enquiry Trends</h3>
          <p className="text-xs text-[#718096] mb-4">Monthly inquiries received across all channels</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f1" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#718096" }} />
                <YAxis tick={{ fontSize: 12, fill: "#718096" }} />
                <Tooltip
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
              <p className="text-xs text-[#a0aec0] text-center py-6">No upcoming departures</p>
            ) : upcomingDepartures.map(({ instance, trip }) => (
              <div key={instance.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#f7f8f5]">
                {trip?.image && (
                  <img src={trip.image} alt={trip.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#0f2922] truncate">{trip?.name ?? (instance.tripId && instance.tripId.length > 30 ? "Himalayan Journey" : instance.tripId)}</div>
                  <div className="text-[11px] text-[#718096]">{instance.displayDate}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    instance.spotsLeft <= 3 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}>
                    {instance.spotsLeft} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Enquiries */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#e2e8f0]">
          <h3 className="font-semibold text-[#0f2922]">Recent Enquiries</h3>
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
              {recent.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-[#a0aec0]">No enquiries yet</td></tr>
              ) : recent.map((e) => (
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
            { label: "Add Trip", icon: "🏔️", path: "/admin/trips/new", page: "trip-editor" as AdminPage },
            { label: "Add Destination", icon: "📍", path: "/admin/destinations", page: "destinations" as AdminPage },
            { label: "View Enquiries", icon: "📋", path: "/admin/enquiries", page: "enquiries" as AdminPage },
            { label: "Manage Reviews", icon: "⭐", path: "/admin/reviews", page: "reviews" as AdminPage },
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
