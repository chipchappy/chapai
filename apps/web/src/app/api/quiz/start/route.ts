import { NextRequest } from "next/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { allowLocalFallbacks } from "@/lib/env";
import { createRequestContext, logError } from "@/lib/logger";
import { startLocalSession } from "@/lib/local-quiz-store";
import { ensureHostedUser } from "@/lib/billing-store";
import { selectQuestions, createSession } from "@/lib/quiz-engine";
import { getQuestionBank } from "@/lib/content-bank";
import { getStandardPreviewDeck } from "@/lib/practice-data";
import { getServerAccessContext } from "@/lib/server-access";
import { matchesQuestionCategory } from "@/lib/nclex-client-needs";
import type { ResolvedPremiumAccess } from "@/lib/premium-access";
import type { QuizSessionConfig, QuizQuestion } from "@/lib/types";
import { z } from "zod";
import { jsonError, jsonSuccess } from "@/lib/http";

export const dynamic = "force-dynamic";

function matchesQuizFilters(question: QuizQuestion, config: QuizSessionConfig) {
  const questionType = config.questionType ?? config.type;

  if (!matchesQuestionCategory(question, config.category)) {
    return false;
  }

  if (questionType && question.type !== questionType) {
    return false;
  }

  if (config.ngnOnly && question.type === "mcq") {
    return false;
  }

  return true;
}

function shuffleQuestions<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

/** Build a demo-backed response when the live bank is empty */
function demoFallback(exam: "nclex" | "ccrn", count: number, config?: Partial<QuizSessionConfig>) {
  const liveDeck = shuffleQuestions(
    getQuestionBank(exam).filter((question) => matchesQuizFilters(question, { exam, count, ...config } as QuizSessionConfig)),
  );

  if (liveDeck.length > 0) {
    return { sessionId: `demo-${Date.now()}`, questions: liveDeck.slice(0, Math.min(count, liveDeck.length)) };
  }

  const deck = getStandardPreviewDeck().filter((q) => q.exam === exam);
  // shuffle deterministically based on time bucket so we vary the set each call
  const bucket = Math.floor(Date.now() / (1000 * 60 * 60));
  const shuffled = [...deck].sort((a, b) => {
    const ha = ((a.id + bucket).split("").reduce((s, c) => s + c.charCodeAt(0), 0)) % 1000;
    const hb = ((b.id + bucket).split("").reduce((s, c) => s + c.charCodeAt(0), 0)) % 1000;
    return ha - hb;
  });
  const questions = shuffled.slice(0, Math.min(count, shuffled.length)).map((q) => ({
    id: q.id,
    exam: q.exam,
    type: "mcq" as const,
    category: q.category,
    subcategory: "",
    difficulty: q.difficulty,
    stem: q.stem,
    options: (q.options ?? []).map((o) => ({ id: o.id, text: o.text })),
    answer: typeof q.correctAnswer === "string" ? q.correctAnswer : (q.correctAnswer as string[])[0] ?? "a",
    rationale: q.rationale ?? "",
    distractorRationales: q.distractorRationales,
    takeaway: q.takeaway,
    tags: [],
    blueprintPct: 0,
    tutorReady: true,
  } satisfies QuizQuestion));
  return { sessionId: `demo-${Date.now()}`, questions };
}

const schema = z.object({
  exam:     z.enum(["nclex", "ccrn"]),
  category: z.string().optional(),
  questionType: z.enum(["mcq", "sata", "ordering", "matrix", "case_study", "bow_tie", "scenario_mcq", "decision_map_mcq"]).optional(),
  type: z.enum(["mcq", "sata", "ordering", "matrix", "case_study", "bow_tie", "scenario_mcq", "decision_map_mcq"]).optional(),
  ngnOnly: z.boolean().optional(),
  count:    z.union([
    z.literal(5), z.literal(6), z.literal(10), z.literal(20), z.literal(25), z.literal(50), z.literal(75), z.literal(100)
  ]).default(10),
  adaptive: z.boolean().optional(),
  excludeIds: z.array(z.string()).max(2000).optional(),
});


