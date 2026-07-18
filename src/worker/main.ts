import { disconnectDatabaseClients } from "../server/db/client.ts";
import { probeDatabase } from "../server/db/probe.ts";
import { runWorker } from "./runner.ts";

const controller = new AbortController();
const abort = () => controller.abort();

process.once("SIGINT", abort);
process.once("SIGTERM", abort);

try {
  await runWorker({ probe: probeDatabase, signal: controller.signal });
} catch {
  process.stderr.write("Worker failed to start\n");
  process.exitCode = 1;
} finally {
  process.removeListener("SIGINT", abort);
  process.removeListener("SIGTERM", abort);
  await disconnectDatabaseClients();
}
