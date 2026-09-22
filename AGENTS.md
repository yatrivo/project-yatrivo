# Yatrivo Agent Guide

## Repository Structure

- `frontend/` - Canonical React + Vite + Tailwind frontend app. This is the production frontend source, originally exported from the approved Figma Make design.
- `backend/` - Planned backend API location. No backend server is implemented yet.
- `database/` - Database-related files and future migrations/seeds.
- `shared/` - Shared contracts/types/utilities when they are introduced.
- `docs/` - Product, requirements, frontend, and architecture documentation.
- `scripts/` - Project automation scripts.

Do not use or recreate a top-level `figma/` source folder. The Figma-originated code already lives in `frontend/`.

## Standard Ports

- Frontend dev/preview: `3000`
- Backend API: `4000`

Frontend Vite config must keep `3000` as the default. Backend work should use `4000` by default when the API is introduced.

## Frontend Rules

- Start frontend work in `frontend/src`.
- Preserve the approved visual language in the existing components.
- Adapt existing components in place for routing, real data, API integration, auth, admin behavior, accessibility, and maintainability.
- Do not rebuild existing UI from screenshots or create a parallel frontend folder.
- Keep reusable UI under `frontend/src/components`, pages under `frontend/src/pages`, admin screens under `frontend/src/admin`, data fixtures under `frontend/src/data`, and imported visual assets under `frontend/src/imports` until a better production asset structure is intentionally introduced.

## Commands

Use npm for the frontend. Run frontend commands from the repo root using the `--prefix` flag.

```bash
npm --prefix frontend install
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run preview
```
