# Graph Report - .  (2026-09-23)

## Corpus Check
- 92 files · ~86,766 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 363 nodes · 382 edges · 30 communities detected
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_content_pages & faqs|content_pages & faqs]]
- [[_COMMUNITY_Database Schema v1.1 Plan & Rati...|Database Schema v1.1 Plan & Rati...]]
- [[_COMMUNITY_Frontend Build & Dev Commands & ...|Frontend Build & Dev Commands & ...]]
- [[_COMMUNITY_Core Product Journey Flow & Call...|Core Product Journey Flow & Call...]]
- [[_COMMUNITY_test-env-connections.mjs & envSt...|test-env-connections.mjs & envSt...]]
- [[_COMMUNITY_Audit Reference Screenshot & Fig...|Audit Reference Screenshot & Fig...]]
- [[_COMMUNITY_close & Field|close & Field]]
- [[_COMMUNITY_Website Corrections Reference Sc...|Website Corrections Reference Sc...]]
- [[_COMMUNITY_Database Migrations & Seed Conce...|Database Migrations & Seed Conce...]]
- [[_COMMUNITY_Database Schema Initial Review D...|Database Schema Initial Review D...]]
- [[_COMMUNITY_Design System Reference Screensh...|Design System Reference Screensh...]]
- [[_COMMUNITY_HomePage & goTo|HomePage & goTo]]
- [[_COMMUNITY_Product Core Feature Matrix & Fu...|Product Core Feature Matrix & Fu...]]
- [[_COMMUNITY_Target Users & Travel Personas &...|Target Users & Travel Personas &...]]
- [[_COMMUNITY_Frontend Developer Rules & Conve...|Frontend Developer Rules & Conve...]]
- [[_COMMUNITY_Frontend Component Architecture ...|Frontend Component Architecture ...]]
- [[_COMMUNITY_Visual Product Design Direction|Visual Product Design Direction]]
- [[_COMMUNITY_Rationale Redis Cache Boundarie...|Rationale: Redis Cache Boundarie...]]
- [[_COMMUNITY_Frontend Interactions & Micro-An...|Frontend Interactions & Micro-An...]]
- [[_COMMUNITY_Frontend Architecture Overview &...|Frontend Architecture Overview &...]]
- [[_COMMUNITY_Application Entry HTML & Font Links|Application Entry HTML & Font Links]]
- [[_COMMUNITY_Yatrivo Brand Logo Asset|Yatrivo Brand Logo Asset]]
- [[_COMMUNITY_Rishikesh Destination Card Image|Rishikesh Destination Card Image]]
- [[_COMMUNITY_Figma Travel App Design Artboard...|Figma Travel App Design Artboard...]]
- [[_COMMUNITY_Himalayan Trekking Image 2|Himalayan Trekking Image 2]]
- [[_COMMUNITY_Temple & River Landscape Image 3|Temple & River Landscape Image 3]]
- [[_COMMUNITY_Scenic Valley View Image 4|Scenic Valley View Image 4]]
- [[_COMMUNITY_Adventure Camping Image 5|Adventure Camping Image 5]]
- [[_COMMUNITY_Cultural Tour Image 6|Cultural Tour Image 6]]
- [[_COMMUNITY_Forest Trail Sunset Image 7|Forest Trail Sunset Image 7]]

## God Nodes (most connected - your core abstractions)
1. `Version 1.0 Requirements Scope` - 81 edges
2. `Database Schema v1.1 Plan` - 46 edges
3. `Table: trips` - 17 edges
4. `Table: enquiries` - 14 edges
5. `Table: bookings` - 14 edges
6. `Table: destinations` - 11 edges
7. `Table: reviews` - 11 edges
8. `Table: media_assets` - 11 edges
9. `Table: trip_instances` - 9 edges
10. `main()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Project Standard Port Mapping` --semantically_similar_to--> `Standard Development Ports (3000 / 4000)`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `Production Frontend Source Policy` --semantically_similar_to--> `Frontend Architecture & Coding Rules`  [INFERRED] [semantically similar]
  docs/README.md → AGENTS.md
