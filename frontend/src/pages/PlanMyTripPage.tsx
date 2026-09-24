import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";

const STEPS = ["Destination & Trip", "Dates & Group Size", "Traveller Details", "Contact Details", "Review & Submit"];

const DEST_OPTIONS = ["Chopta Valley", "Auli Slopes", "Rishikesh", "Kedarnath", "Kanatal", "Chakrata", "Mussoorie", "Not decided yet"];
const interests = ["Nature", "Adventure", "Spiritual", "Relaxation", "Photography", "Camping", "Yoga", "Local Cuisine", "Wildlife"];
const budgets = ["Under ₹7,000", "₹7,000 – ₹10,000", "₹10,000 – ₹15,000", "₹15,000 – ₹25,000", "Above ₹25,000"];
const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

interface TravellerData {
  name: string;
  age: string;
  gender: string;
}

export default function PlanMyTripPage() {
  const { navigate, addEnquiry, trips, destinations } = useApp();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    destination: "",
    tripId: "",
    flexDates: false,
    startDate: "",
    travellers: 2,
    travellersData: [
      { name: "", age: "", gender: "" },
      { name: "", age: "", gender: "" },
    ] as TravellerData[],
    budget: "",
    selectedInterests: [] as string[],
    notes: "",
    name: "",
    phone: "",
    email: "",
    startCity: "",
  });

  // Sync travellersData array length with travellers count
  useEffect(() => {
    setForm((prev) => {
      const count = prev.travellers;
      const current = prev.travellersData;
      if (current.length === count) return prev;
      if (count > current.length) {
        const added = Array.from({ length: count - current.length }, () => ({ name: "", age: "", gender: "" }));
        return { ...prev, travellersData: [...current, ...added] };
      }
      return { ...prev, travellersData: current.slice(0, count) };
    });
  }, [form.travellers]);

  const filteredTrips = trips.filter((t) => {
    if (!form.destination || form.destination === "Not decided yet") return true;
    const dest = destinations.find((d) => d.name === form.destination);
    return dest ? (t.destination === dest.id || t.destination === dest.slug) : true;
  });

  const toggleInterest = (val: string) => {
    setForm((prev) => ({
      ...prev,
      selectedInterests: prev.selectedInterests.includes(val)
        ? prev.selectedInterests.filter((x) => x !== val)
        : [...prev.selectedInterests, val],
    }));
  };

  const updateTraveller = (index: number, field: keyof TravellerData, value: string) => {
    setForm((prev) => {
      const updated = [...prev.travellersData];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, travellersData: updated };
    });
  };

  const canNext = () => {
    if (step === 0) return form.destination !== "";
    if (step === 1) return form.travellers >= 1 && (form.flexDates || form.startDate !== "");
    if (step === 2) return form.travellersData.every((t) => t.name !== "" && t.age !== "" && t.gender !== "");
    if (step === 3) return form.name !== "" && form.phone !== "";
    return true;
  };

  const handleSubmit = () => {
    setLoading(true);
    const enquiryId = `ENQ-${Date.now()}`;
    setTimeout(() => {
      addEnquiry({
        id: enquiryId,
        tripName: form.tripId
          ? (trips.find((t) => t.id === form.tripId)?.name ?? "Custom Trip Request")
          : "Custom Trip Request",
        destination: form.destination,
        travelDate: form.startDate || "Flexible",
        travellers: String(form.travellers),
        submittedAt: new Date().toISOString().split("T")[0],
        status: "Received",
        name: form.name,
        phone: form.phone,
        email: form.email,
        pickupCity: form.startCity,
        message: form.notes,
      });
      setSubmittedId(enquiryId);
      setLoading(false);
      setSubmitted(true);
    }, 1600);
  };

  const Pill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm border transition-all ${active ? "bg-[#0f2922] text-white border-[#0f2922]" : "border-[#e2e8f0] text-[#4a5568] hover:border-[#0f2922] hover:text-[#0f2922]"}`}
    >
      {label}
    </button>
  );

  const selectedTrip = trips.find((t) => t.id === form.tripId);

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[42vh] min-h-[280px] flex items-end pb-10 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=700&fit=crop&auto=format" alt="Himalayan panorama" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-2">CHART YOUR PATH</div>
          <h1 className="text-white text-4xl sm:text-5xl mb-2" style={{ fontFamily: "var(--font-serif)" }}>Mindful Himalayan Trip Planner</h1>
          <p className="text-white/75 text-sm max-w-lg">Our local Dehradun travel designers will craft a tailored Himalayan journey aligned with your budget and style.</p>
        </div>
      </section>

      <section className="py-14 bg-[#f7f8f5]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {submitted ? (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="text-[#0f2922] text-3xl mb-3" style={{ fontFamily: "var(--font-serif)" }}>Your Inquiry is Submitted!</h2>
              <p className="text-[#4a5568] text-sm leading-relaxed max-w-sm mx-auto mb-3">
                Your inquiry has been submitted. Our team will contact you on WhatsApp within 24 hours.
              </p>
              <p className="text-[#0f2922] font-medium text-sm mb-2">Enquiry ID: <span className="text-[#e8622a]">{submittedId}</span></p>
              <p className="text-[#4a5568] text-sm mb-8">We'll reach out at <strong>{form.phone}</strong>.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => navigate("trips")} className="border border-[#0f2922] text-[#0f2922] px-6 py-3 rounded-full text-sm font-medium hover:bg-[#0f2922] hover:text-white transition-colors">
                  Browse Trips
                </button>
                <button onClick={() => navigate("home")} className="bg-[#e8622a] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#d45520] transition-colors">
                  Back to Home
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              {/* Progress */}
              <div className="px-7 pt-7 pb-5 border-b border-[#e2e8f0]">
                <div className="flex items-center gap-1 mb-4">
                  {STEPS.map((s, i) => (
                    <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
                      <button
                        onClick={() => i < step && setStep(i)}
                        className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                          i < step ? "bg-[#16a34a] text-white cursor-pointer" : i === step ? "bg-[#0f2922] text-white" : "bg-[#e2e8f0] text-[#4a5568]"
                        }`}
                      >
                        {i < step ? "✓" : i + 1}
                      </button>
                      {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-[#16a34a]" : "bg-[#e2e8f0]"}`} />}
                    </div>
                  ))}
                </div>
                <div className="text-[#0f2922] font-semibold">Step {step + 1}: {STEPS[step]}</div>
                <div className="text-[#4a5568] text-sm">{step + 1} of {STEPS.length}</div>
              </div>

              {/* Step Content */}
              <div className="p-7 min-h-64">

                {/* Step 1: Destination & Trip */}
                {step === 0 && (
                  <div>
                    <h3 className="text-[#0f2922] text-xl mb-2" style={{ fontFamily: "var(--font-serif)" }}>Where do you want to go?</h3>
                    <p className="text-[#4a5568] text-sm mb-5">Select a destination, then optionally pick a specific package.</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {DEST_OPTIONS.map((d) => (
                        <Pill key={d} label={d} active={form.destination === d} onClick={() => setForm({ ...form, destination: d, tripId: "" })} />
                      ))}
                    </div>
                    {form.destination && form.destination !== "Not decided yet" && filteredTrips.length > 0 && (
                      <div>
                        <p className="text-[#0f2922] text-sm font-medium mb-3">Select a package (optional):</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {filteredTrips.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setForm({ ...form, tripId: form.tripId === t.id ? "" : t.id })}
                              className={`text-left p-3 rounded-xl border transition-all ${form.tripId === t.id ? "border-[#0f2922] bg-[#f7f8f5]" : "border-[#e2e8f0] hover:border-[#0f2922]"}`}
                            >
                              <div className="text-[#0f2922] font-medium text-sm">{t.name}</div>
                              <div className="text-[#4a5568] text-xs mt-0.5">{t.duration} · ₹{t.price.toLocaleString("en-IN")}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Dates & Group Size */}
                {step === 1 && (
                  <div className="space-y-5">
                    <h3 className="text-[#0f2922] text-xl mb-2" style={{ fontFamily: "var(--font-serif)" }}>When & how many?</h3>
                    <div>
                      <label className="flex items-center gap-2 text-sm text-[#4a5568] mb-3 cursor-pointer">
                        <input type="checkbox" checked={form.flexDates} onChange={(e) => setForm({ ...form, flexDates: e.target.checked })} className="rounded" />
                        My dates are flexible
                      </label>
                      {!form.flexDates && (
                        <div>
                          <label className="text-[#0f2922] text-xs uppercase tracking-wider font-medium mb-1.5 block">TRAVEL DATE</label>
                          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f2922]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[#0f2922] text-xs uppercase tracking-wider font-medium mb-1.5 block">NUMBER OF TRAVELLERS</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setForm((p) => ({ ...p, travellers: Math.max(1, p.travellers - 1) }))}
                          className="w-9 h-9 rounded-full border border-[#e2e8f0] text-[#0f2922] flex items-center justify-center hover:border-[#0f2922] transition-colors text-lg font-bold"
                        >
                          –
                        </button>
                        <span className="text-[#0f2922] font-semibold text-xl w-8 text-center">{form.travellers}</span>
                        <button
                          onClick={() => setForm((p) => ({ ...p, travellers: Math.min(15, p.travellers + 1) }))}
                          className="w-9 h-9 rounded-full border border-[#e2e8f0] text-[#0f2922] flex items-center justify-center hover:border-[#0f2922] transition-colors text-lg font-bold"
                        >
                          +
                        </button>
                        <span className="text-[#4a5568] text-sm ml-2">person{form.travellers > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[#0f2922] text-xs uppercase tracking-wider font-medium mb-1.5 block">BUDGET PER PERSON</label>
                      <div className="flex flex-wrap gap-2">
                        {budgets.map((b) => <Pill key={b} label={b} active={form.budget === b} onClick={() => setForm({ ...form, budget: b })} />)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Traveller Details */}
                {step === 2 && (
                  <div>
                    <h3 className="text-[#0f2922] text-xl mb-2" style={{ fontFamily: "var(--font-serif)" }}>Traveller details</h3>
                    <p className="text-[#4a5568] text-sm mb-5">Please fill in the details for each traveller.</p>
                    <div className="space-y-4">
                      {form.travellersData.map((traveller, i) => (
                        <div key={i} className="bg-[#f7f8f5] rounded-xl p-4 border border-[#e2e8f0]">
                          <div className="text-[#0f2922] font-medium text-sm mb-3">Traveller {i + 1}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[#0f2922] text-xs uppercase tracking-wider font-medium mb-1.5 block">NAME</label>
                              <input
                                type="text"
                                placeholder="Full name"
                                value={traveller.name}
                                onChange={(e) => updateTraveller(i, "name", e.target.value)}
                                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[#0f2922] text-xs uppercase tracking-wider font-medium mb-1.5 block">AGE</label>
                              <input
                                type="number"
                                placeholder="Age"
                                min="1"
                                max="100"
                                value={traveller.age}
                                onChange={(e) => updateTraveller(i, "age", e.target.value)}
                                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[#0f2922] text-xs uppercase tracking-wider font-medium mb-1.5 block">GENDER</label>
                              <select
                                value={traveller.gender}
                                onChange={(e) => updateTraveller(i, "gender", e.target.value)}
                                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] bg-white appearance-none"
                              >
                                <option value="">Select</option>
                                {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Contact Details */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-[#0f2922] text-xl mb-2" style={{ fontFamily: "var(--font-serif)" }}>Your contact details</h3>
                    <p className="text-[#4a5568] text-sm mb-5">Our team will reach you on WhatsApp with your custom itinerary.</p>
                    {[
                      { label: "YOUR NAME", placeholder: "Jane Doe", key: "name", type: "text" },
                      { label: "PHONE / WHATSAPP *", placeholder: "+91 98765 43210", key: "phone", type: "tel" },
                      { label: "EMAIL (Optional)", placeholder: "jane@email.com", key: "email", type: "email" },
                      { label: "STARTING CITY", placeholder: "Delhi, Dehradun…", key: "startCity", type: "text" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="text-[#0f2922] text-xs uppercase tracking-wider font-medium mb-1.5 block">{f.label}</label>
                        <input
                          type={f.type}
                          placeholder={f.placeholder}
                          value={(form as unknown as Record<string, string>)[f.key]}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          className="w-full border border-[#e2e8f0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0f2922]"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-[#0f2922] text-xs uppercase tracking-wider font-medium mb-1.5 block">INTERESTS (Optional)</label>
                      <div className="flex flex-wrap gap-2">
                        {interests.map((i) => <Pill key={i} label={i} active={form.selectedInterests.includes(i)} onClick={() => toggleInterest(i)} />)}
                      </div>
                    </div>
                    <div>
                      <label className="text-[#0f2922] text-xs uppercase tracking-wider font-medium mb-1.5 block">SPECIAL NOTES (Optional)</label>
                      <textarea rows={3} placeholder="Any special requirements, medical conditions, dietary needs…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-[#e2e8f0] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#0f2922] resize-none" />
                    </div>
                  </div>
                )}

                {/* Step 5: Review & Submit */}
                {step === 4 && (
                  <div>
                    <h3 className="text-[#0f2922] text-xl mb-4" style={{ fontFamily: "var(--font-serif)" }}>Review your enquiry</h3>
                    <div className="space-y-3 bg-[#f7f8f5] rounded-xl p-5 border border-[#e2e8f0] mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#4a5568]">Destination</span>
                        <span className="text-[#0f2922] font-medium">{form.destination}</span>
                      </div>
                      {selectedTrip && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[#4a5568]">Package</span>
                          <span className="text-[#0f2922] font-medium">{selectedTrip.name}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-[#4a5568]">Travel Date</span>
                        <span className="text-[#0f2922] font-medium">{form.flexDates ? "Flexible" : form.startDate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#4a5568]">Travellers</span>
                        <span className="text-[#0f2922] font-medium">{form.travellers}</span>
                      </div>
                      {form.budget && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[#4a5568]">Budget per person</span>
                          <span className="text-[#0f2922] font-medium">{form.budget}</span>
                        </div>
                      )}
                      <div className="border-t border-[#e2e8f0] pt-3 mt-1">
                        <div className="text-[#4a5568] text-sm mb-2">Travellers</div>
                        {form.travellersData.map((t, i) => (
                          <div key={i} className="text-[#0f2922] text-sm flex gap-3">
                            <span className="font-medium">{i + 1}. {t.name}</span>
                            <span className="text-[#4a5568]">Age {t.age} · {t.gender}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-[#e2e8f0] pt-3 mt-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#4a5568]">Name</span>
                          <span className="text-[#0f2922] font-medium">{form.name}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-[#4a5568]">Phone/WhatsApp</span>
                          <span className="text-[#0f2922] font-medium">{form.phone}</span>
                        </div>
                        {form.email && (
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-[#4a5568]">Email</span>
                            <span className="text-[#0f2922] font-medium">{form.email}</span>
                          </div>
                        )}
                        {form.startCity && (
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-[#4a5568]">Starting City</span>
                            <span className="text-[#0f2922] font-medium">{form.startCity}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[#4a5568] text-sm text-center">
                      By submitting, you agree to be contacted on WhatsApp. Our team typically responds within 24 hours.
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="px-7 pb-7 flex items-center justify-between gap-4">
                <button
                  onClick={() => step > 0 ? setStep(step - 1) : navigate("home")}
                  className="flex items-center gap-2 text-[#4a5568] text-sm hover:text-[#0f2922] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  {step === 0 ? "Cancel" : "Back"}
                </button>
                {step < STEPS.length - 1 ? (
                  <button
                    onClick={() => canNext() && setStep(step + 1)}
                    disabled={!canNext()}
                    className={`flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium transition-all ${canNext() ? "bg-[#0f2922] text-white hover:bg-[#1a4a39]" : "bg-[#e2e8f0] text-[#4a5568] cursor-not-allowed"}`}
                  >
                    Continue <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                ) : (
                  <button
                    onClick={() => !loading && handleSubmit()}
                    disabled={loading}
                    className="flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold transition-all bg-[#e8622a] hover:bg-[#d45520] text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</> : "INQUIRE NOW"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
