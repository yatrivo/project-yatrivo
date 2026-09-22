You are continuing work on the EXISTING Yatrivo website/prototype.

This is NOT a request to redesign the website from scratch.

The existing visual design, branding, layout language, typography, colors, spacing, cards, animations, component style, and overall structure are already approved by the client/founder.

Your job in this run is to:

1. AUDIT the entire existing project against the requirements below.
2. Identify every requirement that is missing, partially implemented, incorrectly implemented, or inconsistent.
3. IMPLEMENT all required corrections.
4. After implementation, perform a SECOND INTERNAL AUDIT of the entire project.
5. Fix anything that the first implementation missed.
6. Perform a FINAL CONSISTENCY CHECK across all pages, navigation paths, admin screens, forms, components, and content-management interfaces.

DO NOT stop after making the obvious changes.

DO NOT simply tell me what is missing.

ACTUALLY IMPLEMENT THE CHANGES.

IMPORTANT EXECUTION RULE:

Preserve the existing website wherever possible.

If a requirement can be solved by modifying an existing component, modify it.

If an existing page can be extended, extend it.

If an existing component can be reused, reuse it.

DO NOT rebuild unrelated pages.

DO NOT replace the entire design system.

DO NOT create a completely new visual design.

Only introduce new pages/components when they are genuinely required by the requirements below.

The final result should look like the current Yatrivo website after a thorough professional refinement, NOT like a new website.

Yatrivo is a travel discovery, trip inquiry, booking-management, completed-trip, and review platform.

There is NO user account system.

Users coming from Instagram should be able to immediately explore the website and inquire about trips without logging in.

The website should NOT require:

* Login
* Signup
* OTP login
* Google login
* User profile
* User dashboard
* Password
* User account
* User-specific saved/favourite functionality that requires authentication

Remove the login concept COMPLETELY, not just visually.

Audit the entire project for remnants of authentication/user-account assumptions.

Remove:

* Login page
* Login cards
* Login buttons
* Signup
* User profile
* User credentials
* User dashboard
* Authentication-dependent UI
* Any unnecessary "current user" concepts in the user-facing UX

Do not introduce a login anywhere else.

Reviews also do NOT require login.

Travel Style is permanently removed.

Remove all references to categories such as:

* Solo
* Couple
* Family
* Trekking
* Hiking
  and any similar travel-style categorization.

Perform a GLOBAL audit.

Remove travel style from:

* Homepage
* Footer
* Destination pages
* Trip pages
* Trip cards
* Forms
* Plan My Trip
* Admin
* Admin filters
* Admin tags
* Admin badges
* Search/filter interfaces
* Any metadata
* Any UI labels
* Any recommendation logic
* Any old travel-style components

Do not leave empty placeholders.

The navbar must behave consistently across the entire application.

There is currently a bug where the navbar behaves correctly when Destinations is opened from one route but behaves differently when the same page is reached from another route.

FIX THIS GLOBALLY.

==================================================
CRITICAL GLOBAL AUDIT — DO THIS ACROSS THE ENTIRE PROJECT
==================================================

Before implementing individual features, perform a GLOBAL CROSS-SYSTEM AUDIT.

Do not only check whether the admin UI contains a field.

For EVERY admin-editable field/content item, verify that:

ADMIN FIELD
↓
actually controls
↓
the corresponding PUBLIC WEBSITE UI element.

And conversely:

PUBLIC WEBSITE ELEMENT
↓
if it is supposed to be dynamic/editable
↓
must have a corresponding ADMIN control.

This synchronization must be verified across the ENTIRE project.

Examples of problems you MUST detect and fix:

- Admin can edit text that is not displayed anywhere on the actual website.
- Admin can upload/select an image that is not used by the corresponding UI.
- Admin can edit a button that does not exist on the public page.
- Admin can manage a section that is not actually rendered.
- Public UI contains hardcoded content that Admin is supposed to control.
- Admin has fields for obsolete features.
- Admin has duplicate controls for the same content.
- Admin has controls whose changes do not affect the public UI.
- Public UI shows content that cannot be managed from Admin even though it is intended to be dynamic.
- Admin preview and actual public rendering do not match.
- Admin can select an entity that cannot actually be linked/displayed.
- Admin can configure a carousel slide whose configured CTA does not work.
- Admin can manage reviews that are not actually displayed according to the configured rules.
- Admin can manage images using URLs even though the website uses the Gallery.
- Admin can edit content that belongs to an old/removed feature.

