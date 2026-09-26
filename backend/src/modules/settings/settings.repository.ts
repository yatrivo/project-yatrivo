import { query } from "../../db/postgres";
import type { CancellationPolicyData } from "./settings.types";

const DEFAULT_CANCELLATION_POLICY: CancellationPolicyData = {
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
  async getCancellationPolicy(): Promise<CancellationPolicyData> {
    const res = await query<{ value: CancellationPolicyData }>(
      `SELECT value FROM site_settings WHERE key = 'cancellation_policy' LIMIT 1`
    );
    if (res.rows.length === 0 || !res.rows[0].value) {
      return DEFAULT_CANCELLATION_POLICY;
    }
    return res.rows[0].value;
  },

  async updateCancellationPolicy(data: CancellationPolicyData): Promise<CancellationPolicyData> {
    await query(
      `INSERT INTO site_settings (key, value)
       VALUES ('cancellation_policy', $1::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify(data)]
    );
    return data;
  }
};
