We are now doing the FINAL CORRECTION PASS on the existing Yatrivo website and admin panel.

Please read the entire instruction carefully before making changes.

The previous iterations have already implemented a lot of the product. I do NOT want the website redesigned from scratch, and I do NOT want existing working features unnecessarily rebuilt.

I want you to take the CURRENT implementation as the starting point, understand what is already there, and make the corrections described below.

The goal is to make the current Yatrivo prototype coherent, practical, and internally consistent.

Use the existing visual design as the source of truth wherever possible: typography, colours, spacing, cards, layouts, animations, buttons, imagery, and overall visual language should remain consistent.

If something already works correctly, KEEP IT.

If something is only partially correct, improve that existing implementation instead of replacing it.

The important thing is that the final website should feel like ONE finished product rather than a collection of features added in different iterations.

---

## FIRST: UNDERSTAND THE CURRENT PRODUCT MODEL

Yatrivo is a travel discovery, trip inquiry, booking-management, completed-trip and review platform.

It is NOT a social network and it is NOT a customer-account platform.

There are no customer accounts.

Therefore:

* No customer login
* No signup
* No OTP login
* No Google login
* No customer profile
* No customer dashboard
* No customer account
* No customer authentication-dependent favourites/saved functionality

Travel Style has also been completely removed.

Do not reintroduce:

* Solo
* Couple
* Family
* Trekking
* Hiking
* Travel Style filters/tags

The website should be very simple from the traveller's perspective:

Explore
→ Destination
→ Trip
→ Trip Details
→ Inquiry

The admin side should manage:

Content
→ Destinations
→ Trips / Trip Instances
→ Inquiries
→ Bookings
→ Completed Trips
→ Reviews
→ Media

Keep this overall product model in mind while making every change below.

==================================================

1. USER-FACING NAVBAR
   ==================================================

There is one important navbar inconsistency that needs to be fixed.

The Destinations page currently has the correct navbar behaviour, but the Trips page is behaving differently. On Trips, the navbar is white all the time, whereas it should behave consistently with Destinations.

Please make the navbar behaviour consistent across the website.

The current page/route should determine the navbar state, NOT the page from which the user arrived.

For example, these should all produce the same Destinations navbar behaviour:

Homepage → Destinations
Travel With Us → Destinations
Past Trips → Destinations
Trip Detail → Destinations

Similarly, Trips should behave correctly whether it is opened directly or reached through another page.

Do not create route-specific hacks.

The navbar should understand whether the current page has a hero/image background and should behave accordingly.

Where the existing design calls for a transparent navbar over a hero image, keep it transparent.

Where the design calls for a solid navbar, keep it solid.

Also preserve the intended scroll/hide/show behaviour where it already exists.

However, make the behaviour consistent.

The navigation text also needs slightly more visual strength.

Right now it can become difficult to read over images.

Increase the navbar text size and/or weight enough that the links remain clearly readable without making the navbar visually heavy.

The logo and tagline need the same treatment.

The tagline beside/below the Yatrivo logo currently disappears in mobile view.

It MUST remain visible in the mobile navbar/header wherever the logo is shown.

Do not simply hide it to make the mobile layout easier.

Make the logo + tagline combination responsive instead.

There is another mobile issue:

When the mobile navigation menu is opened, the menu background is currently transparent.

It should become a clean, solid WHITE navigation panel when open so that the menu items are clearly readable regardless of the image behind it.

Keep the existing mobile menu design otherwise.

==================================================
2. TYPOGRAPHY / PAGE HEADINGS
=============================

Across the website, the primary page heading sometimes looks too small and gets visually confused with secondary text.

I don't want a complete typography redesign.

Instead, establish a clearer hierarchy.

The main heading of a page should immediately look like the MAIN heading.

Secondary headings, labels, descriptions and metadata should remain visually subordinate.

Please review this across the major public pages:

* Homepage sections
* Destinations
* Destination Detail
* Trips
* Trip Detail
* Past Trips
* Completed Trip Detail
* Travel With Us
* Reviews/forms where relevant

