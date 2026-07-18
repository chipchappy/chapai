import type { Metadata } from "next";
import { requireClinicalSimulationPageAccess } from "@/lib/clinical-simulation/page-access";

export const metadata: Metadata = {
  title: "Clinical Simulation",
  description: "Evidence-aware, deterministic clinical simulation for nursing education.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ClinicalSimulationLayout({ children }: { children: React.ReactNode }) {
  await requireClinicalSimulationPageAccess();
  return <div data-clinical-simulation="enabled">{children}</div>;
}
