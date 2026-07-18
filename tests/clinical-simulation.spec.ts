import { expect, test, type Page } from "@playwright/test";

const enabled = process.env.CLINICAL_SIMULATION_E2E_ENABLED === "true";
const baseUrl = process.env.BASE_URL ?? "https://claritynclex.com";
const localTarget = /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/.test(baseUrl);
const testEmail = process.env.CLINICAL_SIMULATION_E2E_EMAIL ?? (localTarget ? "clinical.sim.test@clarity.local" : undefined);
const testPassword = process.env.CLINICAL_SIMULATION_E2E_PASSWORD ?? (localTarget ? "ClinicalSimLocal2026!" : undefined);
const isolationEmail = "clinical.sim.isolation@clarity.local";
const isolationPassword = "ClinicalSimIsolation2026!";

type Scenario = {
  completion: { requiredActionIds: string[] };
  actions: Array<{
    id: string;
    prerequisites: string[];
    safetyChecks: string[];
    communication?: { requiredElementIds: string[] };
    documentation?: { requiredFieldIds: string[] };
  }>;
};

async function signIn(page: Page, email = testEmail, password = testPassword) {
  if (!email || !password) throw new Error("Clinical Simulation E2E credentials are required.");
  const response = await page.request.post("/api/auth/password-login", {
    data: {
      email,
      password,
      acceptedTerms: true,
      acceptedPrivacy: true,
      nextPath: "/clinical-simulation",
    },
  });
  expect(response.status()).toBe(200);
  expect((await response.json()).success).toBe(true);

  // Production sessions remain Secure. This is only a compatibility fallback
  // when a developer explicitly points the suite at a local HTTP worker.
  const session = /(?:^|,\s*)chapai_session=([^;]+)/.exec(response.headers()["set-cookie"] ?? "")?.[1];
  if (baseUrl.startsWith("http://") && session) {
    await page.context().addCookies([{
      name: "chapai_session",
      value: session,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
    }]);
  }
}

async function startAttempt(page: Page, scenarioSlug: string, seed: number) {
  const response = await page.request.post("/api/clinical-simulation/attempts", {
    data: { scenarioSlug, mode: "independent", seed },
  });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{ data: { id: string; seed: number } }>;
}

async function loadAttempt(page: Page, attemptId: string) {
  const response = await page.request.get(`/api/clinical-simulation/attempts/${attemptId}`);
  expect(response.status()).toBe(200);
  return response.json() as Promise<{ data: { scenario: Scenario; attempt: { state: Record<string, unknown> } } }>;
}

async function performAction(page: Page, attemptId: string, scenario: Scenario, actionId: string, completed = new Set<string>()) {
  if (completed.has(actionId)) return;
  const action = scenario.actions.find((candidate) => candidate.id === actionId);
  expect(action, actionId).toBeTruthy();
  for (const dependency of [...action!.prerequisites, ...action!.safetyChecks]) {
    await performAction(page, attemptId, scenario, dependency, completed);
  }
  const selectedElements = action!.communication?.requiredElementIds ?? action!.documentation?.requiredFieldIds ?? [];
  const response = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, {
    data: { operation: "act", actionId, selectedElements },
  });
  expect(response.status()).toBe(200);
  const result = await response.json();
  if (result.data.state.completedActionIds.includes(actionId)) completed.add(actionId);
}

function collectObjectKeys(value: unknown, keys = new Set<string>()) {
  if (!value || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectObjectKeys(item, keys);
    return keys;
  }
  for (const [key, child] of Object.entries(value)) {
    keys.add(key.toLowerCase());
    collectObjectKeys(child, keys);
  }
  return keys;
}

test.describe("Clinical Simulation disabled isolation", () => {
  test.skip(enabled, "The target explicitly enables the simulator.");

  test("route, API, and navigation remain hidden", async ({ page, request }) => {
    expect((await request.get("/api/clinical-simulation/scenarios")).status()).toBe(404);
    expect((await request.get("/clinical-simulation")).status()).toBe(404);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Clinical Simulation" })).toHaveCount(0);
  });
});

