You are working on the existing Yatrivo travel website prototype/design.

IMPORTANT:
This is an existing design that has already been reviewed by the client/founder and is broadly approved. DO NOT redesign the entire website from scratch.

Your primary objective is to refine and extend the existing design according to the requirements below while preserving the existing visual identity, layout language, components, spacing, typography, colors, cards, navigation style, animations, and overall structure wherever possible.

GENERAL RULE:
If a requirement can be satisfied by making a small modification to the existing component/page, do that instead of replacing or redesigning the entire component.

Do not introduce unnecessary pages, features, forms, filters, fields, authentication, or UI elements.

The final result should feel like the SAME Yatrivo website after a professional product refinement, not like a completely different website.

==================================================
1. CORE PRODUCT VISION
==================================================

Yatrivo is a travel discovery, trip inquiry, booking-management, and travel-experience platform.

The website is primarily marketed through Instagram and other social media.

A user arriving from Instagram should be able to:

Explore the website
→ Discover destinations
→ Explore available trips/packages
→ View trip details
→ Submit an inquiry
→ Provide traveler information
→ Receive confirmation
→ Continue communication with Yatrivo through WhatsApp

WITHOUT creating an account or logging in.

The website is NOT a social-media/account platform.

The user does NOT need:
- Login
- Signup
- User profile
- Password
- OTP login
- Google login
- User dashboard
- Personal account
- Saved trips tied to an account
- User-specific website history

The ADMIN is the central operator of the system.

Admin manages:
- Destinations
- Trips/packages
- Available trip instances/dates
- Homepage
- Homepage carousel
- Travel With Us page
- Completed trips
- Inquiries
- Bookings
- Reviews
- Review requests
- Gallery/media
- Relevant website content

The website should therefore be designed around:
DESTINATIONS → TRIPS → INQUIRIES → BOOKINGS → COMPLETED TRIPS → REVIEWS

==================================================
2. REMOVE USER LOGIN COMPLETELY
==================================================

Remove the existing user login/account concept completely.

Remove:
- Login page
- Login card
- Signup
- Mobile login
- OTP login
- Google login
- User profile
- User dashboard
- User account settings
- User-specific saved/favourite functionality if it requires an account
- User credentials
- User identity information displayed in admin purely because of website authentication

Do not merely hide these elements.

Where possible, remove their dependency from the UX structure as well.

The user should be able to browse and submit inquiries without authentication.

Do not introduce any new login requirement during:
- Destination browsing
- Trip browsing
- Inquiry
- Plan My Trip
- Raise Query
- Review submission

Reviews will also work without website login.

==================================================
3. REMOVE "TRAVEL STYLE" COMPLETELY
==================================================

Travel Style is permanently removed from the product.

The old categories such as:
- Solo
- Couple
- Family
- Trekking
- Hiking
etc.

must no longer exist.

Remove them from:
- Homepage
- Footer
- Destination pages
- Trip pages
- Forms
- Plan My Trip
- Trip cards
- Admin trip management
- Admin trip filters
- Admin search/filter UI
- Tags
- Badges
- Metadata
- Any recommendation logic
- Any travel-style dropdown
- Any travel-style API/data representation if represented in the prototype

Do not leave empty spaces or references to the old system.

==================================================
4. NAVIGATION / NAVBAR
==================================================

The navbar is a global component.

Its behavior must be consistent across the entire website.

IMPORTANT BUG TO FIX:

Currently the navbar behaves correctly when the user reaches the Destinations page through one route, but behaves differently when the same page is reached from another location.

This must be fixed.

Navbar behavior must depend on the CURRENT PAGE/ROUTE, not on where the user came from.

For example:

Homepage → Destinations
Travel With Us → Destinations
Past Trips → Destinations
Trip Detail → Destinations

should all result in the exact same Destinations page and navbar behavior.

Apply this consistently to every page.

The navbar should have the same:
- Transparency behavior
- Background behavior
- Text contrast
- Scroll behavior
- Active state
- Logo treatment
- Tagline treatment

regardless of navigation source.

Do not create page-specific hacks.

