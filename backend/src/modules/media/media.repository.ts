import type { PoolClient, QueryResultRow } from "pg";
import { query } from "../../db/postgres";
import type {
  CreateExternalMediaInput,
  CreateStorageMediaInput,
  MediaAssetDto,
  MediaAssetRecord,
  MediaFilters,
  MediaReferenceInfo
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

export function toMediaAssetDto(record: MediaAssetRecord): MediaAssetDto {
  const url = record.public_url || record.external_url || "";
  return {
    id: record.id,
    category: record.category,
    label: record.label,
    altText: record.alt_text,
    storageBucket: record.storage_bucket,
    storageKey: record.storage_key,
    externalUrl: record.external_url,
    url,
    mimeType: record.mime_type,
    fileSizeBytes: record.file_size_bytes,
    width: record.width,
    height: record.height,
    uploadedByUserId: record.uploaded_by_user_id,
    createdAt: new Date(record.created_at).toISOString(),
    updatedAt: new Date(record.updated_at).toISOString()
  };
}

export const mediaRepository = {
  async findAll(
    filters: MediaFilters,
    client?: PoolClient
  ): Promise<{ media: MediaAssetDto[]; total: number }> {
    const executor = getExecutor(client);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.category && filters.category !== "all") {
      const dbCat = filters.category.replace(/-/g, "_");
      conditions.push(`category = $${paramIndex++}`);
      params.push(dbCat);
    }

    if (filters.search) {
      conditions.push(
        `(label ILIKE $${paramIndex} OR alt_text ILIKE $${paramIndex} OR storage_key ILIKE $${paramIndex} OR external_url ILIKE $${paramIndex})`
      );
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await executor.query<{ count: string }>(
      `SELECT count(*)::text as count FROM media_assets ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const offset = (page - 1) * limit;

    const queryParams = [...params, limit, offset];
    const limitParamIndex = paramIndex++;
    const offsetParamIndex = paramIndex++;

    const listResult = await executor.query<MediaAssetRecord>(
      `SELECT * FROM media_assets
       ${whereClause}
       ORDER BY created_at DESC
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
    const result = await executor.query<MediaAssetRecord>(
      `SELECT * FROM media_assets WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }
    return toMediaAssetDto(result.rows[0]);
  },

  async findByUrl(url: string, client?: PoolClient): Promise<MediaAssetDto | null> {
    const executor = getExecutor(client);
    const result = await executor.query<MediaAssetRecord>(
      `SELECT * FROM media_assets WHERE external_url = $1 OR public_url = $1 LIMIT 1`,
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
        category, label, alt_text, storage_bucket, storage_key,
        public_url, mime_type, file_size_bytes, width, height,
        uploaded_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        dbCat,
        data.label || null,
        data.altText || null,
        data.storageBucket,
        data.storageKey,
        data.publicUrl,
        data.mimeType,
        data.fileSizeBytes,
        data.width || null,
        data.height || null,
        actorUserId || null
      ]
    );

    return toMediaAssetDto(result.rows[0]);
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
      return existing;
    }

    const result = await executor.query<MediaAssetRecord>(
      `INSERT INTO media_assets (
        category, label, alt_text, external_url, public_url,
        uploaded_by_user_id
      ) VALUES ($1, $2, $3, $4, $4, $5)
      RETURNING *`,
      [
        dbCat,
        data.label || null,
        data.altText || null,
        data.url,
        actorUserId || null
      ]
    );

    return toMediaAssetDto(result.rows[0]);
  },

  async findReferences(mediaId: string, client?: PoolClient): Promise<MediaReferenceInfo> {
    const executor = getExecutor(client);
    const references: MediaReferenceInfo["references"] = [];

    // 1. Destination cover references
    const destCoverRes = await executor.query<{ id: string; name: string }>(
      `SELECT id, name FROM destinations WHERE cover_media_id = $1`,
      [mediaId]
    );
    for (const row of destCoverRes.rows) {
      references.push({
        entityType: "destination",
        entityId: row.id,
        entityName: row.name,
        relationship: "cover"
      });
    }

    // 2. Destination gallery references
    const destGalleryRes = await executor.query<{ destination_id: string; name: string }>(
      `SELECT dm.destination_id, d.name
       FROM destination_media dm
       JOIN destinations d ON d.id = dm.destination_id
       WHERE dm.media_id = $1`,
      [mediaId]
    );
    for (const row of destGalleryRes.rows) {
      references.push({
        entityType: "destination",
        entityId: row.destination_id,
        entityName: row.name,
        relationship: "gallery"
      });
    }

    // 3. Trip cover references
    const tripCoverRes = await executor.query<{ id: string; name: string }>(
      `SELECT id, name FROM trips WHERE cover_media_id = $1`,
      [mediaId]
    );
    for (const row of tripCoverRes.rows) {
      references.push({
        entityType: "trip",
        entityId: row.id,
        entityName: row.name,
        relationship: "cover"
      });
    }

    // 4. Trip gallery references
    const tripGalleryRes = await executor.query<{ trip_id: string; name: string }>(
      `SELECT tm.trip_id, t.name
       FROM trip_media tm
       JOIN trips t ON t.id = tm.trip_id
       WHERE tm.media_id = $1`,
      [mediaId]
    );
    for (const row of tripGalleryRes.rows) {
      references.push({
        entityType: "trip",
        entityId: row.trip_id,
        entityName: row.name,
        relationship: "gallery"
      });
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
