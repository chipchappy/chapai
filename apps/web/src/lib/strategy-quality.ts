/**
 * Render-time soundness check for a question's test-taking strategy note.
 *
 * The first strategy backfill let the model invent the PRINCIPLE in the second
 * sentence, and an audit of the 3,382 rows it wrote found 44% unsound —
 * including 353 that inverted the escalation rule ("escalation is usually the
 * correct choice"). A student who memorises that will pick the distractor, so a
 * wrong transferable rule is strictly worse than showing nothing.
 *
 * The data fix is a regeneration against a fixed catalog of validated
 * principles. This gate is what stands between the bad rows and a student while
 * that runs, and it stays afterwards as a backstop: a note that cannot be shown
 * to be sound is not shown at all.
 *
 * Mirrored by scripts/lib/strategy-gate.mjs, which gates on write.
 */

// No trailing \b on truncated stems: /escalat\b/ cannot match "escalation".
const PRINCIPLE =
  /(ABC|airway|breathing|circulat|Maslow|safety|safe|assess|escalat|independent|sequence|timing|priorit|scope|stabiliz|least invasive|first|before|delegat|invasive|reversible|life.?threat|acute|onset|trend|baseline|expected|abnormal)/i;

/** "The correct answer is the correct one" — restates the task, teaches nothing. */
const CIRCULAR =
  /(the correct (answer|choice|option)s? (is|are)|correct answers? are the|identified by matching|match(ing)? the stem|select all (that are )?(correct|appropriate|evidence)|lacking strong guideline|choose the (correct|right|best) (one|answer)|the (answer|key) is the option)/i;

/**
 * Canonical NCLEX: an independent nursing action generally precedes notifying
 * the prescriber unless the stem establishes something the nurse cannot resolve.
 * A note asserting the reverse as a general rule is actively harmful.
 */
const WRONG_ESCALATION =
  /(escalat\w*|notify\w*|contact\w*|inform\w*|prescriber|provider)[^.]{0,80}?\b(is|are|becomes|remains)\s+(usually|typically|generally|often|always)?\s*(the\s+)?(correct|right|best|priority|safest)(\s+(choice|option|answer|response|action|selection))?\b/i;

/** "Calling the provider supersedes the independent action" — same inversion, stated as rank. */
const ESCALATION_OUTRANKS =
  /(escalat\w*|notify\w*|contact\w*|inform\w*|prescriber|provider)[^.]{0,80}\b(supersedes|takes precedence over|overrides|outranks)\b/i;

const CATEGORY =
  /(assess\w*|intervene|intervention|escalat\w*|independent|educat\w*|document\w*|delegat\w*|monitor\w*|medicat\w*|pharmacolog\w*|timing|sequence|position\w*|notify\w*|prevent\w*|protect\w*)/gi;

const sentences = (text: string): string[] =>
  text.split(/(?<=[.!?])\s+/).filter((part) => part.trim().length > 3);

/** True when sentence 2 never engages the option structure sentence 1 named. */
function driftsFromStructure(text: string): boolean {
  const parts = sentences(text);
  if (parts.length < 2) return false;
  const categories = (s: string) =>
    new Set((s.match(CATEGORY) ?? []).map((word) => word.toLowerCase().slice(0, 6)));
  const named = categories(parts[0]);
  const used = categories(parts.slice(1).join(" "));
  if (!named.size || !used.size) return false;
  return ![...used].some((category) => named.has(category));
}

/** Reasons the note is unsound. Empty means it is safe to show. */
export function auditStrategy(value: string | undefined | null): string[] {
  const text = String(value ?? "").trim();
  if (!text) return ["empty"];
  const rule = sentences(text).slice(1).join(" ") || text;
  const problems: string[] = [];
  if (WRONG_ESCALATION.test(rule) || ESCALATION_OUTRANKS.test(rule))
    problems.push("inverted escalation advice");
  if (CIRCULAR.test(rule)) problems.push("circular — restates the task");
  if (!PRINCIPLE.test(rule)) problems.push("names no transferable principle");
  if (driftsFromStructure(text)) problems.push("rule does not engage the structure named");
  return problems;
}

/** The note if it can be shown to be sound, otherwise null. */
export function soundStrategy(value: string | undefined | null): string | null {
  const text = String(value ?? "").trim();
  return text && auditStrategy(text).length === 0 ? text : null;
}
