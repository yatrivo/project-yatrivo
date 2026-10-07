import type { PoolClient, QueryResultRow } from "pg";
import { query } from "../../db/postgres";
import type {
  CreateDepartureInput,
  CreateTripInput,
  TripCategory,
  TripDepartureDto,
  TripDestinationDto,
  TripDifficulty,
  TripDto,
  TripFilters,
  TripGalleryMediaItem,
  TripHighlightItem,
  TripFaqItem,
  TripItineraryDayDto,
  TripRecord,
  TripStatus,
  UpdateDepartureInput,
  UpdateTripInput
} from "./trips.types";

type QueryExecutor = {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: readonly unknown[]
  ): Promise<{ rows: T[]; rowCount: number | null }>;
};

function getExecutor(client?: PoolClient): QueryExecutor {
  if (client) {
    return {
      query: (text, params) => client.query(text, params ? [...params] : undefined)
    };
  }
  return {
    query: (text, params) => query(text, params)
  };
}

export function parseDurationDaysAndNights(
  label?: string | null,
  overrideDays?: number | null,
  overrideNights?: number | null
): { durationDays: number | null; durationNights: number | null } {
  let days: number | null = null;
  let nights: number | null = null;

  if (label) {
    const dayMatch = label.match(/(\d+)\s*(?:d|day|days)/i);
    const nightMatch = label.match(/(\d+)\s*(?:n|night|nights)/i);
    if (dayMatch) {
      days = parseInt(dayMatch[1], 10);
    }
    if (nightMatch) {
      nights = parseInt(nightMatch[1], 10);
    }
  }

  if (days === null && overrideDays !== undefined && overrideDays !== null) {
    days = overrideDays;
  }
  if (nights === null && overrideNights !== undefined && overrideNights !== null) {
    nights = overrideNights;
  }

  if (days !== null && nights === null) {
    nights = Math.max(0, days - 1);
  } else if (nights !== null && days === null) {
    days = nights + 1;
  }

  return { durationDays: days, durationNights: nights };
}

export function toTripDto(
  record: TripRecord,
  destinations: TripDestinationDto[] = [],
  departures: TripDepartureDto[] = [],
  legacyHighlights: string[] = [],
  itinerary: TripItineraryDayDto[] = [],
  inclusions: string[] = [],
  exclusions: string[] = [],
  galleryMedia: TripGalleryMediaItem[] = [],
  coverMediaUrl?: string | null
): TripDto {
  const image = coverMediaUrl || record.cover_image_url || "";
  const gallery =
    galleryMedia.length > 0
      ? galleryMedia.map((m) => m.url)
      : record.gallery_image_urls || [];

  const primaryDest = destinations.find((d) => d.isPrimary) || destinations[0];
  const upcomingDepartures = departures.filter((d) => d.status === "upcoming");

  let structuredHighlights: TripHighlightItem[] = [];
  if (Array.isArray(record.highlights) && record.highlights.length > 0) {
    structuredHighlights = record.highlights.map((h: any) =>
      typeof h === "string"
        ? { icon: "📍", label: "Highlight", value: h }
        : { icon: h.icon || "📍", label: h.label || "Highlight", value: h.value || "" }
    );
  } else if (legacyHighlights && legacyHighlights.length > 0) {
    structuredHighlights = legacyHighlights.map((text) => ({
      icon: "📍",
      label: "Highlight",
      value: text
    }));
  } else {
    structuredHighlights = [
      { icon: "📍", label: "Starting Point", value: record.starting_point || "Dehradun" },
      { icon: "👥", label: "Group Size", value: "Max 12" },
      { icon: "🏕️", label: "Stay Style", value: "Timber Cabins" },
      { icon: "🍽️", label: "Meals", value: "All Included" }
    ];
  }

  let faqs: TripFaqItem[] = [];
  if (Array.isArray(record.faqs) && record.faqs.length > 0) {
    faqs = record.faqs.map((f: any) => ({
      question: f.question || "",
      answer: f.answer || ""
    }));
  }

  const parsedDur = parseDurationDaysAndNights(
    record.duration_label,
    record.duration_days,
    record.duration_nights
  );

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    shortDescription: record.short_description || "",
    overview: record.overview || "",
    duration: record.duration_label,
    durationDays: parsedDur.durationDays || undefined,
    durationNights: parsedDur.durationNights || undefined,
    category: record.category,
    difficulty: record.difficulty ? record.difficulty.charAt(0).toUpperCase() + record.difficulty.slice(1) : "Moderate",
    price: Math.round((record.price_from_paise || 0) / 100),
    currency: record.currency || "INR",
    priceNotes: record.price_notes || undefined,
    cancellationPolicy: record.cancellation_policy || "",
    badge: record.badge || "",
    startingPoint: record.starting_point || "",
    status: record.status,
    isFeatured: record.is_featured,
    sortOrder: record.sort_order,
    image,
    coverMediaId: record.cover_media_id,
    gallery,
    galleryMedia,
    destinations,
    destination: primaryDest ? primaryDest.name : "",
    destinationId: primaryDest ? primaryDest.id : undefined,
    departures,
    upcomingDeparturesCount: upcomingDepartures.length,
    highlights: structuredHighlights,
    faqs,
    itinerary,
    inclusions,
    exclusions,
    seoTitle: record.seo_title,
    seoDescription: record.seo_description,
    createdAt: new Date(record.created_at).toISOString(),
    updatedAt: new Date(record.updated_at).toISOString(),
    archivedAt: record.archived_at ? new Date(record.archived_at).toISOString() : null
  };
}