--------------------------------------------------
NAVBAR ON IMAGE VS NON-IMAGE PAGES
--------------------------------------------------

The existing design has a transparent navbar over hero imagery and a different appearance on non-image/solid sections.

Preserve this concept.

However, make it global and consistent.

For image/hero pages:
- Navbar may remain transparent over the hero.
- Text must remain readable.
- Logo must remain readable.
- Tagline must remain readable.

For non-image pages:
- Use the existing solid/non-transparent navbar behavior already established in the design.

Do not unnecessarily redesign the navbar.

--------------------------------------------------
BRAND TAGLINE
--------------------------------------------------

The brand tagline currently appears underneath the logo.

When the navbar is transparent over an image, the tagline can become difficult to read depending on the background image.

Fix this without destroying the visual style.

The tagline should:
- Remain clearly visible
- Maintain proper contrast
- Work over different hero images
- Work on both transparent and solid navbar states
- Remain visually connected to the logo

Use a subtle readability solution if necessary, such as:
- Appropriate contrast
- Subtle gradient/backdrop
- Carefully controlled text treatment
- Small translucent brand background

Do NOT create a large distracting box behind the logo.

The solution should feel native to the existing design.

==================================================
5. HOMEPAGE
==================================================

Preserve the existing homepage structure unless a specific change below requires modification.

Do not redesign unrelated homepage sections.

The homepage should focus on:
- Brand introduction
- Destinations
- Upcoming/current trips
- Promotional carousel
- Travel With Us / experience
- Highlights
- Featured reviews
- Relevant calls to action

==================================================
6. HOMEPAGE CAROUSEL
==================================================

The existing carousel is currently too static/hardcoded.

Convert it into an admin-managed dynamic carousel while preserving the current visual design.

The carousel should support TWO kinds of slides:

A. Trip-linked carousel slides
B. Static promotional carousel slides

--------------------------------------------------
TRIP-LINKED SLIDE
--------------------------------------------------

Example:

Kedarnath Adventure
20–25 October
₹12,999/person

Buttons:
- Explore Trip
- Inquire Now

The slide should be linked to an actual existing trip/package.

Admin should NOT manually paste URLs when an existing trip can be selected.

Admin should have something like:

Link To:
- None / Custom
- Destination
- Trip

If Trip is selected:
- Show a dropdown/list of existing trips
- Admin selects the relevant trip

This should prevent broken links.

--------------------------------------------------
STATIC SLIDE
--------------------------------------------------

Static promotional slides are not necessarily associated with a trip.

For example:

"Discover the Mountains Differently"

Custom description

Buttons can be:
- Explore
- Discover
- Learn More
- Any appropriate CTA

The text must NOT be fixed across all static slides.

Every carousel slide should allow its own:
- Image
- Heading
- Description
- Button text
- Button action
- Optional second button
- Link/action
- Ordering
- Active/inactive state

The admin should be able to write custom content for each slide.

Do not force the same text/button configuration onto every slide.

--------------------------------------------------
CAROUSEL ADMIN UX
--------------------------------------------------

Admin should be able to:
- Add carousel slide
- Edit carousel slide
- Delete/deactivate slide
- Reorder slides
- Upload/select image
- Add custom text
- Configure CTA
- Link to a destination/trip if required
- Preview slide

When adding an image, DO NOT ask the admin to paste an image URL.

Use the central Gallery/Media Library described below.

==================================================
7. IMAGE / MEDIA LIBRARY
==================================================

Create/use a centralized Gallery/Media Library concept.

Whenever an admin is asked to select an image anywhere in the admin UI, the interface should provide:

[ Choose from Gallery ]

[ Upload New ]

Do NOT unnecessarily ask for image URLs.

If an admin uploads a new image anywhere in the system, that image should become available in the central Gallery.

Images can originate from:
- Admin uploads
- Homepage
- Carousel
- Destinations
- Trips
- Completed trips
- Travel With Us
- Reviews
- Customer/reviewer uploads

All should be discoverable through the Gallery.

--------------------------------------------------
GALLERY ORGANIZATION
--------------------------------------------------

