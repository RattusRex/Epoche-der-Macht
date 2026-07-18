export async function getReadiness(probe: () => Promise<void>) {
  try {
    await probe();
    return { status: "ready" as const };
  } catch {
    return { status: "unavailable" as const };
  }
}
