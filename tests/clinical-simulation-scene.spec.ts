import { expect, test } from "@playwright/test";
import {
  clinicalSimulationEmail,
  clinicalSimulationEnabled,
  clinicalSimulationPassword,
  loadClinicalAttempt,
  performClinicalAction,
  signInToClinicalSimulation,
  startClinicalAttempt,
} from "./clinical-simulation-test-helpers";

test.describe("Reactive patient scene", () => {
  test.skip(!clinicalSimulationEnabled || !clinicalSimulationEmail || !clinicalSimulationPassword, "Set the local Clinical Simulation E2E environment variables.");

  test.beforeEach(async ({ page }) => {
    await signInToClinicalSimulation(page);
  });

  test("renders a deterministic engine-backed bedside scene @desktopOnly", async ({ page }) => {
    const started = await startClinicalAttempt(page, "septic-shock", 931_021);
    const attemptId = started.data.id;
    await page.goto(`/clinical-simulation/septic-shock/run?attempt=${attemptId}`, { waitUntil: "domcontentloaded" });

    const scene = page.getByTestId("patient-scene");
    await expect(scene).toBeVisible();
    await expect(scene).toHaveAttribute("data-source", "engine");
    await expect(scene).toHaveAttribute("data-room", "intensive-care");
    await expect(page.getByTestId("patient-scene-svg")).toBeVisible();
    expect(await page.getByTestId("patient-scene-svg").locator("path").count()).toBeGreaterThan(25);

    const patient = scene.locator("[data-skin-tone]");
    const profile = {
      skin: await patient.getAttribute("data-skin-tone"),
      body: await patient.getAttribute("data-body-variant"),
      position: await patient.getAttribute("data-position"),
    };
    expect(profile.skin).toBeTruthy();
    expect(profile.body).toBeTruthy();

    const connectionPaths = await page.getByTestId("scene-connections").locator("path").evaluateAll((paths) => paths.map((path) => path.getAttribute("d")));
    expect(connectionPaths.length).toBeGreaterThan(0);
    expect(connectionPaths.every((path) => path && !path.includes("NaN"))).toBe(true);

    await page.reload({ waitUntil: "domcontentloaded" });
    const restoredPatient = page.getByTestId("patient-scene").locator("[data-skin-tone]");
    await expect(restoredPatient).toHaveAttribute("data-skin-tone", profile.skin!);
    await expect(restoredPatient).toHaveAttribute("data-body-variant", profile.body!);
    await expect(restoredPatient).toHaveAttribute("data-position", profile.position!);
  });

  test("keeps pupil detail hidden until the neurologic assessment @desktopOnly", async ({ page }) => {
    const started = await startClinicalAttempt(page, "septic-shock", 931_022);
    const attemptId = started.data.id;
    const loaded = await loadClinicalAttempt(page, attemptId);
    await page.goto(`/clinical-simulation/septic-shock/run?attempt=${attemptId}`, { waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Inspect pupils", exact: true }).click();
    const focus = page.getByTestId("patient-focus-panel");
    await expect(focus).toHaveAttribute("data-focus", "pupils");
    await expect(focus).toHaveAttribute("data-revealed", "false");
    await expect(focus).toContainText("remain hidden");
    await expect(focus).not.toContainText("sluggishly reactive");

    await performClinicalAction(page, attemptId, loaded.data.scenario, "assess-neuro");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Inspect pupils", exact: true }).click();
    await expect(page.getByTestId("patient-focus-panel")).toHaveAttribute("data-revealed", "true");
    await expect(page.getByTestId("patient-focus-panel")).toContainText("reactive");
  });

  test("updates oxygen, position, bed geometry, and tubing from real interventions @desktopOnly", async ({ page }) => {
    const started = await startClinicalAttempt(page, "acute-respiratory-deterioration", 931_023);
    const attemptId = started.data.id;
    const loaded = await loadClinicalAttempt(page, attemptId);
    const completed = new Set<string>();

    await performClinicalAction(page, attemptId, loaded.data.scenario, "position-upright", completed);
    await performClinicalAction(page, attemptId, loaded.data.scenario, "titrate-oxygen", completed);
    await page.goto(`/clinical-simulation/acute-respiratory-deterioration/run?attempt=${attemptId}`, { waitUntil: "domcontentloaded" });

    const scene = page.getByTestId("patient-scene");
    await expect(scene).toHaveAttribute("data-position", "high-fowler");
    await expect(scene).toHaveAttribute("data-oxygen", "venturi-mask");
    await expect(scene.locator("[data-head-of-bed='75']")).toHaveCount(1);
    await expect(scene.locator("[data-device='venturi-mask']")).toHaveCount(1);

    await performClinicalAction(page, attemptId, loaded.data.scenario, "start-niv", completed);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("patient-scene")).toHaveAttribute("data-oxygen", "bipap");
    await expect(page.getByTestId("patient-scene").locator("[data-device='bipap']")).toHaveCount(1);
    const paths = await page.getByTestId("scene-connections").locator("path").evaluateAll((items) => items.map((item) => item.getAttribute("d")));
    expect(paths.every((path) => path && !path.includes("NaN"))).toBe(true);
  });

  test("renders coherent multi-system deterioration @desktopOnly", async ({ page }) => {
    const started = await startClinicalAttempt(page, "septic-shock", 931_024);
    const attemptId = started.data.id;
    const advance = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, {
      data: { operation: "advance", minutes: 18 },
    });
    expect(advance.status()).toBe(200);
    await page.goto(`/clinical-simulation/septic-shock/run?attempt=${attemptId}`, { waitUntil: "domcontentloaded" });

    const scene = page.getByTestId("patient-scene");
    await expect(scene).toHaveAttribute("data-loc", "obtunded");
    await expect(page.getByTestId("patient-scene-viewport")).toHaveAttribute("data-lighting", "emergency");
    await expect(scene.locator("[data-skin-overlay='mottling']")).toHaveCount(1);
    await expect(scene.locator("[data-device='defibrillator-monitor']")).toHaveCount(1);
    await expect(scene.getByRole("img")).toHaveAccessibleName(/obtunded/i);
  });

  test("keeps preview overrides protected and preserves reduced clinical breathing @desktopOnly", async ({ page }) => {
    const started = await startClinicalAttempt(page, "septic-shock", 931_025);
    const attemptId = started.data.id;
    await page.goto(`/clinical-simulation/septic-shock/run?attempt=${attemptId}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Test panel/ }).click();
    await expect(page.getByRole("heading", { name: "Simulation inspector" })).toBeVisible();

    await page.getByLabel("Defibrillation pads").selectOption("anterior-lateral");
    await page.locator("select").filter({ has: page.locator('option[value="chest-tube"]') }).selectOption("chest-tube");
    await page.getByLabel("Ventilator").check();
    await page.getByLabel("Reduced motion").check();

    const scene = page.getByTestId("patient-scene");
    await expect(scene).toHaveAttribute("data-source", "developer-preview");
    await expect(scene).toHaveAttribute("data-oxygen", "mechanical-ventilation");
    await expect(scene.locator("[data-device='ventilator']")).toHaveCount(1);
    await expect(scene.locator("[data-device='mechanical-ventilation']")).toHaveCount(1);
    await expect(scene.locator("[data-device='defibrillation-pads']")).toHaveCount(1);
    await expect(scene.locator("[data-device='chest-tube']")).toHaveCount(1);
    await expect(page.getByTestId("patient-scene-viewport")).toHaveAttribute("data-reduced-motion", "true");

    const breathingAnimation = await scene.locator("[class*='chestMotion']").evaluate((element) => ({
      name: getComputedStyle(element).animationName,
      state: getComputedStyle(element).animationPlayState,
    }));
    expect(breathingAnimation.name).not.toBe("none");
    expect(breathingAnimation.state).toBe("running");

    await expect.poll(async () => page.getByText(/fps \/ [\d.]+ ms/).count(), { timeout: 6_000 }).toBeGreaterThan(0);
  });

  test("keeps the simplified mobile scene and focused panel within the viewport @mobileOnly", async ({ page }) => {
    const started = await startClinicalAttempt(page, "septic-shock", 931_026);
    await page.goto(`/clinical-simulation/septic-shock/run?attempt=${started.data.id}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("patient-scene")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

    const sceneBounds = await page.getByTestId("patient-scene").boundingBox();
    expect(sceneBounds?.width).toBeLessThanOrEqual(390);
    await page.getByRole("button", { name: "Focused assessment view", exact: true }).click();
    const focusBounds = await page.getByTestId("patient-focus-panel").boundingBox();
    expect(focusBounds?.x).toBeGreaterThanOrEqual(0);
    expect((focusBounds?.x ?? 0) + (focusBounds?.width ?? 0)).toBeLessThanOrEqual(390);
    await expect(page.getByRole("button", { name: "Open assessment actions", exact: true })).toBeVisible();
  });
});
