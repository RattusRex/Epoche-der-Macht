# VPS deployment

The production topology runs `web`, `worker`, PostgreSQL, and an optional
Cloudflare Tunnel. It publishes no host ports; Cloudflare Tunnel reaches `web`
through the private Compose frontend network.

## Prerequisites and secrets

Install Docker Engine with Docker Compose v2 on the VPS and check out an exact
reviewed commit. Create a root-readable `.env` file outside Git:

```dotenv
POSTGRES_DB=epoha
POSTGRES_USER=epoha
POSTGRES_PASSWORD=<strong-unique-secret>
DATABASE_URL=postgresql://epoha:<URL-encoded-password>@postgres:5432/epoha
TUNNEL_TOKEN=<Cloudflare-managed-tunnel-token>
```

```bash
chmod 600 .env
```

Provision the tunnel and its public hostname in Cloudflare before starting the
profile. Never commit the token or the production database credentials.

## Build, migrate, and start

Tag the currently deployed images before replacing them. Substitute a durable
release identifier for `<previous-release>`:

```bash
docker tag epoha-web:latest epoha-web:<previous-release>
docker tag epoha-worker:latest epoha-worker:<previous-release>
```

Skip those two commands on the first deployment. Build the development target
only as a one-off migration tool, apply migrations, stop that topology, and
then build the smaller production runtime images:

```bash
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml build web
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml up -d --wait postgres
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml run --rm --no-deps web pnpm db:migrate:deploy
docker compose --env-file .env -f compose.yaml -f compose.dev.yaml down --remove-orphans
docker compose --env-file .env -f compose.yaml -f compose.prod.yaml build web worker
./scripts/smoke.sh
docker compose --env-file .env -f compose.yaml -f compose.prod.yaml --profile tunnel up -d --wait postgres web worker cloudflared
```

The migration command uses the checked-out source and full toolchain. The
long-running production containers use only the `runner` image target.

## Verify and operate

Verify both endpoints from inside the web container:

```bash
docker compose --env-file .env -f compose.yaml -f compose.prod.yaml exec -T web node --input-type=module -e 'for (const path of ["live", "ready"]) { const response = await fetch(`http://127.0.0.1:3000/api/health/${path}`); if (!response.ok) process.exit(1); }'
docker compose --env-file .env -f compose.yaml -f compose.prod.yaml --profile tunnel ps
docker compose --env-file .env -f compose.yaml -f compose.prod.yaml --profile tunnel logs --tail 200 web worker cloudflared
```

`live` proves the HTTP process is responsive. `ready` additionally probes
PostgreSQL. Monitor the externally configured Cloudflare hostname separately.

## Roll back application images

Database migrations are not automatically reversible. Confirm that the target
application release is compatible with the current schema, then restore the
previous image tags and recreate only application processes:

```bash
docker tag epoha-web:<previous-release> epoha-web:latest
docker tag epoha-worker:<previous-release> epoha-worker:latest
docker compose --env-file .env -f compose.yaml -f compose.prod.yaml up -d --no-build --force-recreate web worker
```

Re-run both health checks after rollback. Do not roll back PostgreSQL files by
copying the live volume.

## PostgreSQL backup boundary

The persistent boundary is the Compose volume `epoha_postgres-data`. Create a
logical backup before migrations and retain it outside that volume:

```bash
mkdir -p backups
docker compose --env-file .env -f compose.yaml -f compose.prod.yaml exec -T postgres sh -lc 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "backups/epoha-$(date +%Y%m%d-%H%M%S).dump"
```

Verify backup retention and restore procedures according to the VPS operating
policy. Automated backup and restore workflows are delivered in Phase 10;
Phase 01 provides only this explicit manual boundary.
