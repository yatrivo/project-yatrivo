import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using the Yatrivo website and booking services, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services. These terms apply to all users including browsers, customers, and travellers who book through Yatrivo.`,
  },
  {
    title: "2. Booking & Payments",
    content: `All bookings are confirmed upon receipt of the booking amount specified in your trip quote. We accept payments via bank transfer, UPI, and major credit/debit cards. Full payment is due 14 days before departure. Prices quoted include GST as applicable and are subject to change until confirmed in writing.`,
  },
  {
    title: "3. Cancellation Policy",
    content: `Cancellations made 30+ days before departure: 90% refund. Cancellations 15–29 days before: 60% refund. Cancellations 7–14 days before: 25% refund. Cancellations within 7 days: No refund. All cancellations must be submitted in writing to hello@yatrivo.com. Natural disasters, government restrictions, or health emergencies may trigger alternative rescheduling policies.`,
  },
  {
    title: "4. Travel Documents & Fitness",
    content: `Travellers are responsible for ensuring they hold valid ID proof (Aadhaar, passport, or other government-issued ID). You must be physically fit for the activities described in your chosen package. Yatrivo reserves the right to exclude a traveller from physically demanding activities if safety is deemed at risk.`,
  },
  {
    title: "5. Liability Limitation",
    content: `Yatrivo acts as an organizer, not as a carrier or accommodation provider. We cannot be held liable for delays, accidents, acts of God, government restrictions, personal injury, or property loss beyond our control. We strongly recommend comprehensive travel insurance for all trips.`,
  },
  {
    title: "6. Itinerary Changes",
    content: `We reserve the right to modify or substitute itinerary elements—including hotels, routes, and activities—when circumstances such as weather, safety concerns, or permit availability require it. We aim to provide an equivalent replacement and communicate changes in advance.`,
  },
  {
    title: "7. Code of Conduct",
    content: `All travellers are expected to respect local customs, fellow group members, guides, and the natural environment. Yatrivo may remove any traveller from a trip without refund if their conduct is disruptive, disrespectful, or poses a safety risk to the group.`,
  },
  {
    title: "8. Photography & Media",
    content: `By joining a Yatrivo trip, you consent to being photographed or filmed for marketing purposes unless you explicitly opt out in writing before departure. We will never sell your personal images to third parties.`,
  },
  {
    title: "9. Governing Law",
    content: `These terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of courts in Dehradun, Uttarakhand.`,
  },
];

export default function TermsPage() {
  const { navigate, termsContent } = useApp();

  return (
    <div>
      <section className="bg-[#0f2922] text-white pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-[#e8622a] text-xs uppercase tracking-widest mb-3">LEGAL</div>
          <h1 className="text-4xl sm:text-5xl" style={{ fontFamily: "var(--font-serif)" }}>Terms & Conditions</h1>
          <p className="text-white/60 text-sm mt-3">Last updated: September 2026</p>
        </div>
      </section>

      <section className="py-14 bg-[#f7f8f5]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {termsContent ? (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-7">
              <pre className="text-[#4a5568] text-sm leading-relaxed whitespace-pre-wrap font-sans">{termsContent}</pre>
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
            <p className="text-[#4a5568] text-sm mb-4">Questions? Read our <button onClick={() => navigate("privacy")} className="text-[#e8622a] hover:underline">Privacy Policy</button> or contact us at <a href="mailto:hello@yatrivo.com" className="text-[#e8622a] hover:underline">hello@yatrivo.com</a>.</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
