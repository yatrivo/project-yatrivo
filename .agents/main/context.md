# Project Context

## Project Identity

- Project Name: Yatrivo
- Project Type: Travel / Tour Brand Website
- Requirements Version: Version 1.0
- Requirements Date: August 2026
- Current Geographic Focus: Uttarakhand and Himalayan experiences
- Long-Term Direction: Expansion across India

## Brand Positioning

- Primary positioning: Curated Himalayan & India Travel Experiences
- Brand line: "Explore More. Travel Better."

## Project Purpose

The Yatrivo website should:

- Establish trust.
- Showcase curated experiences.
- Generate qualified enquiries/bookings.
- Allow visitors to understand packages before enquiring.
- Give the Yatrivo team a simple way to manage packages and leads.
- Establish an architecture that can support future capabilities.

## Business Model / Version 1 Approach

Version 1 is enquiry-led rather than a complicated instant-booking engine. Online instant booking is not the primary Version 1 model.

```text
Visitor
  |
Enquiry / WhatsApp
  |
Lead captured
  |
Yatrivo follows up
  |
Itinerary / quote
  |
Confirmation
  |
Payment link after confirmation
  |
Internal booking-status update
```

## Target Audience

Current audiences:

- Young professionals and groups of friends.
- Couples.
- Families.
- Adventure and nature travellers.
- Customers coming from Instagram.
- Customers coming from Google.
- Customers coming from WhatsApp.

Future audiences:

- Customers from other Indian cities.
- Future B2B travel-agent partners.

## Geographic Scope

Current focus:

- Uttarakhand.
- Himalayan experiences.

Initial Uttarakhand destinations referenced by the requirements:

- Rishikesh
- Kedarnath
- Chopta/Tungnath
- Kanatal
- Chakrata
- Auli
- Badrinath
- Mussoorie
- Nainital
- Valley of Flowers
- Tehri
- Lansdowne

Future scope:

- Broader India travel.

## Primary Website Goals

- Generate qualified travel enquiries and WhatsApp conversations.
- Showcase Yatrivo's destinations and curated packages professionally.
- Allow visitors to understand itinerary, inclusions, exclusions, pricing, and policies before enquiring.
- Build trust through reviews, customer photos, FAQs, business information, and clear contact details.
- Be mobile-first because most initial traffic will come from Instagram/WhatsApp.
- Create an architecture that can later support online booking, payments, customer accounts, and a supplier/operations workflow.

## Version 1 Scope

### MUST HAVE

- Home
- Trips listing
- Trip detail pages
- Destinations
- About
- Contact
- FAQ
- Enquiry form
- WhatsApp CTA
- Admin/CMS for packages and leads
- SEO basics
- Analytics
- Legal pages
- Mobile responsive design

### NICE TO HAVE / LATER

- Online instant booking
- Payment gateway
- Customer login
- Wishlist
- Live availability
- Automated WhatsApp workflows
- Coupon codes
- Referral system
- Affiliate/B2B portal
- Supplier management
- Customer dashboard
- Dynamic package builder

## Important Product Principles

Build Version 1 as an enquiry-led travel marketplace rather than a complex OTA. The immediate business objective is to generate qualified leads, convert them through WhatsApp/phone, validate Yatrivo's packages, and learn which destinations sell.

The architecture should remain modular so future booking, payment, availability, customer-account, operations, and B2B functionality can be added without rebuilding the entire website.

## Important Constraints

- Mobile-first design.
- Trustworthy, premium presentation.
- Strong performance and fast first load.
- Accessible navigation, readable contrast, keyboard-friendly forms, and alt text.
- Secure form handling and server-side validation.
- Protected admin routes and customer data.
- HTTPS/SSL mandatory.
- Show only genuine reviews.
- Do not use unsupported claims.
- Include applicable legal and trust pages/details.

## Known Contact / Brand Information

- Brand: YATRIVO
- Instagram: @yatrivo._
- WhatsApp: +91 8755673223
- Email: hello@yourdomain `[placeholder from source]`


## Technical Architecture Summary

Approved Version 1 stack:

- Frontend: Next.js + React + TypeScript
- Frontend deployment: Vercel
- Backend: TypeScript-based API/backend
- Backend deployment: Render
- Database: PostgreSQL
- Database provider: Neon
- ORM: Prisma
- Architecture style: Modular monolith

Proposed services:

- Image storage: Cloudinary
- Email service: Resend

Still to be defined:

- Authentication solution: [TO BE DEFINED]
- Exact backend framework/library: [TO BE DEFINED]
- CI/CD strategy: [TO BE DEFINED]
- Staging environment: [TO BE DEFINED]
- Monitoring/logging provider: [TO BE DEFINED]

Docker is deferred/optional and is not mandatory for local development or deployment at this stage.

## Open Questions / To Be Defined

- Final domain: [TO BE DEFINED]
- Final business email: [TO BE DEFINED]
- Final legal/company details: [TO BE DEFINED]
- Approved logo/brand asset location: [TO BE DEFINED]
- Final Figma/design system: [TO BE DEFINED]
- Final CMS implementation/admin approach within the approved stack: [TO BE DEFINED]
- Payment provider, when required: [TO BE DEFINED]
- Other implementation-specific decisions: [TO BE DEFINED]

