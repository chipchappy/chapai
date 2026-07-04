// perf-baseline.mjs — Core-Web-Vitals baseline via Playwright (mobile 390px).
// Used because Lighthouse's runner crashes Playwright Chromium in this env.
import { chromium } from "@playwright/test";
const pages = [["home", "/"], ["quiz", "/quiz"], ["pricing", "/pricing"]];
const b = await chromium.launch();
for (const [name, path] of pages) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__vitals = { lcp: 0, cls: 0 };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__vitals.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  });
  const t0 = Date.now();
  const resp = await page.goto("https://claritynclex.com" + path, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(3000);
  const m = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const fcp = performance.getEntriesByName("first-contentful-paint")[0];
    return { ttfb: Math.round(nav.responseStart), fcp: Math.round(fcp?.startTime ?? 0), lcp: Math.round(window.__vitals.lcp), cls: Number(window.__vitals.cls.toFixed(3)), load: Math.round(nav.loadEventEnd) };
  });
  console.log(`${name}: TTFB ${m.ttfb}ms | FCP ${m.fcp}ms | LCP ${m.lcp}ms | CLS ${m.cls} | load ${m.load}ms | http ${resp.status()} | wall ${Date.now() - t0}ms`);
  await ctx.close();
}
await b.close();
