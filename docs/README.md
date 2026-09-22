# Documentation

The `docs/` directory contains agreed project knowledge. Documentation should represent confirmed project behavior, decisions, and design specifications rather than assumptions.

## Documentation Philosophy

- Requirements, product context, design specifications, architecture, and implementation should stay aligned.
- Documentation is part of the project, not an afterthought.
- Undocumented assumptions must not be treated as requirements.
- Ambiguities should be recorded until they are clarified.

## Relationship Between Documents

- `requirements.md` defines functional and non-functional requirements.
- `product.md` defines product context, goals, users, and business rules.
- `user-flows.md` defines user journeys and application flows.
- `design-system.md` defines global visual and interaction foundations from the frontend code.
- `frontend/` documents how the frontend app is maintained.
- `decisions/` records architecture and product decisions that affect implementation.

## Frontend Source Policy

The `frontend/` folder now contains the approved Figma-originated frontend implementation. Treat it as the production frontend source, not reference material.

- Use `frontend/src` components, pages, styles, assets, copy, and interaction patterns as the canonical frontend code.
- Adapt existing `frontend/src` components in place instead of recreating or visually replicating them from scratch.
- Preserve the approved frontend visual language unless a functional production requirement requires a targeted change.
- When production data, routing, authentication, admin behavior, or API wiring is needed, adapt the frontend code around those contracts while keeping the UI components recognizable.
- Do not describe existing frontend screens as loose references or inspiration in new documentation.

## Documentation Map

- `requirements.md`
- `product.md`
- `user-flows.md`
- `design-system.md`
- `frontend/`
- `decisions/`