For EVERY editable page/section, verify the complete chain:

ADMIN INPUT
→ STORED CONTENT
→ PAGE COMPONENT
→ ACTUAL USER-FACING DISPLAY

Do not consider a feature complete merely because the Admin UI has been created.

The actual public website must consume and display the corresponding data.

Likewise, do not leave orphaned Admin fields.

If an Admin field has no real purpose or no corresponding public UI element, REMOVE IT.

==================================================
IMAGE MANAGEMENT — GLOBAL, NOT PARTIAL
==================================================

Perform a GLOBAL search through the entire Admin interface for ANY image-related field.

Look for:
- Image URL
- Image link
- Image source URL
- Paste image URL
- Enter image URL
- Background image URL
- Cover image URL
- Thumbnail URL
- Hero image URL
- Gallery image URL
- Review image URL
- Carousel image URL
- Destination image URL
- Trip image URL
- Any similar URL-based image input

Every appropriate image input must use the same user-friendly media workflow:

[ Choose from Gallery ]
[ Upload New ]

The admin should NEVER need to manually paste an image URL for normal website content management.

This applies EVERYWHERE, including but not limited to:

- Homepage
- Homepage hero
- Homepage sections
- Homepage carousel
- Static carousel slides
- Trip-linked carousel slides
- Destinations
- Destination detail pages
- Trips
- Trip/package cards
- Completed trips
- Completed trip detail pages
- Travel With Us
- Custom content blocks
- About Us
- Reviews
- Review request image
- Any promotional section
- Any admin-created content block

If the same type of image selection is required in multiple places, reuse the SAME Gallery/Media Picker component and interaction pattern.

Do not implement Gallery selection in one place and leave URL inputs in another.

After implementation, perform another global search to verify that no obsolete image URL input remains where Gallery/Upload should be used.

==================================================
NAVBAR — DEEP ROUTE-BY-ROUTE AUDIT
==================================================

Do not simply verify that the navbar exists.

Test/inspect the navbar behavior on EVERY relevant page type.

The navbar has multiple visual states depending on whether the page begins with a large image/hero or a non-image/solid section.

Verify all of these states:

1. Transparent navbar over hero image
2. Solid navbar
3. Navbar after scrolling
4. Mobile navbar
5. Desktop navbar
6. Pages with image hero
7. Pages without image hero
8. Pages with different image brightness
9. Pages reached directly
10. Pages reached through internal navigation

The navbar behavior must be determined by the CURRENT PAGE'S actual design/state.

It must NOT depend on which page the user came from.

Test examples:

Homepage → Destinations
Travel With Us → Destinations
Past Trips → Destinations
Trip Detail → Destinations
Completed Trip → Destinations
Any CTA → Destinations

The resulting Destinations page must behave identically in every case.

Do the same verification for other pages.

IMPORTANT:

Do not assume that because the navbar looks correct on one page it is globally correct.

Inspect the actual reusable navbar component and the page-level conditions controlling it.

Fix the underlying shared behavior rather than creating individual page-specific patches.

==================================================
NAVBAR ELEMENTS — COMPLETE AUDIT
==================================================

Verify every navbar element:

- Logo
- Brand tagline
- Navigation links
- Active page state
- CTA buttons
- Mobile menu
- Dropdowns if present
- Background
- Transparency
- Text color
- Visibility
- Scroll behavior

Make sure the elements themselves are also logically consistent with the NEW information architecture.

For example:
- Login must not exist.
- Travel Style must not exist.
- Obsolete Plan My Trip navigation item should be reviewed.
- Past Trips/appropriate replacement should be present if required.
- All links must lead to the correct pages.
- Active states must correspond to the actual current route.

==================================================
NAVBAR TRANSPARENCY / HIDING / SHOWING BEHAVIOR
==================================================