Make the hierarchy clearer while preserving the existing visual identity.

==================================================
3. HOMEPAGE — REMOVE LIKE BUTTONS
=================================

There are no customer accounts, so the Like/Favourite functionality no longer makes sense.

Remove the like/heart button completely from the user-facing website.

Do a global search for this functionality.

It should not remain on:

* Destination cards
* Trip cards
* Completed trip cards
* Other public content cards
* Any other place where it was previously used

Do not replace it with another account-based feature.

==================================================
4. "WHY TRAVELERS LOVE US"
==========================

The "Why Travelers Love Us" section on the homepage currently has a heading that is too small and doesn't clearly communicate that this is an important section.

Make the heading substantially clearer and more visible.

Also, this entire section should act as a route into the Travel With Us page.

When the user clicks the section / appropriate CTA, it should open:

Travel With Us

The existing visual design should be preserved.

Do not turn this into a completely different section.

==================================================
5. HOMEPAGE CAROUSEL / UPCOMING TRIPS
=====================================

The carousel already supports trip-linked and promotional slides. Keep that implementation.

However, the presentation of upcoming-trip slides needs correction.

For a slide representing an actual upcoming trip, the hierarchy should be:

Trip heading
↓
Description
↓
Price + Date
↓
Two consistent CTA buttons

The price and date should appear immediately below the description.

Do NOT repeat the same information as unnecessary badges somewhere else on the slide.

Keep the slide visually clean.

I also want two buttons on the slides for consistency.

Trip slides should use the same general two-button structure as the other carousel slides.

For example, depending on the existing design:

[ View Trip ] [ Inquire Now ]

The exact styling should follow the existing Yatrivo design.

Static promotional slides should also use the same two-button structure where appropriate so the carousel doesn't feel inconsistent from slide to slide.

Do not remove the dynamic carousel functionality that was already implemented.

==================================================
6. DESTINATION → TRIP → TRIP DETAIL
===================================

This is an important UX correction.

Currently, when I open a Destination, I can see the trips related to that destination, but the trip card is offering an enquiry directly.

That is too early.

A traveller should first be able to understand the package.

The correct flow is:

Destination
→ Trip/Package
→ Detailed Trip Page
→ Inquire Now

Therefore, clicking a trip/package from a Destination page should open the full Trip Detail page.

The Trip Detail page should contain the relevant package information, such as:

* Trip name
* Destination
* Date
* Price
* Duration
* Description
* Highlights
* Itinerary/details
* Availability where relevant
* Images
* Inquire Now CTA

The user can then choose to inquire.

Do not force the enquiry directly from the destination listing.

==================================================
7. ADMIN DASHBOARD
==================

The current dashboard still contains statistics that no longer make sense because there are no customer accounts.

Remove metrics that require user-account data or cannot genuinely be calculated from the current product.

The dashboard should focus on operational information that Yatrivo actually manages.

Useful examples include:

* Total inquiries
* New/received inquiries
* Confirmed bookings
* Active/upcoming trips
* Completed trips
* Other genuinely available operational counts

Do not show fake-looking user statistics simply to fill dashboard cards.

The dashboard should be useful to an admin running the travel business.

We do NOT need a separate Analytics section anymore.

Remove the dedicated Analytics page entirely.

The operational summary on the dashboard is enough for this version of the product.

==================================================
8. INQUIRIES
============

The Enquiries section is generally on the right track.

Keep:

* Enquiries navigation item
* Unread orange badge/count
* Add Inquiry
* Search
* Inquiry table
* Status filtering

But change the terminology from the customer's perspective to the admin's perspective.

Instead of:

Submitted

use:

Received

The inquiry lifecycle should make sense operationally, for example:

Received
→ Contacted
→ Quoted
→ Confirmed

with other meaningful states such as:

Lost
Cancelled

where appropriate.

The CRM panel that opens for an inquiry currently feels arbitrary.

Please simplify and make it meaningful.

The admin should be able to see the inquiry information and then manage the important operational fields.