- `Common Project Commands` --semantically_similar_to--> `Frontend Build & Dev Commands`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `Figma Travel App Design Master Artboard` --implements--> `Frontend Screen Hierarchy & Layouts`  [INFERRED]
  frontend/src/imports/Travel_App_Design__Community___Copy_.png → docs/frontend/screens.md
- `Technical Architecture Constraints` --conceptually_related_to--> `Database Technology Stack (PostgreSQL/Neon/Prisma)`  [INFERRED]
  docs/product.md → database/README.md

## Hyperedges (group relationships)
- **Enquiry to Booking Operational Pipeline** — dbschema_v1_table_enquiries, dbschema_v1_table_bookings, dbschema_v1_table_enquiry_events, dbschema_v1_table_booking_travellers, dbschema_v1_table_booking_payments [EXTRACTED 1.00]
- **Trip Catalog and Package Definition Pattern** — dbschema_v1_table_trips, dbschema_v1_table_destinations, dbschema_v1_table_trip_destinations, dbschema_v1_table_trip_instances, dbschema_v1_table_trip_itinerary_days [EXTRACTED 1.00]
- **Multi-Provider Authentication & Session Architecture** — dbschema_v1_table_users, dbschema_v1_table_user_auth_identities, dbschema_v1_table_refresh_tokens, dbschema_v1_table_otp_challenges [EXTRACTED 1.00]
- **Verified Customer Review Workflow** — dbschema_v1_table_bookings, dbschema_v1_table_review_requests, dbschema_v1_table_reviews, dbschema_v1_table_review_media [EXTRACTED 1.00]
- **Homepage Dynamic CMS Configuration System** — dbschema_v1_table_homepage_config, dbschema_v1_table_homepage_slides, dbschema_v1_table_homepage_featured_destinations, dbschema_v1_table_homepage_featured_reviews, dbschema_v1_table_homepage_why_us_points [EXTRACTED 1.00]
- **Brand Trust and Compliance Governance** — requirements_br_003, requirements_br_004, requirements_fr_066, dbschema_v1_table_reviews [INFERRED 0.85]
- **Frontend Design System & User Flow Governance** — doc_frontend_components, doc_frontend_interactions, doc_frontend_screens, spec_yatrivo_design_refinement, flow_plan_my_trip_funnel [INFERRED 0.85]
- **Admin Operations, Content, and Moderation Suite** — spec_yatrivo_website_corrections, rule_centralized_media_library, workflow_review_moderation_lifecycle, rule_no_customer_accounts [EXTRACTED 0.90]

## Communities

### Community 0 - "content_pages & faqs"
Cohesion: 0.03
Nodes (83): Table: content_pages, Table: faqs, Table: site_settings, Table: tracking_events, Primary Site and URL Structure, BR-001 Enquiry-First Version 1, BR-002 Starting Price Language, BR-003 Genuine Reviews Only (+75 more)

### Community 1 - "Database Schema v1.1 Plan & Rati..."
Cohesion: 0.09
Nodes (51): Database Schema v1.1 Plan, Rationale: Derived Remaining Capacity Calculation, Rationale: Object Storage Metadata & Multi-Entity Media Join Tables, Rationale: Integer Paise for Monetary Amounts, Rationale: Optional Customer Accounts in V1, Rationale: Token-Hashed Review Requests Without Login, Rationale: Soft Lifecycle & Operational Record Retention, Rationale: Many-to-Many Multi-Stop Trip Destinations with is_primary (+43 more)

### Community 2 - "Frontend Build & Dev Commands & ..."
Cohesion: 0.11
Nodes (20): Frontend Build & Dev Commands, Frontend Architecture & Coding Rules, Rationale: Canonical Figma-Originated Frontend Source, Repository Structure Specification, Standard Development Ports (3000 / 4000), System Architecture Rules Reference, Yatrivo Agent Guide, Backend Service Status & Port Allocation (+12 more)

