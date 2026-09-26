import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { destinationsApi } from "@/api/destinations";
import { tripsApi } from "@/api/trips";
import type { Destination } from "@/data/destinations";
import type { CategoryValue } from "@/data/categories";
import type { AdminPage } from "./AdminLayout";
import MediaPicker from "@/components/MediaPicker";

type Section = "basic" | "itinerary" | "inclusions" | "pricing" | "gallery" | "seo";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "basic", label: "Basic Info & Destinations" },
  { id: "itinerary", label: "Itinerary" },
  { id: "inclusions", label: "Inclusions / Exclusions" },
  { id: "pricing", label: "Pricing" },
  { id: "gallery", label: "Gallery" },
  { id: "seo", label: "SEO" },
];

interface Day { title: string; description: string; }
interface Addon { name: string; price: string; }

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
  const [shortDesc, setShortDesc] = useState(existingTrip?.shortDescription ?? existingTrip?.highlights?.[0] ?? "");
  const [overview, setOverview] = useState(existingTrip?.overview ?? "");
  const [highlights, setHighlights] = useState<string[]>(existingTrip?.highlights ?? ["", ""]);

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

  // Itinerary
  const [days, setDays] = useState<Day[]>(() => {
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
  const [cancellationPolicy, setCancellationPolicy] = useState(
    existingTrip?.cancellationPolicy ?? "Full refund if cancelled 15+ days before departure. 50% refund for 7–14 days. No refund under 7 days."
  );

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

    setSaving(true);
    try {
      const cleanGallery = galleryUrls.filter((u) => Boolean(u.trim()));
      const cleanHighlights = highlights.filter((h) => Boolean(h.trim()));
      const cleanInclusions = inclusions.filter((i) => Boolean(i.trim()));
      const cleanExclusions = exclusions.filter((e) => Boolean(e.trim()));

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
        cancellationPolicy: cancellationPolicy.trim() || undefined,
        badge: badge.trim() || undefined,
        startingPoint: startingPoint.trim() || undefined,
        image: tripImage.trim(),
        coverMediaId: coverMediaId || undefined,
        gallery: cleanGallery,
        destinationIds: selectedDestinationIds,
        primaryDestinationId: primaryDestinationId || selectedDestinationIds[0],
        highlights: cleanHighlights,
        itinerary: days.map((d, index) => ({
          dayNumber: index + 1,
          title: d.title.trim(),
          description: d.description.trim()
        })),
        inclusions: cleanInclusions,
        exclusions: cleanExclusions,
        seoTitle: metaTitle.trim() || undefined,
        seoDescription: metaDesc.trim() || undefined,
      };

      if (existingTrip) {
        await tripsApi.update(existingTrip.id, payload);
        showToast(publish ? "Trip updated and published!" : "Draft updated!", "success");
      } else {
        await tripsApi.create(payload);
        showToast(publish ? "Trip created and published!" : "Draft created!", "success");
      }

      await refreshTrips();
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

              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-2">Highlights</label>
                <div className="space-y-2">
                  {highlights.map((h, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={h}
                        onChange={(e) => {
                          const arr = [...highlights];
                          arr[i] = e.target.value;
                          setHighlights(arr);
                        }}
                        className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none"
                        placeholder={`Highlight ${i + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => setHighlights(highlights.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-600 px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setHighlights([...highlights, ""])}
                    className="text-[#0f2922] text-sm hover:underline"
                  >
                    + Add Highlight
                  </button>
                </div>
              </div>
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

          {activeSection === "pricing" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                Pricing & Policies
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
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">Cancellation Policy</label>
                <textarea
                  value={cancellationPolicy}
                  onChange={(e) => setCancellationPolicy(e.target.value)}
                  rows={3}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                />
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
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#0f2922]" style={{ fontFamily: "var(--font-serif, serif)" }}>
                SEO & URL
              </h2>
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">Meta Title</label>
                <input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none"
                  placeholder="e.g. Chopta Tungnath Trek Package | Yatrivo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">Meta Description</label>
                <textarea
                  value={metaDesc}
                  onChange={(e) => setMetaDesc(e.target.value)}
                  rows={3}
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-1">URL Slug</label>
                <div className="flex items-center border border-[#e2e8f0] rounded-lg overflow-hidden focus-within:border-[#0f2922]">
                  <span className="px-3 py-2 text-sm text-[#a0aec0] bg-[#f7f8f5] border-r border-[#e2e8f0]">
                    yatrivo.com/trips/
                  </span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="sticky bottom-0 bg-white border-t border-[#e2e8f0] px-6 py-4 flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="border border-[#0f2922] text-[#0f2922] hover:bg-[#f7f8f5] disabled:opacity-50 text-sm font-semibold px-6 py-2.5 rounded-lg transition"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="bg-[#e8622a] hover:bg-[#d4541f] disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition"
          >
            {saving ? "Publishing..." : "Publish Trip"}
          </button>
        </div>
      </div>
    </div>
  );
}
