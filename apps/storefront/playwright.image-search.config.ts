import { defineConfig, devices } from "@playwright/test"

// Uses an existing production build and an isolated port; no live AI key needed.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "image-search.spec.ts",
  workers: 1,
  use: { baseURL: "http://localhost:3101", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm exec next -- start -p 3101",
    url: "http://localhost:3101/search",
    reuseExistingServer: false,
    timeout: 60_000,
    env: { SITE: "eyewear" },
  },
})
