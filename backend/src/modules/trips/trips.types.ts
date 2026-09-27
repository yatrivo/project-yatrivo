export type TripCategory =
  | "trekking"
  | "adventure"
  | "weekend"
  | "spiritual"
  | "nature"
  | "custom"
  | "other";

export type TripDifficulty = "easy" | "moderate" | "challenging" | "strenuous";

export type TripStatus = "active" | "archived" | "draft" | "published";

export interface TripHighlightItem {
  icon: string;
  label: string;
  value: string;
}

export interface TripFaqItem {
  question: string;
  answer: string;
}

export interface TripRecord {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  overview: string | null;
  duration_label: string;
  duration_days: number | null;
  duration_nights: number | null;
  category: TripCategory;
  difficulty: TripDifficulty | null;
  price_from_paise: number;
  currency: string;
  price_notes: string | null;
  cancellation_policy: string | null;
  badge: string | null;
  starting_point: string | null;
  suitable_for: string | null;
  accommodation_summary: string | null;
  transport_summary: string | null;
  important_notes: string | null;
  status: TripStatus;
  is_featured: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  og_media_id: string | null;
  cover_media_id: string | null;
  cover_image_url: string | null;
  gallery_image_urls: string[] | null;
  highlights: TripHighlightItem[] | null;
  faqs: TripFaqItem[] | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  archived_at: string | Date | null;
}

export interface TripDestinationDto {
  id: string;
  name: string;
  slug: string;
  image?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface TripDepartureDto {
  id: string;
  tripId: string;
  date: string; // ISO date "YYYY-MM-DD"
  displayDate: string;
  price: number; // in Rupees
  spotsTotal: number;
  spotsLeft: number;
  status: "upcoming" | "completed" | "cancelled";
  notes?: string | null;
  completedPhotos?: string[];
}

export interface TripGalleryMediaItem {
  id: string;
  mediaId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export interface TripItineraryDayDto {
  dayNumber: number;
  title: string;
  description: string;
  meals?: string | null;
  stay?: string | null;
}

export interface TripDto {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  overview: string;
  duration: string;
  durationDays?: number;
  durationNights?: number;
  category: TripCategory;
  difficulty: string;
  price: number;
  currency: string;
  priceNotes?: string;
  cancellationPolicy: string;
  badge: string;
  startingPoint: string;
  status: TripStatus;
  isFeatured: boolean;
  sortOrder: number;
  image: string; // single cover image
  coverMediaId?: string | null;
  gallery: string[]; // separate gallery images
  galleryMedia?: TripGalleryMediaItem[];
  destinations: TripDestinationDto[];
  destination: string; // backward compat primary destination name or slug
  destinationId?: string; // backward compat primary destination id
  departures?: TripDepartureDto[];
  upcomingDeparturesCount?: number;
  highlights: TripHighlightItem[];
  faqs: TripFaqItem[];
  itinerary: TripItineraryDayDto[];
  inclusions: string[];
  exclusions: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface TripFilters {
  status?: TripStatus | "all";
  includeArchived?: boolean;
  category?: string;
  destinationId?: string;
  destinationSlug?: string;
  difficulty?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTripInput {
  name: string;
  slug?: string;
  shortDescription?: string;
  overview?: string;
  duration: string;
  durationDays?: number;
  durationNights?: number;
  category?: TripCategory;
  difficulty?: TripDifficulty;
  price: number; // in Rupees
  currency?: string;
  cancellationPolicy?: string;
  badge?: string;
  startingPoint?: string;
  sortOrder?: number;
  isFeatured?: boolean;
  image?: string; // single cover image URL
  coverMediaId?: string | null;
  gallery?: string[]; // separate gallery image URLs
  galleryMediaIds?: string[];
  destinationIds: string[]; // M:N destinations
  primaryDestinationId?: string;
  highlights?: (TripHighlightItem | string)[];
  faqs?: TripFaqItem[];
  itinerary?: { dayNumber?: number; title: string; description: string; meals?: string; stay?: string }[];
  inclusions?: string[];
  exclusions?: string[];
  seoTitle?: string;
  seoDescription?: string;
  status?: TripStatus;
}

export type UpdateTripInput = Partial<CreateTripInput>;

export interface CreateDepartureInput {
  date: string; // YYYY-MM-DD
  displayDate?: string;
  price?: number; // in Rupees, defaults to trip price
  spotsTotal: number;
  notes?: string;
}

export interface UpdateDepartureInput {
  date?: string;
  displayDate?: string;
  price?: number;
  spotsTotal?: number;
  status?: "upcoming" | "completed" | "cancelled";
  notes?: string;
  completedPhotos?: string[];
}
