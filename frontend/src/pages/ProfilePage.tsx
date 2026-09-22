import { useState } from "react";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";

const TABS = ["Personal Info", "Saved Trips", "My Enquiries", "Settings"];

export default function ProfilePage() {
  const { savedItems, enquiries, navigate, showToast } = useApp();
  const [tab, setTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("Traveller");
  const [email, setEmail] = useState("");

  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const statusColor = (s: string) => ({
    Submitted: "bg-blue-50 text-blue-700",
    Processing: "bg-yellow-50 text-yellow-700",
    Confirmed: "bg-green-50 text-green-700",
    Completed: "bg-gray-100 text-gray-600",
  }[s] ?? "bg-gray-100 text-gray-600");

  return (
    <div className="min-h-screen bg-[#f7f8f5]">
      {/* Header banner */}
      <div className="bg-[#0f2922] text-white pt-24 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-[#e8622a] flex items-center justify-center text-2xl font-bold shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl" style={{ fontFamily: "var(--font-serif)" }}>{name}</h1>
            <p className="text-white/60 text-sm">{email || "yatrivo traveller"}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#e2e8f0] rounded-xl p-1 mb-8 overflow-x-auto">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`flex-1 min-w-max px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === i ? "bg-[#0f2922] text-white" : "text-[#4a5568] hover:text-[#0f2922]"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 0 && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[#0f2922] text-xl" style={{ fontFamily: "var(--font-serif)" }}>Personal Information</h2>
              <button onClick={() => setEditing(!editing)} className="text-[#e8622a] text-sm font-medium">
                {editing ? "Cancel" : "Edit"}
              </button>
            </div>
            <div className="space-y-5">
              {[
                { label: "Full Name", value: name, setter: setName, editable: true },
                { label: "Email Address", value: email, setter: setEmail, editable: true },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-[#0f2922] text-xs uppercase tracking-wider font-medium mb-1.5 block">{f.label}</label>
                  {editing && f.editable ? (
                    <input value={f.value} onChange={(e) => (f.setter as (v: string) => void)(e.target.value)} className="w-full border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f2922]" />
                  ) : (
                    <p className="text-[#4a5568] text-sm px-4 py-2.5 bg-[#f7f8f5] rounded-lg">{f.value || <span className="italic text-[#94a3b8]">Not set</span>}</p>
                  )}
                </div>
              ))}
              {editing && (
                <button onClick={() => { setEditing(false); showToast("Profile updated successfully!", "success"); }} className="bg-[#0f2922] text-white px-6 py-2.5 rounded-full text-sm font-medium">
                  Save Changes
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 1 && (
          <div>
            {savedItems.size === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center">
                <div className="text-4xl mb-4">🏔️</div>
                <h3 className="text-[#0f2922] text-lg mb-2" style={{ fontFamily: "var(--font-serif)" }}>No Saved Trips Yet</h3>
                <p className="text-[#4a5568] text-sm mb-5">Heart any destination or package to save it here.</p>
                <button onClick={() => navigate("trips")} className="bg-[#0f2922] text-white px-6 py-2.5 rounded-full text-sm">Browse Trips</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from(savedItems).map((id) => (
                  <div key={id} className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex items-center justify-between">
                    <div>
                      <div className="text-[#0f2922] font-medium text-sm capitalize">{id}</div>
                      <div className="text-[#4a5568] text-xs mt-0.5">Saved destination</div>
                    </div>
                    <button onClick={() => navigate("destination-detail", { destId: id })} className="text-[#e8622a] text-xs font-medium">View →</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 2 && (
          <div>
            {enquiries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-[#0f2922] text-lg mb-2" style={{ fontFamily: "var(--font-serif)" }}>No Enquiries Yet</h3>
                <p className="text-[#4a5568] text-sm mb-5">When you book or enquire about a trip, it'll appear here.</p>
                <button onClick={() => navigate("trips")} className="bg-[#0f2922] text-white px-6 py-2.5 rounded-full text-sm">Explore Trips</button>
              </div>
            ) : (
              <div className="space-y-4">
                {enquiries.map((e) => (
                  <div key={e.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[#0f2922] font-medium">{e.tripName}</div>
                        <div className="text-[#4a5568] text-sm mt-0.5">{e.destination} · {e.travellers} travellers · {e.travelDate}</div>
                        <div className="text-[#94a3b8] text-xs mt-1">Submitted {e.submittedAt} · {e.id}</div>
                      </div>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${statusColor(e.status)}`}>{e.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-7">
              <h3 className="text-[#0f2922] font-medium mb-4">Preferences</h3>
              {[
                { label: "Email notifications for new trips", checked: true },
                { label: "WhatsApp updates on bookings", checked: true },
                { label: "Travel tips & destination stories", checked: false },
              ].map((p) => (
                <label key={p.label} className="flex items-center justify-between py-3 border-b border-[#e2e8f0] last:border-0 cursor-pointer">
                  <span className="text-sm text-[#4a5568]">{p.label}</span>
                  <input type="checkbox" defaultChecked={p.checked} className="rounded" />
                </label>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-7">
              <h3 className="text-[#0f2922] font-medium mb-4">Account</h3>
              <button
                onClick={() => { navigate("home"); showToast("Returned to home.", "info"); }}
                className="flex items-center gap-2 text-red-600 text-sm font-medium hover:text-red-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                Go Home
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
