import { getQuestionBank } from "@/lib/content-bank";
import { CCRN_CATEGORIES, NCLEX_CATEGORIES, type Exam, type QuizQuestion } from "@/lib/types";
import { getPracticeExamDefinitions, getStandardPreviewDeck } from "@/lib/practice-data";
import type { PracticeExamDefinition, PracticeQuestion } from "@/lib/practice-types";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ examId: string }>;
};

const examIdSchema = z.enum(["nclex-sim-1", "nclex-sim-2", "nclex-sim-3", "ccrn-sim-1", "ccrn-sim-2"]);

function mapLiveQuestion(question: QuizQuestion): PracticeQuestion {
  const correctAnswer =
    question.type === "sata"
      ? (() => {
          try {
            const parsed = JSON.parse(question.answer);
            return Array.isArray(parsed) ? parsed : [question.answer];
          } catch {
            return [question.answer];
          }
        })()
      : question.answer;

  return {
    id: question.id,
    exam: question.exam,
    category: question.category,
    difficulty: question.difficulty,
    mode: "practice-exam",
    kind: question.type === "sata" ? "multi-select" : question.type === "matrix" ? "matrix" : "mcq",
    stem: question.stem,
    options: question.options.map((option) => ({ id: option.id, text: option.text })),
    correctAnswer,
    rationale: question.rationale,
    distractorRationales: question.distractorRationales,
    takeaway: question.takeaway,
    source: "live",
    visualRationale: question.visualRationale,
  };
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string) {
  let state = hashSeed(seed) || 1;
  return () => {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: string) {
  const random = seededRandom(seed);
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function getBlueprint(exam: Exam) {
  return exam === "ccrn"
    ? Object.fromEntries(Object.entries(CCRN_CATEGORIES).map(([, value]) => [value.label, value.pct]))
    : Object.fromEntries(Object.entries(NCLEX_CATEGORIES).map(([, value]) => [value.label, value.pct]));
}

function selectByBlueprint(
  questions: PracticeQuestion[],
  blueprint: Record<string, number>,
  count: number,
  seed: string,
  reservedIds: Set<string> = new Set(),
) {
  const buckets = new Map<string, PracticeQuestion[]>();

  for (const question of questions) {
    const bucket = buckets.get(question.category) ?? [];
    bucket.push(question);
    buckets.set(question.category, bucket);
  }

  const selected: PracticeQuestion[] = [];
  const usedInManifest = new Set<string>();

  for (const [category, pct] of Object.entries(blueprint)) {
    const target = Math.max(1, Math.round((pct / 100) * count));
    const bucket = seededShuffle(buckets.get(category) ?? [], `${seed}:${category}`).filter(
      (question) => !reservedIds.has(question.id) && !usedInManifest.has(question.id),
    );
    for (const question of bucket.slice(0, target)) {
      usedInManifest.add(question.id);
      selected.push(question);
    }
  }

  if (selected.length < count) {
    const remainder = seededShuffle(
      questions.filter((question) => !reservedIds.has(question.id) && !usedInManifest.has(question.id)),
      `${seed}:remainder`,
    );
    for (const question of remainder.slice(0, count - selected.length)) {
      usedInManifest.add(question.id);
      selected.push(question);
    }
  }

  if (selected.length < count) {
    const overflow = seededShuffle(questions.filter((question) => !usedInManifest.has(question.id)), `${seed}:overflow`);
    for (const question of overflow.slice(0, count - selected.length)) {
      usedInManifest.add(question.id);
      selected.push(question);
    }
  }

  return seededShuffle(selected, `${seed}:final`).slice(0, count);
}

function buildManifestIndex(exam: Exam) {
  const definitions = getPracticeExamDefinitions();
  const liveQuestions = getQuestionBank(exam);
  // Fall back to demo standard deck when live bank is empty
  const livePracticeQuestions = liveQuestions.length > 0
    ? liveQuestions.map(mapLiveQuestion)
    : getStandardPreviewDeck().filter((q) => q.exam === exam).map((q) => ({ ...q, mode: "practice-exam" as const }));
  const blueprint = getBlueprint(exam);
  const reservedIds = new Set<string>();
  const manifestIndex = new Map<string, { definition: PracticeExamDefinition; questions: PracticeQuestion[] }>();

  for (const definition of definitions.filter((item) => item.exam === exam)) {
    const questions = selectByBlueprint(livePracticeQuestions, blueprint, definition.length, definition.seed, reservedIds);
    for (const question of questions) {
      reservedIds.add(question.id);
    }

    manifestIndex.set(definition.id, {
      definition,
      questions,
    });
  }

  return manifestIndex;
}

function buildManifest(examId: string) {
  const definitions = getPracticeExamDefinitions();
  const definition = definitions.find((item) => item.id === examId);
  if (!definition) {
    return null;
  }

  const manifestIndex = buildManifestIndex(definition.exam);
  return manifestIndex.get(examId) ?? null;
}

export async function GET(_: Request, context: RouteContext) {
  const { examId } = await context.params;
  const parsed = examIdSchema.safeParse(examId);

  if (!parsed.success) {
    return Response.json({ success: false, error: "Unknown practice exam" }, { status: 404 });
  }

  const manifest = buildManifest(parsed.data);
  if (!manifest) {
    return Response.json({ success: false, error: "Practice exam unavailable" }, { status: 404 });
  }

  return Response.json({
    success: true,
    data: manifest,
  });
}
