# Yatrivo — System Architecture & Development Rules

## Purpose

Yatrivo must be developed as a properly structured production application, not as a collection of isolated features.

Every feature must integrate into the existing architecture and follow the project's established patterns for backend logic, database access, caching, authentication, storage, security, performance, and frontend data management.

The application should remain maintainable as the project grows.

---

# 1. Core Architecture

The current architecture is:

Frontend:

- React
- Vite
- TypeScript
- Tailwind CSS

Frontend hosting:

- Vercel

Backend:

- Node.js
- Express
- TypeScript where applicable

Backend hosting:

- Railway

Database:

- Neon PostgreSQL

Object storage:

- Neon Object Storage
- S3-compatible API
- One primary bucket: `yatrivo-media`
- Use logical prefixes/subfolders inside the bucket

Caching:

- Upstash Redis

The frontend must communicate with the backend API.
The frontend must NOT directly access PostgreSQL, Redis, or server-side storage credentials.

---

# 2. Feature Development Principle

Follow:

FEATURE-FIRST DEVELOPMENT + ARCHITECTURE-AWARE IMPLEMENTATION

When implementing any feature:

1. First inspect the existing implementation and architecture.
2. Understand existing services, utilities, API patterns, database models, authentication and caching.
3. Reuse existing infrastructure whenever possible.
4. Do not create duplicate implementations of services that already exist.
5. Integrate the feature into the existing architecture.
6. Do not implement a feature merely so that it "works"; implement it correctly within the system design.
7. Do not postpone important architectural requirements until a later optimization phase unless explicitly instructed.

Before writing code, determine:

- What data does the feature require?
- Which database tables/models are involved?
- Which API endpoints are required?
- What business logic belongs on the server?
- What authentication/authorization is required?
- Is Redis caching appropriate?
- Is browser/client-side caching appropriate?
- Is pagination required?
- What validation is required?
- What security considerations exist?
- What loading, error and empty states are required?
- What happens when data is created, updated or deleted?
- What cache invalidation is required?

---

# 3. Backend Responsibility

Business logic must primarily live on the backend.

Never rely on frontend validation for security.

The backend must validate:

- Authentication
- Authorization
- Input data
- File types
- File sizes
- Ownership
- Roles/permissions
- Sensitive operations

The frontend may perform validation for UX, but backend validation is mandatory.

Never expose:

- Database credentials
- Redis credentials
- Storage secret keys
- OAuth client secrets
- JWT/session secrets
- API keys that are intended to remain server-side

to the browser.

---

# 4. Database

Neon PostgreSQL is the source of truth for persistent application data.

Use the database for:

- Users
- Roles
- Destinations
- Packages
- Hotels
- Enquiries
- Bookings
- Favourites
- Saved items
- Admin data
- Other persistent application data

Do not use Redis as the source of truth.

Do not store persistent business-critical data only in Redis.

Database queries should be:

- Efficient
- Properly indexed where necessary
- Parameterized
- Limited to required fields
- Paginated for potentially large datasets

Avoid unnecessary database queries.

Do not fetch an entire table when only a small subset is required.

---

# 5. Redis / Server-Side Caching

Upstash Redis is part of the architecture.

Redis must NOT be added blindly to every feature.

For every feature involving data retrieval, determine whether server-side caching provides meaningful benefit.

Good candidates generally include:

- Public destination lists
- Destination details
- Package lists
- Hotel lists
- Frequently requested public configuration
- Other relatively stable and frequently accessed data

Do not automatically cache:

- Highly dynamic data
- Sensitive user-specific data
- Authentication operations
- OTP operations
- Mutations
- Data where stale results could cause incorrect behavior

When Redis caching is used, every cache must have:

1. A clearly defined cache key.
2. A defined TTL.
3. A defined invalidation strategy.
4. A defined behavior for cache misses.
5. A defined behavior when Redis is unavailable.

The application must continue to behave safely if Redis fails.

