import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";
import type { Review } from "@/data/reviews";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1;
        const filled = idx <= (hovered || value);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(idx)}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110"
            aria-label={`Rate ${idx} star${idx > 1 ? "s" : ""}`}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "#e2e8f0"}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
        );
      })}
    </div>
  );
}

let reviewCounter = 200;

export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const { pageParams, tripInstances, trips, setReviews } = useApp();

  const instanceId = searchParams.get("instanceId") || searchParams.get("instance") || pageParams.tripInstanceId;
  const instance = instanceId ? tripInstances.find((i) => i.id === instanceId) : null;
  const prefilledTrip = instance ? trips.find((t) => t.id === instance.tripId) : null;

  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [selectedTripId, setSelectedTripId] = useState(prefilledTrip?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required.";
    if (text.trim().length < 20) errs.text = "Review must be at least 20 characters.";
    if (!rating) errs.rating = "Please select a star rating.";
    const tripId = prefilledTrip?.id ?? selectedTripId;
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) errs.trip = "Please select a trip.";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      const trip = trips.find((t) => t.id === (prefilledTrip?.id ?? selectedTripId))!;
      const newReview: Review = {
        id: `r-user-${++reviewCounter}`,
        name: name.trim(),
        tripName: trip.name,
        destination: trip.destination,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        text: text.trim(),
        date: new Date().toISOString().slice(0, 10),
        status: "pending" as const,
        avatar: name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      };
      setReviews((prev) => [newReview, ...prev]);
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div>
      <section className="relative pt-24 pb-16 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&h=600&fit=crop&auto=format"
          alt="Himalayan mountains"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2922]/80 to-[#0f2922]/60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">SHARE YOUR EXPERIENCE</div>
          <h1 className="text-white text-4xl sm:text-5xl mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            {prefilledTrip ? `Review: ${prefilledTrip.name}` : "Share Your Yatrivo Experience"}
          </h1>
          {instance && (
            <p className="text-white/75 text-sm">
              {prefilledTrip?.name} — {instance.displayDate}
            </p>
          )}
        </div>
      </section>

      <section className="py-16 bg-[#f7f8f5]">
        <div className="max-w-xl mx-auto px-4">
          {submitted ? (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-10 text-center">
              <div className="text-4xl mb-4">🙏</div>
              <h2 className="text-[#0f2922] text-2xl mb-3" style={{ fontFamily: "var(--font-serif)" }}>Thank You!</h2>
              <p className="text-[#4a5568] text-sm leading-relaxed mb-6">
                Your review has been submitted and is awaiting approval. We appreciate you taking the time to share your Yatrivo experience.
              </p>
              <Link
                to="/reviews"
                className="inline-block bg-[#0f2922] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#1a4a39] transition-colors"
              >
                Back to Reviews
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-[#e2e8f0] rounded-2xl p-8 space-y-6">
              {/* Star Rating */}
              <div>
                <label className="block text-[#0f2922] text-sm font-medium mb-2">Your Rating</label>
                <StarPicker value={rating} onChange={setRating} />
                {errors.rating && <p className="text-red-500 text-xs mt-1">{errors.rating}</p>}
              </div>

              {/* Name */}
              <div>
                <label className="block text-[#0f2922] text-sm font-medium mb-1.5">Your Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Siddharth Verma"
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#0f2922] focus:outline-none focus:ring-2 focus:ring-[#e8622a]/30 focus:border-[#e8622a]"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Trip selection if not pre-filled */}
              {!prefilledTrip && (
                <div>
                  <label className="block text-[#0f2922] text-sm font-medium mb-1.5">Trip <span className="text-red-500">*</span></label>
                  <select
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#0f2922] focus:outline-none focus:ring-2 focus:ring-[#e8622a]/30 focus:border-[#e8622a] bg-white"
                  >
                    <option value="">Select a trip...</option>
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {errors.trip && <p className="text-red-500 text-xs mt-1">{errors.trip}</p>}
                </div>
              )}

              {/* Review Text */}
              <div>
                <label className="block text-[#0f2922] text-sm font-medium mb-1.5">Your Review <span className="text-red-500">*</span></label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  placeholder="Tell us about your experience (min 20 characters)..."
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#0f2922] focus:outline-none focus:ring-2 focus:ring-[#e8622a]/30 focus:border-[#e8622a] resize-none"
                />
                <div className="flex justify-between mt-1">
                  {errors.text ? <p className="text-red-500 text-xs">{errors.text}</p> : <span />}
                  <span className={`text-xs ${text.trim().length < 20 ? "text-[#4a5568]" : "text-green-600"}`}>{text.trim().length} / 20 min</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#e8622a] hover:bg-[#d45520] disabled:opacity-60 text-white font-medium py-3.5 rounded-full transition-colors text-sm"
              >
                {loading ? "Submitting..." : "SUBMIT REVIEW"}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
