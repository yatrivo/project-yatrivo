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

## Architecture Rules

Follow the system architecture guidance in `.agents/main/system-architecture-rules.md` for all implementation work.

This file defines required architecture, backend responsibility boundaries, database/cache/storage expectations, environment variable usage, performance/security rules, and required Architecture Impact reporting for feature work.

Agents must read and apply these rules before implementing or changing features.

Before implementing a task, inspect only the files and modules relevant to the requested change.

Start with:
1. Architecture rules relevant to the task.
2. The target module.
3. Direct dependencies/interfaces of that module.
4. Database schema/migrations only when the task affects persistence.
5. Existing shared infrastructure only when it will be reused.

Do not recursively read the entire repository or unrelated modules just to gain context. Expand inspection only when the existing code or architecture requires it.

Prefer repository structure, Graphify/indexed project context, and targeted search to locate relevant code before opening large files.

## Commands

Use npm for the frontend. Run frontend commands from the repo root using the `--prefix` flag.

```bash
npm --prefix frontend install
npm --prefix frontend run dev
npm --prefix frontend run build
npm --prefix frontend run preview
```

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## Agent Conduct Rules

These rules govern agent behavior and must be followed unconditionally.

### Git Operations
- **Never run `git add`, `git commit`, `git push`, `git stash`, or any other git write operation autonomously.**
- Only run read-only git commands (e.g. `git status`, `git diff`, `git log`) if directly relevant to a task.
- Git staging and committing is exclusively the user's responsibility. Do not do it unless the user explicitly asks in that specific message.

### Environment Files
- **Never read `.env`, `.env.local`, `.env.production`, `.env.development`, or any other environment variable files.**
- These files contain secrets (API keys, database credentials, tokens) and must not be opened, printed, or inspected.
- If environment variable values are needed to complete a task, ask the user to provide only the specific value required — do not read the file yourself.
