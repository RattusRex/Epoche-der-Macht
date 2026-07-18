export async function runWorker(input: {
  probe: () => Promise<void>;
  signal: AbortSignal;
}): Promise<void> {
  await input.probe();

  if (input.signal.aborted) {
    return;
  }

  await new Promise<void>((resolve) => {
    input.signal.addEventListener("abort", () => resolve(), { once: true });
  });
}
