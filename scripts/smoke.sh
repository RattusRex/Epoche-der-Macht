#!/usr/bin/env bash
set -euo pipefail

project_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
compose=(
  docker compose
  --env-file "$project_root/.env.example"
  -f "$project_root/compose.yaml"
  -f "$project_root/compose.prod.yaml"
  --profile tunnel
)

"${compose[@]}" config --format json | docker run --rm -i \
  node:24.18.0-bookworm-slim node --input-type=module -e '
    let input = "";
    for await (const chunk of process.stdin) input += chunk;
    const config = JSON.parse(input);
    const fail = (message) => {
      process.stderr.write(`Smoke contract failed: ${message}\n`);
      process.exit(1);
    };
    const required = ["web", "worker", "postgres", "cloudflared"];
    for (const service of required) {
      if (!config.services?.[service]) fail(`missing ${service} service`);
    }
    for (const [name, service] of Object.entries(config.services)) {
      if (service.ports?.length) fail(`${name} publishes a production port`);
    }
    const webHealth = config.services.web.healthcheck?.test?.join(" ") ?? "";
    if (!webHealth.includes("/api/health/live")) fail("web healthcheck is missing");
    const postgresHealth = config.services.postgres.healthcheck?.test?.join(" ") ?? "";
    if (!postgresHealth.includes("pg_isready")) fail("postgres healthcheck is missing");
    if (!config.services.cloudflared.profiles?.includes("tunnel")) {
      fail("cloudflared must use the tunnel profile");
    }
    const tunnelNetworks = Object.keys(config.services.cloudflared.networks ?? {});
    if (tunnelNetworks.length !== 1 || tunnelNetworks[0] !== "frontend") {
      fail("cloudflared must use only the frontend network");
    }
    const webNetworks = Object.keys(config.services.web.networks ?? {});
    if (!webNetworks.includes("frontend") || !webNetworks.includes("backend")) {
      fail("web must bridge the frontend and backend networks");
    }
    if (config.networks?.backend?.internal !== true) {
      fail("backend network must be internal");
    }
  '
