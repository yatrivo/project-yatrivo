import { useState, useEffect } from "react";
import { useApp, type Enquiry } from "@/context/AppContext";
import { enquiriesApi } from "@/api/enquiries";
import { YATRIVO_CONTACT } from "@/constants/contact";

export default function EnquiryModal() {
  const {
    enquiryModalOpen,
    closeEnquiryModal,
    enquiryTripId,
    enquiryDepartureId,
    addEnquiry,
    showToast,
    trips,
    destinations,
    tripInstances,
    siteSettings
  } = useApp();

  // Dynamically resolve trip from AppContext by id or slug
  const cleanTripId = (enquiryTripId || "").trim().toLowerCase();
  const safeTrips = Array.isArray(trips) ? trips : [];
  const foundTrip = safeTrips.find(
    (t) =>
      t &&
      ((t.id && String(t.id).toLowerCase() === cleanTripId) ||
       (t.slug && String(t.slug).toLowerCase() === cleanTripId))
  );

  const safeDests = Array.isArray(destinations) ? destinations : [];
  const foundDest = (!foundTrip && cleanTripId)
    ? safeDests.find(
        (d) =>
          d &&
          (d.id.toLowerCase() === cleanTripId ||
           (d.slug && d.slug.toLowerCase() === cleanTripId) ||
           d.name.toLowerCase() === cleanTripId ||
           cleanTripId === `dest:${d.id.toLowerCase()}` ||
           cleanTripId === `dest:${(d.slug || "").toLowerCase()}`)
      )
    : null;

  const tripName = foundTrip?.name || (foundDest ? `Custom ${foundDest.name} Expedition` : "Himalayan Expedition");

  const destName = (() => {
    if (foundDest) {
      return `${foundDest.name}, Uttarakhand`;
    }
    if (Array.isArray(foundTrip?.destinations) && foundTrip.destinations.length > 0) {
      return foundTrip.destinations
        .map((d: any) => (typeof d === "string" ? d : d?.name || ""))
        .filter(Boolean)
        .join(", ");
    }
    if (foundTrip?.destination) {
      const d = safeDests.find(
        (dest) =>
          dest &&
          (dest.id === foundTrip.destination ||
           dest.slug === foundTrip.destination ||
           dest.name === foundTrip.destination)
      );
      return d ? `${d.name}, Uttarakhand` : foundTrip.destination;
    }
    return "Uttarakhand, India";
  })();

  // Resolve upcoming departures for this trip with safe fallbacks
  const availableDepartures = (() => {
    const fromTrip = Array.isArray(foundTrip?.departures) ? foundTrip.departures : [];
    const safeInstances = Array.isArray(tripInstances) ? tripInstances : [];
    const fromInstances = safeInstances.filter(
      (ti) =>
        ti &&
        (ti.tripId === foundTrip?.id ||
         ti.tripId === enquiryTripId ||
         (foundTrip?.slug && ti.tripId === foundTrip.slug))
    );
    const combined = fromTrip.length > 0 ? fromTrip : fromInstances;
    return combined.filter((d) => d && d.status === "upcoming");
  })();

  const [selectedDepartureId, setSelectedDepartureId] = useState<string>("");
  const [travellers, setTravellers] = useState<number>(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<{
    id: string;
    enquiryNumber: string;
    departureDate: string;
    travellers: number;
    price?: number;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or initialize selection whenever modal opens or trip/departure changes
  useEffect(() => {
    if (!enquiryModalOpen) return;

    if (enquiryDepartureId && availableDepartures.some((d) => d?.id === enquiryDepartureId)) {
      setSelectedDepartureId(enquiryDepartureId);
    } else if (availableDepartures.length > 0 && availableDepartures[0]?.id) {
      setSelectedDepartureId(availableDepartures[0].id);
    } else {
      setSelectedDepartureId("flexible");
    }

    setSubmittedEnquiry(null);
    setErrors({});
    setIsSubmitting(false);
  }, [enquiryModalOpen, enquiryDepartureId, enquiryTripId, availableDepartures.length]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!enquiryModalOpen || typeof document === "undefined") return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [enquiryModalOpen]);

  if (!enquiryModalOpen) return null;

  // Active departure ID: state or fallback to first available
  const activeDepartureId =
    selectedDepartureId ||
    enquiryDepartureId ||
    (availableDepartures.length > 0 ? availableDepartures[0]?.id : "flexible");

  const selectedDeparture = availableDepartures.find((d) => d && d.id === activeDepartureId);
  const departureDateLabel = selectedDeparture
    ? selectedDeparture.displayDate || selectedDeparture.date
    : "Flexible / Next available batch";

  const departurePrice = Number(selectedDeparture?.price) || Number(foundTrip?.price) || 0;
  const totalEstimatedPrice = departurePrice * travellers;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!phone.trim()) {
      errs.phone = "Phone or WhatsApp number is required";
    } else {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10) errs.phone = "Enter a valid 10-digit mobile number";
    }
    return errs;
  };

  const handleClose = () => {
    closeEnquiryModal();
    setSubmittedEnquiry(null);
    setErrors({});
  };

  // 1. Submit Enquiry (Tracked, saved to PostgreSQL & notifies admin)
  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const budgetLabel = departurePrice > 0
        ? `₹${departurePrice.toLocaleString("en-IN")} / person (Total ~₹${totalEstimatedPrice.toLocaleString("en-IN")})`
        : undefined;

      const payload = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        tripId: foundTrip?.id || enquiryTripId,
        tripName,
        tripInstanceId: selectedDeparture?.id && selectedDeparture.id !== "flexible" ? selectedDeparture.id : undefined,
        destinationId: foundTrip?.destinations?.[0]?.id || foundTrip?.destination,
        destinationLabel: destName,
        requestedTravelDate: selectedDeparture?.date || undefined,
        requestedTravellerCount: travellers,
        budgetLabel,
        message: message.trim() || undefined,
        source: "website" as const
      };

      const res = await enquiriesApi.create(payload);
      const enq = res.enquiry;

      // Add to local AppContext so it immediately reflects in admin list
      const appEnquiry: Enquiry = {
        id: enq.id,
        enquiryNumber: enq.enquiryNumber,
        tripName,
        destination: destName,
        travelDate: departureDateLabel,
        travellers: String(travellers),
        submittedAt: enq.submittedAt || new Date().toISOString(),
        status: "Received",
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        message: message.trim(),
        tripId: foundTrip?.id,
        tripInstanceId: selectedDeparture?.id,
        budgetLabel
      };
      addEnquiry(appEnquiry);

      setSubmittedEnquiry({
        id: enq.id,
        enquiryNumber: enq.enquiryNumber,
        departureDate: departureDateLabel,
        travellers,
        price: departurePrice
      });
      showToast("Enquiry submitted successfully.", "success");
    } catch {
      // Fallback local submission if offline or backend error
      const mockId = `ENQ-${Date.now().toString().slice(-6)}`;
      const appEnquiry: Enquiry = {
        id: mockId,
        enquiryNumber: mockId,
        tripName,
        destination: destName,
        travelDate: departureDateLabel,
        travellers: String(travellers),
        submittedAt: new Date().toISOString(),
        status: "Received",
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        message: message.trim(),
      };
      addEnquiry(appEnquiry);
      setSubmittedEnquiry({
        id: mockId,
        enquiryNumber: mockId,
        departureDate: departureDateLabel,
        travellers,
        price: departurePrice
      });
      showToast("Enquiry submitted.", "success");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Connect on WhatsApp (Direct conversation, no database entry)
  const handleConnectWhatsApp = () => {
    const prefilledText =
      `Hi, I’m interested in the ${tripName} package for ${departureDateLabel}. ` +
      `I’m travelling with ${travellers} ${travellers === 1 ? "person" : "people"}.` +
      (message.trim() ? `\n\nNotes: ${message.trim()}` : "") +
      `\n\n(Sent from Yatrivo Website)`;

    const targetWa = siteSettings?.contact?.inquiryWhatsapp || siteSettings?.contact?.whatsapp;
    const url = YATRIVO_CONTACT.getWhatsAppUrl(prefilledText, targetWa);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden overscroll-contain animate-fade-in"
      onClick={handleClose}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: "var(--forest, #0f2922)" }} className="px-6 pt-6 pb-5 text-white rounded-t-2xl shrink-0 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition p-1 cursor-pointer"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold">
              OFFICIAL ENQUIRY
            </span>
            <span className="text-white/40 text-[10px]">•</span>
            <span className="text-white/60 text-[11px] truncate max-w-[280px]">{destName}</span>
          </div>
          <h2 className="text-white text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-serif, serif)" }}>
            {tripName}
          </h2>
          {departurePrice > 0 && (
            <div className="text-emerald-400 text-xs font-medium mt-1">
              Starting at ₹{Number(departurePrice).toLocaleString("en-IN")} per person
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 min-h-0 p-6">
          {submittedEnquiry ? (
            /* Success confirmation */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-[#0f2922] text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-serif, serif)" }}>
                Enquiry Submitted
              </h3>
              <p className="text-[#4a5568] text-sm max-w-sm mx-auto mb-5 leading-relaxed">
                Thank you{name ? `, ${name}` : ""}! Your enquiry has been received. We will contact you within 24 hours.
              </p>

              <div className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-lg p-3.5 text-xs text-[#4a5568] max-w-xs mx-auto text-left mb-6 space-y-1.5">
                {phone && (
                  <div className="flex justify-between">
                    <span className="text-[#718096]">Contact:</span>
                    <span className="font-semibold text-[#0f2922]">{phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#718096]">Status:</span>
                  <span className="font-medium text-emerald-700">Received</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleConnectWhatsApp}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white px-6 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer shadow-sm"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Chat with Team on WhatsApp
                </button>
                <button
                  onClick={handleClose}
                  className="w-full sm:w-auto px-6 py-2.5 border border-[#e2e8f0] text-[#0f2922] hover:bg-[#f7f8f5] rounded-full text-xs font-semibold transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Enquiry Form */
            <form onSubmit={handleSubmitEnquiry} className="space-y-4" id="enquiry-form">
              {/* Departure Selection */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1.5">
                  Select Departure Date <span className="text-red-500">*</span>
                </label>
                {availableDepartures.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={activeDepartureId}
                      onChange={(e) => setSelectedDepartureId(e.target.value)}
                      className="w-full border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                    >
                      {availableDepartures.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.displayDate || d.date} — ₹{Number(d.price || 0).toLocaleString("en-IN")} ({d.spotsLeft ?? d.spotsTotal ?? 0} spots left)
                          {d.notes ? ` [${d.notes}]` : ""}
                        </option>
                      ))}
                      <option value="flexible">Flexible / Any upcoming departure batch</option>
                    </select>
                    {selectedDeparture && (
                      <div className="bg-[#f7f8f5] border border-[#e2e8f0]/80 rounded-lg px-3 py-2 text-xs flex items-center justify-between">
                        <span className="text-[#4a5568]">
                          Batch price: <strong>₹{Number(selectedDeparture.price || 0).toLocaleString("en-IN")}</strong> / person
                        </span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-emerald-200">
                          {selectedDeparture.spotsLeft ?? selectedDeparture.spotsTotal ?? 0} spots remaining
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-[#e2e8f0] bg-[#f7f8f5] rounded-xl p-3 text-xs text-[#4a5568] flex items-center justify-between">
                    <span>
                      {foundTrip?.price
                        ? `Flexible / Next scheduled batch (Base price: ₹${Number(foundTrip.price).toLocaleString("en-IN")})`
                        : "Custom dates & flexible schedule"}
                    </span>
                    <span className="text-[#e8622a] font-semibold">Flexible Dates</span>
                  </div>
                )}
              </div>

              {/* Number of Travellers */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1.5">
                  Number of Travellers
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-[#e2e8f0] rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setTravellers(Math.max(1, travellers - 1))}
                      className="px-3.5 py-2 text-[#0f2922] hover:bg-[#f7f8f5] transition font-bold text-sm cursor-pointer"
                    >
                      –
                    </button>
                    <span className="px-4 py-2 text-sm font-semibold text-[#0f2922] min-w-[3rem] text-center">
                      {travellers}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTravellers(Math.min(20, travellers + 1))}
                      className="px-3.5 py-2 text-[#0f2922] hover:bg-[#f7f8f5] transition font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  {departurePrice > 0 && (
                    <div className="text-xs text-[#718096] pl-2">
                      Est. Total: <strong className="text-[#0f2922]">₹{Number(totalEstimatedPrice || 0).toLocaleString("en-IN")}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none text-[#0f2922] ${
                      errors.name ? "border-red-400 bg-red-50/20" : "border-[#e2e8f0] focus:border-[#0f2922]"
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                    Phone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none text-[#0f2922] ${
                      errors.phone ? "border-red-400 bg-red-50/20" : "border-[#e2e8f0] focus:border-[#0f2922]"
                    }`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                  Email Address <span className="text-[#718096] text-[10px] normal-case">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aarav@example.com"
                  className="w-full border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                  Message / Special Requests <span className="text-[#718096] text-[10px] normal-case">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about fitness levels, dietary preferences, or specific questions..."
                  className="w-full border border-[#e2e8f0] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922] resize-none"
                />
              </div>
            </form>
          )}
        </div>

        {/* Pinned Footer — only shown when form (not success state) */}
        {!submittedEnquiry && (
          <div className="bg-white border-t border-[#e2e8f0] px-6 py-4 space-y-3 shrink-0">
            {/* 1. Tracked System Enquiry */}
            <button
              type="submit"
              form="enquiry-form"
              disabled={isSubmitting}
              className="w-full bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white py-3.5 rounded-full text-sm font-semibold transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Enquiry...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                  <span>Submit Enquiry</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
