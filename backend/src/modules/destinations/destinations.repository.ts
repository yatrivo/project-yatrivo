import type { PoolClient, QueryResultRow } from "pg";
import { query } from "../../db/postgres";
import type {
  CreateDestinationInput,
  DbDestinationCategory,
  DestinationActivityRecord,
  DestinationCategory,
  DestinationDto,
  DestinationFilters,
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
  activities: string[] = []
): DestinationDto {
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
    image: record.cover_image_url || "",
    gallery: record.gallery_image_urls || [],
    highlights,
    activities,
    seoTitle: record.seo_title,
    seoDescription: record.seo_description,
    createdAt: new Date(record.created_at).toISOString(),
    updatedAt: new Date(record.updated_at).toISOString(),
    archivedAt: record.archived_at ? new Date(record.archived_at).toISOString() : null
  };
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
      // Normal public flow excludes archived destinations
      conditions.push(`d.status = 'active'`);
    }

    // Category filtering
    if (filters.category && filters.category !== "All") {
      conditions.push(`d.category = $${paramIndex++}`);
      params.push(toDbCategory(filters.category as DestinationCategory));
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

    // Count query
    const countResult = await executor.query<{ count: string }>(
      `SELECT count(*)::text as count FROM destinations d ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    // List query with archived destinations at the bottom as required:
    // ORDER BY (CASE WHEN status = 'archived' THEN 1 ELSE 0 END) ASC, sort_order ASC, created_at DESC
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const queryParams = [...params, limit, offset];
    const limitParamIndex = paramIndex++;
    const offsetParamIndex = paramIndex++;

    const listResult = await executor.query<DestinationRecord>(
      `SELECT d.id, d.slug, d.name, d.tagline, d.description, d.category,
              d.season_label, d.best_time_label, d.elevation_label, d.status,
              d.sort_order, d.seo_title, d.seo_description, d.og_media_id,
              d.cover_media_id, d.cover_image_url, d.gallery_image_urls,
              d.created_by_user_id, d.updated_by_user_id, d.created_at,
              d.updated_at, d.archived_at
       FROM destinations d
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

    // Fetch highlights and activities
    const [highlightsResult, activitiesResult] = await Promise.all([
      executor.query<DestinationHighlightRecord>(
        `SELECT destination_id, text, sort_order
         FROM destination_highlights
         WHERE destination_id = ANY($1)
         ORDER BY sort_order ASC`,
        [destinationIds]
      ),
      executor.query<DestinationActivityRecord>(
        `SELECT destination_id, name, sort_order
         FROM destination_activities
         WHERE destination_id = ANY($1)
         ORDER BY sort_order ASC`,
        [destinationIds]
      )
    ]);

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

    const destinations = listResult.rows.map((row) =>
      toDestinationDto(
        row,
        highlightsMap.get(row.id) || [],
        activitiesMap.get(row.id) || []
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
      ? `SELECT * FROM destinations WHERE id = $1`
      : `SELECT * FROM destinations WHERE slug = $1`;

    const result = await executor.query<DestinationRecord>(queryText, [idOrSlug]);
    if (result.rows.length === 0) {
      return null;
    }

    const dest = result.rows[0];

    const [highlightsResult, activitiesResult] = await Promise.all([
      executor.query<DestinationHighlightRecord>(
        `SELECT text FROM destination_highlights WHERE destination_id = $1 ORDER BY sort_order ASC`,
        [dest.id]
      ),
      executor.query<DestinationActivityRecord>(
        `SELECT name FROM destination_activities WHERE destination_id = $1 ORDER BY sort_order ASC`,
        [dest.id]
      )
    ]);

    return toDestinationDto(
      dest,
      highlightsResult.rows.map((h) => h.text),
      activitiesResult.rows.map((a) => a.name)
    );
  },

  async create(
    data: CreateDestinationInput & { slug: string },
    actorUserId?: string | null,
    client?: PoolClient
  ): Promise<DestinationDto> {
    const executor = getExecutor(client);

    const insertResult = await executor.query<DestinationRecord>(
      `INSERT INTO destinations (
         name, slug, tagline, description, category, season_label,
         best_time_label, elevation_label, status, sort_order, cover_image_url,
         gallery_image_urls, seo_title, seo_description, created_by_user_id, updated_by_user_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11, $12, $13, $14, $14)
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
        data.image || null,
        data.gallery || [],
        data.seoTitle || null,
        data.seoDescription || null,
        actorUserId || null
      ]
    );

    const dest = insertResult.rows[0];

    if (data.highlights && data.highlights.length > 0) {
      for (let i = 0; i < data.highlights.length; i++) {
        await executor.query(
          `INSERT INTO destination_highlights (destination_id, text, sort_order)
           VALUES ($1, $2, $3)`,
          [dest.id, data.highlights[i], i]
        );
      }
    }

    if (data.activities && data.activities.length > 0) {
      for (let i = 0; i < data.activities.length; i++) {
        await executor.query(
          `INSERT INTO destination_activities (destination_id, name, sort_order)
           VALUES ($1, $2, $3)`,
          [dest.id, data.activities[i], i]
        );
      }
    }

    return toDestinationDto(dest, data.highlights || [], data.activities || []);
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
    if (data.image !== undefined) {
      updateFields.push(`cover_image_url = $${idx++}`);
      updateParams.push(data.image || null);
    }
    if (data.gallery !== undefined) {
      updateFields.push(`gallery_image_urls = $${idx++}`);
      updateParams.push(data.gallery);
    }
    if (data.seoTitle !== undefined) {
      updateFields.push(`seo_title = $${idx++}`);
      updateParams.push(data.seoTitle || null);
    }
    if (data.seoDescription !== undefined) {
      updateFields.push(`seo_description = $${idx++}`);
      updateParams.push(data.seoDescription || null);
    }

    updateFields.push(`updated_at = NOW()`);
    if (actorUserId) {
      updateFields.push(`updated_by_user_id = $${idx++}`);
      updateParams.push(actorUserId);
    }

    updateParams.push(id);
    const idParamIdx = idx;

    const result = await executor.query<DestinationRecord>(
      `UPDATE destinations
       SET ${updateFields.join(", ")}
       WHERE id = $${idParamIdx}
       RETURNING *`,
      updateParams
    );

    const dest = result.rows[0];

    // Highlights update
    let highlights: string[] = [];
    if (data.highlights !== undefined) {
      await executor.query(`DELETE FROM destination_highlights WHERE destination_id = $1`, [id]);
      for (let i = 0; i < data.highlights.length; i++) {
        await executor.query(
          `INSERT INTO destination_highlights (destination_id, text, sort_order)
           VALUES ($1, $2, $3)`,
          [id, data.highlights[i], i]
        );
      }
      highlights = data.highlights;
    } else {
      const hRes = await executor.query<DestinationHighlightRecord>(
        `SELECT text FROM destination_highlights WHERE destination_id = $1 ORDER BY sort_order ASC`,
        [id]
      );
      highlights = hRes.rows.map((h) => h.text);
    }

    // Activities update
    let activities: string[] = [];
    if (data.activities !== undefined) {
      await executor.query(`DELETE FROM destination_activities WHERE destination_id = $1`, [id]);
      for (let i = 0; i < data.activities.length; i++) {
        await executor.query(
          `INSERT INTO destination_activities (destination_id, name, sort_order)
           VALUES ($1, $2, $3)`,
          [id, data.activities[i], i]
        );
      }
      activities = data.activities;
    } else {
      const aRes = await executor.query<DestinationActivityRecord>(
        `SELECT name FROM destination_activities WHERE destination_id = $1 ORDER BY sort_order ASC`,
        [id]
      );
      activities = aRes.rows.map((a) => a.name);
    }

    return toDestinationDto(dest, highlights, activities);
  },

  async archive(
    id: string,
    actorUserId?: string | null,
    client?: PoolClient
  ): Promise<DestinationDto> {
    const executor = getExecutor(client);
    const result = await executor.query<DestinationRecord>(
      `UPDATE destinations
       SET status = 'archived',
           archived_at = NOW(),
           updated_at = NOW(),
           updated_by_user_id = $1
       WHERE id = $2
       RETURNING *`,
      [actorUserId || null, id]
    );

    const dest = result.rows[0];
    const [hRes, aRes] = await Promise.all([
      executor.query<DestinationHighlightRecord>(
        `SELECT text FROM destination_highlights WHERE destination_id = $1 ORDER BY sort_order ASC`,
        [id]
      ),
      executor.query<DestinationActivityRecord>(
        `SELECT name FROM destination_activities WHERE destination_id = $1 ORDER BY sort_order ASC`,
        [id]
      )
    ]);

    return toDestinationDto(
      dest,
      hRes.rows.map((h) => h.text),
      aRes.rows.map((a) => a.name)
    );
  },

  async unarchive(
    id: string,
    actorUserId?: string | null,
    client?: PoolClient
  ): Promise<DestinationDto> {
    const executor = getExecutor(client);
    const result = await executor.query<DestinationRecord>(
      `UPDATE destinations
       SET status = 'active',
           archived_at = NULL,
           updated_at = NOW(),
           updated_by_user_id = $1
       WHERE id = $2
       RETURNING *`,
      [actorUserId || null, id]
    );

    const dest = result.rows[0];
    const [hRes, aRes] = await Promise.all([
      executor.query<DestinationHighlightRecord>(
        `SELECT text FROM destination_highlights WHERE destination_id = $1 ORDER BY sort_order ASC`,
        [id]
      ),
      executor.query<DestinationActivityRecord>(
        `SELECT name FROM destination_activities WHERE destination_id = $1 ORDER BY sort_order ASC`,
        [id]
      )
    ]);

    return toDestinationDto(
      dest,
      hRes.rows.map((h) => h.text),
      aRes.rows.map((a) => a.name)
    );
  }
};
