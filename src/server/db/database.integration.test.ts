import { afterAll, describe, expect, it } from "vitest";
import { disconnectDatabaseClients } from "./client";
import { probeDatabase } from "./probe";

describe("database probe", () => {
  afterAll(disconnectDatabaseClients);

  it("connects to PostgreSQL", async () => {
    await expect(probeDatabase()).resolves.toBeUndefined();
  });
});
