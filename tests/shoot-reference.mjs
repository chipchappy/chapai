// Dev utility: screenshot an arbitrary local HTML file so design references can
// be reviewed alongside the app's own visual snapshots.
import { chromium } from "@playwright/test";
import { pathToFileURL } from "node:url";

const [, , target, out, widthArg, heightArg] = process.argv;
if (!target || !out) {
  console.error("usage: node shoot-reference.mjs <html-file> <out.png> [width] [height]");
  process.exit(1);
}

const width = Number(widthArg ?? 1280);
const height = Number(heightArg ?? 900);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(pathToFileURL(target).href, { waitUntil: "load" });
await page.waitForTimeout(1400); // let canvases/animations paint a frame
await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log(`wrote ${out}`);
