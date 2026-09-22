import { useState } from "react";
import { useApp, type Enquiry } from "@/context/AppContext";

const TRIPS: Record<string, { name: string; dest: string }> = {
  "chopta-tungnath": { name: "Chopta Tungnath Adventure", dest: "Chopta, Uttarakhand" },
  "rishikesh-rapids": { name: "Rishikesh Escape & Rapids", dest: "Rishikesh, Uttarakhand" },
  "auli-ski": { name: "Auli Snow & Ski Collective", dest: "Auli, Uttarakhand" },
  "kedarnath-trek": { name: "Kedarnath Pilgrimage Trek", dest: "Kedarnath, Uttarakhand" },
  "mussoorie-colonial": { name: "Mussoorie Colonial Secret", dest: "Mussoorie, Uttarakhand" },
  "chakrata-woods": { name: "Chakrata Cascade & Woods", dest: "Chakrata, Uttarakhand" },
};

export default function EnquiryModal() {
  const { enquiryModalOpen, closeEnquiryModal, enquiryTripId, addEnquiry, showToast } = useApp();

  const trip = TRIPS[enquiryTripId] || { name: enquiryTripId, dest: "Uttarakhand" };

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    travelDate: "",
    travellers: "2",
    pickupCity: "",
    message: "",
  });
  const [step, setStep] = useState<"form" | "loading" | "success">("form");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!enquiryModalOpen) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10) e.phone = "Valid mobile required";
    if (!form.travelDate) e.travelDate = "Select a travel date";
    return e;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep("loading");
    setTimeout(() => {
      const enquiry: Enquiry = {
        id: `ENQ-${Date.now()}`,
        tripName: trip.name,
        destination: trip.dest,
        travelDate: form.travelDate,
        travellers: form.travellers,
        submittedAt: new Date().toISOString().split("T")[0],
        status: "Received",
        name: form.name,
        phone: form.phone,
        email: form.email,
        pickupCity: form.pickupCity,
        message: form.message,
      };
      addEnquiry(enquiry);
      setStep("success");
    }, 1400);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `🏔️ *YATRIVO TRIP ENQUIRY*\n\n` +
      `*Trip:* ${trip.name}\n` +
      `*Destination:* ${trip.dest}\n` +
      `*Travel Date:* ${form.travelDate || "Flexible"}\n` +
      `*Travellers:* ${form.travellers}\n` +
      `*Pickup City:* ${form.pickupCity || "Not specified"}\n\n` +
      `*Contact:*\nName: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email || "Not provided"}\n\n` +
      `*Message:* ${form.message || "No special notes."}\n\n` +
      `_Sent via Yatrivo Website_`
    );
    window.open(`https://wa.me/919876543210?text=${msg}`, "_blank");
    handleSubmit();
  };

  const close = () => {
    closeEnquiryModal();
    setStep("form");
    setErrors({});
  };

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="text-[#0f2922] text-xs uppercase tracking-wider font-medium mb-1.5 block">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  const inputClass = "w-full border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]";

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={close}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: "var(--forest)" }} className="px-6 pt-6 pb-5 rounded-t-2xl sm:rounded-t-2xl">
          <button onClick={close} className="absolute top-4 right-4 text-white/60 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-1">ENQUIRE ABOUT</div>
          <h2 className="text-white text-xl" style={{ fontFamily: "var(--font-serif)" }}>{trip.name}</h2>
          <p className="text-white/60 text-sm mt-0.5">{trip.dest}</p>
        </div>

        <div className="p-6">
          {step === "loading" && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="w-10 h-10 border-2 border-[#0f2922] border-t-[#e8622a] rounded-full animate-spin" />
              <p className="text-[#4a5568] text-sm">Recording your enquiry…</p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="text-[#0f2922] text-xl mb-2" style={{ fontFamily: "var(--font-serif)" }}>Enquiry Received!</h3>
              <p className="text-[#4a5568] text-sm mb-6">Yatrivo will contact you shortly via WhatsApp or call on <strong>{form.phone}</strong>.</p>
              <button onClick={close} className="bg-[#0f2922] text-white px-8 py-3 rounded-full text-sm font-medium">Done</button>
            </div>
          )}

          {step === "form" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Your Name" error={errors.name}>
                  <input className={inputClass} placeholder="Jane Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="Phone / WhatsApp" error={errors.phone}>
                  <input className={inputClass} placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
                <Field label="Email (Optional)">
                  <input className={inputClass} placeholder="jane@email.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
                <Field label="Travel Date" error={errors.travelDate}>
                  <input className={inputClass} type="date" value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })} />
                </Field>
                <Field label="Number of Travellers">
                  <select className={inputClass + " appearance-none bg-white"} value={form.travellers} onChange={(e) => setForm({ ...form, travellers: e.target.value })}>
                    {["1", "2", "3", "4", "5", "6", "7", "8+"].map((n) => <option key={n}>{n}</option>)}
                  </select>
                </Field>
                <Field label="Pickup City">
                  <input className={inputClass} placeholder="Delhi, Dehradun…" value={form.pickupCity} onChange={(e) => setForm({ ...form, pickupCity: e.target.value })} />
                </Field>
              </div>
              <Field label="Message (Optional)">
                <textarea
                  rows={3}
                  className={inputClass + " resize-none"}
                  placeholder="Any special requirements, dates, or questions…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white py-3 rounded-full text-sm font-semibold transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Send on WhatsApp
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-[#0f2922] hover:bg-[#1a4a39] text-white py-3 rounded-full text-sm font-semibold transition-colors"
                >
                  Submit Enquiry
                </button>
              </div>
              <p className="text-[#4a5568] text-xs text-center">No account needed. We'll reach you on WhatsApp or call.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
