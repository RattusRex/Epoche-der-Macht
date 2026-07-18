import { afterAll, describe, expect, it } from "vitest";
import { db } from "./client";
import { probeDatabase } from "./probe";

describe("database probe", () => {
  afterAll(() => db.$disconnect());

  it("connects to PostgreSQL", async () => {
    await expect(probeDatabase()).resolves.toBeUndefined();
  });
});
