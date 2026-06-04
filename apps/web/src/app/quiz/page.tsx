import type { Metadata } from "next";
import { eq, sql } from "drizzle-orm";
import { questions } from "@chapai/db/schema";
import QuizPage from "./QuizPage";
import { getLiveContentSummary } from "@/lib/live-content-summary";
import { getServerAccessContext } from "@/lib/server-access";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getStudentDashboardData, getReadinessAttempts } from "@/lib/student-dashboard";

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
  question?: string;       // QOTD deep-link
  tutorQuestion?: string;  // Dashboard tutor-followup deep-link
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
      const mcqLive = Number(nclexTypeRows.find((row) => row.type === "mcq")?.count ?? summary.nclex.mcqLive);
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

  // Per-category progress for the signed-in student (drives progress bars under each tile)
  const user = await getAuthenticatedUser();
  let categoryProgress: Record<string, { answered: number; correct: number; accuracy: number }> = {};
  let totalAnsweredByExam = { nclex: 0, ccrn: 0 };
  let streakDays = 0;
  let todayAnswered = 0;
  let suggestedCategoryValue: string | null = null;
  let suggestedCategoryLabel: string | null = null;
  let serverReadinessAttempts: Record<string, { accuracy: number; correctAnswers: number; totalQuestions: number; takenAtMs: number }> = {};
  let willPersonalize = false;
  if (user && hasDatabase(env)) {
    try {
      const db = getDB(env);
      const dash = await getStudentDashboardData(db, { userId: user.id, email: user.email ?? null });
      for (const stat of dash.categoryStats) {
        categoryProgress[`${stat.exam}::${stat.category}`] = {
          answered: stat.answered,
          correct: stat.correct,
          accuracy: stat.accuracy,
        };
        totalAnsweredByExam[stat.exam] += stat.answered;
      }
      streakDays = dash.streakDays;
      todayAnswered = dash.todayAnswered;
      // Will personalize iff student has ≥2 categories with ≥5 attempts each on the current exam.
      const qualifying = dash.categoryStats.filter((c) => c.answered >= 5);
      willPersonalize = qualifying.length >= 2;
      if (dash.suggestedCategory) {
        suggestedCategoryValue = dash.suggestedCategory.category;
        suggestedCategoryLabel = dash.suggestedCategory.category
          .split(/[-_]/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
      try {
        const attempts = await getReadinessAttempts(db, user.id);
        const stripped: typeof serverReadinessAttempts = {};
        for (const [examId, rec] of Object.entries(attempts)) {
          stripped[examId] = {
            accuracy: rec.accuracy,
            correctAnswers: rec.correctAnswers,
            totalQuestions: rec.totalQuestions,
            takenAtMs: rec.takenAtMs,
          };
        }
        serverReadinessAttempts = stripped;
      } catch {
        // non-fatal
      }
    } catch {
      // Non-fatal — render the page without progress bars if the dashboard query fails.
    }
  }

  // Smart category default — pre-select student's weakest category when no explicit URL filter
  const resolvedInitialCategory = params.category ?? suggestedCategoryValue ?? undefined;

  return (
    <main className="quiz-route-screen">
      <QuizPage
        tier={access.tier}
        initialExam={params.exam}
        initialMode={params.mode}
        initialPracticeExam={params.practiceExam}
        initialCategory={resolvedInitialCategory}
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
        categoryProgress={categoryProgress}
        totalAnsweredByExam={totalAnsweredByExam}
        isAuthenticated={Boolean(user)}
        streakDays={streakDays}
        todayAnswered={todayAnswered}
        suggestedCategoryLabel={suggestedCategoryLabel}
        serverReadinessAttempts={serverReadinessAttempts}
        willPersonalize={willPersonalize}
        deepLinkQuestionId={params.question ?? params.tutorQuestion ?? null}
        deepLinkOpenTutor={Boolean(params.tutorQuestion)}
      />
    </main>
  );
}
