import type {
  PracticeAnswer,
  PracticeAnswerRecord,
  PracticeChartReviewMetadata,
  PracticeMetric,
  PracticeQuestion,
} from "@/lib/practice-types";
import type { MarketingRouteKey } from "@/components/marketing/marketingArtwork";

export type ChartReviewTab =
  | "hpi"
  | "timeline"
  | "labs"
  | "orders"
  | "diagnostics"
  | "notes"
  | "rationale"
  | "sources"
  | "aiTutor";

type ChartTone = "normal" | "low" | "high" | "critical" | "locked" | "open";

export interface ChartReviewMetric {
  label: string;
  value: string;
  detail?: string;
  flag?: ChartTone;
}

export interface ChartReviewItem {
  label?: string;
  value: string;
  tone?: ChartTone;
}

export interface RationaleNode {
  label: string;
  value: string;
}

export interface ChartReviewPanel {
  eyebrow: string;
  title: string;
  summary: string;
  items?: ChartReviewItem[];
  metrics?: ChartReviewMetric[];
}

export interface ChartReviewModel {
  stationLabel: string;
  stationMode: string;
  statusLabel: string;
  patientTitle: string;
  patientCaption: string;
  answered: boolean;
  canOpenTutor: boolean;
  resultLabel?: string;
  answerTarget: string;
  tabs: Array<{ id: ChartReviewTab; label: string; value: string; locked?: boolean; priority?: boolean }>;
  panels: Record<ChartReviewTab, ChartReviewPanel>;
  patientStats: ChartReviewItem[];
  priorityCues: string[];
  rationaleText: string;
  rationaleTitle: string;
  diagramNodes: RationaleNode[];
  sources: ChartReviewItem[];
  tutorPrompts: ChartReviewItem[];
}

type DemoStepLike = {
  title: string;
  prompt: string;
  hpi: string[];
  timeline: string[];
  labs: Array<{ label: string; value: string; flag?: "high" | "low" | "critical" | "normal" }>;
  orders: string[];
  diagnostics: string[];
  rationale: string;
  correct: PracticeAnswer;
};

const NO_DATA = "not provided / not needed for this decision";

function clamp<T>(items: T[], limit: number) {
  return items.filter(Boolean).slice(0, limit);
}

function uniqueStrings(values: Array<string | null | undefined>, limit = 6) {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
    if (!normalized || seen.has(normalized.toLowerCase())) continue;
    seen.add(normalized.toLowerCase());
    output.push(normalized);
    if (output.length >= limit) break;
  }
  return output;
}

function toItems(items: string[], fallback: string, label?: string): ChartReviewItem[] {
  const values = clamp(uniqueStrings(items), 6);
  return values.length
    ? values.map((value) => ({ label, value }))
    : [{ label: label ?? "status", value: fallback, tone: "locked" }];
}

function flattenExhibitItems(exhibits: Array<{ title: string; body?: string; items?: string[] }>) {
  return exhibits.flatMap((exhibit) => [
    ...(exhibit.body ? [`${exhibit.title}: ${exhibit.body}`] : []),
    ...((Array.isArray(exhibit.items) ? exhibit.items : []).map((item) => `${exhibit.title}: ${item}`)),
  ]);
}

function formatAnswerValue(answer: PracticeAnswer | undefined) {
  if (!answer) return "--";
  if (Array.isArray(answer)) return answer.map((item) => item.toUpperCase()).join(", ");
  if (typeof answer === "object") return Object.entries(answer).map(([label, value]) => `${label} -> ${value}`).join(" | ");
  return answer.toUpperCase();
}

function metricFlagLabel(flag?: ChartTone) {
  if (flag === "critical") return "critical";
  if (flag === "high") return "high";
  if (flag === "low") return "low";
  if (flag === "locked") return "not loaded";
  return "expected";
}