The current "Follow-up Date" field does not make sense in its current form. Remove it unless it is genuinely integrated as a useful follow-up scheduling feature.

The status and assignment controls should not have a permanently visible meaningless "Update Status" action.

Instead, when the admin changes something such as:

* Status
* Assigned admin

the interface should provide a clear Save/Update action for those changes.

The user should understand exactly what is being saved.

==================================================
9. INQUIRY → BOOKING
====================

The current wording:

"Convert to Booking"

is not ideal.

Use something more natural such as:

Create Booking

or

Continue to Booking

When the admin chooses this option, do NOT simply create a blank booking.

Open the Booking creation form with the information already available from the inquiry pre-filled.

For example:

* Customer name
* Customer phone
* Destination
* Trip/package
* Trip date
* Number of travelers
* Existing traveler information

Then provide additional booking fields that the admin may need after the conversation/negotiation.

The booking form should allow the admin to complete or edit:

* Primary customer/contact details
* All traveler details
* Traveler contact information where necessary
* Booking date
* Final/negotiated amount
* Payment information/status
* Booking status
* Notes
* Other relevant operational details

The point is:

Inquiry information should flow naturally into the Booking.

The admin should not have to enter the same information again.

==================================================
10. TRIPS + TRIP INSTANCES
==========================

There are currently two separate admin experiences:

Trips
and
Trip Instances.

They overlap too much.

I do NOT want two confusing systems.

Keep the underlying concept of a Trip/Package and its individual dated Trip Instances, because that relationship is important.

But merge the ADMIN EXPERIENCE.

Take the best parts of both existing pages.

From the current Trips page, keep the useful:

* Add Trip
* Edit Trip
* Duplicate Trip
* Trip/package information
* Description
* Destination
* Price
* Main content management

From Trip Instances, keep:

* Specific departure date
* Availability/spots
* Upcoming/completed/cancelled state
* Complete
* Cancel
* Operational information

The admin should feel like they are managing one coherent trip system.

Do not show a confusing duplicate set of actions across two pages.

==================================================
11. TRIP INSTANCE LIST
======================

The current Trip Instances table shows photos as tiny thumbnails.

Remove that presentation.

The list should focus on useful operational information:

* Trip/package
* Date
* Price
* Availability
* Status
* Relevant actions

The individual trip instance itself should be clickable.

For example:

Kedarnath Pilgrimage Trek
20 October 2026

→ opens a full Trip Instance Detail page.

==================================================
12. TRIP INSTANCE DETAIL PAGE
=============================

Create/modify the detailed view so that it combines the useful information currently spread across Trips and Trip Instances.

The detail view should feel similar to the Add Trip page visually, but it is a VIEW page rather than an editing form.

Show:

* Trip/package name
* Destination
* Trip date
* Price
* Duration
* Description
* Highlights
* Itinerary
* Images
* Availability
* Spots
* Status
* Other relevant trip information

Also provide access to:

* Related Inquiries
* Related Bookings
* Reviews where applicable

The important relationship is:

Trip Instance
→ Related Inquiries
→ Related Bookings
→ Completed Trip
→ Reviews

The admin should be able to understand the entire history of a particular departure from this page.

When the admin clicks:

[ Edit ]

the page should switch into the appropriate editing state.

In edit mode, the actions should become appropriate for editing, such as:

[ Save Changes ]
[ Cancel ]

Do not leave view-mode and edit-mode actions mixed together.

For the trip lifecycle, provide appropriate actions such as:

* Edit
* Cancel
* Mark Complete

but place them logically within the detail view rather than scattering them across multiple list pages.

==================================================
13. BOOKINGS
============

The current Bookings section is incomplete.

It needs a proper:

[ + Add Booking ]

workflow.

When adding a booking manually, the admin should be able to enter all important booking information.

The form should cover:

BOOKING INFORMATION

* Booking number
* Booking status
* Booking date
* Destination
* Trip/package
* Trip date
* Final/negotiated amount
* Payment status

PRIMARY CUSTOMER

