# Epoha Foundation Implementation Plan — Part 2

> **For agentic workers:** This is the required continuation of `2026-07-17-foundation.md`. Use the same required sub-skill, global constraints, architecture, and checkbox tracking. Do not execute this file independently or before Task 1.

### Task 2: PostgreSQL Compose service and environment contract

**Files:**
- Create: `.env.example`, `compose.yaml`, `compose.dev.yaml`, `.dockerignore`
- Create: `src/config/server-env.test.ts`, `src/config/server-env.ts`

**Interfaces:**
- Produces: `loadServerEnv(source): { databaseUrl: string }`
- Produces: healthy `postgres` service on the private `backend` network

- [ ] **Step 1: Write failing environment validation tests**

```ts
import { describe, expect, it } from "vitest";
import { loadServerEnv } from "./server-env";

describe("loadServerEnv", () => {
  it("rejects a missing database URL", () => {
    expect(() => loadServerEnv({})).toThrow("DATABASE_URL is required");
  });

  it("accepts a PostgreSQL URL", () => {
    expect(loadServerEnv({ DATABASE_URL: "postgresql://u:p@db:5432/epoha" }))
      .toEqual({ databaseUrl: "postgresql://u:p@db:5432/epoha" });
  });
});
```

Run unit tests. Expected: FAIL because `server-env.ts` does not exist.

- [ ] **Step 2: Implement strict dependency-free environment parsing**

```ts
export type ServerEnv = Readonly<{ databaseUrl: string }>;

export function loadServerEnv(source: NodeJS.ProcessEnv): ServerEnv {
  const databaseUrl = source.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const parsed = new URL(databaseUrl);
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("DATABASE_URL must use PostgreSQL");
  }
  return { databaseUrl };
}
```

- [ ] **Step 3: Define the database service without tracked secrets**

`.env.example` contains non-secret local example values and blank
`TUNNEL_TOKEN=`. `compose.yaml` defines `postgres:18.4-bookworm`, a named
`postgres-data` volume, `pg_isready` health check, and internal `backend`
network. It must not publish port 5432. `compose.dev.yaml` may publish
`127.0.0.1:5432:5432` for local database tooling only.

```dotenv
POSTGRES_DB=epoha
POSTGRES_USER=epoha
POSTGRES_PASSWORD=local-development-only
DATABASE_URL=postgresql://epoha:local-development-only@postgres:5432/epoha
TUNNEL_TOKEN=
```

```yaml
# compose.yaml
name: epoha
services:
  postgres:
    image: postgres:18.4-bookworm
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-epoha}
      POSTGRES_USER: ${POSTGRES_USER:-epoha}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 3s
      retries: 12
    volumes: ["postgres-data:/var/lib/postgresql"]
    networks: ["backend"]
volumes:
  postgres-data:
networks:
  backend:
    internal: true
```

```yaml
# compose.dev.yaml
services:
  postgres:
    ports: ["127.0.0.1:5432:5432"]
```

`.dockerignore` excludes Git metadata, dependency/build/test output, local
environment files, and editor/OS files, while retaining `.env.example`.

- [ ] **Step 4: Verify and commit Task 2**

Run `docker compose -f compose.yaml -f compose.dev.yaml config`, start
PostgreSQL, wait for healthy status, and run `pg_isready` inside the service.
Expected: all exit 0; no public `0.0.0.0:5432` binding.

```bash
git add .env.example .dockerignore compose.yaml compose.dev.yaml src/config
git commit -m "build: add PostgreSQL development baseline"
```

### Task 3: Prisma PostgreSQL adapter and integration harness

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Create: `prisma.config.ts`, `prisma/schema.prisma`
- Create: `vitest.integration.config.ts`
- Create: `src/server/db/client.ts`, `src/server/db/probe.ts`
- Create: `src/server/db/database.integration.test.ts`

**Interfaces:**
- Produces: `db: PrismaClient`
- Produces: `probeDatabase(client?): Promise<void>`

- [ ] **Step 1: Add exact Prisma runtime packages in the Node container**

Run `corepack pnpm add @prisma/client@7.8.0 @prisma/adapter-pg@7.8.0 pg@8.22.0`
and `corepack pnpm add -D prisma@7.8.0`. Expected: lockfile changes only for
the requested dependency tree. Run `pnpm list --depth 1` and save no output file.

- [ ] **Step 2: Write the failing real-database probe test**

```ts
import { afterAll, describe, expect, it } from "vitest";
import { db } from "./client";
import { probeDatabase } from "./probe";

describe("database probe", () => {
  afterAll(() => db.$disconnect());
  it("connects to PostgreSQL", async () => {
    await expect(probeDatabase()).resolves.toBeUndefined();
  });
});
```

Run with PostgreSQL healthy and `DATABASE_URL` set to the Compose service.
Expected: FAIL because the client and probe do not exist.

- [ ] **Step 3: Configure Prisma 7 and implement the singleton**

Use `prisma.config.ts` with schema path, migrations path, and `env("DATABASE_URL")`.
Use the `prisma-client` generator with output `../src/generated/prisma` and a
PostgreSQL datasource. Do not add a fake business model or migration.

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { loadServerEnv } from "../../config/server-env.js";
import { PrismaClient } from "../../generated/prisma/client.js";

