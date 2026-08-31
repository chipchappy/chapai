import { expect, test, type Page } from "@playwright/test";
import {
  clinicalSimulationEmail,
  clinicalSimulationEnabled,
  clinicalSimulationPassword,
  loadClinicalAttempt,
  pauseClinicalAttempt,
  performClinicalAction,
  signInToClinicalSimulation,
  startClinicalAttempt,
} from "./clinical-simulation-test-helpers";

const visualSnapshotOptions = { animations: "disabled" as const, maxDiffPixelRatio: 0.001 };

async function expectSceneScreenshot(page: Page, name: string) {
  const scene = page.getByTestId("patient-scene");
  await scene.evaluate((element) => element.scrollIntoView({ block: "center", inline: "nearest" }));
  await expect(scene).toHaveScreenshot(name, visualSnapshotOptions);
}

async function openFrozenScene(page: Page, scenarioSlug: string, seed: number, prepare?: (attemptId: string) => Promise<void>) {
  const started = await startClinicalAttempt(page, scenarioSlug, seed);
  if (prepare) await prepare(started.data.id);
  await pauseClinicalAttempt(page, started.data.id);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/clinical-simulation/${scenarioSlug}/run?attempt=${started.data.id}`, { waitUntil: "domcontentloaded" });
  const scene = page.getByTestId("patient-scene");
  await expect(scene).toBeVisible();
  await expect(page.getByTestId("simulation-tool-rail")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return started.data.id;
}

test.describe("Reactive patient scene visual regression", () => {
  test.skip(!clinicalSimulationEnabled || !clinicalSimulationEmail || !clinicalSimulationPassword, "Set the local Clinical Simulation E2E environment variables.");

  test.beforeEach(async ({ page }) => {
    await signInToClinicalSimulation(page);
  });

  test("stable ICU patient @desktopOnly", async ({ page }) => {
    await openFrozenScene(page, "septic-shock", 941_101);
    await expectSceneScreenshot(page, "septic-stable.png");
  });

  test("stable ICU patient on tablet @desktopOnly", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await openFrozenScene(page, "septic-shock", 941_107);
    const scene = page.getByTestId("patient-scene");
    await expectSceneScreenshot(page, "septic-tablet.png");
    expect(await scene.evaluate((element) => element.getBoundingClientRect().right <= window.innerWidth + 1)).toBe(true);
  });

  test("septic shock deterioration @desktopOnly", async ({ page }) => {
    await openFrozenScene(page, "septic-shock", 941_102, async (attemptId) => {
      const response = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, { data: { operation: "advance", minutes: 18 } });
      expect(response.status()).toBe(200);
    });
    await expectSceneScreenshot(page, "septic-deterioration.png");
  });

  test("postoperative patient with surgical drain @desktopOnly", async ({ page }) => {
    await openFrozenScene(page, "postoperative-deterioration", 941_103);
    await expectSceneScreenshot(page, "postoperative-drain.png");
  });

  test("respiratory patient after NIV and positioning @desktopOnly", async ({ page }) => {
    await openFrozenScene(page, "acute-respiratory-deterioration", 941_104, async (attemptId) => {
      const loaded = await loadClinicalAttempt(page, attemptId);
      const completed = new Set<string>();
      await performClinicalAction(page, attemptId, loaded.data.scenario, "position-upright", completed);
      await performClinicalAction(page, attemptId, loaded.data.scenario, "start-niv", completed);
    });
    await expectSceneScreenshot(page, "respiratory-niv.png");
  });

  test("untreated respiratory fatigue @desktopOnly", async ({ page }) => {
    await openFrozenScene(page, "acute-respiratory-deterioration", 941_108, async (attemptId) => {
      const response = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, { data: { operation: "advance", minutes: 7 } });
      expect(response.status()).toBe(200);
    });
    await expectSceneScreenshot(page, "respiratory-fatigue.png");
  });

  test("telemetry patient with evolving chest pain @desktopOnly", async ({ page }) => {
    await openFrozenScene(page, "evolving-acute-coronary-syndrome", 941_109);
    await expectSceneScreenshot(page, "telemetry-chest-pain.png");
  });

  test("procedural sedation compromise @desktopOnly", async ({ page }) => {
    await openFrozenScene(page, "sedation-airway-compromise", 941_110, async (attemptId) => {
      const response = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, { data: { operation: "advance", minutes: 4 } });
      expect(response.status()).toBe(200);
    });
    await expectSceneScreenshot(page, "procedural-sedation.png");
  });

  test("protected ventilated ICU visual matrix @desktopOnly", async ({ page }) => {
    await openFrozenScene(page, "septic-shock", 941_111);
    await page.getByLabel("Simulation options").click();
    await page.getByRole("button", { name: "Simulation inspector" }).click();
    const controls = page.locator('section[aria-label="Protected patient scene controls"]');
    await controls.locator('select:has(option[value="ebony"])').selectOption("ebony");
    await controls.locator('select:has(option[value="unresponsive"])').selectOption("unresponsive");
    await controls.locator('select:has(option[value="exhaustion"])').selectOption("none");
    await controls.locator('select:has(option[value="mechanical-ventilation"])').selectOption("mechanical-ventilation");
    await controls.locator('input[type="number"]').fill("16");
    await controls.getByLabel("Ventilator", { exact: true }).check();
    await page.getByRole("button", { name: "Close Simulation inspector and return to the room" }).click();
    await expectSceneScreenshot(page, "ventilated-unresponsive-ebony.png");
  });

  test("behavioral-health room @desktopOnly", async ({ page }) => {
    await openFrozenScene(page, "agitation-and-suicide-risk", 941_105);
    await expectSceneScreenshot(page, "psychiatric-room.png");
  });

  test("simplified mobile bedside @mobileOnly", async ({ page }) => {
    await openFrozenScene(page, "septic-shock", 941_106);
    await expectSceneScreenshot(page, "septic-mobile.png");
  });
});
