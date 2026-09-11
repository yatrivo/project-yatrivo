# Requirements

## 1. Scope

These requirements describe Yatrivo Website Development Version 1.0, dated August 2026, and the explicitly stated future direction.

Version 1 must be built as an enquiry-led travel marketplace, not as a complex OTA or instant-booking engine. Future booking, payment, customer-account, availability, operations, and B2B capabilities should be architecturally possible without treating them as launch requirements.

## 2. Functional Requirements

### 2.1 Navigation & Site Structure

#### FR-001 - Main Navigation

- Description: The website must provide main navigation for Home, Trips / Packages, Destinations, Weekend Escapes, About Yatrivo, Contact, and FAQ.
- Actor: Visitor
- Expected behavior: Visitors can move between primary site areas from the header/navigation.
- Acceptance criteria: Navigation includes all required primary areas.
- Dependencies: Final design specification: [TO BE DEFINED]

#### FR-002 - Header CTA

- Description: The header must include a prominent CTA labeled "Plan My Trip" or "WhatsApp Us".
- Actor: Visitor
- Expected behavior: Visitor can quickly begin an enquiry or WhatsApp conversation.
- Acceptance criteria: Header CTA is visible and functional according to the approved design.
- Dependencies: Final CTA choice: [TO BE DEFINED]

#### FR-003 - URL Structure

- Description: The site should support SEO-friendly URLs for home, trips, trip details, destinations, destination details, about, contact, and FAQ.
- Actor: Visitor / Search engine
- Expected behavior: Pages are accessible at clear URL paths such as `/`, `/trips`, `/trips/[slug]`, `/destinations`, `/destinations/[slug]`, `/about`, `/contact`, and `/faq`.
- Acceptance criteria: Required page types have readable URLs.
- Dependencies: Next.js routing implementation details: [TO BE DEFINED]

#### FR-004 - Footer And Policies

- Description: The footer must include logo, short description, navigation, contact, WhatsApp, Instagram, email, social links, policies, copyright, and business details where applicable.
- Actor: Visitor
- Expected behavior: Visitors can access contact and legal/trust information from the footer.
- Acceptance criteria: Footer includes required items and links to policy pages.
- Dependencies: Final legal/company details: [TO BE DEFINED]

### 2.2 Homepage

#### FR-005 - Homepage Header / Navigation

- Description: The homepage must include the Yatrivo logo, navigation links, and prominent WhatsApp/Plan My Trip button.
- Actor: Visitor
- Expected behavior: Header supports site navigation and quick enquiry.
- Acceptance criteria: Header includes logo, Home, Trips, Destinations, Weekend Escapes, About, Contact, and prominent CTA.
- Dependencies: Approved design specification: [TO BE DEFINED]

#### FR-006 - Sticky Header Behavior

- Description: Header/navigation must be sticky on mobile and desktop.
- Actor: Visitor
- Expected behavior: Navigation and CTA remain accessible while scrolling.
- Acceptance criteria: Sticky behavior works on mobile and desktop layouts.
- Dependencies: Approved interaction specification: [TO BE DEFINED]

#### FR-007 - Homepage Hero

- Description: The homepage hero must use a full-width high-quality Himalayan/travel image or lightweight video.
- Actor: Visitor
- Expected behavior: Visitor immediately understands the travel brand and destination focus.
- Acceptance criteria: Hero includes headline "Your Next Journey Starts Here." and the documented subheading.
- Dependencies: Approved media assets: [TO BE DEFINED]

#### FR-008 - Hero CTAs

- Description: The hero must include CTAs "Explore Trips" and "Plan My Trip".
- Actor: Visitor
- Expected behavior: Visitor can browse trips or start planning from the hero.
- Acceptance criteria: Both CTAs are present and route to their intended actions.
- Dependencies: Final CTA routing/actions: [TO BE DEFINED]

#### FR-009 - Trust Strip

- Description: Homepage must include a short credibility strip with Curated Experiences, Local Partners, Private & Group Trips, and Custom Itineraries.
- Actor: Visitor
- Expected behavior: Visitor sees concise trust/USP indicators.
- Acceptance criteria: Trust strip is present and avoids unsupported claims.
- Dependencies: Approved design specification: [TO BE DEFINED]

