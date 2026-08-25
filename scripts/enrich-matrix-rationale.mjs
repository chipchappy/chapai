#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Structured rationales for matrix and bow-tie items.
//
//   node scripts/enrich-matrix-rationale.mjs --dry-run --limit 3
//   node scripts/enrich-matrix-rationale.mjs --limit 300
//
// These are the only published types left without a structured rationale, and
// they are the ones that need it most: 252 matrix and 1 bow-tie item carrying a
// flat rationale averaging 232 characters, against 1,460 for the bank as a
// whole. They are also the newest NCLEX formats, so a student meeting one has
// the least prior exposure to fall back on.
//
// They were skipped because a matrix answer is keyed by ROW LABEL, not option
// id, so the whyWrong map has nothing to key on and
// getDisplayableDistractorRationales discards it. The per-row teaching
// therefore goes into whyCorrect, which renders for every type, and no
// whyWrong is written at all rather than writing a field that cannot be seen.
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { complete, mapConcurrent, parseJsonLoose } from "./lib/llm.mjs";
import { PRINCIPLES } from "./lib/nclex-principles.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const LOCAL_WRANGLER = resolve(ROOT, "node_modules/wrangler/bin/wrangler.js");
const WRANGLER = existsSync(LOCAL_WRANGLER) ? LOCAL_WRANGLER : "wrangler";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const LIMIT = Number(flag("limit", "10"));
const CONCURRENCY = Number(flag("concurrency", "8"));
const WRITE_BATCH = Number(flag("batch", "10"));
const DRY = args.includes("--dry-run");

const OUT_FILE = resolve(ROOT, "scripts/staging/matrix-rationale.jsonl");
const SQL_INLINE_LIMIT = 6_000;

function d1(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN; delete env.CLOUDFLARE_ACCOUNT_ID;
  const flat = sql.replace(/\s+/g, " ").trim();
  // A -- comment survives the flatten above as a comment on the ENTIRE
  // remaining query, which silently drops the WHERE clause and selects the
  // whole table. Ids such as "q001--matrix" are unaffected: a comment has
  // whitespace around it.
  // Quoted literals are stripped first: a rationale may legitimately contain
  // " -- ", and only a comment outside a string can swallow the query.
  if (/(^|\s)--\s/.test(flat.replace(/'(?:[^']|'')*'/g, "''"))) {
    throw new Error("SQL contains a -- comment, which flattening turns into a comment on the rest of the query. Move it outside the template literal.");
  }
  let tmp = null;
  const cmd = ["d1", "execute", "chapai-prod", "--remote", "--json"];
  if (flat.length > SQL_INLINE_LIMIT) {
    tmp = resolve(tmpdir(), `d1-${randomUUID()}.sql`);
    writeFileSync(tmp, flat, "utf8"); cmd.push("--file", tmp);
  } else cmd.push("--command", flat);
  try {
    let last;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        const raw = execFileSync(process.execPath, [WRANGLER, ...cmd],
          { cwd: resolve(ROOT, "apps/web"), env, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
        return JSON.parse(raw.slice(raw.indexOf("[")))[0];
      } catch (error) {
        last = error;
        const text = `${error?.stdout ?? ""}${error?.message ?? ""}`;
        // 7403 is the lazily-refreshed OAuth token; 7500 is a transient D1
        // internal error that shows up under concurrent load.
        if (!/7403|7500|Authentication|fetch failed/.test(text) || attempt === 5) break;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, [3_000, 8_000, 20_000, 40_000][attempt - 1]);
      }
    }
    throw last;
  } finally { if (tmp) { try { unlinkSync(tmp); } catch {} } }
}

