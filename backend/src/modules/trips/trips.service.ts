import { redis } from "../../cache/redis";
import { logger } from "../../config/logger";
import { AppError } from "../../errors/AppError";
import { authRepository } from "../auth/auth.repository";
import { tripsRepository } from "./trips.repository";
import type {
  CreateDepartureInput,
  CreateTripInput,
  TripDepartureDto,
  TripDto,
  TripFilters,
  UpdateDepartureInput,
  UpdateTripInput
} from "./trips.types";

async function invalidateTripCaches(id: string, slug?: string): Promise<void> {
  if (!redis.configured) return;

  try {
    const keysToDelete = [
      "trips:list:public",
      `trip:${id}`
    ];
    if (slug) {
      keysToDelete.push(`trip:${slug}`);
    }

    await Promise.all(keysToDelete.map((key) => redis.del(key)));
  } catch (error) {
    logger.warn({ error, id }, "Failed to invalidate trip Redis cache");
  }
}

export const tripsService = {
  async listTrips(
    filters: TripFilters,
    isAdmin = false
  ): Promise<{ trips: TripDto[]; total: number }> {
    if (!isAdmin) {
      filters.status = "active";
      filters.includeArchived = false;
    }

    const isSimplePublicList =
      !isAdmin &&
      (!filters.category || filters.category === "all") &&
      !filters.destinationId &&
      !filters.destinationSlug &&
      !filters.search &&
      (!filters.page || filters.page === 1);

    const cacheKey = "trips:list:public";

    if (isSimplePublicList && redis.configured) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached) as { trips: TripDto[]; total: number };
        }
      } catch (err) {
        logger.warn({ err }, "Redis read error on trips:list:public");
      }
    }

    const result = await tripsRepository.findMany(filters);

    if (isSimplePublicList && redis.configured) {
      try {
        await redis.set(cacheKey, JSON.stringify(result), 300);
      } catch (err) {
        logger.warn({ err }, "Redis write error on trips:list:public");
      }
    }

    return result;
  },

  async getTrip(idOrSlug: string, isAdmin = false): Promise<TripDto> {
    const cacheKey = `trip:${idOrSlug.toLowerCase()}`;

    if (!isAdmin && redis.configured) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached) as TripDto;
        }
      } catch (err) {
        logger.warn({ err }, `Redis read error on ${cacheKey}`);
      }
    }

    const trip = await tripsRepository.findByIdOrSlug(idOrSlug, isAdmin);
    if (!trip) {
      throw new AppError(404, "TRIP_NOT_FOUND", `Trip '${idOrSlug}' not found`);
    }

    if (!isAdmin && trip.status !== "active") {
      throw new AppError(404, "TRIP_NOT_FOUND", `Trip '${idOrSlug}' not found`);
    }

    if (!isAdmin && redis.configured) {
      try {
        await redis.set(cacheKey, JSON.stringify(trip), 300);
      } catch (err) {
        logger.warn({ err }, `Redis write error on ${cacheKey}`);
      }
    }

    return trip;
  },

  async getTripsForDestination(destinationIdOrSlug: string): Promise<TripDto[]> {
    return tripsRepository.findByDestination(destinationIdOrSlug);
  },

  async createTrip(input: CreateTripInput, adminUserId: string): Promise<TripDto> {
    // Validate that destinationIds exist
    if (!input.destinationIds || input.destinationIds.length === 0) {
      throw new AppError(400, "BAD_REQUEST", "At least one destination must be assigned to the trip");
    }

    const admin = await authRepository.findUserById(adminUserId);
    if (!admin) {
      throw new AppError(401, "UNAUTHORIZED", "User not found");
    }

    const trip = await tripsRepository.create(input, adminUserId);
    await invalidateTripCaches(trip.id, trip.slug);
    return trip;
  },

  async updateTrip(
    id: string,
    input: UpdateTripInput,
    adminUserId: string
  ): Promise<TripDto> {
    const existing = await tripsRepository.findByIdOrSlug(id, true);
    if (!existing) {
      throw new AppError(404, "TRIP_NOT_FOUND", `Trip '${id}' not found`);
    }

    const updated = await tripsRepository.update(existing.id, input, adminUserId);
    if (!updated) {
      throw new AppError(500, "INTERNAL_ERROR", "Failed to update trip");
    }

    await invalidateTripCaches(updated.id, updated.slug);
    if (existing.slug !== updated.slug) {
      await invalidateTripCaches(existing.id, existing.slug);
    }

    return updated;
  },

  async archiveTrip(id: string, adminUserId: string): Promise<TripDto> {
    const trip = await tripsRepository.archive(id, adminUserId);
    if (!trip) {
      throw new AppError(404, "TRIP_NOT_FOUND", `Trip '${id}' not found`);
    }

    await invalidateTripCaches(trip.id, trip.slug);
    return trip;
  },

  async unarchiveTrip(id: string, adminUserId: string): Promise<TripDto> {
    const trip = await tripsRepository.unarchive(id, adminUserId);
    if (!trip) {
      throw new AppError(404, "TRIP_NOT_FOUND", `Trip '${id}' not found`);
    }

    await invalidateTripCaches(trip.id, trip.slug);
    return trip;
  },

  async addDeparture(
    tripId: string,
    input: CreateDepartureInput,
    adminUserId: string
  ): Promise<TripDepartureDto> {
    const trip = await tripsRepository.findByIdOrSlug(tripId, true);
    if (!trip) {
      throw new AppError(404, "TRIP_NOT_FOUND", `Trip '${tripId}' not found`);
    }

    const departure = await tripsRepository.createDeparture(trip.id, input, adminUserId);
    await invalidateTripCaches(trip.id, trip.slug);
    return departure;
  },

  async updateDeparture(
    instanceId: string,
    input: UpdateDepartureInput,
    adminUserId: string
  ): Promise<TripDepartureDto> {
    const updated = await tripsRepository.updateDeparture(instanceId, input, adminUserId);
    if (!updated) {
      throw new AppError(404, "DEPARTURE_NOT_FOUND", `Departure '${instanceId}' not found`);
    }

    await invalidateTripCaches(updated.tripId);
    return updated;
  }
};