* Name
* Phone
* Email where applicable
* Other useful contact information

TRAVELERS

For each traveler:

* Name
* Age
* Gender
* Contact information where required
* Other relevant information

Also allow relevant notes or operational information.

Do not force unnecessary fields that aren't useful to the actual booking workflow.

==================================================
14. BOOKING DETAIL
==================

The booking table entries should be clickable.

Clicking a booking should open a full Booking Detail page.

That page should clearly show:

* Who booked
* Contact details
* Destination
* Trip/package
* Trip date
* Number of travelers
* Every traveler
* Pricing
* Payment
* Booking status
* Booking date
* Related inquiry if applicable
* Notes/other relevant information

The booking should be editable.

Use:

[ Edit ]

to enter edit mode.

Again, preserve the existing design language.

==================================================
15. BOOKING FILTERS + EXPORT
============================

Bookings need useful filters.

At minimum, allow filtering by:

* Trip/package
* Destination
* Trip date
* Booking status
* Payment status where applicable

The important part is that EXPORT must respect the current filter.

For example:

If I select:

Kedarnath — 20 October 2026

and export, I should get ONLY bookings for that trip instance.

If I filter:

Confirmed

and export, I should get ONLY confirmed bookings.

If I filter:

Kedarnath — 20 October 2026 + Confirmed

the export should contain only that subset.

Do not export the entire booking database when the admin has intentionally filtered it.

==================================================
16. TRIP ↔ INQUIRIES ↔ BOOKINGS
===============================

This relationship should be visible throughout the admin.

From a Trip/Trip Instance detail page, provide:

[ Related Inquiries ]

and

[ Related Bookings ]

These should show the records associated with that exact trip instance.

Similarly:

Inquiry → should identify its trip.

Booking → should identify its trip.

Review → should identify its completed trip.

Do not mix different departure dates of the same package.

For example:

Kedarnath — 15 October
and
Kedarnath — 25 October

are separate trip instances.

Their inquiries, bookings and completed-trip/review relationships must remain separate.

==================================================
17. USERS → ADMINS
==================

The current Users page is no longer appropriate because Yatrivo does not have customer accounts.

Remove customer users from this area.

We still need administrative users because multiple people may operate the admin panel.

So replace the current customer-oriented Users section with something like:

Admins

or

Admin Management.

Only administrative roles should exist:

* Super Admin
* Admin

Do NOT show:

* Customer
* Team Member

Do not build an elaborate permission system if all admins currently have essentially the same operational access.

The current Roles & Permissions screen is unnecessary complexity for this version.

Remove the Team Member concept and the unnecessary permissions matrix.

Keep the distinction between Super Admin and Admin if useful for future expansion, but do not invent permissions that the product does not actually use.

==================================================
18. REVIEWS
===========

Keep a centralized Reviews section.

I do NOT want reviews to exist only inside Destination pages.

A centralized moderation/management page is useful.

However, make it much more useful by adding contextual filters.

The Reviews page should allow filtering by:

* All
* Pending
* Published
* Flagged
* Destination
* Trip/package
* Trip date
* Rating

Every review should clearly show its relationship to:

* Customer
* Destination
* Trip/package
* Exact trip date
* Rating
* Review date
* Status

Then ALSO allow reviews to be accessed contextually from:

Trip Detail
→ Related Reviews

Destination Detail
→ Related Reviews

This gives us both:

Central review management

AND

Contextual review management.

Do not create arbitrary controls such as:

"Show on Kedarnath"
"Show on Badrinath"

A review belongs to the actual completed trip from which it originated.

The homepage can separately feature approved reviews as an editorial choice.

==================================================
19. REVIEW LIFECYCLE
====================

Keep the review workflow we already established:

Trip completed
→ Admin chooses "Ask for Review"
→ WhatsApp review request
→ Customer opens generated review link
→ Customer submits review
→ Admin reviews it
→ Approve / Reject
→ Approved review becomes public

Do NOT automatically send the review request merely because a trip becomes completed.

The admin decides when to ask.

Reviews must not require customer login.