function metricDetail(label: string, detail?: string) {
  if (detail) return detail;
  const key = label.toLowerCase();
  if (key.includes("spo2") || key.includes("o2")) return "oxygenation";
  if (key.includes("lactate")) return "perfusion";
  if (key.includes("gcs") || key.includes("pupil")) return "neuro trend";
  if (key.includes("map") || key.includes("bp")) return "pressure";
  if (key.includes("rr") || key.includes("resp")) return "ventilation";
  if (key.includes("k") || key.includes("potassium")) return "cardiac risk";
  return "clinical signal";
}

function normalizeMetrics(metrics?: PracticeMetric[]) {
  return (metrics ?? [])
    .map((metric) => ({
      label: String(metric.label ?? "").trim(),
      value: String(metric.value ?? "").trim(),
      flag: metric.flag,
      detail: metric.detail,
    }))
    .filter((metric) => metric.label && metric.value);
}

function explicitList(chartReview: PracticeChartReviewMetadata | undefined, key: keyof PracticeChartReviewMetadata) {
  const value = chartReview?.[key];
  return Array.isArray(value) ? uniqueStrings(value.filter((item): item is string => typeof item === "string")) : [];
}

function orderStatusList(chartReview: PracticeChartReviewMetadata | undefined) {
  return (chartReview?.orderStatus ?? [])
    .map((order) => `${order.label}: ${order.status}${order.detail ? ` - ${order.detail}` : ""}`)
    .filter(Boolean);
}

function getPracticeChartPieces(question: PracticeQuestion) {
  const chartReview = question.chartReview;
  const noteExhibits = question.exhibits?.filter((item) => item.type === "note" || item.type === "assessment") ?? [];
  const timelineExhibits = question.exhibits?.filter((item) => item.type === "timeline") ?? [];
  const labExhibits = question.exhibits?.filter((item) => item.type === "labs" || item.type === "vitals") ?? [];
  const orderExhibits = question.exhibits?.filter((item) => item.type === "orders") ?? [];
  const contextTitle = chartReview?.patientTitle ?? question.caseTitle ?? question.chartTitle ?? question.scenarioTitle ?? question.title ?? "active clinical scenario";
  const contextCaption = chartReview?.patientCaption ?? question.chartCaption ?? question.takeaway ?? question.speedCue ?? "Read the chart first, then commit to the safest action.";

  const hpi = uniqueStrings([
    chartReview?.chiefComplaint ? `Chief complaint: ${chartReview.chiefComplaint}` : undefined,
    ...explicitList(chartReview, "hpi"),
    ...explicitList(chartReview, "history"),
    ...explicitList(chartReview, "allergies").map((item) => `Allergy: ${item}`),
    ...explicitList(chartReview, "medications").map((item) => `Home med: ${item}`),
    question.scenarioTitle,
    question.caseTitle,
    question.scenario ?? question.caseContext ?? question.additionalInfo,
    ...flattenExhibitItems(noteExhibits),
  ], 6);

  const timeline = uniqueStrings([
    ...explicitList(chartReview, "timeline"),
    ...explicitList(chartReview, "unfoldingTimeline"),
    ...(question.chartRows?.map((row) => `${row.time}: ${row.values.map((value) => `${value.label} ${value.value}`).join(", ")}`) ?? []),
    ...flattenExhibitItems(timelineExhibits),
  ], 6);

  const explicitLabs = [...normalizeMetrics(chartReview?.labs), ...normalizeMetrics(chartReview?.abnormalValues)];
  const labs = explicitLabs.length
    ? explicitLabs
    : question.labs?.length
      ? question.labs
      : labExhibits.length
        ? flattenExhibitItems(labExhibits).map((value) => ({ label: "chart", value, flag: "normal" as const }))
        : [];

  const explicitDiagnostics = [...normalizeMetrics(chartReview?.vitals), ...normalizeMetrics(chartReview?.diagnostics)];
  const diagnostics = explicitDiagnostics.length
    ? explicitDiagnostics
    : [
      ...(question.vitals ?? []),
      ...(question.hemodynamics ?? []),
    ];

  const orders = uniqueStrings([
    ...explicitList(chartReview, "orders"),
    ...explicitList(chartReview, "providerOrders"),
    ...orderStatusList(chartReview),
    ...flattenExhibitItems(orderExhibits),
  ], 6);

  const notes = uniqueStrings([
    ...explicitList(chartReview, "notes"),
    ...explicitList(chartReview, "nursingNotes"),
    ...explicitList(chartReview, "assessments"),
    ...explicitList(chartReview, "intakeOutput").map((item) => `I/O: ${item}`),
    ...explicitList(chartReview, "medicationAdministrationRecord").map((item) => `MAR: ${item}`),
    ...explicitList(chartReview, "carePlan").map((item) => `Care plan: ${item}`),
    ...explicitList(chartReview, "pastQuestionContext").map((item) => `Prior item: ${item}`),
    ...flattenExhibitItems(noteExhibits),
    ...(question.additionalInfo ? [question.additionalInfo] : []),
  ], 6);

  return { contextTitle, contextCaption, hpi, timeline, labs, diagnostics, orders, notes };
}

