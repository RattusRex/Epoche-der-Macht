# Phase 08 — Karma shop, reservations, and approvals

**Blocked by:** Phase 07 completion and user review.

> Superpowers is mandatory. Approve catalog data and request state machines,
> then create an exact implementation plan before editing.

## Outcome

Players purchase approved character changes, unlocks, additional slots, and a
level-10 feat slot without double-spending karma or calendar days.

## Included

- Complete approved fixed-price character-change and unlock catalogs.
- Game Master-set prices for approved homebrew/spell unlock categories.
- Unified approval workflow for normal and “strict” display copy.
- Game Master+ approval authorization; Technician cannot approve.
- Atomic karma/day reservation, capture on approval, and release on rejection
  or cancellation with idempotent optimistic state transitions.
- Purchased character slots at 15/20/25/30/35 karma under Phase 05 limits.
- One level-10 extra feat slot for 30 karma, requiring prerequisites, prior
  unlock, and approval of the selected feat.
- Karma, calendar, approval, audit, and Discord integration.

## Acceptance criteria

- Pending requests reduce available karma/days without writing final spend.
- Concurrent requests cannot reserve the same available resources twice.
- Only authorized project roles resolve a pending request and never twice.
- Rejection/cancellation releases reservations but preserves full history.
- Ten- and twenty-day conditions use project-local calendar occupancy.
- Catalog values exactly match the approved design specification in both locales.
- Disabled Karma Shop rejects direct server calls and worker actions.

## Excluded

New catalog categories not present in the approved product design.
