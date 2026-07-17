# Phase 10 — Security hardening, recovery, and production launch

**Blocked by:** Phase 09 completion and user review.

> Superpowers is mandatory. Begin with a threat-model review and an approved
> implementation plan. Do not weaken checks to obtain a release.

## Outcome

The complete platform has tested backup/restore, production observability,
security controls, operational runbooks, and a reversible VPS launch through
Cloudflare Tunnel.

## Included

- Repository threat model covering auth, RLS, RBAC, ledgers, random outcomes,
  webhooks, SMTP, worker, backups, and destructive administration.
- Reassessment and adversarial tests of forced RLS and privileged DB roles.
- CSRF/origin protections, security headers, request/body limits, rate limits,
  session controls, dependency/image scanning, and secret review.
- Automated encrypted PostgreSQL backups with retention, integrity checks, and
  a clean-environment restore drill.
- Structured logs, metrics, alerts, dead-letter operations, health checks, and
  disk/database capacity monitoring without sensitive payloads.
- VPS deployment, migration, Cloudflare Tunnel, bootstrap-owner, rollback,
  incident, account anonymization, and disaster-recovery runbooks.
- Full bilingual desktop/mobile regression and load test for target scale.

## Acceptance criteria

- A backup restores into a clean PostgreSQL instance and passes consistency and
  application smoke checks.
- RLS/RBAC adversarial suite finds no cross-project path, including worker and
  global Owner flows.
- High/critical dependency or image findings are resolved or explicitly
  accepted by the user with impact and follow-up.
- Alerts detect web, worker, database, tunnel, delivery, backup, and disk faults.
- Production deployment and rollback are rehearsed without data loss.
- First Owner bootstrap occurs behind temporary restricted access, then public
  registration behaves as approved.
- Final acceptance criteria from all prior phases pass against production-like
  Compose before DNS cutover.

## Excluded

Feature expansion, Game Recruitment, mobile apps, and microservice extraction.
