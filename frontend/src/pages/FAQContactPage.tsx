import { useState } from "react";
import { useApp } from "@/context/AppContext";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import SiteImage from "@/components/SiteImage";
import { SITE_ASSET_KEYS } from "@/api/siteAssets";
import { YATRIVO_CONTACT } from "@/constants/contact";

export default function FAQContactPage() {
  const { navigate, faqItems, siteSettings } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const phone = siteSettings?.contact?.phone || YATRIVO_CONTACT.phone;
  const whatsapp = siteSettings?.contact?.inquiryWhatsapp || siteSettings?.contact?.whatsapp || YATRIVO_CONTACT.phone;
  const contactEmail = siteSettings?.contact?.contactEmail || YATRIVO_CONTACT.email;
  const address = siteSettings?.contact?.address || YATRIVO_CONTACT.officeAddress;
  const whatsappDigits = (siteSettings?.contact?.inquiryWhatsapp || siteSettings?.contact?.whatsapp || YATRIVO_CONTACT.whatsappNumber).replace(/\D/g, "");


  return (
    <div>
      <SEO
        title="Frequently Asked Questions & Contact"
        description="Have questions about weather, fitness levels, high-altitude gear, or customized bookings in Uttarakhand? Connect with the Yatrivo team in Dehradun."
        keywords="yatrivo contact, uttarakhand travel faq, trekking fitness requirements, mountain cabin bookings, dehradun travel agency"
      />
      {/* Hero */}
      <section className="relative h-[45vh] min-h-[300px] flex items-end pb-12 overflow-hidden">
        <SiteImage
          assetKey={SITE_ASSET_KEYS.FAQ_HERO}
          alt="Cozy mountain cabin in snow"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay-directional" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="text-[#e8622a] text-xs uppercase tracking-widest font-semibold mb-3 text-contrast-subtle">FAQ & CONTACT CORNER</div>
          <h1 className="text-white text-4xl sm:text-5xl mb-4 text-contrast-title" style={{ fontFamily: "var(--font-serif)" }}>We are here to guide you home.</h1>
          <p className="text-white/90 text-sm sm:text-base max-w-xl leading-relaxed text-contrast-body">
            Have questions about weather, fitness levels, or customized private booking? Connect with our Dehradun team immediately.
          </p>
        </div>
      </section>

      {/* FAQ + Contact */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* FAQ */}
          <div className="lg:col-span-3">
            <div className="text-[#e8622a] text-xs uppercase tracking-widest font-medium mb-3">COMMON MOUNTAIN INQUIRIES</div>
            <h2 className="text-[#0f2922] text-3xl mb-8" style={{ fontFamily: "var(--font-serif)" }}>Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqItems.map((faq, i) => (
                <div key={faq.id} className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-[#f7f8f5] transition-colors"
                  >
                    <span className="text-[#0f2922] text-sm font-medium">{faq.question}</span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#e8622a"
                      strokeWidth="2"
                      className={`shrink-0 mt-0.5 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-[#4a5568] text-sm leading-relaxed border-t border-[#e2e8f0] pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Cards */}
          <div className="lg:col-span-2 space-y-5">
            {/* Main Contact Card */}
            <div style={{ background: "var(--forest)" }} className="rounded-2xl p-7 text-white">
              <div className="text-[#e8622a] text-[10px] uppercase tracking-widest font-medium mb-3">CONNECT INSTANTLY</div>
              <h3 className="text-white text-2xl mb-6" style={{ fontFamily: "var(--font-serif)" }}>Himalayan Support</h3>
              <div className="space-y-4 mb-7">
                <div className="flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#e8622a] shrink-0 mt-0.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a6.68 6.68 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                  <div>
                    <div className="text-white/60 text-xs mb-0.5">WHATSAPP CHAT</div>
                    <div className="text-white font-medium text-sm">{whatsapp}</div>
                  </div>

                </div>
                <div className="flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2" className="shrink-0 mt-0.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <div>
                    <div className="text-white/60 text-xs mb-0.5">EMAIL INQUIRIES</div>
                    <a href={`mailto:${contactEmail}`} className="text-white font-medium text-sm hover:underline">{contactEmail}</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2" className="shrink-0 mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <div>
                    <div className="text-white/60 text-xs mb-0.5">DEHRADUN OFFICE</div>
                    <div className="text-white text-sm whitespace-pre-line">{address}</div>
                  </div>
                </div>

              </div>
              <a
                href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi Yatrivo! I have a question about your trips and departures.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white py-3.5 rounded-full text-sm font-semibold transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a6.68 6.68 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                PING ON WHATSAPP
              </a>
              <p className="text-white/40 text-xs text-center mt-3">Our support team is live 9am – 9pm daily.</p>
            </div>

            {/* Secondary Card */}
            <div className="border border-[#e2e8f0] rounded-2xl p-6">
              <div className="text-[#e8622a] text-xs uppercase tracking-wider font-medium mb-3">NEED IMMEDIATE ASSISTANCE?</div>
              <p className="text-[#4a5568] text-sm leading-relaxed mb-4">
                Give us a quick call. Our mountain experts are certified to help you find the perfect high alpine trail.
              </p>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8622a" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <a href={`tel:${phone.replace(/\s+/g, "")}`} className="text-[#0f2922] font-semibold text-sm hover:text-[#e8622a] transition-colors">{phone}</a>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
