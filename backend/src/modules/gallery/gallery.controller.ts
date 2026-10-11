import type { Request, Response } from "express";
import { galleryService } from "./gallery.service";
import type {
  AddToGalleryValidated,
  PublicGalleryQueryValidated,
  ReorderGalleryValidated,
  UpdateGalleryItemValidated
} from "./gallery.schemas";
import { recordAuditLog } from "../audit/audit.service";

export const galleryController = {
  async listPublic(req: Request, res: Response): Promise<void> {
    const query = (res.locals.validated?.query || req.query) as Partial<PublicGalleryQueryValidated>;
    const limit = query?.limit ? Number(query.limit) : 30;
    const cursor = typeof query?.cursor === "string" ? query.cursor : undefined;

    const result = await galleryService.getPublicGallery({ limit, cursor });
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.status(200).json({
      status: "success",
      data: result.items,
      total: result.pagination.total,
      pagination: result.pagination
    });
  },

  async listAdmin(_req: Request, res: Response): Promise<void> {
    const items = await galleryService.getAdminGallery();
    res.status(200).json({
      status: "success",
      data: items,
      total: items.length
    });
  },

  async addItem(req: Request, res: Response): Promise<void> {
    const input = (res.locals.validated?.body || req.body) as AddToGalleryValidated;
    const item = await galleryService.addToGallery(input);

    res.status(201).json({
      status: "success",
      message: "Media asset added to public gallery",
      data: item
    });

    await recordAuditLog({
      req,
      action: "Added to Public Gallery",
      entityType: "media",
      entityId: input.mediaId,
      details: `Added media asset #${input.mediaId.slice(0, 8)} to public gallery`
    });
  },

  async updateItem(req: Request, res: Response): Promise<void> {
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const input = (res.locals.validated?.body || req.body) as UpdateGalleryItemValidated;
    const item = await galleryService.updateGalleryItem(id, input);

    res.status(200).json({
      status: "success",
      message: "Gallery item updated",
      data: item
    });

    await recordAuditLog({
      req,
      action: "Updated Gallery Item",
      entityType: "media",
      entityId: item.mediaId,
      details: `Updated gallery settings for media #${item.mediaId.slice(0, 8)}`
    });
  },

  async removeItem(req: Request, res: Response): Promise<void> {
    const id = String(res.locals.validated?.params?.id || req.params.id);
    const result = await galleryService.removeFromGallery(id);

    res.status(200).json({
      status: "success",
      message: "Removed from public gallery",
      data: result
    });

    await recordAuditLog({
      req,
      action: "Removed from Public Gallery",
      entityType: "media",
      entityId: id,
      details: `Removed asset from public gallery membership #${id.slice(0, 8)}`
    });
  },

  async reorder(req: Request, res: Response): Promise<void> {
    const { items } = (res.locals.validated?.body || req.body) as ReorderGalleryValidated;
    await galleryService.reorderGallery(items);

    res.status(200).json({
      status: "success",
      message: "Gallery reordered successfully"
    });

    await recordAuditLog({
      req,
      action: "Reordered Gallery Items",
      entityType: "media",
      entityId: "gallery",
      details: `Reordered ${items.length} public gallery items`
    });
  }
};
