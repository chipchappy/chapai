import { NextRequest } from "next/server";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { resultsForLocalSession } from "@/lib/local-quiz-store";
import { getResults } from "@/lib/quiz-engine";
import type { ApiResponse, QuizResults } from "@/lib/types";


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return Response.json(
        { success: false, error: "sessionId is required" } satisfies ApiResponse<never>,
        { status: 400 }
      );
    }

    const env = resolveEnv();

    if (!hasDatabase(env)) {
      const results = resultsForLocalSession(sessionId);
      if (!results) {
        return Response.json(
          { success: false, error: "Session not found" } satisfies ApiResponse<never>,
          { status: 404 }
        );
      }
      return Response.json({ success: true, data: results } satisfies ApiResponse<QuizResults>);
    }

    const db = getDB(env);
    const results = await getResults(db, sessionId);

    return Response.json({ success: true, data: results } satisfies ApiResponse<QuizResults>);

  } catch (err) {
    console.error("quiz/results error:", err);
    return Response.json(
      { success: false, error: "Internal server error" } satisfies ApiResponse<never>,
      { status: 500 }
    );
  }
}
