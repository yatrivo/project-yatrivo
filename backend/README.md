# Yatrivo Backend

Node.js, Express, and TypeScript backend foundation for the Yatrivo API.

## Current Scope

This backend currently provides infrastructure only:

- versioned API mounting under `/api/v1`
- PostgreSQL connection pool and transaction helper
- Upstash Redis REST integration with safe optional health checks
- centralized environment validation
- structured request/application logging
- request IDs
- Helmet, CORS, and body-size limits
- Zod validation helper
- centralized API error handling
- health and readiness endpoints

Business modules should be added under `src/modules/<feature>` with routes, controller, service, repository, and schema files as needed.

## Commands

Run these from `D:\yatrivo\backend`:

```bash
npm install
npm run dev
npm run build
npm run start
```

The backend defaults to port `4000`.

## Environment

The backend loads `.env` from the current backend directory first, then falls back to the repository root `.env`. This keeps local development compatible with the root environment file while allowing deployment platforms to inject environment variables normally.

## Endpoints

- `GET /api/v1` - API metadata
- `GET /api/v1/health` - process health
- `GET /api/v1/ready` - PostgreSQL/Redis readiness
- `GET /health` - redirect to versioned health endpoint

## Architecture Notes

PostgreSQL remains the source of truth. Redis is optional infrastructure and must be treated as an optimization layer in future features. Future business endpoints should use parameterized database access, server-side validation, pagination where needed, and explicit authorization checks once auth is implemented.