async function resolveCoverMedia(
  coverMediaId?: string | null,
  imageUrl?: string | null,
  tripName = "Trip",
  executor: QueryExecutor = getExecutor()
): Promise<{ coverMediaId: string | null; coverImageUrl: string | null }> {
  if (coverMediaId) {
    const res = await executor.query<{ id: string; public_url: string; external_url: string }>(
      `SELECT id, public_url, external_url FROM media_assets WHERE id = $1`,
      [coverMediaId]
    );
    if (res.rows.length > 0) {
      const url = res.rows[0].public_url || res.rows[0].external_url || null;
      return { coverMediaId, coverImageUrl: url };
    }
  }

  if (imageUrl) {
    const existing = await executor.query<{ id: string }>(
      `SELECT id FROM media_assets WHERE external_url = $1 OR public_url = $1 LIMIT 1`,
      [imageUrl]
    );
    if (existing.rows.length > 0) {
      return { coverMediaId: existing.rows[0].id, coverImageUrl: imageUrl };
    }

    const created = await executor.query<{ id: string }>(
      `INSERT INTO media_assets (category, label, external_url, public_url)
       VALUES ('trips', $1, $2, $2)
       RETURNING id`,
      [`${tripName} Cover`, imageUrl]
    );
    return { coverMediaId: created.rows[0].id, coverImageUrl: imageUrl };
  }

  return { coverMediaId: null, coverImageUrl: null };
}

async function syncTripGalleryMedia(
  tripId: string,
  galleryUrls: string[] = [],
  galleryMediaIds: string[] = [],
  tripName = "Trip",
  executor: QueryExecutor = getExecutor()
): Promise<{ galleryUrls: string[]; mediaItems: TripGalleryMediaItem[] }> {
  await executor.query(`DELETE FROM trip_media WHERE trip_id = $1 AND usage = 'gallery'`, [tripId]);

  const finalUrls: string[] = [];
  const mediaItems: TripGalleryMediaItem[] = [];

  const mediaIdList: string[] = [...galleryMediaIds];

  for (let i = 0; i < galleryUrls.length; i++) {
    const url = galleryUrls[i];
    if (!url) continue;

    let mediaId: string | null = null;
    const existing = await executor.query<{ id: string }>(
      `SELECT id FROM media_assets WHERE external_url = $1 OR public_url = $1 LIMIT 1`,
      [url]
    );

    if (existing.rows.length > 0) {
      mediaId = existing.rows[0].id;
    } else {
      const created = await executor.query<{ id: string }>(
        `INSERT INTO media_assets (category, label, external_url, public_url)
         VALUES ('trips', $1, $2, $2)
         RETURNING id`,
        [`${tripName} Gallery ${i + 1}`, url]
      );
      mediaId = created.rows[0].id;
    }

    if (mediaId && !mediaIdList.includes(mediaId)) {
      mediaIdList.push(mediaId);
    }
  }

  for (let sortOrder = 0; sortOrder < mediaIdList.length; sortOrder++) {
    const mId = mediaIdList[sortOrder];
    const assetRes = await executor.query<{ id: string; public_url: string; external_url: string; alt_text: string | null }>(
      `SELECT id, public_url, external_url, alt_text FROM media_assets WHERE id = $1`,
      [mId]
    );
    if (assetRes.rows.length === 0) continue;

    const asset = assetRes.rows[0];
    const url = asset.public_url || asset.external_url || "";
    if (url) finalUrls.push(url);

    const inserted = await executor.query<{ id: string }>(
      `INSERT INTO trip_media (trip_id, media_id, usage, sort_order)
       VALUES ($1, $2, 'gallery', $3)
       RETURNING id`,
      [tripId, mId, sortOrder]
    );

    mediaItems.push({
      id: inserted.rows[0].id,
      mediaId: mId,
      url,
      altText: asset.alt_text,
      sortOrder
    });
  }

  await executor.query(
    `UPDATE trips SET gallery_image_urls = $1 WHERE id = $2`,
    [finalUrls, tripId]
  );

  return { galleryUrls: finalUrls, mediaItems };
}

