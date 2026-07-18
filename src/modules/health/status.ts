export type Liveness = Readonly<{ status: "ok"; service: "epoha-web" }>;

export function getLiveness(): Liveness {
  return { status: "ok", service: "epoha-web" };
}