Specifically verify the previously discussed behavior where the navbar may:

- Start transparent over a hero image
- Change appearance while scrolling
- Become solid on non-image sections/pages
- Hide/show according to the existing intended scroll behavior

Do NOT normalize all pages to one navbar style.

The correct behavior may differ between:
- Image/hero pages
- Non-image pages
- Scrolled state
- Mobile

Preserve the intended design language, but make the behavior consistent and reusable.

The important rule is:

SAME PAGE + SAME STATE = SAME NAVBAR BEHAVIOR

regardless of navigation source.

==================================================
BRAND TAGLINE — VISUAL VERIFICATION
==================================================

The tagline under the logo must be visible in ALL intended navbar states.

Test it against:
- Light hero image
- Dark hero image
- Busy image
- Different destination images
- Mobile
- Desktop
- Transparent navbar
- Solid navbar

Do not simply change the tagline color once.

Implement a robust readability treatment that works across different backgrounds while preserving the existing visual identity.

==================================================
ADMIN ↔ PUBLIC UI SYNCHRONIZATION TEST
==================================================

After implementing all changes, perform a complete CONTENT SYNCHRONIZATION AUDIT.

For each major Admin section:

Homepage Management
Travel With Us
Destinations
Trips
Completed Trips
Carousel
Reviews
Gallery
Inquiries
Bookings
About Us

verify:

1. What can Admin edit?
2. Where is that information displayed publicly?
3. Does changing it actually change the public UI?
4. Is the public UI still showing hardcoded old content?
5. Are there Admin fields that have no visible effect?
6. Are there public dynamic elements with no Admin control?
7. Are links/buttons actually connected?
8. Are selected images actually rendered?
9. Are selected trips actually linked?
10. Are selected reviews actually displayed?
11. Are ordering controls respected?
12. Are visibility/active toggles respected?

Do not accept "the Admin UI exists" as proof that the feature works.

The data/content relationship must be:

ADMIN
↓
CONTENT/DATA
↓
ACTUAL COMPONENT
↓
PUBLIC UI

==================================================
ADMIN FIELD CLEANUP
==================================================

If an Admin field does not correspond to an actual public feature, do NOT leave it just because it already exists.

Either:

A. Connect it correctly to the relevant public UI,

OR

B. Remove the field if it is obsolete/unnecessary.

Do NOT create fake controls merely to satisfy the appearance of an Admin dashboard.

==================================================
PUBLIC UI ↔ ADMIN REVERSE AUDIT
==================================================

Perform the audit in the opposite direction too.

Look at the actual public website.

For every piece of content that is supposed to be editable, ask:

"Where does Admin control this?"

If there is no control, either:

- Connect it to an existing Admin field,
- Add a minimal appropriate Admin control,
- Or determine that the content should intentionally remain static.

Do not leave accidental hardcoded content where the product requirements specify Admin management.

==================================================
FINAL END-TO-END VERIFICATION
==================================================

Before considering the work finished, perform these checks:

ADMIN EDITS TEXT
→ Does public UI show the changed text?

ADMIN CHANGES IMAGE
→ Does public UI show the changed image?

ADMIN CHANGES CAROUSEL
→ Does carousel actually change?

ADMIN SELECTS TRIP
→ Does carousel link to that actual trip?

ADMIN CHANGES TRAVEL WITH US CONTENT
→ Does public page change?

ADMIN ADDS COMPLETED TRIP
→ Does it appear in the intended completed-trip locations?

ADMIN APPROVES REVIEW
→ Does review become visible in its correct trip context?

ADMIN FEATURES REVIEW ON HOMEPAGE
→ Does it actually appear on homepage?

ADMIN ADDS/CHANGES CONTENT
→ Does the public page actually consume it?

ADMIN SELECTS GALLERY IMAGE
→ Does the correct image render?

ADMIN UPLOADS NEW IMAGE
→ Does it become available in Gallery?

ADMIN CREATES INQUIRY
→ Does it appear in Admin?

USER SUBMITS INQUIRY
→ Does WhatsApp notification flow exist?

