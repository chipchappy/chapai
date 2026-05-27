"use client";

import { useEffect, useMemo, useState } from "react";
import { getPreferredIntelTab, getQuestionIntegrityIssues, type QuestionIntelTab } from "@/lib/question-renderability";
import { ClinicalReviewStation } from "@/components/practice/ClinicalReviewStation";
import NclexExamPane from "@/components/practice/NclexExamPane";
import { buildPracticeChartReviewModel, type ChartReviewTab } from "@/lib/chart-review-model";
import { getStudyResourcesForQuestion } from "@/lib/study-resources";
import type { PracticeAnswer, PracticeAnswerRecord, PracticeQuestion } from "@/lib/practice-types";

type IntelTab = QuestionIntelTab | "tutor";
type EhrTab = "hpi" | "timeline" | "labs" | "orders" | "diagnostics" | "notes" | "rationale" | "tutor";

function toChartReviewTab(tab: EhrTab): ChartReviewTab {
  return (tab as string) === "tutor" ? "aiTutor" : tab as ChartReviewTab;
}

interface PracticeTerminalPaneProps {
  question: PracticeQuestion;
  draftAnswer: PracticeAnswer;
  answerRecord?: PracticeAnswerRecord;
  onChange: (answer: PracticeAnswer) => void;
  onSubmit: () => void;
  onNext: () => void;
  onPrev: () => void;
  onJump: (index: number) => void;
  onToggleFlag: () => void;
  onOpenTutor: () => void;
  onEnd?: () => void;
  questionNumber: number;
  totalQuestions: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  questionStatuses: Array<{ id: string; answered: boolean; flagged: boolean }>;
  canOpenTutor: boolean;
  tier?: "free" | "plus" | "pro";
  canUseAdvancedAnalytics?: boolean;
  phase: "catalog" | "active" | "review" | "results";
}

function isCorrectChoice(question: PracticeQuestion, value: string) {
  if (Array.isArray(question.correctAnswer)) {
    return question.correctAnswer.some((answer) => answer.toLowerCase() === value.toLowerCase());
  }

  return typeof question.correctAnswer === "string" && question.correctAnswer.toLowerCase() === value.toLowerCase();
}

function isSelectedChoice(draft: PracticeAnswer, value: string) {
  if (Array.isArray(draft)) {
    return draft.some((item) => item.toLowerCase() === value.toLowerCase());
  }

  return typeof draft === "string" && draft.toLowerCase() === value.toLowerCase();
}

function updateMultiSelect(draft: PracticeAnswer, value: string) {
  const current = Array.isArray(draft) ? draft : typeof draft === "string" && draft ? draft.split(",") : [];
  return current.some((item) => item.toLowerCase() === value.toLowerCase())
    ? current.filter((item) => item.toLowerCase() !== value.toLowerCase())
    : [...current, value];
}

function appendOrderingStep(draft: PracticeAnswer, value: string) {
  const current = Array.isArray(draft) ? draft : typeof draft === "string" && draft ? [draft] : [];
  if (current.includes(value)) {
    return current;
  }
  return [...current, value];
}

function moveOrderingStep(draft: PracticeAnswer, index: number, direction: -1 | 1) {
  const current = Array.isArray(draft) ? [...draft] : typeof draft === "string" && draft ? [draft] : [];
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= current.length) {
    return current;
  }
  [current[index], current[nextIndex]] = [current[nextIndex], current[index]];
  return current;
}

function removeOrderingStep(draft: PracticeAnswer, value: string) {
  const current = Array.isArray(draft) ? draft : typeof draft === "string" && draft ? [draft] : [];
  return current.filter((item) => item !== value);
}

function formatAnswerValue(answer: PracticeAnswer | undefined) {
  if (!answer) return "--";
  if (Array.isArray(answer)) return answer.map((item) => item.toUpperCase()).join(", ");
  if (typeof answer === "object") return Object.entries(answer).map(([label, value]) => `${label} -> ${value}`).join(" | ");
  return answer.toUpperCase();
}

function getScoringRuleLabel(question: PracticeQuestion) {
  if (question.kind === "matrix") return "row matrix, all rows checked";
  if (question.kind === "ordering") return "ordered sequence";
  if (question.kind === "multi-select") return "select all that apply";
  if (question.kind === "bow-tie") return "clinical judgment set";
  if (question.kind === "case-study") return "case item";
  if (question.kind === "scenario-mcq") return "scenario question";
  if (question.kind === "decision-map-mcq") return "decision-map question";
  return "single best answer";
}

function getIntelTabLabel(tab: IntelTab, question: PracticeQuestion) {
  if (tab === "prompt") return "hpi";
  if (tab === "chart") {
    return question.vitals?.length || question.hemodynamics?.length ? "diagnostics" : "timeline";
  }
  if (tab === "labs") return "labs";
  if (tab === "orders") return "orders";
  if (tab === "notes") return "notes";
  if (tab === "rationale") return "rationale";
  if (tab === "sources") return "sources";
  return "ai tutor";
}

function prioritizeIntelTabs(tabs: IntelTab[], preferred: IntelTab) {
  const unique = Array.from(new Set(tabs));
  return unique.sort((left, right) => {
    if (left === preferred) return -1;
    if (right === preferred) return 1;
    return 0;
  });
}

function getQuestionDensity(question: PracticeQuestion) {
  const stemLength = question.stem?.length ?? 0;
  const optionTexts = question.options?.map((option) => option.text.length) ?? [];
  const longestOption = optionTexts.length ? Math.max(...optionTexts) : 0;
  const optionCount = question.options?.length ?? 0;
  const matrixLoad = (question.matrixRows?.length ?? 0) * (question.matrixColumns?.length ?? 0);

  if (
    question.kind === "matrix"
    || question.kind === "ordering"
    || matrixLoad >= 9
    || stemLength > 230
    || longestOption > 108
    || optionCount >= 5
  ) {
    return "compact";
  }

  if (
    question.kind === "bow-tie"
    || question.kind === "case-study"
    || stemLength > 165
    || longestOption > 76
    || optionCount >= 4
  ) {
    return "dense";
  }

  return "comfortable";
}

function buildPreAnswerChecklist(question: PracticeQuestion, hasOrders: boolean, hasNotes: boolean) {
  const checklist: string[] = [];

  if (question.chartRows?.length || question.vitals?.length || question.hemodynamics?.length) {
    checklist.push("read the trend direction before comparing answer choices");
  }

  if (question.labs?.length) {
    checklist.push("separate the dangerous lab from the merely abnormal lab");
  }

  if (hasOrders) {
    checklist.push("separate provider orders already in motion from the nurse's next move");
  }

  if (hasNotes || question.scenario || question.caseContext || question.additionalInfo) {
    checklist.push("anchor the note set to the one unstable clue that changes priority");
  }

  if (question.kind === "bow-tie" || question.kind === "case-study") {
    checklist.push("link clue, action, and outcome before selecting any single field");
  }

  if (question.kind === "scenario-mcq" || question.kind === "decision-map-mcq") {
    checklist.push("use the scenario cues to choose the single best response");
  }

  if (question.kind === "matrix") {
    checklist.push("classify each row independently instead of forcing one pattern across all rows");
  }

  if (question.kind === "ordering") {
    checklist.push("stabilize airway, breathing, circulation, and safety before lower-priority tasks");
  }

  return checklist.length > 0
    ? checklist
    : ["name the unstable cue first, then choose the safest immediate response"];
}

function buildDebriefInsights(question: PracticeQuestion, answerRecord?: PracticeAnswerRecord) {
  const insights = [
    question.takeaway,
    question.speedCue,
    ...(answerRecord?.coachingFrame ?? question.coachingFrame ?? []),
  ].filter(Boolean) as string[];

  const unique = Array.from(new Set(insights)).slice(0, 4);
  return unique.length > 0
    ? unique
    : ["re-read the unstable clue, then match it to the safest immediate move"];
}

function getMetricFlagLabel(flag?: "low" | "normal" | "high" | "critical") {
  if (flag === "critical") return "critical";
  if (flag === "high") return "high";
  if (flag === "low") return "low";
  return "expected";
}

function flattenExhibitItems(exhibits: Array<{ title: string; body?: string; items?: string[] }>) {
  return exhibits.flatMap((exhibit) => [
    ...(exhibit.body ? [`${exhibit.title}: ${exhibit.body}`] : []),
    ...((Array.isArray(exhibit.items) ? exhibit.items : []).map((item) => `${exhibit.title}: ${item}`)),
  ]);
}

function getTrendArrow(flag?: "low" | "normal" | "high" | "critical") {
  if (flag === "high" || flag === "critical") return "↑";
  if (flag === "low") return "↓";
  return "→";
}

const METRIC_REF_RANGES: Record<string, string> = {
  hr: "60–100/min", "heart rate": "60–100/min",
  bp: "90–140/60–90", "blood pressure": "90–140/60–90",
  sbp: "90–140 mmHg", dbp: "60–90 mmHg",
  "o2 sat": "≥95%", spo2: "≥95%",
  rr: "12–20/min", "resp rate": "12–20/min", "respiratory rate": "12–20/min",
  temp: "36.5–37.5°C", temperature: "36.5–37.5°C",
  gcs: "15", na: "135–145", sodium: "135–145 mEq/L",
  k: "3.5–5.0", potassium: "3.5–5.0 mEq/L",
  creatinine: "0.6–1.2 mg/dL", cr: "0.6–1.2 mg/dL",
  bun: "7–20 mg/dL", hgb: "12–17 g/dL", hemoglobin: "12–17 g/dL",
  wbc: "4.5–11.0 k/µL", platelets: "150–400 k/µL", inr: "0.8–1.2",
  ph: "7.35–7.45", po2: "80–100 mmHg", pco2: "35–45 mmHg",
  hco3: "22–26 mEq/L", bicarbonate: "22–26 mEq/L",
  lactate: "<2.0 mmol/L", map: "65–105 mmHg",
  cvp: "2–8 mmHg", pcwp: "6–12 mmHg", co: "4–8 L/min",
  ci: "2.2–4.0", svr: "800–1200",
};

