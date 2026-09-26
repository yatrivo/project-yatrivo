import type { PoolClient, QueryResultRow } from "pg";
import { query } from "../../db/postgres";
import type {
  CreateDestinationInput,
  DbDestinationCategory,
  DestinationActivityRecord,
  DestinationCategory,
  DestinationDto,
  DestinationFilters,
  DestinationGalleryMediaItem,
  DestinationHighlightRecord,
  DestinationRecord,
  UpdateDestinationInput
} from "./destinations.types";

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

export function toDbCategory(cat?: DestinationCategory): DbDestinationCategory {
  if (!cat) return "other";
  return cat.replace(/-/g, "_") as DbDestinationCategory;
}

export function toApiCategory(cat: DbDestinationCategory): DestinationCategory {
  return cat.replace(/_/g, "-") as DestinationCategory;
}

export function toDestinationDto(
  record: DestinationRecord,
  highlights: string[] = [],
  activities: string[] = [],
  galleryMedia: DestinationGalleryMediaItem[] = [],
  coverMediaUrl?: string | null
): DestinationDto {
  const image = coverMediaUrl || record.cover_image_url || "";
  const gallery =
    galleryMedia.length > 0
      ? galleryMedia.map((m) => m.url)
      : record.gallery_image_urls || [];

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    tagline: record.tagline || "",
    description: record.description || "",
    category: toApiCategory(record.category),
    season: record.season_label || "",
    bestTime: record.best_time_label || "",
    elevation: record.elevation_label || undefined,
    status: record.status,
    sortOrder: record.sort_order,
    image,
    coverMediaId: record.cover_media_id,
    gallery,
    galleryMedia,
    experienceTags: record.experience_tags || [],
    highlights,
    activities,
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
  destinationName = "Destination",
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
       VALUES ('destinations', $1, $2, $2)
       RETURNING id`,
      [`${destinationName} Cover`, imageUrl]
    );
    return { coverMediaId: created.rows[0].id, coverImageUrl: imageUrl };
  }

  return { coverMediaId: null, coverImageUrl: null };
}

async function syncDestinationGalleryMedia(
  destinationId: string,
  destinationName: string,
  galleryMediaIds?: string[] | null,
  galleryUrls?: string[] | null,
  executor: QueryExecutor = getExecutor()
): Promise<string[]> {
  if (galleryMediaIds === undefined && galleryUrls === undefined) {
    return [];
  }

  // 1. Unlink existing gallery relationships for this destination
  // Note: NEVER deletes the underlying media_assets!
  await executor.query(
    `DELETE FROM destination_media WHERE destination_id = $1 AND usage = 'gallery'`,
    [destinationId]
  );

  const finalUrls: string[] = [];

  // Case A: array of media asset UUIDs provided
  if (galleryMediaIds && galleryMediaIds.length > 0) {
    for (let i = 0; i < galleryMediaIds.length; i++) {
      const mediaId = galleryMediaIds[i];
      const mRes = await executor.query<{ public_url: string; external_url: string }>(
        `SELECT public_url, external_url FROM media_assets WHERE id = $1`,
        [mediaId]
      );
      if (mRes.rows.length > 0) {
        const url = mRes.rows[0].public_url || mRes.rows[0].external_url || "";
        finalUrls.push(url);
        await executor.query(
          `INSERT INTO destination_media (destination_id, media_id, usage, sort_order)
           VALUES ($1, $2, 'gallery', $3)
           ON CONFLICT (destination_id, media_id, usage) DO UPDATE SET sort_order = EXCLUDED.sort_order`,
          [destinationId, mediaId, i + 1]
        );
      }
    }
    return finalUrls;
  }

  // Case B: array of URLs provided
  if (galleryUrls && galleryUrls.length > 0) {
    for (let i = 0; i < galleryUrls.length; i++) {
      const gUrl = galleryUrls[i];
      if (!gUrl) continue;
      finalUrls.push(gUrl);

      let mediaId: string;
      const existing = await executor.query<{ id: string }>(
        `SELECT id FROM media_assets WHERE external_url = $1 OR public_url = $1 LIMIT 1`,
        [gUrl]
      );
      if (existing.rows.length > 0) {
        mediaId = existing.rows[0].id;
      } else {
        const created = await executor.query<{ id: string }>(
          `INSERT INTO media_assets (category, label, external_url, public_url)
           VALUES ('destinations', $1, $2, $2)
           RETURNING id`,
          [`${destinationName} Gallery ${i + 1}`, gUrl]
        );
        mediaId = created.rows[0].id;
      }

      await executor.query(
        `INSERT INTO destination_media (destination_id, media_id, usage, sort_order)
         VALUES ($1, $2, 'gallery', $3)
         ON CONFLICT (destination_id, media_id, usage) DO UPDATE SET sort_order = EXCLUDED.sort_order`,
        [destinationId, mediaId, i + 1]
      );
    }
  }

  return finalUrls;
}

export const destinationsRepository = {
  async findAll(
    filters: DestinationFilters,
    client?: PoolClient
  ): Promise<{ destinations: DestinationDto[]; total: number }> {
    const executor = getExecutor(client);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Status filtering
    if (filters.status && filters.status !== "all") {
      conditions.push(`d.status = $${paramIndex++}`);
      params.push(filters.status);
    } else if (!filters.includeArchived && filters.status !== "all") {
      conditions.push(`d.status = 'active'`);
    }

    // Category filtering
    if (filters.category && filters.category !== "All") {
      conditions.push(`d.category = $${paramIndex++}`);
      params.push(toDbCategory(filters.category as DestinationCategory));
    }

    // Tag filtering
    if (filters.tag && filters.tag !== "All" && filters.tag !== "all") {
      conditions.push(`$${paramIndex++} = ANY(d.experience_tags)`);
      params.push(filters.tag);
    }

    // Search filtering
    if (filters.search) {
      conditions.push(
        `(d.name ILIKE $${paramIndex} OR d.tagline ILIKE $${paramIndex} OR d.description ILIKE $${paramIndex})`
      );
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await executor.query<{ count: string }>(
      `SELECT count(*)::text as count FROM destinations d ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const queryParams = [...params, limit, offset];
    const limitParamIndex = paramIndex++;
    const offsetParamIndex = paramIndex++;

    const listResult = await executor.query<
      DestinationRecord & {
        resolved_cover_url: string | null;
      }
    >(
      `SELECT d.id, d.slug, d.name, d.tagline, d.description, d.category,
              d.season_label, d.best_time_label, d.elevation_label, d.status,
              d.sort_order, d.seo_title, d.seo_description, d.og_media_id,
              d.cover_media_id, d.cover_image_url, d.gallery_image_urls,
              d.experience_tags,
              d.created_by_user_id, d.updated_by_user_id, d.created_at,
              d.updated_at, d.archived_at,
              COALESCE(cma.public_url, cma.external_url, d.cover_image_url) AS resolved_cover_url
       FROM destinations d
       LEFT JOIN media_assets cma ON cma.id = d.cover_media_id
       ${whereClause}
       ORDER BY (CASE WHEN d.status = 'archived' THEN 1 ELSE 0 END) ASC,
                d.sort_order ASC,
                d.created_at DESC
       LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
      queryParams
    );

    if (listResult.rows.length === 0) {
      return { destinations: [], total };
    }

    const destinationIds = listResult.rows.map((row) => row.id);

    // Fetch highlights, activities, and gallery media
    const highlightsResult = await executor.query<DestinationHighlightRecord>(
      `SELECT destination_id, text, sort_order
       FROM destination_highlights
       WHERE destination_id = ANY($1)
       ORDER BY sort_order ASC`,
      [destinationIds]
    );
    const activitiesResult = await executor.query<DestinationActivityRecord>(
      `SELECT destination_id, name, sort_order
       FROM destination_activities
       WHERE destination_id = ANY($1)
       ORDER BY sort_order ASC`,
      [destinationIds]
    );
    const galleryMediaResult = await executor.query<{
      id: string;
      destination_id: string;
      media_id: string;
      alt_text: string | null;
      sort_order: number;
      url: string;
    }>(
      `SELECT dm.id, dm.destination_id, dm.media_id, dm.alt_text, dm.sort_order,
              COALESCE(ma.public_url, ma.external_url, '') AS url
       FROM destination_media dm
       JOIN media_assets ma ON ma.id = dm.media_id
       WHERE dm.destination_id = ANY($1) AND dm.usage = 'gallery'
       ORDER BY dm.sort_order ASC`,
      [destinationIds]
    );

    const highlightsMap = new Map<string, string[]>();
    for (const h of highlightsResult.rows) {
      const list = highlightsMap.get(h.destination_id) || [];
      list.push(h.text);
      highlightsMap.set(h.destination_id, list);
    }

    const activitiesMap = new Map<string, string[]>();
    for (const a of activitiesResult.rows) {
      const list = activitiesMap.get(a.destination_id) || [];
      list.push(a.name);
      activitiesMap.set(a.destination_id, list);
    }

    const galleryMediaMap = new Map<string, DestinationGalleryMediaItem[]>();
    for (const gm of galleryMediaResult.rows) {
      const list = galleryMediaMap.get(gm.destination_id) || [];
      list.push({
        id: gm.id,
        mediaId: gm.media_id,
        url: gm.url,
        altText: gm.alt_text,
        sortOrder: gm.sort_order
      });
      galleryMediaMap.set(gm.destination_id, list);
    }

    const destinations = listResult.rows.map((row) =>
      toDestinationDto(
        row,
        highlightsMap.get(row.id) || [],
        activitiesMap.get(row.id) || [],
        galleryMediaMap.get(row.id) || [],
        row.resolved_cover_url
      )
    );

    return { destinations, total };
  },

  async findByIdOrSlug(
    idOrSlug: string,
    client?: PoolClient
  ): Promise<DestinationDto | null> {
    const executor = getExecutor(client);
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug
      );

    const queryText = isUuid
      ? `SELECT d.*, COALESCE(cma.public_url, cma.external_url, d.cover_image_url) AS resolved_cover_url
         FROM destinations d
         LEFT JOIN media_assets cma ON cma.id = d.cover_media_id
         WHERE d.id = $1`
      : `SELECT d.*, COALESCE(cma.public_url, cma.external_url, d.cover_image_url) AS resolved_cover_url
         FROM destinations d
         LEFT JOIN media_assets cma ON cma.id = d.cover_media_id
         WHERE d.slug = $1`;

    const result = await executor.query<
      DestinationRecord & { resolved_cover_url: string | null }
    >(queryText, [idOrSlug]);

    if (result.rows.length === 0) {
      return null;
    }

    const dest = result.rows[0];

    const highlightsResult = await executor.query<DestinationHighlightRecord>(
      `SELECT text FROM destination_highlights WHERE destination_id = $1 ORDER BY sort_order ASC`,
      [dest.id]
    );
    const activitiesResult = await executor.query<DestinationActivityRecord>(
      `SELECT name FROM destination_activities WHERE destination_id = $1 ORDER BY sort_order ASC`,
      [dest.id]
    );
    const galleryMediaResult = await executor.query<{
      id: string;
      destination_id: string;
      media_id: string;
      alt_text: string | null;
      sort_order: number;
      url: string;
    }>(
      `SELECT dm.id, dm.destination_id, dm.media_id, dm.alt_text, dm.sort_order,
              COALESCE(ma.public_url, ma.external_url, '') AS url
       FROM destination_media dm
       JOIN media_assets ma ON ma.id = dm.media_id
       WHERE dm.destination_id = $1 AND dm.usage = 'gallery'
       ORDER BY dm.sort_order ASC`,
      [dest.id]
    );

    const galleryMedia: DestinationGalleryMediaItem[] = galleryMediaResult.rows.map((gm) => ({
      id: gm.id,
      mediaId: gm.media_id,
      url: gm.url,
      altText: gm.alt_text,
      sortOrder: gm.sort_order
    }));

    return toDestinationDto(
      dest,
      highlightsResult.rows.map((h) => h.text),
      activitiesResult.rows.map((a) => a.name),
      galleryMedia,
      dest.resolved_cover_url
    );
  },

  async create(
    data: CreateDestinationInput & { slug: string },
    actorUserId?: string | null,
    client?: PoolClient
  ): Promise<DestinationDto> {
    const executor = getExecutor(client);

    // Resolve cover media
    const coverInfo = await resolveCoverMedia(
      data.coverMediaId,
      data.image,
      data.name,
      executor
    );

    const insertResult = await executor.query<DestinationRecord>(
      `INSERT INTO destinations (
         name, slug, tagline, description, category, season_label,
         best_time_label, elevation_label, status, sort_order,
         cover_media_id, cover_image_url, gallery_image_urls,
         experience_tags,
         seo_title, seo_description, created_by_user_id, updated_by_user_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11, $12, $13, $14, $15, $16, $16)
       RETURNING *`,
      [
        data.name,
        data.slug,
        data.tagline || null,
        data.description || null,
        toDbCategory(data.category),
        data.season || null,
        data.bestTime || null,
        data.elevation || null,
        data.sortOrder || 0,
        coverInfo.coverMediaId,
        coverInfo.coverImageUrl,
        data.gallery || [],
        data.experienceTags || [],
        data.seoTitle || null,
        data.seoDescription || null,
        actorUserId || null
      ]
    );

    const dest = insertResult.rows[0];

    // Sync gallery media in destination_media
    const galleryUrls = await syncDestinationGalleryMedia(
      dest.id,
      dest.name,
      data.galleryMediaIds,
      data.gallery,
      executor
    );

    if (galleryUrls.length > 0) {
      await executor.query(
        `UPDATE destinations SET gallery_image_urls = $1 WHERE id = $2`,
        [galleryUrls, dest.id]
      );
      dest.gallery_image_urls = galleryUrls;
    }

    // Highlights
    if (data.highlights && data.highlights.length > 0) {
      for (let i = 0; i < data.highlights.length; i++) {
        await executor.query(
          `INSERT INTO destination_highlights (destination_id, text, sort_order)
           VALUES ($1, $2, $3)`,
          [dest.id, data.highlights[i], i]
        );
      }
    }

    // Activities
    if (data.activities && data.activities.length > 0) {
      for (let i = 0; i < data.activities.length; i++) {
        await executor.query(
          `INSERT INTO destination_activities (destination_id, name, sort_order)
           VALUES ($1, $2, $3)`,
          [dest.id, data.activities[i], i]
        );
      }
    }

    return this.findByIdOrSlug(dest.id, client) as Promise<DestinationDto>;
  },

  async update(
    id: string,
    data: UpdateDestinationInput,
    actorUserId?: string | null,
    client?: PoolClient
  ): Promise<DestinationDto> {
    const executor = getExecutor(client);

    const updateFields: string[] = [];
    const updateParams: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      updateFields.push(`name = $${idx++}`);
      updateParams.push(data.name);
    }
    if (data.slug !== undefined) {
      updateFields.push(`slug = $${idx++}`);
      updateParams.push(data.slug);
    }
    if (data.tagline !== undefined) {
      updateFields.push(`tagline = $${idx++}`);
      updateParams.push(data.tagline || null);
    }
    if (data.description !== undefined) {
      updateFields.push(`description = $${idx++}`);
      updateParams.push(data.description || null);
    }
    if (data.category !== undefined) {
      updateFields.push(`category = $${idx++}`);
      updateParams.push(toDbCategory(data.category));
    }
    if (data.season !== undefined) {
      updateFields.push(`season_label = $${idx++}`);
      updateParams.push(data.season || null);
    }
    if (data.bestTime !== undefined) {
      updateFields.push(`best_time_label = $${idx++}`);
      updateParams.push(data.bestTime || null);
    }
    if (data.elevation !== undefined) {
      updateFields.push(`elevation_label = $${idx++}`);
      updateParams.push(data.elevation || null);
    }
    if (data.sortOrder !== undefined) {
      updateFields.push(`sort_order = $${idx++}`);
      updateParams.push(data.sortOrder);
    }

    // Resolve cover media if updated
    if (data.coverMediaId !== undefined || data.image !== undefined) {
      const coverInfo = await resolveCoverMedia(
        data.coverMediaId,
        data.image,
        data.name || "Destination",
        executor
      );
      updateFields.push(`cover_media_id = $${idx++}`);
      updateParams.push(coverInfo.coverMediaId);
      updateFields.push(`cover_image_url = $${idx++}`);
      updateParams.push(coverInfo.coverImageUrl);
    }

    if (data.seoTitle !== undefined) {
      updateFields.push(`seo_title = $${idx++}`);
      updateParams.push(data.seoTitle || null);
    }
    if (data.seoDescription !== undefined) {
      updateFields.push(`seo_description = $${idx++}`);
      updateParams.push(data.seoDescription || null);
    }
    if (data.experienceTags !== undefined) {
      updateFields.push(`experience_tags = $${idx++}`);
      updateParams.push(data.experienceTags);
    }

    updateFields.push(`updated_at = NOW()`);
    if (actorUserId) {
      updateFields.push(`updated_by_user_id = $${idx++}`);
      updateParams.push(actorUserId);
    }

    updateParams.push(id);
    const idParamIdx = idx;

    if (updateFields.length > 0) {
      await executor.query(
        `UPDATE destinations
         SET ${updateFields.join(", ")}
         WHERE id = $${idParamIdx}`,
        updateParams
      );
    }

    // Sync gallery media if provided
    if (data.galleryMediaIds !== undefined || data.gallery !== undefined) {
      const galleryUrls = await syncDestinationGalleryMedia(
        id,
        data.name || "Destination",
        data.galleryMediaIds,
        data.gallery,
        executor
      );
      await executor.query(
        `UPDATE destinations SET gallery_image_urls = $1 WHERE id = $2`,
        [galleryUrls, id]
      );
    }

    // Highlights update
    if (data.highlights !== undefined) {
      await executor.query(`DELETE FROM destination_highlights WHERE destination_id = $1`, [id]);
      for (let i = 0; i < data.highlights.length; i++) {
        await executor.query(
          `INSERT INTO destination_highlights (destination_id, text, sort_order)
           VALUES ($1, $2, $3)`,
          [id, data.highlights[i], i]
        );
      }
    }

    // Activities update
    if (data.activities !== undefined) {
      await executor.query(`DELETE FROM destination_activities WHERE destination_id = $1`, [id]);
      for (let i = 0; i < data.activities.length; i++) {
        await executor.query(
          `INSERT INTO destination_activities (destination_id, name, sort_order)
           VALUES ($1, $2, $3)`,
          [id, data.activities[i], i]
        );
      }
    }

    return this.findByIdOrSlug(id, client) as Promise<DestinationDto>;
  },

  async archive(
    id: string,
    actorUserId?: string | null,
    client?: PoolClient
  ): Promise<DestinationDto> {
    const executor = getExecutor(client);
    await executor.query(
      `UPDATE destinations
       SET status = 'archived',
           archived_at = NOW(),
           updated_at = NOW(),
           updated_by_user_id = $1
       WHERE id = $2`,
      [actorUserId || null, id]
    );

    return this.findByIdOrSlug(id, client) as Promise<DestinationDto>;
  },

  async unarchive(
    id: string,
    actorUserId?: string | null,
    client?: PoolClient
  ): Promise<DestinationDto> {
    const executor = getExecutor(client);
    await executor.query(
      `UPDATE destinations
       SET status = 'active',
           archived_at = NULL,
           updated_at = NOW(),
           updated_by_user_id = $1
       WHERE id = $2`,
      [actorUserId || null, id]
    );

    return this.findByIdOrSlug(id, client) as Promise<DestinationDto>;
  }
};
