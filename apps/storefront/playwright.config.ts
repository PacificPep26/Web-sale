import { defineConfig, devices } from "@playwright/test";

/**
 * Storefront smoke + visual-regression. Assumes the Medusa backend is already
 * running on :9000 and seeded; starts the storefront itself.
 *
 *   npm --workspace @dtc/storefront exec playwright install --with-deps
 *   npm --workspace @dtc/storefront exec playwright test
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { SITE: process.env.SITE ?? "cases" },
  },
});
