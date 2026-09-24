import { z } from "zod";

const categoryEnum = z.enum([
  "high-altitude",
  "spiritual",
  "weekend",
  "nature",
  "adventure",
  "city",
  "other"
]);

const booleanPreprocess = z.preprocess((val) => {
  if (typeof val === "string") {
    return ["true", "1", "yes"].includes(val.toLowerCase());
  }
  return Boolean(val);
}, z.boolean());

export const createDestinationSchema = z
  .object({
    name: z.string().trim().min(1, "Destination name is required"),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
      .optional(),
    tagline: z.string().trim().optional(),
    description: z.string().trim().optional(),
    category: categoryEnum.default("weekend"),
    season: z.string().trim().optional(),
    bestTime: z.string().trim().optional(),
    elevation: z.string().trim().optional(),
    image: z.string().trim().optional(),
    coverMediaId: z.string().uuid("Invalid cover media ID").optional(),
    gallery: z.array(z.string().trim()).default([]),
    galleryMediaIds: z.array(z.string().uuid("Invalid gallery media ID")).optional(),
    highlights: z.array(z.string().trim()).default([]),
    activities: z.array(z.string().trim()).default([]),
    sortOrder: z.coerce.number().int().default(0),
    seoTitle: z.string().trim().optional(),
    seoDescription: z.string().trim().optional()
  })
  .refine(
    (data) => Boolean(data.image || data.coverMediaId),
    {
      message: "Either image URL or coverMediaId is required",
      path: ["image"]
    }
  );

export const updateDestinationSchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  tagline: z.string().trim().optional(),
  description: z.string().trim().optional(),
  category: categoryEnum.optional(),
  season: z.string().trim().optional(),
  bestTime: z.string().trim().optional(),
  elevation: z.string().trim().optional(),
  image: z.string().trim().optional(),
  coverMediaId: z.string().uuid("Invalid cover media ID").optional().nullable(),
  gallery: z.array(z.string().trim()).optional(),
  galleryMediaIds: z.array(z.string().uuid("Invalid gallery media ID")).optional(),
  highlights: z.array(z.string().trim()).optional(),
  activities: z.array(z.string().trim()).optional(),
  sortOrder: z.coerce.number().int().optional(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional()
});

export const destinationQuerySchema = z.object({
  status: z.enum(["active", "archived", "all", "draft", "published"]).optional(),
  category: z.string().optional(),
  search: z.string().trim().optional(),
  includeArchived: booleanPreprocess.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export const destinationParamSchema = z.object({
  id: z.string().trim().min(1, "Destination identifier is required")
});

export type CreateDestinationInputValidated = z.infer<typeof createDestinationSchema>;
export type UpdateDestinationInputValidated = z.infer<typeof updateDestinationSchema>;
export type DestinationQueryValidated = z.infer<typeof destinationQuerySchema>;
