import { NextRequest } from "next/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { allowLocalFallbacks } from "@/lib/env";
import { createRequestContext, logError } from "@/lib/logger";
import { startLocalSession } from "@/lib/local-quiz-store";
import { ensureHostedUser } from "@/lib/billing-store";
import { quizAnswers } from "@chapai/db/schema";
import { eq, sql } from "drizzle-orm";
import { selectQuestions, createSession } from "@/lib/quiz-engine";
import { getQuestionBank } from "@/lib/content-bank";
import { getStandardPreviewDeck } from "@/lib/practice-data";
import { getServerAccessContext } from "@/lib/server-access";
import { ACCESS_KEY_COOKIE, validateAccessKeyRuntime } from "@/lib/access-keys";
import { matchesQuestionCategory } from "@/lib/nclex-client-needs";
import { FREE_LIMIT_CODES, FREE_QUESTION_LIMIT } from "@/lib/free-plan-limits";
import { checkRateLimit, rateLimitHeaders, rateLimitIdentity } from "@/lib/rate-limit";
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
function demoFallback(exam: "nclex" | "ccrn", count: number, config?: Partial<QuizSessionConfig>, excludeIds?: string[]) {
  // Endless mode sends already-seen ids — honor them here too, or anonymous
  // endless sessions receive duplicates, the client dedups to zero additions,
  // and the student gets stranded on the last question.
  const excluded = new Set(excludeIds ?? []);
  const liveDeck = shuffleQuestions(
    getQuestionBank(exam)
      .filter((question) => !excluded.has(question.id))
      .filter((question) => matchesQuizFilters(question, { exam, count, ...config } as QuizSessionConfig)),
  );

  if (liveDeck.length > 0) {
    return { sessionId: `demo-${Date.now()}`, questions: liveDeck.slice(0, Math.min(count, liveDeck.length)) };
  }

  const deck = getStandardPreviewDeck().filter((q) => q.exam === exam && !excluded.has(q.id));
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

    // Account requirement: starting a practice session is protected study
    // content. Signed-in users and access-key holders (founder/demo/instructor
    // previews) pass; anonymous visitors get 401 + the signup path.
    // Direct cookie fallback: if the access context failed, validate the raw
    // key cookie itself so a context hiccup never locks out key holders.
    if (!user?.id && !previewAccess) {
      const previewCookie = req.cookies.get(ACCESS_KEY_COOKIE)?.value;
      if (previewCookie) {
        previewAccess = Boolean(await validateAccessKeyRuntime(previewCookie).catch(() => null));
      }
    }
    // Serving a session costs D1 reads and adaptive selection CPU. This is
    // generous enough that normal study — including the endless mode, which
    // refills in 25-question batches — never touches it.
    const startLimit = await checkRateLimit({
      route: "quiz-start",
      identity: rateLimitIdentity(req, user?.id),
      limit: 40,
      windowSeconds: 60,
    });
    if (!startLimit.allowed) {
      return jsonError(429, "RATE_LIMITED", "Too many sessions started at once. Give it a moment.", {
        ...requestContext,
        ...rateLimitHeaders(startLimit),
      }, { requestId: requestContext.requestId });
    }

    if (!user?.id && !previewAccess) {
      return jsonError(401, "AUTH_REQUIRED", "Create a free account to start practicing.", {
        ...requestContext,
        loginUrl: "/auth/signup?next=/quiz",
      }, { requestId: requestContext.requestId });
    }

    // Only fall back to synthetic demo deck for non-pro preview users without a session.
    // Pro-tier demo key holders get real questions from the DB (sessionId will be demo-${Date.now()}). 
    if (previewAccess && !user?.id && previewKeyTier !== "pro") {
      return jsonSuccess(demoFallback(config.exam, config.count ?? 10, config, parsed.data.excludeIds), 200, { requestId: requestContext.requestId });
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
      const fallback = demoFallback(config.exam, config.count ?? 10, config, parsed.data.excludeIds);
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
    // Free plan: a lifetime practice-question allowance, then the paywall. The
    // batch is capped to what remains and the response carries the meter so the
    // UI can show progress toward the limit before the student hits it.
    let freeQuestions: { used: number; limit: number; remaining: number } | null = null;
    let effectiveConfig = config;
    if (hostedUser && access.tier === "free" && !previewAccess) {
      const usedRows = await db
        .select({ used: sql<number>`count(*)` })
        .from(quizAnswers)
        .where(eq(quizAnswers.userId, hostedUser.id));
      const used = Number(usedRows[0]?.used ?? 0);
      if (used >= FREE_QUESTION_LIMIT) {
        return jsonError(
          403,
          FREE_LIMIT_CODES.questions,
          `You've completed all ${FREE_QUESTION_LIMIT} free questions — upgrade to unlock the full reviewed bank, all readiness exams, and the AI tutor.`,
          { ...requestContext, freeQuestions: { used, limit: FREE_QUESTION_LIMIT, remaining: 0 } },
          { requestId: requestContext.requestId },
        );
      }
      const remaining = FREE_QUESTION_LIMIT - used;
      freeQuestions = { used, limit: FREE_QUESTION_LIMIT, remaining };
      const requested = typeof config.count === "number" ? config.count : 10;
      // count is a literal union in the schema; the capped value is still a
      // plain positive int, which is all the engine/session code needs.
      effectiveConfig = { ...config, count: Math.max(1, Math.min(requested, remaining)) as typeof config.count };
    }

    let questionList: QuizQuestion[] = [];
    try {
      questionList = await selectQuestions(db, effectiveConfig, {
        questionBankAccessPercent: access.questionBankAccessPercent,
        userId: hostedUser?.id,
        adaptive: parsed.data.adaptive,
        excludeIds: parsed.data.excludeIds,
        diversify: access.tier === "free",
        selectionSeed: `${hostedUser?.id ?? "preview"}:${requestContext.requestId}`,
      });
    } catch (error) {
      logError("quiz/start selection failed", error, requestContext);
      return jsonError(500, "QUESTION_SELECTION_FAILED", "Could not build this study session right now.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    if (questionList.length === 0) {
      if (effectiveConfig.exam === "nclex" && effectiveConfig.questionType === "case_study") {
        // The client owns the clinically verified static case fallback. Return a
        // clean empty result while D1 has no complete six-step case instead of
        // generating a noisy 404 before that fallback opens.
        return jsonSuccess(
          { sessionId: `verified-case-fallback-${Date.now()}`, questions: [] },
          200,
          { requestId: requestContext.requestId },
        );
      }
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
      const sessionId = await createSession(db, hostedUser?.id ?? undefined, effectiveConfig, questionList);
      return jsonSuccess(
        { sessionId, questions: questionList, freeQuestions },
        200,
        { requestId: requestContext.requestId },
      );
    } catch (error) {
      logError("quiz/start session creation failed; returning demo payload", error, requestContext);
      return jsonSuccess(
        { sessionId: `demo-${Date.now()}`, questions: questionList, freeQuestions },
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
