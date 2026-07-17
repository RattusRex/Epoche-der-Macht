# Epoha Foundation Implementation Plan — Part 3

> **For agentic workers:** This is the final required continuation of `2026-07-17-foundation.md`. Use the same required sub-skill, global constraints, architecture, and checkbox tracking. Do not execute this file independently or before Tasks 1–5.

### Task 6: Production images, Compose overlays, and Cloudflare Tunnel

**Files:**
- Create: `Dockerfile`, `compose.prod.yaml`
- Modify: `compose.yaml`, `compose.dev.yaml`
- Create: `scripts/smoke.sh`

**Interfaces:**
- Produces: `web`, `worker`, `postgres`, and opt-in `cloudflared` services
- Consumes: health endpoints and worker start command

- [ ] **Step 1: Write a failing static Compose contract check**

Create `scripts/smoke.sh` with strict shell mode. Before implementation it must
assert via `docker compose config` that required services exist, production has
no published ports, `web` has an HTTP health check, `postgres` has `pg_isready`,
and `cloudflared` is under profile `tunnel`. Run it; expected: FAIL.

- [ ] **Step 2: Build the pinned multi-stage image**

`Dockerfile` uses `node:24.18.0-bookworm-slim`, prepares pnpm 10.34.5, installs
with `--frozen-lockfile`, generates Prisma, builds Next standalone and worker,
and runs production as a non-root user. The final image contains production
dependencies, `.next/standalone`, `.next/static`, `public`, `dist-worker`, and
generated Prisma assets. It exposes 3000 but does not publish it.

- [ ] **Step 3: Complete Compose services**

Base Compose defines private `frontend` and `backend` networks. Production web
uses the image's server command; worker uses `pnpm worker:start`; both depend on
healthy PostgreSQL. `cloudflared` uses
`cloudflare/cloudflared:2026.7.2`, profile `tunnel`, command
`tunnel --no-autoupdate run --token ${TUNNEL_TOKEN}`, and only `frontend`.
Development overlay builds the dev target, bind-mounts source, and publishes
web only on `127.0.0.1:3000`. Production publishes no ports.

- [ ] **Step 4: Run production smoke tests and commit Task 6**

Run `scripts/smoke.sh`, build all images, start web/worker/postgres without the
tunnel profile, wait for healthy, and curl both health routes from inside the
frontend network. Stop with `docker compose down`, preserving the DB volume.

```bash
git add Dockerfile compose.yaml compose.dev.yaml compose.prod.yaml scripts/smoke.sh
git commit -m "build: add production container topology"
```

### Task 7: Browser smoke test and GitHub Actions CI

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/foundation.spec.ts`
- Create: `.github/workflows/ci.yml`
- Modify: `Dockerfile`, `compose.dev.yaml`

**Interfaces:**
- Produces: `e2e` Compose profile and required CI checks

- [ ] **Step 1: Write the failing browser smoke test**

```ts
import { expect, test } from "@playwright/test";

test("foundation serves the shell and health", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Epoha" })).toBeVisible();
  const live = await request.get("/api/health/live");
  expect(live.status()).toBe(200);
  await expect(live.json()).resolves.toEqual({ status: "ok", service: "epoha-web" });
  expect((await request.get("/api/health/ready")).status()).toBe(200);
});
```

Run before adding the e2e image. Expected: FAIL because the test runner service
and Playwright configuration do not exist.

- [ ] **Step 2: Configure deterministic Chromium execution**

Set Playwright base URL to `http://web:3000`, one Chromium project, no retries
locally, two retries in CI, trace on first retry, and HTML report under ignored
`playwright-report/`. Add an `e2e` Docker target based on
`mcr.microsoft.com/playwright:v1.61.1-noble`, prepare pnpm 10.34.5, and add the
profiled Compose service sharing the source and node_modules volume.

- [ ] **Step 3: Add Docker-only CI**

The workflow triggers on pull requests and pushes to `main`, checks out code,
validates Compose, installs with frozen lockfile inside the dev image, starts
PostgreSQL, and runs format, lint, typecheck, unit, integration, production
build, worker build, dependency audit, smoke, and Playwright. Always upload
Compose logs on failure and always tear down containers. Pin official action
major versions to `actions/checkout@v6` and `actions/upload-artifact@v7`, and
grant `contents: read` only.

- [ ] **Step 4: Run the complete local CI sequence and commit Task 7**

Expected: all checks exit 0, one browser test passes, and teardown leaves no
project containers running.

```bash
git add playwright.config.ts tests/e2e .github/workflows/ci.yml \
  Dockerfile compose.dev.yaml .gitignore
git commit -m "ci: verify foundation in Docker"
```

### Task 8: Reproducibility documentation and final audit

**Files:**
- Create: `docs/development.md`, `docs/deployment.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Produces: verified canonical commands and VPS/Cloudflare runbook

- [ ] **Step 1: Document only commands proven in Tasks 1–7**

`docs/development.md` covers prerequisites, copying `.env.example`, bootstrap,
Compose development, migrations, tests, audit, smoke, logs, and teardown.
`docs/deployment.md` covers VPS prerequisites, secret provisioning, image
build, migration deployment, tunnel token, health verification, rollback to a
previous image, PostgreSQL volume backup boundary, and the explicit statement
that restore automation is delivered in Phase 10.

- [ ] **Step 2: Replace the design-stage notice in AGENTS.md**

List the exact verified Compose/package entry points. State that Docker Compose
is now canonical, host Node is unsupported, generated Prisma client files are
not manually edited, and schema changes require migrations and integration
tests. Do not duplicate the development guide.

- [ ] **Step 3: Run fresh final verification**

Run from a clean container state:

```bash
docker compose -f compose.yaml -f compose.dev.yaml config
docker compose -f compose.yaml -f compose.dev.yaml run --rm web pnpm install --frozen-lockfile
docker compose -f compose.yaml -f compose.dev.yaml up -d postgres
docker compose -f compose.yaml -f compose.dev.yaml run --rm web pnpm verify
docker compose -f compose.yaml -f compose.dev.yaml run --rm web pnpm test:integration
docker compose -f compose.yaml -f compose.dev.yaml run --rm web pnpm worker:build
docker compose -f compose.yaml -f compose.dev.yaml --profile test run --rm e2e pnpm test:e2e
docker compose -f compose.yaml -f compose.prod.yaml build
docker compose -f compose.yaml -f compose.dev.yaml run --rm web pnpm audit --audit-level high
./scripts/smoke.sh
```

Expected: every command exits 0. Review `git diff`, `docker compose ps -a`, and
`git status`; only intended files change, no secrets exist, README remains
untouched, and no project container remains after teardown.

- [ ] **Step 4: Commit Foundation documentation**

```bash
git add AGENTS.md docs/development.md docs/deployment.md
git commit -m "docs: document foundation operations"
```

## Foundation completion gate

Do not start Phase 02 until all eight task commits exist, CI passes, the
production image and worker start successfully, the database probe and browser
smoke test pass, the dependency audit has no unreviewed high/critical finding,
and the user has reviewed the complete diff. If any required check cannot run,
stop and report it using the repository Deviation Ledger format.