#### FR-010 - Featured Experiences

- Description: Homepage must show 4-6 featured experience cards.
- Actor: Visitor
- Expected behavior: Visitor can preview selected trips and open details.
- Acceptance criteria: Each card includes image, trip name, duration, starting price, short descriptor, and View Details.
- Dependencies: Package data source/CMS: [TO BE DEFINED]

#### FR-011 - Why Yatrivo

- Description: Homepage must communicate 3-5 benefits: thoughtfully planned itineraries, transparent inclusions, local coordination, flexible private/group options, and support during the trip.
- Actor: Visitor
- Expected behavior: Visitor understands why to choose Yatrivo.
- Acceptance criteria: Section includes documented benefits without unsupported claims.
- Dependencies: Approved content: [TO BE DEFINED]

#### FR-012 - Travel Styles

- Description: Homepage must include travel-style discovery for Weekend Escapes, Adventure, Spiritual Journeys, Couple Trips, Family Trips, and Custom Trips.
- Actor: Visitor
- Expected behavior: Visitor can explore trips by travel intent/style.
- Acceptance criteria: All documented travel styles are represented.
- Dependencies: Filtering/tagging model: [TO BE DEFINED]

#### FR-013 - Explore Uttarakhand

- Description: Homepage must include a visual destination grid for Uttarakhand destinations.
- Actor: Visitor
- Expected behavior: Visitor can navigate to destination pages.
- Acceptance criteria: Grid includes referenced destinations such as Kedarnath, Chopta, Rishikesh, Kanatal, Chakrata, and Auli where available.
- Dependencies: Destination data/source: [TO BE DEFINED]

#### FR-014 - How It Works

- Description: Homepage must explain the enquiry-led process: choose a trip, send enquiry, get itinerary/quote, confirm booking, travel with Yatrivo.
- Actor: Visitor
- Expected behavior: Visitor understands the non-instant-booking workflow.
- Acceptance criteria: Steps are present and consistent with the enquiry-first model.
- Dependencies: Final copy/design: [TO BE DEFINED]

#### FR-015 - Social Proof

- Description: Homepage must support customer reviews and traveller photos managed by admin.
- Actor: Visitor / Admin
- Expected behavior: Visitors see genuine social proof; admins can manage it.
- Acceptance criteria: Only genuine reviews are shown.
- Dependencies: Admin/CMS implementation: [TO BE DEFINED]

#### FR-016 - Instagram Section

- Description: Homepage must include latest Yatrivo posts/reels or a simple follow-us section linking to @yatrivo._.
- Actor: Visitor
- Expected behavior: Visitor can discover Yatrivo on Instagram.
- Acceptance criteria: Section links to Instagram and avoids heavy third-party embeds if they hurt performance.
- Dependencies: Instagram integration approach: [TO BE DEFINED]

#### FR-017 - Final CTA

- Description: Homepage must include final CTA copy "Ready for your next escape?" with WhatsApp Yatrivo and Plan My Trip buttons.
- Actor: Visitor
- Expected behavior: Visitor has a final conversion path.
- Acceptance criteria: Final CTA is present and functional.
- Dependencies: Final CTA actions: [TO BE DEFINED]

### 2.3 Trips / Packages Listing

#### FR-018 - Trip Filters

- Description: The trips listing page must provide filters for Destination, Duration, Travel Style, Budget, and Season/availability if used.
- Actor: Visitor
- Expected behavior: Visitor can narrow package results.
- Acceptance criteria: Required filters are available; Season/availability is included only if used.
- Dependencies: Package data model: [TO BE DEFINED]

#### FR-019 - Package Cards

- Description: Each package card must show cover image, package name, location, duration, starting price, tags, short summary, and "View Trip".
- Actor: Visitor
- Expected behavior: Visitor can compare packages before opening details.
- Acceptance criteria: Cards include all required information.
- Dependencies: Package content/CMS fields: [TO BE DEFINED]