ADMIN CONVERTS INQUIRY TO BOOKING
→ Does the booking contain the inquiry information?

ADMIN MARKS TRIP COMPLETED
→ Does "Ask for Review" become available?

ADMIN SENDS REVIEW REQUEST
→ Does the generated review link point to the correct review form/trip?

CUSTOMER SUBMITS REVIEW
→ Does Admin receive it?

ADMIN APPROVES REVIEW
→ Does it appear in the correct trip's review area?

Finally, inspect the complete project again for:
- Broken links
- Dead buttons
- Orphaned Admin fields
- Hardcoded obsolete content
- Old login references
- Travel Style references
- Image URL inputs
- Inconsistent navbar behavior
- Inconsistent image selection behavior
- UI elements that Admin cannot actually control
- Admin controls that have no visible effect
- Duplicate functionality
- Unnecessary fields
- Mobile inconsistencies

Fix every issue you find before finishing.

Navbar behavior must depend on the CURRENT PAGE/ROUTE, not on where the user came from.

Example:

Homepage → Destinations

Travel With Us → Destinations

Past Trips → Destinations

Trip Detail → Destinations

All must produce the same Destinations page and the same navbar state.

Apply this principle to every page.

Do not create page-specific hacks.

The transparent/solid navbar behavior must be consistent.

The navbar can remain transparent over hero imagery where that is part of the existing design.

However:

Logo + brand tagline must ALWAYS remain readable.

The tagline currently becomes difficult to read over some hero images.

Fix this while preserving the existing visual identity.

Use an elegant readability solution such as:

* Better contrast
* Subtle gradient
* Very subtle backdrop
* Controlled typography
* Appropriate shadow/readability treatment

Do NOT create a large ugly box behind the logo.

The solution should look intentional and premium.

The same brand treatment should work:

* On transparent navbar
* On solid navbar
* On different hero images
* On desktop
* On mobile

THIS IS A HIGH-PRIORITY REQUIREMENT.

Audit the ENTIRE ADMIN UI.

Anywhere the admin is currently asked to enter/paste an image URL/link, replace that workflow.

The admin should instead see:

[ Choose from Gallery ]

[ Upload New ]

Use the existing Gallery/Media Library concept.

Do NOT require image URLs for normal admin image selection.

This must be fixed EVERYWHERE, not just on the homepage.

Check:

* Homepage editor
* Carousel editor
* Travel With Us editor
* Destination editor
* Trip editor
* Completed Trip editor
* Review management
* Review request image
* Other content editors

If an image already exists in the Gallery, admin should be able to select it.

If it does not exist, admin can upload a new one.

Create/use ONE central Gallery/Media Library.

Every image uploaded anywhere in the admin system should become available in the Gallery.

Images can originate from:

* Admin
* Homepage
* Carousel
* Destination
* Trip
* Completed Trip
* Travel With Us
* Customer review

Reviewer/customer-uploaded photos should ALSO enter the Gallery.

Do not make the gallery a completely unorganized image dump.

Provide useful filtering/grouping.

Possible filters:

* All
* Homepage
* Destinations
* Trips
* Completed Trips
* Reviews
* Travel With Us

Where relevant, allow contextual filtering by:

* Destination
* Trip
* Review

Preserve relationships between images and their source.

For example:

Review photo
→ Review #102
→ Kedarnath completed trip
→ Trip date

Admin-uploaded trip photo
→ Kedarnath completed trip
→ Trip date

The exact visual implementation can use folders, filters, tabs, or another clean system.

Do NOT overcomplicate it.

The existing homepage carousel should remain visually similar but become properly dynamic/admin-managed.

It must support:

A. Trip-linked slides
B. Static promotional slides

Every slide must have its OWN content.

Do NOT use one fixed text/button configuration for every slide.

Each carousel slide should be able to have:

* Image
* Heading
* Description
* Button 1 text
* Button 1 action
* Optional Button 2
* Optional link/action
* Active/inactive
* Ordering

For a trip slide, admin should be able to select an existing trip from a dropdown rather than manually entering a URL.

Example:

Link Type:

