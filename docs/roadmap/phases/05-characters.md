# Phase 05 — Characters, slots, notes, calendar, and work

**Blocked by:** Phase 04 completion and user review.

> Superpowers is mandatory. Write an approved character-domain design and
> exact implementation plan before editing.

## Outcome

Players manage project-isolated D&D 2014 character sheets, earned and purchased
slot capacity, immutable calendar entries, and tool-work income.

## Included

- Character creation within calculated capacity; appearance date not before
  2025-06-01; project-local date handling.
- Level 1–20, six abilities 1–30, derived modifiers, proficiency bonus, skills,
  expertise, saving throws, HP, speed, armor class, and proficiencies.
- Player-owned titled text notes with audited create/edit/archive behavior.
- Two base slots, one-time free slots at levels 5/10/15, purchased-slot limit
  rising 2/3/4/5, and maximum total capacity 10.
- Calendar balance inclusive of appearance date, non-overlapping occupancy,
  player creation, and Technician+ correction through audited cancellation.
- Tool work, musical -2 modifier, no-proficiency calculation, thieves' tools
  exclusion, and exact wage table stored as integer currency minor units.
- Head Administrator+ character deactivation with reason and slot release.

## Acceptance criteria

- Every derived D&D value and boundary has table-driven tests.
- Two level-15 characters cannot duplicate milestone slot rewards.
- Concurrent character creation cannot exceed capacity.
- Calendar entries cannot overlap, predate appearance, or use future dates.
- Players cannot edit/cancel occupancy after creation; authorized cancellation
  releases days without deleting history.
- Deactivation preserves references and history while blocking further use.

## Excluded

Gold ledger settlement, inventory, item search, karma purchases, and approvals.
