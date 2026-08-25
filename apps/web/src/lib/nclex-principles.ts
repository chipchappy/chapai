/**
 * The catalog of transferable NCLEX-RN reasoning principles.
 *
 * Mirrored from scripts/lib/nclex-principles.mjs, which the enrichment pass
 * imports; scripts/__tests__/strategy-quality.test.ts asserts the two cannot
 * drift apart. The render gate needs the catalog so it can recognise a rule it
 * already trusts: a note whose rule is one of these was assembled, not written,
 * so it cannot contain an invented or inverted principle.
 */
export const PRINCIPLES: Record<string, string> = {
  "assess-first":
    "When the stem has not yet established what is wrong, the assessment comes before any intervention.",
  "stem-defines-problem":
    "When the stem already establishes the problem, further assessment is the distractor and the action is the answer.",
  "independent-before-escalation":
    "An independent nursing action comes before notifying the prescriber unless the finding is something the nurse cannot resolve at the bedside.",
  "escalate-beyond-scope":
    "When the finding cannot be resolved within nursing scope, escalation stops being the distractor and becomes the action.",
  "abc":
    "When options describe competing physiological threats, airway is settled before breathing, and breathing before circulation.",
  "remove-the-hazard":
    "When one option stops an active hazard and the rest manage its consequences, stopping the hazard comes first.",
  "acute-over-chronic":
    "An acute change outranks a chronic or already-documented finding.",
  "unexpected-over-expected":
    "The finding that does not fit the diagnosis is the one that needs action; the expected finding is the distractor.",
  "least-invasive-first":
    "When options escalate in invasiveness, the least invasive effective measure is tried first.",
  "sequence-not-choice":
    "When options contain the same actions in a different order, the item is testing sequence rather than selection.",
  "timing":
    "When options differ only in timing, the item is testing when the action belongs, not whether it is correct.",
  "delegation-scope":
    "A task may be delegated only when the client is stable, the outcome is predictable, and it requires no nursing judgement.",
  "stay-with-the-feeling":
    "In a communication item, the response that stays with the feeling the client expressed outranks reassurance, explanation, or redirection.",
  "judge-each-option":
    "In a select-all item, each option is judged independently against the standard rather than compared with the other options.",
  "polarity":
    "When the stem asks which statement shows understanding or the need for more teaching, settle the polarity of the question before reading the options.",
  "monitor-what-is-threatened":
    "When every option is an assessment, the one that measures the parameter the condition actually threatens is the answer.",
  "treat-the-patient":
    "When one option treats the monitor or the number and another treats the client, the client is assessed first.",
  "maslow":
    "A physiological need is met before a psychosocial one unless the stem establishes that the physiological need is already stable.",};

export const PRINCIPLE_IDS = Object.keys(PRINCIPLES);

/** Rule texts, for recognising an assembled note at render time. */
export const PRINCIPLE_RULES = new Set(Object.values(PRINCIPLES));
