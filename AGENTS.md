# Epoha Engineering Guide

## Purpose and source of truth

This repository contains a bilingual, multi-project D&D operations platform.
The approved product and architecture specification is
`docs/superpowers/specs/2026-07-17-epoha-platform-design.md`. Product notes in
`README.md` are useful background, but the approved specification takes
precedence when the two differ.

Once created, version-controlled roadmap and phase files are the implementation
source of truth. GitHub issues mirror them for tracking. If an issue and its
source file disagree, stop and ask which version is authoritative.

## Mandatory Superpowers preflight

Before making any change:

1. Confirm that the Superpowers plugin and every skill required by the active
   issue are available.
2. Invoke `superpowers:using-superpowers`.
3. Use `superpowers:brainstorming` before changing design or behavior.
4. Execute an approved plan with
   `superpowers:subagent-driven-development` or
   `superpowers:executing-plans`.
5. Use `superpowers:test-driven-development` for implementation.
6. Use `superpowers:verification-before-completion` before claiming success.

If Superpowers or a required skill is unavailable, stop before editing files
or changing external state. Report the missing capability; do not substitute
another workflow.

## Current repository state

Phase 01 establishes the application scaffold and operational entry points.
Docker Compose is canonical for installation, development, builds, tests,
migrations, audits, and smoke checks; host Node.js and pnpm are unsupported.
Use `.env.example` for repository validation and a Git-ignored `.env` for local
or deployed secrets. See `docs/development.md` and `docs/deployment.md` for the
complete runbooks.

Verified entry points are:

- development: `docker compose --env-file .env -f compose.yaml -f compose.dev.yaml up -d --wait postgres web worker`;
- validation: `docker compose --env-file .env -f compose.yaml -f compose.dev.yaml run --rm --no-deps web pnpm verify`;
- integration: the same Compose prefix with `pnpm test:integration`;
- browser smoke: the development prefix with `--profile test`, service `e2e`,
  and `pnpm test:e2e`;
- production build: `docker compose --env-file .env -f compose.yaml -f compose.prod.yaml build web worker`;
- topology smoke: `./scripts/smoke.sh`.

Do not manually edit generated Prisma client files or `next-env.d.ts`; both are
Git-ignored and regenerated in containers. Schema changes require a
version-controlled migration and database integration tests.

## Delivery workflow

- Work on exactly one roadmap phase at a time and respect its dependencies.
- Before code, read the approved spec, active phase file, nearest
  `AGENTS.md`, repository status, and relevant existing modules.
- Preserve unrelated changes. The root `README.md` may contain user-owned
  uncommitted product notes.
- Do not add a production dependency, change a public or persisted contract,
  weaken a security invariant, or alter the approved architecture without
  explicit user approval.
- Develop behavior test-first and commit coherent, independently verifiable
  increments.
- Keep manually maintained source files near 350 lines. Split coherent
  responsibilities before a touched file exceeds 500 lines; never expand one
  beyond 800 lines without explicit approval.
- Never edit generated clients, dependency caches, vendored packages, or
  generated migration output as a workaround.

## Architectural boundaries

- Build a modular monolith in one repository, not microservices.
- Next.js serves the UI and HTTP boundary. Business rules belong in focused
  domain modules, not React components, route handlers, or Prisma models.
- PostgreSQL is the system of record. Prisma is the application data layer.
- A worker from the same codebase delivers outbox events to SMTP and Discord.
- Use a PostgreSQL transactional outbox; do not add Redis or another queue
  without measured need and user approval.
- Containers are `web`, `worker`, `postgres`, and `cloudflared`. Do not expose
  PostgreSQL publicly. Secrets come from the environment and never enter Git.

## Tenant isolation and authorization

- Every project-owned row carries `projectId` and uses project-scoped foreign
  keys where applicable.
- Enable and force PostgreSQL Row-Level Security when each tenant table is
  introduced. Runtime roles must not own protected tables or have
  `BYPASSRLS`.
