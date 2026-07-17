import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isClinicalSimulationEnabledForUser } from "@/lib/clinical-simulation/feature";
import { resolveEnv } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Clinical Simulation",
  description: "Evidence-aware, deterministic clinical simulation for nursing education.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ClinicalSimulationLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!isClinicalSimulationEnabledForUser(user?.email ?? null, resolveEnv())) notFound();
  if (!user) redirect("/auth/login?next=/clinical-simulation");
  return <div data-clinical-simulation="enabled">{children}</div>;
}
