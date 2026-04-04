import { NextRequest } from "next/server";
import { getQuestionById } from "@/lib/content-bank";
import { getDB, hasDatabase, resolveEnv } from "@/lib/db";
import { questions } from "@chapai/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

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
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ).max(5).default([]),
});

function formatTutorCorrectAnswer(answer: z.infer<typeof practiceQuestionSchema>["correctAnswer"]) {
  if (!answer) {
    return "unknown";
  }

  if (Array.isArray(answer)) {
    return answer.map((item) => item.toUpperCase()).join(", ");
  }

  if (typeof answer === "object") {
    return Object.entries(answer)
      .map(([label, value]) => `${label}: ${value}`)
      .join(" | ");
  }

  return answer.toUpperCase();
}

function getPatternFrame(question: {
  exam: "ccrn" | "nclex";
  category: string;
  rationale: string;
  takeaway?: string;
}) {
  const bucket = `${question.exam} ${question.category} ${question.rationale}`.toLowerCase();

  if (bucket.match(/shock|map|cvp|perfus|cardiac|hemodynamic/)) {
    return "hemodynamic priority: identify whether perfusion, pressure, or the pump is failing first";
  }
  if (bucket.match(/vent|oxygen|respir|peep|fio2|plateau/)) {
    return "ventilator pattern: decide whether oxygenation or ventilation is the main problem before changing settings";
  }
  if (bucket.match(/delegate|priorit|safety/)) {
    return "safety-priority pattern: unstable, newly changed, or high-risk patients stay with the RN";
  }
  if (bucket.match(/pharm|med|anticoagul|insulin|glucose/)) {
    return "medication-safety pattern: treat the life-threatening effect first, then correct the cause";
  }
  if (bucket.match(/neuro|icp|cpp|neurolo/)) {
    return "neuro perfusion pattern: protect cerebral perfusion while lowering intracranial pressure";
  }

  return question.takeaway?.toLowerCase() ?? "find the one clue that changes the next safest action";
}

function getStudyTip(question: { exam: "ccrn" | "nclex"; category: string }) {
  const bucket = `${question.exam} ${question.category}`.toLowerCase();

  if (bucket.includes("ccrn")) {
    return "Build one-sheet pattern cards for shock, vents, drips, ICP, and electrolytes, then rehearse the first action aloud.";
  }
  if (bucket.includes("deleg") || bucket.includes("priorit")) {
    return "Drill one rule: stable routine task can be delegated; assessment, teaching, and unstable changes stay with the RN.";
  }
  if (bucket.includes("pharm") || bucket.includes("anticoagul") || bucket.includes("insulin")) {
    return "Make a med-safety ladder: dangerous effect, first stop action, reversal or rescue move, then monitoring target.";
  }
  if (bucket.includes("respir") || bucket.includes("oxygen")) {
    return "Separate oxygenation problems from ventilation problems before you touch settings; say the clue out loud each time.";
  }

  return "After each miss, write the clue you overlooked and the exact action that should have come first.";
}

function buildFallbackTutorText(params: {
  question: {
    stem: string;
    answer: string;
    rationale: string;
    category: string;
    exam: "ccrn" | "nclex";
    takeaway?: string;
    visualRationale?: {
      title: string;
      caption?: string;
      conclusion?: string;
    };
    diagramBlueprint?: {
      title: string;
      focus: string;
    };
  };
  userMessage: string;
  context: "rationale" | "general";
  selectedAnswer?: string;
  answeredCorrectly?: boolean;
}) {
  const { question, context, selectedAnswer, answeredCorrectly } = params;
  const keyClue = question.visualRationale?.conclusion ?? question.takeaway ?? question.rationale;
  const pattern = getPatternFrame(question);
  const studyTip = getStudyTip(question);
  const visualCue = question.diagramBlueprint?.focus ?? question.visualRationale?.caption ?? null;
  const repPrompt =
    context === "general"
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
    `Winning move: ${question.answer.toUpperCase()} is correct because ${keyClue}`,
    `Pitfall: ${trapLine}`,
    `Next rep: ${repPrompt}`,
    `Study move: ${studyTip}${visualCue ? ` Use this visual frame: ${visualCue}` : ""}`,
    `Confidence check: ${confidenceLine}`,
  ].join(" ");
}

