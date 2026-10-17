import type { PoolClient, QueryResultRow } from "pg";
import { query } from "../../db/postgres";
import type {
  CreateExternalMediaInput,
  CreateStorageMediaInput,
  MediaAssetDto,
  MediaAssetRecord,
  MediaDestinationLink,
  MediaFilters,
  MediaReferenceInfo,
  MediaVariantsRecord,
  PublicMediaVariantsDto
} from "./media.types";

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

export function parseVariantsRecord(raw: unknown): MediaVariantsRecord | null {
  if (!raw) return null;
  let obj: Record<string, unknown> | null = null;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (typeof raw === "object") {
    obj = raw as Record<string, unknown>;
  }
  if (!obj) return null;
  return obj as MediaVariantsRecord;
}

export function toPublicVariantsDto(raw: unknown): PublicMediaVariantsDto | null {
  const parsed = parseVariantsRecord(raw);
  if (!parsed) return null;

  const dto: PublicMediaVariantsDto = {};
  if (parsed.thumbnail?.url && parsed.thumbnail.width && parsed.thumbnail.height) {
    dto.thumbnail = {
      url: parsed.thumbnail.url,
      width: Number(parsed.thumbnail.width),
      height: Number(parsed.thumbnail.height)
    };
  }
  if (parsed.medium?.url && parsed.medium.width && parsed.medium.height) {
    dto.medium = {
      url: parsed.medium.url,
      width: Number(parsed.medium.width),
      height: Number(parsed.medium.height)
    };
  }
  if (parsed.viewer?.url && parsed.viewer.width && parsed.viewer.height) {
    dto.viewer = {
      url: parsed.viewer.url,
      width: Number(parsed.viewer.width),
      height: Number(parsed.viewer.height)
    };
  }

  return Object.keys(dto).length > 0 ? dto : null;
}

async function addAssetToGalleryInternal(executor: QueryExecutor, mediaId: string): Promise<void> {
  await executor.query(
    `INSERT INTO public_gallery_items (media_id, sort_order)
     VALUES ($1, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM public_gallery_items))
     ON CONFLICT (media_id) DO NOTHING`,
    [mediaId]
  );
  await executor.query(
    `WITH renumbered AS (
       SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order ASC, created_at ASC) as new_order
       FROM public_gallery_items
     )
     UPDATE public_gallery_items pgi
     SET sort_order = r.new_order
     FROM renumbered r
     WHERE pgi.id = r.id`
  );
}

