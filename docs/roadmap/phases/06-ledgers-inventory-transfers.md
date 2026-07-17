# Phase 06 — Ledgers, grants, inventory, and transfers

**Blocked by:** Phase 05 completion and user review.

> Superpowers is mandatory. Approve ledger and inventory state machines before
> implementation and stop if required skills are unavailable.

## Outcome

Karma, gold, item ownership, administrative grants, and accepted transfers are
atomic, explainable, tenant-isolated, and recoverable from immutable history.

## Included

- User/project karma ledger and character gold ledger in integer minor units.
- Transactionally maintained balances, idempotency keys, reconciliation, and
  concurrency protection against negative available balance.
- Bilingual item definitions and item instances with rarity, consumable flag,
  provenance, ownership, and history.
- Technician+ karma, gold, and item grants with mandatory reason; item grants
  require name and rarity.
- Two-phase gold and item transfers: sender reservation, recipient accept or
  reject, automatic expiry after three project-local calendar days.
- Karma, Grants, Transfers, and relevant inventory audit/outbox events.
- Tool-work gold settlement through the new ledger.

## Acceptance criteria

- Ledgers reconstruct cached balances exactly and reconciliation detects drift.
- Concurrent spending/reservation cannot produce negative available balance or
  duplicate an idempotent operation.
- A pending item cannot be transferred, sold, or removed twice.
- Only the intended recipient can accept/reject; expiry releases exactly once.
- Cross-project and cross-character ownership links fail in application and DB.
- No correction physically rewrites prior ledger or ownership history.

## Excluded

Magic-item search/pricing, karma catalog purchases, and approval reservations.
