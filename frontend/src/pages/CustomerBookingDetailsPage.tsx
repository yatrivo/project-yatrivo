import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  bookingsApi,
  BookingResponse,
  SaveTravellerPayload
} from "@/api/bookings";

export default function CustomerBookingDetailsPage() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [booking, setBooking] = useState<BookingResponse | null>(null);

  const [travellers, setTravellers] = useState<SaveTravellerPayload[]>([]);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing booking link.");
      setLoading(false);
      return;
    }

    async function loadBooking() {
      try {
        setLoading(true);
        setError(null);
        const data = await bookingsApi.getByDetailsToken(token!);
        setBooking(data);

        // Pre-fill travellers array to match travellerCount
        const count = data.travellerCount || 1;
        const initialList: SaveTravellerPayload[] = [];

        for (let i = 0; i < count; i++) {
          const existing = data.travellers && data.travellers[i];
          if (existing) {
            initialList.push({
              id: existing.id,
              fullName: existing.fullName || "",
              age: existing.age ?? null,
              gender: existing.gender || "",
              phone: existing.phone || "",
              email: existing.email || "",
              documentType: existing.documentType || "Aadhaar",
              idNumber: existing.idNumber || "",
              notes: existing.notes || ""
            });
          } else if (i === 0) {
            // Pre-fill primary contact for Traveller 1
            initialList.push({
              fullName: data.primaryContactName || "",
              age: null,
              gender: "",
              phone: data.primaryContactPhone || "",
              email: data.primaryContactEmail || "",
              documentType: "Aadhaar",
              idNumber: "",
              notes: ""
            });
          } else {
            initialList.push({
              fullName: "",
              age: null,
              gender: "",
              phone: "",
              email: "",
              documentType: "Aadhaar",
              idNumber: "",
              notes: ""
            });
          }
        }

        setTravellers(initialList);
      } catch (err: any) {
        setError(err.message || "Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [token]);

  const handleFieldChange = (
    index: number,
    field: keyof SaveTravellerPayload,
    value: any
  ) => {
    setTravellers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validate that at least Full Name is provided for each traveller
    for (let i = 0; i < travellers.length; i++) {
      if (!travellers[i].fullName.trim()) {
        alert(`Please enter the full name for Traveller ${i + 1}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      await bookingsApi.saveTravellersCustomer(token, travellers);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      alert(err.message || "Failed to submit traveller details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8f5] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-[#0f2922] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-[#718096] font-medium text-xs">Loading booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#f7f8f5] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 max-w-md w-full text-center shadow-xs">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#0f2922] mb-2" style={{ fontFamily: "var(--font-serif, serif)" }}>
            Booking Link Unavailable
          </h2>
          <p className="text-xs text-[#718096] mb-6">
            {error || "The link you followed is invalid, has expired, or the booking could not be found."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-[#0f2922] hover:bg-[#1a3d31] text-white font-medium text-xs rounded-xl transition shadow-xs"
          >
            Go to Yatrivo Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8f5] pb-16">
      {/* Brand Header */}
      <header className="bg-white border-b border-[#e2e8f0] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Yatrivo<span className="text-[#e8622a]">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-[#718096] bg-[#f7f8f5] px-3 py-1.5 rounded-full border border-[#e2e8f0]">
            <svg className="w-3.5 h-3.5 text-[#0f2922]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Secure Traveller Form</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        {/* Success Confirmation Banner */}
        {success ? (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 text-center shadow-xs mb-8">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#0f2922] mb-2" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Traveller Details Received!
            </h1>
            <p className="text-[#718096] max-w-lg mx-auto text-xs leading-relaxed mb-6">
              Thank you, <span className="font-semibold text-[#0f2922]">{booking.primaryContactName}</span>. 
              We have received the traveller information for your booking{" "}
              <span className="font-mono font-semibold text-[#0f2922]">#{booking.bookingNumber}</span>. 
              Our team will review the details and reach out on WhatsApp/phone for any next steps.
            </p>

            <div className="bg-[#f7f8f5] rounded-xl p-4 max-w-md mx-auto border border-[#e2e8f0] text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-[#718096]">Trip:</span>
                <span className="font-semibold text-[#0f2922]">{booking.tripName || "Tour"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718096]">Departure Date:</span>
                <span className="font-semibold text-[#0f2922]">{booking.tripDateLabel || "As scheduled"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718096]">Travellers Submitted:</span>
                <span className="font-bold text-[#0f2922]">{travellers.length} Person(s)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="px-4 py-2 border border-[#e2e8f0] text-[#4a5568] rounded-xl text-xs font-medium hover:bg-[#f7f8f5] transition cursor-pointer"
              >
                Edit Submitted Details
              </button>
              <Link
                to="/"
                className="px-5 py-2 bg-[#0f2922] hover:bg-[#1a3d31] text-white rounded-xl text-xs font-semibold transition shadow-xs"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Booking Summary Header Card */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#f7f8f5] text-[#0f2922] rounded-md border border-[#e2e8f0]">
                      {booking.bookingNumber}
                    </span>
                    <span className="text-xs text-[#a0aec0]">•</span>
                    <span className="text-xs text-[#718096] font-medium">
                      Booking Information
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                    {booking.tripName || "Trip Booking"}
                  </h1>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-[#4a5568] bg-[#f7f8f5] px-4 py-2 rounded-xl border border-[#e2e8f0]">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#718096]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{booking.travellerCount} Traveller{booking.travellerCount > 1 ? "s" : ""}</span>
                  </div>
                  {booking.tripDateLabel && (
                    <>
                      <span className="text-[#cbd5e1]">|</span>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-[#718096]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{booking.tripDateLabel}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#718096]">
                {booking.destinationLabel && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#a0aec0] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">Destination: <strong className="text-[#0f2922] font-semibold">{booking.destinationLabel}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#a0aec0] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="truncate">Contact: <strong className="text-[#0f2922] font-semibold">{booking.primaryContactName}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#a0aec0] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="truncate">Phone: <strong className="text-[#0f2922] font-semibold">{booking.primaryContactPhone}</strong></span>
                </div>
              </div>
            </div>

            {/* Instruction Notice */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 mb-6 flex items-start gap-3 shadow-2xs">
              <svg className="w-4 h-4 text-[#e8622a] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-[#4a5568] leading-relaxed">
                <span className="font-semibold text-[#0f2922]">Traveller Information Form:</span> Please provide details for all{" "}
                <strong>{booking.travellerCount} traveller{booking.travellerCount > 1 ? "s" : ""}</strong> joining this trip. 
                Government regulations and hotel/permit policies require verified full names and ID documentation.
              </div>
            </div>

            {/* Traveller Form Cards */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {travellers.map((traveller, index) => (
                <div
                  key={index}
                  className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-white border border-[#e2e8f0] text-[#0f2922] rounded-full flex items-center justify-center font-bold text-[10px]">
                        {index + 1}
                      </span>
                      <h3 className="font-bold text-[#0f2922] text-xs">
                        Traveller {index + 1}
                        {index === 0 && (
                          <span className="ml-2 text-[10px] font-medium text-[#718096] bg-[#f7f8f5] px-2 py-0.5 rounded-full border border-[#e2e8f0]">
                            Primary Contact
                          </span>
                        )}
                      </h3>
                    </div>
                    <span className="text-[11px] text-[#a0aec0]">
                      Slot {index + 1} of {travellers.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#4a5568] mb-1">
                        Full Name (as per ID) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={traveller.fullName}
                        onChange={(e) => handleFieldChange(index, "fullName", e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#0f2922] bg-white text-[#0f2922]"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-xs font-semibold text-[#4a5568] mb-1">
                        Gender
                      </label>
                      <select
                        value={traveller.gender || ""}
                        onChange={(e) => handleFieldChange(index, "gender", e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#0f2922] bg-white text-[#0f2922]"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-xs font-semibold text-[#4a5568] mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        placeholder="e.g. 28"
                        value={traveller.age ?? ""}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            "age",
                            e.target.value ? parseInt(e.target.value, 10) : null
                          )
                        }
                        className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#0f2922] bg-white text-[#0f2922]"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-[#4a5568] mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 9876543210"
                        value={traveller.phone || ""}
                        onChange={(e) => handleFieldChange(index, "phone", e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#0f2922] bg-white text-[#0f2922]"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-[#4a5568] mb-1">
                        Email Address (optional)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. traveller@example.com"
                        value={traveller.email || ""}
                        onChange={(e) => handleFieldChange(index, "email", e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#0f2922] bg-white text-[#0f2922]"
                      />
                    </div>

                    {/* Document Type */}
                    <div>
                      <label className="block text-xs font-semibold text-[#4a5568] mb-1">
                        ID Document Type
                      </label>
                      <select
                        value={traveller.documentType || "Aadhaar"}
                        onChange={(e) => handleFieldChange(index, "documentType", e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#0f2922] bg-white text-[#0f2922]"
                      >
                        <option value="Aadhaar">Aadhaar Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Other">Other Government ID</option>
                      </select>
                    </div>

                    {/* Document Number */}
                    <div>
                      <label className="block text-xs font-semibold text-[#4a5568] mb-1">
                        ID Document Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1234 5678 9012"
                        value={traveller.idNumber || ""}
                        onChange={(e) => handleFieldChange(index, "idNumber", e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#0f2922] bg-white text-[#0f2922]"
                      />
                    </div>

                    {/* Notes */}
                    <div className="sm:col-span-2 md:col-span-3">
                      <label className="block text-xs font-semibold text-[#4a5568] mb-1">
                        Special Requests / Food Preferences / Medical Notes (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Vegetarian diet, allergic to peanuts, etc."
                        value={traveller.notes || ""}
                        onChange={(e) => handleFieldChange(index, "notes", e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#0f2922] bg-white text-[#0f2922]"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Form Bottom Submission Bar */}
              <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 sticky bottom-4 z-20">
                <div className="text-xs text-[#718096]">
                  <span className="font-semibold text-[#0f2922]">Ready to submit:</span> All {travellers.length} traveller slots will be saved.
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#e8622a] hover:bg-[#d4541f] text-white font-semibold text-xs rounded-lg transition shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Details...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Submit Traveller Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