* None
* Destination
* Trip

If Trip:
[ Select Trip ▼ ]

Static promotional slides should allow completely custom text.

Example:

"Discover the Mountains Differently"

with its own description and CTA.

Another slide can have completely different content.

Preserve the current carousel visual design as much as possible.

The "Why Travel With Us" section on the homepage should remain editable.

When clicked, it should open a dedicated Travel With Us page.

This page should be FULLY ADMIN-CUSTOMIZABLE while still preserving the existing visual design language.

Recommended structure:

1. Hero
2. Why Yatrivo / Credibility
3. Highlights
4. Custom image + text sections
5. Latest completed trips
6. Final CTA

Admin should be able to manage:

* Hero image
* Hero heading
* Hero description
* Highlights
* Credibility content
* Custom image/text sections
* Ordering
* Latest completed trips shown

Use Gallery instead of image URLs.

Make this page tell a story:

WHY YATRIVO
↓
CREDIBILITY
↓
HIGHLIGHTS
↓
REAL TRAVEL EXPERIENCES
↓
LATEST COMPLETED TRIPS
↓
EXPLORE ALL PAST TRIPS

The completed-trip section should show approximately 2–3 latest completed trips.

Each card can contain:

* Image
* Destination
* Trip name
* Actual trip date
* Short description
* Optional review information

Include:

[ See All Completed Trips ]

This opens the dedicated Completed Trips page.

There must be a dedicated Completed Trips/Past Trips page.

Show all completed trips.

Each completed trip can contain:

* Trip name
* Destination
* Actual trip date
* Cover image
* Gallery
* Trip information
* Highlights
* Relevant itinerary/details
* Traveler reviews
* Review photos

Clicking a completed trip opens its own detail page.

Do NOT treat all historical trips as one generic gallery.

Each actual completed trip is its own entity.

Plan My Trip does NOT need to occupy a permanent primary navbar position.

Plan My Trip should remain a strong CTA throughout the website.

Use the navigation space for a discovery-oriented destination such as:

Past Trips

or

Our Trips

Use whichever fits the existing navbar/design better.

Do not unnecessarily redesign the navbar.

A destination can have multiple individual trip/package instances.

Example:

Kedarnath

* Kedarnath — 15 October 2026
* Kedarnath — 25 October 2026
* Kedarnath — 5 November 2026

The destination page should display relevant available trips.

When a specific completed trip is opened, show its completed-trip detail page.

IMPORTANT:

Plan My Trip is NOT a custom trip builder.

It is a structured inquiry flow for EXISTING YATRIVO trips/packages.

The flow should be:

Plan My Trip
↓
Select Destination
↓
Select Trip/Package + Date as ONE combined option
↓
Select number of travelers
↓
Enter traveler details
↓
Enter travel planner/contact details
↓
Review information
↓
Inquire Now

Package and date are ONE selection.

A single package/trip instance has ONE date.

Example:

Kedarnath — 20 October 2026
5 Days / 4 Nights
₹12,999/person

Another package instance:

Kedarnath — 28 October 2026
5 Days / 4 Nights
₹12,999/person

Do NOT make the user separately select package and date.

The existing admin workflow is correct:

If admin wants the same package on another date:
→ Duplicate package
→ Modify date/details
→ Publish new trip instance

Preserve this behavior.

Display the admin-defined static per-person price.

Example:

₹12,999 / person

The website does NOT need to calculate or finalize negotiated pricing.

The displayed website price is the package's listed price.

Final pricing can be negotiated through WhatsApp.

Do NOT add accommodation preference.

If the user selects 3 travelers:

Traveler 1:

* Name
* Age
* Gender

Traveler 2:

* Name
* Age
* Gender

Traveler 3:

* Name
* Age
* Gender

Repeat dynamically according to traveler count.

The existing travel-planner/contact-information flow should remain for the primary contact.

Do not unnecessarily remove useful existing contact fields.

Do not add unnecessary fields.

The main user CTA should be:

INQUIRE NOW

Preserve the custom confirmation/message interaction that already exists.

When the user submits:

