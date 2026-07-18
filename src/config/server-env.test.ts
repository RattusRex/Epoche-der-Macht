import { describe, expect, it } from "vitest";
import { loadServerEnv } from "./server-env";

describe("loadServerEnv", () => {
  it("rejects a missing database URL", () => {
    expect(() => loadServerEnv({})).toThrow("DATABASE_URL is required");
  });

  it("accepts a PostgreSQL URL", () => {
    expect(
      loadServerEnv({ DATABASE_URL: "postgresql://u:p@db:5432/epoha" }),
    ).toEqual({ databaseUrl: "postgresql://u:p@db:5432/epoha" });
  });

  it("rejects a non-PostgreSQL URL", () => {
    expect(() =>
      loadServerEnv({ DATABASE_URL: "https://db.example.test/epoha" }),
    ).toThrow("DATABASE_URL must use PostgreSQL");
  });
});
