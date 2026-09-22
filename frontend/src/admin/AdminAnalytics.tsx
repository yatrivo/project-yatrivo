import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const RANGES = ["Last 7 days", "Last 30 days", "Last 90 days"] as const
type Range = typeof RANGES[number]

const generateTrend = (days: number) =>
  Array.from({ length: days }, (_, i) => ({
    day: `Day ${i + 1}`,
    visitors: Math.floor(Math.random() * 500 + 200),
  }))

const ENQUIRY_SOURCES = [
  { source: "WhatsApp", enquiries: 58 },
  { source: "Direct", enquiries: 34 },
  { source: "Instagram", enquiries: 29 },
  { source: "Google", enquiries: 21 },
]

const TRAFFIC_PIE = [
  { name: "Organic", value: 45 },
  { name: "Social", value: 30 },
  { name: "Direct", value: 15 },
  { name: "Referral", value: 10 },
]

const PIE_COLORS = ["#0f2922", "#e8622a", "#3b82f6", "#f59e0b"]

const TOP_TRIPS = [
  { name: "Chopta Tungnath Trek", enquiries: 38, views: 1420 },
  { name: "Rishikesh Rapids", enquiries: 27, views: 980 },
  { name: "Kedarnath Trek", enquiries: 25, views: 1100 },
  { name: "Auli Ski Adventure", enquiries: 21, views: 760 },
  { name: "Mussoorie Getaway", enquiries: 18, views: 640 },
]

const KPI_DATA: Record<Range, {
  visitors: string
  enquiries: string
  conversion: string
  session: string
}> = {
  "Last 7 days": {
    visitors: "2,841",
    enquiries: "32",
    conversion: "3.4%",
    session: "2m 32s",
  },
  "Last 30 days": {
    visitors: "12,430",
    enquiries: "142",
    conversion: "3.2%",
    session: "2m 45s",
  },
  "Last 90 days": {
    visitors: "38,120",
    enquiries: "421",
    conversion: "3.1%",
    session: "2m 58s",
  },
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>("Last 30 days")
  const kpi = KPI_DATA[range]
  const days = range === "Last 7 days" ? 7 : range === "Last 30 days" ? 30 : 90
  const trend = generateTrend(days)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            className="text-2xl font-bold text-[#0f2922]"
            style={{ fontFamily: "var(--font-serif, serif)" }}
          >
            Analytics
          </h2>
          <p className="text-[#718096] text-sm mt-0.5">Performance overview</p>
        </div>
        <div className="flex gap-1 bg-[#f7f8f5] rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                range === r
                  ? "bg-white text-[#0f2922] shadow-sm"
                  : "text-[#718096] hover:text-[#0f2922]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Visitors", value: kpi.visitors, icon: "👥" },
          { label: "Enquiries", value: kpi.enquiries, icon: "📋" },
          { label: "Conversion Rate", value: kpi.conversion, icon: "📈" },
          { label: "Avg Session", value: kpi.session, icon: "⏱️" },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{k.icon}</span>
              <p className="text-xs text-[#718096] uppercase font-medium">
                {k.label}
              </p>
            </div>
            <p
              className="text-2xl font-bold text-[#0f2922]"
              style={{ fontFamily: "var(--font-serif, serif)" }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
          <h3 className="font-semibold text-[#0f2922] mb-4">Visitor Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10 }}
                tickLine={false}
                interval={Math.floor(days / 6)}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="visitors"
                stroke="#e8622a"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
          <h3 className="font-semibold text-[#0f2922] mb-4">
            Enquiries by Source
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ENQUIRY_SOURCES}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="source" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="enquiries" fill="#0f2922" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
          <h3 className="font-semibold text-[#0f2922] mb-4">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={TRAFFIC_PIE}
                cx="50%"
                cy="50%"
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {TRAFFIC_PIE.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={8} />
              <Tooltip formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
          <h3 className="font-semibold text-[#0f2922] mb-4">Popular Trips</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#4a5568] text-xs uppercase font-medium border-b border-[#e2e8f0]">
                <th className="pb-2 text-left">Trip</th>
                <th className="pb-2 text-right">Enquiries</th>
                <th className="pb-2 text-right">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f1]">
              {TOP_TRIPS.map((t, i) => (
                <tr key={i}>
                  <td className="py-2.5 text-[#0f2922] font-medium text-xs">
                    {t.name}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="bg-[#0f2922] text-white text-xs rounded-full px-2 py-0.5">
                      {t.enquiries}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-[#718096] text-xs">
                    {t.views.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
