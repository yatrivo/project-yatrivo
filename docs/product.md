# Product

## Product Overview

Yatrivo is a travel and tour brand initially focused on Uttarakhand and Himalayan experiences, with a long-term goal of expanding across India.

The website is intended to establish trust, showcase curated experiences, generate qualified enquiries and WhatsApp conversations, help visitors understand packages before enquiring, and give the Yatrivo team a simple way to manage packages and leads.

## Positioning

- Primary positioning: Curated Himalayan & India Travel Experiences.
- Brand line: "Explore More. Travel Better."

## Problem Statement

The website needs to make it easy for potential travellers to:

- Discover curated trips.
- Understand what a package offers.
- Review itinerary, inclusions, exclusions, pricing, and policies.
- Trust the brand.
- Enquire through WhatsApp/forms.
- Receive a quote and continue the booking process.

## Product Goals

- Generate qualified travel enquiries and WhatsApp conversations.
- Showcase Yatrivo's destinations and curated packages professionally.
- Allow visitors to understand itinerary, inclusions, exclusions, pricing, and policies before enquiring.
- Build trust through reviews, customer photos, FAQs, business information, and clear contact details.
- Be mobile-first because most initial traffic will come from Instagram/WhatsApp.
- Create an architecture that can later support online booking, payments, customer accounts, and a supplier/operations workflow.

## Target Users

### Primary Users

- Young professionals / groups of friends.
- Couples.
- Families.
- Adventure and nature travellers.
- Instagram/Google/WhatsApp-driven customers.

### Future Users

- Customers from other Indian cities.
- B2B travel-agent partners.

## User Intent / Travel Styles

- Weekend Escapes
- Adventure
- Spiritual Journeys
- Couple Trips
- Family Trips
- Custom Trips

## Core Product Experience

```text
Discover
  |
Explore destination/trip
  |
Review details
  |
Enquire / WhatsApp
  |
Receive itinerary / quote
  |
Confirm
  |
Payment after confirmation
  |
Travel
```

This is not an instant-booking flow for Version 1.

## Product Structure

Primary website areas:

- Home
- Trips / Packages
- Trip Detail
- Destinations
- Weekend Escapes
- About Yatrivo
- Contact
- FAQ
- Policies

Suggested URL structure:

- `/`
- `/trips`
- `/trips/[slug]`
- `/destinations`
- `/destinations/[slug]`
- `/about`
- `/contact`
- `/faq`

## Core Features

- Trip/package discovery.
- Destination discovery.
- Detailed trip information.
- Enquiry capture.
- WhatsApp conversion.
- Custom trip planner, Version 1 if budget permits.
- Reviews/testimonials.
- FAQ.
- Contact.
- Admin package management.
- Admin lead management.
- Basic SEO management.
- Analytics.

## Trust & Credibility

Trust mechanisms:

- Curated experiences.
- Local partners.
- Private and group trips.
- Custom itineraries.
- Customer reviews.
- Traveller photos.
- FAQs.
- Clear contact information.
- Transparent package information.

Unsupported claims must not be used. Do not claim unsupported years of experience, review counts, government accreditation, tourism recognition, licenses, safety certifications, or reviews.

## Visual Product Direction

- Premium.
- Adventurous.
- Clean.
- Modern.
- Trustworthy.
- Avoid generic travel-agency appearance.
- Cinematic destination photography/video.
- Modern sans-serif.
- Bold headings.
- Readable body text.
- Neutral backgrounds.
- Photography should dominate.
- Rounded cards.
- Generous whitespace.
- Subtle shadows.
- Clean icons.
- Strong CTAs.
- Mobile-first design.

Approved Yatrivo brand colors/assets: [TO BE DEFINED]

## CTA Strategy

Primary CTAs:

- WhatsApp
- Enquire Now

Secondary CTAs:

- View Itinerary
- Explore Trips

Homepage CTA examples:

- Explore Trips
- Plan My Trip
- WhatsApp Yatrivo

## Version 1 Product Scope

### Must Have

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

### Nice to Have / Future

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

## Success Criteria

- Generate qualified travel enquiries.
- Generate WhatsApp conversations.
- Showcase destinations/packages effectively.
- Enable users to understand packages before enquiring.
- Build trust.
- Provide a manageable package/lead workflow.
- Create a foundation for future booking, payment, and operations capabilities.

## Future Product Direction

Future expansion areas include:

- Online booking.
- Payments.
- Customer accounts.
- Live availability.
- Automated WhatsApp workflows.
- Supplier/operations workflow.
- B2B functionality.
- Coupon codes.
- Referral system.
- Customer dashboard.
- Dynamic package builder.

These are future expansion areas and are not automatically Version 1 requirements.

## Technical Product Constraints

Approved implementation stack:

- Frontend: Next.js + React + TypeScript
- Frontend deployment: Vercel
- Backend: TypeScript-based API/backend
- Backend deployment: Render
- Database: PostgreSQL on Neon
- ORM: Prisma
- Architecture style: Modular monolith

Proposed services:

- Image storage: Cloudinary
- Email service: Resend

TBD technical decisions that may affect product operations:

- Authentication solution: [TO BE DEFINED]
- Exact backend framework/library: [TO BE DEFINED]
- CMS/admin implementation details: [TO BE DEFINED]
- Payment provider for future payment integration: [TO BE DEFINED]

## Open Product Questions

- Final CMS/admin implementation details: [TO BE DEFINED]
- Final approved Figma/design system: [TO BE DEFINED]
- Final brand assets and colors: [TO BE DEFINED]
- Final business email/domain: [TO BE DEFINED]
- Final legal/company details: [TO BE DEFINED]
- Payment provider for future payment integration: [TO BE DEFINED]