export function toMediaAssetDto(record: MediaAssetRecord & {
  in_destinations?: boolean;
  in_trips?: boolean;
  in_reviews?: boolean;
  in_homepage?: boolean;
  in_gallery?: boolean;
  gallery_item_id?: string | null;
  gallery_sort_order?: number | null;
  gallery_custom_title?: string | null;
  gallery_caption?: string | null;
  destinations_json?: unknown;
  destination_names?: string | null;
}): MediaAssetDto {
  const url = record.public_url || record.external_url || "";
  const variantsDto = toPublicVariantsDto(record.variants);
  const thumbnailUrl = record.thumbnail_url || variantsDto?.thumbnail?.url || url;
  const viewerUrl = record.viewer_url || variantsDto?.viewer?.url || url;
  const mediumUrl = record.medium_url || variantsDto?.medium?.url || viewerUrl || url;
  const placeholder = record.placeholder_base64 || null;

  const categoriesSet = new Set<string>();

  let parsedDestinations: MediaDestinationLink[] = [];
  if (record.destinations_json) {
    if (typeof record.destinations_json === "string") {
      try {
        parsedDestinations = JSON.parse(record.destinations_json);
      } catch {
        parsedDestinations = [];
      }
    } else if (Array.isArray(record.destinations_json)) {
      parsedDestinations = record.destinations_json as MediaDestinationLink[];
    }
  }

  // Deduplicate destinations by id - only from actual cover and gallery usages
  const destMap = new Map<string, MediaDestinationLink>();
  for (const d of parsedDestinations) {
    if (d && d.id) {
      destMap.set(d.id, {
        id: d.id,
        name: d.name || "Destination",
        slug: d.slug || ""
      });
    }
  }
  const allDestinations = Array.from(destMap.values());
  const destinationNames = allDestinations.map((d) => d.name);

  if (record.category) {
    categoriesSet.add(record.category.replace(/_/g, "-"));
  }
  if (record.in_destinations || allDestinations.length > 0) {
    categoriesSet.add("destinations");
  }
  if (record.in_trips) {
    categoriesSet.add("trips");
  }
  if (record.in_reviews) {
    categoriesSet.add("reviews");
  }
  if (record.in_homepage) {
    categoriesSet.add("homepage");
  }
  if (categoriesSet.size === 0) {
    categoriesSet.add("general");
  }

  const primaryDest = allDestinations[0];
  const inGallery = Boolean(record.in_gallery || record.gallery_item_id);

  return {
    id: record.id,
    destinationId: primaryDest?.id ?? null,
    destinationName: destinationNames.length > 0 ? destinationNames.join(", ") : null,
    destinationSlug: primaryDest?.slug ?? null,
    destinations: allDestinations,
    destinationNames,
    category: record.category,
    categories: Array.from(categoriesSet),
    inGallery,
    galleryItemId: record.gallery_item_id ?? null,
    gallerySortOrder:
      record.gallery_sort_order !== undefined && record.gallery_sort_order !== null
        ? Number(record.gallery_sort_order)
        : null,
    galleryCustomTitle: record.gallery_custom_title ?? null,
    galleryCaption: record.gallery_caption ?? null,
    label: record.label,
    altText: record.alt_text,
    storageBucket: record.storage_bucket,
    storageKey: record.storage_key,
    externalUrl: record.external_url,
    url,
    thumbnailUrl,
    mediumUrl,
    viewerUrl,
    placeholder,
    variants: variantsDto,
    mimeType: record.mime_type,
    fileSizeBytes: record.file_size_bytes,
    width: record.width,
    height: record.height,
    createdAt: new Date(record.created_at).toISOString(),
    updatedAt: new Date(record.updated_at).toISOString()
  };
}

const DEST_LINKS_CTE = `
  media_dest_links AS (
    -- 1. Via destination_media (ONLY cover and gallery)
    SELECT dm.media_id, d.id AS destination_id, d.name AS destination_name, d.slug AS destination_slug
    FROM destination_media dm
    JOIN destinations d ON d.id = dm.destination_id
    WHERE dm.usage IN ('cover', 'gallery')
    UNION
    -- 2. Via cover_media_id on destinations
    SELECT d.cover_media_id AS media_id, d.id AS destination_id, d.name AS destination_name, d.slug AS destination_slug
    FROM destinations d
    WHERE d.cover_media_id IS NOT NULL
    UNION
    -- 3. Via URL matching in cover_image_url
    SELECT m.id AS media_id, d.id AS destination_id, d.name AS destination_name, d.slug AS destination_slug
    FROM media_assets m
    JOIN destinations d ON (
      d.cover_image_url IS NOT NULL 
      AND split_part(d.cover_image_url, '?', 1) = split_part(COALESCE(m.public_url, m.external_url), '?', 1)
    )
    UNION
    -- 4. Via URL matching in gallery_image_urls
    SELECT m.id AS media_id, d.id AS destination_id, d.name AS destination_name, d.slug AS destination_slug
    FROM media_assets m
    JOIN destinations d ON EXISTS (
      SELECT 1 FROM unnest(d.gallery_image_urls) gurl 
      WHERE split_part(gurl, '?', 1) = split_part(COALESCE(m.public_url, m.external_url), '?', 1)
    )
  ),
  media_dest_agg AS (
    SELECT 
      media_id,
      json_agg(json_build_object('id', destination_id, 'name', destination_name, 'slug', destination_slug)) as destinations,
      string_agg(destination_name, ', ') as destination_names
    FROM (SELECT DISTINCT media_id, destination_id, destination_name, destination_slug FROM media_dest_links) sub
    GROUP BY media_id
  )
`;

