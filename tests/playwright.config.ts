import { defineConfig, devices } from "@playwright/test";

// BASE_URL defaults to production — the suite is read-only (no signups, no
// payments, no writes). Point it at staging/preview via env when available.
const BASE_URL = process.env.BASE_URL ?? "https://claritynclex.com";

export default defineConfig({
  testDir: ".",
  timeout: 60_000,
  retries: 1, // network flake tolerance; real regressions fail twice
  reporter: [["line"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } } },
    { name: "mobile-390", use: { ...devices["iPhone 12"], viewport: { width: 390, height: 844 } } },
  ],
});
