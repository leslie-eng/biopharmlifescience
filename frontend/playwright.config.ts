import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests for the staff dashboard (e2e/). They need a running site and API and the
 * accounts named by the E2E_* variables; see e2e/README.md.
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:4173",
    // The installed Chrome, so no browser download is needed. Set E2E_CHANNEL= to use Playwright's Chromium.
    channel: process.env.E2E_CHANNEL ?? "chrome",
    viewport: { width: 1400, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
