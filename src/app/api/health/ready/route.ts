import { getReadiness } from "@/modules/health/readiness";
import { probeDatabase } from "@/server/db/probe";

export async function GET() {
  const readiness = await getReadiness(probeDatabase);

  return Response.json(readiness, {
    status: readiness.status === "ready" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
