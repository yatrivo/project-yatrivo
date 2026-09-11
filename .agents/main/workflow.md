# Development Workflow

This file defines the project workflow from discovery through completion.

## Phase 1 - Requirement Discovery

```text
Client requirements
  |
Clarification
  |
requirements.md
```

- Capture agreed functional and non-functional requirements in `docs/requirements.md`.
- Record unresolved items as open questions.
- Do not implement important undefined requirements.

## Phase 2 - Product Understanding

```text
Product requirements
  |
User roles
  |
User flows
  |
product.md / user-flows.md
```

- Maintain product context in `docs/product.md`.
- Document user journeys in `docs/user-flows.md`.
- Keep user roles, permissions, and business rules explicit.

## Phase 3 - Figma Analysis

```text
Figma
  |
Screens
  |
Components
  |
Design system
  |
Interactions
  |
Figma documentation
```

Figma is the source of truth for visual and interaction design. A screenshot is not considered a complete implementation specification.

Document:

- Layout
- Typography
- Spacing
- Components
- Variants
- States
- Responsive behavior
- Animations
- Transitions
- Interactions
- Navigation
- Accessibility considerations

## Phase 4 - Technical Planning

```text
Requirements + Figma specification
  |
Architecture
  |
Implementation plan
  |
Task breakdown
```

- Confirm affected modules before implementation.
- Update `.agents/main/architecture.md` or `docs/decisions/` when planning changes architecture.
- Break work into scoped tasks tracked in `.agents/main/tasks.md`.

## Phase 5 - Implementation

Implement only after understanding the relevant documentation.

For full-stack features:

```text
Requirement
  |
Database
  |
Backend
  |
Shared types/schemas
  |
Frontend
  |
Integration
```

Adjust this sequence when the architecture requires a different order.

## Phase 6 - Verification

```text
Functional testing
  |
API testing
  |
Frontend testing
  |
Responsive verification
  |
Visual verification against Figma
  |
Regression testing
```

- Test the behavior affected by the change.
- Verify UI work against the documented Figma specification.
- Do not consider code complete only because it compiles.

## Phase 7 - Documentation

- Update relevant documentation after meaningful architectural, product, or design changes.
- Do not silently change documented behavior.
- Record decisions in `docs/decisions/` when appropriate.

## Phase 8 - Completion

A task is complete only when:

- Implementation is complete.
- Tests/checks pass or any inability to run them is recorded.
- Design is verified where applicable.
- Documentation is updated.
- No unrelated changes remain.

## Handling Ambiguity

- Ask for clarification when missing information affects requirements, data, permissions, API contracts, or design behavior.
- Make a low-risk assumption only when the impact is limited and reversible.
- Record unavoidable assumptions in the relevant document.
- Stop implementation when ambiguity could cause significant incorrect work.
