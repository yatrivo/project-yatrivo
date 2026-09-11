# Development Conventions

These conventions guide future implementation. Framework-specific rules must be added only after the technology stack is known.

## General Principles

- Keep code simple, maintainable, and modular.
- Reuse existing patterns before introducing new ones.
- Keep changes scoped to the requested task.
- Do not encode undocumented product assumptions in code.

## Naming

- Files: [TO BE DEFINED]
- Directories: [TO BE DEFINED]
- Variables: [TO BE DEFINED]
- Functions: [TO BE DEFINED]
- Classes: [TO BE DEFINED]
- Components: [TO BE DEFINED]
- API endpoints: [TO BE DEFINED]
- Database objects: [TO BE DEFINED]

## Code Organization

- Frontend, backend, database, and shared code should remain separated by responsibility.
- Shared code belongs in `shared/` only when it is genuinely reused across boundaries.
- Feature organization rules are [TO BE DEFINED].

## Frontend Conventions

- Component structure: [TO BE DEFINED]
- Styling: [TO BE DEFINED]
- State: [TO BE DEFINED]
- Hooks: [TO BE DEFINED]
- Forms: [TO BE DEFINED]
- API calls: [TO BE DEFINED]

## Backend Conventions

- Controllers: [TO BE DEFINED]
- Services: [TO BE DEFINED]
- Repositories: [TO BE DEFINED]
- Validation: [TO BE DEFINED]
- Errors: [TO BE DEFINED]

## Database Conventions

- Schema naming: [TO BE DEFINED]
- Migration naming: [TO BE DEFINED]
- Seed data rules: [TO BE DEFINED]
- Data integrity rules: [TO BE DEFINED]

## Type Safety

- Type-safety approach: [TO BE DEFINED]
- Shared type usage: [TO BE DEFINED]

## Error Handling

- Error-handling strategy: [TO BE DEFINED]
- User-facing error behavior: [TO BE DEFINED]

## Logging

- Logging strategy: [TO BE DEFINED]
- Sensitive data rules: [TO BE DEFINED]

## Testing

- Test strategy: [TO BE DEFINED]
- Required checks before completion: [TO BE DEFINED]

## Git Conventions

- Branch naming: [TO BE DEFINED]
- Commit messages: [TO BE DEFINED]
- Pull requests: [TO BE DEFINED]
- Scope discipline: keep commits and changes focused on the requested task.

## Dependency Rules

- Do not introduce dependencies without a clear reason.
- Document dependency decisions when they affect architecture, security, maintainability, or deployment.

## Documentation Rules

- Update documentation when implementation changes documented behavior.
- Record product, design, and architecture decisions in the appropriate documents.
- Do not treat undocumented assumptions as requirements.
