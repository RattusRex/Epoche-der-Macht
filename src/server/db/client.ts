import { PrismaPg } from "@prisma/adapter-pg";
import { loadServerEnv } from "../../config/server-env.ts";
import { PrismaClient } from "../../generated/prisma/client.ts";

const globalForDb = globalThis as unknown as { db?: PrismaClient };
const { databaseUrl } = loadServerEnv(process.env);

export const db =
  globalForDb.db ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
