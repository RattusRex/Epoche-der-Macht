# Epoha Platform Design

**Status:** Approved on 2026-07-17. **Product:** “Эпоха Катастроф” multi-project D&D operations platform. **Source:** `README.md`.

## Goal

Build a production-ready Russian/English website that automates characters,
project permissions, karma, gold, inventory, magic-item trading, karma-store
requests, calendars, rules, and auditable administration for multiple isolated
D&D communities.

The first-year target is up to 1,000 users and 5,000 characters. Current
desktop and mobile browsers are equally supported. The solution runs on one
VPS through Docker Compose and is published on the owner's domain with a
Cloudflare Tunnel.

## Scope boundaries

The roadmap covers the entire described product, but implementation is split
into ten sequential, independently verifiable phases. Only the first phase is
planned in implementation detail before code exists. Each later plan is based
on the repository state produced by its predecessor.

“Game recruitment” is only a project feature flag in this scope. No workflows
for that module were supplied, so building it requires a separate discovery,
design, and plan. The platform does not reproduce copyrighted D&D rulebook or
item text; administrators enter content they are permitted to use.

## Stack proposal

Verified against official sources on 2026-07-17:

| Technology | Constraint | Decision |
| --- | --- | --- |
| Node.js | 24.x LTS | Production runtime; Node 26 is Current |
| Next.js | 16.x | App Router web and server boundary |
| TypeScript | compatible stable 5.x | Strict application language |
| pnpm | compatible stable 10.x | Package manager and lockfile |
| PostgreSQL | 18.x | Primary store, supported through 2030 |
| Prisma ORM | 7.x | Schema, migrations, typed data access |
| shadcn/ui | lockfile-pinned CLI/components | Accessible UI foundation |
| Better Auth | compatible stable | Email/password and Discord identities |

