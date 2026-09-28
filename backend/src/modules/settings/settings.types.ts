export interface CancellationRule {
  days: string;
  refund: string;
  note: string;
}

export interface CancellationPolicyData {
  title: string;
  description: string;
  rules: CancellationRule[];
}

export interface GeneralSettings {
  tagline: string;
  siteDescription: string;
}

export interface ContactSettings {
  phone: string;
  whatsapp: string;
  contactEmail: string;
  address: string;
  inquiryWhatsapp: string;
}

export interface SocialSettings {
  instagram: string;
  youtube: string;
  facebook: string;
  twitter: string;
}

export interface AllSettings {
  general: GeneralSettings;
  contact: ContactSettings;
  social: SocialSettings;
  cancellation_policy: CancellationPolicyData;
}

export type SettingKey = "general" | "contact" | "social" | "cancellation_policy";

