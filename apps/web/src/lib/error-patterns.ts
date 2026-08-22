// ─────────────────────────────────────────────────────────────────────────────
// Reasoning-error diagnosis.
//
// Every competitor reports accuracy by topic: "Pharmacology 62%". That tells a
// student what they already knew. It does not tell them HOW they are thinking
// wrong, which is the thing that actually transfers between questions.
//
// This classifies the wrong answer a student CHOSE against the one that was
// correct, and reports recurring reasoning failures instead of weak subjects.
//
// Two rules run through the whole file:
//
//   1. Never force-fit. Classification returns null whenever the evidence does
//      not clearly support a label. An unrecognised verb is unknown, not a
//      guess, because a confidently wrong diagnosis is worse than none.
//   2. Never report a pattern from noise. A pattern needs MIN_OCCURRENCES real
//      instances AND a share of its opportunities above MIN_SHARE before it is
//      surfaced, so a student is never told they have a habit on the strength
//      of two questions.
// ─────────────────────────────────────────────────────────────────────────────

export type AnswerRecord = {
  questionType: string;
  /** Options as stored: [{ id, text }]. */
  options: Array<{ id: string; text: string }>;
  /** Correct answer: a single id for mcq, an array of ids for sata. */
  correctAnswer: string | string[];
  /** What the student picked, same shape as correctAnswer. */
  selectedAnswer: string | string[];
  isCorrect: boolean;
  timeSpentMs?: number | null;
};

export type ErrorPatternId =
  | "sata-under-select"
  | "sata-over-select"
  | "acted-before-assessing"
  | "assessed-when-action-needed"
  | "deferred-instead-of-acting"
  | "documented-instead-of-intervening";

export type ErrorPattern = {
  id: ErrorPatternId;
  /** How many times this specific mistake happened. */
  count: number;
  /** How many answers could have exhibited it — the honest denominator. */
  opportunities: number;
  /** count / opportunities. */
  share: number;
  label: string;
  /** What to actually do about it. */
  advice: string;
};

/**
 * A pattern must clear BOTH bars. The count bar stops three unlucky questions
 * reading as a habit; the share bar stops a pattern that is technically
 * frequent but rare in proportion to how often it could have occurred.
 */
export const MIN_OCCURRENCES = 4;
export const MIN_SHARE = 0.25;

// ─── option-text classification ──────────────────────────────────────────────

/**
 * The four action classes NCLEX items are built to discriminate between. Order
 * matters: `document` is checked before `assess` because "continue to monitor"
 * is a passive-documentation distractor, not an assessment.
 */
type ActionClass = "assess" | "act" | "defer" | "document";

const CLASS_PATTERNS: Array<{ cls: ActionClass; re: RegExp }> = [
  // Passive non-action. Matched first — "continue to monitor" would otherwise
  // read as assessment when it functions as "do nothing".
  { cls: "document", re: /^(document|chart|record|continue to (monitor|observe)|take no action|no (further )?action)/i },
  // Handing the decision to someone else.
  { cls: "defer", re: /^(notify|call|contact|report|consult|refer|page|request (an? )?(order|consult))/i },
  // Gathering information.
  { cls: "assess", re: /^(assess|monitor|check|auscultate|observe|obtain|measure|evaluate|inspect|palpate|review|verify|determine|ask|weigh|count|recheck)/i },
  // Changing the patient's state.
  { cls: "act", re: /^(administer|give|apply|initiate|start|begin|position|reposition|elevate|lower|suction|insert|remove|stop|discontinue|hold|prepare|place|encourage|instruct|teach|irrigate|clamp|flush|increase|decrease|titrate|transfuse|defibrillate|perform)/i },
];

/** null when no pattern matches — deliberately, see rule 1 at the top. */
export function classifyAction(text: string): ActionClass | null {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return null;
  for (const { cls, re } of CLASS_PATTERNS) {
    if (re.test(trimmed)) return cls;
  }
  return null;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function toIdList(value: string | string[]): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  // sata answers are stored as a JSON array string in some rows and a bare id
  // in others; accept both rather than trusting one shape.
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
    } catch { return []; }
  }
  return [raw];
}

function textOf(record: AnswerRecord, id: string): string | null {
  const option = record.options?.find((o) => o?.id === id);
  return option ? option.text : null;
}

const isSata = (record: AnswerRecord) =>
  record.questionType === "sata" || Array.isArray(record.correctAnswer);

// ─── detection ───────────────────────────────────────────────────────────────

const COPY: Record<ErrorPatternId, { label: string; advice: string }> = {
  "sata-under-select": {
    label: "Under-selecting on Select-All-That-Apply",
    advice: "You are leaving correct options unchecked. Work every option as its own true/false question rather than stopping once the answer feels complete.",
  },
  "sata-over-select": {
    label: "Over-selecting on Select-All-That-Apply",
    advice: "You are checking options that are plausible but not correct. Require a specific reason for each one before selecting it.",
  },
  "acted-before-assessing": {
    label: "Acting before assessing",
    advice: "You are choosing an intervention where the item wanted more data first. When the stem does not establish the problem, assessment usually comes first.",
  },
  "assessed-when-action-needed": {
    label: "Assessing when the item asked you to act",
    advice: "You are gathering more data where the stem already gave you enough to act. Once the problem is established and the patient is unstable, act.",
  },
  "deferred-instead-of-acting": {
    label: "Handing off instead of acting",
    advice: "You are notifying the provider where an independent nursing action was available. Ask what you can do within your own scope first.",
  },
  "documented-instead-of-intervening": {
    label: "Documenting instead of intervening",
    advice: "You are choosing to record or keep monitoring where the finding required a response. Documentation is almost never the answer to an abnormal finding.",
  },
};

