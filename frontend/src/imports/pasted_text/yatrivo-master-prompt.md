YATRIVO — MASTER FIGMA AI PROMPT

IMPORTANT: This is the complete master prompt for the Yatrivo website and admin-panel prototype. Treat this prompt as the PRIMARY SOURCE OF TRUTH. The reference images I provide alongside this prompt are visual references only. Do not blindly copy every screen, section, label, or structure from the reference images. Some reference images intentionally contain overlapping or incomplete screens. Use them to understand the visual language, density, component style, admin layout, and design direction. Follow this prompt for the actual information architecture, UX, interactions, pages, states, and functionality.


---

0. OVERALL OBJECTIVE

Take the existing Yatrivo Figma design/prototype and turn it into a complete, coherent, clickable Version 1 travel website and admin-panel prototype.

The existing design is already the visual foundation. Do not redesign the entire product from scratch. Preserve the existing Yatrivo visual identity, typography, colors, spacing, cards, imagery style, buttons, components, and overall aesthetic wherever they are already working well.

The main goal now is to complete the UX, page architecture, interactions, navigation, responsive behavior, user account experience, enquiry workflow, custom trip planner, and complete admin interface.

The result must NOT feel like a collection of static UI screens.

It must feel like a real, thoughtfully designed travel platform where:

users can explore without logging in;

destinations and packages are connected;

filters actually work;

travel styles lead to filtered packages;

users can save/favourite trips;

login appears only when genuinely necessary;

users can enquire through WhatsApp without an account;

enquiries are recorded;

logged-in users can see their enquiry history;

custom trips can be requested;

the entire mobile experience is intentionally designed;

the admin can manage the entire platform.



---

1. DESIGN PRINCIPLES

Follow these principles throughout the entire design.

Explore first, ask later

A new visitor should be able to enter the website from Instagram, social media, search, or a direct link and immediately explore.

Do NOT put a login screen before the homepage.

The user should be able to:

browse destinations;

browse packages;

view destination details;

view trip details;

use filters;

explore travel styles;

read reviews;

use the custom trip planner;

submit an enquiry;

enquire through WhatsApp;


without being forced to create an account.

Account should add value

Login should be introduced when the user tries to use functionality that genuinely benefits from an account, such as:

saving;

favouriting;

wishlist;

viewing saved trips;

viewing enquiry history;

managing preferences.


Do not interrupt normal browsing.

Enquiry-first Version 1

Do NOT create a complicated instant-booking engine.

Yatrivo Version 1 should primarily be an enquiry and assisted-booking platform.

The user expresses interest → Yatrivo receives the lead → team follows up → itinerary/quote → payment → booking.

Conversion-focused

Important CTAs should be visually clear without becoming aggressive.

Prioritize:

Explore Trips

Plan My Trip

View Details

Save/Favourite

Enquire

WhatsApp to Enquire



---

2. GLOBAL WEBSITE STRUCTURE

Audit the existing Figma file first.

Do not duplicate pages that already exist.

Complete or create the following website structure where missing:

Main pages

1. Loading / Opening Experience


2. Homepage


3. Destinations List


4. Destination Detail


5. Packages / Trips List


6. Individual Trip / Package Detail


7. Custom Trip Planner


8. Enquiry Flow


9. Login / Signup


10. User Profile


11. My Favourites / Saved Items


12. My Enquiries / Enquiry History


13. About


14. Contact


15. FAQ


16. Terms & Conditions


17. Privacy Policy



If any of these informational pages already exist, preserve and connect them instead of duplicating them.


---

3. GLOBAL NAVIGATION

The website must have a consistent navigation system across desktop and mobile.

Navigation should logically provide access to:

Home

Destinations

Trips / Packages

Custom Trip Planner

About

Contact

User account/profile when logged in

Login when logged out


Do not overcrowd the navigation.

Use appropriate CTA treatment for the most important action.


---

4. LOADING / OPENING EXPERIENCE

Create a polished Yatrivo loading/opening experience.

It should:

use Yatrivo branding;

display the Yatrivo mountain/logo identity;

use the tagline "Explore More. Travel Better." where appropriate;

use a subtle tasteful loading animation;

feel premium and travel-oriented;

transition naturally into the homepage;

not unnecessarily delay the user.


Also represent appropriate loading states where needed:

Login

OTP verification

Profile loading

Enquiry submission

WhatsApp enquiry preparation

Custom Trip Planner submission

Search/filter operations where appropriate

Admin data loading.



---

5. HOMEPAGE — DESKTOP

Audit and complete the existing homepage.

The homepage should communicate Yatrivo's value immediately.

Maintain the existing hero design direction.

Primary hero actions should include:

Explore Trips

Plan My Trip


The homepage should contain the appropriate sections already established in the design, plus the following required sections.


---

Travel Style

Replace the existing concept "Choose your Himalayan Rhythm" with a Travel Style section.

Travel styles should include relevant options such as:

Trekking

Solo

Couple

Family

Friends

Group

Weekend

Adventure

Spiritual

Nature


Do not overload the UI if all options are not appropriate.

The Travel Style cards/options must be clickable.

Interaction

Example:

User clicks Solo

→ Packages page opens

→ Solo filter is already selected

→ package results correspond to Solo travel.

The same behavior should work for every Travel Style.


---

6. HOMEPAGE — MOBILE

The mobile homepage must not simply be a compressed desktop version.

Audit the existing mobile design and add the currently missing sections:

Travel Style

Why Choose Us

Ratings / Reviews

"Ready for your next escape?" CTA at the bottom


Maintain a good visual rhythm between sections.

Ensure:

cards are readable;

CTAs are easy to tap;

sections do not feel cramped;

images remain visually strong;

typography remains consistent;

spacing is intentional.



---

7. MOBILE NAVBAR — IMPORTANT

Redesign the mobile navbar according to the supplied mobile reference image and the following behavior.

On pages with a full-bleed hero

Especially the homepage:

At the top of the page:

navbar should be transparent;

navbar should overlay the hero image;

hero image should visually continue behind the navbar;

Yatrivo logo should remain readable;

hamburger/menu icon should remain readable.


Do not use the current white navbar over the hero if it unnecessarily breaks the visual continuity.

Scroll behavior

Implement a contextual navbar.

At the top:

Transparent navbar

When the user scrolls downward:

Navbar hides smoothly

When the user scrolls upward:

Navbar reappears

When it reappears after scrolling beyond the hero:

Use a solid/semi-transparent blurred background so navigation remains readable.

When the user returns to the top of the hero:

Transition back to the transparent navbar.

Do not abruptly switch states.

Other pages

Pages without full-bleed hero imagery should use the normal solid navbar from the beginning.

Examples:

Destinations

Packages

Profile

Enquiry

Custom Trip Planner

other content-heavy pages.


Do NOT use transparent navigation universally.


---

8. DESTINATIONS LIST

Complete the existing Destinations page.

Each destination card should support appropriate actions.

Cards should contain information such as:

Destination image

Destination name

Region/state

Number of trips/packages where relevant

Short supporting information

Favourite/save action where appropriate

View/explore action


Critical interaction

Clicking a destination must open the correct Destination Detail page.

Do not make every destination card lead to the same generic page.

The prototype should demonstrate meaningful destination-specific navigation.


---

9. DESTINATION DETAIL PAGE

Audit the existing Destination Detail page.

If it already exists, complete and connect it.

If anything essential is missing, add it without unnecessarily redesigning the existing page.

A destination detail experience should communicate:

destination hero imagery;

destination name;

location/region;

introduction;

why visit;

highlights;

activities/experiences;

suitable travel styles;

available trips/packages;

relevant travel information;

gallery;

FAQs where appropriate;

strong CTA to explore trips;

save/favourite action;

enquiry/planning CTA where appropriate.


The destination's available packages should be clickable.

Flow

Destination Detail → Package Card → Individual Trip Detail


---

10. PACKAGES / TRIPS LIST

Complete the existing Trips/Packages page.

Package cards should contain appropriate information such as:

image;

package name;

destination;

duration;

travel style;

starting price;

difficulty where relevant;

status/availability where appropriate;

favourite/save;

View Details.


Cards must be interactive.

Filters

Create functional filters such as:

Destination

Travel Style

Duration

Budget / Price

Difficulty

other relevant package filters already established in the design.


Filters must actually change the displayed results in the prototype.

Do not create decorative filter buttons that do nothing.


---

11. TRAVEL STYLE FILTER FLOW

Travel Style selections from the homepage and other relevant locations must connect to the package listing.

Example:

Homepage → Solo

→ Packages page

→ Solo filter active

→ matching packages displayed.

The selected filter should be visually obvious.

Users should be able to remove/change the filter.


---

12. FUNCTIONAL DROPDOWNS, FILTERS AND SORTING

Any control that visually looks interactive must actually behave interactively in the prototype.

This is particularly important because some current designs contain sorting/filter controls that visually look like dropdowns but do not actually open anything.

Make these functional:

Destination dropdown

Travel Style dropdown

Status dropdown

Duration dropdown

Difficulty dropdown

Budget/price dropdown

Sort dropdown

Date selector

Search

Filter panel

Pagination

Tabs

Profile menu.


Dropdown behavior

A dropdown should:

open when clicked;

display appropriate options;

allow selection;

show selected state;

close appropriately;

update the visible filter/state.


Do not create fake dropdown arrows.


---

13. INDIVIDUAL TRIP / PACKAGE DETAIL PAGE

Create or complete the detailed trip page.

This is the page opened when the user selects a package.

It must include:

Hero

Hero image

Package/trip name

Location

Duration

Starting price

Strong enquiry CTA


Quick facts

Duration

Starting point

Suitable for

Difficulty where relevant