#### FR-020 - Sorting

- Description: Trips listing must support sorting by Recommended, Price Low-High, and Duration.
- Actor: Visitor
- Expected behavior: Visitor can reorder package results.
- Acceptance criteria: Sorting options are present and functional.
- Dependencies: Sorting rules for Recommended: [TO BE DEFINED]

### 2.4 Trip Detail

#### FR-021 - Trip Detail Hero And Summary

- Description: Trip detail pages must include hero image, package name, location, duration, and starting price.
- Actor: Visitor
- Expected behavior: Visitor quickly understands the package identity and basic offer.
- Acceptance criteria: Required summary elements are present.
- Dependencies: Package data/CMS: [TO BE DEFINED]

#### FR-022 - Trip Quick Facts

- Description: Trip detail pages must show quick facts including duration, starting point, suitable for, and difficulty where relevant.
- Actor: Visitor
- Expected behavior: Visitor can assess fit quickly.
- Acceptance criteria: Quick facts are displayed; difficulty appears where relevant.
- Dependencies: Package data/CMS: [TO BE DEFINED]

#### FR-023 - Trip Media Gallery

- Description: Trip detail pages must include a photo gallery.
- Actor: Visitor
- Expected behavior: Visitor can review trip visuals.
- Acceptance criteria: Gallery supports package photos.
- Dependencies: Image assets/CMS upload: [TO BE DEFINED]

#### FR-024 - Trip Content Sections

- Description: Trip detail pages must include overview, day-by-day itinerary, accommodation, transport, inclusions, exclusions, pricing, optional add-ons, cancellation/refund summary, important notes, and trip-specific FAQ.
- Actor: Visitor
- Expected behavior: Visitor can understand the trip before enquiring.
- Acceptance criteria: All required content sections are supported.
- Dependencies: Package content/CMS fields: [TO BE DEFINED]

#### FR-025 - Expandable Itinerary Days

- Description: Day-by-day itinerary must support expandable days.
- Actor: Visitor
- Expected behavior: Visitor can scan or expand itinerary details.
- Acceptance criteria: Itinerary days can expand/collapse according to the approved interaction design.
- Dependencies: Interaction specification: [TO BE DEFINED]

#### FR-026 - Starting-From Pricing

- Description: Pricing must use clear "starting from" language where final price depends on group size or season.
- Actor: Visitor
- Expected behavior: Visitor does not mistake variable pricing for a fixed universal price.
- Acceptance criteria: Variable pricing is labeled as starting from.
- Dependencies: Pricing rules/content: [TO BE DEFINED]

#### FR-027 - Important Notes

- Description: Trip detail pages must support important notes for weather, permits/registrations, fitness, activity restrictions, and destination-specific requirements.
- Actor: Visitor
- Expected behavior: Visitor sees important trip conditions before enquiring.
- Acceptance criteria: Important notes section is available.
- Dependencies: Destination/package-specific content: [TO BE DEFINED]

#### FR-028 - Sticky Mobile CTA

- Description: Trip detail pages must include a sticky mobile CTA: "WhatsApp to Enquire".
- Actor: Mobile visitor
- Expected behavior: Visitor can enquire while viewing trip details on mobile.
- Acceptance criteria: Sticky CTA appears and works on mobile.
- Dependencies: Approved mobile design: [TO BE DEFINED]

#### FR-029 - Trip Enquiry Form

- Description: Trip detail pages must include an enquiry form.
- Actor: Visitor
- Expected behavior: Visitor can submit lead details for a selected package.
- Acceptance criteria: Form captures name, phone/WhatsApp, email, travel date, number of travellers, package, pickup city, and message.
- Dependencies: Lead storage/notification implementation: [TO BE DEFINED]

### 2.5 Enquiry / Lead Flow

#### FR-030 - Enquiry-First Lead Capture

- Description: Version 1 must support an enquiry-first workflow through Enquire and WhatsApp CTAs.
- Actor: Visitor
- Expected behavior: Visitor can start a lead without instant booking.
- Acceptance criteria: User can click Enquire/WhatsApp and provide essential lead details.
- Dependencies: Lead form and WhatsApp action: [TO BE DEFINED]