Do not make the gallery an unorganized giant image dump.

Provide useful filters/categories/folders.

Possible categories:
- All
- Homepage
- Destinations
- Trips
- Completed Trips
- Reviews
- Travel With Us

Use contextual filters where appropriate.

For example:
Destination → Kedarnath
Trip → Kedarnath — 15 May 2026

Each image should retain useful metadata such as:
- Source
- Associated destination
- Associated trip
- Associated review if applicable
- Upload date
- Uploaded by

Customer/reviewer photos should remain associated with their review/trip.

Do not unnecessarily expose technical metadata to normal website users.

--------------------------------------------------
REVIEWER UPLOADED PHOTOS
--------------------------------------------------

Photos uploaded by reviewers should also enter the central gallery.

However, distinguish them as review/customer media.

They should be associated with:
- Review
- Completed trip
- Destination

Pending/unapproved review media should not automatically become publicly visible.

==================================================
8. REMOVE / REPLACE "WHY TRAVEL WITH US"
==================================================

The existing "Why Travel With Us" homepage section should remain editable/admin-managed.

However, clicking it should take the user to a dedicated:

TRAVEL WITH US

page.

This page should be much richer and fully customizable.

==================================================
9. TRAVEL WITH US PAGE
==================================================

The Travel With Us page should be an admin-managed content page.

Do not hardcode the entire page structure so that the admin cannot update it.

The founder wants the page to communicate:
- Why travel with Yatrivo
- Company credibility
- Highlights
- Real completed trips
- Real traveler experiences
- Visual proof

Recommended flow:

1. HERO
2. WHY YATRIVO / CREDIBILITY
3. HIGHLIGHTS
4. CUSTOM IMAGE + TEXT CONTENT
5. LATEST COMPLETED TRIPS
6. FINAL CTA

--------------------------------------------------
HERO
--------------------------------------------------

Admin can control:
- Hero image
- Heading
- Description
- Optional CTA

--------------------------------------------------
CREDIBILITY
--------------------------------------------------

Show company credibility such as:
- Experience
- Safety
- Local knowledge
- Authentic experiences
- Carefully planned trips
etc.

Exact content should be admin-controlled.

--------------------------------------------------
HIGHLIGHTS
--------------------------------------------------

Admin-managed highlight cards/statistics.

Examples:
- Trips completed
- Travelers
- Destinations
- Years/experience
etc.

Do not invent actual numbers.

Use editable fields.

--------------------------------------------------
CUSTOM CONTENT BLOCKS
--------------------------------------------------

Allow admin to add image + text sections.

For example:

[Image] [Text]

then:

[Text] [Image]

The admin should be able to:
- Add section
- Select/upload image
- Add heading
- Add description
- Reorder sections
- Remove section

Use the central Gallery.

--------------------------------------------------
LATEST COMPLETED TRIPS
--------------------------------------------------

Show approximately 2–3 latest completed trips.

Each card can show:
- Cover image
- Destination
- Trip name
- Trip date
- Short description
- Optional rating/review information

Include:

[See All Completed Trips]

This opens the dedicated Completed Trips page.

==================================================
10. COMPLETED TRIPS PAGE
==================================================

Create a dedicated page for all completed trips.

The page should allow users to browse Yatrivo's past experiences.

Show completed trips with:
- Cover image
- Destination
- Trip name
- Actual trip date
- Short description
- Relevant information

Clicking a completed trip opens its dedicated Past Trip Detail page.

The completed trip page should contain:
- Trip details
- Actual trip date
- Gallery
- Photos
- Highlights
- Relevant itinerary/details
- Traveler reviews belonging to that trip

Do NOT categorize reviews arbitrarily across unrelated destinations/trips.

A review belongs to the actual completed trip from which it originated.

==================================================
11. NAVBAR: COMPLETED TRIPS
==================================================

The existing Plan My Trip navbar item may no longer be necessary.

Plan My Trip should instead be a prominent CTA throughout the website.

Use the navigation space for a discovery-oriented page such as:

Past Trips

or

Our Trips

Prefer a clear label that communicates completed travel experiences.

