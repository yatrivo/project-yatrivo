export interface ContentSection {
  title: string;
  content: string;
}

export const DEFAULT_TERMS_SECTIONS: ContentSection[] = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing or using the Yatrivo website and booking services, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services. These terms apply to all users including browsers, customers, and travellers who book through Yatrivo."
  },
  {
    title: "2. Booking & Payments",
    content: "All bookings are confirmed upon receipt of the booking amount specified in your trip quote. We accept payments via bank transfer, UPI, and major credit/debit cards. Full payment is due 14 days before departure. Prices quoted include GST as applicable and are subject to change until confirmed in writing."
  },
  {
    title: "3. Cancellation Policy",
    content: "Cancellations made 30+ days before departure: 90% refund. Cancellations 15–29 days before: 60% refund. Cancellations 7–14 days before: 25% refund. Cancellations within 7 days: No refund. All cancellations must be submitted in writing to hello@yatrivo.com. Natural disasters, government restrictions, or health emergencies may trigger alternative rescheduling policies."
  },
  {
    title: "4. Travel Documents & Fitness",
    content: "Travellers are responsible for ensuring they hold valid ID proof (Aadhaar, passport, or other government-issued ID). You must be physically fit for the activities described in your chosen package. Yatrivo reserves the right to exclude a traveller from physically demanding activities if safety is deemed at risk."
  },
  {
    title: "5. Liability Limitation",
    content: "Yatrivo acts as an organizer, not as a carrier or accommodation provider. We cannot be held liable for delays, accidents, acts of God, government restrictions, personal injury, or property loss beyond our control. We strongly recommend comprehensive travel insurance for all trips."
  },
  {
    title: "6. Itinerary Changes",
    content: "We reserve the right to modify or substitute itinerary elements—including hotels, routes, and activities—when circumstances such as weather, safety concerns, or permit availability require it. We aim to provide an equivalent replacement and communicate changes in advance."
  },
  {
    title: "7. Code of Conduct",
    content: "All travellers are expected to respect local customs, fellow group members, guides, and the natural environment. Yatrivo may remove any traveller from a trip without refund if their conduct is disruptive, disrespectful, or poses a safety risk to the group."
  },
  {
    title: "8. Photography & Media",
    content: "By joining a Yatrivo trip, you consent to being photographed or filmed for marketing purposes unless you explicitly opt out in writing before departure. We will never sell your personal images to third parties."
  },
  {
    title: "9. Governing Law",
    content: "These terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of courts in Dehradun, Uttarakhand."
  }
];

export const DEFAULT_PRIVACY_SECTIONS: ContentSection[] = [
  {
    title: "1. Information We Collect",
    content: "We collect the following personal data when you use Yatrivo services: (a) Contact details — name, phone number, and email address provided during enquiry or registration; (b) Trip preferences — destinations, travel dates, traveller count, and budget ranges; (c) Usage data — pages visited, search queries, and device type for analytics; (d) Communications — WhatsApp messages and emails you send us."
  },
  {
    title: "2. How We Use Your Information",
    content: "Your information is used solely to: provide and improve our travel services; send trip quotes, booking confirmations, and travel updates; respond to enquiries via WhatsApp, phone, or email; personalise your experience based on stated preferences; send marketing communications (only with your consent); and comply with applicable legal obligations."
  },
  {
    title: "3. Data Sharing",
    content: "We do not sell your personal data to any third party. We share information only with: (a) trusted service partners (accommodation, transport) strictly to fulfill your booking; (b) technology providers (hosting, email delivery) under confidentiality agreements; (c) legal authorities when required by law. All partners are held to the same data protection standards as Yatrivo."
  },
  {
    title: "4. WhatsApp Communication",
    content: "When you use our WhatsApp enquiry feature, your message is sent via the WhatsApp platform. We store the content to manage your enquiry. By initiating a WhatsApp conversation, you consent to our team contacting you on that number for trip-related matters. You may opt out at any time by messaging \"STOP\"."
  },
  {
    title: "5. Cookies & Analytics",
    content: "We use essential cookies for website functionality and optional analytics cookies (such as Google Analytics) to understand user behaviour in aggregate. You may disable analytics cookies through your browser settings without affecting core site functionality."
  },
  {
    title: "6. Data Security",
    content: "We implement industry-standard SSL encryption, access controls, and regular security audits to protect your data. However, no transmission over the internet is 100% secure. If you suspect unauthorized access to your account, contact us immediately at hello@yatrivo.com."
  },
  {
    title: "7. Data Retention",
    content: "We retain your personal information for as long as your account is active or as needed to provide services. Booking records are retained for 7 years for legal and financial compliance. You may request deletion of your data at any time, subject to our legal retention obligations."
  },
  {
    title: "8. Your Rights",
    content: "Under applicable Indian data protection law, you have the right to: access the personal data we hold about you; correct inaccurate information; request deletion of your data; withdraw consent for marketing; and raise a complaint with the relevant authority. Submit requests to hello@yatrivo.com with the subject line \"Data Request\"."
  },
  {
    title: "9. Children's Privacy",
    content: "Our services are not directed at children under 13. We do not knowingly collect data from minors. If you believe a child's data has been submitted, contact us and we will delete it promptly."
  },
  {
    title: "10. Changes to This Policy",
    content: "We may update this Privacy Policy from time to time. Material changes will be communicated via email or a prominent notice on our website. Continued use of our services after changes constitutes acceptance of the revised policy."
  }
];

export const DEFAULT_ABOUT_SECTIONS: ContentSection[] = [
  {
    title: "Our Story & Manifesto",
    content: "We are Uttarakhand's premium travel collective, born in Dehradun. We started to bridge the gap between heavy commercial bus tours and high-risk, unguided exploration. We believe that true travel requires stepping away from crowded, noisy buses, slowing down the pace, and experiencing the pristine high alpine valleys with certified mountain guides."
  },
  {
    title: "The Yatrivo Promise",
    content: "Every route we design is handpicked. Every wood cabin we choose has a warm local soul. We buy food from nearby organic family farms, hire licensed local guides, and execute every trip with deep environmental respect. Small groups, immersive experiences, and memories that last a lifetime."
  }
];

export function parseContentSections(raw: string | null | undefined, fallback: ContentSection[]): ContentSection[] {
  if (!raw || !raw.trim()) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object" && "title" in parsed[0]) {
      return parsed.map((item: any) => ({
        title: String(item.title || ""),
        content: String(item.content || item.desc || item.body || "")
      }));
    }
  } catch {
    // If stored as legacy raw plain text, wrap into a single section tile
    return [{ title: "Overview", content: raw }];
  }
  return fallback;
}

export function serializeContentSections(sections: ContentSection[]): string {
  return JSON.stringify(sections, null, 2);
}
