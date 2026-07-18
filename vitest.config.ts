import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["**/*.integration.test.ts", "tests/e2e/**", "node_modules/**"],
  },
});
