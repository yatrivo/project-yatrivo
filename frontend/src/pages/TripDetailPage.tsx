import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { tripsApi } from "@/api/trips";
import type { PublicGalleryItem } from "@/api/gallery";
import { settingsApi, type CancellationRule } from "@/api/settings";
import type { Trip, TripDestination, TripHighlightCard, TripFaqItem, TripInstance, TripItineraryDay } from "@/data/trips";
import BackLink from "@/components/BackLink";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import GalleryLightbox from "@/components/GalleryLightbox";
import { YATRIVO_CONTACT } from "@/constants/contact";

interface TripDetailPageProps {
  adminMode?: boolean;
}

// ── Departure Modals for Admin Mode ──────────────────────────────────────────

interface DepartureModalProps {
  title: string;
  initial?: {
    date: string;
    price: number;
    spotsTotal: number;
    notes?: string;
  };
  onSave: (data: { date: string; displayDate: string; price: number; spotsTotal: number; notes?: string }) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
}

function DepartureModal({ title, initial, onSave, onClose, isSaving }: DepartureModalProps) {
  const [date, setDate] = useState(initial?.date || "");
  const [price, setPrice] = useState(String(initial?.price || ""));
  const [spotsTotal, setSpotsTotal] = useState(String(initial?.spotsTotal || "12"));
  const [notes, setNotes] = useState(initial?.notes || "");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setError("Departure date is required.");
      return;
    }
    const d = new Date(date + "T00:00:00");
    const displayDate = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    await onSave({
      date,
      displayDate,
      price: Number(price) || 0,
      spotsTotal: Number(spotsTotal) || 12,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={isSaving ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
            {title}
          </h3>
          <button onClick={onClose} disabled={isSaving} className="text-[#a0aec0] hover:text-[#0f2922] transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Departure Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Price per Person (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 9999"
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Total Capacity</label>
              <input
                type="number"
                value={spotsTotal}
                onChange={(e) => setSpotsTotal(e.target.value)}
                min={1}
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4a5568] mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Special festive batch, includes bonfire night"
              className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-[#0f2922] hover:bg-[#1a3d31] disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Departure"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 border border-[#e2e8f0] text-[#4a5568] text-sm font-medium rounded-lg hover:bg-[#f7f8f5] transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TripDetailPage({ adminMode }: TripDetailPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = Boolean(adminMode || location.pathname.startsWith("/admin/"));
  const { pageParams, openEnquiryModal, trips, destinations, tripInstances, showToast, refreshTrips, siteSettings } = useApp();

  const handleMobileBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(isAdmin ? "/admin/trips" : "/trips", { replace: true });
    }
  };

  const currentSlug = slug || pageParams.tripId || "chopta-trek";
  const initialTrip = trips.find(
    (t) => t.id.toLowerCase() === currentSlug.toLowerCase() || (t.slug && t.slug.toLowerCase() === currentSlug.toLowerCase())
  ) || trips[0];

  const [trip, setTrip] = useState<Trip | null>(initialTrip || null);
  const [loading, setLoading] = useState(false);
  const [policyRules, setPolicyRules] = useState<CancellationRule[]>([
    { days: "30+ days before departure", refund: "100%", note: "Full refund (less nominal processing fee)" },
    { days: "15–29 days before departure", refund: "50%", note: "50% refund or 100% trip credit voucher" },
    { days: "Under 15 days before departure", refund: "0%", note: "Non-refundable due to reserved cabin & permit logistics" },
  ]);

  // Departure management state for admin mode
  const [isAddingDeparture, setIsAddingDeparture] = useState(false);
  const [editingDeparture, setEditingDeparture] = useState<TripInstance | null>(null);
  const [isSavingDeparture, setIsSavingDeparture] = useState(false);
  const [departureTab, setDepartureTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming");

  // Fetch full trip from API to ensure fresh multidestination and departure data
  const refreshTripData = async () => {
    try {
      setLoading(true);
      const data = await tripsApi.getOne(currentSlug);
      if (data) setTrip(data);
    } catch {
      if (initialTrip) setTrip(initialTrip);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshTripData();
  }, [currentSlug, initialTrip]);

  // Fetch global cancellation policy from settings API
  useEffect(() => {
    settingsApi.getCancellationPolicy()
      .then((res) => {
        if (res && res.rules && res.rules.length > 0) {
          setPolicyRules(res.rules);
        }
      })
      .catch(() => {});
  }, []);

  const activeTrip = trip || initialTrip;
  const tripId = activeTrip?.id ?? currentSlug;
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast("Trip link copied to clipboard!", "success");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  const handleChatWhatsApp = () => {
    const text = `Hi Yatrivo! I'm interested in the ${activeTrip?.name || "Himalayan"} trip (${activeTrip?.duration || ""}). Could you please share more details?`;
    const targetWa = siteSettings?.contact?.inquiryWhatsapp || siteSettings?.contact?.whatsapp;
    window.open(YATRIVO_CONTACT.getWhatsAppUrl(text, targetWa), "_blank", "noopener,noreferrer");
  };

  // Resolve destinations
  const tripDestinations: TripDestination[] = (() => {
    if (activeTrip?.destinations && activeTrip.destinations.length > 0) {
      return activeTrip.destinations;
    }
    if (activeTrip?.destination) {
      const d = destinations.find(
        (dest) => dest.id === activeTrip.destination || dest.slug === activeTrip.destination || dest.name === activeTrip.destination
      );
      if (d) {
        return [{ id: d.id, name: d.name, slug: d.slug, image: d.image, isPrimary: true }];
      }
      return [{ id: activeTrip.destination, name: activeTrip.destination, slug: activeTrip.destination, isPrimary: true }];
    }
    return [];
  })();

  // Resolve all departures
  const allDepartures = (() => {
    if (activeTrip?.departures && activeTrip.departures.length > 0) {
      return activeTrip.departures;
    }
    return tripInstances.filter((inst) => inst.tripId === tripId);
  })();

  const upcomingDepartures = allDepartures
    .filter((d) => d.status === "upcoming")
    .sort((a, b) => a.date.localeCompare(b.date));

  const completedDepartures = allDepartures
    .filter((d) => d.status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date));

  const cancelledDepartures = allDepartures
    .filter((d) => d.status === "cancelled")
    .sort((a, b) => b.date.localeCompare(a.date));

  // Max travellers derived from departures or trip setting
  const maxTravellers = activeTrip?.maxTravellers || Math.max(...allDepartures.map((d) => d.spotsTotal), 12);

  // Dynamic Highlight Metric Cards (Requirement 11)
  const isHighlightCard = (h: any): h is TripHighlightCard =>
    typeof h === "object" && h !== null && "label" in h && "value" in h;

  const highlightCards: TripHighlightCard[] = (() => {
    if (activeTrip?.highlights && activeTrip.highlights.length > 0) {
      const cards = (activeTrip.highlights as any[]).filter(isHighlightCard);
      if (cards.length > 0) return cards;
    }
    return [
      { icon: "📍", label: "Starting Point", value: activeTrip?.startingPoint || "Dehradun" },
      { icon: "👥", label: "Group Size", value: `Max ${maxTravellers}` },
      { icon: "🏕️", label: "Stay Style", value: "Timber Cabins" },
      { icon: "🍽️", label: "Meals", value: "All Included" },
    ];
  })();

  const legacyBulletHighlights: string[] = (() => {
    if (activeTrip?.highlights && activeTrip.highlights.length > 0) {
      return (activeTrip.highlights as any[]).filter((h) => typeof h === "string");
    }
    return [];
  })();

  // Dynamic FAQs (Requirement 12)
  const tripFaqs: { question: string; answer: string }[] = (() => {
    if (activeTrip?.faqs && activeTrip.faqs.length > 0) {
      return (activeTrip.faqs as any[]).map((f: any) => ({
        question: f.question || f.q || "",
        answer: f.answer || f.a || ""
      })).filter((f) => f.question);
    }
    return [
      { question: "What fitness level is required?", answer: "A moderate fitness level with basic walking ability. No prior trekking experience is required for Chopta." },
      { question: "What should I pack?", answer: "Warm layers, waterproof jacket, trekking shoes, sunscreen, sunglasses, and personal medicines. We'll send a full packing list on booking." },
      { question: "Is altitude sickness a risk?", answer: "Chopta sits at ~2,680m base and Chandrashila at 4,130m. We schedule slow acclimatization. Our guides carry oxygen cylinders as precaution." },
      { question: "Are meals included?", answer: "Yes — all meals from Day 1 dinner to Day 4 breakfast. Vegetarian and non-vegetarian options available. Organic where possible." },
    ];
  })();

  // Departure management handlers
  const handleAddDeparture = async (data: { date: string; displayDate: string; price: number; spotsTotal: number; notes?: string }) => {
    setIsSavingDeparture(true);
    try {
      await tripsApi.addDeparture(tripId, {
        date: data.date,
        displayDate: data.displayDate,
        price: data.price,
        spotsTotal: data.spotsTotal,
        notes: data.notes,
      });
      await refreshTripData();
      void refreshTrips();
      setIsAddingDeparture(false);
      showToast("Departure added successfully.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add departure";
      showToast(msg, "error");
    } finally {
      setIsSavingDeparture(false);
    }
  };

  const handleEditDeparture = async (data: { date: string; displayDate: string; price: number; spotsTotal: number; notes?: string }) => {
    if (!editingDeparture) return;
    setIsSavingDeparture(true);
    try {
      await tripsApi.updateDeparture(editingDeparture.id, {
        date: data.date,
        displayDate: data.displayDate,
        price: data.price,
        spotsTotal: data.spotsTotal,
        notes: data.notes,
      });
      await refreshTripData();
      void refreshTrips();
      setEditingDeparture(null);
      showToast("Departure updated successfully.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update departure";
      showToast(msg, "error");
    } finally {
      setIsSavingDeparture(false);
    }
  };

  const handleCompleteDeparture = async (inst: TripInstance) => {
    try {
      await tripsApi.updateDeparture(inst.id, { status: "completed" });
      await refreshTripData();
      void refreshTrips();
      showToast("Departure marked as completed.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to complete departure";
      showToast(msg, "error");
    }
  };

  const handleCancelDeparture = async (inst: TripInstance) => {
    if (!window.confirm(`Are you sure you want to cancel the departure on ${inst.displayDate || inst.date}? It will be moved to cancelled departures.`)) {
      return;
    }
    try {
      await tripsApi.updateDeparture(inst.id, { status: "cancelled" });
      await refreshTripData();
      void refreshTrips();
      showToast("Departure cancelled and moved to cancelled departures.", "info");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel departure";
      showToast(msg, "error");
    }
  };



  // Dynamic Itinerary from Trip Data
  const tripItinerary = (() => {
    if (activeTrip?.itinerary && activeTrip.itinerary.length > 0) {
      return activeTrip.itinerary.map((d: TripItineraryDay, idx: number) => {
        const dayNum = d.dayNumber ?? idx + 1;
        const rawTitle = d.title || `Day ${dayNum}`;
        const title = rawTitle.replace(/^day\s*\d+\s*[:\-–]\s*/i, "").trim() || rawTitle;
        return {
          day: `Day ${dayNum}`,
          title,
          desc: d.description || "",
          meals: d.meals,
          stay: d.stay,
        };
      });
    }
    // Fallback default itinerary if trip has no configured itinerary
    return [
      { day: "Day 1", title: "Dehradun to Chopta Basecamp", desc: "Scenic mountain drive via Devprayag where Alaknanda meets Bhagirathi. Arrive at our pine-wood meadow cabins. Welcome dinner with local Pahadi cuisine. Evening orientation walk.", meals: null, stay: null },
      { day: "Day 2", title: "Trek to Tungnath Temple & Summit", desc: "Mindful morning ascent through dense rhododendron forests to the ancient Tungnath shrine (3,680m), pushing to Chandrashila peak (4,130m) for a 360° panoramic view of Nanda Devi, Trishul, Bandarpoonch.", meals: null, stay: null },
      { day: "Day 3", title: "Deoria Tal Lake Exploration", desc: "Short scenic trek to pristine alpine Deoria Tal lake — perfectly reflecting Chaukhamba mountains. Evening stargazing session with a local astronomy guide. Campfire and folk music.", meals: null, stay: null },
      { day: "Day 4", title: "Sunrise Devotion & Return Drive", desc: "Final organic breakfast. Checkout. Scenic drive back to Dehradun with planned stops at roadside tea stalls overlooking river valleys.", meals: null, stay: null },
    ];
  })();

  const [openDays, setOpenDays] = useState<Record<number, boolean>>({ 0: true });
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const galleryLightboxItems: PublicGalleryItem[] = useMemo(
    () =>
      (activeTrip?.gallery || []).map((url, idx) => ({
        id: `${activeTrip?.id || "trip"}-gallery-${idx}`,
        title: `${activeTrip?.name || "Trip"} — Photo ${idx + 1}`,
        imageUrl: url,
        thumbnailUrl: url,
        viewerUrl: url,
        originalUrl: url,
        placeholder: null,
        width: null,
        height: null,
        altText: `${activeTrip?.name || "Trip"} photo ${idx + 1}`,
        category: activeTrip?.category || "Trip",
        featured: false,
        displayOrder: idx + 1,
        createdAt: new Date().toISOString(),
      })),
    [activeTrip?.id, activeTrip?.name, activeTrip?.category, activeTrip?.gallery]
  );

  const toggleDay = (i: number) => {
    setOpenDays((prev) => ({
      ...prev,
      [i]: !(prev[i] ?? (i === 0))
    }));
  };

  // Restrict direct visitor access to draft and archived packages
  if (!isAdmin && (activeTrip?.status === "draft" || activeTrip?.status === "archived")) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl font-bold mb-4 border border-amber-200">
          !
        </div>
        <h1 className="text-2xl font-bold text-[#0f2922] mb-2" style={{ fontFamily: "var(--font-serif, serif)" }}>
          Trip Package Unavailable
        </h1>
        <p className="text-[#718096] text-sm max-w-md mb-6 leading-relaxed">
          This Himalayan package is currently drafted or archived and not open for public bookings. Explore our active scheduled departures.
        </p>
        <BackLink
          to="/trips"
          className="bg-[#0f2922] hover:bg-[#1a3d31] text-white font-medium text-sm px-6 py-2.5 rounded-lg transition"
        >
          Explore All Active Trips
        </BackLink>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-0">
      <SEO
        title={activeTrip?.seoTitle || activeTrip?.name}
        description={activeTrip?.seoDescription || activeTrip?.shortDescription || activeTrip?.overview}
        image={activeTrip?.coverImage}
        keywords={activeTrip?.destinations?.map((d) => d.name).join(", ")}
        noindex={isAdmin}
      />
      {/* Admin Mode Bar */}
      {isAdmin && (
        <>
          <div className="bg-[#0f2922] text-white px-4 sm:px-6 py-3 border-b border-white/10 flex items-center justify-between sticky top-0 z-30 shadow-md">
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <BackLink
                to="/admin/trips"
                className="inline-flex items-center gap-1.5 text-xs text-[#a3bfb5] hover:text-white transition font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Trips
              </BackLink>
              <span className="text-white/20">|</span>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-semibold px-2 py-0.5 rounded">
                Admin Preview Mode
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                activeTrip?.status === "draft"
                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                  : activeTrip?.status === "archived"
                  ? "bg-gray-500/20 text-gray-300 border border-gray-400/30"
                  : "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
              }`}>
                {activeTrip?.status || "published"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingDeparture(true)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
              >
                + Add Departure
              </button>
              <Link
                to={`/admin/trips/${tripId}/edit`}
                className="bg-[#e8622a] hover:bg-[#d4541f] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Trip
              </Link>
            </div>
          </div>

          {/* Admin SEO Meta Bar */}
          {(activeTrip?.seoTitle || activeTrip?.seoDescription) && (
            <div className="bg-[#16382f] text-white/90 text-xs px-4 sm:px-6 py-2 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-white/10 text-[#a3bfb5] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Active Google SEO Meta
                </span>
                <span className="font-medium text-white truncate max-w-sm sm:max-w-md">
                  {activeTrip.seoTitle || activeTrip.name}
                </span>
                {activeTrip.seoDescription && (
                  <>
                    <span className="text-white/30 hidden md:inline">•</span>
                    <span className="text-white/70 truncate max-w-lg hidden md:inline text-[11px]">
                      {activeTrip.seoDescription}
                    </span>
                  </>
                )}
              </div>
              <Link
                to={`/admin/trips/${tripId}/edit`}
                className="text-amber-300 hover:text-amber-200 underline text-[11px] shrink-0"
              >
                Edit SEO
              </Link>
            </div>
          )}
        </>
      )}

      {/* Responsive Hero Section: Proportional on Mobile, Expansive on Desktop */}
      <section className="relative h-[36vh] sm:h-[44vh] md:h-[76vh] lg:h-[80vh] min-h-[250px] sm:min-h-[300px] md:min-h-[520px] max-h-[820px] overflow-hidden bg-[#0a1f18]">
        {activeTrip?.image ? (
          <img
            src={activeTrip.image}
            alt={activeTrip.name ?? "Trip"}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f18] via-[#143a2d] to-[#0a1f18]" />
        )}

        {/* Gradient overlay for contrast */}
        <div className="absolute inset-0 hero-overlay-directional pointer-events-none" />

        {/* Mobile floating controls over hero image: Back button on the left, Share button on the right */}
        <div className="md:hidden absolute top-3.5 left-4 z-20">
          <button
            onClick={handleMobileBack}
            className="w-9 h-9 rounded-full bg-black/45 hover:bg-black/65 text-white flex items-center justify-center backdrop-blur-sm transition-colors shadow-sm cursor-pointer"
            aria-label="Back to previous page"
            title="Back to previous page"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="md:hidden absolute top-3.5 right-4 z-20 flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="w-9 h-9 rounded-full bg-black/45 hover:bg-black/65 text-white backdrop-blur-sm flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            aria-label="Share trip"
            title="Share trip"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>

        {/* Mobile photo gallery trigger badge */}
        {galleryLightboxItems.length > 0 && (
          <button
            onClick={() => setLightboxIndex(0)}
            className="md:hidden absolute bottom-3 right-4 z-20 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>1/{galleryLightboxItems.length}</span>
          </button>
        )}

        {/* Desktop Overlay Content - Preserved Established Desktop Composition */}
        <div className="hidden md:flex relative h-full items-end pb-8 md:pb-12 max-w-7xl mx-auto px-6 w-full">
          <div className="flex items-end justify-between w-full gap-4 flex-wrap">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5 text-xs text-contrast-subtle">
                <BackLink to={isAdmin ? "/admin/trips" : "/trips"} className="text-[#e8622a] hover:underline uppercase tracking-wide font-semibold">
                  {activeTrip?.category ?? "EXPERIENCE"}
                </BackLink>
                <span className="text-white/60">·</span>
                <span className="text-white/90 uppercase tracking-wide font-medium">{activeTrip?.badge ?? "ADVENTURE"}</span>
                {tripDestinations.map((d) => (
                  <span key={d.id} className="flex items-center gap-1.5">
                    <span className="text-white/60">·</span>
                    <Link
                      to={isAdmin ? `/admin/destinations/${d.slug || d.id}` : `/destinations/${d.slug || d.id}`}
                      className="text-white/90 hover:text-white uppercase tracking-wide transition-colors font-medium"
                    >
                      {d.name}
                    </Link>
                  </span>
                ))}
              </div>
              <h1 className="text-white text-4xl lg:text-5xl leading-none mb-3 text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>
                {activeTrip?.name ?? "Himalayan Adventure"}
              </h1>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-white/90 text-sm text-contrast-body">
                <span>{activeTrip?.duration ?? "4 Days / 3 Nights"}</span>
                <span>Difficulty: {activeTrip?.difficulty ?? "Moderate"}</span>
                {activeTrip?.startingPoint && <span>Starts from: {activeTrip.startingPoint}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Package Information Sheet & Navigation - Clean Transition from Image */}
      <div className="md:hidden bg-white border-b border-[#e2e8f0] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[#0f2922] text-[22px] sm:text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
              {activeTrip?.name ?? "Himalayan Adventure"}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#718096] mt-1 font-medium">
              <span>{activeTrip?.duration ?? "4 Days / 3 Nights"}</span>
              <span>•</span>
              <span className="text-[#e8622a] uppercase font-semibold">{activeTrip?.category}</span>
              <span>•</span>
              <span>{activeTrip?.difficulty ?? "Moderate"}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[#0f2922] font-bold text-xl sm:text-2xl leading-none" style={{ fontFamily: "var(--font-serif)" }}>
              ₹{activeTrip?.price ? activeTrip.price.toLocaleString("en-IN") : "9,999"}
            </div>
            <div className="text-[10px] sm:text-[11px] text-[#718096] mt-0.5">per person</div>
          </div>
        </div>

        {/* Next Scheduled Departure Box on Mobile */}
        {upcomingDepartures.length > 0 && (
          <div
            onClick={() => openEnquiryModal(tripId, upcomingDepartures[0].id)}
            className="mt-3.5 p-3 rounded-xl bg-[#f7f8f5] border border-[#e2e8f0] flex items-center justify-between gap-2.5 cursor-pointer hover:border-[#0f2922]/40 transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#e2e8f0] flex items-center justify-center text-sm shrink-0 shadow-xs">
                🗓️
              </div>
              <div className="min-w-0">
                <div className="text-[9.5px] uppercase tracking-wider font-semibold text-[#718096] leading-tight flex items-center gap-1.5">
                  <span>NEXT DEPARTURE</span>
                  {upcomingDepartures.length > 1 && (
                    <span className="text-[9px] text-[#e8622a] font-bold">
                      • {upcomingDepartures.length} dates
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#0f2922] leading-tight truncate">
                  {upcomingDepartures[0].displayDate}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                upcomingDepartures[0].spotsLeft <= 3
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}>
                {upcomingDepartures[0].spotsLeft} {upcomingDepartures[0].spotsLeft === 1 ? "seat" : "seats"} left
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        )}

        {/* Section Jump Tabs on Mobile */}
        <nav className="flex items-center gap-4 overflow-x-auto no-scrollbar pt-3 mt-1 text-xs font-semibold text-[#718096]">
          <a href="#overview" className="text-[#0f2922] border-b-2 border-[#0f2922] pb-1.5 whitespace-nowrap">Overview</a>
          <a href="#itinerary" className="hover:text-[#0f2922] pb-1.5 whitespace-nowrap">Itinerary</a>
          <a href="#inclusions" className="hover:text-[#0f2922] pb-1.5 whitespace-nowrap">Inclusions</a>
          {activeTrip?.gallery && activeTrip.gallery.length > 0 && (
            <a href="#gallery" className="hover:text-[#0f2922] pb-1.5 whitespace-nowrap">Photos</a>
          )}
          <a href="#faqs" className="hover:text-[#0f2922] pb-1.5 whitespace-nowrap">FAQs</a>
        </nav>
      </div>

      {/* Content */}
      <div id="overview" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-12">
            {/* Overview & 4 Highlight Cards (Requirement 11) */}
            <section>
              <h2 className="text-[#0f2922] text-[20px] sm:text-2xl leading-snug mb-2.5 sm:mb-4" style={{ fontFamily: "var(--font-serif)" }}>
                {activeTrip?.shortDescription || "Trek the Sacred Mountain Ridge"}
              </h2>
              <p className="text-[#4a5568] text-[13.5px] sm:text-sm leading-relaxed mb-4 sm:mb-6">
                {activeTrip?.overview ||
                  "Widely known as the 'Mini Switzerland of India', Chopta is a gorgeous pristine pine forest and meadow valley. Our itinerary is designed with unhurried acclimatization, beautiful wooden cabin stays, and authentic local Pahadi dining."}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {highlightCards.map((q) => (
                  <div key={q.label} className="bg-[#f7f8f5] rounded-lg sm:rounded-xl px-2.5 py-2 sm:p-3 flex items-center gap-2 sm:block text-left sm:text-center border border-[#e2e8f0]/60 min-w-0">
                    <div className="text-base sm:text-xl leading-none shrink-0 sm:mb-1">{q.icon}</div>
                    <div className="min-w-0">
                      <div className="text-[#4a5568] text-[10px] sm:text-xs leading-tight mb-0.5">{q.label}</div>
                      <div className="text-[#0f2922] text-xs sm:text-sm font-medium leading-tight truncate">{q.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* DEDICATED SECTION: Departure Management for Admin (Requirement 8 & 9) */}
            {isAdmin && (
              <section id="departure-management" className="border-t border-[#e2e8f0] pt-10">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-1">
                      OPERATIONS & CAPACITY
                    </div>
                    <h2 className="text-[#0f2922] text-2xl" style={{ fontFamily: "var(--font-serif)" }}>
                      Departure Schedule & Capacities
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsAddingDeparture(true)}
                    className="bg-[#0f2922] hover:bg-[#1a3d31] text-white text-xs font-semibold px-4 py-2 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    + Add Departure
                  </button>
                </div>

                {/* Tabs: Upcoming vs Completed vs Cancelled */}
                <div className="flex gap-2 border-b border-[#e2e8f0] mb-4">
                  <button
                    onClick={() => setDepartureTab("upcoming")}
                    className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition cursor-pointer ${
                      departureTab === "upcoming"
                        ? "border-[#0f2922] text-[#0f2922]"
                        : "border-transparent text-[#718096] hover:text-[#0f2922]"
                    }`}
                  >
                    Upcoming ({upcomingDepartures.length})
                  </button>
                  <button
                    onClick={() => setDepartureTab("completed")}
                    className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition cursor-pointer ${
                      departureTab === "completed"
                        ? "border-[#0f2922] text-[#0f2922]"
                        : "border-transparent text-[#718096] hover:text-[#0f2922]"
                    }`}
                  >
                    Completed ({completedDepartures.length})
                  </button>
                  <button
                    onClick={() => setDepartureTab("cancelled")}
                    className={`pb-2.5 px-3 text-sm font-medium border-b-2 transition cursor-pointer ${
                      departureTab === "cancelled"
                        ? "border-[#0f2922] text-[#0f2922]"
                        : "border-transparent text-[#718096] hover:text-[#0f2922]"
                    }`}
                  >
                    Cancelled ({cancelledDepartures.length})
                  </button>
                </div>

                {/* Departures List */}
                {departureTab === "upcoming" ? (
                  upcomingDepartures.length === 0 ? (
                    <div className="bg-[#f7f8f5] rounded-xl p-8 text-center border border-dashed border-[#cbd5e1]">
                      <p className="text-[#718096] text-sm mb-3">No upcoming departures scheduled for this trip.</p>
                      <button
                        onClick={() => setIsAddingDeparture(true)}
                        className="bg-[#0f2922] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#1a3d31] transition cursor-pointer"
                      >
                        + Add First Departure
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingDepartures.map((d) => (
                        <div key={d.id} className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-xs transition">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#0f2922] text-sm">{d.displayDate}</span>
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">
                                {d.status}
                              </span>
                            </div>
                            <div className="text-xs text-[#718096] mt-1 flex flex-wrap items-center gap-3">
                              <span>Price: <strong className="text-[#0f2922]">₹{d.price.toLocaleString("en-IN")}</strong></span>
                              <span>•</span>
                              <span>Capacity: <strong className="text-[#0f2922]">{d.spotsTotal} max</strong> ({d.spotsLeft} spots left)</span>
                              {d.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic text-[#4a5568]">✦ {d.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setEditingDeparture(d)}
                              className="text-[#4a5568] hover:text-[#0f2922] transition text-xs border border-[#e2e8f0] hover:border-[#0f2922] px-2.5 py-1 rounded-lg cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCompleteDeparture(d)}
                              className="text-green-600 hover:text-green-800 transition text-xs border border-green-200 hover:border-green-600 px-2.5 py-1 rounded-lg cursor-pointer"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleCancelDeparture(d)}
                              className="text-red-500 hover:text-red-700 transition text-xs border border-red-200 hover:border-red-500 px-2.5 py-1 rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : departureTab === "completed" ? (
                  completedDepartures.length === 0 ? (
                    <div className="bg-[#f7f8f5] rounded-xl p-8 text-center text-[#718096] text-sm">
                      No completed departures recorded for this trip.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {completedDepartures.map((d) => (
                        <div key={d.id} className="bg-[#fafbfa] border border-[#e2e8f0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-80 hover:opacity-100 transition">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#4a5568] text-sm">{d.displayDate}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize bg-gray-100 text-gray-700 border border-gray-200">
                                {d.status}
                              </span>
                            </div>
                            <div className="text-xs text-[#718096] mt-1 flex flex-wrap items-center gap-3">
                              <span>Price: ₹{d.price.toLocaleString("en-IN")}</span>
                              <span>•</span>
                              <span>Total Spots: {d.spotsTotal}</span>
                              {d.notes && <span>• ✦ {d.notes}</span>}
                            </div>
                          </div>
                          <div className="text-xs text-[#a0aec0] italic shrink-0">
                            Completed (Read-only)
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  cancelledDepartures.length === 0 ? (
                    <div className="bg-[#f7f8f5] rounded-xl p-8 text-center text-[#718096] text-sm">
                      No cancelled departures recorded for this trip.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cancelledDepartures.map((d) => (
                        <div key={d.id} className="bg-[#fafbfa] border border-[#fecaca]/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-75 hover:opacity-100 transition">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#4a5568] text-sm line-through">{d.displayDate}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize bg-red-50 text-red-700 border border-red-200">
                                {d.status}
                              </span>
                            </div>
                            <div className="text-xs text-[#718096] mt-1 flex flex-wrap items-center gap-3">
                              <span>Price: ₹{d.price.toLocaleString("en-IN")}</span>
                              <span>•</span>
                              <span>Total Spots: {d.spotsTotal}</span>
                              {d.notes && <span>• ✦ {d.notes}</span>}
                            </div>
                          </div>
                          <div className="text-xs text-red-400 italic shrink-0">
                            Cancelled
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </section>
            )}

            {/* DEDICATED SECTION: Destinations on this Trip (Requirement 2) */}
            {tripDestinations.length > 0 && (
              <section id="destinations" className="border-t border-[#e2e8f0] pt-6 sm:pt-10">
                <div className="mb-3.5 sm:mb-6">
                  <div className="text-[#e8622a] text-[10px] sm:text-xs uppercase tracking-widest font-semibold mb-0.5 sm:mb-1">
                    ITINERARY DESTINATIONS
                  </div>
                  <h2 className="text-[#0f2922] text-[20px] sm:text-2xl leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
                    Destinations on this Journey
                  </h2>
                  <p className="text-[#4a5568] text-[13px] sm:text-sm mt-1 mb-0">
                    This trip covers {tripDestinations.length} curated {tripDestinations.length === 1 ? "destination" : "destinations"} in Uttarakhand.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
                  {tripDestinations.map((td) => {
                    const fullDest = destinations.find((d) => d.id === td.id || d.slug === td.slug);
                    const destImg = td.image || fullDest?.image || "";
                    const destTagline = fullDest?.tagline || fullDest?.season || "Explore Uttarakhand";

                    return (
                      <Link
                        key={td.id}
                        to={isAdmin ? `/admin/destinations/${td.slug || td.id}` : `/destinations/${td.slug || td.id}`}
                        className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden hover:shadow-lg transition-all group flex flex-col cursor-pointer"
                      >
                        <div className="h-40 sm:h-48 overflow-hidden relative">
                          {destImg ? (
                            <img
                              src={destImg}
                              alt={td.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#0f2922] via-[#1a4a39] to-[#0f2922] flex items-center justify-center">
                              <span className="text-white/20 text-3xl">🏔️</span>
                            </div>
                          )}
                          {td.isPrimary && (
                            <span className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 bg-[#e8622a] text-white text-[10px] font-bold px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shadow-sm">
                              PRIMARY DESTINATION
                            </span>
                          )}
                          {fullDest?.season && (
                            <span className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-0.5 sm:py-1 rounded-full">
                              {fullDest.season}
                            </span>
                          )}
                        </div>
                        <div className="p-3.5 sm:p-5 flex flex-col flex-1 justify-between">
                          <div>
                            <h3 className="text-[#0f2922] text-[17px] sm:text-xl leading-snug mb-1 group-hover:text-[#e8622a] transition-colors" style={{ fontFamily: "var(--font-serif)" }}>
                              {td.name}
                            </h3>
                            <p className="text-[#4a5568] text-xs leading-relaxed line-clamp-2 mb-0">
                              {destTagline}
                            </p>
                          </div>
                          <div className="mt-2.5 sm:mt-4 pt-2.5 sm:pt-3 border-t border-[#f0f4f1] flex items-center justify-between text-xs text-[#0f2922] font-semibold group-hover:text-[#e8622a] transition-colors">
                            <span>{isAdmin ? "Manage Destination" : "View Destination Guide"}</span>
                            <span>→</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Legacy Bullet Highlights (if any) */}
            {legacyBulletHighlights.length > 0 && (
              <section className="border-t border-[#e2e8f0] pt-6 sm:pt-10">
                <h2 className="text-[#0f2922] text-[20px] sm:text-2xl mb-3 sm:mb-4" style={{ fontFamily: "var(--font-serif)" }}>Journey Highlights</h2>
                <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {legacyBulletHighlights.map((h, i) => (
                    <div key={i} className="border border-[#e2e8f0] rounded-xl p-3.5 sm:p-4 flex items-start gap-2.5 sm:gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2.5" className="shrink-0 mt-0.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <div className="text-[#4a5568] text-[13.5px] sm:text-sm leading-relaxed">{h}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Itinerary */}
            {tripItinerary.length > 0 && (
              <section id="itinerary" className="border-t border-[#e2e8f0] pt-6 sm:pt-10 scroll-mt-14">
                <h2 className="text-[#0f2922] text-[20px] sm:text-2xl mb-3 sm:mb-5" style={{ fontFamily: "var(--font-serif)" }}>The Mindful Itinerary</h2>
                <div className="space-y-2">
                  {tripItinerary.map((d, i) => {
                    const isOpen = Boolean(openDays[i] ?? (i === 0));
                    return (
                      <div key={i} className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                        <button onClick={() => toggleDay(i)} className="w-full flex items-center justify-between gap-2.5 sm:gap-4 px-3.5 sm:px-5 py-2.5 sm:py-4 hover:bg-[#f7f8f5] transition-colors text-left cursor-pointer">
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <span className="bg-[#0f2922] text-white text-[11px] sm:text-xs font-medium px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shrink-0">{d.day}</span>
                            <span className="text-[#0f2922] font-medium text-[13.5px] sm:text-sm leading-snug min-w-0">{d.title}</span>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2" className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        {isOpen && (
                          <div className="px-3.5 sm:px-5 pb-3 sm:pb-4 text-[#4a5568] text-[13px] sm:text-sm leading-relaxed border-t border-[#e2e8f0] pt-2.5 sm:pt-3">
                            <p className="mb-0">{d.desc}</p>
                            {(d.meals || d.stay) && (
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-2 border-t border-[#f1f5f9] text-[11.5px] sm:text-xs text-[#718096]">
                                {d.meals && <div><span className="font-semibold text-[#0f2922]">Meals:</span> {d.meals}</div>}
                                {d.stay && <div><span className="font-semibold text-[#0f2922]">Stay:</span> {d.stay}</div>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Inclusions */}
            <section id="inclusions" className="grid sm:grid-cols-2 gap-3.5 sm:gap-5 border-t border-[#e2e8f0] pt-6 sm:pt-10 scroll-mt-14">
              <div className="border border-[#e2e8f0] rounded-xl p-3.5 sm:p-5">
                <h3 className="text-[#0f2922] font-semibold text-xs sm:text-sm uppercase tracking-wide mb-2.5 sm:mb-4">WHAT'S INCLUDED</h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  {(activeTrip?.inclusions && activeTrip.inclusions.length > 0
                    ? activeTrip.inclusions
                    : ["Acclimatized Hinoki timber cabin stays", "All high-quality mountain meals", "Medical assistance & oxygen kits", "Certified high-altitude trek leaders", "Inner line permits & state taxes"]
                  ).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px] sm:text-xs text-[#4a5568] leading-snug">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border border-[#e2e8f0] rounded-xl p-3.5 sm:p-5">
                <h3 className="text-[#0f2922] font-semibold text-xs sm:text-sm uppercase tracking-wide mb-2.5 sm:mb-4">NOT INCLUDED</h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  {(activeTrip?.exclusions && activeTrip.exclusions.length > 0
                    ? activeTrip.exclusions
                    : ["Personal trekking gear & boots", "Insurance & evacuation expenses", "Trail snacks & personal beverages", "Tips for local porters", "Anything outside the itinerary"]
                  ).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px] sm:text-xs text-[#4a5568] leading-snug">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" className="shrink-0 mt-0.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Photo Gallery (Requirement 4) */}
            {activeTrip?.gallery && activeTrip.gallery.length > 0 && (
              <section id="gallery" className="border-t border-[#e2e8f0] pt-6 sm:pt-10">
                <div className="flex items-end justify-between mb-3.5 sm:mb-5 gap-2">
                  <div>
                    <div className="text-[#e8622a] text-[10px] sm:text-xs uppercase tracking-widest font-semibold mb-0.5 sm:mb-1">
                      CAPTURED MOMENTS
                    </div>
                    <h2 className="text-[#0f2922] text-[20px] sm:text-2xl leading-snug mb-0" style={{ fontFamily: "var(--font-serif)" }}>
                      Photo Gallery
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(0)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#e8622a] hover:text-[#d45520] transition-colors cursor-pointer shrink-0"
                  >
                    <span>View All ({activeTrip.gallery.length})</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
                <div className={`grid ${(activeTrip?.gallery?.length || 0) === 1 ? "grid-cols-1" : "grid-cols-2"} ${(activeTrip?.gallery?.length || 0) === 2 ? "sm:grid-cols-2" : (activeTrip?.gallery?.length || 0) === 1 ? "sm:grid-cols-1" : "sm:grid-cols-3"} gap-2.5 sm:gap-4`}>
                  {(activeTrip?.gallery || []).slice(0, 3).map((img, i) => {
                    const galleryLen = activeTrip?.gallery?.length || 0;
                    const remainingDesktop = galleryLen - 3;
                    const remainingMobile = galleryLen - 2;
                    const isLastDesktop = i === 2 && remainingDesktop > 0;
                    const isLastMobile = i === 1 && remainingMobile > 0;
                    return (
                      <div
                        key={i}
                        role="button"
                        tabIndex={0}
                        onClick={() => setLightboxIndex(i)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setLightboxIndex(i);
                          }
                        }}
                        className={`${i === 2 ? "hidden sm:block " : ""}relative aspect-[4/3] sm:h-48 sm:aspect-auto rounded-xl sm:rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-xs hover:shadow-md transition group cursor-pointer bg-[#f7f8f5]`}
                      >
                        <img
                          src={img}
                          alt={`${activeTrip.name} photo ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {isLastMobile && (
                          <div className="sm:hidden absolute inset-0 bg-black/50 hover:bg-black/60 transition-colors flex flex-col items-center justify-center text-white p-2 text-center">
                            <span className="text-lg font-bold leading-none">+{remainingMobile}</span>
                            <span className="text-[11px] font-medium mt-1">Photos</span>
                          </div>
                        )}
                        {isLastDesktop ? (
                          <div className="hidden sm:flex absolute inset-0 bg-black/55 hover:bg-black/65 transition-colors flex-col items-center justify-center text-white p-2 text-center">
                            <span className="text-sm sm:text-lg font-bold">+{remainingDesktop}</span>
                            <span className="text-[10px] sm:text-xs font-medium inline-flex items-center gap-1 mt-0.5">
                              View All
                              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </div>
                        ) : (
                          <div className={`${isLastMobile ? "hidden sm:block " : ""}absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Global Cancellation Policy */}
            <section className="border-t border-[#e2e8f0] pt-6 sm:pt-10">
              <div className="flex items-start sm:items-center justify-between gap-2.5 mb-3 sm:mb-4">
                <div className="min-w-0">
                  <h2 className="text-[#0f2922] text-[20px] sm:text-xl font-bold leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
                    Cancellation Policy
                  </h2>
                  <p className="text-[11.5px] sm:text-xs text-[#718096] leading-snug mt-0.5 mb-0">
                    Clear, transparent refund schedule based on time of cancellation prior to departure.
                  </p>
                </div>
                <span className="text-[10.5px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#f0f9f4] text-[#16a34a] border border-[#16a34a]/20 shrink-0 whitespace-nowrap">
                  Standard Policy
                </span>
              </div>

              <div className="border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12.5px] sm:text-sm">
                    <thead className="bg-[#f7f8f5] text-[#0f2922] text-[10.5px] sm:text-xs uppercase tracking-wider font-semibold border-b border-[#e2e8f0]">
                      <tr>
                        <th className="px-3.5 sm:px-5 py-2.5 sm:py-3.5">Notice Timeline</th>
                        <th className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 sm:w-36 text-right sm:text-left whitespace-nowrap">Refund Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f4f1]">
                      {policyRules.map((rule, idx) => (
                        <tr key={idx} className="hover:bg-[#fafbfa] transition-colors">
                          <td className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 font-medium text-[#0f2922] leading-snug">
                            {rule.days}
                          </td>
                          <td className="px-3.5 sm:px-5 py-2.5 sm:py-3.5 text-right sm:text-left whitespace-nowrap">
                            <span className={`inline-flex items-center font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs whitespace-nowrap ${
                              (() => { const pct = parseInt(rule.refund); return pct >= 90; })()
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : rule.refund === "0%"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                              {rule.refund} Refund
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#fcfdfc] border-t border-[#f0f4f1] px-3.5 sm:px-5 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#718096] leading-snug">
                  <span>💡 To cancel or reschedule, contact our support team with your booking reference.</span>
                  <span>Processing: 5–7 business days</span>
                </div>
              </div>
            </section>

            {/* Manageable FAQs (Requirement 12) */}
            <section id="faqs" className="border-t border-[#e2e8f0] pt-6 sm:pt-10 scroll-mt-14">
              <h2 className="text-[#0f2922] text-[20px] sm:text-xl mb-3 sm:mb-4 font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                Trip FAQs
              </h2>
              <div className="space-y-2">
                {tripFaqs.map((faq, i) => (
                  <div key={i} className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                      className="w-full flex items-center justify-between gap-3 px-3.5 sm:px-5 py-3 sm:py-3.5 text-left hover:bg-[#f7f8f5] transition-colors cursor-pointer"
                    >
                      <span className="text-[#0f2922] text-[13.5px] sm:text-sm font-medium leading-snug">{faq.question}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2" className={`shrink-0 transition-transform ${faqOpen === i ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    {faqOpen === i && (
                      <div className="px-3.5 sm:px-5 pb-3.5 sm:pb-4 text-[#4a5568] text-[13px] sm:text-sm leading-relaxed border-t border-[#e2e8f0] pt-2.5 sm:pt-3 whitespace-pre-line">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Booking / Admin Summary Card */}
          <div>
            <div className="sticky top-24 space-y-3 sm:space-y-4">
              {isAdmin ? (
                /* Admin Summary Card */
                <div style={{ background: "var(--forest)" }} className="rounded-2xl p-4 sm:p-6 text-white shadow-lg">
                  <div className="text-[#e8622a] text-[10px] uppercase tracking-widest mb-1.5 sm:mb-2 font-bold">ADMIN CONTROLS</div>
                  <div className="text-2xl sm:text-3xl font-bold mb-0.5" style={{ fontFamily: "var(--font-serif)" }}>
                    {activeTrip?.price ? `₹${activeTrip.price.toLocaleString("en-IN")}` : "₹9,999"}
                  </div>
                  <div className="text-white/60 text-xs mb-4 sm:mb-5">Base Price · {activeTrip?.duration ?? "4 Days / 3 Nights"}</div>
                  
                  <div className="space-y-2.5 mb-5 sm:mb-6 text-xs border-y border-white/10 py-3.5 sm:py-4">
                    <div className="flex justify-between">
                      <span className="text-white/60">Upcoming Departures</span>
                      <span className="font-semibold text-white">{upcomingDepartures.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Total Departures</span>
                      <span className="font-semibold text-white">{allDepartures.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Max Group Size</span>
                      <span className="font-semibold text-white">{maxTravellers} travellers</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Link
                      to={`/admin/trips/${tripId}/edit`}
                      className="w-full bg-[#e8622a] hover:bg-[#d4541f] text-white py-2.5 sm:py-3 rounded-full text-xs font-semibold transition-colors block text-center shadow-md cursor-pointer"
                    >
                      Edit Trip Details
                    </Link>
                    <button
                      onClick={() => setIsAddingDeparture(true)}
                      className="w-full border border-white/30 hover:bg-white/10 text-white py-2.5 rounded-full text-xs font-semibold transition-colors block text-center cursor-pointer"
                    >
                      + Add New Departure
                    </button>
                  </div>
                </div>
              ) : (
                /* User Booking & Departures Card */
                <div style={{ background: "var(--forest)" }} className="rounded-2xl p-4 sm:p-6 text-white shadow-lg">
                  <div className="text-[#e8622a] text-[10px] uppercase tracking-widest leading-tight mb-1 sm:mb-2 font-bold">STARTING PRICE</div>
                  <div className="text-2xl sm:text-4xl font-bold leading-tight mb-0.5" style={{ fontFamily: "var(--font-serif)" }}>
                    {activeTrip?.price ? `₹${activeTrip.price.toLocaleString("en-IN")}` : "₹9,999"}
                  </div>
                  <div className="text-white/60 text-xs mb-3.5 sm:mb-6">per person · {activeTrip?.duration ?? "4 Days / 3 Nights"}</div>
                  <button
                    onClick={() => openEnquiryModal(tripId)}
                    className="w-full border border-white/30 hover:bg-white/10 text-white py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer block text-center mb-2 sm:mb-3"
                  >
                    Raise Enquiry
                  </button>
                  <button
                    onClick={handleChatWhatsApp}
                    className="w-full flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm font-semibold transition-colors shadow-md cursor-pointer"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Chat on WhatsApp
                  </button>
                  <p className="text-white/40 text-[11px] sm:text-xs text-center mt-2.5 sm:mt-3 mb-0 leading-snug">No account required. We'll respond within 2 hours.</p>
                </div>
              )}

              {/* Upcoming Departures Card (For user) */}
              {!isAdmin && (
                <div className="hidden lg:block border border-[#e2e8f0] rounded-2xl p-5 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[#e8622a] text-xs uppercase tracking-wider font-semibold">
                      SCHEDULED DEPARTURES
                    </div>
                    {upcomingDepartures.length > 0 && (
                      <span className="text-[11px] text-[#718096]">
                        {upcomingDepartures.length} {upcomingDepartures.length === 1 ? "batch" : "batches"}
                      </span>
                    )}
                  </div>
                  {upcomingDepartures.length > 0 ? (
                    <div className="space-y-2.5">
                      {upcomingDepartures.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-[#e2e8f0] hover:border-[#0f2922] transition-colors"
                        >
                          <div>
                            <div className="text-sm font-semibold text-[#0f2922]">{d.displayDate}</div>
                            <div className="text-[11px] text-[#718096]">
                              {d.spotsLeft} {d.spotsLeft === 1 ? "spot" : "spots"} remaining
                            </div>
                            {d.notes && (
                              <div className="text-[11px] text-[#4a5568] mt-1.5 italic flex items-center gap-1.5 bg-[#f7f8f5] px-2.5 py-1 rounded-md border border-[#e2e8f0]/60">
                                <span className="text-[#e8622a] text-xs">✦</span>
                                <span className="line-clamp-1">{d.notes}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-[#e8622a]">
                              ₹{d.price.toLocaleString("en-IN")}
                            </div>
                            <button
                              onClick={() => openEnquiryModal(tripId, d.id)}
                              className="text-[11px] text-[#0f2922] hover:text-[#e8622a] font-medium underline cursor-pointer"
                            >
                              Book this date
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#f7f8f5] rounded-xl p-4 border border-dashed border-[#cbd5e1] text-center">
                      <div className="w-8 h-8 rounded-full bg-white text-[#0f2922] flex items-center justify-center mx-auto mb-2 border border-[#e2e8f0]">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-[#0f2922] mb-1">
                        No upcoming departures scheduled for now
                      </p>
                      <p className="text-[11px] text-[#718096] leading-relaxed mb-0">
                        We regularly organize customized and private departures on any dates of your choice. You can still reach out to plan your dates!
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="border border-[#e2e8f0] rounded-2xl px-4 py-3 sm:p-4 bg-white flex items-center justify-between gap-3">
                <div className="text-[#e8622a] text-xs uppercase tracking-wider font-semibold">SHARE THIS TRIP</div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    copiedLink
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "border-[#e2e8f0] text-[#0f2922] hover:border-[#0f2922] hover:bg-[#f7f8f5]"
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Departure Modals */}
      {isAdmin && isAddingDeparture && (
        <DepartureModal
          title="Add New Departure"
          initial={{
            date: "",
            price: activeTrip?.price || 0,
            spotsTotal: maxTravellers,
          }}
          isSaving={isSavingDeparture}
          onSave={handleAddDeparture}
          onClose={() => setIsAddingDeparture(false)}
        />
      )}

      {isAdmin && editingDeparture && (
        <DepartureModal
          title="Edit Departure"
          initial={{
            date: editingDeparture.date,
            price: editingDeparture.price,
            spotsTotal: editingDeparture.spotsTotal,
            notes: editingDeparture.notes,
          }}
          isSaving={isSavingDeparture}
          onSave={handleEditDeparture}
          onClose={() => setEditingDeparture(null)}
        />
      )}

      {/* Sticky bottom CTA for users (mobile and tablet viewports) */}
      {!isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-[#e2e8f0] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <button
            onClick={handleChatWhatsApp}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white shrink-0 shadow-sm transition-colors cursor-pointer"
            aria-label="Chat on WhatsApp"
            title="Chat on WhatsApp"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </button>
          <div className="min-w-0 pr-1">
            <div className="text-[#0f2922] font-bold text-base sm:text-lg leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
              {activeTrip?.price ? `₹${activeTrip.price.toLocaleString("en-IN")}` : "₹9,999"}
            </div>
            <div className="text-[#718096] text-[10.5px] leading-none">per person</div>
          </div>
          <button
            onClick={() => openEnquiryModal(tripId)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#e8622a] hover:bg-[#d45520] text-white py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Enquire Now →
          </button>
        </div>
      )}

      {/* Gallery Lightbox */}
      {lightboxIndex !== null && galleryLightboxItems.length > 0 && (
        <GalleryLightbox
          items={galleryLightboxItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {!isAdmin && <Footer />}
    </div>
  );
}
