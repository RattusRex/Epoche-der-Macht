import { db } from "./client.js";

export async function probeDatabase(client = db): Promise<void> {
  await client.$queryRaw`SELECT 1`;
}
