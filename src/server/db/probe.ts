import { db } from "./client.ts";

export async function probeDatabase(client = db): Promise<void> {
  await client.$queryRaw`SELECT 1`;
}
