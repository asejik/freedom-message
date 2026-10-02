import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests for pure logic only (no browser, no network). End-to-end tests live in e2e/ (Playwright).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
