import { describe, expect, it } from "vitest";
import { createPoolConfig } from "./pool-config";

describe("createPoolConfig", () => {
  const connectionString = "postgresql://epoha:test@postgres:5432/epoha";

  it("does not impose the readiness deadline on application queries", () => {
    expect(createPoolConfig(connectionString)).toEqual({ connectionString });
  });

  it("bounds all phases of a health probe", () => {
    expect(createPoolConfig(connectionString, 1_000)).toEqual({
      connectionString,
      connectionTimeoutMillis: 1_000,
      query_timeout: 1_000,
      statement_timeout: 1_000,
    });
  });
});
