import { query } from "../../db/postgres";
import type { SiteAsset, SiteAssetDto } from "./site-assets.types";

function toDto(row: SiteAsset): SiteAssetDto {
  return {
    id: row.id,
    assetKey: row.asset_key,
    label: row.label,
    groupName: row.group_name,
    imageUrl: row.image_url,
    storageKey: row.storage_key,
    storageBucket: row.storage_bucket,
    altText: row.alt_text,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const KNOWN_SLOTS: Array<{
  assetKey: string;
  label: string;
  groupName: string;
  description: string;
  altText: string;
}> = [
  { assetKey: "ABOUT_HERO", label: "About Us Hero Image", groupName: "about", altText: "Hikers on Himalayan trail", description: "Full-width hero image at the top of the About Us page" },
  { assetKey: "ABOUT_DEEP_ROOTS", label: "About Us — Deep Roots Image", groupName: "about", altText: "Local Uttarakhand community", description: "Image in the Deep Roots section on the About page" },
  { assetKey: "ABOUT_CTA_BG", label: "About Us CTA Background", groupName: "about", altText: "Forest light through trees", description: "Background image for the CTA banner at the bottom of the About page" },
  { assetKey: "HOME_WHY_US_IMAGE", label: "Homepage — Why Us Image", groupName: "homepage", altText: "Travelers around campfire", description: "Side image in the \"Why Travelers Love Us\" section on the homepage" },
  { assetKey: "HOME_CTA_BG", label: "Homepage CTA Background", groupName: "homepage", altText: "Forest mountain path", description: "Background image for the \"Ready to Travel Better?\" CTA banner on the homepage" },
  { assetKey: "TRAVEL_WITH_US_HERO", label: "Travel With Us Hero", groupName: "pages", altText: "Himalayan landscape", description: "Full-width hero image on the Travel With Us page" },
  { assetKey: "TRAVEL_WITH_US_CTA_BG", label: "Travel With Us CTA Background", groupName: "pages", altText: "Forest mountain path", description: "Background image for the CTA section on the Travel With Us page" },
  { assetKey: "PAST_TRIPS_HERO", label: "Past Trips Page Hero", groupName: "pages", altText: "Himalayan mountain valley", description: "Hero image on the Past Adventures / Past Trips page" },
  { assetKey: "REVIEWS_HERO", label: "Reviews Page Hero", groupName: "pages", altText: "Mountain travellers community", description: "Hero image on the Reviews page" },
  { assetKey: "FAQ_HERO", label: "FAQ / Contact Page Hero", groupName: "pages", altText: "Himalayan peaks", description: "Hero image on the FAQ & Contact page" },
  { assetKey: "ACTIVITY_ALPINE_TREKKING", label: "Activity — Alpine Trekking", groupName: "activities", altText: "Alpine trekking in Himalayas", description: "Card image for Alpine Trekking category on Travel With Us" },
  { assetKey: "ACTIVITY_MOUNTAIN_CAMPING", label: "Activity — Mountain Camping", groupName: "activities", altText: "Mountain camping at night", description: "Card image for Mountain Camping category on Travel With Us" },
  { assetKey: "ACTIVITY_RIVER_RAFTING", label: "Activity — River Rafting", groupName: "activities", altText: "River rafting in Rishikesh", description: "Card image for River Rafting category on Travel With Us" },
  { assetKey: "ACTIVITY_HIMALAYAN_TEMPLES", label: "Activity — Himalayan Temples", groupName: "activities", altText: "Himalayan temple architecture", description: "Card image for Himalayan Temples category on Travel With Us" },
  { assetKey: "ACTIVITY_SNOW_ADVENTURES", label: "Activity — Snow Adventures", groupName: "activities", altText: "Snow adventure in mountains", description: "Card image for Snow Adventures category on Travel With Us" },
  { assetKey: "ACTIVITY_SUNRISE_MEDITATION", label: "Activity — Sunrise Meditation", groupName: "activities", altText: "Sunrise meditation in mountains", description: "Card image for Sunrise Meditation category on Travel With Us" },
];

export const siteAssetsRepository = {
  async ensureTableAndSeed(): Promise<void> {
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS site_assets (
          id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          asset_key     TEXT NOT NULL UNIQUE,
          label         TEXT NOT NULL,
          group_name    TEXT NOT NULL,
          image_url     TEXT,
          storage_bucket TEXT,
          storage_key   TEXT,
          alt_text      TEXT,
          description   TEXT,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_site_assets_group ON site_assets (group_name);
      `);

      for (const slot of KNOWN_SLOTS) {
        await query(
          `INSERT INTO site_assets (asset_key, label, group_name, alt_text, description)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (asset_key) DO UPDATE SET
             label = EXCLUDED.label,
             group_name = EXCLUDED.group_name,
             description = EXCLUDED.description`,
          [slot.assetKey, slot.label, slot.groupName, slot.altText, slot.description]
        );
      }
    } catch (err) {
      console.warn("Could not auto-ensure site_assets table:", err);
    }
  },

  async listAll(): Promise<SiteAssetDto[]> {
    try {
      const result = await query<SiteAsset>(
        `SELECT * FROM site_assets ORDER BY group_name ASC, label ASC`
      );
      if (result.rows.length === 0) {
        await this.ensureTableAndSeed();
        const retry = await query<SiteAsset>(
          `SELECT * FROM site_assets ORDER BY group_name ASC, label ASC`
        );
        return retry.rows.map(toDto);
      }
      return result.rows.map(toDto);
    } catch (err) {
      await this.ensureTableAndSeed();
      const retry = await query<SiteAsset>(
        `SELECT * FROM site_assets ORDER BY group_name ASC, label ASC`
      );
      return retry.rows.map(toDto);
    }
  },

  async findByKey(assetKey: string): Promise<SiteAssetDto | null> {
    const result = await query<SiteAsset>(
      `SELECT * FROM site_assets WHERE asset_key = $1`,
      [assetKey]
    );
    return result.rows[0] ? toDto(result.rows[0]) : null;
  },

  async findByKeys(assetKeys: string[]): Promise<Record<string, SiteAssetDto>> {
    if (assetKeys.length === 0) return {};
    const placeholders = assetKeys.map((_, i) => `$${i + 1}`).join(", ");
    const result = await query<SiteAsset>(
      `SELECT * FROM site_assets WHERE asset_key IN (${placeholders})`,
      assetKeys
    );
    const map: Record<string, SiteAssetDto> = {};
    for (const row of result.rows) {
      map[row.asset_key] = toDto(row);
    }
    return map;
  },

  async upsert(
    assetKey: string,
    data: {
      imageUrl: string | null;
      storageBucket?: string | null;
      storageKey?: string | null;
      altText?: string | null;
      label?: string;
      groupName?: string;
      description?: string;
    }
  ): Promise<SiteAssetDto | null> {
    const slot = KNOWN_SLOTS.find((s) => s.assetKey === assetKey);
    const label = data.label || slot?.label || assetKey;
    const groupName = data.groupName || slot?.groupName || "pages";
    const description = data.description || slot?.description || null;
    const altText = data.altText ?? slot?.altText ?? null;

    const result = await query<SiteAsset>(
      `INSERT INTO site_assets (asset_key, label, group_name, image_url, storage_bucket, storage_key, alt_text, description, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (asset_key) DO UPDATE SET
         image_url = EXCLUDED.image_url,
         storage_bucket = EXCLUDED.storage_bucket,
         storage_key = EXCLUDED.storage_key,
         alt_text = COALESCE(EXCLUDED.alt_text, site_assets.alt_text),
         updated_at = NOW()
       RETURNING *`,
      [
        assetKey,
        label,
        groupName,
        data.imageUrl,
        data.storageBucket ?? null,
        data.storageKey ?? null,
        altText,
        description,
      ]
    );
    return result.rows[0] ? toDto(result.rows[0]) : null;
  },

  async clear(assetKey: string): Promise<SiteAssetDto | null> {
    const result = await query<SiteAsset>(
      `UPDATE site_assets
       SET image_url = NULL,
           storage_bucket = NULL,
           storage_key = NULL,
           updated_at = NOW()
       WHERE asset_key = $1
       RETURNING *`,
      [assetKey]
    );
    return result.rows[0] ? toDto(result.rows[0]) : null;
  },

  async wipeAllExternal(): Promise<number> {
    const result = await query(
      `UPDATE site_assets
       SET image_url = NULL,
           storage_bucket = NULL,
           storage_key = NULL,
           updated_at = NOW()
       WHERE storage_key IS NULL AND image_url IS NOT NULL`
    );
    return result.rowCount ?? 0;
  },
};
