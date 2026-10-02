import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// End-to-end smoke tests for the core journeys, at desktop and phone width.
// They run against a production build and mock all data requests (see e2e/mocks.ts),
// so they need no live database, cost no AI credits and never touch real data.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Two browsers at a time: more starves the single local production server (and WSL)
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 740 } } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
