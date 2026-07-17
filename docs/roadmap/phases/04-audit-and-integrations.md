# Phase 04 — Immutable audit, email, and Discord delivery

**Blocked by:** Phase 03 completion and user review.

> Superpowers is mandatory. Approve the event schema and implementation plan
> before editing; use TDD and verification-before-completion.

## Outcome

Project operations can atomically record immutable audit and durable outbox
events. The worker reliably delivers localized SMTP and Discord messages.

## Included

- Structured, language-neutral audit event envelope with actor, project,
  reason, correlation, entity, action, and safe payload.
- Append-only/immutable database enforcement for audit history.
- Transactional outbox with claim locking, idempotent delivery, bounded
  exponential backoff, dead-letter state, and manual retry authorization.
- Per-project Discord destination mapping for Karma, Grants, Shop, Transfers,
  and Work event categories.
- SMTP delivery moved behind the same durable worker boundary.
- Russian and English event renderers, redaction, operational views, and worker
  health/metrics sufficient for launch diagnostics.

## Acceptance criteria

- Domain change, audit, and outbox commit or roll back together.
- SMTP/Discord outage never rolls back committed domain state or loses events.
- Two workers cannot deliver the same claimed event concurrently.
- Retry exhaustion is visible and an authorized retry is audited.
- Worker jobs set tenant context and cannot access another project.
- Tokens, cookies, password data, and secrets are structurally redacted.

## Excluded

Character, currency, inventory, and shop events beyond test fixtures for the
generic event interface.
