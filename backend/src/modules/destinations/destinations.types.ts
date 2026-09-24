export type DestinationCategory =
  | "high-altitude"
  | "spiritual"
  | "weekend"
  | "nature"
  | "adventure"
  | "city"
  | "other";

export type DbDestinationCategory =
  | "high_altitude"
  | "spiritual"
  | "weekend"
  | "nature"
  | "adventure"
  | "city"
  | "other";

export type DestinationStatus = "active" | "archived" | "draft" | "published";

export interface DestinationRecord {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: DbDestinationCategory;
  season_label: string | null;
  best_time_label: string | null;
  elevation_label: string | null;
  status: DestinationStatus;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  og_media_id: string | null;
  cover_media_id: string | null;
  cover_image_url: string | null;
  gallery_image_urls: string[] | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  archived_at: string | Date | null;
}

export interface DestinationHighlightRecord {
  id: string;
  destination_id: string;
  text: string;
  sort_order: number;
}

export interface DestinationActivityRecord {
  id: string;
  destination_id: string;
  name: string;
  sort_order: number;
}

export interface DestinationDto {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: DestinationCategory;
  season: string;
  bestTime: string;
  elevation?: string;
  status: DestinationStatus;
  sortOrder: number;
  image: string;
  gallery: string[];
  highlights: string[];
  activities: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface CreateDestinationInput {
  name: string;
  slug?: string;
  tagline?: string;
  description?: string;
  category?: DestinationCategory;
  season?: string;
  bestTime?: string;
  elevation?: string;
  image: string;
  gallery?: string[];
  highlights?: string[];
  activities?: string[];
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdateDestinationInput {
  name?: string;
  slug?: string;
  tagline?: string;
  description?: string;
  category?: DestinationCategory;
  season?: string;
  bestTime?: string;
  elevation?: string;
  image?: string;
  gallery?: string[];
  highlights?: string[];
  activities?: string[];
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
}

export interface DestinationFilters {
  status?: DestinationStatus | "all";
  category?: string;
  search?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}