#### FR-031 - Lead Storage

- Description: Captured lead details must be stored in admin/CRM or database.
- Actor: System / Admin
- Expected behavior: Yatrivo can view and manage incoming enquiries.
- Acceptance criteria: Submitted leads are available to the admin workflow.
- Dependencies: Admin/CMS implementation and PostgreSQL/Prisma data model: [TO BE DEFINED]

#### FR-032 - Customer Confirmation

- Description: Customer must receive confirmation that Yatrivo will respond after enquiry submission.
- Actor: Visitor
- Expected behavior: Customer knows the enquiry was received.
- Acceptance criteria: Confirmation is shown or sent after submission.
- Dependencies: Notification approach: [TO BE DEFINED]

#### FR-033 - Follow-Up And Booking Status

- Description: Team follow-up, itinerary/quote sharing, payment link after confirmation, and internal booking-status updates must be supported by the operational flow.
- Actor: Yatrivo team
- Expected behavior: Lead can progress through follow-up, quote, confirmation, and status update.
- Acceptance criteria: Admin workflow can reflect lead/booking progression.
- Dependencies: Admin workflow design: [TO BE DEFINED]

### 2.6 Custom Trip Planner

#### FR-034 - Custom Trip Planner

- Description: A simple multi-step custom trip planner should be included in Version 1 if budget permits.
- Actor: Visitor
- Expected behavior: Visitor can request a custom trip.
- Acceptance criteria: Feature is implemented only if included in confirmed Version 1 budget/scope.
- Dependencies: Budget/scope confirmation: [TO BE DEFINED]

#### FR-035 - Custom Trip Planner Fields

- Description: The custom trip planner must capture destination or Not decided, travel dates/flexible dates, number of travellers, starting city, travel type, budget per person, interests, accommodation preference, special requirements, name, phone/WhatsApp, and email.
- Actor: Visitor
- Expected behavior: Yatrivo receives enough information to follow up.
- Acceptance criteria: All documented fields are supported if the planner is implemented.
- Dependencies: FR-034

### 2.7 Destinations

#### FR-036 - Destination Listing

- Description: The website must provide destination cards and dedicated SEO-friendly destination pages.
- Actor: Visitor / Search engine
- Expected behavior: Visitor can browse destinations and open destination-specific pages.
- Acceptance criteria: Destination listing and detail page structure exist.
- Dependencies: Destination content/CMS: [TO BE DEFINED]

#### FR-037 - Initial Uttarakhand Destinations

- Description: Initial destination content should support Rishikesh, Kedarnath, Chopta/Tungnath, Kanatal, Chakrata, Auli, Badrinath, Mussoorie, Nainital, Valley of Flowers, Tehri, and Lansdowne.
- Actor: Visitor
- Expected behavior: Initial Uttarakhand destinations can be represented.
- Acceptance criteria: System can create/display these destination pages as content becomes available.
- Dependencies: Final destination content: [TO BE DEFINED]

#### FR-038 - Destination Expansion

- Description: Destination architecture must allow expansion later without redesigning the site.
- Actor: Admin / Future visitor
- Expected behavior: New destinations can be added consistently.
- Acceptance criteria: Destination model/page structure supports expansion.
- Dependencies: Architecture decision: [TO BE DEFINED]

### 2.8 About

#### FR-039 - About Yatrivo Page

- Description: About page must cover founder/brand story, why Yatrivo exists, travel philosophy, service promise, initial Uttarakhand focus, and future India-wide vision.
- Actor: Visitor
- Expected behavior: Visitor understands the brand and its purpose.
- Acceptance criteria: About page supports all documented content areas.
- Dependencies: Final brand/founder content: [TO BE DEFINED]

#### FR-040 - Authentic Photos

- Description: About page should add authentic founder/team photos when ready.
- Actor: Visitor
- Expected behavior: Visitor sees authentic brand/team visuals once available.
- Acceptance criteria: Page can support founder/team photos without unsupported claims.
- Dependencies: Approved photos: [TO BE DEFINED]

