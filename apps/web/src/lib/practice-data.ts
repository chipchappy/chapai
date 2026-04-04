import { demoQuestionSets, type DemoQuestion } from "@/lib/demo-content";
import { CCRN_CATEGORIES, NCLEX_CATEGORIES, type Exam, type QuizQuestion } from "@/lib/types";
import type {
  PracticeCatalogCard,
  PracticeExamDefinition,
  PracticeMetric,
  PracticeQuestion,
} from "@/lib/practice-types";

type PracticeCounts = {
  ccrn: number;
  nclex: number;
};

function normalizeFlag(flag?: string): PracticeMetric["flag"] {
  if (flag === "critical") {
    return "critical";
  }
  if (flag === "high" || flag === "low" || flag === "normal") {
    return flag;
  }
  return undefined;
}

function mapMetric(metric: {
  label: string;
  value: string;
  unit?: string;
  flag?: string;
  reference?: string;
}): PracticeMetric {
  const suffix = metric.reference ? ` (ref ${metric.reference})` : "";
  return {
    label: metric.label,
    value: `${metric.value}${metric.unit ? ` ${metric.unit}` : ""}${suffix}`,
    unit: metric.unit,
    flag: normalizeFlag(metric.flag),
  };
}

function baseQuestionFromDemo(question: DemoQuestion): Omit<PracticeQuestion, "correctAnswer"> {
  const shared = {
    id: question.id,
    exam: question.exam,
    category: question.category,
    difficulty: question.difficulty,
    mode: question.mode,
    source: "demo" as const,
    rationale: question.rationale,
    takeaway: question.takeaway,
  };

  if (question.mode === "standard") {
    return {
      ...shared,
      kind: Array.isArray((question as { answer: string | string[] }).answer) ? "multi-select" : "mcq",
      stem: question.stem,
      options: question.options,
      title: question.exam === "ccrn" ? "Critical care bedside drill" : "NCLEX bedside drill",
      distractorRationales: question.distractorRationales,
    };
  }

  if (question.mode === "case-study") {
    return {
      ...shared,
      kind: "case-study",
      stem: question.stem,
      options: question.options,
      title: question.caseTitle,
      caseTitle: question.caseTitle,
      caseContext: question.caseContext,
      vitals: question.vitals?.map(mapMetric),
      labs: question.labs?.map(mapMetric),
      hemodynamics: question.hemodynamics?.map(mapMetric),
      distractorRationales: question.distractorRationales,
    };
  }

  if (question.mode === "chart") {
    return {
      ...shared,
      kind: "chart",
      stem: question.stem,
      options: question.options,
      chartTitle: question.chartTitle,
      chartCaption: question.chartCaption,
      chartRows: question.dataRows.map((row) => ({
        time: row.time,
        values: row.values.map((value) => ({
          label: value.label,
          value: value.value,
          flag: normalizeFlag(value.flag),
        })),
      })),
      title: question.chartTitle,
    };
  }

  return {
    ...shared,
    kind: question.type === "matrix" ? "matrix" : "multi-select",
    stem: question.stem,
    options: question.options,
    scenarioTitle: question.scenarioTitle,
    scenario: question.scenario,
    additionalInfo: question.additionalInfo,
    matrixColumns: question.matrixColumns,
    matrixRows: question.matrixRows?.map((row) => ({ label: row.label, answer: row.answer })),
    title: question.scenarioTitle,
  };
}

