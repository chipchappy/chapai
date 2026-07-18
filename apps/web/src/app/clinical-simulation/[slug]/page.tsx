import { notFound } from "next/navigation";
import ScenarioPrebrief from "@/components/clinical-simulation/ScenarioPrebrief";
import { requireClinicalSimulationPageAccess } from "@/lib/clinical-simulation/page-access";
import { getClinicalScenarioBySlug } from "@/lib/clinical-simulation/scenarios";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export default async function ClinicalSimulationScenarioPage({ params, searchParams }: PageProps) {
  const access = await requireClinicalSimulationPageAccess();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const scenario = getClinicalScenarioBySlug(slug);
  if (!scenario) notFound();
  return <ScenarioPrebrief
    scenario={scenario}
    defaultMode={query.mode === "independent" ? "independent" : "guided"}
    developerToolsEnabled={access.developerToolsEnabled}
  />;
}