### 2.9 Contact

#### FR-041 - Contact Information

- Description: Contact page must include WhatsApp +91 8755673223, Instagram @yatrivo._, business email placeholder hello@yourdomain, and contact form.
- Actor: Visitor
- Expected behavior: Visitor can contact Yatrivo through supported channels.
- Acceptance criteria: Required contact channels are present.
- Dependencies: Final business email: [TO BE DEFINED]

#### FR-042 - Business Location And Map

- Description: Business location/registered office and Google Maps should appear only if appropriate.
- Actor: Visitor
- Expected behavior: Physical location is shown only when it should be publicly displayed.
- Acceptance criteria: No invented address or map is shown.
- Dependencies: Final business/location decision: [TO BE DEFINED]

### 2.10 FAQ

#### FR-043 - FAQ Page

- Description: FAQ page must answer the documented booking, customization, trip type, inclusion/exclusion, cancellation/refund, advance payment, permits, weather/restriction, transportation, and travel insurance topics.
- Actor: Visitor
- Expected behavior: Visitor can resolve common questions before enquiring.
- Acceptance criteria: FAQ structure supports all documented topics.
- Dependencies: Approved FAQ answers: [TO BE DEFINED]

### 2.11 Admin / CMS

#### FR-044 - Secure Admin Login

- Description: Admin/CMS must provide secure admin login with role-based access if multiple staff are added later.
- Actor: Admin
- Expected behavior: Admin functionality is protected.
- Acceptance criteria: Admin routes/data are not publicly accessible.
- Dependencies: Authentication implementation: [TO BE DEFINED]

#### FR-045 - Package Management

- Description: Admin/CMS must allow create/edit/delete packages; photo upload/reordering; and management of price, duration, itinerary, inclusions/exclusions, and FAQs.
- Actor: Admin
- Expected behavior: Yatrivo can manage package content without code changes.
- Acceptance criteria: Required package fields and media management are supported.
- Dependencies: CMS/data model: [TO BE DEFINED]

#### FR-046 - Destination Management

- Description: Admin/CMS must allow destination management.
- Actor: Admin
- Expected behavior: Yatrivo can add and update destinations.
- Acceptance criteria: Destination records/content can be managed.
- Dependencies: CMS/data model: [TO BE DEFINED]

#### FR-047 - Lead Management

- Description: Admin/CMS must allow viewing and exporting enquiries/leads.
- Actor: Admin
- Expected behavior: Yatrivo can process incoming enquiries.
- Acceptance criteria: Leads can be viewed and exported.
- Dependencies: Lead storage implementation: [TO BE DEFINED]

#### FR-048 - Lead Statuses

- Description: Admin/CMS must support enquiry statuses: New, Contacted, Quoted, Confirmed, Cancelled, and Lost.
- Actor: Admin
- Expected behavior: Admin can track enquiry progression.
- Acceptance criteria: All documented statuses are available.
- Dependencies: Lead data model: [TO BE DEFINED]

#### FR-049 - CMS Marketing Controls

- Description: Admin/CMS must manage testimonials/reviews, homepage featured trips, and basic SEO fields: page title, meta description, slug, and OG image.
- Actor: Admin
- Expected behavior: Yatrivo can manage key marketing and SEO content.
- Acceptance criteria: Required controls exist.
- Dependencies: CMS implementation: [TO BE DEFINED]

#### FR-050 - Basic Dashboard

- Description: Admin/CMS must provide a basic dashboard for enquiries, confirmed bookings if booking data is implemented, and top packages.
- Actor: Admin
- Expected behavior: Admin can see basic operational indicators.
- Acceptance criteria: Dashboard reflects available implemented data.
- Dependencies: Dashboard metrics/data sources: [TO BE DEFINED]

### 2.12 Payments

#### FR-051 - Version 1 Payment Positioning

