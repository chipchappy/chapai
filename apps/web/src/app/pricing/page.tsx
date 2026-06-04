import type { Metadata } from "next";
import PricingCards from "@/components/marketing/PricingCards";
import PricingPersonalizedHero from "@/components/marketing/PricingPersonalizedHero";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getServerAccessContext } from "@/lib/server-access";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getStudentDashboardData } from "@/lib/student-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing | Clarity NCLEX",
  description: "Clarity NCLEX pricing: $9.99/mo for NCLEX Base, $15.99/mo for Dual Premium, and $4.99 24-hour passes.",
};

export default async function PricingPage() {
  // Personalized hero for free users with ≥50 answered questions + ≥3 weak areas.
  let personalized: {
    firstName: string | null;
    questionsAnswered: number;
    weakAreaCount: number;
    readinessScore: number;
  } | null = null;

  try {
    const user = await getAuthenticatedUser();
    const { access } = await getServerAccessContext();
    if (user?.id && access.tier === "free") {
      const env = resolveEnv();
      if (hasDatabase(env)) {
        const db = getDB(env);
        const data = await getStudentDashboardData(db, { userId: user.id, email: user.email ?? null });
        if (data.totalAnswered >= 50 && data.weakAreas.length >= 3) {
          personalized = {
            firstName: user.email ? user.email.split("@")[0].replace(/[._]/g, " ").split(" ")[0] : null,
            questionsAnswered: data.totalAnswered,
            weakAreaCount: data.weakAreas.length,
            readinessScore: data.readinessScore,
          };
        }
      }
    }
  } catch {
    // non-fatal — fall back to the standard pricing page
  }

  return (
    <>
      {personalized ? <PricingPersonalizedHero {...personalized} /> : null}
      <PricingCards />
    </>
  );
}
