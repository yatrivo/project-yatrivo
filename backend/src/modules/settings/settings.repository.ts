import { query } from "../../db/postgres";
import type {
  CancellationPolicyData,
  GeneralSettings,
  ContactSettings,
  SocialSettings,
  AllSettings,
  SettingKey
} from "./settings.types";

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  tagline: "Explore More. Travel Better.",
  siteDescription:
    "Uttarakhand's premium travel collective for mindful explorers. We design high-fidelity mountain retreats, spiritual pilgrimages, and raw alpine treks."
};

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  phone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
  contactEmail: "hello@yatrivo.com",
  address: "Office: Rajpur Road, Dehradun, Uttarakhand, 248001",
  inquiryWhatsapp: "+91 98765 43210"
};

export const DEFAULT_SOCIAL_SETTINGS: SocialSettings = {
  instagram: "https://instagram.com/yatrivo",
  youtube: "https://youtube.com/@yatrivo",
  facebook: "https://facebook.com/yatrivo",
  twitter: "https://twitter.com/yatrivo"
};

export const DEFAULT_CANCELLATION_POLICY: CancellationPolicyData = {
  title: "Global Cancellation & Refund Policy",
  description:
    "Our mindful Himalayan trips prioritize small-group planning and authentic village stays. Cancellations are processed based on notice given prior to scheduled departure.",
  rules: [
    {
      days: "30+ days before departure",
      refund: "100%",
      note: "Full refund (less nominal processing fee)"
    },
    {
      days: "15–29 days before departure",
      refund: "50%",
      note: "50% refund or 100% trip credit voucher"
    },
    {
      days: "Under 15 days before departure",
      refund: "0%",
      note: "Non-refundable due to reserved cabin & permit logistics"
    }
  ]
};

export const settingsRepository = {
  async getAllSettings(): Promise<AllSettings> {
    const res = await query<{ key: string; value: any }>(
      `SELECT key, value FROM site_settings`
    );
    const map = new Map<string, any>();
    for (const row of res.rows) {
      map.set(row.key, row.value);
    }

    return {
      general: map.get("general") || DEFAULT_GENERAL_SETTINGS,
      contact: map.get("contact") || DEFAULT_CONTACT_SETTINGS,
      social: map.get("social") || DEFAULT_SOCIAL_SETTINGS,
      cancellation_policy: map.get("cancellation_policy") || DEFAULT_CANCELLATION_POLICY
    };
  },

  async getSettingByKey<T = any>(key: SettingKey): Promise<T> {
    const res = await query<{ value: T }>(
      `SELECT value FROM site_settings WHERE key = $1 LIMIT 1`,
      [key]
    );
    if (res.rows.length === 0 || !res.rows[0].value) {
      if (key === "general") return DEFAULT_GENERAL_SETTINGS as unknown as T;
      if (key === "contact") return DEFAULT_CONTACT_SETTINGS as unknown as T;
      if (key === "social") return DEFAULT_SOCIAL_SETTINGS as unknown as T;
      if (key === "cancellation_policy") return DEFAULT_CANCELLATION_POLICY as unknown as T;
      return null as unknown as T;
    }
    return res.rows[0].value;
  },

  async upsertSetting<T = any>(key: SettingKey, value: T, userId?: string): Promise<T> {
    await query(
      `INSERT INTO site_settings (key, value, updated_by_user_id, updated_at)
       VALUES ($1, $2::jsonb, $3, now())
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_by_user_id = EXCLUDED.updated_by_user_id,
         updated_at = now()`,
      [key, JSON.stringify(value), userId || null]
    );
    return value;
  },

  async getCancellationPolicy(): Promise<CancellationPolicyData> {
    return this.getSettingByKey<CancellationPolicyData>("cancellation_policy");
  },

  async updateCancellationPolicy(data: CancellationPolicyData, userId?: string): Promise<CancellationPolicyData> {
    return this.upsertSetting("cancellation_policy", data, userId);
  }
};

