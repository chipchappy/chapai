import { demoQuestionSets, type DemoQuestion } from "@/lib/demo-content";
import { CCRN_CATEGORIES, NCLEX_CATEGORIES, type Exam, type QuizQuestion } from "@/lib/types";
import type {
  PracticeCatalogCard,
  PracticeChartReviewMetadata,
  PracticeExamDefinition,
  PracticeMetric,
  PracticeMode,
  PracticeQuestion,
} from "@/lib/practice-types";

export type PracticeCounts = {
  ccrn: number;
  nclex: number;
};

function normalizeQuestionAnswer(answer: QuizQuestion["answer"]) {
  if (Array.isArray(answer)) {
    return answer;
  }

  if (answer && typeof answer === "object") {
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
        return parsed;
      }
    } catch {
      // fall through to string handling
    }
  }

  return raw;
}

function getSimulationLength(exam: Exam, liveCount: number | null | undefined) {
  const baseLength = exam === "nclex" ? 85 : 150;
  if (!liveCount) {
    return baseLength;
  }

  return Math.max(1, Math.min(baseLength, liveCount));
}

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

function normalizeExhibitItems(items: unknown) {
  if (Array.isArray(items)) {
    return items.map((item) => String(item).trim()).filter(Boolean);
  }

  const raw = String(items ?? "").trim();
  if (!raw) {
    return [] as string[];
  }

  return raw
    .split(/\r?\n|•|;(?=\s*[A-Za-z])/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeExhibits(exhibits: QuizQuestion["exhibits"]) {
  return (exhibits ?? []).map((exhibit) => ({
    ...exhibit,
    items: normalizeExhibitItems(exhibit.items),
  }));
}

function parseMetricLine(line: string): PracticeMetric | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed
    .replace(/^[\-\u2022]\s*/, "")
    .replace(/\s{2,}/g, " ");
  const separator = normalized.match(/^([^:]+):\s*(.+)$/);
  if (separator) {
    return {
      label: separator[1].trim(),
      value: separator[2].trim(),
    };
  }

  return {
    label: "Finding",
    value: normalized,
  };
}

function deriveMetricsFromExhibits(
  exhibits: ReturnType<typeof normalizeExhibits>,
  types: Array<NonNullable<QuizQuestion["exhibits"]>[number]["type"]>,
) {
  return exhibits
    .filter((exhibit) => types.includes(exhibit.type))
    .flatMap((exhibit) => {
      const rows = [
        ...normalizeExhibitItems(exhibit.body),
        ...exhibit.items,
      ];
      return rows
        .map(parseMetricLine)
        .filter((metric): metric is PracticeMetric => Boolean(metric));
    });
}

function parseTimelineLine(line: string) {
  const trimmed = line.trim().replace(/^[\-\u2022]\s*/, "");
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^([^:-]{1,24})\s*(?:[-:])\s*(.+)$/);
  if (!match) {
    return null;
  }

  const [, time, detail] = match;
  return {
    time: time.trim(),
    value: detail.trim(),
  };
}

