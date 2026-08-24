#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Gated rewrite of weak distractors.
//
//   node scripts/rewrite-weak-distractors.mjs --limit 10          # stage only
//   node scripts/rewrite-weak-distractors.mjs --review            # print staged
//   node scripts/rewrite-weak-distractors.mjs --apply             # write to D1
//
// This edits the thing a question ASKS, not the text explaining it. A weak
// rationale on a correct question is a poor study experience; a wrong answer
// key teaches a nursing student the wrong intervention and marks them correct
// for it. Those are not the same error, so they do not get the same tolerance.
//
// FIVE STRUCTURAL GUARANTEES
//
//  1. `answer` is never written. Not updated, not reordered, not touched.
//  2. Option ids, their count, and their order are frozen. Options are replaced
//     BY ID, so nothing downstream that keys off an id can desynchronise —
//     grading, whyWrong keys, and the error-pattern classifier all do.
//  3. The correct option's MEANING may not change. Only its wording may tighten.
//  4. The writer must re-declare which option is correct after its own rewrite.
//     Disagreement with the stored key means the rewrite moved the answer, and
//     the item is rejected rather than repaired.
//  5. A second, independent pass answers the rewritten question cold, with no
//     sight of the key or of the first pass. Disagreement quarantines the item.
//
// Nothing reaches production without --apply, and --apply refuses anything that
// did not clear all five.
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { complete, mapConcurrent, parseJsonLoose } from "./lib/llm.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const LOCAL_WRANGLER = resolve(ROOT, "node_modules/wrangler/bin/wrangler.js");
const WRANGLER = existsSync(LOCAL_WRANGLER) ? LOCAL_WRANGLER : "wrangler";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const LIMIT = Number(flag("limit", "10"));
const CONCURRENCY = Number(flag("concurrency", "6"));
const REVIEW = args.includes("--review");
const APPLY = args.includes("--apply");

const STAGING = resolve(ROOT, "packages/content/staging/distractor-rewrites.jsonl");
const APPLIED = resolve(ROOT, "reports/distractor-rewrites-applied.jsonl");

// ─── D1 ──────────────────────────────────────────────────────────────────────
const SQL_INLINE_LIMIT = 6_000;   // Windows caps a command line near 32KB

