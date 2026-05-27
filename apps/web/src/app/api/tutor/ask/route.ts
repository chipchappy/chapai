import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { questions } from "@chapai/db/schema";
import { getQuestionById } from "@/lib/content-bank";
import { getDB, hasDatabase, isDemoMode, resolveEnv } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { createRequestContext, log, logError } from "@/lib/logger";
import { getServerAccessContext } from "@/lib/server-access";
import { ACCESS_KEY_COOKIE } from "@/lib/access-keys";
import { recordTutorUsage } from "@/lib/tutor-usage";
import { getStudyResourcesForQuestion, type StudyResource } from "@/lib/study-resources";
import type { QuestionAnswer } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function readCookieValue(request: NextRequest, name: string) {
  const header = request.headers.get("cookie") ?? "";
  for (const pair of header.split(";")) {
    const [rawName, ...rest] = pair.split("=");
    if (rawName?.trim() === name) {
      return rest.join("=").trim();
    }
  }
  return request.cookies.get(name)?.value;
}

const practiceQuestionSchema = z.object({
  stem: z.string(),
  correctAnswer: z.union([z.string(), z.array(z.string()), z.record(z.string(), z.union([z.string(), z.array(z.string())]))]).optional(),
  rationale: z.string(),
  deepRationale: z.string().optional(),
  category: z.string(),
  exam: z.enum(["ccrn", "nclex"]),
  nclexClientNeed: z.string().optional(),
  cognitiveLevel: z.enum(["apply", "analyze", "synthesize", "evaluate"]).optional(),
  takeaway: z.string().optional(),
  speedCue: z.string().optional(),
  scenarioTitle: z.string().optional(),
  scenario: z.string().optional(),
  additionalInfo: z.string().optional(),
  exhibits: z.array(z.object({
    type: z.enum(["note", "timeline", "labs", "vitals", "orders", "assessment"]).optional(),
    title: z.string(),
    body: z.string().optional(),
    items: z.array(z.string()).optional(),
  })).optional(),
  matrixColumns: z.array(z.string()).optional(),
  matrixRows: z.array(z.object({
    label: z.string(),
    answer: z.string(),
  })).optional(),
  conceptNotes: z.array(z.string()).optional(),
  references: z.array(
    z.object({
      title: z.string(),
      citation: z.string().optional(),
      href: z.string().optional(),
    }),
  ).optional(),
  studyResources: z.array(z.object({
    kind: z.enum(["official", "clinical-reference", "video", "tool"]),
    title: z.string(),
    href: z.string(),
    source: z.string(),
    topic: z.string(),
    free: z.literal(true),
    why: z.string(),
  })).optional(),
  coachingFrame: z.array(z.string()).optional(),
  visualRationale: z.object({
    title: z.string(),
    caption: z.string().optional(),
    conclusion: z.string().optional(),
  }).optional(),
  diagramBlueprint: z.object({
    title: z.string(),
    focus: z.string(),
  }).optional(),
});

