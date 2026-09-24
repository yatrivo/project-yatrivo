import type { Request, Response } from "express";
import { destinationsService } from "./destinations.service";
import type {
  CreateDestinationInputValidated,
  DestinationQueryValidated,
  UpdateDestinationInputValidated
} from "./destinations.schemas";

function checkIsAdmin(req: Request): boolean {
  return Boolean(
    req.user && (req.user.role === "admin" || req.user.role === "super_admin")
  );
}

export const destinationsController = {
  async list(req: Request, res: Response): Promise<void> {
    const isAdmin = checkIsAdmin(req);
    const query = (res.locals.validated?.query || req.query) as DestinationQueryValidated;

    const result = await destinationsService.listDestinations(query, isAdmin);

    res.status(200).json({
      status: "success",
      data: result.destinations,
      total: result.total
    });
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const isAdmin = checkIsAdmin(req);
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const destination = await destinationsService.getDestination(id, isAdmin);

    res.status(200).json({
      status: "success",
      data: destination
    });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = (res.locals.validated?.body || req.body) as CreateDestinationInputValidated;
    const destination = await destinationsService.createDestination(input, req.user?.id);

    res.status(201).json({
      status: "success",
      data: destination
    });
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = (res.locals.validated?.body || req.body) as UpdateDestinationInputValidated;
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const destination = await destinationsService.updateDestination(
      id,
      input,
      req.user?.id
    );

    res.status(200).json({
      status: "success",
      data: destination
    });
  },

  async archive(req: Request, res: Response): Promise<void> {
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const destination = await destinationsService.archiveDestination(
      id,
      req.user?.id
    );

    res.status(200).json({
      status: "success",
      message: "Destination archived successfully",
      data: destination
    });
  },

  async unarchive(req: Request, res: Response): Promise<void> {
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const destination = await destinationsService.unarchiveDestination(
      id,
      req.user?.id
    );

    res.status(200).json({
      status: "success",
      message: "Destination restored successfully",
      data: destination
    });
  }
};
