import { redis } from "../../cache/redis";
import { logger } from "../../config/logger";
import { withTransaction } from "../../db/postgres";
import { AppError } from "../../errors/AppError";
import { authRepository } from "../auth/auth.repository";
import { destinationsRepository } from "./destinations.repository";
import type {
  CreateDestinationInput,
  DestinationDto,
  DestinationFilters,
  UpdateDestinationInput
} from "./destinations.types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function invalidateDestinationCaches(id: string, slug?: string): Promise<void> {
  if (!redis.configured) return;

  try {
    const keysToDelete = [
      "destinations:list:public",
      `destination:${id}`
    ];
    if (slug) {
      keysToDelete.push(`destination:${slug}`);
    }

    await Promise.all(keysToDelete.map((key) => redis.del(key)));
  } catch (error) {
    logger.warn({ error, id }, "Failed to invalidate destination Redis cache");
  }
}

export const destinationsService = {
  async listDestinations(
    filters: DestinationFilters,
    isAdmin = false
  ): Promise<{ destinations: DestinationDto[]; total: number }> {
    // Public queries only return active destinations
    if (!isAdmin) {
      filters.status = "active";
      filters.includeArchived = false;
    }

    const isSimplePublicList =
      !isAdmin &&
      (!filters.category || filters.category === "All") &&
      !filters.search &&
      (!filters.offset || filters.offset === 0);

    const cacheKey = "destinations:list:public";

    if (isSimplePublicList && redis.configured) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        logger.warn({ error }, "Redis read error for destinations list, falling back to DB");
      }
    }

    const result = await destinationsRepository.findAll(filters);

    if (isSimplePublicList && redis.configured && result.destinations.length > 0) {
      try {
        await redis.set(cacheKey, JSON.stringify(result), 1800); // 30 mins TTL
      } catch (error) {
        logger.warn({ error }, "Redis write error for destinations list");
      }
    }

    return result;
  },

  async getDestination(
    idOrSlug: string,
    isAdmin = false
  ): Promise<DestinationDto> {
    const cacheKey = `destination:${idOrSlug}`;

    if (!isAdmin && redis.configured) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        logger.warn({ error, idOrSlug }, "Redis read error for destination, falling back to DB");
      }
    }

    const dest = await destinationsRepository.findByIdOrSlug(idOrSlug);
    if (!dest) {
      throw new AppError(404, "DESTINATION_NOT_FOUND", "Destination not found");
    }

    // Exclude archived destinations from normal public/new-selection flows
    if (dest.status === "archived" && !isAdmin) {
      throw new AppError(404, "DESTINATION_NOT_FOUND", "Destination not found");
    }

    if (!isAdmin && dest.status === "active" && redis.configured) {
      try {
        await redis.set(cacheKey, JSON.stringify(dest), 3600); // 1 hour TTL
      } catch (error) {
        logger.warn({ error, idOrSlug }, "Redis write error for destination");
      }
    }

    return dest;
  },

  async createDestination(
    input: CreateDestinationInput,
    actorUserId?: string | null
  ): Promise<DestinationDto> {
    let slug = input.slug ? slugify(input.slug) : slugify(input.name);
    if (!slug) {
      slug = `destination-${Date.now()}`;
    }

    // Check slug uniqueness
    const existingSlug = await destinationsRepository.findByIdOrSlug(slug);
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const created = await withTransaction(async (client) => {
      const dest = await destinationsRepository.create(
        { ...input, slug },
        actorUserId,
        client
      );

      await authRepository.recordAuditLog(
        {
          actorUserId,
          action: "destination.created",
          entityType: "destination",
          entityId: dest.id,
          details: `Created destination '${dest.name}' (slug: ${dest.slug})`
        },
        client
      );

      return dest;
    });

    await invalidateDestinationCaches(created.id, created.slug);
    return created;
  },

  async updateDestination(
    id: string,
    input: UpdateDestinationInput,
    actorUserId?: string | null
  ): Promise<DestinationDto> {
    const existing = await destinationsRepository.findByIdOrSlug(id);
    if (!existing) {
      throw new AppError(404, "DESTINATION_NOT_FOUND", "Destination not found");
    }

    let slug = input.slug ? slugify(input.slug) : undefined;
    if (slug && slug !== existing.slug) {
      const slugClash = await destinationsRepository.findByIdOrSlug(slug);
      if (slugClash && slugClash.id !== existing.id) {
        throw new AppError(409, "SLUG_CONFLICT", `Slug '${slug}' is already in use by another destination`);
      }
    }

    const updated = await withTransaction(async (client) => {
      const dest = await destinationsRepository.update(
        existing.id,
        { ...input, slug },
        actorUserId,
        client
      );

      await authRepository.recordAuditLog(
        {
          actorUserId,
          action: "destination.updated",
          entityType: "destination",
          entityId: dest.id,
          details: `Updated destination '${dest.name}'`
        },
        client
      );

      return dest;
    });

    await invalidateDestinationCaches(existing.id, existing.slug);
    if (updated.slug !== existing.slug) {
      await invalidateDestinationCaches(updated.id, updated.slug);
    }

    return updated;
  },

  async archiveDestination(
    id: string,
    actorUserId?: string | null
  ): Promise<DestinationDto> {
    const existing = await destinationsRepository.findByIdOrSlug(id);
    if (!existing) {
      throw new AppError(404, "DESTINATION_NOT_FOUND", "Destination not found");
    }

    if (existing.status === "archived") {
      return existing;
    }

    const archived = await withTransaction(async (client) => {
      const dest = await destinationsRepository.archive(existing.id, actorUserId, client);

      await authRepository.recordAuditLog(
        {
          actorUserId,
          action: "destination.archived",
          entityType: "destination",
          entityId: dest.id,
          details: `Archived destination '${dest.name}'. Record preserved for historical referential integrity.`
        },
        client
      );

      return dest;
    });

    await invalidateDestinationCaches(existing.id, existing.slug);
    return archived;
  },

  async unarchiveDestination(
    id: string,
    actorUserId?: string | null
  ): Promise<DestinationDto> {
    const existing = await destinationsRepository.findByIdOrSlug(id);
    if (!existing) {
      throw new AppError(404, "DESTINATION_NOT_FOUND", "Destination not found");
    }

    if (existing.status === "active") {
      return existing;
    }

    const restored = await withTransaction(async (client) => {
      const dest = await destinationsRepository.unarchive(existing.id, actorUserId, client);

      await authRepository.recordAuditLog(
        {
          actorUserId,
          action: "destination.unarchived",
          entityType: "destination",
          entityId: dest.id,
          details: `Restored destination '${dest.name}' to active status.`
        },
        client
      );

      return dest;
    });

    await invalidateDestinationCaches(existing.id, existing.slug);
    return restored;
  }
};
