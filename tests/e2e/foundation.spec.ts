import { expect, test } from "@playwright/test";

test("foundation serves the shell and health", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Epoha" })).toBeVisible();

  const live = await request.get("/api/health/live");
  expect(live.status()).toBe(200);
  await expect(live.json()).resolves.toEqual({
    status: "ok",
    service: "epoha-web",
  });

  expect((await request.get("/api/health/ready")).status()).toBe(200);
});