function getMetricRefRange(label: string): string {
  const key = label.toLowerCase().trim();
  if (METRIC_REF_RANGES[key]) return METRIC_REF_RANGES[key];
  for (const [k, v] of Object.entries(METRIC_REF_RANGES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return "";
}

function getChartTrendStatus(
  chartRows?: Array<{ values: Array<{ flag?: "low" | "normal" | "high" | "critical" }> }>,
): "deteriorating" | "stable" | null {
  if (!chartRows || chartRows.length < 2) return null;
  const lastRow = chartRows[chartRows.length - 1];
  const hasCritical = lastRow.values.some((v) => v.flag === "critical");
  const hasAbnormal = lastRow.values.some((v) => v.flag === "high" || v.flag === "low");
  const allCritical = chartRows.flatMap((r) => r.values).filter((v) => v.flag === "critical").length;
  if (hasCritical || allCritical >= 2) return "deteriorating";
  if (hasAbnormal) return "deteriorating";
  return "stable";
}

function isStatOrder(text: string): boolean {
  return /\bstat\b/i.test(text);
}

function getExhibitNoteLabel(type?: string, title?: string): string {
  if (type === "assessment") return "nursing assessment";
  if (type === "timeline") return "clinical timeline";
  const lower = (title ?? "").toLowerCase();
  if (/(nursing|rn|handoff|sbar)/.test(lower)) return "nursing note";
  if (/(physician|provider|md|order)/.test(lower)) return "provider note";
  if (/(lab|result|diagnostic)/.test(lower)) return "lab result";
  return "clinical note";
}

export default function PracticeTerminalPane({
  question,
  draftAnswer,
  answerRecord,
  onChange,
  onSubmit,
  onNext,
  onPrev,
  onJump,
  onToggleFlag,
  onOpenTutor,
  onEnd,
  questionNumber,
  totalQuestions,
  canGoNext,
  canGoPrev,
  questionStatuses,
  canOpenTutor,
  tier = "free",
  canUseAdvancedAnalytics = false,
  phase,
}: PracticeTerminalPaneProps) {
  const answered = Boolean(answerRecord);
  const isLocked = answered || phase === "results";
  const issues = getQuestionIntegrityIssues(question);
  const orderingDraft = Array.isArray(draftAnswer) ? draftAnswer : typeof draftAnswer === "string" && draftAnswer ? [draftAnswer] : [];
  const matrixAnswerMap = (draftAnswer && typeof draftAnswer === "object" && !Array.isArray(draftAnswer) ? draftAnswer : {}) as Record<string, string>;
  const noteExhibits = question.exhibits?.filter((item) => item.type === "note" || item.type === "assessment" || item.type === "timeline") ?? [];
  const labExhibits = question.exhibits?.filter((item) => item.type === "labs") ?? [];
  const orderExhibits = question.exhibits?.filter((item) => item.type === "orders") ?? [];
  const matrixColumns = question.matrixColumns ?? [];
  const contextTitle = question.caseTitle ?? question.chartTitle ?? question.scenarioTitle ?? question.title;
  const answeredCount = questionStatuses.filter((item) => item.answered).length;
  const currentFlagged = questionStatuses.find((item) => item.id === question.id)?.flagged ?? false;
  const rationaleText = answerRecord?.deepRationale ?? answerRecord?.rationale ?? question.deepRationale ?? question.rationale;
  const promptSupport = [question.takeaway, question.speedCue].filter(Boolean) as string[];
  const coachingFrame = answerRecord?.coachingFrame ?? question.coachingFrame ?? [];
  const references = answerRecord?.references ?? question.references ?? [];
  const studyResources = answerRecord?.studyResources ?? question.studyResources ?? getStudyResourcesForQuestion(question);
  const diagramBlueprint = answerRecord?.diagramBlueprint ?? question.diagramBlueprint;
  const visualRationale = answerRecord?.visualRationale ?? question.visualRationale;
  const sourceSignals = [
    diagramBlueprint ? "diagram ready" : null,
    references.length ? `${references.length} source${references.length === 1 ? "" : "s"}` : null,
    studyResources.length ? `${studyResources.length} study link${studyResources.length === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
  const intelStationLabel = question.exam === "nclex" ? "clinical review station" : "critical-care review station";
  const intelStationMode = question.exam === "nclex" ? "ops // chart // trend // rationale" : "ops // hemo // sequence // rationale";
  const chartFocusTitle = question.chartReview?.patientTitle ?? question.chartTitle ?? contextTitle ?? "active bedside feed";
  const chartFocusCaption = question.chartReview?.patientCaption ?? question.chartCaption ?? "Track the change pattern first, then map the safest move.";
  const chartSignalLabel = question.chartRows?.length
    ? "trend review"
    : question.labs?.length
      ? "lab review"
      : question.chartReview?.diagnostics?.length
        ? "diagnostic review"
      : "prompt review";
  const stationAssetSummary = [
    question.chartRows?.length ? `${question.chartRows.length} chart points` : null,
    question.chartReview?.labs?.length ? `${question.chartReview.labs.length} labs` : question.labs?.length ? `${question.labs.length} labs` : null,
    question.chartReview?.diagnostics?.length ? `${question.chartReview.diagnostics.length} diagnostics` : null,
    references.length ? `${references.length} references` : null,
    studyResources.length ? `${studyResources.length} free study links` : null,
    diagramBlueprint ? "diagram ready" : null,
  ]
    .filter(Boolean)
    .join(" // ");
  const questionDensity = getQuestionDensity(question);
  const optionCount = question.options?.length ?? 0;
  const isCaseDriven = question.kind === "case-study"
    || question.kind === "bow-tie"
    || Boolean(question.caseContext || question.scenario || question.additionalInfo || question.caseTitle || question.scenarioTitle || question.exhibits?.length);
  const hasChartReviewMetadata = Boolean(
    question.chartReview
    && (
      question.chartReview.hpi?.length
      || question.chartReview.timeline?.length
      || question.chartReview.labs?.length
      || question.chartReview.diagnostics?.length
      || question.chartReview.notes?.length
    ),
  );
  const hasReviewStation = isCaseDriven
    || hasChartReviewMetadata
    || Boolean(question.chartRows?.length || question.vitals?.length || question.hemodynamics?.length || question.labs?.length || labExhibits.length || orderExhibits.length || noteExhibits.length);
  const preferredIntelTab = (hasReviewStation ? "chart" : answered ? "rationale" : getPreferredIntelTab(question, answered)) as IntelTab;
  const preAnswerChecklist = buildPreAnswerChecklist(question, orderExhibits.length > 0, noteExhibits.length > 0);
  const debriefInsights = buildDebriefInsights(question, answerRecord);
  const answerTarget = answered && answerRecord?.correctAnswer ? formatAnswerValue(answerRecord.correctAnswer) : "locked until submit";
  const clinicalSnapshot = [
    ...(question.chartReview?.hpi ?? []).slice(0, 3),
    question.scenarioTitle,
    question.caseTitle,
    question.scenario ?? question.caseContext ?? question.additionalInfo ?? null,
    ...flattenExhibitItems(noteExhibits).slice(0, 4),
  ].filter(Boolean) as string[];
  const casePresentationItems = [
    ...(question.chartReview?.hpi ?? []).slice(0, 2),
    question.caseTitle ?? question.scenarioTitle ?? question.chartTitle ?? null,
    question.scenario ?? question.caseContext ?? question.additionalInfo ?? null,
    ...flattenExhibitItems(noteExhibits).slice(0, 3),
  ].filter(Boolean) as string[];
  const activeOrders = [...(question.chartReview?.orders ?? []), ...flattenExhibitItems(orderExhibits)].slice(0, 6);
  const flaggedMetrics = [
    ...(question.chartReview?.diagnostics ?? []),
    ...(question.chartReview?.labs ?? []),
    ...(question.vitals ?? []),
    ...(question.hemodynamics ?? []),
    ...(question.labs ?? []),
  ].filter((item) => item.flag && item.flag !== "normal");
  const diagnosticSignals = [...(question.chartReview?.diagnostics ?? []), ...(question.vitals ?? []), ...(question.hemodynamics ?? []), ...(question.chartReview?.labs ?? []), ...(question.labs ?? [])].slice(0, 8);
  const priorityAbnormalities = flaggedMetrics.slice(0, 5);
  const chartTrendSummary = question.chartRows?.flatMap((row) =>
    row.values.map((value) => ({
      time: row.time,
      label: value.label,
      value: value.value,
      flag: value.flag,
    })),
  ) ?? [];
  const chartTrendStatus = getChartTrendStatus(question.chartRows);
  const correctOrdering = !answered
    ? []
    : Array.isArray(answerRecord?.correctAnswer)
    ? answerRecord.correctAnswer
    : Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : [];
  const hpiReviewItems = clinicalSnapshot.length ? clinicalSnapshot.slice(0, 4) : [chartFocusCaption];
  const timelineReviewItems = [
    ...(question.chartReview?.timeline ?? []),
    ...(question.chartRows?.map((row) => `${row.time}: ${row.values.map((value) => `${value.label} ${value.value}`).join(", ")}`) ?? []),
  ].slice(0, 7);
  const diagnosticReviewItems = [
    ...diagnosticSignals.map((item) => `${item.label}: ${item.value}${getMetricRefRange(item.label) ? ` (${getMetricRefRange(item.label)})` : ""}`),
    ...flattenExhibitItems(labExhibits).slice(0, 4),
  ].slice(0, 8);
  const orderReviewItems = activeOrders.length ? activeOrders : ["No active orders provided for this item."];
  const notesReviewItems = [
    ...(question.chartReview?.notes ?? []),
    ...(question.chartRows?.map((row) => `${row.time}: ${row.values.map((value) => `${value.label} ${value.value}`).join(", ")}`) ?? []),
    ...flattenExhibitItems(noteExhibits).slice(0, 4),
  ].slice(0, 7);
  const patientHeaderStats = [
    {
      label: "track",
      value: question.exam === "nclex" ? "nclex study" : "critical care",
    },
    {
      label: "review",
      value: answered ? "debrief open" : "pre-answer",
    },
    {
      label: "alerts",
      value: flaggedMetrics.length ? `${flaggedMetrics.length} flagged` : "stable cues",
    },
  ];
  const chartWatchlist = (answered ? debriefInsights : preAnswerChecklist).slice(0, 4);
  const ehrPriorityCues = Array.from(new Set([
    ...priorityAbnormalities.map((item) => `${item.label}: ${item.value} ${getMetricFlagLabel(item.flag)}`),
    ...chartWatchlist,
  ])).slice(0, 4);
  const defaultEhrTab: EhrTab = answered
    ? "rationale"
    : timelineReviewItems.length
      ? "timeline"
      : question.chartReview?.labs?.length || question.labs?.length || labExhibits.length
        ? "labs"
        : activeOrders.length
          ? "orders"
          : "hpi";
  const stationSections: Array<{ id: EhrTab; label: string; value: string; locked?: boolean; priority?: boolean }> = [
    {
      id: "hpi",
      label: "hpi",
      value: hpiReviewItems.length ? `${hpiReviewItems.length} entries` : "prompt frame",
    },
    {
      id: "timeline",
      label: "timeline",
      value: timelineReviewItems.length ? `${timelineReviewItems.length} events` : chartSignalLabel,
      priority: Boolean(timelineReviewItems.length),
    },
    {
      id: "labs",
      label: "labs",
      value: question.chartReview?.labs?.length ? `${question.chartReview.labs.length} tracked` : question.labs?.length ? `${question.labs.length} tracked` : "none loaded",
      priority: Boolean(priorityAbnormalities.length),
    },
    {
      id: "orders",
      label: "orders",
      value: activeOrders.length ? `${activeOrders.length} queued` : "no active queue",
    },
    {
      id: "diagnostics",
      label: "diagnostics",
      value: diagnosticReviewItems.length ? `${diagnosticReviewItems.length} signals` : chartSignalLabel,
    },
    {
      id: "notes",
      label: "notes",
      value: notesReviewItems.length ? `${notesReviewItems.length} notes` : "context",
    },
    {
      id: "rationale",
      label: "rationale",
      value: answered ? "open" : "after answer",
      locked: !answered,
    },
    {
      id: "tutor",
      label: "ai tutor",
      value: canOpenTutor ? "ready" : "after submit",
      locked: !canOpenTutor,
    },
  ];
  const chartSignalBoard = (priorityAbnormalities.length ? priorityAbnormalities : diagnosticSignals.slice(0, 4)).slice(0, 4);
  const rationaleReviewItems = [rationaleText, ...debriefInsights].filter(Boolean) as string[];
  const primaryCue = priorityAbnormalities[0]
    ? `${priorityAbnormalities[0].label}: ${priorityAbnormalities[0].value}`
    : chartWatchlist[0] ?? chartFocusCaption;
  const rationaleDiagramNodes = (visualRationale?.nodes?.length
    ? visualRationale.nodes.slice(0, 4)
    : [
      { label: "cue", value: primaryCue },
      { label: "pattern", value: diagramBlueprint?.focus ?? visualRationale?.caption ?? debriefInsights[0] ?? chartFocusTitle },
      { label: "move", value: answered ? answerTarget : "commit before reveal" },
      { label: "next rep", value: question.speedCue ?? question.takeaway ?? "repeat the pattern before the next item" },
    ]).filter((node) => node.label || node.value).slice(0, 4);
  const rationaleMicroCues = Array.from(new Set([
    ...priorityAbnormalities.map((item) => `${item.label} ${item.value}`),
    ...debriefInsights,
    question.takeaway,
    question.speedCue,
  ].filter(Boolean) as string[])).slice(0, 4);
  const tutorPromptCards = [
    {
      label: "why this wins",
      value: answered ? `explain why ${answerTarget} is safest` : "identify the unstable cue before the answer reveal",
    },
    {
      label: "miss trap",
      value: "show the distractor pattern",
    },
    {
      label: "faster next rep",
      value: question.speedCue ?? "turn this into a one-line bedside cue",
    },
  ];
  const chartReviewDefaultTab = toChartReviewTab(defaultEhrTab);
  const chartReviewModel = buildPracticeChartReviewModel({ question, answerRecord, canOpenTutor });
  const optionGridClassName = [
    "quiz-terminal-option-grid",
    question.kind === "bow-tie" ? "is-bow-tie" : "",
    optionCount >= 4 ? "is-two-up" : "",
    questionDensity === "dense" ? "is-dense" : "",
    questionDensity === "compact" ? "is-compact" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const availableTabs = useMemo(() => {
    const tabs: IntelTab[] = ["prompt"];
    if (hasReviewStation) tabs.push("chart");
    if (question.chartReview?.labs?.length || question.labs?.length || labExhibits.length) tabs.push("labs");
    if (question.chartReview?.orders?.length || orderExhibits.length) tabs.push("orders");
    if (question.chartReview?.notes?.length || noteExhibits.length || question.scenario || question.additionalInfo || question.caseContext) tabs.push("notes");
    if (answered) tabs.push("rationale");
    if (references.length || studyResources.length || visualRationale || diagramBlueprint) tabs.push("sources");
    if (question.tutorReady || canOpenTutor) tabs.push("tutor");
    return prioritizeIntelTabs(tabs, preferredIntelTab);
  }, [
    preferredIntelTab,
    canOpenTutor,
    answered,
    diagramBlueprint,
    labExhibits.length,
    noteExhibits.length,
    orderExhibits.length,
    hasReviewStation,
    hasChartReviewMetadata,
    isCaseDriven,
    question.additionalInfo,
    question.caseContext,
    question.chartReview?.labs?.length,
    question.chartReview?.notes?.length,
    question.chartReview?.orders?.length,
    question.chartRows?.length,
    question.hemodynamics?.length,
    question.labs?.length,
    question.scenario,
    question.vitals?.length,
    references.length,
    studyResources.length,
    visualRationale,
  ]);
  const [intelTab, setIntelTab] = useState<IntelTab>(getPreferredIntelTab(question, answered));
  const [rationaleExpanded, setRationaleExpanded] = useState(false);
  const scoringRows = answered
    ? [
        { label: "credit", value: answerRecord?.correct ? "1 / 1" : "0 / 1" },
        { label: "selected", value: formatAnswerValue(answerRecord?.selected) },
        { label: "target", value: answerTarget },
        { label: "scoring rule", value: getScoringRuleLabel(question) },
      ]
    : [];

  useEffect(() => {
    const nextTab = availableTabs.includes("chart") ? "chart" : preferredIntelTab;
    setIntelTab(availableTabs.includes(nextTab) ? nextTab : availableTabs[0] ?? "prompt");
  }, [availableTabs, preferredIntelTab]);

  if ((question.exam as string) === "nclex") {
    return (
      <NclexExamPane
        question={question}
        draftAnswer={draftAnswer}
        answerRecord={answerRecord}
        onChange={onChange}
        onSubmit={onSubmit}
        onNext={onNext}
        onPrev={onPrev}
        onJump={onJump}
        onToggleFlag={onToggleFlag}
        onOpenTutor={onOpenTutor}
        onEnd={onEnd}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        canGoNext={canGoNext}
        canGoPrev={canGoPrev}
        questionStatuses={questionStatuses}
        canOpenTutor={canOpenTutor}
        phase={phase}
      />
    );
  }

  return (
    <div className={`quiz-workspace quiz-workspace-fit quiz-workspace-${questionDensity}`}>
      <section className={`quiz-pane quiz-focus-pane quiz-density-${questionDensity}`}>
        <div className="quiz-focus-head">
          <div className="flex flex-wrap items-center gap-2">
            <span className="quiz-chip quiz-chip-accent">{question.exam.toUpperCase()}</span>
            <span className="quiz-chip">{question.kind.replace("-", " ")}</span>
            <span className="quiz-chip">q {questionNumber}/{totalQuestions}</span>
            {currentFlagged ? <span className="quiz-chip">flagged</span> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {answered ? (
              <div className={`quiz-result-pill ${answerRecord?.correct ? "is-correct" : "is-review"}`}>
                {answerRecord?.correct ? "correct" : `review | ${formatAnswerValue(answerRecord?.correctAnswer)}`}
              </div>
            ) : null}
            {sourceSignals && answered ? <span className="quiz-terminal-copy">{sourceSignals}</span> : null}
          </div>
        </div>

        <div className="quiz-focus-body">
          <div className={`quiz-focus-center quiz-focus-center-${questionDensity}`}>
            {issues.length > 0 ? (
              <div className="quiz-terminal-alert-subtle">
                Incomplete question data detected: {issues.join(", ")}. The interface will replace missing context instead of leaving the pane blank.
              </div>
            ) : null}

            <div className={`quiz-focus-stem-shell quiz-focus-stem-shell-${questionDensity}`}>
              <div className="quiz-focus-stem-meta">
                <span className="quiz-terminal-kicker">question prompt</span>
                {question.chartRows?.length || question.vitals?.length || question.hemodynamics?.length ? <span className="quiz-chip">chart beside prompt</span> : null}
                {question.labs?.length || labExhibits.length ? <span className="quiz-chip">labs ready</span> : null}
                {question.tutorReady ? <span className="quiz-chip">tutor ready</span> : null}
              </div>
              <p className={`quiz-focus-stem quiz-focus-stem-${questionDensity}`}>{question.stem}</p>
              {isCaseDriven && casePresentationItems.length ? (
                <div className="quiz-case-context-strip" aria-label="case context">
                  <div className="quiz-case-context-head">
                    <span>case context</span>
                    <strong>{chartFocusTitle}</strong>
                  </div>
                  <div className="quiz-case-context-grid">
                    {casePresentationItems.slice(0, 3).map((item, index) => (
                      <span key={`${item}-${index}`}>{item}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {question.kind === "matrix" && question.matrixRows?.length && matrixColumns.length ? (
              <div className={`quiz-terminal-answer-shell quiz-terminal-answer-shell-${questionDensity}`}>
                <div className="quiz-answer-shell-head">
                  <p className="quiz-terminal-kicker">matrix response</p>
                  <p className="quiz-terminal-copy">Map each finding to the safest interpretation.</p>
                </div>
                <div className={`quiz-answer-scroll quiz-answer-scroll-${questionDensity}`}>
                  <div className={`quiz-terminal-matrix-wrap quiz-terminal-matrix-wrap-${questionDensity}`}>
                    <div className={`quiz-terminal-matrix quiz-terminal-matrix-${questionDensity}`}>
                      <div className="quiz-terminal-matrix-head">
                        <span>Finding</span>
                        {matrixColumns.map((column) => <span key={column}>{column}</span>)}
                      </div>
                      {question.matrixRows.map((row) => (
                        <div key={row.label} className="quiz-terminal-matrix-row">
                          <span className="quiz-terminal-matrix-label">{row.label}</span>
                          {matrixColumns.map((column) => {
                            const selected = matrixAnswerMap[row.label] === column;
                            const correct = row.answer === column;
                            return (
                              <button
                                key={`${row.label}-${column}`}
                                type="button"
                                aria-pressed={selected}
                                data-selected={selected ? "true" : "false"}
                                disabled={isLocked}
                                onClick={() => onChange({ ...matrixAnswerMap, [row.label]: column })}
                                className={`quiz-matrix-cell ${selected ? "is-selected" : ""} ${answered && correct ? "is-correct" : ""} ${answered && selected && !correct ? "is-incorrect" : ""}`}
                              >
                                {column}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {question.kind === "ordering" && question.options ? (
              <div className={`quiz-terminal-answer-shell quiz-terminal-answer-shell-${questionDensity}`}>
                <div className="quiz-answer-shell-head">
                  <p className="quiz-terminal-kicker">ordered response</p>
                  <p className="quiz-terminal-copy">Build the safest sequence, then tighten the order.</p>
                </div>
                <div className={`quiz-answer-scroll quiz-answer-scroll-${questionDensity}`}>
                  <div className={`quiz-terminal-ordering quiz-terminal-ordering-${questionDensity}`}>
                    <div className="quiz-ordering-panel">
                      <p className="quiz-terminal-kicker">available steps</p>
                      <div className="mt-3 grid gap-2">
                        {question.options.filter((option) => !orderingDraft.includes(option.id)).map((option) => (
                          <button key={option.id} type="button" disabled={isLocked} onClick={() => onChange(appendOrderingStep(draftAnswer, option.id))} className="quiz-ordering-chip">
                            <span>{option.id.toUpperCase()}</span>
                            <strong>{option.text}</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="quiz-ordering-panel">
                      <p className="quiz-terminal-kicker">current order</p>
                      <div className="mt-3 grid gap-2">
                        {orderingDraft.length > 0 ? orderingDraft.map((optionId, index) => {
                          const option = question.options?.find((item) => item.id === optionId);
                          if (!option) return null;
                          const correctAtIndex = correctOrdering[index] === optionId;
                          return (
                            <div key={`${option.id}-${index}`} data-selected="true" className={`quiz-ordering-row is-selected ${answered && correctAtIndex ? "is-correct" : ""} ${answered && !correctAtIndex ? "is-incorrect" : ""}`}>
                              <span>{index + 1}</span>
                              <strong>{option.text}</strong>
                              <div className="flex gap-2">
                                <button type="button" disabled={isLocked || index === 0} onClick={() => onChange(moveOrderingStep(draftAnswer, index, -1))} className="quiz-ordering-mini">Up</button>
                                <button type="button" disabled={isLocked || index === orderingDraft.length - 1} onClick={() => onChange(moveOrderingStep(draftAnswer, index, 1))} className="quiz-ordering-mini">Down</button>
                                <button type="button" disabled={isLocked} onClick={() => onChange(removeOrderingStep(draftAnswer, option.id))} className="quiz-ordering-mini">Drop</button>
                              </div>
                            </div>
                          );
                        }) : <div className="quiz-ordering-empty">Add the first action, then refine the sequence.</div>}
                        {answered && correctOrdering.length ? (
                          <div className="quiz-ordering-target">
                            <span>correct sequence</span>
                            <strong>
                              {correctOrdering.map((id, index) => {
                                const option = question.options?.find((item) => item.id === id);
                                return `${index + 1}. ${option?.text ?? id.toUpperCase()}`;
                              }).join("  /  ")}
                            </strong>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {question.kind !== "matrix" && question.kind !== "ordering" && question.options ? (
              <div className={`quiz-terminal-answer-shell quiz-terminal-answer-shell-${questionDensity}`}>
                <div className="quiz-answer-shell-head">
                  <p className="quiz-terminal-kicker">{question.kind === "multi-select" ? "select all that apply" : "response options"}</p>
                  <p className="quiz-terminal-copy">{question.kind === "bow-tie" ? "Trace clue, move, and outcome before you commit." : "Stay with the highest-risk physiology before you answer."}</p>
                </div>
                {question.kind === "bow-tie" ? (
                  <div className="mb-3 grid gap-2 rounded-[18px] border border-[rgba(90,127,136,0.16)] bg-[rgba(90,127,136,0.07)] p-3 text-sm md:grid-cols-3">
                    <div>
                      <span className="quiz-terminal-kicker">Condition</span>
                      <strong className="mt-1 block text-[var(--quiz-ink-strong)]">most likely problem</strong>
                    </div>
                    <div>
                      <span className="quiz-terminal-kicker">Actions</span>
                      <strong className="mt-1 block text-[var(--quiz-ink-strong)]">priority nursing moves</strong>
                    </div>
                    <div>
                      <span className="quiz-terminal-kicker">Monitor</span>
                      <strong className="mt-1 block text-[var(--quiz-ink-strong)]">response and complication cues</strong>
                    </div>
                  </div>
                ) : null}
                <div className={`quiz-answer-scroll quiz-answer-scroll-${questionDensity}`}>
                  <div className={optionGridClassName}>
                    {question.options.map((option) => {
                      const selected = isSelectedChoice(draftAnswer, option.id);
                      const correct = isCorrectChoice(question, option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          aria-pressed={selected}
                          data-selected={selected ? "true" : "false"}
                          disabled={isLocked}
                          onClick={() => onChange(question.kind === "multi-select" ? updateMultiSelect(draftAnswer, option.id) : option.id)}
                          className={`quiz-option-card quiz-option-card-${questionDensity} ${selected ? "is-selected" : ""} ${answered && correct ? "is-correct" : ""} ${answered && selected && !correct ? "is-incorrect" : ""}`}
                        >
                          <span className={`quiz-option-index quiz-option-index-${questionDensity}`}>{option.id.toUpperCase()}</span>
                          <span className={`quiz-option-text quiz-option-text-${questionDensity}`}>{option.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="quiz-focus-dock">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onToggleFlag} className="quiz-terminal-link">{currentFlagged ? "unflag" : "flag"}</button>
            {canOpenTutor ? <button type="button" onClick={onOpenTutor} className="quiz-terminal-link">open ai tutor</button> : null}
            <span className="quiz-terminal-copy">{answeredCount}/{totalQuestions} answered</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onPrev} disabled={!canGoPrev} className="quiz-terminal-link">prev</button>
            <button type="button" onClick={onSubmit} className="quiz-terminal-toggle is-active">{answered ? "saved" : "submit"}</button>
            <button type="button" onClick={onNext} disabled={!canGoNext} className="quiz-terminal-link">next</button>
          </div>
        </div>
      </section>

      <aside className="quiz-pane quiz-intel-pane" data-exam={question.exam} data-review-state={answered ? "debrief" : "preanswer"}>
        <div className="quiz-intel-shell">
          <div className="quiz-intel-monitor-bar">
            <div className="quiz-intel-monitor-brand">
              <span className="quiz-intel-monitor-leds" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>{intelStationLabel}</span>
            </div>
            <div className="quiz-intel-monitor-meta">
              <span>{intelStationMode}</span>
              <span>{question.exam === "nclex" ? "bedside // simulator" : "icu // simulator"}</span>
            </div>
          </div>

          <div className="quiz-intel-monitor-frame">
            <div className="quiz-intel-monitor-housing" aria-hidden="true">
              <span className="quiz-intel-monitor-corner quiz-intel-monitor-corner-a" />
              <span className="quiz-intel-monitor-corner quiz-intel-monitor-corner-b" />
              <span className="quiz-intel-monitor-corner quiz-intel-monitor-corner-c" />
              <span className="quiz-intel-monitor-corner quiz-intel-monitor-corner-d" />
              <span className="quiz-intel-monitor-vent quiz-intel-monitor-vent-a" />
              <span className="quiz-intel-monitor-vent quiz-intel-monitor-vent-b" />
            </div>
            <div className="quiz-intel-screen">
              <div className="quiz-intel-screen-noise" aria-hidden="true" />
              <div className="quiz-intel-screen-reflection" aria-hidden="true" />
              <div className="quiz-intel-screen-pixels" aria-hidden="true" />

              <div className="quiz-intel-top">
                <div className="quiz-intel-status-strip">
                  <div className="quiz-intel-status-cell">
                    <span>mode</span>
                    <strong>{question.kind.replace("-", " ")}</strong>
                  </div>
                  <div className="quiz-intel-status-cell">
                    <span>debrief</span>
                    <strong>{answered ? "open" : "locked"}</strong>
                  </div>
                  <div className="quiz-intel-status-cell">
                    <span>tutor</span>
                    <strong>{canOpenTutor ? "ready" : "after submit"}</strong>
                  </div>
                  <div className="quiz-intel-status-cell">
                    <span>tier</span>
                    <strong>{tier === "free" ? "preview" : tier}</strong>
                  </div>
                </div>
                <div className="quiz-intel-cockpit-row">
                  <div className="quiz-intel-cockpit-cell">
                    <span>focus</span>
                    <strong>{chartFocusTitle}</strong>
                  </div>
                  <div className="quiz-intel-cockpit-cell">
                    <span>signal</span>
                    <strong>{question.chartRows?.length ? "trend live" : question.labs?.length ? "labs live" : "prompt live"}</strong>
                  </div>
                  <div className="quiz-intel-cockpit-cell">
                    <span>unlock</span>
                    <strong>{answered ? "debrief open" : "await response"}</strong>
                  </div>
                </div>
                <div className="quiz-intel-command-row">
                  <div className="quiz-monitor-callout quiz-monitor-callout-primary">
                    <strong>{answered ? "debrief aligned" : "review before answer"}</strong>
                    <span>
                      {answered
                        ? (diagramBlueprint?.focus
                          ?? visualRationale?.conclusion
                          ?? "Use the rationale, source trail, and tutor follow-up to turn this question into a reusable pattern.")
                        : preAnswerChecklist[0]}
                    </span>
                  </div>
                  <div className="quiz-intel-command-side">
                    <div className="quiz-intel-signal-bars" aria-hidden="true">
                      <span className="is-active" />
                      <span className="is-active" />
                      <span className={answered ? "is-active" : ""} />
                      <span className={canOpenTutor ? "is-active" : ""} />
                      <span className={question.chartRows?.length || question.vitals?.length ? "is-active" : ""} />
                    </div>
                    <button type="button" disabled={!canOpenTutor} onClick={onOpenTutor} className={`quiz-terminal-toggle ${canOpenTutor ? "is-active" : ""}`}>
                      {canOpenTutor ? "ask ai tutor" : "submit to unlock tutor"}
                    </button>
                  </div>
                </div>
                <div className="quiz-intel-scope-row">
                  <div className="quiz-intel-scope-card quiz-intel-scope-card-primary quiz-intel-scope-card-focus">
                    <span className="quiz-terminal-kicker">focus target</span>
                    <strong>{chartFocusTitle}</strong>
                    <p>{chartFocusCaption}</p>
                  </div>
                  <div className="quiz-intel-scope-card quiz-intel-scope-card-pattern">
                    <span className="quiz-terminal-kicker">pattern lock</span>
                    <strong>{question.takeaway ?? "protect oxygenation, perfusion, or neuro status first"}</strong>
                    <p>{question.speedCue ?? "Map the unstable clue to one safest immediate move."}</p>
                  </div>
                  <div className="quiz-intel-scope-card quiz-intel-scope-card-assets">
                    <span className="quiz-terminal-kicker">asset bus</span>
                    <strong>{answered ? "debrief live" : "review staged"}</strong>
                    <p>{stationAssetSummary || "Prompt, chart, rationale, and tutor stay attached to the same question object."}</p>
                  </div>
                </div>
                <div className="quiz-intel-guidance-strip">
                  {(answered ? debriefInsights : preAnswerChecklist).slice(0, 3).map((item, index) => (
                    <div key={`${item}-${index}`} className="quiz-intel-guidance-pill">
                      <span>{answered ? "next pass" : "review cue"}</span>
                      <strong>{item}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="quiz-rail-section quiz-rail-tabs">
                {availableTabs.map((tab) => (
                  <button key={tab} type="button" onClick={() => setIntelTab(tab)} className={`quiz-rail-tab ${intelTab === tab ? "is-active" : ""}`}>
                    {getIntelTabLabel(tab, question)}
                  </button>
                ))}
              </div>

              <div className="quiz-rail-content quiz-intel-worksurface">
            {intelTab === "prompt" ? (
              <div className="quiz-rail-stack">
                <div className="quiz-monitor-patient-card">
                  <div className="quiz-monitor-patient-header">
                    <span className="quiz-monitor-active-badge">active encounter</span>
                    <span className="quiz-terminal-kicker">{question.exam === "nclex" ? "nclex context" : "icu context"}</span>
                  </div>
                  <div className="quiz-monitor-patient-body">
                    {contextTitle ? (
                      <div className="quiz-monitor-patient-row">
                        <span>context</span>
                        <strong>{contextTitle}</strong>
                      </div>
                    ) : null}
                    {question.category ? (
                      <div className="quiz-monitor-patient-row">
                        <span>focus</span>
                        <strong>{question.category}</strong>
                      </div>
                    ) : null}
                    {question.exhibits?.filter((e) => e.type === "assessment").slice(0, 1).map((e) => (
                      <div key={e.title} className="quiz-monitor-patient-row">
                        <span>pmh</span>
                        <strong>{e.body ?? e.items?.slice(0, 2).join(", ") ?? e.title}</strong>
                      </div>
                    ))}
                    <div className="quiz-monitor-patient-row">
                      <span>allergies</span>
                      <strong>NKDA</strong>
                    </div>
                    <div className="quiz-monitor-patient-row">
                      <span>track</span>
                      <strong>{question.exam === "nclex" ? "nclex study" : "critical care"}</strong>
                    </div>
                    <div className="quiz-monitor-patient-row">
                      <span>status</span>
                      <strong>{answered ? "debrief open" : "pre-answer"}</strong>
                    </div>
                  </div>
                </div>
                {promptSupport.length ? (
                  <div className="quiz-rail-card">
                    <p className="quiz-terminal-kicker">priority lens</p>
                    <div className="mt-3 grid gap-2">
                      {promptSupport.map((item, index) => (
                        <div key={`${item}-${index}`} className="quiz-rail-row">
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="quiz-rail-card">
                    <p className="quiz-terminal-kicker">prompt lens</p>
                    <p className="mt-3 text-sm leading-7 text-[var(--quiz-muted)]">Read the prompt, unstable cue, and answer options together before you commit.</p>
                  </div>
                )}
                {(question.scenario || question.additionalInfo || question.caseContext) ? (
                  <div className="quiz-rail-card">
                    <p className="quiz-terminal-kicker">clinical notes</p>
                    <p className="quiz-rail-prose mt-3 whitespace-pre-line text-sm leading-7 text-[var(--quiz-muted)]">{question.scenario ?? question.additionalInfo ?? question.caseContext}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

          {intelTab === "chart" ? (
            <div className="quiz-rail-stack">
              <div className="quiz-monitor-terminal-grid">
                <div className="quiz-monitor-terminal-main">
                  <div className="quiz-monitor-terminal-shell">
                    <span className="quiz-monitor-shell-label">$ patient_chart</span>
                    <span className="quiz-monitor-shell-status">{question.chartRows?.length ? "trend stream active" : "chart summary loaded"}</span>
                  </div>
                  <ClinicalReviewStation
                    model={chartReviewModel}
                    defaultTab={chartReviewDefaultTab}
                    resetKey={`${question.id}-${answered ? "answered" : "active"}`}
                    onOpenTutor={onOpenTutor}
                  />
                  <div className="quiz-rail-card quiz-monitor-encounter-shell">
                    <div className="quiz-monitor-encounter-head">
                      <div>
                        <p className="quiz-terminal-kicker">encounter workspace</p>
                        <strong>{answered ? "review + rationale station" : "exam-day chart review station"}</strong>
                      </div>
                      <span className="quiz-chip">{question.exam === "nclex" ? "study ehr" : "critical care review"}</span>
                    </div>
                    <div className="quiz-monitor-tab-ribbon">
                      {stationSections.map((section) => (
                        <div key={section.label} className="quiz-monitor-tab-chip">
                          <span>{section.label}</span>
                          <strong>{section.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="quiz-rail-card quiz-monitor-patient-strip">
                    <div className="quiz-monitor-patient-ident">
                      <p className="quiz-terminal-kicker">patient frame</p>
                      <strong>{chartFocusTitle}</strong>
                      <p>{chartFocusCaption}</p>
                    </div>
                    <div className="quiz-monitor-patient-stats">
                      {patientHeaderStats.map((item) => (
                        <div key={item.label} className="quiz-monitor-patient-stat">
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="quiz-rail-card quiz-monitor-hero-card quiz-monitor-hero-card-primary">
                    <p className="quiz-terminal-kicker">chart focus</p>
                    <div className="quiz-monitor-hero-copy">
                      <strong>{answered ? "debrief the chart pattern and lock the cue" : "review the bedside chart before choosing an answer"}</strong>
                      <span>{answered ? debriefInsights[0] : preAnswerChecklist[0] ?? chartFocusCaption}</span>
                    </div>
                  </div>
                  <div className="quiz-monitor-record-grid">
                    {question.chartRows?.length ? (
                      <div className="quiz-rail-card quiz-monitor-rationale-primary quiz-monitor-record-card">
                        <div className="quiz-monitor-record-head">
                          <div>
                            <p className="quiz-terminal-kicker">flowsheet timeline</p>
                            <strong>sequence of events</strong>
                          </div>
                          <div className="flex items-center gap-2">
                            {chartTrendStatus ? (
                              <span className={`quiz-monitor-trend-status is-${chartTrendStatus}`}>{chartTrendStatus}</span>
                            ) : null}
                            <span className="quiz-chip">{question.chartRows.length} entries</span>
                          </div>
                        </div>
                        <div className="quiz-monitor-event-log mt-3">
                          {question.chartRows.map((row) => (
                            <div key={row.time} className="quiz-monitor-event-row">
                              <span className="quiz-monitor-event-marker" aria-hidden="true" />
                              <strong>{row.time}</strong>
                              <div className="quiz-monitor-event-values mt-2 grid gap-2">
                                {row.values.map((value) => <span key={`${row.time}-${value.label}`} className="quiz-chip">{value.label}: {value.value}</span>)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {diagnosticSignals.length ? (
                      <div className="quiz-rail-card quiz-monitor-rationale-card quiz-monitor-diagnostic-card quiz-monitor-record-card">
                        <div className="quiz-monitor-record-head">
                          <div>
                            <p className="quiz-terminal-kicker">assessment + diagnostics</p>
                            <strong>critical findings</strong>
                          </div>
                          {priorityAbnormalities.length ? <span className="quiz-chip">{priorityAbnormalities.length} abnormal</span> : null}
                        </div>
                        <div className="quiz-monitor-metric-grid mt-3">
                          {diagnosticSignals.map((item) => (
                            <div key={`${item.label}-${item.value}`} className={`quiz-monitor-metric-card ${item.flag === "critical" ? "is-critical" : item.flag === "high" ? "is-high" : item.flag === "low" ? "is-low" : ""}`}>
                              <span>{item.label}</span>
                              <strong>{item.value}<em className="quiz-monitor-metric-trend">{getTrendArrow(item.flag)}</em></strong>
                              <em className={`quiz-monitor-metric-flag is-${item.flag ?? "normal"}`}>{getMetricFlagLabel(item.flag)}</em>
                              {getMetricRefRange(item.label) ? <em className="quiz-monitor-metric-ref">{getMetricRefRange(item.label)}</em> : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="quiz-monitor-terminal-side">
                  <div className="quiz-monitor-terminal-shell">
                    <span className="quiz-monitor-shell-label">$ study_ehr</span>
                    <span className="quiz-monitor-shell-status">{answered ? "rationale + cue review" : "chart review + cue capture"}</span>
                  </div>
                  {answered ? (
                    <div className="quiz-rail-card quiz-study-ehr-debrief">
                      <div className="quiz-monitor-record-head">
                        <div>
                          <p className="quiz-terminal-kicker">post-question debrief</p>
                          <strong>{answerRecord?.correct ? "safe decision recognized" : `target: ${answerTarget}`}</strong>
                        </div>
                        <span className={`quiz-study-ehr-status is-open`}>{answerRecord?.correct ? "green" : "review"}</span>
                      </div>
                      <p className="quiz-rail-prose mt-3 text-sm leading-7 text-[var(--quiz-muted)]">{rationaleText}</p>
                      <div className="quiz-study-ehr-debrief-actions">
                        {diagramBlueprint ? <span>diagram: {diagramBlueprint.focus}</span> : null}
                        {references.length ? <span>{references.length} cited source{references.length === 1 ? "" : "s"}</span> : null}
                        <button type="button" disabled={!canOpenTutor} onClick={onOpenTutor}>{canOpenTutor ? "ask ai tutor" : "tutor locked"}</button>
                      </div>
                    </div>
                  ) : null}
                  <div className="quiz-rail-card quiz-monitor-station-map">
                    <div className="quiz-monitor-station-board-head">
                      <p className="quiz-terminal-kicker">station map</p>
                      <span className="quiz-chip">review path</span>
                    </div>
                    <div className="quiz-monitor-section-list">
                      {stationSections.map((section) => (
                        <div key={section.label} className="quiz-monitor-section-row">
                          <span>{section.label}</span>
                          <strong>{section.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="quiz-rail-card quiz-monitor-station-board quiz-monitor-study-board">
                    <div className="quiz-monitor-station-board-head">
                      <p className="quiz-terminal-kicker">study board</p>
                      <span className="quiz-chip">{chartSignalLabel}</span>
                    </div>
                    <div className="quiz-monitor-station-board-grid">
                      <div className="quiz-monitor-station-cell">
                        <span>cue state</span>
                        <strong>{answered ? "answer reconciled" : "awaiting decision"}</strong>
                      </div>
                      <div className="quiz-monitor-station-cell">
                        <span>chart assets</span>
                        <strong>{stationAssetSummary || "prompt-linked"}</strong>
                      </div>
                    </div>
                    <div className="quiz-monitor-study-tags">
                      {chartWatchlist.slice(0, 3).map((item, index) => (
                        <span key={`${item}-${index}`} className="quiz-monitor-study-chip">{item}</span>
                      ))}
                    </div>
                  </div>
                  <div className="quiz-rail-card quiz-monitor-watchlist-card">
                    <div className="quiz-monitor-record-head">
                      <div>
                        <p className="quiz-terminal-kicker">{answered ? "debrief watchlist" : "priority watchlist"}</p>
                        <strong>{answered ? "lock the lesson before next question" : "scan these cues first"}</strong>
                      </div>
                      <span className="quiz-chip">{chartWatchlist.length} cues</span>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {chartWatchlist.map((item, index) => (
                        <div key={`${item}-${index}`} className="quiz-rail-row">
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {clinicalSnapshot.length ? (
                    <div className="quiz-rail-card quiz-monitor-source-card quiz-monitor-doc-card">
                      <p className="quiz-terminal-kicker">clinical snapshot</p>
                      <div className="mt-3 grid gap-2">
                        {clinicalSnapshot.slice(0, 4).map((item, index) => (
                          <div key={`${item}-${index}`} className="quiz-rail-row">
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                    <div className="quiz-rail-card quiz-monitor-note-card quiz-monitor-note-card-emphasis quiz-monitor-doc-card">
                      <p className="quiz-terminal-kicker">{answered ? "next-pass cues" : "review checklist"}</p>
                      <div className="mt-3 grid gap-2">
                        {chartWatchlist.map((item, index) => (
                          <div key={`${item}-${index}`} className="quiz-rail-row">
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  {activeOrders.length ? (
                    <div className="quiz-rail-card quiz-monitor-tutor-card quiz-monitor-order-card">
                      <p className="quiz-terminal-kicker">active orders</p>
                      <div className="mt-3 grid gap-2">
                        {activeOrders.slice(0, 4).map((item, index) => (
                          <div key={`${item}-${index}`} className="quiz-rail-row">
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {priorityAbnormalities.length ? (
                    <div className="quiz-rail-card quiz-monitor-rationale-card quiz-monitor-trend-card">
                      <p className="quiz-terminal-kicker">priority abnormalities</p>
                      <div className="mt-3 grid gap-2">
                        {priorityAbnormalities.map((item) => (
                          <div key={`${item.label}-${item.value}-priority`} className="quiz-rail-row">
                            <strong>{item.label}</strong>
                            <span>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {chartSignalBoard.length ? (
                    <div className="quiz-rail-card quiz-monitor-rationale-primary quiz-monitor-signal-card">
                      <div className="quiz-monitor-record-head">
                        <div>
                          <p className="quiz-terminal-kicker">signal board</p>
                          <strong>{answered ? "pattern that should trigger faster next time" : "what matters most in the chart"}</strong>
                        </div>
                        <span className="quiz-chip">{chartSignalBoard.length} markers</span>
                      </div>
                      <div className="quiz-monitor-metric-grid mt-3">
                        {chartSignalBoard.map((item) => (
                          <div key={`${item.label}-${item.value}-signal`} className={`quiz-monitor-metric-card ${item.flag === "critical" ? "is-critical" : item.flag === "high" ? "is-high" : item.flag === "low" ? "is-low" : ""}`}>
                            <span>{item.label}</span>
                            <strong>{item.value}<em className="quiz-monitor-metric-trend">{getTrendArrow(item.flag)}</em></strong>
                            <em className={`quiz-monitor-metric-flag is-${item.flag ?? "normal"}`}>{getMetricFlagLabel(item.flag)}</em>
                            {getMetricRefRange(item.label) ? <em className="quiz-monitor-metric-ref">{getMetricRefRange(item.label)}</em> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {intelTab === "labs" ? (
            <div className="quiz-rail-stack">
              {question.labs?.length ? (
                <div className="quiz-rail-card quiz-monitor-source-card quiz-monitor-lab-card">
                  <div className="flex items-center justify-between gap-3">
                    <p className="quiz-terminal-kicker">labs</p>
                    {question.labs.some((item) => item.flag && item.flag !== "normal") ? <span className="quiz-chip">review abnormal first</span> : null}
                  </div>
                  <div className="quiz-monitor-metric-grid mt-3">
                    {question.labs.map((item) => (
                      <div key={`${item.label}-${item.value}`} className={`quiz-monitor-metric-card ${item.flag === "critical" ? "is-critical" : item.flag === "high" ? "is-high" : item.flag === "low" ? "is-low" : ""}`}>
                        <span>{item.label}</span>
                        <strong>{item.value}<em className="quiz-monitor-metric-trend">{getTrendArrow(item.flag)}</em></strong>
                        <em className={`quiz-monitor-metric-flag is-${item.flag ?? "normal"}`}>{getMetricFlagLabel(item.flag)}</em>
                        {getMetricRefRange(item.label) ? <em className="quiz-monitor-metric-ref">{getMetricRefRange(item.label)}</em> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {flaggedMetrics.length ? (
                <div className="quiz-rail-card quiz-monitor-rationale-primary quiz-monitor-lab-card">
                  <p className="quiz-terminal-kicker">priority abnormalities</p>
                  <div className="mt-3 grid gap-2">
                    {flaggedMetrics.slice(0, 5).map((item) => (
                      <div key={`${item.label}-${item.value}-flagged`} className="quiz-rail-row">
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {labExhibits.map((exhibit, index) => (
                <div key={`${exhibit.title}-${index}`} className="quiz-rail-card">
                  <p className="quiz-terminal-kicker">{exhibit.title}</p>
                  {exhibit.body ? <p className="quiz-rail-prose mt-3 text-sm leading-7 text-[var(--quiz-muted)]">{exhibit.body}</p> : null}
                </div>
              ))}
            </div>
          ) : null}

          {intelTab === "orders" ? (
            <div className="quiz-rail-stack">
              {(orderExhibits.length > 0 || activeOrders.length > 0) ? (
                <div className="quiz-rail-card quiz-monitor-tutor-card quiz-monitor-order-card">
                  <div className="flex items-center justify-between gap-3">
                    <p className="quiz-terminal-kicker">provider order sheet</p>
                    {(orderExhibits.flatMap((e) => e.items ?? []).some(isStatOrder) || activeOrders.some(isStatOrder))
                      ? <span className="quiz-chip">STAT present</span>
                      : null}
                  </div>
                  <div className="quiz-monitor-order-sheet">
                    {(orderExhibits.length > 0
                      ? orderExhibits.flatMap((exhibit) => [
                          ...(exhibit.items ?? []),
                          ...(exhibit.body ? [`${exhibit.title}: ${exhibit.body}`] : []),
                        ])
                      : activeOrders
                    ).map((item, index) => (
                      <div key={`${item}-${index}`} className={`quiz-monitor-order-row ${isStatOrder(item) ? "is-stat" : ""}`}>
                        <span className="quiz-monitor-order-check">[✓]</span>
                        <span className="flex-1">{item}</span>
                        {isStatOrder(item) ? <span className="quiz-monitor-order-stat-badge">STAT</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="quiz-rail-card quiz-monitor-source-card">
                  <p className="quiz-terminal-kicker">orders</p>
                  <p className="quiz-rail-prose mt-3 text-sm leading-7 text-[var(--quiz-muted)]">No active orders attached to this question.</p>
                </div>
              )}
            </div>
          ) : null}

          {intelTab === "notes" ? (
            <div className="quiz-rail-stack">
              {clinicalSnapshot.length ? (
                <div className="quiz-rail-card quiz-monitor-source-card quiz-monitor-doc-card">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="quiz-terminal-kicker">clinical snapshot</p>
                    <span className="quiz-monitor-note-type-badge">nursing note</span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {clinicalSnapshot.map((item, index) => (
                      <div key={`${item}-${index}`} className="quiz-rail-row">
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {chartTrendSummary.length ? (
                <div className="quiz-rail-card quiz-monitor-rationale-card quiz-monitor-trend-card">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="quiz-terminal-kicker">trend cue map</p>
                    <span className="quiz-monitor-note-type-badge">clinical timeline</span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {chartTrendSummary.slice(0, 5).map((item) => (
                      <div key={`${item.time}-${item.label}`} className="quiz-rail-row">
                        <strong>{item.time}</strong>
                        <span>{item.label}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {noteExhibits.map((exhibit, index) => (
                <div key={`${exhibit.title}-${index}`} className="quiz-rail-card">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="quiz-terminal-kicker">{exhibit.title}</p>
                    <span className="quiz-monitor-note-type-badge">{getExhibitNoteLabel(exhibit.type, exhibit.title)}</span>
                  </div>
                  {exhibit.body ? <p className="quiz-rail-prose mt-3 font-mono text-[0.78rem] leading-7 text-[var(--quiz-muted)]">{exhibit.body}</p> : null}
                </div>
              ))}
            </div>
          ) : null}

          {intelTab === "rationale" ? (
            <div className="quiz-rail-stack">
              {answered ? (
                <>
                  <div className="quiz-rail-card quiz-monitor-source-card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="quiz-terminal-kicker">NCLEX-style score report</p>
                      <span className="quiz-chip">{answerRecord?.correct ? "full credit" : "review required"}</span>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {scoringRows.map((row) => (
                        <div key={row.label} className="quiz-rail-row">
                          <strong>{row.label}</strong>
                          <span>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verdict cards */}
                  <div className="quiz-monitor-debrief-grid">
                    <div className="quiz-rail-card quiz-monitor-debrief-card">
                      <p className="quiz-terminal-kicker">result</p>
                      <strong className="quiz-monitor-debrief-title">{answerRecord?.correct ? "response matched safest action" : "review the safer move"}</strong>
                      <p className="quiz-rail-prose mt-3 text-sm leading-7 text-[var(--quiz-muted)]">
                        {answerRecord?.correct
                          ? "Keep the same recognition pattern on the next item: unstable clue first, safer action second."
                          : `Target answer: ${answerTarget}. Re-read the unstable clue, then ask which move protects the patient fastest.`}
                      </p>
                    </div>
                    <div className="quiz-rail-card quiz-monitor-debrief-card">
                      <p className="quiz-terminal-kicker">what to notice faster</p>
                      <div className="mt-3 grid gap-2">
                        {debriefInsights.map((item, index) => (
                          <div key={`${item}-${index}`} className="quiz-rail-row">
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Speed tip — always visible */}
                  {question.speedCue ? (
                    <div className="quiz-rationale-speed-tip">
                      <span className="quiz-rationale-speed-tip-icon" aria-hidden="true">⚡</span>
                      <div>
                        <span className="quiz-rationale-speed-tip-label">speed tip</span>
                        <span className="quiz-rationale-speed-tip-text">{question.speedCue}</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Compact / expanded rationale card */}
                  <div className="quiz-rail-card">
                    <div className="flex items-center justify-between gap-3">
                      <p className="quiz-terminal-kicker">rationale</p>
                      {answerRecord?.correct ? <span className="quiz-chip">correct</span> : <span className="quiz-chip">review</span>}
                    </div>
                    {question.takeaway ? (
                      <p className="mt-3 text-sm font-semibold leading-6 text-[var(--quiz-ink-strong)]">{question.takeaway}</p>
                    ) : null}
                    {rationaleExpanded ? (
                      <>
                        <p className="quiz-rail-prose mt-3 text-sm leading-7 text-[var(--quiz-muted)]">{rationaleText}</p>
                        <button type="button" onClick={() => setRationaleExpanded(false)} className="quiz-rationale-toggle-btn">
                          collapse ↑
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setRationaleExpanded(true)} className="quiz-rationale-toggle-btn">
                        show full rationale →
                      </button>
                    )}
                  </div>

                  {/* Expanded section — distractor review, coaching, diagram */}
                  {rationaleExpanded ? (
                    <div className="quiz-rationale-expanded-body">
                      {answerRecord?.distractorRationales ? (
                        <div className="quiz-rail-card quiz-monitor-rationale-card">
                          <p className="quiz-terminal-kicker">distractor review</p>
                          <div className="mt-3 grid gap-2">
                            {Object.entries(answerRecord.distractorRationales).map(([label, explanation]) => (
                              <div key={label} className="quiz-rail-row">
                                <strong>{label.toUpperCase()}</strong>
                                <span>{explanation}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {coachingFrame.length ? (
                        <div className="quiz-rail-card">
                          <p className="quiz-terminal-kicker">coaching frame</p>
                          <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--quiz-muted)]">
                            {coachingFrame.map((item, index) => <li key={`${item}-${index}`} className="ml-4 list-disc">{item}</li>)}
                          </ul>
                        </div>
                      ) : null}
                      {/* Inline visual diagram */}
                      {visualRationale ? (
                        <div className="quiz-diagram-panel">
                          <p className="quiz-diagram-title">{visualRationale.title}</p>
                          {(visualRationale.type === "trend" || visualRationale.type === "overview") && visualRationale.metrics?.length ? (
                            <div>
                              {visualRationale.metrics.map((metric) => (
                                <div key={metric.label} className="quiz-diagram-bar-row">
                                  <span className="quiz-diagram-bar-label">{metric.label}</span>
                                  <div className="quiz-diagram-bar-track">
                                    <div className="quiz-diagram-bar-fill" style={{ width: "62%" }} />
                                  </div>
                                  <span className="quiz-diagram-bar-value">{metric.value}</span>
                                </div>
                              ))}
                            </div>
                          ) : (visualRationale.type === "flow" || visualRationale.type === "pathway") && visualRationale.nodes?.length ? (
                            <div className="quiz-diagram-flow">
                              {visualRationale.nodes.map((node, i) => (
                                <div key={node.label}>
                                  <div className="quiz-diagram-flow-node">
                                    {node.label}{node.value ? ` — ${node.value}` : ""}
                                  </div>
                                  {i < (visualRationale.nodes?.length ?? 0) - 1 ? (
                                    <div className="quiz-diagram-flow-arrow">↓</div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : (visualRationale.nodes ?? []).length ? (
                            <div className="quiz-diagram-signal-grid">
                              {(visualRationale.nodes ?? []).map((node) => (
                                <div key={node.label} className="quiz-diagram-signal-cell">
                                  <span>{node.label}</span>
                                  <strong>{node.value}</strong>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          {visualRationale.conclusion ? (
                            <p className="mt-3 text-xs italic leading-6 text-[var(--quiz-muted)]">{visualRationale.conclusion}</p>
                          ) : null}
                        </div>
                      ) : diagramBlueprint ? (
                        <div className="quiz-diagram-panel">
                          <p className="quiz-diagram-title">{diagramBlueprint.title}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--quiz-muted)]">{diagramBlueprint.focus}</p>
                        </div>
                      ) : null}
                      {/* AI tutor bridge */}
                      {canOpenTutor ? (
                        <button type="button" onClick={onOpenTutor} className="quiz-rationale-tutor-bridge">
                          go deeper with ai tutor →
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Inline citations bar — always visible when references exist */}
                  {references.length ? (
                    <div className="quiz-rationale-sources-bar">
                      <span className="quiz-rationale-sources-bar-label">sources</span>
                      {references.slice(0, 4).map((ref, i) => {
                        const label = ref.title;
                        return ref.href ? (
                          <a
                            key={`${ref.title}-${i}`}
                            className="quiz-rationale-source-chip"
                            href={ref.href}
                            target="_blank"
                            rel="noreferrer noopener"
                            title={ref.citation ?? ref.title}
                            aria-label={`Open cited source: ${label}`}
                          >
                            {label}
                          </a>
                        ) : (
                          <span
                            key={`${ref.title}-${i}`}
                            className="quiz-rationale-source-chip"
                            title={ref.citation ?? ref.title}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="quiz-rail-card quiz-monitor-source-card">
                  <p className="quiz-terminal-kicker">rationale locked</p>
                  <p className="quiz-rail-prose mt-3 text-sm leading-7 text-[var(--quiz-muted)]">Submit an answer to open the debrief, the diagram focus, and the tutor follow-up.</p>
                </div>
              )}
            </div>
          ) : null}

          {intelTab === "sources" ? (
            <div className="quiz-rail-stack">
              {visualRationale ? (
                <div className="quiz-rail-card quiz-monitor-tutor-card">
                  <p className="quiz-terminal-kicker">visual rationale</p>
                  <p className="mt-3 text-sm font-semibold text-[var(--quiz-ink-strong)]">{visualRationale.title}</p>
                  {(visualRationale.type === "trend" || visualRationale.type === "overview") && visualRationale.metrics?.length ? (
                    <div className="quiz-diagram-panel mt-3">
                      <p className="quiz-diagram-title">trend markers</p>
                      {visualRationale.metrics.map((metric) => (
                        <div key={metric.label} className="quiz-diagram-bar-row">
                          <span className="quiz-diagram-bar-label">{metric.label}</span>
                          <div className="quiz-diagram-bar-track">
                            <div className="quiz-diagram-bar-fill" style={{ width: "62%" }} />
                          </div>
                          <span className="quiz-diagram-bar-value">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (visualRationale.type === "flow" || visualRationale.type === "pathway") && visualRationale.nodes?.length ? (
                    <div className="quiz-diagram-flow mt-3">
                      {visualRationale.nodes.map((node, i) => (
                        <div key={node.label}>
                          <div className="quiz-diagram-flow-node">
                            {node.label}{node.value ? ` — ${node.value}` : ""}
                          </div>
                          {i < (visualRationale.nodes?.length ?? 0) - 1 ? (
                            <div className="quiz-diagram-flow-arrow">↓</div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {visualRationale.conclusion ? <p className="mt-2 text-sm leading-7 text-[var(--quiz-muted)]">{visualRationale.conclusion}</p> : null}
                </div>
              ) : null}
              {diagramBlueprint ? (
                <div className="quiz-rail-card">
                  <p className="quiz-terminal-kicker">diagram focus</p>
                  <p className="mt-3 text-sm font-semibold text-[var(--quiz-ink-strong)]">{diagramBlueprint.title}</p>
                  <p className="quiz-rail-prose mt-2 text-sm leading-7 text-[var(--quiz-muted)]">{diagramBlueprint.focus}</p>
                </div>
              ) : null}
              {references.length ? (
                <div className="quiz-rail-card">
                  <p className="quiz-terminal-kicker">sources</p>
                  <div className="mt-3 grid gap-3">
                    {references.map((reference, index) => (
                      <div key={`${reference.title}-${index}`} className="quiz-rail-row flex-col items-start gap-1">
                        <strong className="text-[var(--quiz-ink-strong)]">{reference.title}</strong>
                        {reference.citation ? <span className="text-xs text-[var(--quiz-muted)]">{reference.citation}</span> : null}
                        {reference.href ? (
                          <a href={reference.href} target="_blank" rel="noreferrer" className="text-xs text-[rgba(90,127,136,0.9)] underline underline-offset-2">
                            open source ↗
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {studyResources.length ? (
                <div className="quiz-rail-card">
                  <p className="quiz-terminal-kicker">free study links</p>
                  <div className="mt-3 grid gap-3">
                    {studyResources.map((resource, index) => (
                      <div key={`${resource.href}-${index}`} className="quiz-rail-row flex-col items-start gap-1">
                        <strong className="text-[var(--quiz-ink-strong)]">{resource.title}</strong>
                        <span className="text-xs text-[var(--quiz-muted)]">{resource.source} | {resource.topic} | {resource.kind}</span>
                        <span className="text-xs leading-5 text-[var(--quiz-muted)]">{resource.why}</span>
                        <a href={resource.href} target="_blank" rel="noreferrer noopener" className="text-xs text-[rgba(90,127,136,0.9)] underline underline-offset-2">
                          open free resource
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {canOpenTutor ? (
                <div className="quiz-rail-card">
                  <p className="quiz-terminal-kicker">ai tutor</p>
                  <p className="quiz-rail-prose mt-3 text-sm leading-7 text-[var(--quiz-muted)]">Use the tutor to turn this rationale into a faster bedside pattern you can reuse on the next question.</p>
                  <button type="button" onClick={onOpenTutor} className="quiz-terminal-toggle is-active mt-4">open tutor</button>
                </div>
              ) : null}
            </div>
          ) : null}

          {intelTab === "tutor" ? (
            <div className="quiz-rail-stack">
              <div className="quiz-rail-card quiz-monitor-tutor-card">
                <p className="quiz-terminal-kicker">ai tutor</p>
                <p className="quiz-rail-prose mt-3 text-sm leading-7 text-[var(--quiz-muted)]">
                  Open a focused follow-up conversation tied to this question's answer, rationale, references, and diagram cues. The tutor should feel like a fast bedside preceptor, not a detached chatbot.
                </p>
                <div className="mt-4 grid gap-2">
                  <div className="quiz-rail-row">
                    <strong>pattern</strong>
                    <span>{question.takeaway ?? "Name the unstable clue, then tie the answer to the safest next move."}</span>
                  </div>
                  <div className="quiz-rail-row">
                    <strong>next rep</strong>
                    <span>{question.speedCue ?? "Use the same question object for debrief, diagram, and tutor follow-up."}</span>
                  </div>
                </div>
                <button type="button" onClick={onOpenTutor} disabled={!canOpenTutor} className={`quiz-terminal-toggle mt-4 ${canOpenTutor ? "is-active" : ""}`}>
                  {canOpenTutor ? "open tutor" : "submit to unlock"}
                </button>
              </div>
            </div>
          ) : null}
              </div>
              <div className="quiz-intel-screen-footer">
                <span className="quiz-intel-console-key">
                  {question.chartRows?.length || question.vitals?.length || question.hemodynamics?.length ? "chart bus online" : "prompt bus online"}
                </span>
                <span className="quiz-intel-console-key">{answered ? "debrief live" : "await answer"}</span>
                <span className="quiz-intel-console-key">{canOpenTutor ? "tutor uplink" : "tutor standby"}</span>
              </div>
            </div>
          </div>
          <div className="quiz-intel-monitor-stand" aria-hidden="true" />
        </div>
      </aside>
    </div>
  );
}
