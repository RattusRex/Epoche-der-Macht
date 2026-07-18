import { describe, expect, it, vi } from "vitest";
import { getReadiness } from "./readiness";

describe("getReadiness", () => {
  it("reports ready after a successful probe", async () => {
    await expect(
      getReadiness(vi.fn().mockResolvedValue(undefined)),
    ).resolves.toEqual({ status: "ready" });
  });

  it("does not expose database errors", async () => {
    await expect(
      getReadiness(vi.fn().mockRejectedValue(new Error("secret"))),
    ).resolves.toEqual({ status: "unavailable" });
  });
});