Travel style where appropriate


Gallery

Main gallery

Multiple images

Thumbnail interaction

Full/gallery viewing behavior where appropriate


Overview

Include:

Experience description

What makes the trip special

Important highlights.


Itinerary

Create a day-by-day expandable itinerary.

Example:

Day 1

Day 2

Day 3

Day 4


Each day should expand/collapse.

Include:

day title;

description;

relevant imagery where appropriate;

activities;

important notes.


Accommodation

Show:

accommodation information;

category/type;

relevant notes.


Transport

Show:

transport details;

pickup/drop information where appropriate.


Inclusions

Clearly list what is included.

Exclusions

Clearly list what is not included.

Pricing

Use clear "Starting from" language.

This is important because the final price can depend on:

group size;

season;

other trip variables.


Do not imply that the displayed starting price is always the final price.

Optional Add-ons

Display optional extras/add-ons with appropriate pricing.

Cancellation / Refund

Provide a clear summary.

Important Notes

Include relevant information such as:

weather;

permits;

registrations;

fitness requirements;

activity restrictions;

destination-specific requirements;

other important preparation information.


FAQ

Create trip-specific FAQs.

Save/Favourite

Include an appropriate save/favourite action in a visible but non-intrusive position.

Share

Provide a share action where appropriate.


---

14. MOBILE TRIP DETAIL

The mobile trip-detail experience should be intentionally designed.

Do not simply stack the desktop layout.

Make:

gallery easy to use;

itinerary expandable;

sections readable;

pricing prominent;

important information scannable.


Most importantly, include a sticky mobile bottom CTA:

WhatsApp to Enquire

This should remain accessible while the user scrolls.

The sticky CTA should not conflict with the navbar or page content.


---

15. SAVE / FAVOURITE SYSTEM

Since Yatrivo now supports user accounts, introduce appropriate save/favourite controls.

Place them naturally on:

destination cards;

destination detail;

package cards;

trip detail;

other appropriate travel content.


Use a clear inactive/active state.

Example:

♡ Save

→

♥ Saved

Do not add save buttons everywhere unnecessarily.


---

16. LOGGED-OUT SAVE BEHAVIOR

A user does not need to log in to browse.

However, when a logged-out user attempts to save/favourite an item:

Show a login/signup card or modal explaining the benefit.

For example:

Save your favourite trips

Create an account to save destinations and trips and access them anytime.

Provide:

Continue with Mobile

Continue with Google

appropriate authentication options

Close / Maybe Later.


After successful authentication:

return the user to the original context;

preserve the intended action;

complete the save/favourite action where appropriate.


Do not unnecessarily throw the user to an unrelated page.


---

17. USER LOGIN / SIGNUP

Create the complete user authentication experience.

Supported authentication methods:

Mobile

Enter mobile number

Send OTP

OTP verification

Resend OTP

Edit number

Verification loading state

Invalid OTP state

Successful authentication


Google

Provide:

Continue with Google

General

Include:

Login

Signup/account creation

Loading states

Error states

Success states

Close/back

Appropriate transitions.


Login should NOT be the first screen of the website.


---

18. USER PROFILE

Create a complete user profile/account area.

Profile information

Profile image

Name

Email

Mobile number

Edit Profile


My Travel

Favourite destinations

Saved packages

Saved trips

Wishlist where appropriate

Recently viewed


My Enquiries / Booking Enquiry History

Logged-in users should be able to see enquiries they previously submitted.

Each enquiry should show:

Trip/package

Destination

Date submitted

Travel date

Number of travellers

Enquiry status

View details.


Possible status examples:

Submitted

Contacted

Quoted

Confirmed

Lost

Cancelled


Preferences

Include appropriate:

Travel preferences

Preferred travel styles

Notification preferences.


Account

Include:

Settings

Privacy

Help/support

Logout.


Do not add unnecessary features that do not belong in Version 1.


---

19. ENQUIRY-FIRST WORKFLOW

Yatrivo Version 1 should NOT have an instant booking engine.

The core flow is:

User explores

→ User clicks Enquire / WhatsApp

→ Essential details are captured

→ Enquiry is recorded

→ Structured WhatsApp message is prepared/sent

→ Yatrivo team receives enquiry

→ Team contacts user

→ Final itinerary and quote

→ Payment link after confirmation

→ Internal booking status updated


---

20. ENQUIRY FORM

Create the enquiry form.

Fields:

Name

Phone / WhatsApp

Email

Travel date

Number of travellers

Package/trip

Pickup city

Message


Where the enquiry originates from a package page, automatically prefill:

package/trip;

destination where appropriate.


Allow the user to edit appropriate fields.

Create:

default state;

focused/input states where appropriate;

validation;

invalid field state;

submission loading;

success/confirmation.



---

21. WHATSAPP ENQUIRY FLOW

This is critical.

A user must be able to raise a WhatsApp enquiry without logging in.

Flow

Trip Detail