Compatibility evidence: [Node releases](https://nodejs.org/en/about/previous-releases),
[Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16), [PostgreSQL policy](https://www.postgresql.org/support/versioning/),
[Prisma requirements](https://docs.prisma.io/docs/orm/reference/system-requirements), and Better Auth documentation for
[Next.js](https://better-auth.com/docs/integrations/next), [email/password](https://better-auth.com/docs/authentication/email-password),
[Discord](https://better-auth.com/docs/authentication/discord), and [Prisma](https://better-auth.com/docs/adapters/prisma).

Prisma 7 uses the official PostgreSQL driver adapter and ESM. Better Auth is
approved as a production dependency because it covers password hashing,
sessions, verification, password reset, Discord OAuth, and account linking.
Exact patch versions are resolved and locked during Foundation; prereleases
and unsupported runtimes are forbidden.

## Runtime architecture

Use a modular monolith in one repository:

```text
Browser
  -> Cloudflare Tunnel
  -> Next.js web container
       -> domain modules
       -> Prisma
       -> PostgreSQL
  -> worker container
       -> PostgreSQL outbox
       -> SMTP / Discord
```

Docker Compose is the canonical production and development workflow after
Foundation. Containers are `web`, `worker`, `postgres`, and `cloudflared`.
PostgreSQL is not internet-accessible. Tunnel, database, auth, Discord, and
SMTP secrets enter through environment variables and never through Git.

The web and worker share domain modules. PostgreSQL is the system of record.
There is no Redis or external queue initially: durable jobs use a transactional
outbox with row locking, bounded retry/backoff, and a visible dead-letter
state. Adding a service requires measured need and explicit approval.

## Identity and registration

Users can register and sign in with either verified email/password or Discord
OAuth. Multiple identities can link to one user; they must not silently create
duplicate accounts. Email flows include verification, password reset, address
change, security notifications, and session revocation through a provider-
neutral SMTP adapter.

The first successfully registered account atomically becomes the sole global
Owner. Initial deployment stays private or behind Cloudflare Access until this
bootstrap completes. A database constraint/transaction resolves concurrent
first registrations, and the event is audited.

Registration remains open afterward, but a new user sees no project until the
Owner grants project access. Discord roles never grant site permissions.

## Projects, tenant isolation, and RLS

`User` and authentication identities are global. `ProjectAccess` controls
visibility and entry. `ProjectMembership` assigns exactly one project role.
Characters, configuration, content, balances, items, requests, and logs are
project-scoped. The default project is “Эпоха Катастроф”. The global Owner sees
and can enter every project; other authority never crosses a project boundary.

Every tenant table carries `projectId` and uses project-scoped constraints.
Enable and force PostgreSQL Row-Level Security when the table is introduced.
The application runtime role neither owns protected tables nor has
`BYPASSRLS`; migrations use a separate role. Each transaction sets a local
tenant context. Workers set context from the claimed event. The global Owner
selects a project context instead of bypassing SQL policies.

Authorization uses defense in depth: RLS, scoped service APIs, compound keys,
server-side RBAC, server-side feature checks, and cross-tenant integration
tests. Client-provided `projectId` is never trusted as authorization context.

## Roles and permissions

Project role order is Player, Technician, Game Master, Head Administrator,
Project Owner, and global Owner.

Technician and higher roles can grant karma, gold, and items with a mandatory
reason. Item grants also require name and rarity. Game Master and higher roles
approve karma-store requests. “Strict approval” is different display copy,
not a different permission or workflow. Head Administrator and higher roles
can deactivate any project character. Project Owner and global Owner manage
project feature flags. Only the global Owner creates projects, controls access,
and deletes accounts.

Every server mutation performs its own permission check. Navigation visibility
is not a security boundary.

## Localization

Support `ru` and `en` for navigation, forms, validation, email, dictionaries,
system events, and Discord delivery. Store a user preference; before login,
start from the browser locale and permit manual switching.

Rules, publications, project descriptions, support text, item descriptions,
and other managed content store explicit required Russian and English
translations. Publishing is blocked until both exist. No machine translation
is performed. Audit events remain structured and language-neutral, then render
in the requested language.

## Characters and slots

A D&D 2014 character belongs to one user and project and has appearance date,
level, hit points, speed, armor class, proficiencies, armor/tool proficiency,
inventory, and editable titled text notes. The player may create, edit, and
delete their notes; each change is audited.

The six ability scores range from 1 through 30. The modifier is
`floor((score - 10) / 2)`, producing -5 at 1 and +10 at 30. Proficiency bonus
is +2 at levels 1–4, +3 at 5–8, +4 at 9–12, +5 at 13–16, and +6 at 17–20.
Each saving throw can be proficient.

Skills map to abilities:

- Strength: Athletics.
- Dexterity: Acrobatics, Sleight of Hand, Stealth.
- Intelligence: Arcana, History, Investigation, Nature, Religion.
- Wisdom: Animal Handling, Insight, Medicine, Perception, Survival.
- Charisma: Deception, Intimidation, Performance, Persuasion.

A skill is untrained, proficient, or expert. Its bonus is ability modifier plus
zero, one, or two proficiency bonuses respectively.

Per project, a player has two base slots. The first time any of their
characters reaches levels 5, 10, and 15, one permanent free slot is granted at
each threshold. Two purchased slots are initially allowed; the purchased-slot
limit rises to three, four, and five at those thresholds. Purchased slot prices
are 15, 20, 25, 30, and 35 karma. Maximum total capacity is ten.

## Character calendar and work

Each project has an IANA timezone, default `Europe/Berlin`. Appearance cannot
precede 2025-06-01. The appearance date counts as the first free day. Available
days equal project-local calendar dates from appearance through today,
inclusive, minus active occupancy. Entries cannot overlap, precede appearance,
or extend into the future.

Players add entries for their own characters but cannot edit or cancel them.
Technician and higher roles can correct an entry with a mandatory reason.
Cancellation releases days while preserving immutable history. A decade is 10
occupied days; two decades are 20.

One work day consumes one free day. Tool-work income is:

| Modifier | Daily income |
| --- | --- |
| +2 or lower | 2 silver |
| +3 | 5 silver |
| +4 | 1 gold |
| +5 | 2 gold |
| +6 | 5 gold |
| +7 | 15 gold |
| +8 | 25 gold |
| +9 | 40 gold |
| +10 or higher | 40 gold + 10 gold per point above +9 |

Musical instruments apply -2 to the work modifier. Without proficiency, only
the governing ability modifier applies. Thieves' tools are excluded. Monetary
amounts use integer copper pieces internally and display canonical gold/silver/
copper units, avoiding floating-point values.

## Ledgers, inventory, and transfers

Karma belongs to a user within a project. Gold belongs to a character. Both
use append-only ledgers as authority, with an optional cached balance updated
in the same transaction. Negative available balances are forbidden. Each
mutation records an idempotency key, actor, reason, operation reference, audit
event, and outbox event. Reconciliation compares cached balances with ledgers.

Inventory contains item instances with localized definition, rarity,
consumable status, provenance, current owner, and ownership history. Grant,
purchase, sale, and transfer are atomic.

Gold and item transfers require recipient acceptance. Pending assets are
reserved. Acceptance captures the reservation; rejection or automatic expiry
after three project-local calendar days releases it. Old transitions are
idempotent and remain auditable.

## Magic shop

Rarity parameters are:

| Rarity | Search DC | Days die | Base price | Consumable price | d100 modifier |
| --- | ---: | ---: | ---: | ---: | ---: |
| Common | 5 | d4 | 100 gp | 50 gp | +10 |
| Uncommon | 10 | d8 | 500 gp | 250 gp | 0 |
| Rare | 15 | d12 | 5,000 gp | 2,500 gp | -10 |

Search succeeds when `d20 + search modifier >= DC`; natural 1 and 20 have no
special behavior. A hireling uses a fixed bonus and daily gold cost: Poor
`+0/1`, Good `+4/5`, Competent `+6/10`, Expert `+8/25`. A successful attempt
takes the rarity die result; a failed attempt takes its maximum. Hireling cost
is days times daily cost. A self-search uses the character's Investigation
modifier and occupies the same number of calendar days.

Price uses `clamp(d100 + rarity modifier, 1, 100)`. Buy multipliers are
1–20: 1.500–2.000; 21–40: 1.000–1.490; 41–80: 0.750–0.990;
81–90: 0.500–0.740; and 91–100: 0.300–0.500. Sell multipliers are
1–20: 0.300–0.500; 21–42: 0.500–0.750; 43–82: 0.750–0.900;
83–92: 0.900–1.250; and 93–100: 1.250–1.600.

Server-generated integer random steps preserve the supplied inclusive ranges.
Store raw rolls and results. If a found offer is declined and search continues,
close the old offer permanently and start a new attempt with new checks, days,
hireling cost, and price. Previously spent days and gold are not returned.

## Karma shop and approvals

Character changes cost: race 10 (approval), class 20 (20 days and approval),
subclass 15 (10 days), feat 10 (5 days), languages 5 (5 days), background 10
(5 days and approval), spell-list entry 5, optional ability 5 (5 days), and
multiclass 5 karma.

Unlocks cost: adventure-book race 15, official subrace 7, subclass 20, feat
10, and background 10 karma. Homebrew class/race/subclass/feat/background and
spell unlock prices are set by a Game Master and require the same approval
workflow. Display copy may call it strict approval.

A level-10 character can buy one extra feat slot once for 30 karma, subject to
feat prerequisites and prior unlock, then submit the selected feat for Game
Master approval.

Approval-gated operations reserve karma and required days at submission.
Approval captures both; rejection or cancellation releases them. A request
uses an explicit state machine, optimistic concurrency, idempotent transitions,
actor/reason history, and project audit.

## Project content and feature flags

The About page shows project name, bilingual description, and bilingual
“Support the author” content. Head Administrator and higher roles edit it.
Server rules are bilingual titled publications, collapsed initially; Head
Administrator and higher roles create, edit, or archive them.

Allowed homebrew and illegal items use bilingual table entries with a stable
identifier, name, source/reference, description/notes, publication status,
author, and audit history. Exact optional columns can be extended only through
an approved phase design without weakening the bilingual contract.

Project Owner and global Owner manage feature flags for Magic Shop, Karma
Shop, Game Recruitment, Server Rules, Illegal Items, and Allowed Homebrew. A
disabled flag removes navigation and blocks pages, mutations, and background
operations server-side.

## Audit and integration delivery

Every transaction, grant, purchase/sale, character change, transfer, approval,
and work action creates immutable structured audit data. Views and Discord
destinations include Karma, Grants, Shop, Transfers, and Work. Project
configuration maps event categories to Discord channels/webhooks.

The domain mutation, ledger entries, audit event, and outbox event commit in
one transaction. SMTP/Discord delivery happens afterward. Failure retries with
backoff and eventually enters a visible dead-letter state; it never reverses a
successful user transaction. Logs redact passwords, tokens, cookies, and
secrets and expose a correlation ID for unexpected errors.

## Safe deletion

Head Administrator and higher roles deactivate a character with a mandatory
reason. It disappears from active use and frees its slot, but ledger,
inventory, transfer, and audit history remain.

Only the global Owner can delete an account. The destructive flow requires a
reason and repeated confirmation, revokes sessions and identities, anonymizes
email, Discord identifier, name, and avatar, and deactivates memberships and
characters. Anonymous ledger and audit references remain. These operations are
not physical history deletion.

## Error and concurrency model

Domain failures return stable codes with localized messages, including
insufficient balance/days, denied project access, disabled feature, expired
transfer, resolved approval, and stale balance. Duplicate form submissions use
idempotency keys. Conflicting writes return a retry/refresh response. Failed
transactions produce no partial balance, reservation, history, or outbox row.

## Validation strategy

Each phase adds unit and table-driven domain tests; PostgreSQL integration
tests for Prisma migrations, constraints, forced RLS, and cross-project denial;
RBAC and feature-flag tests; concurrency and idempotency tests; worker retry,
dead-letter, and redaction tests; responsive component and bilingual
Playwright flows; and lint, format, typecheck, production build, dependency
audit, migration validation, backup restore, and Docker smoke checks.

Randomized rules accept an injected random source. Production uses a
cryptographically secure server source; tests provide deterministic rolls.

## Roadmap

1. Foundation and production container baseline.
2. Accounts, authentication, SMTP, and localization.
3. Projects, RLS, RBAC, access, and feature flags.
4. Immutable audit, outbox worker, email, and Discord delivery.
5. Character sheet, slots, calendar, notes, and tool work.
6. Ledgers, grants, inventory, and accepted transfers.
7. Magic shop, hirelings, self-search, offers, purchase, and sale.
8. Karma catalog, reservations, approvals, unlocks, and extra feat slot.
9. About, support, rules, homebrew, and illegal-item tables.
10. Security hardening, backups, observability, runbook, and launch.

The roadmap issue links all phase issues. Each phase declares its predecessor,
scope, exclusions, acceptance criteria, validation, and mandatory Superpowers
preflight. A later implementation plan is written only after its predecessor
has completed and the actual repository interfaces are known.
