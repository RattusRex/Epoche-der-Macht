# Epoha Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a reproducible, tested Next.js/Prisma/PostgreSQL foundation that runs as web, worker, database, and Cloudflare Tunnel containers.

**Architecture:** Create one strict-TypeScript modular monolith with a Next.js App Router HTTP boundary and a separately started worker from the same source tree. PostgreSQL is accessed through Prisma's PostgreSQL adapter; Docker Compose is the canonical environment after a one-command official Node-image bootstrap.

**Tech Stack:** Node.js 24.18.0 LTS, pnpm 10.34.5, Next.js 16.2.10, React 19.2.7, TypeScript 5.9.3, PostgreSQL 18.4, Prisma 7.8.0, Tailwind CSS 4.3.3, shadcn 4.13.1, Vitest 4.1.10, Playwright 1.61.1, Docker Compose.

## Global Constraints

- Read `AGENTS.md` and run its Mandatory Superpowers preflight before editing.
- Use Docker for installation and validation; host Node 18.19.1 is unsupported.
- Preserve the user's uncommitted `README.md` changes.
- Do not add authentication, tenant tables, RLS policies, business entities, Redis, or domain features in this phase.
- Pin package and container patch versions shown above; commit `pnpm-lock.yaml`.
- Do not expose PostgreSQL or web ports in the production Compose overlay.
- Never put database, Cloudflare, Discord, or SMTP secrets in tracked files.
- All manually maintained files remain below 350 lines.

---

## File map

- Root configuration owns package, TypeScript, lint, formatting, Tailwind, Vitest, Playwright, Docker, Compose, and environment contracts.
- `src/app/` owns the App Router shell and health endpoints only.
- `src/modules/health/` owns pure liveness/readiness behavior.
- `src/config/` validates server environment without a new runtime dependency.
- `src/server/db/` owns the Prisma singleton and database probe.
- `src/worker/` owns worker lifecycle; no outbox logic exists until Phase 04.
- `prisma/` owns the global Prisma schema and migrations.
- `tests/e2e/` owns browser smoke tests.

### Task 1: Pinned toolchain, web shell, and unit-test baseline

**Files:**
- Create: `.node-version`, `.gitignore`, `package.json`, `tsconfig.json`, `next-env.d.ts`
- Create: `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`
- Create: `.prettierrc.json`, `.prettierignore`, `vitest.config.ts`
- Create: `components.json`, `src/lib/utils.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `src/modules/health/status.test.ts`, `src/modules/health/status.ts`
- Create: `pnpm-lock.yaml` through the pinned bootstrap command

**Interfaces:**
- Produces: `getLiveness(): { status: "ok"; service: "epoha-web" }`
- Produces: package scripts used by every later task

- [ ] **Step 1: Create the pinned package and compiler configuration**

```json
{
  "name": "epoha",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.34.5",
  "engines": { "node": "24.x", "pnpm": "10.34.5" },
  "scripts": {
    "dev": "next dev --hostname 0.0.0.0",
    "build": "next build",
    "start": "next start --hostname 0.0.0.0",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:validate": "prisma validate",
    "db:migrate:deploy": "prisma migrate deploy",
    "worker:dev": "tsx src/worker/main.ts",
    "worker:build": "tsc -p tsconfig.worker.json",
    "worker:start": "node dist-worker/worker/main.js",
    "verify": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build"
  },
  "dependencies": {
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "lucide-react": "1.25.0",
    "next": "16.2.10",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "tailwind-merge": "3.6.0"
  },
  "devDependencies": {
    "@playwright/test": "1.61.1",
    "@tailwindcss/postcss": "4.3.3",
    "@testing-library/dom": "10.4.1",
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "16.3.2",
    "@types/node": "24.13.3",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "eslint": "10.7.0",
    "eslint-config-next": "16.2.10",
    "jsdom": "29.1.1",
    "prettier": "3.9.5",
    "prettier-plugin-tailwindcss": "0.8.1",
    "tailwindcss": "4.3.3",
    "tsx": "4.23.1",
    "typescript": "5.9.3",
    "vitest": "4.1.10"
  }
}
```

Set `.node-version` to `24.18.0` and create these exact core configs:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "dist-worker"]
}
```

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "standalone" };
export default nextConfig;
```

```js
// postcss.config.mjs
export default { plugins: { "@tailwindcss/postcss": {} } };
```

```js
// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "dist-worker/**", "src/generated/**"]),
]);
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["**/*.integration.test.ts", "tests/e2e/**", "node_modules/**"],
  },
});
```

`.prettierrc.json` is
`{"plugins":["prettier-plugin-tailwindcss"]}`. Configure `components.json`
with style `new-york`, RSC and TSX enabled, `src/app/globals.css`, CSS variables,
and aliases `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, and
`@/hooks`. Ignore `node_modules`, `.next`, `dist-worker`, `src/generated`,
coverage, Playwright output, `.env*` except `.env.example`, and editor/OS files.

- [ ] **Step 2: Generate the lockfile inside the approved runtime**

Run:

```bash
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -v "$PWD:/app" -w /app node:24.18.0-bookworm-slim \
  corepack pnpm install
```

Expected: exit 0, `pnpm-lock.yaml` created, no host `node_modules` owner mismatch.

- [ ] **Step 3: Write the failing liveness unit test**

```ts
import { describe, expect, it } from "vitest";
import { getLiveness } from "./status";

describe("getLiveness", () => {
  it("returns the stable web service contract", () => {
    expect(getLiveness()).toEqual({ status: "ok", service: "epoha-web" });
  });
});
```

Run with the same Node image and `corepack pnpm test`. Expected: FAIL because
`./status` does not exist.

- [ ] **Step 4: Implement the minimal shell and liveness contract**

```ts
export type Liveness = Readonly<{ status: "ok"; service: "epoha-web" }>;

export function getLiveness(): Liveness {
  return { status: "ok", service: "epoha-web" };
}
```

Create a root layout importing `globals.css`, a responsive landing page that
renders “Epoha” and “Foundation is running”, and Tailwind CSS containing
`@import "tailwindcss"`. Configure `components.json` for the Next RSC/Tailwind
setup and implement `cn(...inputs: ClassValue[])` with `clsx` and
`tailwind-merge`.

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Epoha", description: "D&D operations" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
```

```tsx
// src/app/page.tsx
export default function Home() {
  return <main className="grid min-h-dvh place-items-center p-6"><section><h1 className="text-4xl font-bold">Epoha</h1><p>Foundation is running</p></section></main>;
}
```

```ts
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

`src/app/globals.css` contains `@import "tailwindcss";`. `next-env.d.ts` uses
the standard three Next type references and is not manually changed afterward.

- [ ] **Step 5: Verify and commit Task 1**

Run in the Node image: `corepack pnpm format:check`, `lint`, `typecheck`,
`test`, and `build`. Expected: all exit 0 and one unit test passes.

```bash
git add .node-version .gitignore package.json pnpm-lock.yaml tsconfig.json next-env.d.ts \
  next.config.ts postcss.config.mjs eslint.config.mjs .prettierrc.json \
  .prettierignore vitest.config.ts components.json src
git commit -m "build: scaffold pinned Next.js foundation"
```

## Required continuation

Complete Tasks 2–5 in
`docs/superpowers/plans/2026-07-17-foundation-part-2.md`, then Tasks 6–8 and
the completion gate in `docs/superpowers/plans/2026-07-17-foundation-part-3.md`.
Both continuations inherit this plan header, global constraints, architecture,
and file map.
