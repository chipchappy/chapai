// Captures the instructor dashboard for the seeded local cohort. The seed
// deliberately reproduces the production defect condition (more correct answers
// recorded than the session's planned deck size) so the screenshot proves the
// accuracy figure is derived from answers, not from the session counters.
import { chromium } from "@playwright/test";
import { signInToClinicalSimulation } from "./clinical-simulation-test-helpers.ts";
const BASE = process.env.BASE_URL ?? "https://127.0.0.1:8788";
const OUT = process.argv[2] ?? "C:/Users/Chapman/AppData/Local/Temp/claude";
const browser = await chromium.launch({ ignoreHTTPSErrors: true });
const ctx = await browser.newContext({ baseURL: BASE, ignoreHTTPSErrors: true, viewport: { width: 1400, height: 1100 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });

await signInToClinicalSimulation(page);
await page.goto("/instructor", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/instructor-fixed.png`, fullPage: true });

// Assert no percentage anywhere on the page exceeds 100.
const overs = await page.evaluate(() => {
  const out = [];
  for (const m of document.body.innerText.matchAll(/(\d+)%/g)) {
    if (Number(m[1]) > 100) out.push(m[0]);
  }
  return out;
});
await browser.close();
console.log("percentages over 100%:", overs.length ? overs.join(", ") : "none");
console.log(errors.length ? errors.slice(0, 5).join("\n") : "no page errors");
if (overs.length) process.exitCode = 1;