export const mediaRepository = {
  async findAll(
    filters: MediaFilters,
    client?: PoolClient
  ): Promise<{ media: MediaAssetDto[]; total: number }> {
    const executor = getExecutor(client);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const cte = `
      WITH ${DEST_LINKS_CTE},
      media_usage AS (
        SELECT
          m.id,
          (
            m.category = 'destinations'
            OR EXISTS (SELECT 1 FROM media_dest_links mdl WHERE mdl.media_id = m.id)
          ) as in_destinations,
          (
            m.category = 'trips'
            OR EXISTS (
              SELECT 1 FROM trips t
              WHERE t.cover_media_id = m.id
                 OR (t.cover_image_url IS NOT NULL AND split_part(t.cover_image_url, '?', 1) = split_part(coalesce(m.public_url, m.external_url), '?', 1))
                 OR EXISTS (SELECT 1 FROM unnest(t.gallery_image_urls) u WHERE split_part(u, '?', 1) = split_part(coalesce(m.public_url, m.external_url), '?', 1))
                 OR EXISTS (SELECT 1 FROM trip_media tm WHERE tm.media_id = m.id)
                 OR EXISTS (SELECT 1 FROM trip_instance_media tim WHERE tim.media_id = m.id)
            )
          ) as in_trips,
          (
            m.category = 'reviews'
            OR EXISTS (
              SELECT 1 FROM reviews r
              WHERE EXISTS (SELECT 1 FROM unnest(r.photo_urls) u WHERE split_part(u, '?', 1) = split_part(coalesce(m.public_url, m.external_url), '?', 1))
                 OR EXISTS (SELECT 1 FROM review_media rm WHERE rm.media_id = m.id)
            )
          ) as in_reviews,
          (
            m.category = 'homepage'
            OR EXISTS (SELECT 1 FROM homepage_slides hs WHERE hs.media_id = m.id)
            OR split_part(coalesce(m.public_url, m.external_url), '?', 1) IN (
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              'https://images.unsplash.com/photo-1528360983277-13d401cdc186',
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
              'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
              'https://images.unsplash.com/photo-1580281657702-257584239a55',
              'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa'
            )
            OR m.label ILIKE '%hero%'
            OR m.label ILIKE '%home%'
            OR m.alt_text ILIKE '%home%'
          ) as in_homepage,
          EXISTS (SELECT 1 FROM public_gallery_items pgi WHERE pgi.media_id = m.id) as in_gallery
        FROM media_assets m
      )
    `;

    if (filters.category && filters.category !== "all") {
      const cat = filters.category.toLowerCase().replace(/-/g, "_");
      if (cat === "gallery" || cat === "public_gallery") {
        conditions.push(`u.in_gallery = true`);
      } else if (cat === "destinations") {
        conditions.push(`u.in_destinations = true`);
      } else if (cat === "trips") {
        conditions.push(`u.in_trips = true`);
      } else if (cat === "reviews") {
        conditions.push(`u.in_reviews = true`);
      } else if (cat === "homepage") {
        conditions.push(`u.in_homepage = true`);
      } else if (cat === "general") {
        conditions.push(`(m.category = 'general' OR (NOT u.in_destinations AND NOT u.in_trips AND NOT u.in_reviews))`);
      } else {
        conditions.push(`m.category = $${paramIndex++}`);
        params.push(cat);
      }
    }

    if (filters.destinationId && filters.destinationId !== "all") {
      conditions.push(
        `EXISTS (SELECT 1 FROM media_dest_links mdl WHERE mdl.media_id = m.id AND (mdl.destination_id::text = $${paramIndex} OR mdl.destination_slug = $${paramIndex}))`
      );
      params.push(filters.destinationId);
      paramIndex++;
    }

    if (filters.search) {
      conditions.push(
        `(m.label ILIKE $${paramIndex} OR m.alt_text ILIKE $${paramIndex} OR m.storage_key ILIKE $${paramIndex} OR m.external_url ILIKE $${paramIndex} OR EXISTS (SELECT 1 FROM media_dest_links mdl WHERE mdl.media_id = m.id AND mdl.destination_name ILIKE $${paramIndex}))`
      );
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await executor.query<{ count: string }>(
      `${cte}
       SELECT count(*)::text as count
       FROM media_assets m
       JOIN media_usage u ON u.id = m.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const offset = (page - 1) * limit;

    const queryParams = [...params, limit, offset];
    const limitParamIndex = paramIndex++;
    const offsetParamIndex = paramIndex++;

    const isGalleryFilter =
      Boolean(filters.category && (filters.category.toLowerCase().includes("gallery")));
    const orderClause = isGalleryFilter
      ? "pgi.sort_order DESC, m.created_at DESC"
      : "m.created_at DESC";

    const listResult = await executor.query<MediaAssetRecord & {
      in_destinations: boolean;
      in_trips: boolean;
      in_reviews: boolean;
      in_homepage: boolean;
      in_gallery: boolean;
      gallery_item_id: string | null;
      gallery_sort_order: number | null;
      gallery_custom_title: string | null;
      gallery_caption: string | null;
      destinations_json: unknown;
      destination_names: string | null;
    }>(
      `${cte}
       SELECT m.*, d.name as destination_name, d.slug as destination_slug,
              mda.destinations as destinations_json, mda.destination_names,
              u.in_destinations, u.in_trips, u.in_reviews, u.in_homepage, u.in_gallery,
              pgi.id as gallery_item_id, pgi.sort_order as gallery_sort_order,
              pgi.custom_title as gallery_custom_title, pgi.caption as gallery_caption
       FROM media_assets m
       JOIN media_usage u ON u.id = m.id
       LEFT JOIN destinations d ON d.id = m.destination_id
       LEFT JOIN media_dest_agg mda ON mda.media_id = m.id
       LEFT JOIN public_gallery_items pgi ON pgi.media_id = m.id
       ${whereClause}
       ORDER BY ${orderClause}
       LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
      queryParams
    );

    return {
      media: listResult.rows.map(toMediaAssetDto),
      total
    };
  },

  async findById(id: string, client?: PoolClient): Promise<MediaAssetDto | null> {
    const executor = getExecutor(client);
    const result = await executor.query<MediaAssetRecord & {
      destinations_json: unknown;
      destination_names: string | null;
      in_gallery: boolean;
      gallery_item_id: string | null;
      gallery_sort_order: number | null;
      gallery_custom_title: string | null;
      gallery_caption: string | null;
    }>(
      `WITH ${DEST_LINKS_CTE}
       SELECT m.*, d.name as destination_name, d.slug as destination_slug,
              mda.destinations as destinations_json, mda.destination_names,
              (pgi.id IS NOT NULL) as in_gallery,
              pgi.id as gallery_item_id, pgi.sort_order as gallery_sort_order,
              pgi.custom_title as gallery_custom_title, pgi.caption as gallery_caption
       FROM media_assets m
       LEFT JOIN destinations d ON d.id = m.destination_id
       LEFT JOIN media_dest_agg mda ON mda.media_id = m.id
       LEFT JOIN public_gallery_items pgi ON pgi.media_id = m.id
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }
    return toMediaAssetDto(result.rows[0]);
  },

  async findByUrl(url: string, client?: PoolClient): Promise<MediaAssetDto | null> {
    const executor = getExecutor(client);
    const result = await executor.query<MediaAssetRecord & {
      destinations_json: unknown;
      destination_names: string | null;
      in_gallery: boolean;
      gallery_item_id: string | null;
      gallery_sort_order: number | null;
      gallery_custom_title: string | null;
      gallery_caption: string | null;
    }>(
      `WITH ${DEST_LINKS_CTE}
       SELECT m.*, d.name as destination_name, d.slug as destination_slug,
              mda.destinations as destinations_json, mda.destination_names,
              (pgi.id IS NOT NULL) as in_gallery,
              pgi.id as gallery_item_id, pgi.sort_order as gallery_sort_order,
              pgi.custom_title as gallery_custom_title, pgi.caption as gallery_caption
       FROM media_assets m
       LEFT JOIN destinations d ON d.id = m.destination_id
       LEFT JOIN media_dest_agg mda ON mda.media_id = m.id
       LEFT JOIN public_gallery_items pgi ON pgi.media_id = m.id
       WHERE m.external_url = $1 OR m.public_url = $1 LIMIT 1`,
      [url]
    );

    if (result.rows.length === 0) {
      return null;
    }
    return toMediaAssetDto(result.rows[0]);
  },

  async createStorageAsset(
    data: CreateStorageMediaInput,
    actorUserId?: string | null,
    client?: PoolClient
  ): Promise<MediaAssetDto> {
    const executor = getExecutor(client);
    const dbCat = data.category.replace(/-/g, "_");

    const result = await executor.query<MediaAssetRecord>(
      `INSERT INTO media_assets (
        category, destination_id, label, alt_text, storage_bucket, storage_key,
        public_url, thumbnail_url, medium_url, viewer_url, placeholder_base64, variants,
        mime_type, file_size_bytes, width, height,
        uploaded_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        dbCat,
        data.destinationId || null,
        data.label || null,
        data.altText || null,
        data.storageBucket,
        data.storageKey,
        data.publicUrl,
        data.thumbnailUrl || null,
        data.mediumUrl || null,
        data.viewerUrl || null,
        data.placeholderBase64 || null,
        data.variants ? JSON.stringify(data.variants) : null,
        data.mimeType,
        data.fileSizeBytes,
        data.width || null,
        data.height || null,
        actorUserId || null
      ]
    );

    const createdId = result.rows[0].id;

    if (data.showInGallery) {
      await addAssetToGalleryInternal(executor, createdId);
    }

    return (await this.findById(createdId, client)) || toMediaAssetDto(result.rows[0]);
  },

  async updateAssetVariants(
    id: string,
    data: {
      thumbnailUrl?: string | null;
      mediumUrl?: string | null;
      viewerUrl?: string | null;
      placeholderBase64?: string | null;
      variants?: MediaVariantsRecord | null;
      width?: number | null;
      height?: number | null;
    },
    client?: PoolClient
  ): Promise<void> {
    const executor = getExecutor(client);
    await executor.query(
      `UPDATE media_assets
       SET thumbnail_url = COALESCE($2, thumbnail_url),
           medium_url = COALESCE($3, medium_url),
           viewer_url = COALESCE($4, viewer_url),
           placeholder_base64 = COALESCE($5, placeholder_base64),
           variants = COALESCE($6::jsonb, variants),
           width = COALESCE($7, width),
           height = COALESCE($8, height),
           updated_at = now()
       WHERE id = $1`,
      [
        id,
        data.thumbnailUrl ?? null,
        data.mediumUrl ?? null,
        data.viewerUrl ?? null,
        data.placeholderBase64 ?? null,
        data.variants ? JSON.stringify(data.variants) : null,
        data.width ?? null,
        data.height ?? null
      ]
    );
  },

  async getStorageKeysForDelete(
    id: string,
    client?: PoolClient
  ): Promise<{ bucket: string | null; keys: string[] }> {
    const executor = getExecutor(client);
    const res = await executor.query<{
      storage_bucket: string | null;
      storage_key: string | null;
      variants: unknown;
    }>(
      `SELECT storage_bucket, storage_key, variants FROM media_assets WHERE id = $1`,
      [id]
    );

    const row = res.rows[0];
    if (!row) {
      return { bucket: null, keys: [] };
    }

    const keys = new Set<string>();
    if (row.storage_key) {
      keys.add(row.storage_key);
    }
    const parsedVariants = parseVariantsRecord(row.variants);
    if (parsedVariants?.thumbnail?.key) keys.add(parsedVariants.thumbnail.key);
    if (parsedVariants?.medium?.key) keys.add(parsedVariants.medium.key);
    if (parsedVariants?.viewer?.key) keys.add(parsedVariants.viewer.key);

    return {
      bucket: row.storage_bucket,
      keys: Array.from(keys)
    };
  },

  async createExternalAsset(
    data: CreateExternalMediaInput,
    actorUserId?: string | null,
    client?: PoolClient
  ): Promise<MediaAssetDto> {
    const executor = getExecutor(client);
    const dbCat = (data.category || "general").replace(/-/g, "_");

    // Reuse if existing external URL matches
    const existing = await this.findByUrl(data.url, client);
    if (existing) {
      if (data.showInGallery) {
        await addAssetToGalleryInternal(executor, existing.id);
        return (await this.findById(existing.id, client)) || existing;
      }
      return existing;
    }

    const result = await executor.query<MediaAssetRecord>(
      `INSERT INTO media_assets (
        category, destination_id, label, alt_text, external_url, public_url,
        uploaded_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $5, $6)
      RETURNING *`,
      [
        dbCat,
        data.destinationId || null,
        data.label || null,
        data.altText || null,
        data.url,
        actorUserId || null
      ]
    );

    const createdId = result.rows[0].id;

    if (data.showInGallery) {
      await addAssetToGalleryInternal(executor, createdId);
    }

    return (await this.findById(createdId, client)) || toMediaAssetDto(result.rows[0]);
  },

  async findReferences(mediaId: string, client?: PoolClient): Promise<MediaReferenceInfo> {
    const executor = getExecutor(client);
    const references: MediaReferenceInfo["references"] = [];

    // Find the media asset URL for URL-based cross-referencing
    const assetRes = await executor.query<{ public_url: string | null; external_url: string | null }>(
      `SELECT public_url, external_url FROM media_assets WHERE id = $1`,
      [mediaId]
    );
    const asset = assetRes.rows[0];
    const assetUrl = asset?.public_url || asset?.external_url;
    const cleanUrl = assetUrl ? assetUrl.split("?")[0] : null;

    // 1. Destination cover references (by ID, cover relationship, or URL)
    const destCoverRes = await executor.query<{ id: string; name: string }>(
      `SELECT d.id, d.name FROM destinations d
       LEFT JOIN destination_media dm ON dm.destination_id = d.id AND dm.media_id = $1 AND dm.usage = 'cover'
       WHERE d.cover_media_id = $1
          OR dm.media_id IS NOT NULL
          OR ($2::text IS NOT NULL AND d.cover_image_url IS NOT NULL AND split_part(d.cover_image_url, '?', 1) = $2)`,
      [mediaId, cleanUrl]
    );
    for (const row of destCoverRes.rows) {
      references.push({
        entityType: "destination",
        entityId: row.id,
        entityName: row.name,
        relationship: "cover"
      });
    }

    // 2. Destination gallery references (strictly by gallery usage or gallery URL)
    const destGalleryRes = await executor.query<{ destination_id: string; name: string }>(
      `SELECT d.id as destination_id, d.name
       FROM destinations d
       LEFT JOIN destination_media dm ON dm.destination_id = d.id AND dm.media_id = $1 AND dm.usage = 'gallery'
       WHERE dm.media_id IS NOT NULL
          OR ($2::text IS NOT NULL AND EXISTS (SELECT 1 FROM unnest(d.gallery_image_urls) u WHERE split_part(u, '?', 1) = $2))`,
      [mediaId, cleanUrl]
    );
    for (const row of destGalleryRes.rows) {
      if (!references.some(r => r.entityType === "destination" && r.entityId === row.destination_id && r.relationship === "gallery")) {
        references.push({
          entityType: "destination",
          entityId: row.destination_id,
          entityName: row.name,
          relationship: "gallery"
        });
      }
    }

    // 3. Trip cover references (by ID or URL)
    const tripCoverRes = await executor.query<{ id: string; name: string }>(
      `SELECT id, name FROM trips
       WHERE cover_media_id = $1
          OR ($2::text IS NOT NULL AND cover_image_url IS NOT NULL AND split_part(cover_image_url, '?', 1) = $2)`,
      [mediaId, cleanUrl]
    );
    for (const row of tripCoverRes.rows) {
      references.push({
        entityType: "trip",
        entityId: row.id,
        entityName: row.name,
        relationship: "cover"
      });
    }

    // 4. Trip gallery references (by media_id or gallery URL)
    const tripGalleryRes = await executor.query<{ trip_id: string; name: string }>(
      `SELECT t.id as trip_id, t.name
       FROM trips t
       LEFT JOIN trip_media tm ON tm.trip_id = t.id AND tm.media_id = $1
       WHERE tm.media_id IS NOT NULL
          OR ($2::text IS NOT NULL AND EXISTS (SELECT 1 FROM unnest(t.gallery_image_urls) u WHERE split_part(u, '?', 1) = $2))`,
      [mediaId, cleanUrl]
    );
    for (const row of tripGalleryRes.rows) {
      if (!references.some(r => r.entityType === "trip" && r.entityId === row.trip_id && r.relationship === "gallery")) {
        references.push({
          entityType: "trip",
          entityId: row.trip_id,
          entityName: row.name,
          relationship: "gallery"
        });
      }
    }

    // 5. Trip instance media references
    const tripInstRes = await executor.query<{ trip_instance_id: string }>(
      `SELECT trip_instance_id FROM trip_instance_media WHERE media_id = $1`,
      [mediaId]
    );
    for (const row of tripInstRes.rows) {
      references.push({
        entityType: "trip_instance",
        entityId: row.trip_instance_id,
        relationship: "gallery"
      });
    }

    // 6. Homepage slide references
    const slideRes = await executor.query<{ id: string }>(
      `SELECT id FROM homepage_slides WHERE media_id = $1`,
      [mediaId]
    );
    for (const row of slideRes.rows) {
      references.push({
        entityType: "homepage_slide",
        entityId: row.id,
        relationship: "slide"
      });
    }

    // 7. Review photo references
    if (cleanUrl) {
      const reviewRes = await executor.query<{ id: string; reviewer_name: string }>(
        `SELECT id, reviewer_name FROM reviews
         WHERE EXISTS (SELECT 1 FROM unnest(photo_urls) u WHERE split_part(u, '?', 1) = $1)`,
        [cleanUrl]
      );
      for (const row of reviewRes.rows) {
        references.push({
          entityType: "review",
          entityId: row.id,
          entityName: `Review by ${row.reviewer_name}`,
          relationship: "review"
        });
      }
    }

    // 8. Public gallery references
    const galleryRes = await executor.query<{ id: string }>(
      `SELECT id FROM public_gallery_items WHERE media_id = $1`,
      [mediaId]
    );
    for (const row of galleryRes.rows) {
      references.push({
        entityType: "gallery",
        entityId: row.id,
        entityName: "Public Gallery",
        relationship: "gallery"
      });
    }

    return {
      totalReferences: references.length,
      references
    };
  },

  async delete(id: string, client?: PoolClient): Promise<boolean> {
    const executor = getExecutor(client);
    const result = await executor.query(
      `DELETE FROM media_assets WHERE id = $1`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
};

