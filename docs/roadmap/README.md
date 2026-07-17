# Epoha Product Roadmap

## Objective

Deliver the approved platform design in ten sequential, independently
verifiable phases. A phase may start only after its predecessor satisfies its
completion gate and the next phase has an approved implementation plan based
on the actual repository state.

## Mandatory execution gate

Every phase requires the Superpowers plugin. Before changing files, the agent
must invoke `superpowers:using-superpowers`, follow the phase's required
skills, and execute an approved plan with
`superpowers:subagent-driven-development` or
`superpowers:executing-plans`. If Superpowers or a required skill is missing,
the agent must stop without editing files or external state.

## Phases

- [ ] [Phase 01 — Foundation](phases/01-foundation.md)
- [ ] [Phase 02 — Accounts, authentication, and localization](phases/02-auth-and-localization.md)
- [ ] [Phase 03 — Projects, RLS, RBAC, and access](phases/03-projects-and-rbac.md)
- [ ] [Phase 04 — Audit, email, and Discord delivery](phases/04-audit-and-integrations.md)
- [ ] [Phase 05 — Characters, slots, and calendar](phases/05-characters.md)
- [ ] [Phase 06 — Ledgers, inventory, and transfers](phases/06-ledgers-inventory-transfers.md)
- [ ] [Phase 07 — Magic shop](phases/07-magic-shop.md)
- [ ] [Phase 08 — Karma shop and approvals](phases/08-karma-shop.md)
- [ ] [Phase 09 — Project content, rules, and tables](phases/09-project-content.md)
- [ ] [Phase 10 — Hardening and production launch](phases/10-hardening-and-launch.md)

## Global Definition of Done

A phase is complete only when:

- its approved implementation plan has no unchecked required task;
- acceptance criteria and important failure paths have automated tests;
- tenant-scoped work has forced PostgreSQL RLS and cross-tenant denial tests;
- server-side RBAC and feature flags are tested where applicable;
- Russian and English behavior is tested where applicable;
- lint, format, typecheck, relevant tests, migrations, build, dependency audit,
  and Docker smoke checks pass;
- the complete diff contains no secret, machine-specific path, unrelated
  refactor, hidden workaround, or unexplained dependency;
- operational documentation and `AGENTS.md` reflect newly verified commands;
- deviations and residual risks are reported explicitly;
- the user reviews the phase result before the next phase begins.

## Planning rule

Phase 01 uses the approved plan in
`docs/superpowers/plans/2026-07-17-foundation.md` and its two required
continuation files.
For Phases 02–10, the phase file is the approved scope contract. After the
previous phase completes, run `superpowers:brainstorming`, write and review a
phase design, then use `superpowers:writing-plans` to produce exact paths,
interfaces, test code, commands, and commit boundaries.

## Scope exclusion

Game Recruitment remains a disabled-capable project feature flag. No product
workflow is approved for it. Implementation requires its own discovery,
design, roadmap insertion, and user approval.