→ WhatsApp to Enquire

→ Enquiry form

→ User enters details

→ User clicks:

Send Enquiry on WhatsApp

→ Website records the enquiry

→ Website prepares a structured WhatsApp message

→ The message is sent/opened toward the relevant Yatrivo WhatsApp account

→ User can continue the conversation through WhatsApp.

The prototype should visually represent this complete journey.


---

22. WHATSAPP MESSAGE CONTENT

The generated WhatsApp message should be professionally formatted.

It should contain relevant metadata and form information, including where available:

Customer name

Mobile number

WhatsApp number

Email

Package/trip name

Destination

Travel date

Number of travellers

Pickup city

User's message

Other relevant enquiry metadata.


The final message should feel like a real enquiry received by the Yatrivo team, not an unstructured dump of form fields.

The exact technical WhatsApp integration is implementation work, but the Figma prototype must clearly represent the intended experience and message structure.


---

23. LOGGED-OUT WHATSAPP ENQUIRY

A logged-out user should still be able to submit an enquiry.

The system should associate the enquiry with:

the mobile number entered into the form;


or, where applicable,

the number used for the WhatsApp communication.


Do not require account creation before sending the enquiry.

The user should receive a confirmation such as:

Enquiry received

Yatrivo will contact you shortly through WhatsApp/call.


---

24. LOGGED-IN WHATSAPP ENQUIRY

If the user is logged in:

associate the enquiry with their account;

record it in the database;

allow the user to see it in Profile → My Enquiries / Enquiry History.


Do not make the logged-in flow significantly more complicated.


---

25. CUSTOM TRIP PLANNER

Create a simple multi-step Custom Trip Planner.

This should be suitable for users who don't know exactly which package they want.

Collect:

Destination

Destination

Not decided


Dates

Travel dates

Flexible dates


Travellers

Number of travellers


Starting city

Starting city


Travel type

Couple

Friends

Family

Solo

Group


Budget

Budget per person


Interests

Nature

Adventure

Spiritual

Relaxation

Photography

Camping


Accommodation

Accommodation preference


Special requirements

Special requirements / notes


Contact

Name

Phone/WhatsApp

Email


Use:

progress indicator;

Back;

Next;

validation;

sensible grouping;

final submission;

loading state;

confirmation state.


The confirmation should explain that Yatrivo's team will review the requirements and get in touch.


---

26. INFORMATIONAL WEBSITE PAGES

Audit whether these already exist.

If missing, create appropriate Version 1 pages:

About

Communicate:

Yatrivo identity;

travel philosophy;

what makes Yatrivo different;

relevant trust-building information.


Contact

Include:

contact information;

WhatsApp/contact CTA;

enquiry CTA;

appropriate contact form if relevant.


FAQ

Create general website/travel FAQs where appropriate.

Terms & Conditions

Create an appropriate content page.

Privacy Policy

Create an appropriate content page.

Do not invent excessive legal text; the prototype only needs the appropriate content structure.


---

27. REVIEWS / RATINGS

The website should visibly use reviews/ratings where already appropriate.

Include the mobile homepage ratings section.

Reviews should also be represented appropriately in trip/package or trust-building areas.

Use:

star ratings;

customer name;

short review;

appropriate date/context.


Do not overload every page.


---

28. FOOTER

Ensure a consistent website footer.

It should contain appropriate:

Yatrivo branding;

tagline;

navigation;

destinations/packages;

About;

Contact;

FAQ;

Terms;

Privacy;

social/contact links where appropriate.


Maintain the existing visual identity.


---

29. ADMIN PANEL — MAJOR REQUIREMENT

Create the complete Yatrivo Admin Panel.

The reference admin images provided alongside this prompt are visual references only.

They demonstrate:

dark teal sidebar;

Yatrivo branding;

white/light content surfaces;

rounded cards;

charts;

tables;

forms;

filters;

tabs;

status badges;

travel imagery;

modern SaaS-style layout.


However, the reference images are NOT the source of truth.

Do not blindly reproduce overlapping screens from the references.

The information architecture and functionality defined below are the source of truth.

Create a consistent admin design system and reuse components throughout.


---

30. ADMIN ACCESS / LOGIN

Admin authentication must be separate from normal user authentication.

There should be a dedicated admin URL, conceptually:

/admin

If admin session is active

Opening /admin should:

Directly open Admin Dashboard

Do not show login again.

If no active session

Opening /admin should:

Show Admin Login

Admin login should include:

Email/username

Password

Show/hide password

Login button

Forgot password

Loading state

Invalid credentials state

Successful login

Session-expired state

Logout.


Normal customer accounts must NOT automatically have admin access.


---

31. ADMIN SIDEBAR

Create a consistent admin sidebar.

Include relevant sections:

Dashboard

Enquiries

Trips / Packages

Destinations

Bookings

Users

Reviews

Media / Gallery

Website Content

Analytics

Notifications

Settings


Where needed, sections may have nested navigation.

