import { NextRequest } from "next/server";
import { getQuestionById } from "@/lib/content-bank";
import { getDB, hasDatabase, isDemoMode, resolveEnv } from "@/lib/db";
import { questions } from "@chapai/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const practiceQuestionSchema = z.object({
  stem: z.string(),
  correctAnswer: z.union([z.string(), z.array(z.string()), z.record(z.string(), z.string())]).optional(),
  rationale: z.string(),
  category: z.string(),
  exam: z.enum(["ccrn", "nclex"]),
  takeaway: z.string().optional(),
  visualRationale: z.object({
    title: z.string(),
    caption: z.string().optional(),
    conclusion: z.string().optional(),
  }).optional(),
});

const schema = z.object({
  questionId: z.string(),
  question: practiceQuestionSchema.optional(),
  userMessage: z.string().max(500),
  context: z.enum(["rationale", "general"]).default("rationale"),
  selectedAnswer: z.string().optional(),
  answeredCorrectly: z.boolean().optional(),
  history: z.array(
    z.object({ role: z.enum(["user", "assistant"]), content: z.string() })
  ).max(5).default([]),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTutorCorrectAnswer(answer: z.infer<typeof practiceQuestionSchema>["correctAnswer"]) {
  if (!answer) return "unknown";
  if (Array.isArray(answer)) return answer.map((i) => i.toUpperCase()).join(", ");
  if (typeof answer === "object") return Object.entries(answer).map(([l, v]) => `${l}: ${v}`).join(" | ");
  return answer.toUpperCase();
}

function getPatternFrame(q: { exam: string; category: string; rationale: string; takeaway?: string }) {
  const b = `${q.exam} ${q.category} ${q.rationale}`.toLowerCase();
  if (b.match(/shock|map|cvp|perfus|cardiac|hemodynamic/)) return "hemodynamic priority: identify whether perfusion, pressure, or the pump is failing first";
  if (b.match(/vent|oxygen|respir|peep|fio2|plateau/)) return "ventilator pattern: decide whether oxygenation or ventilation is the main problem before changing settings";
  if (b.match(/delegate|priorit|safety/)) return "safety-priority pattern: unstable, newly changed, or high-risk patients stay with the RN";
  if (b.match(/pharm|med|anticoagul|insulin|glucose/)) return "medication-safety pattern: treat the life-threatening effect first, then correct the cause";
  if (b.match(/neuro|icp|cpp|neurolo/)) return "neuro perfusion pattern: protect cerebral perfusion while lowering intracranial pressure";
  return q.takeaway?.toLowerCase() ?? "find the one clue that changes the next safest action";
}

function getStudyTip(q: { exam: string; category: string }) {
  const b = `${q.exam} ${q.category}`.toLowerCase();
  if (b.includes("ccrn")) return "Build one-sheet pattern cards for shock, vents, drips, ICP, and electrolytes, then rehearse the first action aloud.";
  if (b.includes("deleg") || b.includes("priorit")) return "Drill one rule: stable routine task can be delegated; assessment, teaching, and unstable changes stay with the RN.";
  if (b.includes("pharm") || b.includes("anticoagul") || b.includes("insulin")) return "Make a med-safety ladder: dangerous effect, first stop action, reversal or rescue move, then monitoring target.";
  if (b.includes("respir") || b.includes("oxygen")) return "Separate oxygenation problems from ventilation problems before you touch settings; say the clue out loud each time.";
  return "After each miss, write the clue you overlooked and the exact action that should have come first.";
}

type TutorQuestion = {
  stem: string; answer: string; rationale: string; category: string;
  exam: "ccrn" | "nclex"; takeaway?: string;
  visualRationale?: { title: string; caption?: string; conclusion?: string };
  diagramBlueprint?: { title: string; focus: string };
};

function buildFallbackText(params: {
  question: TutorQuestion; context: string; selectedAnswer?: string; answeredCorrectly?: boolean;
}) {
  const { question: q, context, selectedAnswer, answeredCorrectly } = params;
  const keyClue = q.visualRationale?.conclusion ?? q.takeaway ?? q.rationale;
  const pattern = getPatternFrame(q);
  const studyTip = getStudyTip(q);
  const visualCue = q.diagramBlueprint?.focus ?? q.visualRationale?.caption ?? null;
  const repPrompt = context === "general"
    ? "What finding in the stem most strongly changes your next action?"
    : "Which clue in the stem points you toward the correct priority?";
  const trapLine = !answeredCorrectly && selectedAnswer
    ? `You likely over-valued ${selectedAnswer.toUpperCase()} before treating the highest-risk physiology first.`
    : "The common miss is choosing the answer that feels active instead of the one that fixes the most dangerous physiology first.";
  const confidenceLine = answeredCorrectly
    ? "Keep the same pattern, but make sure you can explain why the distractors lose."
    : "If this pattern shows up again, slow down long enough to name the unstable clue before you answer.";
  return [
    `Pattern: ${pattern}.`,
    `Winning move: ${q.answer.toUpperCase()} is correct because ${keyClue}`,
    `Pitfall: ${trapLine}`,
    `Next rep: ${repPrompt}`,
    `Study move: ${studyTip}${visualCue ? ` Use this visual frame: ${visualCue}` : ""}`,
    `Confidence check: ${confidenceLine}`,
  ].join(" ");
}

function streamFallback(text: string): Response {
  const encoder = new TextEncoder();
  const chunks = text.split(/\s+/).filter(Boolean);
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text: `${chunk} ` } })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" } },
  );
}