### Community 4 - "Core Product Journey Flow & Call..."
Cohesion: 0.22
Nodes (9): Core Product Journey Flow, Call-To-Action Strategy, Product Goals & Mobile-First Strategy, Yatrivo Product Overview, Product Brand Positioning & Tagline, Product Problem Statement, Rationale: Non-Instant Booking Enquiry-Led Model for V1, Trust & Credibility Mechanisms (+1 more)

### Community 6 - "test-env-connections.mjs & envSt..."
Cohesion: 0.46
Nodes (7): envStatus(), main(), redact(), testDatabase(), testS3(), testUpstashRedis(), testWhatsApp()

### Community 10 - "Audit Reference Screenshot & Fig..."
Cohesion: 0.29
Nodes (7): Audit Reference Screenshot, Figma Travel App Design Master Artboard, Trip Instance Combined Package & Date Concept, Frontend Screen Hierarchy & Layouts, Plan My Trip Package + Date Inquiry Funnel, Yatrivo Audit Implementation Plan, Yatrivo Master Product Prompt & Architecture

### Community 12 - "close & Field"
Cohesion: 0.47
Nodes (3): handleSubmit(), handleWhatsApp(), validate()

### Community 14 - "Website Corrections Reference Sc..."
Cohesion: 0.33
Nodes (6): Website Corrections Reference Screenshot, Himalayan Mountain Landscape Image 1, Native Central Media Upload Architecture, Zero Customer Account Rule (Inquiry-First Model), Yatrivo Website & Admin Corrections Pass, Post-Trip Admin Initiated Review Lifecycle

### Community 20 - "Database Migrations & Seed Conce..."
Cohesion: 0.5
Nodes (4): Database Migrations & Seed Concept, Database Architecture & Artifact Purpose, Database Technology Stack (PostgreSQL/Neon/Prisma), Technical Architecture Constraints

### Community 21 - "Database Schema Initial Review D..."
Cohesion: 0.5
Nodes (4): Database Schema Initial Review Draft, Draft Table: user_sessions (DB-backed sessions), Rationale: JWT With Rotating Refresh Tokens, Table: refresh_tokens

### Community 22 - "Design System Reference Screensh..."
Cohesion: 0.5
Nodes (4): Design System Reference Screenshot, Hero Showcase Landscape Image, Hero Carousel with Autoplay & Video/Image Slide Support, Yatrivo Design Refinement Directives

### Community 24 - "HomePage & goTo"
Cohesion: 1.0
Nodes (2): goTo(), resetTimer()

### Community 26 - "Product Core Feature Matrix & Fu..."
Cohesion: 0.67
Nodes (3): Product Core Feature Matrix, Future Product Roadmap Capabilities, Version 1 Product Scope (Must-Have vs Nice-to-Have)

### Community 39 - "Target Users & Travel Personas &..."
Cohesion: 1.0
Nodes (2): Target Users & Travel Personas, Travel Styles and User Intent Categories

### Community 40 - "Frontend Developer Rules & Conve..."
Cohesion: 1.0
Nodes (2): Frontend Developer Rules & Conventions, Claude Code Frontend Engineering Protocol

### Community 41 - "Frontend Component Architecture ..."
Cohesion: 1.0
Nodes (2): Frontend Component Architecture Specification, Dynamic Page-Aware Transparent Navbar Pattern

### Community 67 - "Visual Product Design Direction"
Cohesion: 1.0
Nodes (1): Visual Product Design Direction

### Community 68 - "Rationale: Redis Cache Boundarie..."
Cohesion: 1.0
Nodes (1): Rationale: Redis Cache Boundaries & Source-of-Truth Rules

### Community 69 - "Frontend Interactions & Micro-An..."
Cohesion: 1.0
Nodes (1): Frontend Interactions & Micro-Animations

### Community 70 - "Frontend Architecture Overview &..."
Cohesion: 1.0
Nodes (1): Frontend Architecture Overview & Guidelines

### Community 71 - "Application Entry HTML & Font Links"
Cohesion: 1.0
Nodes (1): Application Entry HTML & Font Links

### Community 72 - "Yatrivo Brand Logo Asset"
Cohesion: 1.0
Nodes (1): Yatrivo Brand Logo Asset

