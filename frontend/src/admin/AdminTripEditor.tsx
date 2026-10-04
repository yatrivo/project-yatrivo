import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { destinationsApi } from "@/api/destinations";
import { tripsApi } from "@/api/trips";
import type { Destination } from "@/data/destinations";
import type { CategoryValue } from "@/data/categories";
import type { AdminPage } from "./AdminLayout";
import MediaPicker from "@/components/MediaPicker";

type Section = "basic" | "highlights" | "itinerary" | "inclusions" | "faqs" | "pricing" | "gallery" | "seo";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "basic", label: "Basic Info & Destinations" },
  { id: "highlights", label: "Highlight Cards" },
  { id: "itinerary", label: "Itinerary" },
  { id: "inclusions", label: "Inclusions / Exclusions" },
  { id: "faqs", label: "FAQs" },
  { id: "pricing", label: "Pricing" },
  { id: "gallery", label: "Gallery" },
  { id: "seo", label: "SEO" },
];

interface Day { title: string; description: string; }
interface Addon { name: string; price: string; }
interface HighlightCardForm { icon: string; label: string; value: string; }
interface FaqForm { question: string; answer: string; }

interface Props {
  setAdminPage?: (p: AdminPage) => void;
}

export default function AdminTripEditor({ setAdminPage }: Props = {}) {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast, trips, refreshTrips, destinations: appDestinations } = useApp();

  const existingTrip = id ? trips.find((t) => t.id === id || t.slug === id) : null;
  const [activeSection, setActiveSection] = useState<Section>("basic");
  const [saving, setSaving] = useState(false);
  const [tripStatus, setTripStatus] = useState<"draft" | "published" | "active" | "archived">(existingTrip?.status || "published");

  // Available existing destinations from API
  const [availableDestinations, setAvailableDestinations] = useState<Destination[]>(appDestinations);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDestinations() {
      setLoadingDestinations(true);
      try {
        const res = await destinationsApi.list({ includeArchived: false });
        if (isMounted && res.destinations?.length > 0) {
          setAvailableDestinations(res.destinations);
        }
      } catch (err) {
        console.warn("Could not fetch destinations for trip editor:", err);
      } finally {
        if (isMounted) setLoadingDestinations(false);
      }
    }
    void loadDestinations();
    return () => { isMounted = false; };
  }, []);

  // Basic Info
  const [tripName, setTripName] = useState(existingTrip?.name ?? "");
  const [tripImage, setTripImage] = useState(existingTrip?.image ?? "");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(existingTrip?.coverMediaId ?? null);
  const [duration, setDuration] = useState(existingTrip?.duration ?? "4 Days / 3 Nights");
  const [category, setCategory] = useState<CategoryValue>(existingTrip?.category ?? "trekking");
  const [difficulty, setDifficulty] = useState<"Easy" | "Moderate" | "Challenging" | "Strenuous">(existingTrip?.difficulty ?? "Moderate");
  const [badge, setBadge] = useState(existingTrip?.badge ?? "");
  const [startingPoint, setStartingPoint] = useState(existingTrip?.startingPoint ?? "Dehradun");
  const [shortDesc, setShortDesc] = useState(
    existingTrip?.shortDescription ??
    (typeof existingTrip?.highlights?.[0] === "string" ? existingTrip.highlights[0] : "") ??
    ""
  );
  const [overview, setOverview] = useState(existingTrip?.overview ?? "");

  // Load fresh trip data from API on edit
  useEffect(() => {
    let isMounted = true;
    if (id) {
      tripsApi.getOne(id).then((fresh) => {
        if (!isMounted || !fresh) return;
        setTripName(fresh.name || "");
        setTripImage(fresh.image || "");
        setCoverMediaId(fresh.coverMediaId || null);
        setDuration(fresh.duration || "4 Days / 3 Nights");
        setCategory((fresh.category as CategoryValue) || "trekking");
        setDifficulty((fresh.difficulty as any) || "Moderate");
        setBadge(fresh.badge || "");
        setStartingPoint(fresh.startingPoint || "Dehradun");
        setShortDesc(fresh.shortDescription || "");
        setOverview(fresh.overview || "");
        setPrice(String(fresh.price || 9999));
        setSlug(fresh.slug || "");
        setMetaTitle(fresh.seoTitle || "");
        setMetaDesc(fresh.seoDescription || "");
        setTripStatus(fresh.status || "published");
        if (fresh.destinations && fresh.destinations.length > 0) {
          setSelectedDestinationIds(fresh.destinations.map((d) => d.id));
          const prim = fresh.destinations.find((d) => d.isPrimary) || fresh.destinations[0];
          setPrimaryDestinationId(prim.id);
        }
        if (fresh.highlights && fresh.highlights.length > 0) {
          setHighlightCards(
            fresh.highlights.map((h: any) =>
              typeof h === "string"
                ? { icon: "📍", label: "Highlight", value: h }
                : { icon: h.icon || "📍", label: h.label || "Highlight", value: h.value || "" }
            )
          );
        }
        if (fresh.faqs && fresh.faqs.length > 0) {
          setFaqs(fresh.faqs);
        }
        if (fresh.itinerary !== undefined) {
          if (fresh.itinerary.length > 0) {
            setDays(fresh.itinerary.map((d: any) => ({ title: d.title || "", description: d.description || "" })));
          } else if (id) {
            setDays([]);
          }
        }
        if (fresh.inclusions && fresh.inclusions.length > 0) {
          setInclusions(fresh.inclusions);
        }
        if (fresh.exclusions && fresh.exclusions.length > 0) {
          setExclusions(fresh.exclusions);
        }
        if (fresh.gallery && fresh.gallery.length > 0) {
          setGalleryUrls(fresh.gallery);
        }
      }).catch((err) => {
        console.warn("Could not fetch trip for editing:", err);
      });
    }
    return () => { isMounted = false; };
  }, [id]);

  // Multi-destination state
  // Pre-populate from existingTrip.destinations if present, or fallback to existingTrip.destination
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<string[]>(() => {
    if (existingTrip?.destinations && existingTrip.destinations.length > 0) {
      return existingTrip.destinations.map((d) => d.id);
    }
    if (existingTrip?.destination) {
      const match = appDestinations.find(
        (d) => d.id === existingTrip.destination || d.slug === existingTrip.destination || d.name === existingTrip.destination
      );
      if (match) return [match.id];
    }
    return appDestinations[0] ? [appDestinations[0].id] : [];
  });

  const [primaryDestinationId, setPrimaryDestinationId] = useState<string>(() => {
    if (existingTrip?.destinations && existingTrip.destinations.length > 0) {
      const primary = existingTrip.destinations.find((d) => d.isPrimary) || existingTrip.destinations[0];
      return primary.id;
    }
    if (existingTrip?.destination) {
      const match = appDestinations.find(
        (d) => d.id === existingTrip.destination || d.slug === existingTrip.destination || d.name === existingTrip.destination
      );
      if (match) return match.id;
    }
    return appDestinations[0] ? appDestinations[0].id : "";
  });

  const primaryDest = (availableDestinations.length > 0 ? availableDestinations : appDestinations).find(
    (d) => d.id === primaryDestinationId || selectedDestinationIds.includes(d.id)
  );

  // Itinerary
  const [days, setDays] = useState<Day[]>(() => {
    if (existingTrip?.itinerary && existingTrip.itinerary.length > 0) {
      return existingTrip.itinerary.map((d: any) => ({
        title: d.title || "",
        description: d.description || ""
      }));
    }
    return [
      { title: "Day 1: Arrival & Basecamp", description: "Scenic mountain drive and orientation walk." },
      { title: "Day 2: Trek & Exploration", description: "Guided high altitude exploration and local dining." },
      { title: "Day 3: Return & Farewell", description: "Breakfast, scenic descent, and departure." }
    ];
  });

  // Inclusions
  const [inclusions, setInclusions] = useState<string[]>(
    existingTrip?.inclusions ?? ["All meals (breakfast, lunch, dinner)", "Certified mountain guide", "Accommodation in cabins/camps"]
  );
  const [exclusions, setExclusions] = useState<string[]>(
    existingTrip?.exclusions ?? ["Personal travel insurance", "Transport to starting point", "Alcoholic beverages"]
  );

  // Pricing
  const [price, setPrice] = useState(existingTrip ? String(existingTrip.price) : "9999");

  // 4 Structured Highlight Cards (Managed directly)
  const [highlightCards, setHighlightCards] = useState<HighlightCardForm[]>(() => {
    if (existingTrip?.highlights && Array.isArray(existingTrip.highlights) && existingTrip.highlights.length > 0) {
      return existingTrip.highlights.map((h: any) =>
        typeof h === "string"
          ? { icon: "📍", label: "Highlight", value: h }
          : { icon: h.icon || "📍", label: h.label || "Highlight", value: h.value || "" }
      );
    }
    return [
      { icon: "📍", label: "Starting Point", value: existingTrip?.startingPoint || "Dehradun" },
      { icon: "👥", label: "Group Size", value: "Max 12" },
      { icon: "🏕️", label: "Stay Style", value: "Timber Cabins" },
      { icon: "🍽️", label: "Meals", value: "All Included" }
    ];
  });

  // Manageable FAQs (Per trip)
  const [faqs, setFaqs] = useState<FaqForm[]>(() => {
    if (existingTrip?.faqs && existingTrip.faqs.length > 0) {
      return existingTrip.faqs;
    }
    return [
      { question: "What fitness level is required?", answer: "A moderate fitness level with basic walking stamina. No prior high-altitude expedition experience is required." },
      { question: "What should I pack?", answer: "Warm thermal layers, waterproof shell jacket, sturdy trekking shoes, sunglasses, and personal medication. We provide a detailed packing list upon booking." },
      { question: "Is altitude sickness a risk?", answer: "Routes above 2,500m include gradual acclimatization. Our trek leaders carry pulse oximeters and first-aid kits." },
      { question: "Are meals included?", answer: "Yes, all wholesome mountain meals (Pahadi local cuisine and organic produce) are provided throughout the itinerary." }
    ];
  });

  // Gallery (Separate from Cover Image!)
  const [galleryUrls, setGalleryUrls] = useState<string[]>(() => {
    if (existingTrip?.gallery && existingTrip.gallery.length > 0) {
      return existingTrip.gallery;
    }
    return [];
  });

  // SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [slug, setSlug] = useState(existingTrip?.slug ?? existingTrip?.id ?? "");

  // Helpers for itinerary
  const addDay = () => setDays([...days, { title: "", description: "" }]);
  const removeDay = (i: number) => setDays(days.filter((_, idx) => idx !== i));
  const moveDay = (i: number, dir: -1 | 1) => {
    const d = [...days];
    const j = i + dir;
    if (j < 0 || j >= d.length) return;
    [d[i], d[j]] = [d[j], d[i]];
    setDays(d);
  };

  // Destination manipulation
  const handleAddDestination = (destId: string) => {
    if (!destId) return;
    if (!selectedDestinationIds.includes(destId)) {
      const next = [...selectedDestinationIds, destId];
      setSelectedDestinationIds(next);
      if (!primaryDestinationId) {
        setPrimaryDestinationId(destId);
      }
    }
  };

  const handleRemoveDestination = (destId: string) => {
    const next = selectedDestinationIds.filter((id) => id !== destId);
    setSelectedDestinationIds(next);
    if (primaryDestinationId === destId) {
      setPrimaryDestinationId(next[0] || "");
    }
  };

  const handleSetPrimary = (destId: string) => {
    setPrimaryDestinationId(destId);
  };

  // Gallery helpers
  const addGallerySlot = () => setGalleryUrls((prev) => [...prev, ""]);
  const removeGallerySlot = (i: number) => setGalleryUrls((prev) => prev.filter((_, idx) => idx !== i));
  const updateGallerySlot = (i: number, url: string) =>
    setGalleryUrls((prev) => {
      const next = [...prev];
      next[i] = url;
      return next;
    });

  const isEditing = Boolean(id && existingTrip);
  const isCurrentlyPublished = tripStatus === "published" || tripStatus === "active";
  const isCurrentlyDraft = tripStatus === "draft";

  const handleAutoGenerateSeo = () => {
    const destNames = availableDestinations
      .filter((d) => selectedDestinationIds.includes(d.id))
      .map((d) => d.name)
      .join(" & ");
    const genTitle = `${tripName} | Yatrivo Curated Himalayan Expeditions`;
    const genDesc = `Explore ${tripName}${destNames ? ` covering ${destNames}` : ""}. Curated ${duration} expedition with certified mountain guides, handpicked stays, and mindful small groups. Book with Yatrivo.`;
    const genSlug = tripName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    setMetaTitle(genTitle);
    setMetaDesc(genDesc);
    if (!slug) setSlug(genSlug);
    showToast("SEO details generated from trip info!", "info");
  };

  // Form saving
  const handleSave = async (publish: boolean) => {
    if (!tripName.trim()) {
      showToast("Trip name is required", "error");
      setActiveSection("basic");
      return;
    }

    if (selectedDestinationIds.length === 0) {
      showToast("Please select at least one destination", "error");
      setActiveSection("basic");
      return;
    }

    if (!tripImage.trim()) {
      showToast("A cover image is required", "error");
      setActiveSection("basic");
      return;
    }

    const priceNum = Number(price) || 0;
    if (priceNum <= 0) {
      showToast("Price must be greater than 0", "error");
      setActiveSection("pricing");
      return;
    }

    // Determine target status
    let targetStatus: "draft" | "published" | "active" | "archived" = "published";
    if (isEditing) {
      if (isCurrentlyPublished) {
        targetStatus = "published";
      } else if (isCurrentlyDraft) {
        targetStatus = publish ? "published" : "draft";
      } else if (tripStatus === "archived") {
        targetStatus = publish ? "published" : "archived";
      }
    } else {
      targetStatus = publish ? "published" : "draft";
    }

    setSaving(true);
    try {
      const cleanGallery = galleryUrls.filter((u) => Boolean(u.trim()));
      const cleanHighlightCards = highlightCards.filter((c) => Boolean(c.label.trim() && c.value.trim()));
      const cleanFaqs = faqs.filter((f) => Boolean(f.question.trim() && f.answer.trim()));
      const cleanInclusions = inclusions.filter((i) => Boolean(i.trim()));
      const cleanExclusions = exclusions.filter((e) => Boolean(e.trim()));
      const cleanDays = days.filter((d) => Boolean(d.title.trim() && d.description.trim()));

      const payload = {
        name: tripName.trim(),
        slug: slug.trim() || undefined,
        shortDescription: shortDesc.trim() || undefined,
        overview: overview.trim() || undefined,
        duration: duration.trim(),
        category,
        difficulty: difficulty.toLowerCase(),
        price: priceNum,
        currency: "INR",
        badge: badge.trim() || undefined,
        startingPoint: startingPoint.trim() || undefined,
        image: tripImage.trim(),
        coverMediaId: coverMediaId || undefined,
        gallery: cleanGallery,
        destinationIds: selectedDestinationIds,
        primaryDestinationId: primaryDestinationId || selectedDestinationIds[0],
        highlights: cleanHighlightCards,
        faqs: cleanFaqs,
        itinerary: cleanDays.map((d, index) => ({
          dayNumber: index + 1,
          title: d.title.trim(),
          description: d.description.trim()
        })),
        inclusions: cleanInclusions,
        exclusions: cleanExclusions,
        seoTitle: metaTitle.trim() || undefined,
        seoDescription: metaDesc.trim() || undefined,
        status: targetStatus
      };

      if (isEditing) {
        await tripsApi.update(existingTrip!.id, payload);
        showToast(
          targetStatus === "draft"
            ? "Draft updated successfully!"
            : isCurrentlyDraft && targetStatus === "published"
            ? "Trip published successfully!"
            : "Trip changes saved!",
          "success"
        );
      } else {
        await tripsApi.create(payload);
        showToast(publish ? "Trip created and published!" : "Trip saved as draft!", "success");
      }

      await refreshTrips({ bypassCache: true });
      setAdminPage?.("trips");
      navigate("/admin/trips");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save trip";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const unselectedDestinations = availableDestinations.filter(
    (d) => !selectedDestinationIds.includes(d.id)
  );

  return (
    <div className="flex h-full">
      {/* Left section nav */}
      <div className="w-52 shrink-0 bg-white border-r border-[#e2e8f0] py-4">
        <div className="px-4 mb-4">
          <Link
            to="/admin/trips"
            onClick={() => setAdminPage?.("trips")}
            className="inline-flex items-center gap-1.5 text-[#718096] hover:text-[#0f2922] text-xs transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back to Trips
          </Link>
          <h3 className="font-semibold text-[#0f2922] text-sm mt-3">
            {existingTrip ? "Edit Trip" : "New Trip"}
          </h3>
        </div>
        <nav className="space-y-0.5 px-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition relative ${
                activeSection === s.id ? "bg-[#f0f9f4] text-[#0f2922]" : "text-[#718096] hover:bg-[#f7f8f5]"
              }`}
            >
              {activeSection === s.id && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#e8622a] rounded-r" />
              )}
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main form */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {activeSection === "basic" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                  Basic Info & Destinations
                </h2>
                <p className="text-xs text-[#718096] mt-0.5">
                  Configure package details, primary cover image, and associated destinations.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">Trip Name *</label>
                <input
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder="e.g. Chopta Tungnath Adventure"
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
                />
              </div>

              {/* Single Cover Image */}
              <div className="bg-[#f7f8f5] p-4 rounded-xl border border-[#e2e8f0]">
                <div className="mb-2">
                  <span className="text-sm font-semibold text-[#0f2922]">Cover Image (Primary) *</span>
                  <p className="text-xs text-[#718096]">
                    Every trip has exactly ONE cover image used for cards, headers, and previews. Additional photos belong in the separate Gallery section.
                  </p>
                </div>
                <MediaPicker
                  label=""
                  value={tripImage}
                  onChange={(url, mediaId) => {
                    setTripImage(url);
                    if (mediaId) setCoverMediaId(mediaId);
                  }}
                  context={{
                    destinationId: primaryDest?.id,
                    destinationSlug: primaryDest?.slug,
                    destinationName: primaryDest?.name,
                    category: "trips"
                  }}
                />
              </div>

              {/* Multidestination Selection */}
              <div className="border border-[#e2e8f0] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-[#0f2922]">
                      Destinations on this Trip *
                    </label>
                    <p className="text-xs text-[#718096]">
                      A trip can cover multiple destinations. Choose from existing destinations.
                    </p>
                  </div>
                  {loadingDestinations && (
                    <span className="text-xs text-[#e8622a] animate-pulse">Loading destinations...</span>
                  )}
                </div>

                {/* Selected destinations chips */}
                <div className="space-y-2">
                  {selectedDestinationIds.length === 0 ? (
                    <div className="border border-dashed border-red-300 rounded-lg p-3 text-center text-xs text-red-600 bg-red-50">
                      No destinations selected. Please add at least one destination below.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedDestinationIds.map((destId) => {
                        const destObj = availableDestinations.find((d) => d.id === destId);
                        const name = destObj ? destObj.name : destId;
                        const isPrimary = primaryDestinationId === destId;

                        return (
                          <div
                            key={destId}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition ${
                              isPrimary
                                ? "bg-[#0f2922] text-white border-[#0f2922]"
                                : "bg-white text-[#0f2922] border-[#cbd5e1] hover:border-[#0f2922]"
                            }`}
                          >
                            <span className="font-medium">{name}</span>
                            {isPrimary ? (
                              <span className="bg-[#e8622a] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                PRIMARY
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(destId)}
                                className="text-[10px] text-[#718096] hover:text-[#0f2922] underline"
                                title="Set as primary destination"
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveDestination(destId)}
                              className={`hover:opacity-75 font-bold ml-0.5 ${isPrimary ? "text-white" : "text-red-500"}`}
                              title="Remove destination"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Dropdown to add destination */}
                <div className="pt-2 flex items-center gap-2">
                  <select
                    id="add-dest-select"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddDestination(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
                  >
                    <option value="" disabled>
                      + Select an existing destination to add...
                    </option>
                    {unselectedDestinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-1">Duration *</label>
                  <input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 4 Days / 3 Nights"
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryValue)}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
                  >
                    <option value="trekking">Trekking</option>
                    <option value="adventure">Adventure</option>
                    <option value="weekend">Weekend</option>
                    <option value="spiritual">Spiritual</option>
                    <option value="nature">Nature</option>
                    <option value="custom">Custom</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Challenging">Challenging</option>
                    <option value="Strenuous">Strenuous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-1">Badge</label>
                  <input
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. BESTSELLER"
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-1">Starting Point</label>
                  <input
                    value={startingPoint}
                    onChange={(e) => setStartingPoint(e.target.value)}
                    placeholder="e.g. Dehradun"
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">Short Description</label>
                <textarea
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  rows={2}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  placeholder="Summary shown on trip card..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">Overview</label>
                <textarea
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  rows={3}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  placeholder="Comprehensive journey description..."
                />
              </div>

            </div>
          )}

          {activeSection === "highlights" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                  Highlight Cards (Top 4 Metrics)
                </h2>
                <p className="text-[#718096] text-sm mt-1">
                  Customize the 4 key metrics displayed prominently below the trip overview (e.g. Starting Point, Group Size, Stay Style, Meals).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {highlightCards.map((card, i) => (
                  <div key={i} className="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3 relative shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0f2922] uppercase tracking-wider">
                        Card #{i + 1}
                      </span>
                      {highlightCards.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setHighlightCards(highlightCards.filter((_, idx) => idx !== i))}
                          className="text-gray-400 hover:text-red-500 text-sm p-1 cursor-pointer"
                          title="Remove card"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-1">
                        <label className="block text-xs font-medium text-[#4a5568] mb-1">Icon / Emoji</label>
                        <input
                          value={card.icon}
                          onChange={(e) => {
                            const copy = [...highlightCards];
                            copy[i].icon = e.target.value;
                            setHighlightCards(copy);
                          }}
                          placeholder="📍"
                          className="w-full border border-[#e2e8f0] rounded-lg px-2.5 py-2 text-center text-lg focus:outline-none focus:border-[#0f2922]"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-[#4a5568] mb-1">Label</label>
                        <input
                          value={card.label}
                          onChange={(e) => {
                            const copy = [...highlightCards];
                            copy[i].label = e.target.value;
                            setHighlightCards(copy);
                          }}
                          placeholder="e.g. Starting Point"
                          className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4a5568] mb-1">Value / Detail</label>
                      <input
                        value={card.value}
                        onChange={(e) => {
                          const copy = [...highlightCards];
                          copy[i].value = e.target.value;
                          setHighlightCards(copy);
                        }}
                        placeholder="e.g. Dehradun"
                        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm font-medium text-[#0f2922] focus:outline-none focus:border-[#0f2922]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {highlightCards.length < 8 && (
                <button
                  type="button"
                  onClick={() =>
                    setHighlightCards([...highlightCards, { icon: "✨", label: "Feature", value: "Details" }])
                  }
                  className="border-2 border-dashed border-[#e2e8f0] hover:border-[#0f2922] text-[#4a5568] hover:text-[#0f2922] w-full py-3 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  + Add Highlight Card
                </button>
              )}
            </div>
          )}

          {activeSection === "itinerary" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                Itinerary
              </h2>
              {days.map((day, i) => (
                <div key={i} className="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#0f2922]">Day {i + 1}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveDay(i, -1)}
                        disabled={i === 0}
                        className="p-1 text-[#a0aec0] hover:text-[#0f2922] disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDay(i, 1)}
                        disabled={i === days.length - 1}
                        className="p-1 text-[#a0aec0] hover:text-[#0f2922] disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDay(i)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <input
                    value={day.title}
                    onChange={(e) => {
                      const d = [...days];
                      d[i].title = e.target.value;
                      setDays(d);
                    }}
                    placeholder="Day title..."
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                  <textarea
                    value={day.description}
                    onChange={(e) => {
                      const d = [...days];
                      d[i].description = e.target.value;
                      setDays(d);
                    }}
                    placeholder="Day description..."
                    rows={2}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addDay}
                className="w-full border-2 border-dashed border-[#e2e8f0] rounded-xl py-3 text-[#718096] hover:border-[#0f2922] hover:text-[#0f2922] text-sm transition"
              >
                + Add Day
              </button>
            </div>
          )}

          {activeSection === "inclusions" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                Inclusions / Exclusions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-green-700 mb-2">Inclusions</h3>
                  <div className="space-y-2">
                    {inclusions.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={item}
                          onChange={(e) => {
                            const arr = [...inclusions];
                            arr[i] = e.target.value;
                            setInclusions(arr);
                          }}
                          className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setInclusions(inclusions.filter((_, idx) => idx !== i))}
                          className="text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setInclusions([...inclusions, ""])}
                      className="text-green-600 text-xs hover:underline"
                    >
                      + Add Inclusion
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-600 mb-2">Exclusions</h3>
                  <div className="space-y-2">
                    {exclusions.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={item}
                          onChange={(e) => {
                            const arr = [...exclusions];
                            arr[i] = e.target.value;
                            setExclusions(arr);
                          }}
                          className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setExclusions(exclusions.filter((_, idx) => idx !== i))}
                          className="text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setExclusions([...exclusions, ""])}
                      className="text-red-600 text-xs hover:underline"
                    >
                      + Add Exclusion
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "faqs" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                  Trip FAQs
                </h2>
                <p className="text-[#718096] text-sm mt-1">
                  Manage common questions and answers displayed on this trip's public page.
                </p>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0f2922] uppercase tracking-wider">
                        Question #{i + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (i === 0) return;
                            const copy = [...faqs];
                            [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
                            setFaqs(copy);
                          }}
                          disabled={i === 0}
                          className="p-1 text-gray-400 hover:text-[#0f2922] disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (i === faqs.length - 1) return;
                            const copy = [...faqs];
                            [copy[i + 1], copy[i]] = [copy[i], copy[i + 1]];
                            setFaqs(copy);
                          }}
                          disabled={i === faqs.length - 1}
                          className="p-1 text-gray-400 hover:text-[#0f2922] disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))}
                          className="p-1 text-red-400 hover:text-red-600 cursor-pointer"
                          title="Remove question"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4a5568] mb-1">Question</label>
                      <input
                        value={faq.question}
                        onChange={(e) => {
                          const copy = [...faqs];
                          copy[i].question = e.target.value;
                          setFaqs(copy);
                        }}
                        placeholder="e.g. What fitness level is required?"
                        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4a5568] mb-1">Answer</label>
                      <textarea
                        value={faq.answer}
                        onChange={(e) => {
                          const copy = [...faqs];
                          copy[i].answer = e.target.value;
                          setFaqs(copy);
                        }}
                        rows={2}
                        placeholder="Clear, helpful response for travelers..."
                        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
                  className="w-full border-2 border-dashed border-[#e2e8f0] rounded-xl py-3 text-[#718096] hover:border-[#0f2922] hover:text-[#0f2922] text-sm font-medium transition cursor-pointer"
                >
                  + Add Question
                </button>
              </div>

              {faqs.length === 0 && (
                <div className="bg-[#f7f8f5] rounded-xl p-8 text-center text-sm text-[#718096]">
                  No FAQs added yet. Click "+ Add Question" below to create your first FAQ.
                </div>
              )}
            </div>
          )}

          {activeSection === "pricing" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                Pricing
              </h2>
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">Starting Price (₹ per person) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div className="bg-[#f0f9f4] border border-[#a3bfb5]/40 rounded-xl p-4 flex items-start gap-3 mt-4">
                <span className="text-xl">ℹ️</span>
                <div className="text-xs text-[#0f2922] space-y-1">
                  <p className="font-semibold">Global Cancellation & Refund Policy</p>
                  <p className="text-[#4a5568]">
                    Cancellation policies are managed globally under{" "}
                    <Link to="/admin/settings" className="text-[#e8622a] font-semibold underline">
                      Settings → Cancellation Policy
                    </Link>{" "}
                    to maintain consistent terms for all trips.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dedicated Gallery Section (Strictly Separated from Single Cover Image) */}
          {activeSection === "gallery" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                  Photo Gallery
                </h2>
                <p className="text-[#718096] text-sm">
                  Add supplementary images for this trip's gallery section. These are displayed in the dedicated Gallery section on the trip detail page, separate from the primary cover image.
                </p>
              </div>

              <div className="space-y-3">
                {galleryUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <MediaPicker
                      value={url}
                      onChange={(newUrl) => updateGallerySlot(i, newUrl)}
                      label={`Gallery Image ${i + 1}`}
                      className="flex-1"
                      context={{
                        destinationId: primaryDest?.id,
                        destinationSlug: primaryDest?.slug,
                        destinationName: primaryDest?.name,
                        category: "trips"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeGallerySlot(i)}
                      className="text-red-500 hover:text-red-700 text-xs px-2 shrink-0 mt-5"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addGallerySlot}
                  className="w-full border-2 border-dashed border-[#e2e8f0] rounded-xl py-3 text-[#718096] hover:border-[#0f2922] hover:text-[#0f2922] text-sm transition"
                >
                  + Add Gallery Image
                </button>
              </div>
            </div>
          )}

          {activeSection === "seo" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                    SEO & Search Visibility
                  </h2>
                  <p className="text-xs text-[#718096] mt-0.5">
                    Configure search engine titles, descriptions, and view live Google search previews.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoGenerateSeo}
                  className="text-xs bg-[#f0f9f4] text-[#0f2922] border border-[#a3bfb5] hover:bg-[#e2f3ea] font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>✨</span> Auto-fill from Trip Details
                </button>
              </div>

              {/* Live Google Search Preview */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#718096] flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                    </svg>
                    Google Search Result Preview
                  </span>
                  <span className="text-[11px] text-[#a0aec0]">What travellers see on Google</span>
                </div>

                <div className="bg-[#f8f9fa] border border-[#dadce0] rounded-xl p-4 space-y-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#0f2922] flex items-center justify-center text-white text-[10px] font-bold">
                      Y
                    </div>
                    <div className="text-xs leading-none">
                      <span className="font-medium text-[#202124] block">Yatrivo</span>
                      <span className="text-[#5f6368] text-[11px] truncate block max-w-sm">
                        https://yatrivo.com › trips › {slug || "trip-slug"}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-[#1a0dab] hover:underline text-base sm:text-lg font-medium cursor-pointer leading-snug line-clamp-1">
                    {metaTitle || (tripName ? `${tripName} | Yatrivo` : "Curated Himalayan Expedition | Yatrivo")}
                  </h3>
                  <p className="text-[#4d5156] text-xs leading-relaxed line-clamp-2">
                    {metaDesc || shortDesc || overview?.slice(0, 150) || "Experience mindful Himalayan adventures with Yatrivo. Enjoy small groups, handpicked mountain stays, and certified guides."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-[#4a5568]">Meta Title</label>
                    <span className={`text-[11px] font-medium ${
                      metaTitle.length >= 40 && metaTitle.length <= 60
                        ? "text-emerald-600"
                        : metaTitle.length > 60
                        ? "text-red-500 font-semibold"
                        : "text-[#a0aec0]"
                    }`}>
                      {metaTitle.length} / 60 characters
                    </span>
                  </div>
                  <input
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922]"
                    placeholder="e.g. Chopta Tungnath Trek Package | Yatrivo"
                  />
                  <p className="text-[11px] text-[#a0aec0] mt-1">Recommended: 50–60 characters. Appears as the main clickable headline in search results.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-[#4a5568]">Meta Description</label>
                    <span className={`text-[11px] font-medium ${
                      metaDesc.length >= 120 && metaDesc.length <= 160
                        ? "text-emerald-600"
                        : metaDesc.length > 160
                        ? "text-red-500 font-semibold"
                        : "text-[#a0aec0]"
                    }`}>
                      {metaDesc.length} / 160 characters
                    </span>
                  </div>
                  <textarea
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    rows={3}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0f2922] resize-none"
                    placeholder="e.g. Join our mindful 4-day Chopta Tungnath trek in Uttarakhand. Small groups, organic meals, and certified local guides..."
                  />
                  <p className="text-[11px] text-[#a0aec0] mt-1">Recommended: 120–160 characters. Summarizes the adventure on search engines and social shares.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-1">URL Slug</label>
                  <div className="flex items-center border border-[#e2e8f0] rounded-lg overflow-hidden focus-within:border-[#0f2922]">
                    <span className="px-3 py-2 text-sm text-[#718096] bg-[#f7f8f5] border-r border-[#e2e8f0]">
                      yatrivo.com/trips/
                    </span>
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="chopta-trek"
                      className="flex-1 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-[#a0aec0] mt-1">Unique, lowercase, hyphen-separated identifier for the web address.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="sticky bottom-0 bg-white border-t border-[#e2e8f0] px-6 py-4 flex items-center justify-between z-20">
          <Link
            to="/admin/trips"
            onClick={() => setAdminPage?.("trips")}
            className="text-xs text-[#718096] hover:text-[#0f2922] font-medium transition inline-flex items-center gap-1"
          >
            ← Cancel & Return to Trips
          </Link>

          <div className="flex items-center gap-3">
            {/* Show Save Draft ONLY if:
                1. New trip mode (!isEditing), OR
                2. Editing a trip that is currently a DRAFT!
                NEVER show Save Draft if editing a PUBLISHED trip! */}
            {(!isEditing || isCurrentlyDraft) && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="border border-[#0f2922] text-[#0f2922] hover:bg-[#f7f8f5] disabled:opacity-50 text-sm font-semibold px-5 py-2.5 rounded-lg transition cursor-pointer"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSave(true)}
              className="bg-[#e8622a] hover:bg-[#d4541f] disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition shadow-sm cursor-pointer inline-flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : isEditing && isCurrentlyPublished ? (
                "Save Changes"
              ) : (
                "Publish Trip"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
