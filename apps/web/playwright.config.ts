import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/smoke",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3002",
    trace: "retain-on-failure",
  },
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: 'cmd /c "set HOSTNAME=127.0.0.1&& set PORT=3002&& node .next\\standalone\\apps\\web\\server.js"',
          url: "http://127.0.0.1:3002/api/health/live",
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
