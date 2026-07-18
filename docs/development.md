# Development

Docker Compose is the supported development and validation environment. Host
Node.js and host pnpm are not supported.

## Prerequisites

- Docker Engine with Docker Compose v2
- Git
- enough disk space for the Node, PostgreSQL, and Playwright images

## Bootstrap

Create the local environment file and keep it out of Git:

```bash
cp .env.example .env
export DEV_UID="$(id -u)" DEV_GID="$(id -g)"
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml build web worker
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml run --rm --no-deps web pnpm install --frozen-lockfile
```

The committed example credentials are for loopback-only development. Replace
them before using the stack anywhere else.

## Run the application

```bash
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml up -d --wait postgres web worker
```

The application is available at <http://127.0.0.1:3000>. PostgreSQL is bound to
`127.0.0.1:5432`; neither port is exposed on a non-loopback interface.

Inspect service state and logs with:

```bash
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml ps
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml logs -f web worker postgres
```

## Database and migrations

Start PostgreSQL before database checks or migration deployment:

```bash
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml up -d --wait postgres
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml run --rm --no-deps web pnpm db:generate
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml run --rm --no-deps web pnpm db:validate
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml run --rm --no-deps web pnpm db:migrate:deploy
```

Schema changes must include a version-controlled Prisma migration and database
integration tests. Never edit `src/generated/prisma` manually.

## Validation

```bash
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml run --rm --no-deps web pnpm verify
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml run --rm --no-deps web pnpm test:integration
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml run --rm --no-deps web pnpm worker:build
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml run --rm --no-deps web pnpm audit --audit-level high
```

Run the browser smoke test against healthy development services:

```bash
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml --profile test build e2e
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml up -d --wait postgres web worker
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml --profile test run --rm --no-deps e2e pnpm test:e2e
```

Validate the production topology and images locally:

```bash
docker compose --env-file .env -f compose.yaml -f compose.prod.yaml build web worker
./scripts/smoke.sh
```

## Teardown

```bash
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml --profile test down --remove-orphans
```

The command preserves the named PostgreSQL volume. Removing volumes is a
separate destructive operation and is not part of normal teardown.
