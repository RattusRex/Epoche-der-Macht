import { PrismaPg } from "@prisma/adapter-pg";
import { loadServerEnv } from "../../config/server-env.ts";
import { PrismaClient } from "../../generated/prisma/client.ts";

const globalForDb = globalThis as unknown as { db?: PrismaClient };
const { databaseUrl } = loadServerEnv(process.env);

export const DATABASE_OPERATION_TIMEOUT_MS = 1_000;

export function createDatabaseClient(
  connectionString: string,
  timeoutMs = DATABASE_OPERATION_TIMEOUT_MS,
): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      connectionTimeoutMillis: timeoutMs,
      query_timeout: timeoutMs,
      statement_timeout: timeoutMs,
    }),
  });
}

export const db = globalForDb.db ?? createDatabaseClient(databaseUrl);

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
