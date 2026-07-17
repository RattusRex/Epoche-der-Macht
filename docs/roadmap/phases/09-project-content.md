# Phase 09 — Project content, rules, and tables

**Blocked by:** Phase 08 completion and user review.

> Superpowers is mandatory. Approve bilingual content schemas and responsive
> layouts before editing; execute the resulting plan with TDD.

## Outcome

Projects publish a bilingual About page, support text, collapsible rules, and
audited Allowed Homebrew and Illegal Items tables controlled by feature flags.

## Included

- About page with project name, required Russian/English description, and
  required Russian/English “Support the author” panel.
- Head Administrator+ create/edit/archive permissions for About and rules.
- Bilingual titled rule publications collapsed by default.
- Allowed Homebrew and Illegal Items entries with stable ID, bilingual name,
  source/reference, bilingual notes/description, status, author, and history.
- Publication blocked while either required locale is incomplete.
- Responsive reading/editing experiences and locale-specific rendering.
- Server-side feature-flag enforcement and project audit/outbox events.

## Acceptance criteria

- Readers cannot observe unpublished or other-project content by identifier.
- Players have read-only access; unauthorized mutations fail server-side.
- Archive preserves revisions and audit rather than deleting history.
- Switching locale changes all managed content without machine translation.
- Rules start collapsed and remain keyboard/screen-reader accessible.
- Disabled content modules are absent from navigation and inaccessible directly.

## Excluded

Game Recruitment behavior, copyrighted rules ingestion, and automatic translation.
