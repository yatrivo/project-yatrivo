import type { Request, Response } from "express";
import { tripsService } from "./trips.service";
import type { TripFilters } from "./trips.types";

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
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = res.locals.validated?.body || req.body;
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const trip = await tripsService.updateTrip(id, input, req.user!.id);

    res.status(200).json({
      status: "success",
      data: trip
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
  },

  async unarchive(req: Request, res: Response): Promise<void> {
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const trip = await tripsService.unarchiveTrip(id, req.user!.id);

    res.status(200).json({
      status: "success",
      data: trip,
      message: "Trip unarchived successfully"
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
  }
};
