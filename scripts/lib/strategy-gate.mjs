// ---------------------------------------------------------------------------
// Quality gate for test-taking strategy notes.
//
// The first backfill let the model invent the PRINCIPLE in sentence 2, and a
// sample showed it inventing mutually contradictory ones: "escalation is
// usually the correct choice" alongside "the escalated choice is typically the
// distractor". A student who memorises the first will fail items. A wrong
// transferable rule is worse than no rule, so this gate is deliberately
// stricter than the one that produced those rows.
// ---------------------------------------------------------------------------

// NOTE: no trailing \b on truncated stems — `escalat\b` cannot match
// "escalation", which silently mis-flagged sound notes in the first audit.
export const PRINCIPLE =
  /(ABC|airway|breathing|circulat|Maslow|safety|safe|assess|escalat|independent|sequence|timing|priorit|scope|stabiliz|least invasive|first|before|delegat|invasive|reversible|life.?threat|acute|onset|trend|baseline|expected|abnormal)/i;

// "The correct answer is the one that is correct." Restates the task instead of
// naming a rule that survives contact with a different question.
export const CIRCULAR =
  /(the correct (answer|choice|option)s? (is|are)|correct answers? are the|identified by matching|match(ing)? the stem|select all (that are )?(correct|appropriate|evidence)|serves? as a distractor\b(?!.*\bwhen\b)|lacking strong guideline|choose the (correct|right|best) (one|answer)|the (answer|key) is the option)/i;

// Escalation advice inverted. Canonical NCLEX: an independent nursing action
// generally precedes notifying the prescriber unless the stem establishes an
// emergency the nurse cannot resolve. A note asserting the reverse as a GENERAL
// rule teaches a student to pick the distractor.
export const WRONG_ESCALATION =
  /(escalat\w*|notify\w*|contact\w*|inform\w*|prescriber|provider)[^.]{0,80}?\b(is|are|becomes|remains)\s+(usually|typically|generally|often|always)?\s*(the\s+)?(correct|right|best|priority|safest)(\s+(choice|option|answer|response|action|selection))?\b/i;

/** "Calling the provider supersedes the independent action" — same inversion, stated as rank. */
export const ESCALATION_OUTRANKS =
  /(escalat\w*|notify\w*|contact\w*|inform\w*|prescriber|provider)[^.]{0,80}\b(supersedes|takes precedence over|overrides|outranks)\b/i;

const CATEGORY =
  /(assess\w*|intervene|intervention|escalat\w*|independent|educat\w*|document\w*|delegat\w*|monitor\w*|medicat\w*|pharmacolog\w*|timing|sequence|position\w*|notify\w*|prevent\w*|protect\w*)/gi;

/** Sentence 2 must engage the structure sentence 1 named, not drift elsewhere. */
export function mismatch(text) {
  const parts = text.split(/(?<=[.!?])\s+/).filter((x) => x.trim().length > 3);
  if (parts.length < 2) return false;
  const cats = (s) => new Set((s.match(CATEGORY) ?? []).map((w) => w.toLowerCase().slice(0, 6)));
  const a = cats(parts[0]);
  const b = cats(parts.slice(1).join(" "));
  if (!a.size || !b.size) return false;
  for (const c of b) if (a.has(c)) return false;
  return true; // no shared category at all
}

/** @returns {string[]} reasons the note is unsound; empty means it passes. */
export function auditStrategy(text) {
  const s = String(text ?? "").trim();
  if (!s) return ["empty"];
  const parts = s.split(/(?<=[.!?])\s+/).filter((x) => x.trim().length > 3);
  const rule = parts.slice(1).join(" ") || s;
  const out = [];
  if (WRONG_ESCALATION.test(rule) || ESCALATION_OUTRANKS.test(rule))
    out.push("inverted escalation advice");
  if (CIRCULAR.test(rule)) out.push("circular — restates the task");
  if (!PRINCIPLE.test(rule)) out.push("names no transferable principle");
  if (mismatch(s)) out.push("rule does not engage the structure named");
  return out;
}
