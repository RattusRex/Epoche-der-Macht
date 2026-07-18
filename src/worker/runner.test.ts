import { describe, expect, it, vi } from "vitest";
import { runWorker } from "./runner";

describe("runWorker", () => {
  it("probes once and exits when aborted", async () => {
    const controller = new AbortController();
    const probe = vi.fn().mockResolvedValue(undefined);
    const running = runWorker({ probe, signal: controller.signal });

    await vi.waitFor(() => expect(probe).toHaveBeenCalledOnce());
    controller.abort();

    await expect(running).resolves.toBeUndefined();
  });
});
