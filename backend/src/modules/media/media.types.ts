export interface MediaDestinationLink {
  id: string;
  name: string;
  slug: string;
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
  label: string | null;
  altText: string | null;
  storageBucket: string | null;
  storageKey: string | null;
  externalUrl: string | null;
  url: string;
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
  mimeType: string;
  fileSizeBytes: number;
  width?: number | null;
  height?: number | null;
}

export interface CreateExternalMediaInput {
  url: string;
  destinationId?: string | null;
  label?: string | null;
  altText?: string | null;
  category?: string;
}

export interface MediaReferenceInfo {
  totalReferences: number;
  references: {
    entityType: "destination" | "trip" | "trip_instance" | "review" | "homepage_slide";
    entityId: string;
    entityName?: string;
    relationship: "cover" | "gallery" | "slide" | "review";
  }[];
}