const globalForDb = globalThis as unknown as { db?: PrismaClient };
const { databaseUrl } = loadServerEnv(process.env);
const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
export const db = globalForDb.db ?? client;
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
```

```ts
import { db } from "./client.js";

export async function probeDatabase(client = db): Promise<void> {
  await client.$queryRaw`SELECT 1`;
}
```

- [ ] **Step 4: Generate, validate, test, and commit Task 3**

Run `pnpm db:generate`, `pnpm db:validate`, `pnpm test:integration`, and
`pnpm audit --audit-level high` in Compose. Expected: all exit 0 and the probe
test passes. Do not apply forced audit fixes.

```bash
git add package.json pnpm-lock.yaml prisma.config.ts prisma \
  vitest.integration.config.ts src/server .gitignore
git commit -m "build: connect Prisma to PostgreSQL"
```

### Task 4: Liveness and database-readiness endpoints

**Files:**
- Create: `src/modules/health/readiness.test.ts`, `src/modules/health/readiness.ts`
- Create: `src/app/api/health/live/route.ts`
- Create: `src/app/api/health/ready/route.ts`

**Interfaces:**
- Produces: `getReadiness(probe): Promise<{ status: "ready" | "unavailable" }>`
- Produces: `GET /api/health/live` and `GET /api/health/ready`

- [ ] **Step 1: Write failing readiness behavior tests**

```ts
import { describe, expect, it, vi } from "vitest";
import { getReadiness } from "./readiness";

describe("getReadiness", () => {
  it("reports ready after a successful probe", async () => {
    await expect(getReadiness(vi.fn().mockResolvedValue(undefined)))
      .resolves.toEqual({ status: "ready" });
  });
  it("does not expose database errors", async () => {
    await expect(getReadiness(vi.fn().mockRejectedValue(new Error("secret"))))
      .resolves.toEqual({ status: "unavailable" });
  });
});
```

Run the targeted test. Expected: FAIL because `readiness.ts` is absent.

- [ ] **Step 2: Implement pure readiness and route adapters**

```ts
export async function getReadiness(probe: () => Promise<void>) {
  try {
    await probe();
    return { status: "ready" as const };
  } catch {
    return { status: "unavailable" as const };
  }
}
```

The live route returns `getLiveness()` with 200. The ready route calls
`getReadiness(probeDatabase)` and returns 200 for ready, 503 otherwise, with
`Cache-Control: no-store`. Neither route returns exception text or environment.

- [ ] **Step 3: Run unit/integration checks and commit Task 4**

Expected: unit tests cover both readiness branches, integration probe passes,
and `curl` against a dev server returns 200 for both endpoints.

```bash
git add src/modules/health src/app/api/health
git commit -m "feat: add service health endpoints"
```
### Task 5: Graceful worker lifecycle

**Files:**
- Create: `tsconfig.worker.json`
- Create: `src/worker/runner.test.ts`, `src/worker/runner.ts`, `src/worker/main.ts`

**Interfaces:**
- Produces: `runWorker({ probe, signal }): Promise<void>`
- Consumes: `probeDatabase()` and `db.$disconnect()`

- [ ] **Step 1: Write the failing lifecycle test**

```ts
import { describe, expect, it, vi } from "vitest";
import { runWorker } from "./runner";

describe("runWorker", () => {
  it("probes once and exits when aborted", async () => {
    const controller = new AbortController();
    const probe = vi.fn().mockResolvedValue(undefined);
    const running = runWorker({ probe, signal: controller.signal });
    await vi.waitFor(() => expect(probe).toHaveBeenCalledOnce());
    controller.abort();
    await expect(running).resolves.toBeUndefined();
  });
});
```

Run the targeted test. Expected: FAIL because `runner.ts` is absent.

- [ ] **Step 2: Implement an idle, stoppable Phase 01 worker**

```ts
export async function runWorker(input: {
  probe: () => Promise<void>;
  signal: AbortSignal;
}): Promise<void> {
  await input.probe();
  if (input.signal.aborted) return;
  await new Promise<void>((resolve) =>
    input.signal.addEventListener("abort", () => resolve(), { once: true }),
  );
}
```

`main.ts` creates one `AbortController`, maps `SIGINT` and `SIGTERM` to abort,
runs the worker with `probeDatabase`, reports only a sanitized startup failure,
sets `process.exitCode = 1`, and always disconnects Prisma. Do not poll or invent
outbox tables in this phase. Use relative `.js` import specifiers throughout
the worker dependency graph; do not use the Next-only `@/*` alias there.
`tsconfig.worker.json` compiles worker, config, database, and generated Prisma
code to `dist-worker` with NodeNext semantics.

- [ ] **Step 3: Verify worker build and commit Task 5**

Run `pnpm test src/worker/runner.test.ts` and `pnpm worker:build`. Start the
worker against healthy PostgreSQL, send SIGTERM, and expect exit 0.

```bash
git add tsconfig.worker.json src/worker package.json pnpm-lock.yaml
git commit -m "feat: add graceful worker process"
```

## Required continuation

Complete Tasks 6–8 and the Foundation completion gate in
`docs/superpowers/plans/2026-07-17-foundation-part-3.md` immediately after
Task 5. Part 3 inherits the main plan's header, global constraints,
architecture, and file map.