The exact navbar should preserve the existing structure and styling rather than being unnecessarily redesigned.

==================================================
12. DESTINATION DETAIL PAGE
==================================================

Destination pages remain important.

A destination can have multiple individual trip/package instances.

For example:

Kedarnath
- Kedarnath — 15 October
- Kedarnath — 25 October
- Kedarnath — 5 November

The destination page can display:
- Destination information
- Images
- Current/upcoming trips
- Relevant CTAs
- Past trip information where appropriate

When a specific completed trip is selected, open that completed trip's detail page.

==================================================
13. PLAN MY TRIP
==================================================

IMPORTANT CHANGE:

Plan My Trip is NOT a custom-trip generator.

It is a structured inquiry/booking process for EXISTING YATRIVO TRIPS/PACKAGES.

The user chooses from trips that already exist.

--------------------------------------------------
FLOW
--------------------------------------------------

Plan My Trip
↓
Select Destination
↓
Select Trip/Package + Date as ONE combined option
↓
Select Number of Travelers
↓
Enter traveler details
↓
Enter travel planner/contact details
↓
Review information
↓
Inquire Now

--------------------------------------------------
PACKAGE + DATE
--------------------------------------------------

A package instance has ONE date.

Do NOT make the user separately select:
- Package
- Date

Instead, one selectable trip represents both.

Example:

Kedarnath — 20 October 2026
5 Days / 4 Nights
₹12,999/person

Another:

Kedarnath — 28 October 2026
5 Days / 4 Nights
₹12,999/person

If the admin wants the same package again on a new date, the admin can duplicate the existing package and modify the new trip's date/details.

Preserve this existing logic.

--------------------------------------------------
PRICING
--------------------------------------------------

Show a static per-person package price decided by Admin.

Example:

₹12,999 / person

The website does NOT need to calculate negotiated/final pricing.

The price shown on the website is the package's displayed price.

Actual negotiation/final amount can happen through WhatsApp.

Do not introduce accommodation preference into the Plan My Trip form.

--------------------------------------------------
TRAVELER DETAILS
--------------------------------------------------

If user selects 3 travelers, dynamically show:

Traveler 1:
- Name
- Age
- Gender

Traveler 2:
- Name
- Age
- Gender

Traveler 3:
- Name
- Age
- Gender

Every traveler must have these details.

--------------------------------------------------
TRAVEL PLANNER / PRIMARY CONTACT
--------------------------------------------------

Retain the existing contact/travel-planner fields already present in the current design.

The primary travel planner should provide the contact details needed for communication, especially mobile number.

Do not remove useful existing contact fields unless they are redundant.

Do not add unnecessary fields without a business requirement.

==================================================
14. INQUIRE NOW
==================================================

The final CTA should be:

INQUIRE NOW

When clicked:
- Preserve the existing custom confirmation/message UI already implemented.
- Do not remove that existing interaction unnecessarily.

After submission:
1. Save inquiry in database.
2. Show inquiry in Admin → Inquiries.
3. Send notification to Admin through WhatsApp Business Platform/API.
4. Optionally/appropriately send automated acknowledgement to customer.
5. User's WhatsApp must NOT open.
6. User does NOT manually send a WhatsApp message.

==================================================
15. WHATSAPP BUSINESS PLATFORM / API
==================================================

Yatrivo will use the third approach:

WhatsApp Business Platform / Cloud API or an equivalent API provider.

The desired flow is:

User
↓
Yatrivo website
↓
Inquiry submitted
↓
Yatrivo backend
├── Save inquiry
├── Admin dashboard
└── WhatsApp Business API
        ↓
Yatrivo/Admin WhatsApp
        ↓
Admin

The customer's WhatsApp does not open.

The customer does not press Send.

--------------------------------------------------
ADMIN NOTIFICATION
--------------------------------------------------

Admin WhatsApp notification should contain useful inquiry information, such as:

New Inquiry — Yatrivo

Inquiry ID
Customer name
Customer phone number
Destination
Selected trip/package
Trip date
Number of travelers
Traveler details
Displayed package price
Relevant planner/contact details