function deriveChartRowsFromExhibits(exhibits: ReturnType<typeof normalizeExhibits>) {
  return exhibits
    .filter((exhibit) => exhibit.type === "timeline" || exhibit.type === "assessment" || exhibit.type === "orders")
    .flatMap((exhibit) => [...normalizeExhibitItems(exhibit.body), ...exhibit.items])
    .map(parseTimelineLine)
    .filter((entry): entry is { time: string; value: string } => Boolean(entry))
    .map((entry) => ({
      time: entry.time,
      values: [{ label: "Update", value: entry.value }],
    }));
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

function mapLiveQuestion(question: QuizQuestion, mode: PracticeMode = "standard"): PracticeQuestion {
  const correctAnswer = normalizeQuestionAnswer(question.answer);
  const exhibits = normalizeExhibits(question.exhibits);
  const kind =
    question.type === "sata"
      ? "multi-select"
      : question.type === "matrix"
        ? "matrix"
        : question.type === "ordering"
          ? "ordering"
          : question.type === "bow_tie"
            ? "bow-tie"
            : question.type === "case_study"
              ? "case-study"
              : question.type === "scenario_mcq"
                ? "scenario-mcq"
                : question.type === "decision_map_mcq"
                  ? "decision-map-mcq"
                  : "mcq";

  return {
    id: question.id,
    exam: question.exam,
    nclexClientNeed: question.nclexClientNeed,
    cognitiveLevel: question.cognitiveLevel,
    category: question.category,
    difficulty: question.difficulty,
    mode,
    kind,
    questionType: question.type,
    stem: question.stem,
    title: question.scenarioTitle,
    caseTitle: question.type === "case_study" ? question.scenarioTitle : undefined,
    caseContext: question.type === "case_study" ? question.scenario : undefined,
    scenarioTitle: question.scenarioTitle,
    scenario: question.scenario,
    additionalInfo: question.additionalInfo,
    exhibits,
    chartReview: question.chartReview,
    chartRows: deriveChartRowsFromExhibits(exhibits),
    vitals: deriveMetricsFromExhibits(exhibits, ["vitals"]),
    labs: deriveMetricsFromExhibits(exhibits, ["labs"]),
    hemodynamics: deriveMetricsFromExhibits(exhibits, ["assessment"]),
    matrixColumns: question.matrixColumns,
    matrixRows: question.matrixRows,
    options: question.options.map((option) => ({ id: option.id, text: option.text })),
    correctAnswer,
    rationale: question.rationale,
    deepRationale: question.deepRationale,
    distractorRationales: question.distractorRationales,
    takeaway: question.takeaway,
    speedCue: question.speedCue,
    references: question.references,
    coachingFrame: question.coachingFrame,
    tutorReady: question.tutorReady,
    source: "live",
    visualRationale: question.visualRationale,
    diagramBlueprint: question.diagramBlueprint,
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

function normalizeStem(stem: string) {
  return stem
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function questionSignature(question: Pick<PracticeQuestion, "stem">) {
  return normalizeStem(question.stem);
}

function takeUniqueQuestions(
  candidates: PracticeQuestion[],
  limit: number,
  usedIds: Set<string>,
  usedSignatures: Set<string>,
) {
  const picked: PracticeQuestion[] = [];

  for (const question of candidates) {
    const signature = questionSignature(question);
    if (usedIds.has(question.id) || usedSignatures.has(signature)) {
      continue;
    }
    usedIds.add(question.id);
    usedSignatures.add(signature);
    picked.push(question);
    if (picked.length >= limit) {
      break;
    }
  }

  return picked;
}

function selectByBlueprint(questions: PracticeQuestion[], blueprint: Record<string, number>, count: number, seed: string) {
  const buckets = new Map<string, PracticeQuestion[]>();

  for (const question of questions) {
    const key = question.exam === "nclex" ? question.nclexClientNeed ?? question.category : question.category;
    const bucket = buckets.get(key) ?? [];
    bucket.push(question);
    buckets.set(key, bucket);
  }

  const selected: PracticeQuestion[] = [];
  const used = new Set<string>();
  const usedSignatures = new Set<string>();

  for (const [category, pct] of Object.entries(blueprint)) {
    const target = Math.max(1, Math.round((pct / 100) * count));
    const bucket = seededShuffle(buckets.get(category) ?? [], `${seed}:${category}`);
    selected.push(...takeUniqueQuestions(bucket, target, used, usedSignatures));
  }

  if (selected.length < count) {
    const remainder = seededShuffle(questions, `${seed}:remainder`);
    selected.push(...takeUniqueQuestions(remainder, count - selected.length, used, usedSignatures));
  }

  return seededShuffle(selected, `${seed}:final`).slice(0, count);
}

export function getPracticeExamDefinitions(liveCounts?: Partial<PracticeCounts>): PracticeExamDefinition[] {
  const nclexLength = getSimulationLength("nclex", liveCounts?.nclex ?? null);
  const ccrnLength = getSimulationLength("ccrn", liveCounts?.ccrn ?? null);

  return [
    {
      id: "nclex-sim-1",
      exam: "nclex",
      label: "NCLEX Full Simulation 1",
      description: `NCLEX simulation with ${nclexLength} unique reviewed items and steady blueprint pacing.`,
      length: nclexLength,
      timeLimitMinutes: 300,
      seed: "nclex-sim-1",
    },
    {
      id: "nclex-sim-2",
      exam: "nclex",
      label: "NCLEX Full Simulation 2",
      description: `A second NCLEX run built from the same reviewed unique bank (${nclexLength} items).`,
      length: nclexLength,
      timeLimitMinutes: 300,
      seed: "nclex-sim-2",
    },
    {
      id: "nclex-sim-3",
      exam: "nclex",
      label: "NCLEX Full Simulation 3",
      description: `A third NCLEX test-day set with ${nclexLength} unique reviewed items.`,
      length: nclexLength,
      timeLimitMinutes: 300,
      seed: "nclex-sim-3",
    },
    {
      id: "nclex-sim-4",
      exam: "nclex",
      label: "NCLEX Readiness Exam 4",
      description: `A fourth non-overlapping NCLEX readiness form with ${nclexLength} reviewed items.`,
      length: nclexLength,
      timeLimitMinutes: 300,
      seed: "nclex-sim-4",
    },
    {
      id: "nclex-sim-5",
      exam: "nclex",
      label: "NCLEX Readiness Exam 5",
      description: `A fifth non-overlapping NCLEX readiness form with ${nclexLength} reviewed items.`,
      length: nclexLength,
      timeLimitMinutes: 300,
      seed: "nclex-sim-5",
    },
    {
      id: "ccrn-sim-1",
      exam: "ccrn",
      label: "CCRN Full Simulation 1",
      description: `CCRN simulation with ${ccrnLength} live critical-care items focused on ICU judgment and hemodynamic patterning.`,
      length: ccrnLength,
      timeLimitMinutes: 180,
      seed: "ccrn-sim-1",
    },
    {
      id: "ccrn-sim-2",
      exam: "ccrn",
      label: "CCRN Full Simulation 2",
      description: `A second CCRN run built from ${ccrnLength} live critical-care items in a different order.`,
      length: ccrnLength,
      timeLimitMinutes: 180,
      seed: "ccrn-sim-2",
    },
  ];
}

const nclexVteChartReview: PracticeChartReviewMetadata = {
  patientTitle: "Day 1: Emergency Department",
  patientCaption: "Six-item unfolding NGN case study with shared exhibits, vitals, orders, and rationales.",
  chiefComplaint: "Sudden shortness of breath and right leg pain/swelling.",
  nursingNotes: [
    "0615: A 61-year-old client comes to the emergency department reporting shortness of breath. She had to stop and sit down while getting ready for work because she suddenly felt like she could not catch her breath. She denies cough, fever, palpitations, lightheadedness, and recent sick contacts. She recently injured her right leg in a minor bicycle accident.",
    "0645: Client placed on 2 L/min nasal cannula and reports mild relief of dyspnea. CT pulmonary angiography and right lower extremity Doppler ultrasound are ordered. Provider anticipates hospital admission and heparin therapy if thromboembolism is confirmed.",
  ],
  hpi: [
    "Neurological: Alert; oriented to person, place, and time; slightly anxious.",
    "Pulmonary: Reports dyspnea; diminished lung sounds with fine crackles in bilateral bases; sharp chest pain on inspiration; denies cough; former 10-year smoker, quit 25 years ago.",
    "Cardiovascular: Regular rhythm; S1 and S2 present; no murmur; 2+ peripheral pulses; history of hypertension.",
    "Gastrointestinal/Genitourinary: Abdomen soft and nontender; bowel sounds normoactive in all quadrants; healed transverse lower abdominal scar; denies dysuria; obese.",
    "Reproductive: Postmenopausal; takes oral hormone replacement therapy for hot flashes; history of 2 cesarean sections.",
    "Extremities: Right lower leg with erythema, tenderness, and 1+ pitting edema extending to thigh; client states the pain and swelling are getting worse; history of varicose veins.",
    "Psychosocial: Married with 2 adult children; works long hours seated at a crowded call center.",
  ],
  history: [
    "Hypertension.",
    "Former 10-year smoker; quit 25 years ago.",
    "Varicose veins.",
    "Recent right lower leg injury from bicycle accident.",
    "Oral hormone replacement therapy.",
    "Works long hours seated.",
  ],
  vitals: [
    { label: "T", value: "99.9 F (37.7 C)" },
    { label: "P", value: "118", flag: "high" },
    { label: "RR", value: "24", flag: "high" },
    { label: "BP", value: "108/56", flag: "low" },
    { label: "Pulse oximetry", value: "89% on room air", flag: "critical" },
  ],
  labs: [
    { label: "D-dimer", value: "elevated", flag: "high" },
    { label: "Platelets", value: "248,000/mm3" },
    { label: "PT/INR", value: "13 sec / 1.0" },
    { label: "aPTT", value: "31 sec" },
  ],
  orders: [
    "Apply oxygen to keep SpO2 at or above 92%.",
    "CT pulmonary angiography.",
    "Right lower extremity Doppler ultrasound.",
    "Initiate IV access and prepare weight-based unfractionated heparin if prescribed.",
    "Place client on continuous pulse oximetry.",
  ],
  notes: [
    "0730: CT pulmonary angiography positive for pulmonary embolism. Doppler ultrasound positive for right lower extremity deep vein thrombosis.",
    "0745: Provider prescribes IV unfractionated heparin bolus and continuous infusion per protocol.",
  ],
  priorityCues: [
    "Dyspnea, tachypnea, tachycardia, pleuritic chest pain, low oxygen saturation, unilateral painful leg swelling, recent leg injury, hormone therapy, varicose veins, and prolonged sitting.",
  ],
};

function makeNclexVteCaseQuestion(input: Omit<PracticeQuestion, "exam" | "mode" | "source" | "caseStudyId" | "caseStudyTitle" | "caseItemTotal" | "chartReview" | "category" | "difficulty"> & {
  id: string;
  difficulty?: PracticeQuestion["difficulty"];
  category?: string;
}): PracticeQuestion {
  return {
    exam: "nclex",
    mode: "case-study",
    source: "simulated",
    caseStudyId: "nclex-vte-pe-ngn",
    caseStudyTitle: "Adult Health: Venous Thromboembolism and Pulmonary Embolism",
    caseItemTotal: 6,
    chartReview: nclexVteChartReview,
    category: input.category ?? "Physiological Adaptation",
    difficulty: input.difficulty ?? 4,
    nclexClientNeed: input.nclexClientNeed ?? "physiological_adaptation",
    tutorReady: true,
    references: [
      {
        title: "2026 NCLEX-RN Test Plan",
        citation: "NCSBN, 2026",
        href: "https://www.nclex.com/test-plans.page",
      },
    ],
    ...input,
  };
}

const nclexVteCaseStudyDeck: PracticeQuestion[] = [
  makeNclexVteCaseQuestion({
    id: "nclex-vte-case-01",
    kind: "multi-select",
    caseItemNumber: 1,
    clinicalJudgmentSkill: "Recognize cues",
    stem: "Click to highlight below the findings that require immediate follow-up by the nurse.",
    nclexScenarioLead: "The following scenario applies to the next 6 items.",
    nclexInstruction: "Click to highlight below the findings that require immediate follow-up by the nurse.",
    options: [
      { id: "a", text: "Dyspnea" },
      { id: "b", text: "Fine crackles in bilateral bases" },
      { id: "c", text: "Sharp chest pain on inspiration" },
      { id: "d", text: "Pitting lower extremity edema with worsening pain and swelling" },
      { id: "e", text: "Slightly anxious" },
      { id: "f", text: "Former 10-year smoker" },
      { id: "g", text: "History of hypertension" },
      { id: "h", text: "Works long hours at a crowded call center" },
      { id: "i", text: "Obese" },
      { id: "j", text: "Oral hormone replacement therapy" },
    ],
    highlightRows: [
      { label: "Neurological", text: "Alert; oriented to person, place, and time; slightly anxious", optionId: "e" },
      { label: "Pulmonary", text: "Reports dyspnea", optionId: "a" },
      { label: "Pulmonary", text: "Fine crackles in bilateral bases", optionId: "b" },
      { label: "Pulmonary", text: "Sharp chest pain on inspiration", optionId: "c" },
      { label: "Pulmonary", text: "Former 10-year smoker", optionId: "f" },
      { label: "Cardiovascular", text: "Regular rhythm; S1 and S2 present; no murmur; 2+ peripheral pulses; history of hypertension", optionId: "g" },
      { label: "Gastrointestinal/Genitourinary", text: "Abdomen soft and nontender; bowel sounds normoactive; obese", optionId: "i" },
      { label: "Reproductive", text: "Postmenopausal; takes oral hormone replacement therapy; history of 2 cesarean sections", optionId: "j" },
      { label: "Extremities", text: "Right lower leg with erythema, tenderness, and 1+ pitting edema extending to thigh; pain and swelling are getting worse", optionId: "d" },
      { label: "Psychosocial", text: "Married with 2 adult children; works long hours seated at a crowded call center", optionId: "h" },
    ],
    correctAnswer: ["a", "b", "c", "d"],
    rationale:
      "Sudden dyspnea, tachypnea, tachycardia, low oxygen saturation, pleuritic chest pain, adventitious lung sounds, and unilateral painful leg swelling point to an acute cardiopulmonary process such as pulmonary embolism from deep vein thrombosis. These cues require immediate follow-up before lower-priority history or teaching needs.",
    distractorRationales: {
      e: "Anxiety can occur with dyspnea, but it is not the priority cue over oxygenation and possible thromboembolism.",
      f: "Remote smoking history increases baseline risk but is not the immediate finding requiring follow-up.",
      g: "Hypertension is relevant history, but it does not explain the current acute respiratory compromise.",
      h: "Prolonged sitting contributes to VTE risk, but it is not the immediate clinical finding.",
    },
    takeaway: "In NGN case studies, first separate acute unstable cues from background risk factors.",
  }),
  makeNclexVteCaseQuestion({
    id: "nclex-vte-case-02",
    kind: "matrix",
    caseItemNumber: 2,
    clinicalJudgmentSkill: "Analyze cues",
    stem: "The nurse suspects that the client is experiencing a venous thromboembolism. For each client finding, click to specify whether the finding is an increased risk for VTE best explained by blood flow stasis, endothelial injury, or a hypercoagulable state.",
    nclexInstruction:
      "For each client finding, click to specify whether the finding is best explained by blood flow stasis, endothelial injury, or a hypercoagulable state.",
    matrixColumns: ["Blood Flow Stasis", "Endothelial Injury", "Hypercoagulable State"],
    matrixRows: [
      { label: "Varicose veins", answer: "Blood Flow Stasis" },
      { label: "Works seated at a desk job", answer: "Blood Flow Stasis" },
      { label: "Injured leg in bicycle accident", answer: "Endothelial Injury" },
      { label: "Hormone replacement therapy", answer: "Hypercoagulable State" },
    ],
    correctAnswer: {
      "Varicose veins": "Blood Flow Stasis",
      "Works seated at a desk job": "Blood Flow Stasis",
      "Injured leg in bicycle accident": "Endothelial Injury",
      "Hormone replacement therapy": "Hypercoagulable State",
    },
    rationale:
      "Virchow's triad organizes VTE risk: venous pooling and immobility create blood flow stasis, trauma to the vessel wall creates endothelial injury, and estrogen exposure increases coagulation tendency. The client has cues from all three categories, which raises concern for DVT with pulmonary embolism.",
    takeaway: "Use Virchow's triad to convert scattered history into a coherent thromboembolism risk pattern.",
  }),
  makeNclexVteCaseQuestion({
    id: "nclex-vte-case-03",
    kind: "ordering",
    caseItemNumber: 3,
    clinicalJudgmentSkill: "Prioritize hypotheses and generate solutions",
    stem: "The nurse on the telemetry unit is planning care in anticipation of the client's arrival. The nurse reviews the new orders and updated Nurses' Notes and Vital Signs from 0645.",
    nclexInstruction: "Drag options from the choices below to fill in each blank in the following sentences.",
    clozeTemplate: "The client is at highest risk for developing {blank}, {blank}, and {blank}.",
    clozeBlankCount: 3,
    options: [
      { id: "a", text: "bleeding" },
      { id: "b", text: "heart failure" },
      { id: "c", text: "respiratory failure" },
      { id: "d", text: "heparin-induced thrombocytopenia" },
    ],
    correctAnswer: ["c", "a", "d"],
    rationale:
      "The confirmed pulmonary embolism and low oxygen saturation place the client at risk for respiratory failure. Anticoagulation with unfractionated heparin adds bleeding risk and requires platelet monitoring for heparin-induced thrombocytopenia. Heart failure is not the priority complication supported by the new orders and VTE diagnosis.",
    distractorRationales: {
      b: "Heart failure can cause dyspnea, but this case now has confirmed DVT/PE and heparin therapy, making respiratory compromise and anticoagulation complications the priority risks.",
    },
    takeaway: "Later NGN case items should force students to update risk as the case unfolds, not answer from the first note only.",
  }),
  makeNclexVteCaseQuestion({
    id: "nclex-vte-case-04",
    kind: "multi-select",
    caseItemNumber: 4,
    clinicalJudgmentSkill: "Take action",
    stem: "Which nursing actions are appropriate while initiating the prescribed unfractionated heparin infusion? Select all that apply.",
    nclexInstruction: "Select all actions that apply before and during initiation of the infusion.",
    options: [
      { id: "a", text: "Verify baseline platelet count, PT/INR, and aPTT values." },
      { id: "b", text: "Use an infusion pump for the heparin infusion." },
      { id: "c", text: "Teach the client to report bleeding, black stools, sudden headache, or new weakness." },
      { id: "d", text: "Administer intramuscular injections for pain control if needed." },
      { id: "e", text: "Keep oxygen and pulse oximetry in place while monitoring respiratory status." },
    ],
    correctAnswer: ["a", "b", "c", "e"],
    rationale:
      "Heparin requires baseline coagulation and platelet data, pump-controlled dosing, bleeding precautions, and close oxygenation monitoring because the pulmonary embolism remains an active respiratory risk. Intramuscular injections increase bleeding and hematoma risk while anticoagulated.",
    distractorRationales: {
      d: "Intramuscular injections should be avoided during therapeutic anticoagulation unless specifically required because they increase bleeding and hematoma risk.",
    },
    takeaway: "Medication safety and respiratory monitoring are both active priorities in PE care.",
  }),
  makeNclexVteCaseQuestion({
    id: "nclex-vte-case-05",
    kind: "mcq",
    caseItemNumber: 5,
    clinicalJudgmentSkill: "Evaluate outcomes",
    stem: "Two hours after heparin initiation, which finding requires the nurse to notify the provider immediately?",
    nclexInstruction: "Select the finding that is most urgent after anticoagulation has started.",
    options: [
      { id: "a", text: "aPTT is within the protocol's therapeutic range" },
      { id: "b", text: "Client reports mild bruising at a previous venipuncture site" },
      { id: "c", text: "Client reports sudden severe headache with new left arm weakness" },
      { id: "d", text: "Oxygen saturation improves from 89% to 93% on nasal cannula" },
    ],
    correctAnswer: "c",
    rationale:
      "Sudden severe headache with a new neurologic deficit during heparin therapy suggests possible intracranial bleeding or acute neurologic event and requires immediate provider notification. A therapeutic aPTT and improved oxygenation are expected goals, and mild bruising is monitored but is not the most urgent cue.",
    distractorRationales: {
      a: "A therapeutic aPTT means the infusion is in range, not that the provider needs urgent notification.",
      b: "Mild bruising can occur with anticoagulation and should be monitored, but it is lower priority than acute neurologic change.",
      d: "Improved oxygen saturation is an expected positive outcome.",
    },
    takeaway: "The highest-risk heparin complication is not a lab number; it is bleeding with neurologic or hemodynamic change.",
  }),
  makeNclexVteCaseQuestion({
    id: "nclex-vte-case-06",
    kind: "mcq",
    caseItemNumber: 6,
    clinicalJudgmentSkill: "Evaluate teaching",
    stem: "Which client statement indicates that discharge teaching about VTE prevention and anticoagulation was effective?",
    nclexInstruction: "Select the statement that shows the best understanding of prevention and safety teaching.",
    options: [
      { id: "a", text: "I will stop my anticoagulant once my leg pain improves." },
      { id: "b", text: "I should call for shortness of breath, chest pain, black stools, or unusual bleeding." },
      { id: "c", text: "I should stay in bed as much as possible until the clot dissolves." },
      { id: "d", text: "I can restart hormone therapy because the blood thinner protects me." },
    ],
    correctAnswer: "b",
    rationale:
      "The client correctly identifies both recurrent PE symptoms and anticoagulation bleeding warning signs. Anticoagulants should not be stopped early, mobility is encouraged as prescribed, and hormone therapy should not be restarted without provider direction because it contributed to hypercoagulability risk.",
    distractorRationales: {
      a: "Stopping anticoagulation early increases the risk for recurrent clot and pulmonary embolism.",
      c: "Prolonged immobility worsens venous stasis. Activity should follow the provider's plan.",
      d: "Hormone therapy can increase clot risk and should not be restarted without provider review.",
    },
    takeaway: "The final item should test whether the student can translate the case into safe outpatient warning signs and prevention behavior.",
  }),
];

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
      description: "Reviewed live NCLEX items with quicker takeaways, deeper cited rationales, and tutor-ready follow-up in the same study flow.",
      count: liveCounts.nclex,
      accent: "bg-[linear-gradient(135deg,rgba(90,127,136,0.18),rgba(245,241,232,0.92))]",
      hint: "Primary launch focus",
      featured: true,
    },
    {
      id: "standard-ccrn",
      mode: "standard",
      exam: "ccrn",
      label: "CCRN live bank",
      description: "Advanced critical-care reps for nurses preparing for ICU progression, kept stable while NCLEX expansion stays first.",
      count: liveCounts.ccrn,
      accent: "bg-[linear-gradient(135deg,rgba(90,127,136,0.12),rgba(229,233,227,0.96))]",
      hint: "Critical-care niche lane",
    },
    {
      id: "chart-reading",
      mode: "chart",
      label: "Chart reading",
      description: "Trend-heavy chart reps that keep labs, vitals, and bedside interpretation in one calmer review surface.",
      count: chartDeck,
      accent: "bg-[linear-gradient(135deg,rgba(194,154,86,0.14),rgba(245,241,232,0.94))]",
      hint: "Trend interpretation",
    },
    {
      id: "case-studies",
      mode: "case-study",
      label: "NGN case studies",
      description: "Six-item unfolding NCLEX case studies with notes, history, vitals, orders, matrix, cloze, and rationale review.",
      count: caseDeck,
      accent: "bg-[linear-gradient(135deg,rgba(116,139,114,0.14),rgba(229,233,227,0.94))]",
      hint: "Practice how you test",
    },
    {
      id: "ngn",
      mode: "ngn",
      label: "NGN-style items",
      description: "Next Gen NCLEX item types with layered decisions, richer follow-up logic, and tutor-ready coaching context.",
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
  const demoDeck = demoQuestionSets[mode].map((question) => ({
    ...baseQuestionFromDemo(question),
    correctAnswer:
      question.mode === "ngn" && question.type === "matrix"
        ? Object.fromEntries(question.matrixRows?.map((row) => [row.label, row.answer]) ?? [])
        : question.mode === "ngn"
          ? question.answers ?? []
          : question.answer,
  }));

  if (mode === "case-study") {
    return [...nclexVteCaseStudyDeck, ...demoDeck.filter((question) => question.exam !== "nclex")];
  }

  if (mode === "ngn") {
    return [...nclexVteCaseStudyDeck, ...demoDeck];
  }

  return demoDeck;
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

export function buildPracticeExamQuestions(definition: PracticeExamDefinition, liveQuestions: QuizQuestion[]) {
  const liveDeck = mapLiveQuestionBank(liveQuestions, "practice-exam");
  const blueprint = definition.exam === "ccrn"
    ? Object.fromEntries(Object.entries(CCRN_CATEGORIES).map(([key, value]) => [value.label, value.pct]))
    : Object.fromEntries(Object.entries(NCLEX_CATEGORIES).map(([key, value]) => [value.label, value.pct]));
  return selectByBlueprint(liveDeck, blueprint, definition.length, definition.seed);
}

export function mapLiveQuestionBank(questions: QuizQuestion[], mode: PracticeMode = "standard") {
  return questions.map((question) => mapLiveQuestion(question, mode));
}

export function createPracticeDecksFromLiveBank(questions: QuizQuestion[], exam: Exam) {
  return mapLiveQuestionBank(questions.filter((question) => question.exam === exam), "practice-exam");
}