Do not duplicate navigation unnecessarily.

The sidebar should have:

active state;

hover state;

selected state;

notification/count badges where useful;

mobile/collapsed behavior where appropriate.



---

32. ADMIN DASHBOARD

Create a complete dashboard.

Include:

KPI cards

Examples:

Total Enquiries

Confirmed Bookings

Total Trips

Total Destinations


Additional useful metrics may include:

Website visitors

Conversion rate

Revenue where appropriate.


Charts

Include:

Enquiries Trend

Enquiries by Status

relevant analytics.


Recent Enquiries

Show:

customer;

trip/query;

date;

status;

actions.


Quick Actions

Examples:

Add New Trip

Add Destination

View All Enquiries

Manage Reviews

Upload Media

Update Website Content.


Make these clickable.


---

33. ADMIN ENQUIRIES / LEADS

Create an enquiry-management screen.

Include:

All enquiries

New

Contacted

Quoted

Confirmed

Lost

Cancelled where appropriate


Provide:

Search

Filter

Sort

Date filtering

Export where appropriate

Pagination

Add Enquiry.


Table should contain:

Name

Email/Phone

Trip/Query

Date

Status

Actions.



---

34. ADMIN ENQUIRY DETAILS / CRM

Clicking an enquiry should open detailed CRM information.

Show:

Customer

Name

Phone

WhatsApp

Email

Location where relevant

Preferred contact method


Trip

Trip/package

Travel date

Number of travellers

Pickup city

Query/message


Status

Allow admin to update:

New

Contacted

Quoted

Confirmed

Lost

Cancelled


Assignment

Assign team member


Follow-up

Follow-up date


Internal Notes

Admin can add notes.

Activity Timeline

Show events such as:

Enquiry received

Trip viewed

Form submitted

Contacted

Quote sent

Status updated.



---

35. ADMIN TRIPS / PACKAGES

Create a Trips/Packages management page.

Include:

Search

Destination filter

Travel Style filter

Status filter

Sorting

Add New Trip

Edit

Duplicate

Archive/delete where appropriate

Draft/Published status.


Trip cards/table should contain:

image;

package name;

destination;

duration;

price;

status;

actions.



---

36. CREATE NEW TRIP

Create a complete multi-section trip creation interface.

Sections:

Basic Information

Itinerary

Inclusions & Exclusions

Pricing

Images & Gallery

SEO & Settings


Basic information

Trip name

Destination

Travel style

Duration

Difficulty

Short description

Highlights/key features.


Include:

Save as Draft

Publish Trip.



---

37. ADVANCED ITINERARY EDITING

Create an advanced itinerary editor.

Admin should be able to:

Add Day

Edit Day

Delete Day

Reorder days

Add title

Add description

Add images

Add relevant notes.


Example:

Day 1 — Haridwar to Chopta
Day 2 — Tungnath Trek
Day 3 — Chandrashila Summit
Day 4 — Departure

Use an intuitive editor.


---

38. INCLUSIONS / EXCLUSIONS

Admin should manage:

Inclusions

Examples:

Accommodation

Meals

Trek leader

Permits

First aid

Transport.


Exclusions

Examples:

Personal expenses

Travel insurance

Emergency evacuation

Other applicable expenses.


Allow:

Add

Edit

Delete

Reorder.



---

39. PRICING MANAGEMENT

Create a dedicated pricing section.

Support:

Starting price

Pricing notes

Group-size considerations

Seasonal variation

Optional add-ons

Per-person pricing

Per-group pricing where appropriate.


Clearly communicate that the public-facing price can be:

Starting from ₹X

when final pricing depends on variables.


---

40. CANCELLATION POLICY ADMIN

Allow admin to configure cancellation/refund information.

Example structure:

More than 15 days → 100% refund

7–15 days → 50% refund

Less than 7 days → No refund


Do not assume these exact values are final business policy; use them as UI examples.


---

41. MEDIA / GALLERY MANAGEMENT

Create a complete media-management screen.

Include:

All media

Images

Videos

Documents where appropriate

Search

Type filter

Trip/destination filter

Sort

Upload Media

Multi-select

Delete/manage media.


Each media item can show:

thumbnail;

filename;

file size;

type;

associated trip/content;

actions.



---

42. DESTINATIONS MANAGEMENT

Create admin destination management.

Include:

Destination image

Destination name

State/region

Number of trips

Status

Actions.


Support:

Search

Add Destination

Edit

Publish/unpublish

Draft

Archive/delete where appropriate.



---

43. DESTINATION EDITOR

Create appropriate editing functionality for:

Destination name

Region

Description

Highlights

Experiences

Travel information

Gallery

Related packages

FAQs

SEO

Publish status.



---

44. BOOKINGS

Create a booking-management section even though Version 1 is enquiry-first.

Bookings represent enquiries that have eventually been confirmed.

Include:

Booking ID

Customer

Trip/package

Travel date

Status

