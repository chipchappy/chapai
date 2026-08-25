// ---------------------------------------------------------------------------
// The catalog of transferable NCLEX-RN reasoning principles.
//
// The first strategy backfill let the model write sentence two freely, and it
// invented mutually contradictory rules — "escalation is usually the correct
// choice" next to "the escalated choice is typically the distractor". Only one
// of those is what the exam tests, and a student who memorises the wrong one
// picks the distractor.
//
// So the model no longer writes the rule. It names the option STRUCTURE and
// selects the principle that resolves it; the rule text below is emitted
// verbatim. Fabrication is impossible by construction, and the repetition
// across items of the same shape is the point — a principle is learned by
// meeting it in many contexts, not by being paraphrased sixteen ways.
// ---------------------------------------------------------------------------

export const PRINCIPLES = {
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
    "A physiological need is met before a psychosocial one unless the stem establishes that the physiological need is already stable.",
};

export const PRINCIPLE_IDS = Object.keys(PRINCIPLES);

/** Catalog rendered for the prompt, one line per principle. */
export const PRINCIPLE_MENU = PRINCIPLE_IDS
  .map((id) => `  ${id}: ${PRINCIPLES[id]}`)
  .join("\n");

// ---------------------------------------------------------------------------
// Applicability.
//
// Selecting a sound rule is not enough: it must be a rule that RESOLVES the
// structure the item actually has. The first catalog run produced "All six
// options are therapeutic interventions" followed by "further assessment is the
// distractor" — a true rule discarding an option that is not on the page.
//
// Each entry names what the structure sentence must mention for the rule to
// bite. `sata` pins a rule to multi-answer items, where `null` means either.
// ---------------------------------------------------------------------------
export const APPLICABILITY = {
  "assess-first":                 { structure: /assess|monitor|check|evaluat|obtain|observ|auscultat|inspect|palpat/i, sata: null },
  "stem-defines-problem":         { structure: /assess|monitor|check|evaluat|obtain|observ|auscultat|inspect|palpat/i, sata: null },
  "independent-before-escalation":{ structure: /escalat|notify|prescriber|provider|physician|report|contact|inform/i, sata: null },
  "escalate-beyond-scope":        { structure: /escalat|notify|prescriber|provider|physician|report|contact|inform/i, sata: null },
  "abc":                          { structure: /airway|breath|oxygen|circulat|respirat|ventilat|perfus|suction/i, sata: null },
  "remove-the-hazard":            { structure: /stop|discontinu|remov|hold|withhold|halt|cease|disconnect/i, sata: null },
  "acute-over-chronic":           { structure: /finding|assess|data|change|symptom|manifest|report|complain/i, sata: null },
  "unexpected-over-expected":     { structure: /finding|assess|data|symptom|manifest|result|value|report/i, sata: null },
  "least-invasive-first":         { structure: /invasive|catheter|tube|line|restrain|medicat|pharmacolog|surgic/i, sata: null },
  "sequence-not-choice":          { structure: /order|sequence|step|first|then|before|after/i, sata: null },
  "timing":                       { structure: /timing|time|when|hour|day|week|interval|schedul|frequency/i, sata: null },
  "delegation-scope":             { structure: /delegat|assistive|UAP|LPN|LVN|technician|assign|unlicensed/i, sata: null },
  "stay-with-the-feeling":        { structure: /statement|respons|say|said|communicat|therapeutic|reply|remark/i, sata: null },
  "judge-each-option":            { structure: null, sata: true },
  "polarity":                     { structure: /statement|teach|understand|education|indicat|says|verbaliz/i, sata: null },
  "monitor-what-is-threatened":   { structure: /assess|monitor|evaluat|observ|measur/i, sata: null },
  "treat-the-patient":            { structure: /monitor|alarm|reading|device|number|value|equipment|machine|waveform/i, sata: null },
  "maslow":                       { structure: /physiolog|psychosocial|emotional|anxiet|comfort|pain|support|reassur/i, sata: null },
};

/**
 * @returns {string|null} why this principle cannot resolve this structure, or
 *   null when it applies.
 */
export function applicabilityProblem(principleId, structure, isSata) {
  const rule = APPLICABILITY[principleId];
  if (!rule) return `no applicability entry for "${principleId}"`;
  if (rule.sata === true && !isSata) return `${principleId} applies only to select-all items`;
  if (rule.sata === false && isSata) return `${principleId} does not apply to select-all items`;

  // A structure sentence must say what IS on the page. Told that a rule needed
  // the word "assessment", the model produced "All four options are
  // interventions; there is no assessment option presented" — satisfying the
  // keyword by denying the very option the rule then discards. Negated spans
  // are removed before the check so the keyword cannot be supplied that way.
  const asserted = structure.replace(/(no|none|not|without|rather than|instead of|absent)[^,;.]*/gi, " ");
  if (rule.structure && !rule.structure.test(asserted)) {
    return `${principleId} needs the structure to involve ${rule.structure.source.split("|").slice(0, 3).join("/")}`;
  }
  return null;
}