Include a link/deep link to the relevant Admin Panel inquiry if supported by the implementation.

--------------------------------------------------
CUSTOMER ACKNOWLEDGEMENT
--------------------------------------------------

The system should support an immediate automated WhatsApp acknowledgement.

Example concept:

Thank you for your inquiry with Yatrivo.
We have received your request for [Trip].
Our team will contact you shortly.
Inquiry ID: [ID]

The exact message should be editable/template-based where appropriate.

Follow WhatsApp Business Platform messaging/template/consent requirements.

==================================================
16. RAISE A QUERY
==================================================

Raise Query should also use the API-based approach.

The user should be able to submit a query directly on the website.

Do NOT redirect them to WhatsApp.

Form should include:
- Name
- Mobile number
- Query/message

Use any existing useful fields already present, but remove unnecessary fields.

On submission:
- Save query in database
- Show it in Admin
- Send WhatsApp notification to Admin through API
- Optionally send customer acknowledgement through WhatsApp

If the query was initiated from a specific destination/trip page, preserve relevant context where useful.

==================================================
17. ADMIN INQUIRIES
==================================================

There are two types of inquiries:

A. Website-generated inquiries
B. Manually added inquiries from WhatsApp/phone/offline conversations

Admin needs:

[+ Add Inquiry]

This allows the admin to manually enter inquiries that originated outside the website.

This prevents WhatsApp/phone inquiries from being lost.

The Inquiry section should be the central record.

==================================================
18. REMOVE ADMIN NOTIFICATION SECTION
==================================================

Remove the separate Notifications section from Admin.

It is unnecessary.

Instead, new/unread inquiries should be indicated directly on the Inquiry navigation item.

Example:

Inquiries •
or
Inquiries [3]

The exact visual treatment should match the existing design.

Opening/viewing the inquiry can clear its unread state according to the existing UX.

Do not create a separate notification dashboard.

==================================================
19. ADMIN TRIPS
==================================================

Remove all travel-style filters/tags.

Admin trip management should instead be based on relevant entities such as:
- Destination
- Trip/package
- Date
- Status
- Availability
etc.

Preserve existing useful filters.

Do not introduce unnecessary filtering systems.

==================================================
20. BOOKING SYSTEM
==================================================

Booking does NOT happen directly through the website.

The process is:

Website inquiry
↓
Admin contacts customer / negotiates through WhatsApp
↓
Booking is finalized outside the website
↓
Admin records booking in Admin

--------------------------------------------------
TWO WAYS TO CREATE BOOKING
--------------------------------------------------

A. Convert Inquiry → Booking

Admin opens an inquiry and clicks:

[Convert to Booking]

Existing relevant inquiry information should be carried into the booking.

B. Add Booking Manually

Admin can use:

[+ Add Booking]

for bookings that originated directly through WhatsApp/phone/offline.

--------------------------------------------------
BOOKING DATA
--------------------------------------------------

Booking can contain:

Booking number
Booking status
Package/trip
Destination
Trip date
Booking date
Final/negotiated amount if required
Payment status if required
Primary customer/contact details
Traveler/passenger details

The admin may collect complete traveler information separately through WhatsApp after the booking is confirmed and manually enter it into the booking.

Do not force the website user to provide every booking-level detail during initial inquiry.

==================================================
21. TRIP COMPLETION
==================================================

Admin can mark a booking/trip as:

COMPLETED

Once completed, the trip becomes eligible for review-request management.

IMPORTANT:

Do NOT automatically send a review request when the trip becomes completed.

Instead:

Trip completed
↓
Admin sees:
[Ask for Review]

Admin decides when to send the review request.

The option should remain available until the admin chooses to send it.

==================================================
22. REVIEW REQUEST SYSTEM
==================================================

Review requests are sent through WhatsApp Business Platform/API.

The admin should be able to:
- Select travelers/customers
- Use default template
- Customize message
- Insert dynamic variables
- Include one optional image
- Insert automatically generated review link
- Send review request

--------------------------------------------------
DYNAMIC VARIABLES
--------------------------------------------------

