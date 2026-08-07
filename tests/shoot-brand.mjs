// Verifies typography 02 (Lato leading --font-sans) and aurora A8 (pointer
// parallax translating the orb's depth groups), then captures the hero.
import { chromium } from "@playwright/test";
const BASE = process.env.BASE_URL ?? "http://localhost:3007";
const OUT = process.argv[2];
const browser = await chromium.launch();
const ctx = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });

await page.goto("/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

const fontStack = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
const depthBefore = await page.evaluate(() => {
  const g = document.querySelector(".aurora-depth");
  return g ? getComputedStyle(g).transform : "missing";
});

// Drive the pointer across the viewport and let the eased loop settle.
await page.mouse.move(1200, 200);
await page.waitForTimeout(900);
const depthAfter = await page.evaluate(() => {
  const gs = [...document.querySelectorAll(".aurora-depth")];
  return gs.map((g) => getComputedStyle(g).transform);
});

await page.screenshot({ path: `${OUT}/brand-hero.png` });
await page.locator("section").first().screenshot({ path: `${OUT}/brand-hero-crop.png` });
await browser.close();

console.log("body font stack :", fontStack);
console.log("depth transform before pointer:", depthBefore);
console.log("depth transforms after pointer :", depthAfter.join(" | "));
console.log("layers moved   :", depthAfter.some((t) => t !== "none" && t !== depthBefore));
console.log(errs.length ? errs.slice(0, 5).join("\n") : "no page errors");
