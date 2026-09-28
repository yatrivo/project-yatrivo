import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import {
  settingsApi,
  type CancellationRule,
  type AllSettings,
} from "@/api/settings";
import { authApi } from "@/api/auth";
import ForgotPasswordModal from "./ForgotPasswordModal";

type SubNav = "general" | "contact" | "social" | "cancellation" | "security";

const SUB_NAV: { id: SubNav; label: string; icon?: string }[] = [
  { id: "general", label: "General" },
  { id: "contact", label: "Contact Details" },
  { id: "social", label: "Social Media" },
  { id: "cancellation", label: "Cancellation Policy" },
  { id: "security", label: "Security & Password" },
];

export default function AdminSettings() {
  const { showToast, adminRole, adminUser, adminLogout, refreshSettings } = useApp();
  const navigate = useNavigate();

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
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);

  // General
  const [tagline, setTagline] = useState("Explore More. Travel Better.");
  const [siteDescription, setSiteDescription] = useState(
    "Uttarakhand's premium travel collective for mindful explorers. We design high-fidelity mountain retreats, spiritual pilgrimages, and raw alpine treks."
  );

  // Contact — Public Website
  const [phone, setPhone] = useState("+91 98765 43210");
  const [whatsapp, setWhatsapp] = useState("+91 98765 43210");
  const [contactEmail, setContactEmail] = useState("hello@yatrivo.com");
  const [address, setAddress] = useState("Rajpur Road, Dehradun, Uttarakhand, 248001");
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

  // Security / Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Load all settings from backend on mount
  useEffect(() => {
    async function loadAllSettings() {
      try {
        setLoadingInitial(true);
        const data: AllSettings = await settingsApi.getAllSettings();
        if (data.general) {
          if (data.general.tagline) setTagline(data.general.tagline);
          if (data.general.siteDescription) setSiteDescription(data.general.siteDescription);
        }
        if (data.contact) {
          if (data.contact.phone) setPhone(data.contact.phone);
          if (data.contact.whatsapp) setWhatsapp(data.contact.whatsapp);
          if (data.contact.contactEmail) setContactEmail(data.contact.contactEmail);
          if (data.contact.address) setAddress(data.contact.address);
          if (data.contact.inquiryWhatsapp) setInquiryWhatsapp(data.contact.inquiryWhatsapp);
        }
        if (data.social) {
          if (data.social.instagram) setInstagram(data.social.instagram);
          if (data.social.youtube) setYoutube(data.social.youtube);
          if (data.social.facebook) setFacebook(data.social.facebook);
          if (data.social.twitter) setTwitter(data.social.twitter);
        }
        if (data.cancellation_policy && Array.isArray(data.cancellation_policy.rules) && data.cancellation_policy.rules.length > 0) {
          setRules(data.cancellation_policy.rules);
        }
      } catch (err) {
        console.warn("Could not load settings from backend:", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    void loadAllSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (subNav === "general") {
        await settingsApi.updateSetting("general", { tagline, siteDescription });
        await refreshSettings();
        showToast("General settings updated successfully!", "success");
      } else if (subNav === "contact") {
        await settingsApi.updateSetting("contact", {
          phone,
          whatsapp,
          contactEmail,
          address,
          inquiryWhatsapp,
        });
        await refreshSettings();
        showToast("Contact details updated successfully!", "success");
      } else if (subNav === "social") {
        await settingsApi.updateSetting("social", {
          instagram,
          youtube,
          facebook,
          twitter,
        });
        await refreshSettings();
        showToast("Social media links updated successfully!", "success");
      } else if (subNav === "cancellation") {
        await settingsApi.updateSetting("cancellation_policy", {
          title: "Global Cancellation & Refund Policy",
          description: "Our mindful Himalayan trips prioritize small-group planning and authentic village stays.",
          rules,
        });
        await refreshSettings();
        showToast("Cancellation policy updated globally!", "success");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update settings";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!oldPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: oldPassword,
        newPassword
      });

      showToast("Password changed successfully! Please log in with your new credentials.", "success");
      
      // Clear password fields
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Log out and redirect to login as specified
      await adminLogout();
      navigate("/admin/login?changed=true", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password";
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleForgotSuccess = () => {
    setForgotModalOpen(false);
    showToast("Password reset link sent to your email.", "info");
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
      <div className="w-52 shrink-0 bg-white border-r border-[#e2e8f0] py-4 px-2 space-y-0.5">
        {SUB_NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setSubNav(n.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition relative cursor-pointer ${
              subNav === n.id ? "bg-[#f0f9f4] text-[#0f2922]" : "text-[#718096] hover:bg-[#f7f8f5]"
            }`}
          >
            {subNav === n.id && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#e8622a] rounded-r" />
            )}
            {n.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">

          {loadingInitial ? (
            <div className="flex items-center justify-center py-20 text-[#718096] text-sm gap-2">
              <div className="w-5 h-5 border-2 border-[#0f2922]/20 border-t-[#0f2922] rounded-full animate-spin" />
              Loading settings...
            </div>
          ) : (
            <>
              {subNav === "general" && (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                      General Settings
                    </h2>
                    <p className="text-sm text-[#718096] mt-0.5">
                      Controls brand presentation across the public website, navigation bar, and footer.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <Field
                      label="Brand Tagline"
                      hint="Shown across the top navigation bar, footer logo, splash screen, and browser tab."
                      value={tagline}
                      onChange={setTagline}
                    />

                    <div>
                      <label className="block text-sm font-medium text-[#4a5568] mb-1">Site Description</label>
                      <p className="text-xs text-[#a0aec0] mb-1.5">
                        Displayed in the public footer brand overview and used for SEO meta description.
                      </p>
                      <textarea
                        rows={3}
                        value={siteDescription}
                        onChange={(e) => setSiteDescription(e.target.value)}
                        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
                      />
                    </div>

                    <div className="p-4 bg-[#f7f8f5] rounded-xl border border-[#e2e8f0] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#0f2922] text-white flex items-center justify-center font-serif font-bold text-sm">
                        Y
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#0f2922]">Live Brand Preview</div>
                        <div className="text-xs text-[#e8622a] font-medium tracking-wider uppercase mt-0.5">
                          {tagline || "EXPLORE MORE. TRAVEL BETTER."}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {subNav === "contact" && (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                      Contact Details
                    </h2>
                    <p className="text-sm text-[#718096] mt-0.5">
                      Contact information displayed on the website and routing for customer inquiries.
                    </p>
                  </div>

                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold text-[#0f2922] border-b border-[#e2e8f0] pb-2">
                      Public Website Contact
                    </h3>
                    <Field label="Contact Phone Number" value={phone} onChange={setPhone} />
                    <Field label="Public WhatsApp Number" value={whatsapp} onChange={setWhatsapp} />
                    <Field label="Contact Email" value={contactEmail} onChange={setContactEmail} type="email" />
                    <div>
                      <label className="block text-sm font-medium text-[#4a5568] mb-1">Physical Address</label>
                      <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
                      />
                    </div>
                  </section>

                  <div className="border-t border-[#e2e8f0] pt-5 space-y-4">
                    <h3 className="text-sm font-semibold text-[#0f2922]">Inquiry Notification WhatsApp</h3>
                    <p className="text-xs text-[#718096] -mt-2">
                      Internal phone number that receives instant customer inquiry notifications (e.g. your operations team).
                    </p>
                    <Field label="Notification WhatsApp Number" value={inquiryWhatsapp} onChange={setInquiryWhatsapp} />
                  </div>
                </>
              )}

              {subNav === "social" && (
                <>
                  <div>
                    <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                      Social Media Links
                    </h2>
                    <p className="text-sm text-[#718096] mt-0.5">
                      Social profile URLs connected to the icons in the website footer.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Field label="Instagram Profile URL" value={instagram} onChange={setInstagram} placeholder="https://instagram.com/yatrivo" />
                    <Field label="YouTube Channel URL" value={youtube} onChange={setYoutube} placeholder="https://youtube.com/@yatrivo" />
                    <Field label="Facebook Page URL" value={facebook} onChange={setFacebook} placeholder="https://facebook.com/yatrivo" />
                    <Field label="Twitter / X Profile URL" value={twitter} onChange={setTwitter} placeholder="https://twitter.com/yatrivo" />
                  </div>
                </>
              )}

              {subNav === "cancellation" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                      Global Cancellation Policy
                    </h2>
                    <p className="text-sm text-[#718096] mt-0.5">
                      Configure the refund timeline rules displayed globally across all trip detail pages and bookings.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-[#0f2922]">Refund Timeline Rules</label>
                      <button
                        type="button"
                        onClick={addRule}
                        className="text-xs text-[#e8622a] hover:text-[#d4541f] font-semibold flex items-center gap-1 cursor-pointer"
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
                                    className="text-gray-400 hover:text-red-500 transition text-sm p-1 cursor-pointer"
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

              {subNav === "security" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                      Security & Password
                    </h2>
                    <p className="text-sm text-[#718096] mt-0.5">
                      Manage administrative credentials and security options.
                    </p>
                  </div>

                  {/* Change Password Form */}
                  <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-[#e2e8f0]">
                      <div className="w-10 h-10 rounded-xl bg-[#f0f9f4] text-[#1a6b4a] flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[#0f2922]">Change Admin Password</h3>
                        <p className="text-xs text-[#718096]">
                          Logged in as: <span className="font-semibold text-[#0f2922]">{adminUser?.email || "yatrivo3@gmail.com"}</span>
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-[#4a5568] mb-1">Old / Current Password</label>
                        <div className="relative">
                          <input
                            type={showOldPw ? "text" : "password"}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:border-[#0f2922]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPw(!showOldPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showOldPw ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#4a5568] mb-1">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPw ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimum 8 characters"
                            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:border-[#0f2922]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw(!showNewPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPw ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#4a5568] mb-1">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPw ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:border-[#0f2922]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPw(!showConfirmPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPw ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            )}
                          </button>
                        </div>
                      </div>

                      {passwordError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-xs">
                          {passwordError}
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-2"
                        >
                          {passwordLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Updating Password...
                            </>
                          ) : (
                            "Submit & Log Out"
                          )}
                        </button>
                        <p className="text-xs text-[#718096] mt-2">
                          * As a security precaution, updating your password will immediately end your current administrative session and prompt you to log in with your new password.
                        </p>
                      </div>
                    </form>
                  </div>

                  {/* Forgot Password Section */}
                  <div className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-[#0f2922]">Forgot your current password?</h4>
                      <p className="text-xs text-[#718096] mt-0.5">
                        Reset your credentials using a verification code sent to your registered admin email.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="border border-[#e8622a] text-[#e8622a] hover:bg-orange-50 text-xs font-semibold px-4 py-2 rounded-lg transition shrink-0 cursor-pointer"
                    >
                      Reset via Email
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Save Changes Button (only for general, contact, social, cancellation) */}
              {subNav !== "security" && (
                <div className="pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        initialEmail={adminUser?.email || "yatrivo3@gmail.com"}
        onSuccess={handleForgotSuccess}
      />
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#4a5568] mb-1">{label}</label>
      {hint && <p className="text-xs text-[#a0aec0] mb-1.5">{hint}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
      />
    </div>
  );
}
