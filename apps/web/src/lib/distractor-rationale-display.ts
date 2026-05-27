type OptionLike = {
  id: string;
};

type QuestionLike = {
  type?: string;
  kind?: string;
  questionType?: string;
  options?: OptionLike[] | null;
};

const OPTION_BASED_TYPES = new Set(["mcq", "sata", "scenario_mcq", "decision_map_mcq"]);
const OPTION_BASED_KINDS = new Set(["mcq", "multi-select", "scenario-mcq", "decision-map-mcq"]);

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
  return Object.fromEntries(
    Object.entries(rationales).filter(([optionId, rationale]) => (
      optionIds.has(optionId)
      && String(rationale ?? "").trim().length > 0
    )),
  );
}
