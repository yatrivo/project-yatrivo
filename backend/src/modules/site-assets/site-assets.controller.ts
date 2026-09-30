import type { Request, Response } from "express";
import multer from "multer";
import { siteAssetsService } from "./site-assets.service";
import { recordAuditLog } from "../audit/audit.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const siteAssetsUploadMiddleware = upload.single("file");

export const siteAssetsController = {
  // GET /api/v1/admin/site-assets
  async listAll(_req: Request, res: Response): Promise<void> {
    const assets = await siteAssetsService.listAll();
    res.status(200).json({ status: "success", data: assets });
  },

  // GET /api/v1/admin/site-assets/:assetKey
  async getOne(req: Request, res: Response): Promise<void> {
    const assetKey = String(req.params.assetKey);
    const asset = await siteAssetsService.getByKey(assetKey);
    res.status(200).json({ status: "success", data: asset });
  },

  // GET /api/v1/site-assets  (public — frontend reads current images without auth)
  async listAllPublic(_req: Request, res: Response): Promise<void> {
    const assets = await siteAssetsService.listAll();
    res.status(200).json({ status: "success", data: assets });
  },

  // GET /api/v1/site-assets/:assetKey  (public — single key lookup for SSR-like patterns)
  async getOnePublic(req: Request, res: Response): Promise<void> {
    const assetKey = String(req.params.assetKey);
    const asset = await siteAssetsService.getByKey(assetKey);
    res.status(200).json({ status: "success", data: asset });
  },

  // PUT /api/v1/admin/site-assets/:assetKey/upload  (multipart file upload)
  async uploadImage(req: Request, res: Response): Promise<void> {
    const assetKey = String(req.params.assetKey);
    const file = req.file;

    if (!file) {
      res.status(400).json({ status: "error", message: "No file uploaded" });
      return;
    }

    const asset = await siteAssetsService.updateWithUpload(assetKey, file);
    res.status(200).json({ status: "success", data: asset });

    await recordAuditLog({
      req,
      action: "Updated Site Asset",
      entityType: "site_asset",
      entityId: assetKey,
      details: `Uploaded new image for site asset "${assetKey}"`,
      afterData: { imageUrl: asset.imageUrl },
    });
  },

  // PUT /api/v1/admin/site-assets/:assetKey  (update with external URL or media library URL)
  async updateUrl(req: Request, res: Response): Promise<void> {
    const assetKey = String(req.params.assetKey);
    const { imageUrl, altText } = req.body as { imageUrl?: string; altText?: string };

    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
      const cleared = await siteAssetsService.clearAsset(assetKey);
      res.status(200).json({ status: "success", data: cleared });
      await recordAuditLog({
        req,
        action: "Cleared Site Asset",
        entityType: "site_asset",
        entityId: assetKey,
        details: `Cleared image for site asset "${assetKey}"`,
      });
      return;
    }

    const asset = await siteAssetsService.updateWithUrl(assetKey, imageUrl.trim(), altText);
    res.status(200).json({ status: "success", data: asset });

    await recordAuditLog({
      req,
      action: "Updated Site Asset",
      entityType: "site_asset",
      entityId: assetKey,
      details: `Set image URL for site asset "${assetKey}"`,
      afterData: { imageUrl },
    });
  },

  // DELETE /api/v1/admin/site-assets/:assetKey  (wipe out image for a single asset slot)
  async clearAsset(req: Request, res: Response): Promise<void> {
    const assetKey = String(req.params.assetKey);
    const asset = await siteAssetsService.clearAsset(assetKey);
    res.status(200).json({ status: "success", data: asset });

    await recordAuditLog({
      req,
      action: "Cleared Site Asset",
      entityType: "site_asset",
      entityId: assetKey,
      details: `Removed image from site asset "${assetKey}"`,
    });
  },

  // POST /api/v1/admin/site-assets/wipe-external  (wipe all external image links)
  async wipeAllExternal(req: Request, res: Response): Promise<void> {
    const result = await siteAssetsService.wipeAllExternal();
    res.status(200).json({
      status: "success",
      message: `Wiped ${result.count} external image placeholders.`,
      data: result,
    });

    await recordAuditLog({
      req,
      action: "Wiped All External Site Assets",
      entityType: "site_asset",
      details: `Wiped ${result.count} external image links from site assets`,
    });
  },
};
