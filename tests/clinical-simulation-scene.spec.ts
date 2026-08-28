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
    await expect(scene.locator("img[class*='photoBase']")).toBeVisible();
    await expect(scene.locator("canvas")).toHaveCount(1);
    await scene.getByRole("button", { name: "Expand bedside monitor" }).click();
    await expect(scene.getByRole("dialog", { name: "Bedside monitor" }).locator("canvas").first()).toBeVisible();
    await scene.getByRole("button", { name: "Close monitor" }).click();
    await expect(scene.getByRole("button", { name: "Chart (EHR)" })).toBeVisible();
    await expect(scene.getByRole("button", { name: /IV pumps/ })).toBeVisible();

    const profile = {
      image: await scene.locator("img[class*='photoBase']").getAttribute("src"),
      stage: await page.getByTestId("patient-scene-viewport").getAttribute("data-presentation-stage"),
      position: await scene.getAttribute("data-position"),
    };
    expect(profile.image).toBeTruthy();
    expect(profile.stage).toBeTruthy();

    await page.reload({ waitUntil: "domcontentloaded" });
    const restored = page.getByTestId("patient-scene");
    await expect(restored.locator("img[class*='photoBase']")).toHaveAttribute("src", profile.image!);
    await expect(page.getByTestId("patient-scene-viewport")).toHaveAttribute("data-presentation-stage", profile.stage!);
    await expect(restored).toHaveAttribute("data-position", profile.position!);
  });

  test("keeps neurologic detail behind a focused assessment action @desktopOnly", async ({ page }) => {
    const started = await startClinicalAttempt(page, "septic-shock", 931_022);
    const attemptId = started.data.id;
    const loaded = await loadClinicalAttempt(page, attemptId);
    await page.goto(`/clinical-simulation/septic-shock/run?attempt=${attemptId}`, { waitUntil: "domcontentloaded" });

    const description = page.getByTestId("patient-scene").locator("p[class*='srOnly']");
    await expect(description).not.toContainText("sluggishly reactive");
    await page.getByRole("button", { name: "Head & neuro", exact: true }).click();
    await expect(page.getByTestId("patient-focus-panel")).toHaveAttribute("data-focus", "face");

    await performClinicalAction(page, attemptId, loaded.data.scenario, "assess-neuro");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Head & neuro", exact: true }).click();
    await expect(page.getByTestId("patient-focus-panel").getByRole("button", { name: /Assess neurologic status and GCS/ })).toHaveAttribute("data-completed", "true");
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

    await performClinicalAction(page, attemptId, loaded.data.scenario, "start-niv", completed);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("patient-scene")).toHaveAttribute("data-oxygen", "bipap");
    await expect(page.getByTestId("patient-scene").locator("p[class*='srOnly']")).toContainText(/bipap|bilevel/i);
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
    await expect(scene.getByRole("img")).toHaveAccessibleName(/obtunded/i);
  });

  test("keeps preview overrides protected and honors reduced motion @desktopOnly", async ({ page }) => {
    const started = await startClinicalAttempt(page, "septic-shock", 931_025);
    const attemptId = started.data.id;
    await page.goto(`/clinical-simulation/septic-shock/run?attempt=${attemptId}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Test panel/ }).click();
    await expect(page.getByRole("heading", { name: "Simulation inspector" })).toBeVisible();

    await page.getByLabel("Defibrillation pads").selectOption("anterior-lateral");
    await page.locator("select").filter({ has: page.locator('option[value="chest-tube"]') }).selectOption("chest-tube");
    await page.getByRole("checkbox", { name: "Ventilator" }).check();
    await page.getByRole("checkbox", { name: "Reduced motion" }).check();

    const scene = page.getByTestId("patient-scene");
    await expect(scene).toHaveAttribute("data-source", "developer-preview");
    await expect(scene).toHaveAttribute("data-oxygen", "mechanical-ventilation");
    await expect(page.getByTestId("patient-scene-viewport")).toHaveAttribute("data-reduced-motion", "true");

    const breathingAnimation = await scene.locator("[class*='photoBreath']").evaluate((element) => ({
      name: getComputedStyle(element).animationName,
      state: getComputedStyle(element).animationPlayState,
    }));
    expect(breathingAnimation.name).toBe("none");

  });

  test("keeps the simplified mobile scene and focused panel within the viewport @mobileOnly", async ({ page }) => {
    const started = await startClinicalAttempt(page, "septic-shock", 931_026);
    await page.goto(`/clinical-simulation/septic-shock/run?attempt=${started.data.id}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("patient-scene")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

    const sceneBounds = await page.getByTestId("patient-scene").boundingBox();
    expect(sceneBounds?.width).toBeLessThanOrEqual(390);
    await page.getByRole("button", { name: "Head & neuro", exact: true }).click();
    const focusBounds = await page.getByTestId("patient-focus-panel").boundingBox();
    expect(focusBounds?.x).toBeGreaterThanOrEqual(0);
    expect((focusBounds?.x ?? 0) + (focusBounds?.width ?? 0)).toBeLessThanOrEqual(390);
    await expect(page.getByTestId("patient-focus-panel").getByRole("button").first()).toBeVisible();
  });
});