function d1(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN;
  delete env.CLOUDFLARE_ACCOUNT_ID;
  const flat = sql.replace(/\s+/g, " ").trim();
  let tmp = null;
  const cmd = ["d1", "execute", "chapai-prod", "--remote", "--json"];
  if (flat.length > SQL_INLINE_LIMIT) {
    tmp = resolve(tmpdir(), `d1-${randomUUID()}.sql`);
    writeFileSync(tmp, flat, "utf8");
    cmd.push("--file", tmp);
  } else {
    cmd.push("--command", flat);
  }
  try {
    const raw = execFileSync(process.execPath, [WRANGLER, ...cmd],
      { cwd: resolve(ROOT, "apps/web"), env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    return JSON.parse(raw.slice(raw.indexOf("[")))[0];
  } finally {
    if (tmp) { try { unlinkSync(tmp); } catch {} }
  }
}

const esc = (v) => String(v).replace(/'/g, "''");
const safeJson = (v, fb) => { try { return JSON.parse(v) ?? fb; } catch { return fb; } };

// ─── eligibility ─────────────────────────────────────────────────────────────
//
// Items whose options are BARE VALUES are excluded outright: numbers ("4080 mL"),
// labels ("Patient B"), single words. The correct option's wording is frozen by
// design, so on those items rewriting only the distractors leaves the key as the
// one short bare option — a formatting tell that lets a test-wise student pick it
// without doing the clinical work. That makes the item EASIER while looking
// improved, which is worse than leaving it alone.
const BARE_VALUE = /^(?:[\d.,]+\s*\S{0,12}|patient\s+\w+|option\s+\w+|[a-z]+)$/i;

function wordCount(text) {
  return String(text ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function isEligible(options) {
  // Every option must already be a full clinical statement, so rewriting the
  // distractors cannot change the SHAPE of the option set.
  return options.every((o) => wordCount(o.text) >= 6 && !BARE_VALUE.test(String(o.text).trim()));
}

// ─── similarity + specificity gates ─────────────────────────────────────────
//
// Two failure modes the verifier cannot see, because it answers with clinical
// knowledge rather than comparing the options to each other:
//
//   too SIMILAR   a near-paraphrase of the key leaves two defensible answers
//   too SPECIFIC  detail the key does not carry marks the option as invented
const stopWords = new Set(["the","a","an","and","or","of","to","for","with","in","on","at","is","be","as","by","that","this","it","its","then","than","from","patient","client","nurse"]);

function contentTokens(text) {
  return new Set(String(text ?? "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w)));
}

function overlap(a, b) {
  const A = contentTokens(a); const B = contentTokens(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared += 1;
  return shared / new Set([...A, ...B]).size;
}

const TOO_SIMILAR = 0.5;

function contentProblems(after, correctIds) {
  const key = after.find((o) => correctIds.includes(o.id));
  const others = after.filter((o) => !correctIds.includes(o.id));
  const problems = [];
  const keyHasNumbers = /\d/.test(String(key?.text ?? ""));
  const keyWords = wordCount(key?.text);

  for (const o of others) {
    const sim = overlap(o.text, key?.text);
    if (sim > TOO_SIMILAR) {
      problems.push(`"${o.id}" is a near-paraphrase of the key (${Math.round(sim * 100)}% overlap)`);
    }
    if (!keyHasNumbers && /\b\d/.test(String(o.text))) {
      problems.push(`"${o.id}" adds numeric detail the key does not carry`);
    }
    if (wordCount(o.text) > keyWords * 1.6 + 3) {
      problems.push(`"${o.id}" is far more specific than the key (${wordCount(o.text)} vs ${keyWords} words)`);
    }
  }
  // Two distractors saying the same thing collapse into one idea.
  for (let i = 0; i < others.length; i += 1) {
    for (let j = i + 1; j < others.length; j += 1) {
      if (overlap(others[i].text, others[j].text) > 0.62) {
        problems.push(`"${others[i].id}" and "${others[j].id}" are the same idea`);
      }
    }
  }
  return problems;
}

// ─── parallelism gate ────────────────────────────────────────────────────────
//
// The verifier cannot catch this: it answers with clinical knowledge, not by
// scanning for format tells. So the shape of the option set is checked
// separately. If the frozen key ends up a visible length outlier against the
// rewritten distractors, the set now advertises its own answer.
function parallelismProblems(after, correctIds) {
  const key = after.find((o) => correctIds.includes(o.id));
  const others = after.filter((o) => !correctIds.includes(o.id));
  if (!key || !others.length) return ["cannot locate key for parallelism check"];
  const keyWords = wordCount(key.text);
  const lengths = others.map((o) => wordCount(o.text));
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  const problems = [];
  // Tolerances are deliberately loose: this is catching a giveaway, not
  // enforcing uniform prose.
  if (keyWords < min * 0.6) problems.push(`key is far shorter than every distractor (${keyWords} vs min ${min})`);
  if (keyWords > max * 1.7) problems.push(`key is far longer than every distractor (${keyWords} vs max ${max})`);
  // A key that is the ONLY option without a trailing justification clause reads
  // as the odd one out just as loudly as a length difference does.
  const hasClause = (t) => /,\s*(because|due to|as|since|which)\b/i.test(String(t));
  if (!hasClause(key.text) && others.every((o) => hasClause(o.text))) {
    problems.push("every distractor gained a justification clause but the key has none");
  }
  return problems;
}

// ─── pass 1: rewrite ─────────────────────────────────────────────────────────
const WRITER_SYSTEM = `You are an NCLEX-RN item writer. You produce ONLY valid minified JSON.
No prose, no markdown, no code fences.`;

// The distractor taxonomy.
//
// A real NCLEX distractor is not merely "wrong" — it is wrong for a NAMED
// reason, and the item discriminates on exactly one principle. Telling a model
// to write something "plausible" produces the two failures seen in the first
// tranches: near-paraphrases of the key (two defensible answers) and
// over-specified inventions (detail the key does not carry, which reads as
// constructed). Assigning each distractor a DISTINCT error type from a fixed
// list removes that freedom.
const ERROR_TYPES = [
  { id: "timing", rule: "Correct nursing action, but done at the WRONG TIME — appropriate later in the sequence, not first." },
  { id: "priority", rule: "Genuinely true and appropriate, but NOT the priority under ABC / Maslow / safety for this stem." },
  { id: "wrong-condition", rule: "Correct management for a DIFFERENT and commonly confused diagnosis than the one presented." },
  { id: "scope", rule: "Requires a provider order or exceeds independent nursing scope, so the nurse cannot do it first." },
  { id: "misconception", rule: "A widely held student MISCONCEPTION or outdated practice that sounds authoritative." },
  { id: "assess-vs-act", rule: "Gathers more data when the stem already justifies acting (or acts when assessment is still required)." },
];

function writerPrompt(row, options, correctIds) {
  const key = options.find((o) => correctIds.includes(o.id));
  const wrong = options.filter((o) => !correctIds.includes(o.id));
  // One distinct type per distractor. If two distractors share a reason they
  // collapse into the same idea and the item stops discriminating.
  const assigned = wrong.map((o, i) => ({ id: o.id, type: ERROR_TYPES[i % ERROR_TYPES.length] }));
  const keyWords = wordCount(key?.text);
  const keyHasNumbers = /\d/.test(String(key?.text ?? ""));

  return `Rewrite the DISTRACTORS on this NCLEX-RN item so they match the style of
the real exam.

STEM: ${row.stem}

CORRECT ANSWER (id ${key?.id}) — do not change it, and do not paraphrase it:
  ${key?.text}

Rewrite each of these, and give each the error type assigned to it:
${assigned.map((a) => `  ${a.id}  [${a.type.id}] ${a.type.rule}`).join("\n")}

HOW A REAL NCLEX DISTRACTOR BEHAVES
  - It is the SAME KIND of statement as the correct answer and roughly the same
    length. The correct answer here is about ${keyWords} words. Stay within a few
    words of that. A distractor that is noticeably longer or more detailed than
    the key tells the student which one was written last.
  - It is defensible ONLY until the student applies the single discriminating
    principle. It must not remain arguable afterwards.
  - It does NOT restate the correct answer in other words. If a knowledgeable
    nurse could defend it as also correct, it is unusable.
  - ${keyHasNumbers ? "The key contains numbers, so numeric detail is fine." : "The key carries NO numbers, doses or times — do not add any to the distractors."}
  - No absolutes (always, never, all, none, prove), no joke answers, no options
    that are wrong only because they are absurd.

Return JSON:
{
  \"options\": { \"<id>\": \"<new text>\" },
  \"errorTypes\": { \"<id>\": \"<the assigned type id>\" },
  \"whyEachWrong\": { \"<id>\": \"<the one principle that rules it out here>\" },
  \"correctId\": \"<the id still correct after your rewrite>\"
}

If you cannot write a distractor that is both tempting AND clearly ruled out by
its assigned principle, return that id unchanged rather than forcing it.`;
}
// ─── pass 2: independent verifier ────────────────────────────────────────────
// Sees the rewritten item cold. No key, no rationale, no sight of pass 1's
// reasoning. If a competent reader cannot land on the stored answer, the item
// is no longer sound regardless of how good the distractors look.
const VERIFIER_SYSTEM = `You are an experienced NCLEX-RN candidate answering a question.
You produce ONLY valid minified JSON. No prose, no markdown, no code fences.`;

function verifierPrompt(stem, options) {
  return `Answer this NCLEX-RN question.

${stem}

${options.map((o) => `  ${o.id}: ${o.text}`).join("\n")}

Return JSON: {"answer":"<id>","confidence":"high"|"medium"|"low","runnerUp":"<id>"}
Pick exactly one id for "answer". "runnerUp" is the option you considered next.`;
}

function gateRewrite(payload, options, correctIds) {
  const problems = [];
  if (!payload || typeof payload !== "object") return ["no usable JSON"];
  const rewritten = payload.options;
  if (!rewritten || typeof rewritten !== "object" || Array.isArray(rewritten)) return ["options missing"];

  const ids = options.map((o) => o.id);
  for (const id of Object.keys(rewritten)) {
    if (!ids.includes(id)) problems.push(`unknown option id "${id}"`);
    // Guarantee 3: the key's meaning is not the model's to change.
    if (correctIds.includes(id)) problems.push(`tried to rewrite the correct option "${id}"`);
    const text = rewritten[id];
    if (typeof text !== "string" || text.trim().split(/\s+/).length < 4) problems.push(`option "${id}" too short`);
    if (/\b(always|never|prove[sn]?|all patients|no patient)\b/i.test(String(text))) {
      problems.push(`option "${id}" uses an absolute`);
    }
  }
  // Guarantee 4: the writer must still agree with the stored key.
  if (correctIds.length === 1 && payload.correctId !== correctIds[0]) {
    problems.push(`writer moved the answer to "${payload.correctId}" (stored key is "${correctIds[0]}")`);
  }
  return problems;
}

// ─── main ────────────────────────────────────────────────────────────────────
(async () => {
  mkdirSync(dirname(STAGING), { recursive: true });
  mkdirSync(dirname(APPLIED), { recursive: true });

  if (REVIEW) {
    const rows = readFileSync(STAGING, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
    for (const r of rows) {
      console.log("=".repeat(78));
      console.log(`${r.id}   [${r.verdict}]`);
      console.log(`STEM: ${r.stem}\n`);
      for (const o of r.before) {
        const after = r.after.find((x) => x.id === o.id);
        const mark = r.correctIds.includes(o.id) ? " *KEY*" : "";
        console.log(`  ${o.id}${mark}`);
        console.log(`    before: ${o.text}`);
        if (after && after.text !== o.text) console.log(`    AFTER : ${after.text}`);
        else console.log(`    (unchanged)`);
      }
      console.log(`\n  verifier answered: ${r.verifier?.answer} (${r.verifier?.confidence}), runner-up ${r.verifier?.runnerUp}`);
      console.log("");
    }
    console.log(`${rows.length} staged. Nothing has been written to production.`);
    return;
  }

  if (APPLY) {
    const rows = readFileSync(STAGING, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const ok = rows.filter((r) => r.verdict === "pass");
    console.log(`staged ${rows.length}, eligible ${ok.length}`);
    if (!ok.length) return;
    for (const r of ok) {
      // Options replaced BY ID, order preserved, `answer` never in the statement.
      d1(`UPDATE questions SET options = '${esc(JSON.stringify(r.after))}'
          WHERE id = '${esc(r.id)}' AND type IN ('mcq','sata')`);
      appendFileSync(APPLIED, `${JSON.stringify({ id: r.id, before: r.before, at: new Date().toISOString() })}\n`);
    }
    console.log(`applied ${ok.length}. Revert manifest: ${APPLIED}`);
    return;
  }

  const done = new Set(
    existsSync(STAGING)
      ? readFileSync(STAGING, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).id)
      : [],
  );

  // NOT ordered by shortest options any more. That is what surfaced the
  // numeric and 'Patient A' items in the first tranche — exactly the set this
  // pass must not touch. Candidates are drawn from items whose options are
  // already prose, then isEligible() filters what SQL cannot see.
  const candidates = d1(`
    SELECT id, stem, options, answer, difficulty
    FROM questions
    WHERE publish_state = 'published' AND type = 'mcq'
      AND length(options) BETWEEN 420 AND 2200
    ORDER BY id
    LIMIT ${(LIMIT + done.size + 60) * 4}
  `)?.results ?? [];

  let ineligible = 0;
  const rows = candidates.filter((r) => {
    if (done.has(r.id)) return false;
    const opts = safeJson(r.options, []);
    if (!isEligible(opts)) { ineligible += 1; return false; }
    return true;
  }).slice(0, LIMIT);
  console.log(`skipped ${ineligible} candidates whose options are bare values`);

  console.log(`Staging ${rows.length} candidates (nothing is written to production)\n`);

  const staged = await mapConcurrent(rows, CONCURRENCY, async (row) => {
    const options = safeJson(row.options, []);
    const answer = safeJson(row.answer, row.answer);
    const correctIds = (Array.isArray(answer) ? answer : [answer]).filter((v) => typeof v === "string");
    if (options.length < 3 || correctIds.length !== 1 || !options.some((o) => o.id === correctIds[0])) {
      return { id: row.id, verdict: "skipped", reason: "malformed or multi-key" };
    }

    // Every gate runs INSIDE the retry loop. Running the shape and content
    // checks after it meant a near-paraphrase failed the item outright, when the
    // model can almost always fix that objection if it is simply told about it.
    // Pass rate went from 40% to well above it on the same standard.
    let payload = null, after = null, problems = ["not attempted"];
    for (let attempt = 1; attempt <= 4 && problems.length; attempt += 1) {
      try {
        const messages = [
          { role: "system", content: WRITER_SYSTEM },
          { role: "user", content: writerPrompt(row, options, correctIds) },
        ];
        if (problems[0] !== "not attempted" && payload) {
          messages.push({ role: "assistant", content: JSON.stringify(payload) });
          messages.push({ role: "user", content: `These were rejected: ${problems.join("; ")}. Fix ONLY those and return corrected JSON. Keep every other option as you wrote it.` });
        }
        // Temperature climbs slightly per attempt: a second identical sample is
        // rejected for the same reason.
        const { text } = await complete(messages, { temperature: 0.45 + attempt * 0.08, maxTokens: 1200 });
        payload = parseJsonLoose(text);
        problems = gateRewrite(payload, options, correctIds);
        if (!problems.length) {
          after = options.map((o) => ({ ...o, text: payload.options[o.id] ?? o.text }));
          problems = [...parallelismProblems(after, correctIds), ...contentProblems(after, correctIds)];
        }
      } catch (error) { problems = [`writer failed: ${error.message}`]; }
    }
    if (problems.length || !after) {
      return { id: row.id, verdict: "rejected", reason: problems.slice(0, 2).join("; "), stem: row.stem, correctIds, before: options, after: after ?? options };
    }

    let verifier = null;
    try {
      const { text } = await complete(
        [{ role: "system", content: VERIFIER_SYSTEM }, { role: "user", content: verifierPrompt(row.stem, after) }],
        { temperature: 0.1, maxTokens: 200 },
      );
      verifier = parseJsonLoose(text);
    } catch { /* treated as a failed verification below */ }

    const verdict = verifier?.answer === correctIds[0] ? "pass" : "quarantined";
    return {
      id: row.id, verdict, stem: row.stem, difficulty: row.difficulty,
      correctIds, before: options, after, verifier,
      errorTypes: payload.errorTypes ?? null, whyEachWrong: payload.whyEachWrong ?? null,
      reason: verdict === "pass" ? null : `verifier chose "${verifier?.answer ?? "none"}", key is "${correctIds[0]}"`,
    };
  });

  for (const item of staged) appendFileSync(STAGING, `${JSON.stringify(item)}\n`);
  const tally = staged.reduce((acc, s) => ({ ...acc, [s.verdict]: (acc[s.verdict] ?? 0) + 1 }), {});
  console.log(Object.entries(tally).map(([k, v]) => `${k}: ${v}`).join("   "));
  console.log(`\nStaged to ${STAGING}`);
  console.log("Nothing written to production. Review with --review, then --apply.");
})();