Redis should be treated as an optimization layer, not a single point of failure.

Example:

Request:
GET /api/destinations

Flow:

Browser
→ Backend
→ Redis
→ PostgreSQL on cache miss
→ Redis
→ Backend
→ Browser

When an admin modifies destination data:

PostgreSQL update
→ invalidate affected Redis cache keys
→ next request retrieves fresh data
→ Redis is repopulated

Never allow stale cache data to remain indefinitely.

---

# 6. Browser / Client-Side Caching

Client-side caching is also part of the architecture.

Use an appropriate data-fetching/cache mechanism such as TanStack Query when appropriate rather than creating ad-hoc caching logic throughout React components.

Client-side caching should be considered for:

- Public destination data
- Package data
- Other reusable API responses
- Data that users frequently revisit

For each cached query consider:

- stale time
- cache time/gc time
- refetch behavior
- invalidation after mutations
- loading state
- error state

Do not cache sensitive information in a way that could expose it to other users.

Browser caching and Redis caching serve different purposes and may both be used.

Example:

Browser cache
→ Backend
→ Redis
→ PostgreSQL

This layered caching is intentional when appropriate.

---

# 7. Cache Invalidation

Cache invalidation is mandatory whenever caching is introduced.

For example:

If:

GET /api/destinations/:id

is cached using:

destination:{id}

and an admin updates that destination:

1. Update PostgreSQL.
2. Invalidate `destination:{id}`.
3. Invalidate any related list/cache keys.
4. Return the updated data.

Do not update the database and forget about related caches.

Whenever implementing a mutation, check whether the mutation affects existing cached queries.

---

# 8. Object Storage

Use Neon Object Storage for application media/files.

Current bucket:

`yatrivo-media`

Use logical prefixes rather than creating multiple buckets unnecessarily.

Example:

yatrivo-media/

- destinations/
- packages/
- hotels/
- users/
- documents/
- admin/

Folders/prefixes should be organized logically.

The backend controls uploads.

Never expose storage secret credentials to the frontend.

Validate uploads on the server:

- MIME type
- extension
- file size
- ownership
- destination/path
- authorization

Do not trust filenames supplied by users.

Use safe generated object names where appropriate.

---

# 9. API Design

Use consistent REST API conventions.

Prefer:

GET
POST
PUT/PATCH
DELETE

Use meaningful resource-oriented routes.

Example:

GET /api/destinations
GET /api/destinations/:id
POST /api/admin/destinations
PATCH /api/admin/destinations/:id
DELETE /api/admin/destinations/:id

Do not put business logic directly inside route handlers when it becomes substantial.

Keep responsibilities separated where appropriate:

Routes
→ Controllers
→ Services
→ Data/Repository layer
→ Database

Do not over-engineer trivial functionality, but maintain clear separation for substantial business logic.

---

# 10. Authentication and Authorization

Authentication will be implemented by the Yatrivo backend rather than relying on direct frontend-to-database authentication.

Expected authentication methods include:

- Mobile number + OTP
- Google OAuth

Authentication and authorization must be treated separately.

Authentication:
"Who is this user?"

Authorization:
"What is this user allowed to do?"

Roles and permissions must always be enforced server-side.

Never trust:

- frontend role values
- frontend user IDs
- hidden UI buttons
- client-side permission checks

The frontend can hide unauthorized UI elements for UX, but the backend must independently enforce authorization.

---

# 11. Performance

Every feature must consider performance during implementation.

Avoid:

- N+1 database queries
- unnecessary API calls
- fetching unused fields
- loading huge datasets at once
- unnecessary repeated requests
- duplicate requests
- expensive operations on every request

Use:

- pagination
- appropriate indexes
- batching
- Redis where beneficial
- browser caching where beneficial
- efficient database queries
- lazy loading where appropriate

Do not optimize blindly. Measure or reason about actual bottlenecks.

---

# 12. Pagination

Any potentially large collection must be designed with pagination.

