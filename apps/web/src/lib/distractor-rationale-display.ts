type OptionLike = {
  id: string;
};

type QuestionLike = {
  type?: string;
  kind?: string;
  questionType?: string;
  correctAnswer?: unknown;
  options?: OptionLike[] | null;
};

const OPTION_BASED_TYPES = new Set(["mcq", "sata", "scenario_mcq", "decision_map_mcq"]);
const OPTION_BASED_KINDS = new Set(["mcq", "multi-select", "scenario-mcq", "decision-map-mcq"]);
const NON_TEACHING_TEXT = [
  /^n\s*\/?\s*a\b/i,
  /^none\b/i,
  /^not applicable\b/i,
  /^no rationale\b/i,
  /\bthis is (a )?correct (choice|answer|option)\b/i,
  /\bcorrect choice\b/i,
  /\bcorrect option\b/i,
];

function getCorrectOptionIds(answer: unknown) {
  if (Array.isArray(answer)) {
    return new Set(answer.map((item) => String(item)));
  }
  if (typeof answer === "string" && answer.trim()) {
    return new Set([answer]);
  }
  return new Set<string>();
}

export function isDisplayableRationaleText(value: unknown) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return false;
  if (NON_TEACHING_TEXT.some((pattern) => pattern.test(text))) return false;
  return text.length >= 12;
}

export function getDisplayableDistractorRationales(
  question: QuestionLike,
  rationales?: Record<string, string> | null,
) {
  if (!rationales || Object.keys(rationales).length === 0) {
    return {};
  }

  const kind = question.kind ? String(question.kind) : "";
  const type = String(question.type ?? question.questionType ?? "");
  const isOptionBased = kind
    ? OPTION_BASED_KINDS.has(kind)
    : OPTION_BASED_TYPES.has(type || "mcq");

  if (!isOptionBased) {
    return {};
  }

  const optionIds = new Set((question.options ?? []).map((option) => option.id));
  const correctOptionIds = getCorrectOptionIds(question.correctAnswer);
  return Object.fromEntries(
    Object.entries(rationales).filter(([optionId, rationale]) => (
      optionIds.has(optionId)
      && !correctOptionIds.has(optionId)
      && isDisplayableRationaleText(rationale)
    )),
  );
}
