import { notFound, redirect } from "next/navigation";
import SimulationWorkspace from "@/components/clinical-simulation/SimulationWorkspace";
import { getClinicalScenarioBySlug } from "@/lib/clinical-simulation/scenarios";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ attempt?: string }>;
};

export default async function ClinicalSimulationRunPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const scenario = getClinicalScenarioBySlug(slug);
  if (!scenario) notFound();
  if (!query.attempt) redirect(`/clinical-simulation/${slug}`);
  return <SimulationWorkspace scenario={scenario} attemptId={query.attempt} />;
}
