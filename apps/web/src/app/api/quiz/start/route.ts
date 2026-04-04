import { NextRequest } from "next/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { startLocalSession } from "@/lib/local-quiz-store";
import { selectQuestions, createSession } from "@/lib/quiz-engine";
import { getStandardPreviewDeck } from "@/lib/practice-data";
import type { QuizSessionConfig, ApiResponse, QuizQuestion } from "@/lib/types";
import { z } from "zod";

/** Build a demo-backed response when the live bank is empty */
function demoFallback(exam: "nclex" | "ccrn", count: number) {
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
  count:    z.union([
    z.literal(5), z.literal(10), z.literal(20), z.literal(25), z.literal(50), z.literal(75), z.literal(100)
  ]).default(10),
});


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config = schema.parse(body) as QuizSessionConfig;

    const env = resolveEnv();

    if (!hasDatabase(env)) {
      const local = startLocalSession(config);
      if (local) {
        return Response.json({ success: true, data: local } satisfies ApiResponse<typeof local>);
      }
      // Fall back to in-memory demo deck
      const fallback = demoFallback(config.exam, config.count ?? 10);
      return Response.json({ success: true, data: fallback });
    }

    const db = getDB(env);
    const questionList = await selectQuestions(db, config);

    if (questionList.length === 0) {
      // Fall back to in-memory demo deck so the practice center always works
      const fallback = demoFallback(config.exam, config.count ?? 10);
      return Response.json({ success: true, data: fallback });
    }

    // TODO: get userId from session when auth is wired up
    const userId = undefined;

    const sessionId = await createSession(db, userId, config, questionList);

    return Response.json({
      success: true,
      data: { sessionId, questions: questionList },
    } satisfies ApiResponse<{ sessionId: string; questions: typeof questionList }>);

  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({
        success: false,
        error: "Invalid request",
        code: "VALIDATION_ERROR",
      } satisfies ApiResponse<never>, { status: 400 });
    }
    console.error("quiz/start error:", err);
    return Response.json({
      success: false,
      error: "Internal server error",
    } satisfies ApiResponse<never>, { status: 500 });
  }
}
