# Phase 02 — Accounts, authentication, and localization

**Blocked by:** Phase 01 completion and user review.

> Superpowers is mandatory. Stop without editing if it is unavailable. Run
> brainstorming and writing-plans against the completed Foundation before
> implementation, then execute with TDD and verification-before-completion.

## Outcome

Users register and sign in through verified email/password or Discord OAuth,
link identities safely, recover accounts by SMTP, and use a complete Russian
or English authentication experience.

## Included

- Better Auth with Prisma, secure sessions, email verification, password reset,
  email change, Discord OAuth, logout, and session revocation.
- Duplicate-account prevention and explicit identity linking.
- Atomic first-registered-user bootstrap for exactly one global Owner.
- Open registration followed by a no-project-access waiting state.
- Provider-neutral SMTP adapter delivered through the transactional interface
  defined for later outbox integration; no secrets in logs or Git.
- Locale detection, profile preference, manual `ru`/`en` switcher, localized
  auth UI, validation, and email templates.
- Rate limiting and enumeration-resistant responses for auth-sensitive flows.

## Acceptance criteria

- Concurrent first registrations produce exactly one global Owner.
- Unverified email accounts cannot authenticate through the password flow.
- Discord and password identities can belong to one account without implicit
  takeover based only on a matching unverified address.
- Password reset revokes required sessions and never reveals account existence.
- Every auth page and email is available in Russian and English.
- Auth tables remain global; no project authority comes from Discord roles.
- Secrets, tokens, password hashes, and cookies are absent from logs.

## Excluded

Project membership, project RBAC, RLS, Discord log channels, and domain content.
