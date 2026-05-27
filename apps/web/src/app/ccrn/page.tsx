import type { Metadata } from "next";
import PremiumArtHero from "@/components/marketing/PremiumArtHero";
import { CompetitiveStudySystem, FrontpageCompareDeck, FrontpageNgDemo, FrontpageRouteSplit } from "@/components/marketing/frontpage";
import { getMarketingTheme } from "@/components/marketing/marketingArtwork";
import { getLiveBankStats } from "@/lib/live-bank-stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CCRN practice questions for ICU nurses",
  description:
    "Premium CCRN practice questions, original critical-care scenarios, AI rationale, and a calmer study tool for ICU nurses.",
  alternates: {
    canonical: "/ccrn",
  },
};

export default async function CcrnPage() {
  const stats = await getLiveBankStats();
  const theme = getMarketingTheme("ccrn");

  const statItems = [
    {
      label: "ccrn qbank",
      value: stats.ccrnLive.toLocaleString(),
      detail: "live bedside review",
    },
    {
      label: "practice exams",
      value: "2 / 5",
      detail: "base and dual premium",
    },
    {
      label: "from",
      value: "$4.99",
      detail: "24-hour access to start",
    },
  ];

  return (
    <main className="pb-16">
      <PremiumArtHero theme={theme} statItems={statItems} />
      <CompetitiveStudySystem
        route="ccrn"
        nclexCount={stats.nclexLive}
        ccrnCount={stats.ccrnLive}
        ngnRatio={stats.nclexNgnRatio}
      />
      <FrontpageNgDemo route="ccrn" />
      <FrontpageCompareDeck route="ccrn" />
      <FrontpageRouteSplit />
    </main>
  );
}
