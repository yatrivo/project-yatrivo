import type { PoolClient, QueryResultRow } from "pg";
import { query } from "../../db/postgres";
import type {
  AdminGalleryItemDto,
  PublicGalleryItemDto,
  AddToGalleryInput,
  UpdateGalleryItemInput,
  ReorderGalleryItem
} from "./gallery.types";

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

interface GalleryItemRecord {
  id: string;
  media_id: string;
  sort_order: number;
  custom_title: string | null;
  caption: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  public_url: string | null;
  external_url: string | null;
  label: string | null;
  alt_text: string | null;
  category: string;
  width: number | null;
  height: number | null;
  destination_name: string | null;
  destination_slug: string | null;
}

function toPublicGalleryDto(row: GalleryItemRecord): PublicGalleryItemDto {
  return {
    id: row.id,
    mediaId: row.media_id,
    url: row.public_url || row.external_url || "",
    title: row.custom_title || row.label || null,
    caption: row.caption || null,
    sortOrder: row.sort_order,
    width: row.width,
    height: row.height,
    altText: row.alt_text || row.label || null,
    createdAt: new Date(row.created_at).toISOString()
  };
}

function toAdminGalleryDto(row: GalleryItemRecord): AdminGalleryItemDto {
  return {
    id: row.id,
    mediaId: row.media_id,
    url: row.public_url || row.external_url || "",
    customTitle: row.custom_title || null,
    caption: row.caption || null,
    sortOrder: row.sort_order,
    label: row.label || null,
    altText: row.alt_text || null,
    category: row.category,
    destinationName: row.destination_name || null,
    destinationSlug: row.destination_slug || null,
    width: row.width,
    height: row.height,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

async function normalizeGallerySortOrders(executor: QueryExecutor): Promise<void> {
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

export const galleryRepository = {
  async findPublicItems(client?: PoolClient): Promise<PublicGalleryItemDto[]> {
    const executor = getExecutor(client);
    const result = await executor.query<GalleryItemRecord>(
      `SELECT pgi.id, pgi.media_id, pgi.sort_order, pgi.custom_title, pgi.caption,
              pgi.created_at, pgi.updated_at,
              m.public_url, m.external_url, m.label, m.alt_text, m.category,
              m.width, m.height,
              d.name as destination_name, d.slug as destination_slug
       FROM public_gallery_items pgi
       JOIN media_assets m ON m.id = pgi.media_id
       LEFT JOIN destinations d ON d.id = m.destination_id
       ORDER BY pgi.sort_order ASC, pgi.created_at ASC`
    );

    return result.rows.map(toPublicGalleryDto);
  },

  async findAdminItems(client?: PoolClient): Promise<AdminGalleryItemDto[]> {
    const executor = getExecutor(client);
    const result = await executor.query<GalleryItemRecord>(
      `SELECT pgi.id, pgi.media_id, pgi.sort_order, pgi.custom_title, pgi.caption,
              pgi.created_at, pgi.updated_at,
              m.public_url, m.external_url, m.label, m.alt_text, m.category,
              m.width, m.height,
              d.name as destination_name, d.slug as destination_slug
       FROM public_gallery_items pgi
       JOIN media_assets m ON m.id = pgi.media_id
       LEFT JOIN destinations d ON d.id = m.destination_id
       ORDER BY pgi.sort_order ASC, pgi.created_at ASC`
    );

    return result.rows.map(toAdminGalleryDto);
  },

  async findById(id: string, client?: PoolClient): Promise<AdminGalleryItemDto | null> {
    const executor = getExecutor(client);
    const result = await executor.query<GalleryItemRecord>(
      `SELECT pgi.id, pgi.media_id, pgi.sort_order, pgi.custom_title, pgi.caption,
              pgi.created_at, pgi.updated_at,
              m.public_url, m.external_url, m.label, m.alt_text, m.category,
              m.width, m.height,
              d.name as destination_name, d.slug as destination_slug
       FROM public_gallery_items pgi
       JOIN media_assets m ON m.id = pgi.media_id
       LEFT JOIN destinations d ON d.id = m.destination_id
       WHERE pgi.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;
    return toAdminGalleryDto(result.rows[0]);
  },

  async findByMediaId(mediaId: string, client?: PoolClient): Promise<AdminGalleryItemDto | null> {
    const executor = getExecutor(client);
    const result = await executor.query<GalleryItemRecord>(
      `SELECT pgi.id, pgi.media_id, pgi.sort_order, pgi.custom_title, pgi.caption,
              pgi.created_at, pgi.updated_at,
              m.public_url, m.external_url, m.label, m.alt_text, m.category,
              m.width, m.height,
              d.name as destination_name, d.slug as destination_slug
       FROM public_gallery_items pgi
       JOIN media_assets m ON m.id = pgi.media_id
       LEFT JOIN destinations d ON d.id = m.destination_id
       WHERE pgi.media_id = $1`,
      [mediaId]
    );

    if (result.rows.length === 0) return null;
    return toAdminGalleryDto(result.rows[0]);
  },

  async addItem(data: AddToGalleryInput, client?: PoolClient): Promise<AdminGalleryItemDto> {
    const executor = getExecutor(client);

    // Count existing items
    const countRes = await executor.query<{ total: string }>(
      `SELECT COUNT(*)::text as total FROM public_gallery_items`
    );
    const totalCount = parseInt(countRes.rows[0]?.total ?? "0", 10) || 0;

    let targetOrder: number;
    if (data.sortOrder && data.sortOrder >= 1) {
      targetOrder = Math.max(1, Math.min(data.sortOrder, totalCount + 1));
      // Shift existing items at >= targetOrder by +1
      await executor.query(
        `UPDATE public_gallery_items SET sort_order = sort_order + 1 WHERE sort_order >= $1`,
        [targetOrder]
      );
    } else {
      targetOrder = totalCount + 1;
    }

    const result = await executor.query<GalleryItemRecord>(
      `INSERT INTO public_gallery_items (media_id, sort_order, custom_title, caption)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (media_id) DO UPDATE SET
         sort_order = EXCLUDED.sort_order,
         custom_title = COALESCE(EXCLUDED.custom_title, public_gallery_items.custom_title),
         caption = COALESCE(EXCLUDED.caption, public_gallery_items.caption),
         updated_at = now()
       RETURNING id`,
      [
        data.mediaId,
        targetOrder,
        data.customTitle ?? null,
        data.caption ?? null
      ]
    );

    await normalizeGallerySortOrders(executor);

    const insertedId = result.rows[0].id;
    const item = await this.findById(insertedId, client);
    if (!item) {
      throw new Error("Failed to load newly added gallery item");
    }
    return item;
  },

  async updateItem(
    idOrMediaId: string,
    data: UpdateGalleryItemInput,
    client?: PoolClient
  ): Promise<AdminGalleryItemDto | null> {
    const executor = getExecutor(client);

    const existing = await executor.query<{ id: string; sort_order: number }>(
      `SELECT id, sort_order FROM public_gallery_items WHERE id::text = $1 OR media_id::text = $1`,
      [idOrMediaId]
    );

    if (existing.rows.length === 0) {
      return null;
    }

    const targetId = existing.rows[0].id;
    const oldOrder = existing.rows[0].sort_order;

    if (data.sortOrder !== undefined && data.sortOrder >= 1) {
      const countRes = await executor.query<{ total: string }>(
        `SELECT COUNT(*)::text as total FROM public_gallery_items`
      );
      const totalCount = parseInt(countRes.rows[0]?.total ?? "1", 10) || 1;
      const targetOrder = Math.max(1, Math.min(data.sortOrder, totalCount));

      if (targetOrder !== oldOrder) {
        if (targetOrder < oldOrder) {
          // Moving earlier: shift intermediate items down (+1)
          await executor.query(
            `UPDATE public_gallery_items
             SET sort_order = sort_order + 1, updated_at = now()
             WHERE id != $1 AND sort_order >= $2 AND sort_order < $3`,
            [targetId, targetOrder, oldOrder]
          );
        } else {
          // Moving later: shift intermediate items up (-1)
          await executor.query(
            `UPDATE public_gallery_items
             SET sort_order = sort_order - 1, updated_at = now()
             WHERE id != $1 AND sort_order > $2 AND sort_order <= $3`,
            [targetId, oldOrder, targetOrder]
          );
        }
        await executor.query(
          `UPDATE public_gallery_items SET sort_order = $2, updated_at = now() WHERE id = $1`,
          [targetId, targetOrder]
        );
      }
    }

    if (data.customTitle !== undefined) {
      await executor.query(
        `UPDATE public_gallery_items SET custom_title = $2, updated_at = now() WHERE id = $1`,
        [targetId, data.customTitle]
      );
    }

    if (data.caption !== undefined) {
      await executor.query(
        `UPDATE public_gallery_items SET caption = $2, updated_at = now() WHERE id = $1`,
        [targetId, data.caption]
      );
    }

    await normalizeGallerySortOrders(executor);

    return this.findById(targetId, client);
  },

  async removeItem(idOrMediaId: string, client?: PoolClient): Promise<boolean> {
    const executor = getExecutor(client);
    const result = await executor.query(
      `DELETE FROM public_gallery_items WHERE id::text = $1 OR media_id::text = $1`,
      [idOrMediaId]
    );
    if ((result.rowCount ?? 0) > 0) {
      await normalizeGallerySortOrders(executor);
      return true;
    }
    return false;
  },

  async reorderItems(items: ReorderGalleryItem[], client?: PoolClient): Promise<void> {
    const executor = getExecutor(client);
    for (const item of items) {
      await executor.query(
        `UPDATE public_gallery_items
         SET sort_order = $2, updated_at = now()
         WHERE id = $1`,
        [item.id, Math.max(1, item.sortOrder)]
      );
    }
    await normalizeGallerySortOrders(executor);
  }
};
