# Frontend Documentation

## Purpose

This directory documents how the Figma-originated frontend app is maintained as the production frontend.

## Source of Truth

The `frontend/` folder is the source of truth for frontend UI code, visual design, and interaction behavior.

Treat the Figma-originated app as real frontend code. Do not use it merely as a screenshot, mockup, visual reference, or inspiration board.

## Documentation Process

```text
Frontend source code
  |
Component/page inventory
  |
Production route mapping
  |
Data and API integration notes
  |
Production frontend implementation
```

## Important Rule

Do not replicate the Figma UI by manually recreating it from screenshots or prose.

When a component/page exists in `frontend/src`, adapt the actual component code in place. Keep changes targeted to production concerns such as routing, state, API data, authentication, accessibility fixes, and responsive bugs.

The documentation should capture:

- Source file path in `frontend/src`
- Required production data/API wiring
- Routing and navigation mapping
- State, interaction, and responsive behavior
- Accessibility or maintainability changes made during integration

## Original Design Source

- Figma URL: [TO BE DEFINED]
- Version/Revision: [TO BE DEFINED]
- Last Reviewed: [TO BE DEFINED]

## Integration Rules

- Prefer adapting existing frontend components over rewriting them.
- Keep Figma component names where they remain meaningful in production.
- Replace mock data only where production data contracts exist.
- Preserve approved layout, typography, color, spacing, imagery treatment, cards, buttons, and motion unless a documented production requirement says otherwise.
- Record any intentional divergence from the approved frontend code.


