export type ServerEnv = Readonly<{ databaseUrl: string }>;
type EnvironmentSource = Readonly<Record<string, string | undefined>>;

export function loadServerEnv(source: EnvironmentSource): ServerEnv {
  const databaseUrl = source.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const parsed = new URL(databaseUrl);

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("DATABASE_URL must use PostgreSQL");
  }

  return { databaseUrl };
}