1. Save inquiry.
2. Show inquiry in Admin.
3. Send inquiry to Admin through WhatsApp Business API.
4. Send an acknowledgement to the customer where appropriate.
5. Do NOT open WhatsApp on the user's phone.
6. User does not manually press Send.

The chosen architecture is:

WhatsApp Business Platform / Cloud API or equivalent API provider.

Flow:

Website
↓
Backend
├── Database
├── Admin Inquiry
└── WhatsApp Business API
↓
Admin WhatsApp

The user's WhatsApp does NOT open.

The user does NOT manually send the inquiry.

The admin WhatsApp notification should include:

* Inquiry ID
* Customer name
* Customer mobile number
* Destination
* Trip/package
* Trip date
* Number of travelers
* Traveler names/ages/genders
* Package price
* Relevant planner/contact information

The customer's mobile number MUST be included so the admin can directly contact the customer.

The inquiry should also remain available in Admin.

Support an immediate automated WhatsApp acknowledgement after inquiry submission.

Example:

Thank you for your inquiry with Yatrivo.

We have received your request for [Trip Name] on [Trip Date].

Our team will contact you shortly.

Inquiry ID: [Inquiry ID]

The implementation must follow the appropriate WhatsApp Business Platform messaging/template/consent rules.

Raise Query should also use the API-based flow.

User writes the query directly on the Yatrivo website.

Collect:

* Name
* Mobile number
* Query/message

Do NOT open WhatsApp.

On submit:

* Save to database
* Show in Admin
* Notify Admin through WhatsApp API
* Provide customer acknowledgement where appropriate

If useful, preserve context of the page/destination/trip from which the query was initiated.

There are TWO inquiry sources:

1. Website inquiries
2. Manual inquiries received through WhatsApp/phone/offline

Admin must have:

[ + Add Inquiry ]

Manual inquiry should be recordable in the same inquiry system.

Do not create two completely separate inquiry systems.

Remove the separate Admin Notifications section completely.

New/unread inquiries should instead be indicated directly on:

Inquiries

using a badge/dot/count/highlight.

Example:

Inquiries •
or
Inquiries 3

Do not create a separate notifications dashboard.

Booking is finalized outside the website, generally through WhatsApp/admin communication.

Admin manages booking records.

Two ways:

A. Convert Inquiry → Booking

Admin clicks:

[ Convert to Booking ]

Relevant inquiry information should be carried over.

B. Add Booking manually

Admin clicks:

[ + Add Booking ]

This is for bookings that came directly through WhatsApp/phone/offline.

Booking can contain:

* Booking number
* Booking status
* Destination
* Package/trip
* Trip date
* Booking date
* Negotiated/final amount where required
* Payment status where required
* Primary customer/contact
* Traveler/passenger details

The admin can collect complete traveler information separately through WhatsApp after booking and enter it manually.

Do not force all booking information into the initial website inquiry.

Admin can mark a trip/booking as completed.

This does NOT automatically send review requests.

After completion:

Show:

[ Ask for Review ]

The admin decides when to use it.

Do not automatically trigger review requests.

The Ask for Review option should remain available until used.

Review requests are sent through WhatsApp Business API.

Admin should be able to:

* Select traveler/customer
* Use default template
* Edit message
* Insert variables
* Attach one optional image
* Include the generated review link
* Send

Provide an "Insert Variable" control.

Available variables should include:

@customer_name
@destination
@trip_name
@trip_date
@booking_number
@review_link

Example:

Dear @customer_name,

Thank you for travelling with Yatrivo to @destination on @trip_date.

We hope you had a wonderful experience.

We would love to hear your feedback.

@review_link

Team Yatrivo

When sent, variables become actual customer-specific information.

The review link is AUTOMATICALLY GENERATED.

Admin should NOT manually create or copy the link.

The editor should display:

@review_link

as a placeholder that the admin can insert anywhere in the message.

CRITICAL:

The review request MUST NOT be sent unless @review_link is included.

If the admin attempts to send without the review link:

* Disable Send, OR
* Show a clear validation message

Do not allow an incomplete review request to be sent accidentally.

The generated link should open the correct review form for the correct customer/trip without requiring login.

