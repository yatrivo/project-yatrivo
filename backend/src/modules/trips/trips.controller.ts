import type { Request, Response } from "express";
import { tripsService } from "./trips.service";
import type { TripFilters } from "./trips.types";
import { recordAuditLog } from "../audit/audit.service";

function checkIsAdmin(req: Request): boolean {
  return Boolean(
    req.user && (req.user.role === "admin" || req.user.role === "super_admin")
  );
}

export const tripsController = {
  async list(req: Request, res: Response): Promise<void> {
    const isAdmin = checkIsAdmin(req);
    const query = (res.locals.validated?.query || req.query) as TripFilters;

    const result = await tripsService.listTrips(query, isAdmin);

    res.status(200).json({
      status: "success",
      data: result.trips,
      total: result.total
    });
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const isAdmin = checkIsAdmin(req);
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const trip = await tripsService.getTrip(id, isAdmin);

    res.status(200).json({
      status: "success",
      data: trip
    });
  },

  async getForDestination(req: Request, res: Response): Promise<void> {
    const destId = String(req.params.destId || req.params.id);
    const trips = await tripsService.getTripsForDestination(destId);

    res.status(200).json({
      status: "success",
      data: trips,
      total: trips.length
    });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = res.locals.validated?.body || req.body;
    const trip = await tripsService.createTrip(input, req.user!.id);

    res.status(201).json({
      status: "success",
      data: trip
    });

    await recordAuditLog({
      req,
      action: "Created Trip",
      entityType: "trip",
      entityId: trip.id,
      details: `Created trip "${trip.name}" (${trip.category})`,
      afterData: { name: trip.name, slug: trip.slug, status: trip.status }
    });
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = res.locals.validated?.body || req.body;
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const trip = await tripsService.updateTrip(id, input, req.user!.id);

    res.status(200).json({
      status: "success",
      data: trip
    });

    await recordAuditLog({
      req,
      action: "Updated Trip",
      entityType: "trip",
      entityId: trip.id,
      details: `Updated trip "${trip.name}"`,
      afterData: { name: trip.name, status: trip.status }
    });
  },

  async archive(req: Request, res: Response): Promise<void> {
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const trip = await tripsService.archiveTrip(id, req.user!.id);

    res.status(200).json({
      status: "success",
      data: trip,
      message: "Trip archived successfully"
    });

    await recordAuditLog({
      req,
      action: "Archived Trip",
      entityType: "trip",
      entityId: trip.id,
      details: `Archived trip "${trip.name}"`
    });
  },

  async unarchive(req: Request, res: Response): Promise<void> {
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const trip = await tripsService.unarchiveTrip(id, req.user!.id);

    res.status(200).json({
      status: "success",
      data: trip,
      message: "Trip unarchived successfully"
    });

    await recordAuditLog({
      req,
      action: "Restored Trip",
      entityType: "trip",
      entityId: trip.id,
      details: `Restored trip "${trip.name}"`
    });
  },

  async addDeparture(req: Request, res: Response): Promise<void> {
    const tripId = String(res.locals.validated?.params?.id || req.params.id);
    const input = res.locals.validated?.body || req.body;
    const departure = await tripsService.addDeparture(tripId, input, req.user!.id);

    res.status(201).json({
      status: "success",
      data: departure,
      message: "Departure added successfully"
    });

    await recordAuditLog({
      req,
      action: "Added Trip Departure",
      entityType: "trip_instance",
      entityId: departure.id,
      details: `Added departure (${departure.displayDate || departure.date}) for trip #${tripId.slice(0, 8)}`,
      afterData: departure
    });
  },

  async updateDeparture(req: Request, res: Response): Promise<void> {
    const instanceId = String(req.params.instanceId);
    const input = res.locals.validated?.body || req.body;
    const departure = await tripsService.updateDeparture(instanceId, input, req.user!.id);

    res.status(200).json({
      status: "success",
      data: departure,
      message: "Departure updated successfully"
    });

    await recordAuditLog({
      req,
      action: "Updated Trip Departure",
      entityType: "trip_instance",
      entityId: departure.id,
      details: `Updated departure (${departure.displayDate || departure.date})`,
      afterData: departure
    });
  },

  async deleteDeparture(req: Request, res: Response): Promise<void> {
    const instanceId = String(req.params.instanceId);
    await tripsService.deleteDeparture(instanceId);

    res.status(200).json({
      status: "success",
      message: "Departure deleted successfully"
    });

    await recordAuditLog({
      req,
      action: "Deleted Trip Departure",
      entityType: "trip_instance",
      entityId: instanceId,
      details: `Deleted trip departure #${instanceId.slice(0, 8)}`
    });
  }
};