- Description: Version 1 is enquiry-first, and payment integration should be architecturally possible later.
- Actor: Yatrivo team / Future customer
- Expected behavior: Version 1 does not require instant checkout but does not block future payments.
- Acceptance criteria: Architecture can accommodate later payment capability.
- Dependencies: Future payment provider: [TO BE DEFINED]

#### FR-052 - Future Payment Capabilities

- Description: When ready, the system should support payment links/checkout, advance payment, balance payment, payment status, transaction reference, and downloadable receipt/invoice.
- Actor: Future customer / Admin
- Expected behavior: Future payment flow can be added.
- Acceptance criteria: Not required for Version 1 launch unless later explicitly scoped.
- Dependencies: Payment provider and booking model: [TO BE DEFINED]

### 2.13 Notifications

#### FR-053 - Admin Enquiry Notification

- Description: Admin must receive email notification for every new enquiry.
- Actor: Admin
- Expected behavior: Yatrivo is alerted when a lead arrives.
- Acceptance criteria: New enquiry triggers admin notification.
- Dependencies: Email service/provider: [TO BE DEFINED]

#### FR-054 - Customer Confirmation Notification

- Description: Customer should receive confirmation email/WhatsApp message after enquiry.
- Actor: Customer
- Expected behavior: Customer receives confirmation after submission.
- Acceptance criteria: Confirmation is sent or displayed through the chosen channel.
- Dependencies: Notification provider: [TO BE DEFINED]

#### FR-055 - Future Notification Automation

- Description: Optional WhatsApp Business/API automation and booking/payment confirmation should be supported later.
- Actor: Customer / Admin
- Expected behavior: Automation can be added when future scope requires it.
- Acceptance criteria: Not mandatory for Version 1 unless explicitly scoped.
- Dependencies: WhatsApp/API/payment integration: [TO BE DEFINED]

### 2.14 SEO & Marketing

#### FR-056 - SEO-Friendly Metadata

- Description: Website must support SEO-friendly URLs and editable metadata.
- Actor: Admin / Search engine
- Expected behavior: Pages can be optimized for search.
- Acceptance criteria: Package and destination pages support unique title and meta description.
- Dependencies: CMS implementation: [TO BE DEFINED]

#### FR-057 - Structured SEO Assets

- Description: Website must support schema markup where appropriate, XML sitemap, robots.txt, Google Search Console, Google Analytics/GA4 setup, and Open Graph/social sharing images.
- Actor: Search engine / Visitor
- Expected behavior: Search and social previews can understand key pages.
- Acceptance criteria: Required SEO assets are present when implemented.
- Dependencies: Final SEO setup: [TO BE DEFINED]

#### FR-058 - Image Optimization

- Description: Website must support fast-loading optimized WebP/AVIF images, responsive image sizes, CDN/caching where appropriate, and lazy loading below-the-fold images.
- Actor: Visitor
- Expected behavior: Visual pages load efficiently.
- Acceptance criteria: Images are optimized according to final implementation approach.
- Dependencies: Image pipeline/CDN decision: [TO BE DEFINED]

#### FR-059 - Internal Linking And Blog Readiness

- Description: Website must support internal linking between destinations, packages, and blog/content. Blog section should be CMS-ready even if not populated at launch.
- Actor: Visitor / Search engine / Admin
- Expected behavior: Content architecture supports SEO and future content.
- Acceptance criteria: Internal linking and CMS-ready blog capability are planned/supported.
- Dependencies: CMS/content architecture: [TO BE DEFINED]

#### FR-060 - Unsupported Review Markup Restriction

- Description: Review schema/markup must not be used for unsupported reviews.
- Actor: Search engine / Visitor
- Expected behavior: SEO markup remains truthful.
- Acceptance criteria: Review markup is used only when supported by genuine review data.
- Dependencies: Review verification process: [TO BE DEFINED]

### 2.15 Analytics & Conversion Tracking

#### FR-061 - Analytics Setup

- Description: Website must support GA4 and Google Search Console setup.
- Actor: Yatrivo team
- Expected behavior: Yatrivo can monitor traffic and search performance.
- Acceptance criteria: GA4 and Search Console are configured when account details are available.
- Dependencies: Account/property details: [TO BE DEFINED]

