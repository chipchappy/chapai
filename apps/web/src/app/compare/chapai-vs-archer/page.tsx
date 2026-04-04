import type { Metadata } from "next";
import IntentLanding from "@/components/marketing/IntentLanding";
import { getLiveContentSummary } from "@/lib/live-content-summary";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ChapAI vs Archer",
  description:
    "Comparing ChapAI vs Archer? See the cleaner package structure, premium design, original question growth, and AI-guided review difference.",
  alternates: {
    canonical: "/compare/chapai-vs-archer",
  },
};

export default function ChapAiVsArcherPage() {
  const summary = getLiveContentSummary();

  return (
    <IntentLanding
      eyebrow="Comparison page"
      title="ChapAI vs Archer: a calmer package, cleaner surface, and more original growth lane."
      body="This page is for buyers who already know the market and want the faster answer. ChapAI is not trying to out-shout everyone. It is trying to feel cleaner, more premium, and more clinically believable while the content engine keeps expanding."
      stats={[
        { label: "CCRN live", value: `${summary.ccrn.live}` },
        { label: "NCLEX drafted", value: `${summary.nclex.draft}` },
        { label: "Why it stands out", value: "Cleaner package fit" },
      ]}
      accentLabel="Comparison intent"
      primaryHref="/upgrade"
      primaryLabel="Compare ChapAI packages"
      secondaryHref="/quiz"
      secondaryLabel="Try the product"
      whyTitle="The real buyer question is not just 'which qbank has more questions?'"
      whyBody="The sharper question is which product feels more trustworthy, more focused, and more likely to convert confusion into score movement without adding more clutter."
      proofPoints={[
        {
          label: "Separate packages",
          text: "ChapAI treats CCRN and NCLEX as distinct buying decisions instead of forcing one blended surface onto two very different markets.",
        },
        {
          label: "Premium UI",
          text: "The site is being built to feel calmer and more editorial, which creates a stronger first impression for paid conversion than a louder qbank-first product.",
        },
        {
          label: "Original growth lane",
          text: "Nemoclaw keeps generating cheap net-new batches in the background, which means the product can keep compounding instead of relying only on static inventory.",
        },
      ]}
      buyerTitle="People comparing products because they are tired of noisy prep tools."
      buyerBody="Best for buyers who already know Archer and are looking for something cleaner, newer, and more intentionally designed."
      packageTitle="The pitch is not 'everything for everyone.'"
      packageBody="The pitch is sharper package fit, calmer product feel, AI tutor support, and a content engine that can keep adding value without exploding cost."
      urgencyTitle="Early traffic should land on a direct answer."
      urgencyBody="Comparison traffic is high-intent. This page is built to capture that buyer and move them straight to package selection before they bounce."
      faq={[
        {
          question: "What is the biggest difference between ChapAI and Archer?",
          answer: "The difference is focus and feel: distinct package paths for CCRN and NCLEX, more premium design, and a growth engine that keeps producing original batches.",
        },
        {
          question: "Is ChapAI already usable now?",
          answer: "Yes. The quiz flow, package page, checkout, tutor fallback, and growing content bank are already live while the surface keeps improving.",
        },
        {
          question: "Why should a comparison page matter?",
          answer: "Because comparison traffic is often the closest traffic to buying. The page should answer the question quickly and then move the visitor directly into the package decision.",
        },
      ]}
    />
  );
}
