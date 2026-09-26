import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { settingsApi, type CancellationPolicyData, type CancellationRule } from "@/api/settings";

type SubNav = "general" | "contact" | "social" | "cancellation";

const SUB_NAV: { id: SubNav; label: string }[] = [
  { id: "general", label: "General" },
  { id: "contact", label: "Contact Details" },
  { id: "social", label: "Social Media" },
  { id: "cancellation", label: "Cancellation Policy" },
];

export default function AdminSettings() {
  const { showToast, adminRole } = useApp();

  if (adminRole !== "superAdmin") {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-[#f0f4f1] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#a3bfb5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Access Restricted</h3>
        <p className="text-[#718096] text-sm">Settings are restricted to Super Admin only.</p>
      </div>
    );
  }

  const [subNav, setSubNav] = useState<SubNav>("general");

  // General
  const [tagline, setTagline] = useState("Explore the Himalayas with Us");
  const [siteDescription, setSiteDescription] = useState("Curated Himalayan adventures for the curious traveller.");

  // Contact — Public Website
  const [phone, setPhone] = useState("+91 98765 43210");
  const [whatsapp, setWhatsapp] = useState("+91 98765 43210");
  const [contactEmail, setContactEmail] = useState("hello@yatrivo.com");
  const [address, setAddress] = useState("Rishikesh, Uttarakhand, India");
  // Contact — Inquiry notification number
  const [inquiryWhatsapp, setInquiryWhatsapp] = useState("+91 98765 43210");

  // Social
  const [instagram, setInstagram] = useState("https://instagram.com/yatrivo");
  const [youtube, setYoutube] = useState("https://youtube.com/@yatrivo");
  const [facebook, setFacebook] = useState("https://facebook.com/yatrivo");
  const [twitter, setTwitter] = useState("https://twitter.com/yatrivo");

  // Global Cancellation Policy
  const [rules, setRules] = useState<CancellationRule[]>([
    { days: "30+ days before departure", refund: "100%", note: "Full refund (less nominal processing fee)" },
    { days: "15–29 days before departure", refund: "50%", note: "50% refund or 100% trip credit voucher" },
    { days: "Under 15 days before departure", refund: "0%", note: "Non-refundable due to reserved cabin & permit logistics" },
  ]);
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    async function loadPolicy() {
      try {
        const p = await settingsApi.getCancellationPolicy();
        if (p && p.rules && p.rules.length > 0) {
          setRules(p.rules);
        }
      } catch (err) {
        console.warn("Could not load cancellation policy from backend:", err);
      }
    }
    void loadPolicy();
  }, []);

  const handleSave = async () => {
    if (subNav === "cancellation") {
      setSavingPolicy(true);
      try {
        await settingsApi.updateCancellationPolicy({
          title: "Global Cancellation & Refund Policy",
          description: "",
          rules,
        });
        showToast("Cancellation policy updated globally!", "success");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update cancellation policy";
        showToast(msg, "error");
      } finally {
        setSavingPolicy(false);
      }
    } else {
      showToast("Settings saved successfully!", "success");
    }
  };

  const updateRule = (index: number, field: keyof CancellationRule, val: string) => {
    setRules((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const addRule = () => {
    setRules((prev) => [...prev, { days: "New rule", refund: "0%", note: "" }]);
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-full">
      {/* Sub nav */}
      <div className="w-48 shrink-0 bg-white border-r border-[#e2e8f0] py-4 px-2 space-y-0.5">
        {SUB_NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setSubNav(n.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition relative ${
              subNav === n.id ? "bg-[#f0f9f4] text-[#0f2922]" : "text-[#718096] hover:bg-[#f7f8f5]"
            }`}
          >
            {subNav === n.id && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#e8622a] rounded-r" />}
            {n.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">

          {subNav === "general" && (
            <>
              <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>General Settings</h2>
              <p className="text-sm text-[#718096] -mt-3">Controls visible content across the public website.</p>
              <div className="space-y-4">
                <Field label="Tagline" hint="Shown in the homepage hero and browser tab." value={tagline} onChange={setTagline} />
                <Field label="Site Description" hint="Used in meta descriptions and the About section." value={siteDescription} onChange={setSiteDescription} />
              </div>
            </>
          )}

          {subNav === "contact" && (
            <>
              <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Contact Details</h2>

              <section>
                <h3 className="text-sm font-semibold text-[#0f2922] mb-1">Public Website Contact</h3>
                <p className="text-xs text-[#718096] mb-4">Displayed on the Contact / FAQ page for customers to reach you.</p>
                <div className="space-y-4">
                  <Field label="Phone" value={phone} onChange={setPhone} />
                  <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} />
                  <Field label="Email" value={contactEmail} onChange={setContactEmail} type="email" />
                  <Field label="Address" value={address} onChange={setAddress} />
                </div>
              </section>

              <div className="border-t border-[#e2e8f0] pt-5">
                <h3 className="text-sm font-semibold text-[#0f2922] mb-1">Inquiry Notification WhatsApp</h3>
                <p className="text-xs text-[#718096] mb-4">
                  Number that receives new inquiry WhatsApp notifications — not the same as the public contact number above.
                </p>
                <Field label="Notification WhatsApp Number" value={inquiryWhatsapp} onChange={setInquiryWhatsapp} />
              </div>
            </>
          )}

          {subNav === "social" && (
            <>
              <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Social Media</h2>
              <div className="space-y-4">
                <Field label="Instagram URL" value={instagram} onChange={setInstagram} />
                <Field label="YouTube URL" value={youtube} onChange={setYoutube} />
                <Field label="Facebook URL" value={facebook} onChange={setFacebook} />
                <Field label="Twitter / X URL" value={twitter} onChange={setTwitter} />
              </div>
            </>
          )}

          {subNav === "cancellation" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>Global Cancellation Policy</h2>
                <p className="text-sm text-[#718096] mt-1">Configure the refund timeline rules displayed globally across all trip detail pages and bookings.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-[#0f2922]">Refund Timeline Rules</label>
                  <button
                    type="button"
                    onClick={addRule}
                    className="text-xs text-[#e8622a] hover:text-[#d4541f] font-semibold flex items-center gap-1"
                  >
                    + Add Rule
                  </button>
                </div>
                <div className="border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f7f8f5] text-[#4a5568] text-xs uppercase font-medium border-b border-[#e2e8f0]">
                      <tr>
                        <th className="px-4 py-3 text-left">Days Before Travel</th>
                        <th className="px-4 py-3 text-left w-28">Refund %</th>
                        <th className="px-4 py-3 text-left">Note / Terms</th>
                        <th className="px-3 py-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f4f1]">
                      {rules.map((row, i) => (
                        <tr key={i} className="hover:bg-[#fafbfa]">
                          <td className="px-3 py-2.5">
                            <input
                              value={row.days}
                              onChange={(e) => updateRule(i, "days", e.target.value)}
                              className="w-full border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0f2922]"
                              placeholder="e.g. 30+ days before"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              value={row.refund}
                              onChange={(e) => updateRule(i, "refund", e.target.value)}
                              className="w-full border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#e8622a] focus:outline-none focus:border-[#0f2922]"
                              placeholder="e.g. 100%"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              value={row.note}
                              onChange={(e) => updateRule(i, "note", e.target.value)}
                              className="w-full border border-[#e2e8f0] rounded-lg px-2.5 py-1.5 text-xs text-[#718096] focus:outline-none focus:border-[#0f2922]"
                              placeholder="e.g. Full refund less processing fee"
                            />
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            {rules.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeRule(i)}
                                className="text-gray-400 hover:text-red-500 transition text-sm p-1"
                                title="Remove rule"
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={savingPolicy}
            className="bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition shadow-sm cursor-pointer"
          >
            {savingPolicy ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, hint, value, onChange, type = "text"
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#4a5568] mb-1">{label}</label>
      {hint && <p className="text-xs text-[#a0aec0] mb-1.5">{hint}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
      />
    </div>
  );
}
