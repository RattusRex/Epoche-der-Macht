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

  it("keeps the runtime active until aborted", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const running = runWorker({
      probe: vi.fn().mockResolvedValue(undefined),
      signal: controller.signal,
    });

    try {
      await Promise.resolve();
      expect(vi.getTimerCount()).toBe(1);
    } finally {
      controller.abort();
      await running;
      expect(vi.getTimerCount()).toBe(0);
      vi.useRealTimers();
    }
  });
});
