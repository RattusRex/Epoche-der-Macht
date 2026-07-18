import { createServer, type Socket } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseClient } from "../../../../server/db/client";
import { probeDatabase } from "../../../../server/db/probe";
import { createReadinessHandler } from "./route";

describe("readiness route", () => {
  const cleanup: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.all(cleanup.splice(0).map((dispose) => dispose()));
  });

  it("returns 503 promptly when PostgreSQL accepts but never responds", async () => {
    const sockets = new Set<Socket>();
    const server = createServer((socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
    });

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected a TCP port");
    }

    const client = createDatabaseClient(
      `postgresql://epoha:test@127.0.0.1:${address.port}/epoha`,
      100,
    );
    cleanup.push(async () => {
      await client.$disconnect();
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    const startedAt = performance.now();
    const response = await createReadinessHandler(() =>
      probeDatabase(client),
    )();

    expect(performance.now() - startedAt).toBeLessThan(1_000);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "unavailable" });
  });
});
