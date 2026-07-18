import { healthDb } from "./client.ts";

export async function probeDatabase(client = healthDb): Promise<void> {
  await client.$queryRaw`SELECT 1`;
}