export function buildPracticeChartReviewModel(params: {
  question: PracticeQuestion;
  answerRecord?: PracticeAnswerRecord;
  canOpenTutor: boolean;
}): ChartReviewModel {
  const { question, answerRecord, canOpenTutor } = params;
  const answered = Boolean(answerRecord);
  const pieces = getPracticeChartPieces(question);
  const answerTarget = answered ? formatAnswerValue(answerRecord?.correctAnswer ?? question.correctAnswer) : "locked until submit";
  const rationaleText = answered
    ? answerRecord?.deepRationale ?? answerRecord?.rationale ?? question.deepRationale ?? question.rationale
    : "Submit an answer to unlock the debrief, diagram, sources, and tutor handoff.";
  const references = answerRecord?.references ?? question.references ?? [];
  const visualRationale = answerRecord?.visualRationale ?? question.visualRationale;
  const diagramBlueprint = answerRecord?.diagramBlueprint ?? question.diagramBlueprint;
  const coachingFrame = answerRecord?.coachingFrame ?? question.coachingFrame ?? [];
  const explicitDiagram = question.chartReview?.diagram;
  const explicitTutorPrompts = question.chartReview?.tutorPrompts ?? [];
  const abnormalMetrics = [...pieces.diagnostics, ...pieces.labs].filter((item) => item.flag && item.flag !== "normal");
  const primaryCue = abnormalMetrics[0]
    ? `${abnormalMetrics[0].label}: ${abnormalMetrics[0].value}`
    : pieces.timeline[0] ?? pieces.hpi[0] ?? question.speedCue ?? question.takeaway ?? "highest-risk clinical cue";
  const diagramNodes = !answered
    ? [
      { label: "cue", value: primaryCue },
      { label: "pattern", value: diagramBlueprint?.focus ?? visualRationale?.caption ?? pieces.contextTitle },
      { label: "move", value: "commit before reveal" },
      { label: "next rep", value: question.speedCue ?? question.takeaway ?? "name the unstable clue before selecting" },
    ]
    : explicitDiagram?.nodes?.length
    ? explicitDiagram.nodes
    : visualRationale?.nodes?.length
      ? visualRationale.nodes
      : [
        { label: "cue", value: primaryCue },
        { label: "pattern", value: diagramBlueprint?.focus ?? visualRationale?.caption ?? pieces.contextTitle },
        { label: "move", value: answerTarget },
        { label: "next rep", value: question.speedCue ?? question.takeaway ?? "name the unstable clue before selecting" },
      ];
  const priorityCues = uniqueStrings([
    ...(question.chartReview?.priorityCues ?? []),
    ...abnormalMetrics.map((item) => `${item.label}: ${item.value} ${metricFlagLabel(item.flag)}`),
    question.speedCue,
    question.takeaway,
    pieces.timeline[0],
  ], 4);
  const sourceItems = references.length
    ? references.map((ref) => ({ label: ref.title, value: ref.citation ?? ref.href ?? "approved source attached" }))
    : [{ label: "sources", value: "approved references appear here when attached", tone: "locked" as const }];
  const tabs: ChartReviewModel["tabs"] = [
    { id: "hpi", label: "hpi", value: pieces.hpi.length ? `${Math.min(pieces.hpi.length, 6)} entries` : "stem based" },
    { id: "timeline", label: "timeline", value: pieces.timeline.length ? `${Math.min(pieces.timeline.length, 6)} events` : "not provided", priority: pieces.timeline.length > 0 },
    { id: "labs", label: "labs", value: pieces.labs.length ? `${Math.min(pieces.labs.length, 6)} values` : "not needed", priority: abnormalMetrics.length > 0 },
    { id: "orders", label: "orders", value: pieces.orders.length ? `${Math.min(pieces.orders.length, 5)} active` : "none provided" },
    { id: "diagnostics", label: "diagnostics", value: pieces.diagnostics.length ? `${Math.min(pieces.diagnostics.length, 6)} signals` : "prompt based" },
    { id: "notes", label: "notes", value: pieces.notes.length ? `${Math.min(pieces.notes.length, 5)} notes` : "case stem" },
    { id: "rationale", label: "rationale", value: answered ? "open" : "after answer", locked: !answered },
    { id: "sources", label: "sources", value: references.length ? `${Math.min(references.length, 4)} cited` : "attached when available" },
    { id: "aiTutor", label: "ai tutor", value: canOpenTutor ? "ready" : "after submit", locked: !canOpenTutor },
  ];

  return {
    stationLabel: question.exam === "nclex" ? "clinical review station" : "critical-care review station",
    stationMode: question.exam === "nclex" ? "ehr / labs / rationale / tutor" : "hemo / chart / rationale / tutor",
    statusLabel: answered ? "debrief open" : "pre-answer",
    patientTitle: pieces.contextTitle,
    patientCaption: pieces.contextCaption,
    answered,
    canOpenTutor,
    resultLabel: answered ? (answerRecord?.correct ? "correct" : "review target") : undefined,
    answerTarget,
    tabs,
    patientStats: [
      { label: "track", value: question.exam === "nclex" ? "nclex study" : "critical care" },
      { label: "mode", value: question.kind.replace("-", " ") },
      { label: "alerts", value: abnormalMetrics.length ? `${abnormalMetrics.length} flagged` : "stable cues" },
    ],
    priorityCues: priorityCues.length ? priorityCues : ["name the unstable cue first"],
    rationaleText,
    rationaleTitle: explicitDiagram?.title ?? diagramBlueprint?.focus ?? visualRationale?.title ?? "pattern debrief",
    diagramNodes: clamp(diagramNodes, 4),
    sources: sourceItems,
    tutorPrompts: !answered
      ? [
        { label: "chart first", value: "identify the unstable cue before looking for confirmation" },
        { label: "commit", value: "choose the safest move, then unlock the debrief" },
        { label: "next rep", value: question.speedCue ?? "turn the clue pattern into a one-line bedside cue" },
      ]
      : explicitTutorPrompts.length
      ? explicitTutorPrompts.map((prompt) => ({ label: prompt.label ?? "tutor", value: prompt.value }))
      : [
        { label: "why this wins", value: `explain why ${answerTarget} is safest` },
        { label: "miss trap", value: "show the distractor pattern" },
        { label: "next rep", value: question.speedCue ?? "turn this into a one-line bedside cue" },
      ],
    panels: {
      hpi: {
        eyebrow: "history",
        title: "history of present illness",
        summary: "Only the context needed to answer this item.",
        items: toItems(pieces.hpi, "No separate HPI is provided; use the stem as the clinical source.", "hpi"),
      },
      timeline: {
        eyebrow: "sequence",
        title: "sequence of events",
        summary: "Follow the change over time before choosing the safest move.",
        items: toItems(pieces.timeline, NO_DATA, "event"),
      },
      labs: {
        eyebrow: "signals",
        title: "labs and abnormal cues",
        summary: pieces.labs.length ? "Flagged values are pulled forward for faster pattern recognition." : "This item does not require separate lab interpretation.",
        metrics: pieces.labs.length
          ? clamp(pieces.labs, 6).map((item) => ({ label: item.label, value: item.value, flag: item.flag ?? "normal", detail: metricDetail(item.label, item.detail) }))
          : [{ label: "labs", value: "not needed", flag: "locked", detail: "answer from stem/chart cues" }],
      },
      orders: {
        eyebrow: "orders",
        title: "active orders",
        summary: "Separate existing orders from the nurse's next safest action.",
        items: toItems(pieces.orders, NO_DATA, "order"),
      },
      diagnostics: {
        eyebrow: "diagnostics",
        title: "vitals, diagnostics, and trend signals",
        summary: "Use this tab for the bedside data that changes priority.",
        metrics: pieces.diagnostics.length
          ? clamp(pieces.diagnostics, 6).map((item) => ({ label: item.label, value: item.value, flag: item.flag ?? "normal", detail: metricDetail(item.label, item.detail) }))
          : [{ label: "diagnostics", value: "prompt based", flag: "locked", detail: "no separate diagnostics provided" }],
      },
      notes: {
        eyebrow: "notes",
        title: "nursing and provider notes",
        summary: "The highest-yield narrative details without burying the question.",
        items: toItems(pieces.notes, "No separate notes are provided; use the stem and answer choices.", "note"),
      },
      rationale: {
        eyebrow: answered ? "debrief" : "locked",
        title: answered ? (answerRecord?.correct ? "correct pattern locked" : `target answer: ${answerTarget}`) : "rationale unlocks after submit",
        summary: answered ? rationaleText : "Submit an answer to open the rationale, diagram, sources, and tutor handoff.",
      },
      sources: {
        eyebrow: "sources",
        title: "citations and diagram assets",
        summary: diagramBlueprint ? `Diagram focus: ${diagramBlueprint.focus}` : "Approved citations and visual rationale assets stay attached here.",
        items: sourceItems,
      },
      aiTutor: {
        eyebrow: canOpenTutor ? "tutor ready" : "locked",
        title: canOpenTutor ? "ask from this exact chart" : "submit to unlock ai tutor",
        summary: canOpenTutor
          ? "The tutor opens with the stem, selected answer, chart context, rationale, references, and coaching frame attached."
          : "Paid/deep-review flows unlock tutor follow-up after answer submission.",
        items: coachingFrame.length ? coachingFrame.map((value) => ({ label: "coach", value })) : undefined,
      },
    },
  };
}

