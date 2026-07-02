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
    {
      name: "desktop",
      grepInvert: /@mobileOnly/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } },
    },
    {
      // Chromium-based mobile emulation (WebKit is not installed in this env;
      // iPhone presets default to WebKit and would fail to launch).
      name: "mobile-390",
      grepInvert: /@desktopOnly/,
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    },
  ],
});
