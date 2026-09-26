import { z } from "zod";

const categoryEnum = z.enum([
  "trekking",
  "adventure",
  "weekend",
  "spiritual",
  "nature",
  "custom",
  "other"
]);

const difficultyEnum = z.enum([
  "easy",
  "moderate",
  "challenging",
  "strenuous"
]);

const booleanPreprocess = z.preprocess((val) => {
  if (typeof val === "string") {
    return ["true", "1", "yes"].includes(val.toLowerCase());
  }
  return Boolean(val);
}, z.boolean());

export const tripHighlightItemSchema = z.object({
  icon: z.string().trim().default("📍"),
  label: z.string().trim().min(1, "Highlight label is required"),
  value: z.string().trim().min(1, "Highlight value is required")
});

export const tripFaqItemSchema = z.object({
  question: z.string().trim().min(1, "FAQ question is required"),
  answer: z.string().trim().min(1, "FAQ answer is required")
});

export const createTripSchema = z.object({
  name: z.string().trim().min(1, "Trip name is required"),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  shortDescription: z.string().trim().optional(),
  overview: z.string().trim().optional(),
  duration: z.string().trim().min(1, "Duration is required"),
  durationDays: z.coerce.number().int().positive().optional(),
  durationNights: z.coerce.number().int().nonnegative().optional(),
  category: categoryEnum.default("trekking"),
  difficulty: difficultyEnum.default("moderate"),
  price: z.coerce.number().nonnegative("Price must be 0 or greater"),
  currency: z.string().trim().length(3).default("INR"),
  cancellationPolicy: z.string().trim().optional(),
  badge: z.string().trim().optional(),
  startingPoint: z.string().trim().optional(),
  image: z.string().trim().optional(),
  coverMediaId: z.string().uuid("Invalid cover media ID").optional(),
  gallery: z.array(z.string().trim()).default([]),
  galleryMediaIds: z.array(z.string().uuid("Invalid gallery media ID")).optional(),
  destinationIds: z.array(z.string().trim()).min(1, "At least one destination must be selected"),
  primaryDestinationId: z.string().trim().optional(),
  highlights: z.union([
    z.array(tripHighlightItemSchema),
    z.array(z.string().trim())
  ]).optional(),
  faqs: z.array(tripFaqItemSchema).optional(),
  itinerary: z
    .array(
      z.object({
        dayNumber: z.number().int().positive().optional(),
        title: z.string().trim().min(1, "Day title is required"),
        description: z.string().trim().min(1, "Day description is required"),
        meals: z.string().trim().optional(),
        stay: z.string().trim().optional()
      })
    )
    .default([]),
  inclusions: z.array(z.string().trim()).default([]),
  exclusions: z.array(z.string().trim()).default([]),
  sortOrder: z.coerce.number().int().default(0),
  isFeatured: booleanPreprocess.default(false),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional()
});

export const updateTripSchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  shortDescription: z.string().trim().optional(),
  overview: z.string().trim().optional(),
  duration: z.string().trim().min(1).optional(),
  durationDays: z.coerce.number().int().positive().optional(),
  durationNights: z.coerce.number().int().nonnegative().optional(),
  category: categoryEnum.optional(),
  difficulty: difficultyEnum.optional(),
  price: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().length(3).optional(),
  cancellationPolicy: z.string().trim().optional(),
  badge: z.string().trim().optional(),
  startingPoint: z.string().trim().optional(),
  image: z.string().trim().optional(),
  coverMediaId: z.string().uuid("Invalid cover media ID").optional().nullable(),
  gallery: z.array(z.string().trim()).optional(),
  galleryMediaIds: z.array(z.string().uuid()).optional(),
  destinationIds: z.array(z.string().trim()).min(1).optional(),
  primaryDestinationId: z.string().trim().optional(),
  highlights: z.union([
    z.array(tripHighlightItemSchema),
    z.array(z.string().trim())
  ]).optional(),
  faqs: z.array(tripFaqItemSchema).optional(),
  itinerary: z
    .array(
      z.object({
        dayNumber: z.number().int().positive().optional(),
        title: z.string().trim().min(1),
        description: z.string().trim().min(1),
        meals: z.string().trim().optional(),
        stay: z.string().trim().optional()
      })
    )
    .optional(),
  inclusions: z.array(z.string().trim()).optional(),
  exclusions: z.array(z.string().trim()).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isFeatured: booleanPreprocess.optional(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional()
});

export const tripParamSchema = z.object({
  id: z.string().trim().min(1, "Trip ID or slug is required")
});

export const departureParamSchema = z.object({
  id: z.string().trim().min(1, "Trip ID or slug is required"),
  instanceId: z.string().uuid("Invalid departure ID").optional()
});

export const tripQuerySchema = z.object({
  status: z.enum(["active", "archived", "draft", "published", "all"]).optional(),
  includeArchived: booleanPreprocess.default(false),
  category: z.string().trim().optional(),
  destinationId: z.string().trim().optional(),
  destinationSlug: z.string().trim().optional(),
  difficulty: z.string().trim().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50)
});

export const createDepartureSchema = z.object({
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  displayDate: z.string().trim().optional(),
  price: z.coerce.number().nonnegative().optional(),
  spotsTotal: z.coerce.number().int().positive("Total spots must be at least 1"),
  notes: z.string().trim().optional()
});

export const updateDepartureSchema = z.object({
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  displayDate: z.string().trim().optional(),
  price: z.coerce.number().nonnegative().optional(),
  spotsTotal: z.coerce.number().int().positive().optional(),
  status: z.enum(["upcoming", "completed", "cancelled"]).optional(),
  notes: z.string().trim().optional(),
  completedPhotos: z.array(z.string().trim()).optional()
});
