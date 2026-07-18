import SimulationDashboard from "@/components/clinical-simulation/SimulationDashboard";
import { requireClinicalSimulationPageAccess } from "@/lib/clinical-simulation/page-access";
import { clinicalScenarios } from "@/lib/clinical-simulation/scenarios";

export default async function ClinicalSimulationPage() {
  await requireClinicalSimulationPageAccess();
  return <SimulationDashboard scenarios={clinicalScenarios} />;
}
