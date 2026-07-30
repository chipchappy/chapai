// Console verification: performs real actions through the API, then captures each
// mode of the right-hand clinical console. Exists to prove two things that are
// easy to regress and hard to eyeball:
//
//   1. no engine internals (raw state paths, "undefined → true") reach the feed
//   2. every console mode renders with content rather than an empty shell
//
// Usage: BASE_URL=https://127.0.0.1:8788 node shoot-console.mjs <outDir> <slug>
import { chromium } from "@playwright/test";
import {
  signInToClinicalSimulation,
  startClinicalAttempt,
  loadClinicalAttempt,
  performClinicalAction,
} from "./clinical-simulation-test-helpers.ts";

const BASE = process.env.BASE_URL ?? "https://127.0.0.1:8788";
const OUT = process.argv[2] ?? "C:/Users/Chapman/AppData/Local/Temp/claude";
const SLUG = process.argv[3] ?? "diabetic-ketoacidosis";

const browser = await chromium.launch({ ignoreHTTPSErrors: true });
const context = await browser.newContext({ baseURL: BASE, ignoreHTTPSErrors: true, viewport: { width: 1600, height: 950 } });
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));

await signInToClinicalSimulation(page);
const started = await startClinicalAttempt(page, SLUG, 260717);
const attemptId = started.data.id;

// Drive a realistic run: every required action, plus time so events and delayed
// effects fire, plus one deliberately unsafe action so the feed has a red entry.
const loaded = await loadClinicalAttempt(page, attemptId);
const scenario = loaded.data.scenario;
const done = new Set();
for (const requiredId of scenario.completion.requiredActionIds) {
  await performClinicalAction(page, attemptId, scenario, requiredId, done);
}
await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, { data: { operation: "advance", minutes: 12 } });
const unsafe = scenario.actions.find((a) => a.baseClassification === "unsafe" || a.baseClassification === "critical_error");
if (unsafe) await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, { data: { operation: "act", actionId: unsafe.id, selectedElements: [] } });

await page.goto(`/clinical-simulation/${SLUG}/run?attempt=${attemptId}`, { waitUntil: "domcontentloaded" });
await page.getByTestId("sim-event-feed").waitFor({ state: "visible" });
await page.waitForTimeout(1500);

// Scan the rendered console for anything that looks like developer output.
const feedText = await page.getByTestId("sim-event-feed").innerText();
const leaks = [
  /undefined/, /\bnull\b/, /\bflags\./, /\bvitals\./, /\blabs\./, /\bdevices\./,
  /→\s*(true|false)\b/, /\[object Object\]/, /NaN/,
];
const found = leaks.filter((pattern) => pattern.test(feedText)).map(String);

for (const mode of ["Live", "Feedback", "Data", "Tasks", "Score"]) {
  await page.locator(`button[title="${mode}"]`).click();
  await page.waitForTimeout(450);
  await page.getByTestId("sim-event-feed").screenshot({ path: `${OUT}/console-${mode.toLowerCase()}.png` });
}

// Full page with the console on Feedback, which is the densest mode.
await page.locator('button[title="Feedback"]').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/console-full.png`, fullPage: true });

await browser.close();

console.log(`slug=${SLUG} attempt=${attemptId}`);
console.log(`console errors: ${consoleErrors.length}`);
for (const error of consoleErrors.slice(0, 8)) console.log(`  ! ${error}`);
console.log(`developer-output leaks: ${found.length ? found.join(", ") : "none"}`);
if (found.length || consoleErrors.length) process.exitCode = 1;