Actions.


Tabs/statuses:

All

Upcoming

Ongoing

Completed

Cancelled.


Statuses can include:

Upcoming

Confirmed

Ongoing

Completed

Cancelled.


Include:

Search

Filter

Sort

Export where appropriate

Pagination.



---

45. USERS MANAGEMENT

Create user-management UI.

Include:

All users

Active

Inactive

Admins

Team members where appropriate.


Table:

Name

Email/Phone

Joined On

Status

Role

Actions.


Support:

Search

Filter

Sort

Add User

Edit

Activate/deactivate

Role assignment.



---

46. ROLES & PERMISSIONS

Create a roles/permissions interface.

Allow admin to manage roles such as:

Super Admin

Admin

Team Member

Content Manager

other appropriate roles.


Permissions should cover areas such as:

Dashboard

Enquiries

Trips

Destinations

Bookings

Users

Reviews

Media

Website Content

Analytics

Notifications

Settings.


Use clear permission controls.


---

47. REVIEWS & TESTIMONIALS ADMIN

Create:

All Reviews

Published

Pending

Flagged


Include:

Customer

Rating

Comment

Date

Status

Actions.


Admin should be able to:

publish;

unpublish;

moderate;

flag;

manage review content.



---

48. WEBSITE CONTENT MANAGEMENT

Create a content-management interface.

Manage:

Pages

Homepage sections

Banners

FAQs

Other website content.


Each page can show:

Page title

URL/slug

Last updated

Status

Actions.


Support:

Add New Page

Edit

Preview

Publish

Draft.



---

49. SEO MANAGEMENT

Within website/trip/destination editing, provide SEO controls.

Include:

SEO title

URL/slug

Meta title

Meta description

Featured image

Search preview where appropriate.


Do not make SEO controls unnecessarily complex.


---

50. ANALYTICS

Create an Analytics & Reports section.

Include:

KPI cards

Website Visitors

Enquiries

Confirmed Bookings

Conversion Rate


Charts

Visitors trend

Enquiries trend

Traffic sources

Popular pages

Enquiry conversion funnel.


Provide date range filtering.

Use realistic example data.


---

51. NOTIFICATIONS & COMMUNICATIONS

Create notification-management UI.

Categories may include:

Enquiry

Booking

User

System

Marketing.


Show:

Notification title

Type

Audience

Date

Status

Actions.


Include:

Send Notification

Schedule where appropriate

Notification history.



---

52. ADMIN SETTINGS

Create comprehensive settings.

Include:

General

Website name

Tagline

Website URL

Support email

Currency

Timezone

Logo

Favicon.


Website settings

Contact details

Social media

Email notifications

Notification settings

Payment settings

User management

Permissions

Backup/security

Use a left-side settings navigation where appropriate.

Include:

Save Changes

and appropriate success/error states.


---

53. ADMIN PROFILE

Create an admin profile area.

Include:

Admin name

Profile image/avatar

Email

Role

Change password

Account settings

Logout.


Keep this separate from customer profile.


---

54. AUDIT LOGS

Create an Audit Logs / Activity History screen.

Show:

User

Action

Details

Date & Time

IP address where appropriate.


Provide:

Search

Filter

Date range

Pagination.


Example actions:

Updated Trip

Added Enquiry

Published Destination

Added User

Updated Content

Deleted Media

Updated Settings

Exported Data.



---

55. ADMIN RESPONSIVE DESIGN

The admin interface should also be responsive where appropriate.

Desktop is the primary admin experience, but do not leave mobile/tablet behavior undefined.

Adapt:

sidebar;

tables;

filters;

forms;

cards;

navigation;

action buttons.


Do not merely shrink large desktop tables until they become unusable.


---

56. EMPTY STATES

Create sensible empty states where useful.

Examples:

No saved trips

No saved trips yet

Explore Yatrivo and save the journeys you love.

CTA:

Explore Trips

No enquiries

No enquiries yet

Your trip enquiries will appear here.

No search results

No trips found

Try changing your filters.

Admin empty states

Examples:

No enquiries

No bookings

No reviews

No media

No destinations.


Use appropriate CTA/action.


---

57. ERROR STATES

Represent appropriate errors for important interactions.

Examples:

Invalid OTP

Incorrect admin credentials

Required form field missing

Failed enquiry submission

Failed save action

Invalid email/mobile

Search/filter returns no results.


Error messages should be clear and actionable.


---

58. SUCCESS STATES

Create appropriate success feedback.

Examples:

Saved successfully

Favourite added

Profile updated

Enquiry submitted

WhatsApp enquiry prepared

Custom trip request submitted

Trip published

Destination updated

Review published

Settings saved.


Do not make every success state a full-screen interruption.

Use appropriate toast, inline confirmation, modal, or dedicated confirmation screen depending on context.


---

59. SEARCH

Where search exists, make it functional in the prototype.

Website search should behave sensibly for:

destinations;

trips/packages;

