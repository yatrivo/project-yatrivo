import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { mediaApi } from "@/api/media";
import { reviewsApi, type TokenContextResponse } from "@/api/reviews";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const labels: Record<number, string> = {
    1: "Terrible",
    2: "Poor",
    3: "Average",
    4: "Very Good",
    5: "Excellent!"
  };

  const activeRating = hovered || value;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((idx) => {
          const filled = idx <= activeRating;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(idx)}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(0)}
              className="p-1 transition-transform hover:scale-115 cursor-pointer focus:outline-none"
              aria-label={`Rate ${idx} star${idx > 1 ? "s" : ""}`}
            >
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                className={`transition-colors ${
                  filled ? "text-amber-400 fill-amber-400 drop-shadow-xs" : "text-gray-200 fill-gray-200"
                }`}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          );
        })}
      </div>
      <div className="text-xs font-semibold text-[#0f2922]">
        {labels[activeRating] || "Select rating"}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { trips } = useApp();

  // State for token data
  const [tokenLoading, setTokenLoading] = useState(!!token);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenContextResponse | null>(null);

  // Form states
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [selectedTripId, setSelectedTripId] = useState("");
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    setTokenLoading(true);
    reviewsApi
      .getRequestByToken(token)
      .then((data) => {
        if (!mounted) return;
        setTokenData(data);
        setName(data.customerName || "");
      })
      .catch((err: any) => {
        if (!mounted) return;
        setTokenError(err?.message || "Invalid or expired review link.");
      })
      .finally(() => {
        if (mounted) setTokenLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const destSlug = tokenData?.destinationSlug || "uttarakhand";
      for (let i = 0; i < files.length; i++) {
        if (reviewPhotos.length + i >= 5) break;
        const file = files[i];
        const asset = await mediaApi.upload(file, {
          category: "reviews",
          destinationSlug: destSlug,
          isReview: true
        });
        setReviewPhotos((prev) => [...prev, asset.url]);
      }
    } catch {
      // Fallback local preview if offline
      for (let i = 0; i < files.length; i++) {
        if (reviewPhotos.length + i >= 5) break;
        setReviewPhotos((prev) => [...prev, URL.createObjectURL(files[i])]);
      }
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    setReviewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = "Your name is required.";
    if (text.trim().length < 15) {
      errs.text = "Please write at least 15 characters sharing your experience.";
    }
    if (!rating) errs.rating = "Please select a rating.";

    if (!token && !selectedTripId) {
      errs.trip = "Please choose the trip you took.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (token) {
        await reviewsApi.submitReview({
          token,
          rating,
          body: text.trim(),
          reviewerName: name.trim(),
          photos: reviewPhotos
        });
      }
      setSubmitted(true);
    } catch (err: any) {
      setErrors({ form: err?.message || "Failed to submit review. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Header display info
  const heroTripName = tokenData?.tripName || (selectedTripId ? (trips || []).find((t) => t.id === selectedTripId)?.name : null);
  const heroDestination = tokenData?.destinationName;
  const heroDate = tokenData?.departureDate;

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfc]">
      <SEO title="Submit Trip Review" noindex={true} />
      {/* Hero Banner */}
      <section className="relative pt-24 pb-16 overflow-hidden bg-[#0f2922]">
        <img
          src={tokenData?.coverImage || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&h=600&fit=crop&auto=format"}
          alt="Travel Landscape"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f2922] via-[#0f2922]/70 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center text-white">
          <span className="inline-block px-3 py-1 rounded-full bg-[#e8622a]/20 border border-[#e8622a]/40 text-[#e8622a] text-xs uppercase tracking-widest font-bold mb-3">
            POST-TRIP FEEDBACK
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 tracking-tight" style={{ fontFamily: "var(--font-serif, serif)" }}>
            {heroTripName ? `Review: ${heroTripName}` : "Share Your Yatrivo Journey"}
          </h1>
          <p className="text-white/80 text-sm max-w-xl mx-auto leading-relaxed">
            {heroDestination ? `Exploring ${heroDestination}` : "Help future travellers and fellow explorers discover genuine Himalayan adventures."}
            {heroDate && ` • Departure on ${heroDate}`}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 py-12 px-4 sm:px-6 max-w-2xl mx-auto w-full">
        {/* Token Loading State */}
        {tokenLoading && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center shadow-xs">
            <div className="w-10 h-10 border-4 border-[#0f2922] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-[#718096]">Loading your trip details...</p>
          </div>
        )}

        {/* Token Error State */}
        {!tokenLoading && tokenError && (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#0f2922] mb-1" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Invalid or Expired Link
            </h3>
            <p className="text-xs text-[#718096] mb-6 leading-relaxed">
              {tokenError} Please reach out to our Yatrivo support team or check the link sent to your WhatsApp.
            </p>
            <Link
              to="/"
              className="inline-block px-5 py-2.5 bg-[#0f2922] text-white text-xs font-semibold rounded-xl hover:bg-[#1b4332] transition"
            >
              Return to Yatrivo Homepage
            </Link>
          </div>
        )}

        {/* Already Submitted State */}
        {!tokenLoading && tokenData && tokenData.alreadySubmitted && !submitted && (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 text-center shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                You Have Already Reviewed This Trip!
              </h2>
              <p className="text-xs text-[#718096] mt-1">
                Thank you, <strong>{tokenData.customerName}</strong>! Your review for <strong>{tokenData.tripName}</strong> was received with gratitude.
              </p>
            </div>

            {tokenData.existingReview && (
              <div className="bg-[#f7f8f5] p-5 rounded-xl text-left border border-[#e2e8f0] text-xs space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#0f2922]">Your Rating:</span>
                    <span className="text-amber-500 font-bold">{"★".repeat(tokenData.existingReview.rating)}</span>
                  </div>
                  <span className="text-[#a0aec0]">
                    {new Date(tokenData.existingReview.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <p className="text-[#4a5568] whitespace-pre-line leading-relaxed">
                  "{tokenData.existingReview.body}"
                </p>
                {tokenData.existingReview.photoUrls && tokenData.existingReview.photoUrls.length > 0 && (
                  <div className="flex gap-2 pt-2">
                    {tokenData.existingReview.photoUrls.map((pUrl, pIdx) => (
                      <img key={pIdx} src={pUrl} alt="Submitted photo" className="w-12 h-12 object-cover rounded-lg border border-[#e2e8f0]" />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <Link
                to="/destinations"
                className="inline-block px-5 py-2.5 bg-[#0f2922] text-white text-xs font-semibold rounded-xl hover:bg-[#1b4332] transition"
              >
                Explore More Destinations
              </Link>
            </div>
          </div>
        )}

        {/* Thank You / Submission Success State */}
        {submitted && (
          <div className="bg-white rounded-2xl border border-emerald-200 p-10 text-center shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
              🙏
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
              Thank You for Your Feedback!
            </h2>
            <p className="text-sm text-[#4a5568] leading-relaxed max-w-md mx-auto">
              Your honest review and photos have been submitted. They will be published on the website shortly after a quick quality verification by our team.
            </p>
            <div className="pt-4 flex items-center justify-center gap-3 flex-wrap">
              <Link
                to="/reviews"
                className="px-5 py-2.5 bg-[#0f2922] hover:bg-[#1b4332] text-white text-xs font-semibold rounded-xl transition"
              >
                Browse All Reviews
              </Link>
              <Link
                to="/trips"
                className="px-5 py-2.5 border border-[#e2e8f0] hover:border-[#0f2922] text-[#0f2922] text-xs font-semibold rounded-xl transition"
              >
                Plan Next Trip →
              </Link>
            </div>
          </div>
        )}

        {/* Active Form */}
        {!tokenLoading && !tokenError && (!tokenData || !tokenData.alreadySubmitted) && !submitted && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e2e8f0] p-6 sm:p-8 shadow-xs space-y-6">
            {/* Context Badge if from Token */}
            {tokenData && (
              <div className="bg-[#f7f8f5] border border-[#e2e8f0] p-4 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold text-[#a0aec0] uppercase tracking-wider">Verified Booking</div>
                  <div className="text-sm font-bold text-[#0f2922]">{tokenData.tripName}</div>
                  <div className="text-xs text-[#718096]">
                    {tokenData.departureDate} • Ref: {tokenData.bookingNumber}
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" title="Verified traveller link" />
              </div>
            )}

            {errors.form && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {errors.form}
              </div>
            )}

            {/* Rating Picker */}
            <div>
              <label className="block text-xs font-bold text-[#0f2922] uppercase tracking-wider mb-2">
                Overall Experience Rating <span className="text-[#e8622a]">*</span>
              </label>
              <StarPicker value={rating} onChange={setRating} />
              {errors.rating && <p className="text-red-500 text-xs mt-1">{errors.rating}</p>}
            </div>

            {/* Traveller Name */}
            <div>
              <label className="block text-xs font-bold text-[#0f2922] uppercase tracking-wider mb-1.5">
                Your Full Name <span className="text-[#e8622a]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#0f2922] focus:outline-none focus:border-[#0f2922]"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Trip Selector (only if token not provided) */}
            {!token && (
              <div>
                <label className="block text-xs font-bold text-[#0f2922] uppercase tracking-wider mb-1.5">
                  Select Trip <span className="text-[#e8622a]">*</span>
                </label>
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#0f2922] focus:outline-none focus:border-[#0f2922] bg-white"
                >
                  <option value="">Choose trip...</option>
                  {(trips || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {errors.trip && <p className="text-red-500 text-xs mt-1">{errors.trip}</p>}
              </div>
            )}

            {/* Written Review */}
            <div>
              <label className="block text-xs font-bold text-[#0f2922] uppercase tracking-wider mb-1.5">
                Your Experience & Memories <span className="text-[#e8622a]">*</span>
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="How was your trek leader, the accommodation, route scenery, and organisation? What was your favourite moment?"
                className="w-full border border-[#e2e8f0] rounded-xl p-3.5 text-sm text-[#0f2922] focus:outline-none focus:border-[#0f2922] leading-relaxed resize-none"
              />
              <div className="flex justify-between mt-1 text-xs">
                {errors.text ? <span className="text-red-500">{errors.text}</span> : <span />}
                <span className={text.trim().length >= 15 ? "text-emerald-600 font-medium" : "text-[#a0aec0]"}>
                  {text.trim().length} / 15 min chars
                </span>
              </div>
            </div>

            {/* Photos Upload */}
            <div>
              <label className="block text-xs font-bold text-[#0f2922] uppercase tracking-wider mb-1.5">
                Share Trip Photos (optional)
              </label>
              <div className="flex gap-2.5 flex-wrap items-center mb-2">
                {reviewPhotos.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#e2e8f0] group">
                    <img src={url} alt={`Trip photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(i)}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-xs font-bold"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))}

                {reviewPhotos.length < 5 && (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[#cbd5e1] hover:border-[#0f2922] flex flex-col items-center justify-center cursor-pointer transition bg-[#fafbfa]">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="sr-only"
                      disabled={uploadingPhoto}
                    />
                    {uploadingPhoto ? (
                      <div className="w-4 h-4 border-2 border-[#0f2922] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="text-xl leading-none text-[#718096]">+</span>
                        <span className="text-[10px] text-[#718096] font-medium mt-1">Add Photo</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              <p className="text-[11px] text-[#a0aec0]">
                Attach up to 5 photos from your trek or tour (PNG, JPG, WEBP).
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e8622a] hover:bg-[#d0521c] text-white font-bold py-3.5 rounded-xl transition shadow-sm text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Your Review...
                </div>
              ) : (
                "Submit Review"
              )}
            </button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
