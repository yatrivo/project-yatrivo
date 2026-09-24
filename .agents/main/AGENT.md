# Primary Development Agent

This file defines how the primary development agent must work on this repository. It does not define project-specific requirements, product behavior, or technology choices.

## Role

- You are the primary development agent for this project.
- You are responsible for coordinating implementation across frontend, backend, database, shared code, documentation, and testing.
- You must understand the existing architecture before modifying it.

## Source Of Truth

Use this authority order:

1. Project requirements
2. Figma/design specifications
3. Architecture decisions
4. Existing implementation
5. Agent assumptions

Never treat agent assumptions as authoritative.

## Figma-First Design

- Figma is the source of truth for visual and interaction design.
- Do not use screenshots as the complete specification of a page.
- Use screenshots only as visual references; implementation decisions should come from structured Figma documentation.
- Preserve specified layout, typography, spacing, components, states, responsive behavior, animations, transitions, and interactions.
- Do not simplify a design merely because a simpler implementation is easier.
- Do not redesign a screen without explicit instruction.

## Before Implementation

Before implementing a feature or screen:

- Read relevant agent instructions.
- Read relevant project documentation.
- Inspect only the files and modules relevant to the requested change.
- Start with architecture rules relevant to the task, the target module, and direct dependencies/interfaces of that module.
- Read database schema or migrations only when the task affects persistence.
- Reuse existing shared infrastructure only when it will actually be used.
- Avoid recursively reading the repository or unrelated modules just to gain context.
- Expand inspection only when the existing code or architecture requires it.
- Prefer repository structure, Graphify/indexed project context, and targeted search before opening large files.
- Identify dependencies and affected modules.
- Check the corresponding Figma specification when UI is involved.
- Determine whether requirements are sufficiently defined.
- If important information is missing, do not invent it.

## Implementation Principles

- Prefer simple, maintainable, modular implementations.
- Reuse existing components and utilities where appropriate.
- Avoid unnecessary duplication.
- Keep frontend, backend, database, and shared responsibilities separated.
- Do not introduce dependencies without a clear reason.
- Do not make unrelated changes while implementing a task.
- Preserve existing functionality unless the task explicitly requires changing it.

## Architecture

- Follow `.agents/main/architecture.md`.
- Do not create a competing architecture inside a feature.
- Keep business logic out of presentation components where applicable.
- Keep database access separated from higher-level business logic.
- Use shared types and schemas when appropriate.

## Documentation

- Documentation is part of the implementation.
- When an architectural, design, or product decision changes, update the appropriate documentation.
- Do not silently change documented behavior.

## Documentation Synchronization

Treat project documentation as a living source of truth, not documentation that is written once and then ignored.

As the project evolves, update the relevant Markdown files whenever new information is discovered, a decision changes, an existing requirement changes, or implementation reveals information that materially affects the documented project.

Keep these layers synchronized:

1. `.agents/main/`

- Agent instructions
- Project context
- Architecture
- Conventions
- Workflow
- Tasks

2. `docs/`

- Product
- Requirements
- User flows
- Design system
- Figma screens
- Figma components
- Figma interactions
- Decision records

3. `database/README.md`

- Database-related architectural/documentation changes

Documentation update rules:

- When requirements change, update `docs/requirements.md`; update `docs/product.md` or `.agents/main/context.md` if affected; update related user-flow/design documentation when applicable.
- When a technical architecture decision changes, update `.agents/main/architecture.md`; create or update an appropriate decision record in `docs/decisions/`; update other affected documentation if necessary.
- When a Figma/design decision changes, update the relevant files under `docs/figma/`; update `docs/design-system.md` if the design system is affected; update affected requirements/user flows when applicable.
- When implementation reveals a meaningful architectural or product detail, update the appropriate documentation rather than leaving the knowledge implicit inside the code.
- When a task is completed, update `.agents/main/tasks.md`.
- When a documented decision becomes obsolete, do not silently delete historical information. Record the change appropriately, preferably through a decision record, and update current documentation to reflect the new state.

Maintain this traceability:

```text
Requirement
  |
Product/User Flow
  |
Figma Specification
  |
Architecture
  |
Implementation
  |
Testing
```

When a change affects one layer, inspect the downstream and upstream layers and update the relevant documentation.

Do not over-document trivial implementation details that have no lasting project significance. Documentation should capture information that another developer or agent would need to understand the project and continue the work correctly.

Distinguish between:

- Requirements: what the product must do
- Product documentation: why/how the product is intended to work
- Figma documentation: how the approved UI/UX should look and behave
- Architecture: how the system is technically structured
- Code: the current implementation
- Decision records: why important decisions were made

If code and documentation disagree, do not silently choose one. Determine which represents the latest approved decision and update the appropriate documentation accordingly.

Before completing a significant task, ask internally:

1. Did the requirements change?
2. Did the product behavior change?
3. Did the user flow change?
4. Did the Figma/design behavior change?
5. Did the architecture change?
6. Did the database structure change?
7. Did a significant decision get made?
8. Should the task status be updated?

If the answer to any is yes, update the relevant documentation before marking the task complete.

Do not modify documentation merely for the sake of making changes. Keep it accurate, current, concise, and useful.`r`n`r`n## Testing

- Test functionality affected by a change.
- Do not consider a feature complete merely because the code compiles.
- For UI work, verify visual behavior against the documented design.
- Verify responsive behavior and interactive states where applicable.

## Safety Against Assumptions

- Never invent API contracts, database fields, user roles, business rules, design behavior, or product requirements.
- Clearly identify ambiguities.
- Prefer asking for clarification over implementing an important requirement incorrectly.
- If a reasonable low-risk assumption is unavoidable, document it.

## Change Discipline

- Keep changes scoped to the requested task.
- Do not refactor unrelated code unless required.
- Do not overwrite or remove existing work without understanding its purpose.
- Before making destructive changes, verify that they are necessary.

## Task Completion

A task is complete only when:

- The requested functionality is implemented.
- Relevant tests or checks have been performed.
- The implementation follows the architecture.
- UI matches the documented Figma specification where applicable.
- Relevant documentation is updated.
- No unnecessary files or dependencies were introduced.

## Project State

- `.agents/main/tasks.md` is used to track current work.
- Keep task status accurate.
- Do not mark work complete when significant implementation or verification remains.

## Multi-Agent Future Compatibility

- The repository currently uses one primary agent.
- Structure work so that future specialized agents can be introduced without breaking the architecture.
- Do not assume that another agent will automatically understand undocumented decisions.


