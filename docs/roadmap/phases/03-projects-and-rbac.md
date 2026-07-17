# Phase 03 — Projects, RLS, RBAC, and access

**Blocked by:** Phase 02 completion and user review.

> Superpowers is mandatory. Derive an approved design and exact plan from the
> current auth schema before editing. Stop if any required skill is missing.

## Outcome

The global Owner creates isolated projects, grants visibility and entry, and
assigns project roles. PostgreSQL RLS and server authorization prevent all
cross-project access.

## Included

- Default “Эпоха Катастроф” project and Owner-only project creation.
- Configurable project IANA timezone defaulting to `Europe/Berlin`.
- Separate project access and project membership records.
- Roles: Player, Technician, Game Master, Head Administrator, Project Owner,
  and global Owner.
- Project switcher limited to authorized projects and waiting state for users
  without access.
- Feature flags for Magic Shop, Karma Shop, Game Recruitment, Server Rules,
  Illegal Items, and Allowed Homebrew.
- Separate migration and runtime PostgreSQL roles.
- Forced RLS on every tenant table, transaction-local tenant context, scoped
  service interfaces, and compound project constraints.

## Acceptance criteria

- A project administrator has Player authority in another project unless a
  separate role is assigned there.
- Guessing another project's identifiers cannot read, mutate, infer, or link
  data through UI, API, Prisma, raw SQL runtime calls, or worker context.
- Runtime roles neither own protected tables nor have `BYPASSRLS`.
- Global Owner selects a tenant context instead of bypassing RLS.
- Disabled modules are hidden and rejected server-side.
- Role and feature-flag matrices have positive and negative integration tests.

## Excluded

Domain grants, audit delivery, characters, currencies, shops, and publications.
