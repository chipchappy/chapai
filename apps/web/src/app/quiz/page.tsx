import type { Metadata } from "next";
import { eq, sql } from "drizzle-orm";
import { questions } from "@chapai/db/schema";
import QuizPage from "./QuizPage";
import { getLiveContentSummary } from "@/lib/live-content-summary";
import { getServerAccessContext } from "@/lib/server-access";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";

export const metadata: Metadata = {
  title: "Practice center",
  description: "Large-format NCLEX and CCRN practice with AI-guided review, chart reading, case studies, and simulations.",
  alternates: {
    canonical: "/quiz",
  },
  robots: {
    index: false,
    follow: true,
  },
};

type PageSearchParams = {
  exam?: string;
  mode?: string;
  practiceExam?: string;
  category?: string;
  questionType?: string;
  ngnOnly?: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const { access } = await getServerAccessContext();
  const summary = getLiveContentSummary();
  const env = resolveEnv();
  let liveCounts = {
    ccrn: summary.ccrn.live,
    nclex: summary.nclex.live,
  };
  let nclexStats = {
    mcqLive: summary.nclex.mcqLive,
    ngnLive: summary.nclex.ngnLive,
    ngnRatio: summary.nclex.ngnRatio,
  };

  if (hasDatabase(env)) {
    try {
      const db = getDB(env);
      const examRows = await db
        .select({
          exam: questions.exam,
          count: sql<number>`count(*)`,
        })
        .from(questions)
        .groupBy(questions.exam);
      liveCounts = {
        ccrn: Number(examRows.find((row) => row.exam === "ccrn")?.count ?? summary.ccrn.live),
        nclex: Number(examRows.find((row) => row.exam === "nclex")?.count ?? summary.nclex.live),
      };

      const nclexTypeRows = await db
        .select({
          type: questions.type,
          count: sql<number>`count(*)`,
        })
        .from(questions)
        .where(eq(questions.exam, "nclex"))
        .groupBy(questions.type);
      const mcqLive = Number(nclexTypeRows.find((row) => row.type === "mcq")?.count ?? 0);
      const ngnLive = Math.max(liveCounts.nclex - mcqLive, 0);
      nclexStats = {
        mcqLive,
        ngnLive,
        ngnRatio: liveCounts.nclex > 0 ? Math.round((ngnLive / liveCounts.nclex) * 100) : summary.nclex.ngnRatio,
      };
    } catch {
      // Keep the summary fallback when the DB is not reachable in the page runtime.
    }
  }

  return (
    <main className="quiz-route-screen">
      <QuizPage
        tier={access.tier}
        initialExam={params.exam}
        initialMode={params.mode}
        initialPracticeExam={params.practiceExam}
        initialCategory={params.category}
        initialQuestionType={params.questionType}
        initialNgnOnly={params.ngnOnly}
        liveCounts={liveCounts}
        nclexStats={nclexStats}
        accessType={access.displayLabel}
        planCode={access.planCode}
        accessExamTrack={access.examTrack}
        questionBankAccessPercent={access.questionBankAccessPercent}
        practiceExamLimit={access.practiceExamLimit}
        canUseTutor={access.canUseTutor}
        canUseRichModes={access.canUseRichModes}
        canUsePracticeExams={access.canUsePracticeExams}
        canUseIcuSimBeta={access.canUseIcuSimBeta}
        canUseAdvancedAnalytics={access.canUseAdvancedAnalytics}
      />
    </main>
  );
}
