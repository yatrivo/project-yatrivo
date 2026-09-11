# Architecture

This file defines the technical architecture for Yatrivo. The requirements document remains the source of truth for product requirements; this file defines implementation boundaries and approved technical decisions.

## Decision Status

- Approved: final decision for Version 1 unless later superseded by an explicit decision.
- Proposed: likely direction, not final and not required for implementation until approved.
- TBD: not yet decided; do not invent a technology or implementation.
- Deferred: intentionally postponed or optional at this stage.

## Architecture Principles

1. Keep Version 1 as a modular monolith.
2. Do not introduce microservices prematurely.
3. Keep frontend and backend responsibilities clearly separated.
4. Keep business logic in the backend rather than the frontend.
5. Keep database access behind the data-access/ORM layer.
6. Use TypeScript consistently across the application where applicable.
7. Keep shared types/schemas in the shared layer where appropriate.
8. Keep the architecture extensible for future online booking, payments, customer accounts, live availability, WhatsApp automation, supplier/operations workflows, and B2B functionality.
9. Do not implement future functionality merely because the architecture supports it.
10. Do not introduce infrastructure or dependencies without a concrete project requirement.

## System Overview

Yatrivo Version 1 uses a modular monolith architecture with separate deployable frontend and backend applications.

```text
User
  |
Next.js / React frontend
  |
Vercel

Frontend
  |
Backend API
  |
TypeScript backend
  |
Render
  |
Prisma
  |
Neon PostgreSQL
```

## Frontend Architecture

- Framework: Next.js, React, TypeScript
- Deployment: Vercel
- Routing: Next.js routing
- State management: [TO BE DEFINED]
- Component architecture: [TO BE DEFINED]
- Data fetching: Frontend communicates with the backend API
- Validation: [TO BE DEFINED]
- Error handling: [TO BE DEFINED]

Frontend responsibilities:

- Render the public Yatrivo website and user-facing interactions.
- Consume backend APIs for dynamic data and lead submission where required.
- Preserve the approved Figma/design specification for visual and interaction behavior.
- Avoid owning business logic that belongs in the backend.

## Backend Architecture

- Framework/runtime: TypeScript-based backend/API; exact backend framework/library is [TO BE DEFINED]
- Deployment: Render
- API architecture: [TO BE DEFINED]
- Controllers/routes: [TO BE DEFINED]
- Services: [TO BE DEFINED]
- Repository/data-access layer: Backend communicates with PostgreSQL through Prisma
- Middleware: [TO BE DEFINED]
- Validation: [TO BE DEFINED]
- Error handling: [TO BE DEFINED]
- Authentication/authorization: [TO BE DEFINED]

Backend responsibilities:

- Own business logic and workflow rules.
- Expose APIs required by the frontend and admin/CMS workflows.
- Validate server-side input.
- Keep database access behind Prisma and the data-access layer.
- Protect admin routes and customer/lead data.

## Database Architecture

- Database technology: PostgreSQL
- Provider: Neon
- ORM: Prisma
- Schema organization: [TO BE DEFINED]
- Migrations: Prisma is the approved ORM; migration process is [TO BE DEFINED]
- Seed data: [TO BE DEFINED]
- Relationships: [TO BE DEFINED]
- Indexing: [TO BE DEFINED]

Database access must flow through the backend data-access/ORM layer. Do not access the database directly from the frontend.

## Shared Layer

- Shared types: [TO BE DEFINED]
- Validation schemas: [TO BE DEFINED]
- Constants: [TO BE DEFINED]
- Utilities: [TO BE DEFINED]

Use the shared layer where types or schemas are genuinely shared across frontend and backend boundaries. Do not place business logic in shared code unless it is intentionally cross-boundary and documented.

## API Architecture

- API conventions: [TO BE DEFINED]
- Request/response structure: [TO BE DEFINED]
- Authentication: [TO BE DEFINED]
- Error format: [TO BE DEFINED]
- Versioning: [TO BE DEFINED]

The backend API is the integration boundary between the frontend and server-side business/data logic.

## Security Architecture

- Authentication: [TO BE DEFINED]
- Authorization: [TO BE DEFINED]
- Secrets: [TO BE DEFINED]
- Input validation: Server-side validation is required; exact approach is [TO BE DEFINED]
- Data protection: Protect admin/customer/lead data
- Logging: Monitoring/logging provider is [TO BE DEFINED]

## Deployment Architecture

- Frontend production deployment: Vercel
- Backend production deployment: Render
- Database provider: Neon
- Development: [TO BE DEFINED]
- Staging environment: [TO BE DEFINED]
- CI/CD strategy: [TO BE DEFINED]
- Monitoring/logging provider: [TO BE DEFINED]

Docker is deferred/optional. Do not make Docker mandatory for local development or deployment at this stage, and do not configure Docker until explicitly required.

## Proposed Services

- Image storage: Cloudinary, Proposed
- Email service: Resend, Proposed

Proposed services must not be treated as final dependencies until approved.

## Architecture Decision Table

| Area | Technology / Decision | Status |
|------|------------------------|--------|
| Frontend | Next.js + React + TypeScript | Approved |
| Frontend Hosting | Vercel | Approved |
| Backend | TypeScript-based API/backend | Approved |
| Backend Framework/Library | [TO BE DEFINED] | TBD |
| Backend Hosting | Render | Approved |
| Database | PostgreSQL | Approved |
| Database Provider | Neon | Approved |
| ORM | Prisma | Approved |
| Image Storage | Cloudinary | Proposed |
| Email | Resend | Proposed |
| Authentication | [TO BE DEFINED] | TBD |
| CI/CD Strategy | [TO BE DEFINED] | TBD |
| Staging Environment | [TO BE DEFINED] | TBD |
| Monitoring/Logging Provider | [TO BE DEFINED] | TBD |
| Docker | Deferred / Optional | Deferred |
| Architecture Style | Modular Monolith | Approved |

## Architecture Rules

- Follow decisions recorded in this file and `docs/decisions/`.
- Follow `docs/requirements.md` for product requirements and Version 1 scope.
- Keep frontend and backend as separate deployable applications.
- Keep the backend as the owner of business logic.
- Keep database access behind Prisma and the backend data-access layer.
- Keep Version 1 modular without introducing microservices.
- Use TypeScript consistently where applicable.
- Use shared types/schemas when they reduce drift across frontend and backend boundaries.
- Do not implement future booking, payment, availability, customer-account, WhatsApp automation, supplier/operations, or B2B capabilities unless explicitly scoped.
- Do not introduce infrastructure, external services, or dependencies without a concrete project requirement or approved decision.
