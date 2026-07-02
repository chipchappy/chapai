import { test, expect } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// VISUAL REGRESSION — advisory (not in the deploy gate yet; see TESTING.md).
// Reference screenshots live in tests/visual.spec.ts-snapshots/ (committed).
// Regenerate intentionally with: npm run visual:update
// Dynamic stats (live question counts) are masked so content growth ≠ drift.
// ─────────────────────────────────────────────────────────────────────────────

const PAGES: Array<[name: string, path: string]> = [
  ["home", "/"],
  ["quiz-catalog", "/quiz"],
  ["pricing", "/pricing"],
];

for (const [name, path] of PAGES) {
  test(`visual: ${name}`, async ({ page }, testInfo) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await expect(page).toHaveScreenshot(`${name}-${testInfo.project.name}.png`, {
      fullPage: false,
      animations: "disabled",
      mask: [
        page.locator('[class*="stat-value"]'),
        page.locator('[class*="TrustStrip_value"]'),
        page.locator('[class*="signal-pill"]'),
      ],
      maxDiffPixelRatio: 0.02,
    });
  });
}