### Community 73 - "Rishikesh Destination Card Image"
Cohesion: 1.0
Nodes (1): Rishikesh Destination Card Image

### Community 74 - "Figma Travel App Design Artboard..."
Cohesion: 1.0
Nodes (1): Figma Travel App Design Artboard Copy

### Community 75 - "Himalayan Trekking Image 2"
Cohesion: 1.0
Nodes (1): Himalayan Trekking Image 2

### Community 76 - "Temple & River Landscape Image 3"
Cohesion: 1.0
Nodes (1): Temple & River Landscape Image 3

### Community 77 - "Scenic Valley View Image 4"
Cohesion: 1.0
Nodes (1): Scenic Valley View Image 4

### Community 78 - "Adventure Camping Image 5"
Cohesion: 1.0
Nodes (1): Adventure Camping Image 5

### Community 79 - "Cultural Tour Image 6"
Cohesion: 1.0
Nodes (1): Cultural Tour Image 6

### Community 80 - "Forest Trail Sunset Image 7"
Cohesion: 1.0
Nodes (1): Forest Trail Sunset Image 7

## Knowledge Gaps
- **110 isolated node(s):** `Repository Structure Specification`, `System Architecture Rules Reference`, `Rationale: Canonical Figma-Originated Frontend Source`, `Project Documentation Reference`, `Database Migrations & Seed Concept` (+105 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `HomePage & goTo`** (3 nodes): `HomePage.tsx`, `goTo()`, `resetTimer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Target Users & Travel Personas &...`** (2 nodes): `Target Users & Travel Personas`, `Travel Styles and User Intent Categories`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Developer Rules & Conve...`** (2 nodes): `Frontend Developer Rules & Conventions`, `Claude Code Frontend Engineering Protocol`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Component Architecture ...`** (2 nodes): `Frontend Component Architecture Specification`, `Dynamic Page-Aware Transparent Navbar Pattern`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Visual Product Design Direction`** (1 nodes): `Visual Product Design Direction`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Rationale: Redis Cache Boundarie...`** (1 nodes): `Rationale: Redis Cache Boundaries & Source-of-Truth Rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Interactions & Micro-An...`** (1 nodes): `Frontend Interactions & Micro-Animations`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Frontend Architecture Overview &...`** (1 nodes): `Frontend Architecture Overview & Guidelines`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Application Entry HTML & Font Links`** (1 nodes): `Application Entry HTML & Font Links`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Yatrivo Brand Logo Asset`** (1 nodes): `Yatrivo Brand Logo Asset`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Rishikesh Destination Card Image`** (1 nodes): `Rishikesh Destination Card Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Figma Travel App Design Artboard...`** (1 nodes): `Figma Travel App Design Artboard Copy`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Himalayan Trekking Image 2`** (1 nodes): `Himalayan Trekking Image 2`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Temple & River Landscape Image 3`** (1 nodes): `Temple & River Landscape Image 3`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Scenic Valley View Image 4`** (1 nodes): `Scenic Valley View Image 4`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Adventure Camping Image 5`** (1 nodes): `Adventure Camping Image 5`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Cultural Tour Image 6`** (1 nodes): `Cultural Tour Image 6`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Forest Trail Sunset Image 7`** (1 nodes): `Forest Trail Sunset Image 7`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Version 1.0 Requirements Scope` connect `content_pages & faqs` to `Database Schema v1.1 Plan & Rati...`, `Product Core Feature Matrix & Fu...`, `Core Product Journey Flow & Call...`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `Database Schema v1.1 Plan` connect `Database Schema v1.1 Plan & Rati...` to `content_pages & faqs`, `Database Schema Initial Review D...`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `FR-014 How It Works` connect `Core Product Journey Flow & Call...` to `content_pages & faqs`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `Repository Structure Specification`, `System Architecture Rules Reference`, `Rationale: Canonical Figma-Originated Frontend Source` to the rest of the system?**
  _110 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `content_pages & faqs` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Database Schema v1.1 Plan & Rati...` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Frontend Build & Dev Commands & ...` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._