/**
 * Classify one wrong answer. Returns every pattern it demonstrates — a single
 * SATA answer can be both over- and under-selected at once.
 */
export function patternsForAnswer(record: AnswerRecord): ErrorPatternId[] {
  if (record.isCorrect) return [];
  const correct = toIdList(record.correctAnswer);
  const chosen = toIdList(record.selectedAnswer);
  if (!correct.length || !chosen.length) return [];

  if (isSata(record)) {
    const found: ErrorPatternId[] = [];
    if (correct.some((id) => !chosen.includes(id))) found.push("sata-under-select");
    if (chosen.some((id) => !correct.includes(id))) found.push("sata-over-select");
    return found;
  }

  // Single-response: compare the class of what they picked against the key.
  const chosenText = textOf(record, chosen[0]);
  const correctText = textOf(record, correct[0]);
  if (!chosenText || !correctText) return [];

  const chosenClass = classifyAction(chosenText);
  const correctClass = classifyAction(correctText);
  if (!chosenClass || !correctClass || chosenClass === correctClass) return [];

  if (chosenClass === "document") return ["documented-instead-of-intervening"];
  if (chosenClass === "defer" && (correctClass === "act" || correctClass === "assess")) {
    return ["deferred-instead-of-acting"];
  }
  if (chosenClass === "act" && correctClass === "assess") return ["acted-before-assessing"];
  if (chosenClass === "assess" && correctClass === "act") return ["assessed-when-action-needed"];
  return [];
}

/**
 * How many answers could plausibly have shown each pattern. Without this the
 * share would be measured against every answer a student has ever given, which
 * makes a real habit look rare.
 */
function countOpportunities(records: AnswerRecord[]): Record<ErrorPatternId, number> {
  const zero = () => 0;
  const out = {
    "sata-under-select": zero(),
    "sata-over-select": zero(),
    "acted-before-assessing": zero(),
    "assessed-when-action-needed": zero(),
    "deferred-instead-of-acting": zero(),
    "documented-instead-of-intervening": zero(),
  } as Record<ErrorPatternId, number>;

  for (const record of records) {
    if (isSata(record)) {
      out["sata-under-select"] += 1;
      out["sata-over-select"] += 1;
      continue;
    }
    const correct = toIdList(record.correctAnswer);
    const correctText = correct.length ? textOf(record, correct[0]) : null;
    const correctClass = correctText ? classifyAction(correctText) : null;
    if (!correctClass) continue;   // unclassifiable key offers no opportunity
    // An item only offers the opportunity to make a given substitution if a
    // distractor of that class was actually on the page.
    const distractorClasses = new Set(
      record.options
        .filter((o) => !correct.includes(o.id))
        .map((o) => classifyAction(o.text))
        .filter((c): c is ActionClass => c !== null),
    );
    if (distractorClasses.has("document")) out["documented-instead-of-intervening"] += 1;
    if (distractorClasses.has("defer") && (correctClass === "act" || correctClass === "assess")) {
      out["deferred-instead-of-acting"] += 1;
    }
    if (distractorClasses.has("act") && correctClass === "assess") out["acted-before-assessing"] += 1;
    if (distractorClasses.has("assess") && correctClass === "act") out["assessed-when-action-needed"] += 1;
  }
  return out;
}

/**
 * The student-facing result. Empty array means "not enough evidence to say
 * anything true", which callers must render as nothing rather than as praise.
 */
export function detectErrorPatterns(records: AnswerRecord[]): ErrorPattern[] {
  if (!records?.length) return [];

  const counts = {} as Record<ErrorPatternId, number>;
  for (const record of records) {
    for (const id of patternsForAnswer(record)) {
      counts[id] = (counts[id] ?? 0) + 1;
    }
  }

  const opportunities = countOpportunities(records);
  const patterns: ErrorPattern[] = [];
  for (const [id, count] of Object.entries(counts) as Array<[ErrorPatternId, number]>) {
    const chances = opportunities[id] ?? 0;
    if (chances === 0) continue;                 // never divide by zero
    const share = count / chances;
    if (count < MIN_OCCURRENCES || share < MIN_SHARE) continue;
    patterns.push({ id, count, opportunities: chances, share, ...COPY[id] });
  }

  // Worst habit first: a student should read the thing costing them most.
  return patterns.sort((a, b) => b.share - a.share || b.count - a.count);
}

/**
 * One sentence for the top pattern, or null when there is nothing honest to
 * say. This is the line that goes on a dashboard.
 */
export function summarizeTopPattern(patterns: ErrorPattern[]): string | null {
  const top = patterns[0];
  if (!top) return null;
  return `${top.label}: ${top.count} of ${top.opportunities} chances (${Math.round(top.share * 100)}%).`;
}