export const tripsRepository = {
  async findMany(filters: TripFilters = {}): Promise<{ trips: TripDto[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (!filters.includeArchived) {
      conditions.push(`t.archived_at IS NULL AND t.status != 'archived'`);
    }

    if (filters.status && filters.status !== "all") {
      if (filters.status === "published" || filters.status === "active") {
        conditions.push(`t.status IN ('published', 'active')`);
      } else {
        params.push(filters.status);
        conditions.push(`t.status = $${params.length}`);
      }
    }

    if (filters.category && filters.category !== "all" && filters.category !== "All") {
      params.push(filters.category.toLowerCase());
      conditions.push(`t.category::text = $${params.length}`);
    }

    if (filters.difficulty) {
      params.push(filters.difficulty.toLowerCase());
      conditions.push(`t.difficulty::text = $${params.length}`);
    }

    if (filters.destinationId) {
      params.push(filters.destinationId);
      conditions.push(`EXISTS (
        SELECT 1 FROM trip_destinations td 
        WHERE td.trip_id = t.id AND td.destination_id = $${params.length}
      )`);
    }

    if (filters.destinationSlug) {
      params.push(filters.destinationSlug.toLowerCase());
      conditions.push(`EXISTS (
        SELECT 1 FROM trip_destinations td 
        JOIN destinations d ON d.id = td.destination_id
        WHERE td.trip_id = t.id AND LOWER(d.slug) = $${params.length}
      )`);
    }

    if (filters.search) {
      params.push(`%${filters.search.toLowerCase()}%`);
      const searchIdx = params.length;
      conditions.push(`(
        LOWER(t.name) LIKE $${searchIdx} OR
        LOWER(COALESCE(t.short_description, '')) LIKE $${searchIdx} OR
        LOWER(COALESCE(t.overview, '')) LIKE $${searchIdx} OR
        EXISTS (
          SELECT 1 FROM trip_destinations td
          JOIN destinations d ON d.id = td.destination_id
          WHERE td.trip_id = t.id AND LOWER(d.name) LIKE $${searchIdx}
        )
      )`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRes = await query<{ count: string }>(
      `SELECT count(*)::text as count FROM trips t ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || "0", 10);

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const dataParams = [...params, limit, offset];
    const tripRows = await query<TripRecord & { cover_asset_url: string | null }>(
      `SELECT t.*, m.public_url AS cover_asset_url
       FROM trips t
       LEFT JOIN media_assets m ON m.id = t.cover_media_id
       ${whereClause}
       ORDER BY (CASE WHEN t.status = 'archived' THEN 1 ELSE 0 END) ASC, t.sort_order ASC, t.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    if (tripRows.rows.length === 0) {
      return { trips: [], total };
    }

    const tripIds = tripRows.rows.map((r) => r.id);

    // Fetch destinations for these trips
    const destRows = await query<{
      trip_id: string;
      destination_id: string;
      name: string;
      slug: string;
      cover_image_url: string | null;
      is_primary: boolean;
      sort_order: number;
    }>(
      `SELECT td.trip_id, td.destination_id, d.name, d.slug, d.cover_image_url, td.is_primary, td.sort_order
       FROM trip_destinations td
       JOIN destinations d ON d.id = td.destination_id
       WHERE td.trip_id = ANY($1)
       ORDER BY td.is_primary DESC, td.sort_order ASC`,
      [tripIds]
    );

    const destsByTripId = new Map<string, TripDestinationDto[]>();
    for (const d of destRows.rows) {
      const arr = destsByTripId.get(d.trip_id) || [];
      arr.push({
        id: d.destination_id,
        name: d.name,
        slug: d.slug,
        image: d.cover_image_url || undefined,
        isPrimary: d.is_primary,
        sortOrder: d.sort_order
      });
      destsByTripId.set(d.trip_id, arr);
    }

    // Fetch highlights for these trips
    const hlRows = await query<{ trip_id: string; text: string }>(
      `SELECT trip_id, text FROM trip_highlights WHERE trip_id = ANY($1) ORDER BY sort_order ASC`,
      [tripIds]
    );
    const hlByTripId = new Map<string, string[]>();
    for (const h of hlRows.rows) {
      const arr = hlByTripId.get(h.trip_id) || [];
      arr.push(h.text);
      hlByTripId.set(h.trip_id, arr);
    }

    // Fetch departures for these trips
    const depRows = await query<{
      id: string;
      trip_id: string;
      starts_on: string;
      ends_on: string | null;
      display_date: string | null;
      price_paise: number;
      spots_total: number;
      is_cancelled: boolean;
      completed_at: string | null;
      notes: string | null;
      remaining_capacity: number | string | null;
      completed_photos: string[] | null;
    }>(
      `SELECT ti.id, ti.trip_id, ti.starts_on::text, ti.ends_on::text, ti.display_date,
              ti.price_paise, ti.spots_total, ti.is_cancelled, ti.completed_at::text, ti.notes,
              ti.completed_photos,
              c.remaining_capacity
       FROM trip_instances ti
       LEFT JOIN trip_instance_capacity c ON c.trip_instance_id = ti.id
       WHERE ti.trip_id = ANY($1)
       ORDER BY ti.starts_on ASC`,
      [tripIds]
    );

    const depsByTripId = new Map<string, TripDepartureDto[]>();
    for (const dep of depRows.rows) {
      const arr = depsByTripId.get(dep.trip_id) || [];
      const status = dep.is_cancelled ? "cancelled" : dep.completed_at ? "completed" : "upcoming";
      const spotsLeft = dep.remaining_capacity !== null && dep.remaining_capacity !== undefined
        ? Number(dep.remaining_capacity)
        : dep.spots_total;
      arr.push({
        id: dep.id,
        tripId: dep.trip_id,
        date: dep.starts_on,
        displayDate: dep.display_date || dep.starts_on,
        price: Math.round(dep.price_paise / 100),
        spotsTotal: dep.spots_total,
        spotsLeft,
        status,
        notes: dep.notes,
        completedPhotos: dep.completed_photos || []
      });
      depsByTripId.set(dep.trip_id, arr);
    }

    // Fetch itinerary for these trips
    const itinRows = await query<{
      trip_id: string;
      day_number: number;
      title: string;
      description: string;
      meals: string | null;
      stay: string | null;
    }>(
      `SELECT trip_id, day_number, title, description, meals, stay
       FROM trip_itinerary_days
       WHERE trip_id = ANY($1)
       ORDER BY day_number ASC`,
      [tripIds]
    );
    const itinByTripId = new Map<string, TripItineraryDayDto[]>();
    for (const itin of itinRows.rows) {
      const arr = itinByTripId.get(itin.trip_id) || [];
      arr.push({
        dayNumber: itin.day_number,
        title: itin.title,
        description: itin.description,
        meals: itin.meals,
        stay: itin.stay
      });
      itinByTripId.set(itin.trip_id, arr);
    }

    // Fetch inclusions for these trips
    const incRows = await query<{ trip_id: string; text: string }>(
      `SELECT trip_id, text FROM trip_inclusions WHERE trip_id = ANY($1) ORDER BY sort_order ASC`,
      [tripIds]
    );
    const incByTripId = new Map<string, string[]>();
    for (const inc of incRows.rows) {
      const arr = incByTripId.get(inc.trip_id) || [];
      arr.push(inc.text);
      incByTripId.set(inc.trip_id, arr);
    }

    // Fetch exclusions for these trips
    const excRows = await query<{ trip_id: string; text: string }>(
      `SELECT trip_id, text FROM trip_exclusions WHERE trip_id = ANY($1) ORDER BY sort_order ASC`,
      [tripIds]
    );
    const excByTripId = new Map<string, string[]>();
    for (const exc of excRows.rows) {
      const arr = excByTripId.get(exc.trip_id) || [];
      arr.push(exc.text);
      excByTripId.set(exc.trip_id, arr);
    }

    const trips = tripRows.rows.map((r) => {
      const destinations = destsByTripId.get(r.id) || [];
      const highlights = hlByTripId.get(r.id) || [];
      const departures = depsByTripId.get(r.id) || [];
      const itinerary = itinByTripId.get(r.id) || [];
      const inclusions = incByTripId.get(r.id) || [];
      const exclusions = excByTripId.get(r.id) || [];
      return toTripDto(
        r,
        destinations,
        departures,
        highlights,
        itinerary,
        inclusions,
        exclusions,
        [],
        r.cover_asset_url
      );
    });

    return { trips, total };
  },

  async findByIdOrSlug(idOrSlug: string, includeArchived = false): Promise<TripDto | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const condition = isUuid ? "t.id = $1" : "LOWER(t.slug) = LOWER($1)";
    const archiveCondition = includeArchived ? "" : "AND t.archived_at IS NULL";

    const tripRes = await query<TripRecord & { cover_asset_url: string | null }>(
      `SELECT t.*, m.public_url AS cover_asset_url
       FROM trips t
       LEFT JOIN media_assets m ON m.id = t.cover_media_id
       WHERE ${condition} ${archiveCondition}
       LIMIT 1`,
      [idOrSlug]
    );

    if (tripRes.rows.length === 0) return null;
    const r = tripRes.rows[0];

    // Destinations
    const destRows = await query<{
      destination_id: string;
      name: string;
      slug: string;
      cover_image_url: string | null;
      is_primary: boolean;
      sort_order: number;
    }>(
      `SELECT td.destination_id, d.name, d.slug, d.cover_image_url, td.is_primary, td.sort_order
       FROM trip_destinations td
       JOIN destinations d ON d.id = td.destination_id
       WHERE td.trip_id = $1
       ORDER BY td.is_primary DESC, td.sort_order ASC`,
      [r.id]
    );
    const destinations: TripDestinationDto[] = destRows.rows.map((d) => ({
      id: d.destination_id,
      name: d.name,
      slug: d.slug,
      image: d.cover_image_url || undefined,
      isPrimary: d.is_primary,
      sortOrder: d.sort_order
    }));

    // Highlights
    const hlRows = await query<{ text: string }>(
      `SELECT text FROM trip_highlights WHERE trip_id = $1 ORDER BY sort_order ASC`,
      [r.id]
    );
    const highlights = hlRows.rows.map((h) => h.text);

    // Itinerary
    const itinRows = await query<{ day_number: number; title: string; description: string; meals: string | null; stay: string | null }>(
      `SELECT day_number, title, description, meals, stay FROM trip_itinerary_days WHERE trip_id = $1 ORDER BY day_number ASC`,
      [r.id]
    );
    const itinerary: TripItineraryDayDto[] = itinRows.rows.map((i) => ({
      dayNumber: i.day_number,
      title: i.title,
      description: i.description,
      meals: i.meals,
      stay: i.stay
    }));

    // Inclusions
    const incRows = await query<{ text: string }>(
      `SELECT text FROM trip_inclusions WHERE trip_id = $1 ORDER BY sort_order ASC`,
      [r.id]
    );
    const inclusions = incRows.rows.map((i) => i.text);

    // Exclusions
    const excRows = await query<{ text: string }>(
      `SELECT text FROM trip_exclusions WHERE trip_id = $1 ORDER BY sort_order ASC`,
      [r.id]
    );
    const exclusions = excRows.rows.map((e) => e.text);

    // Gallery Media
    const mediaRows = await query<{
      id: string;
      media_id: string;
      public_url: string;
      external_url: string;
      alt_text: string | null;
      sort_order: number;
    }>(
      `SELECT tm.id, tm.media_id, m.public_url, m.external_url, tm.alt_text, tm.sort_order
       FROM trip_media tm
       JOIN media_assets m ON m.id = tm.media_id
       WHERE tm.trip_id = $1 AND tm.usage = 'gallery'
       ORDER BY tm.sort_order ASC`,
      [r.id]
    );
    const galleryMedia: TripGalleryMediaItem[] = mediaRows.rows.map((m) => ({
      id: m.id,
      mediaId: m.media_id,
      url: m.public_url || m.external_url || "",
      altText: m.alt_text,
      sortOrder: m.sort_order
    }));

    // Departures with remaining capacity
    const depRows = await query<{
      id: string;
      starts_on: string;
      ends_on: string | null;
      display_date: string | null;
      price_paise: number;
      spots_total: number;
      is_cancelled: boolean;
      completed_at: string | null;
      notes: string | null;
      completed_photos: string[] | null;
      remaining_capacity: number | null;
    }>(
      `SELECT ti.id, ti.starts_on::text, ti.ends_on::text, ti.display_date,
              ti.price_paise, ti.spots_total, ti.is_cancelled, ti.completed_at::text, ti.notes,
              ti.completed_photos,
              c.remaining_capacity
       FROM trip_instances ti
       LEFT JOIN trip_instance_capacity c ON c.trip_instance_id = ti.id
       WHERE ti.trip_id = $1
       ORDER BY ti.starts_on ASC`,
      [r.id]
    );

    const departures: TripDepartureDto[] = depRows.rows.map((dep) => {
      const status = dep.is_cancelled ? "cancelled" : dep.completed_at ? "completed" : "upcoming";
      const spotsLeft = dep.remaining_capacity !== null && dep.remaining_capacity !== undefined ? Number(dep.remaining_capacity) : dep.spots_total;
      return {
        id: dep.id,
        tripId: r.id,
        date: dep.starts_on,
        displayDate: dep.display_date || dep.starts_on,
        price: Math.round(dep.price_paise / 100),
        spotsTotal: dep.spots_total,
        spotsLeft,
        status,
        notes: dep.notes,
        completedPhotos: dep.completed_photos || []
      };
    });

    return toTripDto(
      r,
      destinations,
      departures,
      highlights,
      itinerary,
      inclusions,
      exclusions,
      galleryMedia,
      r.cover_asset_url
    );
  },

  async findByDestination(destinationIdOrSlug: string): Promise<TripDto[]> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(destinationIdOrSlug);
    const filter = isUuid ? { destinationId: destinationIdOrSlug } : { destinationSlug: destinationIdOrSlug };
    const { trips } = await this.findMany(filter);
    return trips;
  },

  async create(input: CreateTripInput, userId?: string): Promise<TripDto> {
    const baseSlug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let slug = baseSlug;
    let suffix = 1;
    while (true) {
      const exists = await query(`SELECT id FROM trips WHERE slug = $1 LIMIT 1`, [slug]);
      if (exists.rows.length === 0) break;
      slug = `${baseSlug}-${suffix++}`;
    }

    const { coverMediaId, coverImageUrl } = await resolveCoverMedia(
      input.coverMediaId,
      input.image,
      input.name
    );

    const pricePaise = Math.round(input.price * 100);

    const normalizedHighlights = input.highlights
      ? input.highlights.map((h) =>
          typeof h === "string"
            ? { icon: "📍", label: "Highlight", value: h }
            : { icon: h.icon || "📍", label: h.label || "Highlight", value: h.value || "" }
        )
      : [
          { icon: "📍", label: "Starting Point", value: input.startingPoint || "Dehradun" },
          { icon: "👥", label: "Group Size", value: "Max 12" },
          { icon: "🏕️", label: "Stay Style", value: "Timber Cabins" },
          { icon: "🍽️", label: "Meals", value: "All Included" }
        ];
    const normalizedFaqs = input.faqs || [];

    const parsedDur = parseDurationDaysAndNights(
      input.duration,
      input.durationDays,
      input.durationNights
    );

    const insertRes = await query<TripRecord>(
      `INSERT INTO trips (
        slug, name, short_description, overview,
        duration_label, duration_days, duration_nights,
        category, difficulty, price_from_paise, currency,
        cancellation_policy, badge, starting_point,
        status, sort_order, is_featured,
        seo_title, seo_description,
        cover_media_id, cover_image_url, gallery_image_urls,
        highlights, faqs,
        created_by_user_id, updated_by_user_id
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17,
        $18, $19,
        $20, $21, $22,
        $23, $24,
        $25, $25
      ) RETURNING *`,
      [
        slug,
        input.name,
        input.shortDescription || null,
        input.overview || null,
        input.duration,
        parsedDur.durationDays,
        parsedDur.durationNights,
        input.category || "trekking",
        input.difficulty || "moderate",
        pricePaise,
        input.currency || "INR",
        input.cancellationPolicy || null,
        input.badge || null,
        input.startingPoint || null,
        input.status || "published",
        input.sortOrder || 0,
        input.isFeatured || false,
        input.seoTitle || null,
        input.seoDescription || null,
        coverMediaId,
        coverImageUrl,
        input.gallery || [],
        JSON.stringify(normalizedHighlights),
        JSON.stringify(normalizedFaqs),
        userId || null
      ]
    );

    const tripId = insertRes.rows[0].id;

    // Link destinations
    if (input.destinationIds && input.destinationIds.length > 0) {
      for (let i = 0; i < input.destinationIds.length; i++) {
        const destIdOrSlug = input.destinationIds[i];
        // Resolve ID if slug passed
        const dRes = await query<{ id: string }>(
          `SELECT id FROM destinations WHERE id::text = $1 OR LOWER(slug) = LOWER($1) LIMIT 1`,
          [destIdOrSlug]
        );
        if (dRes.rows.length > 0) {
          const destId = dRes.rows[0].id;
          const isPrimary = input.primaryDestinationId
            ? destId === input.primaryDestinationId || destIdOrSlug === input.primaryDestinationId
            : i === 0;
          await query(
            `INSERT INTO trip_destinations (trip_id, destination_id, is_primary, sort_order)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (trip_id, destination_id) DO UPDATE SET is_primary = EXCLUDED.is_primary, sort_order = EXCLUDED.sort_order`,
            [tripId, destId, isPrimary, i]
          );
        }
      }
    }

    // Link highlights
    if (input.highlights && input.highlights.length > 0) {
      for (let i = 0; i < input.highlights.length; i++) {
        await query(
          `INSERT INTO trip_highlights (trip_id, text, sort_order) VALUES ($1, $2, $3)`,
          [tripId, input.highlights[i], i]
        );
      }
    }

    // Link itinerary
    if (input.itinerary && input.itinerary.length > 0) {
      for (let i = 0; i < input.itinerary.length; i++) {
        const day = input.itinerary[i];
        await query(
          `INSERT INTO trip_itinerary_days (trip_id, day_number, title, description, meals, stay, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [tripId, day.dayNumber || i + 1, day.title, day.description, day.meals || null, day.stay || null, i]
        );
      }
    }

    // Link inclusions
    if (input.inclusions && input.inclusions.length > 0) {
      for (let i = 0; i < input.inclusions.length; i++) {
        await query(
          `INSERT INTO trip_inclusions (trip_id, text, sort_order) VALUES ($1, $2, $3)`,
          [tripId, input.inclusions[i], i]
        );
      }
    }

    // Link exclusions
    if (input.exclusions && input.exclusions.length > 0) {
      for (let i = 0; i < input.exclusions.length; i++) {
        await query(
          `INSERT INTO trip_exclusions (trip_id, text, sort_order) VALUES ($1, $2, $3)`,
          [tripId, input.exclusions[i], i]
        );
      }
    }

    // Sync gallery media
    if (input.gallery || input.galleryMediaIds) {
      await syncTripGalleryMedia(
        tripId,
        input.gallery || [],
        input.galleryMediaIds || [],
        input.name
      );
    }

    const created = await this.findByIdOrSlug(tripId, true);
    return created!;
  },

  async update(id: string, input: UpdateTripInput, userId?: string): Promise<TripDto | null> {
    const existing = await this.findByIdOrSlug(id, true);
    if (!existing) return null;

    const updates: string[] = ["updated_at = now()"];
    const params: unknown[] = [existing.id];

    if (input.name !== undefined) {
      params.push(input.name);
      updates.push(`name = $${params.length}`);
    }
    if (input.slug !== undefined) {
      params.push(input.slug);
      updates.push(`slug = $${params.length}`);
    }
    if (input.shortDescription !== undefined) {
      params.push(input.shortDescription || null);
      updates.push(`short_description = $${params.length}`);
    }
    if (input.overview !== undefined) {
      params.push(input.overview || null);
      updates.push(`overview = $${params.length}`);
    }
    if (input.duration !== undefined) {
      params.push(input.duration);
      updates.push(`duration_label = $${params.length}`);

      const parsedDur = parseDurationDaysAndNights(
        input.duration,
        input.durationDays,
        input.durationNights
      );
      params.push(parsedDur.durationDays);
      updates.push(`duration_days = $${params.length}`);
      params.push(parsedDur.durationNights);
      updates.push(`duration_nights = $${params.length}`);
    } else {
      if (input.durationDays !== undefined) {
        params.push(input.durationDays || null);
        updates.push(`duration_days = $${params.length}`);
      }
      if (input.durationNights !== undefined) {
        params.push(input.durationNights || null);
        updates.push(`duration_nights = $${params.length}`);
      }
    }
    if (input.category !== undefined) {
      params.push(input.category);
      updates.push(`category = $${params.length}`);
    }
    if (input.difficulty !== undefined) {
      params.push(input.difficulty);
      updates.push(`difficulty = $${params.length}`);
    }
    if (input.price !== undefined) {
      params.push(Math.round(input.price * 100));
      updates.push(`price_from_paise = $${params.length}`);
    }
    if (input.currency !== undefined) {
      params.push(input.currency);
      updates.push(`currency = $${params.length}`);
    }
    if (input.cancellationPolicy !== undefined) {
      params.push(input.cancellationPolicy || null);
      updates.push(`cancellation_policy = $${params.length}`);
    }
    if (input.badge !== undefined) {
      params.push(input.badge || null);
      updates.push(`badge = $${params.length}`);
    }
    if (input.startingPoint !== undefined) {
      params.push(input.startingPoint || null);
      updates.push(`starting_point = $${params.length}`);
    }
    if (input.sortOrder !== undefined) {
      params.push(input.sortOrder);
      updates.push(`sort_order = $${params.length}`);
    }
    if (input.isFeatured !== undefined) {
      params.push(input.isFeatured);
      updates.push(`is_featured = $${params.length}`);
    }
    if (input.seoTitle !== undefined) {
      params.push(input.seoTitle || null);
      updates.push(`seo_title = $${params.length}`);
    }
    if (input.seoDescription !== undefined) {
      params.push(input.seoDescription || null);
      updates.push(`seo_description = $${params.length}`);
    }
    if (input.status !== undefined) {
      params.push(input.status);
      updates.push(`status = $${params.length}`);
      if (input.status === "archived") {
        updates.push(`archived_at = now()`);
      } else {
        updates.push(`archived_at = NULL`);
      }
    }

    if (input.coverMediaId !== undefined || input.image !== undefined) {
      const { coverMediaId, coverImageUrl } = await resolveCoverMedia(
        input.coverMediaId,
        input.image,
        input.name || existing.name
      );
      params.push(coverMediaId);
      updates.push(`cover_media_id = $${params.length}`);
      params.push(coverImageUrl);
      updates.push(`cover_image_url = $${params.length}`);
    }

    if (input.highlights !== undefined) {
      const normalizedHighlights = input.highlights.map((h) =>
        typeof h === "string"
          ? { icon: "📍", label: "Highlight", value: h }
          : { icon: h.icon || "📍", label: h.label || "Highlight", value: h.value || "" }
      );
      params.push(JSON.stringify(normalizedHighlights));
      updates.push(`highlights = $${params.length}`);
    }

    if (input.faqs !== undefined) {
      params.push(JSON.stringify(input.faqs));
      updates.push(`faqs = $${params.length}`);
    }

    if (userId) {
      params.push(userId);
      updates.push(`updated_by_user_id = $${params.length}`);
    }

    await query(
      `UPDATE trips SET ${updates.join(", ")} WHERE id = $1`,
      params
    );

    // Update destinations
    if (input.destinationIds !== undefined) {
      await query(`DELETE FROM trip_destinations WHERE trip_id = $1`, [existing.id]);
      for (let i = 0; i < input.destinationIds.length; i++) {
        const destIdOrSlug = input.destinationIds[i];
        const dRes = await query<{ id: string }>(
          `SELECT id FROM destinations WHERE id::text = $1 OR LOWER(slug) = LOWER($1) LIMIT 1`,
          [destIdOrSlug]
        );
        if (dRes.rows.length > 0) {
          const destId = dRes.rows[0].id;
          const isPrimary = input.primaryDestinationId
            ? destId === input.primaryDestinationId || destIdOrSlug === input.primaryDestinationId
            : i === 0;
          await query(
            `INSERT INTO trip_destinations (trip_id, destination_id, is_primary, sort_order)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (trip_id, destination_id) DO UPDATE SET is_primary = EXCLUDED.is_primary, sort_order = EXCLUDED.sort_order`,
            [existing.id, destId, isPrimary, i]
          );
        }
      }
    }

    // Update highlights
    if (input.highlights !== undefined) {
      await query(`DELETE FROM trip_highlights WHERE trip_id = $1`, [existing.id]);
      for (let i = 0; i < input.highlights.length; i++) {
        await query(
          `INSERT INTO trip_highlights (trip_id, text, sort_order) VALUES ($1, $2, $3)`,
          [existing.id, input.highlights[i], i]
        );
      }
    }

    // Update itinerary
    if (input.itinerary !== undefined) {
      await query(`DELETE FROM trip_itinerary_days WHERE trip_id = $1`, [existing.id]);
      for (let i = 0; i < input.itinerary.length; i++) {
        const day = input.itinerary[i];
        await query(
          `INSERT INTO trip_itinerary_days (trip_id, day_number, title, description, meals, stay, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [existing.id, day.dayNumber || i + 1, day.title, day.description, day.meals || null, day.stay || null, i]
        );
      }
    }

    // Update inclusions
    if (input.inclusions !== undefined) {
      await query(`DELETE FROM trip_inclusions WHERE trip_id = $1`, [existing.id]);
      for (let i = 0; i < input.inclusions.length; i++) {
        await query(
          `INSERT INTO trip_inclusions (trip_id, text, sort_order) VALUES ($1, $2, $3)`,
          [existing.id, input.inclusions[i], i]
        );
      }
    }

    // Update exclusions
    if (input.exclusions !== undefined) {
      await query(`DELETE FROM trip_exclusions WHERE trip_id = $1`, [existing.id]);
      for (let i = 0; i < input.exclusions.length; i++) {
        await query(
          `INSERT INTO trip_exclusions (trip_id, text, sort_order) VALUES ($1, $2, $3)`,
          [existing.id, input.exclusions[i], i]
        );
      }
    }

    // Update gallery media
    if (input.gallery !== undefined || input.galleryMediaIds !== undefined) {
      await syncTripGalleryMedia(
        existing.id,
        input.gallery || [],
        input.galleryMediaIds || [],
        input.name || existing.name
      );
    }

    return this.findByIdOrSlug(existing.id, true);
  },

  async archive(id: string, userId?: string): Promise<TripDto | null> {
    const existing = await this.findByIdOrSlug(id, true);
    if (!existing) return null;

    await query(
      `UPDATE trips 
       SET status = 'archived', archived_at = now(), updated_at = now(), updated_by_user_id = $2
       WHERE id = $1`,
      [existing.id, userId || null]
    );

    return this.findByIdOrSlug(existing.id, true);
  },

  async unarchive(id: string, userId?: string): Promise<TripDto | null> {
    const existing = await this.findByIdOrSlug(id, true);
    if (!existing) return null;

    await query(
      `UPDATE trips 
       SET status = 'published', archived_at = null, updated_at = now(), updated_by_user_id = $2
       WHERE id = $1`,
      [existing.id, userId || null]
    );

    return this.findByIdOrSlug(existing.id, true);
  },

  // Departures / trip_instances
  async createDeparture(tripId: string, input: CreateDepartureInput, userId?: string): Promise<TripDepartureDto> {
    const d = new Date(input.date + "T00:00:00");
    const displayDate =
      input.displayDate ||
      d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    let pricePaise = 0;
    if (input.price !== undefined) {
      pricePaise = Math.round(input.price * 100);
    } else {
      const t = await query<{ price_from_paise: number }>(`SELECT price_from_paise FROM trips WHERE id = $1`, [tripId]);
      pricePaise = t.rows[0]?.price_from_paise || 0;
    }

    const ins = await query<{ id: string; starts_on: string; spots_total: number; notes: string | null }>(
      `INSERT INTO trip_instances (
        trip_id, starts_on, display_date, price_paise, currency, spots_total, notes, created_by_user_id
      ) VALUES ($1, $2, $3, $4, 'INR', $5, $6, $7)
      RETURNING id, starts_on::text, spots_total, notes`,
      [tripId, input.date, displayDate, pricePaise, input.spotsTotal, input.notes || null, userId || null]
    );

    const row = ins.rows[0];
    return {
      id: row.id,
      tripId,
      date: row.starts_on,
      displayDate,
      price: Math.round(pricePaise / 100),
      spotsTotal: row.spots_total,
      spotsLeft: row.spots_total,
      status: "upcoming",
      notes: row.notes,
      completedPhotos: []
    };
  },

  async updateDeparture(instanceId: string, input: UpdateDepartureInput, userId?: string): Promise<TripDepartureDto | null> {
    const cur = await query<{ id: string; trip_id: string; starts_on: string; display_date: string; price_paise: number; spots_total: number; notes: string | null; is_cancelled: boolean; completed_at: string | null }>(
      `SELECT id, trip_id, starts_on::text, display_date, price_paise, spots_total, notes, is_cancelled, completed_at::text
       FROM trip_instances WHERE id = $1`,
      [instanceId]
    );
    if (cur.rows.length === 0) return null;
    const current = cur.rows[0];

    const updates: string[] = ["updated_at = now()"];
    const params: unknown[] = [instanceId];

    if (input.date !== undefined) {
      params.push(input.date);
      updates.push(`starts_on = $${params.length}`);
    }
    if (input.displayDate !== undefined) {
      params.push(input.displayDate);
      updates.push(`display_date = $${params.length}`);
    }
    if (input.price !== undefined) {
      params.push(Math.round(input.price * 100));
      updates.push(`price_paise = $${params.length}`);
    }
    if (input.spotsTotal !== undefined) {
      params.push(input.spotsTotal);
      updates.push(`spots_total = $${params.length}`);
    }
    if (input.notes !== undefined) {
      params.push(input.notes || null);
      updates.push(`notes = $${params.length}`);
    }
    if (input.completedPhotos !== undefined) {
      params.push(input.completedPhotos);
      updates.push(`completed_photos = $${params.length}`);
    }
    if (input.status !== undefined) {
      if (input.status === "completed") {
        updates.push(`completed_at = now()`);
        updates.push(`is_cancelled = false`);
      } else if (input.status === "cancelled") {
        updates.push(`is_cancelled = true`);
        updates.push(`cancelled_at = now()`);
      } else if (input.status === "upcoming") {
        updates.push(`completed_at = null`);
        updates.push(`is_cancelled = false`);
      }
    }
    if (userId) {
      params.push(userId);
      updates.push(`updated_by_user_id = $${params.length}`);
    }

    await query(`UPDATE trip_instances SET ${updates.join(", ")} WHERE id = $1`, params);

    const updated = await query<{
      id: string;
      trip_id: string;
      starts_on: string;
      display_date: string;
      price_paise: number;
      spots_total: number;
      notes: string | null;
      completed_photos: string[] | null;
      is_cancelled: boolean;
      completed_at: string | null;
      remaining_capacity: number | null;
    }>(
      `SELECT ti.id, ti.trip_id, ti.starts_on::text, ti.display_date, ti.price_paise, ti.spots_total, ti.notes,
              ti.completed_photos,
              ti.is_cancelled, ti.completed_at::text, c.remaining_capacity
       FROM trip_instances ti
       LEFT JOIN trip_instance_capacity c ON c.trip_instance_id = ti.id
       WHERE ti.id = $1`,
      [instanceId]
    );

    const r = updated.rows[0];
    const status = r.is_cancelled ? "cancelled" : r.completed_at ? "completed" : "upcoming";
    const spotsLeft = r.remaining_capacity !== null && r.remaining_capacity !== undefined ? Number(r.remaining_capacity) : r.spots_total;

    return {
      id: r.id,
      tripId: r.trip_id,
      date: r.starts_on,
      displayDate: r.display_date,
      price: Math.round(r.price_paise / 100),
      spotsTotal: r.spots_total,
      spotsLeft,
      status,
      notes: r.notes,
      completedPhotos: r.completed_photos || []
    };
  },

  async deleteDeparture(instanceId: string): Promise<boolean> {
    const cur = await query<{ id: string; trip_id: string }>(
      `SELECT id, trip_id FROM trip_instances WHERE id = $1`,
      [instanceId]
    );
    if (cur.rows.length === 0) return false;

    // Check if there are active bookings
    const bookings = await query<{ count: string }>(
      `SELECT COUNT(*) FROM bookings WHERE trip_instance_id = $1 AND status != 'cancelled'`,
      [instanceId]
    );
    if (parseInt(bookings.rows[0]?.count || "0", 10) > 0) {
      // Soft cancel if bookings exist
      await query(`UPDATE trip_instances SET is_cancelled = true, cancelled_at = now() WHERE id = $1`, [instanceId]);
      return true;
    }

    // Otherwise delete instance
    await query(`DELETE FROM trip_instances WHERE id = $1`, [instanceId]);
    return true;
  }
};
