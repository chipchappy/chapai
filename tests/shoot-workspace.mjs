// Full-workspace screenshot: signs in, starts a septic-shock attempt, advances it
// so the patient is mid-deterioration, and captures the entire run page (not just
// the patient-scene testid the visual suite crops to). Lets the whole dashboard
// layout be reviewed the way a user sees it.
import { chromium } from "@playwright/test";
import {
  signInToClinicalSimulation,
  startClinicalAttempt,
} from "./clinical-simulation-test-helpers.ts";

const BASE = process.env.BASE_URL ?? "https://127.0.0.1:8788";
const OUT = process.argv[2] ?? "C:/Users/Chapman/AppData/Local/Temp/claude/workspace.png";
const SLUG = process.argv[4] ?? "septic-shock";
const WIDTH = Number(process.argv[3] ?? 1440);

const browser = await chromium.launch({ ignoreHTTPSErrors: true });
const context = await browser.newContext({ baseURL: BASE, ignoreHTTPSErrors: true, viewport: { width: WIDTH, height: 950 } });
const page = await context.newPage();

await signInToClinicalSimulation(page);
const started = await startClinicalAttempt(page, SLUG, 260717);
await page.goto(`/clinical-simulation/${SLUG}/run?attempt=${started.data.id}`, { waitUntil: "domcontentloaded" });
await page.getByTestId("patient-scene").waitFor({ state: "visible" });
await page.waitForTimeout(1600);
await page.screenshot({ path: OUT, fullPage: true });
await browser.close();
console.log(`wrote ${OUT}`);
