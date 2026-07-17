# Phase 07 — Magic shop

**Blocked by:** Phase 06 completion and user review.

> Superpowers is mandatory. Approve the random, offer, and settlement state
> machines and create an exact TDD plan before editing.

## Outcome

Characters search for, price, buy, and sell Common, Uncommon, and Rare magic
items using auditable deterministic rules, hirelings, or their Investigation.

## Included

- Approved rarity DC, day dice, base/consumable prices, and d100 modifiers.
- `d20 + modifier >= DC` search without natural 1/20 special cases.
- Poor, Good, Competent, and Expert hireling bonuses and daily costs.
- Success die days and maximum failure days; self-search calendar occupancy.
- Clamped adjusted d100 and exact buy/sell multiplier distributions.
- Server cryptographic random source plus injectable deterministic test source.
- Expiring/closed offers, confirmation, purchase/sale settlement, inventory
  mutation, hireling payment, and “continue searching” as a new paid attempt.
- Shop audit and Discord events containing explainable roll data without secrets.

## Acceptance criteria

- Boundary and distribution tests cover every roll bracket and inclusive range.
- Stored raw rolls, modifiers, adjusted roll, multiplier, days, and final price
  reproduce every result.
- Failure charges maximum hireling days or occupies maximum self-search days.
- Declining an offer permanently closes it; a new search never refunds prior
  gold or days.
- Purchase/sale, fees, calendar, inventory, ledger, audit, and outbox are one
  atomic operation.
- Disabled Magic Shop rejects direct server calls.

## Excluded

Karma purchases, unlock catalog, and Game Master approvals.
