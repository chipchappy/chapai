import { NextRequest } from "next/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { allowLocalFallbacks } from "@/lib/env";
import { ensureHostedUser } from "@/lib/billing-store";
import { getQuestionById } from "@/lib/content-bank";
import { answerLocalSession } from "@/lib/local-quiz-store";
import { recordAnswer } from "@/lib/quiz-engine";
import { getStandardPreviewDeck } from "@/lib/practice-data";
import { questions, quizSessions } from "@chapai/db/schema";
import { eq } from "drizzle-orm";
import type { ApiResponse } from "@/lib/types";
import { z } from "zod";
import { createRequestContext } from "@/lib/logger";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/http";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { QuestionAnswer } from "@/lib/types";

export const dynamic = "force-dynamic";

const schema = z.object({
  sessionId:      z.string().min(1),          // accept demo- prefixed ids too
  questionId:     z.string(),
  selectedAnswer: z.union([z.string(), z.array(z.string()), z.record(z.string(), z.string())]).optional(),
  selectedOptionId: z.string().optional(),
  timeSpentMs:    z.number().int().positive().optional(),
});

/** Look up a question from the in-memory demo deck (used when D1 is empty) */
function getDemoQuestion(questionId: string) {
  return getStandardPreviewDeck().find((q) => q.id === questionId) ?? null;
}

function serializeAnswer(answer: QuestionAnswer | string) {
  if (Array.isArray(answer)) {
    return JSON.stringify(answer);
  }

  if (answer && typeof answer === "object") {
    return JSON.stringify(answer);
  }

  return String(answer ?? "");
}

function normalizeStoredAnswer(answer: QuestionAnswer | string | null | undefined): QuestionAnswer | string {
  if (Array.isArray(answer) || (answer && typeof answer === "object")) {
    return answer;
  }

  const raw = String(answer ?? "").trim();
  if (!raw) {
    return "";
  }

  if ((raw.startsWith("[") && raw.endsWith("]")) || (raw.startsWith("{") && raw.endsWith("}"))) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) || (parsed && typeof parsed === "object")) {
        return parsed as QuestionAnswer;
      }
    } catch {
      // Keep the raw value when the stored answer is not valid JSON.
    }
  }

  return raw;
}

function parseComparableAnswer(input: unknown) {
  if (Array.isArray(input)) {
    return [...input]
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean)
      .sort();
  }

  if (input && typeof input === "object") {
    return Object.entries(input as Record<string, unknown>)
      .map(([key, value]) => `${String(key).trim().toLowerCase()}:${String(value).trim().toLowerCase()}`)
      .sort();
  }

  const raw = String(input ?? "").trim();
  if (!raw) {
    return "";
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return [...parsed]
        .map((item) => String(item).trim().toLowerCase())
        .sort();
    }
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed as Record<string, unknown>)
        .map(([key, value]) => `${String(key).trim().toLowerCase()}:${String(value).trim().toLowerCase()}`)
        .sort();
    }
  } catch {
    // fall through to scalar handling
  }

  if (raw.includes(",")) {
    return raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
      .sort();
  }

  return raw.toLowerCase();
}

function answersMatch(left: unknown, right: unknown) {
  const normalizedLeft = parseComparableAnswer(left);
  const normalizedRight = parseComparableAnswer(right);

  if (Array.isArray(normalizedLeft) && Array.isArray(normalizedRight)) {
    return normalizedLeft.length === normalizedRight.length
      && normalizedLeft.every((value, index) => value === normalizedRight[index]);
  }

  return normalizedLeft === normalizedRight;
}