Provide an "Insert Variable" menu.

Possible variables:
- Customer Name
- Destination
- Trip Name
- Trip Date
- Booking Number
- Review Link

Example:

Dear @customer_name,

Thank you for travelling with Yatrivo to @destination on @trip_date.

We would love to hear about your experience.

@review_link

Team Yatrivo

When sent to an actual customer, variables are replaced with real data.

--------------------------------------------------
REVIEW LINK
--------------------------------------------------

The review link is automatically generated by the system.

The admin should NOT need to manually copy/paste the link.

The editor should expose a:

@review_link

placeholder.

The admin can insert the placeholder wherever desired.

CRITICAL VALIDATION:

The review request MUST NOT be sent unless @review_link is included in the final message.

The Send button should remain disabled or show a validation error until the link is present.

The link should open the correct review form for the correct customer/trip without requiring login.

--------------------------------------------------
IMAGE ATTACHMENT
--------------------------------------------------

Allow the admin to optionally attach ONE image to the review request.

Image can be:
- Selected from Gallery
- Newly uploaded

Do not require an image.

==================================================
23. REVIEW FORM
==================================================

Customer receives WhatsApp review request.

They click the review link.

Review page opens WITHOUT login.

The review form should support:
- Star rating
- Written review/message
- Review photos
- Relevant basic information
- Submit

Do not add unnecessary user-account fields.

The review should automatically be associated with:
- Customer/traveler
- Completed trip
- Destination
- Trip date

The customer should not need to manually choose the trip.

==================================================
24. REVIEW APPROVAL
==================================================

Reviews are NOT automatically published.

Flow:

Customer submits review
↓
Admin receives review
↓
Admin reviews it
↓
Approve / Reject
↓
Approved review becomes eligible for display

Review photos follow the same moderation principle.

==================================================
25. REVIEW DISPLAY
==================================================

Reviews belong to the specific trip from which they originated.

Do NOT allow arbitrary cross-destination assignment.

Example:

Kedarnath trip review
→ Kedarnath completed trip
→ Relevant Kedarnath trip review display

It should not appear as a Badrinath trip review.

--------------------------------------------------
INDIVIDUAL REVIEW
--------------------------------------------------

Display:
- Star rating
- Review text
- Reviewer name where appropriate
- Trip name
- Trip date
- Review posted date
- Review photos

Example:

★★★★★
Amazing experience...

Rahul Sharma

Kedarnath
Trip: 15 May 2026
Reviewed: 22 May 2026

--------------------------------------------------
REVIEW PHOTO GALLERY
--------------------------------------------------

Use an Amazon-like concept.

There can be:
A. A collective gallery of photos submitted through reviews
B. Individual photos displayed within their respective reviews

The same photo may therefore be discoverable from the review-photo gallery and the individual review.

Do not divide the public review interface into separate categories for every departure date.

Instead, show useful trip/date context in the UI.

==================================================
26. HOMEPAGE FEATURED REVIEWS
==================================================

Homepage reviews are controlled separately from trip review display.

There should be a:

Homepage Management → Featured Reviews

section.

Admin selects which approved reviews should appear on the homepage.

This is NOT a generic "Show on destination" setting.

Do not create toggles such as:
- Show on Kedarnath
- Show on Badrinath

A review belongs to its actual trip.

Homepage featuring is a separate editorial/content-management decision.

==================================================
27. ABOUT US
==================================================

Audit the current About Us section.

Remove unnecessary/redundant fields.

Keep the existing visual structure where possible.

Only retain content that serves the actual company/travel brand story.

Make relevant content editable through Admin.

Do not add complex CMS functionality if the current design can be made editable with minimal changes.

==================================================
28. ADMIN HOME PAGE MANAGEMENT
==================================================

Homepage Management should control relevant homepage content.

When an image is required:
DO NOT request image URLs.

Use:

[Choose from Gallery]
[Upload New]

Where appropriate, homepage management should control:
- Carousel
- Hero imagery
- Text
- Highlights
- Featured reviews
- Other existing editable sections

Do not duplicate the Gallery system.