export async function POST(req: NextRequest) {
  const requestContext = createRequestContext(req, { route: "/api/quiz/start" });
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      logError("quiz/start validation failed", parsed.error, requestContext);
      return jsonError(400, "VALIDATION_ERROR", "Invalid quiz request.", requestContext, {
        requestId: requestContext.requestId,
      });
    }
    const config = {
      ...parsed.data,
      questionType: parsed.data.questionType ?? parsed.data.type,
    } satisfies QuizSessionConfig;

    const env = resolveEnv();
    let user = null;
    let access: Pick<ResolvedPremiumAccess, "examTrack" | "questionBankAccessPercent" | "source" | "tier"> = {
      examTrack: "all" as const,
      questionBankAccessPercent: 100,
      source: "none" as const,
      tier: "free" as const,
    };
    let previewAccess = false;
    let previewKeyTier = "free" as "free" | "pro";
    try {
      const accessContext = await getServerAccessContext();
      user = accessContext.user;
      access = accessContext.access;
      previewAccess = access.source === "founder-key" || access.source === "preview-key";
      previewKeyTier = access.tier === "pro" ? "pro" : "free";
    } catch (error) {
      logError("quiz/start access context failed", error, requestContext);
    }

    // Only fall back to synthetic demo deck for non-pro preview users without a session.
    // Pro-tier demo key holders get real questions from the DB (sessionId will be demo-${Date.now()}). 
    if (previewAccess && !user?.id && previewKeyTier !== "pro") {
      return jsonSuccess(demoFallback(config.exam, config.count ?? 10, config), 200, { requestId: requestContext.requestId });
    }

    if (access.examTrack !== "all" && access.examTrack !== config.exam) {
      return jsonError(
        403,
        "TRACK_SCOPE_MISMATCH",
        `This plan currently unlocks ${access.examTrack.toUpperCase()} question-bank access only.`,
        requestContext,
        { requestId: requestContext.requestId },
      );
    }

    if (!hasDatabase(env)) {
      if (!allowLocalFallbacks(env)) {
        return jsonError(503, "QUIZ_STORAGE_UNAVAILABLE", "Quiz session storage is not configured for production.", requestContext, {
          requestId: requestContext.requestId,
        });
      }
      const local = startLocalSession(config);
      if (local) {
        return jsonSuccess(local, 200, { requestId: requestContext.requestId });
      }
      // Fall back to in-memory demo deck
      const fallback = demoFallback(config.exam, config.count ?? 10, config);
      return jsonSuccess(fallback, 200, { requestId: requestContext.requestId });
    }

    const db = getDB(env);
    // Resolve the hosted user up front so adaptive selection can read their
    // per-category weakness history (and reuse it for session creation below).
    const hostedUser = user?.email
      ? await ensureHostedUser(db, {
          userId: user.id,
          email: user.email,
          name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
        })
      : null;
    let questionList: QuizQuestion[] = [];
    try {
      questionList = await selectQuestions(db, config, {
        questionBankAccessPercent: access.questionBankAccessPercent,
        userId: hostedUser?.id,
        adaptive: parsed.data.adaptive,
        excludeIds: parsed.data.excludeIds,
      });
    } catch (error) {
      logError("quiz/start selection failed", error, requestContext);
      return jsonError(500, "QUESTION_SELECTION_FAILED", "Could not build this study session right now.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    if (questionList.length === 0) {
      return jsonError(404, "QUESTION_SET_EMPTY", "No questions matched this filter yet.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    if (previewAccess && !user?.id) {
      return jsonSuccess(
        { sessionId: `demo-${Date.now()}`, questions: questionList } satisfies { sessionId: string; questions: typeof questionList },
        200,
        { requestId: requestContext.requestId },
      );
    }

    try {
      const sessionId = await createSession(db, hostedUser?.id ?? undefined, config, questionList);
      return jsonSuccess(
        { sessionId, questions: questionList } satisfies { sessionId: string; questions: typeof questionList },
        200,
        { requestId: requestContext.requestId },
      );
    } catch (error) {
      logError("quiz/start session creation failed; returning demo payload", error, requestContext);
      return jsonSuccess(
        { sessionId: `demo-${Date.now()}`, questions: questionList } satisfies { sessionId: string; questions: typeof questionList },
        200,
        { requestId: requestContext.requestId },
      );
    }
  } catch (err) {
    logError("quiz/start error", err, requestContext);
    return jsonError(500, "INTERNAL_ERROR", "Could not start the study session.", requestContext, {
      requestId: requestContext.requestId,
    });
  }
}
