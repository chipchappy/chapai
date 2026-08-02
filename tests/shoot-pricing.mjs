// Pricing-surface screenshots: the featured bundle band in light, dark, and at
// 390px, plus a full-page shot and a horizontal-overflow assertion. Pricing is a
// recurring edit target and it renders on two routes from one component, so this
// checks both themes and the mobile invariant in a single pass.
//
// Usage: BASE_URL=http://localhost:3007 node shoot-pricing.mjs <outDir>
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3007";
const OUT = process.argv[2] ?? "C:/Users/Chapman/AppData/Local/Temp/claude";
const BAND = 'article[data-tone="periwinkle"]';

const browser = await chromium.launch({ ignoreHTTPSErrors: true });
const problems = [];

async function open(viewport, colorScheme) {
  const ctx = await browser.newContext({ baseURL: BASE, ignoreHTTPSErrors: true, viewport, colorScheme, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") problems.push(`console: ${m.text()}`); });
  return { ctx, page };
}

for (const theme of ["light", "dark"]) {
  const { ctx, page } = await open({ width: 1440, height: 1000 }, theme);
  await page.goto("/pricing", { waitUntil: "domcontentloaded" });
  await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
  await page.waitForTimeout(600);
  await page.locator(BAND).waitFor({ state: "visible", timeout: 20000 });
  await page.locator(BAND).screenshot({ path: `${OUT}/pricing-band-${theme}.png` });
  if (theme === "light") {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator(BAND).waitFor({ state: "visible", timeout: 20000 });
    await page.locator(BAND).scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/frontpage-pricing.png` });
  }
  await ctx.close();
}

// 390px is a hard requirement — most traffic is phones.
const { ctx, page } = await open({ width: 390, height: 900 }, "light");
await page.goto("/pricing", { waitUntil: "domcontentloaded" });
await page.locator(BAND).waitFor({ state: "visible", timeout: 20000 });
await page.locator(BAND).scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.locator(BAND).screenshot({ path: `${OUT}/pricing-band-390.png` });
const { scrollW, clientW } = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
}));
if (scrollW > clientW + 1) problems.push(`horizontal overflow at 390px: ${scrollW} > ${clientW}`);
await ctx.close();
await browser.close();

console.log(problems.length ? problems.slice(0, 8).join("\n") : "clean — no page errors, no overflow");
if (problems.length) process.exitCode = 1;