relevant content.


Admin search should work for:

enquiries;

trips;

destinations;

users;

media;

reviews;

content.


Provide appropriate no-result states.


---

60. PAGINATION

Where tables/lists contain multiple records, pagination controls must behave like real controls.

Show:

previous;

next;

page numbers;

active page.


Ensure the active page state changes.


---

61. TABS

All tabs should be interactive.

Examples:

Website:

package categories/status;

profile sections where appropriate.


Admin:

enquiry statuses;

booking statuses;

review statuses;

user categories;

media categories;

notification categories.


Selected tabs must visibly change state/content.


---

62. GALLERIES

Image galleries should have proper interaction.

Allow:

thumbnail selection;

main image update;

additional image count;

appropriate full-screen/gallery interaction where useful.


Use high-quality Himalayan/travel imagery consistent with the existing design.


---

63. COMPONENT CONSISTENCY

Create/reuse a consistent component system for:

Buttons

Cards

Inputs

Dropdowns

Checkboxes

Radio buttons

Tabs

Badges

Modals

Toasts

Accordions

Tables

Pagination

Navigation

Headers

Footers

Mobile CTAs.


Do not create visually different versions of the same component without a UX reason.


---

64. INTERACTION & ANIMATION

Add tasteful prototype interactions.

Use subtle:

page transitions;

dropdown animations;

accordion expand/collapse;

modal transitions;

navbar hide/reveal;

save/favourite state changes;

loading animations;

gallery transitions;

filter transitions;

button feedback.


Avoid excessive animations.

Animations should support usability, not distract from the travel imagery and content.


---

65. COMPLETE USER JOURNEYS

After building all screens, connect the entire prototype.

At minimum, these journeys must work:

Journey A — Explore destination

Loading

→ Homepage

→ Destinations

→ Destination Detail

→ Package

→ Trip Detail


---

Journey B — Travel Style

Homepage

→ Travel Style: Solo

→ Packages

→ Solo filter active

→ Select package

→ Trip Detail.


---

Journey C — Direct package exploration

Homepage

→ Packages

→ Filters

→ Package

→ Trip Detail.


---

Journey D — Save trip

Trip Detail

→ Save

→ If logged out: Login card

→ Mobile OTP / Google

→ Successful login

→ Return to Trip Detail

→ Trip becomes Saved.


---

Journey E — WhatsApp enquiry without login

Trip Detail

→ WhatsApp to Enquire

→ Enquiry Form

→ Fill details

→ Send Enquiry on WhatsApp

→ Enquiry recorded

→ Structured WhatsApp message prepared/sent

→ Confirmation.

NO LOGIN REQUIRED.


---

Journey F — WhatsApp enquiry while logged in

Logged-in user

→ Trip Detail

→ WhatsApp to Enquire

→ Form

→ Submit

→ Enquiry recorded against user

→ WhatsApp message

→ Confirmation

→ Profile → My Enquiries.


---

Journey G — Custom Trip

Homepage

→ Plan My Trip

→ Multi-step Custom Trip Planner

→ Submit

→ Confirmation.


---

Journey H — Profile

Login

→ Profile

→ Personal Information

→ Saved Trips/Favourites

→ My Enquiries

→ Enquiry Details

→ Preferences

→ Settings

→ Logout.


---

Journey I — Admin

/admin

→ If no session: Admin Login

→ Credentials

→ Dashboard

OR

/admin

→ If session active: Dashboard directly.

Then:

Dashboard

→ Enquiries

→ Enquiry Details

→ Update Status

→ Add Note

→ Assign Team Member

and:

Dashboard

→ Trips

→ Create/Edit Trip

→ Itinerary

→ Inclusions/Exclusions

→ Pricing

→ Gallery

→ SEO

→ Publish.


---

66. IMPORTANT LOGIN RULE

Never make login a mandatory gateway to the website.

The user can:

explore;

search;

filter;

view destinations;

view packages;

view trip details;

enquire through WhatsApp;

use the custom trip planner;


without authentication.

Authentication is primarily needed for:

saved/favourite items;

account-specific data;

enquiry history;

profile/preferences.



---

67. IMPORTANT WHATSAPP RULE

WhatsApp enquiry must work for both:

Logged-out user

Enquiry saved using entered/WhatsApp mobile number.

Logged-in user

Enquiry linked to their account.

Never force login immediately before WhatsApp enquiry.

The enquiry should still reach the Yatrivo admin CRM.


---

68. IMPORTANT ADMIN RULE

The admin panel is completely separate from customer authentication.

Customer login:

Mobile + OTP / Google

Admin login:

Admin credentials

Active admin session:

/admin → Dashboard

Inactive admin session:

/admin → Admin Login


---

69. REFERENCE IMAGE RULE

The supplied reference images are NOT exact screen specifications.

They are provided to communicate:

visual language;

layout density;

component style;

sidebar;

admin cards;

tables;

forms;

typography;