==================================================
29. CONTENT EDITOR PRINCIPLE
==================================================

Across the admin UI, follow this principle:

If a content element is already represented visually on the website, give Admin a simple way to edit it.

Do not make Admin interact with:
- Raw URLs unnecessarily
- Technical IDs
- Code
- Complex configuration
- Database-like interfaces

Prefer:
- Dropdowns
- Gallery selectors
- Toggles
- Drag/reorder
- Text fields
- Rich text where appropriate
- Preview
- Clear Save/Publish actions

==================================================
30. IMPORTANT DATA RELATIONSHIPS
==================================================

Maintain these conceptual relationships:

Destination
↓
Trip/Package Instance
↓
Inquiry
↓
Booking
↓
Completed Trip
↓
Review Request
↓
Review

A completed trip has:
- Date
- Photos
- Reviews

A review belongs to:
- One specific completed trip
- One customer/traveler context

A booking contains:
- Primary customer
- Travelers
- Trip/package
- Trip date
- Booking information
- Mobile numbers

This allows the system to identify whom to send review requests to.

==================================================
31. UX PRINCIPLES
==================================================

The entire website should feel:

- Simple
- Fast
- Visual
- Travel-focused
- Trustworthy
- Mobile-friendly
- Instagram-friendly
- Low-friction

The user should never feel forced into account creation.

Avoid excessive forms.

Avoid unnecessary fields.

Avoid unnecessary popups.

Avoid unnecessary navigation.

Use strong CTAs:
- Explore
- View Trip
- Inquire Now
- Plan My Trip
- Past Trips
- Read Reviews

Do not create friction between discovery and inquiry.

==================================================
32. MOBILE-FIRST CONSIDERATIONS
==================================================

A large percentage of users may arrive from Instagram on mobile.

Therefore:
- Preserve the existing responsive design
- Ensure carousel works naturally on mobile
- Ensure CTA buttons are accessible
- Ensure inquiry forms are comfortable on mobile
- Ensure traveler fields don't become confusing
- Ensure navbar works correctly on all pages
- Ensure transparent navbar remains readable
- Ensure tagline remains readable
- Ensure galleries are touch-friendly
- Ensure review forms are easy to complete

Do not sacrifice the existing desktop design.

==================================================
33. DO NOT CHANGE UNRELATED STRUCTURE
==================================================

This is extremely important.

Do NOT:
- Rebuild the website from scratch
- Replace the visual identity
- Change the overall color system without reason
- Replace typography without reason
- Replace the existing card design
- Replace the entire navbar
- Introduce a new design language
- Add unnecessary dashboard modules
- Add authentication
- Add travel styles
- Add unnecessary booking/payment functionality
- Add unnecessary filters
- Add unnecessary user accounts

When a requirement can be fulfilled by:
- Editing an existing component
- Adding one field
- Adding one button
- Adding a dropdown
- Connecting an existing page
- Reusing an existing card
- Adding a modal
- Adding a small section

DO THAT.

Only introduce a new page/component when the UX genuinely requires it.

==================================================
34. REQUIRED GLOBAL FLOW
==================================================

The final website should support this high-level user journey:

Instagram
↓
Yatrivo Homepage
↓
Explore Destinations / Trips / Travel With Us / Past Trips
↓
Destination
↓
Available Trips
↓
Trip Detail
↓
Inquire Now
↓
Plan My Trip / Inquiry
↓
Select Trip + Date as one entity
↓
Select number of travelers
↓
Enter traveler names/ages/genders
↓
Enter travel planner/contact details
↓
Review
↓
Inquire Now
↓
Inquiry saved
↓
Admin receives WhatsApp notification
↓
Customer receives acknowledgement
↓
Admin communicates/negotiates through WhatsApp
↓
Booking created by Admin
↓
Trip occurs
↓
Admin marks trip completed
↓
Admin decides when to request reviews
↓
WhatsApp review request
↓
Customer opens secure review link
↓
Customer submits review/photos
↓
Admin approves review
↓
Review appears on its associated trip
↓
Admin may additionally feature approved review on homepage