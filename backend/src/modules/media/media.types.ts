export interface MediaDestinationLink {
  id: string;
  name: string;
  slug: string;
}

export interface MediaVariantMetadata {
  key?: string;
  url: string;
  width: number;
  height: number;
  fileSizeBytes?: number;
  mimeType?: string;
}

export interface MediaVariantsRecord {
  thumbnail?: MediaVariantMetadata;
  medium?: MediaVariantMetadata;
  viewer?: MediaVariantMetadata;
}

export interface PublicMediaVariantsDto {
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
  medium?: {
    url: string;
    width: number;
    height: number;
  };
  viewer?: {
    url: string;
    width: number;
    height: number;
  };
}

export interface MediaAssetRecord {
  id: string;
  folder_id: string | null;
  destination_id: string | null;
  category: string;
  label: string | null;
  alt_text: string | null;
  storage_bucket: string | null;
  storage_key: string | null;
  external_url: string | null;
  public_url: string | null;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  viewer_url?: string | null;
  placeholder_base64?: string | null;
  variants?: MediaVariantsRecord | string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  width: number | null;
  height: number | null;
  checksum_sha256: string | null;
  uploaded_by_user_id: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  destination_name?: string | null;
  destination_slug?: string | null;
  destinations_json?: unknown;
  destination_names?: string | null;
  in_gallery?: boolean;
  gallery_item_id?: string | null;
  gallery_sort_order?: number | null;
  gallery_custom_title?: string | null;
  gallery_caption?: string | null;
}

export interface MediaAssetDto {
  id: string;
  destinationId: string | null;
  destinationName: string | null;
  destinationSlug: string | null;
  destinations?: MediaDestinationLink[];
  destinationNames?: string[];
  category: string;
  categories?: string[];
  inGallery?: boolean;
  galleryItemId?: string | null;
  gallerySortOrder?: number | null;
  galleryCustomTitle?: string | null;
  galleryCaption?: string | null;
  label: string | null;
  altText: string | null;
  storageBucket: string | null;
  storageKey: string | null;
  externalUrl: string | null;
  url: string;
  thumbnailUrl: string;
  mediumUrl: string;
  viewerUrl: string;
  placeholder: string | null;
  variants?: PublicMediaVariantsDto | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  width: number | null;
  height: number | null;
  uploadedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFilters {
  category?: string;
  destinationId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateStorageMediaInput {
  category: string;
  destinationId?: string | null;
  label?: string | null;
  altText?: string | null;
  storageBucket: string;
  storageKey: string;
  publicUrl: string;
  thumbnailUrl?: string | null;
  mediumUrl?: string | null;
  viewerUrl?: string | null;
  placeholderBase64?: string | null;
  variants?: MediaVariantsRecord | null;
  mimeType: string;
  fileSizeBytes: number;
  width?: number | null;
  height?: number | null;
  showInGallery?: boolean;
}

export interface CreateExternalMediaInput {
  url: string;
  destinationId?: string | null;
  label?: string | null;
  altText?: string | null;
  category?: string;
  showInGallery?: boolean;
}

export interface MediaReferenceInfo {
  totalReferences: number;
  references: {
    entityType: "destination" | "trip" | "trip_instance" | "review" | "homepage_slide" | "gallery";
    entityId: string;
    entityName?: string;
    relationship: "cover" | "gallery" | "slide" | "review";
  }[];
}