- Establish tenant context transactionally. Never accept an unchecked
  `projectId` from client input as authorization context.
- Use a separate migration role. Process each worker job in the event's tenant
  context.
- The global Owner still selects a project context; application privileges do
  not imply an unrestricted SQL bypass.
- Every tenant feature needs integration tests proving that another project's
  user, administrator, identifier, and background job cannot cross the
  boundary.
- Enforce RBAC and feature flags on the server. Hidden navigation is not an
  authorization control.

Role order is: Player, Technician, Game Master, Head Administrator, Project
Owner, global Owner. Project roles never grant authority in another project.

## Transactional domain invariants

- Karma belongs to a user within a project. Gold belongs to a character.
- Currency ledgers are append-only and authoritative. Cached balances may be
  updated only in the same transaction as their ledger entries and audit
  event. Balances cannot become negative.
- Currency, inventory, reservation, approval, transfer, and calendar mutations
  must be atomic, idempotent, and audited with actor and reason.
- Internal audit is the source of truth. SMTP or Discord failure must not roll
  back a committed domain operation; retry it through the outbox.
- Approval-gated purchases reserve karma and character days. Approval captures
  the reservation; rejection or cancellation releases it.
- Game Master and higher roles approve requests. “Strict approval” is display
  copy only and uses the same workflow.
- Gold and item transfers require recipient acceptance. Pending assets remain
  reserved and automatically release after three project-local calendar days.
- Never physically delete ledger, transfer, approval, calendar, inventory
  history, or audit records.

## Character and calendar invariants

- Character dates use the project's configurable IANA timezone, defaulting to
  `Europe/Berlin`.
- The appearance date is the first available day and cannot precede
  `2025-06-01`.
- Occupancy intervals cannot overlap, precede appearance, or extend into the
  future.
- Players may add occupancy entries to their own characters but cannot edit or
  cancel them. Technician and higher roles may correct them with a mandatory
  reason. Cancellation releases days while preserving immutable history.
- One decade means 10 occupied calendar days; two decades means 20.
- A player has two base character slots per project. The first character to
  reach levels 5, 10, and 15 grants one free slot at each threshold. Purchased
  slot capacity starts at two and rises to three, four, and five at those same
  thresholds. Maximum capacity is ten.

## Localization and content

- Support `ru` and `en` across UI, validation, email, system logs, and domain
  dictionaries.
- Store the user's locale preference; before login use the browser preference
  with a manual switcher.
- Managed content stores explicit Russian and English translations. Do not use
  machine translation or publish content missing either required translation.
- Keep audit payloads structured and language-neutral; localize them when
  rendered or delivered.

## Randomized rules

- Generate rolls on the server through an injectable random source.
- Persist inputs, raw rolls, modifiers, adjusted rolls, and results needed to
  explain a transaction.
- Production randomness must use a cryptographically secure source. Tests must
  provide deterministic sequences; never make tests depend on chance.

## Validation baseline

Every implementation phase must define and run, as applicable:

- unit and table-driven domain tests;
- PostgreSQL/Prisma integration tests, including forced RLS isolation;
- RBAC and feature-flag denial tests;
- concurrency and idempotency tests for balances and reservations;
- outbox retry and dead-letter tests;
- component and responsive UI tests;
- Playwright tests for critical user flows in Russian and English;
- lint, formatting, type checking, production build, migration validation,
  dependency audit, and Docker smoke checks.

Do not claim a check passed unless its command ran successfully. Report any
unavailable check, the reason, residual risk, and exact follow-up.

## Safe deletion

- Head Administrator and higher roles may deactivate a character with a
  mandatory reason. Deactivation frees its slot but preserves all history.
- Only the global Owner may delete an account. Require reason and repeated
  confirmation, revoke sessions and identities, anonymize personal data, and
  deactivate memberships and characters while preserving anonymous financial
  and audit history.