function streamTextEvent(text: string) {
  const encoder = new TextEncoder();
  const chunks = text.split(/\s+/).filter(Boolean);

  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        const payload = `data: ${JSON.stringify({ delta: { text: `${chunk} ` } })}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const env = resolveEnv();
    const body = await req.json();
    const { questionId, question: practiceQuestion, userMessage, context, history, selectedAnswer, answeredCorrectly } = schema.parse(body);
    const localQuestion = getQuestionById(questionId);

    let question:
      | {
          stem: string;
          answer: string;
          rationale: string;
          category: string;
          exam: "ccrn" | "nclex";
          takeaway?: string;
          visualRationale?: {
            title: string;
            caption?: string;
            conclusion?: string;
          };
          diagramBlueprint?: {
            title: string;
            focus: string;
          };
        }
      | null = null;

    if (hasDatabase(env)) {
      const db = getDB(env);
      const dbQuestion = (await db
        .select({
          stem: questions.stem,
          answer: questions.answer,
          rationale: questions.rationale,
          category: questions.category,
          exam: questions.exam,
        })
        .from(questions)
        .where(eq(questions.id, questionId))
        .get()) ?? null;

      if (dbQuestion) {
        question = {
          ...dbQuestion,
          takeaway: localQuestion?.takeaway,
          visualRationale: localQuestion?.visualRationale
            ? {
                title: localQuestion.visualRationale.title,
                caption: localQuestion.visualRationale.caption,
                conclusion: localQuestion.visualRationale.conclusion,
              }
            : undefined,
          diagramBlueprint: localQuestion?.diagramBlueprint
            ? {
                title: localQuestion.diagramBlueprint.title,
                focus: localQuestion.diagramBlueprint.focus,
              }
            : undefined,
        };
      }
    }

    if (!question) {
      if (localQuestion) {
        question = {
          stem: localQuestion.stem,
          answer: localQuestion.answer,
          rationale: localQuestion.rationale,
          category: localQuestion.category,
          exam: localQuestion.exam,
          takeaway: localQuestion.takeaway,
          visualRationale: localQuestion.visualRationale
            ? {
                title: localQuestion.visualRationale.title,
                caption: localQuestion.visualRationale.caption,
                conclusion: localQuestion.visualRationale.conclusion,
              }
            : undefined,
          diagramBlueprint: localQuestion.diagramBlueprint
            ? {
                title: localQuestion.diagramBlueprint.title,
                focus: localQuestion.diagramBlueprint.focus,
              }
            : undefined,
        };
      }
    }

    if (!question && practiceQuestion) {
      question = {
        stem: practiceQuestion.stem,
        answer: formatTutorCorrectAnswer(practiceQuestion.correctAnswer),
        rationale: practiceQuestion.rationale,
        category: practiceQuestion.category,
        exam: practiceQuestion.exam,
        takeaway: practiceQuestion.takeaway,
        visualRationale: practiceQuestion.visualRationale,
      };
    }

    if (!question) {
      return Response.json({ success: false, error: "Question not found" }, { status: 404 });
    }

    const takeawayRule = question.takeaway
      ? `Keep this takeaway in view: ${question.takeaway}`
      : "Summarize the single most important takeaway when it helps.";
    const visualRule = question.visualRationale
      ? `Use this teaching visual if it helps: ${question.visualRationale.title}${question.visualRationale.conclusion ? ` - ${question.visualRationale.conclusion}` : ""}.`
      : "Describe the physiologic pattern clearly when a mental picture would help.";
    const blueprintRule = question.diagramBlueprint
      ? `If the learner is stuck, teach from this diagram blueprint: ${question.diagramBlueprint.title} - ${question.diagramBlueprint.focus}.`
      : "Add one concrete visual frame when it would help the learner see the pattern faster.";

    const systemPrompt = `You are a high-signal nursing education tutor for ${question.exam.toUpperCase()} exam prep.

The student is reviewing a ${question.category} question.
Question stem: ${question.stem}
Correct answer: ${question.answer}
Rationale: ${question.rationale}
Student selected answer: ${selectedAnswer ?? "unknown"}
Student answered correctly: ${answeredCorrectly ?? "unknown"}

Rules:
- Be encouraging but clinically accurate. Never validate wrong thinking.
- Use guided coaching - ask one useful question when it helps, but do not be vague.
- Keep responses under 170 words. Short, high-yield, clinical.
- Reference specific values or findings from the question when relevant.
- If asked about a wrong answer, explain the clinical reasoning clearly.
- Build around this structure when possible:
  Pattern: <what kind of problem this is>
  Winning move: <why the correct answer wins>
  Pitfall: <what wrong pattern or trap to avoid>
  Next rep: <what clue to look for next time>
  Study move: <one concrete way to remember or practice>
  Confidence check: <one line on how to know they truly understand it>
- When the student missed the question, name the likely trap in one sentence.
- End with one concrete study action, not generic encouragement.
- ${takeawayRule}
- ${visualRule}
- ${blueprintRule}
- Current context mode: ${context}.`;

    if (!env.ANTHROPIC_API_KEY) {
      return new Response(
        streamTextEvent(
          buildFallbackTutorText({
            question,
            userMessage,
            context,
            selectedAnswer,
            answeredCorrectly,
          }),
        ),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
          },
        },
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "messages-2023-12-15",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          ...history,
          { role: "user" as const, content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      return new Response(
        streamTextEvent(
          buildFallbackTutorText({
            question,
            userMessage,
            context,
            selectedAnswer,
            answeredCorrectly,
          }),
        ),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
          },
        },
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ success: false, error: "Invalid request" }, { status: 400 });
    }
    console.error("tutor/ask error:", err);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