function mapLiveQuestion(question: QuizQuestion, mode: "standard" | "practice-exam" = "standard"): PracticeQuestion {
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
    mode,
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

function selectByBlueprint(questions: PracticeQuestion[], blueprint: Record<string, number>, count: number, seed: string) {
  const buckets = new Map<string, PracticeQuestion[]>();

  for (const question of questions) {
    const key = question.category;
    const bucket = buckets.get(key) ?? [];
    bucket.push(question);
    buckets.set(key, bucket);
  }

  const selected: PracticeQuestion[] = [];
  const used = new Set<string>();

  for (const [category, pct] of Object.entries(blueprint)) {
    const target = Math.max(1, Math.round((pct / 100) * count));
    const bucket = seededShuffle(buckets.get(category) ?? [], `${seed}:${category}`).filter((question) => !used.has(question.id));
    for (const question of bucket.slice(0, target)) {
      used.add(question.id);
      selected.push(question);
    }
  }

  if (selected.length < count) {
    const remainder = seededShuffle(questions.filter((question) => !used.has(question.id)), `${seed}:remainder`);
    for (const question of remainder.slice(0, count - selected.length)) {
      used.add(question.id);
      selected.push(question);
    }
  }

  return seededShuffle(selected, `${seed}:final`).slice(0, count);
}

export function getPracticeExamDefinitions(): PracticeExamDefinition[] {
  return [
    {
      id: "nclex-sim-1",
      exam: "nclex",
      label: "NCLEX Full Simulation 1",
      description: "Full 85-question NCLEX simulation with a steady blueprint mix and test-day pacing.",
      length: 85,
      timeLimitMinutes: 300,
      seed: "nclex-sim-1",
    },
    {
      id: "nclex-sim-2",
      exam: "nclex",
      label: "NCLEX Full Simulation 2",
      description: "A second full-length NCLEX run with a different question order.",
      length: 85,
      timeLimitMinutes: 300,
      seed: "nclex-sim-2",
    },
    {
      id: "nclex-sim-3",
      exam: "nclex",
      label: "NCLEX Full Simulation 3",
      description: "A third NCLEX test-day set for repeated endurance practice.",
      length: 85,
      timeLimitMinutes: 300,
      seed: "nclex-sim-3",
    },
    {
      id: "ccrn-sim-1",
      exam: "ccrn",
      label: "CCRN Full Simulation 1",
      description: "Full 150-question CCRN simulation focused on ICU judgment and hemodynamic patterning.",
      length: 150,
      timeLimitMinutes: 180,
      seed: "ccrn-sim-1",
    },
    {
      id: "ccrn-sim-2",
      exam: "ccrn",
      label: "CCRN Full Simulation 2",
      description: "A second full-length CCRN run with another test-day order.",
      length: 150,
      timeLimitMinutes: 180,
      seed: "ccrn-sim-2",
    },
  ];
}

export function getPracticeCatalogCards(liveCounts: PracticeCounts): PracticeCatalogCard[] {
  const chartDeck = getRichDeck("chart").length;
  const caseDeck = getRichDeck("case-study").length;
  const ngnDeck = getRichDeck("ngn").length;

  return [
    {
      id: "standard-nclex",
      mode: "standard",
      exam: "nclex",
      label: "NCLEX live bank",
      description: "Single-best-answer practice pulled from the live NCLEX bank with instant rationale and review flow.",
      count: liveCounts.nclex,
      accent: "bg-[linear-gradient(135deg,rgba(90,127,136,0.18),rgba(245,241,232,0.92))]",
      hint: "Best for everyday reps",
      featured: true,
    },
    {
      id: "standard-ccrn",
      mode: "standard",
      exam: "ccrn",
      label: "CCRN live bank",
      description: "Critical-care single-best-answer practice from the live CCRN bank with rationales and scoring.",
      count: liveCounts.ccrn,
      accent: "bg-[linear-gradient(135deg,rgba(90,127,136,0.12),rgba(229,233,227,0.96))]",
      hint: "Best for bedside patterning",
      featured: true,
    },
    {
      id: "chart-reading",
      mode: "chart",
      label: "Chart reading",
      description: "Read hemodynamic trends, I&O, and chart excerpts inside a larger data-first layout.",
      count: chartDeck,
      accent: "bg-[linear-gradient(135deg,rgba(194,154,86,0.14),rgba(245,241,232,0.94))]",
      hint: "Trend interpretation",
    },
    {
      id: "case-studies",
      mode: "case-study",
      label: "CCRN case studies",
      description: "Full context cases with vitals, labs, and hemodynamics for serious critical-care review.",
      count: caseDeck,
      accent: "bg-[linear-gradient(135deg,rgba(116,139,114,0.14),rgba(229,233,227,0.94))]",
      hint: "Context-heavy clinical reasoning",
    },
    {
      id: "ngn",
      mode: "ngn",
      label: "NGN-style items",
      description: "Matrix and multi-select items with layered clinical judgment and follow-up reasoning.",
      count: ngnDeck,
      accent: "bg-[linear-gradient(135deg,rgba(120,101,164,0.12),rgba(245,241,232,0.92))]",
      hint: "Next Generation NCLEX",
    },
    {
      id: "practice-exams",
      mode: "practice-exam",
      label: "5 full simulations",
      description: "Three NCLEX test-day runs and two CCRN simulations with time pressure and question palette review.",
      count: getPracticeExamDefinitions().length,
      accent: "bg-[linear-gradient(135deg,rgba(31,38,43,0.08),rgba(255,252,247,0.96))]",
      hint: "Timed test-day flow",
      featured: true,
    },
  ];
}

export function getRichDeck(mode: "chart" | "case-study" | "ngn") {
  return demoQuestionSets[mode].map((question) => ({
    ...baseQuestionFromDemo(question),
    correctAnswer:
      question.mode === "ngn" && question.type === "matrix"
        ? Object.fromEntries(question.matrixRows?.map((row) => [row.label, row.answer]) ?? [])
        : question.mode === "ngn"
          ? question.answers ?? []
          : question.answer,
  }));
}

export function getStandardPreviewDeck() {
  return demoQuestionSets.standard
    .filter((question): question is Extract<DemoQuestion, { mode: "standard" }> => question.mode === "standard")
    .map((question) => ({
      ...baseQuestionFromDemo(question),
      correctAnswer: question.answer,
    }));
}

export function getPracticeQuestionByMode(mode: "chart" | "case-study" | "ngn") {
  return getRichDeck(mode);
}

export function buildPracticeExamQuestions(definition: PracticeExamDefinition) {
  const liveDeck = mapLiveBank(definition.exam);
  const blueprint = definition.exam === "ccrn"
    ? Object.fromEntries(Object.entries(CCRN_CATEGORIES).map(([key, value]) => [value.label, value.pct]))
    : Object.fromEntries(Object.entries(NCLEX_CATEGORIES).map(([key, value]) => [value.label, value.pct]));
  return selectByBlueprint(liveDeck, blueprint, definition.length, definition.seed);
}

export function mapLiveBank(exam: Exam) {
  return [];
}

export function mapLiveQuestionBank(questions: QuizQuestion[], mode: "standard" | "practice-exam" = "standard") {
  return questions.map((question) => mapLiveQuestion(question, mode));
}

export function createPracticeDecksFromLiveBank(questions: QuizQuestion[], exam: Exam) {
  return mapLiveQuestionBank(questions.filter((question) => question.exam === exam), "practice-exam");
}

export type { PracticeCounts };