#### FR-062 - Conversion Tracking

- Description: Website must track WhatsApp clicks, enquiry submissions, phone clicks, package views, destination views, and payment/booking events when implemented.
- Actor: Yatrivo team
- Expected behavior: Yatrivo can measure conversion behavior.
- Acceptance criteria: Required events are trackable.
- Dependencies: Analytics event plan: [TO BE DEFINED]

#### FR-063 - Advertising Readiness And UTM Support

- Description: Website must be ready for Meta Pixel/Conversions API future advertising and support UTM tracking for Instagram/Meta/Google campaigns.
- Actor: Yatrivo team
- Expected behavior: Campaign traffic and future advertising conversions can be measured.
- Acceptance criteria: UTM parameters are preserved/available for reporting where applicable.
- Dependencies: Advertising account setup: [TO BE DEFINED]

### 2.16 Legal / Trust

#### FR-064 - Legal Pages

- Description: Website must include Privacy Policy, Terms & Conditions, Cancellation & Refund Policy, and Booking Terms.
- Actor: Visitor
- Expected behavior: Visitor can review legal and booking terms.
- Acceptance criteria: Required legal pages exist.
- Dependencies: Approved legal content: [TO BE DEFINED]

#### FR-065 - Cookie And Insurance Notices

- Description: Website must include cookie notice/consent where required and travel insurance disclaimer/recommendation.
- Actor: Visitor
- Expected behavior: Visitor sees required notices and recommendations.
- Acceptance criteria: Notices are present where applicable.
- Dependencies: Legal applicability: [TO BE DEFINED]

#### FR-066 - Company Details And Trust Claims

- Description: Website must include company/business details as legally applicable and must not claim government accreditation, tourism recognition, licenses, safety certifications, or reviews unless actually obtained/verified.
- Actor: Visitor
- Expected behavior: Trust information is accurate and supported.
- Acceptance criteria: No unsupported legal/trust claims are displayed.
- Dependencies: Verified company/business details: [TO BE DEFINED]

## 3. Business Rules

### BR-001 - Enquiry-First Version 1

Version 1 should use an enquiry-first workflow rather than a complex instant-booking engine.

### BR-002 - Starting Price Language

When final pricing depends on group size or season, display pricing as "starting from" rather than implying a fixed universal price.

### BR-003 - Genuine Reviews Only

Only genuine customer reviews should be displayed.

### BR-004 - No Unsupported Claims

Do not claim experience, review counts, accreditation, recognition, licenses, certifications, or other trust signals unless actually obtained/verified.

### BR-005 - Future Booking Architecture

The system should be modular enough to support future booking, payment, availability, customer-account, supplier/operations, and B2B capabilities.

### BR-006 - Custom Trip Planner Scope

The custom trip planner is Version 1 only if budget permits; it must not be treated as mandatory launch scope unless confirmed.

### BR-007 - Public Location Display

Business location and Google Maps should be displayed only if appropriate.

## 4. Non-Functional Requirements

### NFR-001 - Responsive Design

The website must be responsive across mobile, tablet, and desktop.

### NFR-002 - Mobile First

The website must be designed mobile-first because most initial traffic is expected from Instagram/WhatsApp.

### NFR-003 - Performance

The website should target strong Core Web Vitals and fast first load, lazy-load below-the-fold images, compress images, serve responsive image sizes, and use CDN/caching where appropriate.

### NFR-004 - Accessibility

The website must support accessible navigation, readable contrast, keyboard-friendly forms, and alt text.

### NFR-005 - Security

HTTPS/SSL is mandatory. Forms must be handled securely with server-side validation. Admin routes and customer data must be protected.

### NFR-006 - Reliability

Daily/automated backups are required if a database/CMS is used. Error logging and basic uptime monitoring should be supported.

### NFR-007 - Scalability

Architecture must support future expansion across India and future booking, payments, customer accounts, availability, supplier/operations, and B2B capabilities.

## 5. Future Requirements

### FUT-001 - Online Instant Booking

