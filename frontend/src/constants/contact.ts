export const YATRIVO_CONTACT = {
  phone: "+91 98765 43210",
  whatsappNumber: "919876543210",
  email: "hello@yatrivo.com",
  officeAddress: "Rajpur Road, Dehradun, Uttarakhand, 248001",
  supportHours: "9:00 AM – 9:00 PM IST daily",
  
  // Direct WhatsApp link generator
  getWhatsAppUrl(customMessage?: string) {
    const text = customMessage || "Hi Yatrivo! I have an inquiry about your Himalayan trips and departures.";
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(text)}`;
  }
};
