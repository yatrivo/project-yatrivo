import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";

const sections = [
  {
    title: "1. Information We Collect",
    content: `We collect the following personal data when you use Yatrivo services: (a) Contact details — name, phone number, and email address provided during enquiry or registration; (b) Trip preferences — destinations, travel dates, traveller count, and budget ranges; (c) Usage data — pages visited, search queries, and device type for analytics; (d) Communications — WhatsApp messages and emails you send us.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `Your information is used solely to: provide and improve our travel services; send trip quotes, booking confirmations, and travel updates; respond to enquiries via WhatsApp, phone, or email; personalise your experience based on stated preferences; send marketing communications (only with your consent); and comply with applicable legal obligations.`,
  },
  {
    title: "3. Data Sharing",
    content: `We do not sell your personal data to any third party. We share information only with: (a) trusted service partners (accommodation, transport) strictly to fulfill your booking; (b) technology providers (hosting, email delivery) under confidentiality agreements; (c) legal authorities when required by law. All partners are held to the same data protection standards as Yatrivo.`,
  },
  {
    title: "4. WhatsApp Communication",
    content: `When you use our WhatsApp enquiry feature, your message is sent via the WhatsApp platform. We store the content to manage your enquiry. By initiating a WhatsApp conversation, you consent to our team contacting you on that number for trip-related matters. You may opt out at any time by messaging "STOP".`,
  },
  {
    title: "5. Cookies & Analytics",
    content: `We use essential cookies for website functionality and optional analytics cookies (such as Google Analytics) to understand user behaviour in aggregate. You may disable analytics cookies through your browser settings without affecting core site functionality.`,
  },
  {
    title: "6. Data Security",
    content: `We implement industry-standard SSL encryption, access controls, and regular security audits to protect your data. However, no transmission over the internet is 100% secure. If you suspect unauthorized access to your account, contact us immediately at hello@yatrivo.com.`,
  },
  {
    title: "7. Data Retention",
    content: `We retain your personal information for as long as your account is active or as needed to provide services. Booking records are retained for 7 years for legal and financial compliance. You may request deletion of your data at any time, subject to our legal retention obligations.`,
  },
  {
    title: "8. Your Rights",
    content: `Under applicable Indian data protection law, you have the right to: access the personal data we hold about you; correct inaccurate information; request deletion of your data; withdraw consent for marketing; and raise a complaint with the relevant authority. Submit requests to hello@yatrivo.com with the subject line "Data Request".`,
  },
  {
    title: "9. Children's Privacy",
    content: `Our services are not directed at children under 13. We do not knowingly collect data from minors. If you believe a child's data has been submitted, contact us and we will delete it promptly.`,
  },
  {
    title: "10. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. Material changes will be communicated via email or a prominent notice on our website. Continued use of our services after changes constitutes acceptance of the revised policy.`,
  },
];

export default function PrivacyPage() {
  const { navigate, privacyContent } = useApp();

  return (
    <div>
      <section className="bg-[#0f2922] text-white pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-[#e8622a] text-xs uppercase tracking-widest mb-3">LEGAL</div>
          <h1 className="text-4xl sm:text-5xl" style={{ fontFamily: "var(--font-serif)" }}>Privacy Policy</h1>
          <p className="text-white/60 text-sm mt-3">Last updated: September 2026</p>
        </div>
      </section>

      <section className="py-14 bg-[#f7f8f5]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 mb-6 flex items-start gap-4">
            <span className="text-2xl">🔒</span>
            <p className="text-[#4a5568] text-sm leading-relaxed">
              Your privacy matters to us. Yatrivo is committed to protecting your personal data and being transparent about how we use it. This policy explains exactly what we collect, why, and your rights over it.
            </p>
          </div>
          {privacyContent ? (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-7">
              <pre className="text-[#4a5568] text-sm leading-relaxed whitespace-pre-wrap font-sans">{privacyContent}</pre>
            </div>
          ) : (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] divide-y divide-[#e2e8f0] overflow-hidden">
            {sections.map((s) => (
              <div key={s.title} className="p-7">
                <h2 className="text-[#0f2922] font-semibold mb-3">{s.title}</h2>
                <p className="text-[#4a5568] text-sm leading-relaxed">{s.content}</p>
              </div>
            ))}
          </div>
          )}
          <div className="mt-8 text-center">
            <p className="text-[#4a5568] text-sm mb-4">
              Questions? Read our <button onClick={() => navigate("terms")} className="text-[#e8622a] hover:underline">Terms & Conditions</button> or email us at <a href="mailto:hello@yatrivo.com" className="text-[#e8622a] hover:underline">hello@yatrivo.com</a>.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
