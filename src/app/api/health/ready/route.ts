import { getReadiness } from "@/modules/health/readiness";
import { probeDatabase } from "@/server/db/probe";

export function createReadinessHandler(probe = probeDatabase) {
  return async function readinessHandler() {
    const readiness = await getReadiness(probe);

    return Response.json(readiness, {
      status: readiness.status === "ready" ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    });
  };
}

export const GET = createReadinessHandler();
