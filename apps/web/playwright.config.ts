import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    launchOptions: {
      // Lets environments with a preinstalled Chromium skip `playwright install`.
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    },
  },
  projects: [
    {
      name: "mobile-360",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 360, height: 780 },
      },
    },
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  // Starts a mock API (fixture posts on :8000, the default API_INTERNAL_URL) and the
  // production server, unless E2E_BASE_URL points at a running stack.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: "node tests/e2e/mock-api.mjs",
          url: "http://localhost:8000/api/v1/health/live",
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
        {
          command: "pnpm start",
          url: `${baseURL}/api/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      ],
});