test.describe("Clinical Simulation page data boundary", () => {
  test.skip(!enabled, "The target must enable the simulator to exercise its anonymous page guard.");

  test("anonymous page responses do not serialize protected scenario data @desktopOnly", async ({ request }) => {
    const protectedPaths = [
      "/clinical-simulation",
      "/clinical-simulation/septic-shock",
      "/clinical-simulation/septic-shock/run?attempt=missing",
    ];
    for (const path of protectedPaths) {
      const response = await request.get(path);
      const body = await response.text();
      expect(body, path).not.toContain("Postoperative Deterioration");
      expect(body, path).not.toContain("GCS is 13");
      expect(body, path).not.toContain("clinicalScenarios");
    }
  });
});

test.describe("Clinical Simulation enabled vertical slice", () => {
  test.skip(!enabled || !testEmail || !testPassword, "Set the local Clinical Simulation E2E environment variables.");

  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("catalog renders all technical-testing scenarios on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/clinical-simulation", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Clinical Simulation", level: 1 })).toBeVisible();
    await expect(page.locator("article")).toHaveCount(6);
    await expect(page.getByRole("combobox", { name: "Unit" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Clinical Simulation" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });

  test("completes the septic-shock success path and renders an action-derived debrief", async ({ page }) => {
    const started = await startAttempt(page, "septic-shock", 260_717);
    const attemptId = started.data.id;
    const loaded = await loadAttempt(page, attemptId);
    const completed = new Set<string>();
    for (const actionId of loaded.data.scenario.completion.requiredActionIds) {
      await performAction(page, attemptId, loaded.data.scenario, actionId, completed);
    }
    const advance = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, {
      data: { operation: "advance", minutes: 5 },
    });
    expect(advance.status()).toBe(200);

    const complete = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, {
      data: { operation: "complete" },
    });
    expect(complete.status()).toBe(200);
    const result = await complete.json();
    expect(result.data.debrief.outcome).toBe("stabilized");
    expect(result.data.debrief.missedRequiredActions).toEqual([]);
    expect(result.data.debrief.finalPatientState.map).toBeGreaterThanOrEqual(65);
    expect(result.data.debrief.finalPatientState.urineOutputMlHr).toBeGreaterThanOrEqual(20);
    expect(result.data.debrief.outcomeExplanation).toContain("final physiology improved");

    await page.goto(`/clinical-simulation/septic-shock/run?attempt=${attemptId}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Patient stabilized", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Replay", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });

  test("operates protected developer controls through the rendered panel", async ({ page }) => {
    const started = await startAttempt(page, "septic-shock", 620_008);
    const attemptId = started.data.id;
    await page.goto(`/clinical-simulation/septic-shock/run?attempt=${attemptId}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Test panel/ }).click();
    await expect(page.getByRole("heading", { name: "Simulation inspector" })).toBeVisible();
    await expect(page.getByText("passed", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await expect(page.getByRole("button", { name: "Resume", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "+1 minute", exact: true }).click();
    await expect.poll(async () => {
      const latest = await loadAttempt(page, attemptId);
      return (latest.data.attempt.state as { virtualMinute: number }).virtualMinute;
    }).toBe(1);
    const afterAdvance = await loadAttempt(page, attemptId);
    expect((afterAdvance.data.attempt.state as { virtualMinute: number; clockPaused: boolean }).clockPaused).toBe(true);

    await page.getByLabel("Trigger scenario event").selectOption("recognition-delay");
    await page.getByRole("button", { name: "Trigger", exact: true }).click();
    await expect.poll(async () => {
      const latest = await loadAttempt(page, attemptId);
      return (latest.data.attempt.state as { processedEventIds: string[] }).processedEventIds;
    }).toContain("recognition-delay");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export trace", exact: true }).click();
    expect((await downloadPromise).suggestedFilename()).toContain(attemptId);

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Restart same seed", exact: true }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get("attempt")).not.toBe(attemptId);
    const replayAttemptId = new URL(page.url()).searchParams.get("attempt");
    expect(replayAttemptId).toBeTruthy();
    const replay = await loadAttempt(page, replayAttemptId!);
    expect((replay.data.attempt.state as { seed: number }).seed).toBe(620_008);
    const original = await loadAttempt(page, attemptId);
    expect((original.data.attempt.state as { status: string }).status).toBe("abandoned");
  });

  test("persists pause and resume, resets safely, exports a sanitized trace, and replays by seed", async ({ page, browser }) => {
    const seed = 445_501;
    const started = await startAttempt(page, "septic-shock", seed);
    const attemptId = started.data.id;
    const loaded = await loadAttempt(page, attemptId);
    await performAction(page, attemptId, loaded.data.scenario, "assess-hemodynamics");
    const pause = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, {
      data: { operation: "set_paused", paused: true },
    });
    expect((await pause.json()).data.state.clockPaused).toBe(true);

    await page.goto(`/clinical-simulation/septic-shock/run?attempt=${attemptId}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("1 actions recorded", { exact: false })).toBeVisible();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText("1 actions recorded", { exact: false })).toBeVisible();

    const traceResponse = await page.request.get(`/api/clinical-simulation/attempts/${attemptId}/trace`);
    expect(traceResponse.status()).toBe(200);
    expect(traceResponse.headers()["content-disposition"]).toContain(attemptId);
    const trace = await traceResponse.json();
    expect(trace.attempt.seed).toBe(seed);
    expect(trace.studentActions).toHaveLength(1);
    const keys = collectObjectKeys(trace);
    for (const forbidden of ["userid", "user_id", "email", "password", "token", "cookie", "secret"]) {
      expect(keys.has(forbidden), `trace must not contain ${forbidden}`).toBe(false);
    }

    const reset = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, {
      data: { operation: "reset" },
    });
    expect(reset.status()).toBe(200);
    const resetResult = await reset.json();
    expect(resetResult.data.state.seed).toBe(seed);
    expect(resetResult.data.state.actionLog).toEqual([]);
    expect(resetResult.data.state.virtualMinute).toBe(0);

    const sameSeedReplay = await startAttempt(page, "septic-shock", seed);
    const newSeedReplay = await startAttempt(page, "septic-shock", seed + 1);
    expect(sameSeedReplay.data.id).not.toBe(attemptId);
    expect(sameSeedReplay.data.seed).toBe(seed);
    expect(newSeedReplay.data.seed).toBe(seed + 1);

    const secondContext = await browser.newContext({ baseURL: baseUrl, ignoreHTTPSErrors: localTarget });
    const secondPage = await secondContext.newPage();
    await signIn(secondPage, isolationEmail, isolationPassword);
    expect((await secondPage.request.get(`/api/clinical-simulation/attempts/${attemptId}`)).status()).toBe(404);
    await secondContext.close();

    const abandon = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, {
      data: { operation: "abandon" },
    });
    expect(abandon.status()).toBe(200);
    expect((await abandon.json()).data.state.status).toBe("abandoned");
  });

  test("records unsafe care, delayed recognition, failed reassessment, and failed escalation", async ({ page }) => {
    const started = await startAttempt(page, "septic-shock", 8128);
    const attemptId = started.data.id;
    const unsafe = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, {
      data: { operation: "act", actionId: "repeat-blind-fluid", selectedElements: [] },
    });
    const unsafeResult = await unsafe.json();
    expect(unsafeResult.data.entry.classification).toBe("unsafe");
    expect(unsafeResult.data.state.activeComplications).toContain("fluid-associated pulmonary edema");

    const delay = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, {
      data: { operation: "advance", minutes: 18 },
    });
    const delayed = await delay.json();
    expect(delayed.data.state.processedEventIds).toEqual(expect.arrayContaining([
      "recognition-delay",
      "shock-worsens",
      "antibiotic-delay",
      "escalation-delay",
      "critical-deterioration",
    ]));
    expect(delayed.data.state.flags.teamResponseDelayed).toBe(true);
    expect(delayed.data.state.flags.criticalDeterioration).toBe(true);

    const complete = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, {
      data: { operation: "complete" },
    });
    const result = await complete.json();
    expect(result.data.debrief.outcome).toBe("deteriorated");
    expect(result.data.debrief.triggeredFailureCondition.id).toBe("critical-shock");
    expect(result.data.debrief.unsafeActionIds).toHaveLength(1);
  });

  test("preserves the existing NCLEX route while the additive feature is enabled", async ({ page }) => {
    const response = await page.goto("/quiz", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });
});
