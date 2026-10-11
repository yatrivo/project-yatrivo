import type { PublicMediaVariantsDto } from "../media/media.types";

export interface PublicGalleryItemDto {
  id: string;
  mediaId: string;
  url: string;
  thumbnailUrl: string;
  mediumUrl: string;
  viewerUrl: string;
  placeholder: string | null;
  variants?: PublicMediaVariantsDto | null;
  title: string | null;
  caption: string | null;
  sortOrder: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  createdAt: string;
}

export interface PublicGalleryPaginationMeta {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface PaginatedPublicGalleryResult {
  items: PublicGalleryItemDto[];
  pagination: PublicGalleryPaginationMeta;
}

export interface PublicGalleryQueryInput {
  limit?: number;
  cursor?: string;
}

export interface AdminGalleryItemDto {
  id: string;
  mediaId: string;
  url: string;
  thumbnailUrl: string;
  mediumUrl: string;
  viewerUrl: string;
  placeholder: string | null;
  customTitle: string | null;
  caption: string | null;
  sortOrder: number;
  label: string | null;
  altText: string | null;
  category: string;
  destinationName: string | null;
  destinationSlug: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddToGalleryInput {
  mediaId: string;
  sortOrder?: number;
  customTitle?: string | null;
  caption?: string | null;
}

export interface UpdateGalleryItemInput {
  sortOrder?: number;
  customTitle?: string | null;
  caption?: string | null;
}

export interface ReorderGalleryItem {
  id: string;
  sortOrder: number;
}
