import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { questions } from "@chapai/db/schema";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { mapQuestionRowToQuizQuestion } from "@/lib/quiz-engine";
import { createRequestContext } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "private, no-store", Pragma: "no-cache" },
  });
}

// Lightweight single-question fetch used by deep links:
//   * QOTD email → /quiz?question=<id>
//   * Dashboard tutor follow-up → /quiz?tutorQuestion=<id>
//
// Returns the published question shape needed to launch a 1-item client session.
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const requestContext = createRequestContext(_request, { route: "/api/quiz/question/[id]" });
  void requestContext;

  if (!id || id.length > 96 || !/^[a-z0-9_\-:.]+$/i.test(id)) {
    return json(400, { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid question id" } });
  }

  const env = resolveEnv();
  if (!hasDatabase(env)) {
    return json(503, { success: false, error: { code: "STORAGE_UNAVAILABLE", message: "Question store offline" } });
  }

  try {
    const db = getDB(env);
    const row = await db
      .select({
        id: questions.id,
        exam: questions.exam,
        type: questions.type,
        category: questions.category,
        subcategory: questions.subcategory,
        difficulty: questions.difficulty,
        stem: questions.stem,
        options: questions.options,
        answer: questions.answer,
        rationale: questions.rationale,
        distractorRationales: questions.distractorRationales,
        tags: questions.tags,
        blueprintPct: questions.blueprintPct,
        conceptNotes: questions.conceptNotes,
        provenance: questions.provenance,
        reviewStatus: questions.reviewStatus,
        revision: questions.revision,
        publishState: questions.publishState,
        scenarioTitle: questions.scenarioTitle,
        scenario: questions.scenario,
        additionalInfo: questions.additionalInfo,
        exhibits: questions.exhibits,
        chartReview: questions.chartReview,
        matrixColumns: questions.matrixColumns,
        matrixRows: questions.matrixRows,
        visualRationale: questions.visualRationale,
        referencesJson: questions.referencesJson,
        correctOrder: questions.correctOrder,
      })
      .from(questions)
      .where(eq(questions.id, id))
      .get();

    if (!row) {
      return json(404, { success: false, error: { code: "QUESTION_NOT_FOUND", message: "Question not found" } });
    }
    if (row.publishState && row.publishState !== "published") {
      return json(404, { success: false, error: { code: "QUESTION_NOT_AVAILABLE", message: "Question not available" } });
    }

    const question = mapQuestionRowToQuizQuestion(row);
    return json(200, { success: true, data: { question } });
  } catch {
    return json(500, { success: false, error: { code: "QUESTION_FETCH_FAILED", message: "Could not load question" } });
  }
}