const esc = (v) => String(v).replace(/'/g, "''");
const safeJson = (v, fb) => { try { return JSON.parse(v) ?? fb; } catch { return fb; } };

const SYSTEM = `You write NCLEX-RN rationales for next-generation item formats.
You produce ONLY valid minified JSON. No prose, no markdown, no code fences.`;

/** Row label -> assigned column, for whichever NGN shape this row uses. */
function extractRows(row) {
  // Ordering items store the sequence as "c,f,d,e,g,b,a" against lettered
  // options, so the rows are positions and the teaching is why each step has
  // to precede the next.
  if (row.type === "ordering") {
    const order = String(row.answer ?? "").split(",").map((part) => part.trim()).filter(Boolean);
    const byId = new Map(safeJson(row.options, []).map((option) => [option.id, option.text]));
    return Object.fromEntries(order.map((id, index) => [`Step ${index + 1}`, byId.get(id) ?? id]));
  }

  const answer = safeJson(row.answer, null);
  if (answer && typeof answer === "object" && !Array.isArray(answer)) {
    // Bow-tie stores slots rather than a row map.
    if ("center" in answer || "leftActions" in answer || "rightMonitoring" in answer) {
      const out = {};
      if (answer.center) out["Central condition"] = String(answer.center);
      for (const [i, v] of (answer.leftActions ?? []).entries()) out[`Action ${i + 1}`] = String(v);
      for (const [i, v] of (answer.rightMonitoring ?? []).entries()) out[`Parameter to monitor ${i + 1}`] = String(v);
      return out;
    }
    return Object.fromEntries(Object.entries(answer).map(([k, v]) => [k, String(v)]));
  }
  return {};
}

function buildPrompt(row, rows, columns) {
  const rowLines = Object.entries(rows).map(([label, value]) => `  "${label}" -> ${value}`).join("\n");
  return `Write the rationale for this NCLEX-RN ${row.type} item.

STEM: ${row.stem}
${columns.length ? `\nCOLUMN CHOICES: ${columns.join(" | ")}` : ""}

${row.type === "ordering" ? "THE CORRECT SEQUENCE:" : "CORRECT CLASSIFICATION OF EACH ROW:"}
${rowLines}

EXISTING SHORT RATIONALE (replace it with something far deeper, do not quote it):
${row.rationale ?? "(none)"}

Return JSON with exactly these keys:

  "overview"   — 2 to 3 sentences. What the item is really testing and what in
                 the stem drives every row's classification. Name the clinical
                 pattern, not the format.

  "mechanism"  — 3 to 5 sentences on the underlying physiology or pharmacology
                 that makes that pattern behave the way it does. This is the
                 part a student can carry to a different item.

  "whyCorrect" — walk EVERY row above, in order. ${row.type === "ordering"
    ? "For each step, say why it\n                 must come after the one before it and what goes wrong if a student\n                 moves it earlier or later."
    : "For each one, say why it lands\n                 in the column it does AND what would tempt a student toward the\n                 other column."} Refer to each row by its wording so the student
                 can follow along. This is the longest field.
                 Start each row on its own line, as "<row wording> — <why>", and
                 separate rows with a single newline. Most students read this on
                 a phone, so an unbroken block of text is unusable.

RULES
  - Every row above must be discussed in "whyCorrect". Do not summarise or skip.
  - No "N/A", no "this is correct", no restating the option text alone.
  - Write for a nursing student sitting the exam in six weeks.
  - Total across the three fields: at least 900 characters.

Return JSON: {"overview":"...","mechanism":"...","whyCorrect":"..."}`;
}

const NON_TEACHING = /^(n\s*\/?\s*a|none|not applicable|no rationale)\b|this is (a )?correct/i;
const STOP = new Set(["the", "and", "for", "with", "that", "this", "from", "into", "your", "each", "does", "not", "align", "aligns", "client", "patient", "nurse", "should", "would", "next", "step", "response", "responses"]);

/** Distinctive words from a row label, used to check the row was discussed. */
function keyWords(label) {
  return String(label).toLowerCase().match(/[a-z]{4,}/g)?.filter((w) => !STOP.has(w)) ?? [];
}

function gate(payload, rows) {
  const problems = [];
  const overview = String(payload?.overview ?? "").trim();
  const mechanism = String(payload?.mechanism ?? "").trim();
  const whyCorrect = String(payload?.whyCorrect ?? "").trim();
  if (!overview) problems.push("no overview");
  if (!mechanism) problems.push("no mechanism");
  if (!whyCorrect) problems.push("no whyCorrect");
  if (problems.length) return problems;

  for (const [name, text] of [["overview", overview], ["mechanism", mechanism], ["whyCorrect", whyCorrect]]) {
    if (NON_TEACHING.test(text)) problems.push(`${name} is filler`);
  }
  const total = overview.length + mechanism.length + whyCorrect.length;
  if (total < 900) problems.push(`too thin (${total} chars, need 900)`);

  // Read on a phone, eight rows in one block is unreadable, so the row breaks
  // are part of the deliverable rather than cosmetic.
  const rowCount = Object.keys(rows).length;
  if (rowCount > 2) {
    const rowLines = whyCorrect.split(/\r?\n/).filter((line) => line.trim().length > 20);
    if (rowLines.length < rowCount - 1) {
      problems.push(`whyCorrect is one block; needs a line per row (${rowCount} rows)`);
    }
  }

  // The whole point of this pass is per-row teaching, so a row that is never
  // discussed is the one failure that must not slip through.
  const haystack = whyCorrect.toLowerCase();
  const missed = Object.keys(rows).filter((label) => {
    const words = keyWords(label);
    if (!words.length) return false;
    return !words.some((word) => haystack.includes(word));
  });
  if (missed.length) problems.push(`${missed.length} row(s) never discussed: ${missed.slice(0, 2).map((m) => `"${m.slice(0, 40)}"`).join(", ")}`);
  return problems;
}

(async () => {
  mkdirSync(dirname(OUT_FILE), { recursive: true });
  const done = new Set(
    existsSync(OUT_FILE)
      ? readFileSync(OUT_FILE, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).id)
      : [],
  );
  console.log(`Already processed locally: ${done.size}`);

  const rowsIn = d1(`
    SELECT id, type, stem, options, answer, rationale
    FROM questions
    WHERE publish_state = 'published' AND type IN ('matrix','bow_tie','ordering')
      AND (structured_rationale IS NULL OR structured_rationale = '')
    ORDER BY id
  `)?.results?.filter((r) => !done.has(r.id)).slice(0, LIMIT) ?? [];

  console.log(`Processing ${rowsIn.length}${DRY ? "  (dry run)" : ""}\n`);

  let accepted = 0, rejected = 0, skipped = 0;
  const pending = [];
  const providers = new Map();

  const produced = await mapConcurrent(rowsIn, CONCURRENCY, async (row) => {
    const rows = extractRows(row);
    if (!Object.keys(rows).length) return { row, skip: "no rows in answer" };
    const columns = safeJson(row.options, []).map((o) => o.text).filter(Boolean);

    let payload = null, problems = ["not attempted"];
    for (let attempt = 1; attempt <= 3 && problems.length; attempt += 1) {
      try {
        const messages = [
          { role: "system", content: SYSTEM },
          { role: "user", content: buildPrompt(row, rows, columns) },
        ];
        if (problems[0] !== "not attempted") {
          messages.push({ role: "assistant", content: JSON.stringify(payload ?? {}) });
          messages.push({ role: "user", content: `Rejected: ${problems.join("; ")}. Return corrected JSON only.` });
        }
        const { text, provider } = await complete(messages, { temperature: 0.4, maxTokens: 1800 });
        providers.set(provider, (providers.get(provider) ?? 0) + 1);
        payload = parseJsonLoose(text);
        problems = gate(payload, rows);
      } catch (error) { problems = [`request failed: ${error.message}`]; }
    }
    if (problems.length) return { row, problems };

    // Taking the rule text from the catalog keeps these notes identical in kind
    // to the rest of the bank: a matrix row is judged on its own against the
    // standard, while an ordering item is testing sequence rather than choice.
    const rowCount = Object.keys(rows).length;
    const [structure, principle] = row.type === "bow_tie"
      ? ["Each slot of the bow-tie is filled from the same set of findings.", "judge-each-option"]
      : row.type === "ordering"
        ? [`The same ${rowCount} steps appear in every option; only their order differs.`, "sequence-not-choice"]
        : [`All ${rowCount} rows are classified against the same standard.`, "judge-each-option"];

    return {
      row,
      merged: {
        overview: String(payload.overview).trim(),
        mechanism: String(payload.mechanism).trim(),
        whyCorrect: String(payload.whyCorrect).trim(),
        // Deliberately empty: this format has no option id to key against, and
        // a whyWrong written here would be filtered out before it reached the
        // page. The per-row teaching is in whyCorrect instead.
        whyWrong: {},
        citations: [],
        strategy: `${structure} ${PRINCIPLES[principle]}`,
      },
    };
  });

  for (const item of produced) {
    if (item.skip) { skipped += 1; continue; }
    if (!item.merged) { rejected += 1; console.log(`  x ${item.row.id} — ${item.problems.slice(0, 2).join("; ")}`); continue; }
    accepted += 1;
    if (DRY) {
      console.log(`  ${item.row.id}  (${item.row.type})`);
      console.log(`    OVERVIEW   ${item.merged.overview}`);
      console.log(`    MECHANISM  ${item.merged.mechanism}`);
      console.log(`    WHY        ${item.merged.whyCorrect}`);
      console.log(`    STRATEGY   ${item.merged.strategy}\n`);
    } else {
      pending.push({ id: item.row.id, payload: JSON.stringify(item.merged) });
    }
  }

  for (let i = 0; i < pending.length; i += WRITE_BATCH) {
    const slice = pending.slice(i, i + WRITE_BATCH);
    const cases = slice.map((r) => `WHEN '${esc(r.id)}' THEN '${esc(r.payload)}'`).join(" ");
    const ids = slice.map((r) => `'${esc(r.id)}'`).join(",");
    // The NULL guard keeps a re-run idempotent and stops two overlapping runs
    // from overwriting each other.
    d1(`UPDATE questions SET structured_rationale = CASE id ${cases} END
        WHERE id IN (${ids}) AND (structured_rationale IS NULL OR structured_rationale = '')`);
    for (const r of slice) appendFileSync(OUT_FILE, `${JSON.stringify({ id: r.id, at: new Date().toISOString() })}\n`);
    process.stdout.write(`\r  written ${Math.min(i + WRITE_BATCH, pending.length)}/${pending.length}`);
  }
  if (pending.length) process.stdout.write("\n");

  console.log(`providers: ${[...providers].map(([k, v]) => `${k}=${v}`).join(" ") || "none"}`);
  console.log(`\naccepted ${accepted}   rejected ${rejected}   skipped ${skipped}`);
})();
