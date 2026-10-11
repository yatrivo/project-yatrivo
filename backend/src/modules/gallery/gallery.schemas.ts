import { z } from "zod";

export const publicGalleryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().trim().max(512).optional()
});

export const addToGallerySchema = z.object({
  mediaId: z.string().uuid("Invalid media ID format"),
  sortOrder: z.coerce.number().int().min(1).optional(),
  customTitle: z.string().trim().max(150).nullable().optional(),
  caption: z.string().trim().max(500).nullable().optional()
});

export const updateGalleryItemSchema = z.object({
  sortOrder: z.coerce.number().int().min(1).optional(),
  customTitle: z.string().trim().max(150).nullable().optional(),
  caption: z.string().trim().max(500).nullable().optional()
});

export const reorderGallerySchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid("Invalid gallery item ID"),
      sortOrder: z.coerce.number().int().min(1)
    })
  ).min(1, "At least one item required for reordering")
});

export const galleryIdParamSchema = z.object({
  id: z.string().uuid("Invalid ID format")
});

export type PublicGalleryQueryValidated = z.infer<typeof publicGalleryQuerySchema>;
export type AddToGalleryValidated = z.infer<typeof addToGallerySchema>;
export type UpdateGalleryItemValidated = z.infer<typeof updateGalleryItemSchema>;
export type ReorderGalleryValidated = z.infer<typeof reorderGallerySchema>;