export async function POST(req: NextRequest) {
  const requestContext = createRequestContext(req, { route: "/api/quiz/answer" });
  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    const selectedAnswer = parsed.selectedAnswer ?? parsed.selectedOptionId;
    if (selectedAnswer == null || (typeof selectedAnswer === "string" && !selectedAnswer.trim())) {
      return jsonError(400, "VALIDATION_ERROR", "Answer is required", requestContext, {
        requestId: requestContext.requestId,
      });
    }
    const serializedSelectedAnswer = serializeAnswer(selectedAnswer);
    const { sessionId, questionId, timeSpentMs } = parsed;

    const env = resolveEnv();

    if (!hasDatabase(env)) {
      if (!allowLocalFallbacks(env)) {
        return jsonError(503, "QUIZ_STORAGE_UNAVAILABLE", "Quiz answer storage is not configured for production.", requestContext, {
          requestId: requestContext.requestId,
        });
      }
      const local = answerLocalSession({
        sessionId,
        questionId,
        selectedAnswer: serializedSelectedAnswer,
        timeSpentMs,
      });

      if (!local) {
        return Response.json({
          success: false,
          error: "Question or session not found",
        } satisfies ApiResponse<never>, {
          status: 404,
          headers: {
            "Cache-Control": "no-store, max-age=0",
            Pragma: "no-cache",
            "X-Request-Id": requestContext.requestId,
          },
        });
      }

      return jsonSuccess({
        correct: local.isCorrect,
        correctAnswer: local.question.answer,
        rationale: local.question.rationale,
        deepRationale: local.question.deepRationale ?? local.question.rationale,
        distractorRationales: local.question.distractorRationales ?? null,
        takeaway: local.question.takeaway ?? null,
        visualRationale: local.question.visualRationale ?? null,
        diagramBlueprint: local.question.diagramBlueprint ?? null,
        references: local.question.references ?? [],
        coachingFrame: local.question.coachingFrame ?? [],
      }, 200, { requestId: requestContext.requestId });
    }

    const db = getDB(env);
    const user = await getAuthenticatedUser();
    const hostedUser = user?.email
      ? await ensureHostedUser(db, {
          userId: user.id,
          email: user.email,
          name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
        })
      : null;
    const canonicalQuestion = getQuestionById(questionId);
    const demoQuestion = !canonicalQuestion ? getDemoQuestion(questionId) : null;

    // Keep the curated live bank as the teaching source of truth,
    // while the database continues to store session/answer history.
    const question = await db
      .select({ answer: questions.answer, rationale: questions.rationale, distractorRationales: questions.distractorRationales })
      .from(questions)
      .where(eq(questions.id, questionId))
      .get();

    if (!question && !canonicalQuestion && !demoQuestion) {
      return jsonError(404, "QUESTION_NOT_FOUND", "Question not found", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const demoCorrect = demoQuestion ? demoQuestion.correctAnswer : null;
    const correctAnswer = normalizeStoredAnswer(canonicalQuestion?.answer ?? demoCorrect ?? question?.answer ?? "");
    const rationale = canonicalQuestion?.rationale ?? demoQuestion?.rationale ?? question?.rationale ?? "";
    const deepRationale = canonicalQuestion?.deepRationale ?? rationale;
    const distractorRationales = canonicalQuestion?.distractorRationales ?? demoQuestion?.distractorRationales ?? (
      question?.distractorRationales
        ? JSON.parse(question.distractorRationales)
        : null
    );
    const isCorrect = answersMatch(selectedAnswer, correctAnswer);

    // Skip DB write for demo sessions (they use non-UUID IDs and aren't in D1)
    if (!sessionId.startsWith("demo-")) {
      const session = await db
        .select({ id: quizSessions.id, userId: quizSessions.userId })
        .from(quizSessions)
        .where(eq(quizSessions.id, sessionId))
        .get();

      if (!session) {
        return jsonError(404, "SESSION_NOT_FOUND", "Session not found", requestContext, {
          requestId: requestContext.requestId,
        });
      }

      if (session.userId && session.userId !== hostedUser?.id) {
        return jsonError(403, "SESSION_OWNERSHIP_MISMATCH", "This session belongs to a different account.", requestContext, {
          requestId: requestContext.requestId,
        });
      }

      await recordAnswer(db, {
        sessionId,
        questionId,
        userId: hostedUser?.id,
        selectedAnswer: serializedSelectedAnswer,
        isCorrect,
        timeSpentMs,
      });
    }

    return jsonSuccess({
      correct: isCorrect,
      correctAnswer,
      rationale,
      deepRationale,
      distractorRationales,
      takeaway: canonicalQuestion?.takeaway ?? demoQuestion?.takeaway ?? null,
      visualRationale: canonicalQuestion?.visualRationale ?? null,
      diagramBlueprint: canonicalQuestion?.diagramBlueprint ?? null,
      references: canonicalQuestion?.references ?? [],
      coachingFrame: canonicalQuestion?.coachingFrame ?? [],
    }, 200, { requestId: requestContext.requestId });

  } catch (err) {
    return handleRouteError(err, {
      requestId: requestContext.requestId,
      route: "/api/quiz/answer",
    });
  }
}