/**
 * Convert OpenRouter (OpenAI-compatible) SSE stream → Anthropic delta format
 * so the existing frontend parser works without changes.
 * OpenRouter: data: {"choices":[{"delta":{"content":"text"}}]}
 * Output:     data: {"delta":{"text":"text"}}
 */
function transformOpenRouterStream(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const raw = trimmed.slice(5).trim();
          if (raw === "[DONE]") { controller.enqueue(encoder.encode("data: [DONE]\n\n")); continue; }
          try {
            const text: string | undefined = JSON.parse(raw)?.choices?.[0]?.delta?.content;
            if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text } })}\n\n`));
          } catch { /* skip malformed chunk */ }
        }
      },
      flush(controller) {
        const raw = buffer.trim().startsWith("data:") ? buffer.trim().slice(5).trim() : buffer.trim();
        if (raw === "[DONE]") controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      },
    }),
  );
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const env = resolveEnv();
    const body = await req.json();
    const { questionId, question: practiceQuestion, userMessage, context, history, selectedAnswer, answeredCorrectly } =
      schema.parse(body);

    const localQuestion = getQuestionById(questionId);
    let question: TutorQuestion | null = null;

    if (hasDatabase(env)) {
      const db = getDB(env);
      const row = await db.select({
        stem: questions.stem, answer: questions.answer,
        rationale: questions.rationale, category: questions.category, exam: questions.exam,
      }).from(questions).where(eq(questions.id, questionId)).get() ?? null;
      if (row) question = { ...row, takeaway: localQuestion?.takeaway, visualRationale: localQuestion?.visualRationale, diagramBlueprint: localQuestion?.diagramBlueprint };
    }

    if (!question && localQuestion) {
      question = { stem: localQuestion.stem, answer: localQuestion.answer, rationale: localQuestion.rationale, category: localQuestion.category, exam: localQuestion.exam, takeaway: localQuestion.takeaway, visualRationale: localQuestion.visualRationale, diagramBlueprint: localQuestion.diagramBlueprint };
    }

    if (!question && practiceQuestion) {
      question = { stem: practiceQuestion.stem, answer: formatTutorCorrectAnswer(practiceQuestion.correctAnswer), rationale: practiceQuestion.rationale, category: practiceQuestion.category, exam: practiceQuestion.exam, takeaway: practiceQuestion.takeaway, visualRationale: practiceQuestion.visualRationale };
    }

    if (!question) return Response.json({ success: false, error: "Question not found" }, { status: 404 });

    // Demo mode or no key → use fast local fallback (zero API cost)
    if (isDemoMode(env) || !env.OPENROUTER_API_KEY) {
      return streamFallback(buildFallbackText({ question, context, selectedAnswer, answeredCorrectly }));
    }

    const systemPrompt = `You are a high-signal nursing education tutor for ${question.exam.toUpperCase()} exam prep.
The student is reviewing a ${question.category} question.
Question stem: ${question.stem}
Correct answer: ${question.answer}
Rationale: ${question.rationale}
Student selected: ${selectedAnswer ?? "unknown"} | Correct: ${answeredCorrectly ?? "unknown"}
Rules:
- Encouraging but clinically accurate. Never validate wrong thinking.
- Under 150 words. Short, high-yield, clinical.
- Structure: Pattern → Winning move → Pitfall → Next rep → Study move → Confidence check.
${question.takeaway ? `- Takeaway: ${question.takeaway}` : ""}
${question.visualRationale ? `- Visual: ${question.visualRationale.title}${question.visualRationale.conclusion ? ` — ${question.visualRationale.conclusion}` : ""}` : ""}
- Context: ${context}.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": env.NEXT_PUBLIC_APP_URL || "https://chapaisolutions.com",
        "X-Title": "ChapAI Tutor",
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL || "openrouter/auto",
        max_tokens: 200,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      console.error("OpenRouter error:", response.status);
      return streamFallback(buildFallbackText({ question, context, selectedAnswer, answeredCorrectly }));
    }

    return new Response(
      transformOpenRouterStream(response.body),
      { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" } },
    );
  } catch (err) {
    if (err instanceof z.ZodError) return Response.json({ success: false, error: "Invalid request" }, { status: 400 });
    console.error("tutor/ask error:", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
