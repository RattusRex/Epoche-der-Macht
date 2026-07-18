import { PrismaPg } from "@prisma/adapter-pg";
import { loadServerEnv } from "../../config/server-env.ts";
import { PrismaClient } from "../../generated/prisma/client.ts";
import { createPoolConfig } from "./pool-config.ts";

const globalForDb = globalThis as unknown as {
  db?: PrismaClient;
  healthDb?: PrismaClient;
};
const { databaseUrl } = loadServerEnv(process.env);

export const DATABASE_OPERATION_TIMEOUT_MS = 1_000;

export function createDatabaseClient(
  connectionString: string,
  timeoutMs?: number,
): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg(createPoolConfig(connectionString, timeoutMs)),
  });
}

export const db = globalForDb.db ?? createDatabaseClient(databaseUrl);
export const healthDb =
  globalForDb.healthDb ??
  createDatabaseClient(databaseUrl, DATABASE_OPERATION_TIMEOUT_MS);

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
  globalForDb.healthDb = healthDb;
}

export async function disconnectDatabaseClients(): Promise<void> {
  await Promise.all([db.$disconnect(), healthDb.$disconnect()]);
}