const schema = z.object({
  questionId: z.string(),
  question: practiceQuestionSchema.optional(),
  userMessage: z.string().max(500),
  context: z.enum(["rationale", "general"]).default("rationale"),
  selectedAnswer: z.union([z.string(), z.array(z.string()), z.record(z.string(), z.union([z.string(), z.array(z.string())]))]).optional(),
  answeredCorrectly: z.boolean().optional(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(5).default([]),
});

type TutorQuestion = {
  stem: string;
  answer: QuestionAnswer;
  rationale: string;
  deepRationale?: string;
  category: string;
  exam: "ccrn" | "nclex";
  nclexClientNeed?: string;
  cognitiveLevel?: "apply" | "analyze" | "synthesize" | "evaluate";
  takeaway?: string;
  speedCue?: string;
  exhibits?: Array<{ type?: string; title: string; body?: string; items?: string[] }>;
  conceptNotes?: string[];
  references?: Array<{ title: string; citation?: string; href?: string }>;
  studyResources?: StudyResource[];
  visualRationale?: { title: string; caption?: string; conclusion?: string };
  diagramBlueprint?: { title: string; focus: string };
  coachingFrame?: string[];
};

function formatTutorCorrectAnswer(answer: QuestionAnswer | z.infer<typeof practiceQuestionSchema>["correctAnswer"]) {
  if (!answer) return "unknown";
  if (Array.isArray(answer)) return answer.map((item) => item.toUpperCase()).join(", ");
  if (typeof answer === "object") {
    return Object.entries(answer)
      .map(([label, value]) => `${label}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join(" | ");
  }
  return answer.toUpperCase();
}

function getPatternFrame(q: { exam: string; category: string; rationale: string; takeaway?: string }) {
  const blob = `${q.exam} ${q.category} ${q.rationale}`.toLowerCase();
  if (blob.match(/shock|map|cvp|perfus|cardiac|hemodynamic/)) return "hemodynamic priority: identify whether perfusion, pressure, or the pump is failing first";
  if (blob.match(/vent|oxygen|respir|peep|fio2|plateau/)) return "ventilator pattern: decide whether oxygenation or ventilation is the main problem before changing settings";
  if (blob.match(/delegate|priorit|safety/)) return "safety-priority pattern: unstable, newly changed, or high-risk patients stay with the RN";
  if (blob.match(/pharm|med|anticoagul|insulin|glucose/)) return "medication-safety pattern: treat the life-threatening effect first, then correct the cause";
  if (blob.match(/neuro|icp|cpp|neurolo/)) return "neuro perfusion pattern: protect cerebral perfusion while lowering intracranial pressure";
  return q.takeaway?.toLowerCase() ?? "find the one clue that changes the next safest action";
}

function getStudyTip(q: { exam: string; category: string }) {
  const blob = `${q.exam} ${q.category}`.toLowerCase();
  if (blob.includes("ccrn")) return "Build one-sheet pattern cards for shock, vents, drips, ICP, and electrolytes, then rehearse the first action aloud.";
  if (blob.includes("deleg") || blob.includes("priorit")) return "Drill one rule: stable routine task can be delegated; assessment, teaching, and unstable changes stay with the RN.";
  if (blob.includes("pharm") || blob.includes("anticoagul") || blob.includes("insulin")) return "Make a med-safety ladder: dangerous effect, first stop action, reversal or rescue move, then monitoring target.";
  if (blob.includes("respir") || blob.includes("oxygen")) return "Separate oxygenation problems from ventilation problems before changing settings; say the clue out loud each time.";
  return "After each miss, write the clue you overlooked and the exact action that should have come first.";
}

function mergeStudyResources(...groups: Array<StudyResource[] | undefined>) {
  const seen = new Set<string>();
  return groups.flatMap((group) => group ?? []).filter((resource) => {
    const key = `${resource.kind}:${resource.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}

function buildFallbackText(params: {
  question: TutorQuestion;
  context: string;
  selectedAnswer?: QuestionAnswer;
  answeredCorrectly?: boolean;
}) {
  const { question, context, selectedAnswer, answeredCorrectly } = params;
  const keyClue = question.visualRationale?.conclusion ?? question.takeaway ?? question.deepRationale ?? question.rationale;
  const pattern = getPatternFrame(question);
  const studyTip = getStudyTip(question);
  const visualCue = question.diagramBlueprint?.focus ?? question.visualRationale?.caption ?? null;
  const coachingMove = question.coachingFrame?.[0] ?? null;
  const referenceLine = question.references?.[0]?.citation ?? question.references?.[0]?.title ?? null;
  const resourceLine = question.studyResources?.find((resource) => resource.kind === "official" || resource.kind === "clinical-reference");
  const speedCue = question.speedCue ?? null;
  const repPrompt = context === "general"
    ? "What finding in the stem most strongly changes your next action?"
    : "Which clue in the stem points you toward the correct priority?";
  const trapLine = !answeredCorrectly && selectedAnswer
    ? `You likely over-valued ${formatTutorCorrectAnswer(selectedAnswer)} before treating the highest-risk physiology first.`
    : "The common miss is choosing the answer that feels active instead of the one that fixes the most dangerous physiology first.";
  const confidenceLine = answeredCorrectly
    ? "Keep the same pattern, but make sure you can explain why the distractors lose."
    : "If this pattern shows up again, slow down long enough to name the unstable clue before you answer.";

  return [
    `Pattern: ${pattern}.`,
    `Winning move: ${formatTutorCorrectAnswer(question.answer)} is correct because ${keyClue}`,
    `Pitfall: ${trapLine}`,
    `Next rep: ${repPrompt}`,
    `Study move: ${studyTip}${speedCue ? ` Fast clue: ${speedCue}.` : ""}${visualCue ? ` Use this visual frame: ${visualCue}` : ""}${coachingMove ? ` Coaching cue: ${coachingMove}.` : ""}${referenceLine ? ` Anchor this with ${referenceLine}.` : ""}${resourceLine ? ` Free follow-up: ${resourceLine.title} from ${resourceLine.source}.` : ""}`,
    `Confidence check: ${confidenceLine}`,
  ].join(" ");
}

function streamFallback(text: string) {
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
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    },
  );
}


export async function POST(req: NextRequest) {
  const requestContext = createRequestContext(req, { route: "/api/tutor/ask" });

  try {
    const env = resolveEnv();
    let access = {
      source: "none",
      canUseTutor: false,
    } as { source: string; canUseTutor: boolean };
    let user = null;
    let previewAccess = false;
    const previewCookie = readCookieValue(req, ACCESS_KEY_COOKIE);
    logError("Tutor access bootstrap", { previewCookie: Boolean(previewCookie) }, requestContext);

    if (previewCookie) {
      previewAccess = true;
      access.canUseTutor = true;
      access.source = "founder-key";
    }

    if (!previewAccess) {
      try {
        const accessContext = await getServerAccessContext();
        access = accessContext.access;
        user = accessContext.user;
        previewAccess = access.source === "founder-key" || access.source === "preview-key";
      } catch (error) {
        logError("Tutor access context failed", error, requestContext);
      }
    }

    if (!user?.id && !previewAccess) {
      return jsonError(401, "AUTH_REQUIRED", "Sign in before using the AI tutor.", {
        ...requestContext,
        loginUrl: `/auth/login?next=${encodeURIComponent("/quiz")}`,
      }, { requestId: requestContext.requestId });
    }

    if (!access.canUseTutor) {
      return jsonError(403, "PREMIUM_REQUIRED", "Tutor access requires an active premium entitlement.", requestContext, {
        requestId: requestContext.requestId,
      });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      logError("Tutor validation failed; serving fallback", parsed.error, requestContext);
      return streamFallback("Pattern: use the written rationale first. Winning move: the approved tutor source for this question is not available yet. Pitfall: do not trust a guessed explanation. Next rep: reopen the item from the live bank and try again. Study move: stay with the curated rationale and references. Confidence check: if the source content is missing, pause tutor review and use the main explanation.");
    }
    const { questionId, question: practiceQuestion, userMessage, context, history, selectedAnswer, answeredCorrectly } = parsed.data;

    let localQuestion = null as ReturnType<typeof getQuestionById>;
    try {
      localQuestion = getQuestionById(questionId);
    } catch (error) {
      logError("Tutor canonical question lookup failed", error, requestContext);
    }
    const localStudyResources = (localQuestion as { studyResources?: StudyResource[] } | null)?.studyResources;
    let question: TutorQuestion | null = null;
    let db = null as ReturnType<typeof getDB> | null;

    if (hasDatabase(env)) {
      db = getDB(env);
      try {
        const row = await db
          .select({
            stem: questions.stem,
            answer: questions.answer,
            rationale: questions.rationale,
            category: questions.category,
            exam: questions.exam,
          })
          .from(questions)
          .where(eq(questions.id, questionId))
          .get() ?? null;

        if (row) {
          question = {
            ...row,
            deepRationale: localQuestion?.deepRationale,
            takeaway: localQuestion?.takeaway,
            nclexClientNeed: localQuestion?.nclexClientNeed,
            cognitiveLevel: localQuestion?.cognitiveLevel,
            exhibits: localQuestion?.exhibits,
            conceptNotes: localQuestion?.conceptNotes,
            references: localQuestion?.references,
            studyResources: localStudyResources,
            visualRationale: localQuestion?.visualRationale,
            diagramBlueprint: localQuestion?.diagramBlueprint,
            coachingFrame: localQuestion?.coachingFrame,
          };
        }
      } catch (error) {
        logError("Tutor runtime question lookup failed", error, requestContext);
      }
    }

    if (!question && localQuestion) {
      question = {
        stem: localQuestion.stem,
        answer: localQuestion.answer,
        rationale: localQuestion.rationale,
        deepRationale: localQuestion.deepRationale,
        category: localQuestion.category,
        exam: localQuestion.exam,
        nclexClientNeed: localQuestion.nclexClientNeed,
        cognitiveLevel: localQuestion.cognitiveLevel,
        takeaway: localQuestion.takeaway,
        speedCue: localQuestion.speedCue,
        exhibits: localQuestion.exhibits,
        conceptNotes: localQuestion.conceptNotes,
        references: localQuestion.references,
        studyResources: localStudyResources,
        visualRationale: localQuestion.visualRationale,
        diagramBlueprint: localQuestion.diagramBlueprint,
        coachingFrame: localQuestion.coachingFrame,
      };
    }

    logError("Tutor question resolution", { resolved: Boolean(question), previewAccess, hasUser: Boolean(user?.id) }, requestContext);

    if (!question && practiceQuestion) {
      question = {
        stem: practiceQuestion.stem,
        answer: formatTutorCorrectAnswer(practiceQuestion.correctAnswer),
        rationale: practiceQuestion.rationale,
        deepRationale: practiceQuestion.deepRationale,
        category: practiceQuestion.category,
        exam: practiceQuestion.exam,
        nclexClientNeed: practiceQuestion.nclexClientNeed,
        cognitiveLevel: practiceQuestion.cognitiveLevel,
        takeaway: practiceQuestion.takeaway,
        speedCue: practiceQuestion.speedCue,
        exhibits: practiceQuestion.exhibits,
        conceptNotes: practiceQuestion.conceptNotes,
        visualRationale: practiceQuestion.visualRationale,
        references: practiceQuestion.references ?? [],
        studyResources: practiceQuestion.studyResources,
        coachingFrame: practiceQuestion.coachingFrame,
        diagramBlueprint: practiceQuestion.diagramBlueprint,
      };
    }

    if (!question) {
      return streamFallback(
        "Pattern: use the written rationale first. Winning move: the approved tutor source for this question is not available yet. Pitfall: do not trust a guessed explanation. Next rep: reopen the item from the live bank and try again. Study move: stay with the curated rationale and references. Confidence check: if the source content is missing, pause tutor review and use the main explanation.",
      );
    }

    question.studyResources = mergeStudyResources(question.studyResources, getStudyResourcesForQuestion(question));

    if (!question.rationale || !question.stem || !question.answer) {
      return streamFallback("I do not have enough approved source material on this item to give a reliable tutor explanation yet. Please use the written rationale first.");
    }

    if (db && user?.id) {
      try {
        await recordTutorUsage(db, user.id);
      } catch (error) {
        logError("Tutor usage tracking failed; continuing", error, requestContext);
      }
    }

    const systemPrompt = `You are a high-signal nursing education tutor for ${question.exam.toUpperCase()} exam prep.
The student is reviewing a ${question.category} question.
Question stem: ${question.stem}
Correct answer: ${formatTutorCorrectAnswer(question.answer)}
Rationale: ${question.rationale}
Student selected: ${selectedAnswer ? formatTutorCorrectAnswer(selectedAnswer) : "unknown"} | Correct: ${answeredCorrectly ?? "unknown"}
Rules:
- Encouraging but clinically accurate. Never validate wrong thinking.
- Under 150 words. Short, high-yield, clinical.
- Structure: Pattern -> Winning move -> Pitfall -> Next rep -> Study move -> Confidence check.
${question.takeaway ? `- Takeaway: ${question.takeaway}` : ""}
${question.speedCue ? `- Speed cue: ${question.speedCue}` : ""}
${question.conceptNotes?.length ? `- Concept notes: ${question.conceptNotes.join(" | ")}` : ""}
${question.references?.length ? `- References: ${question.references.map((item) => item.citation ?? item.title).join(" | ")}` : ""}
${question.studyResources?.length ? `- Free study resources: ${question.studyResources.map((item) => `${item.title} (${item.source}) - ${item.href}`).join(" | ")}` : ""}
${question.visualRationale ? `- Visual: ${question.visualRationale.title}${question.visualRationale.conclusion ? ` - ${question.visualRationale.conclusion}` : ""}` : ""}
${question.coachingFrame?.length ? `- Coaching frame: ${question.coachingFrame.join(" | ")}` : ""}
- Context: ${context}.`;

    const apiKey = (env as Record<string, unknown>).ANTHROPIC_API_KEY as string | undefined;

    if (isDemoMode(env) || !apiKey) {
      return streamFallback(buildFallbackText({ question, context, selectedAnswer, answeredCorrectly }));
    }

    let AnthropicModule: typeof import("@anthropic-ai/sdk").default;
    try {
      ({ default: AnthropicModule } = await import("@anthropic-ai/sdk"));
    } catch (error) {
      logError("Tutor provider import failed; serving fallback", error, requestContext);
      return streamFallback(buildFallbackText({ question, context, selectedAnswer, answeredCorrectly }));
    }

    const client = new AnthropicModule({ apiKey });

    let anthropicStream: Awaited<ReturnType<typeof client.messages.stream>>;
    try {
      anthropicStream = client.messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...history,
          { role: "user", content: userMessage },
        ],
      });
    } catch (error) {
      logError("Tutor Anthropic stream init failed; serving fallback", error, requestContext);
      return streamFallback(buildFallbackText({ question, context, selectedAnswer, answeredCorrectly }));
    }

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of anthropicStream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text: chunk.delta.text } })}\n\n`));
            }
          }
        } catch (error) {
          logError("Tutor Anthropic stream error; closing", error, requestContext);
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return streamFallback("Pattern: use the written rationale first. Winning move: the tutor request was incomplete, so use the curated explanation on the page. Pitfall: do not guess from a partial prompt. Next rep: reload the item and try the tutor again. Study move: rely on the live rationale and references. Confidence check: if the source content is incomplete, pause and use the main explanation.");
    }

    logError("tutor/ask error; serving fallback", error, requestContext);
    return streamFallback("Pattern: use the written rationale first. Winning move: the tutor source could not be loaded cleanly this time, so lean on the curated explanation. Pitfall: do not trust a guessed explanation. Next rep: reopen the item from the live bank and try again. Study move: stay with the approved rationale and references. Confidence check: if the source content is missing, pause tutor review and use the main explanation.");
  }
}