export function buildDemoChartReviewModel(params: {
  step: DemoStepLike;
  route: MarketingRouteKey;
  submitted: boolean;
  selected: string[];
}): ChartReviewModel {
  const { step, route, submitted, selected } = params;
  const answerTarget = submitted ? formatAnswerValue(step.correct) : "locked until submit";
  const titleByRoute = route === "home" ? "pulmonary review station" : route === "nclex" ? "neural review station" : "cardiac review station";
  const cue = step.timeline[step.timeline.length - 1] ?? step.hpi[0] ?? step.prompt;
  const tabs: ChartReviewModel["tabs"] = [
    { id: "hpi", label: "hpi", value: `${step.hpi.length} entries` },
    { id: "timeline", label: "timeline", value: `${step.timeline.length} events`, priority: true },
    { id: "labs", label: "labs", value: `${step.labs.length} values`, priority: step.labs.some((item) => item.flag) },
    { id: "orders", label: "orders", value: `${step.orders.length} active` },
    { id: "diagnostics", label: "diagnostics", value: `${step.diagnostics.length} signals` },
    { id: "notes", label: "notes", value: "demo stem" },
    { id: "rationale", label: "rationale", value: submitted ? "open" : "after answer", locked: !submitted },
    { id: "sources", label: "sources", value: "demo refs" },
    { id: "aiTutor", label: "ai tutor", value: submitted ? "ready" : "after submit", locked: !submitted },
  ];

  return {
    stationLabel: titleByRoute,
    stationMode: "hpi / timeline / labs / rationale / tutor",
    statusLabel: submitted ? "debrief live" : "pre-answer",
    patientTitle: step.title,
    patientCaption: step.prompt,
    answered: submitted,
    canOpenTutor: submitted,
    resultLabel: submitted ? "demo answer staged" : undefined,
    answerTarget,
    tabs,
    patientStats: [
      { label: "track", value: route === "ccrn" ? "critical care" : "nclex study" },
      { label: "selected", value: selected.length ? selected.map((item) => item.toUpperCase()).join(", ") : "none" },
      { label: "assets", value: `${step.labs.length} labs / ${step.orders.length} orders` },
    ],
    priorityCues: clamp([cue, step.hpi[0], step.diagnostics[0], step.orders[0]].filter(Boolean), 4),
    rationaleText: submitted ? step.rationale : "Answer the prompt to unlock the debrief, diagram, and tutor-style follow-up.",
    rationaleTitle: submitted ? "demo rationale pathway" : "debrief unlocks after answer",
    diagramNodes: [
      { label: "cue", value: cue },
      { label: "pattern", value: step.title },
      { label: "move", value: submitted ? answerTarget : "commit before reveal" },
      { label: "next rep", value: "name the unstable clue before selecting" },
    ],
    sources: [
      { label: "demo source", value: "chart review, rationale, and tutor handoff share the same station model" },
      { label: "study source", value: "live questions attach citations when available" },
    ],
    tutorPrompts: [
      { label: submitted ? "why this wins" : "chart first", value: submitted ? `explain why ${answerTarget} is safest` : "identify the unstable cue before the answer reveal" },
      { label: "trap answer", value: "show the distractor pattern" },
      { label: "next rep", value: "make me faster on the next NGN item" },
    ],
    panels: {
      hpi: { eyebrow: "history", title: "history of present illness", summary: "Demo context mirrors the live study station.", items: toItems(step.hpi, NO_DATA, "hpi") },
      timeline: { eyebrow: "sequence", title: "sequence of events", summary: "Read the trend before the answers.", items: toItems(step.timeline, NO_DATA, "event") },
      labs: {
        eyebrow: "signals",
        title: "labs and abnormal cues",
        summary: "High-yield values are pulled forward without scrolling.",
        metrics: step.labs.map((item) => ({ ...item, detail: metricDetail(item.label), flag: item.flag ?? "normal" })),
      },
      orders: { eyebrow: "orders", title: "active bedside actions", summary: "Existing orders versus next nursing action.", items: toItems(step.orders, NO_DATA, "order") },
      diagnostics: { eyebrow: "diagnostics", title: "diagnostic feed", summary: "Support data for the clinical decision.", items: toItems(step.diagnostics, NO_DATA, "dx") },
      notes: { eyebrow: "notes", title: "demo note", summary: "The stem remains the primary note in this mini demo.", items: toItems([step.prompt], NO_DATA, "note") },
      rationale: { eyebrow: submitted ? "debrief" : "locked", title: submitted ? "rationale console" : "rationale unlocks after answer", summary: submitted ? step.rationale : "Answer once to open the rationale and diagram." },
      sources: { eyebrow: "sources", title: "demo source path", summary: "The live bank shows citations when attached.", items: [{ label: "source path", value: "rationale + diagram + tutor are attached to the same question context" }] },
      aiTutor: {
        eyebrow: submitted ? "tutor ready" : "locked",
        title: submitted ? "ask from this exact chart" : "submit to unlock ai tutor",
        summary: submitted ? `Tutor prompt: explain why ${answerTarget} is safest, then make me faster.` : "Tutor opens after answer in the real study flow.",
      },
    },
  };
}