Reviews must remain associated with the correct completed trip.

==================================================
20. MEDIA LIBRARY
=================

The current Media Library needs a significant correction.

The current implementation still contains:

"Add a new image by URL"

We do NOT want normal administrators to add images by URL.

Remove that workflow.

The primary image addition experience should be something like:

[ Upload New ]

→ drag and drop an image

or

→ Choose File

After uploading, the image becomes part of the central Media Library.

We should not require admins to copy/paste image URLs.

Also remove unnecessary "Copy Image URL" style actions from the normal Media Library workflow.

The admin should simply select images when they need them.

==================================================
21. MEDIA LIBRARY STRUCTURE
===========================

I want the Media Library to behave more like an actual media manager.

The main Media Library view should show:

ALL IMAGES

This is the complete image collection.

Then provide a separate folder/category view.

The structure should conceptually look like:

Media Library

All Images

Folders:

Homepage
Destinations
Rishikesh
Kedarnath
Auli
...
Trips
Trip/Package A
Trip/Package B
...
Completed Trips
Trip Instance A
Trip Instance B
...
Reviews
Destination
Trip Instance
Review 001
Review 002
...

The exact UI can be tabs, folders, breadcrumbs, cards, etc.

The important thing is the ORGANIZATION.

The folders should be dynamic.

For example, when a new destination is created, its relevant media organization should become available.

When a new trip instance is created, its relevant media relationship should be available.

When a customer submits review photos for a particular completed trip, those photos should automatically remain associated with:

Review
→ Completed Trip
→ Trip Instance
→ Destination

Do not require the admin to manually create every folder.

This should work conceptually like a structured media/storage system.

==================================================
22. IMAGE SELECTION THROUGHOUT ADMIN
====================================

The Media Library is not useful if every other admin page still asks for URLs.

Search the ENTIRE admin interface for image inputs.

Anywhere an admin needs to select an image, use:

[ Choose from Gallery ]

[ Upload New ]

This applies to:

* Homepage
* Hero
* Carousel
* Destination
* Trip
* Trip Instance
* Completed Trip
* Travel With Us
* Review
* Review request image
* Custom content
* Any other image field

The workflow should be:

Choose from Gallery
→ select image
→ save
→ correct public/admin component displays that image.

Or:

Upload New
→ image enters Media Library
→ image is selected
→ save
→ correct component displays it.

Do not leave unnecessary URL inputs.

==================================================
23. ADMIN ↔ PUBLIC CONTENT SYNCHRONIZATION
==========================================

This is extremely important.

Do not assume that a feature is complete simply because an admin field exists.

For every editable piece of content, verify the entire chain:

Admin field
→ saved data/state
→ correct component
→ public page
→ visible result

For example:

If admin changes the homepage hero heading, the homepage must actually change.

If admin selects a carousel image, that exact image must appear in the carousel.

If admin changes a trip price, the public trip should display the new price.

If admin changes a trip date, the corresponding trip instance should display the new date.

If admin selects a Featured Review, that review should actually appear on the homepage.

If admin changes Travel With Us content, the public Travel With Us page should reflect it.

If an admin field currently controls nothing, remove it or connect it properly.

If a public element is intended to be editable but has no admin control, add the missing connection.

Do this audit for:

* Homepage
* Carousel
* Destinations
* Trips
* Trip Instances
* Travel With Us
* Past Trips
* Completed Trips
* Reviews
* Media
* About Us
* Important global settings

This is more important than simply having zero TypeScript errors.

==================================================
24. SETTINGS
============

The current Settings area is too generic.

Simplify it.

GENERAL should contain only genuinely useful global settings.

For example:

* Tagline
* Other appropriate global branding/content settings

Do not give the admin meaningless controls such as changing the website name if that is not supposed to be configurable.

CONTACT DETAILS should clearly explain where each piece of information is used.

For example:

Public Website Contact

* Phone
* WhatsApp
* Email
* Address

If there is a separate number that receives automated inquiry notifications, make that distinction explicit:

Inquiry Notification WhatsApp