Examples:

- Destinations
- Packages
- Hotels
- Enquiries
- Users
- Bookings
- Admin tables

Do not assume the dataset will always remain small.

The API should support pagination and the frontend should handle it appropriately.

---

# 13. Error Handling

Every feature must have proper:

- Backend error handling
- API error responses
- Frontend error states
- Loading states
- Empty states

Do not silently swallow errors.

Do not expose internal stack traces, database errors or secrets to users.

Use appropriate logging on the backend.

---

# 14. Environment Variables

Use environment variables for secrets and environment-specific configuration.

Current infrastructure variables include:

DATABASE_URL

AWS_ENDPOINT_URL_S3
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_BUCKET_NAME

Redis and other external service variables will be added as those services are integrated.

Never commit `.env` files containing real secrets.

Maintain `.env.example` with variable names but without secrets.

Never expose server-only variables through Vite's `VITE_*` mechanism unless the value is explicitly safe for public exposure.

---

# 15. Reuse Existing Infrastructure

Before creating a new:

- database connection
- Redis client
- storage client
- authentication utility
- API utility
- validation utility
- logger
- error handler
- caching utility

search the existing codebase first.

If the project already has:

`db.ts`

reuse it.

If it already has:

`redis.ts`

reuse it.

If it already has:

`storage.ts`

reuse it.

Do NOT create duplicate clients such as:

`redisClient.ts`
`redisService.ts`
`redisHelper.ts`

unless there is a clear architectural reason.

---

# 16. Do Not Over-Engineer

System design does not mean unnecessary complexity.

Prefer:

- simple
- maintainable
- understandable
- scalable enough for the project's expected requirements

Do not introduce microservices, message queues, complex distributed systems or additional infrastructure unless the project actually requires them.

Yatrivo is currently a modular monolithic application:

Frontend
+
Node/Express Backend
+
PostgreSQL
+
Redis
+
Object Storage

Keep it that way unless requirements justify a change.

---

# 17. Before Completing Any Feature

Before declaring a feature complete, verify:

[ ] Frontend implemented
[ ] Backend API implemented
[ ] Database interaction implemented
[ ] Authentication/authorization considered
[ ] Validation implemented
[ ] Error handling implemented
[ ] Loading/empty/error UI implemented
[ ] Pagination considered where necessary
[ ] Redis caching considered
[ ] Browser/client caching considered
[ ] Cache invalidation considered
[ ] Performance considered
[ ] Security considered
[ ] Existing architecture reused
[ ] No duplicate infrastructure created
[ ] Secrets remain server-side
[ ] Existing features are not broken

If caching is not appropriate for the feature, explicitly state that caching was evaluated and intentionally not added.

---

# 18. Agent Behavior

Agents must not blindly follow the smallest possible implementation.

Before implementing a feature, inspect the existing codebase and determine how the feature fits into the architecture.

If an architectural decision is unclear:

1. Inspect existing conventions.
2. Prefer the established project pattern.
3. Avoid introducing a competing pattern.
4. If the decision could materially affect the architecture, stop and ask before proceeding.

Agents should prioritize:

Correctness
→ Security
→ Maintainability
→ Performance
→ Scalability

while avoiding unnecessary complexity.

The goal is not to build the feature as quickly as possible.

The goal is to build the feature correctly as part of Yatrivo. Don't make the agent report only:

> "Feature completed."

Make it finish every feature with a short Architecture Impact section:

```
## Architecture Impact

Database:
- Tables/models changed: ...

Redis:
- Cache added: Yes/No
- Keys: ...
- TTL: ...
- Invalidation: ...

Client cache:
- Cached queries: ...
- Stale time: ...

Storage:
- Changed: Yes/No

Authentication:
- Required: ...

Performance:
- Pagination: ...
- Potential expensive operations: ...

Security:
- Authorization: ...
- Validation: ...

Existing infrastructure reused:
- db.ts
- redis.ts
- storage.ts
```
