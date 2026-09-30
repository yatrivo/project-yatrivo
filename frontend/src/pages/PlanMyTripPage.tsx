import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp, type Enquiry } from "@/context/AppContext";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { enquiriesApi } from "@/api/enquiries";
import { YATRIVO_CONTACT } from "@/constants/contact";

export default function PlanMyTripPage() {
  const { addEnquiry, trips, destinations, tripInstances, showToast, siteSettings } = useApp();

  // Current step in the 4-step discovery enquiry flow (1-based: 1, 2, 3, 4, 5 for success)
  const [step, setStep] = useState<number>(1);

  // Form selections (preserved across step navigation)
  const [selectedDestIds, setSelectedDestIds] = useState<string[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedDepartureId, setSelectedDepartureId] = useState<string>("");
  const [travellers, setTravellers] = useState<number>(2);

  // Contact details
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<{
    id: string;
    enquiryNumber: string;
    tripName: string;
    destination: string;
    departureDate: string;
    travellers: number;
    price?: number;
  } | null>(null);

  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // 1. Available active destinations
  const activeDestinations = useMemo(() => {
    return destinations.filter((d) => d.status !== "archived");
  }, [destinations]);

  // Toggle destination selection (multi-select on Step 1)
  const toggleDestination = (destIdOrSlug: string) => {
    setSelectedDestIds((prev) => {
      const exists = prev.includes(destIdOrSlug);
      return exists ? prev.filter((id) => id !== destIdOrSlug) : [...prev, destIdOrSlug];
    });
    setStepErrors((prev) => ({ ...prev, destination: "" }));
  };

  // 2. Trips/packages associated with selected destinations (Page 2)
  const relevantTrips = useMemo(() => {
    const publishedTrips = trips.filter((t) => t.status !== "archived");
    if (selectedDestIds.length === 0) return publishedTrips;

    return publishedTrips.filter((t) => {
      if (
        selectedDestIds.some(
          (d) =>
            d === t.destination ||
            d.toLowerCase() === (t.destination || "").toLowerCase()
        )
      ) {
        return true;
      }
      if (
        t.destinations &&
        t.destinations.some((d) => selectedDestIds.includes(d.id) || selectedDestIds.includes(d.slug))
      ) {
        return true;
      }
      return false;
    });
  }, [trips, selectedDestIds]);

  // Selected trip object
  const selectedTrip = useMemo(() => {
    return trips.find((t) => t.id === selectedTripId || (t.slug && t.slug === selectedTripId)) || null;
  }, [trips, selectedTripId]);

  // 3. Departures for selected trip (Page 3)
  const availableDepartures = useMemo(() => {
    if (!selectedTrip) return [];
    const fromTrip = selectedTrip.departures || [];
    const fromInstances = tripInstances.filter((ti) => ti.tripId === selectedTrip.id);
    const combined = fromTrip.length > 0 ? fromTrip : fromInstances;
    return combined.filter((d) => d.status === "upcoming").sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedTrip, tripInstances]);

  // Selected departure object
  const selectedDeparture = useMemo(() => {
    if (!selectedDepartureId) return null;
    return availableDepartures.find((d) => d.id === selectedDepartureId) || null;
  }, [availableDepartures, selectedDepartureId]);

  const departureDateLabel = selectedDeparture
    ? selectedDeparture.displayDate || selectedDeparture.date
    : "Flexible / Next available batch";

  const departurePrice = selectedDeparture?.price || selectedTrip?.price || 0;
  const totalEstimatedPrice = departurePrice * travellers;

  // Selected destination label for recap
  const selectedDestinationNames = useMemo(() => {
    if (selectedDestIds.length === 0) return "All Destinations";
    return activeDestinations
      .filter((d) => selectedDestIds.includes(d.id) || selectedDestIds.includes(d.slug))
      .map((d) => d.name)
      .join(", ");
  }, [activeDestinations, selectedDestIds]);

  // Validation per step
  const validateStep = (currentStep: number): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (selectedDestIds.length === 0) {
        errs.destination = "Please select at least one destination to proceed.";
      }
    } else if (currentStep === 2) {
      if (!selectedTripId) {
        errs.trip = "Please choose a package that interests you.";
      }
    } else if (currentStep === 3) {
      if (!selectedDepartureId) {
        errs.departure = "Please select a scheduled departure date or choose flexible batch.";
      }
      if (travellers < 1) {
        errs.travellers = "Traveller count must be at least 1.";
      }
    } else if (currentStep === 4) {
      if (!name.trim()) errs.name = "Full name is required.";
      if (!phone.trim()) {
        errs.phone = "Phone or WhatsApp number is required.";
      } else {
        const digits = phone.replace(/\D/g, "");
        if (digits.length < 10) errs.phone = "Please enter a valid 10-digit mobile number.";
      }
    }

    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(4, prev + 1));
      window.scrollTo({ top: 150, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setStepErrors({});
    setStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 150, behavior: "smooth" });
  };

  // Submit Enquiry to backend database
  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setStepErrors({});

    try {
      const budgetLabel = departurePrice > 0
        ? `₹${departurePrice.toLocaleString("en-IN")} / person (Est. Total ~₹${totalEstimatedPrice.toLocaleString("en-IN")})`
        : undefined;

      const payload = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim() || undefined,
        tripId: selectedTrip?.id,
        tripName: selectedTrip?.name || "Custom Himalayan Expedition",
        tripInstanceId: selectedDeparture?.id && selectedDeparture.id !== "flexible" ? selectedDeparture.id : undefined,
        destinationLabel: selectedDestinationNames,
        requestedTravelDate: selectedDeparture?.date || undefined,
        requestedTravellerCount: travellers,
        budgetLabel,
        message: message.trim() || undefined,
        source: "website" as const
      };

      const res = await enquiriesApi.create(payload);
      const enq = res.enquiry;

      // Add to local AppContext
      const appEnquiry: Enquiry = {
        id: enq.id,
        enquiryNumber: enq.enquiryNumber,
        tripName: selectedTrip?.name || "Custom Expedition",
        destination: selectedDestinationNames,
        travelDate: departureDateLabel,
        travellers: String(travellers),
        submittedAt: new Date().toISOString().slice(0, 10),
        status: "Received",
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        message: message.trim(),
        tripId: selectedTrip?.id,
        tripInstanceId: selectedDeparture?.id,
        budgetLabel
      };
      addEnquiry(appEnquiry);

      setSubmittedEnquiry({
        id: enq.id,
        enquiryNumber: enq.enquiryNumber,
        tripName: selectedTrip?.name || "Himalayan Expedition",
        destination: selectedDestinationNames,
        departureDate: departureDateLabel,
        travellers,
        price: departurePrice
      });
      setStep(5);
      showToast("Enquiry submitted successfully.", "success");
    } catch (err: unknown) {
      const mockId = `ENQ-${Date.now().toString().slice(-6)}`;
      const appEnquiry: Enquiry = {
        id: mockId,
        enquiryNumber: mockId,
        tripName: selectedTrip?.name || "Himalayan Expedition",
        destination: selectedDestinationNames,
        travelDate: departureDateLabel,
        travellers: String(travellers),
        submittedAt: new Date().toISOString().slice(0, 10),
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
        tripName: selectedTrip?.name || "Himalayan Expedition",
        destination: selectedDestinationNames,
        departureDate: departureDateLabel,
        travellers,
        price: departurePrice
      });
      setStep(5);
      showToast("Enquiry submitted.", "success");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectWhatsApp = () => {
    const prefilledText =
      `Hi, I’m interested in the ${selectedTrip?.name || "Himalayan"} package for ${departureDateLabel}. ` +
      `I’m travelling with ${travellers} ${travellers === 1 ? "person" : "people"}.` +
      (message.trim() ? `\n\nNotes: ${message.trim()}` : "") +
      `\n\n(Sent via Yatrivo Plan My Trip)`;

    const targetWa = siteSettings?.contact?.inquiryWhatsapp || siteSettings?.contact?.whatsapp;
    const url = YATRIVO_CONTACT.getWhatsAppUrl(prefilledText, targetWa);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const stepLabels = [
    "Destinations",
    "Package",
    "Departure Date",
    "Contact Details"
  ];

  return (
    <div className="min-h-screen bg-[#fafbfa]">
      <SEO
        title="Plan Your Custom Himalayan Journey"
        description="Tell us your mountain travel preferences, dates, and group size. We'll design a personalized Uttarakhand itinerary with certified local guides and premium stays."
        keywords="custom himalayan itinerary, plan uttarakhand trip, tailor-made trek, private mountain tour, bespoke himalayan expedition"
      />
      {/* Clean Minimal Header */}
      <div className="bg-[#0f2922] text-white pt-28 sm:pt-32 pb-10 sm:pb-12 px-4 sm:px-6 border-b border-[#1b3d32]">
        <div className="max-w-4xl mx-auto">
          <div className="text-[#e8622a] text-xs font-semibold uppercase tracking-widest mb-2 text-contrast-subtle">
            CUSTOM TRIP ENQUIRY
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>
            Plan My Trip
          </h1>
          <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-lg leading-relaxed text-contrast-body">
            A quick 4-step enquiry form. Pick destinations, choose your package, and request an official itinerary briefing.
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {step < 5 && (
          /* Step Indicator */
          <div className="mb-8 bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold mb-3">
              <span className="text-[#0f2922]">
                Step {step} of 4: <span className="text-[#e8622a]">{stepLabels[step - 1]}</span>
              </span>
              <span className="text-[#718096]">
                {step === 1 && "Choose destinations"}
                {step === 2 && "Select package"}
                {step === 3 && "Select departure"}
                {step === 4 && "Contact & review"}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s < step
                        ? "bg-emerald-600"
                        : s === step
                        ? "bg-[#e8622a]"
                        : "bg-[#e2e8f0]"
                    }`}
                  />
                  <div className="text-[10px] hidden sm:block text-[#718096] font-medium truncate">
                    {stepLabels[s - 1]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 1: WHERE DO YOU WANT TO GO? (Minimal Form)          */}
        {/* ======================================================== */}
        {step === 1 && (
          <div className="bg-white rounded-xl p-6 sm:p-7 border border-[#e2e8f0] shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-[#0f2922] text-xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                  Where do you want to go?
                </h2>
                <p className="text-[#718096] text-xs mt-0.5">
                  Select one or more destinations that you'd like to visit.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedDestIds(activeDestinations.map((d) => d.id))}
                  className="text-[#0f2922] hover:text-[#e8622a] font-medium transition cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedDestIds([])}
                  className="text-[#718096] hover:text-[#0f2922] font-medium transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {stepErrors.destination && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-xs mb-4 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {stepErrors.destination}
              </div>
            )}

            {/* Minimal Destination Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mb-6">
              {activeDestinations.map((d) => {
                const isSelected = selectedDestIds.includes(d.id) || selectedDestIds.includes(d.slug);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDestination(d.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#0f2922] bg-[#0f2922] text-white font-medium shadow-xs"
                        : "border-[#e2e8f0] bg-white text-[#4a5568] hover:border-[#0f2922]/40 hover:bg-[#f7f8f5]"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-white text-[#0f2922] border-white"
                          : "border-[#cbd5e1] bg-white"
                      }`}
                    >
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className="truncate">{d.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Footer / Navigation */}
            <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-4">
              <div className="text-xs text-[#718096]">
                {selectedDestIds.length === 0
                  ? "Select destinations to continue"
                  : `${selectedDestIds.length} ${selectedDestIds.length === 1 ? "destination" : "destinations"} selected`}
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="bg-[#0f2922] hover:bg-[#1a3d31] text-white px-6 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>Next: Choose Package</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: CHOOSE A TRIP / PACKAGE (Minimal Form)           */}
        {/* ======================================================== */}
        {step === 2 && (
          <div className="bg-white rounded-xl p-6 sm:p-7 border border-[#e2e8f0] shadow-2xs">
            <div className="mb-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-[#0f2922] text-xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                  Choose a trip / package
                </h2>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#e8622a] hover:underline font-medium cursor-pointer"
                >
                  Edit Destinations
                </button>
              </div>
              <p className="text-[#718096] text-xs mt-0.5">
                Packages covering: <span className="font-semibold text-[#0f2922]">{selectedDestinationNames}</span>
              </p>
            </div>

            {stepErrors.trip && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-xs mb-4 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {stepErrors.trip}
              </div>
            )}

            {/* Minimal Packages List */}
            {relevantTrips.length === 0 ? (
              <div className="bg-[#f7f8f5] rounded-xl p-6 text-center border border-dashed border-[#cbd5e1] mb-6">
                <p className="text-[#4a5568] text-xs font-medium mb-3">
                  No packages currently scheduled for this specific combination of destinations.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedDestIds([])}
                  className="bg-[#0f2922] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#1a3d31] transition cursor-pointer"
                >
                  Show All Available Packages
                </button>
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {relevantTrips.map((t) => {
                  const isSelected = selectedTripId === t.id;
                  const depCount = (t.departures || tripInstances.filter((ti) => ti.tripId === t.id)).filter(
                    (d) => d.status === "upcoming"
                  ).length;

                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTripId(t.id);
                        setSelectedDepartureId(""); // Reset departure when package changes
                        setStepErrors((prev) => ({ ...prev, trip: "" }));
                      }}
                      className={`px-3.5 sm:px-4 py-3 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 ${
                        isSelected
                          ? "border-[#0f2922] bg-[#f7f9f7] shadow-xs"
                          : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? "border-[#0f2922] bg-[#0f2922]" : "border-[#cbd5e1] bg-white"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0f2922] truncate">{t.name}</div>
                          <div className="text-xs text-[#718096] flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                            <span>{t.duration || "4 Days"}</span>
                            <span>•</span>
                            <span className="capitalize">{t.difficulty || "Moderate"}</span>
                            {t.startingPoint && (
                              <>
                                <span>•</span>
                                <span>Starts from {t.startingPoint}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-6 sm:pl-0 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-gray-100 shrink-0">
                        <div className="text-sm font-bold text-[#e8622a]">
                          ₹{t.price ? t.price.toLocaleString("en-IN") : "9,999"}
                        </div>
                        <div className="text-[11px] text-[#718096]">
                          {depCount} upcoming {depCount === 1 ? "departure" : "departures"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="text-xs font-semibold text-[#4a5568] hover:text-[#0f2922] px-4 py-2 border border-[#e2e8f0] rounded-full hover:bg-[#f7f8f5] transition cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedTripId}
                className="bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-40 text-white px-6 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>Next: Departure & Travellers</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: DEPARTURE & TRAVELLERS (Minimal Form)            */}
        {/* ======================================================== */}
        {step === 3 && selectedTrip && (
          <div className="bg-white rounded-xl p-6 sm:p-7 border border-[#e2e8f0] shadow-2xs">
            <div className="mb-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-[#0f2922] text-xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                  Departure & Travellers
                </h2>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-[#e8622a] hover:underline font-medium cursor-pointer"
                >
                  Change Package
                </button>
              </div>
              <p className="text-[#718096] text-xs mt-0.5">
                Package: <span className="font-semibold text-[#0f2922]">{selectedTrip.name}</span> · Base: ₹{selectedTrip.price ? selectedTrip.price.toLocaleString("en-IN") : "9,999"} / person
              </p>
            </div>

            {stepErrors.departure && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg text-xs mb-4 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {stepErrors.departure}
              </div>
            )}

            {/* Departures Radio Selection */}
            <div className="mb-5">
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-2">
                Select Departure Date <span className="text-red-500">*</span>
              </label>

              {availableDepartures.length > 0 ? (
                <div className="space-y-2">
                  {availableDepartures.map((d) => {
                    const isSelected = selectedDepartureId === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          setSelectedDepartureId(d.id);
                          setStepErrors((prev) => ({ ...prev, departure: "" }));
                        }}
                        className={`px-3.5 sm:px-4 py-3 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 ${
                          isSelected
                            ? "border-[#0f2922] bg-[#f7f9f7] shadow-xs"
                            : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? "border-[#0f2922] bg-[#0f2922]" : "border-[#cbd5e1] bg-white"
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#0f2922]">
                              {d.displayDate || d.date}
                            </div>
                            <div className="text-xs text-[#718096] flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-200">
                                {d.spotsLeft} spots left
                              </span>
                              {d.notes && <span className="italic text-[#4a5568]">✦ {d.notes}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-6 sm:pl-0 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-gray-100 shrink-0">
                          <div className="text-sm font-bold text-[#e8622a]">
                            ₹{d.price.toLocaleString("en-IN")}
                          </div>
                          <span className="text-[11px] text-[#718096]">per person</span>
                        </div>
                      </div>
                    );
                  })}

                  <div
                    onClick={() => {
                      setSelectedDepartureId("flexible");
                      setStepErrors((prev) => ({ ...prev, departure: "" }));
                    }}
                    className={`px-3.5 sm:px-4 py-3 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 ${
                      selectedDepartureId === "flexible"
                        ? "border-[#0f2922] bg-[#f7f9f7] shadow-xs"
                        : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedDepartureId === "flexible" ? "border-[#0f2922] bg-[#0f2922]" : "border-[#cbd5e1] bg-white"
                        }`}
                      >
                        {selectedDepartureId === "flexible" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#0f2922]">Flexible / Next upcoming batch</div>
                        <div className="text-xs text-[#718096]">Coordinate future dates with our mountain team</div>
                      </div>
                    </div>
                    <span className="text-xs text-[#718096] font-medium self-end sm:self-auto">Flexible</span>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setSelectedDepartureId("flexible")}
                  className="px-4 py-3 rounded-xl border-2 border-[#0f2922] bg-[#f7f9f7] cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#0f2922]">Flexible / Next Available Batch</div>
                    <div className="text-xs text-[#718096]">Our team will coordinate the newly announced dates with you</div>
                  </div>
                  <span className="text-xs font-bold text-[#e8622a]">Selected</span>
                </div>
              )}
            </div>

            {/* Travellers Counter */}
            <div className="mb-6 pt-3 border-t border-[#e2e8f0]">
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1.5">
                Number of Travellers
              </label>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f7f8f5] border border-[#e2e8f0]">
                <div>
                  <div className="text-sm font-semibold text-[#0f2922]">Group Size</div>
                  <div className="text-xs text-[#718096]">Solo wanderers, couples, or private groups</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-[#e2e8f0] rounded-lg overflow-hidden bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setTravellers(Math.max(1, travellers - 1))}
                      className="px-3.5 py-1.5 text-[#0f2922] hover:bg-[#f7f8f5] transition font-bold text-sm cursor-pointer"
                    >
                      –
                    </button>
                    <span className="px-4 py-1.5 text-sm font-bold text-[#0f2922] min-w-[3rem] text-center">
                      {travellers}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTravellers(Math.min(20, travellers + 1))}
                      className="px-3.5 py-1.5 text-[#0f2922] hover:bg-[#f7f8f5] transition font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {departurePrice > 0 && (
                    <div className="text-right pl-2">
                      <span className="text-[10px] text-[#718096] uppercase font-semibold block">Est. Base</span>
                      <span className="text-sm font-bold text-[#0f2922]">
                        ₹{totalEstimatedPrice.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="text-xs font-semibold text-[#4a5568] hover:text-[#0f2922] px-4 py-2 border border-[#e2e8f0] rounded-full hover:bg-[#f7f8f5] transition cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedDepartureId}
                className="bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-40 text-white px-6 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>Next: Contact Details</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: CONTACT DETAILS & REVIEW (Minimal Form)          */}
        {/* ======================================================== */}
        {step === 4 && selectedTrip && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Left: Contact Form */}
            <div className="md:col-span-2 bg-white rounded-xl p-6 sm:p-7 border border-[#e2e8f0] shadow-2xs">
              <h2 className="text-[#0f2922] text-xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)" }}>
                Contact Details
              </h2>
              <p className="text-[#718096] text-xs mb-4">
                Where should we send your trip briefing?
              </p>

              <form onSubmit={handleSubmitEnquiry} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setStepErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      placeholder="e.g. Aarav Sharma"
                      className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none text-[#0f2922] ${
                        stepErrors.name ? "border-red-400 bg-red-50/20" : "border-[#e2e8f0] focus:border-[#0f2922]"
                      }`}
                    />
                    {stepErrors.name && <p className="text-red-500 text-xs mt-1">{stepErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#0f2922] mb-1">
                      Phone / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setStepErrors((prev) => ({ ...prev, phone: "" }));
                      }}
                      placeholder="+91 98765 43210"
                      className={`w-full border rounded-lg px-3.5 py-2 text-sm focus:outline-none text-[#0f2922] ${
                        stepErrors.phone ? "border-red-400 bg-red-50/20" : "border-[#e2e8f0] focus:border-[#0f2922]"
                      }`}
                    />
                    {stepErrors.phone && <p className="text-red-500 text-xs mt-1">{stepErrors.phone}</p>}
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
                    className="w-full border border-[#e2e8f0] rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922]"
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
                    placeholder="Any questions or special requests..."
                    className="w-full border border-[#e2e8f0] rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-[#0f2922] text-[#0f2922] resize-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-3 border-t border-[#e2e8f0] space-y-2.5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white py-3 rounded-full text-xs font-semibold transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting Enquiry...</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 2L11 13" />
                          <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                        <span>Submit Enquiry</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs text-[#718096]">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="hover:text-[#0f2922] font-semibold underline cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConnectWhatsApp}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Prefer WhatsApp? Chat directly</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right: Summary Review Card */}
            <div className="bg-white rounded-xl p-5 border border-[#e2e8f0] shadow-2xs flex flex-col justify-between">
              <div>
                <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-bold mb-1.5">
                  ENQUIRY SUMMARY
                </div>
                <h3 className="text-[#0f2922] text-base font-bold mb-3" style={{ fontFamily: "var(--font-serif)" }}>
                  {selectedTrip.name}
                </h3>

                <div className="space-y-2 text-xs border-y border-[#e2e8f0] py-3 mb-3">
                  <div className="flex justify-between">
                    <span className="text-[#718096]">Destinations</span>
                    <span className="font-semibold text-[#0f2922] text-right truncate max-w-[55%]">
                      {selectedDestinationNames}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#718096]">Departure</span>
                    <span className="font-semibold text-[#0f2922]">{departureDateLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#718096]">Travellers</span>
                    <span className="font-semibold text-[#0f2922]">{travellers}</span>
                  </div>
                  {departurePrice > 0 && (
                    <div className="flex justify-between pt-1 border-t border-dashed border-[#e2e8f0]">
                      <span className="text-[#718096]">Est. Total</span>
                      <span className="font-bold text-[#e8622a]">
                        ₹{totalEstimatedPrice.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-[11px] text-[#718096]">
                  <div>✓ Official system enquiry</div>
                  <div>✓ Contacted within 24 hours</div>
                  <div>✓ No payment required now</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e2e8f0] text-[11px] text-[#a0aec0]">
                Questions? Call{" "}
                <a href={`tel:${YATRIVO_CONTACT.phone.replace(/\s+/g, "")}`} className="text-[#0f2922] font-semibold underline">
                  {YATRIVO_CONTACT.phone}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 5: CONFIRMATION SCREEN                              */}
        {/* ======================================================== */}
        {step === 5 && submittedEnquiry && (
          <div className="bg-white rounded-xl p-8 border border-[#e2e8f0] shadow-2xs max-w-xl mx-auto text-center">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 className="text-[#0f2922] text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-serif)" }}>
              Enquiry Submitted
            </h2>
            <p className="text-[#4a5568] text-sm leading-relaxed max-w-sm mx-auto mb-5">
              Thank you{name ? `, ${name}` : ""}! Your enquiry has been received. We will contact you within 24 hours.
            </p>

            <div className="bg-[#f7f8f5] border border-[#e2e8f0] rounded-lg p-3.5 text-left text-xs max-w-xs mx-auto mb-6 space-y-1.5">
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

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleConnectWhatsApp}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white px-5 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>Continue on WhatsApp</span>
              </button>
              <Link
                to="/trips"
                className="w-full sm:w-auto px-5 py-2.5 border border-[#e2e8f0] text-[#0f2922] hover:bg-[#f7f8f5] rounded-full text-xs font-semibold transition"
              >
                Browse Trips
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
