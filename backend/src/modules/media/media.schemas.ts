import { z } from "zod";

export const mediaCategoryEnum = z.enum([
  "homepage",
  "destinations",
  "trips",
  "completed_trips",
  "reviews",
  "users",
  "documents",
  "general"
]);

export const createExternalMediaSchema = z
  .object({
    url: z.string().url("Must be a valid URL").optional(),
    externalUrl: z.string().url("Must be a valid URL").optional(),
    label: z.string().trim().max(100).optional(),
    altText: z.string().trim().max(255).optional(),
    destinationId: z.string().optional(),
    category: mediaCategoryEnum.default("general")
  })
  .refine((data) => Boolean(data.url || data.externalUrl), {
    message: "Either url or externalUrl is required",
    path: ["url"]
  })
  .transform((data) => ({
    ...data,
    url: (data.url || data.externalUrl)!
  }));

export const mediaQuerySchema = z.object({
  category: z.string().optional(),
  destinationId: z.string().optional(),
  destination: z.string().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50)
});

export const mediaIdParamSchema = z.object({
  id: z.string().uuid("Invalid media ID format")
});

export type CreateExternalMediaInputValidated = z.infer<typeof createExternalMediaSchema>;
export type MediaQueryValidated = z.infer<typeof mediaQuerySchema>;
