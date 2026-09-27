import type { Request, Response } from "express";
import { mediaService } from "./media.service";
import type {
  CreateExternalMediaInputValidated,
  MediaQueryValidated
} from "./media.schemas";

export const mediaController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = (res.locals.validated?.query || req.query) as MediaQueryValidated;
    const result = await mediaService.listMedia(query);

    res.status(200).json({
      status: "success",
      data: result.media,
      total: result.total
    });
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const asset = await mediaService.getMedia(id);

    res.status(200).json({
      status: "success",
      data: asset
    });
  },

  async getReferences(req: Request, res: Response): Promise<void> {
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const refInfo = await mediaService.getMediaReferences(id);

    res.status(200).json({
      status: "success",
      data: refInfo
    });
  },

  async upload(req: Request, res: Response): Promise<void> {
    const file = req.file;
    const category = typeof req.body.category === "string" ? req.body.category : "general";
    const label = typeof req.body.label === "string" ? req.body.label : undefined;
    const altText = typeof req.body.altText === "string" ? req.body.altText : undefined;
    const destinationId = typeof req.body.destinationId === "string" ? req.body.destinationId : (typeof req.body.destination_id === "string" ? req.body.destination_id : undefined);
    const destinationSlug = typeof req.body.destinationSlug === "string" ? req.body.destinationSlug : (typeof req.body.destination_slug === "string" ? req.body.destination_slug : (typeof req.body.destination === "string" ? req.body.destination : undefined));
    const isReview = req.body.isReview === true || req.body.isReview === "true" || category === "reviews";

    const asset = await mediaService.uploadImage(
      file as Express.Multer.File,
      {
        category,
        destinationId,
        destinationSlug,
        isReview,
        label,
        altText
      },
      req.user?.id
    );

    res.status(201).json({
      status: "success",
      message: "Media uploaded successfully",
      data: asset
    });
  },

  async createExternal(req: Request, res: Response): Promise<void> {
    const input = (res.locals.validated?.body || req.body) as CreateExternalMediaInputValidated;
    const asset = await mediaService.createExternal(input, req.user?.id);

    res.status(201).json({
      status: "success",
      data: asset
    });
  },

  async delete(req: Request, res: Response): Promise<void> {
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const result = await mediaService.deleteMedia(id);

    res.status(200).json({
      status: "success",
      message: "Media asset deleted successfully",
      data: result
    });
  }
};