Online instant booking is a later feature, not a Version 1 must-have.

### FUT-002 - Payment Gateway

Payment gateway integration is future scope unless explicitly added to Version 1.

### FUT-003 - Customer Login

Customer login is future scope.

### FUT-004 - Wishlist

Wishlist capability is future scope.

### FUT-005 - Live Availability

Live availability is future scope.

### FUT-006 - Automated WhatsApp Workflows

Automated WhatsApp workflows are future scope.

### FUT-007 - Coupon Codes

Coupon code functionality is future scope.

### FUT-008 - Referral System

Referral system functionality is future scope.

### FUT-009 - Affiliate/B2B Portal

Affiliate/B2B portal functionality is future scope.

### FUT-010 - Supplier Management

Supplier management functionality is future scope.

### FUT-011 - Customer Dashboard

Customer dashboard functionality is future scope.

### FUT-012 - Dynamic Package Builder

Dynamic package builder functionality is future scope.

### FUT-013 - Future Payment Operations

Future payment capabilities may include payment links/checkout, advance payment, balance payment, payment status, transaction reference, and downloadable receipt/invoice.

### FUT-014 - Future Operations Workflow

Future operations direction may include supplier/operations workflows and B2B travel-agent support.

## 6. Initial Launch Packages

Suggested first launch packages, not immutable requirements:

- Rishikesh Weekend Escape - 2D/1N
- Kanatal Escape - 2D/1N
- Chakrata Escape - 2D/1N
- Chopta Adventure - 2D/1N or 3D/2N
- Kedarnath Journey - launch after operational readiness and applicable registrations/requirements

## 7. Homepage Reference Flow

Suggested Homepage Wireframe:

```text
HEADER
  |
HERO + CTA
  |
TRUST/USP STRIP
  |
FEATURED TRIPS
  |
WHY YATRIVO
  |
TRAVEL BY STYLE
  |
EXPLORE UTTARAKHAND
  |
HOW IT WORKS
  |
CUSTOMER REVIEWS
  |
INSTAGRAM / TRAVEL CONTENT
  |
FINAL CTA
  |
FOOTER
```

This sequence is a suggested homepage wireframe, not an irreversible implementation constraint.

## 8. Developer Deliverables

- Approved Figma/design system or equivalent before development.
- Responsive frontend.
- CMS/admin panel.
- Database/backend/API where required.
- Production deployment.
- Domain/SSL configuration.
- Analytics/Search Console setup.
- Technical SEO.
- Admin/user documentation.
- Source code handover.
- Deployment credentials/ownership under Yatrivo.
- 30-day post-launch bug-fix period.

## 9. Assumptions

No speculative assumptions are recorded. Unknown items are listed under Open Questions.

## Open Questions

- Approved stack: Next.js + React + TypeScript frontend on Vercel; TypeScript backend/API on Render; PostgreSQL on Neon; Prisma ORM; modular monolith architecture.
- Exact backend framework/library: [TO BE DEFINED]
- CMS/admin implementation details: [TO BE DEFINED]
- Payment provider for future scope: [TO BE DEFINED]
- Final domain: [TO BE DEFINED]
- Final business email: [TO BE DEFINED]
- Final legal/company details: [TO BE DEFINED]
- Approved Figma/design system: [TO BE DEFINED]
- Approved brand assets and colors: [TO BE DEFINED]
- Whether custom trip planner is included in Version 1 budget: [TO BE DEFINED]
- Whether business location/Google Maps should be public: [TO BE DEFINED]

## 10. Requirement Traceability

Future implementation should link requirements through this structure:

```text
Requirement
  |
Product area
  |
User flow
  |
Figma screen
  |
Component
  |
Implementation
  |
Test
```

| Requirement | Product Area | User Flow | Figma Screen | Component | Implementation | Test |
|-------------|--------------|-----------|--------------|-----------|----------------|------|
| [TO BE DEFINED] | [TO BE DEFINED] | [TO BE DEFINED] | [TO BE DEFINED] | [TO BE DEFINED] | [TO BE DEFINED] | [TO BE DEFINED] |


