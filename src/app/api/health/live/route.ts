import { getLiveness } from "@/modules/health/status";

export function GET() {
  return Response.json(getLiveness(), {
    headers: { "Cache-Control": "no-store" },
  });
}
