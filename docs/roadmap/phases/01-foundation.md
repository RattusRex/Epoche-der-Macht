# Phase 01 — Foundation and production container baseline

**Blocked by:** approved platform design.

**Detailed plan:** `docs/superpowers/plans/2026-07-17-foundation.md` and
required continuations `docs/superpowers/plans/2026-07-17-foundation-part-2.md`
and `docs/superpowers/plans/2026-07-17-foundation-part-3.md`.

> Superpowers is mandatory. Stop before editing if the plugin or required
> skills are unavailable. Use the plan's required execution skill, TDD, and
> verification-before-completion.

## Outcome

A pinned, reproducible Next.js/Prisma/PostgreSQL application runs as web,
worker, database, and optional Cloudflare Tunnel containers. CI proves the
same workflow used locally.

## Included

- Node 24 LTS, pnpm, Next.js, React, TypeScript, Tailwind, and shadcn baseline.
- Prisma 7 PostgreSQL adapter and real database integration test.
- Liveness and database-readiness endpoints.
- Gracefully stoppable worker process without outbox behavior.
- Development and production Compose overlays.
- Cloudflare Tunnel profile without tracked secrets or public production ports.
- Unit, integration, browser smoke, lint, format, typecheck, build, audit, and
  CI entry points.
- Development and deployment documentation.

## Acceptance criteria

- A fresh checkout installs only inside the pinned Node container and produces
  the committed lockfile dependency graph.
- PostgreSQL is healthy and not publicly exposed in production.
- Web and worker start from the same built codebase and stop cleanly.
- Live returns 200 without dependencies; ready returns 503 when PostgreSQL is
  unavailable and 200 when it is healthy.
- The optional tunnel reaches web through a private network and receives its
  token only from environment.
- CI and the documented local sequence execute equivalent checks.
- No authentication, tenant, RLS, ledger, or gameplay schema is introduced.

## Validation

Follow the Foundation plan's fresh completion sequence and dependency audit.
Do not begin Phase 02 with an unreviewed high/critical advisory or skipped
required check.