colors;

travel imagery;

general polish.


Some reference images contain duplicate/overlapping screens because they were generated as visual exploration.

Do not duplicate those overlaps.

Do not assume that every visible screen in a reference image must become an independent page.

Use this master prompt to determine:

what pages exist;

what belongs inside each page;

what is a modal;

what is a tab;

what is an editor section;

what is a state;

what is a flow.



---

70. DO NOT LEAVE STATIC UI

This is one of the most important requirements.

The current design contains components that visually appear functional but are currently static.

Convert the important ones into actual prototype interactions.

Do NOT leave:

dropdowns;

filters;

sorting;

tabs;

cards;

buttons;

navigation links;

save buttons;

favourite buttons;

hamburger menu;

login actions;

forms;

accordions;

pagination;

profile menus;

CTAs;


as dead UI.

Every major interactive element must either:

1. navigate somewhere;


2. open something;


3. change state;


4. submit something;


5. filter/change visible content;


6. show a relevant confirmation/error/loading state.




---

71. DO NOT OVERDESIGN

Do not add random functionality simply to make the prototype look larger.

This is a Version 1 travel platform.

Prioritize:

exploration;

destinations;

packages;

trip details;

enquiries;

WhatsApp;

custom trip requests;

saved/favourites;

profile;

admin CRM;

content management.


Avoid unnecessary features that are not justified by the product requirements.


---

72. FINAL GLOBAL AUDIT

After creating and connecting everything, perform a final UX audit of the entire Figma file.

Check:

Navigation

Does every major header link work?

Does every destination card work?

Does every package card work?

Does every CTA go somewhere logical?


Authentication

Is login optional?

Does mobile OTP work as a prototype?

Does Google login have an appropriate state?

Does logged-out saving trigger login?

Does successful login return the user to the intended context?


Enquiries

Can logged-out users enquire?

Can logged-in users enquire?

Is the enquiry recorded?

Does it appear in Admin?

Does it appear in Profile for logged-in users?

Is WhatsApp message content represented?


Packages

Do filters work?

Does Travel Style work?

Does sorting work?

Does package detail open correctly?


Trip Detail

Is the itinerary expandable?

Does gallery work?

Is pricing clear?

Are inclusions/exclusions present?

Is the sticky mobile WhatsApp CTA present?


Profile

Are saved items represented?

Are favourites represented?

Is enquiry history present?

Are settings present?


Mobile

Is the navbar transparent over hero?

Does it hide on downward scrolling?

Does it reappear on upward scrolling?

Does it become solid/blurred after leaving the hero?

Does it remain solid on normal pages?

Is the mobile homepage complete?

Is the sticky enquiry CTA usable?


Admin

Does /admin behave differently based on session state?

Is admin login separate?

Are enquiries manageable?

Are trips manageable?

Are destinations manageable?

Are bookings manageable?

Are users manageable?

Are reviews manageable?

Is media manageable?

Is content manageable?

Is SEO manageable?

Are analytics present?

Are notifications present?

Are settings present?

Are roles/permissions present?

Are audit logs present?



---

73. FINAL DESIGN QUALITY REQUIREMENT

The final Figma file should feel like a real product prototype, not a collection of AI-generated mockups.

Maintain:

strong visual hierarchy;

consistent spacing;

consistent typography;

clear CTAs;

realistic data;

realistic travel imagery;

coherent responsive behavior;

clear interaction states;

sensible transitions;

accessible tap targets;

clean mobile layouts;

polished desktop layouts.


Use the existing Yatrivo design as the foundation.

Do not replace working designs simply for the sake of change.

Build upon them.


---

74. FINAL INSTRUCTION TO FIGMA AI

FIRST inspect the existing Figma file.

Determine what already exists and what is incomplete.

Then:

1. Preserve existing completed designs.


2. Create missing pages.


3. Complete incomplete pages.


4. Create missing components.


5. Create missing states.


6. Connect all navigation.


7. Make filters/dropdowns/sorting functional.


8. Implement the complete login/account UX.


9. Implement save/favourite behavior.


10. Implement the logged-out and logged-in enquiry flows.


11. Implement the WhatsApp enquiry journey.


12. Implement Custom Trip Planner.


13. Complete the responsive mobile experience.


14. Implement contextual mobile navbar behavior.


15. Build the complete admin panel and its management workflows.


16. Connect all major prototype interactions.


17. Add loading, empty, error and success states where appropriate.


18. Perform a final end-to-end UX audit.



Do not blindly reproduce the reference images.

Do not create duplicate pages.

Do not leave major controls static.

Do not force login before exploration or WhatsApp enquiry.

Do not replace the existing Yatrivo visual identity unnecessarily.

The final deliverable should be a complete, connected, polished, responsive Yatrivo Version 1 website + user account experience + enquiry/WhatsApp workflow + custom trip planner + full admin management prototype.

The prompt above is the source of truth. The attached/reference images are supporting visual references only.