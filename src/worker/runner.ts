export async function runWorker(input: {
  probe: () => Promise<void>;
  signal: AbortSignal;
}): Promise<void> {
  await input.probe();

  if (input.signal.aborted) {
    return;
  }

  await new Promise<void>((resolve) => {
    const keepAlive = setInterval(() => undefined, 60_000);
    input.signal.addEventListener(
      "abort",
      () => {
        clearInterval(keepAlive);
        resolve();
      },
      { once: true },
    );
  });
}
