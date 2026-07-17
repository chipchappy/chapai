import { getClinicalSimulationAccess } from "@/lib/clinical-simulation/access";
import { clinicalScenarios } from "@/lib/clinical-simulation/scenarios";
import { jsonSuccess } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getClinicalSimulationAccess();
  if (!access.ok) return access.response;

  return jsonSuccess(clinicalScenarios.map((scenario) => ({
    id: scenario.id,
    slug: scenario.slug,
    title: scenario.title,
    unit: scenario.unit,
    specialty: scenario.specialty,
    difficulty: scenario.difficulty,
    estimatedMinutes: scenario.estimatedMinutes,
    version: scenario.version,
    status: scenario.status,
    learningObjectives: scenario.learningObjectives,
  })));
}
