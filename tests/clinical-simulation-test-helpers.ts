import { expect, type Page } from "@playwright/test";

export const clinicalSimulationEnabled = process.env.CLINICAL_SIMULATION_E2E_ENABLED === "true";
export const clinicalSimulationBaseUrl = process.env.BASE_URL ?? "https://claritynclex.com";
const localTarget = /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?(?:\/|$)/.test(clinicalSimulationBaseUrl);
export const clinicalSimulationEmail = process.env.CLINICAL_SIMULATION_E2E_EMAIL ?? (localTarget ? "clinical.sim.test@clarity.local" : undefined);
export const clinicalSimulationPassword = process.env.CLINICAL_SIMULATION_E2E_PASSWORD ?? (localTarget ? "ClinicalSimLocal2026!" : undefined);

export type TestScenario = {
  completion: { requiredActionIds: string[] };
  actions: Array<{
    id: string;
    prerequisites: string[];
    safetyChecks: string[];
    communication?: { requiredElementIds: string[] };
    documentation?: { requiredFieldIds: string[] };
  }>;
};

export async function signInToClinicalSimulation(page: Page) {
  if (!clinicalSimulationEmail || !clinicalSimulationPassword) throw new Error("Clinical Simulation E2E credentials are required.");
  const response = await page.request.post("/api/auth/password-login", {
    data: {
      email: clinicalSimulationEmail,
      password: clinicalSimulationPassword,
      acceptedTerms: true,
      acceptedPrivacy: true,
      nextPath: "/clinical-simulation",
    },
  });
  expect(response.status()).toBe(200);
  expect((await response.json()).success).toBe(true);

  const session = /(?:^|,\s*)chapai_session=([^;]+)/.exec(response.headers()["set-cookie"] ?? "")?.[1];
  if (clinicalSimulationBaseUrl.startsWith("http://") && session) {
    await page.context().addCookies([{
      name: "chapai_session",
      value: session,
      url: clinicalSimulationBaseUrl,
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
    }]);
  }
}

export async function startClinicalAttempt(page: Page, scenarioSlug: string, seed: number) {
  const response = await page.request.post("/api/clinical-simulation/attempts", {
    data: { scenarioSlug, mode: "independent", seed },
  });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{ data: { id: string; seed: number } }>;
}

export async function loadClinicalAttempt(page: Page, attemptId: string) {
  const response = await page.request.get(`/api/clinical-simulation/attempts/${attemptId}`);
  expect(response.status()).toBe(200);
  return response.json() as Promise<{ data: { scenario: TestScenario; attempt: { state: Record<string, unknown> } } }>;
}

export async function performClinicalAction(page: Page, attemptId: string, scenario: TestScenario, actionId: string, completed = new Set<string>()) {
  if (completed.has(actionId)) return;
  const action = scenario.actions.find((candidate) => candidate.id === actionId);
  expect(action, actionId).toBeTruthy();
  for (const dependency of [...action!.prerequisites, ...action!.safetyChecks]) {
    await performClinicalAction(page, attemptId, scenario, dependency, completed);
  }
  const selectedElements = action!.communication?.requiredElementIds ?? action!.documentation?.requiredFieldIds ?? [];
  let response = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, {
    data: { operation: "act", actionId, selectedElements },
  });
  expect(response.status()).toBe(200);
  let result = await response.json();
  const reassessmentMinute = /(?:reassessment|response) window opens at minute (\d+)/i.exec(result.data.entry?.feedback ?? "")?.[1];
  if (result.data.entry?.classification === "premature" && reassessmentMinute) {
    const advanceBy = Number(reassessmentMinute) - Number(result.data.state.virtualMinute);
    if (advanceBy > 0) {
      response = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, { data: { operation: "advance", minutes: advanceBy } });
      expect(response.status()).toBe(200);
      const advanced = await response.json();
      expect(advanced.data.state.virtualMinute).toBe(Number(reassessmentMinute));
    }
    response = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, { data: { operation: "act", actionId, selectedElements } });
    expect(response.status()).toBe(200);
    result = await response.json();
  }
  if (result.data.state.completedActionIds.includes(actionId)) completed.add(actionId);
}

export async function pauseClinicalAttempt(page: Page, attemptId: string) {
  const response = await page.request.patch(`/api/clinical-simulation/attempts/${attemptId}`, {
    data: { operation: "set_paused", paused: true },
  });
  expect(response.status()).toBe(200);
}
