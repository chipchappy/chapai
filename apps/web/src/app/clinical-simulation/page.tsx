import SimulationDashboard from "@/components/clinical-simulation/SimulationDashboard";
import { clinicalScenarios } from "@/lib/clinical-simulation/scenarios";

export default function ClinicalSimulationPage() {
  return <SimulationDashboard scenarios={clinicalScenarios} />;
}
