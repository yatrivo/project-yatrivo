export interface SiteAsset {
  id: string;
  asset_key: string;
  label: string;
  group_name: string;
  image_url: string | null;
  storage_bucket: string | null;
  storage_key: string | null;
  alt_text: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteAssetDto {
  id: string;
  assetKey: string;
  label: string;
  groupName: string;
  imageUrl: string | null;
  storageKey: string | null;
  storageBucket: string | null;
  altText: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
