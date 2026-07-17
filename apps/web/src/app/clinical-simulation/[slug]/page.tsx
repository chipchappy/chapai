import { notFound } from "next/navigation";
import ScenarioPrebrief from "@/components/clinical-simulation/ScenarioPrebrief";
import { resolveEnv } from "@/lib/db";
import { isClinicalSimulationDeveloperForUser } from "@/lib/clinical-simulation/feature";
import { getClinicalScenarioBySlug } from "@/lib/clinical-simulation/scenarios";
import { getAuthenticatedUser } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export default async function ClinicalSimulationScenarioPage({ params, searchParams }: PageProps) {
  const [{ slug }, query, user] = await Promise.all([params, searchParams, getAuthenticatedUser()]);
  const scenario = getClinicalScenarioBySlug(slug);
  if (!scenario) notFound();
  return <ScenarioPrebrief
    scenario={scenario}
    defaultMode={query.mode === "independent" ? "independent" : "guided"}
    developerToolsEnabled={isClinicalSimulationDeveloperForUser(user?.email, resolveEnv())}
  />;
}