Allow one optional image attachment.

Admin can:

* Select from Gallery
* Upload new image

Do not require an image.

Customer opens review link from WhatsApp.

No login.

The form should allow:

* Star rating
* Written review
* Review photos
* Necessary review information

The system should already know:

* Customer
* Trip
* Destination
* Trip date

Do NOT ask the customer to select the trip again.

Reviews are NOT automatically published.

Flow:

Customer submits review
↓
Admin receives review
↓
Admin reviews
↓
Approve / Reject
↓
Approved review becomes public

Customer-uploaded photos should follow the same moderation process.

A review belongs to the exact completed trip from which it originated.

Do NOT create arbitrary destination review toggles.

Do NOT create:

Show on Kedarnath
Show on Badrinath

A review belongs to its actual trip.

For example:

Kedarnath — 15 May 2026
↓
Review
↓
Kedarnath — 15 May 2026

The review should display:

* Rating
* Review text
* Reviewer name where appropriate
* Trip name
* Trip date
* Review posted date
* Photos

Support BOTH:

1. Collective review-photo gallery
2. Photos inside individual reviews

This should feel similar to how e-commerce platforms can show review photos collectively while still showing them attached to individual reviews.

Do not create separate public review categories for every departure date.

Instead show useful contextual information:

* Trip
* Trip date
* Review date

Homepage reviews are managed separately.

Admin should have:

Homepage Management
→ Featured Reviews

Admin can choose approved reviews to display on homepage.

This is separate from the trip's own reviews.

Do NOT create destination assignment toggles.

A review is always tied to its actual trip.

Homepage featuring is an editorial choice.

Audit the existing About Us section.

Remove unnecessary/redundant fields.

Keep useful content.

Preserve existing visual design.

Make relevant content editable if the current admin architecture supports it.

Do not add unnecessary CMS complexity.

Remove all Travel Style filters/tags.

Use relevant trip properties such as:

* Destination
* Date
* Status
* Availability

Only where those filters already make sense.

Perform a GLOBAL SEARCH of the entire admin interface for fields such as:

Image URL
Image Link
Paste URL
Enter image link
etc.

Replace these wherever appropriate with:

[ Choose from Gallery ]
[ Upload New ]

This is a REQUIRED GLOBAL AUDIT.

Do not fix only the homepage.

Audit the existing UI for "filler" or obsolete fields.

Pay particular attention to:

* About Us
* Reviews
* Admin Reviews
* Inquiry
* Booking
* Homepage
* Travel With Us
* Trip management

Remove anything that only existed for:

* Login
* User accounts
* Travel style
* Old review assumptions
* Redundant information

Do not remove useful existing fields without a reason.

Every repeated component must behave consistently.

Check:

* Navbar
* Buttons
* Cards
* Forms
* Modals
* Image selectors
* Gallery
* Trip cards
* Review cards
* Admin tables
* Status badges
* CTAs

If the same concept appears in multiple places, use the same interaction pattern.

For example:

Every image selection should use the same Gallery/Upload interaction.

Every trip link should use the same trip-selection pattern.

Every review request should use the same dynamic-variable system.

Check desktop and mobile.

The website is heavily intended for users arriving through Instagram, so mobile UX is extremely important.

Check:

* Navbar
* Transparent navbar
* Tagline
* Carousel
* Forms
* Traveler fields
* Gallery
* Reviews
* Trip cards
* Admin where applicable

Do not redesign mobile from scratch.

Fix only what is necessary.

THIS IS CRITICAL.

After implementing the changes above, perform a second complete internal audit.

Use this checklist:

[ ] Login completely removed
[ ] User account functionality removed
[ ] Travel Style completely removed
[ ] Travel Style filters/tags removed
[ ] Navbar fixed globally
[ ] Navbar works identically regardless of navigation source
[ ] Transparent navbar works
[ ] Tagline is readable over all hero images
[ ] Image URLs removed from admin editors
[ ] Gallery selector implemented
[ ] Upload New implemented
[ ] All uploaded images enter Gallery
[ ] Reviewer photos enter Gallery
[ ] Gallery filters/context implemented
[ ] Homepage carousel dynamic
[ ] Static carousel slides support custom text
[ ] Trip carousel slides can select existing trip
[ ] Carousel buttons are per-slide
[ ] Travel With Us is editable
[ ] Travel With Us has highlights
[ ] Travel With Us has custom image/text sections
[ ] Travel With Us has latest completed trips
[ ] Completed Trips page exists
[ ] Completed Trip detail exists
[ ] Plan My Trip uses existing trips
[ ] Package + date are one selection
[ ] Per-person price shown
[ ] No accommodation preference
[ ] Traveler name/age/gender implemented
[ ] Planner/contact information retained
[ ] Inquire Now implemented
[ ] Inquiry saved
[ ] Admin receives inquiry
[ ] WhatsApp API flow represented
[ ] Customer acknowledgement represented
[ ] Raise Query uses same API architecture
[ ] Manual Add Inquiry exists
[ ] Admin Notifications page removed
[ ] New inquiry indicator appears in Inquiry section
[ ] Booking can be manually created
[ ] Inquiry can be converted into Booking
[ ] Booking contains relevant customer/traveler/trip information
[ ] Trip can be marked completed
[ ] Ask for Review is manual
[ ] Review request composer exists
[ ] Dynamic variables exist
[ ] Review link automatically generated
[ ] Review link placeholder can be inserted
[ ] Review cannot be sent without review link
[ ] Optional one-image attachment exists
[ ] Customer review requires no login
[ ] Reviews require admin approval
[ ] Reviews remain tied to correct completed trip
[ ] Review photos are supported
[ ] Review photo gallery exists
[ ] Homepage featured reviews are managed separately
[ ] About Us unnecessary fields removed
[ ] Other obsolete fields removed
[ ] No old travel-style remnants remain
[ ] No old login remnants remain
[ ] Mobile UX checked
[ ] Desktop UX checked

AFTER THIS CHECK:

If ANY item is incomplete, partially implemented, inconsistent, or missing, FIX IT NOW.

Do not merely report it.

Perform another quick verification after those fixes.

If the system must prioritize work internally, use this order:

1. Global cleanup

   * Login removal
   * Travel Style removal
   * Navbar
   * Image URL → Gallery

2. Core user flow

   * Destinations
   * Trips
   * Plan My Trip
   * Inquiry
   * Raise Query

3. Admin operational flow

   * Inquiry management
   * Booking management
   * Convert Inquiry → Booking
   * Completed trip

4. Review system

   * Review requests
   * Dynamic variables
   * Review link
   * Approval
   * Trip-specific display
   * Homepage featured reviews

5. Content management

   * Carousel
   * Travel With Us
   * Completed Trips
   * Gallery

6. Final UI polish

   * Navbar
   * Tagline
   * Responsive behavior
   * Consistency

Do not spend the entire run polishing one section while major functional requirements remain missing.

Again:

DO NOT redesign the entire project.

Use the current design as the source of truth for:

* Visual style
* Branding
* Typography
* Colors
* Layout language
* Existing components
* Existing animations
* Existing page structure

Modify only what is required.

If something already works correctly, KEEP IT.

If a requirement is already implemented correctly, DO NOT rebuild it.

If a new requirement can be satisfied by a small modification, prefer that.

Do not finish this task by saying that the changes "should" be implemented.

Actually implement them.

Do not stop after the first pass.

Audit → Implement → Re-audit → Fix remaining issues → Final consistency check.

The final project should be a coherent, consistent Yatrivo website where:

USER:
Explore
→ Destination
→ Trip
→ Inquiry
→ WhatsApp communication

ADMIN:
Manage content
→ Manage trips
→ Receive inquiries
→ Add external inquiries
→ Convert/create bookings
→ Track completed trips
→ Request reviews
→ Approve reviews
→ Manage gallery
→ Manage homepage
→ Manage Travel With Us

No login.
No travel styles.
No unnecessary image URLs.
No separate notification dashboard.
No unnecessary user-account concepts.

Preserve the existing design wherever possible and make the minimum necessary structural changes to achieve this complete UX.
