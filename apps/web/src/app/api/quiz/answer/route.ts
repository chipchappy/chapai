import { NextRequest } from "next/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { getQuestionById } from "@/lib/content-bank";
import { answerLocalSession } from "@/lib/local-quiz-store";
import { recordAnswer } from "@/lib/quiz-engine";
import { getStandardPreviewDeck } from "@/lib/practice-data";
import { questions } from "@chapai/db/schema";
import { eq } from "drizzle-orm";
import type { ApiResponse } from "@/lib/types";
import { z } from "zod";

const schema = z.object({
  sessionId:      z.string().min(1),          // accept demo- prefixed ids too
  questionId:     z.string(),
  selectedAnswer: z.string().optional(),
  selectedOptionId: z.string().optional(),
  timeSpentMs:    z.number().int().positive().optional(),
});

/** Look up a question from the in-memory demo deck (used when D1 is empty) */
function getDemoQuestion(questionId: string) {
  return getStandardPreviewDeck().find((q) => q.id === questionId) ?? null;
}

function parseComparableAnswer(input: string) {
  const raw = input.trim();
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

function answersMatch(left: string, right: string) {
  const normalizedLeft = parseComparableAnswer(left);
  const normalizedRight = parseComparableAnswer(right);

  if (Array.isArray(normalizedLeft) && Array.isArray(normalizedRight)) {
    return normalizedLeft.length === normalizedRight.length
      && normalizedLeft.every((value, index) => value === normalizedRight[index]);
  }

  return normalizedLeft === normalizedRight;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    const selectedAnswer = parsed.selectedAnswer ?? parsed.selectedOptionId;
    if (!selectedAnswer) {
      return Response.json({ success: false, error: "Answer is required" }, { status: 400 });
    }
    const { sessionId, questionId, timeSpentMs } = parsed;

    const env = resolveEnv();

    if (!hasDatabase(env)) {
      const local = answerLocalSession({
        sessionId,
        questionId,
        selectedAnswer,
        timeSpentMs,
      });

      if (!local) {
        return Response.json({
          success: false,
          error: "Question or session not found",
        } satisfies ApiResponse<never>, { status: 404 });
      }

      return Response.json({
        success: true,
        data: {
          correct: local.isCorrect,
          correctAnswer: local.question.answer,
          rationale: local.question.rationale,
          distractorRationales: local.question.distractorRationales ?? null,
          takeaway: local.question.takeaway ?? null,
          visualRationale: local.question.visualRationale ?? null,
          diagramBlueprint: local.question.diagramBlueprint ?? null,
        },
      });
    }

    const db = getDB(env);
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
      return Response.json({
        success: false,
        error: "Question not found",
      } satisfies ApiResponse<never>, { status: 404 });
    }

    const demoCorrect = demoQuestion
      ? (typeof demoQuestion.correctAnswer === "string" ? demoQuestion.correctAnswer : (demoQuestion.correctAnswer as string[])[0] ?? "a")
      : null;
    const correctAnswer = canonicalQuestion?.answer ?? demoCorrect ?? question?.answer ?? "";
    const rationale = canonicalQuestion?.rationale ?? demoQuestion?.rationale ?? question?.rationale ?? "";
    const distractorRationales = canonicalQuestion?.distractorRationales ?? demoQuestion?.distractorRationales ?? (
      question?.distractorRationales
        ? JSON.parse(question.distractorRationales)
        : null
    );
    const isCorrect = answersMatch(selectedAnswer, correctAnswer);

    // Skip DB write for demo sessions (they use non-UUID IDs and aren't in D1)
    if (!sessionId.startsWith("demo-")) {
      await recordAnswer(db, {
        sessionId,
        questionId,
        selectedAnswer,
        isCorrect,
        timeSpentMs,
      });
    }

    return Response.json({
      success: true,
      data: {
        correct: isCorrect,
        correctAnswer,
        rationale,
        distractorRationales,
        takeaway: canonicalQuestion?.takeaway ?? demoQuestion?.takeaway ?? null,
        visualRationale: canonicalQuestion?.visualRationale ?? null,
        diagramBlueprint: canonicalQuestion?.diagramBlueprint ?? null,
      },
    });

  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    console.error("quiz/answer error:", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