* Number receiving new inquiry notifications

If that number should not be changed from the normal settings UI, don't present it as though it is an ordinary public contact field.

The admin must understand exactly what each contact field controls.

Remove the Notifications settings section because we no longer have a separate notification system that the admin needs to configure.

Keep Cancellation Policy because that is still useful.

Remove the unnecessary Roles & Permissions complexity as described earlier.

==================================================
25. ADMIN SIDEBAR
=================

The sidebar currently has the Collapse button at the bottom.

Move the collapse control to the TOP of the sidebar, beside the Yatrivo branding.

The Yatrivo logo/branding should remain visible.

When the sidebar is collapsed, the Yatrivo logo area should act as the collapse/expand control.

On hover, the logo can transition visually to a left-arrow indication so the user understands that it can expand/collapse.

Do not remove the Yatrivo branding.

The sidebar should remain clean and professional.

==================================================
26. LOGOUT
==========

Logout should not happen immediately.

When the admin clicks Logout, show a confirmation dialog:

"Are you sure you want to log out?"

with:

[ Cancel ]
[ Logout ]

Only log out after confirmation.

==================================================
27. WHAT MUST NOT BE REINTRODUCED
=================================

During all of these changes, do NOT reintroduce:

* Customer accounts
* Login
* OTP
* Google login
* Customer profiles
* Customer dashboards
* Travel Style
* Like/Favourite functionality
* Customer user management
* Analytics based on imaginary user behaviour
* Separate Notifications navigation
* Image URL workflows where Gallery/Upload is appropriate
* Arbitrary review-to-destination assignment

==================================================
28. IMPORTANT: PRESERVE WHAT ALREADY WORKS
==========================================

There are already working parts of the project.

Do not destroy them.

In particular, preserve the existing implementations for:

* Auth removal
* Travel Style removal
* Enquiries badge
* Basic carousel functionality
* Travel With Us page
* Past Trips page
* Destination Detail
* Completed Trip Detail
* Review submission/moderation
* Existing visual design

Only modify them where this prompt specifically asks for a correction.

==================================================
29. FINAL PASS — DO NOT JUST REPORT PROBLEMS
============================================

This is an implementation task.

Do NOT simply tell me:

"this needs to be fixed"

or:

"this could be improved."

Actually make the changes.

Before considering the task complete, go back through the project and verify that the changes are connected.

Especially verify these relationships:

Trip
→ Trip Detail
→ Inquiry

Inquiry
→ Create Booking
→ Booking Detail

Trip Instance
→ Related Inquiries
→ Related Bookings
→ Completed Trip
→ Reviews

Admin
→ Edit content
→ Public UI actually changes

Media Library
→ Select/Upload image
→ Correct admin field
→ Correct public component

Navbar
→ Current route
→ Correct transparent/solid state
→ Correct desktop/mobile behaviour

Finally, check the project at both desktop and mobile sizes.

Do not spend this run redesigning things that were not requested.

The priority is:

1. Fix the user-side issues.
2. Fix the admin information architecture.
3. Fix Trip / Trip Instance / Inquiry / Booking relationships.
4. Fix Media Library and image selection.
5. Fix Reviews and their relationships.
6. Simplify Settings/Admin management.
7. Fix navbar/sidebar/mobile inconsistencies.
8. Perform a final consistency check.

The finished result should feel like the same Yatrivo product that already exists, but now with a much cleaner and more logical UX.

Most importantly:

Do not judge completion by whether a screen exists.

Judge completion by whether the complete flow works:

USER
Explore
→ Destination
→ Trip
→ Trip Detail
→ Inquiry

ADMIN
→ Receive Inquiry
→ Manage Inquiry
→ Create Booking
→ Manage Booking
→ Complete Trip
→ Request Review
→ Approve Review

CONTENT
→ Admin edits
→ Data updates
→ Public UI reflects the change

MEDIA
→ Upload/Select
→ Organize
→ Reuse

Keep the implementation practical, visually consistent, and as close as possible to the current approved Yatrivo design.
